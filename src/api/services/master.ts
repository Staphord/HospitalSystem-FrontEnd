import { apiClient } from '@/api/client'
import type {
  Invoice,
  MasterAdminUser,
  MasterAdminUserCreate,
  MasterAdminUserUpdate,
  Subscription,
  Tenant,
  TenantCreate,
  SubscriptionPlan,
} from '@/api/types/master'

export interface InvoiceCreate {
  tenant_id: string
  subscription_id: string
  invoice_number?: string
  plan_name: string
  billing_period_start: string
  billing_period_end: string
  currency: string
  amount: number
  due_date: string
  status: string
  description: string
}

function normalizeTenant(data: Tenant): Tenant {
  const raw = data as unknown as Record<string, unknown>
  return {
    ...data,
    hospital_name: data.hospital_name || data.name || data.tenant_id,
    contact_name: data.contact_name || (raw.primary_contact_name as string | undefined),
    contact_email: data.contact_email || (raw.primary_contact_email as string | undefined),
    contact_phone: data.contact_phone || (raw.primary_contact_phone as string | undefined),
  }
}

function normalizeTenants(data: Tenant[]): Tenant[] {
  return Array.isArray(data) ? data.map(normalizeTenant) : []
}

const mapPlanIdToName = (planIdOrName: string): string => {
  const mapping: Record<string, string> = {
    '11111111-1111-1111-1111-111111111111': 'free_trial',
    '22222222-2222-2222-2222-222222222222': 'basic',
    '33333333-3333-3333-3333-333333333333': 'standard',
    '44444444-4444-4444-4444-444444444444': 'premium',
    '55555555-5555-5555-5555-555555555555': 'enterprise',
  }
  return mapping[planIdOrName] || planIdOrName
}

// All paths proxied via api-gateway → master-service
export const masterService = {
  listTenants: () =>
    apiClient.get<Tenant[]>('/tenants').then((r) => normalizeTenants(r.data)),

  getTenant: (tenantId: string) =>
    apiClient.get<Tenant>(`/tenants/${tenantId}`).then((r) => normalizeTenant(r.data)),

  getTenantStats: (tenantId: string) =>
    apiClient.get<unknown>(`/tenants/${tenantId}/stats`).then((r) => r.data),

  createTenant: (data: TenantCreate) =>
    apiClient.post<Tenant>('/tenants', data).then((r) => normalizeTenant(r.data)),

  updateTenant: (tenantId: string, data: Partial<Tenant>) =>
    apiClient.patch<Tenant>(`/tenants/${tenantId}`, data).then((r) => normalizeTenant(r.data)),

  listSubscriptions: (tenantId?: string) =>
    apiClient
      .get<Subscription[]>('/subscriptions', { params: { tenant_id: tenantId } })
      .then((r) => r.data),

  updateSubscription: (subscriptionId: string, data: Partial<Subscription>) =>
    apiClient
      .patch<Subscription>(`/subscriptions/${subscriptionId}`, data)
      .then((r) => r.data),

  subscribeTenant: (tenantId: string, data: { plan: string; billing_cycle?: string; start_trial?: boolean; payment_provider_id?: string }) =>
    apiClient
      .post<unknown>(`/tenants/${tenantId}/subscribe`, data)
      .then((r) => r.data),

  upgradeTenantSubscription: (tenantId: string, data: { plan: string; billing_cycle?: string }) =>
    apiClient
      .post<unknown>(`/tenants/${tenantId}/upgrade`, data)
      .then((r) => r.data),

  downgradeTenantSubscription: (tenantId: string, data: { plan: string; billing_cycle?: string; effective_at_end?: boolean }) =>
    apiClient
      .post<unknown>(`/tenants/${tenantId}/downgrade`, data)
      .then((r) => r.data),

  upgradeSubscriptionEndpoint: (tenantId: string, data: { plan_id: string; billing_cycle?: string }) =>
    apiClient
      .post<unknown>(`/tenants/${tenantId}/upgrade`, {
        plan: mapPlanIdToName(data.plan_id),
        billing_cycle: data.billing_cycle || 'monthly'
      })
      .then((r) => r.data),

  downgradeSubscriptionEndpoint: (tenantId: string, data: { plan_id: string; billing_cycle?: string; effective_at_end?: boolean }) =>
    apiClient
      .post<unknown>(`/tenants/${tenantId}/downgrade`, {
        plan: mapPlanIdToName(data.plan_id),
        billing_cycle: data.billing_cycle || 'monthly',
        effective_at_end: data.effective_at_end || false
      })
      .then((r) => r.data),

  listInvoices: (tenantId?: string) =>
    apiClient
      .get<Invoice[]>('/invoices', { params: { tenant_id: tenantId } })
      .then((r) => r.data),

  createInvoice: (data: InvoiceCreate) =>
    apiClient.post<Invoice>(`/tenants/${data.tenant_id}/invoices`, data).then((r) => r.data),

  updateInvoice: (invoiceId: string, data: Partial<Invoice> & { payment_method?: string }) =>
    apiClient.patch<Invoice>(`/invoices/${invoiceId}`, data).then((r) => r.data),

  listMasterAdmins: () =>
    apiClient.get<MasterAdminUser[]>('/superadmin/users').then((r) => r.data),

  createMasterAdmin: (data: MasterAdminUserCreate) =>
    apiClient.post<MasterAdminUser>('/superadmin/users', data).then((r) => r.data),

  deleteMasterAdmin: (username: string) =>
    apiClient.delete(`/superadmin/users`, { data: { username } }),

  updateMasterAdmin: (userId: string, data: MasterAdminUserUpdate) =>
    apiClient.patch<MasterAdminUser>(`/superadmin/users/${userId}`, data).then((r) => r.data),

  listPlans: () =>
    apiClient.get<SubscriptionPlan[]>('/superadmin/subscription-plans').then((r) => r.data),

  getPlan: (planId: string) =>
    apiClient.get<SubscriptionPlan>(`/superadmin/plans/${planId}`).then((r) => r.data),

  createPlan: (data: Partial<SubscriptionPlan>) =>
    apiClient.post<SubscriptionPlan>('/superadmin/plans', data).then((r) => r.data),

  updatePlan: (planId: string, data: Partial<SubscriptionPlan>) =>
    apiClient.patch<SubscriptionPlan>(`/superadmin/plans/${planId}`, data).then((r) => r.data),

  getRevenueHistory: () =>
    apiClient.get<{ months: string[]; revenue: number[] }>('/finance/revenue-history').then((r) => r.data),

  listActiveSessions: () =>
    apiClient.get<any[]>('/superadmin/sessions').then((r) => r.data),

  revokeSession: (sessionId: string) =>
    apiClient.delete(`/superadmin/sessions/${sessionId}`),

  revokeAllSessions: () =>
    apiClient.delete('/superadmin/sessions'),


  recordPayment: (tenantId: string, data: { invoice_id: string; amount: number; payment_method: string; reference_number?: string }) =>
    apiClient.post(`/tenants/${tenantId}/payments`, data).then((r) => r.data),

  exportTenantData: (tenantId: string) =>
    apiClient.get<any>(`/tenants/${tenantId}/export`).then((r) => r.data),
}
