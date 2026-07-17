import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PatientHistoryData } from '@/api/services/ward'

const PAGE_SIZE = 5

// ── Outcome helpers ───────────────────────────────────────────────────────────

type VisitOutcome = 'Recovered' | 'Stable' | 'Admitted' | 'Referred' | 'Pending'

function deriveOutcome(visit: PatientHistoryData['previous_visits'][0]): VisitOutcome {
  const status    = visit.status?.toLowerCase() ?? ''
  const disp      = visit.consultation?.disposition?.toLowerCase() ?? ''
  if (status === 'admitted' || disp === 'admit')          return 'Admitted'
  if (disp === 'referral' || disp === 'refer')            return 'Referred'
  if (status === 'completed' && disp === 'outpatient')    return 'Recovered'
  if (status === 'completed')                             return 'Stable'
  return 'Pending'
}

function outcomeBadge(o: VisitOutcome) {
  switch (o) {
    case 'Recovered': return 'bg-success/10 text-success'
    case 'Stable':    return 'bg-primary/10 text-primary'
    case 'Admitted':  return 'bg-[#5243AA]/10 text-[#5243AA]'
    case 'Referred':  return 'bg-[#00B8D9]/10 text-[#00B8D9]'
    case 'Pending':   return 'bg-warning/10 text-warning'
  }
}

function outcomeIcon(o: VisitOutcome) {
  switch (o) {
    case 'Recovered': return 'check_circle'
    case 'Stable':    return 'favorite'
    case 'Admitted':  return 'local_hospital'
    case 'Referred':  return 'swap_horiz'
    case 'Pending':   return 'schedule'
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtDate(raw?: string | null) {
  if (!raw) return '—'
  try { return new Date(raw).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return raw }
}

function calcAge(dob: string) {
  try {
    const b = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - b.getFullYear()
    if (today < new Date(today.getFullYear(), b.getMonth(), b.getDate())) age--
    return age
  } catch { return 0 }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'PT'
}

function buildDispositionText(c: NonNullable<PatientHistoryData['previous_visits'][0]['consultation']>) {
  const parts: string[] = []
  if (c.disposition)             parts.push(`Disposition: ${c.disposition}`)
  if (c.referral_type)           parts.push(`Referral type: ${c.referral_type}`)
  if (c.referral_notes)          parts.push(`Referral notes: ${c.referral_notes}`)
  if (c.admission_reason)        parts.push(`Admission reason: ${c.admission_reason}`)
  if (c.discharge_instructions)  parts.push(`Discharge instructions: ${c.discharge_instructions}`)
  if (c.follow_up_date)          parts.push(`Follow-up date: ${fmtDate(c.follow_up_date)}`)
  if (c.return_date)             parts.push(`Return date: ${fmtDate(c.return_date)}`)
  if (c.return_reason)           parts.push(`Return reason: ${c.return_reason}`)
  return parts.join('\n') || 'No disposition information recorded.'
}

// ── Read-only field ───────────────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-xs">
      <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
        {label}
      </label>
      <div className="bg-surface-container-low p-md rounded-lg font-body-md text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">
        {value || <span className="italic text-outline">Not recorded</span>}
      </div>
    </div>
  )
}

// ── Visit detail modal ────────────────────────────────────────────────────────

type ModalTab = 'notes' | 'diagnosis' | 'investigations' | 'prescriptions' | 'disposition'

const TABS: { id: ModalTab; label: string }[] = [
  { id: 'notes',          label: 'Clinical Notes'  },
  { id: 'diagnosis',      label: 'Diagnosis'       },
  { id: 'investigations', label: 'Investigations'  },
  { id: 'prescriptions',  label: 'Prescriptions'   },
  { id: 'disposition',    label: 'Disposition'     },
]

interface ModalProps {
  visit: PatientHistoryData['previous_visits'][0]
  patientName: string
  onClose: () => void
}

