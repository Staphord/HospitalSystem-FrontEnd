import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Subscription, Tenant } from '@/api/types/master'
import { SubscriptionPlansView } from '../components/SubscriptionPlansView'

export function SubscriptionManagementPage() {
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'tiers'>('active')
  const [now] = useState(() => Date.now())

  const fetchData = useCallback(async () => {
    try {
      const [subsData, tenantsData] = await Promise.all([
        masterService.listSubscriptions(),
        masterService.listTenants(),
      ])
      setSubscriptions(subsData)
      setTenants(tenantsData)
      setLoading(false)
    } catch {
      toast.error('Failed to load subscription data.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const getHospitalName = (tenantId: string) => {
    return tenants.find((t) => t.tenant_id === tenantId)?.hospital_name || tenantId
  }

  const getRowStyle = (sub: Subscription) => {
    const isRed = ['expired', 'suspended', 'grace_period', 'grace'].includes(sub.status.toLowerCase())
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
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
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
                          {s.status.replace('_', ' ')}
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
          )}
        </div>
      ) : (
        <SubscriptionPlansView />
      )}
    </>
  )
}

