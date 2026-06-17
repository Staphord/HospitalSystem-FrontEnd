import { useEffect, useState } from 'react'
import { masterService } from '@/api/services/master'
import type { SubscriptionPlan } from '@/api/types/master'
import { toast } from 'sonner'

interface ChangePlanModalProps {
  currentPlanName: string
  onClose: () => void
  onSelectPlan: (planName: string) => Promise<void>
}

export function ChangePlanModal({ currentPlanName, onClose, onSelectPlan }: ChangePlanModalProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    const fetchPlans = async () => {
      try {
        const data = await masterService.listPlans()
        if (active) {
          setPlans(data)
          setLoading(false)
        }
      } catch {
        if (active) {
          toast.error('Failed to load plans.')
          setLoading(false)
        }
      }
    }
    fetchPlans()
    return () => {
      active = false
    }
  }, [])

  // Find price of current plan
  const currentPlan = plans.find((p) => p.plan_name.toLowerCase() === currentPlanName.toLowerCase())
  const currentPrice = currentPlan ? currentPlan.monthly_price : 0

  const handleSelect = async (planName: string) => {
    setSubmitting(true)
    try {
      await onSelectPlan(planName)
      toast.success(`Plan updated to ${planName} successfully!`)
      onClose()
    } catch {
      toast.error('Failed to update plan.')
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate pricing difference relative to current plan
  const getPriceDifferenceText = (price: number) => {
    const diff = price - currentPrice
    if (diff === 0) return 'Current Plan'
    if (diff > 0) return `+$${diff}/month (Upgrade)`
    return `-$${Math.abs(diff)}/month (Downgrade)`
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px', width: '100%' }}>
        <div className="modal-header">
          <h3>Change Subscription Plan</h3>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>Loading plans comparison...</div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>
                Compare plans and change the active subscription tier for this tenant. Price differences are calculated relative to the current active plan fee of <strong>${currentPrice}/month</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {plans.map((plan) => {
                  const isCurrent = plan.plan_name.toLowerCase() === currentPlanName.toLowerCase()
                  const priceDiff = plan.monthly_price - currentPrice
                  
                  return (
                    <div
                      key={plan.plan_id}
                      style={{
                        border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: isCurrent ? '#f0f5ff' : 'var(--color-surface)',
                        position: 'relative'
                      }}
                    >
                      {isCurrent && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'var(--color-primary)',
                            color: '#ffffff',
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Active
                        </span>
                      )}

                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
                          {plan.plan_name}
                        </h4>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.5rem 0' }}>
                          ${plan.monthly_price}
                          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-light)' }}> /mo</span>
                        </div>

                        {/* Display price difference highlight */}
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: isCurrent ? 'var(--color-primary)' : priceDiff > 0 ? '#ff5630' : '#36b37e',
                            marginBottom: '1rem'
                          }}
                        >
                          {getPriceDifferenceText(plan.monthly_price)}
                        </div>

                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem 0', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--color-text-light)' }}>
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span className="material-symbols-outlined text-success" style={{ fontSize: '14px' }}>check</span>
                            {plan.max_users ? `${plan.max_users} Users` : 'Unlimited Users'}
                          </li>
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span className="material-symbols-outlined text-success" style={{ fontSize: '14px' }}>check</span>
                            {plan.max_patients ? `${plan.max_patients.toLocaleString()} Patients` : 'Unlimited Patients'}
                          </li>
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span className="material-symbols-outlined text-success" style={{ fontSize: '14px' }}>check</span>
                            {plan.storage_gb} GB Storage
                          </li>
                          <li style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span className="material-symbols-outlined text-success" style={{ fontSize: '14px' }}>check</span>
                            {plan.uptime_sla_pct}% SLA
                          </li>
                        </ul>
                      </div>

                      <button
                        type="button"
                        className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.8125rem' }}
                        disabled={isCurrent || submitting}
                        onClick={() => handleSelect(plan.plan_name)}
                      >
                        {isCurrent ? 'Active Plan' : priceDiff > 0 ? 'Upgrade' : 'Downgrade'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
