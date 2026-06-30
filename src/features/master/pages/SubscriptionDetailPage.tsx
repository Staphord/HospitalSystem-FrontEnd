import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Subscription, Tenant, SubscriptionPlan } from '@/api/types/master'
import { ChangePlanModal } from '../components/ChangePlanModal'

export function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [now] = useState(() => Date.now())
  const safeLower = (value: string | null | undefined) => String(value || '').toLowerCase()

  useEffect(() => {
    if (!id) return
    let active = true
    const fetchData = async () => {
      try {
        const allSubs = await masterService.listSubscriptions()
        const sub = allSubs.find((s) => s.id === id)

        if (!sub) {
          toast.error('Subscription not found.')
          navigate('/master/subscriptions')
          return
        }

        if (active) {
          setSubscription(sub)
        }

        const [tenantData, plansData] = await Promise.all([
          masterService.getTenant(sub.tenant_id),
          masterService.listPlans()
        ])

        if (active) {
          setTenant(tenantData)
          setPlans(plansData)
          setLoading(false)
        }
      } catch {
        toast.error('Failed to load subscription details.')
        navigate('/master/subscriptions')
      }
    }

    fetchData()
    return () => {
      active = false
    }
  }, [id, navigate])

  const handleToggleAutoRenew = async () => {
    if (!subscription || !id) return
    setUpdating(true)
    const newAutoRenew = !subscription.auto_renew
    try {
      await masterService.updateSubscription(id, { auto_renew: newAutoRenew })
      setSubscription({ ...subscription, auto_renew: newAutoRenew })
      toast.success(`Auto-renew has been ${newAutoRenew ? 'enabled' : 'disabled'}.`)
    } catch {
      toast.error('Failed to update subscription auto-renew status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePlan = async (newPlanName: string) => {
    if (!subscription || !id) return
    const planSlug = newPlanName.toLowerCase()

    const targetPlan = plans.find((p) => p.plan_name.toLowerCase() === planSlug)
    if (!targetPlan) {
      toast.error('Selected plan was not found.')
      return
    }

    // Map plan names to their rankings
    const PLAN_RANKS: Record<string, number> = {
      'free trial': 0,
      'free_trial': 0,
      'trial': 0,
      'basic': 1,
      'standard': 2,
      'premium': 3,
      'enterprise': 4
    }

    const currentRank = PLAN_RANKS[subscription.plan_name.toLowerCase()] ?? 0
    const targetRank = PLAN_RANKS[planSlug] ?? 0

    try {
      if (subscription.status.toLowerCase() === 'trial') {
        await masterService.upgradeSubscriptionEndpoint(subscription.tenant_id, {
          plan_id: targetPlan.plan_id
        })
      } else if (targetRank > currentRank) {
        await masterService.upgradeSubscriptionEndpoint(subscription.tenant_id, {
          plan_id: targetPlan.plan_id
        })
      } else {
        await masterService.downgradeSubscriptionEndpoint(subscription.tenant_id, {
          plan_id: targetPlan.plan_id
        })
      }

      const allSubs = await masterService.listSubscriptions()
      const tenantSubs = allSubs.filter((s) => s.tenant_id === subscription.tenant_id)
      const newSub = tenantSubs[0]
      if (newSub) {
        setSubscription(newSub)
        const tenantData = await masterService.getTenant(newSub.tenant_id)
        setTenant(tenantData)
        navigate(`/master/subscriptions/${newSub.id}`, { replace: true })
      }
    } catch {
      toast.error('Failed to change subscription plan.')
      throw new Error('Failed to change subscription plan.')
    }
  }

  const getDaysRemaining = () => {
    if (!subscription?.end_date) return null
    const end = new Date(subscription.end_date)
    const diff = end.getTime() - now
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-light)' }}>
        Loading subscription details...
      </div>
    )
  }

  if (!subscription || !tenant) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-light)' }}>
        Subscription not found.
      </div>
    )
  }

  const daysRemaining = getDaysRemaining()
  const activePlanDetails = plans.find(
    (p) => safeLower(p.plan_name) === safeLower(subscription.plan_name)
  )
  const includedModules = Array.isArray(activePlanDetails?.modules_included)
    ? activePlanDetails.modules_included
    : []

  // Determine styles and labels for countdown display
  let countdownBg = 'rgba(54, 179, 126, 0.1)'
  let countdownColor = '#36b37e'
  let countdownLabel = 'Healthy'

  if (safeLower(subscription.status) === 'suspended' || safeLower(subscription.status) === 'expired') {
    countdownBg = 'rgba(255, 86, 48, 0.1)'
    countdownColor = '#ff5630'
    countdownLabel = 'Expired / Suspended'
  } else if (daysRemaining !== null) {
    if (daysRemaining <= 0) {
      countdownBg = 'rgba(255, 86, 48, 0.1)'
      countdownColor = '#ff5630'
      countdownLabel = 'Expired'
    } else if (daysRemaining <= 14) {
      countdownBg = 'rgba(255, 171, 0, 0.1)'
      countdownColor = '#ffab00'
      countdownLabel = 'Expiring Soon'
    }
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/master/subscriptions" style={{ fontSize: '0.875rem', textDecoration: 'none', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Back to Subscriptions
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title={`Subscription Details: ${tenant.hospital_name}`}
          description={`Manage active plan logs and auto-billing configurations for tenant: ${tenant.hospital_name}.`}
        />
        <button
          className="btn btn-primary"
          onClick={() => setIsChangePlanOpen(true)}
        >
          Change Plan Tiers
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

        {/* Left Column: Plan Information Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Subscription Status & Terms</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Plan Tier</div>
                <strong style={{ fontSize: '1.125rem', textTransform: 'capitalize' }}>{subscription.plan_name}</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Current Status</div>
                <span className={`status-badge status-${safeLower(subscription.status)}`}>
                  {subscription.status ? subscription.status.replace('_', ' ') : 'unknown'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Start Date</div>
                <div>{subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Renewal/Expiration Date</div>
                <div>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', display: 'block' }}>Auto-Renew</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Automatically generates invoice renewals upon expiration.</span>
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!subscription.auto_renew}
                  disabled={updating}
                  onChange={handleToggleAutoRenew}
                  style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{subscription.auto_renew ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          </div>

          {activePlanDetails && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Provisioned Plan Limits</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Staff Accounts</div>
                  <strong style={{ fontSize: '1.25rem' }}>{activePlanDetails.max_users == null ? 'Unlimited' : activePlanDetails.max_users}</strong>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Patient Records</div>
                  <strong style={{ fontSize: '1.25rem' }}>{activePlanDetails.max_patients == null ? 'Unlimited' : activePlanDetails.max_patients.toLocaleString()}</strong>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Storage Space</div>
                  <strong style={{ fontSize: '1.25rem' }}>{activePlanDetails.storage_gb} GB</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                  Included Application Modules
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {includedModules.map((mod) => (
                    <span
                      key={mod}
                      className="badge"
                      style={{
                        backgroundColor: 'var(--color-secondary-light)',
                        color: 'var(--color-secondary)',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        borderRadius: '9999px',
                        padding: '0.2rem 0.6rem'
                      }}
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Expiry & Quick Links Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Expiration Countdown Chip Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: `1px solid ${countdownColor}`,
              backgroundColor: countdownBg,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: countdownColor }}>hourglass_empty</span>
            <h4 style={{ margin: '0 0 0.25rem 0', color: countdownColor, fontWeight: 700 }}>{countdownLabel}</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--color-text)' }}>
              {daysRemaining !== null ? (
                daysRemaining > 0 ? (
                  `${daysRemaining} Days Left`
                ) : daysRemaining === 0 ? (
                  'Expires Today'
                ) : (
                  `${Math.abs(daysRemaining)} Days Overdue`
                )
              ) : (
                'Lifetime Access'
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              Current billing parameters
            </span>
          </div>

          {/* Quick Actions & Links */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Quick Navigation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to={`/master/tenants/${tenant.tenant_id}`}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_hospital</span>
                View Hospital Profile
              </Link>
              <Link
                to={`/master/invoices?tenant_id=${tenant.tenant_id}`}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
                View Invoices Ledger
              </Link>
              <Link
                to="/master/health"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_up</span>
                View System Health
              </Link>
            </div>
          </div>
        </div>

      </div>

      {isChangePlanOpen && (
        <ChangePlanModal
          currentPlanName={subscription.plan_name}
          onClose={() => setIsChangePlanOpen(false)}
          onSelectPlan={handleChangePlan}
        />
      )}
    </>
  )
}
