import { useEffect, useState } from 'react'
import type { StockItem } from '@/features/pharmacy/data/mockStockManagement'

interface Props {
  item: StockItem
  onClose: () => void
  onConfirm: (payload: { quantity: number; batchNumber: string; expiry: string }) => void
}

export function StockInModal({ item, onClose, onConfirm }: Props) {
  const [quantity, setQuantity] = useState('0')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiry, setExpiry] = useState('')

  const qtyNum = Math.max(0, Number(quantity) || 0)
  const previewTotal = item.stock + qtyNum

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleConfirm = () => {
    if (qtyNum <= 0) return
    onConfirm({ quantity: qtyNum, batchNumber: batchNumber.trim(), expiry })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-in-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md bg-surface-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-lg border-b border-border-subtle">
          <h2 id="stock-in-modal-title" className="font-headline-sm text-headline-sm text-on-surface m-0">
            Record Stock Intake
          </h2>
          <p className="font-body-sm text-body-sm text-secondary m-0 mt-xs">
            {item.drugName} (Current: {item.stock.toLocaleString()})
          </p>
        </div>

        <div className="p-lg flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="stock-in-qty">
              Quantity Received
            </label>
            <input
              id="stock-in-qty"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-success focus:border-success"
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="stock-in-batch">
                Batch #
              </label>
              <input
                id="stock-in-batch"
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface-variant uppercase" htmlFor="stock-in-expiry">
                Expiry
              </label>
              <input
                id="stock-in-expiry"
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full px-md py-2 border border-border-subtle rounded-lg text-body-sm focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="p-md bg-success/5 border border-success/10 rounded-lg flex items-center justify-between">
            <span className="font-body-sm text-body-sm text-success">Updated Total Stock Preview:</span>
            <span className="font-headline-sm text-headline-sm text-success font-bold">
              {previewTotal.toLocaleString()}
            </span>
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
            disabled={qtyNum <= 0}
            className="px-lg py-2 bg-success text-white rounded-lg font-label-md text-label-md uppercase border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Confirm Stock In
          </button>
        </div>
      </div>
    </div>
  )
}
