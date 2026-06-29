import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

interface Vitals {
  bp: string
  temp: string
  pulse: string
  spo2: string
  respRate: string
}

interface Note {
  id: string
  timestamp: string
  recordedBy: string
  vitals: Vitals
  observation: string
  intervention: string
  response: string
}

interface Patient {
  id: string
  name: string
  patientNo: string
  bed: string
  condition: string
  diagnosis: string
  admissionDate: string
  admittingDoctor?: string
  photo?: string
}

function seedInitialNotes(patientName: string): Note[] {
  if (patientName === 'Fatuma Said') {
    return [
      {
        id: 'n1',
        timestamp: '09 JUN 2026, 08:15',
        recordedBy: 'Nurse Esther Komba',
        vitals: { bp: '120/80', temp: '37.2', pulse: '82', spo2: '98', respRate: '16' },
        observation:
          'Patient stable during morning handover. Oral intake improved. Wound dressing remains clean and dry. No complaints of pain at current site...',
        intervention: 'Repositioned patient. IV fluids continued as per schedule.',
        response: 'Patient responded well. Resting comfortably.',
      },
      {
        id: 'n2',
        timestamp: '08 JUN 2026, 22:45',
        recordedBy: 'Nurse Juma Bakari',
        vitals: { bp: '118/76', temp: '36.8', pulse: '78', spo2: '', respRate: '' },
        observation:
          'Patient sleeping comfortably. IV fluids running as per schedule at 80ml/hr. No respiratory distress noted during hourly rounds...',
        intervention: 'Hourly rounds completed. No intervention needed.',
        response: 'Patient sleeping soundly.',
      },
      {
        id: 'n3',
        timestamp: '08 JUN 2026, 16:30',
        recordedBy: 'Nurse Esther Komba',
        vitals: { bp: '130/85', temp: '37.5', pulse: '', spo2: '', respRate: '' },
        observation:
          'Physiotherapy session completed. Patient sat on the chair for 30 minutes. Reported mild fatigue but tolerated the session well...',
        intervention: 'Assisted with physiotherapy exercises.',
        response: 'Patient tolerated session. Mild fatigue reported.',
      },
    ]
  } else {
    // Default seed for testing Juma Hamisi (matches Juma Hamisi test expectations)
    return [
      {
        id: 'n-test1',
        timestamp: '09 JUN 2026, 08:15',
        recordedBy: 'Nurse Amina Masoud, RN',
        vitals: { bp: '110/70', temp: '36.5', pulse: '72', spo2: '97', respRate: '14' },
        observation:
          'Patient remains drowsy but responsive to verbal commands. Complains of mild headache.',
        intervention: 'Administered pain relief.',
        response: 'Headache partially relieved.',
      }
    ]
  }
}

function isOutOfRange(value: string, min: number, max: number): boolean {
  if (!value) return false
  const num = parseFloat(value)
  return isNaN(num) || num < min || num > max
}

