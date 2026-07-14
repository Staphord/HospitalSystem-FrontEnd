import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Subscription, Tenant } from '@/api/types/master'
import { SubscriptionPlansView } from '../components/SubscriptionPlansView'

export function SubscriptionManagementPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tenantIdParam = searchParams.get('tenant_id')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'tiers'>('active')
  const [now] = useState(() => Date.now())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const fetchData = useCallback(async () => {
    try {
      const [subsData, tenantsData] = await Promise.all([
        masterService.listSubscriptions(tenantIdParam || undefined),
        masterService.listTenants(),
      ])
      setSubscriptions(subsData)
      setTenants(tenantsData)
      setLoading(false)
    } catch {
      toast.error('Failed to load subscription data.')
      setLoading(false)
    }
  }, [tenantIdParam])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const getHospitalName = (tenantId: string) => {
    return tenants.find((t) => t.tenant_id === tenantId)?.hospital_name || tenantId
  }

  const safeLower = (value: string | null | undefined) => String(value || '').toLowerCase()

  const getRowStyle = (sub: Subscription) => {
    const status = safeLower(sub.status)
    const isRed = ['expired', 'suspended', 'grace_period', 'grace'].includes(status)
    if (isRed) {
      return { backgroundColor: 'rgba(255, 86, 48, 0.08)' } // Red highlight for grace/suspended/expired
    }

    if (sub.end_date) {
      const msLeft = new Date(sub.end_date).getTime() - now
      const daysLeft = msLeft / (1000 * 3600 * 24)
      if (daysLeft > 0 && daysLeft <= 14) {
        return { backgroundColor: 'rgba(255, 171, 0, 0.08)' } // Amber highlight for expiring within 14 days
      }
    }

    return undefined
  }

  const filteredSubs = subscriptions.filter((s) => {
    const hospital = safeLower(getHospitalName(s.tenant_id))
    const plan = safeLower(s.plan_name)
    const id = safeLower(s.id)
    const query = safeLower(search)

    return hospital.includes(query) || plan.includes(query) || id.includes(query)
  })

  // Pagination calculations
  const totalItems = filteredSubs.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedSubs = filteredSubs.slice(startIndex, endIndex)

  const getStatusBadgeClass = (status: string | null | undefined) => {
    switch (safeLower(status)) {
      case 'active':
        return 'status-badge status-active'
      case 'grace_period':
      case 'grace':
        return 'status-badge status-trial' // Yellowish status
      case 'suspended':
      case 'expired':
        return 'status-badge status-terminated' // Red status
      default:
        return 'status-badge'
    }
  }

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Monitor active plans, upgrade tier levels, and configure grace period extensions."
      />

      {/* Tabs */}
      <div className="nav-tabs" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
        <button
          className={`nav-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Subscriptions
        </button>
        <button
          className={`nav-tab-btn ${activeTab === 'tiers' ? 'active' : ''}`}
          onClick={() => setActiveTab('tiers')}
        >
          Subscription Tiers
        </button>
      </div>

      {activeTab === 'active' ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ maxWidth: '400px', flex: 1 }}>
              <span className="material-symbols-outlined search-input-icon" style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>search</span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by hospital name, plan tier, subscription ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              style={{ maxWidth: '150px', width: 'auto' }}
              title="Page Size"
            >
              <option value={10}>Show: 10</option>
              <option value={25}>Show: 25</option>
              <option value={50}>Show: 50</option>
              <option value={100}>Show: 100</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              Loading subscription logs...
            </div>
          ) : filteredSubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              No subscriptions found.
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Hospital / Tenant</th>
                      <th>Plan Tier</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>Renewal/End Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubs.map((s) => (
                      <tr 
                        key={s.id} 
                        style={{ cursor: 'pointer', ...getRowStyle(s) }}
                        onClick={() => navigate(`/master/subscriptions/${s.id}`)}
                      >
                        <td>
                          <strong>{getHospitalName(s.tenant_id)}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ID: <code>{s.tenant_id}</code>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ textTransform: 'capitalize' }}>
                            {s.plan_name}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(s.status)}>
                            {safeLower(s.status).replace('_', ' ') || 'unknown'}
                          </span>
                        </td>
                        <td>{s.start_date ? new Date(s.start_date).toLocaleDateString() : 'N/A'}</td>
                        <td>{s.end_date ? new Date(s.end_date).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/master/subscriptions/${s.id}`)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>settings</span>
                            Manage Plan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalItems > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
                    <strong>{totalItems}</strong> entries
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                        return (
                          <button
                            key={page}
                            className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        )
                      }
                      if (page === currentPage - 3 || page === currentPage + 3) {
                        return <span key={`ellipsis-${page}`} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>...</span>
                      }
                      return null
                    })}

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <SubscriptionPlansView />
      )}
    </>
  )
}
