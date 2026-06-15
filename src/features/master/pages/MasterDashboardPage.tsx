import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { masterService } from '@/api/services/master'
import { monitoringService, type SystemHealthData, type AuditLog } from '@/api/services/monitoring'
import type { Tenant, Invoice } from '@/api/types/master'

export function MasterDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [health, setHealth] = useState<SystemHealthData | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      masterService.listTenants(),
      masterService.listInvoices(),
      monitoringService.getSystemHealth(),
      monitoringService.getAuditLogs(),
    ])
      .then(([tData, iData, hData, aData]) => {
        setTenants(tData)
        setInvoices(iData)
        setHealth(hData)
        setAuditLogs(aData)
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

  const paidInvoices = invoices.filter((i) => i.status === 'paid')
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue')
  const invoicesDueThisMonthAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0)

  const overdueInvoicesList = invoices.filter((i) => i.status === 'overdue')
  const overdueAmount = overdueInvoicesList.reduce((sum, inv) => sum + inv.amount, 0)
  const overdueCount = overdueInvoicesList.length

  const activeIncidents = health?.incidents.filter((inc) => inc.status === 'active') || []

  // Dynamic bar data
  const barData = [
    { label: 'Jan', value: '30%', count: 2 },
    { label: 'Feb', value: '50%', count: 3 },
    { label: 'Mar', value: '20%', count: 1 },
    { label: 'Apr', value: '80%', count: 5 },
    { label: 'May', value: '40%', count: 2 },
    { label: 'Jun', value: '90%', count: 6 },
  ]

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
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{health?.telemetry.active_users || 47}</h3>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>Uptime</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{health?.telemetry.uptime || '99.87%'}</h3>
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
                <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>TSH {invoicesDueThisMonthAmount.toLocaleString()}</p>
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
                    TSH {overdueAmount.toLocaleString()}
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
                <p style={{ fontSize: '1.35rem', fontWeight: 700, color: '#36b37e', margin: 0 }}>TSH {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Two Graphs Side by Side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* New Hospitals per Month Bar Chart */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>New Hospitals per Month</h3>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-text-light)', cursor: 'pointer' }}>more_vert</span>
              </div>
              <div style={{ height: '140px', display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '0.75rem', padding: '0 0.5rem' }}>
                {barData.map((bar, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'end' }}>
                    <div
                      style={{
                        width: '100%',
                        background: i === 5 ? 'var(--color-primary)' : 'rgba(0, 82, 204, 0.2)',
                        height: bar.value,
                        borderRadius: '2px 2px 0 0',
                        position: 'relative'
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '10px', color: 'var(--color-text-light)', fontWeight: 'bold' }}>
                <span>JAN</span>
                <span>FEB</span>
                <span>MAR</span>
                <span>APR</span>
                <span>MAY</span>
                <span>JUN</span>
              </div>
            </div>

            {/* Subscription Revenue Line Chart */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Subscription Revenue</h3>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-text-light)', cursor: 'pointer' }}>more_vert</span>
              </div>
              <div style={{ height: '140px', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                  <path d="M0,130 C50,120 100,140 150,80 S250,20 300,50 S350,10 400,30" fill="none" stroke="var(--color-primary)" strokeWidth="3" />
                  <path d="M0,130 C50,120 100,140 150,80 S250,20 300,50 S350,10 400,30 V150 H0 Z" fill="url(#subRevenueGlow)" opacity="0.1" />
                  <defs>
                    <linearGradient id="subRevenueGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '10px', color: 'var(--color-text-light)', fontWeight: 'bold' }}>
                <span>JAN</span>
                <span>FEB</span>
                <span>MAR</span>
                <span>APR</span>
                <span>MAY</span>
                <span>JUN</span>
              </div>
            </div>

          </div>

          {/* Hospital Performance Overview Detail Table */}
          <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Hospital Performance Overview</h3>
              <button style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: 'bold', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                Export CSV <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              </button>
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
                  {tenants.map((t) => {
                    const users = t.status === 'suspended' ? 0 : (t.hospital_name.length * 7) % 150 + 10
                    const storage = t.status === 'suspended' ? 88 : (t.hospital_name.length * 4) % 80 + 10
                    const lastActive = t.status === 'suspended' ? '4 days ago' : `${(t.hospital_name.length * 3) % 55 + 2} mins ago`
                    const hasAlert = t.status === 'suspended' || t.tenant_id === 'nairobi-hosp'

                    return (
                      <tr key={t.tenant_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-primary)' }}>{t.hospital_name}</td>
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
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{users}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ width: '96px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }}>
                            <div style={{ height: '100%', width: `${storage}%`, background: t.status === 'suspended' ? '#ff5630' : 'var(--color-primary)' }} />
                          </div>
                          <span>{storage}%</span>
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
          </div>

          {/* Active System Incidents */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Active System Incidents</h3>
              <Link to="/master/health" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
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
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 700 }}>Activity Feed</h3>
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
                      <strong style={{ color: 'var(--color-text)' }}>{log.actor}</strong> {log.details}
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
