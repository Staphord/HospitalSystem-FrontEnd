import type { ImagingRequestStatus } from '@/features/radiology/types/radiology'
import { STATUS_BADGE_CLASS, STATUS_LABELS } from '@/features/radiology/utils/imagingRequestUtils'

export function ImagingStatusBadge({ status }: { status: ImagingRequestStatus }) {
  return (
    <span
      className={`px-2 py-1 text-label-sm font-bold rounded-full border ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
