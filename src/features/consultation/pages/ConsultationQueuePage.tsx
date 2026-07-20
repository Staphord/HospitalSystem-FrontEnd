import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { consultationService } from '@/api/services/consultation'
import type { ConsultationQueueItem } from '@/api/types/consultation'

// ── Types ─────────────────────────────────────────────────────────────────────

type TriagePriority = 'emergency' | 'urgent' | 'non-urgent' | 'general'
type VitalsStatus = 'critical' | 'stable' | 'normal'
type PriorityFilter = 'all' | TriagePriority
type StatusFilter = 'active' | 'completed' | 'all'

interface QueueEntry {
  id: string
  name: string
  patientNumber: string
  chiefComplaint: string
  priority: TriagePriority
  waitTime: string
  vitals: VitalsStatus
  vitalsTooltip?: string
  status: string
  visitStatus?: string
  pendingInvestigationsCount?: number
  completedInvestigationsCount?: number
}

// Mock data has been replaced by live consultationService getQueue data.

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  TriagePriority,
  { badge: string; waitColor: string; rowClass: string; buttonClass: string }
> = {
  emergency: {
    badge: 'bg-error text-white',
    waitColor: 'text-error font-bold',
    rowClass: 'bg-[#FFF4F4] hover:bg-[#fee2e2]',
    buttonClass: 'bg-primary-container hover:opacity-90',
  },
  urgent: {
    badge: 'bg-warning/10 text-warning border border-warning/20',
    waitColor: 'text-warning font-bold',
    rowClass: 'hover:bg-hover-tint',
    buttonClass: 'bg-primary hover:bg-primary-container',
  },
  'non-urgent': {
    badge: 'bg-success/10 text-success border border-success/20',
    waitColor: 'text-success font-bold',
    rowClass: 'hover:bg-hover-tint',
    buttonClass: 'bg-primary hover:bg-primary-container',
  },
  general: {
    badge: 'bg-surface-container text-secondary border border-border-subtle',
    waitColor: 'text-secondary',
    rowClass: 'hover:bg-hover-tint',
    buttonClass: 'bg-primary hover:bg-primary-container',
  },
}

const VITALS_CONFIG: Record<VitalsStatus, { color: string; label: string }> = {
  critical: { color: 'text-error font-bold', label: 'Critical' },
  stable: { color: 'text-secondary', label: 'Stable' },
  normal: { color: 'text-secondary', label: 'Normal' },
}

