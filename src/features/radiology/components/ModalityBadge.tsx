import type { ImagingModality } from '@/features/radiology/types/radiology'
import { MODALITY_BADGE_CLASS, MODALITY_LABELS } from '@/features/radiology/utils/imagingRequestUtils'

export function ModalityBadge({ modality }: { modality: ImagingModality }) {
  return (
    <span
      className={`px-2 py-0.5 text-label-sm font-label-md rounded ${MODALITY_BADGE_CLASS[modality]}`}
    >
      {MODALITY_LABELS[modality]}
    </span>
  )
}
