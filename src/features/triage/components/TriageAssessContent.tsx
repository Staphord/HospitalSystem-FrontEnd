import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { triageService } from '@/api/services/triage'
import { getDefaultTriageCategory } from '@/features/triage/data/mockTriageVisits'
import {
  COMMON_SYMPTOMS,
  EMPTY_VITALS,
  TRIAGE_CATEGORIES,
  type TriageAssessmentForm,
  type TriageCategory,
  type TriageVisit,
  type TriageVitals,
} from '@/features/triage/types/triageAssessment'
import {
  buildQueueHighlightState,
  getTriageAssessParent,
  type TriageAssessFrom,
} from '@/features/triage/utils/triageAssessNav'

interface TriageAssessContentProps {
  visit: TriageVisit
  from: TriageAssessFrom
}

const VITAL_FIELDS: {
  key: keyof TriageVitals;
  label: string;
  unit: string;
  hint: string;
}[] = [
  { key: 'bpSystolic', label: 'BP Systolic', unit: 'mmHg', hint: 'Normal: 90-120 mmHg' },
  { key: 'bpDiastolic', label: 'BP Diastolic', unit: 'mmHg', hint: 'Normal: 60-80 mmHg' },
  { key: 'temperature', label: 'Temperature', unit: '°C', hint: 'Normal: 36.1-37.2 °C' },
  { key: 'pulseRate', label: 'Pulse Rate', unit: 'BPM', hint: 'Normal: 60-100 BPM' },
  { key: 'spo2', label: 'SpO2', unit: '%', hint: 'Normal: 95-100%' },
  { key: 'respiratoryRate', label: 'Respiratory Rate', unit: 'BPM', hint: 'Normal: 12-20 BPM' },
  { key: 'weight', label: 'Weight', unit: 'kg', hint: 'N/A' },
]

function hasClinicalData(form: TriageAssessmentForm): boolean {
  const hasVitals = Object.values(form.vitals).some((value) => value.trim() !== '')
  return hasVitals || form.symptoms.length > 0 || form.clinicalNotes.trim() !== ''
}

function isFormDirty(form: TriageAssessmentForm, initialCategory: TriageCategory): boolean {
  return (
    hasClinicalData(form) ||
    form.triageCategory !== initialCategory ||
    Object.values(form.vitals).some((value) => value.trim() !== '')
  )
}

function TriageSectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-sm mb-lg border-b border-border-subtle pb-md">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">{title}</h3>
    </div>
  )
}

