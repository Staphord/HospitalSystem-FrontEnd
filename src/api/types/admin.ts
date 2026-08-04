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
  password?: string
  forcePasswordChange?: boolean
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
  action: string
  department: string
  recordId: string
  ipAddress: string
  details: string
  signature: string
}

export interface BackupItem {
  id: string
  filename: string
  size: string
  status: 'Successful' | 'Failed'
  createdAt: string
  initiatedBy: string
  tableCounts?: Record<string, number>
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

export interface StaffLoginLog {
  timestamp: string
  ip: string
  device: string
  duration: string
  workspace: string
  status: 'Success' | 'Failed' | 'Expired'
}

export interface StaffActivityLog {
  timestamp: string
  action: string
  module: string
  targetId: string
  details: string
}

export interface RealmRole {
  id: string
  name: string
  description?: string | null
}

export interface GlobalRole {
  id: string
  name: string
  description?: string | null
}

export interface TenantRole {
  id: string
  name: string
  description?: string | null
  createdBy?: string | null
  createdAt: string
}

export interface RolePermission {
  roleName: string
  modules: string[]
  actions: string[]
  updatedAt: string
}

