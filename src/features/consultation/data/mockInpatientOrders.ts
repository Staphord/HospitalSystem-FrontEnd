import type {
  AdmittedPatient,
  AdmissionSummary,
  DischargeDefaults,
  InpatientOrder,
} from '@/features/consultation/types/inpatientOrders'

const dischargedIds = new Set<string>()

export const MOCK_ADMITTED_PATIENTS: AdmittedPatient[] = [
  {
    id: 'ip-01',
    patientId: 'p-003',
    name: 'Fatuma Said',
    patientNumber: 'PT-4891',
    initials: 'FS',
    gender: 'Female',
    age: 42,
    ward: 'ICU',
    bed: 'Bed 12',
    admissionDate: 'Oct 12, 2024',
    lengthOfStay: 1,
    diagnosis: 'Acute MI',
    primaryDiagnosis: 'Acute MI (Myocardial Infarction)',
    status: 'critical',
  },
  {
    id: 'ip-02',
    patientId: 'p-004',
    name: 'John Mwangi',
    patientNumber: 'PT-4856',
    initials: 'JM',
    gender: 'Male',
    age: 42,
    ward: 'Medical Ward B',
    bed: 'Bed 14',
    admissionDate: 'Oct 10, 2024',
    lengthOfStay: 3,
    diagnosis: 'Pneumonia',
    primaryDiagnosis: 'Community-Acquired Pneumonia',
    status: 'stable',
  },
  {
    id: 'ip-03',
    patientId: 'p-005',
    name: 'Asha Juma',
    patientNumber: 'PT-4801',
    initials: 'AJ',
    gender: 'Female',
    age: 35,
    ward: 'Surgical Ward A',
    bed: 'Bed 9',
    admissionDate: 'Oct 08, 2024',
    lengthOfStay: 5,
    diagnosis: 'Post-op recovery',
    primaryDiagnosis: 'Post-operative Recovery — Appendectomy',
    status: 'monitoring',
  },
  {
    id: 'ip-04',
    patientId: 'p-002',
    name: 'Hassan Mwita',
    patientNumber: 'PT-4889',
    initials: 'HM',
    gender: 'Male',
    age: 31,
    ward: 'Medical Ward B',
    bed: 'Bed 07',
    admissionDate: 'Oct 11, 2024',
    lengthOfStay: 2,
    diagnosis: 'Dengue Fever',
    primaryDiagnosis: 'Dengue Fever (Confirmed)',
    status: 'discharge-ready',
  },
  {
    id: 'ip-05',
    patientId: 'p-006',
    name: 'Grace Kimaro',
    patientNumber: 'PT-4792',
    initials: 'GK',
    gender: 'Female',
    age: 28,
    ward: 'Paediatric',
    bed: 'Bed 03',
    admissionDate: 'Oct 09, 2024',
    lengthOfStay: 4,
    diagnosis: 'Severe Malaria',
    primaryDiagnosis: 'Severe Plasmodium falciparum Malaria',
    status: 'discharge-ready',
  },
]

const ADMISSION_SUMMARIES: Record<string, AdmissionSummary> = {
  'ip-02': {
    admittingDiagnosis: 'Pneumonia, Unspecified Organism (J18.9)',
    admittingDoctor: 'Dr. Amina Hassan',
    wardService: 'Medical Ward B - Pulmonology',
    keyEvents: [
      { date: '07 Jun', description: 'Admitted with fever (39°C) and respiratory distress.' },
      { date: '08 Jun', description: 'IV Antibiotics started; SpO2 stabilized at 96% on room air.' },
      { date: '09 Jun', description: 'Afebrile for 24 hours. Oral switch successful.' },
    ],
  },
  'ip-03': {
    admittingDiagnosis: 'Acute Appendicitis (K35.80)',
    admittingDoctor: 'Dr. Baraka',
    wardService: 'Surgical Ward A - General Surgery',
    keyEvents: [
      { date: '08 Oct', description: 'Emergency appendectomy performed without complications.' },
      { date: '10 Oct', description: 'Ambulating with assistance. Wound clean and dry.' },
      { date: '12 Oct', description: 'Tolerating regular diet. Pain well controlled on oral analgesia.' },
    ],
  },
  'ip-04': {
    admittingDiagnosis: 'Dengue Fever (A90)',
    admittingDoctor: 'Dr. Amina Hassan',
    wardService: 'Medical Ward B - Infectious Diseases',
    keyEvents: [
      { date: '11 Oct', description: 'Admitted with thrombocytopenia and fever.' },
      { date: '12 Oct', description: 'Platelet count improving. IV fluids continued.' },
    ],
  },
  'ip-05': {
    admittingDiagnosis: 'Severe Malaria (B50.9)',
    admittingDoctor: 'Dr. Baraka',
    wardService: 'Paediatric Ward - Infectious Diseases',
    keyEvents: [
      { date: '09 Oct', description: 'Admitted with high parasitaemia and anaemia.' },
      { date: '11 Oct', description: 'Parasite clearance achieved. Haemoglobin stable.' },
    ],
  },
}

