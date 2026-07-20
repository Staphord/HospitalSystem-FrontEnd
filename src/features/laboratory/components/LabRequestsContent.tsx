import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { laboratoryService, type BackendLabRequestItem } from '@/api/services/laboratory'
import { InvestigationPriorityBadge } from '@/features/laboratory/components/InvestigationPriorityBadge'
import type {
  LabRequestPriority,
  LabRequestStatus,
  SpecimenStatus,
} from '@/features/laboratory/types/laboratory'
import { getPriorityRowHighlight } from '@/features/laboratory/utils/labOrderPriority'

type PriorityFilter = 'all' | LabRequestPriority
type StatusFilter = 'all' | LabRequestStatus

interface LabRequestsLocationState {
  highlightRequestId?: string
}

const PAGE_SIZE = 10

function SummaryCards({
  summary,
}: {
  summary: { pending: number; stat: number; urgent: number; inProgress: number; completedToday: number }
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-md">
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md">Pending</span>
          <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-on-surface">{summary.pending}</span>
      </div>
      <div className="bg-error/10 border border-error/30 rounded-lg p-md flex flex-col gap-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-16 h-16 bg-error rounded-bl-full opacity-10" />
        <div className="flex items-center justify-between text-error relative z-10">
          <span className="font-label-md text-label-md">STAT</span>
          <span className="material-symbols-outlined text-[20px] text-error">electric_bolt</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-error relative z-10">{summary.stat}</span>
      </div>
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-md flex flex-col gap-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-16 h-16 bg-warning rounded-bl-full opacity-10" />
        <div className="flex items-center justify-between text-[#916a00] relative z-10">
          <span className="font-label-md text-label-md">Urgent</span>
          <span className="material-symbols-outlined text-[20px]">priority_high</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-[#916a00] relative z-10">
          {summary.urgent}
        </span>
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md">In Progress</span>
          <span className="material-symbols-outlined text-[20px] text-primary">sync</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-on-surface">{summary.inProgress}</span>
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline transition-colors col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md">Completed Today</span>
          <span className="material-symbols-outlined text-[20px] text-success">check_circle</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-on-surface">{summary.completedToday}</span>
      </div>
    </div>
  )
}

function SpecimenStatusCell({ status }: { status: SpecimenStatus }) {
  if (status === 'collected') {
    return (
      <div className="flex items-center gap-1.5 text-[#00B8D9]">
        <div className="w-2 h-2 rounded-full bg-[#00B8D9]" />
        <span className="font-medium">Collected</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-warning">
      <div className="w-2 h-2 rounded-full bg-warning border border-warning" />
      <span className="font-medium">Not Collected</span>
    </div>
  )
}

function RequestsSkeleton() {
  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-md">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-white border border-border-subtle rounded-lg p-md h-24 animate-pulse"
          />
        ))}
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-xl h-[400px] animate-pulse" />
    </div>
  )
}

