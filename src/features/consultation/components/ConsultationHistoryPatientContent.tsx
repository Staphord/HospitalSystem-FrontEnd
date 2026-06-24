import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPatientConsultationHistory } from '@/features/consultation/data/mockConsultationHistory'
import type {
  ConsultationHistorySearchResult,
  ConsultationVisitRecord,
  VisitOutcome,
} from '@/features/consultation/types/consultationHistory'

const PAGE_SIZE = 5

// ── Badge helpers ─────────────────────────────────────────────────────────────

function outcomeBadge(outcome: VisitOutcome) {
  switch (outcome) {
    case 'Recovered': return 'bg-success/10 text-success'
    case 'Stable':    return 'bg-primary/10 text-primary'
    case 'Admitted':  return 'bg-[#5243AA]/10 text-[#5243AA]'
    case 'Referred':  return 'bg-[#00B8D9]/10 text-[#00B8D9]'
    case 'Pending':   return 'bg-warning/10 text-warning'
  }
}

function outcomeIcon(outcome: VisitOutcome) {
  switch (outcome) {
    case 'Recovered': return 'check_circle'
    case 'Stable':    return 'favorite'
    case 'Admitted':  return 'local_hospital'
    case 'Referred':  return 'swap_horiz'
    case 'Pending':   return 'schedule'
  }
}

// ── Visit Detail Modal ────────────────────────────────────────────────────────

type ModalTab = 'notes' | 'diagnosis' | 'investigations' | 'prescriptions' | 'disposition'

const TABS: { id: ModalTab; label: string }[] = [
  { id: 'notes',          label: 'Clinical Notes'  },
  { id: 'diagnosis',      label: 'Diagnosis'       },
  { id: 'investigations', label: 'Investigations'  },
  { id: 'prescriptions',  label: 'Prescriptions'   },
  { id: 'disposition',    label: 'Disposition'     },
]

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-xs">
      <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider block">
        {label}
      </label>
      <div className="bg-surface-container-low p-md rounded-lg font-body-md text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">
        {value}
      </div>
    </div>
  )
}

interface VisitDetailModalProps {
  visit: ConsultationVisitRecord
  patientName: string
  onClose: () => void
}

