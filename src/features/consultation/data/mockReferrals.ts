import type { NewReferralInput, Referral, ReferralStatus } from '@/features/consultation/types/referrals'

export const REFERRAL_DEPARTMENTS = [
  'Cardiology',
  'Orthopaedics',
  'Neurology',
  'Paediatrics',
  'Dermatology',
  'Physiotherapy',
  'Gastroenterology',
  'Pulmonology',
  'Nephrology',
  'Oncology',
] as const

export const REFERRAL_PATIENT_OPTIONS = [
  { id: 'p-001', name: 'Amina Juma', patientNumber: 'MNH-2024-4421' },
  { id: 'p-002', name: 'Hassan Mwita', patientNumber: 'MNH-2024-1104' },
  { id: 'p-003', name: 'Fatuma Said', patientNumber: 'MNH-2024-0892' },
  { id: 'p-004', name: 'John Doe', patientNumber: 'MNH-2024-1234' },
  { id: 'p-005', name: 'Aisha Bakari', patientNumber: 'MNH-2024-1456' },
  { id: 'p-006', name: 'Grace Kimaro', patientNumber: 'MNH-2024-0755' },
]

const INITIAL_REFERRALS: Referral[] = [
  {
    id: 'ref-01',
    patientId: 'p-010',
    patientName: 'Jonathan Miller',
    patientNumber: 'P-88231',
    referredTo: 'Cardiology Dept.',
    type: 'internal',
    referredAt: 'Oct 24, 2023',
    reason: 'Persistent chest pain on exertion with atypical ECG changes. Request cardiology review for risk stratification and further workup.',
    status: 'pending',
    urgency: 'urgent',
    category: 'general',
    department: 'Cardiology',
  },
  {
    id: 'ref-02',
    patientId: 'p-011',
    patientName: 'Avery Smith',
    patientNumber: 'P-91200',
    referredTo: 'General Hospital East',
    type: 'external',
    referredAt: 'Oct 22, 2023',
    reason: 'Advanced MRI imaging needed for suspected ligament tear not available on-site. Patient consented to external transfer.',
    status: 'accepted',
    urgency: 'routine',
    category: 'lab-imaging',
    hospitalName: 'General Hospital East',
    externalDoctor: 'Dr. Patel',
    contactNumber: '+255 712 345 678',
    respondedAt: 'Oct 23, 2023',
  },
  {
    id: 'ref-03',
    patientId: 'p-012',
    patientName: 'Robert Chen',
    patientNumber: 'P-77412',
    referredTo: 'Physiotherapy',
    type: 'internal',
    referredAt: 'Oct 20, 2023',
    reason: 'Post-operative recovery plan following ACL repair. Requires structured physiotherapy programme.',
    status: 'declined',
    urgency: 'routine',
    category: 'follow-up',
    department: 'Physiotherapy',
    declineReason: 'Physiotherapy capacity full this month. Resubmit with revised timeline.',
    respondedAt: 'Oct 21, 2023',
  },
  {
    id: 'ref-04',
    patientId: 'p-013',
    patientName: 'Maria Garcia',
    patientNumber: 'P-88543',
    referredTo: 'Dermatology Dept.',
    type: 'internal',
    referredAt: 'Oct 15, 2023',
    reason: 'Routine skin check for suspicious pigmented lesion on upper back. No acute symptoms.',
    status: 'completed',
    urgency: 'routine',
    category: 'general',
    department: 'Dermatology',
    respondedAt: 'Oct 18, 2023',
  },
  {
    id: 'ref-05',
    patientId: 'p-003',
    patientName: 'Fatuma Said',
    patientNumber: 'MNH-2024-0892',
    referredTo: 'Endocrinology',
    type: 'internal',
    referredAt: 'Jun 10, 2026',
    reason: 'Poorly controlled Type 2 DM with HbA1c 10.2%. Requires specialist optimisation of regimen.',
    status: 'pending',
    urgency: 'urgent',
    category: 'follow-up',
    department: 'Endocrinology',
    visitId: 'V-2026-010',
  },
  {
    id: 'ref-06',
    patientId: 'p-004',
    patientName: 'John Doe',
    patientNumber: 'MNH-2024-1234',
    referredTo: 'Pulmonology',
    type: 'internal',
    referredAt: 'Jun 08, 2026',
    reason: 'Chronic cough with abnormal chest imaging. Pulmonology assessment for bronchoscopy.',
    status: 'accepted',
    urgency: 'routine',
    category: 'second-opinion',
    department: 'Pulmonology',
    respondedAt: 'Jun 09, 2026',
  },
  {
    id: 'ref-07',
    patientId: 'p-002',
    patientName: 'Hassan Mwita',
    patientNumber: 'MNH-2024-1104',
    referredTo: 'Nephrology',
    type: 'internal',
    referredAt: 'Jun 05, 2026',
    reason: 'Persistent proteinuria and rising creatinine. Nephrology workup requested.',
    status: 'accepted',
    urgency: 'urgent',
    category: 'general',
    department: 'Nephrology',
    respondedAt: 'Jun 06, 2026',
  },
  {
    id: 'ref-08',
    patientId: 'p-001',
    patientName: 'Amina Juma',
    patientNumber: 'MNH-2024-4421',
    referredTo: 'Oncology Institute Dar',
    type: 'external',
    referredAt: 'May 28, 2026',
    reason: 'Suspected malignancy on biopsy. External oncology centre for staging and treatment planning.',
    status: 'accepted',
    urgency: 'emergency',
    category: 'second-opinion',
    hospitalName: 'Oncology Institute Dar',
    externalDoctor: 'Dr. Mwangi',
    contactNumber: '+255 754 111 222',
    respondedAt: 'May 29, 2026',
  },
  {
    id: 'ref-09',
    patientId: 'p-005',
    patientName: 'Aisha Bakari',
    patientNumber: 'MNH-2024-1456',
    referredTo: 'Neurology',
    type: 'internal',
    referredAt: 'May 25, 2026',
    reason: 'Recurrent migraines with new focal neurological signs. Urgent neurology review.',
    status: 'pending',
    urgency: 'urgent',
    category: 'general',
    department: 'Neurology',
  },
  {
    id: 'ref-10',
    patientId: 'p-006',
    patientName: 'Grace Kimaro',
    patientNumber: 'MNH-2024-0755',
    referredTo: 'Orthopaedics',
    type: 'internal',
    referredAt: 'May 20, 2026',
    reason: 'Fracture of distal radius requiring orthopaedic fixation assessment.',
    status: 'accepted',
    urgency: 'emergency',
    category: 'general',
    department: 'Orthopaedics',
    respondedAt: 'May 20, 2026',
  },
  {
    id: 'ref-11',
    patientId: 'p-014',
    patientName: 'Salim Baraka',
    patientNumber: 'P-90112',
    referredTo: 'Gastroenterology',
    type: 'internal',
    referredAt: 'May 15, 2026',
    reason: 'Chronic GI bleeding with anaemia. Endoscopy referral for evaluation.',
    status: 'pending',
    urgency: 'routine',
    category: 'general',
    department: 'Gastroenterology',
  },
  {
    id: 'ref-12',
    patientId: 'p-015',
    patientName: 'Zuwena Hamisi',
    patientNumber: 'P-91880',
    referredTo: 'Radiology Centre Mwanza',
    type: 'external',
    referredAt: 'May 12, 2026',
    reason: 'Specialist CT angiography not available locally. External imaging referral.',
    status: 'completed',
    urgency: 'urgent',
    category: 'lab-imaging',
    hospitalName: 'Radiology Centre Mwanza',
    externalDoctor: 'Dr. Kimaro',
    contactNumber: '+255 768 999 000',
    respondedAt: 'May 14, 2026',
  },
]

