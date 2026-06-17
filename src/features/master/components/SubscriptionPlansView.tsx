import { useState, useEffect, useCallback } from 'react'
import { masterService } from '@/api/services/master'
import type { SubscriptionPlan } from '@/api/types/master'
import { EditPlanModal } from './EditPlanModal'
import { toast } from 'sonner'

export function SubscriptionPlansView() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      const data = await masterService.listPlans()
      setPlans(data)
      setLoading(false)
    } catch {
      toast.error('Failed to load subscription plans.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlans()
  }, [fetchPlans])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-light)' }}>
        Loading plans...
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {plans.map((plan) => {
          const isPremium = plan.plan_id === 'premium'
          return (
            <div
              key={plan.plan_id}
              className="card"
              style={{
                border: isPremium ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '2rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: '16px',
                overflow: 'visible',
              }}
            >
              {isPremium && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'var(--color-primary)',
                    color: '#ffffff',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Most Popular
                </span>
              )}

              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {plan.plan_name}
                </h3>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', marginBottom: '1.5rem', minHeight: '40px' }}>
                  {plan.description || 'Custom corporate tier plan features.'}
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    ${plan.monthly_price}
                  </span>
                  <span style={{ color: 'var(--color-text-light)', fontSize: '0.875rem' }}> / month</span>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>✔️</span>
                      <span>
                        <strong>{plan.max_users === null ? 'Unlimited' : plan.max_users}</strong> staff user accounts
                      </span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>✔️</span>
                      <span>
                        <strong>{plan.max_patients === null ? 'Unlimited' : plan.max_patients.toLocaleString()}</strong> patient records
                      </span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>✔️</span>
                      <span>
                        <strong>{plan.storage_gb} GB</strong> secure document storage
                      </span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>✔️</span>
                      <span>
                        <strong>{plan.uptime_sla_pct}%</strong> guaranteed server uptime SLA
                      </span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>✔️</span>
                      <span>
                        Backups every <strong>{plan.backup_frequency_hours} hours</strong>
                      </span>
                    </li>
                  </ul>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    Included Modules
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {plan.modules_included.map((mod) => (
                      <span
                        key={mod}
                        className="badge"
                        style={{
                          backgroundColor: 'var(--color-secondary-light)',
                          color: 'var(--color-secondary)',
                          fontSize: '0.7rem',
                          textTransform: 'capitalize',
                          borderRadius: '9999px',
                        }}
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1rem' }}
                onClick={() => setEditingPlan(plan)}
              >
                ✏️ Edit Plan Tiers
              </button>
            </div>
          )
        })}
      </div>

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={() => {
            setEditingPlan(null)
            fetchPlans()
          }}
        />
      )}
    </div>
  )
}
