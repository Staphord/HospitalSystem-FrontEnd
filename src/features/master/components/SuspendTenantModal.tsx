import React, { useState } from 'react'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Tenant } from '@/api/types/master'

export interface SuspendTenantModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  tenantName: string
  onSuccess: () => void
}

export function SuspendTenantModal({ isOpen, onClose, tenantId, tenantName, onSuccess }: SuspendTenantModalProps) {
  const [suspensionReason, setSuspensionReason] = useState('')
  const [suspending, setSuspending] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId || !suspensionReason.trim()) return
    setSuspending(true)

    try {
      await masterService.updateTenant(tenantId, {
        status: 'suspended',
        suspension_reason: suspensionReason
      } as unknown as Partial<Tenant>)
      toast.success(`Tenant "${tenantName}" suspended successfully.`)
      setSuspensionReason('')
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to suspend tenant.')
    } finally {
      setSuspending(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="modal-header">
          <h3>Confirm Hospital Suspension</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '1rem' }}>
              You are about to suspend access for <strong>{tenantName}</strong>. All staff users will be locked out immediately.
            </p>
            <div className="form-group">
              <label>Suspension Reason *</label>
              <textarea
                className="form-control"
                required
                rows={3}
                placeholder="Enter reason for suspending this tenant account..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={suspending || !suspensionReason.trim()}>
              {suspending ? 'Suspending...' : 'Confirm Suspend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
