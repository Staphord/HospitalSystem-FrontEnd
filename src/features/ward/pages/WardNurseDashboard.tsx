import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { wardService } from '@/api/services/ward'
import type { AdmissionCondition } from '@/api/types/ward'

interface Patient {
  id: string
  name: string
  bed: string
  condition: 'Stable' | 'Monitoring' | 'Critical'
  admittingDoctor: string
  diagnosis: string
  activeVisitors: number
  lastNote?: string
}

interface Order {
  id: string
  admissionId?: string
  patientName: string
  type: 'Medication' | 'Nursing' | 'Diet' | 'Investigation'
  detail: string
  dueTime: string
  overdue: boolean
}

interface Visitor {
  id: string
  name: string
  patientName: string
  relationship?: string
  timeLeft: number // in seconds
}

const conditionLabel = (c: AdmissionCondition): Patient['condition'] =>
  c === 'critical' ? 'Critical' : c === 'monitoring' ? 'Monitoring' : 'Stable'

// Format remaining time as a readable string
const formatTimeLeft = (seconds: number): { label: string; isOverdue: boolean } => {
  if (seconds <= 0) {
    const overMin = Math.floor(Math.abs(seconds) / 60)
    return { label: overMin > 0 ? `Exceeded: ${overMin}m` : 'Time Up', isOverdue: true }
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return { label: `${h}h ${m}m left`, isOverdue: false }
  return { label: `${m}m left`, isOverdue: m < 10 }
}

// Derive bed overview counts from patient list and real bed total
const deriveBedCounts = (patients: Patient[], totalBeds: number) => ({
  stable: patients.filter((p) => p.condition === 'Stable').length,
  monitoring: patients.filter((p) => p.condition === 'Monitoring').length,
  critical: patients.filter((p) => p.condition === 'Critical').length,
  available: Math.max(0, totalBeds - patients.length),
})

export function WardNurseDashboard() {
  const [stats, setStats] = useState({
    admitted: 0,
    bedsOccupied: '0/0',
    critical: 0,
    dueForRound: 0,
    activeVisitors: 0,
  })

  const [totalBeds, setTotalBeds] = useState(0)

  const [newAdmission, setNewAdmission] = useState<{
    id: string
    name: string
    bed: string
    admittingDoctor: string
    diagnosis: string
  } | null>(null)

  const [patients, setPatients] = useState<Patient[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [visitors, setVisitors] = useState<Visitor[]>([])

  useEffect(() => {
    Promise.all([
      wardService.listAdmissions({ status: 'active', limit: 200 }),
      wardService.listBeds({ is_active: true }),
      wardService.listActiveOrders(),
      wardService.listActiveVisitors(),
    ])
      .then(([admissions, beds, apiOrders, activeVisitors]) => {
        const occupied = beds.filter((b) => !b.isAvailable).length
        setTotalBeds(beds.length)
        const visitorCounts = new Map<string, number>()
        activeVisitors.forEach((v) => {
          if (!v.admissionId) return
          visitorCounts.set(v.admissionId, (visitorCounts.get(v.admissionId) || 0) + 1)
        })
        setVisitors(
          activeVisitors.map((v) => ({
            id: v.visitorId,
            name: v.visitorName,
            patientName: v.patientName,
            relationship: v.relationship,
            timeLeft: Math.max(0, v.timeLeftSeconds ?? 0),
          })),
        )
        const mappedPatients = admissions.slice(0, 5).map((a) => ({
          id: a.admissionId,
          name: `Patient ${a.patientId.slice(0, 8)}`,
          bed: a.bedNumber ? `Bed ${a.bedNumber}` : a.wardName || '—',
          condition: conditionLabel(a.condition),
          admittingDoctor: a.admittingDoctorId || '—',
          diagnosis: a.admittingDiagnosis,
          activeVisitors: visitorCounts.get(a.admissionId) || 0,
        }))
        setPatients(mappedPatients)
        setStats({
          admitted: admissions.length,
          bedsOccupied: `${occupied}/${beds.length}`,
          critical: admissions.filter((a) => a.condition === 'critical').length,
          dueForRound: apiOrders.filter((o) => o.status !== 'completed').length,
          activeVisitors: activeVisitors.length,
        })
        if (admissions[0]) {
          const newest = [...admissions].sort(
            (a, b) =>
              new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime(),
          )[0]
          setNewAdmission({
            id: newest.admissionId,
            name: `Patient ${newest.patientId.slice(0, 8)}`,
            bed: newest.bedNumber ? `Bed ${newest.bedNumber}` : newest.wardName || '—',
            admittingDoctor: newest.admittingDoctorId || '—',
            diagnosis: newest.admittingDiagnosis,
          })
        }
        setOrders(
          apiOrders
            .filter((o) => o.status !== 'completed')
            .slice(0, 4)
            .map((o) => {
              const t = o.orderType.toLowerCase()
              const type: Order['type'] =
                t === 'medication'
                  ? 'Medication'
                  : t === 'nursing'
                    ? 'Nursing'
                    : t === 'diet'
                      ? 'Diet'
                      : 'Investigation'
              return {
                id: o.orderId,
                admissionId: o.admissionId,
                patientName: o.patientLabel || `Patient ${o.patientId.slice(0, 8)}`,
                type,
                detail: o.orderDetail,
                dueTime: o.frequency || 'Due now',
                overdue: false,
              }
            }),
        )
      })
      .catch((err) => {
        console.error(err)
        toast.error(err.response?.data?.detail || 'Failed to load ward dashboard.')
      })
  }, [])

  // Countdown timer for visitor time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setVisitors((prev) =>
        prev.map((v) => ({
          ...v,
          timeLeft: v.timeLeft - 1,
        })),
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleDismissAdmission = () => {
    setNewAdmission(null)
    toast.success('Admission alert dismissed.')
  }

  const handleToggleOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId)
    if (!target?.admissionId) return
    wardService
      .updateOrder(target.admissionId, orderId, { status: 'completed' })
      .then(() => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId))
        toast.success('Order marked as completed.')
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to update order.')
      })
  }

  const bedCounts = deriveBedCounts(patients, totalBeds)

  // Type-color map for order strips and badges
  const orderTypeStyle = (type: Order['type']) => {
    switch (type) {
      case 'Medication':
        return { strip: 'bg-[#6554C0]', badge: 'bg-[#6554C0]/10 text-[#6554C0] border-[#6554C0]/20' }
      case 'Nursing':
        return { strip: 'bg-success', badge: 'bg-success/10 text-success border-success/20' }
      case 'Diet':
        return { strip: 'bg-vibrant-cyan', badge: 'bg-vibrant-cyan/10 text-vibrant-cyan border-vibrant-cyan/20' }
      case 'Investigation':
        return { strip: 'bg-warning', badge: 'bg-warning/10 text-warning border-warning/20' }
    }
  }

  return (
    <div className="p-lg max-w-container-max mx-auto min-h-screen bg-neutral-bg">

      {/* Main two-column layout */}
      <div className="flex flex-col lg:flex-row gap-lg">

        {/* Left column (65%) */}
        <div className="lg:w-[65%] space-y-lg">

          {/* New admission alert banner — scoped to left column */}
          {newAdmission && (
            <div className="bg-[#DEEBFF] p-md rounded-lg flex items-start gap-md border border-primary/10">
              <span className="material-symbols-outlined text-clinical-blue shrink-0">info</span>
              <div className="flex-1">
                <p className="font-body-md text-primary m-0">
                  <span className="font-bold">New Patient Admitted from Emergency / Outpatient</span>
                  {' — '}
                  <span className="font-bold">{newAdmission.name}</span> has been assigned to{' '}
                  <span className="font-bold">{newAdmission.bed}</span> by{' '}
                  <span className="font-bold">{newAdmission.admittingDoctor}</span>.
                </p>
                <p className="text-[11px] text-[#0747A6]/80 mt-1 m-0">Diagnosis: {newAdmission.diagnosis}</p>
              </div>
              <div className="flex items-center gap-sm shrink-0">
                <Link
                  to={`/ward/patients/${newAdmission.id}/notes`}
                  className="font-label-md text-clinical-blue font-bold flex items-center hover:underline"
                >
                  View Patient{' '}
                  <span className="material-symbols-outlined text-[16px] ml-xs">arrow_forward</span>
                </Link>
                <button
                  onClick={handleDismissAdmission}
                  className="p-1.5 hover:bg-clinical-blue/10 rounded-lg transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
                  title="Dismiss Alert"
                >
                  <span className="material-symbols-outlined text-clinical-blue text-lg">close</span>
                </button>
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
            {[
              { label: 'Admitted Patients', value: stats.admitted, valueClass: 'text-on-surface' },
              { label: 'Beds Occupied', value: stats.bedsOccupied, valueClass: 'text-on-surface' },
              { label: 'Critical Cases', value: stats.critical, valueClass: 'text-error' },
              { label: 'Due for Round', value: stats.dueForRound, valueClass: 'text-on-surface' },
              { label: 'Active Visitors', value: stats.activeVisitors, valueClass: 'text-on-surface' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest border border-border-default rounded-xl p-md"
              >
                <p className="font-label-md text-label-md text-secondary uppercase mb-xs m-0">{s.label}</p>
                <p className={`font-headline-md text-headline-md m-0 ${s.valueClass}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Patients needing attention — table layout */}
          <section className="bg-surface-container-lowest border border-border-default rounded-xl overflow-hidden">
            <div className="px-md py-sm flex justify-between items-center border-b border-border-default bg-surface-container-lowest">
              <h3 className="font-headline-sm text-headline-sm text-primary m-0">Critical Patients Preview</h3>
              <Link
                to="/ward/patients"
                className="font-label-md text-clinical-blue no-underline hover:no-underline"
              >
                View All Patients →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-neutral-bg border-b border-border-default">
                  <tr>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary">Bed #</th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary">Patient Name</th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary">Status</th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary">Last Note</th>
                    <th className="px-md py-sm font-label-md text-label-md text-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {patients.map((p) => {
                    const isCritical = p.condition === 'Critical'
                    const statusBadge =
                      p.condition === 'Critical'
                        ? 'bg-error-container text-on-error-container border-error/20'
                        : p.condition === 'Monitoring'
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-success/10 text-success border-success/20'

                    return (
                      <tr
                        key={p.id}
                        className={
                          isCritical
                            ? 'bg-[#FFF4F4]'
                            : 'hover:bg-surface-container-high transition-colors'
                        }
                      >
                        <td className="px-md py-md font-body-md font-bold text-on-surface">{p.bed}</td>
                        <td className="px-md py-md font-body-md font-bold text-on-surface">{p.name}</td>
                        <td className="px-md py-md">
                          <span
                            className={`px-sm py-[2px] rounded text-label-sm font-bold border uppercase ${statusBadge}`}
                          >
                            {p.condition}
                          </span>
                        </td>
                        <td className="px-md py-md font-body-sm text-secondary">
                          {p.lastNote ?? '—'}
                        </td>
                        <td className="px-md py-md text-right">
                          <Link
                            to={`/ward/patients/${p.id}/notes`}
                            className="bg-primary text-white hover:bg-[#0040a2] hover:text-white no-underline hover:no-underline px-sm py-1 rounded text-label-sm font-bold transition-colors"
                          >
                            Record Notes →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pending inpatient orders */}
          <section className="bg-surface-container-lowest border border-border-default rounded-xl overflow-hidden">
            <div className="px-md py-sm flex justify-between items-center border-b border-border-default bg-surface-container-lowest">
              <h3 className="font-headline-sm text-headline-sm text-primary m-0">Pending Inpatient Orders</h3>
              <Link
                to="/ward/orders"
                className="font-label-md text-clinical-blue no-underline hover:no-underline"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 divide-y divide-border-default">
              {orders.map((o) => {
                const style = orderTypeStyle(o.type)
                return (
                  <div
                    key={o.id}
                    className="p-md flex items-center justify-between hover:bg-surface-container-low transition-colors"
                  >
                    <div className="flex items-center gap-md">
                      <div className={`w-1.5 h-10 ${style.strip} rounded-full shrink-0`} />
                      <div>
                        <p className="font-body-md font-bold m-0">{o.patientName}</p>
                        <p className="font-body-sm text-secondary m-0">{o.detail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-lg">
                      <span
                        className={`px-sm py-[2px] rounded text-label-sm font-bold border uppercase ${style.badge}`}
                      >
                        {o.type}
                      </span>
                      <p
                        className={`font-label-md font-bold m-0 ${
                          o.overdue ? 'text-error' : 'text-secondary'
                        }`}
                      >
                        {o.overdue ? `Overdue: ${o.dueTime}` : `Due: ${o.dueTime}`}
                      </p>
                      <button
                        onClick={() => handleToggleOrder(o.id)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center text-slate-500 transition-colors cursor-pointer border-0"
                        title="Mark as Done"
                      >
                        <span className="material-symbols-outlined text-[20px]">check</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right column (35%) */}
        <aside className="lg:w-[35%] space-y-lg">

          {/* Active visitors card */}
          <section className="bg-surface-container-lowest border border-border-default rounded-xl overflow-hidden">
            <div className="px-md py-sm flex justify-between items-center border-b border-border-default bg-surface-container-lowest">
              <div className="flex items-center gap-sm">
                <h3 className="font-headline-sm text-headline-sm m-0">Active Visitors</h3>
                <span className="bg-primary-container text-on-primary-container text-label-sm font-bold px-2 py-0.5 rounded-full">
                  {visitors.length}
                </span>
              </div>
              <Link
                to="/ward/visitors/active"
                className="font-label-md text-clinical-blue no-underline hover:no-underline"
              >
                View All →
              </Link>
            </div>
            <div className="divide-y divide-border-default">
              {visitors.map((v) => {
                const { label, isOverdue } = formatTimeLeft(v.timeLeft)
                return (
                  <div key={v.id} className="p-md">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-body-md font-bold m-0">
                        {v.patientName}
                      </p>
                      <span
                        className={`font-label-md font-bold shrink-0 ml-2 ${
                          isOverdue ? 'text-error' : v.timeLeft < 600 ? 'text-warning' : 'text-secondary'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-[16px] text-secondary">person</span>
                      <p className="font-body-sm text-secondary m-0">
                        Visitor: {v.name}
                        {v.relationship ? ` (${v.relationship})` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
              {visitors.length === 0 && (
                <div className="p-md text-center font-body-sm text-secondary">No active visitors</div>
              )}
            </div>
            <div className="p-md border-t border-border-default">
              <Link
                to="/ward/visitors"
                className="w-full flex items-center justify-center gap-1 px-4 py-2 text-sm font-semibold text-clinical-blue bg-clinical-blue/10 hover:bg-clinical-blue/20 rounded-lg transition-all duration-200 no-underline hover:no-underline"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Log New Visitor
              </Link>
            </div>
          </section>

          {/* Ward bed overview */}
          <section className="bg-surface-container-lowest border border-border-default rounded-xl p-md">
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-headline-sm text-headline-sm m-0">Ward Bed Overview</h3>
              <Link to="/ward/beds">
                <span className="material-symbols-outlined text-secondary cursor-pointer hover:text-clinical-blue transition-colors">
                  grid_view
                </span>
              </Link>
            </div>
            <div className="space-y-sm">
              {[
                { label: 'Stable', count: bedCounts.stable, dot: 'bg-success' },
                { label: 'Monitoring', count: bedCounts.monitoring, dot: 'bg-warning' },
                { label: 'Critical', count: bedCounts.critical, dot: 'bg-error' },
                { label: 'Available', count: bedCounts.available, dot: 'bg-outline-variant' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between p-sm rounded bg-surface-container-low"
                >
                  <div className="flex items-center gap-sm">
                    <div className={`w-3 h-3 rounded-full ${row.dot}`} />
                    <span className="font-body-sm">{row.label}</span>
                  </div>
                  <span className="font-body-md font-bold">{row.count}</span>
                </div>
              ))}
            </div>
            {/* Mini bed grid visualisation */}
            <div className="mt-md grid grid-cols-6 gap-xs">
              {patients.map((p) => (
                <div
                  key={p.id}
                  className={`h-2 rounded ${
                    p.condition === 'Critical'
                      ? 'bg-error'
                      : p.condition === 'Monitoring'
                      ? 'bg-warning'
                      : 'bg-success'
                  }`}
                />
              ))}
              {Array.from({ length: bedCounts.available }).map((_, i) => (
                <div key={`avail-${i}`} className="h-2 rounded bg-outline-variant" />
              ))}
            </div>
          </section>

          {/* Shift handover CTA */}
          <section className="bg-primary text-white rounded-xl p-md">
            <h4 className="font-headline-sm text-white mb-sm m-0">Shift Handover</h4>
            <p className="font-body-sm text-white/80 mb-md m-0">
              Ensure all patient notes are updated before your shift ends.
            </p>
            <Link
              to="/ward/handover"
              className="w-full block bg-white text-primary hover:text-primary font-bold py-2 rounded-lg hover:bg-secondary-fixed transition-colors text-center no-underline hover:no-underline"
            >
              Start Handover Process
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
