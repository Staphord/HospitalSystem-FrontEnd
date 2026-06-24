import type { LabRequestPriority } from '@/features/laboratory/types/laboratory'
import {
  INVESTIGATION_ORDER_PRIORITY_BADGE,
  INVESTIGATION_ORDER_PRIORITY_BASE_CLASS,
} from '@/features/laboratory/utils/labOrderPriority'

export function InvestigationPriorityBadge({ priority }: { priority: LabRequestPriority }) {
  return (
    <span
      className={`${INVESTIGATION_ORDER_PRIORITY_BASE_CLASS} ${INVESTIGATION_ORDER_PRIORITY_BADGE[priority]}`}
    >
      {priority}
    </span>
  )
}
