import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { IMAGING_REQUEST_SUMMARY } from '@/features/radiology/data/mockImagingRequests'
import { ImagingRequestsTable } from '@/features/radiology/components/ImagingRequestsTable'
import type { ImagingModality, ImagingRequest, ImagingRequestStatus } from '@/features/radiology/types/radiology'
import type { ImagingRequestSecondaryAction } from '@/features/radiology/utils/imagingRequestUtils'
import {
  matchesModalityFilter,
  matchesSearchQuery,
  matchesStatusFilter,
} from '@/features/radiology/utils/imagingRequestUtils'
import { getAllImagingRequests, patchImagingRequest } from '@/features/radiology/utils/imagingRequestStore'

type ModalityFilter = ImagingModality | 'all'
type StatusFilter = ImagingRequestStatus | 'all'

const PAGE_SIZE = 5
const TOTAL_REQUEST_COUNT = 29

function SummaryCards() {
  const { newRequests, scheduled, inProgress, completedToday } = IMAGING_REQUEST_SUMMARY

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary">New Requests</span>
          <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{newRequests}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary">Scheduled</span>
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{scheduled}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary">In Progress</span>
          <span className="material-symbols-outlined text-[20px] text-primary">sync</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{inProgress}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary">Completed Today</span>
          <span className="material-symbols-outlined text-[20px] text-success">check_circle</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{completedToday}</span>
      </div>
    </div>
  )
}

function RequestsSkeleton() {
  return (
    <div className="w-full">
      <div className="bg-background h-10 w-full mb-px animate-pulse rounded" />
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-lg flex gap-4">
            <div className="h-6 w-1/4 rounded bg-surface-container animate-pulse" />
            <div className="h-6 w-1/6 rounded bg-surface-container animate-pulse" />
            <div className="h-6 w-1/6 rounded bg-surface-container animate-pulse" />
            <div className="h-6 w-1/4 rounded bg-surface-container animate-pulse" />
            <div className="h-6 w-12 ml-auto rounded bg-surface-container animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RequestsEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center text-outline">
        <span className="material-symbols-outlined text-5xl">search_off</span>
      </div>
      <div>
        <p className="text-headline-sm font-headline-sm text-on-background m-0">No imaging requests found</p>
        <p className="text-body-sm text-secondary m-0 mt-1">Try adjusting your filters or search terms.</p>
      </div>
      <button
        type="button"
        onClick={onClearFilters}
        className="text-primary text-label-md font-label-md hover:underline bg-transparent border-0 cursor-pointer"
      >
        Clear all filters
      </button>
    </div>
  )
}

