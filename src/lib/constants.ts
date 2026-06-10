// Single gateway URL — frontend never talks to individual service ports
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export const STORAGE_KEYS = {
  accessToken: 'hf_access_token',
  refreshToken: 'hf_refresh_token',
} as const

// Gateway route prefixes (proxied to microservices)
export const API_PATHS = {
  auth: '/auth',
  master: '/tenants',
  admin: '/users',
  reception: '/patients',
  triage: '/assessments',
  consultation: '/consultations',
  laboratory: '/results',
  radiology: '/reports',
  pharmacy: '/dispense',
  billing: '/bills',
  ward: '/admissions',
  notifications: '/notifications',
  reports: '/reports',
} as const
