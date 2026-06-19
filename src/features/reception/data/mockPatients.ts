export type PaymentType = 'Cash' | 'Insurance' | 'Exempt'
export type InsuranceStatus = 'Verified' | 'Pending' | 'Rejected' | null
export type QueueStatus = 'Waiting' | 'In Triage' | 'With Doctor' | 'Complete' | null

export interface MockPatient {
  id: string
  patientNumber: string
  fullName: string
  nationalId: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female'
  lastVisit: string
  paymentType: PaymentType
  insurer: string | null
  insuranceStatus: InsuranceStatus
  inQueueToday: boolean
  queueStatus: QueueStatus
  emergencyContact: string
}

export const MOCK_PATIENTS: MockPatient[] = [
  {
    id: 'p1',
    patientNumber: 'PT-4891',
    fullName: 'Fatuma Said',
    nationalId: '1992031547890',
    phone: '0714 882 103',
    dateOfBirth: '15/03/1992',
    gender: 'Female',
    lastVisit: '2026-06-11',
    paymentType: 'Cash',
    insurer: null,
    insuranceStatus: null,
    inQueueToday: true,
    queueStatus: 'Waiting',
    emergencyContact: 'Said Mwinyi · 0714 882 104',
  },
  {
    id: 'p2',
    patientNumber: 'PT-4889',
    fullName: 'Hassan Mwita',
    nationalId: '1988072212345',
    phone: '0755 441 205',
    dateOfBirth: '22/08/1988',
    gender: 'Male',
    lastVisit: '2026-06-11',
    paymentType: 'Insurance',
    insurer: 'Jubilee Insurance',
    insuranceStatus: 'Verified',
    inQueueToday: true,
    queueStatus: 'In Triage',
    emergencyContact: 'Neema Mwita · 0755 441 206',
  },
  {
    id: 'p3',
    patientNumber: 'PT-4892',
    fullName: 'Grace Kimaro',
    nationalId: '1989051234567',
    phone: '0712 345 678',
    dateOfBirth: '12/05/1989',
    gender: 'Female',
    lastVisit: '2026-06-10',
    paymentType: 'Cash',
    insurer: null,
    insuranceStatus: null,
    inQueueToday: true,
    queueStatus: 'Waiting',
    emergencyContact: 'Peter Kimaro · 0712 345 679',
  },
  {
    id: 'p4',
    patientNumber: 'PT-4903',
    fullName: 'Amir Juma',
    nationalId: '1994110890123',
    phone: '0788 220 891',
    dateOfBirth: '08/11/1994',
    gender: 'Male',
    lastVisit: '2026-06-11',
    paymentType: 'Insurance',
    insurer: 'Strategis Insurance',
    insuranceStatus: 'Verified',
    inQueueToday: true,
    queueStatus: 'With Doctor',
    emergencyContact: 'Aisha Juma · 0788 220 892',
  },
  {
    id: 'p5',
    patientNumber: 'PT-4911',
    fullName: 'Linda Mtui',
    nationalId: '1980020315678',
    phone: '0762 118 902',
    dateOfBirth: '03/02/1980',
    gender: 'Female',
    lastVisit: '2026-06-11',
    paymentType: 'Exempt',
    insurer: null,
    insuranceStatus: null,
    inQueueToday: true,
    queueStatus: 'Complete',
    emergencyContact: 'John Mtui · 0762 118 903',
  },
  {
    id: 'p6',
    patientNumber: 'PT-1029',
    fullName: 'Amani Khatib',
    nationalId: '1996011876543',
    phone: '0719 102 934',
    dateOfBirth: '18/01/1996',
    gender: 'Male',
    lastVisit: '2026-06-11',
    paymentType: 'Cash',
    insurer: null,
    insuranceStatus: null,
    inQueueToday: true,
    queueStatus: 'In Triage',
    emergencyContact: 'Salma Khatib · 0719 102 935',
  },
  {
    id: 'p7',
    patientNumber: 'PT-3841',
    fullName: 'Zuwena Salum',
    nationalId: '1993080456789',
    phone: '0718 384 100',
    dateOfBirth: '04/08/1993',
    gender: 'Female',
    lastVisit: '2026-06-11',
    paymentType: 'Insurance',
    insurer: 'NHIF',
    insuranceStatus: 'Pending',
    inQueueToday: true,
    queueStatus: 'Waiting',
    emergencyContact: 'Hamisi Salum · 0718 384 101',
  },
  {
    id: 'p8',
    patientNumber: 'PT-9201',
    fullName: 'Joseph Mwinyi',
    nationalId: '1987122098765',
    phone: '0754 920 155',
    dateOfBirth: '20/12/1987',
    gender: 'Male',
    lastVisit: '2026-06-11',
    paymentType: 'Cash',
    insurer: null,
    insuranceStatus: null,
    inQueueToday: true,
    queueStatus: 'With Doctor',
    emergencyContact: 'Mary Mwinyi · 0754 920 156',
  },
  {
    id: 'p9',
    patientNumber: 'PT-5501',
    fullName: 'Mary Ngoma',
    nationalId: '1997091564321',
    phone: '0622 550 198',
    dateOfBirth: '15/09/1997',
    gender: 'Female',
    lastVisit: '2026-05-28',
    paymentType: 'Insurance',
    insurer: 'AAR Healthcare',
    insuranceStatus: 'Verified',
    inQueueToday: false,
    queueStatus: null,
    emergencyContact: 'David Ngoma · 0622 550 199',
  },
  {
    id: 'p10',
    patientNumber: 'PT-7712',
    fullName: 'Lulu Kapinga',
    nationalId: '1991042211188',
    phone: '0711 771 200',
    dateOfBirth: '22/04/1991',
    gender: 'Female',
    lastVisit: '2026-06-08',
    paymentType: 'Insurance',
    insurer: 'Jubilee Insurance',
    insuranceStatus: 'Rejected',
    inQueueToday: false,
    queueStatus: null,
    emergencyContact: 'James Kapinga · 0711 771 201',
  },
]

