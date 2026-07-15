import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { triageService } from '@/api/services/triage'
import type { TriageQueuePriority, TriageVisit } from '@/features/triage/types/triageAssessment'
import {
  buildAssessNavigateState,
  type TriageQueueLocationState,
} from '@/features/triage/utils/triageAssessNav'

type PriorityFilter = 'all' | TriageQueuePriority
type PaymentFilter = 'all' | 'cash' | 'insurance' | 'exempt'

const PAGE_SIZE = 5

function SummaryCard({
  label,
  value,
  subtext,
  subtextClassName = 'text-secondary',
  icon,
  variant = 'default',
}: {
  label: string;
  value: string;
  subtext: string;
  subtextClassName?: string;
  icon: string;
  variant?: 'default' | 'emergency';
}) {
  const isEmergency = variant === 'emergency'

  return (
    <div
      className={
        isEmergency
          ? 'bg-white border-2 border-error p-md rounded-xl shadow-sm'
          : 'bg-surface-white border border-border-subtle p-md rounded-xl'
      }
    >
      <div className="flex justify-between items-start mb-sm">
        <p className={`font-label-md text-label-md m-0 ${isEmergency ? 'text-error' : 'text-secondary'}`}>
          {label}
        </p>
        <span
          className={`material-symbols-outlined ${isEmergency ? 'text-error' : 'text-secondary opacity-50'}`}
        >
          {icon}
        </span>
      </div>
      <p className={`font-headline-lg text-headline-lg m-0 ${isEmergency ? 'text-error' : 'text-on-surface'}`}>
        {value}
      </p>
      <p className={`font-label-sm text-label-sm mt-1 m-0 ${subtextClassName}`}>{subtext}</p>
    </div>
  )
}

function matchesPaymentFilter(payment: string, filter: PaymentFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'cash') return payment.toLowerCase() === 'cash'
  if (filter === 'insurance') return payment.toLowerCase() === 'insurance' || payment.toLowerCase() === 'nhif'
  if (filter === 'exempt') return payment.toLowerCase() === 'exempt'
  return true
}

