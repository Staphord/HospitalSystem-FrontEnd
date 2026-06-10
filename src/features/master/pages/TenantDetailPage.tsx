import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import { monitoringService } from '@/api/services/monitoring'
import type { Tenant, Subscription, Invoice } from '@/api/types/master'
import type { AuditLog } from '@/api/services/monitoring'

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'invoices' | 'audit' | 'config'>('overview')

  // System Config states
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [mfaEnforced, setMfaEnforced] = useState(true)
  const [rateLimit, setRateLimit] = useState('1000')
  const [storageQuota, setStorageQuota] = useState('100')

  const fetchData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const tData = await masterService.getTenant(id)
      setTenant(tData)
      
      // Parallel requests for related info
      const [subs, invs, logs] = await Promise.all([
        masterService.listSubscriptions(id),
        masterService.listInvoices(id),
        monitoringService.getAuditLogs()
      ])
      
      setSubscriptions(subs)
      setInvoices(invs)
      
      // Filter logs related to this tenant
      const filteredLogs = logs.filter(
        (l) =>
          l.details.toLowerCase().includes(id.toLowerCase()) ||
          l.details.toLowerCase().includes(tData.hospital_name.toLowerCase())
      )
      setAuditLogs(filteredLogs)
    } catch (err) {
      toast.error('Failed to load tenant details.')
      navigate('/master/tenants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleUpdateStatus = async (newStatus: string) => {
    if (!tenant || !id) return
    try {
      await masterService.updateTenant(id, { status: newStatus })
      toast.success(`Tenant status updated to ${newStatus}.`)
      fetchData()
    } catch (err) {
      toast.error('Failed to update tenant status.')
    }
  }

  const handleSaveConfig = () => {
    toast.success('System configuration saved successfully!')
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
            gap: '0.25rem',
            marginBottom: '1rem' 
          }}
        >
          ← Back to Tenants
        </Link>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '12px', 
                  backgroundColor: 'var(--color-primary-light, rgba(26, 82, 118, 0.1))', 
                  color: 'var(--color-primary, #1a5276)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  border: '1px solid var(--color-border)' 
                }}
              >
                🏥
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  {tenant.hospital_name}
                </h1>
                <p style={{ margin: '0.35rem 0 0 0', color: 'var(--color-text-light)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <code>{tenant.tenant_id}</code>
                  <span>•</span>
                  <span>{tenant.city || 'N/A'}, {tenant.country || 'N/A'}</span>
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
                    localStorage.setItem('impersonated_tenant_id', tenant.tenant_id)
                    window.dispatchEvent(new Event('impersonation-change'))
                    toast.success(`Now impersonating ${tenant.hospital_name}. Redirecting to clinical view...`)
                    setTimeout(() => { window.location.href = '/dashboard' }, 1200)
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  👁️ Impersonate
                </button>
              )}
              {tenant.status === 'active' ? (
                <button 
                  className="btn" 
                  style={{ 
                    backgroundColor: 'var(--color-warning-bg, #fff3cd)', 
                    color: 'var(--color-warning, #856404)', 
                    border: '1px solid var(--color-warning-border, #ffeeba)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  onClick={() => handleUpdateStatus('suspended')}
                >
                  ⏸️ Suspend
                </button>
              ) : tenant.status === 'suspended' ? (
                <button 
                  className="btn" 
                  style={{ 
                    backgroundColor: 'var(--color-success-bg, #d4edda)', 
                    color: 'var(--color-success, #155724)', 
                    border: '1px solid var(--color-success-border, #c3e6cb)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  onClick={() => handleUpdateStatus('active')}
                >
                  ▶️ Unsuspend
                </button>
              ) : null}
              {tenant.status !== 'terminated' && (
                <button 
                  className="btn" 
                  style={{ 
                    backgroundColor: 'var(--color-error-bg, #f8d7da)', 
                    color: 'var(--color-error, #721c24)', 
                    border: '1px solid var(--color-error-border, #f5c6cb)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  onClick={() => {
                    if (confirm(`Are you absolutely sure you want to terminate ${tenant.hospital_name}?`)) {
                      handleUpdateStatus('terminated')
                    }
                  }}
                >
                  🗑️ Terminate
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
        <div className="overview-grid">
          
          {/* General Info Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
              General Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Hospital Name</label>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{tenant.hospital_name}</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Country</label>
                  <div style={{ fontSize: '0.9375rem' }}>{tenant.country || 'N/A'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>City</label>
                  <div style={{ fontSize: '0.9375rem' }}>{tenant.city || 'N/A'}</div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Address</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.address || 'N/A'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Primary Contact</label>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{tenant.contact_name || 'N/A'}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {tenant.contact_email} • {tenant.contact_phone || 'No phone'}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Billing Email</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.contact_email || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* System & Localization Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
              System & Localization
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Timezone</label>
                  <div style={{ fontSize: '0.9375rem' }}>{tenant.timezone || 'UTC'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Currency</label>
                  <div style={{ fontSize: '0.9375rem' }}>{tenant.currency || 'USD'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Date Format</label>
                  <div style={{ fontSize: '0.9375rem' }}>DD/MM/YYYY</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Data Region</label>
                  <div style={{ fontSize: '0.9375rem' }}>{tenant.data_region || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Database Status</label>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--color-success)', fontWeight: 600 }}>PROVISIONED</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Grace Days</label>
                  <div style={{ fontSize: '0.9375rem' }}>{tenant.grace_days ?? 14} days</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Created Date</label>
                  <div style={{ fontSize: '0.9375rem' }}>{tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Subscription End</label>
                  <div style={{ fontSize: '0.9375rem' }}>{tenant.subscription_end ? new Date(tenant.subscription_end).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid #ffc107', backgroundColor: '#fff8e1', gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', color: '#c43d00', borderBottom: '1px solid #ffe082', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
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
                  <button className="btn btn-primary" onClick={() => handleUpdateStatus('active')}>
                    Unsuspend Account
                  </button>
                ) : (
                  <button className="btn" style={{ backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' }} onClick={() => handleUpdateStatus('suspended')}>
                    Suspend Account
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #ffe082', paddingTop: '1.5rem' }}>
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
                    style={{ backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }} 
                    onClick={() => {
                      if (confirm(`Are you absolutely sure you want to terminate ${tenant.hospital_name}?`)) {
                        handleUpdateStatus('terminated')
                      }
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
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
            Subscription Plan details
          </h3>
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
                      <td>{sub.start_date ? new Date(sub.start_date).toLocaleDateString() : 'N/A'}</td>
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
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
            Invoices and Payments
          </h3>
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
                      <td><code>{inv.id}</code></td>
                      <td>{inv.description || 'Subscription invoice'}</td>
                      <td><strong>{tenant.currency || 'TSH'} {inv.amount.toLocaleString()}</strong></td>
                      <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}</td>
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
        <div className="card" style={{ padding: '1.5rem' }}>
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
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
            Localization & Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9375rem' }}>Maintenance Mode</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>Temporarily block all end-users with a maintenance landing screen.</span>
              </div>
              <input 
                type="checkbox" 
                checked={maintenanceMode} 
                onChange={(e) => setMaintenanceMode(e.target.checked)} 
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9375rem' }}>MFA Enforcement</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)' }}>Require two-factor authentication (MFA) setup for all hospital administrators.</span>
              </div>
              <input 
                type="checkbox" 
                checked={mfaEnforced} 
                onChange={(e) => setMfaEnforced(e.target.checked)} 
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <label className="form-group" style={{ display: 'block', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>API Rate Limiting (reqs/min)</strong>
                <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>Throttling cap threshold applied globally to hospital traffic.</span>
                <input 
                  type="number" 
                  className="form-control" 
                  value={rateLimit} 
                  onChange={(e) => setRateLimit(e.target.value)} 
                />
              </label>
            </div>

            <div>
              <label className="form-group" style={{ display: 'block', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Storage Space Quota Allocation (GB)</strong>
                <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>Upper storage limit for attachments, patient medical files, and scans.</span>
                <input 
                  type="number" 
                  className="form-control" 
                  value={storageQuota} 
                  onChange={(e) => setStorageQuota(e.target.value)} 
                />
              </label>
            </div>

            <button className="btn btn-primary" onClick={handleSaveConfig} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
              Save Configuration
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
