import { useState, useEffect } from 'react'
import { REFERRAL_DEPARTMENTS } from '@/features/consultation/data/mockReferrals'
import { wardService } from '@/api/services/ward'
import type { NewReferralInput, ReferralCategory, ReferralType, ReferralUrgency } from '@/features/consultation/types/referrals'

const CATEGORY_OPTIONS: { value: ReferralCategory; label: string }[] = [
  { value: 'general', label: 'General Referral' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'second-opinion', label: 'Second Opinion' },
  { value: 'lab-imaging', label: 'Lab/Imaging' },
]

interface Props {
  onClose: () => void
  onSubmit: (input: NewReferralInput) => void
}

export function NewReferralModal({ onClose, onSubmit }: Props) {
  const [type, setType] = useState<ReferralType>('internal')
  const [patientQuery, setPatientQuery] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientMatches, setPatientMatches] = useState<{ id: string; name: string; patientNumber: string }[]>([])
  const [searchingPatients, setSearchingPatients] = useState(false)
  const [showPatientList, setShowPatientList] = useState(false)
  const [department, setDepartment] = useState('')
  const [preferredDoctor, setPreferredDoctor] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [externalDoctor, setExternalDoctor] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [urgency, setUrgency] = useState<ReferralUrgency>('routine')
  const [category, setCategory] = useState<ReferralCategory>('general')
  const [reason, setReason] = useState('')

  // Debounced search on patients
  useEffect(() => {
    setSearchingPatients(true)
    const delayDebounce = setTimeout(() => {
      wardService.searchPatients(patientQuery, 1, 30)
        .then((res) => {
          setPatientMatches((res.patients || []).map((p) => ({
            id: p.id,
            name: p.full_name,
            patientNumber: p.patient_number,
          })))
          setSearchingPatients(false)
        })
        .catch(() => setSearchingPatients(false))
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [patientQuery])

  const selectedPatient = patientMatches.find((p) => p.id === selectedPatientId)


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = () => {
    if (!selectedPatient) return

    if (type === 'internal') {
      if (!department.trim() || !reason.trim()) return
      onSubmit({
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientNumber: selectedPatient.patientNumber,
        type: 'internal',
        referredTo: `${department} Dept.`,
        reason: reason.trim(),
        urgency,
        category,
        department,
        preferredDoctor: preferredDoctor.trim() || undefined,
      })
    } else {
      if (!hospitalName.trim() || !reason.trim()) return
      onSubmit({
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientNumber: selectedPatient.patientNumber,
        type: 'external',
        referredTo: hospitalName.trim(),
        reason: reason.trim(),
        urgency,
        category,
        hospitalName: hospitalName.trim(),
        externalDoctor: externalDoctor.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
      })
    }
  }

  const canSubmit =
    !!selectedPatient &&
    reason.trim().length > 0 &&
    (type === 'internal' ? department.trim().length > 0 : hospitalName.trim().length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md overflow-y-auto" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[520px] bg-surface-white rounded-xl shadow-2xl overflow-hidden my-auto">
        <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">New Referral Request</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface p-1 bg-transparent border-0 cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined leading-none">close</span>
          </button>
        </div>

        <div className="px-lg py-lg space-y-md max-h-[70vh] overflow-y-auto">
          <div className="space-y-sm">
            <span className="font-label-md text-label-md text-outline">Referral Type</span>
            <div className="flex gap-lg">
              {(['internal', 'external'] as const).map((t) => (
                <label key={t} className="flex items-center gap-sm cursor-pointer group">
                  <input
                    type="radio"
                    name="referral-type"
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-body-md text-body-md capitalize group-hover:text-primary">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-xs relative">
            <label className="font-label-md text-label-md text-outline">Patient Search</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm leading-none pointer-events-none">search</span>
              <input
                type="text"
                value={selectedPatient && !showPatientList ? `${selectedPatient.name} (${selectedPatient.patientNumber})` : patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value)
                  setSelectedPatientId('')
                  setShowPatientList(true)
                }}
                onFocus={() => setShowPatientList(true)}
                placeholder="Enter patient name or ID..."
                className="w-full border border-border-subtle rounded-lg py-sm pl-10 pr-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-white"
              />
            </div>
            {showPatientList && (searchingPatients || patientMatches.length > 0 || (patientQuery.trim() && !searchingPatients)) && (
              <ul className="absolute z-20 left-0 right-0 mt-xs bg-surface-white border border-border-subtle rounded-lg shadow-lg max-h-40 overflow-y-auto list-none m-0 p-0 divide-y divide-border-subtle">
                {searchingPatients ? (
                  <li className="px-md py-sm font-body-sm text-body-sm text-outline italic flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    Searching patients...
                  </li>
                ) : patientMatches.length === 0 ? (
                  <li className="px-md py-sm font-body-sm text-body-sm text-outline italic">
                    No patients found
                  </li>
                ) : (
                  patientMatches.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(p.id)
                          setPatientQuery('')
                          setShowPatientList(false)
                        }}
                        className="w-full text-left px-md py-sm font-body-sm text-body-sm hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        {p.name} <span className="text-outline">({p.patientNumber})</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {type === 'internal' ? (
            <div className="space-y-md">
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-outline">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-border-subtle rounded-lg py-sm px-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-white cursor-pointer"
                >
                  <option value="">Select Department...</option>
                  {REFERRAL_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-outline">Preferred Doctor (Optional)</label>
                <input
                  type="text"
                  value={preferredDoctor}
                  onChange={(e) => setPreferredDoctor(e.target.value)}
                  placeholder="Dr. Name..."
                  className="w-full border border-border-subtle rounded-lg py-sm px-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-white"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-md">
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-outline">Hospital Name</label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="Enter facility name..."
                  className="w-full border border-border-subtle rounded-lg py-sm px-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-outline">Doctor Name</label>
                  <input
                    type="text"
                    value={externalDoctor}
                    onChange={(e) => setExternalDoctor(e.target.value)}
                    placeholder="Dr. Name"
                    className="w-full border border-border-subtle rounded-lg py-sm px-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-white"
                  />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-md text-label-md text-outline">Contact #</label>
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+255..."
                    className="w-full border border-border-subtle rounded-lg py-sm px-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-outline">Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as ReferralUrgency)}
                className="w-full border border-border-subtle rounded-lg py-sm px-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-white cursor-pointer"
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-outline">Related To</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReferralCategory)}
                className="w-full border border-border-subtle rounded-lg py-sm px-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface-white cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-outline">Reason for Referral</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide clinical justification and specific concerns..."
              className="w-full border border-border-subtle rounded-lg py-sm px-md font-body-sm text-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none bg-surface-white"
            />
          </div>
        </div>

        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-low flex justify-end items-center gap-md">
          <button
            type="button"
            onClick={onClose}
            className="text-outline hover:text-on-surface px-md py-sm font-label-md text-label-md bg-transparent border-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-primary text-white px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-all shadow-md active:scale-95 border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Referral
          </button>
        </div>
      </div>
    </div>
  )
}