function VisitDetailModal({ visit, patientName, onClose }: VisitDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('notes')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Visit record — ${visit.visitId}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[720px] bg-surface-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-lg py-md border-b border-border-subtle flex items-start justify-between">
          <div>
            <h5 className="font-headline-sm text-headline-sm text-on-surface m-0">
              Visit Record: {visit.visitId}
            </h5>
            <p className="font-body-sm text-body-sm text-outline mt-xs m-0">
              Patient: {patientName} · {visit.date}
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
                <ReadOnlyField label="Visit Type"  value={visit.clinicalNotes.visitType} />
                <ReadOnlyField label="Attending"   value={visit.clinicalNotes.attending} />
              </div>
              <ReadOnlyField label="Chief Complaint"       value={visit.clinicalNotes.chiefComplaint} />
              <ReadOnlyField label="Objective Examination" value={visit.clinicalNotes.objectiveExam} />
              <ReadOnlyField label="Clinical Assessment"   value={visit.clinicalNotes.assessment} />
            </>
          )}

          {activeTab === 'diagnosis' && (
            <>
              <ReadOnlyField label="Primary Diagnosis" value={visit.diagnosis} />
              <ReadOnlyField label="Clinical Assessment" value={visit.clinicalNotes.assessment} />
              <div className="flex items-center gap-md mt-sm">
                <span className={`inline-flex items-center gap-xs px-sm py-xs rounded font-label-sm text-label-sm font-bold uppercase ${outcomeBadge(visit.outcome)}`}>
                  <span className="material-symbols-outlined text-[14px] leading-none">{outcomeIcon(visit.outcome)}</span>
                  {visit.outcome}
                </span>
              </div>
            </>
          )}

          {activeTab === 'investigations' && (
            visit.investigations.length === 0 ? (
              <p className="font-body-sm text-body-sm text-outline italic text-center py-xl">
                No investigations ordered for this visit.
              </p>
            ) : (
              <div className="space-y-sm">
                {visit.investigations.map((inv, i) => (
                  <div key={i} className="bg-surface-container-low p-md rounded-lg">
                    <div className="flex items-center justify-between mb-xs">
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface">{inv.test}</span>
                      <span className="font-label-sm text-label-sm text-outline">{inv.date}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0">{inv.result}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'prescriptions' && (
            visit.prescriptions.length === 0 ? (
              <p className="font-body-sm text-body-sm text-outline italic text-center py-xl">
                No prescriptions for this visit.
              </p>
            ) : (
              <div className="space-y-sm">
                {visit.prescriptions.map((rx, i) => (
                  <div key={i} className="bg-surface-container-low p-md rounded-lg flex items-center justify-between gap-md">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary leading-none">medication</span>
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface">{rx.drug}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-body-sm text-body-sm text-on-surface-variant m-0">{rx.dose}</p>
                      <p className="font-label-sm text-label-sm text-outline m-0">{rx.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'disposition' && (
            <ReadOnlyField label="Disposition / Plan" value={visit.disposition} />
          )}
        </div>

        {/* Footer */}
        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-lowest flex justify-end gap-sm">
          <button
            type="button"
            className="px-lg h-10 border border-border-subtle rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-white transition-colors bg-transparent cursor-pointer flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">print</span>
            Print Summary
          </button>
          <button
            type="button"
            className="px-lg h-10 bg-primary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity border-0 cursor-pointer flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  patient: ConsultationHistorySearchResult
}

export function ConsultationHistoryPatientContent({ patient }: Props) {
  const navigate = useNavigate()
  const visits = getPatientConsultationHistory(patient.id)

  const [page, setPage]                           = useState(1)
  const [selectedVisit, setSelectedVisit]         = useState<ConsultationVisitRecord | null>(null)

  const totalPages  = Math.max(1, Math.ceil(visits.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const visible     = visits.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const showingFrom = visits.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo   = Math.min(safePage * PAGE_SIZE, visits.length)

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
        <span className="text-outline">{patient.name}</span>
      </nav>

      {/* Patient header card */}
      <section className="bg-surface-white border border-border-subtle rounded-2xl p-lg flex flex-col md:flex-row items-start md:items-center gap-xl shadow-sm">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-secondary-container flex items-center justify-center font-bold text-2xl text-on-secondary-container border-2 border-primary/10">
            {patient.avatarInitials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-2 border-surface-white rounded-full" />
        </div>

        {/* Details grid */}
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-md mb-md">
            <div>
              <h4 className="font-headline-md text-headline-md text-on-surface m-0">{patient.name}</h4>
              <div className="flex items-center gap-sm mt-xs">
                <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-label-md text-label-md">
                  {patient.patientNumber}
                </span>
                <span className="font-body-sm text-body-sm text-outline">
                  {patient.dob} ({patient.age} yrs) · {patient.gender}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center gap-xs text-primary font-label-md text-label-md hover:underline bg-transparent border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">edit</span>
              Edit Profile
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
            <div>
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Phone Number</p>
              <p className="font-body-md text-body-md text-on-surface m-0">{patient.phone}</p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Payment Method</p>
              <p className="font-body-md text-body-md text-on-surface flex items-center gap-xs m-0">
                <span className="material-symbols-outlined text-primary text-[18px] leading-none">shield</span>
                {patient.paymentMethod}
              </p>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Registered On</p>
              <p className="font-body-md text-body-md text-on-surface m-0">{patient.registeredOn}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md shadow-sm">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0">Total Visits</p>
          <p className="font-headline-md text-headline-md text-on-surface m-0">{patient.totalVisits}</p>
        </div>
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md shadow-sm">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0">Last Visit</p>
          <p className="font-headline-md text-headline-md text-on-surface m-0">{patient.lastVisitDate}</p>
        </div>
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md shadow-sm">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0">Active Conditions</p>
          <p className="font-headline-md text-headline-md text-primary m-0">{patient.activeConditions}</p>
        </div>
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md shadow-sm border-l-4 border-l-error">
          <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0">Known Allergies</p>
          <p className="font-headline-md text-headline-md text-error m-0">{patient.allergies.length}</p>
        </div>
      </div>

      {/* Allergy alert banner */}
      {patient.allergies.length > 0 && (
        <div className="bg-error-container border border-error rounded-xl p-md flex flex-col gap-sm">
          {patient.allergies.map((allergy, i) => (
            <div key={i} className="flex items-center gap-md">
              <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined leading-none">warning</span>
              </div>
              <div>
                <p className="font-headline-sm text-headline-sm text-on-error-container m-0">
                  Known allergy: {allergy.substance} — {allergy.severity}
                </p>
                <p className="font-body-sm text-body-sm text-on-error-container/80 m-0">
                  Last documented: {allergy.documentedOn} by {allergy.documentedBy}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visit history table */}
      <section className="bg-surface-white border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle bg-surface-container-lowest flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Visit History</h3>
          <div className="flex gap-sm">
            <button type="button" className="p-xs text-outline hover:text-primary transition-colors bg-transparent border-0 cursor-pointer" title="Filter visits">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button type="button" className="p-xs text-outline hover:text-primary transition-colors bg-transparent border-0 cursor-pointer" title="Download history">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead className="bg-surface-container-low">
              <tr>
                {['Visit Date', 'Visit #', 'Attending Doctor', 'Chief Complaint', 'Diagnosis', 'Outcome', 'Actions'].map((h, i) => (
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
                visible.map((visit) => (
                  <tr
                    key={visit.visitId}
                    className="hover:bg-hover-tint transition-colors cursor-pointer group"
                    onClick={() => setSelectedVisit(visit)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedVisit(visit) }}
                    role="button"
                    aria-label={`View visit ${visit.visitId}`}
                  >
                    <td className="px-lg py-md font-body-sm text-body-sm font-semibold text-on-surface whitespace-nowrap">
                      {visit.date}
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-outline whitespace-nowrap">
                      {visit.visitId}
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface">
                      {visit.attendingDoctor}
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface max-w-[180px] truncate" title={visit.chiefComplaint}>
                      {visit.chiefComplaint}
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant max-w-[160px] truncate" title={visit.diagnosis}>
                      {visit.diagnosis}
                    </td>
                    <td className="px-lg py-md">
                      <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full font-label-sm text-label-sm font-semibold ${outcomeBadge(visit.outcome)}`}>
                        <span className="material-symbols-outlined text-[13px] leading-none">{outcomeIcon(visit.outcome)}</span>
                        {visit.outcome}
                      </span>
                    </td>
                    <td className="px-lg py-md text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedVisit(visit) }}
                        className="text-primary hover:underline font-label-md text-label-md bg-transparent border-0 cursor-pointer"
                      >
                        View Full Record
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-lg py-sm bg-surface-container-lowest border-t border-border-subtle flex items-center justify-between gap-md">
          <p className="font-label-sm text-label-sm text-outline m-0">
            {visits.length === 0
              ? 'No visits on record'
              : `Showing ${showingFrom}–${showingTo} of ${visits.length} visit${visits.length === 1 ? '' : 's'}`}
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
          patientName={patient.name}
          onClose={() => setSelectedVisit(null)}
        />
      )}
    </div>
  )
}
