import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { StockInModal } from '@/features/pharmacy/components/StockInModal'
import { StockOutModal } from '@/features/pharmacy/components/StockOutModal'
import {
  CATEGORY_BADGE,
  STOCK_CATEGORIES,
  STOCK_PAGE_SIZE,
  getStockStatus,
  type DrugCategory,
  type StockItem,
  type StockStatus,
} from '@/features/pharmacy/data/mockStockManagement'
import { pharmacyService, type InventoryItem } from '@/api/services/pharmacy'

type CategoryFilter = 'all' | DrugCategory
type StatusFilter = 'all' | StockStatus

const STATUS_CONFIG: Record<StockStatus, { label: string; dot: string; text: string }> = {
  in_stock: { label: 'In Stock', dot: 'bg-success', text: 'text-success' },
  low_stock: { label: 'Low Stock', dot: 'bg-warning', text: 'text-warning' },
  out_of_stock: { label: 'Out of Stock', dot: 'bg-error', text: 'text-error' },
}

interface StatCardsProps {
  stats: {
    totalItems: number
    lowStock: number
    outOfStock: number
    expiringSoon: number
  }
}

function StatCards({ stats }: StatCardsProps) {
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
  isOpen,
  onToggle,
  onStockIn,
  onStockOut,
}: {
  item: StockItem
  isOpen: boolean
  onToggle: (id: string, rect: DOMRect) => void
  onStockIn: (item: StockItem) => void
  onStockOut: (item: StockItem) => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
          onToggle(item.id, rect)
        }}
        className="p-1 hover:bg-primary/10 text-primary rounded transition-colors bg-transparent border-0 cursor-pointer"
        title="More Actions"
        aria-label={`Actions for ${item.drugName}`}
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>
    </div>
  )
}

function getRowClass(status: StockStatus): string {
  if (status === 'low_stock') return 'hover:bg-primary/5 bg-warning/5 transition-colors'
  if (status === 'out_of_stock') return 'hover:bg-primary/5 bg-error/5 transition-colors'
  return 'hover:bg-primary/5 transition-colors'
}

