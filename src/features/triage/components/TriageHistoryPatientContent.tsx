import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TriageHistorySearchResult, TriageVisitRecord, VisitOutcome } from '@/features/triage/types/triageHistory'
import { triageService } from '@/api/services/triage'

const PAGE_SIZE = 5

function categoryBadgeClass(category: TriageVisitRecord['triageCategory']) {
  switch (category) {
    case 'Emergency':
      return 'bg-error/10 text-error'
    case 'Urgent':
      return 'bg-warning/10 text-warning'
    case 'Semi-Urgent':
      return 'bg-primary-fixed text-primary'
    case 'Non-Urgent':
      return 'bg-success/10 text-success'
  }
}

function categoryDotClass(category: TriageVisitRecord['triageCategory']) {
  switch (category) {
    case 'Emergency':
      return 'bg-error'
    case 'Urgent':
      return 'bg-warning'
    case 'Semi-Urgent':
      return 'bg-primary'
    case 'Non-Urgent':
      return 'bg-success'
  }
}

function outcomeBadge(outcome: VisitOutcome) {
  switch (outcome) {
    case 'Discharged':
      return 'bg-success/10 text-success'
    case 'Admitted':
      return 'bg-primary/10 text-primary'
    case 'Referred':
      return 'bg-[#00B8D9]/10 text-[#00B8D9]'
    case 'Pending':
      return 'bg-warning/10 text-warning'
  }
}

function outcomeIcon(outcome: VisitOutcome) {
  switch (outcome) {
    case 'Discharged':
      return 'check_circle'
    case 'Admitted':
      return 'local_hospital'
    case 'Referred':
      return 'swap_horiz'
    case 'Pending':
      return 'schedule'
  }
}

interface VisitDetailModalProps {
  visit: TriageVisitRecord
  patientName: string
  onClose: () => void
}

