import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { formatTzs } from '../data/mockPayments'

type SummaryState = 'open' | 'submitted'

type MetricCard = {
  title: string
  value: string
  note: string
  tone: 'blue' | 'green' | 'amber' | 'teal'
  noteTone?: 'green' | 'amber' | 'blue' | 'muted'
}

type TransactionRow = {
  time: string
  patientName: string
  patientNo: string
  amount: number
  method: 'Cash' | 'M-Pesa' | 'Insurance'
  receiptNo: string
  cashier: string
}

type DepartmentRow = {
  label: string
  percentage: number
  tone: string
}

const STORAGE_KEY = 'hf_daily_summary_state'
const DISPLAY_DATE = '09 June 2026'
const DISPLAY_DATE_LABEL = `Today — ${DISPLAY_DATE}`
const REPORT_TIME = '17:32'

const OPEN_METRICS: MetricCard[] = [
  {
    title: 'Total Revenue',
    value: 'TZS 1,240,000',
    note: '↗ 12% from yesterday',
    tone: 'blue',
    noteTone: 'green',
  },
  {
    title: 'Total Transactions',
    value: '28',
    note: '◷ Avg. 3 per hour',
    tone: 'blue',
    noteTone: 'blue',
  },
  {
    title: 'Cash',
    value: 'TZS 820,000',
    note: '',
    tone: 'blue',
  },
  {
    title: 'Mobile Money',
    value: 'TZS 320,000',
    note: '',
    tone: 'green',
  },
  {
    title: 'Insurance Pending',
    value: 'TZS 100,000',
    note: '',
    tone: 'amber',
  },
]

const SUBMITTED_METRICS: MetricCard[] = [
  {
    title: 'Total Collected',
    value: 'TZS 12.4M',
    note: '↗ 12% vs yesterday',
    tone: 'green',
    noteTone: 'green',
  },
  {
    title: 'Pending Claims',
    value: '42',
    note: '⌛ Active processing',
    tone: 'amber',
    noteTone: 'amber',
  },
  {
    title: 'Patient Visits',
    value: '158',
    note: '👥 Hospital capacity 85%',
    tone: 'blue',
    noteTone: 'blue',
  },
  {
    title: 'Discounts Issued',
    value: 'TZS 1.2M',
    note: 'ⓘ 4 Social Welfare cases',
    tone: 'amber',
    noteTone: 'amber',
  },
]

const OPEN_TRANSACTIONS: TransactionRow[] = [
  {
    time: '08:45 AM',
    patientName: 'Amani Khatibu',
    patientNo: '#P-2024-092',
    amount: 45000,
    method: 'Cash',
    receiptNo: 'REC-40912',
    cashier: 'S. Mwinyi',
  },
  {
    time: '09:12 AM',
    patientName: 'Fatma Salum',
    patientNo: '#P-2024-118',
    amount: 125000,
    method: 'M-Pesa',
    receiptNo: 'REC-40913',
    cashier: 'L. Kisaka',
  },
  {
    time: '09:30 AM',
    patientName: 'Joseph Mwanga',
    patientNo: '#P-2024-004',
    amount: 100000,
    method: 'Insurance',
    receiptNo: 'REC-40914',
    cashier: 'S. Mwinyi',
  },
  {
    time: '10:05 AM',
    patientName: 'Zuwena Hamad',
    patientNo: '#P-2024-201',
    amount: 15000,
    method: 'Cash',
    receiptNo: 'REC-40915',
    cashier: 'L. Kisaka',
  },
]

const LEDGER_ROWS = [
  { initials: 'JM', patient: 'John Mapunda', id: '#MNH-2026-8812', method: 'Cash', status: 'Success', amount: 45000 },
  { initials: 'AS', patient: 'Amina Selemani', id: '#MNH-2026-9043', method: 'M-Pesa', status: 'Success', amount: 125500 },
  { initials: 'BK', patient: 'Baraka Kitine', id: '#MNH-2026-8219', method: 'NHIF Card', status: 'Success', amount: 820000 },
  { initials: 'RM', patient: 'Rose Mushi', id: '#MNH-2026-9551', method: 'Cash', status: 'Success', amount: 18000 },
]

const DEPARTMENT_ROWS: DepartmentRow[] = [
  { label: 'OPD Services', percentage: 45, tone: '#0052cc' },
  { label: 'Laboratory', percentage: 30, tone: '#00b8d9' },
  { label: 'Radiology', percentage: 15, tone: '#003d9b' },
  { label: 'Pharmacy', percentage: 10, tone: '#004b59' },
]

