import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface QueueItem {
  pos: number
  name: string
  id: string
  time: string
  wait: string
  waitColor: string
  payment: string
  status: 'WAITING' | 'IN TRIAGE' | 'WITH DOCTOR' | 'COMPLETE'
  statusBg: string
  statusText: string
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

const INITIAL_QUEUE: QueueItem[] = [
  {
    pos: 1,
    name: 'Fatuma Said',
    id: 'PT-4891',
    time: '08:12',
    wait: '48 min',
    waitColor: 'text-error',
    payment: 'Cash',
    status: 'WAITING',
    statusBg: 'bg-warning/10',
    statusText: 'text-warning',
  },
  {
    pos: 2,
    name: 'Hassan Mwita',
    id: 'PT-4889',
    time: '08:22',
    wait: '38 min',
    waitColor: 'text-error',
    payment: 'Insurance',
    status: 'IN TRIAGE',
    statusBg: 'bg-info/10',
    statusText: 'text-info',
  },
  {
    pos: 3,
    name: 'Grace Kimaro',
    id: 'PT-4892',
    time: '08:45',
    wait: '15 min',
    waitColor: 'text-warning',
    payment: 'Cash',
    status: 'WAITING',
    statusBg: 'bg-warning/10',
    statusText: 'text-warning',
  },
  {
    pos: 4,
    name: 'Amir Juma',
    id: 'PT-4903',
    time: '09:05',
    wait: '8 min',
    waitColor: 'text-success',
    payment: 'Insurance',
    status: 'WITH DOCTOR',
    statusBg: 'bg-success/10',
    statusText: 'text-success',
  },
  {
    pos: 5,
    name: 'Linda Mtui',
    id: 'PT-4911',
    time: '07:50',
    wait: '--',
    waitColor: 'text-on-surface-variant',
    payment: 'Exempt',
    status: 'COMPLETE',
    statusBg: 'bg-surface-container-high',
    statusText: 'text-on-surface-variant',
  },
  {
    pos: 6,
    name: 'Amani Khatib',
    id: 'PT-1029',
    time: '09:20',
    wait: '12 min',
    waitColor: 'text-warning',
    payment: 'Cash',
    status: 'IN TRIAGE',
    statusBg: 'bg-info/10',
    statusText: 'text-info',
  },
  {
    pos: 7,
    name: 'Zuwena Salum',
    id: 'PT-3841',
    time: '09:30',
    wait: '18 min',
    waitColor: 'text-warning',
    payment: 'Insurance',
    status: 'WAITING',
    statusBg: 'bg-warning/10',
    statusText: 'text-warning',
  },
  {
    pos: 8,
    name: 'Joseph Mwinyi',
    id: 'PT-9201',
    time: '09:45',
    wait: '24 min',
    waitColor: 'text-warning',
    payment: 'Cash',
    status: 'WITH DOCTOR',
    statusBg: 'bg-success/10',
    statusText: 'text-success',
  },
]

const PAGE_SIZE = 5

function renumberQueue(items: QueueItem[]) {
  return items.map((item, index) => ({ ...item, pos: index + 1 }))
}

function QueueViewModal({ item, onClose }: { item: QueueItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-lg w-full max-w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="queue-view-title"
      >
        <div className="p-lg border-b border-border-subtle flex justify-between items-center">
          <h2 id="queue-view-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Queue Entry Details
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
        <div className="p-lg grid grid-cols-2 gap-md">
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Position</p>
            <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">#{item.pos}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient Name</p>
            <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{item.name}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient #</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{item.id}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Registered At</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{item.time}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Wait Time</p>
            <p className={`font-body-sm text-body-sm font-semibold m-0 ${item.waitColor}`}>{item.wait}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Payment Type</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{item.payment}</p>
          </div>
          <div className="col-span-2">
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Triage Status</p>
            <span className={`${STATUS_BADGE} ${item.statusBg} ${item.statusText}`}>{item.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function QueueActionsMenu({
  item,
  queueLength,
  openMenuId,
  onOpenChange,
  onMoveUp,
  onMoveDown,
  onView,
  onRemove,
}: {
  item: QueueItem
  queueLength: number
  openMenuId: string | null
  onOpenChange: (id: string | null) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onView: () => void
  onRemove: () => void
}) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const isOpen = openMenuId === item.id
  const isComplete = item.status === 'COMPLETE'
  const canMoveUp = item.pos > 1 && !isComplete
  const canMoveDown = item.pos < queueLength && !isComplete

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
    onOpenChange(item.id)
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
              disabled={!canMoveUp}
              className={`${menuItemClass} text-on-surface`}
              onClick={onMoveUp}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              Move Up
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!canMoveDown}
              className={`${menuItemClass} text-on-surface`}
              onClick={onMoveDown}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              Move Down
            </button>
            <div className="h-px bg-border-subtle my-xs" />
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-on-surface`}
              onClick={onView}
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              View
            </button>
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-error`}
              onClick={onRemove}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Remove
            </button>
          </div>
        </>
      )}
    </>
  )
}

