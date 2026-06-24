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
  amount: number
  status?: string
  due_date?: string
  description?: string
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

  listInvoices: (tenantId?: string) =>
    apiClient
      .get<Invoice[]>('/invoices', { params: { tenant_id: tenantId } })
      .then((r) => r.data),

  createInvoice: (data: InvoiceCreate) =>
    apiClient.post<Invoice>('/invoices', data).then((r) => r.data),

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
    apiClient.get<SubscriptionPlan[]>('/plans').then((r) => r.data),

  getPlan: (planId: string) =>
    apiClient.get<SubscriptionPlan>(`/plans/${planId}`).then((r) => r.data),

  createPlan: (data: Partial<SubscriptionPlan>) =>
    apiClient.post<SubscriptionPlan>('/plans', data).then((r) => r.data),

  updatePlan: (planId: string, data: Partial<SubscriptionPlan>) =>
    apiClient.patch<SubscriptionPlan>(`/plans/${planId}`, data).then((r) => r.data),

  getRevenueHistory: () =>
    apiClient.get<{ months: string[]; revenue: number[] }>('/finance/revenue-history').then((r) => r.data),

  listActiveSessions: () =>
    apiClient.get<any[]>('/superadmin/sessions').then((r) => r.data),

  revokeSession: (sessionId: string) =>
    apiClient.delete(`/superadmin/sessions/${sessionId}`),

  revokeAllSessions: () =>
    apiClient.delete('/superadmin/sessions'),
}

