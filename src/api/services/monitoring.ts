import { apiClient } from '@/api/client'

export interface SystemHealthData {
  telemetry: {
    uptime: string
    active_users: number
    cpu_usage: number
    ram_usage: number
    disk_usage: number
    history?: {
      cpu: number[]
      ram: number[]
      disk: number[]
      db: number[]
    }
  }
  incidents: Incident[]
}

export interface Incident {
  id: string
  title: string
  severity: 'warning' | 'critical'
  status: 'active' | 'resolved'
  message: string
  created_at: string
  resolved_at?: string
  resolved_notes?: string
  resolved_by?: string
}

export interface IncidentCreate {
  title: string
  severity: 'warning' | 'critical'
  message: string
}

export interface Announcement {
  announcement_id: string
  title: string
  body: string
  audience: 'all' | 'selected'
  target_tenant_ids: string[] | null
  publish_at: string
  expires_at: string | null
  created_by?: string | null
  created_at: string
}

export interface AnnouncementCreate {
  title: string
  body: string
  audience: 'all' | 'selected'
  target_tenant_ids?: string[] | null
  publish_at: string
  expires_at?: string | null
}

export interface AuditLog {
  id: string
  timestamp: string
  actor: string
  action: string
  details: string
  ip_address: string
}

export const monitoringService = {
  getSystemHealth: () =>
    apiClient.get<SystemHealthData>('/monitoring/health').then((r) => r.data),

  createIncident: (data: IncidentCreate) =>
    apiClient.post<Incident>('/monitoring/health', data).then((r) => r.data),

  updateIncident: (incidentId: string, data: Partial<Incident>) =>
    apiClient.patch<Incident>(`/monitoring/health/${incidentId}`, data).then((r) => r.data),

  listAnnouncements: () =>
    apiClient.get<Announcement[]>('/announcements').then((r) => r.data),

  createAnnouncement: (data: AnnouncementCreate) =>
    apiClient.post<Announcement>('/announcements', data).then((r) => r.data),

  updateAnnouncement: (announcementId: string, data: Partial<AnnouncementCreate>) =>
    apiClient.patch<Announcement>(`/announcements/${announcementId}`, data).then((r) => r.data),

  deleteAnnouncement: (announcementId: string) =>
    apiClient.delete(`/announcements/${announcementId}`).then(() => {}),

  getAuditLogs: () =>
    apiClient.get<AuditLog[]>('/audit-logs').then((r) => r.data),

  getTenantAnalytics: (tenantId: string) =>
    apiClient.get<TenantAnalytics>(`/monitoring/tenants/${tenantId}/analytics`).then((r) => r.data),
}

export interface TenantAnalytics {
  uptime_trend: number[]
  active_users_peak: number[]
  storage_growth: number[]
  module_usage: { module: string; percentage: number }[]
  activity_logs: { timestamp: string; event: string; details: string }[]
}