const DISCHARGE_DEFAULTS: Record<string, DischargeDefaults> = {
  'ip-02': {
    dischargeDiagnosis: 'Pneumonia, Unspecified Organism (J18.9)',
    condition: 'improved',
    careSummary:
      'Patient presented with community-acquired pneumonia. Completed a 3-day course of IV Ceftriaxone. Chest X-ray on 09/06 shows significant resolution of right lower lobe consolidation. Patient is now afebrile, saturating at 98% on room air, and tolerating oral intake. Discharged on oral Augmentin to complete 7 days total antibiotics.',
    instructions:
      'Rest for 1 week at home. Complete all prescribed medications. Return immediately if you experience high fever, shortness of breath, or chest pain.',
    medications: [
      { id: 'dm-1', drugName: 'Augmentin 625mg', doseFreq: '1 tab TDS x 4d' },
      { id: 'dm-2', drugName: 'Paracetamol 500mg', doseFreq: '2 tab PRN x 5d' },
    ],
    followUpDate: '2026-06-16',
  },
}

const INITIAL_ORDERS: InpatientOrder[] = [
  {
    id: 'ord-01',
    admissionId: 'ip-01',
    type: 'medication',
    description: 'Aspirin 75mg PO Daily',
    subDescription: 'PO - Per Oral',
    issuedAt: 'Issued Today 08:00',
    dueLabel: 'Due Daily',
    status: 'pending',
  },
  {
    id: 'ord-02',
    admissionId: 'ip-01',
    type: 'nursing',
    description: 'Vitals every 4 hours',
    subDescription: 'Include BP, HR, Temp, SpO2',
    issuedAt: 'Issued Today 08:00',
    dueLabel: 'Due 12:00',
    status: 'done',
    completedBy: 'Nurse Esther',
  },
  {
    id: 'ord-03',
    admissionId: 'ip-02',
    type: 'medication',
    description: 'Amoxicillin 500mg PO TDS',
    subDescription: 'PO - Per Oral',
    issuedAt: 'Issued Yesterday 14:00',
    dueLabel: 'Due TDS',
    status: 'pending',
  },
  {
    id: 'ord-04',
    admissionId: 'ip-02',
    type: 'nursing',
    description: 'Oxygen saturation monitoring',
    subDescription: 'SpO2 every 2 hours',
    issuedAt: 'Issued Yesterday 14:00',
    dueLabel: 'Due 2-hourly',
    status: 'done',
    completedBy: 'Nurse Amina',
  },
  {
    id: 'ord-05',
    admissionId: 'ip-03',
    type: 'nursing',
    description: 'Wound dressing change',
    subDescription: 'Surgical site — sterile technique',
    issuedAt: 'Issued Oct 08 10:00',
    dueLabel: 'Due Daily',
    status: 'pending',
  },
]

function defaultAdmissionSummary(patient: AdmittedPatient): AdmissionSummary {
  return {
    admittingDiagnosis: patient.primaryDiagnosis,
    admittingDoctor: 'Dr. Amina Hassan',
    wardService: `${patient.ward}`,
    keyEvents: [
      {
        date: patient.admissionDate,
        description: `Admitted for ${patient.diagnosis}.`,
      },
    ],
  }
}

function defaultDischargeDefaults(patient: AdmittedPatient): DischargeDefaults {
  return {
    dischargeDiagnosis: patient.primaryDiagnosis,
    condition: 'improved',
    careSummary: `Patient admitted for ${patient.diagnosis}. Clinical course was favourable. Patient is now fit for discharge with outpatient follow-up.`,
    instructions:
      'Rest at home. Complete all prescribed medications. Return if symptoms worsen or new concerns arise.',
    medications: [],
    followUpDate: '',
  }
}

export function getActiveAdmittedPatients(): AdmittedPatient[] {
  return MOCK_ADMITTED_PATIENTS.filter((p) => !dischargedIds.has(p.id))
}

export function getAdmittedPatientById(admissionId: string): AdmittedPatient | undefined {
  const patient = MOCK_ADMITTED_PATIENTS.find((p) => p.id === admissionId)
  if (!patient || dischargedIds.has(admissionId)) return undefined
  return patient
}

export function canDischargePatient(patient: AdmittedPatient): boolean {
  return patient.status !== 'critical'
}

export function markPatientDischarged(admissionId: string): void {
  dischargedIds.add(admissionId)
}

export function getAdmissionSummary(admissionId: string): AdmissionSummary | undefined {
  const patient = MOCK_ADMITTED_PATIENTS.find((p) => p.id === admissionId)
  if (!patient) return undefined
  return ADMISSION_SUMMARIES[admissionId] ?? defaultAdmissionSummary(patient)
}

export function getDischargeDefaults(admissionId: string): DischargeDefaults | undefined {
  const patient = MOCK_ADMITTED_PATIENTS.find((p) => p.id === admissionId)
  if (!patient) return undefined
  return DISCHARGE_DEFAULTS[admissionId] ?? defaultDischargeDefaults(patient)
}

export function getInpatientOrders(admissionId: string): InpatientOrder[] {
  return INITIAL_ORDERS.filter((o) => o.admissionId === admissionId && o.status !== 'discontinued')
}

export function getInitialOrdersForAdmission(admissionId: string): InpatientOrder[] {
  return INITIAL_ORDERS.filter((o) => o.admissionId === admissionId)
}
