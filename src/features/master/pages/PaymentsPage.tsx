/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Invoice, Tenant } from '@/api/types/master'

export function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  // Filter Form State
  const [search, setSearch] = useState('')
  const [selectedHospital, setSelectedHospital] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [invoicesData, tenantsData] = await Promise.all([
        masterService.listInvoices(),
        masterService.listTenants()
      ])
      setInvoices(invoicesData)
      setTenants(tenantsData)
      setLoading(false)
    } catch {
      toast.error('Failed to load financial transaction records.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getHospitalName = (tenantId: string) => {
    return tenants.find((t) => t.tenant_id === tenantId)?.hospital_name || tenantId
  }

  const getHospitalCurrency = (tenantId: string) => {
    return tenants.find((t) => t.tenant_id === tenantId)?.currency || 'USD'
  }

  // Filter payments (invoices that have some payment recorded)
  const payments = invoices.filter(
    (i) => i.status === 'paid' || i.status === 'partially_paid' || (i.amount_paid && i.amount_paid > 0)
  )

  const filteredPayments = payments.filter((p) => {
    const hospital = getHospitalName(p.tenant_id).toLowerCase()
    const id = p.id.toLowerCase()
    const ref = (p.reference_number || '').toLowerCase()
    const query = search.toLowerCase()

    const matchesSearch = hospital.includes(query) || id.includes(query) || ref.includes(query)
    const matchesHospital = !selectedHospital || p.tenant_id === selectedHospital
    const matchesMethod = !selectedMethod || p.payment_method === selectedMethod
    const matchesCurrency = !selectedCurrency || getHospitalCurrency(p.tenant_id) === selectedCurrency

    return matchesSearch && matchesHospital && matchesMethod && matchesCurrency
  })

  // Calculate KPI values
  const now = new Date()
  const mtdTotal = payments
    .filter((p) => {
      if (!p.payment_date) return false
      const d = new Date(p.payment_date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, p) => sum + (p.amount_paid || p.amount), 0)

  const ytdTotal = payments
    .filter((p) => {
      if (!p.payment_date) return false
      const d = new Date(p.payment_date)
      return d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, p) => sum + (p.amount_paid || p.amount), 0)

  const overdueTotal = invoices
    .filter((i) => i.status === 'overdue')
    .reduce((sum, i) => sum + (i.amount - (i.amount_paid || 0)), 0)

  // Get Payment Method icons
  const getMethodIconName = (method: string) => {
    switch (method.toLowerCase()) {
      case 'bank transfer':
      case 'wire':
        return 'account_balance'
      case 'credit card':
      case 'card':
        return 'credit_card'
      case 'mobile money':
      case 'mpesa':
        return 'smartphone'
      case 'cheque':
        return 'description'
      default:
        return 'attach_money'
    }
  }

  // Render monthly revenue trends chart using responsive SVG coordinates
  const renderRevenueChart = () => {
    const monthlyRevenue = [12500, 14200, 11800, 16500, 18200, mtdTotal || 24000]
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const maxVal = Math.max(...monthlyRevenue) + 5000

    const width = 600
    const height = 180
    const paddingLeft = 45
    const paddingRight = 20
    const paddingTop = 20
    const paddingBottom = 30

    const graphWidth = width - paddingLeft - paddingRight
    const graphHeight = height - paddingTop - paddingBottom

    const points = monthlyRevenue.map((val, idx) => {
      const x = paddingLeft + (idx / (monthlyRevenue.length - 1)) * graphWidth
      const y = paddingTop + graphHeight - (val / maxVal) * graphHeight
      return { x, y, val }
    })

    const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
    const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingBottom} L ${points[0].x},${height - paddingBottom} Z`

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0052cc" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0052cc" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="#f1f3f5" strokeWidth="1" />
        <line x1={paddingLeft} y1={paddingTop + graphHeight * 0.5} x2={width - paddingRight} y2={paddingTop + graphHeight * 0.5} stroke="#f1f3f5" strokeWidth="1" />
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e9ecef" strokeWidth="1.5" />

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" stroke="none" />

        {/* Line path */}
        <path d={pathD} fill="none" stroke="#0052cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Value circles and text */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#0052cc" strokeWidth="2" />
            <text x={p.x} y={p.y - 10} fontSize="9" fontWeight="600" fill="#0052cc" textAnchor="middle">
              ${p.val.toLocaleString([], { maximumFractionDigits: 0 })}
            </text>
            <text x={p.x} y={height - 10} fontSize="10" fill="#888" textAnchor="middle">
              {months[idx]}
            </text>
          </g>
        ))}

        {/* Y-axis ticks */}
        <text x={paddingLeft - 8} y={paddingTop + 4} fontSize="9" fill="#999" textAnchor="end">
          ${(maxVal / 1000).toFixed(0)}k
        </text>
        <text x={paddingLeft - 8} y={paddingTop + graphHeight * 0.5 + 4} fontSize="9" fill="#999" textAnchor="end">
          ${((maxVal * 0.5) / 1000).toFixed(0)}k
        </text>
        <text x={paddingLeft - 8} y={height - paddingBottom + 4} fontSize="9" fill="#999" textAnchor="end">
          $0
        </text>
      </svg>
    )
  }

  const handleExportCSV = () => {
    const headers = ['Reference Number', 'Invoice ID', 'Hospital Name', 'Amount Paid', 'Payment Date', 'Payment Method']
    const rows = filteredPayments.map((p) => [
      p.reference_number || `PAY-${p.id}`,
      p.id,
      getHospitalName(p.tenant_id),
      p.amount_paid || p.amount,
      p.payment_date || 'N/A',
      p.payment_method || 'N/A'
    ])
    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `platform_payments_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Payments audit ledger exported successfully.')
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="Financial & Payments Registry"
          description="Monitor subscription renewals ledger, analyze monthly revenue curves, and export transactions records."
        />
        <button className="btn btn-primary" onClick={handleExportCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
          Export Audit Ledger
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          Loading financial ledger...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Summary Cards and Area Chart */}
          <div className="dashboard-grid">
            <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Month to Date Revenue</span>
                <strong style={{ fontSize: '1.875rem', color: '#36b37e', display: 'block', margin: '0.25rem 0' }}>
                  ${mtdTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>June Billing Cycle</span>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Year to Date Revenue</span>
                <strong style={{ fontSize: '1.875rem', color: 'var(--primary-color)', display: 'block', margin: '0.25rem 0' }}>
                  ${ytdTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fiscal Year 2026</span>
              </div>

              <div className="card" style={{ padding: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Outstanding Overdue Balance</span>
                <strong style={{ fontSize: '1.875rem', color: '#ff5630', display: 'block', margin: '0.25rem 0' }}>
                  ${overdueTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Immediate action required</span>
              </div>
            </div>

            {/* SVG Monthly Revenue Curve Card */}
            <div className="card col-8" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Monthly Revenue Growth Performance</h3>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                {renderRevenueChart()}
              </div>
            </div>
          </div>

          {/* Payments Filter Toolbar */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div className="search-input-wrapper" style={{ maxWidth: '300px', flex: 1 }}>
                <span className="material-symbols-outlined search-input-icon">search</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Hospital, Invoice ID, Reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: '180px' }}
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
              >
                <option value="">-- All Hospitals --</option>
                {tenants.map((t) => (
                  <option key={t.tenant_id} value={t.tenant_id}>
                    {t.hospital_name}
                  </option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ width: '180px' }}
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
              >
                <option value="">-- All Methods --</option>
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Credit Card">Credit/Debit Card Online</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Cheque">Corporate Cheque</option>
              </select>

              <select
                className="form-control"
                style={{ width: '150px' }}
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
              >
                <option value="">-- All Currencies --</option>
                <option value="USD">USD ($)</option>
                <option value="TSH">TSH (Sh)</option>
                <option value="GHS">GHS (₵)</option>
                <option value="NGN">NGN (₦)</option>
              </select>
            </div>

            {filteredPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                No recorded payments matching your filters.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Payment Date</th>
                      <th>Reference Number</th>
                      <th>Invoice ID</th>
                      <th>Hospital</th>
                      <th>Method</th>
                      <th style={{ textAlign: 'right' }}>Amount Settled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p) => {
                      const currency = getHospitalCurrency(p.tenant_id)
                      const isPartial = p.status === 'partially_paid'
                      return (
                        <tr key={p.id}>
                          <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <strong><code>#{p.reference_number || `PAY-${p.id}`}</code></strong>
                          </td>
                          <td>
                            <code>#{p.id}</code>
                          </td>
                          <td>
                            <strong>{getHospitalName(p.tenant_id)}</strong>
                          </td>
                          <td>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '0.25rem', verticalAlign: 'middle' }}>
                              {getMethodIconName(p.payment_method || '')}
                            </span>
                            <span style={{ verticalAlign: 'middle' }}>{p.payment_method || 'N/A'}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <strong style={{ color: '#36b37e' }}>
                              +${(p.amount_paid || p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                            <div style={{ fontSize: '0.7rem' }}>
                              {isPartial ? (
                                <span className="badge badge-warning" style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
                                  Partial Payment
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)' }}>{currency} Base</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
