import { apiClient } from '@/api/client'
import type {
  Invoice,
  MasterAdminUser,
  MasterAdminUserCreate,
  Subscription,
  Tenant,
  TenantCreate,
  SubscriptionPlan,
} from '@/api/types/master'

export interface InvoiceCreate {
  tenant_id: string
  subscription_id: string
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
  return {
    ...data,
    hospital_name: data.hospital_name || data.name || data.tenant_id,
  }
}

function normalizeTenants(data: Tenant[]): Tenant[] {
  return Array.isArray(data) ? data.map(normalizeTenant) : []
}

// All paths proxied via api-gateway → master-service
export const masterService = {
  listTenants: () =>
    apiClient.get<Tenant[]>('/tenants').then((r) => normalizeTenants(r.data)),

  getTenant: (tenantId: string) =>
    apiClient.get<Tenant>(`/tenants/${tenantId}`).then((r) => normalizeTenant(r.data)),

  getTenantStats: (tenantId: string) =>
    apiClient.get<any>(`/tenants/${tenantId}/stats`).then((r) => r.data),

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
      .post<any>(`/tenants/${tenantId}/subscribe`, data)
      .then((r) => r.data),

  upgradeTenantSubscription: (tenantId: string, data: { plan: string; billing_cycle?: string }) =>
    apiClient
      .post<any>(`/tenants/${tenantId}/upgrade`, data)
      .then((r) => r.data),

  downgradeTenantSubscription: (tenantId: string, data: { plan: string; billing_cycle?: string; effective_at_end?: boolean }) =>
    apiClient
      .post<any>(`/tenants/${tenantId}/downgrade`, data)
      .then((r) => r.data),

  upgradeSubscriptionEndpoint: (subscriptionId: string, data: { plan_id: string }) =>
    apiClient
      .post<any>(`/subscriptions/${subscriptionId}/upgrade`, data)
      .then((r) => r.data),

  downgradeSubscriptionEndpoint: (subscriptionId: string, data: { plan_id: string }) =>
    apiClient
      .post<any>(`/subscriptions/${subscriptionId}/downgrade`, data)
      .then((r) => r.data),

  listInvoices: (tenantId?: string) =>
    apiClient
      .get<Invoice[]>('/invoices', { params: { tenant_id: tenantId } })
      .then((r) => r.data),

  createInvoice: (data: InvoiceCreate) =>
    apiClient.post<Invoice>('/invoices', data).then((r) => r.data),

  updateInvoice: (invoiceId: string, data: Partial<Invoice> & { payment_method?: string }) =>
    apiClient.patch<Invoice>(`/invoices/${invoiceId}`, data).then((r) => r.data),

  listMasterAdmins: () =>
    apiClient.get<MasterAdminUser[]>('/master-admins').then((r) => r.data),

  createMasterAdmin: (data: MasterAdminUserCreate) =>
    apiClient.post<MasterAdminUser>('/master-admins', data).then((r) => r.data),

  deleteMasterAdmin: (username: string) =>
    apiClient.delete('/master-admins', { data: { username } }),

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

  recordPayment: (tenantId: string, data: { invoice_id: string; amount: number; payment_method: string; reference_number?: string }) =>
    apiClient.post(`/tenants/${tenantId}/payments`, data).then((r) => r.data),
}
