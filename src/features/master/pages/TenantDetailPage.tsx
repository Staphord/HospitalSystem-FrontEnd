import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import { monitoringService } from '@/api/services/monitoring'
import { SuspendTenantModal } from '@/features/master/components/SuspendTenantModal'
import { TerminateTenantModal } from '@/features/master/components/TerminateTenantModal'
import type { Tenant, Subscription, Invoice } from '@/api/types/master'
import type { AuditLog } from '@/api/services/monitoring'

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  interface TenantStats {
    user_count?: number
    kc_user_count?: number
    patient_count?: number
    db_size_mb?: number
  }

  interface TenantAnalytics {
    storage_growth?: number[]
    uptime_trend?: number[]
    active_users_peak?: number[]
    module_usage?: Record<string, number>
    activity_logs?: unknown[]
  }

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<TenantStats | null>(null)
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'invoices' | 'audit' | 'config'>('overview')

  // Modal states
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isTerminateOpen, setIsTerminateOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) return
    await Promise.resolve()
    try {
      setLoading(true)
      const tData = await masterService.getTenant(id)
      setTenant(tData)
      
      // Parallel requests for related info
      const [subs, invs, logs, statsData, analyticsData] = await Promise.all([
        masterService.listSubscriptions(id).catch(() => []),
        masterService.listInvoices(id).catch(() => []),
        monitoringService.getAuditLogs().catch(() => []),
        masterService.getTenantStats(id).catch((err) => {
          console.error("Failed to fetch tenant stats", err)
          return null
        }),
        monitoringService.getTenantAnalytics(id).catch((err) => {
          console.error("Failed to fetch tenant analytics", err)
          return null
        })
      ])
      
      setSubscriptions(subs)
      setInvoices(invs)
      setStats(statsData)
      setAnalytics(analyticsData)
      
      // Filter logs related to this tenant
      const filteredLogs = logs.filter(
        (l) =>
          l.details.toLowerCase().includes(id.toLowerCase()) ||
          l.details.toLowerCase().includes(tData.hospital_name.toLowerCase())
      )
      setAuditLogs(filteredLogs)
    } catch {
      toast.error('Failed to load tenant details.')
      navigate('/master/tenants')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    let active = true
    const load = async () => {
      await Promise.resolve()
      if (!active) return
      fetchData()
    }
    load()
    return () => {
      active = false
    }
  }, [id, fetchData])


  const handleUnsuspend = async () => {
    if (!tenant || !id) return
    try {
      await masterService.updateTenant(id, { status: 'active' })
      toast.success(`Tenant "${tenant.hospital_name}" reactivated successfully.`)
      fetchData()
    } catch {
      toast.error('Failed to reactivate tenant.')
    }
  }



  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        Loading tenant details...
      </div>
    )
  }

  if (!tenant) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        Tenant not found. <Link to="/master/tenants">Back to list</Link>
      </div>
    )
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-badge status-active'
      case 'trial':
        return 'status-badge status-trial'
      case 'suspended':
        return 'status-badge status-suspended'
      case 'terminated':
        return 'status-badge status-terminated'
      default:
        return 'status-badge'
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link 
          to="/master/tenants" 
          style={{ 
            fontSize: '0.875rem', 
            color: 'var(--color-primary)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.35rem',
            marginBottom: '1rem' 
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            arrow_back
          </span>
          Back to Tenants
        </Link>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  backgroundColor: 'rgba(26, 82, 118, 0.1)', 
                  color: 'var(--color-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: '1px solid var(--color-border)' 
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                  local_hospital
                </span>
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  {tenant.hospital_name}
                </h1>
                <p style={{ margin: '0.35rem 0 0 0', color: 'var(--color-text-light)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <code>{tenant.tenant_id}</code>
                  <span>•</span>
                  <span>{tenant.city || '-'}, {tenant.country || '-'}</span>
                  <span>•</span>
                  <span>Status:</span>
                  <span className={getStatusBadgeClass(tenant.status)}>{tenant.status.toUpperCase()}</span>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {tenant.status === 'active' && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    navigate(`/impersonation/switching?tenant_id=${tenant.tenant_id}&return_to=/admin/dashboard`, { replace: true })
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    visibility
                  </span>
                  Impersonate
                </button>
              )}
              {tenant.status === 'active' ? (
                <button 
                  className="btn" 
                  style={{ 
                    backgroundColor: '#fffae6', 
                    color: '#b78103', 
                    border: '1px solid #ffeeba',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  onClick={() => setIsSuspendOpen(true)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    pause_circle
                  </span>
                  Suspend
                </button>
              ) : tenant.status === 'suspended' ? (
                <button 
                  className="btn" 
                  style={{ 
                    backgroundColor: '#e3fcef', 
                    color: '#36b37e', 
                    border: '1px solid #c3e6cb',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  onClick={handleUnsuspend}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    play_circle
                  </span>
                  Unsuspend
                </button>
              ) : null}
              {tenant.status !== 'terminated' && (
                <button 
                  className="btn" 
                  style={{ 
                    backgroundColor: '#ffebe6', 
                    color: '#ff5630', 
                    border: '1px solid #f5c6cb',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  onClick={() => {
                    setIsTerminateOpen(true)
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    delete
                  </span>
                  Terminate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'subscription' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          Subscription
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices & Payments
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Log
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          System Config
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          
          {/* General Info Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
              General Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Hospital Name</label>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{tenant.hospital_name}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Tenant ID</label>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}><code>{tenant.tenant_id}</code></div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Country</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.country || '-'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>City</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.city || '-'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Address</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.address || '-'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Primary Contact</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-light)' }}>Name: </span>
                    {tenant.contact_name || '-'}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-light)' }}>Email: </span>
                    {tenant.contact_email || '-'}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-light)' }}>Phone: </span>
                    {tenant.contact_phone || '-'}
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Billing Email</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.billing_email || tenant.contact_email || '-'}</div>
              </div>
            </div>
          </div>

          {/* System & Localization Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
              System & Localization
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Timezone</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.timezone || 'UTC'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Currency</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.currency || 'USD'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Date Format</label>
                <div style={{ fontSize: '0.9375rem' }}>DD/MM/YYYY</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Data Region</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.data_region || '-'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Database Status</label>
                <div style={{ fontSize: '0.9375rem', color: 'var(--color-success)', fontWeight: 600 }}>PROVISIONED</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Grace Period</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.grace_days ?? 14} days</div>
              </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid #ffc107', backgroundColor: '#fffae6', gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', color: '#b78103', borderBottom: '1px solid #ffeeba', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
              Danger Zone
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>Suspend Account</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Instantly revoke access for all users in this hospital. Recurring billing will continue until canceled.
                  </p>
                </div>
                {tenant.status === 'suspended' ? (
                  <button className="btn btn-primary" onClick={handleUnsuspend}>
                    Unsuspend Account
                  </button>
                ) : (
                  <button className="btn" style={{ backgroundColor: '#fffae6', color: '#b78103', border: '1px solid #ffeeba' }} onClick={() => setIsSuspendOpen(true)}>
                    Suspend Account
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #ffeeba', paddingTop: '1.5rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem' }}>Terminate Account</h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Permanently delete the organization, all associated records, patient data, and clinical history. This action cannot be undone.
                  </p>
                </div>
                {tenant.status === 'terminated' ? (
                  <button className="btn btn-secondary" disabled>Terminated</button>
                ) : (
                  <button 
                    className="btn" 
                    style={{ backgroundColor: '#ffebe6', color: '#ff5630', border: '1px solid #f5c6cb' }} 
                    onClick={() => {
                      setIsTerminateOpen(true)
                    }}
                  >
                    Terminate Account
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
              Subscription Plan Details
            </h3>
            <Link
              to={`/master/subscriptions?tenant_id=${tenant.tenant_id}`}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
              View Subscription Logs
            </Link>
          </div>
          {subscriptions.length === 0 ? (
            <div style={{ color: 'var(--color-text-light)', padding: '1rem 0' }}>No subscription history found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td><strong>{sub.plan_name}</strong></td>
                      <td>
                        <span className={getStatusBadgeClass(sub.status)}>{sub.status}</span>
                      </td>
                      <td>{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '-'}</td>
                      <td>{sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'Continuous'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
              Invoices and Payments
            </h3>
            <Link
              to={`/master/invoices?tenant_id=${tenant.tenant_id}`}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
              View Invoices Ledger
            </Link>
          </div>
          {invoices.length === 0 ? (
            <div style={{ color: 'var(--color-text-light)', padding: '1rem 0' }}>No invoice records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><code>#{inv.id}</code></td>
                      <td>{inv.description || 'Subscription invoice'}</td>
                      <td><strong>{tenant.currency || 'TSH'} {inv.amount.toLocaleString()}</strong></td>
                      <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className={`status-badge ${inv.status === 'paid' ? 'status-active' : inv.status === 'overdue' ? 'status-terminated' : 'status-suspended'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
            System Audit Log
          </h3>
          {auditLogs.length === 0 ? (
            <div style={{ color: 'var(--color-text-light)', padding: '1rem 0' }}>No log history matching this tenant.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8125rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td><code>{log.actor}</code></td>
                      <td><span className="status-badge" style={{ backgroundColor: '#e2e5e9', color: '#333' }}>{log.action}</span></td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                      <td><code>{log.ip_address}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
            Read-only System Configuration & Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9375rem' }}>Maintenance Mode</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ verticalAlign: 'middle' }}>
                    {tenant.maintenance_mode ? 'lock' : 'lock_open'}
                  </span>
                  {tenant.maintenance_mode ? 'ACTIVE - Site is locked for maintenance.' : 'INACTIVE - Standard portal access.'}
                </span>
              </div>
              <input 
                type="checkbox" 
                disabled
                checked={tenant.maintenance_mode || false} 
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9375rem' }}>MFA Enforcement</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ verticalAlign: 'middle' }}>
                    {tenant.mfa_enforced ?? true ? 'lock' : 'lock_open'}
                  </span>
                  {tenant.mfa_enforced ?? true ? 'ENFORCED - Mandatory two-factor auth.' : 'OPTIONAL - MFA is not required.'}
                </span>
              </div>
              <input 
                type="checkbox" 
                disabled
                checked={tenant.mfa_enforced ?? true} 
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'block', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>API Rate Limiting Cap</strong>
                <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                  Throttling cap threshold applied globally to hospital traffic.
                </span>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                  <span>{tenant.rate_limit ?? 1000} requests / minute (Read-Only)</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'block', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Storage Space Quota Allocation</strong>
                <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                  Upper storage limit for attachments, patient medical files, and scans.
                </span>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="material-symbols-outlined text-[18px]">folder</span>
                  <span>{tenant.storage_gb ?? 50} GB (Read-Only)</span>
                </div>
              </div>
            </div>

            {tenant.nas_backup_path && (
              <div>
                <div style={{ display: 'block', marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Local Backup NAS storage directory path</strong>
                  <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                    {tenant.nas_backup_path}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUSPEND TENANT MODAL */}
      <SuspendTenantModal
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        tenantId={id || ''}
        tenantName={tenant?.hospital_name || ''}
        onSuccess={fetchData}
      />

      {/* 3-STEP TERMINATE TENANT MODAL */}
      {isTerminateOpen && (
        <TerminateTenantModal
          isOpen={isTerminateOpen}
          onClose={() => setIsTerminateOpen(false)}
          tenantId={id || ''}
          tenantName={tenant?.hospital_name || ''}
          stats={stats}
          storageGb={analytics && analytics.storage_growth ? analytics.storage_growth[analytics.storage_growth.length - 1] : 0}
          tenantProfile={tenant}
          subscriptions={subscriptions}
          invoices={invoices}
          auditLogs={auditLogs}
          onSuccess={() => {
            setIsTerminateOpen(false)
            navigate('/master/tenants')
          }}
        />
      )}

    </div>
  )
}
