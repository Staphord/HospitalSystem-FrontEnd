import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { formatShortDateTime, formatDoctorName } from '@/lib/localization'
import { laboratoryService, type BackendLabRequestItem } from '@/api/services/laboratory'
import { CollectSpecimenModal } from '@/features/laboratory/components/CollectSpecimenModal'
import { InvestigationPriorityBadge } from '@/features/laboratory/components/InvestigationPriorityBadge'
import type {
  LabRequestPriority,
  LabRequestStatus,
  SpecimenStatus,
} from '@/features/laboratory/types/laboratory'

type PriorityFilter = 'all' | LabRequestPriority
type StatusFilter = 'all' | LabRequestStatus

interface LabRequestsLocationState {
  highlightRequestId?: string
}

const PAGE_SIZE = 10

function SummaryCards({
  summary,
  onSelectStatusFilter,
  onSelectPriorityFilter,
}: {
  summary: { pending: number; stat: number; urgent: number; inProgress: number; completedToday: number }
  onSelectStatusFilter: (status: StatusFilter) => void
  onSelectPriorityFilter: (priority: PriorityFilter) => void
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-md">
      <div
        onClick={() => {
          onSelectStatusFilter('pending')
          onSelectPriorityFilter('all')
        }}
        className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md">Pending</span>
          <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-on-surface">{summary.pending}</span>
      </div>

      <div
        onClick={() => {
          onSelectPriorityFilter('stat')
          onSelectStatusFilter('all')
        }}
        className="bg-error/10 border border-error/30 rounded-lg p-md flex flex-col gap-xs relative overflow-hidden cursor-pointer hover:border-error transition-colors"
      >
        <div className="absolute right-0 top-0 w-16 h-16 bg-error rounded-bl-full opacity-10" />
        <div className="flex items-center justify-between text-error relative z-10">
          <span className="font-label-md text-label-md">STAT</span>
          <span className="material-symbols-outlined text-[20px] text-error">electric_bolt</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-error relative z-10">{summary.stat}</span>
      </div>

      <div
        onClick={() => {
          onSelectPriorityFilter('urgent')
          onSelectStatusFilter('all')
        }}
        className="bg-warning/10 border border-warning/30 rounded-lg p-md flex flex-col gap-xs relative overflow-hidden cursor-pointer hover:border-warning transition-colors"
      >
        <div className="absolute right-0 top-0 w-16 h-16 bg-warning rounded-bl-full opacity-10" />
        <div className="flex items-center justify-between text-[#916a00] relative z-10">
          <span className="font-label-md text-label-md">Urgent</span>
          <span className="material-symbols-outlined text-[20px]">priority_high</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-[#916a00] relative z-10">
          {summary.urgent}
        </span>
      </div>

      <div
        onClick={() => {
          onSelectStatusFilter('in_progress')
          onSelectPriorityFilter('all')
        }}
        className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md">In Progress</span>
          <span className="material-symbols-outlined text-[20px] text-primary">sync</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-on-surface">{summary.inProgress}</span>
      </div>

      <div
        onClick={() => {
          onSelectStatusFilter('completed')
          onSelectPriorityFilter('all')
        }}
        className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline transition-colors cursor-pointer col-span-2 lg:col-span-1"
      >
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
  const [pageSize, setPageSize] = useState(10)
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [collectingRequest, setCollectingRequest] = useState<BackendLabRequestItem | null>(null)

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
    const interval = setInterval(() => {
      fetchRequests()
    }, 15000)
    return () => clearInterval(interval)
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
      setCurrentPage(Math.floor(index / pageSize) + 1)
      setActiveRequestId(highlight)
    }

    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, location.pathname, filteredRequests, navigate, pageSize])

  useEffect(() => {
    if (!activeRequestId) return
    const timeout = window.setTimeout(() => setActiveRequestId(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [activeRequestId])

  useEffect(() => {
    setCurrentPage(1)
  }, [priorityFilter, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const visibleRequests = filteredRequests.slice(pageStart, pageStart + pageSize)
  const showingFrom = filteredRequests.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + pageSize, filteredRequests.length)
  const hasFilters = priorityFilter !== 'all' || statusFilter !== 'all'

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push('...')
      const start = Math.max(2, safePage - 1)
      const end = Math.min(totalPages - 1, safePage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const handleClearFilters = () => {
    setPriorityFilter('all')
    setStatusFilter('all')
    setSearchParams({})
  }

  const handleAction = (request: BackendLabRequestItem) => {
    const details = getActionButtonDetails(request)
    if (details.action === 'collect_specimen') {
      setCollectingRequest(request)
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
        <SummaryCards
          summary={summary}
          onSelectStatusFilter={(s) => {
            setStatusFilter(s)
            setSearchParams({ status: s })
          }}
          onSelectPriorityFilter={(p) => setPriorityFilter(p)}
        />
        <RequestsEmptyState onClearFilters={handleClearFilters} hasFilters={hasFilters} />
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <SummaryCards
        summary={summary}
        onSelectStatusFilter={(s) => {
          setStatusFilter(s)
          setSearchParams({ status: s })
        }}
        onSelectPriorityFilter={(p) => setPriorityFilter(p)}
      />

      <div className="bg-surface-white border border-border-subtle rounded-xl flex flex-col overflow-hidden">
        <div className="p-md border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-md bg-background/50">
          <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">
            {statusFilter === 'completed'
              ? 'Completed Test Requests'
              : statusFilter === 'pending'
                ? 'Pending Test Requests'
                : 'All Test Requests'}
          </h2>
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
                onChange={(e) => {
                  const val = e.target.value as StatusFilter
                  setStatusFilter(val)
                  setSearchParams(val === 'all' ? {} : { status: val })
                }}
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

        <div className="max-h-[580px] overflow-y-auto overflow-x-auto relative">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-surface-bright shadow-xs">
              <tr className="border-b border-border-subtle text-secondary font-label-md text-label-md">
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
                const rowClass = `border-b border-border-subtle hover:bg-[#DEEBFF] transition-colors ${isHighlighted ? 'bg-[#DEEBFF] ring-1 ring-inset ring-primary/30' : 'bg-surface-white'
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
                        <span className="font-medium text-on-surface">{formatDoctorName(req.requested_by_name)}</span>
                        <span className="text-body-xs">
                          {formatShortDateTime(req.requested_at)}
                        </span>
                      </div>
                    </td>
                    <td className="py-md px-md">
                      <SpecimenStatusCell status={specimenStatus} />
                    </td>
                    <td className="py-md px-md">
                      <span
                        className={`inline-flex items-center px-sm py-[2px] rounded-full text-label-sm font-label-sm capitalize ${req.status === 'completed'
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

        <div className="p-md border-t border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-md bg-surface-white font-body-sm text-secondary rounded-b-xl shadow-xs">
          <div className="flex flex-wrap items-center gap-md">
            <span>
              Showing <span className="font-semibold text-on-surface">{showingFrom}</span> to{' '}
              <span className="font-semibold text-on-surface">{showingTo}</span> of{' '}
              <span className="font-semibold text-on-surface">{filteredRequests.length}</span> requests
            </span>

            <div className="flex items-center gap-xs">
              <label htmlFor="req-rows-per-page" className="text-body-sm text-secondary font-medium">
                Rows per page:
              </label>
              <select
                id="req-rows-per-page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-8 px-2 border border-border-subtle rounded-md bg-surface-white font-body-sm text-on-surface cursor-pointer focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-xs">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 border border-border-subtle rounded-md text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed bg-surface-white cursor-pointer flex items-center justify-center transition-colors"
              title="Previous page"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) =>
                typeof page === 'number' ? (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-md font-label-md transition-colors cursor-pointer flex items-center justify-center ${page === safePage
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'bg-transparent text-on-surface hover:bg-surface-container border border-transparent'
                      }`}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={`ellipsis-${idx}`} className="px-1 text-secondary font-label-md">
                    ...
                  </span>
                )
              )}
            </div>

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 border border-border-subtle rounded-md text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed bg-surface-white cursor-pointer flex items-center justify-center transition-colors"
              title="Next page"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {collectingRequest && (
        <CollectSpecimenModal
          requestId={collectingRequest.request_id}
          patientName={collectingRequest.patient_name}
          testName={collectingRequest.test_name}
          onClose={() => setCollectingRequest(null)}
          onSuccess={fetchRequests}
        />
      )}
    </div>
  )
}