function VisitDetailModal({ visit, patientName, onClose }: VisitDetailModalProps) {
  const [realAssessment, setRealAssessment] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    
    const fetchReal = async () => {
      try {
        const data = await triageService.getAssessment(visit.visitId)
        setRealAssessment(data)
      } catch (err) {
        console.log('No real assessment found for visit in database, using local/mock history data')
      } finally {
        setLoading(false)
      }
    }
    void fetchReal()

    return () => document.removeEventListener('keydown', onKey)
  }, [visit.visitId, onClose])

  const vitalsText = useMemo(() => {
    if (!realAssessment) return visit.vitals || ''
    const v = realAssessment.vitals
    const parts = [
      v.blood_pressure_systolic && v.blood_pressure_diastolic ? `BP: ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg` : '',
      v.temperature ? `Temp: ${v.temperature} °C` : '',
      v.pulse_rate ? `Pulse: ${v.pulse_rate} BPM` : '',
      v.oxygen_saturation ? `SpO2: ${v.oxygen_saturation} %` : '',
      v.respiratory_rate ? `RR: ${v.respiratory_rate} BPM` : '',
      v.weight_kg ? `Weight: ${v.weight_kg} kg` : ''
    ].filter(Boolean)
    return parts.join(' | ')
  }, [realAssessment, visit.vitals])

  const complaintText = realAssessment ? realAssessment.chief_complaint : visit.chiefComplaint
  const notesText = realAssessment ? realAssessment.triage_notes : visit.doctorNotes
  const nurseName = realAssessment ? realAssessment.triage_nurse.full_name : null

  const categoryLabel = useMemo((): any => {
    if (!realAssessment) return visit.triageCategory
    const cat = realAssessment.triage_category.replace('_', '-').replace(/\b\w/g, (c: string) => c.toUpperCase())
    return cat
  }, [realAssessment, visit.triageCategory])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Visit detail — ${visit.visitId}`}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl bg-surface-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-xl pt-xl pb-lg border-b border-border-subtle">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Visit Overview</h2>
            <p className="font-body-sm text-body-sm text-outline mt-xs m-0">{patientName} · {visit.visitId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-xs rounded-full hover:bg-surface-container transition-colors bg-transparent border-0 cursor-pointer text-outline hover:text-on-surface -mt-1 -mr-1"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-xl py-lg space-y-lg">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-sm">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
              <p className="font-label-md text-secondary m-0">Loading assessment details...</p>
            </div>
          ) : (
            <>
              {/* Meta row */}
              <div className="flex flex-wrap gap-md">
                <div className="flex items-center gap-xs text-outline font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  {realAssessment ? new Date(realAssessment.assessed_at).toLocaleDateString() : visit.date}
                </div>
                <span
                  className={`inline-flex items-center gap-xs px-sm py-xs rounded font-label-sm text-label-sm font-bold uppercase tracking-wide ${categoryBadgeClass(categoryLabel)}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${categoryDotClass(categoryLabel)}`} />
                  {categoryLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-xs px-sm py-xs rounded font-label-sm text-label-sm font-bold uppercase tracking-wide ${outcomeBadge(visit.outcome)}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{outcomeIcon(visit.outcome)}</span>
                  {visit.outcome}
                </span>
              </div>

              {/* Chief Complaint */}
              <div className="bg-surface-container-low rounded-xl p-md">
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Chief Complaint</p>
                <p className="font-body-md text-body-md text-on-surface m-0">{complaintText}</p>
              </div>

              {/* Two-col grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="bg-surface-container-low rounded-xl p-md">
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Attending Doctor / Staff</p>
                  <div className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-primary text-[18px]">stethoscope</span>
                    <p className="font-body-md text-body-md text-on-surface m-0">
                      {nurseName ? `Nurse: ${nurseName}` : visit.attendingDoctor}
                    </p>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-md">
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Diagnosis</p>
                  <p className="font-body-md text-body-md text-on-surface m-0">{visit.diagnosis}</p>
                </div>
              </div>

              {/* Vitals */}
              {vitalsText && (
                <div className="bg-surface-container-low rounded-xl p-md">
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                    Vitals
                  </p>
                  <p className="font-body-md text-body-md text-on-surface m-0">{vitalsText}</p>
                </div>
              )}

              {/* Doctor / Nurse Notes */}
              {notesText && (
                <div className="border border-border-subtle rounded-xl p-md">
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px]">notes</span>
                    Triage & Clinical Notes
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed m-0">{notesText}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-xl py-md border-t border-border-subtle bg-surface-container-lowest flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-lg h-10 border border-border-subtle rounded text-on-surface-variant hover:bg-surface-container transition-colors font-label-md text-label-md bg-transparent cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  patient: TriageHistorySearchResult
}

export function TriageHistoryPatientContent({ patient }: Props) {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<TriageVisitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedVisit, setSelectedVisit] = useState<TriageVisitRecord | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const data = await triageService.getPatientAssessments(patient.id)
        const mapped = data.map((ass): TriageVisitRecord => {
          const dateStr = ass.assessed_at
            ? new Date(ass.assessed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : ass.visit_date
              ? new Date(ass.visit_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : ''

          const category = ass.triage_category
            ? (ass.triage_category.replace('_', '-').replace(/\b\w/g, (c) => c.toUpperCase()) as any)
            : 'Non-Urgent'

          let vitalsText = '--'
          if (ass.vitals) {
            const v = ass.vitals
            const parts = [
              v.blood_pressure_systolic && v.blood_pressure_diastolic ? `BP: ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg` : '',
              v.temperature ? `Temp: ${v.temperature} °C` : '',
              v.pulse_rate ? `Pulse: ${v.pulse_rate} BPM` : '',
              v.oxygen_saturation ? `SpO2: ${v.oxygen_saturation} %` : '',
              v.respiratory_rate ? `RR: ${v.respiratory_rate} BPM` : '',
              v.weight_kg ? `Weight: ${v.weight_kg} kg` : ''
            ].filter(Boolean)
            vitalsText = parts.join(' | ') || '--'
          }

          return {
            visitId: ass.visit_id,
            date: dateStr,
            chiefComplaint: ass.chief_complaint || 'No Triage Recorded',
            triageCategory: category,
            attendingDoctor: '--',
            diagnosis: '--',
            outcome: 'Pending',
            vitals: vitalsText,
            doctorNotes: ass.triage_notes || ''
          }
        })
        setVisits(mapped)
      } catch (err) {
        console.error('Failed to load patient triage assessments:', err)
        toast.error('Failed to load patient visit history.')
      } finally {
        setLoading(false)
      }
    }
    void fetchHistory()
  }, [patient.id])

  const totalPages = Math.max(1, Math.ceil(visits.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleVisits = visits.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const showingFrom = visits.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(safePage * PAGE_SIZE, visits.length)

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg">
      <nav
        className="flex flex-wrap items-center gap-2 font-body-sm text-body-sm"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={() => navigate('/triage/history')}
          className="text-primary hover:underline font-label-md bg-transparent border-0 cursor-pointer p-0"
        >
          Patient History
        </button>
        <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
        <span className="text-outline">{patient.name}</span>
      </nav>

      <section className="bg-surface-white border border-border-subtle rounded-xl p-lg flex flex-col md:flex-row items-start md:items-center gap-xl">
        <div className="relative shrink-0">
          {patient.avatarUrl ? (
            <img
              src={patient.avatarUrl}
              alt={patient.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-secondary-container border-2 border-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {patient.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-success border-2 border-surface-white rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl flex-1">
          <div>
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">
              Patient Name
            </p>
            <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">{patient.name}</h3>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">
              Patient ID
            </p>
            <p className="font-body-md text-body-md font-semibold text-primary m-0">
              {patient.patientNumber}
            </p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">
              DOB / Gender
            </p>
            <p className="font-body-md text-body-md text-on-surface m-0">
              {patient.dob} ({patient.age}y) / {patient.gender}
            </p>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">
              Phone Number
            </p>
            <p className="font-body-md text-body-md text-on-surface m-0">{patient.phone}</p>
          </div>
        </div>
      </section>

      <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Visit History</h3>
          <div className="flex gap-sm">
            <button
              type="button"
              className="p-xs text-outline hover:text-primary transition-colors bg-transparent border-0 cursor-pointer"
              title="Filter visits"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button
              type="button"
              className="p-xs text-outline hover:text-primary transition-colors bg-transparent border-0 cursor-pointer"
              title="Download history"
            >
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[720px]">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="text-left px-lg py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Visit Date
                </th>
                <th className="text-left px-lg py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Visit #
                </th>
                <th className="text-left px-lg py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Chief Complaint
                </th>
                <th className="text-left px-lg py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Triage Category
                </th>
                <th className="text-left px-lg py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Attending Doctor
                </th>
                <th className="text-left px-lg py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Diagnosis
                </th>
                <th className="text-left px-lg py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  Outcome
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-lg py-xl text-center font-body-sm text-body-sm text-outline"
                  >
                    <span className="material-symbols-outlined text-primary animate-spin text-[32px]">progress_activity</span>
                    <p className="font-label-md text-secondary mt-sm m-0">Loading visit records...</p>
                  </td>
                </tr>
              ) : visibleVisits.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-lg py-xl text-center font-body-sm text-body-sm text-outline"
                  >
                    No visit records found for this patient.
                  </td>
                </tr>
              ) : (
                visibleVisits.map((visit) => (
                  <tr
                    key={visit.visitId}
                    className="hover:bg-hover-tint transition-colors cursor-pointer group"
                    onClick={() => setSelectedVisit(visit)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedVisit(visit) }}
                    role="button"
                    aria-label={`View details for visit ${visit.visitId}`}
                  >
                    <td className="px-lg py-md font-body-sm text-body-sm font-semibold text-on-surface">
                      {visit.date}
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-outline">
                      {visit.visitId}
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface">
                      {visit.chiefComplaint}
                    </td>
                    <td className="px-lg py-md">
                      <span
                        className={`inline-flex items-center px-sm py-xs rounded font-label-sm text-label-sm font-bold uppercase tracking-wide ${categoryBadgeClass(visit.triageCategory)}`}
                      >
                        {visit.triageCategory}
                      </span>
                    </td>
                    <td className="px-lg py-md font-body-sm text-body-sm text-on-surface">
                      {visit.attendingDoctor}
                    </td>
                    <td
                      className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant truncate max-w-[160px]"
                      title={visit.diagnosis}
                    >
                      {visit.diagnosis}
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex items-center justify-between gap-sm">
                        <span
                          className={`inline-flex items-center px-sm py-xs rounded font-label-sm text-label-sm font-bold uppercase tracking-wide ${outcomeBadge(visit.outcome)}`}
                        >
                          {visit.outcome}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                          open_in_new
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-lg py-sm bg-surface-container-lowest border-t border-border-subtle flex items-center justify-between gap-md">
          <p className="font-label-sm text-label-sm text-outline m-0">
            {visits.length === 0
              ? 'No visits on record'
              : `Showing ${showingFrom} to ${showingTo} of ${visits.length} visit${visits.length === 1 ? '' : 's'}`}
          </p>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-xs rounded hover:bg-surface-container transition-colors disabled:opacity-30 bg-transparent border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-body-lg">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-xs rounded hover:bg-surface-container transition-colors disabled:opacity-30 bg-transparent border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-body-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

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
