import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AddStockItemModal, type NewStockItemForm } from '@/features/pharmacy/components/AddStockItemModal'
import { StockInModal } from '@/features/pharmacy/components/StockInModal'
import { StockOutModal } from '@/features/pharmacy/components/StockOutModal'
import {
  CATEGORY_BADGE,
  INITIAL_STOCK_ITEMS,
  STOCK_CATEGORIES,
  STOCK_PAGE_SIZE,
  STOCK_TOTAL_COUNT,
  computeStockStats,
  getStockStatus,
  type DrugCategory,
  type StockItem,
  type StockStatus,
} from '@/features/pharmacy/data/mockStockManagement'

type CategoryFilter = 'all' | DrugCategory
type StatusFilter = 'all' | StockStatus

const STATUS_CONFIG: Record<StockStatus, { label: string; dot: string; text: string }> = {
  in_stock: { label: 'In Stock', dot: 'bg-success', text: 'text-success' },
  low_stock: { label: 'Low Stock', dot: 'bg-warning', text: 'text-warning' },
  out_of_stock: { label: 'Out of Stock', dot: 'bg-error', text: 'text-error' },
}

function formatExpiryFromDate(isoDate: string): string {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${month}/${date.getFullYear()}`
}

function StatCards({ stats }: { stats: ReturnType<typeof computeStockStats> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm text-secondary">Total Items</span>
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{stats.totalItems}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm text-secondary">Low Stock</span>
          <span
            className="material-symbols-outlined text-[20px] text-warning"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
        </div>
        <span className="font-headline-lg text-headline-lg text-warning">{stats.lowStock}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm text-secondary">Out of Stock</span>
          <span
            className="material-symbols-outlined text-[20px] text-error"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            error
          </span>
        </div>
        <span className="font-headline-lg text-headline-lg text-error">{stats.outOfStock}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-body-sm text-body-sm text-secondary">Expiring Soon</span>
          <span className="material-symbols-outlined text-[20px] text-warning">schedule</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-warning">{stats.expiringSoon}</span>
      </div>
    </div>
  )
}

function StockStatusBadge({ status }: { status: StockStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`flex items-center gap-xs font-bold uppercase text-[11px] ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function StockRowActionsMenu({
  item,
  onStockIn,
  onStockOut,
}: {
  item: StockItem
  onStockIn: (item: StockItem) => void
  onStockOut: (item: StockItem) => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1 hover:bg-primary/10 text-primary rounded transition-colors bg-transparent border-0 cursor-pointer"
        title="More Actions"
        aria-label={`Actions for ${item.drugName}`}
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] bg-surface-white border border-border-subtle rounded-lg shadow-lg py-xs overflow-hidden">
          <button
            type="button"
            onClick={() => {
              onStockIn(item)
              setOpen(false)
            }}
            className="w-full text-left px-md py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low bg-transparent border-0 cursor-pointer flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-success">add_box</span>
            Stock In
          </button>
          <button
            type="button"
            onClick={() => {
              onStockOut(item)
              setOpen(false)
            }}
            className="w-full text-left px-md py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low bg-transparent border-0 cursor-pointer flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-error">remove_circle</span>
            Stock Out
          </button>
        </div>
      )}
    </div>
  )
}

function getRowClass(status: StockStatus): string {
  if (status === 'low_stock') return 'hover:bg-primary/5 bg-warning/5 transition-colors'
  if (status === 'out_of_stock') return 'hover:bg-primary/5 bg-error/5 transition-colors'
  return 'hover:bg-primary/5 transition-colors'
}

