import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { laboratoryService, type BackendTrackedSpecimenItem } from '@/api/services/laboratory'
import { UpdateSpecimenStatusModal } from '@/features/laboratory/components/UpdateSpecimenStatusModal'
import type { SpecimenSummary, SpecimenTrackingStatus, TrackedSpecimen } from '@/features/laboratory/types/laboratory'
import {
  computeSpecimenSummary,
  isSpecimenRejected,
  SPECIMEN_STATUS_PILL_CLASS,
  SPECIMEN_TRACKING_STATUS_LABEL,
} from '@/features/laboratory/utils/specimenStatus'

type StatusFilter = 'all' | SpecimenTrackingStatus

interface SpecimensLocationState {
  requestId?: string
  openModal?: boolean
}

const PAGE_SIZE = 10

function mapBackendToTrackedSpecimen(item: BackendTrackedSpecimenItem): TrackedSpecimen {
  let trackingStatus: SpecimenTrackingStatus = 'collected'
  if (item.status === 'received') trackingStatus = 'in_lab'
  else if (item.status === 'processing') trackingStatus = 'processing'
  else if (item.status === 'completed') trackingStatus = 'complete'
  else if (item.status === 'rejected') trackingStatus = 'rejected'
  else trackingStatus = 'collected'

  return {
    id: item.specimen_label || item.specimen_id.slice(0, 8).toUpperCase(),
    requestId: item.request_id,
    patientName: item.patient_name,
    patientNumber: item.patient_number,
    testName: item.test_name,
    collectedBy: item.collected_by_name || 'Lab Staff',
    collectedAt: item.collected_at
      ? new Date(item.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined,
    status: trackingStatus,
    location: item.collection_site || 'Main Lab',
    notes: item.rejection_reason ? `Rejection: ${item.rejection_reason}` : undefined,
    rejectionReason: item.rejection_reason as any,
  }
}

function SummaryCards({ summary }: { summary: SpecimenSummary }) {
  const cards = [
    { label: 'Awaiting Collection', value: summary.awaitingCollection, icon: 'pending_actions', color: 'text-warning' },
    { label: 'Collected', value: summary.collected, icon: 'biotech', color: 'text-[#00B8D9]' },
    { label: 'In Processing', value: summary.inProcessing, icon: 'settings_backup_restore', color: 'text-primary' },
    { label: 'Completed Today', value: summary.completedToday, icon: 'check_circle', color: 'text-success' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface-white border border-border-subtle rounded-xl p-md flex items-center justify-between hover:border-outline transition-colors"
        >
          <div>
            <p className="font-label-sm text-label-sm text-secondary mb-1 m-0">{card.label}</p>
            <p className="font-headline-lg text-headline-lg text-on-surface m-0 leading-none">{card.value}</p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg">
            <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function SpecimenStatusPill({ status }: { status: SpecimenTrackingStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] uppercase ${SPECIMEN_STATUS_PILL_CLASS[status]}`}
    >
      {SPECIMEN_TRACKING_STATUS_LABEL[status]}
    </span>
  )
}

function SpecimensSkeleton() {
  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-white border border-border-subtle rounded-xl p-md h-24 animate-pulse"
          />
        ))}
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-xl h-[400px] animate-pulse" />
    </div>
  )
}

function SpecimensEmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-md">
      <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-md">
        <span className="material-symbols-outlined text-[48px] text-secondary/40">inventory_2</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs m-0">No specimens found</h3>
      <p className="font-body-md text-body-md text-secondary text-center max-w-sm m-0">
        No specimens match your current filter criteria. Try adjusting the status filter.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-lg px-6 py-2 border border-border-subtle rounded-lg text-primary font-label-md hover:bg-surface-container-low transition-colors bg-transparent cursor-pointer"
      >
        Reset All Filters
      </button>
    </div>
  )
}

function matchesStatusFilter(status: SpecimenTrackingStatus, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  return status === filter
}

export function LabSpecimensContent() {
  const location = useLocation()
  const locationState = location.state as SpecimensLocationState | null

  const [loading, setLoading] = useState(true)
  const [specimens, setSpecimens] = useState<TrackedSpecimen[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeSpecimenId, setActiveSpecimenId] = useState<string | null>(null)
  const [modalSpecimen, setModalSpecimen] = useState<TrackedSpecimen | null>(null)

  const fetchSpecimens = async () => {
    setLoading(true)
    try {
      const items = await laboratoryService.getAllSpecimens()
      setSpecimens(items.map(mapBackendToTrackedSpecimen))
    } catch (err: any) {
      toast.error('Failed to load specimens from server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSpecimens()
  }, [])

  const summary = useMemo(() => computeSpecimenSummary(specimens), [specimens])

  const filteredSpecimens = useMemo(() => {
    return specimens.filter((specimen) => matchesStatusFilter(specimen.status, statusFilter))
  }, [specimens, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredSpecimens.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const visibleSpecimens = filteredSpecimens.slice(pageStart, pageStart + PAGE_SIZE)
  const showingFrom = filteredSpecimens.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + PAGE_SIZE, filteredSpecimens.length)

  useEffect(() => {
    if (!locationState?.requestId) return

    const match = specimens.find((s) => s.requestId === locationState.requestId)
    if (!match) return

    setActiveSpecimenId(locationState.requestId)

    if (locationState.openModal) {
      setModalSpecimen(match)
    }
  }, [locationState?.requestId, locationState?.openModal, specimens])

  useEffect(() => {
    if (!activeSpecimenId) return
    const index = filteredSpecimens.findIndex((s) => s.requestId === activeSpecimenId)
    if (index >= 0) {
      setCurrentPage(Math.floor(index / PAGE_SIZE) + 1)
    }
  }, [activeSpecimenId, filteredSpecimens])

  useEffect(() => {
    if (!activeSpecimenId) return
    const timeout = window.setTimeout(() => setActiveSpecimenId(null), 8000)
    return () => window.clearTimeout(timeout)
  }, [activeSpecimenId])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const handleSaveStatus = async (
    status: SpecimenTrackingStatus,
    extras: { notes?: string; rejectionReason?: any; location?: string },
  ) => {
    if (!modalSpecimen) return

    let apiStatus: 'received' | 'processing' | 'completed' | 'rejected' = 'received'
    if (status === 'in_lab') apiStatus = 'received'
    else if (status === 'processing') apiStatus = 'processing'
    else if (status === 'complete') apiStatus = 'completed'
    else if (status === 'rejected') apiStatus = 'rejected'
    else apiStatus = 'received'

    try {
      await laboratoryService.updateSpecimenStatus(modalSpecimen.requestId, {
        status: apiStatus,
        rejection_reason: status === 'rejected' ? (extras.rejectionReason || 'Sample rejected') : undefined,
      })
      toast.success(`Specimen status updated to ${SPECIMEN_TRACKING_STATUS_LABEL[status]}.`)
      setModalSpecimen(null)
      fetchSpecimens()
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err.message || 'Failed to update specimen status'
      toast.error(detail)
    }
  }


  const handleClearFilters = () => setStatusFilter('all')

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
        <SpecimensSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <SummaryCards summary={summary} />

      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="p-md border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-md bg-background/50">
          <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Specimen Log</h2>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="appearance-none bg-surface-white border border-border-subtle rounded-lg h-10 pl-sm pr-8 py-0 font-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:border-primary w-40 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {(Object.keys(SPECIMEN_TRACKING_STATUS_LABEL) as SpecimenTrackingStatus[]).map((status) => (
                <option key={status} value={status}>
                  {SPECIMEN_TRACKING_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-secondary pointer-events-none text-[18px]">
              expand_more
            </span>
          </div>
        </div>

        {filteredSpecimens.length === 0 ? (
          <SpecimensEmptyState onClearFilters={handleClearFilters} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-subtle text-secondary font-label-md text-label-md uppercase tracking-wider">
                  <th className="py-sm px-md font-semibold">Specimen ID</th>
                  <th className="py-sm px-md font-semibold">Patient Name</th>
                  <th className="py-sm px-md font-semibold">Patient #</th>
                  <th className="py-sm px-md font-semibold">Test Type</th>
                  <th className="py-sm px-md font-semibold">Collected By</th>
                  <th className="py-sm px-md font-semibold">Status</th>
                  <th className="py-sm px-md font-semibold">Location / Notes</th>
                  <th className="py-sm px-md font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-on-surface">
                {visibleSpecimens.map((specimen) => {
                  const isHighlighted = activeSpecimenId === specimen.requestId
                  const rejected = isSpecimenRejected(specimen)

                  return (
                    <tr
                      key={specimen.id}
                      className={`border-b border-border-subtle hover:bg-[#DEEBFF] transition-colors ${
                        isHighlighted ? 'bg-[#DEEBFF] ring-1 ring-inset ring-primary/30' : rejected ? 'bg-[#FFF4F4]' : 'bg-surface-white'
                      }`}
                    >
                      <td className="py-sm px-md font-medium text-primary">{specimen.id}</td>
                      <td className="py-sm px-md font-medium">{specimen.patientName}</td>
                      <td className="py-sm px-md text-secondary">{specimen.patientNumber}</td>
                      <td className="py-sm px-md">{specimen.testName}</td>
                      <td className="py-sm px-md">
                        {specimen.collectedBy ? (
                          <>
                            <p className="m-0">{specimen.collectedBy}</p>
                            {specimen.collectedAt && (
                              <p className="text-[11px] text-secondary m-0 mt-0.5">{specimen.collectedAt}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>
                      <td className="py-sm px-md">
                        <SpecimenStatusPill status={specimen.status} />
                      </td>
                      <td className="py-sm px-md">
                        <div className="flex flex-col gap-0.5">
                          <p className="m-0 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-secondary">location_on</span>
                            {specimen.location}
                          </p>
                          {specimen.notes && (
                            <p className="text-[11px] italic text-secondary m-0 line-clamp-1" title={specimen.notes}>
                              {specimen.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-sm px-md text-right">
                        <button
                          type="button"
                          onClick={() => setModalSpecimen(specimen)}
                          className="h-8 px-3 bg-primary hover:bg-primary-container text-white rounded font-label-md text-label-md cursor-pointer border-0 transition-colors"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredSpecimens.length > 0 && (
          <div className="p-sm px-md border-t border-border-subtle bg-surface-white flex flex-col sm:flex-row items-center justify-between gap-sm text-body-sm text-secondary">
            <span>
              Showing {showingFrom} to {showingTo} of {filteredSpecimens.length} entries
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
        )}
      </div>

      {modalSpecimen && (
        <UpdateSpecimenStatusModal
          specimen={modalSpecimen}
          onClose={() => setModalSpecimen(null)}
          onSave={handleSaveStatus}
        />
      )}
    </div>
  )
}
