import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MOCK_TRIAGE_VISITS } from '@/features/triage/data/mockTriageVisits'
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
  label: string
  value: string
  subtext: string
  subtextClassName?: string
  icon: string
  variant?: 'default' | 'emergency'
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

export function TriageQueueContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [previewPatient, setPreviewPatient] = useState<TriageVisit | null>(null)
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null)

  const filteredPatients = useMemo(() => {
    return MOCK_TRIAGE_VISITS.filter((patient) => {
      const priorityMatch = priorityFilter === 'all' || patient.priority === priorityFilter
      const paymentMatch = matchesPaymentFilter(patient.payment, paymentFilter)
      return priorityMatch && paymentMatch
    })
  }, [priorityFilter, paymentFilter])

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

  const handleAssess = (visitId: string) => {
    setPreviewPatient(null)
    navigate(`/triage/assess/${visitId}`, { state: buildAssessNavigateState(visitId) })
  }

  return (
    <div className="flex flex-col gap-lg max-w-container-max mx-auto w-full min-h-[calc(100vh-7rem)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md shrink-0">
        <SummaryCard label="Awaiting" value="6" subtext="Avg Wait: 14m" subtextClassName="text-success" icon="hourglass_empty" />
        <SummaryCard label="In Progress" value="1" subtext="Room 4 Active" icon="sync" />
        <SummaryCard label="Assessed Today" value="18" subtext="+3 since 08:00" icon="check_circle" />
        <SummaryCard
          label="Emergency Now"
          value="1"
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
                <th className="px-md py-sm text-right font-label-md text-label-md text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-md py-xl text-center font-body-sm text-secondary">
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
                    <td className="px-md py-md text-right">
                      <div className="flex justify-end gap-sm items-center">
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  )
}
