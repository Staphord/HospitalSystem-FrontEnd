import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { NewReferralModal } from '@/features/consultation/components/NewReferralModal'
import { ReferralDetailModal } from '@/features/consultation/components/ReferralDetailModal'
import {
  addReferral,
  cancelReferral,
  getReferrals,
  getReferralStats,
} from '@/features/consultation/data/mockReferrals'
import type { NewReferralInput, Referral, ReferralStatus, ReferralType } from '@/features/consultation/types/referrals'

const PAGE_SIZE = 5

const STATUS_CONFIG: Record<ReferralStatus, { badge: string; label: string }> = {
  pending:   { badge: 'bg-warning/10 text-warning', label: 'Pending' },
  accepted:  { badge: 'bg-success/10 text-success', label: 'Accepted' },
  declined:  { badge: 'bg-error/10 text-error', label: 'Declined' },
  completed: { badge: 'bg-surface-container-highest text-outline', label: 'Completed' },
  cancelled: { badge: 'bg-surface-container text-outline border border-border-subtle', label: 'Cancelled' },
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  valueColor = 'text-on-surface',
}: {
  label: string
  value: number
  icon: string
  iconBg: string
  iconColor: string
  valueColor?: string
}) {
  return (
    <div className="bg-surface-white p-lg rounded-xl border border-border-subtle flex flex-col gap-xs shadow-sm">
      <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">{label}</span>
      <div className="flex items-center justify-between">
        <span className={`font-headline-lg text-headline-lg ${valueColor}`}>{value}</span>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          <span className={`material-symbols-outlined leading-none ${iconColor}`}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

function CancelConfirmModal({
  referral,
  onClose,
  onConfirm,
}: {
  referral: Referral
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[400px] bg-surface-white rounded-xl shadow-2xl p-lg">
        <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Cancel Referral?</h2>
        <p className="font-body-sm text-body-sm text-outline mt-sm m-0">
          Cancel the pending referral for <strong>{referral.patientName}</strong> to{' '}
          <strong>{referral.referredTo}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-md mt-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-md py-sm font-label-md text-label-md text-outline hover:text-on-surface bg-transparent border-0 cursor-pointer"
          >
            Keep Referral
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-lg py-sm rounded-lg bg-error text-white font-label-md text-label-md hover:opacity-90 border-0 cursor-pointer"
          >
            Cancel Referral
          </button>
        </div>
      </div>
    </div>
  )
}

export function MyReferralsPage() {
  const navigate = useNavigate()
  const [referrals, setReferrals] = useState<Referral[]>(() => getReferrals())
  const [typeFilter, setTypeFilter] = useState<'all' | ReferralType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ReferralStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showNewModal, setShowNewModal] = useState(false)
  const [detailReferral, setDetailReferral] = useState<Referral | null>(null)
  const [cancelReferralTarget, setCancelReferralTarget] = useState<Referral | null>(null)

  const refresh = () => setReferrals(getReferrals())

  const stats = useMemo(() => getReferralStats(), [referrals])

  const filtered = useMemo(() => {
    let data = [...referrals]
    if (typeFilter !== 'all') data = data.filter((r) => r.type === typeFilter)
    if (statusFilter !== 'all') data = data.filter((r) => r.status === statusFilter)
    return data
  }, [referrals, typeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const showingFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(safePage * PAGE_SIZE, filtered.length)

  const handleTypeFilter = (v: 'all' | ReferralType) => {
    setTypeFilter(v)
    setCurrentPage(1)
  }

  const handleStatusFilter = (v: 'all' | ReferralStatus) => {
    setStatusFilter(v)
    setCurrentPage(1)
  }

  const handleSubmitReferral = (input: NewReferralInput) => {
    addReferral(input)
    refresh()
    setShowNewModal(false)
    toast.success(`Referral submitted for ${input.patientName}.`)
  }

  const handleConfirmCancel = () => {
    if (!cancelReferralTarget) return
    cancelReferral(cancelReferralTarget.id)
    refresh()
    setCancelReferralTarget(null)
    toast.success('Referral cancelled.')
  }

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface m-0">My Referrals</h1>
          <p className="font-body-sm text-body-sm text-outline mt-xs m-0">
            Manage and track your outgoing clinical referrals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="bg-primary text-white px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-colors flex items-center gap-sm shadow-sm active:scale-95 border-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">add</span>
          New Referral
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard label="Total Referrals" value={stats.total} icon="assignment" iconBg="bg-surface-container-low" iconColor="text-outline" />
        <StatCard label="Pending" value={stats.pending} icon="pending" iconBg="bg-warning/10" iconColor="text-warning" valueColor="text-warning" />
        <StatCard label="Accepted" value={stats.accepted} icon="check_circle" iconBg="bg-success/10" iconColor="text-success" valueColor="text-success" />
        <StatCard label="Declined" value={stats.declined} icon="cancel" iconBg="bg-error/10" iconColor="text-error" valueColor="text-error" />
      </div>

      {/* Table Card */}
      <div className="bg-surface-white rounded-xl border border-border-subtle overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-md">
          <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">All Referrals</h2>
          <div className="flex items-center gap-sm flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilter(e.target.value as 'all' | ReferralType)}
              className="font-body-sm text-body-sm rounded-lg py-sm pl-sm pr-lg bg-surface-container-low border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="all">Type: All</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value as 'all' | ReferralStatus)}
              className="font-body-sm text-body-sm rounded-lg py-sm pl-sm pr-lg bg-surface-container-low border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                {['Patient Name', 'Patient #', 'Referred To', 'Type', 'Referred At', 'Reason', 'Status', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-md py-md font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap ${i === 0 ? 'pl-lg' : ''} ${i === 7 ? 'pr-lg text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-lg py-xl text-center font-body-sm text-body-sm text-outline">
                    No referrals match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => {
                  const statusCfg = STATUS_CONFIG[r.status]
                  return (
                    <tr key={r.id} className="hover:bg-primary-fixed/40 transition-colors group">
                      <td className="pl-lg py-md font-body-sm text-on-surface font-medium whitespace-nowrap">{r.patientName}</td>
                      <td className="px-md py-md font-body-sm text-outline whitespace-nowrap">{r.patientNumber}</td>
                      <td className="px-md py-md font-body-sm text-on-surface whitespace-nowrap">{r.referredTo}</td>
                      <td className="px-md py-md">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                          r.type === 'internal' ? 'bg-primary-fixed text-primary' : 'bg-secondary/10 text-secondary'
                        }`}>
                          {r.type}
                        </span>
                      </td>
                      <td className="px-md py-md font-body-sm text-outline whitespace-nowrap">{r.referredAt}</td>
                      <td className="px-md py-md font-body-sm text-outline max-w-[140px] truncate" title={r.reason}>
                        {r.reason}
                      </td>
                      <td className="px-md py-md">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="pr-lg py-md text-right whitespace-nowrap">
                        <button
                          type="button"
                          title="View Details"
                          onClick={() => setDetailReferral(r)}
                          className="p-1.5 hover:bg-surface-container rounded-lg text-outline transition-colors border-0 cursor-pointer bg-transparent"
                        >
                          <span className="material-symbols-outlined text-[18px] leading-none">visibility</span>
                        </button>
                        {r.status === 'pending' && (
                          <button
                            type="button"
                            title="Cancel Referral"
                            onClick={() => setCancelReferralTarget(r)}
                            className="p-1.5 hover:bg-error/10 hover:text-error rounded-lg text-outline transition-colors border-0 cursor-pointer bg-transparent ml-xs"
                          >
                            <span className="material-symbols-outlined text-[18px] leading-none">close</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-lg py-md border-t border-border-subtle bg-surface-container-low/30 flex flex-col sm:flex-row justify-between items-center gap-sm">
          <span className="font-label-sm text-label-sm text-outline">
            Showing {showingFrom}–{showingTo} of {filtered.length} Referral{filtered.length === 1 ? '' : 's'}
          </span>
          <div className="flex gap-xs">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 rounded border border-border-subtle text-outline hover:bg-surface-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-transparent cursor-pointer font-body-sm text-body-sm"
            >
              Prev
            </button>
            <span className="px-3 py-1 rounded bg-primary text-white font-body-sm text-body-sm">{safePage}</span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 rounded border border-border-subtle text-outline hover:bg-surface-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-transparent cursor-pointer font-body-sm text-body-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showNewModal && (
        <NewReferralModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleSubmitReferral}
        />
      )}

      {detailReferral && (
        <ReferralDetailModal
          referral={detailReferral}
          onClose={() => setDetailReferral(null)}
          onViewPatient={(id) => navigate(`/consultation/history/${id}`)}
        />
      )}

      {cancelReferralTarget && (
        <CancelConfirmModal
          referral={cancelReferralTarget}
          onClose={() => setCancelReferralTarget(null)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  )
}
