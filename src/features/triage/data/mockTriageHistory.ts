import type {
  TriageHistoryPatient,
  TriageHistorySearchResult,
  TriageVisitRecord,
} from '@/features/triage/types/triageHistory'

export const RECENT_TRIAGE_PATIENTS: TriageHistoryPatient[] = [
  {
    id: 'hist-1',
    name: 'Fatuma Said',
    patientNumber: 'PT-4891',
    lastVisitDate: '12/06/2026',
    gender: 'Female',
    age: 64,
    dob: '14 Mar 1962',
    phone: '+255 712 345 678',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC6ev-gvHBmi3_CWAfrla_mtQuLVABOXwieKXR94_MOM_e3oi0DyhvOkfnhjd2jkSoDpbeKeoSCR7up2rV-3-egYZoLNxDw3I1WuriMHbRSWsAWf4ll8hEmO8w5hvlY-64rAnRQP1w42yUGGz2m6jIbA2wZWU41d9QOEGEpdbAey47Z9XxcC2w4mwu8yHkKJa7DtXa8ktipGXWw7QIT8XuF1aHo5YxDEEahJwV0jDJOYCD9mY2t2pxWKxr-52nyY900GwEhH48Y8qBS',
  },
  {
    id: 'hist-2',
    name: 'Hassan Mwita',
    patientNumber: 'PT-4889',
    lastVisitDate: '11/06/2026',
    gender: 'Male',
    age: 45,
    dob: '08 Nov 1980',
    phone: '+255 754 210 333',
  },
  {
    id: 'hist-3',
    name: 'Grace Kimaro',
    patientNumber: 'PT-4892',
    lastVisitDate: '10/06/2026',
    gender: 'Female',
    age: 32,
    dob: '22 Sep 1993',
    phone: '+255 765 098 112',
  },
  {
    id: 'hist-4',
    name: 'Peter Mkapa',
    patientNumber: 'PT-4894',
    lastVisitDate: '09/06/2026',
    gender: 'Male',
    age: 51,
    dob: '01 Apr 1975',
    phone: '+255 788 441 567',
  },
]

const HISTORY_DATABASE: TriageHistorySearchResult[] = [
  {
    ...RECENT_TRIAGE_PATIENTS[0],
    lastTriageCategory: 'Emergency',
    lastAssessedAt: '12/06/2026 08:45',
    assessmentCount: 3,
  },
  {
    ...RECENT_TRIAGE_PATIENTS[1],
    lastTriageCategory: 'Urgent',
    lastAssessedAt: '11/06/2026 14:20',
    assessmentCount: 2,
  },
  {
    ...RECENT_TRIAGE_PATIENTS[2],
    lastTriageCategory: 'Semi-Urgent',
    lastAssessedAt: '10/06/2026 09:15',
    assessmentCount: 1,
  },
  {
    ...RECENT_TRIAGE_PATIENTS[3],
    lastTriageCategory: 'Non-Urgent',
    lastAssessedAt: '09/06/2026 16:40',
    assessmentCount: 4,
  },
  {
    id: 'hist-5',
    name: 'Mariam Juma',
    patientNumber: 'PT-4893',
    lastVisitDate: '08/06/2026',
    gender: 'Female',
    age: 28,
    dob: '30 Jan 1998',
    phone: '+255 712 900 211',
    lastTriageCategory: 'Non-Urgent',
    lastAssessedAt: '08/06/2026 11:00',
    assessmentCount: 1,
  },
  {
    id: 'hist-6',
    name: 'Lucy White',
    patientNumber: 'PT-4895',
    lastVisitDate: '07/06/2026',
    gender: 'Female',
    age: 19,
    dob: '15 Jun 2007',
    phone: '+255 741 320 774',
    lastTriageCategory: 'Semi-Urgent',
    lastAssessedAt: '07/06/2026 10:30',
    assessmentCount: 2,
  },
]

