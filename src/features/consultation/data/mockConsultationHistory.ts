import type {
  ConsultationHistoryPatient,
  ConsultationHistorySearchResult,
  ConsultationVisitRecord,
} from '@/features/consultation/types/consultationHistory'

// ── Visit records keyed by patient id ─────────────────────────────────────────

const VISIT_RECORDS: Record<string, ConsultationVisitRecord[]> = {
  'p-001': [
    {
      visitId: 'V-2026-082',
      date: '02 Jun 2026',
      attendingDoctor: 'Dr. Baraka',
      chiefComplaint: 'Persistent dry cough for 3 weeks',
      diagnosis: 'Bronchitis',
      outcome: 'Recovered',
      clinicalNotes: {
        visitType: 'Outpatient Consultation',
        attending: 'Dr. Baraka',
        chiefComplaint: 'Patient reports persistent dry cough for 3 weeks, aggravated by cold weather. No fever or weight loss reported.',
        objectiveExam: 'BP: 128/84 mmHg  |  Pulse: 72 bpm  |  Temp: 36.8 °C\nChest: Clear on auscultation. No wheezing or crackles heard. Throat shows mild congestion.',
        assessment: 'Suspected Mild Bronchitis. Rule out environmental triggers. Patient has history of dust sensitivity.',
      },
      investigations: [
        { test: 'Chest X-Ray', result: 'Mild peribronchial thickening. No consolidation.', date: '02 Jun 2026' },
        { test: 'Full Blood Count', result: 'WBC slightly elevated at 11.2 × 10³/µL. No eosinophilia.', date: '02 Jun 2026' },
      ],
      prescriptions: [
        { drug: 'Amoxicillin 500 mg', dose: '3× daily', duration: '5 days' },
        { drug: 'Salbutamol Inhaler', dose: '2 puffs as needed', duration: '14 days' },
      ],
      disposition: 'Discharged. Review in 2 weeks or earlier if symptoms worsen. Refer to pulmonology if no improvement.',
    },
    {
      visitId: 'V-2026-071',
      date: '15 May 2026',
      attendingDoctor: 'Dr. Amina',
      chiefComplaint: 'Routine follow-up — Hypertension management',
      diagnosis: 'HTN Management',
      outcome: 'Stable',
      clinicalNotes: {
        visitType: 'Follow-up',
        attending: 'Dr. Amina',
        chiefComplaint: 'Scheduled routine review for hypertension. No acute complaints. Patient feels well on current medication.',
        objectiveExam: 'BP: 138/88 mmHg  |  Pulse: 78 bpm  |  Temp: 36.5 °C\nCardiovascular: Regular rate and rhythm. No murmurs. Peripheral edema absent.',
        assessment: 'BP improving on current regimen. Continue Amlodipine 5 mg. Monitor renal function.',
      },
      investigations: [
        { test: 'Renal Function Tests', result: 'Creatinine 0.9 mg/dL. eGFR 82. Within normal limits.', date: '15 May 2026' },
      ],
      prescriptions: [
        { drug: 'Amlodipine 5 mg', dose: '1× daily', duration: '30 days' },
        { drug: 'Hydrochlorothiazide 25 mg', dose: '1× daily', duration: '30 days' },
      ],
      disposition: 'Continue current antihypertensive regimen. Return in 4 weeks for follow-up BP check. Low-salt diet reinforced.',
    },
    {
      visitId: 'V-2025-201',
      date: '10 Oct 2025',
      attendingDoctor: 'Dr. Baraka',
      chiefComplaint: 'Headache and dizziness for 5 days',
      diagnosis: 'Hypertensive Urgency',
      outcome: 'Admitted',
      clinicalNotes: {
        visitType: 'Emergency Walk-in',
        attending: 'Dr. Baraka',
        chiefComplaint: 'Severe occipital headache and blurred vision since 3 days. Associated dizziness. No chest pain or focal neurological signs.',
        objectiveExam: 'BP: 178/110 mmHg  |  Pulse: 92 bpm  |  Temp: 36.9 °C\nNeurological exam: Alert and oriented. No focal deficits. Fundoscopy not done.',
        assessment: 'Hypertensive urgency. Patient non-compliant with antihypertensive medication for past 2 weeks.',
      },
      investigations: [
        { test: 'CT Head (non-contrast)', result: 'No acute intracranial hemorrhage or infarct.', date: '10 Oct 2025' },
        { test: 'Urea & Electrolytes', result: 'K⁺ 3.8 mmol/L. Na⁺ 138 mmol/L. Normal.', date: '10 Oct 2025' },
      ],
      prescriptions: [
        { drug: 'Nifedipine 10 mg sublingual', dose: 'Stat', duration: 'Once' },
        { drug: 'Enalapril 10 mg', dose: '2× daily', duration: '30 days' },
      ],
      disposition: 'Admitted to medical ward for 24-hour observation and BP stabilisation. Discharged following day with revised medication plan.',
    },
  ],

  'p-002': [
    {
      visitId: 'V-2026-044',
      date: '18 May 2026',
      attendingDoctor: 'Dr. Amina',
      chiefComplaint: 'Fever and joint pain for 4 days',
      diagnosis: 'Dengue Fever (Suspected)',
      outcome: 'Recovered',
      clinicalNotes: {
        visitType: 'Outpatient Consultation',
        attending: 'Dr. Amina',
        chiefComplaint: 'High-grade fever (39.2 °C) with severe myalgia and arthralgia. Retro-orbital headache. No rash at presentation.',
        objectiveExam: 'BP: 110/70 mmHg  |  Pulse: 104 bpm  |  Temp: 39.2 °C\nSkin: Flush. No petechiae. Abdomen: Mild hepatomegaly.',
        assessment: 'Clinical picture consistent with dengue. NS1 antigen positive. Supportive management initiated.',
      },
      investigations: [
        { test: 'NS1 Antigen', result: 'Positive', date: '18 May 2026' },
        { test: 'Full Blood Count', result: 'Platelets: 98 × 10³/µL (low). WBC: 3.2 × 10³/µL (low).', date: '18 May 2026' },
      ],
      prescriptions: [
        { drug: 'Paracetamol 1 g', dose: '4× daily', duration: '5 days' },
        { drug: 'ORS', dose: 'Liberal fluids', duration: '7 days' },
      ],
      disposition: 'Discharged with strict instructions to return if platelet count drops below 50 or bleeding develops. Daily CBC monitoring advised.',
    },
    {
      visitId: 'V-2025-315',
      date: '22 Dec 2025',
      attendingDoctor: 'Dr. Baraka',
      chiefComplaint: 'Abdominal pain and nausea',
      diagnosis: 'Gastritis',
      outcome: 'Recovered',
      clinicalNotes: {
        visitType: 'Outpatient Consultation',
        attending: 'Dr. Baraka',
        chiefComplaint: 'Epigastric pain for 2 days, aggravated by food. Associated nausea and one episode of vomiting. No hematemesis.',
        objectiveExam: 'BP: 120/75 mmHg  |  Pulse: 80 bpm  |  Temp: 36.6 °C\nAbdomen: Soft, tender in epigastrium. No guarding or rigidity. Bowel sounds normal.',
        assessment: 'Peptic/gastritis presentation. No alarm features. Helicobacter pylori test ordered.',
      },
      investigations: [
        { test: 'H. pylori Antigen (stool)', result: 'Negative', date: '22 Dec 2025' },
        { test: 'Abdominal Ultrasound', result: 'Liver, gallbladder and pancreas normal. No free fluid.', date: '23 Dec 2025' },
      ],
      prescriptions: [
        { drug: 'Omeprazole 20 mg', dose: '2× daily before meals', duration: '14 days' },
        { drug: 'Metoclopramide 10 mg', dose: '3× daily', duration: '5 days' },
      ],
      disposition: 'Discharged. Avoid NSAIDs and spicy food. Return if symptoms persist beyond 2 weeks.',
    },
  ],

  'p-003': [
    {
      visitId: 'V-2026-010',
      date: '05 Apr 2026',
      attendingDoctor: 'Dr. Amina',
      chiefComplaint: 'Poorly controlled blood sugar',
      diagnosis: 'Type 2 Diabetes Mellitus — Uncontrolled',
      outcome: 'Stable',
      clinicalNotes: {
        visitType: 'Follow-up',
        attending: 'Dr. Amina',
        chiefComplaint: 'HbA1c checked at 10.2%. Patient reports polyuria and polydipsia. Admits to dietary non-compliance.',
        objectiveExam: 'BP: 135/82 mmHg  |  Pulse: 76 bpm  |  Weight: 88 kg\nFeet: No peripheral neuropathy on monofilament testing. Pulses present.',
        assessment: 'Poorly controlled T2DM. Add SGLT2 inhibitor. Reinforce dietary counselling. Screen for complications.',
      },
      investigations: [
        { test: 'HbA1c', result: '10.2% (target <7%)', date: '05 Apr 2026' },
        { test: 'Lipid Profile', result: 'LDL: 3.8 mmol/L (elevated). HDL: 0.9 mmol/L.', date: '05 Apr 2026' },
        { test: 'Microalbuminuria', result: '62 mg/g Cr (moderately elevated)', date: '05 Apr 2026' },
      ],
      prescriptions: [
        { drug: 'Metformin 1000 mg', dose: '2× daily with meals', duration: '30 days' },
        { drug: 'Empagliflozin 10 mg', dose: '1× daily', duration: '30 days' },
        { drug: 'Atorvastatin 20 mg', dose: '1× nightly', duration: '30 days' },
      ],
      disposition: 'Return in 3 months for repeat HbA1c. Ophthalmology referral for diabetic retinopathy screening. Dietitian referral made.',
    },
  ],
}