export function VisitQueuePage() {
  const [queueItems, setQueueItems] = useState(INITIAL_QUEUE)
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewTarget, setViewTarget] = useState<QueueItem | null>(null)

  const totalPages = Math.max(1, Math.ceil(queueItems.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAGE_SIZE
  const visibleItems = queueItems.slice(pageStart, pageStart + PAGE_SIZE)

  const moveItem = (id: string, direction: 'up' | 'down') => {
    setQueueItems((prev) => {
      const index = prev.findIndex((item) => item.id === id)
      if (index === -1) return prev

      const swapIndex = direction === 'up' ? index - 1 : index + 1
      if (swapIndex < 0 || swapIndex >= prev.length) return prev

      const next = [...prev]
      ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
      return renumberQueue(next)
    })
  }

  const removeItem = (id: string) => {
    setQueueItems((prev) => renumberQueue(prev.filter((item) => item.id !== id)))
    const newLength = queueItems.length - 1
    const newTotalPages = Math.max(1, Math.ceil(newLength / PAGE_SIZE))
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages)
    }
  }

  const showingFrom = queueItems.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + PAGE_SIZE, queueItems.length)

  return (
    <div className="max-w-container-max mx-auto px-gutter">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Total in Queue</p>
              <h3 className={KPI_VALUE}>{queueItems.length}</h3>
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
          <div className="mt-2 flex items-center gap-1 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-[11px] font-medium">+2 since last hour</span>
          </div>
        </div>

        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Avg Wait Time</p>
              <h3 className={KPI_VALUE}>
                22<span className="text-outline text-headline-sm"> min</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded bg-success/10 flex items-center justify-center text-success">
              <span className="material-symbols-outlined text-[24px]">schedule</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-outline">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span className="text-[11px] font-medium">System standard: 15min</span>
          </div>
        </div>

        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Longest Wait</p>
              <h3 className={`${KPI_VALUE} text-error`}>
                48<span className="text-error/70 text-headline-sm"> min</span>
              </h3>
            </div>
            <div className="w-10 h-10 rounded bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[24px]">timer_off</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-error">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span className="text-[11px] font-medium">Requires immediate attention</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden flex flex-col">
        <div className="p-md border-b border-border-subtle flex justify-between items-center bg-surface-bright">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Active Queue
          </h3>
          <div className="flex gap-sm">
            <button type="button" className={TOOLBAR_BTN}>
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filter
            </button>
            <button type="button" className={TOOLBAR_BTN}>
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print List
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                <tr key={item.id} className="hover:bg-hover-tint transition-colors group">
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
                      className={`flex justify-end ${item.status === 'COMPLETE' ? 'opacity-50' : ''}`}
                    >
                      <QueueActionsMenu
                        item={item}
                        queueLength={queueItems.length}
                        openMenuId={openMenuId}
                        onOpenChange={setOpenMenuId}
                        onMoveUp={() => {
                          setOpenMenuId(null)
                          moveItem(item.id, 'up')
                          toast.success(`${item.name} moved up in queue.`)
                        }}
                        onMoveDown={() => {
                          setOpenMenuId(null)
                          moveItem(item.id, 'down')
                          toast.success(`${item.name} moved down in queue.`)
                        }}
                        onView={() => {
                          setOpenMenuId(null)
                          setViewTarget(item)
                        }}
                        onRemove={() => {
                          setOpenMenuId(null)
                          removeItem(item.id)
                          toast.success(`${item.name} removed from queue.`)
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-md bg-surface-bright border-t border-border-subtle flex justify-between items-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
            {queueItems.length === 0
              ? 'No patients in queue'
              : `Showing ${showingFrom} to ${showingTo} of ${queueItems.length} patients in queue`}
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

      {viewTarget && <QueueViewModal item={viewTarget} onClose={() => setViewTarget(null)} />}
    </div>
  )
}
