import { useEffect } from 'react'
import type { Referral, ReferralCategory, ReferralStatus, ReferralUrgency } from '@/features/consultation/types/referrals'

const STATUS_CONFIG: Record<ReferralStatus, { badge: string; label: string }> = {
  pending:   { badge: 'bg-warning/10 text-warning', label: 'Pending' },
  accepted:  { badge: 'bg-success/10 text-success', label: 'Accepted' },
  declined:  { badge: 'bg-error/10 text-error', label: 'Declined' },
  completed: { badge: 'bg-surface-container-highest text-outline', label: 'Completed' },
  cancelled: { badge: 'bg-surface-container text-outline border border-border-subtle', label: 'Cancelled' },
}

const URGENCY_LABELS: Record<ReferralUrgency, string> = {
  routine: 'Routine',
  urgent: 'Urgent',
  emergency: 'Emergency',
}

const CATEGORY_LABELS: Record<ReferralCategory, string> = {
  general: 'General Referral',
  'follow-up': 'Follow-up',
  'second-opinion': 'Second Opinion',
  'lab-imaging': 'Lab/Imaging',
}

interface Props {
  referral: Referral
  onClose: () => void
  onViewPatient?: (patientId: string) => void
}

export function ReferralDetailModal({ referral, onClose, onViewPatient }: Props) {
  const statusCfg = STATUS_CONFIG[referral.status]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[560px] bg-surface-white rounded-xl shadow-2xl overflow-hidden">
        <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Referral Details</h2>
            <p className="font-body-sm text-body-sm text-outline m-0 mt-xs">Ref #{referral.id.toUpperCase()}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 bg-transparent border-0 cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined leading-none">close</span>
          </button>
        </div>

        <div className="p-lg space-y-md max-h-[70vh] overflow-y-auto">
          <div className="flex flex-wrap items-center gap-sm">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCfg.badge}`}>
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
              referral.type === 'internal' ? 'bg-primary-fixed text-primary' : 'bg-secondary/10 text-secondary'
            }`}>
              {referral.type}
            </span>
            <span className={`font-label-sm text-label-sm px-sm py-0.5 rounded ${
              referral.urgency === 'emergency' ? 'bg-error/10 text-error'
                : referral.urgency === 'urgent' ? 'bg-warning/10 text-warning'
                : 'bg-surface-container text-outline'
            }`}>
              {URGENCY_LABELS[referral.urgency]}
            </span>
          </div>

          <div className="bg-surface-container-low rounded-lg p-md space-y-sm">
            <div className="flex justify-between gap-md">
              <span className="font-label-md text-label-md text-outline font-bold">Patient</span>
              <span className="font-body-sm text-body-sm font-semibold text-right">
                {referral.patientName} ({referral.patientNumber})
              </span>
            </div>
            <div className="flex justify-between gap-md">
              <span className="font-label-md text-label-md text-outline font-bold">Referred To</span>
              <span className="font-body-sm text-body-sm text-right">{referral.referredTo}</span>
            </div>
            <div className="flex justify-between gap-md">
              <span className="font-label-md text-label-md text-outline font-bold">Referred At</span>
              <span className="font-body-sm text-body-sm text-right">{referral.referredAt}</span>
            </div>
            <div className="flex justify-between gap-md">
              <span className="font-label-md text-label-md text-outline font-bold">Category</span>
              <span className="font-body-sm text-body-sm text-right">{CATEGORY_LABELS[referral.category]}</span>
            </div>
            {referral.preferredDoctor && (
              <div className="flex justify-between gap-md">
                <span className="font-label-md text-label-md text-outline font-bold">Preferred Doctor</span>
                <span className="font-body-sm text-body-sm text-right">{referral.preferredDoctor}</span>
              </div>
            )}
            {referral.externalDoctor && (
              <div className="flex justify-between gap-md">
                <span className="font-label-md text-label-md text-outline font-bold">External Doctor</span>
                <span className="font-body-sm text-body-sm text-right">{referral.externalDoctor}</span>
              </div>
            )}
            {referral.contactNumber && (
              <div className="flex justify-between gap-md">
                <span className="font-label-md text-label-md text-outline font-bold">Contact</span>
                <span className="font-body-sm text-body-sm text-right">{referral.contactNumber}</span>
              </div>
            )}
            {referral.respondedAt && (
              <div className="flex justify-between gap-md">
                <span className="font-label-md text-label-md text-outline font-bold">Responded At</span>
                <span className="font-body-sm text-body-sm text-right">{referral.respondedAt}</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-label-md text-label-md text-outline uppercase m-0 mb-xs">Clinical Reason</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0 leading-relaxed">{referral.reason}</p>
          </div>

          {referral.declineReason && (
            <div className="bg-error/5 border border-error/20 rounded-lg p-md">
              <h3 className="font-label-md text-label-md text-error m-0 mb-xs">Decline Reason</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant m-0">{referral.declineReason}</p>
            </div>
          )}
        </div>

        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-low flex justify-end gap-md">
          {onViewPatient && (
            <button
              type="button"
              onClick={() => { onViewPatient(referral.patientId); onClose() }}
              className="px-md py-sm rounded-lg border border-border-subtle font-label-md text-label-md text-on-surface hover:bg-surface-white transition-colors bg-transparent cursor-pointer flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">history</span>
              Patient History
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-lg py-sm rounded-lg bg-primary text-white font-label-md text-label-md hover:opacity-90 border-0 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
