import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  formatDispenseDate,
  getDispensePrescriptionById,
  type PrescriptionLineItem,
} from '@/features/pharmacy/data/mockDispensePrescription'

interface LineItemState {
  qty: number
  dispense: boolean
}

function BillingHeaderBadge({ cleared }: { cleared: boolean }) {
  if (!cleared) {
    return (
      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-warning text-white text-[11px] font-bold">
        PENDING
      </span>
    )
  }
  return (
    <span className="inline-flex px-2.5 py-0.5 rounded-full bg-success text-white text-[11px] font-bold">
      CLEARED
    </span>
  )
}

function hasStockShortage(item: PrescriptionLineItem, qty: number): boolean {
  return item.stockLevel === 'low' || qty > item.stockAvailable
}

function DispenseToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
      style={{ backgroundColor: checked ? '#003d9b' : '#c4c6d4' }}
      aria-label="Toggle dispense for medication"
    >
      <span
        aria-hidden
        className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out"
        style={{ transform: checked ? 'translateX(1.25rem)' : 'translateX(0)' }}
      />
    </button>
  )
}

function LabelPreviewCard({
  patientName,
  patientNumber,
  item,
  dispensedBy,
}: {
  patientName: string
  patientNumber: string
  item: PrescriptionLineItem
  dispensedBy: string
}) {
  const deptLine = item.labelDeptSubtitle ?? 'Pharmacy Dept | +255 22 215 1350'

  return (
    <div className="border-2 border-dashed border-border-subtle rounded-lg p-4 bg-surface-container-low relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => toast.success(`Printing label for ${item.drugName}`)}
          className="bg-surface-white p-1.5 rounded-full shadow-sm border border-border-subtle text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">print</span>
        </button>
      </div>
      <div className="text-center border-b border-border-subtle pb-2 mb-2">
        <p className="text-[11px] font-bold uppercase text-on-surface m-0">
          Muhimbili National Hospital
        </p>
        <p className="text-[10px] text-secondary m-0">{deptLine}</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[11px]">
          <span className="font-bold">Patient: {patientName}</span>
          <span>{patientNumber}</span>
        </div>
        <div className="py-2 border-y border-border-subtle border-dotted">
          <p className="font-semibold text-body-sm text-on-surface m-0">{item.drugName}</p>
          <p className="text-xs mt-1 italic text-on-surface-variant m-0">{item.labelInstructions}</p>
        </div>
        <div className="flex justify-between text-[10px] text-secondary pt-1">
          <span>Dispensed by: {dispensedBy}</span>
          <span>Date: {formatDispenseDate()}</span>
        </div>
      </div>
    </div>
  )
}

