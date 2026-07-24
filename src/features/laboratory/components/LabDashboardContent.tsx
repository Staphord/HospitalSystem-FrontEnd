import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { formatDoctorName } from '@/lib/localization'
import { getRowAction, getRowActionButtonClass, getRowActionLabel } from '@/features/laboratory/utils/labRequestActions'
import { getLabRequestById } from '@/features/laboratory/utils/labRequestStore'
import { InvestigationPriorityBadge } from '@/features/laboratory/components/InvestigationPriorityBadge'
import { CollectSpecimenModal } from '@/features/laboratory/components/CollectSpecimenModal'
import {
  laboratoryService,
  type BackendTurnaroundMetric,
  type BackendStatRequestItem,
  type BackendCriticalValueItem,
  type BackendCompletedTestItem,
} from '@/api/services/laboratory'

function StatCards({ stats }: { stats: { pendingTests: number; inProgress: number; completedToday: number; criticalValues: number } }) {
  const { pendingTests, inProgress, completedToday, criticalValues } = stats

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col justify-between h-24 shadow-sm hover:border-outline transition-all">
        <span className="font-label-md text-label-md text-secondary flex items-center justify-between">
          Pending Tests
          <span className="material-symbols-outlined text-[20px] text-warning">hourglass_empty</span>
        </span>
        <span className="font-headline-lg text-headline-lg text-on-surface font-bold">{pendingTests}</span>
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col justify-between h-24 shadow-sm hover:border-outline transition-all">
        <span className="font-label-md text-label-md text-secondary flex items-center justify-between">
          In Progress
          <span className="material-symbols-outlined text-[20px] text-primary">sync</span>
        </span>
        <span className="font-headline-lg text-headline-lg text-on-surface font-bold">{inProgress}</span>
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col justify-between h-24 shadow-sm hover:border-outline transition-all">
        <span className="font-label-md text-label-md text-secondary flex items-center justify-between">
          Completed Today
          <span className="material-symbols-outlined text-[20px] text-success">check_circle</span>
        </span>
        <span className="font-headline-lg text-headline-lg text-success font-bold">{completedToday}</span>
      </div>
      <div className="bg-error/10 border border-error/30 rounded-xl p-md flex flex-col justify-between h-24 shadow-sm hover:border-error transition-all">
        <span className="font-label-md text-label-md text-error flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            Critical Values
          </span>
          <span className="material-symbols-outlined text-[20px] text-error">priority_high</span>
        </span>
        <span className="font-headline-lg text-headline-lg text-error font-bold">{criticalValues}</span>
      </div>
    </div>
  )
}

function getDashboardItemActionDetails(status: string = 'pending') {
  const norm = status.toLowerCase()
  if (norm === 'pending') {
    return {
      label: 'Collect Specimen',
      btnClass: 'bg-primary text-on-primary hover:bg-primary-hover border-0',
      action: 'collect_specimen',
      statusPill: 'bg-warning/10 text-warning border border-warning/30',
      statusText: 'pending',
    }
  }
  if (norm === 'specimen_collected' || norm === 'in_progress' || norm === 'processing' || norm === 'received') {
    return {
      label: 'Enter Results',
      btnClass: 'bg-secondary-container text-on-secondary-container hover:bg-surface-container-high border border-border-subtle',
      action: 'enter_results',
      statusPill: 'bg-primary/10 text-primary border border-primary/30',
      statusText: norm.replace('_', ' '),
    }
  }
  return {
    label: 'View Results',
    btnClass: 'bg-surface-container text-on-surface hover:bg-surface-container-high border border-border-subtle',
    action: 'view_results',
    statusPill: 'bg-success/10 text-success border border-success/30',
    statusText: 'completed',
  }
}

