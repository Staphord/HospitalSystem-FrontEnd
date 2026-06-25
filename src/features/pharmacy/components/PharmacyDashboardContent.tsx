import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DISPENSED_TODAY,
  DRUG_INTERACTIONS,
  LOW_STOCK_ITEMS,
  PENDING_PRESCRIPTIONS,
  PHARMACY_DASHBOARD_STATS,
  type BillingStatus,
  type PendingPrescription,
} from '@/features/pharmacy/data/mockPharmacyDashboard'

function BillingBadge({ status }: { status: BillingStatus }) {
  if (status === 'cleared') {
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

function StatCards() {
  const { prescriptionsPending, dispensedToday, drugInteractions, lowStockItems } =
    PHARMACY_DASHBOARD_STATS

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

function PrescriptionQueuePreview({
  onDispense,
}: {
  onDispense: (prescription: PendingPrescription) => void
}) {
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
            {PENDING_PRESCRIPTIONS.map((rx) => {
              const canDispense = rx.billingStatus === 'cleared'
              return (
                <tr key={rx.id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="px-lg py-md font-body-sm text-body-sm font-semibold">{rx.patientName}</td>
                  <td className="px-lg py-md font-body-sm text-body-sm">
                    {rx.medicationCount} med{rx.medicationCount !== 1 ? 's' : ''}
                  </td>
                  <td className="px-lg py-md">
                    <BillingBadge status={rx.billingStatus} />
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
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DrugInteractionsCard() {
  const interaction = DRUG_INTERACTIONS[0]
  if (!interaction) return null

  return (
    <section className="bg-surface-white border border-border-subtle border-l-[3px] border-l-error rounded-lg overflow-hidden shadow-sm">
      <div className="px-lg py-md border-b border-border-subtle">
        <h2 className="font-headline-sm text-headline-sm text-error flex items-center gap-sm m-0">
          <span className="material-symbols-outlined text-[20px]">report_problem</span>
          Drug Interactions
        </h2>
      </div>
      <div className="p-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md p-md bg-error/5 rounded border border-error/10">
          <div className="flex gap-md items-start">
            <div className="mt-1">
              <span className="px-2 py-0.5 rounded-full bg-error text-white text-[10px] font-bold uppercase tracking-wider">
                High Severity
              </span>
            </div>
            <div>
              <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">
                {interaction.patientName}
              </p>
              <p className="text-body-sm text-on-surface-variant m-0 mt-1">
                <span className="font-semibold text-error">{interaction.drugA}</span> interacts with{' '}
                <span className="font-semibold text-error">{interaction.drugB}</span>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.info(`Reviewing interaction for ${interaction.patientName}`)}
            className="text-body-sm font-semibold text-error hover:underline flex items-center gap-xs bg-transparent border-0 cursor-pointer p-0"
          >
            Review interaction
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </button>
        </div>
      </div>
    </section>
  )
}

function InventoryAlertsCard() {
  return (
    <section className="bg-surface-white border border-border-subtle border-l-[3px] border-l-warning rounded-lg shadow-sm">
      <div className="px-md py-md border-b border-border-subtle flex justify-between items-center">
        <h2 className="font-headline-sm text-headline-sm flex items-center gap-sm m-0">
          <span className="material-symbols-outlined text-warning">inventory</span>
          Inventory Alerts
        </h2>
        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">
          {LOW_STOCK_ITEMS.length} Items
        </span>
      </div>
      <div className="p-md flex flex-col gap-sm">
        {LOW_STOCK_ITEMS.map((item) => (
          <div
            key={item.id}
            className="p-sm flex justify-between items-center hover:bg-surface-container-low transition-colors rounded"
          >
            <div>
              <p className="font-body-sm text-body-sm font-semibold m-0">{item.name}</p>
              <p className="text-label-sm text-on-surface-variant m-0">Threshold: {item.threshold}</p>
            </div>
            <div className="text-right">
              <p
                className={`font-body-sm text-body-sm font-bold m-0 ${
                  item.level === 'critical' ? 'text-error' : 'text-warning'
                }`}
              >
                {item.remaining} left
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
      </div>
    </section>
  )
}

function categoryBarColor(color: 'primary' | 'info' | 'success'): string {
  switch (color) {
    case 'info':
      return 'bg-info'
    case 'success':
      return 'bg-success'
    default:
      return 'bg-primary'
  }
}

function DispensedTodayCard() {
  const { totalVolume, categories } = DISPENSED_TODAY

  return (
    <section className="bg-surface-white border border-border-subtle rounded-lg shadow-sm">
      <div className="px-md py-md border-b border-border-subtle">
        <h2 className="font-headline-sm text-headline-sm m-0">Dispensed Today</h2>
      </div>
      <div className="p-md">
        <div className="flex flex-col gap-md">
          <div className="flex justify-between items-end">
            <p className="text-body-sm text-on-surface-variant m-0">Total Volume</p>
            <p className="font-headline-md text-headline-md m-0">{totalVolume} Meds</p>
          </div>

          <div className="space-y-sm">
            <p className="text-label-md text-secondary m-0">TOP CATEGORIES</p>
            {categories.map((category) => (
              <div key={category.name}>
                <div className="flex justify-between text-body-sm mb-1">
                  <span>{category.name}</span>
                  <span className="font-semibold">{category.percent}%</span>
                </div>
                <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${categoryBarColor(category.barColor)} h-full rounded-full`}
                    style={{ width: `${category.percent}%` }}
                  />
                </div>
              </div>
            ))}
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

  const handleDispense = (prescription: PendingPrescription) => {
    if (prescription.billingStatus !== 'cleared') return
    navigate(`/pharmacy/queue/${prescription.id}/dispense`)
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <div className="grid grid-cols-12 gap-lg items-start">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-lg">
          <StatCards />
          <PrescriptionQueuePreview onDispense={handleDispense} />
          <DrugInteractionsCard />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          <InventoryAlertsCard />
          <DispensedTodayCard />
        </div>
      </div>
    </div>
  )
}
