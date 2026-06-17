import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import { useAuthStore, getStoredRefreshToken } from '@/store/authStore'
import type { TokenResponse } from '@/api/types/auth'

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

// MOCK API LAYER & PERSISTENT LOCAL STORAGE STATE
const MOCK_ENABLED = true // Frontend-only flow enabled by default

// Initial Mock Data Helpers
const initLocalStorage = () => {
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
      { id: 'sub-1', tenant_id: 'aga-khan', plan_name: 'Enterprise', status: 'active', start_date: '2025-01-10T08:00:00Z', end_date: '2026-12-31T23:59:59Z' },
      { id: 'sub-2', tenant_id: 'gilgal', plan_name: 'Standard', status: 'active', start_date: '2026-05-15T10:30:00Z', end_date: '2026-07-15T23:59:59Z' },
      { id: 'sub-3', tenant_id: 'nairobi-hosp', plan_name: 'Premium', status: 'suspended', start_date: '2025-06-01T14:15:00Z', end_date: '2026-06-01T23:59:59Z' }
    ]))
  }

  if (!localStorage.getItem('hf_mock_invoices')) {
    localStorage.setItem('hf_mock_invoices', JSON.stringify([
      { id: 'inv-101', tenant_id: 'aga-khan', amount: 2500, status: 'paid', due_date: '2026-05-31', description: 'Enterprise Monthly Subscription - May 2026', payment_method: 'Bank Transfer', reference_number: 'TXN-AK-88273', payment_date: '2026-05-28' },
      { id: 'inv-102', tenant_id: 'aga-khan', amount: 2500, status: 'unpaid', due_date: '2026-06-30', description: 'Enterprise Monthly Subscription - June 2026' },
      { id: 'inv-103', tenant_id: 'nairobi-hosp', amount: 1200, status: 'overdue', due_date: '2026-06-01', description: 'Premium Monthly Subscription - June 2026' },
      { id: 'inv-104', tenant_id: 'gilgal', amount: 0, status: 'paid', due_date: '2026-06-15', description: 'Standard Plan Trial Period', payment_method: 'Promo Code', reference_number: 'TRIAL-FREE', payment_date: '2026-05-15' }
    ]))
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
      { id: 'inc-2', title: 'API Gateway Latency Spike', severity: 'warning', status: 'resolved', message: 'Gateway response times spiked to 1200ms during peak load.', created_at: new Date(Date.now() - 3600000 * 24).toISOString() }
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
}

initLocalStorage()

// Base64Url JWT encoder helper
function encodeMockToken(payload: any) {
  const str = JSON.stringify(payload)
  const base64 = btoa(unescape(encodeURIComponent(str)))
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `mockHeader.${base64url}.mockSignature`
}
const defaultAdapter = axios.getAdapter(axios.defaults.adapter) as any