export function DispensePrescriptionContent() {
  const { prescriptionId } = useParams<{ prescriptionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const prescription = prescriptionId ? getDispensePrescriptionById(prescriptionId) : undefined

  const [acknowledged, setAcknowledged] = useState(false)
  const [lineStates, setLineStates] = useState<Record<string, LineItemState>>(() => {
    if (!prescription) return {}
    return Object.fromEntries(
      prescription.items.map((item) => [
        item.id,
        { qty: item.qtyToDispense, dispense: item.defaultDispense },
      ]),
    )
  })

  const dispensedBy = user?.full_name || user?.username || 'Mary Wanga'

  const lowStockCount = useMemo(() => {
    if (!prescription) return 0
    return prescription.items.filter((item) => {
      const qty = lineStates[item.id]?.qty ?? item.qtyToDispense
      return hasStockShortage(item, qty)
    }).length
  }, [prescription, lineStates])

  const activeLabels = useMemo(() => {
    if (!prescription) return []
    return prescription.items.filter((item) => lineStates[item.id]?.dispense)
  }, [prescription, lineStates])

  if (!prescription) {
    return <Navigate to="/pharmacy/queue" replace />
  }

  const hasInteraction = Boolean(prescription.interaction)
  const canConfirm = (!hasInteraction || acknowledged) && activeLabels.length > 0

  const updateLine = (id: string, patch: Partial<LineItemState>) => {
    setLineStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  const handleConfirm = () => {
    if (!canConfirm) return
    toast.success(`Dispensing confirmed for ${prescription.patientName}`)
    navigate('/pharmacy/queue')
  }

  const handleSaveDraft = () => {
    toast.info('Draft saved.')
  }

  return (
    <div className="max-w-container-max mx-auto w-full pb-28">
      <nav className="mb-sm" aria-label="Breadcrumb">
        <p className="font-label-md text-label-md text-secondary m-0">
          <Link to="/pharmacy/queue" className="text-secondary hover:underline no-underline">
            Prescription Queue
          </Link>
          <span className="text-outline mx-1">/</span>
          <span className="text-primary font-medium">
            Dispense — {prescription.patientNumber} {prescription.patientName}
          </span>
        </p>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg items-start">
        <div className="md:col-span-8 space-y-lg">
          <section className="bg-surface-white border border-border-subtle rounded-xl p-md grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-y-4 gap-x-gutter">
            <div className="min-w-[120px]">
              <label className="font-label-md text-label-md text-secondary block mb-0.5">PATIENT NAME</label>
              <p className="font-body-md font-semibold text-on-surface truncate m-0">{prescription.patientName}</p>
            </div>
            <div className="min-w-[100px]">
              <label className="font-label-md text-label-md text-secondary block mb-0.5">PATIENT #</label>
              <p className="font-body-sm font-semibold text-on-surface m-0">{prescription.patientNumber}</p>
            </div>
            <div className="min-w-[100px]">
              <label className="font-label-md text-label-md text-secondary block mb-0.5">AGE/GENDER</label>
              <p className="font-body-sm text-on-surface m-0">
                {prescription.age} / {prescription.gender}
              </p>
            </div>
            <div className="min-w-[100px]">
              <label className="font-label-md text-label-md text-secondary block mb-0.5">BILLING STATUS</label>
              <BillingHeaderBadge cleared={prescription.billingStatus === 'cleared'} />
            </div>
            <div className="min-w-[120px]">
              <label className="font-label-md text-label-md text-secondary block mb-0.5">PRESCRIBED BY</label>
              <p className="font-body-sm text-on-surface m-0">{prescription.prescribedBy}</p>
            </div>
            <div className="min-w-[100px]">
              <label className="font-label-md text-label-md text-secondary block mb-0.5">TIME</label>
              <p className="font-body-sm text-on-surface m-0">{prescription.prescribedAt}</p>
            </div>
          </section>

          <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
            <div className="px-md py-md border-b border-border-subtle">
              <h2 className="font-headline-sm text-headline-sm m-0">Prescription Items</h2>
            </div>

            {prescription.interaction && (
              <div
                className={`border-b border-error/20 px-md py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-md ${
                  acknowledged ? 'bg-success/10 opacity-50' : 'bg-error/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-error shrink-0">report</span>
                  <p className={`text-body-sm font-medium m-0 ${acknowledged ? 'text-success' : 'text-error'}`}>
                    Interaction:{' '}
                    <span className="font-bold">
                      {prescription.interaction.drugA} and {prescription.interaction.drugB}
                    </span>{' '}
                    — {prescription.interaction.severity}. Acknowledge to proceed.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="w-4 h-4 rounded text-error focus:ring-error border-error/50"
                  />
                  <span className="text-body-sm font-semibold text-error">Acknowledge</span>
                </label>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-border-subtle">
                  <tr>
                    <th className="px-md py-3 font-label-md text-label-md text-secondary">DRUG NAME</th>
                    <th className="px-3 py-3 font-label-md text-label-md text-secondary">DOSE</th>
                    <th className="px-3 py-3 font-label-md text-label-md text-secondary">FREQ.</th>
                    <th className="px-3 py-3 font-label-md text-label-md text-secondary">DUR.</th>
                    <th className="px-3 py-3 font-label-md text-label-md text-secondary">QTY TO DISPENSE</th>
                    <th className="px-3 py-3 font-label-md text-label-md text-secondary">STOCK</th>
                    <th className="px-3 py-3 font-label-md text-label-md text-secondary text-center">DISPENSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {prescription.items.map((item) => {
                    const state = lineStates[item.id]
                    const isLowStock = item.stockLevel === 'low'
                    const qtyExceedsStock = state.qty > item.stockAvailable
                    const shortage = hasStockShortage(item, state.qty)

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          shortage ? 'bg-error/[0.02] hover:bg-error/5' : 'hover:bg-primary/5'
                        }`}
                      >
                        <td className="px-md py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-body-sm font-semibold text-on-surface m-0">{item.drugName}</p>
                            {item.hasInteraction && (
                              <span
                                className="material-symbols-outlined text-error text-lg"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                priority_high
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-secondary m-0">{item.category}</p>
                          {shortage && (
                            <p className="text-[10px] font-bold text-error uppercase tracking-wide mt-1 m-0">
                              Stock shortage
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-4 font-body-sm text-body-sm">{item.dose}</td>
                        <td className="px-3 py-4 font-body-sm text-body-sm">{item.frequency}</td>
                        <td className="px-3 py-4 font-body-sm text-body-sm">{item.duration}</td>
                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min={0}
                            value={state.qty}
                            onChange={(e) => updateLine(item.id, { qty: Number(e.target.value) || 0 })}
                            className={`w-20 h-9 rounded-lg border font-body-sm text-body-sm px-2 outline-none ${
                              shortage
                                ? 'border-error text-error font-semibold bg-error/5 focus:border-error focus:ring-1 focus:ring-error'
                                : 'border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary'
                            }`}
                          />
                          {qtyExceedsStock && (
                            <p className="text-[10px] text-error font-medium mt-1 m-0 whitespace-nowrap">
                              Exceeds stock by {state.qty - item.stockAvailable}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <p
                            className={`font-body-sm text-body-sm m-0 ${
                              shortage ? 'text-error font-bold' : 'text-success font-semibold'
                            }`}
                          >
                            {item.stockAvailable.toLocaleString()} Available
                          </p>
                          {isLowStock && (
                            <p className="text-[10px] text-warning font-bold mt-0.5 m-0">Low stock threshold</p>
                          )}
                        </td>
                        <td className="px-3 py-4 text-center">
                          <DispenseToggle
                            checked={state.dispense}
                            onChange={(dispense) => updateLine(item.id, { dispense })}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="md:col-span-4">
          <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden sticky top-24 shadow-sm">
            <div className="px-md py-md border-b border-border-subtle flex justify-between items-center bg-surface-container-low/30">
              <h2 className="font-headline-sm text-headline-sm m-0">Label Preview</h2>
              <button
                type="button"
                onClick={() => toast.success('Printing all labels…')}
                className="text-primary font-semibold text-xs flex items-center gap-1 hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Print All
              </button>
            </div>
            <div className="p-md space-y-md max-h-[calc(100vh-280px)] overflow-y-auto">
              {prescription.items.map((item) => {
                const isActive = lineStates[item.id]?.dispense
                if (!isActive) {
                  return (
                    <div
                      key={item.id}
                      className="border-2 border-dashed border-border-subtle rounded-lg p-4 bg-surface-container-low opacity-60"
                    >
                      <p className="text-center text-xs italic py-4 text-secondary m-0">
                        Preview for {item.drugName} will appear once dispensed status is toggled ON
                      </p>
                    </div>
                  )
                }
                return (
                  <LabelPreviewCard
                    key={item.id}
                    patientName={prescription.patientName}
                    patientNumber={prescription.patientNumber}
                    item={item}
                    dispensedBy={dispensedBy}
                  />
                )
              })}
            </div>
          </section>
        </div>
      </div>

      <footer className="fixed bottom-0 right-0 left-0 lg:left-sidebar-width h-20 bg-surface-white border-t border-border-subtle px-lg flex flex-col sm:flex-row items-center justify-between gap-sm z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2 min-w-0">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 text-warning">
              <span className="material-symbols-outlined text-[20px]">info</span>
              <p className="font-body-sm text-body-sm font-medium m-0">
                {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} currently{' '}
                {lowStockCount !== 1 ? 'have' : 'has'} stock issues.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-md shrink-0">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-6 h-10 rounded-lg border border-border-subtle text-on-surface-variant font-semibold font-body-sm hover:bg-surface-container-low transition-colors bg-white cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="px-8 h-10 rounded-lg bg-success text-white font-bold font-body-sm shadow-sm hover:brightness-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed border-0 cursor-pointer"
          >
            Confirm Dispensing
          </button>
        </div>
      </footer>
    </div>
  )
}
