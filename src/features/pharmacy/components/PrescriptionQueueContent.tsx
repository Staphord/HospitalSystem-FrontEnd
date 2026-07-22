import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PrescriptionDetailModal } from '@/features/pharmacy/components/PrescriptionDetailModal'
import { pharmacyService, type PharmacyQueueItem } from '@/api/services/pharmacy'

type BillingFilter = 'all' | 'cleared' | 'awaiting_clearance'

function formatQueueDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface StatCardsProps {
  stats: {
    pending: number
    billingCleared: number
    awaitingClearance: number
    drugInteractions: number
  }
}

function StatCards({ stats }: StatCardsProps) {
  const { pending, billingCleared, awaitingClearance, drugInteractions } = stats

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
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Billing Cleared</span>
          <span className="material-symbols-outlined text-[20px] text-success">check_circle</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{billingCleared}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Awaiting Clearance</span>
          <span className="material-symbols-outlined text-[20px] text-warning">pending</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{awaitingClearance}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">Drug Interactions</span>
          <span className="material-symbols-outlined text-[20px] text-error">priority_high</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{drugInteractions}</span>
      </div>
    </div>
  )
}

function BillingStatusBadge({ cleared }: { cleared: boolean }) {
  if (cleared) {
    return (
      <span className="inline-flex items-center gap-xs px-2 py-0.5 bg-success/10 text-success rounded-full text-[11px] font-bold whitespace-nowrap">
        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        Cleared
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-xs px-2 py-0.5 bg-warning/10 text-warning rounded-full text-[11px] font-bold whitespace-nowrap">
      <span className="material-symbols-outlined text-[13px]">schedule</span>
      Awaiting
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const isUrgent = priority === 'emergency' || priority === 'urgent'
  return (
    <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide whitespace-nowrap ${
      isUrgent ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'
    }`}>
      {priority}
    </span>
  )
}

interface IconButtonProps {
  icon: string
  label: string
  onClick: () => void
  variant?: 'primary' | 'danger' | 'default' | 'disabled'
}

function IconActionButton({ icon, label, onClick, variant = 'default' }: IconButtonProps) {
  const variantClass = {
    primary: 'text-primary hover:bg-primary/10 border-primary/20',
    danger: 'text-error hover:bg-error/10 border-error/20',
    default: 'text-secondary hover:bg-surface-variant border-border-subtle',
    disabled: 'text-on-surface-variant cursor-not-allowed opacity-40 border-border-subtle',
  }[variant]

  return (
    <div className="relative group/tip">
      <button
        type="button"
        onClick={onClick}
        disabled={variant === 'disabled'}
        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors bg-transparent cursor-pointer ${variantClass}`}
        aria-label={label}
      >
        <span className="material-symbols-outlined text-[17px]">{icon}</span>
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:block bg-inverse-surface text-inverse-on-surface text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
        {label}
      </div>
    </div>
  )
}

interface RowActionsProps {
  item: PharmacyQueueItem
  hasInteraction: boolean
  onDispense: (item: PharmacyQueueItem) => void
  onView: (item: PharmacyQueueItem) => void
  onReviewInteraction: (item: PharmacyQueueItem) => void
}

function PrescriptionRowActions({ item, hasInteraction, onDispense, onView, onReviewInteraction }: RowActionsProps) {
  const canDispense = item.status === 'waiting' && item.billing_cleared
  const alreadyProcessed = item.status !== 'waiting'

  const dispenseLabel = alreadyProcessed
    ? 'Already processed'
    : canDispense
    ? 'Dispense prescription'
    : 'Billing clearance required'

  return (
    <div className="flex items-center gap-xs">
      {hasInteraction && (
        <IconActionButton
          icon="warning"
          label="Review drug interaction"
          onClick={() => onReviewInteraction(item)}
          variant="danger"
        />
      )}
      <IconActionButton
        icon="visibility"
        label="View prescription"
        onClick={() => onView(item)}
        variant="default"
      />
      <IconActionButton
        icon={canDispense ? 'medication' : 'lock'}
        label={dispenseLabel}
        onClick={() => canDispense && onDispense(item)}
        variant={canDispense ? 'primary' : 'disabled'}
      />
    </div>
  )
}

export function PrescriptionQueueContent() {
  const navigate = useNavigate()
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewVisitId, setViewVisitId] = useState<string | null>(null)
  const [highlightInteraction, setHighlightInteraction] = useState(false)
  const [queueItems, setQueueItems] = useState<PharmacyQueueItem[]>([])
  const [interactionVisitIds, setInteractionVisitIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchQueue = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const res = await pharmacyService.getQueue('waiting')
      const items = res.queue || []
      setQueueItems(items)

      // Run drug interaction checks for all waiting patients
      const interactionChecks = await Promise.all(
        items.map(async (p) => {
          try {
            const check = await pharmacyService.checkDrugInteractions(p.visit_id)
            return check.alert_count > 0 ? p.visit_id : null
          } catch {
            return null
          }
        })
      )
      const flagged = new Set(interactionChecks.filter(Boolean) as string[])
      setInteractionVisitIds(flagged)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load pharmacy queue.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const filteredItems = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    return queueItems.filter((item) => {
      const matchesBilling =
        billingFilter === 'all' ||
        (billingFilter === 'cleared' && item.billing_cleared) ||
        (billingFilter === 'awaiting_clearance' && !item.billing_cleared)

      const matchesSearch =
        !needle ||
        item.patient_name.toLowerCase().includes(needle) ||
        item.visit_number.toLowerCase().includes(needle)

      return matchesBilling && matchesSearch
    })
  }, [queueItems, billingFilter, searchQuery])

  const stats = useMemo(() => ({
    pending: queueItems.length,
    billingCleared: queueItems.filter((i) => i.billing_cleared).length,
    awaitingClearance: queueItems.filter((i) => !i.billing_cleared).length,
    drugInteractions: interactionVisitIds.size,
  }), [queueItems, interactionVisitIds])

  const handleDispense = (item: PharmacyQueueItem) => {
    navigate(`/pharmacy/queue/${item.visit_id}/dispense`)
  }

  const handleView = (item: PharmacyQueueItem) => {
    setHighlightInteraction(false)
    setViewVisitId(item.visit_id)
  }

  const handleReviewInteraction = (item: PharmacyQueueItem) => {
    setHighlightInteraction(true)
    setViewVisitId(item.visit_id)
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <StatCards stats={stats} />

      <div className="bg-surface-white rounded-xl border border-border-subtle overflow-hidden w-full">
        {/* Table toolbar */}
        <div className="px-lg py-md border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">All Prescriptions</h2>
            <p className="text-body-sm text-secondary m-0 mt-0.5">
              {formatQueueDate()} · {filteredItems.length} of {queueItems.length} shown
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-sm">
            {/* Inline search input */}
            <div className="relative h-9">
              <span className="material-symbols-outlined absolute inset-y-0 left-2 flex items-center pointer-events-none text-secondary text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Patient name or visit #"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 pr-7 bg-surface-white border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none w-[220px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-2 flex items-center text-secondary hover:text-on-surface bg-transparent border-0 cursor-pointer p-0"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Billing status filter */}
            <div className="relative h-9">
              <select
                value={billingFilter}
                onChange={(e) => {
                  setBillingFilter(e.target.value as BillingFilter)
                }}
                className="h-9 pl-3 pr-8 bg-surface-white border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer outline-none min-w-[150px]"
              >
                <option value="all">Billing: All</option>
                <option value="cleared">Cleared</option>
                <option value="awaiting_clearance">Awaiting Clearance</option>
              </select>
              <span className="material-symbols-outlined absolute inset-y-0 right-2 flex items-center pointer-events-none text-secondary text-[18px]">
                expand_more
              </span>
            </div>

            {/* Silent refresh button */}
            <button
              type="button"
              onClick={() => fetchQueue(true)}
              disabled={refreshing}
              title="Refresh queue"
              className="w-9 h-9 flex items-center justify-center border border-border-subtle rounded-lg text-secondary hover:bg-surface-variant transition-colors bg-surface-white cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-xl text-center text-secondary font-body-sm">Loading queue patients...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Patient Name
                  </th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Visit #
                  </th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap text-center">
                    Medications
                  </th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Billing Type
                  </th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Billing Status
                  </th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap text-center">
                    Priority
                  </th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredItems.map((item) => (
                  <tr key={item.queue_id} className="hover:bg-row-hover transition-colors group">
                    <td className="px-lg py-md whitespace-nowrap">
                      <div className="font-body-md font-semibold text-on-surface">{item.patient_name}</div>
                      <div className="text-[11px] text-secondary mt-0.5">Q#{item.queue_number}</div>
                    </td>
                    <td className="px-lg py-md font-body-sm text-secondary whitespace-nowrap">
                      {item.visit_number}
                    </td>
                    <td className="px-lg py-md font-body-sm text-on-surface whitespace-nowrap text-center">
                      {item.prescription_count}
                    </td>
                    <td className="px-lg py-md font-body-sm text-on-surface whitespace-nowrap capitalize">
                      {item.payment_type}
                    </td>
                    <td className="px-lg py-md whitespace-nowrap">
                      <BillingStatusBadge cleared={item.billing_cleared} />
                    </td>
                    <td className="px-lg py-md whitespace-nowrap text-center">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="px-lg py-md whitespace-nowrap">
                      <div className="flex items-center justify-end gap-xs">
                        <PrescriptionRowActions
                          item={item}
                          hasInteraction={interactionVisitIds.has(item.visit_id)}
                          onDispense={handleDispense}
                          onView={handleView}
                          onReviewInteraction={handleReviewInteraction}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-xl text-center text-secondary font-body-sm">
                      {searchQuery
                        ? `No prescriptions matching "${searchQuery}".`
                        : 'No prescriptions in the waiting queue.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-md">
          <span className="font-body-sm text-body-sm text-secondary">
            Showing {filteredItems.length} of {queueItems.length} prescription{queueItems.length !== 1 ? 's' : ''}
          </span>
          {interactionVisitIds.size > 0 && (
            <span className="inline-flex items-center gap-xs text-error font-label-md text-label-md">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              {interactionVisitIds.size} drug interaction{interactionVisitIds.size !== 1 ? 's' : ''} flagged
            </span>
          )}
        </div>
      </div>

      {/* Prescription detail modal */}
      {viewVisitId && (
        <PrescriptionDetailModal
          prescriptionId={viewVisitId}
          highlightInteraction={highlightInteraction}
          onClose={() => {
            setViewVisitId(null)
            setHighlightInteraction(false)
          }}
          onDispense={(visitId) => navigate(`/pharmacy/queue/${visitId}/dispense`)}
        />
      )}
    </div>
  )
}
