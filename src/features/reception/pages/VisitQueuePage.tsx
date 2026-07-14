import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { receptionService } from '@/api/services/reception'
import type { QueueWorklistItem, BackendPatient } from '@/api/types/reception'

interface QueueItem {
  pos: number
  name: string
  id: string          // patient_number for display
  patientId?: string  // patient UUID
  queueId: string     // actual queue_id from backend
  time: string
  wait: string
  waitColor: string
  payment: string
  status: 'WAITING' | 'IN TRIAGE' | 'WITH DOCTOR' | 'COMPLETE' | 'SKIPPED'
  statusBg: string
  statusText: string
  _waitMinutes: number
}

const KPI_CARD =
  'bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between h-full'
const KPI_LABEL = 'text-outline font-label-md uppercase tracking-wider mb-1'
const KPI_VALUE = 'font-headline-md text-[28px] text-on-surface m-0'
const TH_CLASS =
  'py-md px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-border-subtle'
const TD_MUTED = 'py-md px-md font-body-sm text-body-sm text-on-surface-variant'
const TOOLBAR_BTN =
  'flex items-center gap-xs px-sm py-xs text-body-sm font-medium text-secondary hover:bg-surface-container transition-colors rounded border-0 bg-transparent cursor-pointer'
const STATUS_BADGE =
  'inline-flex items-center px-sm py-xs rounded-full font-label-md text-label-md font-bold'

// ── KPI helpers ─────────────────────────────────────────────────────────────

function waitMinutes(createdAt: string, completedAt?: string | null): number {
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  return Math.floor((end - new Date(createdAt).getTime()) / 60000)
}

function computeKpis(items: QueueItem[]) {
  const active = items.filter((i) => i.status !== 'COMPLETE' && i.status !== 'SKIPPED')
  if (active.length === 0) return { avg: 0, longest: 0 }
  const waits = active.map((i) => i._waitMinutes)
  const avg = Math.round(waits.reduce((a, b) => a + b, 0) / waits.length)
  const longest = Math.max(...waits)
  return { avg, longest }
}

function formatWait(mins: number): string {
  if (mins <= 0) return '--'
  return `${mins} min`
}

function mapStatus(backendStatus: string): QueueItem['status'] {
  switch (backendStatus?.toLowerCase()) {
    case 'in_progress': return 'IN TRIAGE'
    case 'completed':   return 'COMPLETE'
    case 'skipped':     return 'SKIPPED'
    default:            return 'WAITING'
  }
}

function statusStyles(status: QueueItem['status']): { statusBg: string; statusText: string } {
  switch (status) {
    case 'WAITING':     return { statusBg: 'bg-warning/10',           statusText: 'text-warning' }
    case 'IN TRIAGE':   return { statusBg: 'bg-info/10',              statusText: 'text-info' }
    case 'WITH DOCTOR': return { statusBg: 'bg-success/10',           statusText: 'text-success' }
    case 'COMPLETE':    return { statusBg: 'bg-surface-container-high', statusText: 'text-on-surface-variant' }
    case 'SKIPPED':     return { statusBg: 'bg-error/10',             statusText: 'text-error' }
  }
}

function toQueueItem(entry: QueueWorklistItem, pos: number): QueueItem {
  const mins = waitMinutes(entry.created_at, entry.completed_at)
  const status = mapStatus(entry.status)
  const { statusBg, statusText } = statusStyles(status)
  const dateObj = new Date(entry.created_at)
  const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const timeStr = `${dateStr}, ${timeFormatted}`
  const waitColor = mins > 30 ? 'text-error' : mins > 15 ? 'text-warning' : 'text-success'

  return {
    pos,
    name: entry.patient.full_name,
    id: entry.patient.patient_number,
    patientId: entry.patient.patient_id,
    queueId: entry.queue_id,
    time: timeStr,
    wait: formatWait(mins),
    waitColor,
    payment: entry.visit?.payment_type
      ? entry.visit.payment_type.charAt(0).toUpperCase() + entry.visit.payment_type.slice(1)
      : 'Cash',
    status,
    statusBg,
    statusText,
    _waitMinutes: mins,
  }
}



