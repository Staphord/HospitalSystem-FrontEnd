import { useEffect, useState } from 'react'
import type {
  SpecimenRejectionReason,
  SpecimenTrackingStatus,
  TrackedSpecimen,
} from '@/features/laboratory/types/laboratory'
import {
  REJECTION_REASONS,
  REJECTION_REASON_LABEL,
  SPECIMEN_TRACKING_STATUS_LABEL,
} from '@/features/laboratory/utils/specimenStatus'

const MODAL_STATUSES: SpecimenTrackingStatus[] = [
  'collected',
  'in_lab',
  'processing',
  'complete',
  'rejected',
]

interface UpdateSpecimenStatusModalProps {
  specimen: TrackedSpecimen
  onClose: () => void
  onSave: (
    status: SpecimenTrackingStatus,
    extras: {
      notes?: string
      rejectionReason?: SpecimenRejectionReason
      location?: string
    },
  ) => void
}

export function UpdateSpecimenStatusModal({
  specimen,
  onClose,
  onSave,
}: UpdateSpecimenStatusModalProps) {
  const initialStatus =
    specimen.status === 'not_collected' ? 'collected' : specimen.status

  const [status, setStatus] = useState<SpecimenTrackingStatus>(initialStatus)
  const [notes, setNotes] = useState(specimen.notes ?? '')
  const [location, setLocation] = useState(specimen.location)
  const [rejectionReason, setRejectionReason] = useState<SpecimenRejectionReason>(
    specimen.rejectionReason ?? 'insufficient_volume',
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = () => {
    onSave(status, {
      notes: notes.trim() || undefined,
      location: location.trim() || specimen.location,
      rejectionReason: status === 'rejected' ? rejectionReason : undefined,
    })
  }

  const statusOptions: SpecimenTrackingStatus[] =
    specimen.status === 'not_collected'
      ? ['collected', 'in_lab', 'processing', 'complete', 'rejected']
      : MODAL_STATUSES

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 backdrop-blur-sm p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="specimen-status-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-surface-white rounded-xl border border-border-subtle shadow-lg w-full max-w-[420px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-md border-b border-border-subtle flex justify-between items-center">
          <h3
            id="specimen-status-modal-title"
            className="font-headline-sm text-headline-sm text-on-surface m-0"
          >
            Update Specimen Status
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface border-0 bg-transparent cursor-pointer p-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-lg flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-secondary">Specimen ID</label>
              <input
                type="text"
                value={specimen.id}
                disabled
                className="w-full bg-surface-container-low border border-border-subtle rounded-lg font-body-sm px-3 py-2 cursor-not-allowed text-on-surface"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-secondary">Patient Name</label>
              <input
                type="text"
                value={specimen.patientName}
                disabled
                className="w-full bg-surface-container-low border border-border-subtle rounded-lg font-body-sm px-3 py-2 cursor-not-allowed text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label htmlFor="specimen-new-status" className="font-label-sm text-label-sm text-secondary">
              New Status
            </label>
            <select
              id="specimen-new-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as SpecimenTrackingStatus)}
              className="w-full border border-border-subtle rounded-lg font-body-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-surface-white"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {SPECIMEN_TRACKING_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          {status === 'rejected' && (
            <div className="flex flex-col gap-xs">
              <label htmlFor="rejection-reason" className="font-label-sm text-label-sm text-error">
                Rejection Reason
              </label>
              <select
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value as SpecimenRejectionReason)}
                className="w-full border border-error/40 rounded-lg font-body-sm px-3 py-2 focus:ring-1 focus:ring-error focus:border-error outline-none bg-surface-white"
              >
                {REJECTION_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {REJECTION_REASON_LABEL[reason]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-xs">
            <label htmlFor="specimen-location" className="font-label-sm text-label-sm text-secondary">
              Location
            </label>
            <input
              id="specimen-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-border-subtle rounded-lg font-body-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label htmlFor="specimen-notes" className="font-label-sm text-label-sm text-secondary">
              Notes
            </label>
            <textarea
              id="specimen-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add internal tracking notes..."
              className="w-full border border-border-subtle rounded-lg font-body-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
            />
          </div>
        </div>

        <div className="p-md bg-surface-container-low flex justify-end gap-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border-subtle rounded-lg text-secondary font-label-md hover:bg-surface-container-high transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded-lg font-label-md hover:bg-primary-container transition-colors border-0 cursor-pointer"
          >
            Save Status
          </button>
        </div>
      </div>
    </div>
  )
}
