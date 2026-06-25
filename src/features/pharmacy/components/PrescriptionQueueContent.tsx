import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PrescriptionDetailModal } from '@/features/pharmacy/components/PrescriptionDetailModal'
import {
  PRESCRIPTION_QUEUE_ITEMS,
  PRESCRIPTION_QUEUE_STATS,
  PRESCRIPTION_QUEUE_TOTAL,
  type PrescriptionBillingStatus,
  type PrescriptionQueueItem,
} from '@/features/pharmacy/data/mockPrescriptionQueue'

type BillingFilter = 'all' | PrescriptionBillingStatus

function formatQueueDate(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatCards() {
  const { pending, billingCleared, awaitingClearance, drugInteractions } = PRESCRIPTION_QUEUE_STATS

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Pending</span>
          <span className="material-symbols-outlined text-[20px]">timer</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{pending}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">
            Billing Cleared
          </span>
          <span className="material-symbols-outlined text-[20px] text-success">check_circle</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{billingCleared}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">
            Awaiting Clearance
          </span>
          <span className="material-symbols-outlined text-[20px] text-warning">pending</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{awaitingClearance}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">
            Drug Interactions
          </span>
          <span className="material-symbols-outlined text-[20px] text-error">priority_high</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{drugInteractions}</span>
      </div>
    </div>
  )
}

function BillingStatusBadge({ status }: { status: PrescriptionBillingStatus }) {
  if (status === 'cleared') {
    return (
      <span className="px-3 py-1 bg-success/10 text-success rounded-full text-[11px] font-bold">
        Cleared
      </span>
    )
  }
  if (status === 'awaiting_clearance') {
    return (
      <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-[11px] font-bold">
        Awaiting Clearance
      </span>
    )
  }
  return (
    <span className="px-3 py-1 bg-error/10 text-error rounded-full text-[11px] font-bold">
      Not Cleared
    </span>
  )
}

function InteractionFlag({ note }: { note?: string }) {
  if (!note) {
    return <span className="text-secondary text-[11px] font-medium">—</span>
  }

  return (
    <div className="flex justify-center relative group/it">
      <span
        className="material-symbols-outlined text-error text-[20px]"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        priority_high
      </span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/it:block bg-error text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
        {note}
      </div>
    </div>
  )
}

