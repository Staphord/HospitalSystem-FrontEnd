import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

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

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_RESULTS: InvestigationResult[] = [
  {
    id: 'r-01', patientName: 'Fatuma Said',   patientNumber: 'MNH-2024-0892', patientId: 'p-003',
    initials: 'FS', test: 'HbA1c', dept: 'lab',
    orderedAt: 'Oct 24  08:30', completedAt: 'Oct 24  10:15', status: 'critical',
    resultValues: 'HbA1c: 10.2%',
    referenceRange: 'Target: < 7.0% for diabetic patients',
    labNotes: 'Result significantly above therapeutic target. Immediate clinical review recommended. Previous result 3 months ago: 9.4%.',
    visitId: 'V-2026-010',
  },
  {
    id: 'r-02', patientName: 'John Doe',      patientNumber: 'MNH-2024-1234', patientId: 'p-004',
    initials: 'JD', test: 'Chest X-Ray', dept: 'radiology',
    orderedAt: 'Oct 24  09:00', completedAt: 'Oct 24  11:30', status: 'ready',
    resultValues: 'Mild peribronchial thickening bilaterally. No consolidation, effusion or pneumothorax.',
    referenceRange: 'No acute cardiopulmonary pathology',
    labNotes: 'Report by Dr. Radiologist on call. Correlation with clinical findings advised.',
    visitId: 'enc-004',
  },
  {
    id: 'r-03', patientName: 'Aisha Bakari',  patientNumber: 'MNH-2024-1456', patientId: 'p-005',
    initials: 'AB', test: 'Full Blood Count', dept: 'lab',
    orderedAt: 'Oct 24  10:00', completedAt: null, status: 'pending',
    visitId: 'enc-005',
  },
  {
    id: 'r-04', patientName: 'Hassan Mwita',  patientNumber: 'MNH-2024-1104', patientId: 'p-002',
    initials: 'HM', test: 'Renal Ultrasound', dept: 'radiology',
    orderedAt: 'Oct 23  14:00', completedAt: 'Oct 23  16:45', status: 'ready',
    resultValues: 'Both kidneys normal in size and echotexture. No hydronephrosis. No calculi seen. Bladder unremarkable.',
    referenceRange: 'Normal renal parenchyma bilaterally',
    labNotes: 'No significant findings. Right kidney: 11.2 cm. Left kidney: 10.8 cm.',
    visitId: 'enc-002',
  },
  {
    id: 'r-05', patientName: 'Grace Kimaro',  patientNumber: 'MNH-2024-0755', patientId: 'p-006',
    initials: 'GK', test: 'CRP', dept: 'lab',
    orderedAt: 'Oct 24  11:00', completedAt: null, status: 'pending',
    visitId: 'enc-006',
  },
  {
    id: 'r-06', patientName: 'Omar Suleiman', patientNumber: 'MNH-2024-1560', patientId: 'p-007',
    initials: 'OS', test: 'Urea & Electrolytes', dept: 'lab',
    orderedAt: 'Oct 23  09:15', completedAt: 'Oct 23  11:00', status: 'ready',
    resultValues: 'Na⁺: 138 mmol/L  |  K⁺: 3.8 mmol/L  |  Urea: 5.2 mmol/L  |  Creatinine: 88 µmol/L',
    referenceRange: 'Na⁺ 135–145  |  K⁺ 3.5–5.0  |  Urea 2.5–7.8  |  Creatinine 60–110',
    labNotes: 'All parameters within normal limits.',
    visitId: 'enc-007',
  },
  {
    id: 'r-07', patientName: 'Zuwena Hamisi', patientNumber: 'MNH-2024-1601', patientId: 'p-008',
    initials: 'ZH', test: 'CT Head', dept: 'radiology',
    orderedAt: 'Oct 22  13:00', completedAt: 'Oct 22  15:30', status: 'critical',
    resultValues: 'Right-sided acute subdural hematoma ~8 mm. Midline shift of 4 mm to the left.',
    referenceRange: 'No intracranial hemorrhage expected',
    labNotes: 'URGENT: Neurosurgery consult immediately required. Patient should be kept NPO. Repeat CT in 6 hours if no surgical intervention.',
    visitId: 'enc-008',
  },
  {
    id: 'r-08', patientName: 'Bakari Juma',   patientNumber: 'MNH-2024-0711', patientId: 'p-009',
    initials: 'BJ', test: 'Malaria RDT', dept: 'lab',
    orderedAt: 'Oct 22  08:00', completedAt: 'Oct 22  09:00', status: 'acknowledged',
    resultValues: 'P. falciparum antigen: Positive  |  PAN antigen: Positive',
    referenceRange: 'Expected: Negative',
    labNotes: 'Plasmodium falciparum detected. Thick film smear confirmatory test sent.',
    visitId: 'enc-009',
  },
  {
    id: 'r-09', patientName: 'Amina Khalid',  patientNumber: 'MNH-2024-1820', patientId: 'p-010',
    initials: 'AK', test: 'Liver Function Tests', dept: 'lab',
    orderedAt: 'Oct 24  07:30', completedAt: null, status: 'pending',
    visitId: 'enc-010',
  },
  {
    id: 'r-10', patientName: 'Salim Baraka',  patientNumber: 'MNH-2024-1933', patientId: 'p-011',
    initials: 'SB', test: 'Abdominal Ultrasound', dept: 'radiology',
    orderedAt: 'Oct 21  10:00', completedAt: 'Oct 21  13:00', status: 'ready',
    resultValues: 'Liver: Normal size, echogenicity and surface. No focal lesion. CBD: 4 mm. Pancreas: Normal. Spleen: Normal. No free fluid.',
    referenceRange: 'Normal abdominal organs',
    labNotes: 'Unremarkable abdominal ultrasound.',
    visitId: 'enc-011',
  },
]