const OPEN_DONUT_SEGMENTS = [
  { label: 'Cash', amount: 820000, color: '#0052cc' },
  { label: 'M-Pesa', amount: 200000, color: '#36b37e' },
  { label: 'Tigo', amount: 120000, color: '#00b8d9' },
  { label: 'Insurance', amount: 100000, color: '#ffab00' },
]

function toneClasses(tone: MetricCard['tone']) {
  switch (tone) {
    case 'green':
      return 'text-[#36b37e]'
    case 'amber':
      return 'text-[#ffab00]'
    case 'teal':
      return 'text-[#00b8d9]'
    default:
      return 'text-[#0052cc]'
  }
}

function tinyBadgeClasses(tone: TransactionRow['method']) {
  switch (tone) {
    case 'Cash':
      return 'bg-[#e8effd] text-[#0052cc]'
    case 'M-Pesa':
      return 'bg-[#edf8f3] text-[#36b37e]'
    case 'Insurance':
      return 'bg-[#fff6df] text-[#ffab00]'
  }
}

function StatCard({
  title,
  value,
  note,
  tone,
  noteTone = 'muted',
}: MetricCard) {
  const noteClassName =
    noteTone === 'green'
      ? 'text-[#36b37e]'
      : noteTone === 'amber'
        ? 'text-[#ffab00]'
        : noteTone === 'blue'
          ? 'text-[#51617e]'
          : 'text-[#8c93a4]'

  return (
    <div className="rounded-[12px] border border-[#dfe1e6] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex h-full min-h-[96px] flex-col justify-between">
        <div className="space-y-1.5">
          <div className="font-headline-sm text-[12px] font-semibold uppercase tracking-[0.08em] text-[#51617e] leading-[1.15]">
            {title}
          </div>
          <div className={`font-headline-md text-[18px] font-semibold leading-none ${toneClasses(tone)}`}>
            {value}
          </div>
        </div>
        {note ? (
          <div className={`font-body-sm text-[11px] leading-[16px] ${noteClassName}`}>
            {note}
          </div>
        ) : (
          <div className="h-[18px]" />
        )}
      </div>
    </div>
  )
}