export function StockManagementContent() {
  const [items, setItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [stockInItem, setStockInItem] = useState<StockItem | null>(null)
  const [stockOutItem, setStockOutItem] = useState<StockItem | null>(null)

  const stats = useMemo(() => computeStockStats(items), [items])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      const status = getStockStatus(item.stock, item.minThreshold)
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (statusFilter !== 'all' && status !== statusFilter) return false
      if (query && !item.drugName.toLowerCase().includes(query)) return false
      return true
    })
  }, [items, search, categoryFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / STOCK_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * STOCK_PAGE_SIZE
    return filteredItems.slice(start, start + STOCK_PAGE_SIZE)
  }, [filteredItems, safePage])

  const rangeStart = filteredItems.length === 0 ? 0 : (safePage - 1) * STOCK_PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * STOCK_PAGE_SIZE, filteredItems.length)
  const displayTotal = search || categoryFilter !== 'all' || statusFilter !== 'all'
    ? filteredItems.length
    : STOCK_TOTAL_COUNT

  const handleResetFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const handleAddItem = (form: NewStockItemForm) => {
    const id = `stk-${Date.now()}`
    const newItem: StockItem = {
      id,
      drugName: form.drugName,
      category: form.category,
      stock: form.initialStock,
      unit: form.unit,
      minThreshold: form.minThreshold,
      maxThreshold: form.maxThreshold,
      expiry: formatExpiryFromDate(form.expiry),
    }
    setItems((prev) => [newItem, ...prev])
    setAddModalOpen(false)
    toast.success(`${form.drugName} added to inventory.`)
  }

  const handleStockIn = (itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, stock: item.stock + quantity } : item,
      ),
    )
    setStockInItem(null)
    toast.success(`Stock intake recorded (+${quantity}).`)
  }

  const handleStockOut = (itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, stock: Math.max(0, item.stock - quantity) } : item,
      ),
    )
    setStockOutItem(null)
    toast.success(`Stock removal recorded (-${quantity}).`)
  }

  const showWarningBanner = stats.lowStock > 0 || stats.outOfStock > 0

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg pb-lg">
      <StatCards stats={stats} />

      {showWarningBanner && (
        <div className="flex items-center justify-between p-md bg-warning/5 rounded-lg border border-warning/20">
          <div className="flex items-center gap-md">
            <span
              className="material-symbols-outlined text-warning shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <p className="font-body-md text-body-md text-on-surface m-0">
              <strong className="font-semibold">{stats.lowStock} items</strong> are below minimum stock
              level.{' '}
              {stats.outOfStock > 0 && (
                <>
                  <strong className="font-semibold">{stats.outOfStock} item</strong>
                  {stats.outOfStock !== 1 ? 's are' : ' is'} out of stock.{' '}
                </>
              )}
              Review and reorder.
            </p>
          </div>
        </div>
      )}

      <div className="bg-surface-white rounded-xl border border-border-subtle shadow-sm overflow-hidden w-full">
        <div className="px-lg py-md border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Drug Inventory</h2>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="h-8 px-md bg-primary text-white rounded-lg font-label-md text-label-md flex items-center gap-sm hover:bg-primary-container transition-all border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Stock Item
          </button>
        </div>

        <div className="px-lg py-sm bg-surface-container-low border-b border-border-subtle flex flex-wrap gap-md items-center">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by drug name..."
              className="w-full pl-10 pr-4 py-1.5 h-8 border border-border-subtle rounded-lg text-body-sm bg-surface-white focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as CategoryFilter)
              setPage(1)
            }}
            className="px-md py-1.5 h-8 border border-border-subtle rounded-lg text-body-sm bg-surface-white min-w-[160px] focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Categories</option>
            {STOCK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter)
              setPage(1)
            }}
            className="px-md py-1.5 h-8 border border-border-subtle rounded-lg text-body-sm bg-surface-white min-w-[160px] focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="all">Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-md py-1.5 h-8 text-secondary font-label-md text-label-md hover:bg-surface-variant rounded-lg transition-colors flex items-center gap-xs bg-transparent border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider whitespace-nowrap">
                  Drug Name
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider whitespace-nowrap">
                  Category
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider whitespace-nowrap">
                  Stock
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider whitespace-nowrap">
                  Unit
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider whitespace-nowrap">
                  Threshold (Min/Max)
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider whitespace-nowrap">
                  Expiry
                </th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-body-sm text-body-sm">
              {paginatedItems.map((item) => {
                const status = getStockStatus(item.stock, item.minThreshold)
                return (
                  <tr key={item.id} className={getRowClass(status)}>
                    <td className="px-lg py-md font-semibold text-on-surface whitespace-nowrap">
                      {item.drugName}
                    </td>
                    <td className="px-lg py-md whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md font-medium text-[12px] ${CATEGORY_BADGE[item.category]}`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td
                      className={`px-lg py-md font-bold whitespace-nowrap ${
                        status === 'out_of_stock'
                          ? 'text-error'
                          : status === 'low_stock'
                            ? 'text-warning'
                            : 'text-on-surface'
                      }`}
                    >
                      {item.stock.toLocaleString()}
                    </td>
                    <td className="px-lg py-md whitespace-nowrap">{item.unit}</td>
                    <td className="px-lg py-md text-secondary whitespace-nowrap">
                      {item.minThreshold.toLocaleString()} / {item.maxThreshold.toLocaleString()}
                    </td>
                    <td className="px-lg py-md whitespace-nowrap">
                      <StockStatusBadge status={status} />
                    </td>
                    <td className="px-lg py-md whitespace-nowrap">{item.expiry}</td>
                    <td className="px-lg py-md text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-sm">
                        <StockRowActionsMenu
                          item={item}
                          onStockIn={setStockInItem}
                          onStockOut={setStockOutItem}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-lg py-xl text-center text-secondary font-body-sm">
                    No inventory items match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-lg py-md border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-md">
          <span className="font-body-sm text-body-sm text-secondary">
            Showing {rangeStart}-{rangeEnd} of {displayTotal} items
          </span>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-surface-white text-secondary hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded border text-label-md cursor-pointer ${
                  safePage === p
                    ? 'border-primary bg-secondary-container text-primary font-bold'
                    : 'border-border-subtle bg-surface-white text-secondary hover:bg-surface-variant'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-surface-white text-secondary hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {addModalOpen && (
        <AddStockItemModal onClose={() => setAddModalOpen(false)} onSave={handleAddItem} />
      )}

      {stockInItem && (
        <StockInModal
          item={stockInItem}
          onClose={() => setStockInItem(null)}
          onConfirm={({ quantity }) => handleStockIn(stockInItem.id, quantity)}
        />
      )}

      {stockOutItem && (
        <StockOutModal
          item={stockOutItem}
          onClose={() => setStockOutItem(null)}
          onConfirm={({ quantity }) => handleStockOut(stockOutItem.id, quantity)}
        />
      )}
    </div>
  )
}
