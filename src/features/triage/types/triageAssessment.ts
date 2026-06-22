export type TriageQueuePriority = 'emergency' | 'urgent' | 'routine'

export type TriageCategory = 'emergency' | 'urgent' | 'semi_urgent' | 'non_urgent'

export interface TriageVisit {
  visitId: string
  queueNumber: number
  name: string
  initials: string
  patientNumber: string
  gender: string
  age: number
  arrival: string
  waitTime: string
  waitColor: string
  waitWarningIcon?: boolean
  payment: string
  source: string
  priority: TriageQueuePriority
  isEmergency?: boolean
  avatarUrl?: string
}

export interface TriageVitals {
  bpSystolic: string
  bpDiastolic: string
  temperature: string
  pulseRate: string
  spo2: string
  respiratoryRate: string
  weight: string
}

export interface TriageAssessmentForm {
  visitId: string
  vitals: TriageVitals
  symptoms: string[]
  clinicalNotes: string
  triageCategory: TriageCategory
}

export const EMPTY_VITALS: TriageVitals = {
  bpSystolic: '',
  bpDiastolic: '',
  temperature: '',
  pulseRate: '',
  spo2: '',
  respiratoryRate: '',
  weight: '',
}

export const COMMON_SYMPTOMS = [
  'Fever',
  'Chest Pain',
  'Dyspnea',
  'Headache',
  'Abdominal Pain',
  'Trauma/Injury',
  'Nausea/Vomiting',
  'Cough',
] as const

export const TRIAGE_CATEGORIES: {
  value: TriageCategory
  label: string
  level: string
  description: string
  icon: string
  colorClass: string
  bgClass: string
  borderClass: string
}[] = [
  {
    value: 'emergency',
    label: 'Emergency',
    level: 'Level 1 - Immediate',
    description: 'Life-threatening conditions. Requires immediate attention.',
    icon: 'emergency',
    colorClass: 'text-error',
    bgClass: 'bg-error',
    borderClass: 'peer-checked:border-error peer-checked:bg-error/10 peer-checked:shadow-[0_0_0_1px_#FF5630]',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    level: 'Level 2 - < 30 Mins',
    description: 'Potential threat to life or limb. Requires rapid assessment.',
    icon: 'warning',
    colorClass: 'text-[#E67A00]',
    bgClass: 'bg-warning',
    borderClass: 'peer-checked:border-warning peer-checked:bg-warning/15 peer-checked:shadow-[0_0_0_1px_#FFAB00]',
  },
  {
    value: 'semi_urgent',
    label: 'Semi-Urgent',
    level: 'Level 3 - < 60 Mins',
    description: 'Stable condition but requires diagnostic tests or therapy.',
    icon: 'info',
    colorClass: 'text-primary',
    bgClass: 'bg-primary',
    borderClass: 'peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:shadow-[0_0_0_1px_#0052CC]',
  },
  {
    value: 'non_urgent',
    label: 'Non-Urgent',
    level: 'Level 4 - Standard',
    description: 'Minor injury or illness. Low priority for urgent care.',
    icon: 'check_circle',
    colorClass: 'text-success',
    bgClass: 'bg-success',
    borderClass: 'peer-checked:border-success peer-checked:bg-success/10 peer-checked:shadow-[0_0_0_1px_#36B37E]',
  },
]
