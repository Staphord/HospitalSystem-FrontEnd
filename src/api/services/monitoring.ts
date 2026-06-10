import { apiClient } from '@/api/client'

export interface SystemHealthData {
  telemetry: {
    uptime: string
    active_users: number
    cpu_usage: number
    ram_usage: number
    disk_usage: number
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
}

export interface IncidentCreate {
  title: string
  severity: 'warning' | 'critical'
  message: string
}

export interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'alert' | 'maintenance'
  scope: 'all' | 'tenants_only' | 'staff_only'
  display_format: 'banner' | 'modal' | 'toast'
  active: boolean
  created_at: string
}

export interface AnnouncementCreate {
  title: string
  message: string
  type: 'info' | 'alert' | 'maintenance'
  scope: 'all' | 'tenants_only' | 'staff_only'
  display_format: 'banner' | 'modal' | 'toast'
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

  updateAnnouncement: (announcementId: string, data: Partial<Announcement>) =>
    apiClient.patch<Announcement>(`/announcements/${announcementId}`, data).then((r) => r.data),

  getAuditLogs: () =>
    apiClient.get<AuditLog[]>('/audit-logs').then((r) => r.data),
}