let referrals: Referral[] = [...INITIAL_REFERRALS]

function uid() {
  return `ref-${Math.random().toString(36).slice(2, 9)}`
}

export function getReferrals(): Referral[] {
  return referrals.filter((r) => r.status !== 'cancelled')
}

export function getReferralById(id: string): Referral | undefined {
  return referrals.find((r) => r.id === id)
}

export function addReferral(input: NewReferralInput): Referral {
  const referral: Referral = {
    id: uid(),
    patientId: input.patientId,
    patientName: input.patientName,
    patientNumber: input.patientNumber,
    referredTo: input.referredTo,
    type: input.type,
    referredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    reason: input.reason,
    status: 'pending',
    urgency: input.urgency,
    category: input.category,
    department: input.department,
    preferredDoctor: input.preferredDoctor,
    hospitalName: input.hospitalName,
    externalDoctor: input.externalDoctor,
    contactNumber: input.contactNumber,
  }
  referrals = [referral, ...referrals]
  return referral
}

export function cancelReferral(id: string): void {
  referrals = referrals.map((r) => (r.id === id ? { ...r, status: 'cancelled' as ReferralStatus } : r))
}

export function getReferralStats() {
  const active = getReferrals()
  return {
    total: active.length,
    pending: active.filter((r) => r.status === 'pending').length,
    accepted: active.filter((r) => r.status === 'accepted' || r.status === 'completed').length,
    declined: active.filter((r) => r.status === 'declined').length,
  }
}

export function searchReferralPatients(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return REFERRAL_PATIENT_OPTIONS
  return REFERRAL_PATIENT_OPTIONS.filter(
    (p) => p.name.toLowerCase().includes(q) || p.patientNumber.toLowerCase().includes(q),
  )
}
