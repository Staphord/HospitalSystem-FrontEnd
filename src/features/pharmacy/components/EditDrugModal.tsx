import { useEffect, useState } from 'react'
import { STOCK_CATEGORIES } from '@/features/pharmacy/data/mockStockManagement'
import type { StockItem } from '@/features/pharmacy/types/pharmacy.types'
import type { InventoryItem } from '@/api/services/pharmacy'

interface EditDrugModalProps {
  item: StockItem
  dbItem?: InventoryItem
  onClose: () => void
  onConfirm: (inventoryId: string, payload: {
    drug_name?: string
    brand_name?: string
    drug_code?: string
    category?: string
    unit?: string
    reorder_level?: number
    unit_cost?: number
    unit_price?: number
    location?: string
  }) => Promise<void>
}

const UNIT_OPTIONS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Vial',
  'Ointment',
  'Inhaler',
  'Patch',
  'Bottle',
  'Sachet',
]

export function EditDrugModal({ item, dbItem, onClose, onConfirm }: EditDrugModalProps) {
  const [drugName, setDrugName] = useState(dbItem?.drug_name || item.drugName)
  const [brandName, setBrandName] = useState(dbItem?.brand_name || '')
  const [drugCode, setDrugCode] = useState(dbItem?.drug_code || '')
  const [category, setCategory] = useState(dbItem?.category || item.category || STOCK_CATEGORIES[0] || 'General')
  const [unit, setUnit] = useState(dbItem?.unit || item.unit || 'Tablet')
  const [reorderLevel, setReorderLevel] = useState(String(dbItem?.reorder_level ?? item.minThreshold ?? 10))
  const [unitCost, setUnitCost] = useState(String(dbItem?.unit_cost ?? 0.00))
  const [unitPrice, setUnitPrice] = useState(String(dbItem?.unit_price ?? 0.00))
  const [location, setLocation] = useState(dbItem?.location || '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!drugName.trim() || !category || !unit) return

    try {
      setSubmitting(true)
      await onConfirm(item.id, {
        drug_name: drugName.trim(),
        brand_name: brandName.trim() || undefined,
        drug_code: drugCode.trim() || undefined,
        category,
        unit,
        reorder_level: Math.max(0, Number(reorderLevel) || 0),
        unit_cost: Math.max(0, Number(unitCost) || 0),
        unit_price: Math.max(0, Number(unitPrice) || 0),
        location: location.trim() || undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-drug-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl bg-surface-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-container-low/40">
          <div>
            <h3 id="edit-drug-modal-title" className="font-title-md text-title-md font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">edit_note</span>
              Edit Drug Inventory Item
            </h3>
            <p className="font-body-sm text-body-sm text-secondary">
              Update selling price, cost, category, or reorder thresholds for {item.drugName}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-lg space-y-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                Drug Generic Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="e.g. Paracetamol"
                className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                Brand Name (Optional)
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Panadol"
                className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div>
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                Drug / SKU Code
              </label>
              <input
                type="text"
                value={drugCode}
                onChange={(e) => setDrugCode(e.target.value)}
                placeholder="e.g. DRUG-PARA"
                className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary font-mono text-[13px]"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                Category <span className="text-error">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {STOCK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                Dispensing Unit <span className="text-error">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-md rounded-lg bg-surface-container-low border border-border-subtle space-y-md">
            <h4 className="font-label-md text-label-md font-bold text-on-surface flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
              Pricing & Costing
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                  Selling Price per Unit (TZS) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary font-semibold text-primary"
                />
                <p className="text-[11px] text-secondary mt-1">This price is charged to patient bills upon prescription.</p>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                  Unit Cost (TZS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-secondary mt-1">Purchase cost paid to supplier.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                Reorder Threshold Level
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="10"
                className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm font-semibold text-on-surface mb-xs">
                Pharmacy Shelf / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Rack B, Shelf 2"
                className="w-full px-md py-sm rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-md border-t border-border-subtle flex justify-end gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-lg py-sm rounded-lg border border-border-subtle bg-surface-white font-label-md text-label-md font-semibold text-secondary hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-lg py-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-xs cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
