import { useEffect, useState } from 'react'
import type { DrugCategory } from '@/features/pharmacy/data/mockStockManagement'
import { STOCK_CATEGORIES } from '@/features/pharmacy/data/mockStockManagement'

export interface NewStockItemForm {
  drugName: string
  category: DrugCategory
  unit: string
  expiry: string
  minThreshold: number
  maxThreshold: number
  initialStock: number
}

interface Props {
  onClose: () => void
  onSave: (form: NewStockItemForm) => void
}

export function AddStockItemModal({ onClose, onSave }: Props) {
  const [drugName, setDrugName] = useState('')
  const [category, setCategory] = useState<DrugCategory>('Analgesic')
  const [unit, setUnit] = useState('')
  const [expiry, setExpiry] = useState('')
  const [minThreshold, setMinThreshold] = useState('')
  const [maxThreshold, setMaxThreshold] = useState('')
  const [initialStock, setInitialStock] = useState('0')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = () => {
    if (!drugName.trim()) return
    onSave({
      drugName: drugName.trim(),
      category,
      unit: unit.trim() || 'Unit',
      expiry: expiry || '—',
      minThreshold: Math.max(0, Number(minThreshold) || 0),
      maxThreshold: Math.max(0, Number(maxThreshold) || 0),
      initialStock: Math.max(0, Number(initialStock) || 0),
    })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-stock-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl bg-surface-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-lg border-b border-border-subtle flex items-center justify-between">
          <h2 id="add-stock-modal-title" className="font-headline-sm text-headline-sm text-on-surface m-0">
            Add New Stock Item
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface p-1 bg-transparent border-0 cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined leading-none">close</span>
          </button>
        </div>

        <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="md:col-span-1 flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="add-drug-name">
              Drug Name
            </label>
            <input
              id="add-drug-name"
              type="text"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              placeholder="e.g. Ibuprofen 200mg"
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="md:col-span-1 flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="add-category">
              Category
            </label>
            <select
              id="add-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DrugCategory)}
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {STOCK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="add-unit">
              Unit Type
            </label>
            <input
              id="add-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. Pack, Vial"
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="add-expiry">
              Expiry Date
            </label>
            <input
              id="add-expiry"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="add-min">
              Min Threshold
            </label>
            <input
              id="add-min"
              type="number"
              min={0}
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="add-max">
              Max Threshold
            </label>
            <input
              id="add-max"
              type="number"
              min={0}
              value={maxThreshold}
              onChange={(e) => setMaxThreshold(e.target.value)}
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="add-initial">
              Initial Stock Quantity
            </label>
            <input
              id="add-initial"
              type="number"
              min={0}
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="p-lg bg-surface-container-low border-t border-border-subtle flex justify-end gap-md">
          <button
            type="button"
            onClick={onClose}
            className="px-lg py-2 text-secondary font-label-md text-label-md uppercase bg-transparent border-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!drugName.trim()}
            className="px-lg py-2 bg-primary text-white rounded-lg font-label-md text-label-md uppercase border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-container transition-colors"
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  )
}
