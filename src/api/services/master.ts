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
  amount: number
  status?: string
  due_date?: string
  description?: string
}

// All paths proxied via api-gateway → master-service
export const masterService = {
  listTenants: () =>
    apiClient.get<Tenant[]>('/tenants').then((r) => r.data),

  getTenant: (tenantId: string) =>
    apiClient.get<Tenant>(`/tenants/${tenantId}`).then((r) => r.data),

  createTenant: (data: TenantCreate) =>
    apiClient.post<Tenant>('/tenants', data).then((r) => r.data),

  updateTenant: (tenantId: string, data: Partial<Tenant>) =>
    apiClient.patch<Tenant>(`/tenants/${tenantId}`, data).then((r) => r.data),

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
    apiClient.get<MasterAdminUser[]>('/master-admins').then((r) => r.data),

  createMasterAdmin: (data: MasterAdminUserCreate) =>
    apiClient.post<MasterAdminUser>('/master-admins', data).then((r) => r.data),

  deleteMasterAdmin: (username: string) =>
    apiClient.delete('/master-admins', { data: { username } }),

  listPlans: () =>
    apiClient.get<SubscriptionPlan[]>('/plans').then((r) => r.data),

  getPlan: (planId: string) =>
    apiClient.get<SubscriptionPlan>(`/plans/${planId}`).then((r) => r.data),

  createPlan: (data: Partial<SubscriptionPlan>) =>
    apiClient.post<SubscriptionPlan>('/plans', data).then((r) => r.data),

  updatePlan: (planId: string, data: Partial<SubscriptionPlan>) =>
    apiClient.patch<SubscriptionPlan>(`/plans/${planId}`, data).then((r) => r.data),
}

