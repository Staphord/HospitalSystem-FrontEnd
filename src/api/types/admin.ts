export interface HospitalUser {
  keycloak_sub: string
  username: string
  email: string
  full_name?: string | null
  role: string
  hospital_id: string
  phone?: string
  landingDepartment?: string
  additionalDepartments?: string[]
  mfaEnabled?: boolean
  status?: string
  avatarUrl?: string
  createdAt?: string
}

export interface HospitalUserCreate {
  username: string
  password?: string
  email: string
  full_name?: string
  role: string
  phone?: string
  landingDepartment?: string
  additionalDepartments?: string[]
  mfaEnabled?: boolean
}

export interface HospitalUserUpdate {
  email?: string
  full_name?: string
  role?: string
  phone?: string
  landingDepartment?: string
  additionalDepartments?: string[]
  mfaEnabled?: boolean
  status?: string
}

export interface Department {
  id: string
  name: string
  staffCount: number
  queueCount?: number
  status?: 'success' | 'warning' | 'error'
  alerts?: number
  occupancy?: number
  type?: string
  active?: boolean
}

export interface FeeItem {
  id: string
  name: string
  category: string
  amount: string
  currency: string
  insuranceCovered: boolean
  active: boolean
}

export interface Provider {
  id: string
  name: string
  policies: string[]
  contactPerson: string
  email: string
  phone: string
  active: boolean
  notes?: string
}

export interface AuditLogRow {
  id: string
  timestamp: string
  staffName: string
  staffRole: string
  action: 'DIAGNOSIS' | 'PATIENT_REGISTER' | 'LOGIN' | 'LAB_RESULT' | 'PAYMENT' | 'DELETE' | 'TENANT_ONBOARD' | 'SUBSCRIPTION_UPDATE' | 'TENANT_SUSPEND' | 'TENANT_REACTIVATE' | 'TENANT_TERMINATE' | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'INCIDENT_CREATE' | 'INCIDENT_RESOLVE' | 'ANNOUNCEMENT_CREATE' | 'PAYMENT_RECORD' | 'INVOICE_GENERATE' | 'ADMIN_CREATE' | 'ADMIN_DELETE' | 'SECURITY_FORCE_LOGOUT' | 'IMPERSONATE_START'
  department: string
  recordId: string
  ipAddress: string
  details: string
  signature: string
}

export interface WardItem {
  id: string
  name: string
  occupiedBeds: number
  totalBeds: number
  isUrgent?: boolean
}

export interface Alert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  department: string
  message: string
  timestamp: string
}

export interface DashboardStats {
  totalStaff: number
  onlineNow: number
  departmentsActive: number
  bedsOccupied: number
  totalBeds: number
}

export interface ActiveSession {
  id: string
  staffId: string
  staffName: string
  staffRole: string
  avatarUrl: string
  department: string
  loginTime: string
  duration?: string
  device: string
  ipAddress: string
}

