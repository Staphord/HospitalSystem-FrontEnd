import { apiClient } from '@/api/client'
import type {
  HospitalUser,
  HospitalUserCreate,
  HospitalUserUpdate,
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
    apiClient.get('/departments').then((r) => r.data),

  listFeeSchedules: () =>
    apiClient.get('/fee-schedules').then((r) => r.data),

  listAuditLogs: () =>
    apiClient.get('/audit-logs').then((r) => r.data),
}
