import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import { useAuthStore, getStoredRefreshToken } from '@/store/authStore'
import { isReadOnlyToken } from '@/lib/token'
import type { TokenResponse } from '@/api/types/auth'
import type { Tenant, SubscriptionPlan, Subscription, Invoice, MasterAdminUser } from '@/api/types/master'
import type { HospitalUser, ActiveSession, FeeItem, Provider, WardItem, Department } from '@/api/types/admin'


interface MockIncident {
  id: string
  title: string
  severity: string
  status: string
  [key: string]: unknown
}

interface MockAnnouncement {
  id: string
  title: string
  message: string
  scope: string
  [key: string]: unknown
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor to add authorization header
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to map backend IDs (invoice_id, subscription_id, announcement_id, payment_id) to frontend expected 'id'
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const mapKeys = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj
      if (Array.isArray(obj)) {
        return obj.map(mapKeys)
      }
      
      const newObj = { ...obj }
      
      if ('invoice_id' in newObj && !('id' in newObj)) {
        newObj.id = newObj.invoice_id
      }
      if ('subscription_id' in newObj && !('id' in newObj)) {
        newObj.id = newObj.subscription_id
      }
      if ('announcement_id' in newObj && !('id' in newObj)) {
        newObj.id = newObj.announcement_id
      }
      if ('payment_id' in newObj && !('id' in newObj)) {
        newObj.id = newObj.payment_id
      }
      if ('incident_id' in newObj) {
        if (!('id' in newObj)) {
          newObj.id = newObj.incident_id
        }
        if (newObj.status === 'open' || newObj.status === 'acknowledged') {
          newObj.status = 'active'
        } else if (newObj.status === 'closed') {
          newObj.status = 'resolved'
        }
        if ('description' in newObj && !('message' in newObj)) {
          newObj.message = newObj.description
        }
        if ('resolution_notes' in newObj && !('resolved_notes' in newObj)) {
          newObj.resolved_notes = newObj.resolution_notes
        }
      }
      
      for (const key in newObj) {
        if (typeof newObj[key] === 'object' && newObj[key] !== null) {
          newObj[key] = mapKeys(newObj[key])
        }
      }
      return newObj
    }
    
    response.data = mapKeys(response.data)
    return response
  },
  (error: AxiosError) => {
    if (error.response && error.response.data && typeof error.response.data === 'object') {
      const data = error.response.data as any
      if (Array.isArray(data.detail)) {
        const messages = data.detail.map((err: any) => {
          const field = Array.isArray(err.loc) ? err.loc.filter(l => l !== 'body').join('.') : (err.loc || '')
          const fieldPrefix = field ? `${field}: ` : ''
          return `${fieldPrefix}${err.msg || 'invalid value'}`
        })
        data.detail = messages.join(', ')
      } else if (typeof data.detail === 'object' && data.detail !== null) {
        data.detail = JSON.stringify(data.detail)
      }
    }
    return Promise.reject(error)
  }
)

// MOCK API LAYER & PERSISTENT LOCAL STORAGE STATE
const MOCK_ENABLED = true // Frontend-only flow enabled by default

