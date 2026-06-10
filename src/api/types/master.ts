// master-service — tenants, subscriptions, invoices, announcements

export interface Tenant {
  tenant_id: string
  hospital_name: string
  status: string
  created_at?: string
  subscription_end?: string | null
  country?: string
  city?: string
  address?: string
  timezone?: string
  currency?: string
  logo?: string
  data_region?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  grace_days?: number
}

export interface TenantCreate {
  hospital_name: string
  admin_username: string
  admin_password: string
  admin_email: string
  admin_full_name?: string
}

export interface Subscription {
  id: string
  tenant_id: string
  plan_name: string
  status: string
  start_date?: string
  end_date?: string | null
}

export interface Invoice {
  id: string
  tenant_id: string
  amount: number
  status: string
  due_date?: string
  description?: string
  payment_method?: string
  reference_number?: string
  payment_date?: string
}

export interface MasterAdminUser {
  keycloak_sub: string
  username: string
  email: string
  full_name?: string | null
  role: string
}

export interface MasterAdminUserCreate {
  username: string
  password: string
  email: string
  full_name?: string
}
