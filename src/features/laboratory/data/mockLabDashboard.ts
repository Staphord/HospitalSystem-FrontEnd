import type {
  CompletedTest,
  CriticalValue,
  LabDashboardStats,
  StatLabRequest,
  StatTurnaroundMetric,
} from '@/features/laboratory/types/laboratory'

export const LAB_DASHBOARD_STATS: LabDashboardStats = {
  pendingTests: 11,
  inProgress: 3,
  completedToday: 28,
  criticalValues: 2,
}

export const STAT_LAB_REQUESTS: StatLabRequest[] = [
  {
    id: 'rq-stat-1',
    patientName: 'Fatuma Said',
    testName: 'Troponin',
    requestedBy: 'Dr. Amina Hassan',
    requestedAgo: '10 mins ago',
    priority: 'stat',
  },
  {
    id: 'rq-stat-2',
    patientName: 'Emanuel Mollel',
    testName: 'Electrolytes Panel',
    requestedBy: 'Dr. Shirima',
    requestedAgo: '15 mins ago',
    priority: 'stat',
  },
  {
    id: 'rq-5',
    patientName: 'Emanuel Mollel',
    testName: 'Electrolytes Panel',
    requestedBy: 'Dr. Shirima',
    requestedAgo: '18 mins ago',
    priority: 'urgent',
  },
]

export const CRITICAL_VALUES: CriticalValue[] = [
  {
    id: 'cv-1',
    patientName: 'Fatuma Ali',
    testName: 'Hemoglobin',
    result: '6.2 g/dL',
    refRange: '12.0 - 15.5',
  },
  {
    id: 'cv-2',
    patientName: 'John Bocco',
    testName: 'Potassium',
    result: '6.8 mmol/L',
    refRange: '3.5 - 5.1',
  },
]

export const COMPLETED_TODAY: CompletedTest[] = [
  { id: 'ct-1', testName: 'Lipid Panel', requestId: 'RQ-8821', completedAt: '10:45 AM' },
  { id: 'ct-2', testName: 'Urinalysis', requestId: 'RQ-8820', completedAt: '10:30 AM' },
  { id: 'ct-3', testName: 'Liver Function Test', requestId: 'RQ-8818', completedAt: '09:15 AM' },
  { id: 'ct-4', testName: 'Thyroid Profile', requestId: 'RQ-8815', completedAt: '08:50 AM' },
]

export const TURNAROUND_METRICS: StatTurnaroundMetric[] = [
  { department: 'Hematology', minutes: 45, barPercent: 60 },
  { department: 'Biochemistry', minutes: 65, barPercent: 80, opacity: 'opacity-80' },
  { department: 'Microbiology', minutes: 120, barPercent: 95, opacity: 'opacity-60' },
  { department: 'STAT Avg', minutes: 18, barPercent: 30, isStat: true },
]