// Initial Mock Data Helpers
export const initLocalStorage = () => {
  if (!localStorage.getItem('hf_mock_tenants')) {
    localStorage.setItem('hf_mock_tenants', JSON.stringify([
      { tenant_id: 'aga-khan', hospital_name: 'Aga Khan Hospital', status: 'active', created_at: '2025-01-10T08:00:00Z', subscription_end: '2026-12-31T23:59:59Z', country: 'Kenya', city: 'Nairobi', address: 'Limuru Road', timezone: 'Africa/Nairobi', currency: 'TSH', logo: '', data_region: 'AF-South', contact_name: 'Dr. John Miller', contact_email: 'john.miller@agakhan.org', contact_phone: '+254 711 090000', grace_days: 15 },
      { tenant_id: 'gilgal', hospital_name: 'Gilgal Medical Center', status: 'trial', created_at: '2026-05-15T10:30:00Z', subscription_end: '2026-07-15T23:59:59Z', country: 'Ghana', city: 'Accra', address: '12 Giffard Road', timezone: 'Africa/Accra', currency: 'GHS', logo: '', data_region: 'EU-West', contact_name: 'Sister Mary Mensah', contact_email: 'mary@gilgalmc.org', contact_phone: '+233 24 4123456', grace_days: 7 },
      { tenant_id: 'nairobi-hosp', hospital_name: 'Nairobi Hospital', status: 'suspended', created_at: '2025-06-01T14:15:00Z', subscription_end: '2026-06-01T23:59:59Z', country: 'Kenya', city: 'Nairobi', address: 'Argwings Kodhek Road', timezone: 'Africa/Nairobi', currency: 'TSH', logo: '', data_region: 'AF-South', contact_name: 'Albert Kiprop', contact_email: 'kiprop@nairobihosp.org', contact_phone: '+254 722 203000', grace_days: 10 },
      { tenant_id: 'apex-clinic', hospital_name: 'Apex Dental Care', status: 'terminated', created_at: '2024-03-01T09:00:00Z', subscription_end: '2025-03-01T23:59:59Z', country: 'Nigeria', city: 'Lagos', address: 'Victoria Island', timezone: 'Africa/Lagos', currency: 'NGN', logo: '', data_region: 'AF-South', contact_name: 'Dr. Femi Adebayo', contact_email: 'femi@apexdental.ng', contact_phone: '+234 803 1111222', grace_days: 14 }
    ]))
  }

  if (!localStorage.getItem('hf_mock_subscriptions')) {
    localStorage.setItem('hf_mock_subscriptions', JSON.stringify([
      { id: 'sub-1', tenant_id: 'aga-khan', plan_name: 'Enterprise', status: 'active', start_date: '2025-01-10T08:00:00Z', end_date: '2026-12-31T23:59:59Z', auto_renew: true },
      { id: 'sub-2', tenant_id: 'gilgal', plan_name: 'Standard', status: 'active', start_date: '2026-05-15T10:30:00Z', end_date: '2026-07-15T23:59:59Z', auto_renew: true },
      { id: 'sub-3', tenant_id: 'nairobi-hosp', plan_name: 'Premium', status: 'suspended', start_date: '2025-06-01T14:15:00Z', end_date: '2026-06-01T23:59:59Z', auto_renew: false },
      { id: 'sub-4', tenant_id: 'aga-khan', plan_name: 'Basic', status: 'active', start_date: '2026-06-01T00:00:00Z', end_date: '2026-06-23T23:59:59Z', auto_renew: true }
    ]))
  }

  if (!localStorage.getItem('hf_mock_invoices')) {
    localStorage.setItem('hf_mock_invoices', JSON.stringify([
      {
        id: 'inv-101',
        tenant_id: 'aga-khan',
        amount: 2500,
        status: 'paid',
        due_date: '2026-05-31',
        description: 'Enterprise Monthly Subscription - May 2026',
        payment_method: 'Bank Transfer',
        reference_number: 'TXN-AK-88273',
        payment_date: '2026-05-28'
      },
      {
        id: 'inv-102',
        tenant_id: 'aga-khan',
        amount: 2500,
        amount_paid: 1500,
        status: 'partially_paid',
        due_date: '2026-06-30',
        description: 'Enterprise Monthly Subscription - June 2026',
        payment_method: 'Bank Transfer',
        reference_number: 'TXN-AK-88410',
        payment_date: '2026-06-12'
      },
      {
        id: 'inv-103',
        tenant_id: 'nairobi-hosp',
        amount: 1200,
        status: 'overdue',
        due_date: '2026-06-01',
        description: 'Premium Monthly Subscription - June 2026'
      },
      {
        id: 'inv-104',
        tenant_id: 'gilgal',
        amount: 599,
        status: 'paid',
        due_date: '2026-06-15',
        description: 'Standard Plan Monthly Subscription - June 2026',
        payment_method: 'M-pesa',
        reference_number: 'MP-GIL-55021',
        payment_date: '2026-06-14'
      },
      {
        id: 'inv-105',
        tenant_id: 'gilgal',
        amount: 599,
        amount_paid: 300,
        status: 'partially_paid',
        due_date: '2026-07-15',
        description: 'Standard Plan Monthly Subscription - July 2026',
        payment_method: 'M-pesa',
        reference_number: 'MP-GIL-55106',
        payment_date: '2026-06-16'
      },
      {
        id: 'inv-106',
        tenant_id: 'apex-clinic',
        amount: 450,
        status: 'paid',
        due_date: '2026-06-10',
        description: 'Dental Practice Basic Subscription - June 2026',
        payment_method: 'Credit Card',
        reference_number: 'CC-APX-10244',
        payment_date: '2026-06-09'
      },
      {
        id: 'inv-107',
        tenant_id: 'nairobi-hosp',
        amount: 1200,
        status: 'paid',
        due_date: '2026-05-01',
        description: 'Premium Monthly Subscription - May 2026',
        payment_method: 'M-pesa',
        reference_number: 'MP-NRB-77420',
        payment_date: '2026-05-30'
      },
      {
        id: 'inv-108',
        tenant_id: 'nairobi-hosp',
        amount: 1200,
        status: 'unpaid',
        due_date: '2026-06-30',
        description: 'Premium Monthly Subscription - July 2026'
      }
    ]))
  }

  const invoiceSeed = JSON.parse(localStorage.getItem('hf_mock_invoices') || '[]')
  const isLegacyInvoiceSeed =
    Array.isArray(invoiceSeed) &&
    invoiceSeed.length <= 4 &&
    invoiceSeed.every((invoice: Invoice) => ['inv-101', 'inv-102', 'inv-103', 'inv-104'].includes(invoice.id))
  if (isLegacyInvoiceSeed) {
    localStorage.setItem(
      'hf_mock_invoices',
      JSON.stringify([
        {
          id: 'inv-101',
          tenant_id: 'aga-khan',
          amount: 2500,
          status: 'paid',
          due_date: '2026-05-31',
          description: 'Enterprise Monthly Subscription - May 2026',
          payment_method: 'Bank Transfer',
          reference_number: 'TXN-AK-88273',
          payment_date: '2026-05-28'
        },
        {
          id: 'inv-102',
          tenant_id: 'aga-khan',
          amount: 2500,
          amount_paid: 1500,
          status: 'partially_paid',
          due_date: '2026-06-30',
          description: 'Enterprise Monthly Subscription - June 2026',
          payment_method: 'Bank Transfer',
          reference_number: 'TXN-AK-88410',
          payment_date: '2026-06-12'
        },
        {
          id: 'inv-103',
          tenant_id: 'nairobi-hosp',
          amount: 1200,
          status: 'overdue',
          due_date: '2026-06-01',
          description: 'Premium Monthly Subscription - June 2026'
        },
        {
          id: 'inv-104',
          tenant_id: 'gilgal',
          amount: 599,
          status: 'paid',
          due_date: '2026-06-15',
          description: 'Standard Plan Monthly Subscription - June 2026',
          payment_method: 'M-pesa',
          reference_number: 'MP-GIL-55021',
          payment_date: '2026-06-14'
        },
        {
          id: 'inv-105',
          tenant_id: 'gilgal',
          amount: 599,
          amount_paid: 300,
          status: 'partially_paid',
          due_date: '2026-07-15',
          description: 'Standard Plan Monthly Subscription - July 2026',
          payment_method: 'M-pesa',
          reference_number: 'MP-GIL-55106',
          payment_date: '2026-06-16'
        },
        {
          id: 'inv-106',
          tenant_id: 'apex-clinic',
          amount: 450,
          status: 'paid',
          due_date: '2026-06-10',
          description: 'Dental Practice Basic Subscription - June 2026',
          payment_method: 'Credit Card',
          reference_number: 'CC-APX-10244',
          payment_date: '2026-06-09'
        },
        {
          id: 'inv-107',
          tenant_id: 'nairobi-hosp',
          amount: 1200,
          status: 'paid',
          due_date: '2026-05-01',
          description: 'Premium Monthly Subscription - May 2026',
          payment_method: 'M-pesa',
          reference_number: 'MP-NRB-77420',
          payment_date: '2026-05-30'
        },
        {
          id: 'inv-108',
          tenant_id: 'nairobi-hosp',
          amount: 1200,
          status: 'unpaid',
          due_date: '2026-06-30',
          description: 'Premium Monthly Subscription - July 2026'
        }
      ])
    )
  }

  if (!localStorage.getItem('hf_mock_admins')) {
    localStorage.setItem('hf_mock_admins', JSON.stringify([
      { keycloak_sub: 'sub-admin-1', username: 'admin', email: 'admin@hospitalflow.com', full_name: 'System Super Admin', role: 'super_admin' },
      { keycloak_sub: 'sub-admin-2', username: 'portal_lead', email: 'portal.lead@hospitalflow.com', full_name: 'Lead Infrastructure Manager', role: 'super_admin' }
    ]))
  }

  if (!localStorage.getItem('hf_mock_incidents')) {
    localStorage.setItem('hf_mock_incidents', JSON.stringify([
      { id: 'inc-1', title: 'Database Replication Lag', severity: 'critical', status: 'active', message: 'Active lag of 45s detected on US-East database read replica.', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'inc-2', title: 'API Gateway Latency Spike', severity: 'warning', status: 'resolved', message: 'Gateway response times spiked to 1200ms during peak load.', created_at: new Date(Date.now() - 3600000 * 24).toISOString(), resolved_at: new Date(Date.now() - 3600000 * 23).toISOString(), resolved_notes: 'Redundant replica nodes provisioned to handle peak traffic load.', resolved_by: 'Lead Infrastructure Manager' }
    ]))
  }

  if (!localStorage.getItem('hf_mock_announcements')) {
    localStorage.setItem('hf_mock_announcements', JSON.stringify([
      { id: 'ann-1', title: 'Scheduled Database Maintenance', message: 'The database will undergo scheduled index optimization on Sunday, June 14, from 01:00 AM to 03:00 AM UTC. Expect intermittent 502 gateway timeouts.', type: 'warning', scope: 'all', display_format: 'banner_modal', active: true, created_at: '2026-06-09T09:00:00Z' },
      { id: 'ann-2', title: 'New Billing Features Released', message: 'We have updated our subscription dashboard to show detailed invoice histories and PDF downloads.', type: 'info', scope: 'all', display_format: 'banner', active: true, created_at: '2026-06-05T12:00:00Z' }
    ]))
  }

  if (!localStorage.getItem('hf_mock_audit_logs')) {
    localStorage.setItem('hf_mock_audit_logs', JSON.stringify([
      { id: 'log-1', timestamp: '2026-06-09T10:14:02Z', actor: 'admin', action: 'TENANT_ONBOARD', details: 'Onboarded tenant Gilgal Medical Center', ip_address: '197.248.33.109' },
      { id: 'log-2', timestamp: '2026-06-09T11:00:30Z', actor: 'admin', action: 'SUBSCRIPTION_UPDATE', details: 'Configured grace period to 7 days for Gilgal Medical Center', ip_address: '197.248.33.109' },
      { id: 'log-3', timestamp: '2026-06-10T08:45:00Z', actor: 'portal_lead', action: 'TENANT_SUSPEND', details: 'Suspended Nairobi Hospital due to non-payment of invoice inv-103', ip_address: '102.133.45.18' }
    ]))
  }

  if (!localStorage.getItem('hf_mock_plans')) {
    localStorage.setItem('hf_mock_plans', JSON.stringify([
      { plan_id: 'basic', plan_name: 'Basic', description: 'Essential modules for small clinics', max_users: 10, max_patients: 10000, storage_gb: 10, modules_included: ['reception', 'triage', 'consultation'], monthly_price: 299, annual_price: 2990, uptime_sla_pct: 99.9, backup_frequency_hours: 24, is_active: true },
      { plan_id: 'standard', plan_name: 'Standard', description: 'Standard modules for medium general hospitals', max_users: 30, max_patients: 50000, storage_gb: 50, modules_included: ['reception', 'triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'billing'], monthly_price: 599, annual_price: 5990, uptime_sla_pct: 99.95, backup_frequency_hours: 12, is_active: true },
      { plan_id: 'premium', plan_name: 'Premium', description: 'Full clinical workflow and advanced tools for large networks', max_users: null, max_patients: null, storage_gb: 200, modules_included: ['reception', 'triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'billing', 'ward', 'notifications', 'reports'], monthly_price: 1199, annual_price: 11990, uptime_sla_pct: 99.99, backup_frequency_hours: 4, is_active: true }
    ]))
  }

  if (!localStorage.getItem('hf_mock_users')) {
    const defaultUsers = [
      {
        keycloak_sub: 'ST-1001',
        username: 'sarah.chen',
        email: 's.chen@muhimbili.go.tz',
        full_name: 'Dr. Sarah Chen',
        role: 'doctor',
        hospital_id: 'gilgal',
        phone: '712 345 678',
        landingDepartment: 'Consultation',
        additionalDepartments: ['Emergency Department', 'Radiology'],
        mfaEnabled: true,
        status: 'active',
        avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsFdwJlsoEY6YWqUIzmDuyNBBS_giKeGh6IjYOOy7Q-EY5W5fAQNKZL3HDwdPSwXKA78U_cMRLt_nslrSsHcY9ryh1PfVIUn9ZtMg84PIGbTeE-mMVs-Tnk4fJAulw3W0coEjqlWw8bWedLbW2QqIQswxG9Vq1F8-CaYZiSrwvd2GRgdPO8E5iNSZU2hgMwzP36sNtmOvvq-lbv830dbyCdwn5dMVi4AMuTuIjggH6dSJc0cSP49DzppYMc',
        createdAt: '2026-06-01'
      },
      {
        keycloak_sub: 'ST-1002',
        username: 'james.o',
        email: 'j.o@muhimbili.go.tz',
        full_name: 'Nurse James O.',
        role: 'nurse',
        hospital_id: 'gilgal',
        phone: '712 987 654',
        landingDepartment: 'Triage',
        additionalDepartments: ['Emergency Department'],
        mfaEnabled: true,
        status: 'active',
        avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLtrAwAy1k-muCJdZ_8Qx09eWqn8dUzlstfzbJLXK6u3YE2Ti0UHrqQr7MCaXC0fz7690sfJqWL9ivTACYrImVx7LphuaY__vgVJlbYK1ySkQKRJ7uZCS86vDr-ib1QnBNTtJtnRAJTATBNKB48t3dKlETUaIZ4LX3YQ4Qj86JX6JLVb4Ra56_PdD5WVLEdIcjIFjYb7gHWooxhM5DUqiWfvVdeQX1CV6PsuF8xPtQSPhboAi4nZ8ONOFMnc',
        createdAt: '2026-06-02'
      },
      {
        keycloak_sub: 'ST-1003',
        username: 'ali.m',
        email: 'a.m@muhimbili.go.tz',
        full_name: 'Tech Ali M.',
        role: 'tech',
        hospital_id: 'gilgal',
        phone: '712 111 222',
        landingDepartment: 'Laboratory',
        additionalDepartments: [],
        mfaEnabled: true,
        status: 'active',
        avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLttGcflTJkMQI6Om6qQ-pDJlZa2NlNycuozOul20T7KsNKwYjjfxQaop6wYRUyeiz2C6t7ivfOOPhUOS7F-xU6xHxiFzsPP0LJp_5o3BWTa9rR4IRqfCs-bWfQedR3q-Ck6Dgjh5xd0-z00Z5wz8uvGAvp3e_l2mLQbUpoT7xKefYWDQNxkoGM3WFE8gypH5E8Vzq9PTNWaxa4bYY7vUlNmRKcX4QaLUXw8pyrpzamjQthWZXJ3A7UxcQNU',
        createdAt: '2026-06-03'
      },
      {
        keycloak_sub: 'ST-1004',
        username: 'amina.hassan',
        email: 'a.hassan@muhimbili.go.tz',
        full_name: 'Dr. Amina Hassan',
        role: 'doctor',
        hospital_id: 'gilgal',
        phone: '712 555 999',
        landingDepartment: 'Cardiology',
        additionalDepartments: ['Consultation'],
        mfaEnabled: true,
        status: 'active',
        avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsFdwJlsoEY6YWqUIzmDuyNBBS_giKeGh6IjYOOy7Q-EY5W5fAQNKZL3HDwdPSwXKA78U_cMRLt_nslrSsHcY9ryh1PfVIUn9ZtMg84PIGbTeE-mMVs-Tnk4fJAulw3W0coEjqlWw8bWedLbW2QqIQswxG9Vq1F8-CaYZiSrwvd2GRgdPO8E5iNSZU2hgMwzP36sNtmOvvq-lbv830dbyCdwn5dMVi4AMuTuIjggH6dSJc0cSP49DzppYMc',
        createdAt: '2026-06-04'
      }
    ]
    for (let i = 5; i <= 18; i++) {
      defaultUsers.push({
        keycloak_sub: `ST-10${i < 10 ? '0' + i : i}`,
        username: `staff.${i}`,
        email: `staff.${i}@muhimbili.go.tz`,
        full_name: `Staff Member ${i}`,
        role: i % 3 === 0 ? 'doctor' : (i % 3 === 1 ? 'nurse' : 'admin'),
        hospital_id: 'gilgal',
        phone: `712 000 0${i}`,
        landingDepartment: i % 2 === 0 ? 'General Surgery' : 'Pediatrics',
        additionalDepartments: [],
        mfaEnabled: false,
        status: 'active',
        avatarUrl: '',
        createdAt: '2026-06-05'
      })
    }
    localStorage.setItem('hf_mock_users', JSON.stringify(defaultUsers))
  }

  if (!localStorage.getItem('hf_mock_departments')) {
    localStorage.setItem('hf_mock_departments', JSON.stringify([
      { id: 'DP-001', name: 'Reception', type: 'Administrative', staffCount: 12, queueCount: 12, status: 'success', alerts: 0, active: true },
      { id: 'DP-002', name: 'Triage', type: 'Clinical', staffCount: 8, queueCount: 5, status: 'success', alerts: 0, active: true },
      { id: 'DP-003', name: 'Consultation', type: 'Clinical', staffCount: 24, queueCount: 18, status: 'success', alerts: 0, active: true },
      { id: 'DP-004', name: 'Laboratory', type: 'Diagnostic', staffCount: 18, queueCount: 22, status: 'error', alerts: 1, active: true },
      { id: 'DP-005', name: 'Radiology', type: 'Diagnostic', staffCount: 15, queueCount: 3, status: 'success', alerts: 0, active: true },
      { id: 'DP-006', name: 'Pharmacy', type: 'Auxiliary', staffCount: 10, queueCount: 15, status: 'warning', alerts: 1, active: true },
      { id: 'DP-007', name: 'Billing', type: 'Administrative', staffCount: 6, queueCount: 2, status: 'success', alerts: 0, active: true },
      { id: 'DP-008', name: 'Ward', type: 'Inpatient', staffCount: 45, queueCount: 0, occupancy: 68, status: 'success', alerts: 0, active: true }
    ]))
  }

  if (!localStorage.getItem('hf_mock_dashboard_stats')) {
    localStorage.setItem('hf_mock_dashboard_stats', JSON.stringify({
      totalStaff: 47,
      onlineNow: 23,
      departmentsActive: 8,
      bedsOccupied: 34,
      totalBeds: 50
    }))
  }

  if (!localStorage.getItem('hf_mock_dashboard_alerts')) {
    localStorage.setItem('hf_mock_dashboard_alerts', JSON.stringify([
      { id: 'AL-001', severity: 'critical', department: 'Laboratory', message: 'Critical lab value for patient #PT-4421', timestamp: '5 min ago' },
      { id: 'AL-002', severity: 'warning', department: 'Pharmacy', message: 'Paracetamol stock below minimum level', timestamp: '12 min ago' },
      { id: 'AL-003', severity: 'info', department: 'System', message: 'Scheduled maintenance starting in 2 hours', timestamp: '1 hr ago' }
    ]))
  }

  if (!localStorage.getItem('hf_mock_active_sessions')) {
    const initialSessions = [
      { id: 'SES-9001', staffId: 'ST-1001', staffName: 'Dr. Sarah Chen', staffRole: 'Doctor', avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsFdwJlsoEY6YWqUIzmDuyNBBS_giKeGh6IjYOOy7Q-EY5W5fAQNKZL3HDwdPSwXKA78U_cMRLt_nslrSsHcY9ryh1PfVIUn9ZtMg84PIGbTeE-mMVs-Tnk4fJAulw3W0coEjqlWw8bWedLbW2QqIQswxG9Vq1F8-CaYZiSrwvd2GRgdPO8E5iNSZU2hgMwzP36sNtmOvvq-lbv830dbyCdwn5dMVi4AMuTuIjggH6dSJc0cSP49DzppYMc', department: 'Consultation', loginTime: '08:15 AM', duration: '2h 14m', device: 'MacBook Pro • Chrome', ipAddress: '196.43.12.89' },
      { id: 'SES-9002', staffId: 'ST-1002', staffName: 'Nurse James O.', staffRole: 'Nurse', avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLtrAwAy1k-muCJdZ_8Qx09eWqn8dUzlstfzbJLXK6u3YE2Ti0UHrqQr7MCaXC0fz7690sfJqWL9ivTACYrImVx7LphuaY__vgVJlbYK1ySkQKRJ7uZCS86vDr-ib1QnBNTtJtnRAJTATBNKB48t3dKlETUaIZ4LX3YQ4Qj86JX6JLVb4Ra56_PdD5WVLEdIcjIFjYb7gHWooxhM5DUqiWfvVdeQX1CV6PsuF8xPtQSPhboAi4nZ8ONOFMnc', department: 'Triage', loginTime: '07:45 AM', duration: '1h 41m', device: 'iPad Air • Safari', ipAddress: '196.43.12.92' },
      { id: 'SES-9003', staffId: 'ST-1003', staffName: 'Tech Ali M.', staffRole: 'Tech', avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLttGcflTJkMQI6Om6qQ-pDJlZa2NlNycuozOul20T7KsNKwYjjfxQaop6wYRUyeiz2C6t7ivfOOPhUOS7F-xU6xHxiFzsPP0LJp_5o3BWTa9rR4IRqfCs-bWfQedR3q-Ck6Dgjh5xd0-z00Z5wz8uvGAvp3e_l2mLQbUpoT7xKefYWDQNxkoGM3WFE8gypH5E8Vzq9PTNWaxa4bYY7vUlNmRKcX4QaLUXw8pyrpzamjQthWZXJ3A7UxcQNU', department: 'Laboratory', loginTime: '08:30 AM', duration: '57m', device: 'Windows Workstation • Edge', ipAddress: '196.43.12.101' }
    ]
    for (let i = 4; i <= 23; i++) {
      initialSessions.push({
        id: `SES-90${i < 10 ? '0' + i : i}`,
        staffId: `ST-10${i < 10 ? '0' + i : i}`,
        staffName: `Staff Member ${i}`,
        staffRole: i % 2 === 0 ? 'Nurse' : 'Doctor',
        avatarUrl: '',
        department: i % 3 === 0 ? 'General Surgery' : 'Pediatrics',
        loginTime: `07:${i < 10 ? '0' + i : i} AM`,
        device: 'Generic Desktop • Firefox',
        ipAddress: `196.43.12.${100 + i}`,
        duration: ''
      })
    }
    localStorage.setItem('hf_mock_active_sessions', JSON.stringify(initialSessions))
  }

  if (!localStorage.getItem('hf_mock_fees')) {
    localStorage.setItem('hf_mock_fees', JSON.stringify([
      { id: '1', name: 'General Consultation', category: 'CONSULTATION', amount: '15,000', currency: 'TZS', insuranceCovered: true, active: true },
      { id: '2', name: 'Full Blood Count', category: 'LAB', amount: '25,000', currency: 'TZS', insuranceCovered: true, active: true },
      { id: '3', name: 'Chest X-Ray', category: 'RADIOLOGY', amount: '45,000', currency: 'TZS', insuranceCovered: true, active: true },
      { id: '4', name: 'Paracetamol 500mg', category: 'PHARMACY', amount: '2,000', currency: 'TZS', insuranceCovered: false, active: true }
    ]))
  }

  if (!localStorage.getItem('hf_mock_insurance_providers')) {
    localStorage.setItem('hf_mock_insurance_providers', JSON.stringify([
      { id: '1', name: 'NHIF Tanzania', policies: ['Inpatient', 'Outpatient'], contactPerson: 'James Kimaro', email: 'james@nhif.go.tz', phone: '+255 22 xxx', active: true, notes: 'Standard public medical insurance coverage' },
      { id: '2', name: 'Jubilee Insurance', policies: ['Inpatient', 'Outpatient', 'Maternity'], contactPerson: '—', email: 'claims@jubilee.co.tz', phone: '—', active: true, notes: 'Private corporate group insurance package' },
      { id: '3', name: 'AAR Insurance', policies: ['Outpatient', 'Dental'], contactPerson: '—', email: 'aar@aar.co.tz', phone: '—', active: true, notes: 'Covers auxiliary clinical procedures' }
    ]))
  }

  if (!localStorage.getItem('hf_mock_hospital_audit_logs')) {
    localStorage.setItem('hf_mock_hospital_audit_logs', JSON.stringify([
      { id: '1', timestamp: '2026-06-09 09:14', staffName: 'Dr. Amina Hassan', staffRole: 'Doctor', action: 'DIAGNOSIS', department: 'Consultation', recordId: 'PT-4421', ipAddress: '192.168.1.104', details: 'Dr. Amina Hassan updated clinical findings for Patient #PT-4421. Diagnosis confirmed: Acute Respiratory Infection. Prescribed follow-up in 7 days.', signature: 'SHA-256: 8f92b...' },
      { id: '2', timestamp: '2026-06-09 09:02', staffName: 'Nurse Grace', staffRole: 'Nurse', action: 'PATIENT_REGISTER', department: 'Triage', recordId: 'PT-4421', ipAddress: '192.168.1.112', details: 'Nurse Grace registered patient entry in triage system.', signature: 'SHA-256: 7f13c...' },
      { id: '3', timestamp: '2026-06-09 08:55', staffName: 'John Baraka', staffRole: 'Receptionist', action: 'LOGIN', department: 'Reception', recordId: '—', ipAddress: '192.168.1.5', details: 'John Baraka completed secure terminal login session.', signature: 'SHA-256: 3b94a...' },
      { id: '4', timestamp: '2026-06-09 08:32', staffName: 'Lab Tech Sarah', staffRole: 'Tech', action: 'LAB_RESULT', department: 'Laboratory', recordId: 'LB-992', ipAddress: '192.168.1.45', details: 'Lab Tech Sarah pushed diagnostic laboratory record updates.', signature: 'SHA-256: c542e...' },
      { id: '5', timestamp: '2026-06-09 08:15', staffName: 'John Baraka', staffRole: 'Receptionist', action: 'PAYMENT', department: 'Reception', recordId: 'TX-1044', ipAddress: '192.168.1.5', details: 'John Baraka finalized bill settlement for txn #TX-1044.', signature: 'SHA-256: 9e32f...' },
      { id: '6', timestamp: '2026-06-09 07:45', staffName: 'Dr. Amina Hassan', staffRole: 'Doctor', action: 'DELETE', department: 'Consultation', recordId: 'REC-112', ipAddress: '192.168.1.104', details: 'Dr. Amina Hassan purged invalid consultation entry record #REC-112.', signature: 'SHA-256: a123b...' }
    ]))
  }

  if (!localStorage.getItem('hf_mock_wards')) {
    localStorage.setItem('hf_mock_wards', JSON.stringify([
      { id: 'w1', name: 'General Ward', occupiedBeds: 34, totalBeds: 50 },
      { id: 'w2', name: 'Intensive Care Unit (ICU)', occupiedBeds: 6, totalBeds: 8, isUrgent: true },
      { id: 'w3', name: 'Maternity Ward', occupiedBeds: 12, totalBeds: 20 }
    ]))
  }
}

initLocalStorage()

// Base64Url JWT encoder helper
function encodeMockToken(payload: Record<string, unknown>) {
  const str = JSON.stringify(payload)
  const base64 = btoa(unescape(encodeURIComponent(str)))
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `mockHeader.${base64url}.mockSignature`
}
const defaultAdapter = axios.getAdapter(axios.defaults.adapter) as any

apiClient.defaults.adapter = async (config) => {
  let url = config.url || ''
  const token = useAuthStore.getState().accessToken
  const isReadOnly = token ? isReadOnlyToken(token) : false
  let method = config.method ? config.method.toLowerCase() : 'get'
  const isWriteMethod = ['post', 'put', 'patch', 'delete'].includes(method)
  const isAuthExempt = url.includes('/auth/refresh') || url.includes('/auth/logout') || url.includes('/auth/logout-all')

  if (isReadOnly && isWriteMethod && !isAuthExempt) {
    return Promise.reject({
      response: {
        status: 403,
        statusText: 'Forbidden',
        data: { detail: 'Action not allowed: Support impersonation mode is read-only' },
        headers: {},
        config,
      },
      message: 'Request failed with status code 403',
      config,
      isAxiosError: true,
      toJSON: () => ({}),
    })
  }

  const useRealBackend =
    url.includes('/auth/login') ||
    url.includes('/auth/superadmin/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/logout-all') ||
    url.includes('/auth/password-reset') ||
    url.includes('/auth/mfa/') ||
    url.includes('/auth/impersonate') ||
    url.includes('/me') ||
    url.includes('/superadmin/') ||
    url.includes('/tenants') ||
    url.includes('/subscriptions') ||
    url.includes('/invoices') ||
    url.includes('/plans') ||
    url.includes('/finance') ||
    url.includes('/master-admins') ||
    url.includes('/monitoring') ||
    url.includes('/incidents')

  if (!MOCK_ENABLED || useRealBackend) {
    if (url.startsWith('/tenants')) {
      config.url = `/superadmin${url}`
    } else if (url.startsWith('/master-admins')) {
      config.url = `/superadmin/users`
    } else if (url.startsWith('/subscriptions')) {
      config.url = `/superadmin${url}`
    } else if (url.startsWith('/invoices')) {
      const methodLower = config.method?.toLowerCase()
      if (methodLower === 'post') {
        const bodyObj = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
        if (bodyObj && bodyObj.tenant_id) {
          config.url = `/superadmin/tenants/${bodyObj.tenant_id}/invoices`
        } else {
          config.url = `/superadmin${url}`
        }
      } else {
        config.url = `/superadmin${url}`
      }
    } else if (url.startsWith('/plans')) {
      config.url = `/superadmin${url}`
    } else if (url.startsWith('/finance')) {
      config.url = `/superadmin${url}`
    } else if (url.startsWith('/monitoring/health')) {
      const methodLower = config.method?.toLowerCase()
      if (methodLower === 'post') {
        config.url = `/superadmin/incidents`
      } else if (methodLower === 'patch') {
        const incId = url.split('/').pop()
        config.url = `/superadmin/incidents/${incId}`
      } else {
        config.url = `/superadmin/health`
      }
    } else if (url.startsWith('/monitoring/tenants/')) {
      const tenantId = url.split('/monitoring/tenants/')[1].split('/')[0]
      config.url = `/superadmin/tenants/${tenantId}/analytics`
    } else if (url.startsWith('/incidents')) {
      config.url = `/superadmin${url}`
    }
    if (defaultAdapter) return defaultAdapter(config)
  }

  url = config.url || ''
  method = config.method ? config.method.toLowerCase() : 'get'
  const data = config.data ? JSON.parse(config.data) : null
  const headers = (config.headers || {}) as Record<string, string | number | boolean>

  // Log mock routing
  console.log(`[MOCK API] ${method.toUpperCase()} ${url}`, data)

  // Wait simulated latency
  await new Promise((r) => setTimeout(r, 200))

  const respond = (status: number, responseData: unknown, responseHeaders: Record<string, string | string[]> = {}) => {
    return {
      data: responseData,
      status,
      statusText: status === 200 || status === 201 ? 'OK' : 'Error',
      headers: responseHeaders,
      config,
    } as unknown as AxiosResponse
  }

  // --- ROUTING IMPLEMENTATION ---

  // Auth: Login
  if (url.endsWith('/auth/login') && method === 'post') {
    const username = data.username.toLowerCase()
    
    let roles = ['hospital_admin']
    let tenantId: string | null = 'gilgal'
    
    // Quick Demo Role switches based on username
    if (username === 'admin' || username === 'superadmin' || username === 'portal_lead') {
      roles = ['super_admin']
      tenantId = null
    } else if (username === 'doctor') {
      roles = ['doctor']
    } else if (username === 'receptionist') {
      roles = ['receptionist']
    } else if (username === 'nurse') {
      roles = ['triage_nurse']
    } else if (username === 'pharmacist') {
      roles = ['pharmacist']
    } else if (username === 'cashier') {
      roles = ['cashier']
    }

    const payload = {
      sub: `mock-sub-${username}`,
      username: data.username,
      email: `${username}@hospitalflow.com`,
      realm_access: { roles },
      tenant_id: tenantId,
      exp: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
    }

    const accessToken = encodeMockToken(payload)
    const refreshToken = `mock-refresh-token-${username}`

    return respond(200, {
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  // Auth: Logout
  if (url.endsWith('/auth/logout') && method === 'post') {
    return respond(200, { message: 'Logged out successfully' })
  }

  // Auth: Logout All Sessions
  if (url.endsWith('/auth/logout-all') && method === 'post') {
    // Audit log this action
    const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
    const token = useAuthStore.getState().accessToken
    const userPayload = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : { username: 'admin' }
    
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: userPayload.username,
      action: 'SECURITY_FORCE_LOGOUT',
      details: 'Triggered global logout of all active client sessions across the platform',
      ip_address: '197.248.33.109'
    })
    localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))
    
    return respond(200, { message: 'All sessions terminated' })
  }

  // User: Me
  if (url.endsWith('/me') && method === 'get') {
    const token = headers.Authorization ? headers.Authorization.toString().replace('Bearer ', '') : ''
    if (!token) return respond(401, { detail: 'Not authenticated' })
    
    try {
      const payloadStr = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      const payload = JSON.parse(payloadStr)
      return respond(200, {
        keycloak_sub: payload.sub,
        username: payload.username,
        email: payload.email,
        full_name: payload.username.toUpperCase(),
        role: payload.realm_access.roles[0],
        hospital_id: payload.tenant_id,
      })
    } catch {
      return respond(401, { detail: 'Invalid token' })
    }
  }

  // User: Update Me
  if (url.endsWith('/me') && method === 'put') {
    return respond(200, { detail: 'Profile updated successfully' })
  }

  // User: Change Password
  if (url.endsWith('/me/password') && method === 'post') {
    const data = JSON.parse(config.data || '{}')
    if (data.current_password === 'wrong') {
      return respond(400, { detail: 'Invalid current password' })
    }
    return respond(200, { detail: 'Password changed successfully' })
  }

  // Master: Platform Admins
  if (url.endsWith('/master-admins')) {
    const admins = JSON.parse(localStorage.getItem('hf_mock_admins') || '[]')
    
    if (method === 'get') {
      return respond(200, admins)
    }
    
    if (method === 'post') {
      const newAdmin = {
        keycloak_sub: `sub-admin-${Date.now()}`,
        username: data.username,
        email: data.email,
        full_name: data.full_name || data.username.toUpperCase(),
        role: 'super_admin'
      }
      admins.push(newAdmin)
      localStorage.setItem('hf_mock_admins', JSON.stringify(admins))

      // Audit Log
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'ADMIN_CREATE',
        details: `Created platform administrator account: ${data.username}`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(201, newAdmin)
    }

    if (method === 'delete') {
      const { username } = data
      const updated = admins.filter((a: MasterAdminUser) => a.username !== username)
      localStorage.setItem('hf_mock_admins', JSON.stringify(updated))

      // Audit Log
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'ADMIN_DELETE',
        details: `Deleted platform administrator account: ${username}`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(200, { message: 'Admin deleted' })
    }
  }

  // Master: Impersonate Tenant Admin
  if (url.endsWith('/auth/impersonate') && method === 'post') {
    const { tenant_id } = data
    const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
    const hospital = tenants.find((t: Tenant) => t.tenant_id === tenant_id)
    
    if (!hospital) return respond(404, { detail: 'Tenant not found' })

    const payload = {
      sub: `impersonate-sub-${tenant_id}`,
      username: `impersonator_${tenant_id}`,
      email: `support@hospitalflow.com`,
      realm_access: { roles: ['hospital_admin'] },
      tenant_id: tenant_id,
      impersonator: true,
      scope: 'readonly',
      exp: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    }

    const impersonateToken = encodeMockToken(payload)
    
    // Audit Log
    const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'admin',
      action: 'IMPERSONATE_START',
      details: `Started support impersonation mode for tenant: ${hospital.hospital_name}`,
      ip_address: '197.248.33.109'
    })
    localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

    return respond(200, {
      access_token: impersonateToken,
      refresh_token: `mock-refresh-impersonate-${tenant_id}`,
    }, { 'x-impersonation-banner': 'true' })
  }

  // Master: Tenants CRUD
  if (url.includes('/tenants')) {
    const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
    const match = url.match(/\/tenants\/([a-zA-Z0-9-]+)/)
    const subTenantId = match ? match[1] : null

    if (method === 'get') {
      if (subTenantId) {
        const tenant = tenants.find((t: Tenant) => t.tenant_id === subTenantId)
        if (!tenant) return respond(404, { detail: 'Tenant not found' })
        return respond(200, tenant)
      }
      return respond(200, tenants)
    }

    if (method === 'post') {
      const newTenantId = `hosp-${data.hospital_name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 10)}-${Math.random().toString(36).substring(2, 6)}`
      
      const subPlans = JSON.parse(localStorage.getItem('hf_mock_plans') || '[]')
      const chosenPlan = subPlans.find((p: SubscriptionPlan) => p.plan_id === data.plan_id) || { plan_name: 'Basic' }
      
      const newTenant = {
        tenant_id: newTenantId,
        hospital_name: data.hospital_name,
        status: data.status || 'active',
        created_at: new Date().toISOString(),
        subscription_end: data.subscription_end || new Date(Date.now() + 3600000 * 24 * 30).toISOString(),
        country: data.country || 'Tanzania',
        city: data.city || 'Dar es Salaam',
        address: data.address || '',
        timezone: data.timezone || 'Africa/Dar_es_Salaam',
        currency: data.currency || 'TZS',
        logo: data.logo_url || data.logo || '',
        data_region: data.data_region || 'AF-East',
        contact_name: data.primary_contact_name || data.admin_full_name || 'Admin',
        contact_email: data.primary_contact_email || data.admin_email || '',
        contact_phone: data.primary_contact_phone || data.contact_phone || '',
        billing_email: data.billing_email || data.admin_email || '',
        tax_id: data.tax_id || '',
        grace_days: Number(data.grace_days) || 14,
        nas_backup_path: data.nas_backup_path || '',
        secondary_contact_name: data.secondary_contact_name || '',
        secondary_contact_phone: data.secondary_contact_phone || '',
        maintenance_mode: false,
        mfa_enforced: true,
        rate_limit: 1000,
        storage_gb: chosenPlan.storage_gb || 10
      }

      tenants.push(newTenant)
      localStorage.setItem('hf_mock_tenants', JSON.stringify(tenants))

      // Also create subscription
      const subscriptions = JSON.parse(localStorage.getItem('hf_mock_subscriptions') || '[]')
      subscriptions.push({
        id: `sub-${Date.now()}`,
        tenant_id: newTenantId,
        plan_name: chosenPlan.plan_name,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: newTenant.subscription_end,
        grace_period_days: newTenant.grace_days,
        auto_renew: true
      })
      localStorage.setItem('hf_mock_subscriptions', JSON.stringify(subscriptions))

      // Audit Log
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'TENANT_ONBOARD',
        details: `Created and onboarded tenant: ${data.hospital_name} (ID: ${newTenantId}) under plan ${chosenPlan.plan_name}`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(201, newTenant)
    }

    if (method === 'patch' && subTenantId) {
      const index = tenants.findIndex((t: Tenant) => t.tenant_id === subTenantId)
      if (index === -1) return respond(404, { detail: 'Tenant not found' })

      tenants[index] = { ...tenants[index], ...data }
      localStorage.setItem('hf_mock_tenants', JSON.stringify(tenants))

      // Audit Log for status updates
      if (data.status) {
        let action = 'TENANT_UPDATE'
        let details = `Updated tenant status of ${tenants[index].hospital_name} to: ${data.status.toUpperCase()}`
        if (data.status === 'suspended') {
          action = 'TENANT_SUSPEND'
          details = `Suspended tenant ${tenants[index].hospital_name}. Reason: ${data.suspension_reason || 'Administrative decision'}`
        }
        if (data.status === 'active') action = 'TENANT_REACTIVATE'
        if (data.status === 'terminated') action = 'TENANT_TERMINATE'

        const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'admin',
          action: action,
          details: details,
          ip_address: '197.248.33.109'
        })
        localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))
      }

      return respond(200, tenants[index])
    }
  }


  // Master: Subscriptions
  if (url.includes('/subscriptions')) {
    const subscriptions = JSON.parse(localStorage.getItem('hf_mock_subscriptions') || '[]')
    
    if (method === 'get') {
      const params = config.params || {}
      if (params.tenant_id) {
        return respond(200, subscriptions.filter((s: Subscription) => s.tenant_id === params.tenant_id))
      }
      return respond(200, subscriptions)
    }

    if (method === 'patch' || method === 'post') {
      // Create/Update sub details (plan upgrade, downgrades)
      const subId = url.split('/').pop() || ''
      const index = subscriptions.findIndex((s: Subscription) => s.id === subId || s.tenant_id === data.tenant_id)
      
      let sub = null
      if (index !== -1) {
        subscriptions[index] = { ...subscriptions[index], ...data }
        sub = subscriptions[index]
      } else {
        sub = {
          id: `sub-${Date.now()}`,
          ...data
        }
        subscriptions.push(sub)
      }
      localStorage.setItem('hf_mock_subscriptions', JSON.stringify(subscriptions))

      // Update subscription end in Tenant profile as well
      if (data.end_date) {
        const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
        const tIndex = tenants.findIndex((t: Tenant) => t.tenant_id === sub.tenant_id)
        if (tIndex !== -1) {
          tenants[tIndex].subscription_end = data.end_date
          localStorage.setItem('hf_mock_tenants', JSON.stringify(tenants))
        }
      }

      // Audit Log
      const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
      const targetHospital = tenants.find((t: Tenant) => t.tenant_id === sub.tenant_id)?.hospital_name || sub.tenant_id
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'SUBSCRIPTION_UPDATE',
        details: `Updated subscription for ${targetHospital}: Plan = ${data.plan_name || sub.plan_name}, Status = ${data.status || sub.status}`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(200, sub)
    }
  }

  // Master: Invoices
  if (url.includes('/invoices')) {
    const invoices = JSON.parse(localStorage.getItem('hf_mock_invoices') || '[]')
    const match = url.match(/\/invoices\/([a-zA-Z0-9-]+)/)
    const subInvId = match ? match[1] : null

    if (method === 'get') {
      const params = config.params || {}
      if (params.tenant_id) {
        return respond(200, invoices.filter((i: Invoice) => i.tenant_id === params.tenant_id))
      }
      return respond(200, invoices)
    }

    if (method === 'post') {
      const newInv = {
        id: `inv-${Date.now().toString().slice(-6)}`,
        tenant_id: data.tenant_id,
        amount: Number(data.amount),
        status: data.status || 'unpaid',
        due_date: data.due_date || new Date(Date.now() + 3600000 * 24 * 14).toISOString().split('T')[0], // 14 days due
        description: data.description || 'Custom Billing Invoice',
      }
      invoices.unshift(newInv)
      localStorage.setItem('hf_mock_invoices', JSON.stringify(invoices))

      // Audit Log
      const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
      const hospitalName = tenants.find((t: Tenant) => t.tenant_id === data.tenant_id)?.hospital_name || data.tenant_id
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'INVOICE_GENERATE',
        details: `Generated invoice ${newInv.id} of $${newInv.amount} for ${hospitalName}`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(201, newInv)
    }

    if (method === 'patch' && subInvId) {
      const index = invoices.findIndex((i: Invoice) => i.id === subInvId)
      if (index === -1) return respond(404, { detail: 'Invoice not found' })

      invoices[index] = { ...invoices[index], ...data }
      localStorage.setItem('hf_mock_invoices', JSON.stringify(invoices))

      // Audit Log (e.g. payment recorded)
      if (data.status === 'paid') {
        const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
        const hospitalName = tenants.find((t: Tenant) => t.tenant_id === invoices[index].tenant_id)?.hospital_name || invoices[index].tenant_id
        const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'admin',
          action: 'PAYMENT_RECORD',
          details: `Recorded payment of $${invoices[index].amount} for invoice ${invoices[index].id} (${hospitalName}) via ${data.payment_method}`,
          ip_address: '197.248.33.109'
        })
        localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))
      }

      return respond(200, invoices[index])
    }
  }

  // New: System Health / Incident Alerts Telemetry
  if (url.includes('/monitoring/health')) {
    const incidents: MockIncident[] = JSON.parse(localStorage.getItem('hf_mock_incidents') || '[]')
    
    if (method === 'get') {
      // Simulate real-time fluctuated telemetry
      const activeUsersCount = Math.floor(Math.random() * 40) + 120 // 120-160 users active
      const cpuUsage = Math.floor(Math.random() * 10) + 22 // 22-32%
      const ramUsage = 58 // static 58%
      const diskUsage = 71 // static 71%
      const uptime = '99.98%'

      const cpuHistory = [45, 48, 52, 49, 47, 53, 58, 62, 55, 50, 48, cpuUsage]
      const ramHistory = [68, 68, 69, 69, 70, 70, 71, 71, 70, 70, 69, ramUsage]
      const diskHistory = [72, 72, 72, 72, 72, 72, 72, 72, 72, 72, 72, diskUsage]
      const dbHistory = [32, 34, 38, 35, 33, 40, 42, 45, 41, 38, 36, Math.floor(activeUsersCount * 0.35) + 12]

      return respond(200, {
        telemetry: {
          uptime,
          active_users: activeUsersCount,
          cpu_usage: cpuUsage,
          ram_usage: ramUsage,
          disk_usage: diskUsage,
          history: {
            cpu: cpuHistory,
            ram: ramHistory,
            disk: diskHistory,
            db: dbHistory
          }
        },
        incidents
      })
    }

    if (method === 'post') {
      const newInc = {
        id: `inc-${Date.now()}`,
        title: data.title,
        severity: data.severity || 'warning',
        status: 'active',
        message: data.message,
        created_at: new Date().toISOString()
      }
      incidents.unshift(newInc)
      localStorage.setItem('hf_mock_incidents', JSON.stringify(incidents))

      // Audit Log
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'INCIDENT_CREATE',
        details: `Published system incident: [${data.severity.toUpperCase()}] ${data.title}`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(201, newInc)
    }

    if (method === 'patch') {
      const incId = url.split('/').pop() || ''
      const index = incidents.findIndex((i: MockIncident) => i.id === incId)
      if (index === -1) return respond(404, { detail: 'Incident not found' })

      incidents[index] = { ...incidents[index], ...data }
      localStorage.setItem('hf_mock_incidents', JSON.stringify(incidents))

      // Audit Log
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'INCIDENT_RESOLVE',
        details: `Resolved system incident: ${incidents[index].title}`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(200, incidents[index])
    }
  }

  // Query tenant analytics details
  if (url.includes('/monitoring/tenants/') && url.endsWith('/analytics') && method === 'get') {
    const tenantId = url.split('/monitoring/tenants/')[1].split('/')[0]
    const code0 = tenantId.charCodeAt(0) || 100
    const code1 = tenantId.charCodeAt(1) || 100
    const code2 = tenantId.charCodeAt(2) || 100

    const uptimeTrend = [99.8 + (code0 % 10)/100, 99.8 + (code1 % 10)/100, 99.8 + (code2 % 10)/100, 99.9, 99.95, 99.88, 99.92]
    const activeUsersPeak = [code0 % 30 + 10, code1 % 30 + 15, code2 % 30 + 20, code0 % 20 + 30, code1 % 20 + 25, code2 % 20 + 10, code0 % 20 + 8]
    const storageGrowth = [code0 % 20 + 10, code0 % 20 + 12, code1 % 20 + 15, code1 % 20 + 18, code2 % 20 + 22, code2 % 20 + 25, code0 % 60 + 15]

    return respond(200, {
      uptime_trend: uptimeTrend,
      active_users_peak: activeUsersPeak,
      storage_growth: storageGrowth,
      module_usage: [
        { module: 'OPD Module', percentage: 40 },
        { module: 'IPD Module', percentage: 25 },
        { module: 'Pharmacy', percentage: 20 },
        { module: 'Lab & Diagnostics', percentage: 15 }
      ],
      activity_logs: [
        { timestamp: '10:15 AM', event: 'Automated NAS backup completed', details: 'Backup size: 4.2 GB. File transfer verified successfully.' },
        { timestamp: '09:30 AM', event: 'API key renewed for external gateway integration', details: 'Triggered by admin configuration update.' },
        { timestamp: '08:00 AM', event: 'Nurse shift handover completed', details: 'Established 12 new nurse sessions across OPD/IPD wards.' }
      ]
    })
  }

  // Calculate monthly revenue
  if (url.includes('/finance/revenue-history') && method === 'get') {
    const invoices = JSON.parse(localStorage.getItem('hf_mock_invoices') || '[]')
    const nowTime = new Date()
    const currentMonthTotal = invoices
      .filter((p: Invoice) => {
        if (p.status !== 'paid' && p.status !== 'partially_paid') return false
        if (!p.payment_date) return false
        const d = new Date(p.payment_date)
        return d.getMonth() === nowTime.getMonth() && d.getFullYear() === nowTime.getFullYear()
      })
      .reduce((sum: number, p: Invoice) => sum + (p.amount_paid || p.amount), 0)

    const junRevenue = currentMonthTotal || 24000
    return respond(200, {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      revenue: [12500, 14200, 11800, 16500, 18200, junRevenue]
    })
  }

  // New: Announcements CRUD
  if (url.includes('/announcements')) {
    const announcements: MockAnnouncement[] = JSON.parse(localStorage.getItem('hf_mock_announcements') || '[]')

    if (method === 'get') {
      return respond(200, announcements)
    }

    if (method === 'post') {
      const newAnn = {
        id: `ann-${Date.now()}`,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        scope: data.scope || 'all',
        display_format: data.display_format || 'banner',
        active: true,
        created_at: new Date().toISOString()
      }
      announcements.unshift(newAnn)
      localStorage.setItem('hf_mock_announcements', JSON.stringify(announcements))

      // Audit Log
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'ANNOUNCEMENT_CREATE',
        details: `Broadcasted system announcement: ${data.title} (Target: ${data.scope})`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(201, newAnn)
    }

    if (method === 'patch') {
      const annId = url.split('/').pop() || ''
      const index = announcements.findIndex((a: MockAnnouncement) => a.id === annId)
      if (index === -1) return respond(404, { detail: 'Announcement not found' })

      announcements[index] = { ...announcements[index], ...data }
      localStorage.setItem('hf_mock_announcements', JSON.stringify(announcements))

      return respond(200, announcements[index])
    }
  }

  // Master: Plans CRUD
  if (url.includes('/plans')) {
    const plans = JSON.parse(localStorage.getItem('hf_mock_plans') || '[]')
    const match = url.match(/\/plans\/([a-zA-Z0-9-]+)/)
    const planId = match ? match[1] : null

    if (method === 'get') {
      if (planId) {
        const plan = plans.find((p: SubscriptionPlan) => p.plan_id === planId)
        if (!plan) return respond(404, { detail: 'Plan not found' })
        return respond(200, plan)
      }
      return respond(200, plans)
    }

    if (method === 'post') {
      const newPlanId = data.plan_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const newPlan = {
        plan_id: newPlanId,
        is_active: true,
        created_at: new Date().toISOString(),
        ...data
      }
      plans.push(newPlan)
      localStorage.setItem('hf_mock_plans', JSON.stringify(plans))
      return respond(201, newPlan)
    }

    if (method === 'patch' && planId) {
      const index = plans.findIndex((p: SubscriptionPlan) => p.plan_id === planId)
      if (index === -1) return respond(404, { detail: 'Plan not found' })

      plans[index] = { ...plans[index], ...data }
      localStorage.setItem('hf_mock_plans', JSON.stringify(plans))
      return respond(200, plans[index])
    }
  }

  // New: Global Audit Logs Query
  if (url.endsWith('/audit-logs') && method === 'get') {
    const logs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
    return respond(200, logs)
  }

  // Hospital Admin: Users CRUD
  if (url.includes('/users')) {
    const users = JSON.parse(localStorage.getItem('hf_mock_users') || '[]')

    if (url.endsWith('/users')) {
      if (method === 'get') {
        return respond(200, users)
      }
      if (method === 'post') {
        const newSub = `ST-10${users.length + 5}`
        const newUser = {
          keycloak_sub: newSub,
          username: data.username,
          email: data.email,
          full_name: data.full_name || data.username,
          role: data.role,
          hospital_id: 'gilgal',
          phone: data.phone || '712 000 000',
          landingDepartment: data.landingDepartment || 'Consultation',
          additionalDepartments: data.additionalDepartments || [],
          mfaEnabled: data.mfaEnabled || false,
          status: 'active',
          avatarUrl: data.avatarUrl || '',
          createdAt: new Date().toISOString().split('T')[0]
        }
        users.push(newUser)
        localStorage.setItem('hf_mock_users', JSON.stringify(users))

        // Audit Log
        const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'admin',
          action: 'USER_CREATE',
          details: `Created user account: ${newUser.username} (${newUser.role})`,
          ip_address: '197.248.33.109'
        })
        localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

        return respond(201, newUser)
      }
    } else if (url.endsWith('/deactivate')) {
      const parts = url.split('/')
      const sub = parts[parts.length - 2]
      const index = users.findIndex((u: HospitalUser) => u.keycloak_sub === sub)
      if (index === -1) return respond(404, { detail: 'User not found' })

      users[index].status = 'inactive'
      localStorage.setItem('hf_mock_users', JSON.stringify(users))
      return respond(200, { message: 'User deactivated' })
    } else {
      const sub = url.split('/').pop() || ''
      const index = users.findIndex((u: HospitalUser) => u.keycloak_sub === sub)

      if (method === 'patch') {
        if (index === -1) return respond(404, { detail: 'User not found' })
        const updatedFields: Partial<HospitalUser> = {}
        if (data.email !== undefined) updatedFields.email = data.email
        if (data.full_name !== undefined) updatedFields.full_name = data.full_name
        if (data.role !== undefined) updatedFields.role = data.role
        if (data.phone !== undefined) updatedFields.phone = data.phone
        if (data.landingDepartment !== undefined) updatedFields.landingDepartment = data.landingDepartment
        if (data.additionalDepartments !== undefined) updatedFields.additionalDepartments = data.additionalDepartments
        if (data.mfaEnabled !== undefined) updatedFields.mfaEnabled = data.mfaEnabled
        if (data.status !== undefined) updatedFields.status = data.status

        users[index] = { ...users[index], ...updatedFields }
        localStorage.setItem('hf_mock_users', JSON.stringify(users))
        return respond(200, users[index])
      }

      if (method === 'delete') {
        const filtered = users.filter((u: HospitalUser) => u.keycloak_sub !== sub)
        localStorage.setItem('hf_mock_users', JSON.stringify(filtered))
        return respond(200, { message: 'User deleted' })
      }
    }
  }

  // Hospital Admin: Departments
  if (url.endsWith('/departments') && method === 'get') {
    const departments = JSON.parse(localStorage.getItem('hf_mock_departments') || '[]')
    return respond(200, departments)
  }

  // Hospital Admin: Dashboard Stats
  if (url.endsWith('/dashboard/stats') && method === 'get') {
    const stats = JSON.parse(localStorage.getItem('hf_mock_dashboard_stats') || '{}')
    return respond(200, stats)
  }

  // Hospital Admin: Dashboard Alerts
  if (url.endsWith('/dashboard/alerts') && method === 'get') {
    const alerts = JSON.parse(localStorage.getItem('hf_mock_dashboard_alerts') || '[]')
    return respond(200, alerts)
  }

  // Hospital Admin: Fee Schedules
  if (url.includes('/fee-schedules')) {
    const fees = JSON.parse(localStorage.getItem('hf_mock_fees') || '[]')
    if (url.endsWith('/fee-schedules')) {
      if (method === 'get') {
        return respond(200, fees)
      }
      if (method === 'post') {
        const newFee: FeeItem = {
          id: `FEE-${Date.now().toString().slice(-4)}`,
          name: data.name,
          category: data.category,
          amount: data.amount,
          currency: data.currency || 'TZS',
          insuranceCovered: data.insuranceCovered || false,
          active: data.active !== undefined ? data.active : true
        }
        fees.push(newFee)
        localStorage.setItem('hf_mock_fees', JSON.stringify(fees))
        return respond(201, newFee)
      }
    } else {
      const id = url.split('/').pop() || ''
      const index = fees.findIndex((f: FeeItem) => f.id === id)
      if (method === 'patch') {
        if (index === -1) return respond(404, { detail: 'Fee item not found' })
        fees[index] = { ...fees[index], ...data }
        localStorage.setItem('hf_mock_fees', JSON.stringify(fees))
        return respond(200, fees[index])
      }
      if (method === 'delete') {
        const filtered = fees.filter((f: FeeItem) => f.id !== id)
        localStorage.setItem('hf_mock_fees', JSON.stringify(filtered))
        return respond(200, { message: 'Fee item deleted' })
      }
    }
  }

  // Hospital Admin: Insurance Providers
  if (url.includes('/insurance-providers')) {
    const providers = JSON.parse(localStorage.getItem('hf_mock_insurance_providers') || '[]')
    if (url.endsWith('/insurance-providers')) {
      if (method === 'get') {
        return respond(200, providers)
      }
      if (method === 'post') {
        const newProvider: Provider = {
          id: `PROV-${Date.now().toString().slice(-4)}`,
          name: data.name,
          policies: data.policies || [],
          contactPerson: data.contactPerson || '—',
          email: data.email || '—',
          phone: data.phone || '—',
          active: data.active !== undefined ? data.active : true,
          notes: data.notes
        }
        providers.push(newProvider)
        localStorage.setItem('hf_mock_insurance_providers', JSON.stringify(providers))
        return respond(201, newProvider)
      }
    } else {
      const id = url.split('/').pop() || ''
      const index = providers.findIndex((p: Provider) => p.id === id)
      if (method === 'patch') {
        if (index === -1) return respond(404, { detail: 'Provider not found' })
        providers[index] = { ...providers[index], ...data }
        localStorage.setItem('hf_mock_insurance_providers', JSON.stringify(providers))
        return respond(200, providers[index])
      }
      if (method === 'delete') {
        const filtered = providers.filter((p: Provider) => p.id !== id)
        localStorage.setItem('hf_mock_insurance_providers', JSON.stringify(filtered))
        return respond(200, { message: 'Provider deleted' })
      }
    }
  }

  // Hospital Admin: Hospital Audit Logs Query
  if (url.endsWith('/hospital-audit-logs') && method === 'get') {
    const logs = JSON.parse(localStorage.getItem('hf_mock_hospital_audit_logs') || '[]')
    return respond(200, logs)
  }

  // Hospital Admin: Wards CRUD
  if (url.includes('/wards')) {
    const wards = JSON.parse(localStorage.getItem('hf_mock_wards') || '[]')
    if (url.endsWith('/wards')) {
      if (method === 'get') {
        return respond(200, wards)
      }
      if (method === 'post') {
        const newWard: WardItem = {
          id: `w${wards.length + 1}-${Date.now().toString().slice(-2)}`,
          name: data.name,
          occupiedBeds: data.occupiedBeds || 0,
          totalBeds: data.totalBeds || 0,
          isUrgent: data.isUrgent || false
        }
        wards.push(newWard)
        localStorage.setItem('hf_mock_wards', JSON.stringify(wards))
        return respond(201, newWard)
      }
    } else {
      const id = url.split('/').pop() || ''
      const index = wards.findIndex((w: WardItem) => w.id === id)
      if (method === 'patch') {
        if (index === -1) return respond(404, { detail: 'Ward not found' })
        wards[index] = { ...wards[index], ...data }
        localStorage.setItem('hf_mock_wards', JSON.stringify(wards))
        return respond(200, wards[index])
      }
    }
  }

  // Hospital Admin: Departments PATCH (toggle active)
  if (url.includes('/departments/') && method === 'patch') {
    const departments = JSON.parse(localStorage.getItem('hf_mock_departments') || '[]')
    const id = url.split('/').pop() || ''
    const index = departments.findIndex((d: Department) => d.id === id)
    if (index === -1) return respond(404, { detail: 'Department not found' })
    departments[index] = { ...departments[index], ...data }
    localStorage.setItem('hf_mock_departments', JSON.stringify(departments))
    return respond(200, departments[index])
  }

  // Hospital Admin: Sessions CRUD
  if (url.includes('/sessions')) {
    const sessions = JSON.parse(localStorage.getItem('hf_mock_active_sessions') || '[]')
    if (url.endsWith('/sessions') && method === 'get') {
      return respond(200, sessions)
    }
    if (method === 'delete') {
      const sessionId = url.split('/').pop() || ''
      const filtered = sessions.filter((s: ActiveSession) => s.id !== sessionId)
      localStorage.setItem('hf_mock_active_sessions', JSON.stringify(filtered))
      return respond(200, { message: 'Session revoked' })
    }
  }

  // Default fallback if route not mocked
  if (defaultAdapter) {
    return defaultAdapter(config)
  }
  return Promise.reject(new Error(`[MOCK API ERROR] Route not implemented: ${method.toUpperCase()} ${url}`))
}

// Global response error interceptor for auth refresh
let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

apiClient.interceptors.response.use(
  (response) => {
    if (response.headers && response.headers['x-impersonation-banner'] === 'true') {
      useAuthStore.setState({ isImpersonating: true, isReadOnly: true })
    }
    return response
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = getStoredRefreshToken()
    if (!refreshToken) {
      useAuthStore.getState().clearAuth()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) {
            reject(error)
            return
          }
          original.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(original))
        })
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<TokenResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
      )
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token)
      processQueue(data.access_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return apiClient(original)
    } catch {
      useAuthStore.getState().clearAuth()
      processQueue(null)
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)
