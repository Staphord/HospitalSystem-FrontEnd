import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Subscription, Tenant } from '@/api/types/master'
import { SubscriptionPlansView } from '../components/SubscriptionPlansView'

interface PendingRequest {
  tenant_id: string
  hospital_name?: string
  pending_action: 'upgrade' | 'downgrade' | 'cancellation' | 'plan_change'
  requested_plan?: string
  plan_name?: string
  request_reason?: string
  requested_at: string
  status?: 'pending' | 'approved' | 'rejected'
  review_notes?: string
  billing_cycle?: string
  effective_at_end?: boolean
}

export function SubscriptionManagementPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tenantIdParam = searchParams.get('tenant_id')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'tiers' | 'requests'>('active')
  const [now] = useState(() => Date.now())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Requests state
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Reject Modal states
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectingTenantId, setRejectingTenantId] = useState<string | null>(null)
  const [tempRejectReason, setTempRejectReason] = useState('')

  // Requests Filtering and Pagination state
  const [requestsSearch, setRequestsSearch] = useState('')
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1)
  const [requestsPageSize, setRequestsPageSize] = useState(25)
  const [requestsFilterAction, setRequestsFilterAction] = useState<'all' | 'upgrade' | 'downgrade' | 'cancellation'>('all')
  const [requestsFilterStatus, setRequestsFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

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

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true)
    try {
      const data = await masterService.listPendingRequests() as any
      setRequests(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load subscription requests.')
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests()
    }
  }, [activeTab, fetchRequests])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  useEffect(() => {
    setRequestsCurrentPage(1)
  }, [requestsSearch, requestsFilterAction, requestsFilterStatus])

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

  // Requests pagination and filtering calculations
  const filteredRequests = requests.filter((req) => {
    const hospital = safeLower(getHospitalName(req.tenant_id))
    const id = safeLower(req.tenant_id)
    const plan = safeLower(req.requested_plan || '')
    const reason = safeLower(req.request_reason || '')
    const action = safeLower(req.pending_action)
    const status = safeLower(req.status || 'pending')
    const query = safeLower(requestsSearch)

    const matchesSearch =
      hospital.includes(query) ||
      id.includes(query) ||
      plan.includes(query) ||
      reason.includes(query) ||
      action.includes(query)

    const matchesAction =
      requestsFilterAction === 'all' ||
      req.pending_action === requestsFilterAction

    const matchesStatus =
      requestsFilterStatus === 'all' ||
      status === requestsFilterStatus

    return matchesSearch && matchesAction && matchesStatus
  })

  const totalRequestsItems = filteredRequests.length
  const totalRequestsPages = Math.ceil(totalRequestsItems / requestsPageSize) || 1
  const startRequestsIndex = (requestsCurrentPage - 1) * requestsPageSize
  const endRequestsIndex = Math.min(startRequestsIndex + requestsPageSize, totalRequestsItems)
  const paginatedRequests = filteredRequests.slice(startRequestsIndex, endRequestsIndex)

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

  const handleApprove = async (tenantId: string) => {
    setActionLoading(tenantId)
    try {
      await masterService.approveRequest(tenantId, 'Approved by super admin')
      toast.success(`Request for ${tenantId} approved.`)
      fetchRequests()
    } catch {
      toast.error('Failed to approve request.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (tenantId: string, notes: string) => {
    if (!notes.trim()) {
      toast.error('Please provide a rejection reason.')
      return
    }
    setActionLoading(tenantId)
    try {
      await masterService.rejectRequest(tenantId, notes)
      toast.success(`Request for ${tenantId} rejected.`)
      fetchRequests()
      setIsRejectModalOpen(false)
      setRejectingTenantId(null)
      setTempRejectReason('')
    } catch {
      toast.error('Failed to reject request.')
    } finally {
      setActionLoading(null)
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
        <button
          className={`nav-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Subscription Requests
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
      ) : activeTab === 'tiers' ? (
        <SubscriptionPlansView />
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px', flexWrap: 'wrap' }}>
              <div className="search-input-wrapper" style={{ minWidth: '250px', flex: 1 }}>
                <span className="material-symbols-outlined search-input-icon" style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>search</span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search requests by hospital, plan, reason..."
                  value={requestsSearch}
                  onChange={(e) => setRequestsSearch(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                value={requestsFilterAction}
                onChange={(e) => setRequestsFilterAction(e.target.value as any)}
                style={{ maxWidth: '180px', width: 'auto' }}
                title="Filter by Action"
              >
                <option value="all">All Actions</option>
                <option value="upgrade">Plan Upgrades</option>
                <option value="downgrade">Plan Downgrades</option>
                <option value="cancellation">Cancellations</option>
              </select>

              <select
                className="form-control"
                value={requestsFilterStatus}
                onChange={(e) => setRequestsFilterStatus(e.target.value as any)}
                style={{ maxWidth: '180px', width: 'auto' }}
                title="Filter by Status"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <select
              className="form-control"
              value={requestsPageSize}
              onChange={(e) => {
                setRequestsPageSize(Number(e.target.value))
                setRequestsCurrentPage(1)
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

          {requestsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              Loading subscription requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              No subscription requests found matching current filters.
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Hospital / Tenant</th>
                      <th>Action</th>
                      <th>Details</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Requested At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.map((req, idx) => (
                      <tr key={req.tenant_id + '-' + idx}>
                        <td style={{ fontWeight: 600 }}>
                          {req.hospital_name || req.tenant_id}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                            ID: <code>{req.tenant_id}</code>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge ${req.pending_action === 'cancellation' ? 'badge-danger' : 'badge-primary'}`}
                            style={{
                              textTransform: 'capitalize',
                              background: req.pending_action === 'cancellation' ? 'rgba(255, 86, 48, 0.12)' : 'rgba(0, 82, 204, 0.12)',
                              color: req.pending_action === 'cancellation' ? 'var(--error-color, #ff5630)' : 'var(--primary-color, #0052cc)',
                            }}
                          >
                            {req.pending_action === 'cancellation' ? 'Cancellation' : req.pending_action === 'upgrade' ? 'Upgrade' : 'Downgrade'}
                          </span>
                        </td>
                        <td>
                          {(req.pending_action === 'upgrade' || req.pending_action === 'downgrade') && req.requested_plan ? (
                            <span>To: <strong>{req.requested_plan.toUpperCase()}</strong> {req.billing_cycle && `(${req.billing_cycle})`}</span>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                          )}
                        </td>
                        <td>
                          <div>{req.request_reason || '-'}</div>
                          {req.status === 'rejected' && req.review_notes && (
                            <div style={{ fontSize: '0.8rem', color: '#ff5630', marginTop: '4px', fontStyle: 'italic' }}>
                              Rejection reason: "{req.review_notes}"
                            </div>
                          )}
                          {req.status === 'approved' && req.review_notes && (
                            <div style={{ fontSize: '0.8rem', color: '#36b37e', marginTop: '4px', fontStyle: 'italic' }}>
                              Approval notes: "{req.review_notes}"
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge badge-${req.status === 'approved' ? 'success' : req.status === 'rejected' ? 'danger' : 'warning'}`}
                            style={{
                              textTransform: 'capitalize',
                              background: req.status === 'approved' ? 'rgba(54, 179, 126, 0.12)' : req.status === 'rejected' ? 'rgba(255, 86, 48, 0.12)' : 'rgba(255, 171, 0, 0.12)',
                              color: req.status === 'approved' ? '#36B37E' : req.status === 'rejected' ? '#FF5630' : '#FFAB00',
                            }}
                          >
                            {req.status || 'pending'}
                          </span>
                        </td>
                        <td>{new Date(req.requested_at).toLocaleDateString()}</td>
                        <td>
                          {(!req.status || req.status === 'pending') ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  disabled={actionLoading === req.tenant_id}
                                  onClick={() => handleApprove(req.tenant_id)}
                                >
                                  {actionLoading === req.tenant_id ? 'Processing...' : 'Approve'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  disabled={actionLoading === req.tenant_id}
                                  onClick={() => {
                                    setRejectingTenantId(req.tenant_id)
                                    setTempRejectReason('')
                                    setIsRejectModalOpen(true)
                                  }}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                              Processed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalRequestsItems > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Showing <strong>{startRequestsIndex + 1}</strong> to <strong>{endRequestsIndex}</strong> of{' '}
                    <strong>{totalRequestsItems}</strong> entries
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={requestsCurrentPage === 1}
                      onClick={() => setRequestsCurrentPage(requestsCurrentPage - 1)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                    </button>

                    {Array.from({ length: totalRequestsPages }, (_, i) => i + 1).map((page) => {
                      if (page === 1 || page === totalRequestsPages || (page >= requestsCurrentPage - 2 && page <= requestsCurrentPage + 2)) {
                        return (
                          <button
                            key={page}
                            className={`btn ${requestsCurrentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }}
                            onClick={() => setRequestsCurrentPage(page)}
                          >
                            {page}
                          </button>
                        )
                      }
                      if (page === requestsCurrentPage - 3 || page === requestsCurrentPage + 3) {
                        return <span key={`ellipsis-${page}`} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>...</span>
                      }
                      return null
                    })}

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={requestsCurrentPage === totalRequestsPages}
                      onClick={() => setRequestsCurrentPage(requestsCurrentPage + 1)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* Reject Request Modal */}
      {isRejectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header">
              <h2>Reject Subscription Request</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setIsRejectModalOpen(false)
                  setRejectingTenantId(null)
                  setTempRejectReason('')
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Please specify the reason for rejecting the subscription change/cancellation request for <strong>{getHospitalName(rejectingTenantId || '')}</strong>.
              </p>
              <div className="form-group">
                <label style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>
                  Rejection Reason
                </label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Enter the reason why this request is being rejected..."
                  value={tempRejectReason}
                  onChange={(e) => setTempRejectReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsRejectModalOpen(false)
                  setRejectingTenantId(null)
                  setTempRejectReason('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={!tempRejectReason.trim() || (rejectingTenantId !== null && actionLoading === rejectingTenantId)}
                onClick={() => rejectingTenantId && handleReject(rejectingTenantId, tempRejectReason)}
              >
                {rejectingTenantId !== null && actionLoading === rejectingTenantId ? 'Processing...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
