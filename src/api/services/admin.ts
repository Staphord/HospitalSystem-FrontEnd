import { apiClient } from '@/api/client'
import type {
  HospitalUser,
  HospitalUserCreate,
  HospitalUserUpdate,
  Department,
  Alert,
  DashboardStats,
  ActiveSession,
  FeeItem,
  Provider,
  AuditLogRow,
  WardItem,
  BackupItem,
  StaffLoginLog,
  StaffActivityLog,
  RealmRole,
  GlobalRole,
  TenantRole,
  RolePermission,
} from '@/api/types/admin'

// ---------------------------------------------------------------------------
// Backend wire formats (admin-service, proxied via api-gateway under /admin)
// ---------------------------------------------------------------------------

interface BackendUser {
  keycloak_sub: string
  username: string | null
  full_name: string | null
  email: string | null
  role: string | null
  hospital_id: string | null
  department_id: string | null
  phone: string | null
  is_active: boolean
  mfa_enabled?: boolean
}

interface BackendDepartment {
  department_id: string
  department_name: string
  department_type: string
  head_user_sub: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface BackendFee {
  fee_id: string
  item_name: string
  item_code: string | null
  item_type: string
  standard_price: string | number
  insurance_price: string | number | null
  is_active: boolean
  effective_from: string
  effective_to: string | null
  created_at: string
}

interface BackendProvider {
  provider_id: string
  name: string
  contact_person: string | null
  policies: string[] | null
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

interface BackendHospitalProfile {
  tenant_id: string
  hospital_name: string
  country: string | null
  city: string | null
  address: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  billing_email: string | null
  timezone: string | null
  currency: string | null
  date_format: string | null
  logo_url: string | null
  status: string | null
  subscription_plan: string | null
}

interface BackendWard {
  ward_name: string
  bed_count: number
  available: number
}

interface BackendActiveSession {
  id: string
  staff_id: string
  staff_name: string
  staff_role: string
  department?: string | null
  login_time?: string | null
  device?: string | null
  ip_address?: string | null
  avatar_url?: string | null
}

interface BackendDashboardReport {
  active_users: number
  visits_today: number
  open_queue_entries: number
  beds: { total: number; available: number; occupied: number }
  generated_at: string
}

interface BackendAuditLog {
  log_id: string
  user_id: string
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  session_id?: string | null
  created_at: string
}

interface BackendAuditLogPage {
  items: BackendAuditLog[]
  total: number
  limit: number
  offset: number
}

interface BackendSetting {
  key: string
  value: string | null
  updated_by?: string | null
  updated_at?: string | null
}

type BackendSession = BackendActiveSession

interface BackendLoginHistory {
  timestamp: string
  ip?: string | null
  device?: string
  duration?: string
  workspace?: string
  status?: string
  detail?: string | null
}

interface BackendBackup {
  backup_id: string
  tenant_id: string
  status: string
  file_path: string | null
  size_bytes: number | null
  triggered_by: string
  triggered_by_sub: string | null
  error: string | null
  started_at: string
  finished_at: string | null
}

interface BackendRealmRole {
  id: string
  name: string
  description?: string | null
}

interface BackendGlobalRole {
  global_role_id: string
  name: string
  description?: string | null
}

interface BackendTenantRole {
  tenant_role_id: string
  name: string
  description?: string | null
  created_by?: string | null
  created_at: string
}

interface BackendPermission {
  role_name: string
  modules: string[]
  actions: string[]
  updated_at: string
}

// ---------------------------------------------------------------------------
// Mapping helpers (frontend camelCase display shapes <-> backend snake_case)
// ---------------------------------------------------------------------------

// UI roles → Keycloak realm roles accepted by admin-service
const toBackendRole = (role?: string): string | undefined => {
  if (!role) return undefined
  if (role === 'admin') return 'hospital_admin'
  if (role === 'tech') return 'lab_technician'
  return role
}

const mapUser = (u: BackendUser, departmentName?: string): HospitalUser => ({
  keycloak_sub: u.keycloak_sub,
  username: u.username ?? '',
  email: u.email ?? '',
  full_name: u.full_name,
  role: u.role ?? 'hospital_user',
  hospital_id: u.hospital_id ?? '',
  phone: u.phone ?? undefined,
  landingDepartment: departmentName ?? u.department_id ?? undefined,
  additionalDepartments: [],
  mfaEnabled: Boolean(u.mfa_enabled),
  status: u.is_active ? 'active' : 'inactive',
  avatarUrl: '',
})

const isUuid = (value?: string | null): boolean =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))