export type SearchField = 'id' | 'phone' | 'name'

function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}

function normalizeNationalId(value: string) {
  return value.replace(/\s/g, '')
}

export function searchPatients(
  query: { nationalId: string; phone: string; name: string },
  activeField: SearchField,
): { results: MockPatient[]; field: SearchField; term: string } | null {
  const idQ = query.nationalId.trim()
  const phoneQ = query.phone.trim()
  const nameQ = query.name.trim()

  if (!idQ && !phoneQ && !nameQ) {
    return null
  }

  let field = activeField
  let term = ''

  if (field === 'id' && idQ) term = idQ
  else if (field === 'phone' && phoneQ) term = phoneQ
  else if (field === 'name' && nameQ) term = nameQ
  else if (idQ) {
    field = 'id'
    term = idQ
  } else if (phoneQ) {
    field = 'phone'
    term = phoneQ
  } else {
    field = 'name'
    term = nameQ
  }

  const normalizedPhone = normalizePhone(term)
  const normalizedId = normalizeNationalId(term)
  const normalizedName = term.toLowerCase()

  const results = MOCK_PATIENTS.filter((patient) => {
    if (field === 'id') {
      return normalizeNationalId(patient.nationalId) === normalizedId
    }
    if (field === 'phone') {
      return normalizePhone(patient.phone) === normalizedPhone
    }
    return patient.fullName.toLowerCase().includes(normalizedName)
  })

  return { results, field, term }
}

export function getPatientById(id: string) {
  return MOCK_PATIENTS.find((p) => p.id === id) ?? null
}

const CHECKIN_STORAGE_KEY = 'reception_mock_checkins'

export function getMockCheckIns(): string[] {
  try {
    const raw = sessionStorage.getItem(CHECKIN_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function addMockCheckIn(patientId: string) {
  const existing = getMockCheckIns()
  if (!existing.includes(patientId)) {
    sessionStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify([...existing, patientId]))
  }
}

export function isPatientInQueueToday(patient: MockPatient) {
  return patient.inQueueToday || getMockCheckIns().includes(patient.id)
}