const VISIT_RECORDS: Record<string, TriageVisitRecord[]> = {
  'hist-1': [
    {
      visitId: 'V-2026-112',
      date: '12 Jun 2026',
      chiefComplaint: 'Chest Pain & Shortness of Breath',
      triageCategory: 'Emergency',
      attendingDoctor: 'Dr. Sarah Moshi',
      diagnosis: 'Suspected Cardiac Event',
      outcome: 'Admitted',
      vitals: 'BP: 158/95 mmHg, Temp: 37.0°C, Pulse: 110 bpm, SpO2: 92%',
      doctorNotes:
        'Patient arrived with acute chest pain radiating to left arm. ECG showed ST-elevation. Cardiology team notified immediately. Patient admitted to cardiac unit for further management.',
    },
    {
      visitId: 'V-2026-081',
      date: '02 May 2026',
      chiefComplaint: 'Fever & Cough',
      triageCategory: 'Emergency',
      attendingDoctor: 'Dr. Sarah Moshi',
      diagnosis: 'Upper Respiratory Infection',
      outcome: 'Discharged',
      vitals: 'BP: 120/80 mmHg, Temp: 38.9°C, Pulse: 88 bpm, SpO2: 97%',
      doctorNotes:
        'Patient presented with high-grade fever and productive cough for 3 days. Lungs clear on auscultation. No signs of pneumonia. Prescribed paracetamol and advised rest. Follow up if symptoms worsen.',
    },
    {
      visitId: 'V-2025-901',
      date: '18 Nov 2025',
      chiefComplaint: 'Severe Headache',
      triageCategory: 'Urgent',
      attendingDoctor: 'Dr. Peter Luoga',
      diagnosis: 'Hypertensive Headache',
      outcome: 'Discharged',
      vitals: 'BP: 168/104 mmHg, Temp: 36.8°C, Pulse: 82 bpm',
      doctorNotes:
        'Hypertensive patient presenting with throbbing occipital headache. BP significantly elevated. Antihypertensive adjusted. Advised dietary modifications and follow up in 1 week.',
    },
  ],
  'hist-2': [
    {
      visitId: 'V-2026-108',
      date: '11 Jun 2026',
      chiefComplaint: 'Back Pain',
      triageCategory: 'Urgent',
      attendingDoctor: 'Dr. Juma Kapuya',
      diagnosis: 'Lumbar Muscle Strain',
      outcome: 'Discharged',
      vitals: 'BP: 128/82 mmHg, Temp: 36.9°C, Pulse: 76 bpm',
      doctorNotes:
        'Patient reports lifting heavy objects yesterday. Localised pain in lumbar region, no radiation to legs. No neurological deficits. Prescribed NSAIDs and physiotherapy referral.',
    },
    {
      visitId: 'V-2025-712',
      date: '03 Sep 2025',
      chiefComplaint: 'Abdominal Pain',
      triageCategory: 'Semi-Urgent',
      attendingDoctor: 'Dr. Sarah Moshi',
      diagnosis: 'Gastroenteritis',
      outcome: 'Discharged',
      vitals: 'BP: 115/75 mmHg, Temp: 37.8°C, Pulse: 92 bpm',
      doctorNotes:
        'Diffuse abdominal cramping with loose stools for 2 days. Likely viral gastroenteritis. Advised oral rehydration and light diet. Symptoms expected to resolve within 48–72 hours.',
    },
  ],
  'hist-3': [
    {
      visitId: 'V-2026-109',
      date: '10 Jun 2026',
      chiefComplaint: 'Sprained Wrist',
      triageCategory: 'Semi-Urgent',
      attendingDoctor: 'Dr. Juma Kapuya',
      diagnosis: 'Grade 1 Wrist Sprain',
      outcome: 'Discharged',
      vitals: 'BP: 118/76 mmHg, Temp: 36.6°C, Pulse: 70 bpm',
      doctorNotes:
        'Patient fell on outstretched hand. Tenderness over dorsal wrist, no bony deformity. X-ray negative for fracture. RICE protocol advised. Splint applied. Review in 1 week.',
    },
  ],
  'hist-4': [
    {
      visitId: 'V-2026-110',
      date: '09 Jun 2026',
      chiefComplaint: 'Chronic Back Pain',
      triageCategory: 'Non-Urgent',
      attendingDoctor: 'Dr. Peter Luoga',
      diagnosis: 'Lumbar Disc Herniation',
      outcome: 'Referred',
      vitals: 'BP: 132/86 mmHg, Temp: 36.7°C, Pulse: 74 bpm',
      doctorNotes:
        'Long-standing lower back pain with recent worsening. MRI indicates L4/L5 disc herniation with mild nerve root compression. Referred to orthopaedic specialist for further evaluation.',
    },
    {
      visitId: 'V-2026-042',
      date: '15 Mar 2026',
      chiefComplaint: 'Sprained Ankle',
      triageCategory: 'Non-Urgent',
      attendingDoctor: 'Dr. Juma Kapuya',
      diagnosis: 'Grade 1 Ankle Sprain',
      outcome: 'Discharged',
      vitals: 'BP: 125/80 mmHg, Temp: 36.5°C, Pulse: 72 bpm',
      doctorNotes:
        'Inversion injury while walking. Mild swelling over lateral malleolus. Ottawa rules negative for fracture. Compression bandage applied. Weight bearing advised as tolerated.',
    },
    {
      visitId: 'V-2026-005',
      date: '10 Jan 2026',
      chiefComplaint: 'Severe Chest Pain',
      triageCategory: 'Emergency',
      attendingDoctor: 'Dr. Sarah Moshi',
      diagnosis: 'Suspected MI / Angina',
      outcome: 'Referred',
      vitals: 'BP: 152/98 mmHg, Temp: 37.1°C, Pulse: 104 bpm, SpO2: 94%',
      doctorNotes:
        'Acute onset crushing chest pain with diaphoresis. Troponin mildly elevated. Stabilised and referred to National Cardiac Centre for urgent catheterisation.',
    },
    {
      visitId: 'V-2025-912',
      date: '05 Nov 2025',
      chiefComplaint: 'Persistent Cough',
      triageCategory: 'Urgent',
      attendingDoctor: 'Dr. Peter Luoga',
      diagnosis: 'Bronchitis',
      outcome: 'Discharged',
      vitals: 'BP: 122/78 mmHg, Temp: 37.6°C, Pulse: 84 bpm, SpO2: 98%',
      doctorNotes:
        'Cough productive of yellow sputum for 10 days. Mild wheeze on auscultation. No signs of pneumonia on CXR. Antibiotics and bronchodilator prescribed. Review in 5 days.',
    },
  ],
  'hist-5': [
    {
      visitId: 'V-2026-105',
      date: '08 Jun 2026',
      chiefComplaint: 'Nausea & Vomiting',
      triageCategory: 'Non-Urgent',
      attendingDoctor: 'Dr. Sarah Moshi',
      diagnosis: 'Food Poisoning',
      outcome: 'Discharged',
      vitals: 'BP: 110/70 mmHg, Temp: 37.4°C, Pulse: 90 bpm',
      doctorNotes:
        'Patient reports vomiting after eating leftover food. No blood in vomitus. Mild dehydration. IV fluids given, antiemetics prescribed. Discharged after symptoms improved.',
    },
  ],
  'hist-6': [
    {
      visitId: 'V-2026-103',
      date: '07 Jun 2026',
      chiefComplaint: 'Fever & Headache',
      triageCategory: 'Semi-Urgent',
      attendingDoctor: 'Dr. Juma Kapuya',
      diagnosis: 'Viral Fever',
      outcome: 'Discharged',
      vitals: 'BP: 112/72 mmHg, Temp: 38.4°C, Pulse: 86 bpm',
      doctorNotes:
        'Mild viral fever with frontal headache. No stiff neck or photophobia. Paracetamol and fluids advised. Malaria RDT negative. Expected self-limiting illness.',
    },
    {
      visitId: 'V-2025-634',
      date: '22 Aug 2025',
      chiefComplaint: 'Knee Pain',
      triageCategory: 'Non-Urgent',
      attendingDoctor: 'Dr. Peter Luoga',
      diagnosis: 'Patellofemoral Syndrome',
      outcome: 'Discharged',
      vitals: 'BP: 116/74 mmHg, Temp: 36.6°C, Pulse: 68 bpm',
      doctorNotes:
        'Anterior knee pain worsening on stairs and prolonged sitting. No effusion. Patellofemoral grind test positive. Physiotherapy and quadriceps strengthening exercises prescribed.',
    },
  ],
}

export function searchTriageHistory(query: string): TriageHistorySearchResult[] {
  const term = query.trim().toLowerCase()
  if (!term) return []
  return HISTORY_DATABASE.filter(
    (p) => p.name.toLowerCase().includes(term) || p.patientNumber.toLowerCase().includes(term),
  )
}

export function getTriageHistoryPatientById(id: string): TriageHistorySearchResult | undefined {
  return HISTORY_DATABASE.find((p) => p.id === id)
}

export function getPatientVisitHistory(patientId: string): TriageVisitRecord[] {
  return VISIT_RECORDS[patientId] ?? []
}
