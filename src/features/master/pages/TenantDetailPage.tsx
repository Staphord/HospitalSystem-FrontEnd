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

  // Modal states
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isTerminateOpen, setIsTerminateOpen] = useState(false)

  // Suspend Modal state
  const [suspensionReason, setSuspensionReason] = useState('')
  const [suspending, setSuspending] = useState(false)

  // Terminate Modal states
  const [terminateStep, setTerminateStep] = useState(1)
  const [hospitalNameConfirm, setHospitalNameConfirm] = useState('')
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false)
  const [backupVerified, setBackupVerified] = useState(false)
  const [finalConsent1, setFinalConsent1] = useState(false)
  const [finalConsent2, setFinalConsent2] = useState(false)
  const [terminating, setTerminating] = useState(false)

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

  const handleSuspend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant || !id || !suspensionReason.trim()) return
    setSuspending(true)

    try {
      await masterService.updateTenant(id, { 
        status: 'suspended',
        // Pass suspension reason to the mock client to register it in audit logs
        ...({ suspension_reason: suspensionReason } as any)
      })
      toast.success(`Tenant "${tenant.hospital_name}" suspended successfully.`)
      setIsSuspendOpen(false)
      setSuspensionReason('')
      fetchData()
    } catch (err) {
      toast.error('Failed to suspend tenant.')
    } finally {
      setSuspending(false)
    }
  }

  const handleUnsuspend = async () => {
    if (!tenant || !id) return
    try {
      await masterService.updateTenant(id, { status: 'active' })
      toast.success(`Tenant "${tenant.hospital_name}" reactivated successfully.`)
      fetchData()
    } catch (err) {
      toast.error('Failed to reactivate tenant.')
    }
  }

  const handleDownloadBackup = () => {
    if (!tenant) return
    const backupData = {
      tenant_id: tenant.tenant_id,
      hospital_name: tenant.hospital_name,
      exported_at: new Date().toISOString(),
      statistics: { active_staff_users: 18, total_patients: 8450, storage_gb: 23, db_size_mb: 184 },
      profile: tenant
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tenant.tenant_id}_clinical_data_export.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setHasDownloadedBackup(true)
    toast.success('Backup export file generated and downloaded successfully!')
  }

  const handleTerminate = async () => {
    if (!tenant || !id) return
    setTerminating(true)

    try {
      await masterService.updateTenant(id, { status: 'terminated' })
      toast.success(`Tenant organization "${tenant.hospital_name}" has been permanently terminated.`)
      setIsTerminateOpen(false)
      navigate('/master/tenants')
    } catch (err) {
      toast.error('Failed to terminate organization.')
    } finally {
      setTerminating(false)
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
            gap: '0.25rem',
            marginBottom: '1rem' 
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
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
                <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>local_hospital</span>
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
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>login</span>
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
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pause</span>
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
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
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
                    setTerminateStep(1)
                    setHospitalNameConfirm('')
                    setHasDownloadedBackup(false)
                    setBackupVerified(false)
                    setFinalConsent1(false)
                    setFinalConsent2(false)
                    setIsTerminateOpen(true)
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
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
                <div style={{ fontSize: '0.9375rem' }}>{tenant.country || 'N/A'}</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600, textTransform: 'uppercase' }}>City</label>
                <div style={{ fontSize: '0.9375rem' }}>{tenant.city || 'N/A'}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
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
                <div style={{ fontSize: '0.9375rem' }}>{tenant.billing_email || tenant.contact_email || 'N/A'}</div>
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
                <div style={{ fontSize: '0.9375rem' }}>{tenant.data_region || 'N/A'}</div>
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
                      setTerminateStep(1)
                      setHospitalNameConfirm('')
                      setHasDownloadedBackup(false)
                      setBackupVerified(false)
                      setFinalConsent1(false)
                      setFinalConsent2(false)
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
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
              Invoices and Payments
            </h3>
            <Link
              to={`/master/invoices?search=${tenant.tenant_id}`}
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
      {isSuspendOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', width: '100%' }}>
            <div className="modal-header">
              <h3>Confirm Hospital Suspension</h3>
              <button className="modal-close" onClick={() => setIsSuspendOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSuspend}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '1rem' }}>
                  You are about to suspend access for <strong>{tenant.hospital_name}</strong>. All staff users will be locked out immediately.
                </p>
                <div className="form-group">
                  <label>Suspension Reason *</label>
                  <textarea
                    className="form-control"
                    required
                    rows={3}
                    placeholder="Enter reason for suspending this tenant account..."
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsSuspendOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger" disabled={suspending || !suspensionReason.trim()}>
                  {suspending ? 'Suspending...' : 'Confirm Suspend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-STEP TERMINATE TENANT MODAL */}
      {isTerminateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #f5c6cb' }}>
              <h3 style={{ color: '#ff5630' }}>Terminate Hospital Account - Step {terminateStep} of 3</h3>
              <button className="modal-close" onClick={() => setIsTerminateOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
                &times;
              </button>
            </div>
            
            {/* Step 1: Warning with statistics & lock */}
            {terminateStep === 1 && (
              <div className="modal-body">
                <div style={{ backgroundColor: '#ffebe6', color: '#ff5630', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.8125rem', border: '1px solid #f5c6cb', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                  <div>
                    <strong>CRITICAL WARNING:</strong> This action is permanent and completely irreversible. Proceeding will permanently delete all records associated with this hospital.
                  </div>
                </div>
                
                <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Data Loss Statistics Summary:</h4>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--color-border)' }}>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', lineHeight: '1.5' }}>
                    <li>Active Hospital Staff Accounts: <strong>18 accounts</strong></li>
                    <li>Stored Patient Demographic Profiles: <strong>8,450 records</strong></li>
                    <li>Document Storage attachments: <strong>23 GB</strong></li>
                    <li>Provisioned Database Space: <strong>184 MB</strong></li>
                  </ul>
                </div>

                <div className="form-group">
                  <label>Type the hospital name (<strong>{tenant.hospital_name}</strong>) to unlock Next:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter hospital name exactly..."
                    value={hospitalNameConfirm}
                    onChange={(e) => setHospitalNameConfirm(e.target.value)}
                  />
                </div>
                
                <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none', backgroundColor: 'transparent' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsTerminateOpen(false)}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    disabled={hospitalNameConfirm !== tenant.hospital_name}
                    onClick={() => setTerminateStep(2)}
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Backup Export */}
            {terminateStep === 2 && (
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  A compliance backup of the organization database must be downloaded before termination can proceed.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleDownloadBackup}
                    style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span className="material-symbols-outlined">download</span>
                    Generate & Download Backup Export (JSON)
                  </button>
                </div>

                {hasDownloadedBackup && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#e3fcef',
                      border: '1px solid #c3e6cb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <input
                      type="checkbox"
                      id="chk_verify_backup"
                      checked={backupVerified}
                      onChange={(e) => setBackupVerified(e.target.checked)}
                      style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                    />
                    <label htmlFor="chk_verify_backup" style={{ fontSize: '0.8125rem', color: '#155724', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                      I confirm that the database backup has been successfully downloaded, archived, and verified as readable.
                    </label>
                  </div>
                )}

                <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none', backgroundColor: 'transparent' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setTerminateStep(1)}>
                    Back
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    disabled={!backupVerified}
                    onClick={() => setTerminateStep(3)}
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Final confirmation */}
            {terminateStep === 3 && (
              <div className="modal-body">
                <div style={{ backgroundColor: '#ffebe6', color: '#ff5630', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8125rem', border: '1px solid #f5c6cb', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                  <div>
                    <strong>FINAL WARNING:</strong> Pressing "Terminate Organization" will execute a hard delete of the tenant database. This operation cannot be canceled or recovered.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                    <input
                      type="checkbox"
                      checked={finalConsent1}
                      onChange={(e) => setFinalConsent1(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <span>I understand that this will delete all clinical records, staff accounts, invoices, and payment audits.</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                    <input
                      type="checkbox"
                      checked={finalConsent2}
                      onChange={(e) => setFinalConsent2(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <span>I understand that this action is permanent and completely irreversible.</span>
                  </label>
                </div>

                <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none', backgroundColor: 'transparent' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setTerminateStep(2)}>
                    Back
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    disabled={!finalConsent1 || !finalConsent2 || terminating}
                    onClick={handleTerminate}
                  >
                    {terminating ? 'Terminating...' : 'Terminate Organization'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
