import React, { useState } from 'react'
import { masterService } from '@/api/services/master'
import type { SubscriptionPlan } from '@/api/types/master'
import { toast } from 'sonner'

interface EditPlanModalProps {
  plan: SubscriptionPlan
  onClose: () => void
  onSave: () => void
}

const AVAILABLE_MODULES = [
  'reception',
  'triage',
  'consultation',
  'laboratory',
  'radiology',
  'pharmacy',
  'billing',
  'ward',
  'notifications',
  'reports',
]

export function EditPlanModal({ plan, onClose, onSave }: EditPlanModalProps) {
  const [planName, setPlanName] = useState(plan.plan_name)
  const [description, setDescription] = useState(plan.description || '')
  const [monthlyPrice, setMonthlyPrice] = useState(plan.monthly_price.toString())
  const [annualPrice, setAnnualPrice] = useState(plan.annual_price.toString())
  
  const [isUnlimitedUsers, setIsUnlimitedUsers] = useState(plan.max_users === null)
  const [maxUsers, setMaxUsers] = useState(plan.max_users ? plan.max_users.toString() : '10')

  const [isUnlimitedPatients, setIsUnlimitedPatients] = useState(plan.max_patients === null)
  const [maxPatients, setMaxPatients] = useState(plan.max_patients ? plan.max_patients.toString() : '10000')

  const [storageGb, setStorageGb] = useState(plan.storage_gb.toString())
  const [uptimeSla, setUptimeSla] = useState(plan.uptime_sla_pct.toString())
  const [backupHours, setBackupHours] = useState(plan.backup_frequency_hours.toString())
  
  const [selectedModules, setSelectedModules] = useState<string[]>(plan.modules_included)
  const [submitting, setSubmitting] = useState(false)

  const handleModuleToggle = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter((m) => m !== mod))
    } else {
      setSelectedModules([...selectedModules, mod])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload: Partial<SubscriptionPlan> = {
      plan_name: planName,
      description,
      monthly_price: Number(monthlyPrice),
      annual_price: Number(annualPrice),
      max_users: isUnlimitedUsers ? null : Number(maxUsers),
      max_patients: isUnlimitedPatients ? null : Number(maxPatients),
      storage_gb: Number(storageGb),
      uptime_sla_pct: Number(uptimeSla),
      backup_frequency_hours: Number(backupHours),
      modules_included: selectedModules,
    }

    try {
      await masterService.updatePlan(plan.plan_id, payload)
      toast.success(`Plan "${planName}" updated successfully!`)
      onSave()
    } catch {
      toast.error('Failed to update subscription plan.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px', width: '100%' }}>
        <div className="modal-header">
          <h3>Edit Plan Configuration - {plan.plan_name}</h3>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Plan Name</label>
              <input
                type="text"
                className="form-control"
                required
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Plan Description</label>
              <textarea
                className="form-control"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Monthly Price ($ USD)</label>
              <input
                type="number"
                className="form-control"
                required
                min="0"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Annual Price ($ USD)</label>
              <input
                type="number"
                className="form-control"
                required
                min="0"
                value={annualPrice}
                onChange={(e) => setAnnualPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Max User Accounts</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-control"
                  disabled={isUnlimitedUsers}
                  min="1"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={isUnlimitedUsers}
                    onChange={(e) => setIsUnlimitedUsers(e.target.checked)}
                  />
                  <span>Unlimited</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Max Patients</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-control"
                  disabled={isUnlimitedPatients}
                  min="1"
                  value={maxPatients}
                  onChange={(e) => setMaxPatients(e.target.value)}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={isUnlimitedPatients}
                    onChange={(e) => setIsUnlimitedPatients(e.target.checked)}
                  />
                  <span>Unlimited</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Storage Space Allocation (GB)</label>
              <input
                type="number"
                className="form-control"
                required
                min="1"
                value={storageGb}
                onChange={(e) => setStorageGb(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Guaranteed Uptime SLA (%)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                required
                min="90"
                max="100"
                value={uptimeSla}
                onChange={(e) => setUptimeSla(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Backup Frequency (Hours)</label>
              <input
                type="number"
                className="form-control"
                required
                min="1"
                value={backupHours}
                onChange={(e) => setBackupHours(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <label style={{ marginBottom: '0.75rem', display: 'block' }}>Included Application Modules</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {AVAILABLE_MODULES.map((mod) => (
                  <label key={mod} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(mod)}
                      onChange={() => handleModuleToggle(mod)}
                    />
                    <span>{mod}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Plan Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