function PrescriptionRowActions({
  item,
  onDispense,
  onView,
  onReviewInteraction,
}: {
  item: PrescriptionQueueItem
  onDispense: (item: PrescriptionQueueItem) => void
  onView: (item: PrescriptionQueueItem) => void
  onReviewInteraction: (item: PrescriptionQueueItem) => void
}) {
  const canDispense = item.billingStatus === 'cleared'

  return (
    <div className="flex items-center gap-sm flex-wrap">
      {item.interactionNote && (
        <button
          type="button"
          onClick={() => onReviewInteraction(item)}
          className="text-error font-label-md text-label-md font-bold hover:underline bg-transparent border-0 cursor-pointer p-0"
        >
          Review Interaction
        </button>
      )}

      {canDispense ? (
        <button
          type="button"
          onClick={() => onDispense(item)}
          className="h-8 px-md bg-primary text-white rounded-lg font-label-md hover:bg-primary-container transition-all border-0 cursor-pointer"
        >
          Dispense
        </button>
      ) : (
        <div className="relative group/tooltip">
          <button
            type="button"
            disabled
            className="h-8 px-md bg-border-subtle text-white rounded-lg font-label-md flex items-center gap-xs cursor-not-allowed border-0"
          >
            <span className="material-symbols-outlined text-[16px]">lock</span>
            Dispense
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-inverse-surface text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
            Billing clearance required
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onView(item)}
        className="h-8 px-md border border-border-subtle text-secondary rounded-lg font-label-md hover:bg-surface-variant transition-all bg-white cursor-pointer"
      >
        View Prescription
      </button>
    </div>
  )
}

export function PrescriptionQueueContent() {
  const navigate = useNavigate()
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('all')
  const [page, setPage] = useState(1)
  const [viewPrescriptionId, setViewPrescriptionId] = useState<string | null>(null)
  const [highlightInteraction, setHighlightInteraction] = useState(false)

  const viewPrescriptionItem = useMemo(
    () => PRESCRIPTION_QUEUE_ITEMS.find((item) => item.id === viewPrescriptionId),
    [viewPrescriptionId],
  )

  const filteredItems = useMemo(() => {
    if (billingFilter === 'all') return PRESCRIPTION_QUEUE_ITEMS
    return PRESCRIPTION_QUEUE_ITEMS.filter((item) => item.billingStatus === billingFilter)
  }, [billingFilter])

  const handleDispense = (item: PrescriptionQueueItem) => {
    navigate(`/pharmacy/queue/${item.id}/dispense`)
  }

  const handleView = (item: PrescriptionQueueItem) => {
    setHighlightInteraction(false)
    setViewPrescriptionId(item.id)
  }

  const handleReviewInteraction = (item: PrescriptionQueueItem) => {
    setHighlightInteraction(true)
    setViewPrescriptionId(item.id)
  }

  const handleSearch = () => {
    toast.success('Queue refreshed.')
  }

  const handleManualEntry = () => {
    toast.info('Manual entry form coming soon.')
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg relative pb-24">
      <StatCards />

      <div className="bg-surface-white rounded-xl border border-border-subtle overflow-hidden w-full">
        <div className="px-lg py-md border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">All Prescriptions</h2>
          <div className="flex flex-wrap items-center gap-sm">
            <div className="relative">
              <select
                value={billingFilter}
                onChange={(e) => {
                  setBillingFilter(e.target.value as BillingFilter)
                  setPage(1)
                }}
                className="pl-md pr-xl py-2 h-8 bg-surface-white border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none min-w-[160px]"
              >
                <option value="all">Billing Status: All</option>
                <option value="cleared">Cleared</option>
                <option value="awaiting_clearance">Awaiting Clearance</option>
                <option value="not_cleared">Not Cleared</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[18px]">
                expand_more
              </span>
            </div>

            <div className="flex items-center gap-xs pl-md pr-xl py-2 h-8 bg-surface-white border border-border-subtle rounded-lg text-body-sm cursor-default">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>Today: {formatQueueDate()}</span>
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="h-8 px-md bg-primary text-white rounded-lg font-label-md flex items-center gap-xs hover:bg-primary-container transition-colors border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Search Queue
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                  Patient Name
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                  Patient #
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                  Medications Count
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                  Prescribed By
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                  Prescribed At
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                  Billing Status
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap text-center">
                  Interaction Flag
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-row-hover transition-colors group">
                  <td className="px-lg py-md whitespace-nowrap">
                    <div className="font-body-md font-semibold text-on-surface">{item.patientName}</div>
                  </td>
                  <td className="px-lg py-md font-body-sm text-secondary whitespace-nowrap">
                    {item.patientNumber}
                  </td>
                  <td className="px-lg py-md font-body-sm text-on-surface whitespace-nowrap">
                    {item.medicationCount} med{item.medicationCount !== 1 ? 's' : ''}
                  </td>
                  <td className="px-lg py-md font-body-sm text-on-surface whitespace-nowrap">
                    {item.prescribedBy}
                  </td>
                  <td className="px-lg py-md font-body-sm text-secondary whitespace-nowrap">
                    {item.prescribedAt}
                  </td>
                  <td className="px-lg py-md whitespace-nowrap">
                    <BillingStatusBadge status={item.billingStatus} />
                  </td>
                  <td className="px-lg py-md whitespace-nowrap text-center">
                    <InteractionFlag note={item.interactionNote} />
                  </td>
                  <td className="px-lg py-md whitespace-nowrap">
                    <PrescriptionRowActions
                      item={item}
                      onDispense={handleDispense}
                      onView={handleView}
                      onReviewInteraction={handleReviewInteraction}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-md">
          <span className="font-body-sm text-body-sm text-secondary">
            Showing {filteredItems.length} of {PRESCRIPTION_QUEUE_TOTAL} active prescriptions
          </span>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-surface-white text-secondary hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded border text-label-md cursor-pointer ${
                  page === p
                    ? 'border-primary bg-secondary-container text-primary font-bold'
                    : 'border-border-subtle bg-surface-white text-secondary hover:bg-surface-variant'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page === 3}
              onClick={() => setPage((p) => Math.min(3, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-surface-white text-secondary hover:bg-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleManualEntry}
        className="fixed bottom-24 lg:bottom-xl right-xl w-[180px] h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center gap-sm font-headline-sm hover:bg-primary-container transition-all duration-300 z-40 hover:scale-105 border-0 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[24px]">add_circle</span>
        <span>Manual Entry</span>
      </button>

      {viewPrescriptionId && (
        <PrescriptionDetailModal
          prescriptionId={viewPrescriptionId}
          interactionNote={viewPrescriptionItem?.interactionNote}
          highlightInteraction={highlightInteraction}
          onClose={() => {
            setViewPrescriptionId(null)
            setHighlightInteraction(false)
          }}
          onDispense={(id) => navigate(`/pharmacy/queue/${id}/dispense`)}
        />
      )}
    </div>
  )
}
