import { useEffect, useState } from 'react'
import type { StockItem, StockRemovalReason } from '@/features/pharmacy/data/mockStockManagement'
import { STOCK_REMOVAL_REASONS } from '@/features/pharmacy/data/mockStockManagement'

interface Props {
  item: StockItem
  onClose: () => void
  onConfirm: (payload: { quantity: number; reason: StockRemovalReason; note: string }) => void
}

export function StockOutModal({ item, onClose, onConfirm }: Props) {
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState<StockRemovalReason | ''>('')
  const [note, setNote] = useState('')

  const qtyNum = Math.max(0, Number(quantity) || 0)
  const exceedsStock = qtyNum > item.stock
  const canConfirm = qtyNum > 0 && !exceedsStock && reason !== ''

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleConfirm = () => {
    if (!canConfirm || reason === '') return
    onConfirm({ quantity: qtyNum, reason, note: note.trim() })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-out-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md bg-surface-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-lg border-b border-error/20 bg-error/5">
          <h2 id="stock-out-modal-title" className="font-headline-sm text-headline-sm text-error m-0">
            Record Stock Removal
          </h2>
          <p className="font-body-sm text-body-sm text-error/80 m-0 mt-xs">
            Inventory adjustment for {item.drugName}
          </p>
        </div>

        <div className="p-lg flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="stock-out-qty">
              Quantity Removed
            </label>
            <input
              id="stock-out-qty"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className={`w-full px-md py-2 border rounded-lg text-body-sm focus:ring-1 ${
                exceedsStock
                  ? 'border-error focus:ring-error focus:border-error'
                  : 'border-border-subtle focus:ring-primary focus:border-primary'
              }`}
            />
            {exceedsStock && (
              <span className="font-label-sm text-label-sm text-error">
                Error: Cannot remove more than current stock ({item.stock.toLocaleString()}).
              </span>
            )}
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="stock-out-reason">
              Reason for Removal
            </label>
            <select
              id="stock-out-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as StockRemovalReason | '')}
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Select Reason</option>
              {STOCK_REMOVAL_REASONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="stock-out-note">
              Internal Note
            </label>
            <textarea
              id="stock-out-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain the reason for manual adjustment..."
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm h-20 resize-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="p-lg bg-surface-container-low flex justify-end gap-md">
          <button
            type="button"
            onClick={onClose}
            className="px-md py-2 text-secondary font-label-md text-label-md uppercase bg-transparent border-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-lg py-2 bg-error text-white rounded-lg font-label-md text-label-md uppercase border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Confirm Removal
          </button>
        </div>
      </div>
    </div>
  )
}
