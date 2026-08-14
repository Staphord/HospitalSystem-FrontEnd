import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { consultationService } from '@/api/services/consultation'
import type { InvestigationResultData } from '@/api/services/consultation'

// ── Types ─────────────────────────────────────────────────────────────────────

type ResultStatus = 'critical' | 'ready' | 'pending' | 'acknowledged'
type ResultDept   = 'lab' | 'radiology'

interface InvestigationResult {
  id: string
  patientName: string
  patientNumber: string
  patientId: string
  initials: string
  test: string
  dept: ResultDept
  orderedAt: string
  completedAt: string | null
  status: ResultStatus
  resultValues?: string
  referenceRange?: string
  labNotes?: string
  visitId?: string
}

// ── API Mapping Helper ────────────────────────────────────────────────────────

const mapInvestigationResult = (data: InvestigationResultData): InvestigationResult => {
  const name = data.patient.full_name
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'PT'

  const formatDate = (raw: string | null) => {
    if (!raw) return null
    try {
      return new Date(raw).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return raw
    }
  }

  let mappedStatus: ResultStatus = 'pending'
  if (
    data.status === 'critical' ||
    data.status === 'ready' ||
    data.status === 'pending' ||
    data.status === 'acknowledged'
  ) {
    mappedStatus = data.status
  }

  return {
    id: data.id,
    patientName: name,
    patientNumber: data.patient.patient_number,
    patientId: data.patient.id,
    initials,
    test: data.test_name,
    dept: data.request_type.toLowerCase() === 'radiology' ? 'radiology' : 'lab',
    orderedAt: formatDate(data.ordered_at) || '—',
    completedAt: formatDate(data.completed_at),
    status: mappedStatus,
    resultValues: data.result_values || undefined,
    referenceRange: data.reference_range || undefined,
    labNotes: data.lab_notes || undefined,
    visitId: data.visit_id,
  }
}


// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ResultStatus, { badge: string; rowBg: string; label: string; ping?: boolean }> = {
  critical:     { badge: 'bg-error text-white font-bold',                                         rowBg: 'bg-[#FFF4F4]',   label: 'Critical'     },
  ready:        { badge: 'bg-success/20 text-success border border-success/30 font-bold',         rowBg: 'bg-surface-white', label: 'Ready'      },
  pending:      { badge: 'bg-warning/20 text-[#8B5E00] border border-warning/30 font-bold',       rowBg: 'bg-surface-white', label: 'Pending', ping: true },
  acknowledged: { badge: 'bg-surface-container text-on-surface-variant border border-border-subtle font-bold', rowBg: 'bg-surface-white', label: 'Reviewed' },
}

const DEPT_CONFIG: Record<ResultDept, { badge: string; label: string }> = {
  lab:       { badge: 'bg-[#FFAB00]/10 text-[#FFAB00] border border-[#FFAB00]/20', label: 'Lab'      },
  radiology: { badge: 'bg-[#42526E]/10 text-[#42526E] border border-[#42526E]/20', label: 'Radiology' },
}

const AVATAR_BG: Record<ResultStatus, string> = {
  critical:     'bg-error-container text-on-error-container',
  ready:        'bg-secondary-container text-on-secondary-container',
  pending:      'bg-tertiary-fixed text-on-tertiary-fixed',
  acknowledged: 'bg-surface-container text-on-surface-variant',
}

// ── Result Detail Modal ────────────────────────────────────────────────────────

interface ResultModalProps {
  result: InvestigationResult
  onClose: () => void
  onAcknowledge: (id: string) => void
  onOpenEncounter: (visitId: string) => void
}