export function StockManagementContent() {
  const [dbItems, setDbItems] = useState<InventoryItem[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [stockInItem, setStockInItem] = useState<StockItem | null>(null)
  const [stockOutItem, setStockOutItem] = useState<StockItem | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null)

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const params = {
        search: search.trim() || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        low_stock: statusFilter === 'low_stock' ? true : undefined,
        page,
        page_size: STOCK_PAGE_SIZE,
      }
      const res = await pharmacyService.getInventory(params)
      setDbItems(res.items || [])
      setTotalCount(res.total || 0)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load inventory stock.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [search, categoryFilter, statusFilter, page])

  const mappedStockItems = useMemo<StockItem[]>(() => {
    return dbItems.map((item) => {
      // Format last_restocked_at date as MM/YYYY if available
      let expiry = 'N/A'
      if (item.last_restocked_at) {
        const d = new Date(item.last_restocked_at)
        expiry = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      }
      return {
        id: item.inventory_id,
        drugName: item.drug_name,
        category: (item.category as DrugCategory) || 'General',
        stock: item.quantity_in_stock,
        unit: item.unit,
        minThreshold: item.reorder_level,
        maxThreshold: item.reorder_level * 5,
        expiry,
      }
    })
  }, [dbItems])

  const stats = useMemo(() => {
    const totalItems = totalCount
    const lowStock = dbItems.filter((i) => i.quantity_in_stock <= i.reorder_level && i.quantity_in_stock > 0).length
    const outOfStock = dbItems.filter((i) => i.quantity_in_stock === 0).length
    return {
      totalItems,
      lowStock,
      outOfStock,
      expiringSoon: 0,
    }
  }, [dbItems, totalCount])

  const handleResetFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setPage(1)
  }

  const handleMenuToggle = (id: string, rect: DOMRect) => {
    if (openMenuId === id) {
      setOpenMenuId(null)
      setMenuAnchor(null)
    } else {
      setOpenMenuId(id)
      // Anchor just below and to the right of the button, using fixed coords
      setMenuAnchor({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      })
    }
  }

  const handleMenuClose = () => {
    setOpenMenuId(null)
    setMenuAnchor(null)
  }

  const handleStockIn = async (payload: { quantity: number; batchNumber: string; expiry: string }) => {
    if (!stockInItem) return
    try {
      // Find matching db item
      const dbItem = dbItems.find((i) => i.inventory_id === stockInItem.id)
      if (!dbItem) return

      await pharmacyService.restockInventory({
        inventory_id: stockInItem.id,
        quantity_added: payload.quantity,
        batch_number: payload.batchNumber,
        expiry_date: payload.expiry,
        unit_cost: dbItem.unit_cost,
        notes: 'Recorded stock intake via frontend UI',
      })
      setStockInItem(null)
      fetchInventory()
      toast.success(`Stock intake recorded for ${stockInItem.drugName}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to register stock intake.')
    }
  }

  const handleStockOut = async (payload: { quantity: number; reason: string; note: string }) => {
    if (!stockOutItem) return
    try {
      const typeMap: Record<string, 'adjustment' | 'write_off' | 'return'> = {
        dispensed: 'adjustment',
        expired: 'write_off',
        damaged: 'write_off',
        correction: 'adjustment',
      }
      await pharmacyService.adjustInventory({
        inventory_id: stockOutItem.id,
        transaction_type: typeMap[payload.reason] || 'adjustment',
        quantity_change: -payload.quantity, // Negative for removal
        notes: payload.note || 'Manual adjustment via stock-out UI',
      })
      setStockOutItem(null)
      fetchInventory()
      toast.success(`Stock removal recorded for ${stockOutItem.drugName}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to register stock adjustment.')
    }
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * STOCK_PAGE_SIZE + 1
  const rangeEnd = Math.min(page * STOCK_PAGE_SIZE, totalCount)
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
              <strong className="font-semibold">{stats.lowStock} items</strong> are below minimum stock level.{' '}
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
            <option value="low_stock">Low Stock</option>
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
          {loading ? (
            <div className="p-xl text-center text-secondary">Loading inventory items...</div>
          ) : (
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
                {mappedStockItems.map((item) => {
                  const status = getStockStatus(item.stock, item.minThreshold)
                  return (
                    <tr key={item.id} className={getRowClass(status)}>
                      <td className="px-lg py-md font-semibold text-on-surface whitespace-nowrap">
                        {item.drugName}
                      </td>
                      <td className="px-lg py-md whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium text-[12px] ${CATEGORY_BADGE[item.category] || 'bg-surface-container-highest'}`}
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
                            isOpen={openMenuId === item.id}
                            onToggle={handleMenuToggle}
                            onStockIn={(i) => { setStockInItem(i); handleMenuClose() }}
                            onStockOut={(i) => { setStockOutItem(i); handleMenuClose() }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {mappedStockItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-lg py-xl text-center text-secondary font-body-sm">
                      No inventory items match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-lg py-md border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-md">
          <span className="font-body-sm text-body-sm text-secondary">
            Showing {rangeStart}-{rangeEnd} of {totalCount} items
          </span>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-surface-white text-secondary hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-3 font-semibold text-body-sm">Page {page}</span>
            <button
              type="button"
              disabled={rangeEnd >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-surface-white text-secondary hover:bg-surface-variant transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fixed-position dropdown — escapes overflow-x-auto clipping */}
      {openMenuId && menuAnchor && (() => {
        const activeItem = mappedStockItems.find((i) => i.id === openMenuId)
        if (!activeItem) return null
        return (
          <>
            {/* Click-outside backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={handleMenuClose}
              aria-hidden
            />
            <div
              className="fixed z-50 min-w-[160px] bg-surface-white border border-border-subtle rounded-lg shadow-xl py-xs overflow-hidden"
              style={{ top: menuAnchor.top, right: menuAnchor.right }}
            >
              <button
                type="button"
                onClick={() => { setStockInItem(activeItem); handleMenuClose() }}
                className="w-full text-left px-md py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low bg-transparent border-0 cursor-pointer flex items-center gap-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-success">add_box</span>
                Stock In
              </button>
              <button
                type="button"
                onClick={() => { setStockOutItem(activeItem); handleMenuClose() }}
                className="w-full text-left px-md py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low bg-transparent border-0 cursor-pointer flex items-center gap-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-error">remove_circle</span>
                Stock Out
              </button>
            </div>
          </>
        )
      })()}

      {stockInItem && (
        <StockInModal
          item={stockInItem}
          onClose={() => setStockInItem(null)}
          onConfirm={handleStockIn}
        />
      )}

      {stockOutItem && (
        <StockOutModal
          item={stockOutItem}
          onClose={() => setStockOutItem(null)}
          onConfirm={handleStockOut}
        />
      )}
    </div>
  )
}
