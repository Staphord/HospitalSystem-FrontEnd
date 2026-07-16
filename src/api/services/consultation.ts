import { apiClient } from '@/api/client'
import type { ConsultationQueueItem } from '@/api/types/consultation'

export const consultationService = {
  /** Fetch active doctor queue for consultation */
  getQueue: (status = 'waiting') =>
    apiClient
      .get<ConsultationQueueItem[]>('/consultation/queue', { params: { status } })
      .then((r) => r.data),
}
