import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Tenant } from '@/api/types/master'

export function TenantManagementPage() {
  const navigate = useNavigate()
  
  // Data states
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  
  // Action dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const fetchTenants = async () => {
    try {
      setLoading(true)
      // Simulating a minor load latency to demonstrate the skeleton state
      await new Promise((r) => setTimeout(r, 600))
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

  // Filtering logic
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.hospital_name.toLowerCase().includes(search.toLowerCase()) ||
      t.tenant_id.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus =
      statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase()
      
    const matchesRegion =
      regionFilter === 'all' || (t.data_region && t.data_region.toLowerCase() === regionFilter.toLowerCase())

    return matchesSearch && matchesStatus && matchesRegion
  })

  // Pagination calculations
  const totalItems = filteredTenants.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex)

  // Reset page on filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, regionFilter, pageSize])

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
        <button className="btn btn-primary" onClick={() => navigate('/master/tenants/new')}>
          + Onboard Tenant
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        
        {/* Filters Panel */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '300px', flex: 1 }}>
            <span className="search-input-icon">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Status:</label>
            <select
              className="form-control"
              style={{ width: '130px', padding: '0.35rem 0.5rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Region:</label>
            <select
              className="form-control"
              style={{ width: '130px', padding: '0.35rem 0.5rem' }}
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="all">All regions</option>
              <option value="af-east">AF-East</option>
              <option value="af-south">AF-South</option>
              <option value="eu-west">EU-West</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Show:</label>
            <select
              className="form-control"
              style={{ width: '70px', padding: '0.35rem 0.5rem' }}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>

        {/* 1. SKELETON LOADING STATE */}
        {loading ? (
          <div className="table-responsive">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Tenant ID</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Region</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx}>
                    <td>
                      <div style={{ height: '14px', width: '150px', backgroundColor: '#e9ecef', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
                    </td>
                    <td>
                      <div style={{ height: '14px', width: '80px', backgroundColor: '#e9ecef', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
                    </td>
                    <td>
                      <div style={{ height: '18px', width: '60px', backgroundColor: '#e9ecef', borderRadius: '12px', animation: 'pulse 1.2s infinite' }} />
                    </td>
                    <td>
                      <div style={{ height: '14px', width: '85px', backgroundColor: '#e9ecef', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
                    </td>
                    <td>
                      <div style={{ height: '14px', width: '60px', backgroundColor: '#e9ecef', borderRadius: '4px', animation: 'pulse 1.2s infinite' }} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ height: '20px', width: '24px', backgroundColor: '#e9ecef', borderRadius: '4px', marginLeft: 'auto', animation: 'pulse 1.2s infinite' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <style>{`
              @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
              }
            `}</style>
          </div>
        ) : paginatedTenants.length === 0 ? (
          /* 2. EMPTY STATE */
          <div style={{ textAlign: 'center', padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</span>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text)' }}>No Hospitals Found</h4>
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', maxWidth: '350px', margin: 0 }}>
              We couldn't find any onboarded hospital tenants matching your current filters or search query.
            </p>
            {(search || statusFilter !== 'all' || regionFilter !== 'all') && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setRegionFilter('all')
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* 3. POPULATED STATE */
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Hospital Name</th>
                    <th>Tenant ID</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Region</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTenants.map((t) => (
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
                        <span className="badge badge-neutral" style={{ borderRadius: '9999px' }}>
                          {t.data_region || 'AF-East'}
                        </span>
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
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '1rem',
                fontSize: '0.8125rem',
                color: 'var(--color-text-light)'
              }}
            >
              <div>
                Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
                <strong>{totalItems}</strong> hospitals
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
