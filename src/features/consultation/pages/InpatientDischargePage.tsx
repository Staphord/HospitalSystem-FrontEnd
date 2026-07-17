import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { InpatientPatientHeader } from '@/features/consultation/components/InpatientPatientHeader'
import { wardService } from '@/api/services/ward'
import type { DischargeCondition, DischargeMedication } from '@/features/consultation/types/inpatientOrders'

const CONDITION_LABELS: Record<DischargeCondition, string> = {
  recovered: 'Recovered',
  improved: 'Improved',
  stable: 'Stable',
  transferred: 'Transferred',
  deceased: 'Deceased',
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

interface ConfirmModalProps {
  patientName: string
  patientNumber: string
  diagnosis: string
  condition: DischargeCondition
  bed: string
  ward: string
  onClose: () => void
  onConfirm: () => void
}

function ConfirmDischargeModal({
  patientName,
  patientNumber,
  diagnosis,
  condition,
  bed,
  ward,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[480px] bg-surface-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-lg border-b border-border-subtle">
          <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Confirm Final Discharge</h2>
          <p className="font-body-sm text-body-sm text-outline mt-xs m-0">
            Please review the summary before finalizing the patient&apos;s departure.
          </p>
        </div>

        <div className="p-lg space-y-md">
          <div className="bg-surface-container-low rounded-lg p-md space-y-sm">
            <div className="flex justify-between gap-md">
              <span className="font-label-md text-label-md text-outline font-bold">Patient</span>
              <span className="font-body-sm text-body-sm font-semibold text-right">{patientName} ({patientNumber})</span>
            </div>
            <div className="flex justify-between gap-md">
              <span className="font-label-md text-label-md text-outline font-bold">Final Diagnosis</span>
              <span className="font-body-sm text-body-sm text-right">{diagnosis}</span>
            </div>
            <div className="flex justify-between gap-md items-center">
              <span className="font-label-md text-label-md text-outline font-bold">Discharge Condition</span>
              <span className="font-body-sm text-body-sm px-sm py-0.5 bg-success/10 text-success rounded font-semibold">
                {CONDITION_LABELS[condition]}
              </span>
            </div>
          </div>

          <div className="space-y-md">
            <div className="flex items-start gap-sm">
              <div className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-outline shrink-0">
                <span className="material-symbols-outlined text-[20px] leading-none">meeting_room</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant m-0 pt-1">
                <strong>{ward} — {bed}</strong> will be vacated and marked for cleaning immediately.
              </p>
            </div>
            <div className="flex items-start gap-sm">
              <div className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-outline shrink-0">
                <span className="material-symbols-outlined text-[20px] leading-none">payments</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant m-0 pt-1">
                A billing notification will be sent to the <strong>Finance Department</strong>.
              </p>
            </div>
          </div>

          <div className="bg-error/5 border border-error/20 p-sm rounded-lg flex gap-sm items-center">
            <span className="material-symbols-outlined text-error text-[18px] leading-none shrink-0">warning</span>
            <p className="font-label-sm text-label-sm text-error font-medium m-0">This action cannot be undone once confirmed.</p>
          </div>
        </div>

        <div className="p-lg bg-surface-container-low flex gap-md justify-end">
          <button type="button" onClick={onClose} className="px-lg py-2 font-label-md text-label-md font-bold text-outline hover:text-on-surface transition-colors bg-transparent border-0 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-xl py-2 rounded-lg bg-success text-white font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-sm border-0 cursor-pointer font-label-md text-label-md"
          >
            Confirm &amp; Complete
            <span className="material-symbols-outlined text-[18px] leading-none">check_circle</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function InpatientDischargePage() {
  const { admissionId } = useParams<{ admissionId: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<AdmittedPatient | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('')
  const [condition, setCondition] = useState<DischargeCondition>('improved')
  const [careSummary, setCareSummary] = useState('')
  const [instructions, setInstructions] = useState('')
  const [medications, setMedications] = useState<DischargeMedication[]>([])
  const [followUpDate, setFollowUpDate] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [newDrug, setNewDrug] = useState('')
  const [newDose, setNewDose] = useState('')

  const loadData = async () => {
    if (!admissionId) return
    try {
      const res = await wardService.getAdmissionDetails(admissionId)
      setPatient(res.data.patient)
      setSummary(res.data.summary)
      
      // Populate defaults from admission info if available
      setDischargeDiagnosis(res.data.patient.primaryDiagnosis || '')
    } catch (err) {
      console.error('Failed to load discharge details:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [admissionId])

  const isFormValid =
    dischargeDiagnosis.trim().length > 0 &&
    careSummary.trim().length > 0 &&
    condition.length > 0

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center justify-center min-h-[400px] text-center bg-surface-white">
        <span className="material-symbols-outlined text-primary text-[42px] animate-spin">sync</span>
        <p className="font-body-md text-body-md text-outline mt-md">Loading discharge records...</p>
      </div>
    )
  }

  if (!patient || !summary) {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center justify-center min-h-[400px] text-center gap-md bg-surface-white">
        <span className="material-symbols-outlined text-[64px] text-outline/40 leading-none select-none" style={{ fontVariationSettings: "'wght' 200" }}>bed</span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Admission not found</h3>
        <p className="font-body-md text-body-md text-outline max-w-sm m-0">No admission record found for ID &quot;{admissionId ?? ''}&quot;.</p>
        <button type="button" onClick={() => navigate('/consultation/inpatient')} className="mt-sm bg-primary text-white px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity border-0 cursor-pointer flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px] leading-none">arrow_back</span>
          Back to Admitted Patients
        </button>
      </div>
    )
  }

  if (patient.status === 'critical') {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center justify-center min-h-[400px] text-center gap-md bg-surface-white">
        <span className="material-symbols-outlined text-[64px] text-error/40 leading-none">block</span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Discharge not available</h3>
        <p className="font-body-md text-body-md text-outline max-w-sm m-0">
          Critical patients cannot be discharged until their condition is stabilised.
        </p>
        <button type="button" onClick={() => navigate('/consultation/inpatient')} className="mt-sm bg-primary text-white px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity border-0 cursor-pointer">
          Back to Admitted Patients
        </button>
      </div>
    )
  }

  const handleSaveDraft = () => {
    setLastSaved(new Date())
    toast.success('Discharge draft saved.')
  }

  const handleConfirmDischarge = async () => {
    if (!admissionId) return
    try {
      await wardService.dischargePatient(admissionId, {
        discharge_diagnosis: dischargeDiagnosis,
        condition: condition,
        care_summary: careSummary,
        instructions: instructions,
        follow_up_date: followUpDate || null,
        medications: medications.map(m => ({ drug_name: m.drugName, dose_freq: m.doseFreq })),
      })
      toast.success(`${patient.name} has been discharged successfully.`)
      navigate('/consultation/inpatient')
    } catch (err) {
      console.error('Failed to discharge patient:', err)
      toast.error('Failed to complete discharge. Please try again.')
    }
  }

  const addMedication = () => {
    if (!newDrug.trim()) return
    setMedications((prev) => [
      ...prev,
      { id: uid(), drugName: newDrug.trim(), doseFreq: newDose.trim() || 'As directed' },
    ])
    setNewDrug('')
    setNewDose('')
  }

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="max-w-container-max mx-auto w-full pb-28">

      {/* Breadcrumb + title */}
      <nav className="flex items-center gap-xs mb-md font-label-md text-label-md text-outline" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate('/consultation/inpatient')} className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-outline font-label-md">
          Admitted Patients
        </button>
        <span className="material-symbols-outlined text-[14px] leading-none">chevron_right</span>
        <span className="text-on-surface-variant font-semibold">Discharge Orders — {patient.name}, {patient.bed}</span>
      </nav>
      <h1 className="font-headline-sm text-headline-sm text-on-surface mb-lg m-0">Discharge Patient</h1>

      <div className="grid grid-cols-12 gap-lg items-start">
        {/* Patient header — full width */}
        <div className="col-span-12">
          <InpatientPatientHeader patient={patient} variant="discharge" />
        </div>

        {/* Left column */}
        <div className="col-span-12 lg:col-span-4 space-y-lg">
          <div className="bg-neutral-bg border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-md py-sm border-b border-border-subtle bg-surface-container-low flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px] text-outline leading-none">history_edu</span>
              <h3 className="font-label-md text-label-md text-on-surface m-0">Admission Summary</h3>
            </div>
            <div className="p-md space-y-md bg-surface-white">
              <div>
                <label className="block font-label-sm text-[10px] text-outline uppercase tracking-tight font-bold mb-xs">Admitting Diagnosis</label>
                <p className="font-body-sm text-body-sm font-medium m-0">{summary.admittingDiagnosis}</p>
              </div>
              <div>
                <label className="block font-label-sm text-[10px] text-outline uppercase tracking-tight font-bold mb-xs">Admitting Doctor</label>
                <p className="font-body-sm text-body-sm m-0">{summary.admittingDoctor}</p>
              </div>
              <div>
                <label className="block font-label-sm text-[10px] text-outline uppercase tracking-tight font-bold mb-xs">Ward / Service</label>
                <p className="font-body-sm text-body-sm m-0">{summary.wardService}</p>
              </div>
              <div className="pt-sm border-t border-outline-variant">
                <label className="block font-label-sm text-[10px] text-outline uppercase tracking-tight font-bold mb-sm">Key Clinical Events</label>
                <ul className="space-y-sm m-0 p-0 list-none">
                  {summary.keyEvents.map((ev, i) => (
                    <li key={i} className="flex gap-sm">
                      <div className="mt-1.5 w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                      <p className="font-body-sm text-[12px] leading-tight m-0">
                        <span className="font-semibold">{ev.date}:</span> {ev.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary-fixed-dim rounded-xl p-md flex gap-md">
            <span className="material-symbols-outlined text-primary leading-none shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <div>
              <h4 className="font-label-md text-label-md text-primary m-0">Bed Management</h4>
              <p className="font-body-sm text-body-sm text-on-secondary-container mt-xs m-0">
                Upon confirmation, <strong>{patient.bed}</strong> in {patient.ward} will be automatically marked as <strong>Available</strong> for new admissions.
              </p>
            </div>
          </div>
        </div>

        {/* Right column — form */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-white border border-border-subtle rounded-xl shadow-sm">
            <div className="px-md py-sm border-b border-border-subtle bg-surface-container-low">
              <h3 className="font-label-md text-label-md text-on-surface m-0">Discharge Summary &amp; Orders</h3>
            </div>

            <form className="p-lg space-y-xl" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">Discharge Diagnosis (ICD-10)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] leading-none pointer-events-none">search</span>
                    <input
                      type="text"
                      required
                      value={dischargeDiagnosis}
                      onChange={(e) => setDischargeDiagnosis(e.target.value)}
                      placeholder="Search ICD-10 or Enter Text…"
                      className="w-full pl-10 pr-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-2 focus:ring-primary font-body-sm text-body-sm outline-none"
                    />
                  </div>
                  <p className="font-label-sm text-[11px] text-outline italic mt-xs m-0">Primary diagnosis required for clinical coding.</p>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">Condition at Discharge</label>
                  <select
                    required
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as DischargeCondition)}
                    className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-2 focus:ring-primary font-body-sm text-body-sm outline-none cursor-pointer"
                  >
                    <option value="recovered">Recovered</option>
                    <option value="improved">Improved</option>
                    <option value="stable">Stable</option>
                    <option value="transferred">Transferred</option>
                    <option value="deceased">Deceased</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">Overall Summary of Care &amp; Outcome</label>
                <textarea
                  required
                  rows={6}
                  value={careSummary}
                  onChange={(e) => setCareSummary(e.target.value)}
                  placeholder="Document the clinical course, diagnostic results, and patient outcome…"
                  className="w-full px-md py-md border border-border-subtle rounded-lg focus:border-primary focus:ring-2 focus:ring-primary font-body-sm text-body-sm outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs">Discharge Instructions for Patient</label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Plain language instructions for the patient…"
                  className="w-full px-md py-md border border-border-subtle rounded-lg focus:border-primary focus:ring-2 focus:ring-primary font-body-sm text-body-sm outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div>
                  <div className="flex justify-between items-center mb-xs">
                    <label className="font-label-md text-label-md text-on-surface">Medications on Discharge</label>
                  </div>
                  <div className="flex gap-xs mb-sm">
                    <input
                      type="text"
                      value={newDrug}
                      onChange={(e) => setNewDrug(e.target.value)}
                      placeholder="Drug name"
                      className="flex-1 px-sm py-1.5 border border-border-subtle rounded-lg font-body-sm text-body-sm outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={newDose}
                      onChange={(e) => setNewDose(e.target.value)}
                      placeholder="Dose/Freq"
                      className="flex-1 px-sm py-1.5 border border-border-subtle rounded-lg font-body-sm text-body-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={addMedication}
                      className="text-primary font-label-md text-label-md font-bold hover:underline bg-transparent border-0 cursor-pointer flex items-center gap-xs shrink-0"
                    >
                      <span className="material-symbols-outlined text-[16px] leading-none">add_circle</span>
                      Add
                    </button>
                  </div>
                  <div className="border border-border-subtle rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container-low text-[10px] font-bold uppercase text-outline border-b border-border-subtle">
                        <tr>
                          <th className="px-sm py-2">Drug Name</th>
                          <th className="px-sm py-2">Dose/Freq</th>
                          <th className="px-sm py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {medications.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-sm py-md text-center font-body-sm text-body-sm text-outline italic">
                              No discharge medications added.
                            </td>
                          </tr>
                        ) : (
                          medications.map((m) => (
                            <tr key={m.id} className="hover:bg-primary/5 transition-colors">
                              <td className="px-sm py-2 font-body-sm text-body-sm font-medium">{m.drugName}</td>
                              <td className="px-sm py-2 font-body-sm text-body-sm">{m.doseFreq}</td>
                              <td className="px-sm py-2 text-right">
                                <button type="button" onClick={() => removeMedication(m.id)} className="text-error bg-transparent border-0 cursor-pointer p-0">
                                  <span className="material-symbols-outlined text-[18px] leading-none">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-xs">Follow-up Appointment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] leading-none pointer-events-none">calendar_today</span>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full pl-10 pr-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-2 focus:ring-primary font-body-sm text-body-sm outline-none cursor-pointer"
                    />
                  </div>
                  <p className="font-label-sm text-[11px] text-outline mt-xs m-0">Recommended: 1 week post-discharge.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-240px)] bg-surface-white border-t border-border-subtle p-md flex justify-between items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40">
        <div className="flex items-center gap-md">
          {lastSaved && (
            <span className="flex items-center gap-xs font-label-sm text-[12px] text-outline">
              <span className="material-symbols-outlined text-[16px] leading-none">save</span>
              Last saved: just now
            </span>
          )}
        </div>
        <div className="flex gap-md">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-xl py-2 rounded-lg border border-border-subtle text-outline font-semibold hover:bg-neutral-bg transition-colors bg-transparent cursor-pointer font-label-md text-label-md"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={!isFormValid}
            onClick={() => setShowConfirm(true)}
            className="px-xl py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 active:scale-95 transition-all shadow-md border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-label-md text-label-md"
          >
            Confirm Discharge
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDischargeModal
          patientName={patient.name}
          patientNumber={patient.patientNumber}
          diagnosis={dischargeDiagnosis}
          condition={condition}
          bed={patient.bed}
          ward={patient.ward}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmDischarge}
        />
      )}
    </div>
  )
}
