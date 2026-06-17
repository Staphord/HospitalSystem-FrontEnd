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
} from '@/api/types/admin'

// Proxied via api-gateway → admin-service
export const adminService = {
  listUsers: () =>
    apiClient.get<HospitalUser[]>('/users').then((r) => r.data),

  createUser: (data: HospitalUserCreate) =>
    apiClient.post<HospitalUser>('/users', data).then((r) => r.data),

  updateUser: (sub: string, data: HospitalUserUpdate) =>
    apiClient.patch<HospitalUser>(`/users/${sub}`, data).then((r) => r.data),

  deleteUser: (sub: string) =>
    apiClient.delete(`/users/${sub}`),

  deactivateUser: (sub: string) =>
    apiClient.post(`/users/${sub}/deactivate`),

  listDepartments: () =>
    apiClient.get<Department[]>('/departments').then((r) => r.data),

  updateDepartment: (id: string, data: Partial<Department>) =>
    apiClient.patch<Department>(`/departments/${id}`, data).then((r) => r.data),

  getDashboardStats: () =>
    apiClient.get<DashboardStats>('/dashboard/stats').then((r) => r.data),

  getDashboardAlerts: () =>
    apiClient.get<Alert[]>('/dashboard/alerts').then((r) => r.data),

  listActiveSessions: () =>
    apiClient.get<ActiveSession[]>('/sessions').then((r) => r.data),

  revokeSession: (id: string) =>
    apiClient.delete(`/sessions/${id}`),

  listFeeSchedules: () =>
    apiClient.get<FeeItem[]>('/fee-schedules').then((r) => r.data),

  createFeeSchedule: (data: Omit<FeeItem, 'id'>) =>
    apiClient.post<FeeItem>('/fee-schedules', data).then((r) => r.data),

  updateFeeSchedule: (id: string, data: Partial<FeeItem>) =>
    apiClient.patch<FeeItem>(`/fee-schedules/${id}`, data).then((r) => r.data),

  deleteFeeSchedule: (id: string) =>
    apiClient.delete(`/fee-schedules/${id}`),

  listInsuranceProviders: () =>
    apiClient.get<Provider[]>('/insurance-providers').then((r) => r.data),

  createInsuranceProvider: (data: Omit<Provider, 'id'>) =>
    apiClient.post<Provider>('/insurance-providers', data).then((r) => r.data),

  updateInsuranceProvider: (id: string, data: Partial<Provider>) =>
    apiClient.patch<Provider>(`/insurance-providers/${id}`, data).then((r) => r.data),

  deleteInsuranceProvider: (id: string) =>
    apiClient.delete(`/insurance-providers/${id}`),

  listHospitalAuditLogs: () =>
    apiClient.get<AuditLogRow[]>('/hospital-audit-logs').then((r) => r.data),

  listWards: () =>
    apiClient.get<WardItem[]>('/wards').then((r) => r.data),

  createWard: (data: Omit<WardItem, 'id'>) =>
    apiClient.post<WardItem>('/wards', data).then((r) => r.data),

  updateWard: (id: string, data: Partial<WardItem>) =>
    apiClient.patch<WardItem>(`/wards/${id}`, data).then((r) => r.data),

  listFeeSchedulesOld: () =>
    apiClient.get('/fee-schedules').then((r) => r.data),

  listAuditLogs: () =>
    apiClient.get('/audit-logs').then((r) => r.data),
}
