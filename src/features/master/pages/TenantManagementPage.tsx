import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Tenant, TenantCreate } from '@/api/types/master'

export function TenantManagementPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Form state
  const [hospitalName, setHospitalName] = useState('')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminFullName, setAdminFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const data = await masterService.listTenants()
      setTenants(data)
    } catch (err) {
      toast.error('Failed to load tenants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload: TenantCreate = {
      hospital_name: hospitalName,
      admin_username: adminUsername,
      admin_password: adminPassword,
      admin_email: adminEmail,
      admin_full_name: adminFullName || undefined,
    }

    try {
      await masterService.createTenant(payload)
      toast.success(`Tenant "${hospitalName}" onboarded successfully!`)
      setIsModalOpen(false)
      // Reset form
      setHospitalName('')
      setAdminUsername('')
      setAdminPassword('')
      setAdminEmail('')
      setAdminFullName('')
      fetchTenants()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to onboard tenant.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (tenantId: string, newStatus: string) => {
    try {
      await masterService.updateTenant(tenantId, { status: newStatus })
      toast.success(`Tenant status updated to ${newStatus}.`)
      fetchTenants()
    } catch (err) {
      toast.error('Failed to update tenant status.')
    }
  }

  const handleImpersonate = (tenant: Tenant) => {
    localStorage.setItem('impersonated_tenant_id', tenant.tenant_id)
    window.dispatchEvent(new Event('impersonation-change'))
    toast.success(`Now impersonating ${tenant.hospital_name}. Redirecting to clinical view...`)
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1200)
  }

  const filteredTenants = tenants.filter((t) =>
    t.hospital_name.toLowerCase().includes(search.toLowerCase()) ||
    t.tenant_id.toLowerCase().includes(search.toLowerCase())
  )

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
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="Tenants"
          description="Manage registered hospitals on the platform."
        />
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Onboard Tenant
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '400px', flex: 1 }}>
            <span className="search-input-icon">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search hospitals by name or tenant ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            Loading tenants...
          </div>
        ) : filteredTenants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            No tenants found matching your query.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Tenant ID</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Subscription End</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((t) => (
                  <tr 
                    key={t.tenant_id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/master/tenants/${t.tenant_id}`)}
                  >
                    <td>
                      <strong>{t.hospital_name}</strong>
                    </td>
                    <td><code>{t.tenant_id}</code></td>
                    <td>
                      <span className={getStatusBadgeClass(t.status)}>{t.status}</span>
                    </td>
                    <td>{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      {t.subscription_end
                        ? new Date(t.subscription_end).toLocaleDateString()
                        : 'No Active Subscription'}
                    </td>
                    <td 
                      style={{ textAlign: 'right', position: 'relative' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          lineHeight: 1,
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDropdown(activeDropdown === t.tenant_id ? null : t.tenant_id)
                        }}
                      >
                        ⋮
                      </button>

                      {activeDropdown === t.tenant_id && (
                        <>
                          <div
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 99,
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveDropdown(null)
                            }}
                          />
                          <div className="dropdown-menu-wrapper" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="dropdown-item-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/master/tenants/${t.tenant_id}`)
                                setActiveDropdown(null)
                              }}
                            >
                              <span>ℹ️</span> View details
                            </button>
                            
                            <div className="dropdown-menu-divider" />

                            {t.status === 'active' && (
                              <button
                                className="dropdown-item-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleImpersonate(t)
                                  setActiveDropdown(null)
                                }}
                              >
                                <span>👁️</span> Impersonate
                              </button>
                            )}
                            {t.status === 'active' && (
                              <button
                                className="dropdown-item-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateStatus(t.tenant_id, 'suspended')
                                  setActiveDropdown(null)
                                }}
                              >
                                <span>⏸️</span> Suspend
                              </button>
                            )}
                            {t.status === 'suspended' && (
                              <button
                                className="dropdown-item-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateStatus(t.tenant_id, 'active')
                                  setActiveDropdown(null)
                                }}
                              >
                                <span>▶️</span> Unsuspend
                              </button>
                            )}
                            {t.status !== 'terminated' && (
                              <>
                                <div className="dropdown-menu-divider" />
                                <button
                                  className="dropdown-item-btn dropdown-item-danger"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveDropdown(null)
                                    if (confirm(`Are you absolutely sure you want to terminate ${t.hospital_name}?`)) {
                                      handleUpdateStatus(t.tenant_id, 'terminated')
                                    }
                                  }}
                                >
                                  <span>🗑️</span> Terminate
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
            <div className="modal-header">
              <h2>Onboard New Hospital</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Hospital Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Gilgal General Hospital"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Admin Username</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. admin_gilgal"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Admin Password</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Admin Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="e.g. contact@gilgal.org"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Admin Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. John Doe"
                      value={adminFullName}
                      onChange={(e) => setAdminFullName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Onboarding...' : 'Onboard Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