const PAGE_SIZE = 5

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
  onViewResult: () => void
  onAcknowledge: () => void
  onOpenEncounter: () => void
  onViewHistory: () => void
  onClose: () => void
}

function ActionMenu({ result, onViewResult, onAcknowledge, onOpenEncounter, onViewHistory, onClose }: ActionMenuProps) {
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

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-xs z-40 w-52 bg-surface-white border border-border-subtle rounded-xl shadow-lg py-xs overflow-hidden"
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

  const [results, setResults]           = useState<InvestigationResult[]>(INITIAL_RESULTS)
  const [search, setSearch]             = useState('')
  const [deptFilter, setDeptFilter]     = useState<'all' | ResultDept>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ResultStatus>('all')
  const [applied, setApplied]           = useState({ search: '', dept: 'all' as 'all' | ResultDept, status: 'all' as 'all' | ResultStatus })
  const [currentPage, setCurrentPage]   = useState(1)
  const [openMenuId, setOpenMenuId]     = useState<string | null>(null)
  const [viewingResult, setViewingResult] = useState<InvestigationResult | null>(null)

  const applyFilters = () => {
    setApplied({ search: search.trim().toLowerCase(), dept: deptFilter, status: statusFilter })
    setCurrentPage(1)
  }

  const acknowledgeResult = (id: string) => {
    setResults((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'acknowledged' as ResultStatus } : r)
    )
  }

  const filtered = useMemo(() => {
    let data = [...results]
    if (applied.search) {
      data = data.filter(
        (r) =>
          r.patientName.toLowerCase().includes(applied.search) ||
          r.patientNumber.toLowerCase().includes(applied.search),
      )
    }
    if (applied.dept !== 'all')   data = data.filter((r) => r.dept === applied.dept)
    if (applied.status !== 'all') data = data.filter((r) => r.status === applied.status)
    data.sort((a, b) => {
      if (a.status === 'critical' && b.status !== 'critical') return -1
      if (b.status === 'critical' && a.status !== 'critical') return 1
      return 0
    })
    return data
  }, [applied, results])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg">

      {/* Filter Bar */}
      <section className="flex flex-wrap gap-md items-end">
        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-xs">Search Patients</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] leading-none pointer-events-none select-none">person_search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Name or Patient #"
              className="w-full pl-10 pr-sm py-2 border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm bg-surface-white outline-none transition-all"
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
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] leading-none pointer-events-none select-none">calendar_today</span>
            <input
              type="text"
              readOnly
              value="Oct 20, 2024 – Oct 25, 2024"
              className="w-full pl-10 pr-sm py-2 border border-border-subtle rounded-lg font-body-sm text-body-sm bg-surface-white cursor-pointer outline-none"
            />
          </div>
        </div>

        {/* Apply */}
        <button
          type="button"
          onClick={applyFilters}
          className="h-[42px] bg-primary text-white px-lg rounded-lg font-label-md text-label-md flex items-center gap-sm hover:opacity-90 transition-opacity border-0 cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">filter_list</span>
          Apply Filters
        </button>
      </section>

      {/* Results Table Card */}
      <div className="bg-surface-white border border-border-subtle shadow-sm rounded-2xl overflow-hidden">
        {/* Card header */}
        <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-on-surface">My Investigation Results</h3>
          <div className="flex gap-sm">
            <button type="button" className="text-secondary hover:bg-surface-container px-sm py-1 rounded font-label-md text-label-md flex items-center gap-xs transition-colors cursor-pointer border-0 bg-transparent">
              <span className="material-symbols-outlined text-[18px] leading-none">download</span>
              Export CSV
            </button>
            <button type="button" className="text-secondary hover:bg-surface-container px-sm py-1 rounded font-label-md text-label-md flex items-center gap-xs transition-colors cursor-pointer border-0 bg-transparent">
              <span className="material-symbols-outlined text-[18px] leading-none">print</span>
              Print
            </button>
          </div>
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-lg py-xl text-center font-body-sm text-body-sm text-secondary italic">
                    No results match the selected filters.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const sCfg   = STATUS_CONFIG[r.status]
                  const dCfg   = DEPT_CONFIG[r.dept]
                  const avatar = AVATAR_BG[r.status]

                  return (
                    <tr key={r.id} className={`transition-colors hover:bg-hover-tint ${sCfg.rowBg}`}>
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

                      {/* Actions — relative container for dropdown */}
                      <td className="px-lg py-md text-right">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                            className={`p-2 transition-colors rounded-full border-0 cursor-pointer ${
                              openMenuId === r.id
                                ? 'bg-surface-container text-on-surface'
                                : 'text-on-surface-variant hover:bg-surface-container bg-transparent'
                            }`}
                            title="More actions"
                            aria-haspopup="true"
                            aria-expanded={openMenuId === r.id}
                          >
                            <span className="material-symbols-outlined leading-none">more_vert</span>
                          </button>

                          {openMenuId === r.id && (
                            <ActionMenu
                              result={r}
                              onViewResult={() => { setViewingResult(r); setOpenMenuId(null) }}
                              onAcknowledge={() => { acknowledgeResult(r.id); setOpenMenuId(null) }}
                              onOpenEncounter={() => { navigate(`/consultation/encounter/${r.visitId ?? ''}`); setOpenMenuId(null) }}
                              onViewHistory={() => { navigate(`/consultation/history/${r.patientId}`); setOpenMenuId(null) }}
                              onClose={() => setOpenMenuId(null)}
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
        <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex items-center justify-between">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} results
          </p>
          <div className="flex gap-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
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
                  p === currentPage
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
              disabled={currentPage === totalPages}
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
