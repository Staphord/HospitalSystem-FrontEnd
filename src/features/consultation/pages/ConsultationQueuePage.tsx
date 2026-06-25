import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Types ─────────────────────────────────────────────────────────────────────

type TriagePriority = 'emergency' | 'urgent' | 'non-urgent' | 'general'
type VitalsStatus = 'critical' | 'stable' | 'normal'
type PriorityFilter = 'all' | TriagePriority
type StatusFilter = 'all' | 'in-queue' | 'checked-in' | 'triage-complete'

interface QueueEntry {
  id: string
  name: string
  patientNumber: string
  chiefComplaint: string
  priority: TriagePriority
  waitTime: string
  vitals: VitalsStatus
  vitalsTooltip?: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_QUEUE: QueueEntry[] = [
  {
    id: 'v-001',
    name: 'Fatuma Said',
    patientNumber: 'MNH-2024-0892',
    chiefComplaint: 'Severe Dyspnea, Chest Pain',
    priority: 'emergency',
    waitTime: '48 min',
    vitals: 'critical',
    vitalsTooltip: 'O2 Sat: 88% | HR: 112 bpm',
  },
  {
    id: 'v-002',
    name: 'Hassan Mwita',
    patientNumber: 'MNH-2024-1104',
    chiefComplaint: 'High Grade Fever, Lethargy',
    priority: 'urgent',
    waitTime: '28 min',
    vitals: 'stable',
  },
  {
    id: 'v-003',
    name: 'Grace Kimaro',
    patientNumber: 'MNH-2024-0755',
    chiefComplaint: 'Routine Post-Op Review',
    priority: 'non-urgent',
    waitTime: '8 min',
    vitals: 'normal',
  },
  {
    id: 'v-004',
    name: 'John Doe',
    patientNumber: 'MNH-2024-1234',
    chiefComplaint: 'Mild Headache, Chronic',
    priority: 'general',
    waitTime: '15 min',
    vitals: 'normal',
  },
  {
    id: 'v-005',
    name: 'Aisha Bakari',
    patientNumber: 'MNH-2024-1456',
    chiefComplaint: 'Prescription Refill',
    priority: 'general',
    waitTime: '5 min',
    vitals: 'normal',
  },
  {
    id: 'v-006',
    name: 'Omar Suleiman',
    patientNumber: 'MNH-2024-1560',
    chiefComplaint: 'Abdominal Pain',
    priority: 'urgent',
    waitTime: '20 min',
    vitals: 'stable',
  },
  {
    id: 'v-007',
    name: 'Zuwena Hamisi',
    patientNumber: 'MNH-2024-1601',
    chiefComplaint: 'Diabetes Follow-up',
    priority: 'general',
    waitTime: '10 min',
    vitals: 'normal',
  },
]

const PAGE_SIZE = 5

// ── Priority config ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  TriagePriority,
  { badge: string; waitColor: string; rowClass: string; buttonClass: string }
> = {
  emergency: {
    badge: 'bg-error text-white',
    waitColor: 'text-error font-bold',
    rowClass: 'bg-[#FFF4F4] hover:bg-[#fee2e2]',
    buttonClass: 'bg-primary-container hover:opacity-90',
  },
  urgent: {
    badge: 'bg-warning/10 text-warning border border-warning/20',
    waitColor: 'text-warning font-bold',
    rowClass: 'hover:bg-hover-tint',
    buttonClass: 'bg-primary hover:bg-primary-container',
  },
  'non-urgent': {
    badge: 'bg-success/10 text-success border border-success/20',
    waitColor: 'text-success font-bold',
    rowClass: 'hover:bg-hover-tint',
    buttonClass: 'bg-primary hover:bg-primary-container',
  },
  general: {
    badge: 'bg-surface-container text-secondary border border-border-subtle',
    waitColor: 'text-secondary',
    rowClass: 'hover:bg-hover-tint',
    buttonClass: 'bg-primary hover:bg-primary-container',
  },
}

const VITALS_CONFIG: Record<VitalsStatus, { color: string; label: string }> = {
  critical: { color: 'text-error font-bold', label: 'Critical' },
  stable: { color: 'text-secondary', label: 'Stable' },
  normal: { color: 'text-secondary', label: 'Normal' },
}

const PRIORITY_LABEL: Record<TriagePriority, string> = {
  emergency: 'Emergency',
  urgent: 'Urgent',
  'non-urgent': 'Non-Urgent',
  general: 'General',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCards({ entries }: { entries: QueueEntry[] }) {
  const waiting = entries.filter((e) => e.priority !== 'emergency').length
  const emergencies = entries.filter((e) => e.priority === 'emergency').length

  const cards = [
    {
      label: 'Waiting',
      value: waiting,
      unit: 'Patients',
      subtext: 'Awaiting initial vitals',
      icon: 'hourglass_empty',
      iconColor: 'text-warning',
      valueColor: 'text-on-background',
      variant: 'default' as const,
    },
    {
      label: 'Emergency',
      value: emergencies,
      unit: 'Action Required',
      subtext: 'Immediate priority required',
      icon: 'emergency',
      iconColor: 'text-error',
      valueColor: 'text-error',
      variant: 'emergency' as const,
    },
    {
      label: 'In Progress',
      value: 1,
      unit: 'Consulting',
      subtext: 'Active encounters',
      icon: 'medical_services',
      iconColor: 'text-primary',
      valueColor: 'text-primary',
      variant: 'default' as const,
    },
    {
      label: 'Completed Today',
      value: 7,
      unit: 'Discharged',
      subtext: 'Cases cleared this shift',
      icon: 'check_circle',
      iconColor: 'text-success',
      valueColor: 'text-success',
      variant: 'default' as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`p-md rounded-xl border relative overflow-hidden ${
            card.variant === 'emergency'
              ? 'bg-error-container/20 border-error'
              : 'bg-surface-white border-border-subtle'
          }`}
        >
          <div className="flex flex-col gap-xs">
            <p
              className={`font-label-md text-label-md uppercase tracking-wider ${
                card.variant === 'emergency' ? 'text-error' : 'text-secondary'
              }`}
            >
              {card.label}
            </p>
            <div className="flex items-baseline gap-sm">
              <span className={`text-[30px] leading-[38px] font-bold font-headline-lg ${card.valueColor}`}>
                {card.value}
              </span>
              <span
                className={`font-body-sm text-body-sm ${
                  card.variant === 'emergency' ? 'text-error font-bold' : 'text-secondary'
                }`}
              >
                {card.unit}
              </span>
            </div>
            <div className="flex items-center gap-xs mt-xs">
              <span className={`material-symbols-outlined text-[16px] ${card.iconColor}`}>
                {card.icon}
              </span>
              <p
                className={`font-body-sm text-body-sm ${
                  card.variant === 'emergency' ? 'text-error' : 'text-secondary'
                }`}
              >
                {card.subtext}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function VitalsCell({ vitals, tooltip }: { vitals: VitalsStatus; tooltip?: string }) {
  const cfg = VITALS_CONFIG[vitals]
  return (
    <div className={`flex items-center gap-xs group/tooltip relative ${cfg.color}`}>
      <span className="material-symbols-outlined text-[20px]">vital_signs</span>
      <span>{cfg.label}</span>
      {tooltip && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block bg-on-background text-white text-[11px] p-2 rounded whitespace-nowrap z-10 shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPage,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPage: (p: number) => void
}) {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="px-md py-3 bg-surface-container-low border-t border-border-subtle flex items-center justify-between">
      <span className="font-label-sm text-label-sm text-secondary">
        Showing {start}–{end} of {totalItems} patients in queue
      </span>
      <div className="flex gap-xs">
        <button
          type="button"
          onClick={() => onPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-white text-secondary hover:bg-hover-tint transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`w-8 h-8 flex items-center justify-center rounded border font-label-md text-label-md transition-colors cursor-pointer ${
              p === currentPage
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-secondary border-border-subtle hover:bg-hover-tint'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-white text-secondary hover:bg-hover-tint transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ConsultationQueuePage() {
  const navigate = useNavigate()
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    let result = [...MOCK_QUEUE]
    if (priorityFilter !== 'all') {
      result = result.filter((e) => e.priority === priorityFilter)
    }
    // Emergency rows always float to top
    result.sort((a, b) => {
      if (a.priority === 'emergency' && b.priority !== 'emergency') return -1
      if (b.priority === 'emergency' && a.priority !== 'emergency') return 1
      return 0
    })
    return result
  }, [priorityFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleFilterChange = (setter: (v: never) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value as never)
    setCurrentPage(1)
  }

  return (
    <div className="max-w-container-max mx-auto w-full">
      {/* Breadcrumb */}
      <div className="mb-lg flex items-center gap-xs font-body-sm text-body-sm text-outline">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-outline font-body-sm text-body-sm"
        >
          Dashboard
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">Patient Queue</span>
      </div>

      {/* Summary Cards */}
      <SummaryCards entries={MOCK_QUEUE} />

      {/* Queue Table Card */}
      <div className="bg-surface-white rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        {/* Table header + filters */}
        <div className="p-md border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-md">
          <h3 className="font-headline-sm text-headline-sm text-on-background">Patient Queue</h3>
          <div className="flex items-center gap-sm flex-wrap">
            {/* Priority filter */}
            <div className="flex items-center gap-xs bg-surface-container-low px-sm py-1.5 rounded border border-border-subtle">
              <span className="font-label-sm text-label-sm text-secondary whitespace-nowrap">Priority:</span>
              <select
                value={priorityFilter}
                onChange={handleFilterChange(setPriorityFilter as (v: never) => void)}
                className="bg-transparent border-none font-body-sm text-body-sm font-medium p-0 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">All</option>
                <option value="emergency">Emergency</option>
                <option value="urgent">Urgent</option>
                <option value="non-urgent">Non-Urgent</option>
                <option value="general">General</option>
              </select>
            </div>
            {/* Status filter */}
            <div className="flex items-center gap-xs bg-surface-container-low px-sm py-1.5 rounded border border-border-subtle">
              <span className="font-label-sm text-label-sm text-secondary whitespace-nowrap">Status:</span>
              <select
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter as (v: never) => void)}
                className="bg-transparent border-none font-body-sm text-body-sm font-medium p-0 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">In Queue</option>
                <option value="checked-in">Checked-in</option>
                <option value="triage-complete">Triage Complete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                {['Patient Name', 'Patient #', 'Chief Complaint', 'Triage', 'Wait Time', 'Vitals', 'Actions'].map(
                  (col, i) => (
                    <th
                      key={col}
                      className={`px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider ${
                        i === 6 ? 'text-right' : ''
                      }`}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-body-sm text-body-sm">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-md py-xl text-center text-secondary font-body-sm">
                    No patients match the selected filters.
                  </td>
                </tr>
              ) : (
                paginated.map((entry) => {
                  const cfg = PRIORITY_CONFIG[entry.priority]
                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${cfg.rowClass}`}
                    >
                      <td className="px-md py-4 font-semibold text-on-background">{entry.name}</td>
                      <td className="px-md py-4 text-secondary">{entry.patientNumber}</td>
                      <td className="px-md py-4">{entry.chiefComplaint}</td>
                      <td className="px-md py-4">
                        <span className={`px-2 py-1 rounded font-label-md text-[11px] font-bold uppercase ${cfg.badge}`}>
                          {PRIORITY_LABEL[entry.priority]}
                        </span>
                      </td>
                      <td className={`px-md py-4 ${cfg.waitColor}`}>{entry.waitTime}</td>
                      <td className="px-md py-4">
                        <VitalsCell vitals={entry.vitals} tooltip={entry.vitalsTooltip} />
                      </td>
                      <td className="px-md py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/consultation/encounter/${entry.id}`)}
                          className={`h-8 px-md text-white rounded font-label-md text-label-md active:scale-95 transition-all border-0 cursor-pointer ${cfg.buttonClass}`}
                        >
                          Open Encounter
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPage={setCurrentPage}
        />
      </div>
    </div>
  )
}
