// master-service — tenants, subscriptions, invoices, announcements

export interface Tenant {
  id?: number
  tenant_id: string
  hospital_name: string
  name?: string
  status: string
  subscription_plan?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
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
  billing_email?: string
  tax_id?: string
  grace_days?: number
  nas_backup_path?: string
  secondary_contact_name?: string
  secondary_contact_phone?: string
  maintenance_mode?: boolean
  mfa_enforced?: boolean
  rate_limit?: number
  storage_gb?: number
}

export interface TenantCreate {
  hospital_name: string
  admin_username: string
  admin_password: string
  admin_email: string
  admin_full_name?: string
  country?: string
  city?: string
  address?: string
  timezone?: string
  currency?: string
  logo?: string
  data_region?: string
  billing_email?: string
  tax_id?: string
  grace_days?: number
  nas_backup_path?: string
  secondary_contact_name?: string
  secondary_contact_phone?: string
  plan_id?: string
  billing_cycle?: string
  subscription_end?: string
}

export interface SubscriptionPlan {
  plan_id: string
  plan_name: string
  description?: string
  max_users: number | null
  max_patients: number | null
  storage_gb: number
  modules_included: string[]
  monthly_price: number
  annual_price: number
  uptime_sla_pct: number
  backup_frequency_hours: number
  is_active: boolean
  created_at?: string
}

export interface Subscription {
  id: string
  tenant_id: string
  plan_name: string
  status: string
  start_date?: string
  end_date?: string | null
  grace_period_days?: number
  auto_renew?: boolean
  pending_plan_name?: string | null
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
  amount_paid?: number
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
