import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { wardService } from '@/api/services/ward'
import type { AdmittedPatient, AdmissionStatus } from '@/features/consultation/types/inpatientOrders'

const PAGE_SIZE = 5

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AdmissionStatus, { badge: string; rowBg: string; label: string }> = {
  critical:        { badge: 'bg-error text-white',                                              rowBg: 'bg-[#FFF4F4]',   label: 'Critical'        },
  stable:          { badge: 'bg-success/10 text-success border border-success/30',              rowBg: 'bg-surface-white', label: 'Stable'        },
  monitoring:      { badge: 'bg-primary/10 text-primary border border-primary/20',              rowBg: 'bg-surface-white', label: 'Monitoring'    },
  'discharge-ready': { badge: 'bg-[#E3FCEF] text-[#006644] border border-success/40 font-bold', rowBg: 'bg-surface-white', label: 'Discharge Ready' },
}

const AVATAR_BG: Record<AdmissionStatus, string> = {
  critical:          'bg-error-container text-on-error-container',
  stable:            'bg-secondary-container text-on-secondary-container',
  monitoring:        'bg-primary/10 text-primary',
  'discharge-ready': 'bg-success/10 text-success',
}

// ── Row action dropdown ────────────────────────────────────────────────────────

interface RowMenuProps {
  patient: AdmittedPatient
  onClose: () => void
  onViewOrders: () => void
  onViewHistory: () => void
  onDischarge: () => void
}

function RowActionMenu({ patient, onClose, onViewOrders, onViewHistory, onDischarge }: RowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const canDischarge = patient.status === 'stable' || patient.status === 'monitoring' || patient.status === 'discharge-ready'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-xs z-40 w-52 bg-surface-white border border-border-subtle rounded-xl shadow-lg py-xs overflow-hidden"
      role="menu"
    >
      {/* View Orders */}
      <button
        type="button"
        role="menuitem"
        onClick={() => { onViewOrders(); onClose() }}
        className="w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer text-left"
      >
        <span className="material-symbols-outlined text-[18px] leading-none text-primary">clinical_notes</span>
        View Orders
      </button>

      {/* View Patient Details */}
      <button
        type="button"
        role="menuitem"
        onClick={() => { onViewHistory(); onClose() }}
        className="w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer text-left"
      >
        <span className="material-symbols-outlined text-[18px] leading-none text-secondary">visibility</span>
        View Patient Details
      </button>
      {canDischarge && (
        <>
          <div className="h-px bg-border-subtle my-xs mx-md" />
          <button
            type="button"
            role="menuitem"
            onClick={() => { onDischarge(); onClose() }}
            className="w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint transition-colors bg-transparent border-0 cursor-pointer text-left"
          >
            <span className="material-symbols-outlined text-[18px] leading-none text-success">logout</span>
            Discharge Patient
          </button>
        </>
      )}
    </div>
  )
}

// ── Stat cards ────────────────────────────────────────────────────────────────

