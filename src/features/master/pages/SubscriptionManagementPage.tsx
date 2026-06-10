import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Subscription, Tenant } from '@/api/types/master'

export function SubscriptionManagementPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)

  // Edit fields
  const [planName, setPlanName] = useState('')
  const [status, setStatus] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subsData, tenantsData] = await Promise.all([
        masterService.listSubscriptions(),
        masterService.listTenants(),
      ])
      setSubscriptions(subsData)
      setTenants(tenantsData)
    } catch (err) {
      toast.error('Failed to load subscription data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getHospitalName = (tenantId: string) => {
    return tenants.find((t) => t.tenant_id === tenantId)?.hospital_name || tenantId
  }

  const handleOpenEdit = (sub: Subscription) => {
    setSelectedSub(sub)
    setPlanName(sub.plan_name)
    setStatus(sub.status)
    setEndDate(sub.end_date ? sub.end_date.split('T')[0] : '')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSub) return
    setSubmitting(true)

    const payload = {
      plan_name: planName,
      status,
      end_date: endDate ? new Date(endDate).toISOString() : null,
    }

    try {
      await masterService.updateSubscription(selectedSub.id, payload)
      toast.success('Subscription plan updated successfully.')
      setSelectedSub(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update subscription.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSetGracePeriod = async (sub: Subscription, days: number) => {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + days)

    const payload = {
      status: 'grace_period',
      end_date: nextDate.toISOString(),
    }

    try {
      await masterService.updateSubscription(sub.id, payload)
      toast.success(`Grace period of ${days} days configured!`)
      fetchData()
    } catch (err) {
      toast.error('Failed to configure grace period.')
    }
  }

  const filteredSubs = subscriptions.filter((s) => {
    const hospital = getHospitalName(s.tenant_id).toLowerCase()
    const plan = s.plan_name.toLowerCase()
    const id = s.id.toLowerCase()
    const query = search.toLowerCase()

    return hospital.includes(query) || plan.includes(query) || id.includes(query)
  })

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-badge status-active'
      case 'grace_period':
        return 'status-badge status-suspended' // Amber color logic matches
      case 'expired':
        return 'status-badge status-terminated' // Red color matches
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

      <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '400px', flex: 1 }}>
            <span className="search-input-icon">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by hospital name, plan tier, subscription ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
                {filteredSubs.map((s) => (
                  <tr key={s.id}>
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
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{s.start_date ? new Date(s.start_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{s.end_date ? new Date(s.end_date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleOpenEdit(s)}
                        >
                          ⚙️ Manage Plan
                        </button>
                        {s.status === 'expired' && (
                          <button
                            className="btn"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.75rem',
                              backgroundColor: '#fff3cd',
                              color: '#856404',
                              border: '1px solid #ffeeba',
                            }}
                            onClick={() => handleSetGracePeriod(s, 14)}
                          >
                            +14d Grace
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSub && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header">
              <h2>Manage Plan - {getHospitalName(selectedSub.tenant_id)}</h2>
              <button className="modal-close" onClick={() => setSelectedSub(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Subscription Plan Tier</label>
                    <select
                      className="form-control"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                    >
                      <option value="standard">Standard Tier</option>
                      <option value="premium">Premium Tier</option>
                      <option value="enterprise">Enterprise Tier</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="grace_period">Grace Period</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Subscription End / Renewal Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedSub(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Save Plan Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
