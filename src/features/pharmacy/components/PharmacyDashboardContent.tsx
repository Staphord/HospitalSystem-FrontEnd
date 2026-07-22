import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { pharmacyService, type PharmacyQueueItem, type LowStockAlertItem } from '@/api/services/pharmacy'

function BillingBadge({ status }: { status: boolean }) {
  if (status) {
    return (
      <span className="px-2 py-1 rounded bg-success/10 text-success text-[11px] font-bold uppercase">
        Cleared
      </span>
    )
  }
  return (
    <span className="px-2 py-1 rounded bg-warning/10 text-warning text-[11px] font-bold uppercase">
      Pending
    </span>
  )
}

interface StatCardsProps {
  stats: {
    prescriptionsPending: number
    dispensedToday: number
    drugInteractions: number
    lowStockItems: number
  }
}

function StatCards({ stats }: StatCardsProps) {
  const { prescriptionsPending, dispensedToday, drugInteractions, lowStockItems } = stats

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm text-secondary">Prescriptions Pending</span>
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{prescriptionsPending}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm text-secondary">Dispensed Today</span>
          <span className="material-symbols-outlined text-[20px] text-success">check_circle</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-success">{dispensedToday}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm text-secondary">Drug Interactions</span>
          <span className="material-symbols-outlined text-[20px] text-error">report_problem</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-error">{drugInteractions}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm text-secondary">Low Stock Items</span>
          <span className="material-symbols-outlined text-[20px] text-warning">inventory_2</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-warning">{lowStockItems}</span>
      </div>
    </div>
  )
}

interface PrescriptionQueuePreviewProps {
  queue: PharmacyQueueItem[]
  onDispense: (prescription: PharmacyQueueItem) => void
}

