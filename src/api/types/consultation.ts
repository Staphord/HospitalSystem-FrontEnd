export interface ConsultationQueueItem {
  queue_id: string
  queue_number: string
  priority: string
  visit_id: string
  visit_number: string
  patient_id: string
  full_name: string
  patient_number: string
  age: number
  triage_category?: string | null
  chief_complaint?: string | null
  wait_time_minutes: number
  queue_status: string
}
