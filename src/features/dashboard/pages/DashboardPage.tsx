import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useApp } from '@/features/admin/context/AppContext'
import { StatCard } from '../components/StatCard'
import { DepartmentCard } from '../components/DepartmentCard'
import { AlertFeedItem } from '../components/AlertFeedItem'
import { TriageDashboardContent } from '@/features/triage/components/TriageDashboardContent'
import { DoctorDashboardContent } from '@/features/consultation/components/DoctorDashboardContent'
import { LabDashboardContent } from '@/features/laboratory/components/LabDashboardContent'
import { PharmacyDashboardContent } from '@/features/pharmacy/components/PharmacyDashboardContent'
import { RadiologyDashboardContent } from '@/features/radiology/components/RadiologyDashboardContent'
import { ROLES, hasEffectiveRole } from '@/lib/roles'
import { useNavigate } from 'react-router-dom'
import { receptionService } from '@/api/services/reception'
import type { BackendPatient } from '@/api/types/reception'

interface ReceptionQueuePreviewItem {
  pos: number
  name: string
  patientNumber: string
  registeredAt: string
  wait: string
  waitColor: string
  payment: string
  paymentBadgeClass: string
  status: string
  statusBadgeClass: string
  patientId: string
  queueId: string
}

function ReceptionQueueViewModal({
  item,
  onClose,
  onManageQueue,
}: {
  item: ReceptionQueuePreviewItem
  onClose: () => void
  onManageQueue: () => void
}) {
  const [patient, setPatient] = useState<BackendPatient | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadPatient = async () => {
      setLoading(true)
      try {
        const data = await receptionService.getPatient(item.patientId)
        setPatient(data)
      } catch (err) {
        console.error('Failed to load patient details on dashboard preview modal', err)
      } finally {
        setLoading(false)
      }
    }
    void loadPatient()
  }, [item.patientId])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-lg w-full max-w-[500px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-queue-view-title"
      >
        <div className="p-lg border-b border-border-subtle flex justify-between items-center bg-surface-bright">
          <h2
            id="dashboard-queue-view-title"
            className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0"
          >
            Queue &amp; Patient Record
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
        <div className="p-lg max-h-[70vh] overflow-y-auto space-y-md">
          {/* Queue entry details */}
          <div>
            <h3 className="font-title-sm text-title-sm font-semibold text-primary m-0 mb-sm">Queue Details</h3>
            <div className="grid grid-cols-2 gap-sm bg-surface-container-low p-md rounded-lg border border-border-subtle">
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Position</p>
                <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">#{item.pos}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Status</p>
                <span className={`inline-flex items-center px-sm py-xs rounded-full font-label-md text-label-md font-bold ${item.statusBadgeClass}`}>{item.status}</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Patient Name</p>
                <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{item.name}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Patient #</p>
                <p className="font-body-sm text-body-sm text-on-surface m-0">{item.patientNumber}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Registered At</p>
                <p className="font-body-sm text-body-sm text-on-surface m-0">{item.registeredAt}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Wait Time</p>
                <p className={`font-body-sm text-body-sm font-semibold m-0 ${item.waitColor}`}>{item.wait}</p>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Payment Type</p>
                <p className="font-body-sm text-body-sm text-on-surface m-0">{item.payment}</p>
              </div>
            </div>
          </div>

          {/* Patient demographic details */}
          <div>
            <h3 className="font-title-sm text-title-sm font-semibold text-primary m-0 mb-sm">Patient Demographics</h3>
            {loading ? (
              <div className="p-lg bg-surface-bright border border-border-subtle rounded-lg flex items-center justify-center min-h-[140px]">
                <span className="material-symbols-outlined text-[32px] text-primary animate-spin">progress_activity</span>
              </div>
            ) : patient ? (
              <div className="grid grid-cols-2 gap-sm bg-surface-bright border border-border-subtle p-md rounded-lg">
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Identification No</p>
                  <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.national_id ?? '—'}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Phone Number</p>
                  <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.phone_primary ?? '—'}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Gender</p>
                  <p className="font-body-sm text-body-sm text-on-surface m-0" style={{ textTransform: 'capitalize' }}>{patient.gender}</p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Date of Birth</p>
                  <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.date_of_birth}</p>
                </div>
                {patient.email && (
                  <div className="col-span-2">
                    <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Email</p>
                    <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.email}</p>
                  </div>
                )}
                {patient.next_of_kin_name && (
                  <>
                    <div className="mt-xs pt-xs border-t border-border-subtle/50">
                      <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Next of Kin</p>
                      <p className="font-body-sm text-body-sm text-on-surface m-0 font-medium">
                        {patient.next_of_kin_name} ({patient.next_of_kin_relationship ?? '—'})
                      </p>
                    </div>
                    <div className="mt-xs pt-xs border-t border-border-subtle/50">
                      <p className="font-label-sm text-label-sm text-secondary uppercase m-0 mb-xs">Kin Contact</p>
                      <p className="font-body-sm text-body-sm text-on-surface m-0 font-medium">
                        {patient.next_of_kin_phone ?? '—'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-md text-center font-body-sm text-secondary bg-surface-bright border border-border-subtle rounded-lg">
                Patient record details unavailable.
              </div>
            )}
          </div>
        </div>
        <div className="p-lg border-t border-border-subtle bg-surface-bright flex justify-end gap-sm">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-md border border-border-subtle rounded font-body-sm text-body-sm font-medium text-secondary bg-white hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onManageQueue}
            className="h-8 px-md rounded font-body-sm text-body-sm font-medium text-white bg-primary-container hover:bg-primary transition-colors border-0 cursor-pointer"
          >
            Manage in Queue
          </button>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, tenantId, roles } = useAuth()
  const { stats, alerts, departments, sessions, setActiveView } = useApp()
  const navigate = useNavigate()
  const [queueViewItem, setQueueViewItem] = useState<ReceptionQueuePreviewItem | null>(null)

  // Live state definitions
  const [loading, setLoading] = useState(true)
  const [queueItems, setQueueItems] = useState<ReceptionQueuePreviewItem[]>([])
  const [recentPatients, setRecentPatients] = useState<BackendPatient[]>([])

  const [patientsToday, setPatientsToday] = useState(0)
  const [inQueueCount, setInQueueCount] = useState(0)
  const [registeredThisHour, setRegisteredThisHour] = useState(0)
  const [avgWaitTime, setAvgWaitTime] = useState(0)

  const isHospitalAdmin = hasEffectiveRole(roles, user?.role, ROLES.hospitalAdmin)
  const isReceptionist = hasEffectiveRole(roles, user?.role, ROLES.receptionist)
  const isTriageNurse = hasEffectiveRole(roles, user?.role, ROLES.triageNurse) && !isHospitalAdmin
  const isDoctor = hasEffectiveRole(roles, user?.role, ROLES.doctor) && !isHospitalAdmin
  const isLabTechnician = hasEffectiveRole(roles, user?.role, ROLES.labTechnician) && !isHospitalAdmin
  const isPharmacist = hasEffectiveRole(roles, user?.role, ROLES.pharmacist) && !isHospitalAdmin
  const isRadiographer = hasEffectiveRole(roles, user?.role, ROLES.radiographer) && !isHospitalAdmin

  const loadDashboardData = async () => {
    try {
      // 1. Fetch today's queue list (total visits enqueued today)
      const todayQueue = await receptionService.getTriageQueueToday()
      setPatientsToday(todayQueue.length)

      // Calculate Registered This Hour
      const oneHourAgo = Date.now() - 3600000
      const hourCount = todayQueue.filter(
        (entry) => new Date(entry.created_at).getTime() >= oneHourAgo
      ).length
      setRegisteredThisHour(hourCount)

      // 2. Fetch current active worklist queue
      const currentQueue = await receptionService.getTriageQueue()
      const activeEntries = currentQueue.filter(
        (entry) => entry.status === 'waiting' || entry.status === 'in_progress'
      )
      setInQueueCount(activeEntries.length)

      // Calculate Average Wait Time of current active entries
      const waitMinutes = (createdAt: string) => {
        return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
      }
      if (activeEntries.length > 0) {
        const totalWait = activeEntries.reduce((acc, entry) => {
          const w = waitMinutes(entry.created_at)
          return acc + (w > 0 ? w : 0)
        }, 0)
        setAvgWaitTime(Math.round(totalWait / activeEntries.length))
      } else {
        setAvgWaitTime(0)
      }

      // Map top 5 active entries to table previews
      const previewItems = activeEntries.slice(0, 5).map((entry, index) => {
        const mins = waitMinutes(entry.created_at)
        return {
          pos: index + 1,
          name: entry.patient.full_name,
          patientNumber: entry.patient.patient_number,
          registeredAt: new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          wait: mins <= 0 ? '--' : `${mins} min`,
          waitColor: mins > 30 ? 'text-error' : mins > 15 ? 'text-warning' : 'text-success',
          payment: entry.visit?.payment_type
            ? entry.visit.payment_type.charAt(0).toUpperCase() + entry.visit.payment_type.slice(1)
            : 'Cash',
          paymentBadgeClass: entry.visit?.payment_type === 'insurance' 
            ? 'bg-primary-fixed text-primary' 
            : 'bg-success/10 text-success',
          status: entry.status === 'in_progress' ? 'In Triage' : 'Waiting',
          statusBadgeClass: entry.status === 'in_progress'
            ? 'bg-tertiary-fixed-dim/20 text-tertiary-container'
            : 'bg-warning/10 text-[#B37700]',
          patientId: entry.patient.patient_id,
          queueId: entry.queue_id,
        }
      })
      setQueueItems(previewItems)

      // 3. Fetch 5 most recent registrations
      const patientResponse = await receptionService.searchPatients('', 1, 5)
      setRecentPatients(patientResponse.patients)

    } catch (err) {
      console.error('Failed to load receptionist dashboard data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isReceptionist) {
      void loadDashboardData()
      const interval = setInterval(() => void loadDashboardData(), 30000)
      return () => clearInterval(interval)
    }
  }, [isReceptionist])

  if (isRadiographer) {
    return <RadiologyDashboardContent />
  }

  if (isLabTechnician) {
    return <LabDashboardContent />
  }

  if (isPharmacist) {
    return <PharmacyDashboardContent />
  }

  if (isDoctor) {
    return <DoctorDashboardContent />
  }

  if (isTriageNurse) {
    return <TriageDashboardContent />
  }

  if (isReceptionist) {
    return (
      <div className="max-w-container-max mx-auto h-full flex flex-col gap-lg xl:gap-xl">
        <div className="lg:grid lg:grid-cols-12 gap-lg h-full">
          {/* Left Column (65%) */}
          <div className="lg:col-span-8 flex flex-col gap-lg h-full">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full shrink-0">
              <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-secondary font-label-md uppercase tracking-wider text-[11px]">Patients Today</p>
                    <h3 className="font-headline-md text-primary font-bold text-2xl">{loading ? '...' : patientsToday}</h3>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center text-secondary bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">person_play</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-success text-[12px]">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span className="font-label-sm">Total checked in today</span>
                </div>
              </div>

              <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-secondary font-label-md uppercase tracking-wider text-[11px]">In Queue</p>
                    <h3 className="font-headline-md text-primary font-bold text-2xl">{loading ? '...' : inQueueCount}</h3>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center text-secondary bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-secondary text-[12px]">
                  <span className="material-symbols-outlined text-[14px]">horizontal_rule</span>
                  <span className="font-label-sm">Active waiting patients</span>
                </div>
              </div>

              <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-secondary font-label-md uppercase tracking-wider text-[11px]">Registered This Hour</p>
                    <h3 className="font-headline-md text-primary font-bold text-2xl">{loading ? '...' : registeredThisHour}</h3>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center text-secondary bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-warning text-[12px]">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span className="font-label-sm">Added in last 60m</span>
                </div>
              </div>

              <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <p className="text-secondary font-label-md uppercase tracking-wider text-[11px]">Avg Wait Time</p>
                    <h3 className="font-headline-md text-primary font-bold text-2xl">
                      {loading ? '...' : avgWaitTime > 0 ? `${avgWaitTime}m` : '--'}
                    </h3>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center text-secondary bg-surface-container-low rounded-lg">
                    <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-error text-[12px]">
                  <span className="material-symbols-outlined text-[14px]">priority_high</span>
                  <span className="font-label-sm">Triage wait duration</span>
                </div>
              </div>
            </div>

            {/* Current Queue Table Card */}
            <div className="bg-surface-white rounded-lg border border-border-subtle flex flex-col flex-1 min-h-[400px] shadow-sm">
              <div className="p-md border-b border-border-subtle flex justify-between items-center shrink-0">
                <h3 className="font-headline-sm text-on-surface font-semibold">Current Queue</h3>
                <button 
                  onClick={() => navigate('/reception/queue')} 
                  className="font-body-sm text-primary-container font-medium hover:underline bg-transparent border-0 cursor-pointer"
                >
                  Manage Queue
                </button>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="font-label-md text-label-md text-secondary border-b border-border-subtle bg-surface-bright text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Pos</th>
                      <th className="py-3 px-4 font-semibold">Patient Name</th>
                      <th className="py-3 px-4 font-semibold">Patient #</th>
                      <th className="py-3 px-4 font-semibold">Wait Time</th>
                      <th className="py-3 px-4 font-semibold">Payment</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-body-sm text-body-sm text-on-surface">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-md text-center">
                          <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                        </td>
                      </tr>
                    ) : queueItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-md text-center text-secondary">
                          No patients currently in queue
                        </td>
                      </tr>
                    ) : (
                      queueItems.map((item) => (
                        <tr
                          key={item.queueId}
                          className="border-b border-border-subtle hover:bg-hover-tint transition-colors cursor-pointer"
                          onClick={() => setQueueViewItem(item)}
                        >
                          <td className="py-3 px-4 font-medium text-secondary">{item.pos}</td>
                          <td className="py-3 px-4 font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-outline">{item.patientNumber}</td>
                          <td className={`py-3 px-4 font-medium ${item.waitColor}`}>{item.wait}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${item.paymentBadgeClass}`}
                            >
                              {item.payment}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${item.statusBadgeClass}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              title="View detail"
                              aria-label={`View details for ${item.name}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setQueueViewItem(item)
                              }}
                              className="text-primary-container bg-transparent border-0 cursor-pointer p-1 inline-flex items-center justify-center rounded hover:bg-surface-container-low transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-border-subtle text-center shrink-0 bg-surface-bright rounded-b-lg">
                <button 
                  onClick={() => navigate('/reception/queue')} 
                  className="font-body-sm text-secondary font-medium hover:text-primary-container transition-colors bg-transparent border-0 cursor-pointer text-xs"
                >
                  View All Patients in Queue
                </button>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap gap-4 shrink-0">
              <button 
                onClick={() => navigate('/reception/register')} 
                className="bg-primary-container hover:bg-[#0040A2] text-on-primary font-body-sm text-sm font-semibold h-10 px-6 rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-0"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Register New Patient
              </button>
              <button 
                onClick={() => navigate('/reception/search')} 
                className="border border-primary-container text-primary-container hover:bg-hover-tint bg-white font-body-sm text-sm font-semibold h-10 px-6 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">manage_search</span>
                Returning Patient
              </button>
              <button 
                onClick={() => navigate('/reception/queue')} 
                className="bg-error hover:bg-[#D94524] text-on-error font-body-sm text-sm font-semibold h-10 px-6 rounded-lg transition-colors flex items-center gap-2 md:ml-auto cursor-pointer border-0"
              >
                <span className="material-symbols-outlined text-[18px]">emergency</span>
                Walk-in Emergency
              </button>
            </div>
          </div>

          {/* Right Column (35%) */}
          <div className="lg:col-span-4 flex flex-col gap-lg h-full">
            {/* System Alerts Card */}
            <div className="bg-[#FFFDF5] rounded-lg border border-[#FFE380] flex flex-col shrink-0 shadow-sm">
              <div className="p-md border-b border-[#FFE380] flex items-center gap-2">
                <span className="material-symbols-outlined text-warning">warning</span>
                <h3 className="font-headline-sm font-semibold text-on-surface text-sm">System Alerts</h3>
                <span className="ml-auto bg-warning text-white font-label-md text-[10px] px-2 py-0.5 rounded-full font-bold">2</span>
              </div>
              <div className="p-md space-y-3">
                <div className="flex items-start justify-between bg-white p-3 rounded border border-border-subtle">
                  <div className="overflow-hidden">
                    <p className="font-body-sm text-xs font-semibold text-on-surface truncate">Insurance Verification Pending</p>
                    <p className="font-body-sm text-[11px] text-secondary">Zuwena Salum (#MH-3841)</p>
                  </div>
                  <button 
                    onClick={() => navigate('/billing')} 
                    className="font-body-sm text-[11px] text-primary-container font-medium hover:underline whitespace-nowrap ml-2 mt-0.5 bg-transparent border-0 cursor-pointer"
                  >
                    Verify Now
                  </button>
                </div>
                <div className="flex items-start justify-between bg-white p-3 rounded border border-border-subtle">
                  <div className="overflow-hidden">
                    <p className="font-body-sm text-xs font-semibold text-on-surface truncate">Insurance Verification Pending</p>
                    <p className="font-body-sm text-[11px] text-secondary">Lulu Kapinga (#MH-7712)</p>
                  </div>
                  <button 
                    onClick={() => navigate('/billing')} 
                    className="font-body-sm text-[11px] text-primary-container font-medium hover:underline whitespace-nowrap ml-2 mt-0.5 bg-transparent border-0 cursor-pointer"
                  >
                    Verify Now
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Registrations Card */}
            <div className="bg-surface-white rounded-lg border border-border-subtle flex flex-col flex-1 min-h-[280px] shadow-sm">
              <div className="p-md border-b border-border-subtle flex justify-between items-center shrink-0">
                <h3 className="font-headline-sm font-semibold text-on-surface text-sm">Recent Registrations</h3>
                <button 
                  onClick={() => navigate('/reception/queue')} 
                  className="font-body-sm text-xs text-primary-container font-medium hover:underline bg-transparent border-0 cursor-pointer"
                >
                  View All
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2 max-h-[300px]">
                {loading ? (
                  <div className="flex justify-center items-center py-lg">
                    <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                  </div>
                ) : recentPatients.length === 0 ? (
                  <div className="text-center py-lg text-secondary font-body-sm">
                    No recent registrations
                  </div>
                ) : (
                  recentPatients.map((patient) => {
                    const initials = patient.full_name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                    const regTime = new Date(patient.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    const regDate = new Date(patient.created_at).toLocaleDateString()
                    return (
                      <div
                        key={patient.id}
                        className="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer border-b border-border-subtle last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-secondary font-bold text-[11px] shrink-0 border border-border-subtle">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body-sm text-xs font-semibold text-on-surface truncate">{patient.full_name}</p>
                          <p className="font-body-sm text-[10px] text-outline truncate">{patient.patient_number} • {regDate} {regTime}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {queueViewItem && (
          <ReceptionQueueViewModal
            item={queueViewItem}
            onClose={() => setQueueViewItem(null)}
            onManageQueue={() => {
              setQueueViewItem(null)
              navigate('/reception/queue')
            }}
          />
        )}
      </div>
    )
  }

  // Retrieve dynamic hospital name based on the active tenant ID
  const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
  const currentTenant = tenants.find((t: any) => t.tenant_id === tenantId)
  const hospitalName =
    user?.hospital_name ||
    (currentTenant ? currentTenant.hospital_name : null) ||
    'Muhimbili National Hospital'

  if (isHospitalAdmin) {
    const previewSessions = sessions.slice(0, 3)

    return (
      <div className="max-w-container-max mx-auto h-full flex flex-col lg:flex-row gap-lg xl:gap-xl">
        {/* Left Column: Telemetry and Metrics */}
        <div className="w-full lg:w-[70%] flex flex-col gap-lg">
          {/* Status operational banner */}
          <div className="w-full flex items-center gap-sm p-md bg-[#e6f6ef] border border-success/20 rounded-lg">
            <span className="material-symbols-outlined text-success">check_circle</span>
            <span className="font-headline-sm text-on-surface text-[14px]">
              All Systems Operational — {hospitalName}
            </span>
          </div>

          {/* Telemetry card row grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md w-full">
            <StatCard
              title="Total Staff"
              value={stats.totalStaff}
              icon="group"
              trend="up"
            />
            <StatCard
              title="Online Now"
              value={stats.onlineNow}
              icon="history"
              trend="up"
            />
            <StatCard
              title="Departments Active"
              value={stats.departmentsActive}
              icon="domain"
              trend="flat"
            />
            <StatCard
              title="Beds Occupied"
              value={stats.bedsOccupied}
              subValue={`/${stats.totalBeds}`}
              icon="bedroom_parent"
              trend="flat"
            />
          </div>

          {/* Clinical departments operational grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md w-full">
            {departments.map((dept) => (
              <DepartmentCard
                key={dept.id}
                name={dept.name}
                staffCount={dept.staffCount}
                queueCount={dept.queueCount}
                status={dept.status}
                alerts={dept.alerts}
                occupancy={dept.occupancy}
                onViewClick={() => setActiveView('departments')}
              />
            ))}
          </div>

          {/* Live system alerts log feeds */}
          <div className="bg-surface-white border border-border-subtle rounded-lg flex flex-col">
            <div className="p-md border-b border-border-subtle">
              <h3 className="font-headline-sm text-on-surface text-base font-semibold">
                Active Alerts
              </h3>
            </div>
            <div className="flex flex-col">
              {alerts.map((alert) => (
                <AlertFeedItem
                  key={alert.id}
                  severity={alert.severity}
                  department={alert.department}
                  message={alert.message}
                  timestamp={alert.timestamp}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions and Session Telemetry */}
        <div className="w-full lg:w-[30%] flex flex-col gap-lg">
          {/* Quick configuration actions */}
          <div className="flex flex-col gap-md">
            <h3 className="font-headline-sm text-on-surface text-base font-semibold">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-sm">
              <button
                onClick={() => setActiveView('add-staff')}
                className="w-full h-10 px-md border border-border-subtle rounded text-secondary font-label-md text-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm justify-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Add New Staff
              </button>
              <button
                onClick={() => setActiveView('departments')}
                className="w-full h-10 px-md border border-border-subtle rounded text-secondary font-label-md text-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm justify-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">account_tree</span>
                Manage Departments
              </button>
              <button
                onClick={() => setActiveView('reports-operational')}
                className="w-full h-10 px-md border border-border-subtle rounded text-secondary font-label-md text-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm justify-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                Generate Report
              </button>
              <button
                onClick={() => setActiveView('backup')}
                className="w-full h-10 px-md border border-border-subtle rounded text-secondary font-label-md text-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm justify-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                Run Backup
              </button>
            </div>
          </div>

          {/* Live sessions online roster */}
          <div className="flex flex-col gap-md mt-md">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-on-surface text-base font-semibold">
                Staff Online
              </h3>
              <button
                onClick={() => setActiveView('sessions')}
                className="font-label-md text-primary text-xs font-semibold hover:underline cursor-pointer bg-transparent border-0"
              >
                View All
              </button>
            </div>
            <div className="bg-surface-white border border-border-subtle rounded-lg flex flex-col p-md gap-md">
              {previewSessions.map((session) => (
                <div key={session.id} className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline overflow-hidden shrink-0 border border-border-subtle">
                    {session.avatarUrl ? (
                      <img
                        alt={session.staffName}
                        className="w-full h-full object-cover"
                        src={session.avatarUrl}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-sm">person</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <p className="font-body-sm font-semibold text-on-surface leading-tight truncate text-xs">
                      {session.staffName}
                    </p>
                    <p className="font-label-sm text-outline leading-tight text-[10px] truncate">
                      {session.department} • {session.loginTime}
                    </p>
                  </div>
                  <span className="px-2 py-[2px] bg-row-hover text-primary font-label-sm rounded-full text-[10px] uppercase font-bold shrink-0">
                    {session.staffRole}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${user?.full_name || user?.username || 'there'}.`}
      />
      {tenantId && <p className="text-muted">Hospital ID: {tenantId}</p>}
    </>
  )
}
