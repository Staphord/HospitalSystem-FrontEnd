import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES } from '@/lib/roles'
import {
  canRecordPayment,
  derivePaymentStatus,
  formatTzs,
  getOutstanding,
  INITIAL_PAYMENT_ROWS,
  paymentStatusStyles,
  type PaymentRow,
} from '@/features/billing/data/mockPayments'

type PageTab = 'insurance' | 'payment'
type VerificationStatus = 'Pending' | 'Verified' | 'Rejected' | 'Manual Review'

interface VerificationRow {
  id: string
  patientName: string
  patientNumber: string
  insurer: string
  policyNumber: string
  memberName: string
  submittedAt: string
  status: VerificationStatus
}

const KPI_CARD =
  'bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between h-full'
const KPI_LABEL = 'text-outline font-label-md uppercase tracking-wider mb-1'
const KPI_VALUE = 'font-headline-md text-[28px] text-on-surface m-0'
const TH_CLASS =
  'py-md px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-border-subtle'
const TD_MUTED = 'py-md px-md font-body-sm text-body-sm text-on-surface-variant'
const STATUS_BADGE =
  'inline-flex items-center px-sm py-xs rounded-full font-label-md text-label-md font-bold'

const INITIAL_ROWS: VerificationRow[] = [
  {
    id: 'v1',
    patientName: 'Zuwena Salum',
    patientNumber: 'PT-3841',
    insurer: 'NHIF',
    policyNumber: 'NH-882910',
    memberName: 'Zuwena Salum',
    submittedAt: '09:18',
    status: 'Pending',
  },
  {
    id: 'v2',
    patientName: 'Hassan Mwita',
    patientNumber: 'PT-4889',
    insurer: 'Jubilee Insurance',
    policyNumber: 'JUB-441205',
    memberName: 'Hassan Mwita',
    submittedAt: '08:55',
    status: 'Manual Review',
  },
  {
    id: 'v3',
    patientName: 'Fatuma Said',
    patientNumber: 'PT-4891',
    insurer: 'AAR Healthcare',
    policyNumber: 'AAR-993014',
    memberName: 'Fatuma Said',
    submittedAt: '08:40',
    status: 'Pending',
  },
  {
    id: 'v4',
    patientName: 'Grace Kimaro',
    patientNumber: 'PT-4892',
    insurer: 'NHIF',
    policyNumber: 'NH-771204',
    memberName: 'Grace Kimaro',
    submittedAt: '08:12',
    status: 'Verified',
  },
  {
    id: 'v5',
    patientName: 'Amir Juma',
    patientNumber: 'PT-4903',
    insurer: 'Strategis Insurance',
    policyNumber: 'STR-220891',
    memberName: 'Amir Juma',
    submittedAt: '07:58',
    status: 'Verified',
  },
  {
    id: 'v6',
    patientName: 'Lulu Kapinga',
    patientNumber: 'PT-7712',
    insurer: 'Jubilee Insurance',
    policyNumber: 'JUB-118902',
    memberName: 'Lulu Kapinga',
    submittedAt: '07:30',
    status: 'Rejected',
  },
  {
    id: 'v7',
    patientName: 'Joseph Mwinyi',
    patientNumber: 'PT-9201',
    insurer: 'NHIF',
    policyNumber: 'NH-920155',
    memberName: 'Joseph Mwinyi',
    submittedAt: '07:15',
    status: 'Pending',
  },
  {
    id: 'v8',
    patientName: 'Mary Ngoma',
    patientNumber: 'PT-5501',
    insurer: 'AAR Healthcare',
    policyNumber: 'AAR-550198',
    memberName: 'Mary Ngoma',
    submittedAt: '07:05',
    status: 'Verified',
  },
]

const VERIFICATION_PAGE_SIZE = 5
const PAYMENT_PAGE_SIZE = 5
const TOOLBAR_BTN =
  'flex items-center gap-xs px-sm py-xs text-body-sm font-medium text-secondary hover:bg-surface-container transition-colors rounded border-0 bg-transparent cursor-pointer'

function statusStyles(status: VerificationStatus) {
  switch (status) {
    case 'Pending':
      return { bg: 'bg-warning/10', text: 'text-warning' }
    case 'Verified':
      return { bg: 'bg-success/10', text: 'text-success' }
    case 'Rejected':
      return { bg: 'bg-error/10', text: 'text-error' }
    case 'Manual Review':
      return { bg: 'bg-info/10', text: 'text-info' }
  }
}