const PRIORITY_LABEL: Record<TriagePriority, string> = {
  emergency: 'Emergency',
  urgent: 'Urgent',
  'non-urgent': 'Non-Urgent',
  general: 'General',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCards({ entries }: { entries: QueueEntry[] }) {
  const waiting = entries.filter((e) => e.status === 'waiting' && e.priority !== 'emergency').length
  const emergencies = entries.filter((e) => e.status === 'waiting' && e.priority === 'emergency').length
  const inProgress = entries.filter((e) => e.status === 'in_progress').length
  const completed = entries.filter((e) => e.status === 'completed').length

  const cards = [
    {
      label: 'Waiting',
      value: waiting,
      unit: 'Patients',
      subtext: 'Awaiting clinical notes',
      icon: 'hourglass_empty',
      iconColor: 'text-warning',
      valueColor: 'text-on-background',
      variant: 'default' as const,
    },
    {
      label: 'Emergency',
      value: emergencies,
      unit: 'Action Required',
      subtext: 'Immediate clinical review',
      icon: 'emergency',
      iconColor: 'text-error',
      valueColor: 'text-error',
      variant: 'emergency' as const,
    },
    {
      label: 'In Progress',
      value: inProgress,
      unit: 'Consulting',
      subtext: 'Active consultations',
      icon: 'medical_services',
      iconColor: 'text-primary',
      valueColor: 'text-primary',
      variant: 'default' as const,
    },
    {
      label: 'Completed Today',
      value: completed,
      unit: 'Discharged',
      subtext: 'Completed this shift',
      icon: 'check_circle',
      iconColor: 'text-success',
      valueColor: 'text-success',
      variant: 'default' as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`p-md rounded-xl border relative overflow-hidden ${
            card.variant === 'emergency'
              ? 'bg-error-container/20 border-error'
              : 'bg-surface-white border-border-subtle'
          }`}
        >
          <div className="flex flex-col gap-xs">
            <p
              className={`font-label-md text-label-md uppercase tracking-wider ${
                card.variant === 'emergency' ? 'text-error' : 'text-secondary'
              }`}
            >
              {card.label}
            </p>
            <div className="flex items-baseline gap-sm">
              <span className={`text-[30px] leading-[38px] font-bold font-headline-lg ${card.valueColor}`}>
                {card.value}
              </span>
              <span
                className={`font-body-sm text-body-sm ${
                  card.variant === 'emergency' ? 'text-error font-bold' : 'text-secondary'
                }`}
              >
                {card.unit}
              </span>
            </div>
            <div className="flex items-center gap-xs mt-xs">
              <span className={`material-symbols-outlined text-[16px] leading-none ${card.iconColor}`}>
                {card.icon}
              </span>
              <span
                className={`font-body-sm text-body-sm m-0 leading-none ${
                  card.variant === 'emergency' ? 'text-error font-bold' : 'text-secondary'
                }`}
              >
                {card.subtext}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VitalsCell({ vitals, tooltip }: { vitals: VitalsStatus; tooltip?: string }) {
  const cfg = VITALS_CONFIG[vitals]
  return (
    <div className={`flex items-center gap-xs group/tooltip relative ${cfg.color}`}>
      <span className="material-symbols-outlined text-[20px]">vital_signs</span>
      <span>{cfg.label}</span>
      {tooltip && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block bg-on-background text-white text-[11px] p-2 rounded whitespace-nowrap z-10 shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPage,
  onPageSizeChange,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPage: (p: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="px-md py-3 bg-surface-container-low border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-md">
        <span className="font-label-sm text-label-sm text-secondary">
          Showing {start}–{end} of {totalItems} patients in queue
        </span>
        <div className="flex items-center gap-xs">
          <span className="font-label-sm text-label-sm text-secondary">Page size:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-border-subtle rounded font-body-sm text-body-sm px-2 py-1 outline-none cursor-pointer focus:border-primary"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
      <div className="flex gap-xs">
        <button
          type="button"
          onClick={() => onPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-white text-secondary hover:bg-hover-tint transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`w-8 h-8 flex items-center justify-center rounded border font-label-md text-label-md transition-colors cursor-pointer ${
              p === currentPage
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-secondary border-border-subtle hover:bg-hover-tint'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-white text-secondary hover:bg-hover-tint transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ConsultationQueuePage() {
  const navigate = useNavigate()
  const [rawQueue, setRawQueue] = useState<ConsultationQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchQueue = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const data = await consultationService.getQueue('waiting,in_progress,completed')
      setRawQueue(data || [])
    } catch (error) {
      console.error('Failed to fetch doctor queue:', error)
      toast.error('Failed to load patient queue.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue(true)
    const interval = setInterval(() => {
      fetchQueue(false)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const queueEntries = useMemo(() => {
    return rawQueue.map((item): QueueEntry => {
      const triageCat = item.triage_category || ''
      const norm = triageCat.toLowerCase().replace('_', '-')
      
      let uiPriority: TriagePriority = 'general'
      if (norm === 'emergency') uiPriority = 'emergency'
      else if (norm === 'urgent') uiPriority = 'urgent'
      else if (norm === 'non-urgent') uiPriority = 'non-urgent'

      const vitalsVal: VitalsStatus = norm === 'emergency' 
        ? 'critical' 
        : (norm === 'urgent' || norm === 'semi_urgent') 
          ? 'stable' 
          : 'normal'

      let effectiveStatus = item.queue_status
      if (item.queue_status !== 'completed' && item.queue_status !== 'skipped') {
        if (
          item.visit_status === 'in_consultation' ||
          item.visit_status === 'awaiting_results' ||
          item.visit_status === 'results_ready'
        ) {
          effectiveStatus = 'in_progress'
        }
      }

      return {
        id: item.visit_id,
        name: item.full_name,
        patientNumber: item.patient_number,
        chiefComplaint: item.chief_complaint || 'No complaint recorded',
        priority: uiPriority,
        waitTime: `${item.wait_time_minutes} min`,
        vitals: vitalsVal,
        status: effectiveStatus,
        visitStatus: item.visit_status,
        pendingInvestigationsCount: item.pending_investigations_count,
        completedInvestigationsCount: item.completed_investigations_count,
      }
    })
  }, [rawQueue])

  const filtered = useMemo(() => {
    let result = [...queueEntries]
    if (statusFilter === 'active') {
      result = result.filter((e) => e.status === 'waiting' || e.status === 'in_progress')
    } else if (statusFilter === 'completed') {
      result = result.filter((e) => e.status === 'completed')
    }

    if (priorityFilter !== 'all') {
      result = result.filter((e) => e.priority === priorityFilter)
    }

    // Emergency rows always float to top
    result.sort((a, b) => {
      if (a.priority === 'emergency' && b.priority !== 'emergency') return -1
      if (b.priority === 'emergency' && a.priority !== 'emergency') return 1
      return 0
    })
    return result
  }, [queueEntries, priorityFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleFilterChange = (setter: (v: never) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value as never)
    setCurrentPage(1)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto w-full">
      {/* Breadcrumb */}
      <div className="mb-lg flex items-center gap-xs font-body-sm text-body-sm text-outline">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-outline font-body-sm text-body-sm"
        >
          Dashboard
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">Patient Queue</span>
      </div>

      {/* Summary Cards */}
      <SummaryCards entries={queueEntries} />

      {/* Queue Table Card */}
      <div className="bg-surface-white rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        {/* Table header + filters */}
        <div className="p-md border-b border-border-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-md">
          <h3 className="font-headline-sm text-headline-sm text-on-background m-0">Patient Queue</h3>
          <div className="flex items-center gap-sm flex-wrap">
            {/* Status Tabs (Active, Completed, All) */}
            <div className="flex items-center gap-xs bg-surface-container rounded-lg p-[3px] border border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('active')
                  setCurrentPage(1)
                }}
                className={`px-sm py-xs font-label-md text-label-md rounded border-0 cursor-pointer transition-all ${
                  statusFilter === 'active'
                    ? 'bg-surface-white text-primary font-bold shadow-sm'
                    : 'bg-transparent text-secondary hover:text-on-surface'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('completed')
                  setCurrentPage(1)
                }}
                className={`px-sm py-xs font-label-md text-label-md rounded border-0 cursor-pointer transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-surface-white text-primary font-bold shadow-sm'
                    : 'bg-transparent text-secondary hover:text-on-surface'
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all')
                  setCurrentPage(1)
                }}
                className={`px-sm py-xs font-label-md text-label-md rounded border-0 cursor-pointer transition-all ${
                  statusFilter === 'all'
                    ? 'bg-surface-white text-primary font-bold shadow-sm'
                    : 'bg-transparent text-secondary hover:text-on-surface'
                }`}
              >
                All
              </button>
            </div>

            {/* Priority filter */}
            <div className="flex items-center gap-xs bg-surface-container px-sm py-1.5 rounded-lg border border-border-subtle h-[34px]">
              <span className="font-label-sm text-label-sm text-secondary whitespace-nowrap">Priority:</span>
              <select
                value={priorityFilter}
                onChange={handleFilterChange(setPriorityFilter as (v: never) => void)}
                className="bg-transparent border-none font-body-sm text-body-sm font-medium p-0 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">All Priority</option>
                <option value="emergency">Emergency</option>
                <option value="urgent">Urgent</option>
                <option value="non-urgent">Non-Urgent</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[30rem]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-surface-container-low sticky top-0 z-10 border-b border-border-subtle">
              <tr className="bg-surface-container-low">
                {['Patient Name', 'Patient #', 'Chief Complaint', 'Triage', 'Wait Time', 'Status', 'Vitals', 'Actions'].map(
                  (col, i) => (
                    <th
                      key={col}
                      className={`px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider ${
                        i === 7 ? 'text-right' : ''
                      }`}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-body-sm text-body-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-md py-xl text-center text-secondary font-body-sm">
                    No patients match the selected filters.
                  </td>
                </tr>
              ) : (
                paginated.map((entry) => {
                  const cfg = PRIORITY_CONFIG[entry.priority]

                  // Compute dynamic status configurations
                  let statusBadgeText = 'Waiting'
                  let statusBadgeClass = 'bg-primary/10 text-primary border-primary/30'
                  let btnLabel = 'Open Encounter'
                  let btnColorClass = cfg.buttonClass

                  if (entry.status === 'in_progress') {
                    const isResultsReady =
                      entry.visitStatus === 'results_ready' ||
                      (entry.pendingInvestigationsCount === 0 && (entry.completedInvestigationsCount ?? 0) > 0)

                    if (entry.visitStatus === 'awaiting_results' || isResultsReady) {
                      if (isResultsReady) {
                        statusBadgeText = 'Results Ready'
                        statusBadgeClass = 'bg-success/15 text-success border-success/30 font-bold animate-pulse'
                        btnLabel = 'Review Results'
                        btnColorClass = 'bg-success text-white hover:bg-success/90 shadow'
                      } else {
                        statusBadgeText = 'Awaiting Results'
                        statusBadgeClass = 'bg-purple-500/10 text-purple-600 border-purple-500/30'
                        btnLabel = 'Resume'
                        btnColorClass = 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                      }
                    } else {
                      statusBadgeText = 'In Progress'
                      statusBadgeClass = 'bg-warning/10 text-[#916a00] border-warning/30'
                      btnLabel = 'Resume'
                      btnColorClass = 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-sm'
                    }
                  } else if (entry.status === 'completed') {
                    statusBadgeText = 'Completed'
                    statusBadgeClass = 'bg-surface-container-highest text-secondary border-border-subtle'
                    btnLabel = 'View Summary'
                    btnColorClass = 'bg-transparent text-secondary border border-border-subtle hover:bg-surface-container'
                  }

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${cfg.rowClass}`}
                    >
                      <td className="px-md py-4 font-semibold text-on-background">{entry.name}</td>
                      <td className="px-md py-4 text-secondary">{entry.patientNumber}</td>
                      <td className="px-md py-4">{entry.chiefComplaint}</td>
                      <td className="px-md py-4">
                        <span className={`px-2 py-1 rounded font-label-md text-[11px] font-bold uppercase ${cfg.badge}`}>
                          {PRIORITY_LABEL[entry.priority]}
                        </span>
                      </td>
                      <td className={`px-md py-4 ${cfg.waitColor}`}>{entry.waitTime}</td>
                      <td className="px-md py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded font-label-md text-[11px] uppercase border ${statusBadgeClass}`}>
                          {statusBadgeText}
                        </span>
                      </td>
                      <td className="px-md py-4">
                        <VitalsCell vitals={entry.vitals} tooltip={entry.vitalsTooltip} />
                      </td>
                      <td className="px-md py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/consultation/encounter/${entry.id}`)}
                          className={`h-8 px-md rounded font-label-md text-label-md active:scale-95 transition-all border-0 cursor-pointer ${btnColorClass}`}
                        >
                          {btnLabel}
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
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPage={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  )
}
