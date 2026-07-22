import { useEffect, useState } from 'react'
import {
  pharmacyService,
  type VisitPrescriptionsResponse,
  type InteractionCheckResponse,
} from '@/api/services/pharmacy'
import { toast } from 'sonner'

const BILLING_BADGE = {
  cleared: { className: 'bg-success/10 text-success', label: 'Cleared' },
  awaiting_clearance: { className: 'bg-warning/10 text-warning', label: 'Awaiting Clearance' },
  not_cleared: { className: 'bg-error/10 text-error', label: 'Not Cleared' },
}

interface Props {
  prescriptionId: string // Represents visitId in database queue
  onClose: () => void
  onDispense?: (id: string) => void
  highlightInteraction?: boolean
}

function InteractionBanner({
  interactionResponse,
  emphasized,
}: {
  interactionResponse?: InteractionCheckResponse | null
  emphasized?: boolean
}) {
  if (!interactionResponse || interactionResponse.alert_count === 0) return null

  return (
    <div
      className={`rounded-lg border p-md flex gap-sm ${
        emphasized ? 'bg-error/10 border-error/30' : 'bg-error/5 border-error/20'
      }`}
    >
      <span
        className="material-symbols-outlined text-error text-[20px] shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        priority_high
      </span>
      <div className="min-w-0">
        <p className="font-label-md text-label-md text-error font-bold m-0 mb-xs">Drug Interaction Alert</p>
        {interactionResponse.alerts.map((alert, idx) => (
          <div key={idx} className="mb-2 last:mb-0">
            <p className="font-body-sm text-body-sm text-on-surface m-0 font-semibold">
              {alert.drug_a} + {alert.drug_b} ({alert.severity.toUpperCase()})
            </p>
            <p className="font-body-xs text-[11px] text-secondary m-0">
              {alert.detail} — Recommendation: {alert.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PrescriptionDetailModal({
  prescriptionId,
  onClose,
  onDispense,
  highlightInteraction = false,
}: Props) {
  const [detail, setDetail] = useState<VisitPrescriptionsResponse | null>(null)
  const [interactions, setInteractions] = useState<InteractionCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true)
        const [detRes, intRes] = await Promise.all([
          pharmacyService.getPrescriptionDetails(prescriptionId),
          pharmacyService.checkDrugInteractions(prescriptionId),
        ])
        setDetail(detRes)
        setInteractions(intRes)
      } catch (err) {
        console.error(err)
        toast.error('Failed to load prescription details.')
      } finally {
        setLoading(false)
      }
    }
    loadDetails()
  }, [prescriptionId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
        <div className="relative z-10 w-full max-w-[720px] bg-surface-white rounded-xl shadow-2xl p-xl text-center text-secondary">
          Loading prescription details...
        </div>
      </div>
    )
  }

  if (!detail) return null

  const billingStatus: 'cleared' | 'awaiting_clearance' | 'not_cleared' = detail.billing_cleared ? 'cleared' : 'awaiting_clearance'
  const billingCfg = BILLING_BADGE[billingStatus]
  const canDispense = detail.billing_cleared

  // Calculate patient age
  const dob = new Date(detail.patient.date_of_birth)
  const age = new Date().getFullYear() - dob.getFullYear()

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prescription-detail-modal-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[720px] bg-surface-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between shrink-0">
          <div>
            <h2
              id="prescription-detail-modal-title"
              className="font-headline-sm text-headline-sm text-on-surface m-0"
            >
              Prescription Details
            </h2>
            <p className="font-body-sm text-body-sm text-outline m-0 mt-xs">
              {detail.patient.patient_name} · Rx #{detail.visit_number}
            </p>
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

        <div className="p-lg space-y-md overflow-y-auto flex-1">
          <div className="flex flex-wrap items-center gap-sm">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${billingCfg.className}`}
            >
              {billingCfg.label}
            </span>
            <span className="font-body-sm text-body-sm text-secondary">
              {detail.prescriptions.length} medication{detail.prescriptions.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="bg-surface-container-low rounded-lg p-md grid grid-cols-1 sm:grid-cols-2 gap-sm">
            <div className="flex justify-between gap-md sm:flex-col sm:justify-start">
              <span className="font-label-md text-label-md text-outline font-bold">Patient</span>
              <span className="font-body-sm text-body-sm font-semibold">{detail.patient.patient_name}</span>
            </div>
            <div className="flex justify-between gap-md sm:flex-col sm:justify-start">
              <span className="font-label-md text-label-md text-outline font-bold">Patient #</span>
              <span className="font-body-sm text-body-sm">{detail.patient.patient_id}</span>
            </div>
            <div className="flex justify-between gap-md sm:flex-col sm:justify-start">
              <span className="font-label-md text-label-md text-outline font-bold">Age / Gender</span>
              <span className="font-body-sm text-body-sm">
                {age} · {detail.gender}
              </span>
            </div>
            <div className="flex justify-between gap-md sm:flex-col sm:justify-start">
              <span className="font-label-md text-label-md text-outline font-bold">Prescribed By</span>
              <span className="font-body-sm text-body-sm">
                {detail.prescriptions[0]?.prescribed_by || 'Staff Doctor'}
              </span>
            </div>
            <div className="flex justify-between gap-md sm:flex-col sm:justify-start sm:col-span-2">
              <span className="font-label-md text-label-md text-outline font-bold">Prescribed At</span>
              <span className="font-body-sm text-body-sm">
                {detail.prescriptions[0]
                  ? new Date(detail.prescriptions[0].prescribed_at).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
          </div>

          <InteractionBanner
            interactionResponse={interactions}
            emphasized={highlightInteraction}
          />

          {!canDispense && (
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-md flex gap-sm">
              <span className="material-symbols-outlined text-warning text-[20px] shrink-0">info</span>
              <p className="font-body-sm text-body-sm text-on-surface m-0">
                Billing clearance is required before this prescription can be dispensed.
              </p>
            </div>
          )}

          <div>
            <h3 className="font-label-md text-label-md text-outline uppercase m-0 mb-sm">Medications</h3>
            <div className="border border-border-subtle rounded-lg overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary uppercase tracking-wider">
                      Drug
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary uppercase tracking-wider">
                      Dose
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary uppercase tracking-wider">
                      Freq
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary uppercase tracking-wider">
                      Instructions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {detail.prescriptions.map((line) => {
                    const hasInteraction = interactions?.alerts.some(
                      (a) => a.drug_a === line.drug_name || a.drug_b === line.drug_name
                    )
                    return (
                      <tr
                        key={line.prescription_item_id}
                        className={hasInteraction ? 'bg-error/5' : undefined}
                      >
                        <td className="px-md py-sm">
                          <div className="font-body-sm text-body-sm font-semibold text-on-surface">
                            {line.drug_name}
                          </div>
                          <div className="font-body-sm text-body-sm text-secondary">{line.category || 'Medication'}</div>
                          {hasInteraction && (
                            <span className="inline-flex items-center gap-xs mt-xs text-error font-label-sm text-label-sm">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              Interaction
                            </span>
                          )}
                        </td>
                        <td className="px-md py-sm font-body-sm text-body-sm whitespace-nowrap">{line.dose}</td>
                        <td className="px-md py-sm font-body-sm text-body-sm whitespace-nowrap">{line.frequency}</td>
                        <td className="px-md py-sm font-body-sm text-body-sm whitespace-nowrap">{line.duration}</td>
                        <td className="px-md py-sm font-body-sm text-body-sm whitespace-nowrap">
                          {line.quantity_prescribed > 0 ? line.quantity_prescribed : '—'}
                        </td>
                        <td className="px-md py-sm font-body-sm text-body-sm text-secondary max-w-[200px]">
                          {line.instructions || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-low flex justify-end gap-md shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-md rounded-lg border border-border-subtle font-label-md text-label-md text-on-surface hover:bg-surface-white transition-colors bg-transparent cursor-pointer"
          >
            Close
          </button>
          {canDispense && onDispense && (
            <button
              type="button"
              onClick={() => {
                onDispense(detail.visit_id)
                onClose()
              }}
              className="h-9 px-lg rounded-lg bg-primary text-white font-label-md text-label-md hover:bg-primary-container border-0 cursor-pointer"
            >
              Dispense
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