export function ImagingRequestsContent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  // tick forces re-render after store mutations (e.g. returning from report page)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 400)
    return () => window.clearTimeout(timer)
  }, [])

  // Refresh the list whenever the user navigates back to this page
  useEffect(() => {
    setTick((t) => t + 1)
  }, [])

  const allRequests = useMemo(() => getAllImagingRequests(), [tick])

  const filteredRequests = useMemo(() => {
    return allRequests.filter((request) => {
      const modalityMatch = matchesModalityFilter(request.modality, modalityFilter)
      const statusMatch = matchesStatusFilter(request.status, statusFilter)
      const searchMatch = matchesSearchQuery(request, searchQuery)
      const dateMatch = !dateFilter || request.requestedDate === dateFilter
      return modalityMatch && statusMatch && searchMatch && dateMatch
    })
  }, [allRequests, modalityFilter, statusFilter, searchQuery, dateFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [modalityFilter, statusFilter, searchQuery, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const visibleRequests = filteredRequests.slice(pageStart, pageStart + PAGE_SIZE)
  const hasFilters =
    modalityFilter !== 'all' || statusFilter !== 'all' || !!dateFilter || !!searchQuery.trim()

  const handleClearFilters = () => {
    setModalityFilter('all')
    setStatusFilter('all')
    setDateFilter('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  const handleSecondaryAction = (
    request: ImagingRequest,
    action: ImagingRequestSecondaryAction,
  ) => {
    switch (action) {
      case 'enter-report':
        patchImagingRequest(request.id, { status: 'in-progress' })
        setTick((t) => t + 1)
        navigate(`/radiology/requests/${request.id}/report`)
        break
      case 'view-record':
        navigate(`/radiology/requests/${request.id}/report`)
        break
      case 'schedule':
        navigate(`/radiology/schedule?prefill=${request.id}`)
        break
      case 'reschedule':
        navigate(`/radiology/schedule?prefill=${request.id}`)
        break
      case 'cancel-request':
      case 'cancel-appointment':
        patchImagingRequest(request.id, { status: 'requested' })
        setTick((t) => t + 1)
        toast.error(`Request for ${request.patientName} has been cancelled.`)
        break
      case 'put-on-hold':
        patchImagingRequest(request.id, { status: 'scheduled' })
        setTick((t) => t + 1)
        toast.info(`${request.patientName}'s request put on hold.`)
        break
      case 'amend-report':
        patchImagingRequest(request.id, { status: 'in-progress' })
        setTick((t) => t + 1)
        navigate(`/radiology/requests/${request.id}/report`)
        break
      case 'print-report':
        toast.success(`Preparing report for ${request.patientName} to print / download…`)
        break
      default:
        break
    }
  }

  const handleExport = () => {
    toast.success('Exporting imaging requests list…')
  }

  const displayTotal = hasFilters ? filteredRequests.length : TOTAL_REQUEST_COUNT

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <div className="flex justify-between items-end">
        <p className="text-body-sm text-secondary m-0">Manage and monitor pending radiology orders</p>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-border-subtle bg-white rounded-lg text-label-md font-label-md hover:bg-background transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">file_download</span>
          Export List
        </button>
      </div>

      <SummaryCards />

      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden flex flex-col">
        <div className="px-lg py-md flex flex-col xl:flex-row xl:items-center justify-between gap-md">
          <h4 className="text-headline-sm font-headline-sm text-on-background m-0">All Imaging Requests</h4>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-surface-container rounded-lg border border-border-subtle text-body-sm w-56 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Search patients or requests..."
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-label-sm text-secondary" htmlFor="modality-filter">
                Modality:
              </label>
              <select
                id="modality-filter"
                value={modalityFilter}
                onChange={(e) => setModalityFilter(e.target.value as ModalityFilter)}
                className="text-body-sm border border-border-subtle rounded-lg px-3 py-1.5 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="all">All Modalities</option>
                <option value="x-ray">X-Ray</option>
                <option value="ct-scan">CT Scan</option>
                <option value="mri">MRI</option>
                <option value="ultrasound">Ultrasound</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-label-sm text-secondary" htmlFor="status-filter">
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="text-body-sm border border-border-subtle rounded-lg px-3 py-1.5 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="all">Any Status</option>
                <option value="requested">Requested</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-label-sm text-secondary" htmlFor="date-filter">
                Date:
              </label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-body-sm border border-border-subtle rounded-lg px-3 py-1.5 focus:ring-primary focus:border-primary bg-white"
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border-subtle" />

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <RequestsSkeleton />
          ) : visibleRequests.length === 0 ? (
            <RequestsEmptyState onClearFilters={handleClearFilters} />
          ) : (
            <ImagingRequestsTable
              requests={visibleRequests}
              onSecondaryAction={handleSecondaryAction}
            />
          )}
        </div>

        {!loading && visibleRequests.length > 0 && (
          <div className="px-lg py-md border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-sm">
            <p className="text-body-sm text-secondary m-0">
              Showing {visibleRequests.length} of {displayTotal} requests
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1 border border-border-subtle rounded hover:bg-background disabled:opacity-50 bg-white cursor-pointer disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center text-label-sm rounded border-0 cursor-pointer ${
                    page === safePage
                      ? 'bg-primary-container text-white'
                      : 'hover:bg-background text-on-background bg-transparent'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1 border border-border-subtle rounded hover:bg-background disabled:opacity-50 bg-white cursor-pointer disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