apiClient.defaults.adapter = async (config) => {
  let url = config.url || ''
  const useRealBackend =
    url.includes('/auth/login') ||
    url.includes('/auth/superadmin/login') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/logout-all') ||
    url.includes('/auth/password-reset') ||
    url.includes('/auth/mfa/') ||
    url.includes('/me') ||
    url.includes('/superadmin/') ||
    url.includes('/tenants') ||
    url.includes('/master-admins')

  if (!MOCK_ENABLED || useRealBackend) {
    if (url.startsWith('/tenants')) {
      config.url = `/superadmin${url}`
    } else if (url.startsWith('/master-admins')) {
      config.url = `/superadmin/users`
    }
    if (defaultAdapter) return defaultAdapter(config)
  }

  url = config.url || ''
  const method = config.method ? config.method.toLowerCase() : 'get'
  const data = config.data ? JSON.parse(config.data) : null
  const headers = config.headers || {}

  // Log mock routing
  console.log(`[MOCK API] ${method.toUpperCase()} ${url}`, data)

  // Wait simulated latency
  await new Promise((r) => setTimeout(r, 200))

  const respond = (status: number, responseData: any, responseHeaders: any = {}) => {
    return {
      data: responseData,
      status,
      statusText: status === 200 || status === 201 ? 'OK' : 'Error',
      headers: responseHeaders,
      config,
    } as any
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
      const updated = admins.filter((a: any) => a.username !== username)
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
    const hospital = tenants.find((t: any) => t.tenant_id === tenant_id)
    
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
        const tenant = tenants.find((t: any) => t.tenant_id === subTenantId)
        if (!tenant) return respond(404, { detail: 'Tenant not found' })
        return respond(200, tenant)
      }
      return respond(200, tenants)
    }

    if (method === 'post') {
      const newTenantId = data.hospital_name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const newTenant = {
        tenant_id: newTenantId,
        hospital_name: data.hospital_name,
        status: 'active',
        created_at: new Date().toISOString(),
        subscription_end: new Date(Date.now() + 3600000 * 24 * 30).toISOString(), // 30 days trial
        country: data.country || 'Kenya',
        city: data.city || 'Nairobi',
        address: data.address || '',
        timezone: data.timezone || 'Africa/Nairobi',
        currency: data.currency || 'TSH',
        logo: data.logo || '',
        data_region: data.data_region || 'AF-South',
        contact_name: data.admin_full_name || data.admin_username,
        contact_email: data.admin_email || '',
        contact_phone: data.contact_phone || '',
        grace_days: 14
      }

      tenants.push(newTenant)
      localStorage.setItem('hf_mock_tenants', JSON.stringify(tenants))

      // Also create subscription
      const subscriptions = JSON.parse(localStorage.getItem('hf_mock_subscriptions') || '[]')
      subscriptions.push({
        id: `sub-${Date.now()}`,
        tenant_id: newTenantId,
        plan_name: 'Trial',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: newTenant.subscription_end
      })
      localStorage.setItem('hf_mock_subscriptions', JSON.stringify(subscriptions))

      // Audit Log
      const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'admin',
        action: 'TENANT_ONBOARD',
        details: `Created and activated tenant: ${data.hospital_name} (ID: ${newTenantId})`,
        ip_address: '197.248.33.109'
      })
      localStorage.setItem('hf_mock_audit_logs', JSON.stringify(auditLogs))

      return respond(201, newTenant)
    }

    if (method === 'patch' && subTenantId) {
      const index = tenants.findIndex((t: any) => t.tenant_id === subTenantId)
      if (index === -1) return respond(404, { detail: 'Tenant not found' })

      tenants[index] = { ...tenants[index], ...data }
      localStorage.setItem('hf_mock_tenants', JSON.stringify(tenants))

      // Audit Log for status updates
      if (data.status) {
        let action = 'TENANT_UPDATE'
        if (data.status === 'suspended') action = 'TENANT_SUSPEND'
        if (data.status === 'active') action = 'TENANT_REACTIVATE'
        if (data.status === 'terminated') action = 'TENANT_TERMINATE'

        const auditLogs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
        auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'admin',
          action: action,
          details: `Updated tenant status of ${tenants[index].hospital_name} to: ${data.status.toUpperCase()}`,
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
        return respond(200, subscriptions.filter((s: any) => s.tenant_id === params.tenant_id))
      }
      return respond(200, subscriptions)
    }

    if (method === 'patch' || method === 'post') {
      // Create/Update sub details (plan upgrade, downgrades)
      const subId = url.split('/').pop() || ''
      const index = subscriptions.findIndex((s: any) => s.id === subId || s.tenant_id === data.tenant_id)
      
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
        const tIndex = tenants.findIndex((t: any) => t.tenant_id === sub.tenant_id)
        if (tIndex !== -1) {
          tenants[tIndex].subscription_end = data.end_date
          localStorage.setItem('hf_mock_tenants', JSON.stringify(tenants))
        }
      }

      // Audit Log
      const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
      const targetHospital = tenants.find((t: any) => t.tenant_id === sub.tenant_id)?.hospital_name || sub.tenant_id
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
        return respond(200, invoices.filter((i: any) => i.tenant_id === params.tenant_id))
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
      const hospitalName = tenants.find((t: any) => t.tenant_id === data.tenant_id)?.hospital_name || data.tenant_id
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
      const index = invoices.findIndex((i: any) => i.id === subInvId)
      if (index === -1) return respond(404, { detail: 'Invoice not found' })

      invoices[index] = { ...invoices[index], ...data }
      localStorage.setItem('hf_mock_invoices', JSON.stringify(invoices))

      // Audit Log (e.g. payment recorded)
      if (data.status === 'paid') {
        const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
        const hospitalName = tenants.find((t: any) => t.tenant_id === invoices[index].tenant_id)?.hospital_name || invoices[index].tenant_id
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
    const incidents = JSON.parse(localStorage.getItem('hf_mock_incidents') || '[]')
    
    if (method === 'get') {
      // Simulate real-time fluctuated telemetry
      const activeUsersCount = Math.floor(Math.random() * 40) + 120 // 120-160 users active
      const cpuUsage = Math.floor(Math.random() * 10) + 22 // 22-32%
      const ramUsage = 58 // static 58%
      const diskUsage = 71 // static 71%
      const uptime = '99.98%'

      return respond(200, {
        telemetry: {
          uptime,
          active_users: activeUsersCount,
          cpu_usage: cpuUsage,
          ram_usage: ramUsage,
          disk_usage: diskUsage
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
      const index = incidents.findIndex((i: any) => i.id === incId)
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

  // New: Announcements CRUD
  if (url.includes('/announcements')) {
    const announcements = JSON.parse(localStorage.getItem('hf_mock_announcements') || '[]')

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
      const index = announcements.findIndex((a: any) => a.id === annId)
      if (index === -1) return respond(404, { detail: 'Announcement not found' })

      announcements[index] = { ...announcements[index], ...data }
      localStorage.setItem('hf_mock_announcements', JSON.stringify(announcements))

      return respond(200, announcements[index])
    }
  }

  // New: Global Audit Logs Query
  if (url.endsWith('/audit-logs') && method === 'get') {
    const logs = JSON.parse(localStorage.getItem('hf_mock_audit_logs') || '[]')
    return respond(200, logs)
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
