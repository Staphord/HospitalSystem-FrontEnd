import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { masterService } from '@/api/services/master'
import { monitoringService, type SystemHealthData, type AuditLog, type TenantUsageTelemetry } from '@/api/services/monitoring'
import type { Tenant, Invoice, SubscriptionPlan } from '@/api/types/master'

export function MasterDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [health, setHealth] = useState<SystemHealthData | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [revenueHistory, setRevenueHistory] = useState<{ months: string[]; revenue: number[] } | null>(null)
  const [usageTelemetry, setUsageTelemetry] = useState<TenantUsageTelemetry[]>([])
  const [loading, setLoading] = useState(true)

  // Chart range & hover states
  const [barRange, setBarRange] = useState(6)
  const [revRange, setRevRange] = useState(6)
  const [barMenuOpen, setBarMenuOpen] = useState(false)
  const [revMenuOpen, setRevMenuOpen] = useState(false)
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    Promise.all([
      masterService.listTenants(),
      masterService.listInvoices(),
      monitoringService.getSystemHealth(),
      monitoringService.getAuditLogs(),
      masterService.listPlans(),
      masterService.getRevenueHistory(),
      monitoringService.getUsageTelemetry(),
    ])
      .then(([tData, iData, hData, aData, pData, rData, utData]) => {
        setTenants(tData)
        setInvoices(iData)
        setHealth(hData)
        setAuditLogs(aData)
        setPlans(pData)
        setRevenueHistory(rData)
        setUsageTelemetry(utData)
      })
      .catch((err) => console.error('Error fetching dashboard data:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-light)' }}>
        Loading platform dashboard data...
      </div>
    )
  }

  // Calculate metrics
  const activeTenants = tenants.filter((t) => t.status === 'active').length
  const suspendedTenants = tenants.filter((t) => t.status === 'suspended').length

  const totalRevenue = invoices.reduce((sum, inv) => {
    if (inv.status === 'paid') {
      const amt = Number(inv.amount_paid) || Number(inv.amount) || 0;
      return sum + (amt > 0 ? amt : 0);
    } else if (inv.status === 'partially_paid') {
      const amt = Number(inv.amount_paid) || 0;
      return sum + (amt > 0 ? amt : 0);
    }
    return sum;
  }, 0)

  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue')
  const invoicesDueThisMonthAmount = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)

  const overdueInvoicesList = invoices.filter((i) => i.status === 'overdue')
  const overdueAmount = overdueInvoicesList.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)
  const overdueCount = overdueInvoicesList.length

  const platformCurrency = invoices.find((inv) => inv.currency)?.currency || 'TSH'

  const activeIncidents = health?.incidents.filter((inc) => inc.status === 'active') || []

  const getTenantName = (tenant: Tenant) => tenant.hospital_name || tenant.name || tenant.tenant_id

  // Sum active users from usage telemetry
  const totalActiveUsers = usageTelemetry.reduce((sum, ut) => sum + (ut.active_user_count || 0), 0)
  const displayActiveUsers = usageTelemetry.length > 0 ? totalActiveUsers : (health?.telemetry.active_users || 0)

  // Relative time helper
  const getRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return 'No activity'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'No activity'
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  // Parse and format uptime details for professional display
  const parseUptime = (uptimeStr?: string | null) => {
    if (!uptimeStr) return { pct: '99.99%', detail: '' }
    const match = uptimeStr.match(/^([\d.]+%)\s*\(([^)]+)\)/)
    if (match) {
      const pct = match[1]
      let detail = match[2]
      detail = detail
        .replace(/\s*days?,?\s*/gi, 'd ')
        .replace(/\s*hours?,?\s*/gi, 'h ')
        .replace(/\s*mins?,?\s*/gi, 'm ')
        .trim()
      return { pct, detail }
    }
    return { pct: uptimeStr, detail: '' }
  }

  // Dynamic bar data from tenant creation history
  const getHospitalRegistrationTrends = (tenantsList: Tenant[], rangeMonths: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const now = new Date()
    
    const lastMonths = Array.from({ length: rangeMonths }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (rangeMonths - 1 - i), 1)
      return {
        monthName: months[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        count: 0
      }
    })

    tenantsList.forEach(t => {
      if (!t.created_at) return
      const created = new Date(t.created_at)
      const matchedMonth = lastMonths.find(m => m.monthIndex === created.getMonth() && m.year === created.getFullYear())
      if (matchedMonth) {
        matchedMonth.count += 1
      }
    })

    const maxCount = Math.max(...lastMonths.map(m => m.count), 1)
    
    return lastMonths.map(m => ({
      label: m.monthName.toUpperCase(),
      // Zero-count months get zero height; non-zero are scaled between 10%-90%
      value: m.count === 0 ? '0%' : `${(m.count / maxCount) * 80 + 10}%`,
      count: m.count
    }))
  }

  const dynamicBarData = getHospitalRegistrationTrends(tenants, barRange)

  // Subscription Revenue Line Chart calculations
  const revMonths = (revenueHistory?.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']).slice(-revRange)
  const revValues = (revenueHistory?.revenue || [0, 0, 0, 0, 0, 0]).slice(-revRange)

  const generateLinePath = (values: number[]) => {
    if (values.length === 0) return { linePath: '', areaPath: '', points: [] }
    const width = 400
    const height = 150
    const paddingBottom = 20
    const paddingTop = 20
    const chartHeight = height - paddingBottom - paddingTop

    const maxVal = Math.max(...values, 1)
    const minVal = Math.min(...values, 0)
    const range = maxVal - minVal

    const points = values.map((val, i) => {
      const x = i * (width / (values.length - 1))
      const y = height - paddingBottom - ((val - minVal) / range) * chartHeight
      return { x, y }
    })

    let linePath = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x},${points[i].y}`
    }

    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`
    return { linePath, areaPath, points }
  }

  const { linePath, areaPath, points: chartPoints } = generateLinePath(revValues)

  // Pagination calculations for Hospital Performance Overview Detail Table
  const totalItems = tenants.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedTenants = tenants.slice(startIndex, endIndex)

  return (
    <>
    
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.9fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Top 5-Column Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Total Hospitals</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{tenants.length}</h3>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Active</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#36b37e', margin: 0 }}>{activeTenants}</h3>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Suspended</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ff5630', margin: 0 }}>{suspendedTenants}</h3>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Active Users</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{displayActiveUsers}</h3>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Uptime</p>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>
                  {parseUptime(health?.telemetry.uptime).pct}
                </h3>
                {parseUptime(health?.telemetry.uptime).detail && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                    ({parseUptime(health?.telemetry.uptime).detail})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Finance Row (3 columns) with Plain Icons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'rgba(0, 82, 204, 0.04)', border: '1px solid rgba(0, 82, 204, 0.12)', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 82, 204, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}>receipt_long</span>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary)', margin: '0 0 2px 0' }}>Invoices Due This Month</p>
                <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{platformCurrency} {invoicesDueThisMonthAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div style={{ background: 'rgba(255, 86, 48, 0.04)', border: '1px solid rgba(255, 86, 48, 0.12)', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 86, 48, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: '#ff5630', fontSize: '1.5rem' }}>money_off</span>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary)', margin: '0 0 2px 0' }}>Overdue Invoices</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ff5630' }}>
                    {platformCurrency} {overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'rgba(255, 86, 48, 0.8)' }}>
                    ({overdueCount})
                  </span>
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(54, 179, 126, 0.04)', border: '1px solid rgba(54, 179, 126, 0.12)', borderRadius: '8px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(54, 179, 126, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: '#36b37e', fontSize: '1.5rem' }}>payments</span>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-secondary)', margin: '0 0 2px 0' }}>Payments Received</p>
                <p style={{ fontSize: '1.35rem', fontWeight: 700, color: '#36b37e', margin: 0 }}>{platformCurrency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Two Graphs Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* New Hospitals per Month Bar Chart */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>New Hospitals per Month</h3>
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ color: 'var(--color-text-light)', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setBarMenuOpen(!barMenuOpen)}
                  >
                    more_vert
                  </span>
                  {barMenuOpen && (
                    <>
                      <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} 
                        onClick={() => setBarMenuOpen(false)} 
                      />
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 101,
                        minWidth: '120px',
                        padding: '4px 0',
                      }}>
                        <button
                          onClick={() => { setBarRange(3); setBarMenuOpen(false); }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 12px',
                            textAlign: 'left',
                            background: barRange === 3 ? 'rgba(0, 82, 204, 0.05)' : 'none',
                            border: 'none',
                            fontSize: '12px',
                            color: barRange === 3 ? 'var(--color-primary)' : 'var(--color-text)',
                            fontWeight: barRange === 3 ? 'bold' : 'normal',
                            cursor: 'pointer',
                          }}
                        >
                          Last 3 Months
                        </button>
                        <button
                          onClick={() => { setBarRange(6); setBarMenuOpen(false); }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 12px',
                            textAlign: 'left',
                            background: barRange === 6 ? 'rgba(0, 82, 204, 0.05)' : 'none',
                            border: 'none',
                            fontSize: '12px',
                            color: barRange === 6 ? 'var(--color-primary)' : 'var(--color-text)',
                            fontWeight: barRange === 6 ? 'bold' : 'normal',
                            cursor: 'pointer',
                          }}
                        >
                          Last 6 Months
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Bar columns — label lives inside the same flex column for perfect alignment */}
              <div style={{ display: 'flex', alignItems: 'end', gap: '0.5rem', padding: '0 0.25rem', height: '170px' }}>
                {dynamicBarData.map((bar, i) => (
                  <div
                    key={i}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'end' }}
                  >
                    {/* Bar */}
                    <div
                      onMouseEnter={() => setHoveredBarIndex(i)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      style={{
                        width: '100%',
                        background: i === dynamicBarData.length - 1 ? 'var(--color-primary)' : 'rgba(0, 82, 204, 0.2)',
                        height: bar.value,
                        borderRadius: '2px 2px 0 0',
                        position: 'relative',
                        cursor: bar.count > 0 ? 'pointer' : 'default',
                        transition: 'background-color 0.2s ease',
                        minHeight: 0,
                      }}
                    >
                      {hoveredBarIndex === i && bar.count > 0 && (
                        <div style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 6px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--color-primary)',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          zIndex: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}>
                          {bar.count} Hospital{bar.count !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    {/* Label — aligned directly below its own bar column */}
                    <span style={{ marginTop: '0.5rem', fontSize: '10px', color: 'var(--color-text-light)', fontWeight: 'bold', textAlign: 'center', userSelect: 'none' }}>
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Revenue Line Chart */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Subscription Revenue</h3>
                <div style={{ position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ color: 'var(--color-text-light)', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setRevMenuOpen(!revMenuOpen)}
                  >
                    more_vert
                  </span>
                  {revMenuOpen && (
                    <>
                      <div 
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} 
                        onClick={() => setRevMenuOpen(false)} 
                      />
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: '#ffffff',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 101,
                        minWidth: '120px',
                        padding: '4px 0',
                      }}>
                        <button
                          onClick={() => { setRevRange(3); setRevMenuOpen(false); }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 12px',
                            textAlign: 'left',
                            background: revRange === 3 ? 'rgba(0, 82, 204, 0.05)' : 'none',
                            border: 'none',
                            fontSize: '12px',
                            color: revRange === 3 ? 'var(--color-primary)' : 'var(--color-text)',
                            fontWeight: revRange === 3 ? 'bold' : 'normal',
                            cursor: 'pointer',
                          }}
                        >
                          Last 3 Months
                        </button>
                        <button
                          onClick={() => { setRevRange(6); setRevMenuOpen(false); }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 12px',
                            textAlign: 'left',
                            background: revRange === 6 ? 'rgba(0, 82, 204, 0.05)' : 'none',
                            border: 'none',
                            fontSize: '12px',
                            color: revRange === 6 ? 'var(--color-primary)' : 'var(--color-text)',
                            fontWeight: revRange === 6 ? 'bold' : 'normal',
                            cursor: 'pointer',
                          }}
                        >
                          Last 6 Months
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ height: '140px', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {linePath && <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth="3" />}
                  {areaPath && <path d={areaPath} fill="url(#subRevenueGlow)" opacity="0.1" />}
                  <defs>
                    <linearGradient id="subRevenueGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {chartPoints.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPointIndex === i ? 6 : 4}
                      fill="var(--color-primary)"
                      stroke="#ffffff"
                      strokeWidth="2"
                      style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                      onMouseEnter={() => setHoveredPointIndex(i)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />
                  ))}
                </svg>
                {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                  <div style={{
                    position: 'absolute',
                    left: `${(chartPoints[hoveredPointIndex].x / 400) * 100}%`,
                    top: `${(chartPoints[hoveredPointIndex].y / 150) * 100 - 15}%`,
                    transform: 'translate(-50%, -100%)',
                    background: 'var(--color-primary)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    pointerEvents: 'none',
                    transition: 'left 0.15s ease, top 0.15s ease',
                  }}>
                    {platformCurrency} {revValues[hoveredPointIndex].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '10px', color: 'var(--color-text-light)', fontWeight: 'bold' }}>
                {revMonths.map((m, i) => (
                  <span key={i}>{m.toUpperCase()}</span>
                ))}
              </div>
            </div>

          </div>

          {/* Hospital Performance Overview Detail Table */}
          <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Hospital Performance Overview</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
                <button style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: 'bold', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                  Export CSV <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                </button>

                <select
                  className="form-control"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  style={{ maxWidth: '150px', width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  title="Page Size"
                >
                  <option value={10}>Show: 10</option>
                  <option value={25}>Show: 25</option>
                  <option value={50}>Show: 50</option>
                  <option value={100}>Show: 100</option>
                </select>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table" style={{ fontSize: '0.8125rem', width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Hospital Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Active Users</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Storage %</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Last Activity</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTenants.map((t) => {
                    const tenantName = getTenantName(t)
                    const tTelemetry = usageTelemetry.find((ut) => ut.tenant_id === t.tenant_id)
                    
                    const users = t.status === 'suspended' ? 0 : (tTelemetry?.active_user_count ?? (tTelemetry?.user_count ?? 0))
                    
                    // Find plan storage limit to calculate percentage dynamically
                    const matchedPlan = plans.find((p) => p.plan_id === t.subscription_plan || p.plan_name.toLowerCase() === t.subscription_plan?.toLowerCase())
                    const planStorageGb = matchedPlan?.storage_gb || (t.subscription_plan === 'premium' ? 200 : t.subscription_plan === 'standard' ? 50 : 10)
                    const dbSizeMb = tTelemetry?.db_size_mb ?? 0
                    const maxStorageMb = planStorageGb * 1024
                    const storage = Math.min(Math.round((dbSizeMb / maxStorageMb) * 100 * 10) / 10, 100)

                    const lastActive = t.status === 'suspended' ? 'Suspended' : getRelativeTime(t.updated_at || t.created_at)
                    const hasAlert = t.status === 'suspended' || t.status === 'terminated' || !!tTelemetry?.error

                    return (
                      <tr key={t.tenant_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-primary)' }}>{tenantName}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            className={`badge ${
                              t.status === 'active'
                                ? 'badge-success'
                                : t.status === 'trial'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                            style={{ fontSize: '10px', padding: '0.15rem 0.4rem', textTransform: 'uppercase' }}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{tTelemetry?.error ? '-' : users}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ width: '96px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}>
                            <div style={{ height: '100%', width: `${tTelemetry?.error ? 0 : storage}%`, background: hasAlert ? '#ff5630' : 'var(--color-primary)' }} />
                          </div>
                          <span>{tTelemetry?.error ? 'Error' : `${storage}% (${dbSizeMb}MB / ${planStorageGb}GB)`}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-light)' }}>{lastActive}</td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          {hasAlert ? (
                            <span className="material-symbols-outlined" style={{ color: '#ff5630', fontSize: '1.25rem', verticalAlign: 'middle' }}>report</span>
                          ) : (
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-text-light)', opacity: 0.15, fontSize: '1.25rem', verticalAlign: 'middle' }}>warning</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
                  <strong>{totalItems}</strong> entries
                </span>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.4rem', minWidth: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                      return (
                        <button
                          key={page}
                          className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.2rem 0.4rem', minWidth: '28px' }}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      )
                    }
                    if (page === currentPage - 3 || page === currentPage + 3) {
                      return <span key={`ellipsis-${page}`} style={{ padding: '0.2rem 0.4rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>...</span>
                    }
                    return null
                  })}

                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.4rem', minWidth: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active System Incidents */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Active System Incidents</h3>
              <Link to="/master/incidents?from=dashboard" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                View All →
              </Link>
            </div>
            {activeIncidents.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: '#737685', textAlign: 'center', padding: '1rem 0' }}>
                🟢 All systems operational. No active incidents reported.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderLeft: `4px solid ${inc.severity === 'critical' ? '#ff5630' : '#ffab00'}`,
                      background: '#f8f9fa',
                      borderRadius: '0 8px 8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: inc.severity === 'critical' ? '#ff5630' : '#ffab00',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {inc.severity}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>{inc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{inc.message}</div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-text-light)', fontSize: '1.25rem' }}>
                      chevron_right
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Actions Panel */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to="/master/tenants"
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>add_business</span>
                Add New Hospital
              </Link>
              
              <Link
                to="/master/invoices"
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>receipt_long</span>
                Generate Invoice
              </Link>

              <Link
                to="/master/announcements"
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>campaign</span>
                Create Announcement
              </Link>

              <Link
                to="/master/invoices/overdue"
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  background: '#ffffff',
                  border: '1px solid rgba(255, 86, 48, 0.2)',
                  color: '#ff5630'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>money_off</span>
                View Overdue Accounts
              </Link>
            </div>
          </div>

          {/* Activity Feed Panel */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Activity Feed</h3>
              <Link to="/master/audit-logs" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                View All →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
              
              {/* Timeline vertical line */}
              <div style={{
                position: 'absolute',
                left: '15px',
                top: '10px',
                bottom: '10px',
                width: '2px',
                background: 'var(--color-border)',
                zIndex: 0
              }} />

              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                  {/* Timeline dot */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: log.action.includes('SUSPEND') ? '#ffebe6' : log.action.includes('ONBOARD') ? '#e3fcef' : '#ebf5ff',
                    border: `2px solid ${log.action.includes('SUSPEND') ? '#ffbdad' : log.action.includes('ONBOARD') ? '#abf5d1' : '#c2dbff'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: '1rem',
                      color: log.action.includes('SUSPEND') ? '#ff5630' : log.action.includes('ONBOARD') ? '#36b37e' : 'var(--color-primary)'
                    }}>
                      {log.action.includes('SUSPEND') ? 'block' : log.action.includes('ONBOARD') ? 'add_business' : 'settings'}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                      <strong style={{ color: 'var(--color-text)' }}>{log.actor_name || log.actor}</strong> {log.details}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                      {new Date(log.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })} at {new Date(log.timestamp).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {auditLogs.length === 0 && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', textAlign: 'center', padding: '1rem 0', zIndex: 1 }}>
                  No recent activities recorded.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </>
  )
}
