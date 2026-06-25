import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { LAB_REQUEST_SUMMARY } from '@/features/laboratory/data/mockLabRequests'
import { InvestigationPriorityBadge } from '@/features/laboratory/components/InvestigationPriorityBadge'
import type {
  LabRequestPriority,
  LabRequestStatus,
  LabTestRequest,
  SpecimenStatus,
} from '@/features/laboratory/types/laboratory'
import {
  getRowAction,
  getRowActionButtonClass,
  getRowActionLabel,
} from '@/features/laboratory/utils/labRequestActions'
import { getPriorityRowHighlight } from '@/features/laboratory/utils/labOrderPriority'
import { getAllLabRequests } from '@/features/laboratory/utils/labRequestStore'

type PriorityFilter = 'all' | LabRequestPriority
type StatusFilter = 'all' | LabRequestStatus

interface LabRequestsLocationState {
  highlightRequestId?: string
}

const PAGE_SIZE = 10

function SummaryCards({ summary }: { summary: typeof LAB_REQUEST_SUMMARY }) {
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

function RequestActionsCell({
  request,
  onAction,
}: {
  request: LabTestRequest
  onAction: (request: LabTestRequest) => void
}) {
  const action = getRowAction(request)

  return (
    <div className="flex items-center justify-end">
      <button
        type="button"
        onClick={() => onAction(request)}
        className={`h-8 px-4 rounded font-label-md text-label-md cursor-pointer whitespace-nowrap transition-colors ${getRowActionButtonClass(request)}`}
      >
        {getRowActionLabel(action)}
      </button>
    </div>
  )
}

function matchesPriorityFilter(priority: LabRequestPriority, filter: PriorityFilter): boolean {
  if (filter === 'all') return true
  return priority === filter
}

function matchesStatusFilter(status: LabRequestStatus, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  return status === filter
}

function getRowClass(request: LabTestRequest, isHighlighted: boolean): string {
  const base = 'border-b border-border-subtle hover:bg-[#DEEBFF] transition-colors'
  if (isHighlighted) return `${base} bg-[#DEEBFF] ring-1 ring-inset ring-primary/30`
  const highlight = getPriorityRowHighlight(request.priority)
  if (highlight) return `${base} ${highlight}`
  return `${base} bg-surface-white`
}

export function LabRequestsContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    () => (searchParams.get('status') as StatusFilter) || 'all',
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 500)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    setRefreshKey((k) => k + 1)
  }, [location.pathname])

  const allRequests = useMemo(() => getAllLabRequests(), [refreshKey])

  const filteredRequests = useMemo(() => {
    return allRequests.filter((request) => {
      const priorityMatch = matchesPriorityFilter(request.priority, priorityFilter)
      const statusMatch = matchesStatusFilter(request.status, statusFilter)
      return priorityMatch && statusMatch
    })
  }, [allRequests, priorityFilter, statusFilter])

  useEffect(() => {
    const highlight = (location.state as LabRequestsLocationState | null)?.highlightRequestId
    if (!highlight) return

    const index = filteredRequests.findIndex((request) => request.id === highlight)
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

  const handleAction = (request: LabTestRequest) => {
    const action = getRowAction(request)
    if (action === 'collect_specimen') {
      navigate('/laboratory/specimens', { state: { requestId: request.id, openModal: true } })
    } else {
      navigate(`/laboratory/requests/${request.id}`)
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
      <SummaryCards summary={LAB_REQUEST_SUMMARY} />

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
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  const value = e.target.value as StatusFilter
                  setStatusFilter(value)
                  if (value === 'all') {
                    setSearchParams({})
                  } else {
                    setSearchParams({ status: value })
                  }
                }}
                className="appearance-none bg-surface-white border border-border-subtle rounded-lg h-10 pl-sm pr-8 py-0 font-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary w-32 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
                expand_more
              </span>
            </div>
            <button
              type="button"
              className="bg-surface-white border border-border-subtle rounded-lg h-10 px-sm flex items-center gap-sm font-body-sm text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">calendar_today</span>
              Today
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-secondary font-label-md text-label-md uppercase tracking-wider">
                <th className="py-sm px-md font-semibold">Patient Name</th>
                <th className="py-sm px-md font-semibold">Patient #</th>
                <th className="py-sm px-md font-semibold">Test Name</th>
                <th className="py-sm px-md font-semibold">Requested By</th>
                <th className="py-sm px-md font-semibold">Requested At</th>
                <th className="py-sm px-md font-semibold">Priority</th>
                <th className="py-sm px-md font-semibold">Specimen Status</th>
                <th className="py-sm px-md font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-on-surface">
              {visibleRequests.map((request) => (
                <tr
                  key={request.id}
                  className={getRowClass(request, activeRequestId === request.id)}
                >
                  <td className="py-sm px-md font-medium text-on-surface">{request.patientName}</td>
                  <td className="py-sm px-md text-secondary">{request.patientNumber}</td>
                  <td className="py-sm px-md font-medium">{request.testName}</td>
                  <td className="py-sm px-md">{request.requestedBy}</td>
                  <td className="py-sm px-md text-secondary">{request.requestedAt}</td>
                  <td className="py-sm px-md">
                    <InvestigationPriorityBadge priority={request.priority} />
                  </td>
                  <td className="py-sm px-md">
                    <SpecimenStatusCell status={request.specimenStatus} />
                  </td>
                  <td className="py-sm px-md text-right">
                    <RequestActionsCell request={request} onAction={handleAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-sm px-md border-t border-border-subtle bg-surface-white flex flex-col sm:flex-row items-center justify-between gap-sm text-body-sm text-secondary">
          <span>
            Showing {showingFrom} to {showingTo} of {filteredRequests.length} entries
          </span>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1 rounded hover:bg-surface-variant disabled:opacity-50 border-0 bg-transparent cursor-pointer disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded font-medium border-0 cursor-pointer ${
                  page === safePage
                    ? 'bg-primary-container text-white'
                    : 'hover:bg-surface-variant text-on-surface bg-transparent'
                }`}
              >
                {page}
              </button>
            ))}
            {totalPages > 3 && <span className="px-1 text-secondary">…</span>}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1 rounded hover:bg-surface-variant disabled:opacity-50 border-0 bg-transparent cursor-pointer disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