function StatCard({ icon, iconBg, iconColor, label, value, valueColor = 'text-on-surface' }: {
  icon: string; iconBg: string; iconColor: string; label: string; value: string | number; valueColor?: string
}) {
  return (
    <div className="bg-surface-white border border-border-subtle rounded-xl p-lg flex items-center gap-lg shadow-sm">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        <span className={`material-symbols-outlined leading-none ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="font-label-md text-label-md text-outline uppercase tracking-wider m-0 mb-xs">{label}</p>
        <p className={`font-headline-md text-headline-md font-bold m-0 ${valueColor}`}>{value}</p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function InpatientPage() {
  const navigate = useNavigate()
  const [patients, setPatients]               = useState<AdmittedPatient[]>([])
  const [loading, setLoading]                 = useState(true)
  const [wardFilter, setWardFilter]           = useState('All Wards')
  const [conditionFilter, setConditionFilter] = useState<'all' | AdmissionStatus>('all')
  const [currentPage, setCurrentPage]         = useState(1)
  const [openMenuId, setOpenMenuId]           = useState<string | null>(null)

  const loadPatients = async () => {
    try {
      const res = await wardService.getAdmittedPatients()
      setPatients(res.data)
    } catch (err) {
      console.error('Failed to load admitted patients:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const uniqueWards = useMemo(() => {
    return ['All Wards', ...Array.from(new Set(patients.map((p) => p.ward)))]
  }, [patients])

  const filtered = useMemo(() => {
    let data = [...patients]
    if (wardFilter !== 'All Wards') data = data.filter((p) => p.ward === wardFilter)
    if (conditionFilter !== 'all')  data = data.filter((p) => p.status === conditionFilter)
    // Critical always pinned to top
    data.sort((a, b) => {
      if (a.status === 'critical' && b.status !== 'critical') return -1
      if (b.status === 'critical' && a.status !== 'critical') return 1
      return 0
    })
    return data
  }, [patients, wardFilter, conditionFilter])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo   = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const criticalCount      = patients.filter((p) => p.status === 'critical').length
  const dischargeReady     = patients.filter((p) => p.status === 'discharge-ready').length
  const avgLOS             = patients.length === 0 ? '0' : (patients.reduce((s, p) => s + p.lengthOfStay, 0) / patients.length).toFixed(1)

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface m-0">Admitted Patients</h1>
          <p className="font-body-sm text-body-sm text-outline mt-xs m-0">
            Managing current inpatient assignments and critical updates.
          </p>
        </div>
        <div className="flex gap-sm">
          <button
            type="button"
            className="bg-surface-white border border-border-subtle px-md py-2 rounded-lg flex items-center gap-xs font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] leading-none">filter_list</span>
            Filter Views
          </button>
          <button
            type="button"
            className="bg-primary text-white px-md py-2 rounded-lg flex items-center gap-xs font-label-md text-label-md hover:opacity-90 transition-opacity border-0 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] leading-none">add</span>
            Admit New Patient
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <StatCard
          icon="group"
          iconBg="bg-primary/10"
          iconColor="text-primary"
          label="My Admitted Patients"
          value={patients.length}
        />
        <StatCard
          icon="emergency"
          iconBg="bg-error-container"
          iconColor="text-error"
          label="Critical"
          value={criticalCount}
          valueColor="text-error"
        />
        <StatCard
          icon="check_circle"
          iconBg="bg-success/10"
          iconColor="text-success"
          label="Discharge Ready"
          value={dischargeReady}
          valueColor="text-success"
        />
        <StatCard
          icon="schedule"
          iconBg="bg-[#E6F0FF]"
          iconColor="text-[#0052CC]"
          label="Avg Length of Stay"
          value={`${avgLOS} days`}
        />
      </div>

      {/* Patient Table Card */}
      <div className="bg-surface-white border border-border-subtle rounded-xl shadow-sm overflow-visible">

        {/* Card header with filters */}
        <div className="px-lg py-md border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-md">
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Patients Under My Care</h3>
          <div className="flex flex-wrap gap-sm">
            <select
              value={wardFilter}
              onChange={(e) => { setWardFilter(e.target.value); setCurrentPage(1) }}
              className="font-label-md text-label-md border border-border-subtle rounded-lg bg-surface-container-low px-sm py-1.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all"
            >
              {uniqueWards.map((w) => <option key={w}>{w}</option>)}
            </select>
            <select
              value={conditionFilter}
              onChange={(e) => { setConditionFilter(e.target.value as 'all' | AdmissionStatus); setCurrentPage(1) }}
              className="font-label-md text-label-md border border-border-subtle rounded-lg bg-surface-container-low px-sm py-1.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all"
            >
              <option value="all">All Conditions</option>
              <option value="critical">Critical</option>
              <option value="stable">Stable</option>
              <option value="monitoring">Monitoring</option>
              <option value="discharge-ready">Discharge Ready</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-xl bg-surface-white">
            <span className="material-symbols-outlined text-primary text-[32px] animate-spin">sync</span>
          </div>
        ) : (
          <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                {['Patient Name', 'Patient #', 'Ward / Bed', 'Adm. Date', 'LOS', 'Diagnosis', 'Status', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-widest ${i === 7 ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-lg py-xl text-center">
                    <div className="flex flex-col items-center gap-md">
                      <span
                        className="material-symbols-outlined text-[56px] text-outline/30 leading-none select-none"
                        style={{ fontVariationSettings: "'wght' 200" }}
                      >
                        bed
                      </span>
                      <p className="font-body-md text-body-md text-outline m-0">
                        No admitted patients match the selected filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const sCfg   = STATUS_CONFIG[p.status]
                  const avatar = AVATAR_BG[p.status]

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:brightness-95 ${sCfg.rowBg}`}
                    >
                      {/* Patient Name */}
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-sm">
                          <div className={`w-8 h-8 rounded-full ${avatar} flex items-center justify-center font-bold text-xs shrink-0`}>
                            {p.initials}
                          </div>
                          <span className="font-semibold text-on-surface">{p.name}</span>
                        </div>
                      </td>

                      {/* Patient # */}
                      <td className="px-lg py-md font-body-sm text-body-sm text-outline whitespace-nowrap">
                        {p.patientNumber}
                      </td>

                      {/* Ward / Bed */}
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface whitespace-nowrap">
                        {p.ward} / {p.bed}
                      </td>

                      {/* Admission Date */}
                      <td className="px-lg py-md font-body-sm text-body-sm text-outline whitespace-nowrap">
                        {p.admissionDate}
                      </td>

                      {/* LOS */}
                      <td className="px-lg py-md">
                        <span className="flex items-center gap-xs font-body-sm text-body-sm text-outline whitespace-nowrap">
                          <span className="material-symbols-outlined text-[16px] leading-none">schedule</span>
                          {p.lengthOfStay} {p.lengthOfStay === 1 ? 'day' : 'days'}
                        </span>
                      </td>

                      {/* Diagnosis */}
                      <td className="px-lg py-md font-body-sm text-body-sm text-outline max-w-[160px] truncate" title={p.diagnosis}>
                        {p.diagnosis}
                      </td>

                      {/* Status badge */}
                      <td className="px-lg py-md">
                        <span className={`px-2 py-1 rounded font-label-sm text-[10px] uppercase ${sCfg.badge}`}>
                          {sCfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-lg py-md text-right">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Action button clicked:', p.id, p)
                              setOpenMenuId(openMenuId === p.id ? null : p.id)
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            className={`p-2 transition-colors rounded-full border-0 cursor-pointer ${
                              openMenuId === p.id
                                ? 'bg-surface-container text-on-surface'
                                : 'text-on-surface-variant hover:bg-surface-container bg-transparent'
                            }`}
                            title="More actions"
                            aria-haspopup="true"
                            aria-expanded={openMenuId === p.id}
                          >
                            <span className="material-symbols-outlined leading-none">more_vert</span>
                          </button>

                          {openMenuId === p.id && (
                            <RowActionMenu
                              patient={p}
                              onClose={() => setOpenMenuId(null)}
                              onViewOrders={() => navigate(`/consultation/inpatient/${p.id}/orders`)}
                              onViewHistory={() => navigate(`/consultation/history/${p.patientId}`)}
                              onDischarge={() => navigate(`/consultation/inpatient/${p.id}/discharge`)}
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
        )}

        {/* Pagination footer */}
        <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex items-center justify-between gap-md">
          <p className="font-body-sm text-body-sm text-outline m-0">
            {filtered.length === 0
              ? 'No active admissions match filters'
              : `Showing ${showingFrom}–${showingTo} of ${filtered.length} active admission${filtered.length === 1 ? '' : 's'}`}
          </p>
          <div className="flex gap-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-sm py-1 border border-border-subtle rounded bg-surface-white font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-sm py-1 border border-border-subtle rounded bg-surface-white font-label-md text-label-md hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        type="button"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-50 border-0 cursor-pointer"
        aria-label="Admit new patient"
      >
        <span className="material-symbols-outlined leading-none">add</span>
      </button>
    </div>
  )
}