function PrescriptionQueuePreview({ queue, onDispense }: PrescriptionQueuePreviewProps) {
  const previewList = useMemo(() => queue.slice(0, 4), [queue])

  return (
    <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
      <div className="flex justify-between items-center px-lg py-md border-b border-border-subtle">
        <h2 className="font-headline-sm text-headline-sm m-0">Pending Prescriptions</h2>
        <Link
          to="/pharmacy/queue"
          className="text-body-sm font-semibold text-primary hover:underline no-underline"
        >
          View Full Queue →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-border-subtle">
              <th className="px-lg py-sm font-label-md text-label-md text-secondary">PATIENT NAME</th>
              <th className="px-lg py-sm font-label-md text-label-md text-secondary">MEDICATIONS</th>
              <th className="px-lg py-sm font-label-md text-label-md text-secondary">BILLING</th>
              <th className="px-lg py-sm font-label-md text-label-md text-secondary text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {previewList.map((rx) => {
              const canDispense = rx.billing_cleared
              return (
                <tr key={rx.queue_id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="px-lg py-md font-body-sm text-body-sm font-semibold">{rx.patient_name}</td>
                  <td className="px-lg py-md font-body-sm text-body-sm">
                    {rx.prescription_count} med{rx.prescription_count !== 1 ? 's' : ''}
                  </td>
                  <td className="px-lg py-md">
                    <BillingBadge status={rx.billing_cleared} />
                  </td>
                  <td className="px-lg py-md text-right">
                    <button
                      type="button"
                      disabled={!canDispense}
                      onClick={() => onDispense(rx)}
                      className={`h-8 px-md rounded text-body-sm font-medium transition-all ${
                        canDispense
                          ? 'bg-primary text-white hover:bg-primary-container cursor-pointer border-0'
                          : 'bg-outline-variant text-white cursor-not-allowed opacity-60 border-0'
                      }`}
                    >
                      Dispense →
                    </button>
                  </td>
                </tr>
              )
            })}
            {previewList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-lg py-xl text-center text-secondary font-body-sm">
                  No pending prescriptions in queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

interface DrugInteractionItem {
  patientName: string
  visitId: string
  type: string
  severity: string
  drug_name?: string | null
  drug_a?: string | null
  drug_b?: string | null
  detail: string
  recommendation: string
}

interface DrugInteractionsCardProps {
  interactions: DrugInteractionItem[]
}

function DrugInteractionsCard({ interactions }: DrugInteractionsCardProps) {
  const navigate = useNavigate()
  const interaction = interactions[0]

  if (!interaction) {
    return (
      <section className="bg-surface-white border border-border-subtle border-l-[3px] border-l-success rounded-lg overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle">
          <h2 className="font-headline-sm text-headline-sm text-success flex items-center gap-sm m-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Drug Interactions
          </h2>
        </div>
        <div className="p-lg text-center text-secondary font-body-sm">
          No active drug interactions or allergy contraindications detected in the pending queue.
        </div>
      </section>
    )
  }

  return (
    <section className="bg-surface-white border border-border-subtle border-l-[3px] border-l-error rounded-lg overflow-hidden shadow-sm">
      <div className="px-lg py-md border-b border-border-subtle">
        <h2 className="font-headline-sm text-headline-sm text-error flex items-center gap-sm m-0">
          <span className="material-symbols-outlined text-[20px]">report_problem</span>
          Drug Interactions ({interactions.length})
        </h2>
      </div>
      <div className="p-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md p-md bg-error/5 rounded border border-error/10">
          <div className="flex gap-md items-start">
            <div className="mt-1">
              <span className="px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-bold uppercase tracking-wider">
                {interaction.severity || 'High'} Severity
              </span>
            </div>
            <div>
              <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">
                {interaction.patientName}
              </p>
              <p className="text-body-sm text-on-surface-variant m-0 mt-1">
                {interaction.type === 'drug_allergy' ? (
                  <span>Allergy risk: <span className="font-semibold text-error">{interaction.drug_name}</span> matches patient allergy profile.</span>
                ) : (
                  <span><span className="font-semibold text-error">{interaction.drug_a}</span> interacts with <span className="font-semibold text-error">{interaction.drug_b}</span>.</span>
                )}
                <br />
                <span className="text-[11px] text-secondary">{interaction.detail}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/pharmacy/queue/${interaction.visitId}/dispense`)}
            className="text-body-sm font-semibold text-error hover:underline flex items-center gap-xs bg-transparent border-0 cursor-pointer p-0"
          >
            Review & Dispense
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </button>
        </div>
      </div>
    </section>
  )
}

interface InventoryAlertsCardProps {
  alerts: LowStockAlertItem[]
}

function InventoryAlertsCard({ alerts }: InventoryAlertsCardProps) {
  const previewAlerts = useMemo(() => alerts.slice(0, 3), [alerts])

  return (
    <section className="bg-surface-white border border-border-subtle border-l-[3px] border-l-warning rounded-lg shadow-sm">
      <div className="px-md py-md border-b border-border-subtle flex justify-between items-center">
        <h2 className="font-headline-sm text-headline-sm flex items-center gap-sm m-0">
          <span className="material-symbols-outlined text-warning">inventory</span>
          Inventory Alerts
        </h2>
        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">
          {alerts.length} Items
        </span>
      </div>
      <div className="p-md flex flex-col gap-sm">
        {previewAlerts.map((item) => (
          <div
            key={item.inventory_id}
            className="p-sm flex justify-between items-center hover:bg-surface-container-low transition-colors rounded"
          >
            <div>
              <p className="font-body-sm text-body-sm font-semibold m-0">{item.drug_name}</p>
              <p className="text-label-sm text-on-surface-variant m-0">Threshold: {item.reorder_level} {item.unit}</p>
            </div>
            <div className="text-right">
              <p
                className={`font-body-sm text-body-sm font-bold m-0 ${
                  item.quantity_in_stock === 0 ? 'text-error' : 'text-warning'
                }`}
              >
                {item.quantity_in_stock} left
              </p>
              <Link
                to="/pharmacy/stock"
                className="text-[11px] font-bold text-primary uppercase hover:underline no-underline"
              >
                View →
              </Link>
            </div>
          </div>
        ))}
        {previewAlerts.length === 0 && (
          <div className="p-sm text-center text-secondary font-body-sm">
            All inventory items are fully stocked.
          </div>
        )}
      </div>
    </section>
  )
}

function categoryBarColor(index: number): string {
  if (index === 1) return 'bg-info'
  if (index === 2) return 'bg-success'
  return 'bg-primary'
}

interface DispensedTodayCardProps {
  dispensedCount: number
  categoryDistribution: { name: string; percent: number }[]
}

function DispensedTodayCard({ dispensedCount, categoryDistribution }: DispensedTodayCardProps) {
  return (
    <section className="bg-surface-white border border-border-subtle rounded-lg shadow-sm">
      <div className="px-md py-md border-b border-border-subtle">
        <h2 className="font-headline-sm text-headline-sm m-0">Dispensed Today</h2>
      </div>
      <div className="p-md">
        <div className="flex flex-col gap-md">
          <div className="flex justify-between items-end">
            <p className="text-body-sm text-on-surface-variant m-0">Prescriptions Completed</p>
            <p className="font-headline-md text-headline-md m-0">{dispensedCount}</p>
          </div>

          <div className="space-y-sm">
            <p className="text-label-md text-secondary m-0">INVENTORY CATEGORIES</p>
            {categoryDistribution.map((cat, idx) => (
              <div key={cat.name}>
                <div className="flex justify-between text-body-sm mb-1">
                  <span>{cat.name}</span>
                  <span className="font-semibold">{cat.percent}%</span>
                </div>
                <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${categoryBarColor(idx)} h-full rounded-full`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
            {categoryDistribution.length === 0 && (
              <p className="text-body-sm text-secondary text-center pt-sm">No inventory records available.</p>
            )}
          </div>

          <div className="pt-md mt-sm border-t border-border-subtle flex items-center justify-center">
            <button
              type="button"
              onClick={() => toast.success('Shift report download started.')}
              className="text-body-sm font-semibold text-primary hover:text-primary-container transition-colors flex items-center gap-xs bg-transparent border-0 cursor-pointer p-0"
            >
              Download Shift Report
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function PharmacyDashboardContent() {
  const navigate = useNavigate()
  const [waitingQueue, setWaitingQueue] = useState<PharmacyQueueItem[]>([])
  const [completedQueue, setCompletedQueue] = useState<PharmacyQueueItem[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertItem[]>([])
  const [interactions, setInteractions] = useState<DrugInteractionItem[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<{ name: string; percent: number }[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [waitingRes, completedRes, lowStockRes, inventoryRes] = await Promise.all([
        pharmacyService.getQueue('waiting'),
        pharmacyService.getQueue('completed'),
        pharmacyService.getLowStockAlerts(),
        pharmacyService.getInventory({ page_size: 100 }),
      ])

      setWaitingQueue(waitingRes.queue || [])
      setCompletedQueue(completedRes.queue || [])
      setLowStockAlerts(lowStockRes.alerts || [])

      // Process category breakdown dynamically from inventory items
      const items = inventoryRes.items || []
      const counts: Record<string, number> = {}
      items.forEach((item) => {
        const cat = item.category || 'General'
        counts[cat] = (counts[cat] || 0) + 1
      })
      const total = items.length || 1
      const dist = Object.entries(counts)
        .map(([name, count]) => ({
          name,
          percent: Math.round((count / total) * 100),
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3)
      setCategoryDistribution(dist)

      // Fetch interactions for waiting queue patients
      const pendingPatients = waitingRes.queue || []
      const interactionChecks = await Promise.all(
        pendingPatients.map(async (p) => {
          try {
            const check = await pharmacyService.checkDrugInteractions(p.visit_id)
            return (check.alerts || []).map((alert) => ({
              patientName: p.patient_name,
              visitId: p.visit_id,
              type: alert.type,
              severity: alert.severity,
              drug_name: alert.drug_name,
              drug_a: alert.drug_a,
              drug_b: alert.drug_b,
              detail: alert.detail,
              recommendation: alert.recommendation,
            }))
          } catch {
            return []
          }
        })
      )

      setInteractions(interactionChecks.flat())
    } catch (err) {
      console.error(err)
      toast.error('Failed to load dashboard statistics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleDispense = (prescription: PharmacyQueueItem) => {
    if (!prescription.billing_cleared) return
    navigate(`/pharmacy/queue/${prescription.visit_id}/dispense`)
  }

  const stats = useMemo(() => {
    return {
      prescriptionsPending: waitingQueue.length,
      dispensedToday: completedQueue.length,
      drugInteractions: interactions.length,
      lowStockItems: lowStockAlerts.length,
    }
  }, [waitingQueue, completedQueue, interactions, lowStockAlerts])

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto w-full p-xl text-center text-secondary font-body-sm">
        Loading pharmacy dashboard data...
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <div className="grid grid-cols-12 gap-lg items-start">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
          <StatCards stats={stats} />
          <PrescriptionQueuePreview queue={waitingQueue} onDispense={handleDispense} />
          <DrugInteractionsCard interactions={interactions} />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          <InventoryAlertsCard alerts={lowStockAlerts} />
          <DispensedTodayCard
            dispensedCount={completedQueue.length}
            categoryDistribution={categoryDistribution}
          />
        </div>
      </div>
    </div>
  )
}
