import { http, HttpResponse } from 'msw'

const API_URL = 'http://localhost:8000/api/v1'
const SUPERADMIN_URL = 'http://localhost:8000/api/v1/superadmin'

function encodeMockToken(payload: Record<string, unknown>) {
  const str = JSON.stringify(payload)
  const base64 = btoa(unescape(encodeURIComponent(str)))
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `mockHeader.${base64url}.mockSignature`
}

const mockTenants = [
  {
    id: 1,
    tenant_id: 'aga-khan',
    name: 'Aga Khan Hospital',
    status: 'active',
    subscription_plan: 'enterprise',
    subscription_status: 'active',
    is_active: true,
    created_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 2,
    tenant_id: 'nairobi-hosp',
    name: 'Nairobi Hospital',
    status: 'suspended',
    subscription_plan: 'premium',
    subscription_status: 'suspended',
    is_active: false,
    created_at: '2025-06-01T14:15:00Z',
  },
]

const mockPlans = [
  {
    plan_id: 'basic-uuid',
    plan_name: 'Basic',
    description: 'Essential modules for small clinics',
    max_users: 10,
    max_patients: 10000,
    storage_gb: 10,
    modules_included: ['reception', 'triage', 'consultation'],
    monthly_price: '299.00',
    annual_price: '2990.00',
    annual_discount_pct: '0.0',
    uptime_sla_pct: '99.9',
    backup_frequency_hours: 24,
    is_active: true,
    created_at: '2026-06-01T00:00:00Z',
  },
  {
    plan_id: 'premium-uuid',
    plan_name: 'Premium',
    description: 'Full clinical workflow for large networks',
    max_users: null,
    max_patients: null,
    storage_gb: 200,
    modules_included: ['reception', 'triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'billing', 'ward'],
    monthly_price: '1199.00',
    annual_price: '11990.00',
    annual_discount_pct: '0.0',
    uptime_sla_pct: '99.99',
    backup_frequency_hours: 4,
    is_active: true,
    created_at: '2026-06-01T00:00:00Z',
  },
]

const mockSubscriptions = [
  {
    subscription_id: 'sub-1-uuid',
    tenant_id: 'aga-khan',
    plan_id: 'premium-uuid',
    plan_name: 'premium',
    billing_cycle: 'monthly',
    start_date: '2026-06-01',
    end_date: '2026-07-01',
    grace_period_days: 7,
    auto_renew: true,
    status: 'active',
    created_at: '2026-06-01T00:00:00Z',
  },
]

const mockInvoices: any[] = [
  {
    id: 'inv-101-uuid',
    invoice_id: 'inv-101-uuid',
    tenant_id: 'aga-khan',
    subscription_id: 'sub-1-uuid',
    invoice_number: 'INV-AK-101',
    billing_period_start: '2026-06-01',
    billing_period_end: '2026-07-01',
    plan_name: 'Premium',
    amount: 1199.00,
    amount_paid: 0,
    currency: 'USD',
    due_date: '2026-06-15',
    status: 'unpaid',
    issued_at: '2026-06-01T00:00:00Z',
    paid_at: null,
  },
]

export const handlers = [
  // OPTIONS preflight requests
  http.options('*', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    })
  }),

  // Auth Login Mocks
  http.post(`${API_URL}/auth/login`, () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    })
  }),

  http.post(`${API_URL}/auth/superadmin/login`, () => {
    return HttpResponse.json({
      access_token: 'mock-superadmin-token',
      refresh_token: 'mock-superadmin-refresh',
    })
  }),

  // User Profile
  http.get(`${API_URL}/me`, () => {
    return HttpResponse.json({
      keycloak_sub: 'superadmin-sub',
      username: 'superadmin',
      email: 'admin@hospitalflow.com',
      full_name: 'System Administrator',
      role: 'super_admin',
      hospital_id: null,
    })
  }),

  // Tenants CRUD Mocks
  http.get(`${SUPERADMIN_URL}/tenants`, () => {
    return HttpResponse.json(mockTenants)
  }),

  http.post(`${SUPERADMIN_URL}/tenants`, async ({ request }) => {
    const body: any = await request.json()
    const newTenant = {
      id: Date.now(),
      tenant_id: `hosp-${Date.now()}`,
      name: body.hospital_name,
      status: 'trial',
      subscription_plan: 'free_trial',
      subscription_status: 'trial',
      is_active: true,
      created_at: new Date().toISOString(),
    }
    return HttpResponse.json(newTenant, { status: 201 })
  }),

  http.get(`${SUPERADMIN_URL}/tenants/:tenantId`, ({ params }) => {
    const tenant = mockTenants.find((t) => t.tenant_id === params.tenantId)
    if (!tenant) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(tenant)
  }),

  http.get(`${SUPERADMIN_URL}/tenants/:tenantId/stats`, ({ params }) => {
    return HttpResponse.json({
      tenant_id: params.tenantId,
      user_count: 15,
      active_user_count: 12,
      patient_count: 2450,
      db_size_bytes: 45000000,
      db_size_mb: 42.9,
      api_calls_this_month: 8520,
      subscription_plan: 'premium',
      subscription_status: 'active',
    })
  }),

  http.patch(`${SUPERADMIN_URL}/tenants/:tenantId`, async ({ params, request }) => {
    const body: any = await request.json()
    const tenant = mockTenants.find((t) => t.tenant_id === params.tenantId)
    if (!tenant) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ ...tenant, ...body })
  }),

  // Subscriptions & Plans
  http.get(`${SUPERADMIN_URL}/subscription-plans`, () => {
    return HttpResponse.json(mockPlans)
  }),

  http.get(`${SUPERADMIN_URL}/subscriptions`, () => {
    return HttpResponse.json(mockSubscriptions)
  }),

  http.patch(`${SUPERADMIN_URL}/subscriptions/:subId`, async ({ params, request }) => {
    const body: any = await request.json()
    const sub = mockSubscriptions.find((s) => s.subscription_id === params.subId)
    if (!sub) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json({ ...sub, ...body })
  }),

  // Invoices & Billing
  http.get(`${SUPERADMIN_URL}/invoices`, () => {
    return HttpResponse.json(mockInvoices)
  }),

  http.post(`${SUPERADMIN_URL}/tenants/:tenantId/invoices`, async ({ params, request }) => {
    const body: any = await request.json()
    const requiredFields = [
      'subscription_id',
      'plan_name',
      'billing_period_start',
      'billing_period_end',
      'currency',
      'amount',
      'due_date',
      'status',
      'description'
    ]
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return new HttpResponse(
          JSON.stringify({ detail: `Field '${field}' is required.` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }
    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoice_id: `inv-${Date.now()}`,
      tenant_id: String(params.tenantId),
      subscription_id: body.subscription_id,
      plan_name: body.plan_name,
      billing_period_start: body.billing_period_start,
      billing_period_end: body.billing_period_end,
      currency: body.currency,
      amount: Number(body.amount),
      amount_paid: 0,
      due_date: body.due_date,
      status: body.status,
      description: body.description,
      issued_at: new Date().toISOString(),
      paid_at: null,
    }
    mockInvoices.push(newInvoice)
    return HttpResponse.json(newInvoice, { status: 201 })
  }),

  http.post(`${SUPERADMIN_URL}/tenants/:tenantId/payments`, async ({ request }) => {
    const body: any = await request.json()
    if (!body.invoice_id || !body.amount || !body.payment_method) {
      return new HttpResponse(
        JSON.stringify({ detail: 'invoice_id, amount, and payment_method are required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const invoice = mockInvoices.find((i) => i.id === body.invoice_id || i.invoice_id === body.invoice_id)
    if (invoice) {
      const enteredAmount = Number(body.amount)
      invoice.amount_paid = (invoice.amount_paid || 0) + enteredAmount
      if (invoice.amount_paid >= invoice.amount) {
        invoice.status = 'paid'
        invoice.paid_at = new Date().toISOString()
      } else {
        invoice.status = 'partially_paid'
      }
    }
    return HttpResponse.json({ success: true, message: 'Payment recorded.' })
  }),

  http.patch(`${SUPERADMIN_URL}/invoices/:invoiceId`, async ({ params, request }) => {
    const body: any = await request.json()
    const invoice = mockInvoices.find((i) => i.invoice_id === params.invoiceId || i.id === params.invoiceId)
    if (!invoice) return new HttpResponse(null, { status: 404 })
    Object.assign(invoice, body)
    return HttpResponse.json(invoice)
  }),

  // Support Impersonation
  http.post(`${API_URL}/auth/impersonate`, async ({ request }) => {
    const body: any = await request.json()
    const tenantId = body.tenant_id || 'aga-khan'
    const payload = {
      sub: `impersonate-sub-${tenantId}`,
      username: `impersonator_${tenantId}`,
      email: `support@hospitalflow.com`,
      realm_access: { roles: ['hospital_admin'] },
      tenant_id: tenantId,
      impersonator: true,
      scope: 'readonly',
      exp: Math.floor(Date.now() / 1000) + 1800,
    }
    return HttpResponse.json({
      access_token: encodeMockToken(payload),
      refresh_token: 'mock-impersonate-refresh',
    })
  }),

  // Health and System Monitoring
  http.get(`${SUPERADMIN_URL}/health`, () => {
    return HttpResponse.json({
      overall: 'healthy',
      healthy_count: 14,
      total_count: 14,
      services: {},
    })
  }),

  http.get(`${API_URL}/monitoring/health`, () => {
    return HttpResponse.json({
      telemetry: {
        uptime: '99.98%',
        active_users: 145,
        cpu_usage: 25,
        ram_usage: 58,
        disk_usage: 71,
        history: {
          cpu: [20, 22, 25, 23, 24, 25],
          ram: [58, 58, 58, 58, 58, 58],
          disk: [71, 71, 71, 71, 71, 71],
          db: [30, 32, 34, 33, 35, 34],
        },
      },
      incidents: [
        {
          id: 'inc-1',
          title: 'Database Replication Lag',
          severity: 'critical',
          status: 'active',
          message: 'Active lag of 45s detected on US-East replica.',
          created_at: new Date().toISOString(),
        },
      ],
    })
  }),

  // Tenant-specific telemetry
  http.get(`${API_URL}/monitoring/tenants/:tenantId/analytics`, () => {
    return HttpResponse.json({
      uptime_trend: [99.9, 99.95, 99.92, 99.99],
      active_users_peak: [10, 15, 22, 18],
      storage_growth: [12, 14, 15, 17],
      module_usage: [
        { module: 'Consultation', percentage: 40 },
        { module: 'Triage', percentage: 25 },
      ],
      activity_logs: [],
    })
  }),
]