function ShellCard({
  title,
  actions,
  children,
  className = '',
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[12px] border border-[#dfe1e6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      <div className="flex items-center justify-between border-b border-[#dfe1e6] px-4 py-4">
        <h2 className="m-0 font-headline-md text-[16px] font-semibold text-[#1f2430]">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  )
}

function MethodPill({ method }: { method: TransactionRow['method'] }) {
  const classes = tinyBadgeClasses(method)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] ${classes}`}>
      {method}
    </span>
  )
}

export function DailySummaryPage() {
  const [summaryState, setSummaryState] = useState<SummaryState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'submitted' ? 'submitted' : 'open'
  })

  const handleSubmit = () => {
    setSummaryState('submitted')
    localStorage.setItem(STORAGE_KEY, 'submitted')
    toast.success(`Report submitted at ${REPORT_TIME}.`)
  }

  const handleRefresh = () => {
    toast.success('Daily summary refreshed.')
  }

  const handleExport = (format: 'PDF' | 'CSV') => {
    toast.success(`Exporting daily summary as ${format}...`)
  }

  const handleUnlock = () => {
    setSummaryState('open')
    localStorage.removeItem(STORAGE_KEY)
    toast.info('Report unlocked for editing.')
  }

  return (
    <div className="w-full min-w-0 space-y-4 text-[#1f2430]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="m-0 font-headline-md text-[24px] font-semibold leading-tight tracking-[-0.01em] text-[#1f2430]">
            Daily Summary
          </h1>
          <div className="mt-2.5 flex items-center gap-2 font-headline-sm text-[14px] text-[#51617e]">
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-[#51617e] transition-colors hover:text-[#0052cc] cursor-pointer"
              aria-label="Previous day"
            >
              ‹
            </button>
            <span>{DISPLAY_DATE_LABEL}</span>
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-[#51617e] transition-colors hover:text-[#0052cc] cursor-pointer"
              aria-label="Next day"
            >
              ›
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {summaryState === 'open' ? (
            <>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#dfe1e6] bg-white px-4 font-headline-sm text-[14px] font-semibold text-[#51617e] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#f4f5f7] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                Select Date Range
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#0052cc] bg-[#0052cc] px-4 font-headline-sm text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-colors hover:bg-[#0040a2] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Refresh Data
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => toast.success('Printing report...')}
                className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#dfe1e6] bg-white px-4 font-headline-sm text-[14px] font-semibold text-[#51617e] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#f4f5f7] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Print Report
              </button>
              <button
                type="button"
                onClick={() => handleExport('PDF')}
                className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#dfe1e6] bg-white px-4 font-headline-sm text-[14px] font-semibold text-[#51617e] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#f4f5f7] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export PDF
              </button>
            </>
          )}
        </div>
      </div>

      {summaryState === 'open' ? (
        <>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
            {OPEN_METRICS.map((metric) => (
              <StatCard key={metric.title} {...metric} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_2.05fr]">
            <ShellCard
              title="Revenue by Payment Method"
              actions={<span className="material-symbols-outlined text-[18px] text-[#51617e]">info</span>}
              className="overflow-hidden"
            >
              <div className="px-5 py-5">
                <div className="flex flex-col items-center justify-center gap-5">
                  <div className="relative flex h-[190px] w-[190px] items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-[190px] w-[190px] -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#edf0f5"
                        strokeWidth="10"
                      />
                      {OPEN_DONUT_SEGMENTS.map((segment, index) => {
                        const total = OPEN_DONUT_SEGMENTS.reduce((sum, item) => sum + item.amount, 0)
                        const circumference = 2 * Math.PI * 38
                        const dash = (segment.amount / total) * circumference
                        const offset =
                          -OPEN_DONUT_SEGMENTS.slice(0, index).reduce((sum, item) => sum + item.amount, 0) /
                          total *
                          circumference

                        return (
                          <circle
                            key={segment.label}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="transparent"
                            stroke={segment.color}
                            strokeWidth="10"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={offset}
                            strokeLinecap="butt"
                          />
                        )
                      })}
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-headline-sm text-[11px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                        Total
                      </span>
                      <span className="mt-1 font-headline-md text-[18px] font-semibold text-[#1f2430]">
                        1.24M
                      </span>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 font-headline-sm text-[13px] text-[#51617e]">
                      <span className="h-4 w-4 rounded-full bg-[#0052cc]" />
                      <span>Cash (66%)</span>
                    </div>
                    <div className="flex items-center gap-3 font-headline-sm text-[13px] text-[#51617e]">
                      <span className="h-4 w-4 rounded-full bg-[#36b37e]" />
                      <span>M-Pesa (16%)</span>
                    </div>
                    <div className="flex items-center gap-3 font-headline-sm text-[13px] text-[#51617e]">
                      <span className="h-4 w-4 rounded-full bg-[#00b8d9]" />
                      <span>Tigo (10%)</span>
                    </div>
                    <div className="flex items-center gap-3 font-headline-sm text-[13px] text-[#51617e]">
                      <span className="h-4 w-4 rounded-full bg-[#ffab00]" />
                      <span>Insurance (8%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </ShellCard>

            <ShellCard title="Cash Reconciliation" className="overflow-hidden">
              <div className="px-5 py-5">
                <div className="grid gap-4 xl:grid-cols-[1.15fr_1.45fr]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <div className="mb-2 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                          Opening Float
                        </div>
                        <div className="rounded-[10px] border border-[#dfe1e6] bg-[#f4f5fb] px-4 py-3.5 font-headline-md text-[18px] font-semibold text-[#1f2430]">
                          {formatTzs(150000)}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                          Cash Received
                        </div>
                        <div className="rounded-[10px] border border-[#dfe1e6] bg-[#f4f5fb] px-4 py-3.5 font-headline-md text-[18px] font-semibold text-[#1f2430]">
                          {formatTzs(820000)}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                          Expected Cash
                        </div>
                        <div className="rounded-[10px] border border-[#b7c9ff] bg-[#dfe7ff] px-4 py-3.5 font-headline-md text-[18px] font-semibold text-[#0052cc]">
                          {formatTzs(970000)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-[#dfe1e6] bg-[#f4f5fb] p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#dfe7ff] text-[#0052cc]">
                            <span className="material-symbols-outlined text-[26px]">lock</span>
                          </div>
                             <div className="max-w-[260px]">
                            <h3 className="m-0 font-headline-md text-[16px] font-semibold text-[#1f2430]">
                              Finalize Daily Sessions
                            </h3>
                            <p className="mt-1 m-0 font-body-sm text-[13px] leading-[20px] text-[#51617e]">
                              Ensure all physical cash in the drawer matches the digital expected value before closing.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="inline-flex h-[48px] min-w-[280px] items-center justify-center rounded-[8px] border-0 bg-[#0052cc] px-5 font-headline-sm text-[14px] font-semibold text-white shadow-[0_2px_10px_rgba(0,82,204,0.16)] transition-colors hover:bg-[#0040a2] cursor-pointer"
                        >
                          Submit End-of-Day Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ShellCard>
          </div>

          <ShellCard
            title="All Transactions Today"
            actions={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleExport('PDF')}
                  className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#dfe1e6] bg-white px-4 font-headline-sm text-[14px] font-semibold text-[#51617e] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#f4f5f7] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('CSV')}
                  className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#dfe1e6] bg-white px-4 font-headline-sm text-[14px] font-semibold text-[#51617e] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-[#f4f5f7] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">csv</span>
                  Export CSV
                </button>
              </div>
            }
            className="overflow-hidden"
          >
              <div className="overflow-x-auto">
                <table className="min-w-[920px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#dfe1e6] bg-[#f4f5fb]">
                    <th className="px-4 py-4 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Time</th>
                    <th className="px-4 py-4 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Patient Name</th>
                    <th className="px-4 py-4 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Patient #</th>
                    <th className="px-4 py-4 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Amount</th>
                    <th className="px-4 py-4 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Method</th>
                    <th className="px-4 py-4 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Receipt #</th>
                    <th className="px-4 py-4 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Cashier</th>
                    <th className="px-4 py-4 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OPEN_TRANSACTIONS.map((row) => (
                      <tr key={`${row.time}-${row.patientName}`} className="border-b border-[#dfe1e6] last:border-b-0 hover:bg-[#f8f9fb]">
                      <td className="px-4 py-4 font-headline-sm text-[13px] font-semibold text-[#1f2430]">{row.time}</td>
                      <td className="px-4 py-4 font-headline-sm text-[13px] text-[#1f2430]">{row.patientName}</td>
                      <td className="px-4 py-4 font-headline-sm text-[13px] text-[#51617e]">{row.patientNo}</td>
                      <td className="px-4 py-4 font-headline-sm text-[13px] font-semibold text-[#1f2430]">
                        {formatTzs(row.amount)}
                      </td>
                      <td className="px-4 py-5">
                        <MethodPill method={row.method} />
                      </td>
                      <td className="px-4 py-4 font-headline-sm text-[13px] text-[#1f2430]">{row.receiptNo}</td>
                      <td className="px-4 py-4 font-headline-sm text-[13px] text-[#51617e]">{row.cashier}</td>
                      <td className="px-4 py-4 text-[#51617e]">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border-0 bg-transparent text-[#51617e] transition-colors hover:bg-[#f4f5f7] hover:text-[#0052cc] cursor-pointer"
                          aria-label={`Print receipt for ${row.patientName}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#dfe1e6] bg-[#f4f5fb] px-4 py-4">
              <div className="font-headline-sm text-[14px] font-semibold text-[#51617e]">
                Showing 4 of 28 transactions
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="h-10 rounded-[6px] border border-[#dfe1e6] bg-[#f4f5fb] px-4 font-headline-sm text-[14px] font-semibold text-[#b0b6c7] cursor-not-allowed"
                >
                  Previous
                </button>
                <button type="button" className="h-10 rounded-[6px] border border-[#0052cc] bg-[#0052cc] px-4 font-headline-sm text-[14px] font-semibold text-white">
                  1
                </button>
                <button type="button" className="h-10 rounded-[6px] border border-[#dfe1e6] bg-white px-4 font-headline-sm text-[14px] font-semibold text-[#51617e]">
                  2
                </button>
                <button type="button" className="h-10 rounded-[6px] border border-[#dfe1e6] bg-white px-4 font-headline-sm text-[14px] font-semibold text-[#51617e]">
                  3
                </button>
                <button type="button" className="h-10 rounded-[6px] border border-[#dfe1e6] bg-white px-4 font-headline-sm text-[14px] font-semibold text-[#51617e]">
                  Next
                </button>
              </div>
            </div>
          </ShellCard>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.95fr]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {SUBMITTED_METRICS.map((metric) => (
                <StatCard key={metric.title} {...metric} />
              ))}
            </div>

            <section className="overflow-hidden rounded-[12px] border border-[#dfe1e6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between border-b border-[#dfe1e6] bg-[#f5fbf8] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#36b37e] text-white">
                    <span className="material-symbols-outlined text-[22px]">check</span>
                  </div>
                  <h2 className="m-0 font-headline-md text-[16px] font-semibold text-[#36b37e]">
                    Report submitted — {REPORT_TIME}
                  </h2>
                </div>
                <span className="rounded-[6px] border border-[#a8e3cb] bg-white px-4 py-1 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#36b37e]">
                  Finalized
                </span>
              </div>

              <div className="grid gap-4 px-5 py-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="border-b border-[#dfe1e6] pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-headline-sm text-[13px] font-medium text-[#51617e]">Opening Float</span>
                      <span className="font-headline-md text-[16px] font-semibold text-[#1f2430]">{formatTzs(500000)}</span>
                    </div>
                  </div>
                  <div className="border-b border-[#dfe1e6] pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-headline-sm text-[13px] font-medium text-[#51617e]">Cash Received (System)</span>
                      <span className="font-headline-md text-[16px] font-semibold text-[#1f2430]">{formatTzs(4850200)}</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-headline-md text-[16px] font-semibold text-[#1f3f88]">Expected Cash</span>
                      <span className="font-headline-md text-[16px] font-semibold text-[#1f3f88]">{formatTzs(5350200)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col rounded-[12px] border border-[#cfd7f2] bg-[#f3f5ff] px-4 py-4">
                  <div className="mb-3 flex items-center justify-between gap-4 border-b border-[#cfd7f2] pb-4">
                    <span className="font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                      Actual Counted
                    </span>
                    <span className="font-headline-md text-[16px] font-semibold text-[#1f2430]">{formatTzs(5350200)}</span>
                  </div>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#36b37e]">
                      Variance
                    </span>
                    <span className="flex items-center gap-1 font-headline-md text-[16px] font-semibold text-[#36b37e]">
                      {formatTzs(0)}
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlock}
                    className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-[6px] border-0 bg-[#8e92a3] font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-white cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    Reconciliation Locked
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_2.05fr]">
            <ShellCard title="Revenue by Dept" actions={<span className="material-symbols-outlined text-[20px] text-[#51617e]">more_vert</span>}>
              <div className="px-5 py-5">
                <div className="space-y-5">
                  {DEPARTMENT_ROWS.map((row) => (
                    <div key={row.label}>
                      <div className="mb-2 flex items-center justify-between gap-4 font-headline-sm text-[16px] text-[#1f2430]">
                        <span className="font-semibold">{row.label}</span>
                        <span className="text-[#51617e]">{row.percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#e5e7f0]">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${row.percentage}%`, backgroundColor: row.tone }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-8 h-px bg-[#dfe1e6]" />

                <div className="flex items-center gap-4 rounded-[10px] bg-[#edf2ff] px-3 py-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-[#dfe7ff] text-[#0052cc]">
                    <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
                  </div>
                  <div>
                    <div className="font-headline-sm text-[14px] uppercase tracking-[0.06em] text-[#51617e]">
                      Projected Monthly
                    </div>
                    <div className="font-headline-md text-[22px] font-semibold text-[#1f2430]">
                      TZS 382.4M
                    </div>
                  </div>
                </div>
              </div>
            </ShellCard>

            <ShellCard
              title="End-of-Day Ledger"
              actions={
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#dfe1e6] bg-[#f4f5fb] px-4 font-headline-sm text-[16px] font-semibold text-[#51617e] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                  All Methods
                </button>
              }
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#dfe1e6] bg-[#f4f5fb]">
                      <th className="px-4 py-4 font-headline-sm text-[16px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Patient / ID</th>
                      <th className="px-4 py-4 font-headline-sm text-[16px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Method</th>
                      <th className="px-4 py-4 font-headline-sm text-[16px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Status</th>
                      <th className="px-4 py-4 text-right font-headline-sm text-[16px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">Amount (TZS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEDGER_ROWS.map((row) => (
                      <tr key={row.id} className="border-b border-[#dfe1e6] last:border-b-0 hover:bg-[#f8f9fb]">
                        <td className="px-4 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dfe7ff] font-headline-sm text-[14px] font-semibold text-[#51617e]">
                              {row.initials}
                            </div>
                            <div>
                              <div className="font-headline-sm text-[16px] font-semibold text-[#1f2430]">{row.patient}</div>
                              <div className="font-headline-sm text-[14px] text-[#51617e]">{row.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 font-headline-sm text-[16px] text-[#1f2430]">{row.method}</td>
                        <td className="px-4 py-5">
                          <span className="inline-flex rounded-[6px] border border-[#d4f0e0] bg-[#f3fbf7] px-3 py-1 font-headline-sm text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6fd0a0]">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-right font-headline-md text-[18px] font-semibold text-[#565b66]">
                          {row.amount.toLocaleString('en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#dfe1e6] px-4 py-4 text-center font-headline-sm text-[16px] font-semibold text-[#0052cc]">
                VIEW FULL LEDGER
              </div>
            </ShellCard>
          </div>

          <div className="flex justify-end">
            <div className="rounded-full border border-[#dfe1e6] bg-white px-5 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3 font-headline-sm text-[14px] text-[#7c8393]">
                <span className="material-symbols-outlined text-[16px] text-[#ffab00]">verified_user</span>
                This report is digitally signed and cannot be edited.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
