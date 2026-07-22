import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { triageService } from '@/api/services/triage'
import type { TriageVisit } from '@/features/triage/types/triageAssessment'
import { buildAssessNavigateState } from '@/features/triage/utils/triageAssessNav'
import { toast } from 'sonner'

interface RecentlyAssessedItem {
  name: string
  assessedAgo: string
  category: string
  dotColor: string
  badgeClass: string
}

interface DistributionItem {
  label: string
  labelColor: string
  count: number
  percent: number
  barColor: string
}

function StatCard({
  label,
  value,
  valueClassName = 'text-on-surface',
  icon,
  iconClassName = 'text-outline',
  iconFilled = false,
}: {
  label: string
  value: string
  valueClassName?: string
  icon: string
  iconClassName?: string
  iconFilled?: boolean
}) {
  return (
    <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex flex-col justify-between shadow-sm">
      <span className="font-label-md text-outline uppercase tracking-wider text-[11px] font-bold">
        {label}
      </span>
      <div className="flex items-end justify-between mt-sm">
        <span className={`font-headline-lg text-[24px] font-semibold ${valueClassName}`}>{value}</span>
        <span
          className={`material-symbols-outlined ${iconClassName}`}
          style={iconFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
      </div>
    </div>
  )
}

export function TriageDashboardContent() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<TriageVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [avgAssessment, setAvgAssessment] = useState('--')
  const [now, setNow] = useState(() => Date.now())

  // Keep now updated every 60 seconds for live ticking wait times
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  const fetchQueueData = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const data = await triageService.getQueue('waiting,in_progress,completed,skipped')
      
      // Compute average assessment time from raw items
      const completedItems = data.queue.filter(
        (item) => item.status === 'completed' && item.called_at && item.completed_at
      )
      if (completedItems.length > 0) {
        const totalDuration = completedItems.reduce((acc, item) => {
          const start = new Date(item.called_at!).getTime()
          const end = new Date(item.completed_at!).getTime()
          const diff = Math.max(0, Math.floor((end - start) / 60000))
          return acc + diff
        }, 0)
        setAvgAssessment(`${Math.round(totalDuration / completedItems.length)} min`)
      } else {
        setAvgAssessment('--')
      }

      // Map queue items to TriageVisit shape
      const mapped = data.queue.map((item): TriageVisit => {
        const initials = item.patient.full_name
          .split(' ')
          .filter(Boolean)
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          
        let age = 0
        if (item.patient.date_of_birth) {
          const birthDate = new Date(item.patient.date_of_birth)
          const today = new Date()
          age = today.getFullYear() - birthDate.getFullYear()
          const m = today.getMonth() - birthDate.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }
        }
        
        let arrival = ''
        const arrivalDate = new Date(item.created_at)
        if (!isNaN(arrivalDate.getTime())) {
          const dateStr = arrivalDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
          const timeFormatted = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          arrival = `${dateStr}, ${timeFormatted}`
        }

        const completedDate = item.completed_at ? new Date(item.completed_at) : null
        let diffMins = 0
        if (!isNaN(arrivalDate.getTime())) {
          const isDone = item.status === 'completed' || item.status === 'skipped'
          if (isDone && completedDate && !isNaN(completedDate.getTime())) {
            diffMins = Math.floor((completedDate.getTime() - arrivalDate.getTime()) / 60000)
          } else {
            diffMins = Math.floor((Date.now() - arrivalDate.getTime()) / 60000)
          }
        }
        diffMins = Math.max(0, diffMins)
        const waitTime = `${diffMins}m`
        
        let waitColor = 'text-success'
        if (item.priority === 'emergency') {
          waitColor = 'text-error'
        } else if (diffMins > 30) {
          waitColor = 'text-warning'
        }
        
        return {
          queueId: item.queue_id,
          status: item.status,
          visitId: item.visit.visit_id,
          patientId: item.patient.patient_id,
          queueNumber: item.queue_number,
          name: item.patient.full_name,
          initials,
          patientNumber: item.patient.patient_number,
          gender: item.patient.gender,
          age,
          arrival,
          created_at: item.created_at,
          completed_at: item.completed_at ?? null,
          waitTime,
          waitColor,
          waitWarningIcon: diffMins > 30,
          payment: item.visit.payment_type,
          source: item.visit.visit_type,
          priority: item.priority,
          isEmergency: item.priority === 'emergency'
        }
      })
      setPatients(mapped)
    } catch (err) {
      console.error('Failed to fetch triage queue data for dashboard:', err)
      toast.error('Failed to load live dashboard statistics.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch initial data and poll every 15 seconds
  useEffect(() => {
    void fetchQueueData(true)
    const interval = setInterval(() => void fetchQueueData(), 15000)
    return () => clearInterval(interval)
  }, [])

  // KPI calculations
  const awaitingCount = useMemo(() => {
    return patients.filter((p) => p.status === 'waiting' || p.status === 'in_progress').length
  }, [patients])

  const assessedCount = useMemo(() => {
    return patients.filter((p) => p.status === 'completed').length
  }, [patients])

  const criticalCount = useMemo(() => {
    return patients.filter(
      (p) => (p.status === 'waiting' || p.status === 'in_progress') && p.priority === 'emergency'
    ).length
  }, [patients])

  const activePatients = useMemo(() => {
    return patients.filter((p) => p.status === 'waiting' || p.status === 'in_progress')
  }, [patients])

  // Completed items feed
  const recentlyAssessed = useMemo(() => {
    const completed = patients
      .filter((p) => p.status === 'completed')
      .sort((a, b) => {
        const tA = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const tB = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return tB - tA
      })

    return completed.slice(0, 4).map((p): RecentlyAssessedItem => {
      let assessedAgo = ''
      if (p.completed_at) {
        const diffMs = now - new Date(p.completed_at).getTime()
        const diffMins = Math.max(0, Math.floor(diffMs / 60000))
        if (diffMins < 1) {
          assessedAgo = 'just now'
        } else if (diffMins < 60) {
          assessedAgo = `${diffMins}m ago`
        } else {
          const diffHours = Math.floor(diffMins / 60)
          if (diffHours < 24) {
            assessedAgo = `${diffHours}h ago`
          } else {
            assessedAgo = `${Math.floor(diffHours / 24)}d ago`
          }
        }
      } else {
        assessedAgo = '--'
      }

      let category = 'Routine'
      let dotColor = 'bg-success'
      let badgeClass = 'bg-success/10 text-success'

      if (p.priority === 'emergency') {
        category = 'Emergency'
        dotColor = 'bg-error'
        badgeClass = 'bg-error/10 text-error'
      } else if (p.priority === 'urgent') {
        category = 'Urgent'
        dotColor = 'bg-warning'
        badgeClass = 'bg-warning/10 text-warning'
      } else if (p.priority === 'semi_urgent') {
        category = 'Semi-Urgent'
        dotColor = 'bg-[#00B8D9]'
        badgeClass = 'bg-[#00B8D9]/10 text-[#00B8D9]'
      } else if (p.priority === 'non_urgent') {
        category = 'Non-Urgent'
        dotColor = 'bg-success'
        badgeClass = 'bg-success/10 text-success'
      }

      return {
        name: p.name,
        assessedAgo,
        category,
        dotColor,
        badgeClass,
      }
    })
  }, [patients, now])

  // Priority distribution chart calculations
  const triageDistribution = useMemo((): DistributionItem[] => {
    const completed = patients.filter((p) => p.status === 'completed')
    const total = completed.length

    const emergency = completed.filter((p) => p.priority === 'emergency').length
    const urgent = completed.filter((p) => p.priority === 'urgent').length
    const semiUrgent = completed.filter((p) => p.priority === 'semi_urgent').length
    const nonUrgent = completed.filter((p) => p.priority === 'non_urgent').length

    return [
      {
        label: 'Emergency (Category 1)',
        labelColor: 'text-error',
        count: emergency,
        percent: total > 0 ? Math.round((emergency / total) * 100) : 0,
        barColor: 'bg-error',
      },
      {
        label: 'Urgent (Category 2)',
        labelColor: 'text-warning',
        count: urgent,
        percent: total > 0 ? Math.round((urgent / total) * 100) : 0,
        barColor: 'bg-warning',
      },
      {
        label: 'Semi-Urgent (Category 3)',
        labelColor: 'text-[#00B8D9]',
        count: semiUrgent,
        percent: total > 0 ? Math.round((semiUrgent / total) * 100) : 0,
        barColor: 'bg-[#00B8D9]',
      },
      {
        label: 'Non-Urgent (Category 4)',
        labelColor: 'text-success',
        count: nonUrgent,
        percent: total > 0 ? Math.round((nonUrgent / total) * 100) : 0,
        barColor: 'bg-success',
      },
    ]
  }, [patients])

  return (
    <div className="max-w-container-max mx-auto p-md space-y-lg">
      <div className="grid grid-cols-12 gap-lg">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-lg">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            <StatCard 
              label="Awaiting Triage" 
              value={loading ? '...' : String(awaitingCount)} 
              icon="hourglass_empty" 
            />
            <StatCard
              label="Assessed Today"
              value={loading ? '...' : String(assessedCount)}
              icon="trending_up"
              iconClassName="text-success"
            />
            <StatCard
              label="Critical"
              value={loading ? '...' : String(criticalCount)}
              valueClassName="text-error"
              icon="emergency_home"
              iconClassName="text-error"
              iconFilled
            />
            <StatCard 
              label="Avg Assessment" 
              value={loading ? '...' : avgAssessment} 
              icon="timer" 
            />
          </div>

          {/* Awaiting Triage Worklist */}
          <section className="bg-surface-white border border-border-subtle rounded-xl shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-lg py-md border-b border-border-subtle">
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Awaiting Triage</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-subtle">
                    <th className="px-lg py-sm font-label-md text-label-md text-secondary">Pos</th>
                    <th className="px-lg py-sm font-label-md text-label-md text-secondary">Patient Name</th>
                    <th className="px-lg py-sm font-label-md text-label-md text-secondary">Patient #</th>
                    <th className="px-lg py-sm font-label-md text-label-md text-secondary">Arrival</th>
                    <th className="px-lg py-sm font-label-md text-label-md text-secondary">Wait Time</th>
                    <th className="px-lg py-sm font-label-md text-label-md text-secondary">Payment</th>
                    <th className="px-lg py-sm font-label-md text-label-md text-secondary text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-body-sm text-body-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-lg py-md text-center">
                        <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                      </td>
                    </tr>
                  ) : activePatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-lg py-md text-center text-secondary">
                        No patients currently awaiting triage
                      </td>
                    </tr>
                  ) : (
                    activePatients.map((row) => (
                      <tr
                        key={row.visitId}
                        className={`hover:bg-hover-tint transition-colors cursor-pointer group ${
                          row.isEmergency ? 'bg-[#FFF4F4]' : ''
                        }`}
                        onClick={() =>
                          navigate(`/triage/assess/${row.visitId}`, {
                            state: buildAssessNavigateState(row.visitId, 'dashboard'),
                          })
                        }
                      >
                        <td className="px-lg py-md">{row.queueNumber}</td>
                        <td className="px-lg py-md font-semibold">{row.name}</td>
                        <td className="px-lg py-md">{row.patientNumber}</td>
                        <td className="px-lg py-md">{row.arrival}</td>
                        <td className="px-lg py-md">
                          {(() => {
                            const arrDate = new Date(row.created_at)
                            const mins = Math.max(0, Math.floor((now - arrDate.getTime()) / 60000))
                            const liveColor = row.priority === 'emergency'
                              ? 'text-error'
                              : mins > 30 ? 'text-warning' : 'text-success'
                            return (
                              <span className={`font-body-sm text-body-sm font-semibold flex items-center gap-xs ${liveColor}`}>
                                {mins > 30 && (
                                  <span className="material-symbols-outlined text-[16px]">warning</span>
                                )}
                                {mins}m
                              </span>
                            )
                          })()}
                        </td>
                        <td className="px-lg py-md">
                          {row.payment ? row.payment.charAt(0).toUpperCase() + row.payment.slice(1) : 'Cash'}
                        </td>
                        <td className="px-lg py-md text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/triage/assess/${row.visitId}`, {
                                state: buildAssessNavigateState(row.visitId, 'dashboard'),
                              })
                            }}
                            className="bg-primary-container text-white px-md h-8 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all border-0 cursor-pointer"
                          >
                            Assess
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-md text-center bg-surface-container-lowest">
              <button
                type="button"
                onClick={() => navigate('/triage/queue')}
                className="text-primary font-label-md text-label-md hover:underline bg-transparent border-0 cursor-pointer"
              >
                View All Patients in Queue
              </button>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-lg">
          {/* Recently Assessed feed */}
          <section className="bg-surface-white border border-border-subtle rounded-xl shadow-sm">
            <div className="px-lg py-md border-b border-border-subtle">
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Recently Assessed</h3>
            </div>
            <div className="p-lg space-y-md">
              {loading ? (
                <div className="text-center py-md text-secondary">Loading...</div>
              ) : recentlyAssessed.length === 0 ? (
                <div className="text-center py-md text-secondary">No assessments completed today</div>
              ) : (
                recentlyAssessed.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-md">
                    <div className="flex items-center min-w-0">
                      <div className={`w-2 h-2 rounded-full ${item.dotColor} mr-md shrink-0`} />
                      <div className="min-w-0">
                        <p className="font-body-md text-body-md font-semibold m-0 truncate">{item.name}</p>
                        <p className="font-body-sm text-body-sm text-outline m-0">
                          Assessed {item.assessedAgo}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`${item.badgeClass} text-[11px] font-bold px-sm py-[2px] rounded uppercase shrink-0`}
                    >
                      {item.category}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="p-md text-center bg-surface-container-lowest border-t border-border-subtle">
              <button
                type="button"
                onClick={() => navigate('/triage/history')}
                className="text-primary font-label-md text-label-md hover:underline bg-transparent border-0 cursor-pointer"
              >
                View History
              </button>
            </div>
          </section>

          {/* Today's Triage Distribution */}
          <section className="bg-surface-white border border-border-subtle rounded-xl shadow-sm p-lg">
            <div className="mb-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">
                Today&apos;s Triage Distribution
              </h3>
              <div className="h-px bg-border-subtle mt-md" />
            </div>
            <div className="space-y-lg">
              {triageDistribution.map((item) => (
                <div key={item.label} className="space-y-xs">
                  <div className="flex justify-between font-label-md text-label-md">
                    <span className={`${item.labelColor} font-bold uppercase tracking-wider`}>
                      {item.label}
                    </span>
                    <span className="text-on-surface">
                      {item.count} ({item.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`${item.barColor} h-full`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