// ── Patient master list ────────────────────────────────────────────────────────

const PATIENTS: ConsultationHistoryPatient[] = [
  {
    id: 'p-001',
    name: 'Amina Juma',
    patientNumber: 'MNH-2024-4421',
    dob: '12 May 1985',
    age: 39,
    gender: 'Female',
    phone: '+255 744 123 456',
    paymentMethod: 'Insurance',
    registeredOn: '10 Jan 2024',
    totalVisits: 8,
    lastVisitDate: '02 Jun 2026',
    activeConditions: 2,
    allergies: [
      {
        substance: 'Penicillin',
        severity: 'Severe reaction',
        documentedBy: 'Dr. Amina',
        documentedOn: '15 May 2024',
      },
    ],
    avatarInitials: 'AJ',
  },
  {
    id: 'p-002',
    name: 'Hassan Mwita',
    patientNumber: 'MNH-2024-1104',
    dob: '03 Aug 1992',
    age: 31,
    gender: 'Male',
    phone: '+255 712 987 654',
    paymentMethod: 'Cash',
    registeredOn: '05 Mar 2024',
    totalVisits: 3,
    lastVisitDate: '18 May 2026',
    activeConditions: 0,
    allergies: [],
    avatarInitials: 'HM',
  },
  {
    id: 'p-003',
    name: 'Fatuma Said',
    patientNumber: 'MNH-2024-0892',
    dob: '27 Nov 1978',
    age: 45,
    gender: 'Female',
    phone: '+255 754 456 789',
    paymentMethod: 'Insurance',
    registeredOn: '22 Aug 2023',
    totalVisits: 12,
    lastVisitDate: '05 Apr 2026',
    activeConditions: 3,
    allergies: [
      {
        substance: 'Sulfonamides',
        severity: 'Rash and urticaria',
        documentedBy: 'Dr. Baraka',
        documentedOn: '10 Jan 2024',
      },
      {
        substance: 'Aspirin',
        severity: 'GI bleeding',
        documentedBy: 'Dr. Amina',
        documentedOn: '22 Mar 2024',
      },
    ],
    avatarInitials: 'FS',
  },
  {
    id: 'p-004',
    name: 'John Doe',
    patientNumber: 'MNH-2024-1234',
    dob: '14 Feb 1980',
    age: 44,
    gender: 'Male',
    phone: '+255 788 321 000',
    paymentMethod: 'Cash',
    registeredOn: '15 Feb 2024',
    totalVisits: 2,
    lastVisitDate: '10 Apr 2026',
    activeConditions: 1,
    allergies: [],
    avatarInitials: 'JD',
  },
]

// ── Recent patients (shown on empty search state) ──────────────────────────────

export const RECENT_CONSULTATION_PATIENTS = PATIENTS.slice(0, 3)

// ── Search ─────────────────────────────────────────────────────────────────────

function toSearchResult(p: ConsultationHistoryPatient): ConsultationHistorySearchResult {
  const visits = VISIT_RECORDS[p.id] ?? []
  return {
    ...p,
    lastDiagnosis: visits[0]?.diagnosis ?? 'No records',
  }
}

export function searchConsultationHistory(query: string): ConsultationHistorySearchResult[] {
  const q = query.toLowerCase()
  return PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.patientNumber.toLowerCase().includes(q) ||
      p.phone.includes(q),
  ).map(toSearchResult)
}

export function getConsultationPatientById(
  id: string,
): ConsultationHistorySearchResult | undefined {
  const patient = PATIENTS.find((p) => p.id === id)
  return patient ? toSearchResult(patient) : undefined
}

export function getPatientConsultationHistory(patientId: string): ConsultationVisitRecord[] {
  return VISIT_RECORDS[patientId] ?? []
}
