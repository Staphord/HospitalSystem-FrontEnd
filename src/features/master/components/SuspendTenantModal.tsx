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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-on-background/40 backdrop-blur-[2px]">
      <div className="bg-surface-container-lowest w-full max-w-[480px] rounded-xl border border-surface-variant shadow-2xl p-lg animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center mb-lg">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-amber-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Confirm Hospital Suspension</h3>
          <p className="font-body-md text-body-md text-on-surface-variant m-0">
            This will immediately terminate all active sessions for <span className="font-bold">{tenantName}</span>. Users will not be able to log in until the account is reactivated.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-lg">
          <div>
            <label className="block font-label-md text-on-surface mb-xs text-left" htmlFor="reason">Reason for Suspension</label>
            <textarea 
              className="w-full border border-primary focus:ring-1 focus:ring-primary focus:border-primary rounded px-md py-sm font-body-sm bg-surface-container-low text-on-surface" 
              id="reason" 
              placeholder="Enter reason for suspending..." 
              rows={4}
              required
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
            />
            <p className="mt-xs text-secondary font-label-sm text-left">This reason will be visible to the hospital administrators.</p>
          </div>
          
          <div className="flex gap-md pt-md">
            <button 
              className="flex-1 px-md h-10 border border-outline-variant font-label-md text-on-surface rounded hover:bg-surface-container-low transition-all bg-transparent" 
              type="button" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="flex-1 px-md h-10 bg-[#ba1a1a] text-white font-label-md rounded hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50" 
              type="submit"
              disabled={suspending || !suspensionReason.trim()}
            >
              {suspending ? 'Suspending...' : 'Confirm Suspend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