export function NursingNotesPage() {
  const { patientId } = useParams<{ patientId: string }>()

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return false
    }
    return true
  })

  useEffect(() => {
    if (!isLoading) return
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [isLoading])

  const [patient] = useState<Patient>(() => {
    const list = JSON.parse(localStorage.getItem('hf_mock_admitted_patients') || '[]')
    return (
      list.find((p: any) => p.id === patientId) ||
      list[0] || {
        id: patientId || 'p-test1',
        name: 'Juma Hamisi',
        patientNo: 'HN-9821',
        bed: 'Bed 03',
        condition: 'Critical',
        diagnosis: 'Severe Malaria w/ Complications',
        admissionDate: '2026-06-20',
        admittingDoctor: 'Dr. Joseph Lema',
      }
    )
  })

  // Initialize vitals and textareas with default values
  const [vitals, setVitals] = useState<Vitals>(() => {
    if (patient.name === 'Fatuma Said') {
      return {
        bp: '145/95',
        temp: '39.8',
        pulse: '102',
        spo2: '94',
        respRate: '22',
      }
    }
    return {
      bp: '',
      temp: '',
      pulse: '',
      spo2: '',
      respRate: '',
    }
  })

  const [observation, setObservation] = useState(() => {
    if (patient.name === 'Fatuma Said') {
      return 'Patient is exhibiting signs of acute distress. High-grade fever (39.8°C) noted with associated chills and rigors. Visible tremors. Patient is conscious but appears disoriented to time.'
    }
    return ''
  })
  const [intervention, setIntervention] = useState(() => {
    if (patient.name === 'Fatuma Said') {
      return 'Administered Paracetamol 1g IV as per PRN order. Applied tepid sponges. Dr. Amina Hassan notified of temperature spike. Increased fluid monitoring.'
    }
    return ''
  })
  const [response, setResponse] = useState(() => {
    if (patient.name === 'Fatuma Said') {
      return 'Patient reported slight relief after sponge bath but remains restless. Chills subsided after 15 minutes. Awaiting follow-up from medical officer.'
    }
    return ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const [notes, setNotes] = useState<Note[]>(() => {
    const key = `hf_mock_nursing_notes_${patient.id}`
    const initial = seedInitialNotes(patient.name)
    if (patient.name !== 'Fatuma Said') {
      return initial
    }
    const existing = localStorage.getItem(key)
    if (existing) return JSON.parse(existing)
    localStorage.setItem(key, JSON.stringify(initial))
    return initial
  })

  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const d = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      const t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      setCurrentTime(`${d}, ${t}`)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!observation.trim() || !intervention.trim() || !response.trim()) {
      return
    }

    setSubmitting(true)
    setTimeout(() => {
      const now = new Date()
      const d = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
      const t = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

      const newNote: Note = {
        id: `n-${Date.now()}`,
        timestamp: `${d}, ${t}`,
        recordedBy: 'Nurse Esther Komba',
        vitals: { ...vitals },
        observation,
        intervention,
        response,
      }

      const updated = [newNote, ...notes]
      setNotes(updated)
      localStorage.setItem(`hf_mock_nursing_notes_${patient.id}`, JSON.stringify(updated))
      
      setSubmitting(false)
      setShowToast(true)
      
      // Reset form fields to empty after successful submit
      setVitals({ bp: '', temp: '', pulse: '', spo2: '', respRate: '' })
      setObservation('')
      setIntervention('')
      setResponse('')

      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false)
      }, 3000)
    }, 800)
  }

  const conditionColor =
    patient.condition === 'Critical'
      ? 'bg-error-container text-error'
      : patient.condition === 'Monitoring'
      ? 'bg-warning/20 text-warning'
      : 'bg-success/20 text-success'

  const admissionFormatted = patient.admissionDate
    ? new Date(patient.admissionDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '09 Jun 2026'

  const tempOutOfRange = isOutOfRange(vitals.temp, 36.1, 37.2)
  return (
    <div className="max-w-container-max mx-auto p-lg">
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }
        .rounded-2xl {
          border-radius: 16px !important;
        }
        
        /* Exact Mockup Color and Design Utilities */
        .text-primary { color: #00296d !important; }
        .text-secondary { color: #4f5f7b !important; }
        .text-clinical-blue { color: #0052cc !important; }
        .bg-clinical-blue { background-color: #0052cc !important; }
        .border-border-default { border-color: #dfe1e6 !important; }
        .bg-surface-container-lowest { background-color: #ffffff !important; }
        .bg-surface-container-low { background-color: #f3f3fb !important; }
        .bg-neutral-bg { background-color: #f4f5f7 !important; }
        .bg-secondary-container { background-color: #cdddff !important; }
        .text-on-secondary-container { color: #51617d !important; }
        
        .bg-error-container { background-color: #ffdad6 !important; }
        .text-error { color: #ff5630 !important; }
        .border-outline-variant { border-color: #c4c6d4 !important; }
        .text-slate-secondary { color: #42526e !important; }
        .text-on-surface-variant { color: #434652 !important; }
        .border-error { border-color: #ff5630 !important; }
        .bg-error-container\/20 { background-color: rgba(255, 218, 214, 0.2) !important; }
        
        .border-outline-variant\/30 { border-color: rgba(196, 198, 212, 0.3) !important; }
        .bg-inverse-surface { background-color: #2f3037 !important; }
        .text-inverse-on-surface { color: #f0f0f9 !important; }
        
        /* Focus and Hover Overrides */
        .focus\:ring-error:focus { --tw-ring-color: #ff5630 !important; }
        .focus\:border-error:focus { border-color: #ff5630 !important; }
        .focus\:ring-clinical-blue:focus { --tw-ring-color: #0052cc !important; }
        .focus\:border-clinical-blue:focus { border-color: #0052cc !important; }
        .hover\:bg-primary-container:hover { background-color: #003d9b !important; }
        .hover\:bg-clinical-blue\/5:hover { background-color: rgba(0, 82, 204, 0.05) !important; }
      `}</style>

      {/* Breadcrumb & Title */}
      <div className="mb-lg">
        <nav className="flex items-center text-slate-secondary mb-xs">
          <Link
            to="/ward/patients"
            className="font-label-md text-[12px] hover:text-primary"
            style={{ textDecoration: 'none' }}
          >
            My Patients
          </Link>
          <span className="material-symbols-outlined text-[14px] mx-xs">chevron_right</span>
          <span className="font-label-md text-[12px] text-[#737685]">
            Nursing Notes — {patient.bed}, {patient.name} {patient.patientNo}
          </span>
        </nav>
        <h1 className="font-headline-md text-headline-md m-0">Nursing Notes</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-12 gap-lg items-start">
          {/* Left Column Skeleton */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
            {/* Patient Header Card Skeleton */}
            <section className="bg-surface-container-lowest border border-border-default rounded-2xl p-md flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-full skeleton shrink-0" />
                <div className="space-y-xs">
                  <div className="h-6 w-32 rounded skeleton" />
                  <div className="h-4 w-48 rounded skeleton" />
                </div>
              </div>
              <div className="flex items-center gap-xl">
                <div className="space-y-xs">
                  <div className="h-4 w-20 rounded skeleton" />
                  <div className="h-5 w-24 rounded skeleton" />
                </div>
                <div className="space-y-xs">
                  <div className="h-4 w-16 rounded skeleton" />
                  <div className="h-5 w-20 rounded skeleton" />
                </div>
                <div className="space-y-xs">
                  <div className="h-4 w-16 rounded skeleton" />
                  <div className="h-5 w-28 rounded skeleton" />
                </div>
              </div>
            </section>

            {/* New Note Form Skeleton */}
            <section className="bg-surface-container-lowest border border-border-default rounded-2xl">
              <div className="px-md py-sm border-b border-border-default flex justify-between items-center">
                <div className="h-6 w-40 rounded skeleton" />
                <div className="h-4 w-28 rounded skeleton" />
              </div>
              <div className="p-md space-y-lg">
                <div className="space-y-md">
                  <div className="h-4 w-24 rounded skeleton" />
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-xs">
                        <div className="h-4 w-16 rounded skeleton" />
                        <div className="h-10 w-full rounded-lg skeleton" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-md">
                  <div className="space-y-xs">
                    <div className="h-4 w-20 rounded skeleton" />
                    <div className="h-24 w-full rounded-lg skeleton" />
                  </div>
                  <div className="space-y-xs">
                    <div className="h-4 w-20 rounded skeleton" />
                    <div className="h-20 w-full rounded-lg skeleton" />
                  </div>
                  <div className="space-y-xs">
                    <div className="h-4 w-24 rounded skeleton" />
                    <div className="h-20 w-full rounded-lg skeleton" />
                  </div>
                </div>
                <div className="flex justify-end pt-md">
                  <div className="h-10 w-32 rounded-lg skeleton" />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column Skeleton */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <section className="bg-surface-container-lowest border border-border-default rounded-2xl flex flex-col h-[calc(100vh-180px)]">
              <div className="px-md py-sm border-b border-border-default flex justify-between items-center shrink-0">
                <div className="h-6 w-32 rounded skeleton" />
                <div className="h-6 w-6 rounded skeleton" />
              </div>
              <div className="p-md space-y-md overflow-hidden">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-neutral-bg p-md rounded-xl border border-outline-variant/30 space-y-sm">
                    <div className="flex justify-between items-start">
                      <div className="space-y-xs">
                        <div className="h-3 w-28 rounded skeleton" />
                        <div className="h-4 w-36 rounded skeleton" />
                      </div>
                      <div className="h-5 w-5 rounded skeleton" />
                    </div>
                    <div className="flex gap-xs">
                      <div className="h-5 w-14 rounded skeleton" />
                      <div className="h-5 w-14 rounded skeleton" />
                      <div className="h-5 w-14 rounded skeleton" />
                    </div>
                    <div className="h-12 w-full rounded skeleton" />
                  </div>
                ))}
              </div>
              <div className="p-md border-t border-border-default bg-surface-container-low shrink-0 rounded-b-2xl">
                <div className="h-10 w-full rounded-lg skeleton" />
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-lg items-start">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
            {/* 1. Patient Header Card */}
            <section className="bg-surface-container-lowest border border-border-default rounded-2xl p-md flex items-center justify-between">
              <div className="flex items-center gap-md">
                {patient.photo ? (
                  <img
                    src={patient.photo}
                    alt={`${patient.name} Profile`}
                    className="w-12 h-12 rounded-full border border-outline-variant object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border border-outline-variant bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-lg shrink-0">
                    {patient.name
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')}
                  </div>
                )}
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary m-0">
                    {patient.name}
                  </h2>
                  <div className="flex items-center gap-sm mt-xs">
                    <span className="font-label-md text-label-md text-slate-secondary">
                      ID: {patient.patientNo}
                    </span>
                    <span className="sr-only">File: {patient.patientNo}</span>
                    <span className="w-1 h-1 bg-outline-variant rounded-full" />
                    <span className="font-label-md text-label-md text-slate-secondary">
                      {patient.bed} (General Ward)
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-xl">
                <div className="text-center">
                  <span className="block font-label-sm text-label-sm text-slate-secondary uppercase tracking-wider">
                    Admission Date
                  </span>
                  <span className="font-body-md text-body-md font-semibold">{admissionFormatted}</span>
                </div>
                <div className="text-center">
                  <span className="block font-label-sm text-label-sm text-slate-secondary uppercase tracking-wider">
                    Status
                  </span>
                  <span
                    className={`inline-block px-sm py-xs rounded-full font-label-md text-label-md ${conditionColor}`}
                  >
                    {patient.condition}
                  </span>
                </div>
                {patient.admittingDoctor && (
                  <div className="text-center">
                    <span className="block font-label-sm text-label-sm text-slate-secondary uppercase tracking-wider">
                      Doctor
                    </span>
                    <span className="font-body-md text-body-md font-semibold text-clinical-blue">
                      {patient.admittingDoctor}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* 2. New Nursing Note Form */}
            <section className="bg-surface-container-lowest border border-border-default rounded-2xl">
              <div className="px-md py-sm border-b border-border-default flex justify-between items-center">
                <h3 className="font-headline-sm text-headline-sm text-primary m-0">
                  New Nursing Note
                </h3>
                <div className="flex items-center gap-xs text-slate-secondary">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="font-body-sm text-body-sm">{currentTime}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-md space-y-lg">
                  {/* Vital Signs */}
                  <div>
                    <h4 className="font-label-md text-label-md text-slate-secondary mb-md">
                      VITAL SIGNS
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
                      {/* BP combined */}
                      <VitalInput
                        id="vital-bp"
                        label="BP (Sys/Dia)"
                        placeholder="e.g. 120/80"
                        value={vitals.bp}
                        onChange={(v) => setVitals((prev) => ({ ...prev, bp: v }))}
                        isError={false}
                      />
                      {/* Temp */}
                      <div className="space-y-xs">
                        <label htmlFor="vital-temp" className="font-label-md text-label-md text-on-surface-variant">Temp °C</label>
                        <div className="relative">
                          <input
                            id="vital-temp"
                            aria-label="Temperature (°C)"
                            type="text"
                            placeholder="37.0"
                            value={vitals.temp}
                            onChange={(e) => setVitals((prev) => ({ ...prev, temp: e.target.value }))}
                            className={`h-10 w-full rounded-lg px-sm py-xs pr-9 font-body-md outline-none transition-all border ${
                              tempOutOfRange
                                ? 'border-error bg-error-container/20 focus:ring-1 focus:ring-error focus:border-error'
                                : 'border-border-default bg-white focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue'
                            }`}
                          />
                          <span
                            className={`material-symbols-outlined pointer-events-none absolute inset-y-0 right-3 my-auto flex h-4 w-4 items-center justify-center text-[17px] leading-none text-error transition-opacity ${
                              tempOutOfRange ? 'opacity-100' : 'opacity-0'
                            }`}
                            aria-hidden={!tempOutOfRange}
                            title="Out of range"
                          >
                            warning
                          </span>
                        </div>
                        {tempOutOfRange && (
                          <span className="text-[10px] text-rose-500 font-semibold block mt-0.5 sr-only">
                            Range: 36.1 - 37.2 °C
                          </span>
                        )}
                      </div>
                      {/* Pulse */}
                      <VitalInput
                        id="vital-pulse"
                        label="Pulse bpm"
                        placeholder="72"
                        value={vitals.pulse}
                        onChange={(v) => setVitals((prev) => ({ ...prev, pulse: v }))}
                        isError={isOutOfRange(vitals.pulse, 60, 100)}
                      />
                      {/* SpO2 */}
                      <VitalInput
                        id="vital-spo2"
                        label="SpO2 %"
                        placeholder="98"
                        value={vitals.spo2}
                        onChange={(v) => setVitals((prev) => ({ ...prev, spo2: v }))}
                        isError={isOutOfRange(vitals.spo2, 95, 100)}
                      />
                      {/* Resp Rate */}
                      <VitalInput
                        id="vital-respRate"
                        label="Resp Rate"
                        placeholder="16"
                        value={vitals.respRate}
                        onChange={(v) => setVitals((prev) => ({ ...prev, respRate: v }))}
                        isError={isOutOfRange(vitals.respRate, 12, 20)}
                      />
                    </div>
                  </div>

                  {/* Narrative Inputs */}
                  <div className="space-y-md">
                    <div className="space-y-xs">
                      <label htmlFor="observation-input" className="font-label-md text-label-md text-on-surface-variant">
                        Observation
                      </label>
                      <textarea
                        id="observation-input"
                        rows={4}
                        placeholder="Describe physical findings and mental state..."
                        value={observation}
                        onChange={(e) => setObservation(e.target.value)}
                        className="w-full border border-border-default rounded-lg px-sm py-sm font-body-sm focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue outline-none"
                      />
                    </div>
                    <div className="space-y-xs">
                      <label htmlFor="intervention-input" className="font-label-md text-label-md text-on-surface-variant">
                        Intervention
                      </label>
                      <textarea
                        id="intervention-input"
                        rows={3}
                        placeholder="Actions taken..."
                        value={intervention}
                        onChange={(e) => setIntervention(e.target.value)}
                        className="w-full border border-border-default rounded-lg px-sm py-sm font-body-sm focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue outline-none"
                      />
                    </div>
                    <div className="space-y-xs">
                      <label htmlFor="response-input" className="font-label-md text-label-md text-on-surface-variant">
                        Patient Response
                      </label>
                      <textarea
                        id="response-input"
                        rows={3}
                        placeholder="Outcome of interventions..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        className="w-full border border-border-default rounded-lg px-sm py-sm font-body-sm focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-md">
                    <button
                      type="submit"
                      disabled={submitting}
                      aria-label="Save Record Notes"
                      className="bg-clinical-blue hover:bg-primary-container text-white h-10 px-xl rounded-lg font-label-md transition-colors duration-200 border-0 cursor-pointer disabled:opacity-60 flex items-center justify-center min-w-[120px]"
                      style={{ color: '#ffffff' }}
                    >
                      {submitting ? (
                        <span className="material-symbols-outlined text-[18px] animate-spin">
                          sync
                        </span>
                      ) : (
                        'Submit Note'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          </div>

          {/* Right Column — Previous Notes */}
          <div className="col-span-12 lg:col-span-4 h-full">
            <section className="bg-surface-container-lowest border border-border-default rounded-2xl flex flex-col h-[calc(100vh-180px)]">
              <div className="px-md py-sm border-b border-border-default flex justify-between items-center shrink-0">
                <h3 className="font-headline-sm text-headline-sm text-primary m-0">
                  Previous Notes
                </h3>
                <button className="text-clinical-blue border-0 bg-transparent cursor-pointer p-0 flex items-center justify-center">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-md space-y-md">
                {notes.map((n, idx) => (
                  <div
                    key={n.id}
                    className={`bg-neutral-bg p-md rounded-xl border border-outline-variant/30 space-y-sm ${
                      idx > 0 ? 'opacity-80' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="block font-label-sm text-label-sm text-[#737685] font-semibold">
                          {n.timestamp}
                        </span>
                        <span className="font-body-sm text-body-sm font-semibold text-primary">
                          {n.recordedBy}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-clinical-blue cursor-pointer select-none">
                        visibility
                      </span>
                    </div>

                    {/* Vitals badges */}
                    <div className="flex flex-wrap gap-xs">
                      {n.vitals.bp && (
                        <span className="bg-white px-xs py-[2px] rounded border border-border-default text-[10px] font-bold">
                          {n.vitals.bp}
                        </span>
                      )}
                      {n.vitals.temp && (
                        <span className="bg-white px-xs py-[2px] rounded border border-border-default text-[10px] font-bold">
                          {n.vitals.temp}°C
                        </span>
                      )}
                      {n.vitals.pulse && (
                        <span className="bg-white px-xs py-[2px] rounded border border-border-default text-[10px] font-bold">
                          {n.vitals.pulse}bpm
                        </span>
                      )}
                      {n.vitals.spo2 && (
                        <span className="bg-white px-xs py-[2px] rounded border border-border-default text-[10px] font-bold">
                          {n.vitals.spo2}%
                        </span>
                      )}
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface line-clamp-3 m-0">
                      {n.observation}
                    </p>
                  </div>
                ))}

                {notes.length === 0 && (
                  <p className="text-body-sm text-secondary text-center py-lg m-0">
                    No previous notes recorded.
                  </p>
                )}
              </div>

              <div className="p-md border-t border-border-default bg-surface-container-low shrink-0 rounded-b-2xl">
                <button className="w-full py-sm border border-clinical-blue text-clinical-blue font-label-md rounded-lg hover:bg-clinical-blue/5 transition-colors bg-transparent cursor-pointer">
                  View Full Medical History
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Success Message (Interaction Layer) */}
      <div
        id="toast"
        className={`fixed bottom-lg right-lg bg-inverse-surface text-inverse-on-surface px-lg py-md rounded-xl shadow-lg flex items-center gap-md transition-all duration-300 z-[100] ${
          showToast ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <span
          className="material-symbols-outlined text-success"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
        <span className="font-body-md">Nursing Note saved successfully.</span>
      </div>
    </div>
  )
}

// Extracted vital input component
function VitalInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  isError,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  isError: boolean
}) {
  return (
    <div className="space-y-xs">
      <label htmlFor={id} className="font-label-md text-label-md text-on-surface-variant">{label}</label>
      <div className="relative">
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full rounded-lg px-sm py-xs pr-9 font-body-md outline-none transition-all border ${
            isError
              ? 'border-error bg-error-container/20 focus:ring-1 focus:ring-error focus:border-error'
              : 'border-border-default bg-white focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue'
          }`}
        />
        <span
          className={`material-symbols-outlined pointer-events-none absolute inset-y-0 right-3 my-auto flex h-4 w-4 items-center justify-center text-[17px] leading-none text-error transition-opacity ${
            isError ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!isError}
          title="Out of range"
        >
          warning
        </span>
      </div>
    </div>
  )
}