function categoryBadgeClass(category?: string) {
  if (!category) return 'bg-surface-container-high text-on-surface-variant'
  const norm = category.toLowerCase().replace('-', '_')
  switch (norm) {
    case 'emergency':
      return 'bg-error/10 text-error border border-solid border-error/20'
    case 'urgent':
      return 'bg-warning/10 text-warning border border-solid border-warning/20'
    case 'semi_urgent':
      return 'bg-primary/10 text-primary border border-solid border-primary/20'
    case 'non_urgent':
      return 'bg-success/10 text-success border border-solid border-success/20'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

export function TriageQueueContent() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [patients, setPatients] = useState<TriageVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewPatient, setPreviewPatient] = useState<TriageVisit | null>(null)
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null)
  const [viewAssessmentVisit, setViewAssessmentVisit] = useState<TriageVisit | null>(null)
  const [assessmentDetails, setAssessmentDetails] = useState<any | null>(null)
  const [loadingAssessment, setLoadingAssessment] = useState(false)

  const handleViewDetails = async (patient: TriageVisit) => {
    setViewAssessmentVisit(patient)
    setLoadingAssessment(true)
    setAssessmentDetails(null)
    try {
      const data = await triageService.getAssessment(patient.visitId)
      setAssessmentDetails(data)
    } catch (err) {
      console.error('Failed to fetch triage assessment details:', err)
      toast.error('Failed to load assessment details.')
    } finally {
      setLoadingAssessment(false)
    }
  }

  const fetchQueue = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const data = await triageService.getQueue('waiting,in_progress,completed')
      const mapped = data.queue.map((item): TriageVisit => {
        const initials = item.patient.full_name
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        
        const dob = new Date(item.patient.date_of_birth)
        const age = isNaN(dob.getTime())
          ? 0
          : Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970)
        
        const arrivalDate = new Date(item.created_at)
        let arrival = '--'
        if (!isNaN(arrivalDate.getTime())) {
          const dateStr = arrivalDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
          const timeFormatted = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          arrival = `${dateStr}, ${timeFormatted}`
        }
          
        const diffMins = isNaN(arrivalDate.getTime())
          ? 0
          : Math.floor((Date.now() - arrivalDate.getTime()) / 60000)
          
        const waitTime = `${diffMins}m`
        
        let waitColor = 'text-success'
        if (item.priority === 'emergency') {
          waitColor = 'text-error'
        } else if (diffMins > 30) {
          waitColor = 'text-warning'
        }
        
        return {
          queueId: item.queue_id,
          status: item.status,
          visitId: item.visit.visit_id,
          patientId: item.patient.patient_id,
          queueNumber: item.queue_number,
          name: item.patient.full_name,
          initials,
          patientNumber: item.patient.patient_number,
          gender: item.patient.gender,
          age,
          arrival,
          waitTime,
          waitColor,
          waitWarningIcon: diffMins > 30,
          payment: item.visit.payment_type,
          source: item.visit.visit_type,
          priority: item.priority === 'emergency' ? 'emergency' : item.priority === 'urgent' ? 'urgent' : 'routine',
          isEmergency: item.priority === 'emergency'
        }
      })
      setPatients(mapped)
    } catch (err) {
      console.error('Failed to fetch triage queue:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchQueue(true)
    const interval = setInterval(() => void fetchQueue(), 15000)
    return () => clearInterval(interval)
  }, [])

  const filteredPatients = useMemo(() => {
    return patients
      .filter(
        (patient) =>
          patient.status === 'waiting' ||
          patient.status === 'in_progress' ||
          patient.status === 'completed'
      )
      .filter((patient) => {
        const priorityMatch = priorityFilter === 'all' || patient.priority === priorityFilter
        const paymentMatch = matchesPaymentFilter(patient.payment, paymentFilter)
        return priorityMatch && paymentMatch
      })
  }, [patients, priorityFilter, paymentFilter])

  useEffect(() => {
    const highlight = (location.state as TriageQueueLocationState | null)?.highlightVisitId
    if (!highlight) return

    const index = filteredPatients.findIndex((patient) => patient.visitId === highlight)
    if (index >= 0) {
      setCurrentPage(Math.floor(index / PAGE_SIZE) + 1)
      setActiveVisitId(highlight)
    }

    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, location.pathname, filteredPatients, navigate])

  useEffect(() => {
    if (!activeVisitId) return
    const timeout = window.setTimeout(() => setActiveVisitId(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [activeVisitId])

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const visiblePatients = filteredPatients.slice(pageStart, pageStart + PAGE_SIZE)
  const showingFrom = filteredPatients.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + PAGE_SIZE, filteredPatients.length)

  const handleAssess = async (visitId: string) => {
    setPreviewPatient(null)
    const patient = patients.find((p) => p.visitId === visitId)
    if (patient) {
      if (patient.status === 'waiting') {
        try {
          await triageService.callPatient(patient.queueId)
        } catch (err) {
          console.error('Failed to auto-call patient on assess click:', err)
        }
      }
      navigate(`/triage/assess/${visitId}`, { state: { visit: patient, from: 'queue' } })
    } else {
      navigate(`/triage/assess/${visitId}`, { state: buildAssessNavigateState(visitId) })
    }
  }

  // Dashboard Stats Calculations
  const awaitingCount = patients.filter((p) => p.status === 'waiting').length
  const inProgressCount = patients.filter((p) => p.status === 'in_progress').length
  const assessedTodayCount = patients.filter((p) => p.status === 'completed').length
  const emergencyCount = patients.filter(
    (p) => (p.status === 'waiting' || p.status === 'in_progress') && p.priority === 'emergency'
  ).length

  const avgWaitTimeStr = useMemo(() => {
    const active = patients.filter((p) => p.status === 'waiting' || p.status === 'in_progress')
    if (active.length === 0) return '0m'
    const totalWait = active.reduce((sum, p) => sum + (parseInt(p.waitTime) || 0), 0)
    return `${Math.round(totalWait / active.length)}m`
  }, [patients])

  return (
    <div className="flex flex-col gap-lg max-w-container-max mx-auto w-full min-h-[calc(100vh-7rem)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md shrink-0">
        <SummaryCard
          label="Awaiting"
          value={String(awaitingCount)}
          subtext={`Avg Wait: ${avgWaitTimeStr}`}
          subtextClassName="text-success"
          icon="hourglass_empty"
        />
        <SummaryCard
          label="In Progress"
          value={String(inProgressCount)}
          subtext="Room 4 Active"
          icon="sync"
        />
        <SummaryCard
          label="Assessed Today"
          value={String(assessedTodayCount)}
          subtext="Completed assessments"
          icon="check_circle"
        />
        <SummaryCard
          label="Emergency Now"
          value={String(emergencyCount)}
          subtext="Immediate attention required"
          subtextClassName="text-error font-bold"
          icon="emergency"
          variant="emergency"
        />
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-md py-lg flex flex-col md:flex-row justify-between items-center gap-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Awaiting Triage</h3>
          <div className="flex flex-wrap items-center gap-sm">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as PriorityFilter)
                setCurrentPage(1)
              }}
              className="text-body-sm font-body-sm bg-surface-white border border-border-subtle px-sm py-1.5 rounded outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Priority: All</option>
              <option value="emergency">Emergency</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value as PaymentFilter)
                setCurrentPage(1)
              }}
              className="text-body-sm font-body-sm bg-surface-white border border-border-subtle px-sm py-1.5 rounded outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Payment: All</option>
              <option value="cash">Cash</option>
              <option value="insurance">Insurance</option>
              <option value="exempt">Exempt</option>
            </select>
          </div>
        </div>

        <div className="border-b border-border-subtle" />

        <div className="flex-1 overflow-auto min-h-[28rem]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 gap-sm">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
              <p className="font-label-md text-secondary m-0">Loading triage queue...</p>
            </div>
          ) : (
            <table className="w-full border-collapse min-w-[900px]">
              <thead className="bg-surface-container-low sticky top-0 z-10">
                <tr>
                  <th className="px-md py-sm text-left font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-md py-sm text-left font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-md py-sm text-left font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Patient #
                  </th>
                  <th className="px-md py-sm text-left font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Arrival Time
                  </th>
                  <th className="px-md py-sm text-left font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Wait Time
                  </th>
                  <th className="px-md py-sm text-left font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-md py-sm text-left font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-md py-sm text-left font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-md py-sm text-right font-label-md text-label-md text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-md py-xl text-center font-body-sm text-secondary">
                      No patients match the selected filters.
                    </td>
                  </tr>
                ) : (
                  visiblePatients.map((patient) => (
                    <tr
                      key={patient.visitId}
                      className={`hover:bg-hover-tint transition-colors ${
                        patient.isEmergency ? 'bg-[#FFF4F4]' : ''
                      } ${
                        activeVisitId === patient.visitId
                          ? 'ring-2 ring-inset ring-primary bg-hover-tint'
                          : ''
                      }`}
                    >
                      <td
                        className={`px-md py-md font-body-sm text-body-sm ${
                          patient.isEmergency ? 'font-bold text-error' : 'text-secondary'
                        }`}
                      >
                        {patient.queueNumber}
                      </td>
                      <td className="px-md py-md">
                        <div className="flex items-center gap-sm">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              patient.isEmergency
                                ? 'bg-error-container text-error'
                                : 'bg-secondary-container text-primary'
                            }`}
                          >
                            {patient.initials}
                          </div>
                          <div>
                            <p className="font-label-md text-label-md text-on-surface m-0">{patient.name}</p>
                            {patient.isEmergency && (
                              <p className="text-[10px] text-error font-bold uppercase tracking-widest m-0">
                                Emergency
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-md py-md font-body-sm text-body-sm text-secondary">
                        {patient.patientNumber}
                      </td>
                      <td className="px-md py-md font-body-sm text-body-sm text-secondary">{patient.arrival}</td>
                      <td className="px-md py-md">
                        <span
                          className={`font-body-sm text-body-sm font-semibold flex items-center gap-xs ${patient.waitColor}`}
                        >
                          {patient.waitWarningIcon && (
                            <span className="material-symbols-outlined text-[16px]">warning</span>
                          )}
                          {patient.waitTime}
                        </span>
                      </td>
                      <td className="px-md py-md font-body-sm text-body-sm text-on-surface">{patient.payment}</td>
                      <td className="px-md py-md font-body-sm text-body-sm text-on-surface">{patient.source}</td>
                      <td className="px-md py-md">
                        <span
                          className={`inline-flex px-sm py-xs rounded-full font-label-sm text-label-sm font-semibold uppercase tracking-wide ${
                            patient.status === 'completed'
                              ? 'bg-success/10 text-success'
                              : patient.status === 'waiting'
                              ? 'bg-surface-container-high text-on-surface-variant'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {patient.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-md py-md text-right">
                        <div className="flex justify-end gap-sm items-center">
                          {patient.status === 'completed' ? (
                            <button
                              type="button; button-view-triage"
                              onClick={() => handleViewDetails(patient)}
                              className="border border-solid border-success text-success px-sm h-8 rounded font-label-md text-label-md hover:bg-success/10 bg-transparent cursor-pointer flex items-center gap-xs"
                            >
                              <span className="material-symbols-outlined text-[16px]">pageview</span>
                              View Details
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewPatient(patient)}
                                className="p-1.5 hover:bg-surface-container rounded transition-colors text-secondary bg-transparent border-0 cursor-pointer"
                                title="View patient"
                              >
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAssess(patient.visitId)}
                                className="bg-primary-container text-on-primary px-sm h-8 rounded font-label-md text-label-md hover:bg-primary border-0 cursor-pointer"
                              >
                                Assess
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-md bg-surface-bright border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-sm shrink-0">
          <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
            {filteredPatients.length === 0
              ? 'No patients awaiting triage'
              : `Showing ${showingFrom} to ${showingTo} of ${filteredPatients.length} patients awaiting triage`}
          </p>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-sm h-8 border rounded font-body-sm cursor-pointer ${
                  safePage === page
                    ? 'border-primary bg-primary text-white'
                    : 'border-border-subtle hover:bg-surface-white text-on-surface'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {previewPatient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md"
          onClick={() => setPreviewPatient(null)}
          onKeyDown={(e) => e.key === 'Escape' && setPreviewPatient(null)}
          role="presentation"
        >
          <div
            className="bg-surface-white rounded-xl border border-border-subtle shadow-lg max-w-md w-full p-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="patient-preview-title"
          >
            <h3 id="patient-preview-title" className="font-headline-sm text-on-surface m-0 mb-md">
              Patient preview
            </h3>
            <div className="space-y-sm font-body-sm text-body-sm">
              <p className="m-0">
                <span className="text-secondary">Name:</span> {previewPatient.name}
              </p>
              <p className="m-0">
                <span className="text-secondary">Patient #:</span> {previewPatient.patientNumber}
              </p>
              <p className="m-0">
                <span className="text-secondary">Arrival:</span> {previewPatient.arrival}
              </p>
              <p className="m-0">
                <span className="text-secondary">Wait:</span> {previewPatient.waitTime}
              </p>
              <p className="m-0">
                <span className="text-secondary">Source:</span> {previewPatient.source}
              </p>
            </div>
            <div className="flex gap-sm mt-lg justify-end">
              <button
                type="button"
                onClick={() => setPreviewPatient(null)}
                className="px-md py-sm border border-border-subtle rounded-lg font-body-sm bg-transparent cursor-pointer hover:bg-surface-container-low"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleAssess(previewPatient.visitId)}
                className="px-md py-sm bg-primary-container text-on-primary rounded-lg font-body-sm border-0 cursor-pointer hover:opacity-90"
              >
                Start assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {viewAssessmentVisit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md"
          onClick={() => setViewAssessmentVisit(null)}
          onKeyDown={(e) => e.key === 'Escape' && setViewAssessmentVisit(null)}
          role="presentation"
        >
          <div
            className="bg-surface-white rounded-xl border border-border-subtle shadow-lg max-w-md w-full p-lg flex flex-col gap-md"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="triage-details-title"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <h3 id="triage-details-title" className="font-headline-sm text-on-surface m-0">
                Triage details
              </h3>
              <button
                type="button"
                onClick={() => setViewAssessmentVisit(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low border-0 bg-transparent cursor-pointer text-secondary transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            {loadingAssessment ? (
              <div className="flex flex-col items-center justify-center py-xl gap-sm">
                <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                  progress_activity
                </span>
                <p className="font-body-sm text-secondary m-0">Loading assessment details...</p>
              </div>
            ) : assessmentDetails ? (
              <div className="flex flex-col gap-md">
                {/* General Info Grid */}
                <div className="grid grid-cols-2 gap-sm text-body-sm">
                  <div>
                    <span className="text-secondary font-medium">Name:</span>
                    <p className="font-semibold text-on-surface m-0 mt-[2px]">{viewAssessmentVisit.name}</p>
                  </div>
                  <div>
                    <span className="text-secondary font-medium">Patient #:</span>
                    <p className="font-semibold text-on-surface m-0 mt-[2px]">{viewAssessmentVisit.patientNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-secondary font-medium">Triage Priority:</span>
                    <div className="mt-xs">
                      <span
                        className={`px-sm py-0.5 rounded-full font-label-sm text-label-sm font-semibold uppercase tracking-wide ${categoryBadgeClass(
                          assessmentDetails.triage_category
                        )}`}
                      >
                        {assessmentDetails.triage_category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vitals Signs Grid (3 Columns) */}
                <div>
                  <h4 className="font-label-sm text-secondary uppercase font-bold tracking-wider m-0 mb-xs">
                    Vital Signs
                  </h4>
                  <div className="grid grid-cols-3 gap-xs text-body-sm">
                    <div className="bg-surface-container-low p-xs rounded border border-solid border-border-subtle">
                      <span className="text-[10px] text-secondary">BP (mmHg)</span>
                      <p className="font-semibold text-on-surface m-0 mt-[2px]">
                        {assessmentDetails.vitals.blood_pressure_systolic ?? '--'}/
                        {assessmentDetails.vitals.blood_pressure_diastolic ?? '--'}
                      </p>
                    </div>
                    <div className="bg-surface-container-low p-xs rounded border border-solid border-border-subtle">
                      <span className="text-[10px] text-secondary">Temp (°C)</span>
                      <p className="font-semibold text-on-surface m-0 mt-[2px]">
                        {assessmentDetails.vitals.temperature ?? '--'}
                      </p>
                    </div>
                    <div className="bg-surface-container-low p-xs rounded border border-solid border-border-subtle">
                      <span className="text-[10px] text-secondary">Pulse (bpm)</span>
                      <p className="font-semibold text-on-surface m-0 mt-[2px]">
                        {assessmentDetails.vitals.pulse_rate ?? '--'}
                      </p>
                    </div>
                    <div className="bg-surface-container-low p-xs rounded border border-solid border-border-subtle">
                      <span className="text-[10px] text-secondary">SpO2 (%)</span>
                      <p className="font-semibold text-on-surface m-0 mt-[2px]">
                        {assessmentDetails.vitals.oxygen_saturation ?? '--'}
                      </p>
                    </div>
                    <div className="bg-surface-container-low p-xs rounded border border-solid border-border-subtle">
                      <span className="text-[10px] text-secondary">Resp. (/min)</span>
                      <p className="font-semibold text-on-surface m-0 mt-[2px]">
                        {assessmentDetails.vitals.respiratory_rate ?? '--'}
                      </p>
                    </div>
                    <div className="bg-surface-container-low p-xs rounded border border-solid border-border-subtle">
                      <span className="text-[10px] text-secondary">Weight (kg)</span>
                      <p className="font-semibold text-on-surface m-0 mt-[2px]">
                        {assessmentDetails.vitals.weight_kg ?? '--'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Complaint and Symptoms (Blocks) */}
                <div className="space-y-xs text-body-sm">
                  <div>
                    <span className="text-secondary font-medium">Chief Complaint</span>
                    <p className="m-0 mt-xs p-xs bg-surface-bright border border-solid border-border-subtle rounded text-on-surface font-body-sm leading-relaxed">
                      {assessmentDetails.chief_complaint}
                    </p>
                  </div>
                  {assessmentDetails.triage_notes && (
                    <div>
                      <span className="text-secondary font-medium">Clinical Notes</span>
                      <p className="m-0 mt-xs p-xs bg-surface-bright border border-solid border-border-subtle rounded text-on-surface font-body-sm leading-relaxed">
                        {assessmentDetails.triage_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Assessor Metadata */}
                <div className="flex flex-col sm:flex-row justify-between text-[11px] text-secondary gap-xs pt-xs">
                  <p className="m-0">
                    <span className="font-semibold">Assessed By:</span>{' '}
                    {assessmentDetails.triage_nurse.full_name}
                  </p>
                  <p className="m-0">
                    <span className="font-semibold">Date:</span>{' '}
                    {new Date(assessmentDetails.assessed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-md">
                <p className="font-body-sm text-error m-0">Failed to load assessment details.</p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex gap-sm justify-end pt-sm">
              <button
                type="button"
                onClick={() => setViewAssessmentVisit(null)}
                className="px-md py-sm border border-border-subtle rounded-lg font-body-sm bg-transparent cursor-pointer hover:bg-surface-container-low transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