function QueueViewModal({ item, onClose }: { item: QueueItem; onClose: () => void }) {
  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!item.patientId) return
    const loadPatient = async () => {
      setLoading(true)
      try {
        const data = await receptionService.getPatient(item.patientId!)
        setPatient(data)
      } catch (err) {
        console.error('Failed to load patient details in queue modal', err)
      } finally {
        setLoading(false)
      }
    }
    void loadPatient()
  }, [item.patientId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-lg w-full max-w-[500px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-view-title"
      >
        <div className="p-lg border-b border-border-subtle flex justify-between items-center bg-surface-bright">
          <h2 id="queue-view-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Queue &amp; Patient Record
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container border-0 bg-transparent cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-lg max-h-[75vh] overflow-y-auto space-y-md">
          {/* Queue entry details */}
          <div>
            <h3 className="font-title-sm text-title-sm font-semibold text-primary m-0 mb-sm">Queue Details</h3>
            <div className="grid grid-cols-2 gap-sm bg-surface-container-low p-md rounded-lg border border-border-subtle">
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Position</p>
                <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">#{item.pos}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Triage Status</p>
                <span className={`${STATUS_BADGE} ${item.statusBg} ${item.statusText}`}>{item.status}</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Patient Name</p>
                <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{item.name}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Patient #</p>
                <p className="font-body-sm text-body-sm text-on-surface m-0">{item.id}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Registered At</p>
                <p className="font-body-sm text-body-sm text-on-surface m-0">{item.time}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Wait Time</p>
                <p className={`font-body-sm text-body-sm font-semibold m-0 ${item.waitColor}`}>{item.wait}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Payment Type</p>
                <p className="font-body-sm text-body-sm text-on-surface m-0">{item.payment}</p>
              </div>
            </div>
          </div>

          {/* Patient demographic details */}
          <div>
            <h3 className="font-title-sm text-title-sm font-semibold text-primary m-0 mb-sm">Patient Demographics</h3>
            {loading ? (
              <div className="p-lg bg-surface-bright border border-border-subtle rounded-lg flex items-center justify-center min-h-[140px]">
                <span className="material-symbols-outlined text-[32px] text-primary animate-spin">progress_activity</span>
              </div>
            ) : patient ? (
              <div className="grid grid-cols-2 gap-sm bg-surface-bright border border-border-subtle p-md rounded-lg">
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Identification No</p>
                  <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.national_id ?? '—'}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Phone Number</p>
                  <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.phone_primary ?? '—'}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Gender</p>
                  <p className="font-body-sm text-body-sm text-on-surface m-0" style={{ textTransform: 'capitalize' }}>{patient.gender}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Date of Birth</p>
                  <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.date_of_birth}</p>
                </div>
                {patient.email && (
                  <div className="col-span-2">
                    <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Email</p>
                    <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.email}</p>
                  </div>
                )}
                {patient.next_of_kin_name && (
                  <>
                    <div className="mt-xs pt-xs border-t border-border-subtle/50">
                      <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Next of Kin</p>
                      <p className="font-body-sm text-body-sm text-on-surface m-0 font-medium">
                        {patient.next_of_kin_name} ({patient.next_of_kin_relationship ?? '—'})
                      </p>
                    </div>
                    <div className="mt-xs pt-xs border-t border-border-subtle/50">
                      <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Kin Contact</p>
                      <p className="font-body-sm text-body-sm text-on-surface m-0 font-medium">
                        {patient.next_of_kin_phone ?? '—'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-md text-center font-body-sm text-secondary bg-surface-bright border border-border-subtle rounded-lg">
                Patient record details unavailable.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function QueueActionsMenu({
  item,
  openMenuId,
  onOpenChange,
  onView,
  onRemove,
}: {
  item: QueueItem
  openMenuId: string | null
  onOpenChange: (id: string | null) => void
  onView: () => void
  onRemove: () => void
}) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const isOpen = openMenuId === item.queueId
  const isInactive = item.status === 'COMPLETE' || item.status === 'SKIPPED'

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onOpenChange])

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isOpen) {
      onOpenChange(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 4, left: rect.right - 180 })
    onOpenChange(item.queueId)
  }

  const menuItemClass =
    'w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-left bg-transparent border-0 cursor-pointer hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent'

  return (
    <>
      <button
        type="button"
        title="More actions"
        onClick={handleToggle}
        className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container transition-colors border-0 bg-transparent cursor-pointer"
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {isOpen && anchor && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default border-0 bg-transparent p-0"
            aria-label="Close menu"
            onClick={() => onOpenChange(null)}
          />
          <div
            className="fixed z-50 min-w-[180px] py-xs bg-surface-white border border-border-subtle rounded shadow-lg"
            style={{ top: anchor.top, left: Math.max(8, anchor.left) }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-on-surface`}
              onClick={onView}
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              View
            </button>
            {!isInactive && (
              <button
                type="button"
                role="menuitem"
                className={`${menuItemClass} text-error`}
                onClick={onRemove}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}

export function VisitQueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewTarget, setViewTarget] = useState<QueueItem | null>(null)
  const [filterType, setFilterType] = useState<'active' | 'all'>('active')
  const [pageSize, setPageSize] = useState(10)

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const fetchQueue = async () => {
    try {
      const data = await receptionService.getTriageQueue()
      setQueueItems(data.map((entry, i) => toQueueItem(entry, i + 1)))
    } catch {
      // silently keep last known state on refresh errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchQueue()
    const interval = setInterval(() => void fetchQueue(), 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredItems = queueItems.filter((item) => {
    if (filterType === 'active') {
      return item.status === 'WAITING' || item.status === 'IN TRIAGE'
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const visibleItems = filteredItems.slice(pageStart, pageStart + pageSize)

  const removeItem = async (queueId: string, patientId: string, name: string) => {
    try {
      await receptionService.updateQueueStatus(queueId, 'skipped')
      setQueueItems((prev) => {
        const filtered = prev.filter((item) => item.queueId !== queueId)
        return filtered.map((item, i) => ({ ...item, pos: i + 1 }))
      })
      toast.success(`${name} removed from queue.`)
    } catch {
      toast.error('Failed to remove patient from queue.')
    }
  }

  const activeItems = queueItems.filter((i) => i.status === 'WAITING' || i.status === 'IN TRIAGE')
  const { avg: avgWait, longest: longestWait } = computeKpis(activeItems)
  const showingFrom = filteredItems.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + pageSize, filteredItems.length)

  return (
    <div className="max-w-container-max mx-auto px-gutter">
      {loading && (
        <div className="flex items-center justify-center py-xl">
          <span className="material-symbols-outlined text-[40px] text-primary animate-spin">progress_activity</span>
        </div>
      )}
      {!loading && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Total in Queue</p>
              <h3 className={KPI_VALUE}>{activeItems.length}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                group
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span className="text-[11px] font-medium">Live triage queue</span>
          </div>
        </div>

        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Avg Wait Time</p>
              <h3 className={KPI_VALUE}>
                {avgWait > 0 ? <>{avgWait}<span className="text-outline text-headline-sm"> min</span></> : <span className="text-outline text-headline-sm">--</span>}
              </h3>
            </div>
            <div className="w-10 h-10 rounded bg-success/10 flex items-center justify-center text-success">
              <span className="material-symbols-outlined text-[24px]">schedule</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span className="text-[11px] font-medium">Computed from live data</span>
          </div>
        </div>

        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Longest Wait</p>
              <h3 className={`${KPI_VALUE} ${longestWait > 30 ? 'text-error' : 'text-on-surface'}`}>
                {longestWait > 0
                  ? <>{longestWait}<span className="text-headline-sm" style={{ opacity: 0.7 }}> min</span></>
                  : <span className="text-outline text-headline-sm">--</span>}
              </h3>
            </div>
            <div className={`w-10 h-10 rounded flex items-center justify-center ${longestWait > 30 ? 'bg-error/10 text-error' : 'bg-surface-container text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]">timer_off</span>
            </div>
          </div>
          <div className={`mt-2 flex items-center gap-1 ${longestWait > 30 ? 'text-error' : 'text-outline'}`}>
            <span className="material-symbols-outlined text-[16px]">{longestWait > 30 ? 'warning' : 'info'}</span>
            <span className="text-[11px] font-medium">{longestWait > 30 ? 'Requires attention' : 'Within normal range'}</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden flex flex-col">
        <div className="p-md border-b border-border-subtle flex justify-between items-center bg-surface-bright">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            {filterType === 'active' ? 'Active Queue' : 'Queue History'}
          </h3>
          <div className="flex gap-sm items-center">
            <div className="flex items-center gap-xs bg-surface-container rounded-lg p-[3px] border border-border-subtle">
              <button
                type="button"
                onClick={() => {
                  setFilterType('active')
                  setCurrentPage(1)
                }}
                className={`px-sm py-xs font-label-md text-label-md rounded border-0 cursor-pointer transition-all ${
                  filterType === 'active'
                    ? 'bg-surface-white text-primary font-bold shadow-sm'
                    : 'bg-transparent text-secondary hover:text-on-surface'
                }`}
              >
                Active Queue
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterType('all')
                  setCurrentPage(1)
                }}
                className={`px-sm py-xs font-label-md text-label-md rounded border-0 cursor-pointer transition-all ${
                  filterType === 'all'
                    ? 'bg-surface-white text-primary font-bold shadow-sm'
                    : 'bg-transparent text-secondary hover:text-on-surface'
                }`}
              >
                All History
              </button>
            </div>
            <button type="button" className={TOOLBAR_BTN}>
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print List
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-surface-container-low">
              <tr>
                <th className={TH_CLASS}>#</th>
                <th className={TH_CLASS}>Patient Name</th>
                <th className={TH_CLASS}>Patient #</th>
                <th className={TH_CLASS}>Registered At</th>
                <th className={TH_CLASS}>Wait Time</th>
                <th className={TH_CLASS}>Payment Type</th>
                <th className={TH_CLASS}>Triage Status</th>
                <th className={`${TH_CLASS} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {visibleItems.map((item) => (
                <tr key={item.queueId} className="hover:bg-hover-tint transition-colors group">
                  <td className={TD_MUTED}>{item.pos}</td>
                  <td className="py-md px-md font-body-sm text-body-sm font-semibold text-on-surface">
                    {item.name}
                  </td>
                  <td className={TD_MUTED}>{item.id}</td>
                  <td className={TD_MUTED}>{item.time}</td>
                  <td className={`py-md px-md font-body-sm text-body-sm font-semibold ${item.waitColor}`}>
                    {item.wait}
                  </td>
                  <td className={TD_MUTED}>{item.payment}</td>
                  <td className="py-md px-md">
                    <span className={`${STATUS_BADGE} ${item.statusBg} ${item.statusText}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-md px-md text-right">
                    <div
                      className={`flex justify-end ${item.status === 'COMPLETE' || item.status === 'SKIPPED' ? 'opacity-50' : ''}`}
                    >
                      <QueueActionsMenu
                        item={item}
                        openMenuId={openMenuId}
                        onOpenChange={setOpenMenuId}
                        onView={() => {
                          setOpenMenuId(null)
                          setViewTarget(item)
                        }}
                        onRemove={() => {
                          setOpenMenuId(null)
                          void removeItem(item.queueId, item.id, item.name)
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-md bg-surface-bright border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-md">
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              {filteredItems.length === 0
                ? 'No patients in queue'
                : `Showing ${showingFrom} to ${showingTo} of ${filteredItems.length} patients in queue`}
            </p>
            {filteredItems.length > 0 && (
              <div className="flex items-center gap-xs">
                <span className="font-body-sm text-body-sm text-secondary">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-8 px-xs border border-border-subtle rounded font-body-sm bg-white outline-none cursor-pointer text-secondary"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>
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

      {viewTarget && <QueueViewModal item={viewTarget} onClose={() => setViewTarget(null)} />}
        </>
      )}
    </div>
  )
}