function VisitDetailModal({ visit, patientName, onClose }: ModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('notes')
  const c = visit.consultation

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const primaryDiag = c?.diagnoses?.find(d => d.diagnosis_type === 'primary')?.diagnosis_name
    ?? c?.diagnoses?.[0]?.diagnosis_name
    ?? c?.clinical_impression
    ?? '—'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Visit record — ${visit.visit_id}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[720px] bg-surface-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-lg py-md border-b border-border-subtle flex items-start justify-between">
          <div>
            <h5 className="font-headline-sm text-headline-sm text-on-surface m-0">
              Visit Record: {visit.visit_id}
            </h5>
            <p className="font-body-sm text-body-sm text-outline mt-xs m-0">
              Patient: {patientName} · {fmtDate(visit.visit_date)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-xs rounded-full hover:bg-surface-container transition-colors bg-transparent border-0 cursor-pointer text-outline hover:text-on-surface -mt-1 -mr-1"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-lg border-b border-border-subtle flex gap-lg overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-md font-label-md text-label-md whitespace-nowrap border-b-2 transition-colors bg-transparent border-x-0 border-t-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-outline hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-lg space-y-md">

          {activeTab === 'notes' && (
            <>
              <div className="grid grid-cols-2 gap-md">
                <ReadOnlyField label="Visit Type"  value={visit.visit_type ?? '—'} />
                <ReadOnlyField label="Attending"   value={c?.created_by ?? '—'} />
              </div>
              <ReadOnlyField
                label="Chief Complaint"
                value={visit.triage_summary?.chief_complaint ?? '—'}
              />
              <ReadOnlyField
                label="History of Presenting Illness"
                value={c?.history_of_presenting_illness ?? '—'}
              />
              <ReadOnlyField
                label="Objective Examination"
                value={c?.examination_findings ?? '—'}
              />
              <ReadOnlyField
                label="Clinical Assessment / Impression"
                value={c?.clinical_impression ?? '—'}
              />
            </>
          )}

          {activeTab === 'diagnosis' && (
            <>
              <ReadOnlyField label="Primary Diagnosis" value={primaryDiag} />
              {c?.diagnoses && c.diagnoses.length > 1 && (
                <div className="space-y-xs">
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">All Diagnoses</p>
                  {c.diagnoses.map((d, i) => (
                    <div key={i} className="bg-surface-container-low p-sm rounded-lg flex items-center justify-between">
                      <span className="font-body-sm text-body-sm text-on-surface">{d.diagnosis_name}</span>
                      <span className="font-label-sm text-label-sm text-outline capitalize">{d.diagnosis_type}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-md mt-sm">
                <span className={`inline-flex items-center gap-xs px-sm py-xs rounded font-label-sm text-label-sm font-bold uppercase ${outcomeBadge(deriveOutcome(visit))}`}>
                  <span className="material-symbols-outlined text-[14px] leading-none">{outcomeIcon(deriveOutcome(visit))}</span>
                  {deriveOutcome(visit)}
                </span>
              </div>
            </>
          )}

          {activeTab === 'investigations' && (
            !c?.investigation_requests?.length ? (
              <p className="font-body-sm text-body-sm text-outline italic text-center py-xl">
                No investigations ordered for this visit.
              </p>
            ) : (
              <div className="space-y-sm">
                {c.investigation_requests.map((inv, i) => (
                  <div key={i} className="bg-surface-container-low p-md rounded-lg">
                    <div className="flex items-center justify-between mb-xs">
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface">{inv.test_name}</span>
                      <span className={`font-label-sm text-label-sm px-xs py-0.5 rounded capitalize ${
                        inv.status === 'completed' ? 'bg-success/10 text-success'
                        : inv.status === 'pending' ? 'bg-warning/10 text-warning'
                        : 'bg-surface-container text-outline'
                      }`}>{inv.status}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
                      {inv.request_type} {inv.created_at ? `· ${fmtDate(inv.created_at)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'prescriptions' && (
            !c?.prescriptions?.length ? (
              <p className="font-body-sm text-body-sm text-outline italic text-center py-xl">
                No prescriptions for this visit.
              </p>
            ) : (
              <div className="space-y-sm">
                {c.prescriptions.map((rx, i) => (
                  <div key={i} className="bg-surface-container-low p-md rounded-lg flex items-center justify-between gap-md">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary leading-none">medication</span>
                      <div>
                        <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{rx.drug_name}</p>
                        {rx.frequency && <p className="font-label-sm text-label-sm text-outline m-0">{rx.frequency}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {rx.dose     && <p className="font-body-sm text-body-sm text-on-surface-variant m-0">{rx.dose}</p>}
                      {rx.duration && <p className="font-label-sm text-label-sm text-outline m-0">{rx.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'disposition' && (
            <ReadOnlyField
              label="Disposition / Plan"
              value={c ? buildDispositionText(c) : 'No disposition information recorded.'}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-lowest flex justify-end gap-sm">
          <button
            type="button"
            onClick={onClose}
            className="px-lg h-10 border border-border-subtle rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-white transition-colors bg-transparent cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  data: PatientHistoryData
}

export function ConsultationHistoryPatientContent({ data }: Props) {
  const navigate = useNavigate()
  const { patient, previous_visits } = data

  const [page, setPage]               = useState(1)
  const [selectedVisit, setSelected]  = useState<PatientHistoryData['previous_visits'][0] | null>(null)

  const totalPages  = Math.max(1, Math.ceil(previous_visits.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const visible     = previous_visits.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const showingFrom = previous_visits.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo   = Math.min(safePage * PAGE_SIZE, previous_visits.length)

  const age          = calcAge(patient.date_of_birth)
  const avatarInit   = initials(patient.full_name)

  // Allergy parsing — backend stores as a plain string or comma-separated
  const allergyList  = patient.allergies
    ? patient.allergies.split(/[,;]/).map(a => a.trim()).filter(Boolean)
    : []

  // Count active (non-completed, non-admitted) diagnoses across visits
  const activeConditions = previous_visits.filter(v =>
    v.status !== 'completed' && v.status !== 'discharged'
  ).length

  // Last visit date
  const lastVisitRaw = previous_visits[0]?.visit_date
  const lastVisitDate = fmtDate(lastVisitRaw)

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg">

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 font-body-sm text-body-sm" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={() => navigate('/consultation/history')}
          className="text-primary hover:underline font-label-md bg-transparent border-0 cursor-pointer p-0"
        >
          Patient History
        </button>
        <span className="material-symbols-outlined text-outline text-[18px] leading-none">chevron_right</span>
        <span className="text-outline">{patient.full_name}</span>
      </nav>

      {/* Patient header card */}
      <section className="bg-surface-white border border-border-subtle rounded-2xl p-lg flex flex-col md:flex-row items-start md:items-center gap-xl shadow-sm">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-secondary-container flex items-center justify-center font-bold text-2xl text-on-secondary-container border-2 border-primary/10">
            {avatarInit}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-2 border-surface-white rounded-full" />
        </div>

        {/* Details grid */}
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-md mb-md">
            <div>
              <h4 className="font-headline-md text-headline-md text-on-surface m-0">{patient.full_name}</h4>
              <div className="flex items-center gap-sm mt-xs">
                <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-label-md text-label-md">
                  {patient.patient_number}
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  {fmtDate(patient.date_of_birth)} ({age} yrs) · {patient.gender}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
            <div>
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Phone Number</p>
              <p className="font-body-md text-body-md text-on-surface m-0">{patient.phone_primary || '—'}</p>
            </div>
            {patient.blood_group && (
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Blood Group</p>
                <p className="font-body-md text-body-md text-on-surface m-0">{patient.blood_group}</p>
              </div>
            )}
            {patient.next_of_kin_name && (
              <div>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Next of Kin</p>
                <p className="font-body-md text-body-md text-on-surface m-0">
                  {patient.next_of_kin_name}
                  {patient.next_of_kin_relationship ? ` (${patient.next_of_kin_relationship})` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md shadow-sm">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0">Total Visits</p>
          <p className="font-headline-md text-headline-md text-on-surface m-0">{previous_visits.length}</p>
        </div>
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md shadow-sm">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0">Last Visit</p>
          <p className="font-headline-md text-headline-md text-on-surface m-0">{lastVisitDate}</p>
        </div>
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md shadow-sm">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0">Active Encounters</p>
          <p className="font-headline-md text-headline-md text-primary m-0">{activeConditions}</p>
        </div>
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md shadow-sm border-l-4 border-l-error">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0">Known Allergies</p>
          <p className="font-headline-md text-headline-md text-error m-0">{allergyList.length}</p>
        </div>
      </div>

      {/* Allergy alert banner */}
      {allergyList.length > 0 && (
        <div className="bg-error-container border border-error rounded-xl p-md flex flex-col gap-sm">
          {allergyList.map((allergy, i) => (
            <div key={i} className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined leading-none">warning</span>
              </div>
              <div>
                <p className="font-headline-sm text-headline-sm text-on-error-container m-0">
                  Known allergy: {allergy}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visit history table */}
      <section className="bg-surface-white border border-border-subtle rounded-2xl overflow-visible shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Visit History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low">
              <tr>
                {['Visit Date', 'Visit #', 'Visit Type', 'Chief Complaint', 'Primary Diagnosis', 'Outcome', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-lg py-sm font-label-md text-label-md text-secondary uppercase tracking-widest ${i === 6 ? 'text-right' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-lg py-xl text-center font-body-sm text-body-sm text-outline italic">
                    No visit records found for this patient.
                  </td>
                </tr>
              ) : (
                visible.map((visit) => {
                  const outcome     = deriveOutcome(visit)
                  const chiefComp   = visit.triage_summary?.chief_complaint ?? '—'
                  const primDiag    = visit.consultation?.diagnoses?.find(d => d.diagnosis_type === 'primary')?.diagnosis_name
                    ?? visit.consultation?.diagnoses?.[0]?.diagnosis_name
                    ?? visit.consultation?.clinical_impression
                    ?? '—'
                  return (
                    <tr
                      key={visit.visit_id}
                      className="hover:bg-hover-tint transition-colors cursor-pointer group"
                      onClick={() => setSelected(visit)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(visit) }}
                      role="button"
                      aria-label={`View visit ${visit.visit_id}`}
                    >
                      <td className="px-lg py-md font-body-sm text-body-sm font-semibold text-on-surface whitespace-nowrap">
                        {fmtDate(visit.visit_date)}
                      </td>
                      <td className="px-lg py-md font-body-sm text-body-sm text-outline whitespace-nowrap">
                        {String(visit.visit_id).slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface capitalize">
                        {visit.visit_type}
                      </td>
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface max-w-[180px] truncate" title={chiefComp}>
                        {chiefComp}
                      </td>
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant max-w-[160px] truncate" title={primDiag}>
                        {primDiag}
                      </td>
                      <td className="px-lg py-md">
                        <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full font-label-sm text-label-sm font-semibold ${outcomeBadge(outcome)}`}>
                          <span className="material-symbols-outlined text-[13px] leading-none">{outcomeIcon(outcome)}</span>
                          {outcome}
                        </span>
                      </td>
                      <td className="px-lg py-md text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelected(visit) }}
                          className="text-primary hover:underline font-label-md text-label-md bg-transparent border-0 cursor-pointer"
                        >
                          View Full Record
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-lg py-sm bg-surface-container-lowest border-t border-border-subtle flex items-center justify-between gap-md">
          <p className="font-label-sm text-label-sm text-outline m-0">
            {previous_visits.length === 0
              ? 'No visits on record'
              : `Showing ${showingFrom}–${showingTo} of ${previous_visits.length} visit${previous_visits.length === 1 ? '' : 's'}`}
          </p>
          <div className="flex gap-xs">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-xs rounded hover:bg-surface-container transition-colors disabled:opacity-30 bg-transparent border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-xs rounded hover:bg-surface-container transition-colors disabled:opacity-30 bg-transparent border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Visit detail modal */}
      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          patientName={patient.full_name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