export function TriageAssessContent({ visit, from }: TriageAssessContentProps) {
  const navigate = useNavigate()
  const parent = getTriageAssessParent(from)
  const initialCategory = getDefaultTriageCategory(visit)
  
  const [form, setForm] = useState<TriageAssessmentForm>({
    visitId: visit.visitId,
    vitals: { ...EMPTY_VITALS },
    symptoms: visit.isEmergency ? ['Chest Pain'] : [],
    clinicalNotes: '',
    triageCategory: initialCategory,
  })
  
  // Automatically call/activate patient in the queue on load if status is still waiting
  useEffect(() => {
    if (visit.status === 'waiting') {
      void triageService.callPatient(visit.queueId).catch((err) => {
        console.error('Failed to auto-call patient on assessment form mount:', err)
      })
    }
  }, [visit.queueId, visit.status])
  
  const [touchedVitals, setTouchedVitals] = useState<Partial<Record<keyof TriageVitals, boolean>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [suggestion, setSuggestion] = useState<{ suggested_category: TriageCategory; reason: string } | null>(null)
  const [suggesting, setSuggesting] = useState(false)

  const dirty = useMemo(() => isFormDirty(form, initialCategory), [form, initialCategory])

  // Query Backend Category Suggestions as Vitals are recorded
  useEffect(() => {
    const hasAnyVitals = Object.values(form.vitals).some((v) => v.trim() !== '')
    if (!hasAnyVitals) {
      setSuggestion(null)
      return
    }

    const delayDebounce = setTimeout(async () => {
      setSuggesting(true)
      try {
        const sys = parseInt(form.vitals.bpSystolic) || null
        const dia = parseInt(form.vitals.bpDiastolic) || null
        const temp = parseFloat(form.vitals.temperature) || null
        const pulse = parseInt(form.vitals.pulseRate) || null
        const spo2 = parseFloat(form.vitals.spo2) || null
        const rr = parseInt(form.vitals.respiratoryRate) || null
        const wt = parseFloat(form.vitals.weight) || null

        const res = await triageService.suggestCategory({
          blood_pressure_systolic: sys,
          blood_pressure_diastolic: dia,
          temperature: temp,
          pulse_rate: pulse,
          oxygen_saturation: spo2,
          respiratory_rate: rr,
          weight_kg: wt,
        })

        setSuggestion({
          suggested_category: res.suggested_category as TriageCategory,
          reason: res.reason,
        })
      } catch (err) {
        console.error('Failed to get triage suggestion:', err)
      } finally {
        setSuggesting(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounce)
  }, [form.vitals])

  const updateVital = (key: keyof TriageVitals, value: string) => {
    setForm((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [key]: value },
    }))
  }

  const toggleSymptom = (symptom: string) => {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }))
  }

  const goBack = () => {
    if (dirty && !window.confirm('Discard this assessment? Unsaved changes will be lost.')) {
      return
    }
    if (from === 'queue') {
      navigate(parent.path, { state: buildQueueHighlightState(visit.visitId) })
      return
    }
    navigate(parent.path)
  }

  const handleCancel = () => {
    goBack()
  }

  const handleSave = async () => {
    if (!hasClinicalData(form)) {
      toast.error('Enter at least one vital, symptom, or clinical note before saving.')
      return
    }

    setIsSaving(true)
    try {
      const sys = parseInt(form.vitals.bpSystolic) || null
      const dia = parseInt(form.vitals.bpDiastolic) || null
      const temp = parseFloat(form.vitals.temperature) || null
      const pulse = parseInt(form.vitals.pulseRate) || null
      const spo2 = parseFloat(form.vitals.spo2) || null
      const rr = parseInt(form.vitals.respiratoryRate) || null
      const wt = parseFloat(form.vitals.weight) || null

      let complaint = form.symptoms.join(', ')
      if (form.clinicalNotes.trim()) {
        complaint = complaint
          ? `${complaint}. Notes: ${form.clinicalNotes.trim()}`
          : form.clinicalNotes.trim()
      }

      if (!complaint) {
        complaint = 'Patient check-in assessment'
      }

      await triageService.createAssessment({
        visit_id: visit.visitId,
        patient_id: visit.patientId,
        blood_pressure_systolic: sys,
        blood_pressure_diastolic: dia,
        temperature: temp,
        pulse_rate: pulse,
        oxygen_saturation: spo2,
        respiratory_rate: rr,
        weight_kg: wt,
        chief_complaint: complaint,
        triage_category: form.triageCategory,
        triage_notes: form.clinicalNotes.trim() || null,
      })

      toast.success(`${visit.name} added to doctor queue.`)
      navigate('/triage/queue')
    } catch (err: any) {
      console.error('Failed to submit triage assessment:', err)
      const detail = err.response?.data?.detail || 'Please try again.'
      toast.error(`Failed to save assessment: ${detail}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-container-max mx-auto w-full pb-28">
      <nav
        className="mb-lg flex flex-wrap items-center gap-2 font-body-sm text-body-sm"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={goBack}
          className="text-primary hover:underline font-label-md bg-transparent border-0 cursor-pointer p-0"
        >
          {parent.label}
        </button>
        <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
        <span className="text-outline">Triage Assessment — {visit.name}</span>
      </nav>

      <div className="space-y-lg">
        <section className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-wrap items-center justify-between gap-md shadow-sm">
          <div className="flex items-center gap-md min-w-0">
            <div className="w-16 h-16 rounded-full border border-border-subtle p-1 shrink-0">
              {visit.avatarUrl ? (
                <img
                  src={visit.avatarUrl}
                  alt={visit.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold">
                  {visit.initials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-sm">
                <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">{visit.name}</h2>
                <span className="px-2 py-0.5 bg-surface-container text-outline font-label-md rounded text-[10px]">
                  {visit.patientNumber}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-md mt-xs text-on-surface-variant font-body-sm text-body-sm">
                <span>
                  {visit.gender}, {visit.age} Years
                </span>
                <span className="w-1 h-1 bg-outline rounded-full hidden sm:block" />
                <span>Arrived {visit.arrival}</span>
                <span className="w-1 h-1 bg-outline rounded-full hidden sm:block" />
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">payments</span>
                  {visit.payment}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-label-md text-label-md text-outline uppercase tracking-wider m-0">
              Queue Number
            </p>
            <p className="font-headline-lg text-headline-lg text-primary m-0">#{visit.queueNumber}</p>
          </div>
        </section>

        <section className="bg-surface-white border border-border-subtle rounded-xl p-lg shadow-sm">
          <TriageSectionHeader icon="monitoring" title="Patient Vitals" />
          <div className="grid gap-md [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {VITAL_FIELDS.map((field) => {
              const value = form.vitals[field.key]
              const touched = touchedVitals[field.key]
              const showSuccess = touched && value.trim() !== ''

              return (
                <div key={field.key} className="space-y-xs">
                  <label className="font-label-md text-label-md text-on-surface">{field.label}</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => updateVital(field.key, e.target.value)}
                      onBlur={() => setTouchedVitals((prev) => ({ ...prev, [field.key]: true }))}
                      placeholder="--"
                      className={`w-full h-10 border rounded px-md pr-12 font-body-md text-body-md bg-surface-white outline-none focus:ring-1 focus:ring-primary ${
                        showSuccess ? 'border-success' : 'border-border-subtle'
                      }`}
                    />
                    <span className="absolute right-md top-1/2 -translate-y-1/2 text-outline font-label-sm text-label-sm">
                      {field.unit}
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-outline m-0">{field.hint}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-surface-white border border-border-subtle rounded-xl p-lg shadow-sm">
          <TriageSectionHeader icon="medical_information" title="Chief Complaint" />
          <div className="space-y-lg">
            <div>
              <p className="font-label-md text-label-md text-on-surface mb-sm m-0">
                Common Symptoms (Select all that apply)
              </p>
              <div className="flex flex-wrap gap-sm">
                {COMMON_SYMPTOMS.map((symptom) => {
                  const selected = form.symptoms.includes(symptom)
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-md py-sm border rounded-full font-label-md text-label-md transition-all flex items-center gap-xs cursor-pointer ${
                        selected
                          ? 'border-primary bg-hover-tint text-primary'
                          : 'border-border-subtle text-on-surface-variant hover:bg-hover-tint hover:border-primary'
                      }`}
                    >
                      {selected && (
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      )}
                      {symptom}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface">
                Additional Clinical Notes
              </label>
              <textarea
                value={form.clinicalNotes}
                onChange={(e) => setForm((prev) => ({ ...prev, clinicalNotes: e.target.value }))}
                rows={4}
                placeholder="Enter detailed observations, patient history related to current visit, or other symptoms..."
                className="w-full border border-border-subtle rounded p-md font-body-md text-body-md resize-none bg-surface-white outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </section>

        <section className="bg-surface-white border border-border-subtle rounded-xl p-lg shadow-sm">
          <TriageSectionHeader icon="priority_high" title="Triage Category Assignment" />
          
          {/* Real-time backend suggestion banner */}
          {suggestion && (
            <div className="mb-lg p-md border border-primary/25 bg-hover-tint rounded-xl flex items-start gap-md animate-fade-in shadow-sm">
              <span className="material-symbols-outlined text-primary text-2xl mt-0.5">clinical_trial</span>
              <div className="flex-1">
                <h4 className="font-headline-sm text-headline-sm text-primary m-0 mb-xs">
                  Clinical Recommendation
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface m-0 mb-sm">
                  Based on current vital signs, the system suggests **{suggestion.suggested_category.toUpperCase().replace('_', ' ')}**.
                  <br />
                  <span className="text-secondary font-medium text-xs">Reason: {suggestion.reason}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, triageCategory: suggestion.suggested_category }))}
                  className="bg-primary text-white px-md h-8 rounded font-label-md text-label-md hover:bg-opacity-90 border-0 cursor-pointer flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Apply Suggested Category
                </button>
              </div>
            </div>
          )}

          {suggesting && (
            <div className="mb-lg flex items-center gap-xs text-secondary font-label-sm text-xs">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              Analyzing vitals for suggestion...
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
            {TRIAGE_CATEGORIES.map((category) => (
              <label key={category.value} className="relative cursor-pointer group">
                <input
                  type="radio"
                  name="triageCategory"
                  value={category.value}
                  checked={form.triageCategory === category.value}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, triageCategory: category.value }))
                  }
                  className="peer sr-only"
                />
                <span
                  className={`absolute top-3 right-3 z-10 w-5 h-5 rounded-full flex items-center justify-center text-white transition-all pointer-events-none
                    opacity-0 peer-checked:opacity-100 ${category.bgClass}`}
                >
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </span>
                <div
                  className={`h-full border-[3px] border-border-subtle rounded-xl p-md flex flex-col items-center text-center transition-all group-hover:bg-surface-container-low ${category.borderClass}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full ${category.bgClass} flex items-center justify-center mb-md text-white`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {category.icon}
                    </span>
                  </div>
                  <h4 className={`font-headline-sm text-headline-sm mb-xs m-0 ${category.colorClass}`}>
                    {category.label}
                  </h4>
                  <p className="font-label-sm text-label-sm text-outline mb-md uppercase tracking-tighter m-0">
                    {category.level}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
                    {category.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </section>
      </div>

      <footer className="fixed bottom-16 lg:bottom-0 left-0 lg:left-sidebar-width right-0 bg-surface-white border-t border-border-subtle px-lg py-md flex justify-end items-center gap-md z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="px-lg h-10 border border-border-subtle rounded text-on-surface-variant hover:bg-surface-container transition-colors font-label-md text-label-md bg-transparent cursor-pointer disabled:opacity-50"
        >
          Cancel Assessment
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-lg h-10 bg-primary-container text-white rounded hover:bg-primary transition-colors font-label-md text-label-md shadow-sm border-0 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save & Add to Doctor Queue'}
        </button>
      </footer>
    </div>
  )
}