function RequestsEmptyState({ onClearFilters, hasFilters }: { onClearFilters: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-md opacity-70 grayscale">
        {['Pending', 'STAT', 'Urgent', 'In Progress', 'Completed Today'].map((label) => (
          <div
            key={label}
            className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs"
          >
            <div className="flex justify-between text-on-surface-variant">
              <span className="font-label-md">{label}</span>
              <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
            </div>
            <span className="font-headline-lg">0</span>
          </div>
        ))}
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-xl flex flex-col overflow-hidden min-h-[400px]">
        <div className="p-md border-b border-border-subtle bg-background/50">
          <h2 className="font-headline-sm text-on-surface m-0">All Test Requests</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-xl text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-md">
            <span className="material-symbols-outlined text-[40px] text-secondary">biotech</span>
          </div>
          <h3 className="font-headline-sm text-on-surface mb-xs m-0">No test requests found</h3>
          <p className="text-body-md text-secondary max-w-sm m-0">
            Test requests appear here when clinicians order investigations.
            {hasFilters ? ' Try adjusting your filters.' : ' Check back later for new orders.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-lg h-10 px-md border border-border-subtle rounded-lg text-secondary font-label-md hover:bg-surface-container-high bg-transparent cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function getActionButtonDetails(req: BackendLabRequestItem) {
  if (req.status === 'pending') {
    return {
      label: 'Collect Specimen',
      btnClass: 'bg-primary text-on-primary hover:bg-primary-hover',
      action: 'collect_specimen',
    }
  }
  if (req.status === 'specimen_collected' || req.status === 'in_progress') {
    return {
      label: 'Enter Results',
      btnClass: 'bg-secondary-container text-on-secondary-container hover:bg-surface-container-high border border-border-subtle',
      action: 'enter_results',
    }
  }
  return {
    label: 'View Results',
    btnClass: 'bg-surface-container text-on-surface hover:bg-surface-container-high border border-border-subtle',
    action: 'view_results',
  }
}

export function LabRequestsContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<BackendLabRequestItem[]>([])
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    () => (searchParams.get('status') as StatusFilter) || 'all',
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await laboratoryService.getRequests()
      setRequests(data)
    } catch (err: any) {
      toast.error('Failed to load lab requests from server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [location.pathname])

  const summary = useMemo(() => {
    let pending = 0
    let stat = 0
    let urgent = 0
    let inProgress = 0
    let completedToday = 0

    requests.forEach((r) => {
      if (r.status === 'pending') pending++
      if (r.urgency === 'stat') stat++
      if (r.urgency === 'urgent') urgent++
      if (r.status === 'in_progress' || r.status === 'specimen_collected') inProgress++
      if (r.status === 'completed') completedToday++
    })

    return { pending, stat, urgent, inProgress, completedToday }
  }, [requests])

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const priorityMatch = priorityFilter === 'all' || r.urgency === priorityFilter
      const statusMatch = statusFilter === 'all' || r.status === statusFilter
      return priorityMatch && statusMatch
    })
  }, [requests, priorityFilter, statusFilter])

  useEffect(() => {
    const highlight = (location.state as LabRequestsLocationState | null)?.highlightRequestId
    if (!highlight) return

    const index = filteredRequests.findIndex((r) => r.request_id === highlight)
    if (index >= 0) {
      setCurrentPage(Math.floor(index / PAGE_SIZE) + 1)
      setActiveRequestId(highlight)
    }

    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, location.pathname, filteredRequests, navigate])

  useEffect(() => {
    if (!activeRequestId) return
    const timeout = window.setTimeout(() => setActiveRequestId(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [activeRequestId])

  useEffect(() => {
    setCurrentPage(1)
  }, [priorityFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const visibleRequests = filteredRequests.slice(pageStart, pageStart + PAGE_SIZE)
  const showingFrom = filteredRequests.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + PAGE_SIZE, filteredRequests.length)
  const hasFilters = priorityFilter !== 'all' || statusFilter !== 'all'

  const handleClearFilters = () => {
    setPriorityFilter('all')
    setStatusFilter('all')
    setSearchParams({})
  }

  const handleAction = (request: BackendLabRequestItem) => {
    const details = getActionButtonDetails(request)
    if (details.action === 'collect_specimen') {
      navigate('/laboratory/specimens', { state: { requestId: request.request_id, openModal: true } })
    } else {
      navigate(`/laboratory/requests/${request.request_id}`)
    }
  }

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
        <RequestsSkeleton />
      </div>
    )
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
        <RequestsEmptyState onClearFilters={handleClearFilters} hasFilters={hasFilters} />
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <SummaryCards summary={summary} />

      <div className="bg-surface-white border border-border-subtle rounded-xl flex flex-col overflow-hidden">
        <div className="p-md border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-md bg-background/50">
          <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">All Test Requests</h2>
          <div className="flex flex-wrap items-center gap-sm">
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="appearance-none bg-surface-white border border-border-subtle rounded-lg h-10 pl-sm pr-8 py-0 font-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary w-32 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="stat">STAT Only</option>
                <option value="urgent">Urgent</option>
                <option value="routine">Routine</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2.5 text-secondary pointer-events-none text-[20px]">
                expand_more
              </span>
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none bg-surface-white border border-border-subtle rounded-lg h-10 pl-sm pr-8 py-0 font-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary w-36 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2.5 text-secondary pointer-events-none text-[20px]">
                expand_more
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container/30 text-secondary font-label-md text-label-md">
                <th className="py-md px-md w-28">Urgency</th>
                <th className="py-md px-md">Patient</th>
                <th className="py-md px-md">Investigation Test</th>
                <th className="py-md px-md">Requested By</th>
                <th className="py-md px-md">Specimen</th>
                <th className="py-md px-md">Status</th>
                <th className="py-md px-md text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-body-md font-body-md text-on-surface">
              {visibleRequests.map((req) => {
                const isHighlighted = req.request_id === activeRequestId
                const rowClass = `border-b border-border-subtle hover:bg-[#DEEBFF] transition-colors ${
                  isHighlighted ? 'bg-[#DEEBFF] ring-1 ring-inset ring-primary/30' : 'bg-surface-white'
                }`
                const specimenStatus: SpecimenStatus = req.status === 'pending' ? 'not_collected' : 'collected'
                const actionDetails = getActionButtonDetails(req)

                return (
                  <tr key={req.request_id} className={rowClass}>
                    <td className="py-md px-md">
                      <InvestigationPriorityBadge priority={req.urgency as any} />
                    </td>
                    <td className="py-md px-md">
                      <div className="flex flex-col">
                        <span className="font-headline-sm text-headline-sm text-on-surface">
                          {req.patient_name}
                        </span>
                        <span className="font-body-xs text-body-xs text-secondary">
                          {req.patient_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-md px-md font-medium text-on-surface">
                      <div>{req.test_name}</div>
                      {req.test_code && (
                        <div className="text-body-xs text-secondary font-mono">{req.test_code}</div>
                      )}
                    </td>
                    <td className="py-md px-md text-secondary">
                      <div className="flex flex-col">
                        <span className="font-medium text-on-surface">{req.requested_by_name || 'Doctor'}</span>
                        <span className="text-body-xs">
                          {req.requested_at ? new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                        </span>
                      </div>
                    </td>
                    <td className="py-md px-md">
                      <SpecimenStatusCell status={specimenStatus} />
                    </td>
                    <td className="py-md px-md">
                      <span
                        className={`inline-flex items-center px-sm py-[2px] rounded-full text-label-sm font-label-sm capitalize ${
                          req.status === 'completed'
                            ? 'bg-success/10 text-success border border-success/30'
                            : req.status === 'in_progress' || req.status === 'specimen_collected'
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'bg-warning/10 text-warning border border-warning/30'
                        }`}
                      >
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-md px-md text-right">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleAction(req)}
                          className={`h-8 px-4 rounded font-label-md text-label-md cursor-pointer whitespace-nowrap transition-colors ${actionDetails.btnClass}`}
                        >
                          {actionDetails.label}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-md border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-md bg-background/50 font-body-sm text-secondary">
          <div>
            Showing <span className="font-medium text-on-surface">{showingFrom}</span> to{' '}
            <span className="font-medium text-on-surface">{showingTo}</span> of{' '}
            <span className="font-medium text-on-surface">{filteredRequests.length}</span> requests
          </div>

          <div className="flex items-center gap-xs">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-sm border border-border-subtle rounded-md text-secondary hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed bg-surface-white cursor-pointer font-label-sm"
            >
              Previous
            </button>
            <span className="px-sm font-label-sm">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-sm border border-border-subtle rounded-md text-secondary hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed bg-surface-white cursor-pointer font-label-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
