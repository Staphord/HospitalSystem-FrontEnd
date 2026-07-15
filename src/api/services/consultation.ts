import { apiClient } from '@/api/client'
import type { ConsultationQueueItem } from '@/api/types/consultation'

export const consultationService = {
  /** Fetch active doctor queue for consultation */
  getQueue: () =>
    apiClient
      .get<ConsultationQueueItem[]>('/consultation/queue')
      .then((r) => r.data),
}