const resolveDepartmentId = async (landingDepartment?: string | null): Promise<string | null> => {
  if (!landingDepartment) return null
  if (isUuid(landingDepartment)) return landingDepartment
  const departments = await apiClient
    .get<BackendDepartment[]>('/admin/departments')
    .then((r) => r.data)
    .catch(() => [] as BackendDepartment[])
  const match = departments.find(
    (d) => d.department_name.toLowerCase() === landingDepartment.toLowerCase(),
  )
  return match?.department_id ?? null
}

const loadDepartmentNameMap = async (): Promise<Map<string, string>> => {
  const departments = await apiClient
    .get<BackendDepartment[]>('/admin/departments')
    .then((r) => r.data)
    .catch(() => [] as BackendDepartment[])
  return new Map(departments.map((d) => [d.department_id, d.department_name]))
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

const FEE_TYPE_TO_CATEGORY: Record<string, string> = {
  consultation: 'CONSULTATION',
  lab: 'LAB',
  radiology: 'RADIOLOGY',
  medication: 'PHARMACY',
  procedure: 'PROCEDURE',
  ward: 'WARD',
  other: 'OTHER',
}

const CATEGORY_TO_FEE_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(FEE_TYPE_TO_CATEGORY).map(([k, v]) => [v, k]),
)