function ResultDetailModal({ result, onClose, onAcknowledge, onOpenEncounter }: ResultModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const isCritical    = result.status === 'critical'
  const isAcknowledged = result.status === 'acknowledged'
  const hasPending    = result.status === 'pending'
  const sCfg          = STATUS_CONFIG[result.status]
  const dCfg          = DEPT_CONFIG[result.dept]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Result — ${result.test}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[640px] bg-surface-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className={`px-lg py-md border-b flex items-start justify-between ${isCritical ? 'border-error bg-[#FFF4F4]' : 'border-border-subtle'}`}>
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <span className={`px-2 py-0.5 rounded font-label-sm text-[10px] uppercase font-bold ${dCfg.badge}`}>{dCfg.label}</span>
              <span className={`px-2 py-0.5 rounded font-label-sm text-[10px] uppercase inline-flex items-center gap-xs ${sCfg.badge}`}>
                {sCfg.ping && <span className="w-1.5 h-1.5 rounded-full bg-[#8B5E00] animate-ping shrink-0" />}
                {sCfg.label}
              </span>
            </div>
            <h5 className="font-headline-sm text-headline-sm text-on-surface m-0">{result.test}</h5>
            <p className="font-body-sm text-body-sm text-outline mt-xs m-0">
              {result.patientName} · {result.patientNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-xs rounded-full hover:bg-surface-container transition-colors bg-transparent border-0 cursor-pointer text-outline hover:text-on-surface -mt-1 -mr-1"
          >
            <span className="material-symbols-outlined leading-none">close</span>
          </button>
        </div>

        {/* Critical banner */}
        {isCritical && (
          <div className="bg-error px-lg py-sm flex items-center gap-sm">
            <span className="material-symbols-outlined text-white text-[18px] leading-none">warning</span>
            <span className="font-label-md text-label-md text-white uppercase tracking-wider">
              Critical Result — Immediate review required
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-lg space-y-md">
          {/* Meta row */}
          <div className="grid grid-cols-2 gap-md">
            <div className="bg-surface-container-low rounded-lg p-md">
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Ordered At</p>
              <p className="font-body-md text-body-md text-on-surface m-0">{result.orderedAt}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-md">
              <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Completed At</p>
              <p className="font-body-md text-body-md text-on-surface m-0">
                {result.completedAt ?? <span className="text-warning italic">Processing…</span>}
              </p>
            </div>
          </div>

          {/* Pending state */}
          {hasPending ? (
            <div className="flex flex-col items-center justify-center py-xl gap-md text-center border border-dashed border-border-subtle rounded-xl">
              <span className="material-symbols-outlined text-[48px] text-outline/40 leading-none" style={{ fontVariationSettings: "'wght' 200" }}>
                labs
              </span>
              <p className="font-body-md text-body-md text-outline max-w-xs m-0">
                This result has not yet been processed. Check back when the status changes to <strong>Ready</strong>.
              </p>
            </div>
          ) : (
            <>
              {/* Result values */}
              <div className={`rounded-xl p-md border ${isCritical ? 'border-error/30 bg-[#FFF4F4]' : 'border-border-subtle bg-surface-container-low'}`}>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0 flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] leading-none">biotech</span>
                  Result Values
                </p>
                <p className={`font-body-md text-body-md m-0 font-semibold whitespace-pre-wrap ${isCritical ? 'text-error' : 'text-on-surface'}`}>
                  {result.resultValues}
                </p>
              </div>

              {/* Reference range */}
              {result.referenceRange && (
                <div className="bg-surface-container-low rounded-lg p-md border border-border-subtle">
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs m-0">Reference Range</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0">{result.referenceRange}</p>
                </div>
              )}

              {/* Lab / radiology notes */}
              {result.labNotes && (
                <div className="border border-border-subtle rounded-xl p-md">
                  <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider mb-sm m-0 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[16px] leading-none">notes</span>
                    {result.dept === 'radiology' ? 'Radiologist Notes' : 'Lab Comments'}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed m-0">{result.labNotes}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-lowest flex items-center justify-between gap-sm flex-wrap">
          {/* Left: Open Encounter */}
          <button
            type="button"
            onClick={() => { result.visitId && onOpenEncounter(result.visitId); onClose() }}
            disabled={!result.visitId}
            className="flex items-center gap-xs px-md h-9 border border-border-subtle rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-white transition-colors bg-transparent cursor-pointer disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[16px] leading-none">open_in_new</span>
            Open Encounter
          </button>

          {/* Right: Acknowledge + Close */}
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={onClose}
              className="px-md h-9 border border-border-subtle rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-white transition-colors bg-transparent cursor-pointer"
            >
              Close
            </button>
            {!hasPending && !isAcknowledged && (
              <button
                type="button"
                onClick={() => { onAcknowledge(result.id); onClose() }}
                className="px-md h-9 bg-primary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity border-0 cursor-pointer flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[16px] leading-none">check_circle</span>
                Acknowledge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Row action dropdown ────────────────────────────────────────────────────────

interface ActionMenuProps {
  result: InvestigationResult
  anchorRect: DOMRect
  onViewResult: () => void
  onAcknowledge: () => void
  onOpenEncounter: () => void
  onViewHistory: () => void
  onClose: () => void
}

function ActionMenu({ result, anchorRect, onViewResult, onAcknowledge, onOpenEncounter, onViewHistory, onClose }: ActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const hasResult  = result.status === 'ready' || result.status === 'critical'
  const canAck     = hasResult
  const isPending  = result.status === 'pending'
  const isAcked    = result.status === 'acknowledged'

  const spaceBelow = window.innerHeight - anchorRect.bottom
  const positionAbove = spaceBelow < 220

  const style: React.CSSProperties = {
    position: 'fixed',
    top: positionAbove ? 'auto' : `${anchorRect.bottom + 4}px`,
    bottom: positionAbove ? `${window.innerHeight - anchorRect.top + 4}px` : 'auto',
    right: `${Math.max(12, window.innerWidth - anchorRect.right)}px`,
  }

  return (
    <div
      ref={menuRef}
      style={style}
      className="z-50 w-52 bg-surface-white border border-border-subtle rounded-xl shadow-xl py-xs overflow-hidden"
      role="menu"
    >
      {/* View Result / Order Details */}
      {(hasResult || isAcked) ? (
        <button
          type="button"
          role="menuitem"
          onClick={onViewResult}
          className="w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer text-left"
        >
          <span className="material-symbols-outlined text-[18px] leading-none text-primary">biotech</span>
          View Full Result
        </button>
      ) : isPending ? (
        <button
          type="button"
          role="menuitem"
          onClick={onViewResult}
          className="w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer text-left"
        >
          <span className="material-symbols-outlined text-[18px] leading-none text-outline">info</span>
          View Order Details
        </button>
      ) : null}

      {/* Acknowledge */}
      {canAck && (
        <button
          type="button"
          role="menuitem"
          onClick={onAcknowledge}
          className="w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer text-left"
        >
          <span className="material-symbols-outlined text-[18px] leading-none text-success">check_circle</span>
          Acknowledge Result
        </button>
      )}

      {/* Divider */}
      <div className="h-px bg-border-subtle my-xs mx-md" />

      {/* Open Encounter */}
      <button
        type="button"
        role="menuitem"
        onClick={onOpenEncounter}
        className="w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer text-left"
      >
        <span className="material-symbols-outlined text-[18px] leading-none text-secondary">stethoscope</span>
        Open Patient Encounter
      </button>

      {/* View Patient History */}
      <button
        type="button"
        role="menuitem"
        onClick={onViewHistory}
        className="w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer text-left"
      >
        <span className="material-symbols-outlined text-[18px] leading-none text-secondary">history</span>
        View Patient History
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function InvestigationResultsPage() {
  const navigate = useNavigate()

  const [results, setResults]           = useState<InvestigationResult[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [deptFilter, setDeptFilter]     = useState<'all' | ResultDept>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ResultStatus>('all')
  const [pageSize, setPageSize]         = useState(10)
  const [currentPage, setCurrentPage]   = useState(1)
  const [menuAnchor, setMenuAnchor]     = useState<{ id: string; rect: DOMRect } | null>(null)
  const [viewingResult, setViewingResult] = useState<InvestigationResult | null>(null)

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  useEffect(() => {
    setLoading(true)
    consultationService.getInvestigationResults()
      .then((res) => {
        setResults((res || []).map(mapInvestigationResult))
        setLoading(false)
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to fetch investigation results'
        toast.error(msg)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, deptFilter, statusFilter])

  const acknowledgeResult = (id: string) => {
    consultationService.acknowledgeInvestigation(id)
      .then(() => {
        setResults((prev) =>
          prev.map((r) => r.id === id ? { ...r, status: 'acknowledged' as ResultStatus } : r)
        )
        toast.success('Result acknowledged successfully')
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to acknowledge result'
        toast.error(msg)
      })
  }

  const filtered = useMemo(() => {
    let data = [...results]
    const q = search.trim().toLowerCase()
    if (q) {
      data = data.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.patientNumber.toLowerCase().includes(q) ||
          r.test.toLowerCase().includes(q),
      )
    }
    if (deptFilter !== 'all')   data = data.filter((r) => r.dept === deptFilter)
    if (statusFilter !== 'all') data = data.filter((r) => r.status === statusFilter)
    data.sort((a, b) => {
      if (a.status === 'critical' && b.status !== 'critical') return -1
      if (b.status === 'critical' && a.status !== 'critical') return 1
      return 0
    })
    return data
  }, [search, deptFilter, statusFilter, results])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage    = Math.min(currentPage, totalPages)
  const pageStart   = (safePage - 1) * pageSize
  const paginated   = filtered.slice(pageStart, pageStart + pageSize)
  const showingFrom = filtered.length === 0 ? 0 : pageStart + 1
  const showingTo   = Math.min(pageStart + pageSize, filtered.length)

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg">

      {/* Filter Bar */}
      <section className="flex flex-wrap gap-md items-end">
        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Search Patients</label>
          <div className="flex items-center gap-sm border border-border-subtle rounded-lg px-3 py-2 bg-surface-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
            <span className="material-symbols-outlined text-outline text-[20px] leading-none pointer-events-none select-none shrink-0">person_search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Patient # or Test"
              className="flex-1 bg-transparent border-0 outline-none p-0 m-0 font-body-sm text-body-sm text-on-surface placeholder:text-outline"
            />
          </div>
        </div>

        {/* Department */}
        <div className="w-44">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value as 'all' | ResultDept)}
            className="w-full border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm bg-surface-white px-sm py-2 outline-none transition-all cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="lab">Lab</option>
            <option value="radiology">Radiology</option>
          </select>
        </div>

        {/* Status */}
        <div className="w-44">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ResultStatus)}
            className="w-full border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm bg-surface-white px-sm py-2 outline-none transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ready">Ready</option>
            <option value="critical">Critical</option>
            <option value="acknowledged">Reviewed</option>
          </select>
        </div>

        {/* Date range */}
        <div className="w-60">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Date Range</label>
          <div className="flex items-center gap-sm border border-border-subtle rounded-lg px-3 py-2 bg-surface-white cursor-pointer outline-none">
            <span className="material-symbols-outlined text-outline text-[20px] leading-none pointer-events-none select-none shrink-0">calendar_today</span>
            <input
              type="text"
              readOnly
              value="Jul 10, 2026 – Jul 20, 2026"
              className="flex-1 bg-transparent border-0 outline-none p-0 m-0 font-body-sm text-body-sm text-on-surface cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Results Table Card */}
      <div className="bg-surface-white border border-border-subtle shadow-sm rounded-2xl overflow-hidden">
        {/* Card header */}
        <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-on-surface">My Investigation Results</h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                {['Patient Name', 'Patient #', 'Test / Imaging', 'Dept', 'Ordered At', 'Completed At', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest ${i === 7 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
             <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-lg py-xl text-center">
                    <div className="flex flex-col items-center justify-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-[36px] animate-spin">sync</span>
                      <p className="font-body-sm text-body-sm text-outline m-0">Loading results from database...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-lg py-xl text-center font-body-sm text-body-sm text-secondary italic">
                    No results match the selected filters.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const sCfg   = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending
                  const dCfg   = DEPT_CONFIG[r.dept]
                  const avatar = AVATAR_BG[r.status] || AVATAR_BG.pending

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setViewingResult(r)}
                      className={`transition-colors hover:bg-hover-tint cursor-pointer ${sCfg.rowBg}`}
                    >
                      {/* Patient Name */}
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-sm">
                          <div className={`w-8 h-8 rounded-full ${avatar} flex items-center justify-center font-bold text-xs shrink-0`}>
                            {r.initials}
                          </div>
                          <span className="font-semibold text-on-surface">{r.patientName}</span>
                        </div>
                      </td>

                      {/* Patient # */}
                      <td className="px-lg py-md font-mono font-body-sm text-body-sm text-secondary whitespace-nowrap">
                        {r.patientNumber}
                      </td>

                      {/* Test */}
                      <td className="px-lg py-md font-body-sm text-body-sm font-medium">{r.test}</td>

                      {/* Dept badge */}
                      <td className="px-lg py-md">
                        <span className={`px-2 py-1 rounded font-label-sm text-[10px] uppercase ${dCfg.badge}`}>
                          {dCfg.label}
                        </span>
                      </td>

                      {/* Ordered at */}
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                        {r.orderedAt}
                      </td>

                      {/* Completed at */}
                      <td className="px-lg py-md font-body-sm text-body-sm whitespace-nowrap">
                        {r.completedAt ?? <span className="text-secondary italic">Processing...</span>}
                      </td>

                      {/* Status badge */}
                      <td className="px-lg py-md">
                        <span className={`px-2 py-1 rounded font-label-sm text-[10px] uppercase inline-flex items-center gap-xs ${sCfg.badge}`}>
                          {sCfg.ping && <span className="w-1.5 h-1.5 rounded-full bg-[#8B5E00] animate-ping shrink-0" />}
                          {sCfg.label}
                        </span>
                      </td>

                      {/* Actions — stop propagation so row click doesn't trigger */}
                      <td className="px-lg py-md text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (menuAnchor?.id === r.id) {
                                setMenuAnchor(null)
                              } else {
                                setMenuAnchor({ id: r.id, rect: e.currentTarget.getBoundingClientRect() })
                              }
                            }}
                            className={`p-2 transition-colors rounded-full border-0 cursor-pointer ${
                              menuAnchor?.id === r.id
                                ? 'bg-surface-container text-on-surface'
                                : 'text-on-surface-variant hover:bg-surface-container bg-transparent'
                            }`}
                            title="More actions"
                            aria-haspopup="true"
                            aria-expanded={menuAnchor?.id === r.id}
                          >
                            <span className="material-symbols-outlined leading-none">more_vert</span>
                          </button>

                          {menuAnchor?.id === r.id && (
                            <ActionMenu
                              result={r}
                              anchorRect={menuAnchor.rect}
                              onViewResult={() => { setViewingResult(r); setMenuAnchor(null) }}
                              onAcknowledge={() => { acknowledgeResult(r.id); setMenuAnchor(null) }}
                              onOpenEncounter={() => { navigate(`/consultation/encounter/${r.visitId ?? ''}`); setMenuAnchor(null) }}
                              onViewHistory={() => { navigate(`/consultation/history/${r.patientId}`); setMenuAnchor(null) }}
                              onClose={() => setMenuAnchor(null)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-md bg-surface-bright border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-md">
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              {filtered.length === 0
                ? 'No results match filters'
                : `Showing ${showingFrom} to ${showingTo} of ${filtered.length} results`}
            </p>
            {filtered.length > 0 && (
              <div className="flex items-center gap-xs">
                <span className="font-body-sm text-body-sm text-secondary">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-8 px-xs border border-border-subtle rounded font-body-sm bg-white outline-none cursor-pointer text-secondary"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-surface-white text-secondary hover:bg-surface-container-highest transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded border font-label-md text-label-md transition-colors cursor-pointer ${
                  p === safePage
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-white text-secondary border-border-subtle hover:bg-surface-container-highest'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-surface-white text-secondary hover:bg-surface-container-highest transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Result detail modal */}
      {viewingResult && (
        <ResultDetailModal
          result={viewingResult}
          onClose={() => setViewingResult(null)}
          onAcknowledge={(id) => { acknowledgeResult(id); setViewingResult(null) }}
          onOpenEncounter={(visitId) => navigate(`/consultation/encounter/${visitId}`)}
        />
      )}
    </div>
  )
}