function canVerifyOrReject(status: VerificationStatus) {
  return status === 'Pending' || status === 'Manual Review'
}

function ReceptionTabs({
  activeTab,
  onChange,
}: {
  activeTab: PageTab
  onChange: (tab: PageTab) => void
}) {
  const tabs: { id: PageTab; label: string }[] = [
    { id: 'insurance', label: 'Insurance Verifications' },
    { id: 'payment', label: 'Payment Status' },
  ]

  return (
    <div
      role="tablist"
      aria-label="Payment and insurance sections"
      className="inline-flex w-full sm:w-auto p-1 gap-1 bg-surface-container-low border border-border-subtle rounded-lg mb-lg"
    >
      {tabs.map(({ id, label }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={
              isActive
                ? 'flex-1 sm:flex-none px-md py-sm rounded font-body-sm text-body-sm font-semibold text-reception-primary bg-surface-white shadow-sm border border-border-subtle cursor-pointer transition-colors'
                : 'flex-1 sm:flex-none px-md py-sm rounded font-body-sm text-body-sm font-medium text-secondary hover:text-on-surface bg-transparent border border-transparent cursor-pointer transition-colors'
            }
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function VerifyInsuranceModal({
  row,
  onClose,
  onConfirm,
}: {
  row: VerificationRow
  onClose: () => void
  onConfirm: (notes: string, coverageLimit: string, coverageConfirmed: boolean) => void
}) {
  const [coverageConfirmed, setCoverageConfirmed] = useState(true)
  const [coverageLimit, setCoverageLimit] = useState('TZS 500,000')
  const [notes, setNotes] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-lg w-full max-w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-insurance-title"
      >
        <div className="p-lg border-b border-border-subtle">
          <h2 id="verify-insurance-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Verify Insurance Coverage
          </h2>
        </div>

        <div className="p-lg bg-[#F4F5F7] border-b border-border-subtle">
          <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{row.patientName}</p>
          <p className="font-body-sm text-body-sm text-secondary m-0 mt-xs">
            {row.patientNumber} · {row.insurer} · {row.policyNumber}
          </p>
        </div>

        <div className="p-lg flex flex-col gap-md">
          <label className="flex items-center justify-between gap-md cursor-pointer">
            <span className="font-body-sm text-body-sm font-medium text-on-surface">Coverage Confirmed</span>
            <button
              type="button"
              role="switch"
              aria-checked={coverageConfirmed}
              onClick={() => setCoverageConfirmed((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors border-0 cursor-pointer ${
                coverageConfirmed ? 'bg-success' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  coverageConfirmed ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs" htmlFor="coverage-limit">
              Coverage Limit
            </label>
            <input
              id="coverage-limit"
              type="text"
              value={coverageLimit}
              onChange={(e) => setCoverageLimit(e.target.value)}
              className="w-full h-10 px-md border border-border-subtle rounded text-body-md font-body-md bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs" htmlFor="verify-notes">
              Notes
            </label>
            <textarea
              id="verify-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional verification notes..."
              className="w-full px-md py-sm border border-border-subtle rounded text-body-md font-body-md bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="p-lg border-t border-border-subtle flex justify-end gap-sm bg-surface-bright">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-md border border-border-subtle rounded font-body-sm text-body-sm font-medium text-secondary bg-white hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notes, coverageLimit, coverageConfirmed)}
            className="h-8 px-md rounded font-body-sm text-body-sm font-medium text-white bg-success hover:opacity-90 transition-opacity border-0 cursor-pointer"
          >
            Confirm Verification
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewVerificationModal({ row, onClose }: { row: VerificationRow; onClose: () => void }) {
  const styles = statusStyles(row.status)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-lg w-full max-w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-verification-title"
      >
        <div className="p-lg border-b border-border-subtle flex justify-between items-center">
          <h2 id="view-verification-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Verification Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container border-0 bg-transparent cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-lg flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient</p>
              <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{row.patientName}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient #</p>
              <p className="font-body-sm text-body-sm text-on-surface m-0">{row.patientNumber}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Insurer</p>
              <p className="font-body-sm text-body-sm text-on-surface m-0">{row.insurer}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Policy #</p>
              <p className="font-body-sm text-body-sm text-on-surface m-0">{row.policyNumber}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Member Name</p>
              <p className="font-body-sm text-body-sm text-on-surface m-0">{row.memberName}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Submitted At</p>
              <p className="font-body-sm text-body-sm text-on-surface m-0">{row.submittedAt}</p>
            </div>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Status</p>
            <span className={`${STATUS_BADGE} ${styles.bg} ${styles.text}`}>{row.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function VerificationActionsMenu({
  row,
  openMenuId,
  onOpenChange,
  onVerify,
  onReject,
  onView,
  canManage,
}: {
  row: VerificationRow
  openMenuId: string | null
  onOpenChange: (id: string | null) => void
  onVerify: () => void
  onReject: () => void
  onView: () => void
  canManage: boolean
}) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const isOpen = openMenuId === row.id
  const actionable = canManage && canVerifyOrReject(row.status)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onOpenChange])

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isOpen) {
      onOpenChange(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 4, left: rect.right - 168 })
    onOpenChange(row.id)
  }

  const menuItemClass =
    'w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-left bg-transparent border-0 cursor-pointer hover:bg-surface-container-low transition-colors'

  return (
    <>
      <button
        type="button"
        title="More actions"
        onClick={handleToggle}
        className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container transition-colors border-0 bg-transparent cursor-pointer"
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {isOpen && anchor && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default border-0 bg-transparent p-0"
            aria-label="Close menu"
            onClick={() => onOpenChange(null)}
          />
          <div
            className="fixed z-50 min-w-[168px] py-xs bg-surface-white border border-border-subtle rounded shadow-lg"
            style={{ top: anchor.top, left: Math.max(8, anchor.left) }}
            role="menu"
          >
            {actionable && (
              <>
                <button type="button" role="menuitem" className={`${menuItemClass} text-primary-container`} onClick={onVerify}>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Verify
                </button>
                <button type="button" role="menuitem" className={`${menuItemClass} text-error`} onClick={onReject}>
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  Reject
                </button>
                <div className="h-px bg-border-subtle my-xs" />
              </>
            )}
            <button type="button" role="menuitem" className={`${menuItemClass} text-on-surface`} onClick={onView}>
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              View
            </button>
          </div>
        </>
      )}
    </>
  )
}

function InsuranceVerificationsTab({ canManage }: { canManage: boolean }) {
  const [rows, setRows] = useState<VerificationRow[]>(() =>
    JSON.parse(localStorage.getItem('hf_mock_insurance_verifications') || JSON.stringify(INITIAL_ROWS))
  )
  useEffect(() => {
    localStorage.setItem('hf_mock_insurance_verifications', JSON.stringify(rows))
  }, [rows])
  const [currentPage, setCurrentPage] = useState(1)
  const [verifyTarget, setVerifyTarget] = useState<VerificationRow | null>(null)
  const [viewTarget, setViewTarget] = useState<VerificationRow | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const pendingCount = 5
  const verifiedTodayCount = 12
  const rejectedCount = 1

  const totalPages = Math.max(1, Math.ceil(rows.length / VERIFICATION_PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * VERIFICATION_PAGE_SIZE
  const visibleRows = rows.slice(pageStart, pageStart + VERIFICATION_PAGE_SIZE)
  const showingFrom = rows.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + VERIFICATION_PAGE_SIZE, rows.length)

  const handleVerify = (notes: string, _coverageLimit: string, coverageConfirmed: boolean) => {
    if (!verifyTarget) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === verifyTarget.id
          ? { ...r, status: coverageConfirmed ? 'Verified' : 'Manual Review' }
          : r,
      ),
    )
    setVerifyTarget(null)
    void notes
  }

  const handleReject = (id: string) => {
    setRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, status: 'Rejected' as const } : r))
      const newTotalPages = Math.max(1, Math.ceil(next.length / VERIFICATION_PAGE_SIZE))
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages)
      }
      return next
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Pending Verification</p>
              <h3 className={KPI_VALUE}>{pendingCount}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-warning/10 flex items-center justify-center text-warning">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
          </div>
        </div>

        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Verified Today</p>
              <h3 className={KPI_VALUE}>{verifiedTodayCount}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-success/10 flex items-center justify-center text-success">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
          </div>
        </div>

        <div className={KPI_CARD}>
          <div className="flex justify-between items-start">
            <div>
              <p className={KPI_LABEL}>Rejected</p>
              <h3 className={`${KPI_VALUE} text-error`}>{rejectedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-error/10 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[24px]">cancel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden flex flex-col">
        <div className="p-md border-b border-border-subtle bg-surface-bright">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Insurance Verifications
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-surface-container-low">
              <tr>
                <th className={TH_CLASS}>Patient Name</th>
                <th className={TH_CLASS}>Patient #</th>
                <th className={TH_CLASS}>Insurer</th>
                <th className={TH_CLASS}>Policy #</th>
                <th className={TH_CLASS}>Member Name</th>
                <th className={TH_CLASS}>Submitted At</th>
                <th className={TH_CLASS}>Status</th>
                <th className={`${TH_CLASS} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {visibleRows.map((row) => {
                const styles = statusStyles(row.status)

                return (
                  <tr key={row.id} className="hover:bg-hover-tint transition-colors group">
                    <td className="py-md px-md font-body-sm text-body-sm font-semibold text-on-surface">
                      {row.patientName}
                    </td>
                    <td className={TD_MUTED}>{row.patientNumber}</td>
                    <td className={TD_MUTED}>{row.insurer}</td>
                    <td className={TD_MUTED}>{row.policyNumber}</td>
                    <td className={TD_MUTED}>{row.memberName}</td>
                    <td className={TD_MUTED}>{row.submittedAt}</td>
                    <td className="py-md px-md">
                      <span className={`${STATUS_BADGE} ${styles.bg} ${styles.text}`}>{row.status}</span>
                    </td>
                    <td className="py-md px-md text-right">
                      <div className="flex justify-end">
                        <VerificationActionsMenu
                          row={row}
                          openMenuId={openMenuId}
                          onOpenChange={setOpenMenuId}
                          canManage={canManage}
                          onVerify={() => {
                            setOpenMenuId(null)
                            setVerifyTarget(row)
                          }}
                          onReject={() => {
                            setOpenMenuId(null)
                            handleReject(row.id)
                          }}
                          onView={() => {
                            setOpenMenuId(null)
                            setViewTarget(row)
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-md bg-surface-bright border-t border-border-subtle flex justify-between items-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
            {rows.length === 0
              ? 'No verifications'
              : `Showing ${showingFrom} to ${showingTo} of ${rows.length} verifications`}
          </p>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-sm h-8 border rounded font-body-sm cursor-pointer ${
                  safePage === page
                    ? 'border-primary bg-primary text-white'
                    : 'border-border-subtle hover:bg-surface-white text-on-surface'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {verifyTarget && (
        <VerifyInsuranceModal
          row={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onConfirm={handleVerify}
        />
      )}
      {viewTarget && <ViewVerificationModal row={viewTarget} onClose={() => setViewTarget(null)} />}
    </>
  )
}

function RecordPaymentModal({
  row,
  onClose,
  onConfirm,
}: {
  row: PaymentRow
  onClose: () => void
  onConfirm: (amount: number, method: string, reference: string, notes: string) => void
}) {
  const outstanding = getOutstanding(row)
  const [amount, setAmount] = useState(String(outstanding))
  const [method, setMethod] = useState('Cash')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    const parsed = Number(amount.replace(/,/g, ''))
    if (!parsed || parsed <= 0) {
      toast.error('Enter a valid payment amount.')
      return
    }
    if (parsed > outstanding) {
      toast.error(`Amount cannot exceed outstanding ${formatTzs(outstanding)}.`)
      return
    }
    onConfirm(parsed, method, reference, notes)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-lg w-full max-w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-payment-title"
      >
        <div className="p-lg border-b border-border-subtle">
          <h2 id="record-payment-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Record Payment
          </h2>
        </div>

        <div className="p-lg bg-[#F4F5F7] border-b border-border-subtle">
          <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{row.patientName}</p>
          <p className="font-body-sm text-body-sm text-secondary m-0 mt-xs">
            {row.patientNumber} · Visit {row.visitDate}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface m-0 mt-xs">
            Total {formatTzs(row.totalBill)} · Outstanding {formatTzs(outstanding)}
          </p>
        </div>

        <div className="p-lg flex flex-col gap-md">
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs" htmlFor="payment-amount">
              Amount to pay
            </label>
            <input
              id="payment-amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-10 px-md border border-border-subtle rounded text-body-md font-body-md bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs" htmlFor="payment-method">
              Payment method
            </label>
            <select
              id="payment-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-10 px-md border border-border-subtle rounded text-body-md font-body-md bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs" htmlFor="payment-reference">
              Reference # (optional)
            </label>
            <input
              id="payment-reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. M-Pesa transaction ID"
              className="w-full h-10 px-md border border-border-subtle rounded text-body-md font-body-md bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs" htmlFor="payment-notes">
              Notes
            </label>
            <textarea
              id="payment-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional payment notes..."
              className="w-full px-md py-sm border border-border-subtle rounded text-body-md font-body-md bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="p-lg border-t border-border-subtle flex justify-end gap-sm bg-surface-bright">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-md border border-border-subtle rounded font-body-sm text-body-sm font-medium text-secondary bg-white hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-8 px-md rounded font-body-sm text-body-sm font-medium text-white bg-primary-container hover:bg-primary transition-colors border-0 cursor-pointer"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewPaymentModal({ row, onClose }: { row: PaymentRow; onClose: () => void }) {
  const styles = paymentStatusStyles(row.status)
  const outstanding = getOutstanding(row)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-lg w-full max-w-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-payment-title"
      >
        <div className="p-lg border-b border-border-subtle flex justify-between items-center">
          <h2 id="view-payment-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Payment Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container border-0 bg-transparent cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-lg flex flex-col gap-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient</p>
              <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{row.patientName}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient #</p>
              <p className="font-body-sm text-body-sm text-on-surface m-0">{row.patientNumber}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Visit Date</p>
              <p className="font-body-sm text-body-sm text-on-surface m-0">{row.visitDate}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Payment Method</p>
              <p className="font-body-sm text-body-sm text-on-surface m-0">{row.paymentMethod}</p>
            </div>
          </div>

          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Line Items</p>
            <div className="border border-border-subtle rounded divide-y divide-border-subtle">
              {row.lineItems.map((item) => (
                <div key={item.label} className="flex justify-between px-md py-sm font-body-sm text-body-sm">
                  <span className="text-on-surface">{item.label}</span>
                  <span className="text-on-surface-variant">{formatTzs(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-md">
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Total</p>
              <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{formatTzs(row.totalBill)}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Paid</p>
              <p className="font-body-sm text-body-sm font-semibold text-success m-0">{formatTzs(row.paid)}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Outstanding</p>
              <p className="font-body-sm text-body-sm font-semibold text-error m-0">{formatTzs(outstanding)}</p>
            </div>
          </div>

          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Status</p>
            <span className={`${STATUS_BADGE} ${styles.bg} ${styles.text}`}>{row.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

type PaymentFilter = 'All' | 'Unpaid' | 'Partial' | 'Paid' | 'Insurance Pending'

function PaymentStatusTab() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<PaymentRow[]>(() =>
    JSON.parse(localStorage.getItem('hf_mock_payment_rows') || JSON.stringify(INITIAL_PAYMENT_ROWS))
  )
  useEffect(() => {
    localStorage.setItem('hf_mock_payment_rows', JSON.stringify(rows))
  }, [rows])

  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>('All')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter rows based on search, status, and payment method
  const filteredRows = rows.filter((row) => {
    const matchesStatus = statusFilter === 'All' ? true : row.status === statusFilter
    const matchesMethod = paymentMethodFilter === 'All' ? true : row.paymentMethod === paymentMethodFilter
    const matchesSearch = searchQuery === '' ? true :
      row.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.patientNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesMethod && matchesSearch
  })

  // Calculate dynamic KPI metrics
  const totalBillsCount = rows.length
  const paidCount = rows.filter((r) => r.status === 'Paid').length
  const partialCount = rows.filter((r) => r.status === 'Partial').length
  const unpaidCount = rows.filter((r) => r.status === 'Unpaid').length

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAYMENT_PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * PAYMENT_PAGE_SIZE
  const visibleRows = filteredRows.slice(pageStart, pageStart + PAYMENT_PAGE_SIZE)
  const showingFrom = filteredRows.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + PAYMENT_PAGE_SIZE, filteredRows.length)

  return (
    <div className="space-y-lg">
      {/* Summary KPI Section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-md">
        {/* Total Bills */}
        <div className="bg-white p-md border border-[#dfe1e6] rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-label-sm text-[#42526e] mb-1 font-semibold uppercase tracking-wider m-0">Total Bills</p>
            <h3 className="text-2xl font-bold text-[#1a1b21] m-0 mt-xs">{totalBillsCount}</h3>
          </div>
          <div className="p-2 bg-[#dae2ff] rounded-lg text-[#0052cc] shrink-0">
            <span className="material-symbols-outlined text-[24px]">receipt</span>
          </div>
        </div>
        {/* Paid */}
        <div className="bg-white p-md border border-[#dfe1e6] rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-label-sm text-[#42526e] mb-1 font-semibold uppercase tracking-wider m-0">Paid</p>
            <h3 className="text-2xl font-bold text-[#36b37e] m-0 mt-xs">{paidCount}</h3>
          </div>
          <div className="p-2 bg-[#36b37e]/10 rounded-lg text-[#36b37e] shrink-0">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
          </div>
        </div>
        {/* Partial */}
        <div className="bg-white p-md border border-[#dfe1e6] rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-label-sm text-[#42526e] mb-1 font-semibold uppercase tracking-wider m-0">Partial</p>
            <h3 className="text-2xl font-bold text-[#ffab00] m-0 mt-xs">{partialCount}</h3>
          </div>
          <div className="p-2 bg-[#ffab00]/10 rounded-lg text-[#ffab00] shrink-0">
            <span className="material-symbols-outlined text-[24px]">hourglass_top</span>
          </div>
        </div>
        {/* Unpaid */}
        <div className="bg-white p-md border border-[#dfe1e6] rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-label-sm text-[#42526e] mb-1 font-semibold uppercase tracking-wider m-0">Unpaid</p>
            <h3 className="text-2xl font-bold text-[#ff5630] m-0 mt-xs">{unpaidCount}</h3>
          </div>
          <div className="p-2 bg-[#ff5630]/10 rounded-lg text-[#ff5630] shrink-0">
            <span className="material-symbols-outlined text-[24px]">pending</span>
          </div>
        </div>
      </section>

      {/* Main Table Section */}
      <section className="bg-white border border-[#dfe1e6] rounded-[16px] flex flex-col overflow-hidden shadow-sm">
        <div className="p-md flex items-center justify-between border-b border-[#dfe1e6]">
          <h4 className="font-headline-sm text-sm text-[#1a1b21] font-bold uppercase tracking-wider m-0">
            All Bills
          </h4>
        </div>

        {/* Filters Toolbar */}
        <div className="p-md grid grid-cols-1 md:grid-cols-4 gap-md bg-white border-b border-[#dfe1e6]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42526e] text-sm">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#dfe1e6] rounded-lg text-sm focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] outline-none"
              placeholder="Search by name or ID..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>
          <select
            className="w-full px-4 py-2 bg-white border border-[#dfe1e6] rounded-lg text-sm text-[#42526e] focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PaymentFilter)
              setCurrentPage(1)
            }}
          >
            <option value="All">Status: All</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Insurance Pending">Insurance Pending</option>
          </select>
          <select
            className="w-full px-4 py-2 bg-white border border-[#dfe1e6] rounded-lg text-sm text-[#42526e] focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] outline-none cursor-pointer"
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="All">Payment: All Types</option>
            <option value="Cash">Cash</option>
            <option value="Insurance">Insurance</option>
            <option value="M-Pesa">M-Pesa</option>
            <option value="Card">Credit Card</option>
          </select>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#42526e] text-sm">
              calendar_today
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#dfe1e6] rounded-lg text-sm text-[#42526e] focus:ring-1 focus:ring-[#0052cc] focus:border-[#0052cc] outline-none"
              type="text"
              readOnly
              value="08 Jun - 09 Jun 2026"
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-md text-center bg-white">
              <div className="w-32 h-32 bg-[#f3f3fb] rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-5xl text-[#42526e] opacity-30">
                  receipt_long
                </span>
              </div>
              <h5 className="text-base font-bold text-[#1a1b21] mb-1">No Bills Found</h5>
              <p className="text-sm text-[#42526e] max-w-xs m-0">
                There are no records matching your current filter criteria. Try adjusting the search or status.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="bg-[#f3f3fb]">
                <tr>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6]">Patient Name</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6]">Patient #</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6]">Visit Date</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6]">Department</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6]">Total Amount</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6]">Paid</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6]">Outstanding</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6] text-center">Payment Type</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6]">Bill Status</th>
                  <th className="px-md py-3 font-semibold text-[11px] text-[#42526e] uppercase tracking-wider border-b border-[#dfe1e6] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dfe1e6]">
                {visibleRows.map((row) => {
                  const outstanding = getOutstanding(row)
                  const statusStyle = row.status === 'Paid'
                    ? 'bg-[#36b37e]/10 text-[#36b37e]'
                    : row.status === 'Partial'
                    ? 'bg-[#ffab00]/10 text-[#ffab00]'
                    : row.status === 'Insurance Pending'
                    ? 'bg-[#00b8d9]/10 text-[#00b8d9]'
                    : 'bg-[#ff5630]/10 text-[#ff5630]'

                  return (
                    <tr key={row.id} className="hover:bg-[#dae2ff]/20 transition-colors group">
                      <td className="px-md py-4 text-sm text-[#1a1b21] font-semibold">{row.patientName}</td>
                      <td className="px-md py-4 text-sm text-[#42526e]">{row.patientNumber}</td>
                      <td className="px-md py-4 text-sm text-[#42526e]">{row.visitDate}</td>
                      <td className="px-md py-4 text-sm text-[#42526e]">{row.department}</td>
                      <td className="px-md py-4 text-sm text-[#1a1b21] font-semibold">{formatTzs(row.totalBill)}</td>
                      <td className="px-md py-4 text-sm text-[#36b37e] font-semibold">{formatTzs(row.paid)}</td>
                      <td className={`px-md py-4 text-sm font-bold ${outstanding > 0 ? 'text-[#ff5630]' : 'text-[#42526e]'}`}>
                        {formatTzs(outstanding)}
                      </td>
                      <td className="px-md py-4 text-center">
                        <span className="px-2.5 py-1 bg-[#e2e2ea] text-[#42526e] rounded-full text-[10px] font-bold uppercase">
                          {row.paymentMethod}
                        </span>
                      </td>
                      <td className="px-md py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-md py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {canRecordPayment(row) ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/billing/payment/${row.id}`)}
                              className="h-8 px-3 bg-[#0052cc] text-white rounded-lg text-xs font-semibold hover:bg-[#003d9b] transition-all active:scale-95 cursor-pointer border-0"
                            >
                              Process Payment
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="h-8 px-3 bg-[#f4f5f7] text-[#42526e] opacity-50 rounded-lg text-xs font-semibold border-0 cursor-not-allowed"
                            >
                              Processed
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/billing/bills/${row.id}`)}
                            className="h-8 px-3 border border-[#dfe1e6] bg-white text-[#42526e] rounded-lg text-xs font-semibold hover:bg-[#f4f5f7] transition-all cursor-pointer"
                          >
                            View Bill
                          </button>
                          <button
                            type="button"
                            title="Print Receipt"
                            onClick={() => toast.success(`Receipt for ${row.patientName} sent to printer.`)}
                            className="p-1 text-[#42526e] hover:text-[#0052cc] transition-colors bg-transparent border-0 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer / Pagination */}
        {filteredRows.length > 0 && (
          <div className="p-md border-t border-[#dfe1e6] flex items-center justify-between bg-[#faf8ff]">
            <p className="text-xs text-[#42526e] m-0 font-medium">
              Showing {showingFrom}-{showingTo} of {filteredRows.length} results
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center border border-[#dfe1e6] rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 h-8 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    safePage === page
                      ? 'border-[#0052cc] bg-[#0052cc] text-white'
                      : 'border-[#dfe1e6] hover:bg-white text-[#42526e] bg-transparent'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-[#dfe1e6] rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// Get the default active tab based on user roles
function getDefaultBillingTab(roles: string[]): PageTab {
  if (roles.includes(ROLES.cashier)) {
    return 'payment'
  }
  return 'insurance'
}

export function BillsPage() {
  const location = useLocation()
  const { roles, hasRole, isHospitalAdmin } = usePermissions()
  const tabFromState = (location.state as { tab?: PageTab } | null)?.tab
  const [activeTab, setActiveTab] = useState<PageTab>(tabFromState ?? getDefaultBillingTab(roles))

  const canManageInsurance =
    hasRole(ROLES.receptionist) || isHospitalAdmin() || !hasRole(ROLES.cashier)

  const isCashierOnly = hasRole(ROLES.cashier) && !hasRole(ROLES.receptionist) && !isHospitalAdmin()

  // If the user is only a Cashier, render the redesigned tab-free bills page directly
  if (isCashierOnly) {
    return <PaymentStatusTab />
  }

  return (
    <div className="max-w-container-max mx-auto px-gutter space-y-md">
      <ReceptionTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'insurance' ? (
        <InsuranceVerificationsTab canManage={canManageInsurance} />
      ) : (
        <PaymentStatusTab />
      )}
    </div>
  )
}
