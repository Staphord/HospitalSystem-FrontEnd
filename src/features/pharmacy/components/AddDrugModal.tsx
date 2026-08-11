import { useEffect, useState } from 'react'
import { STOCK_CATEGORIES } from '@/features/pharmacy/data/mockStockManagement'

interface AddDrugModalProps {
  onClose: () => void
  onConfirm: (payload: {
    drug_name: string
    brand_name?: string
    drug_code: string
    category: string
    unit: string
    quantity_in_stock: number
    reorder_level: number
    unit_cost: number
    unit_price: number
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

export function AddDrugModal({ onClose, onConfirm }: AddDrugModalProps) {
  const [drugName, setDrugName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [drugCode, setDrugCode] = useState('')
  const [category, setCategory] = useState(STOCK_CATEGORIES[0] || 'General')
  const [unit, setUnit] = useState('Tablet')
  const [quantityInStock, setQuantityInStock] = useState('0')
  const [reorderLevel, setReorderLevel] = useState('10')
  const [unitCost, setUnitCost] = useState('0.00')
  const [unitPrice, setUnitPrice] = useState('0.00')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Auto-generate a drug code from drug name if empty
  const handleDrugNameChange = (val: string) => {
    setDrugName(val)
    if (!drugCode || drugCode.startsWith('DRUG-')) {
      const codeSuffix = val
        .replaceAll(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 6)
      setDrugCode(codeSuffix ? `DRUG-${codeSuffix}` : '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!drugName.trim() || !drugCode.trim() || !category || !unit) return

    try {
      setSubmitting(true)
      await onConfirm({
        drug_name: drugName.trim(),
        brand_name: brandName.trim() || undefined,
        drug_code: drugCode.trim(),
        category,
        unit,
        quantity_in_stock: Math.max(0, Number(quantityInStock) || 0),
        reorder_level: Math.max(0, Number(reorderLevel) || 10),
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
      aria-labelledby="add-drug-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl bg-surface-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-container-low/40">
          <div>
            <h2 id="add-drug-modal-title" className="font-headline-sm text-headline-sm text-on-surface m-0">
              Add New Drug / Medication
            </h2>
            <p className="font-body-sm text-body-sm text-secondary m-0 mt-xs">
              Add a new pharmaceutical item to the hospital inventory catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined leading-none">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-lg space-y-md overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="drug-name">
                Generic Drug Name <span className="text-error">*</span>
              </label>
              <input
                id="drug-name"
                type="text"
                required
                value={drugName}
                onChange={(e) => handleDrugNameChange(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg"
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="brand-name">
                Brand / Trade Name
              </label>
              <input
                id="brand-name"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Augmentin"
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="drug-code">
                SKU / Drug Code <span className="text-error">*</span>
              </label>
              <input
                id="drug-code"
                type="text"
                required
                value={drugCode}
                onChange={(e) => setDrugCode(e.target.value)}
                placeholder="e.g. DRUG-AMX-500"
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="category">
                Category <span className="text-error">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary bg-surface-white"
              >
                {STOCK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="unit">
                Unit of Measure <span className="text-error">*</span>
              </label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary bg-surface-white"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="location">
                Storage Location / Shelf
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Shelf A-3"
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="quantity">
                Initial Stock Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min={0}
                value={quantityInStock}
                onChange={(e) => setQuantityInStock(e.target.value)}
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="reorder-level">
                Min Reorder Threshold Level
              </label>
              <input
                id="reorder-level"
                type="number"
                min={0}
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="unit-cost">
                Unit Purchase Cost ($)
              </label>
              <input
                id="unit-cost"
                type="number"
                step="0.01"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold" htmlFor="unit-price">
                Unit Selling Price ($)
              </label>
              <input
                id="unit-price"
                type="number"
                step="0.01"
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="px-lg py-md border-t border-border-subtle bg-surface-container-low flex justify-end gap-md -mx-lg -mb-lg mt-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-2 text-secondary font-label-md text-label-md uppercase bg-transparent border-0 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !drugName.trim() || !drugCode.trim()}
              className="px-lg py-2 bg-primary text-white rounded-lg font-label-md text-label-md uppercase border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-container transition-colors flex items-center gap-xs"
            >
              {submitting ? 'Saving...' : 'Add Drug to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