function RecentRequestsOverviewCard({
  requests,
  onViewAll,
  onProcess,
}: {
  requests: BackendStatRequestItem[]
  onViewAll: () => void
  onProcess: (id: string) => void
}) {
  return (
    <div className="bg-surface-white border border-border-subtle rounded-2xl overflow-hidden flex flex-col shadow-sm">
      <div className="px-md py-sm border-b border-border-subtle flex justify-between items-center bg-surface-bright">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 m-0">
          <span className="material-symbols-outlined text-lg text-primary">history</span>
          Recent Test Requests Overview
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="font-label-sm text-label-sm text-primary hover:underline bg-transparent border-0 cursor-pointer p-0 font-medium"
        >
          View All Requests
        </button>
      </div>
      {requests.length === 0 ? (
        <div className="p-xl text-center font-body-sm text-body-sm text-outline">
          No test requests recorded yet. Clinician orders will appear here automatically.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {requests.slice(0, 5).map((item) => {
            const rawItem = item as any
            const patientName = item.patientName || rawItem.patient_name || 'Patient'
            const testName = item.testName || rawItem.test_name || 'Lab Test'
            const requestedBy = item.requestedBy || rawItem.requested_by || '—'
            const requestedAgo = item.requestedAgo || rawItem.requested_ago || 'Recently'
            const priority = item.priority || rawItem.urgency || 'routine'
            const status = item.status || rawItem.status || 'pending'

            const actionDetails = getDashboardItemActionDetails(status)

            return (
              <div
                key={item.id}
                onClick={() => onProcess(item.id)}
                className="p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md hover:bg-surface-container-low transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-md">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors font-semibold">
                        {patientName}
                      </span>
                      <InvestigationPriorityBadge priority={priority as any} />
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-label-sm capitalize ${actionDetails.statusPill}`}>
                        {actionDetails.statusText}
                      </span>
                    </div>
                    <span className="font-body-sm text-body-sm text-secondary font-medium">{testName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-lg">
                  <div className="flex flex-col sm:items-end">
                    <span className="font-body-sm text-body-sm text-secondary">Req by: {formatDoctorName(requestedBy)}</span>
                    <span className="font-label-sm text-label-sm text-secondary mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {requestedAgo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onProcess(item.id)
                    }}
                    className={`h-8 font-label-md text-label-md px-3 rounded transition-colors whitespace-nowrap cursor-pointer ${actionDetails.btnClass}`}
                  >
                    {actionDetails.label}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CriticalValuesCard({
  criticalList,
  onNotify,
}: {
  criticalList: BackendCriticalValueItem[]
  onNotify: (id: string, name: string, test: string) => void
}) {
  return (
    <div className="bg-surface-white border border-border-subtle border-l-[3px] border-l-error rounded-2xl overflow-hidden flex flex-col shadow-sm">
      <div className="px-md py-sm border-b border-border-subtle bg-error/10">
        <h2 className="font-headline-sm text-headline-sm text-error m-0">
          Critical Values — Action Required
        </h2>
      </div>
      {criticalList.length === 0 ? (
        <div className="p-xl text-center font-body-sm text-body-sm text-outline">
          No unhandled critical lab values recorded today.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {criticalList.map((item) => {
            const rawItem = item as any
            const patientName = item.patientName || rawItem.patient_name || 'Patient'
            const testName = item.testName || rawItem.test_name || 'Lab Test'
            const resultVal = item.result || rawItem.result_value || '—'
            const refRange = item.refRange || rawItem.ref_range || '—'

            return (
              <div
                key={item.id}
                className="p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md"
              >
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-sm items-center">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase">Patient</span>
                    <span className="font-body-sm text-body-sm text-on-surface mt-1">{patientName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase">Test</span>
                    <span className="font-body-sm text-body-sm text-on-surface mt-1">{testName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase">Result</span>
                    <span className="font-label-md text-label-md text-error mt-1">{resultVal}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase">Ref Range</span>
                    <span className="font-body-sm text-body-sm text-secondary mt-1">{refRange}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNotify(item.id, patientName, testName)}
                  className="h-8 border border-error text-error hover:bg-error/10 font-label-md text-label-md px-4 rounded transition-colors whitespace-nowrap mt-2 sm:mt-0 bg-transparent cursor-pointer"
                >
                  Notify Doctor
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CompletedTodayCard({
  completedList,
  completedCount,
  onViewAll,
}: {
  completedList: BackendCompletedTestItem[]
  completedCount: number
  onViewAll: () => void
}) {
  return (
    <div className="bg-surface-white border border-border-subtle rounded-2xl flex flex-col shadow-sm overflow-hidden">
      <div className="px-md py-sm border-b border-border-subtle bg-surface-bright">
        <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Completed Today</h2>
      </div>
      {completedList.length === 0 ? (
        <div className="p-lg text-center font-body-sm text-body-sm text-outline">
          No lab tests completed today yet.
        </div>
      ) : (
        <ul className="divide-y divide-border-subtle m-0 p-0 list-none">
          {completedList.map((item) => {
            const rawItem = item as any
            const testName = item.testName || rawItem.test_name || 'Lab Test'
            const requestId = item.requestId || rawItem.request_id || item.id
            const completedAt = item.completedAt || rawItem.completed_at || 'Today'

            return (
              <li
                key={item.id}
                className="px-md py-sm hover:bg-surface-container-low transition-colors flex justify-between items-center"
              >
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface">{testName}</span>
                  <span className="font-body-sm text-body-sm text-secondary">
                    ID: {requestId} • {completedAt}
                  </span>
                </div>
                <span className="material-symbols-outlined text-success text-lg">check_circle</span>
              </li>
            )
          })}
        </ul>
      )}
      <div className="px-md py-sm border-t border-border-subtle bg-surface-bright text-center">
        <button
          type="button"
          onClick={onViewAll}
          className="font-label-sm text-label-sm text-primary hover:underline bg-transparent border-0 cursor-pointer p-0"
        >
          View All {completedCount} Completed
        </button>
      </div>
    </div>
  )
}

function TurnaroundTimeCard({ metrics }: { metrics: BackendTurnaroundMetric[] }) {
  return (
    <div className="bg-surface-white border border-border-subtle rounded-2xl flex flex-col shadow-sm overflow-hidden">
      <div className="px-md py-sm border-b border-border-subtle bg-surface-bright">
        <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Avg Turnaround Time</h2>
        <span className="font-label-sm text-label-sm text-secondary">Live timestamp metrics</span>
      </div>
      <div className="p-md flex flex-col gap-md">
        {metrics.map((metric) => {
          const rawMetric = metric as any
          const barPercent = metric.barPercent ?? rawMetric.bar_percent ?? 50
          const isStat = metric.isStat ?? rawMetric.is_stat ?? false

          return isStat ? (
            <div
              key={metric.department}
              className="flex flex-col gap-1 mt-2 p-sm bg-warning/10 rounded-lg border border-warning/20"
            >
              <div className="flex justify-between items-end">
                <span className="font-label-md text-label-md text-warning flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">electric_bolt</span>
                  {metric.department}
                </span>
                <span className="font-body-sm text-body-sm text-warning font-bold">{metric.minutes} mins</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-warning h-full rounded-full"
                  style={{ width: `${barPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div key={metric.department} className="flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <span className="font-label-md text-label-md text-on-surface">{metric.department}</span>
                <span className="font-body-sm text-body-sm text-secondary">{metric.minutes} mins</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className={`bg-primary h-full rounded-full ${metric.opacity ?? ''}`}
                  style={{ width: `${barPercent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LabDashboardContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    pendingTests: 0,
    inProgress: 0,
    completedToday: 0,
    criticalValues: 0,
  })
  const [highPriorityRequests, setHighPriorityRequests] = useState<BackendStatRequestItem[]>([])
  const [criticalValuesList, setCriticalValuesList] = useState<BackendCriticalValueItem[]>([])
  const [completedTodayList, setCompletedTodayList] = useState<BackendCompletedTestItem[]>([])
  const [tatMetrics, setTatMetrics] = useState<BackendTurnaroundMetric[]>([])

  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      const data = await laboratoryService.getDashboardStats()
      const raw = data as any
      setStats({
        pendingTests: data.pendingTests ?? raw.pending_tests ?? 0,
        inProgress: data.inProgress ?? raw.in_progress ?? 0,
        completedToday: data.completedToday ?? raw.completed_today ?? 0,
        criticalValues: data.criticalValues ?? raw.critical_values ?? 0,
      })
      setHighPriorityRequests(data.highPriorityRequests || raw.high_priority_requests || [])
      setCriticalValuesList(data.criticalValuesList || raw.critical_values_list || [])
      setCompletedTodayList(data.completedTodayList || raw.completed_today_list || [])
      setTatMetrics(data.turnaroundMetrics || raw.turnaround_metrics || [])
    } catch (err: any) {
      console.error('[LabDashboard] Failed to fetch stats:', err)
      toast.error(err?.response?.data?.detail || 'Failed to load dashboard metrics from server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
    const interval = setInterval(() => {
      fetchDashboardStats()
    }, 15000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const [collectingRequest, setCollectingRequest] = useState<BackendStatRequestItem | null>(null)

  const handleNotifyDoctor = (_id: string, patientName: string, testName: string) => {
    toast.success(`Physician notified for ${patientName} — ${testName}`)
  }

  const handleProcess = (id: string) => {
    const item = highPriorityRequests.find((r) => r.id === id)
    const request = getLabRequestById(id)
    const isPending = (request && getRowAction(request) === 'collect_specimen') || (item && ((item as any).status === 'pending' || (item as any).status === 'not_collected'))

    if (isPending && item) {
      setCollectingRequest(item)
      return
    }
    navigate(`/laboratory/requests/${id}`)
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-xl">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md pb-xs border-b border-border-subtle/50">
        <div>
          <h1 className="font-headline-sm text-headline-sm text-on-surface m-0 font-bold">
            Laboratory Dashboard
          </h1>
          <p className="text-body-xs text-secondary m-0">
            Real-time diagnostic workload, recent investigation orders, and turnaround metrics
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-xl">
        <div className="w-full lg:w-[65%] flex flex-col gap-xl">
          <StatCards stats={stats} />
          <RecentRequestsOverviewCard
            requests={highPriorityRequests}
            onViewAll={() => navigate('/laboratory/requests')}
            onProcess={handleProcess}
          />
          <CriticalValuesCard
            criticalList={criticalValuesList}
            onNotify={handleNotifyDoctor}
          />
        </div>

        <div className="w-full lg:w-[35%] flex flex-col gap-xl">
          <CompletedTodayCard
            completedList={completedTodayList}
            completedCount={stats.completedToday}
            onViewAll={() => navigate('/laboratory/requests?status=completed')}
          />
          <TurnaroundTimeCard metrics={tatMetrics} />
        </div>
      </div>

      {collectingRequest && (
        <CollectSpecimenModal
          requestId={collectingRequest.id}
          patientName={collectingRequest.patientName || (collectingRequest as any).patient_name || 'Patient'}
          testName={collectingRequest.testName || (collectingRequest as any).test_name || 'Lab Test'}
          onClose={() => setCollectingRequest(null)}
          onSuccess={() => {
            setCollectingRequest(null)
            fetchDashboardStats()
          }}
        />
      )}
    </div>
  )
}