const parseAmount = (amount: string | number): number => {
  if (typeof amount === 'number') return amount
  const parsed = Number(String(amount).replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const mapFee = (f: BackendFee): FeeItem => ({
  id: f.fee_id,
  name: f.item_name,
  category: FEE_TYPE_TO_CATEGORY[f.item_type] ?? f.item_type.toUpperCase(),
  amount: f.standard_price !== null && f.standard_price !== undefined ? String(f.standard_price) : '0',
  currency: 'TZS',
  insuranceCovered: f.insurance_price !== null && f.insurance_price !== undefined,
  active: f.is_active,
})

const mapProvider = (p: BackendProvider): Provider => ({
  id: p.provider_id,
  name: p.name,
  policies: p.policies || [],
  contactPerson: p.contact_person || '—',
  email: p.contact_email || '—',
  phone: p.contact_phone || '—',
  active: p.is_active,
  notes: p.notes ?? undefined,
})

const mapWard = (w: BackendWard): WardItem => {
  const occupied = Math.max(0, w.bed_count - w.available)
  const occupancy = w.bed_count > 0 ? occupied / w.bed_count : 0
  return {
    id: w.ward_name,
    name: w.ward_name,
    occupiedBeds: occupied,
    totalBeds: w.bed_count,
    isUrgent: occupancy >= 0.9,
  }
}

const mapRealmRole = (r: BackendRealmRole): RealmRole => ({
  id: r.id,
  name: r.name,
  description: r.description,
})

const mapGlobalRole = (r: BackendGlobalRole): GlobalRole => ({
  id: r.global_role_id,
  name: r.name,
  description: r.description,
})

const mapTenantRole = (r: BackendTenantRole): TenantRole => ({
  id: r.tenant_role_id,
  name: r.name,
  description: r.description,
  createdBy: r.created_by,
  createdAt: r.created_at,
})

const mapPermission = (p: BackendPermission): RolePermission => ({
  roleName: p.role_name,
  modules: p.modules,
  actions: p.actions,
  updatedAt: p.updated_at,
})

const profileToSettingsMap = (p: BackendHospitalProfile): Record<string, string | null> => ({
  hospital_name: p.hospital_name,
  address: p.address,
  city: p.city,
  country: p.country,
  phone: p.primary_contact_phone,
  email: p.billing_email ?? p.primary_contact_email,
  primary_contact_name: p.primary_contact_name,
  primary_contact_email: p.primary_contact_email,
  primary_contact_phone: p.primary_contact_phone,
  timezone: p.timezone,
  currency: p.currency,
  date_format: p.date_format,
  logo_url: p.logo_url,
})

const settingsToProfilePatch = (settings: Record<string, string | null>): Record<string, string | null> => {
  const patch: Record<string, string | null> = {}
  if (settings.hospital_name !== undefined) patch.hospital_name = settings.hospital_name
  if (settings.address !== undefined) patch.address = settings.address
  if (settings.city !== undefined) patch.city = settings.city
  if (settings.country !== undefined) patch.country = settings.country
  if (settings.primary_contact_name !== undefined) {
    patch.primary_contact_name = settings.primary_contact_name
  }
  if (settings.primary_contact_email !== undefined) {
    patch.primary_contact_email = settings.primary_contact_email
  } else if (settings.email !== undefined) {
    patch.primary_contact_email = settings.email
  }
  if (settings.primary_contact_phone !== undefined) {
    patch.primary_contact_phone = settings.primary_contact_phone
  } else if (settings.phone !== undefined) {
    patch.primary_contact_phone = settings.phone
  }
  if (settings.email !== undefined) patch.billing_email = settings.email
  if (settings.timezone !== undefined) patch.timezone = settings.timezone
  if (settings.currency !== undefined) patch.currency = settings.currency
  if (settings.date_format !== undefined) patch.date_format = settings.date_format
  if (settings.logo_url !== undefined) patch.logo_url = settings.logo_url
  return patch
}

const makeFeeCode = (name: string): string => {
  const base = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase() || 'FEE'
  return `${base}-${Date.now().toString(36).toUpperCase()}`
}

const cleanText = (value?: string | null): string | null => {
  const trimmed = (value ?? '').trim()
  return trimmed && trimmed !== '—' ? trimmed : null
}

const cleanEmail = (value?: string | null): string | null => {
  const cleaned = cleanText(value)
  return cleaned && cleaned.includes('@') ? cleaned : null
}

const summarizeAuditLog = (log: BackendAuditLog): string => {
  const parts = [`${log.action} on ${log.table_name}`]
  if (log.new_values && Object.keys(log.new_values).length > 0) {
    const changes = Object.entries(log.new_values)
      .map(([k, v]) => `${k}=${typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}`)
      .join(', ')
    parts.push(`Changes: ${changes}.`)
  }
  if (log.old_values && Object.keys(log.old_values).length > 0 && !log.new_values) {
    parts.push(`Previous values: ${JSON.stringify(log.old_values)}.`)
  }
  return parts.join('. ')
}

const mapAuditLog = (log: BackendAuditLog): AuditLogRow => ({
  id: log.log_id,
  timestamp: new Date(log.created_at).toLocaleString(),
  staffName: log.user_id,
  staffRole: 'Staff',
  action: log.action,
  department: capitalize(log.table_name.replace(/_/g, ' ')),
  recordId: log.record_id || '—',
  ipAddress: log.ip_address || '—',
  details: summarizeAuditLog(log),
  signature: `LOG-${log.log_id.slice(0, 8)}`,
})

const PROFILE_KEYS = new Set([
  'hospital_name',
  'address',
  'city',
  'country',
  'phone',
  'email',
  'primary_contact_name',
  'primary_contact_email',
  'primary_contact_phone',
  'timezone',
  'currency',
  'date_format',
  'logo_url',
])

const formatDuration = (loginTime: string): string => {
  const start = new Date(loginTime).getTime()
  if (!Number.isFinite(start)) return '—'
  const mins = Math.max(0, Math.floor((Date.now() - start) / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m}m`
  return `${h}h ${m}m`
}



const formatBytes = (bytes: number | null): string => {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

const mapBackup = (b: BackendBackup): BackupItem => ({
  id: b.backup_id,
  filename: b.file_path?.split(/[/\\]/).pop() || `backup-${b.backup_id.slice(0, 8)}.zip`,
  size: formatBytes(b.size_bytes),
  status: b.status === 'completed' ? 'Successful' : 'Failed',
  createdAt: new Date(b.started_at).toLocaleString(),
  initiatedBy: b.triggered_by_sub || b.triggered_by,
})

const mapSession = (s: BackendActiveSession): ActiveSession => ({
  id: s.id,
  staffId: s.staff_id || s.id,
  staffName: s.staff_name || 'Staff Member',
  staffRole: s.staff_role || 'Staff',
  department: s.department || 'General',
  loginTime: s.login_time ? new Date(s.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
  duration: s.login_time ? formatDuration(s.login_time) : undefined,
  device: s.device || 'Workstation',
  ipAddress: s.ip_address || '—',
  avatarUrl: s.avatar_url || '',
})

// ---------------------------------------------------------------------------
// Service — all paths proxied via api-gateway → admin-service (/admin/*)
// ---------------------------------------------------------------------------

export const adminService = {
  // Users (FR-53)
  listUsers: async (): Promise<HospitalUser[]> => {
    const [users, deptMap] = await Promise.all([
      apiClient.get<BackendUser[]>('/admin/users').then((r) => r.data),
      loadDepartmentNameMap(),
    ])
    return users.map((u) =>
      mapUser(u, u.department_id ? deptMap.get(u.department_id) : undefined),
    )
  },

  createUser: async (data: HospitalUserCreate): Promise<HospitalUser> => {
    const departmentId = await resolveDepartmentId(data.landingDepartment)
    const created = await apiClient
      .post<BackendUser>('/admin/users', {
        username: data.username,
        password: data.password ?? 'Gilgal#2026!Staff',
        email: data.email,
        full_name: data.full_name ?? '',
        role: toBackendRole(data.role) ?? 'hospital_user',
        department_id: departmentId,
        phone: data.phone ?? null,
        mfa_enabled: data.mfaEnabled ?? false,
      })
      .then((r) => r.data)
    const deptMap = await loadDepartmentNameMap()
    return mapUser(
      created,
      created.department_id ? deptMap.get(created.department_id) : data.landingDepartment,
    )
  },

  updateUser: async (sub: string, data: HospitalUserUpdate): Promise<HospitalUser> => {
    const payload: Record<string, unknown> = {}
    if (data.email !== undefined) payload.email = data.email
    if (data.full_name !== undefined) payload.full_name = data.full_name
    if (data.role !== undefined) payload.role = toBackendRole(data.role)
    if (data.phone !== undefined) payload.phone = data.phone
    if (data.landingDepartment !== undefined) {
      payload.department_id = await resolveDepartmentId(data.landingDepartment)
    }
    if (data.mfaEnabled !== undefined) payload.mfa_enabled = data.mfaEnabled
    if (data.status !== undefined) payload.is_active = data.status === 'active'
    if (data.password !== undefined) payload.password = data.password
    if (data.forcePasswordChange !== undefined) payload.force_password_change = data.forcePasswordChange
    const updated = await apiClient
      .patch<BackendUser>(`/admin/users/${sub}`, payload)
      .then((r) => r.data)
    const deptMap = await loadDepartmentNameMap()
    return mapUser(
      updated,
      updated.department_id ? deptMap.get(updated.department_id) : data.landingDepartment,
    )
  },

  deleteUser: (sub: string) => apiClient.delete(`/admin/users/${sub}`),

  deactivateUser: (sub: string) =>
    apiClient.patch(`/admin/users/${sub}`, { is_active: false }),

  // Departments (FR-55)
  listDepartments: async (): Promise<Department[]> => {
    const [departments, users] = await Promise.all([
      apiClient.get<BackendDepartment[]>('/admin/departments').then((r) => r.data),
      apiClient
        .get<BackendUser[]>('/admin/users')
        .then((r) => r.data)
        .catch(() => [] as BackendUser[]),
    ])
    return departments.map((d) => ({
      id: d.department_id,
      name: d.department_name,
      type: capitalize(d.department_type),
      staffCount: users.filter((u) => u.department_id === d.department_id).length,
      queueCount: 0,
      status: 'success' as const,
      alerts: 0,
      active: d.is_active,
    }))
  },

  createDepartment: (data: { name: string; type: string }): Promise<Department> =>
    apiClient
      .post<BackendDepartment>('/admin/departments', {
        department_name: data.name,
        department_type: data.type.toLowerCase(),
      })
      .then((r) => ({
        id: r.data.department_id,
        name: r.data.department_name,
        type: capitalize(r.data.department_type),
        staffCount: 0,
        active: r.data.is_active,
      })),

  updateDepartment: (id: string, data: Partial<Department>) => {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.department_name = data.name
    if (data.type !== undefined) payload.department_type = data.type.toLowerCase()
    if (data.active !== undefined) payload.is_active = data.active
    return apiClient.patch<BackendDepartment>(`/admin/departments/${id}`, payload).then((r) => r.data)
  },

  deleteDepartment: (id: string) =>
    apiClient.delete(`/admin/departments/${id}`),

  // Fee schedules (FR-55) — backend path is /admin/fee-schedules
  listFeeSchedules: (): Promise<FeeItem[]> =>
    apiClient
      .get<BackendFee[]>('/admin/fee-schedules', { params: { active_only: false } })
      .then((r) => r.data.map(mapFee)),

  createFeeSchedule: (data: Omit<FeeItem, 'id'>): Promise<FeeItem> =>
    apiClient
      .post<BackendFee>('/admin/fee-schedules', {
        item_name: data.name,
        item_code: makeFeeCode(data.name),
        item_type: CATEGORY_TO_FEE_TYPE[data.category.toUpperCase()] ?? 'other',
        standard_price: parseAmount(data.amount),
        insurance_price: data.insuranceCovered ? parseAmount(data.amount) : null,
        effective_from: new Date().toISOString().split('T')[0],
      })
      .then((r) => mapFee(r.data)),

  updateFeeSchedule: (id: string, data: Partial<FeeItem>): Promise<FeeItem> => {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.item_name = data.name
    if (data.category !== undefined) {
      payload.item_type = CATEGORY_TO_FEE_TYPE[data.category.toUpperCase()] ?? 'other'
    }
    if (data.amount !== undefined) payload.standard_price = parseAmount(data.amount)
    if (data.active !== undefined) payload.is_active = data.active
    if (data.insuranceCovered !== undefined) {
      payload.insurance_price =
        data.insuranceCovered && data.amount !== undefined ? parseAmount(data.amount) : null
    }
    return apiClient
      .patch<BackendFee>(`/admin/fee-schedules/${id}`, payload)
      .then((r) => mapFee(r.data))
  },

  deleteFeeSchedule: (id: string) => apiClient.delete(`/admin/fee-schedules/${id}`),

  // Insurance providers (FR-55)
  listInsuranceProviders: (): Promise<Provider[]> =>
    apiClient
      .get<BackendProvider[]>('/admin/insurance-providers')
      .then((r) => r.data.map(mapProvider)),

  createInsuranceProvider: (data: Omit<Provider, 'id'>): Promise<Provider> =>
    apiClient
      .post<BackendProvider>('/admin/insurance-providers', {
        name: data.name,
        contact_person: cleanText(data.contactPerson),
        policies: data.policies,
        contact_email: cleanEmail(data.email),
        contact_phone: cleanText(data.phone),
        notes: cleanText(data.notes),
      })
      .then((r) => mapProvider(r.data)),

  updateInsuranceProvider: (id: string, data: Partial<Provider>): Promise<Provider> => {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.contactPerson !== undefined) payload.contact_person = cleanText(data.contactPerson)
    if (data.policies !== undefined) payload.policies = data.policies
    if (data.email !== undefined) payload.contact_email = cleanEmail(data.email)
    if (data.phone !== undefined) payload.contact_phone = cleanText(data.phone)
    if (data.notes !== undefined) payload.notes = cleanText(data.notes)
    if (data.active !== undefined) payload.is_active = data.active
    return apiClient
      .patch<BackendProvider>(`/admin/insurance-providers/${id}`, payload)
      .then((r) => mapProvider(r.data))
  },

  deleteInsuranceProvider: (id: string) =>
    apiClient.delete(`/admin/insurance-providers/${id}`),

  // Hospital profile + KV settings (FR-55)
  getHospitalProfile: () =>
    apiClient.get<BackendHospitalProfile>('/admin/hospital-profile').then((r) => r.data),

  getSettings: async (): Promise<Record<string, string | null>> => {
    const [profile, kv] = await Promise.all([
      apiClient
        .get<BackendHospitalProfile>('/admin/hospital-profile')
        .then((r) => profileToSettingsMap(r.data))
        .catch(() => ({}) as Record<string, string | null>),
      apiClient
        .get<BackendSetting[]>('/admin/settings')
        .then((r) => Object.fromEntries(r.data.map((s) => [s.key, s.value])))
        .catch(() => ({}) as Record<string, string | null>),
    ])
    return { ...profile, ...kv }
  },

  updateSettings: async (settings: Record<string, string | null>) => {
    const profilePatch = settingsToProfilePatch(settings)
    const kvEntries = Object.fromEntries(
      Object.entries(settings).filter(([key]) => !PROFILE_KEYS.has(key)),
    )
    const [profile, kv] = await Promise.all([
      Object.keys(profilePatch).length > 0
        ? apiClient
            .patch<BackendHospitalProfile>('/admin/hospital-profile', profilePatch)
            .then((r) => profileToSettingsMap(r.data))
        : Promise.resolve({} as Record<string, string | null>),
      Object.keys(kvEntries).length > 0
        ? apiClient
            .put<BackendSetting[]>('/admin/settings', { settings: kvEntries })
            .then((r) => Object.fromEntries(r.data.map((s) => [s.key, s.value])))
        : Promise.resolve({} as Record<string, string | null>),
    ])
    return { ...profile, ...kv }
  },

  // Audit logs (FR-56)
  listHospitalAuditLogs: (params?: {
    limit?: number
    offset?: number
    action?: string
    table_name?: string
    user_id?: string
    from?: string
    to?: string
  }): Promise<AuditLogRow[]> =>
    apiClient
      .get<BackendAuditLogPage>('/admin/audit-logs', {
        params: { limit: 100, offset: 0, ...params },
      })
      .then((r) => r.data.items.map(mapAuditLog)),

  listHospitalAuditLogsPage: (params?: {
    limit?: number
    offset?: number
    action?: string
    table_name?: string
    user_id?: string
    from?: string
    to?: string
  }): Promise<{ items: AuditLogRow[]; total: number }> =>
    apiClient
      .get<BackendAuditLogPage>('/admin/audit-logs', {
        params: { limit: 25, offset: 0, ...params },
      })
      .then((r) => ({ items: r.data.items.map(mapAuditLog), total: r.data.total })),

  exportAuditLogs: async (
    params: {
      action?: string
      table_name?: string
      user_id?: string
      from?: string
      to?: string
    },
    format: 'csv' | 'json' = 'csv',
  ): Promise<void> => {
    const response = await apiClient.get('/admin/audit-logs/export', {
      params: { ...params, format },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },

  listStaffActivityLogs: (userSub: string): Promise<StaffActivityLog[]> =>
    adminService.listHospitalAuditLogs({ user_id: userSub, limit: 100 }).then((rows) =>
      rows.map((row) => ({
        timestamp: row.timestamp,
        action: row.action,
        module: row.department,
        targetId: row.recordId,
        details: row.details,
      })),
    ),

  listStaffLoginHistory: (userSub: string): Promise<StaffLoginLog[]> =>
    apiClient
      .get<BackendLoginHistory[]>(`/admin/users/${userSub}/login-history`, {
        params: { days: 30, limit: 50 },
      })
      .then((r) =>
        r.data.map((row) => {
          const statusRaw = (row.status || 'Success').toLowerCase()
          const status: StaffLoginLog['status'] =
            statusRaw === 'failed' ? 'Failed' : statusRaw === 'expired' ? 'Expired' : 'Success'
          return {
            timestamp: new Date(row.timestamp).toLocaleString(),
            ip: row.ip || '—',
            device: row.device || 'Web Browser',
            duration: row.duration || '—',
            workspace: row.workspace || 'Hospital Portal',
            status,
          }
        }),
      ),

  // Backups (FR-58)
  listBackups: (): Promise<BackupItem[]> =>
    apiClient.get<BackendBackup[]>('/admin/backups').then((r) => r.data.map(mapBackup)),

  triggerBackup: (): Promise<BackupItem> =>
    apiClient.post<BackendBackup>('/admin/backups').then((r) => mapBackup(r.data)),

  downloadBackup: async (id: string, filename: string): Promise<void> => {
    const response = await apiClient.get(`/admin/backups/${id}/download`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },

  // Dashboard (from /admin/reports/dashboard + departments/users)
  getDashboardStats: async (): Promise<DashboardStats> => {
    const [dash, departments, users] = await Promise.all([
      apiClient.get<BackendDashboardReport>('/admin/reports/dashboard').then((r) => r.data),
      adminService.listDepartments().catch(() => [] as Department[]),
      adminService.listUsers().catch(() => [] as HospitalUser[]),
    ])
    return {
      totalStaff: users.length,
      onlineNow: dash.active_users ?? 0,
      departmentsActive: departments.filter((d) => d.active !== false).length,
      bedsOccupied: dash.beds?.occupied ?? 0,
      totalBeds: dash.beds?.total ?? 0,
    }
  },

  getDashboardAlerts: async (): Promise<Alert[]> => {
    try {
      const dash = await apiClient
        .get<BackendDashboardReport>('/admin/reports/dashboard')
        .then((r) => r.data)
      const alerts: Alert[] = []
      const occupied = dash.beds?.occupied ?? 0
      const total = dash.beds?.total ?? 0
      if (total > 0 && occupied / total >= 0.9) {
        alerts.push({
          id: 'bed-capacity',
          severity: 'warning',
          department: 'Ward',
          message: `Bed occupancy high: ${occupied}/${total} beds occupied.`,
          timestamp: new Date(dash.generated_at).toLocaleString(),
        })
      }
      if ((dash.open_queue_entries ?? 0) > 20) {
        alerts.push({
          id: 'queue-backlog',
          severity: 'warning',
          department: 'Reception',
          message: `${dash.open_queue_entries} open queue entries.`,
          timestamp: new Date(dash.generated_at).toLocaleString(),
        })
      }
      return alerts
    } catch {
      return []
    }
  },

  // Sessions (FR-53) — proxied via api-gateway → admin-service (/admin/sessions)
  listActiveSessions: async (): Promise<ActiveSession[]> => {
    const sessions = await apiClient
      .get<BackendActiveSession[]>('/admin/sessions')
      .then((r) => r.data)
    return sessions.map(mapSession)
  },

  revokeSession: (id: string) =>
    apiClient.delete(`/admin/sessions/${id}`),

  // Wards & beds (catalog owned by admin-service)
  listWards: (): Promise<WardItem[]> =>
    apiClient.get<BackendWard[]>('/admin/wards').then((r) => r.data.map(mapWard)),

  createWard: async (data: Omit<WardItem, 'id'>): Promise<WardItem> => {
    const bedCount = Math.max(data.totalBeds || 1, 1)
    for (let i = 1; i <= bedCount; i++) {
      await apiClient.post('/admin/beds', {
        ward_name: data.name,
        bed_number: String(i).padStart(2, '0'),
        bed_type: 'general',
        is_available: true,
        is_active: true,
      })
    }
    const wards = await adminService.listWards()
    const created = wards.find((w) => w.name === data.name)
    if (!created) {
      return {
        id: data.name,
        name: data.name,
        occupiedBeds: 0,
        totalBeds: bedCount,
        isUrgent: false,
      }
    }
    return created
  },

  updateWard: async (id: string, data: Partial<WardItem>): Promise<WardItem> => {
    const targetName = data.name ?? id
    // Wards are derived from beds; renaming updates all beds in that ward.
    let beds = await apiClient
      .get<Array<{ bed_id: string; ward_name: string; bed_number: string }>>('/admin/beds')
      .then((r) => r.data)
    if (data.name && data.name !== id) {
      await Promise.all(
        beds
          .filter((b) => b.ward_name === id)
          .map((b) => apiClient.patch(`/admin/beds/${b.bed_id}`, { ward_name: data.name })),
      )
      beds = beds.map((b) => (b.ward_name === id ? { ...b, ward_name: data.name! } : b))
    }
    // Growing bed count adds new beds; shrinking is not supported (beds may be occupied).
    if (data.totalBeds !== undefined) {
      const wardBeds = beds.filter((b) => b.ward_name === targetName)
      const existingNumbers = new Set(wardBeds.map((b) => b.bed_number))
      let nextNumber = wardBeds.length + 1
      const toAdd = Math.max(0, data.totalBeds - wardBeds.length)
      for (let i = 0; i < toAdd; i++) {
        while (existingNumbers.has(String(nextNumber).padStart(2, '0'))) nextNumber++
        const bedNumber = String(nextNumber).padStart(2, '0')
        existingNumbers.add(bedNumber)
        await apiClient.post('/admin/beds', {
          ward_name: targetName,
          bed_number: bedNumber,
          bed_type: 'general',
          is_available: true,
          is_active: true,
        })
        nextNumber++
      }
    }
    const wards = await adminService.listWards()
    return (
      wards.find((w) => w.name === targetName) ?? {
        id: targetName,
        name: targetName,
        occupiedBeds: data.occupiedBeds ?? 0,
        totalBeds: data.totalBeds ?? 0,
        isUrgent: data.isUrgent,
      }
    )
  },

  // Backups
  listBackups: (): Promise<BackupItem[]> =>
    apiClient.get<BackendBackup[]>('/admin/backups').then((r) => r.data.map(mapBackup)),

  triggerBackup: (): Promise<BackupItem> =>
    apiClient.post<BackendBackup>('/admin/backups').then((r) => mapBackup(r.data)),

  downloadBackup: async (id: string, filename: string): Promise<void> => {
    const response = await apiClient.get(`/admin/backups/${id}/download`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },

  // Roles (Realm, Global, Tenant)
  listRealmRoles: (): Promise<RealmRole[]> =>
    apiClient.get<BackendRealmRole[]>('/admin/roles/realm').then((r) => r.data.map(mapRealmRole)),

  createRealmRole: (name: string, description?: string): Promise<RealmRole> =>
    apiClient.post<BackendRealmRole>('/admin/roles/realm', { name, description }).then((r) => mapRealmRole(r.data)),

  updateRealmRole: (name: string, newName: string, description?: string): Promise<RealmRole> =>
    apiClient.patch<BackendRealmRole>(`/admin/roles/realm/${name}`, { name: newName, description }).then((r) => mapRealmRole(r.data)),

  deleteRealmRole: (name: string): Promise<void> =>
    apiClient.delete(`/admin/roles/realm/${name}`),

  listGlobalRoles: (): Promise<GlobalRole[]> =>
    apiClient.get<BackendGlobalRole[]>('/admin/roles/global').then((r) => r.data.map(mapGlobalRole)),

  listTenantRoles: (): Promise<TenantRole[]> =>
    apiClient.get<BackendTenantRole[]>('/admin/roles/tenant').then((r) => r.data.map(mapTenantRole)),

  createTenantRole: (data: { name: string; description?: string }): Promise<TenantRole> =>
    apiClient.post<BackendTenantRole>('/admin/roles/tenant', { name: data.name, description: data.description }).then((r) => mapTenantRole(r.data)),

  updateTenantRole: (id: string, data: { name?: string; description?: string }): Promise<TenantRole> =>
    apiClient.patch<BackendTenantRole>(`/admin/roles/tenant/${id}`, data).then((r) => mapTenantRole(r.data)),

  deleteTenantRole: (id: string): Promise<void> =>
    apiClient.delete(`/admin/roles/tenant/${id}`),

  // Permissions
  listPermissions: (): Promise<RolePermission[]> =>
    apiClient.get<BackendPermission[]>('/admin/permissions').then((r) => r.data.map(mapPermission)),

  updatePermissions: (roleName: string, data: { modules: string[]; actions: string[] }): Promise<RolePermission> =>
    apiClient.put<BackendPermission>(`/admin/permissions/${roleName}`, data).then((r) => mapPermission(r.data)),
}
