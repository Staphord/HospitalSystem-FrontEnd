import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { wardService } from '@/api/services/ward'
import type { AdmittedPatient, AdmissionStatus } from '@/features/consultation/types/inpatientOrders'

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AdmissionStatus, { badge: string; rowBg: string; label: string }> = {
  critical: { badge: 'bg-error text-white', rowBg: 'bg-[#FFF4F4]', label: 'Critical' },
  stable: { badge: 'bg-success/10 text-success border border-success/30', rowBg: 'bg-surface-white', label: 'Stable' },
  monitoring: { badge: 'bg-primary/10 text-primary border border-primary/20', rowBg: 'bg-surface-white', label: 'Monitoring' },
  'discharge-ready': { badge: 'bg-[#E3FCEF] text-[#006644] border border-success/40 font-bold', rowBg: 'bg-surface-white', label: 'Discharge Ready' },
}

const AVATAR_BG: Record<AdmissionStatus, string> = {
  critical: 'bg-error-container text-on-error-container',
  stable: 'bg-secondary-container text-on-secondary-container',
  monitoring: 'bg-primary/10 text-primary',
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
  const [patients, setPatients] = useState<AdmittedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [wardFilter, setWardFilter] = useState('All Wards')
  const [conditionFilter, setConditionFilter] = useState<'all' | AdmissionStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const loadPatients = async () => {
    try {
      const res = await wardService.getAdmittedPatients()
      const mapped: AdmittedPatient[] = (res || []).map((item: any) => {
        const admissionDateStr = item.admissionDate || item.admission_date || item.created_at
        let los = item.lengthOfStay
        if (los == null) los = item.lengthOfStayDays
        if (los == null) los = item.length_of_stay_days
        if (los == null && admissionDateStr) {
          const adm = new Date(admissionDateStr)
          if (!isNaN(adm.getTime())) {
            const diffMs = Date.now() - adm.getTime()
            los = Math.max(0, Math.round((diffMs / (1000 * 60 * 60 * 24)) * 10) / 10)
          }
        }
        if (los == null) los = 0

        let status: AdmissionStatus = 'stable'
        if (item.status === 'critical') status = 'critical'
        else if (item.status === 'monitoring') status = 'monitoring'
        else if (item.status === 'discharge-ready' || item.status === 'discharged') status = 'discharge-ready'
        else status = 'stable'

        const pName = item.patientName || item.name || (item.patientId ? `Patient ${item.patientId.slice(0, 8)}` : 'Patient')

        const pNum = item.patient_number || item.patientNumber || (item.patient_id || item.patientId ? `PT-${(item.patient_id || item.patientId).slice(0, 6).toUpperCase()}` : '—')

        let admDateFormatted = '—'
        if (admissionDateStr) {
          const d = new Date(admissionDateStr)
          if (!isNaN(d.getTime())) {
            admDateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          } else {
            admDateFormatted = String(admissionDateStr)
          }
        }

        return {
          id: item.admissionId || item.id || item.patientId || String(Math.random()),
          patientId: item.patientId || item.patient_id || '',
          name: pName,
          patientNumber: pNum,
          initials: pName
            .split(' ')
            .filter(Boolean)
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'PT',
          gender: item.gender || '—',
          age: item.age || 0,
          ward: item.wardName || item.ward || 'General Ward',
          bed: item.bedNumber ? `Bed ${item.bedNumber}` : item.bed || '—',
          admissionDate: admDateFormatted,
          lengthOfStay: Number(los),
          diagnosis: item.admittingDiagnosis || item.diagnosis || 'General Observation',
          primaryDiagnosis: item.admittingDiagnosis || item.primaryDiagnosis || 'General Observation',
          status,
        }
      })
      setPatients(mapped)
    } catch (err) {
      console.error('Failed to load admitted patients:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, wardFilter, conditionFilter])

  const uniqueWards = useMemo(() => {
    return ['All Wards', ...Array.from(new Set(patients.map((p) => p.ward)))]
  }, [patients])

  const filtered = useMemo(() => {
    let data = [...patients]
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.patientNumber.toLowerCase().includes(q) ||
          p.ward.toLowerCase().includes(q) ||
          p.bed.toLowerCase().includes(q) ||
          p.diagnosis.toLowerCase().includes(q)
      )
    }
    if (wardFilter !== 'All Wards') data = data.filter((p) => p.ward === wardFilter)
    if (conditionFilter !== 'all') data = data.filter((p) => p.status === conditionFilter)
    // Critical always pinned to top
    data.sort((a, b) => {
      if (a.status === 'critical' && b.status !== 'critical') return -1
      if (b.status === 'critical' && a.status !== 'critical') return 1
      return 0
    })
    return data
  }, [patients, searchQuery, wardFilter, conditionFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const paginated = filtered.slice(pageStart, pageStart + pageSize)
  const showingFrom = filtered.length === 0 ? 0 : pageStart + 1
  const showingTo = Math.min(pageStart + pageSize, filtered.length)

  const criticalCount = patients.filter((p) => p.status === 'critical').length
  const dischargeReady = patients.filter((p) => p.status === 'discharge-ready').length

  const totalLOS = patients.reduce((s, p) => s + (p.lengthOfStay || 0), 0)
  const avgLOS = patients.length === 0 ? '0.0' : (totalLOS / patients.length).toFixed(1)

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg">
      <p className="font-body-sm text-body-sm text-outline m-0">
        Managing current inpatient assignments and critical updates.
      </p>

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
          <div className="flex flex-wrap items-center gap-sm">
            {/* Live Search Bar */}
            <div className="relative flex items-center min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none select-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, patient #, ward..."
                className="w-full pl-9 pr-3 py-1.5 font-body-sm text-body-sm bg-surface-container-low border border-border-subtle rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline"
              />
            </div>
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
                    const sCfg = STATUS_CONFIG[p.status]
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
                              className={`p-2 transition-colors rounded-full border-0 cursor-pointer ${openMenuId === p.id
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
        <div className="p-md bg-surface-bright border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-md">
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              {filtered.length === 0
                ? 'No active admissions match filters'
                : `Showing ${showingFrom} to ${showingTo} of ${filtered.length} active admissions`}
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
              className="w-8 h-8 flex items-center justify-center border border-border-subtle rounded hover:bg-surface-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-transparent cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`px-sm h-8 border rounded font-body-sm cursor-pointer ${safePage === page
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
