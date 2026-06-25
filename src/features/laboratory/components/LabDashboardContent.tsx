import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  COMPLETED_TODAY,
  CRITICAL_VALUES,
  LAB_DASHBOARD_STATS,
  STAT_LAB_REQUESTS,
  TURNAROUND_METRICS,
} from '@/features/laboratory/data/mockLabDashboard'
import { getRowAction, getRowActionButtonClass, getRowActionLabel } from '@/features/laboratory/utils/labRequestActions'
import { getLabRequestById } from '@/features/laboratory/utils/labRequestStore'
import { InvestigationPriorityBadge } from '@/features/laboratory/components/InvestigationPriorityBadge'

function StatCards() {
  const { pendingTests, inProgress, completedToday, criticalValues } = LAB_DASHBOARD_STATS

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col justify-between h-24">
        <span className="font-label-md text-label-md text-secondary">Pending Tests</span>
        <span className="font-headline-lg text-headline-lg text-on-surface">{pendingTests}</span>
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col justify-between h-24">
        <span className="font-label-md text-label-md text-secondary">In Progress</span>
        <span className="font-headline-lg text-headline-lg text-on-surface">{inProgress}</span>
      </div>
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col justify-between h-24">
        <span className="font-label-md text-label-md text-secondary">Completed Today</span>
        <span className="font-headline-lg text-headline-lg text-success">{completedToday}</span>
      </div>
      <div className="bg-error/10 border border-error/30 rounded-lg p-md flex flex-col justify-between h-24">
        <span className="font-label-md text-label-md text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Critical Values
        </span>
        <span className="font-headline-lg text-headline-lg text-error">{criticalValues}</span>
      </div>
    </div>
  )
}

function StatRequestsCard({ onViewAll, onProcess }: { onViewAll: () => void; onProcess: (id: string) => void }) {
  return (
    <div className="bg-surface-white border border-border-subtle rounded-2xl overflow-hidden flex flex-col">
      <div className="px-md py-sm border-b border-border-subtle flex justify-between items-center bg-surface-bright">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 m-0">
          <span className="material-symbols-outlined text-lg text-error">priority_high</span>
          High-Priority Requests
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="font-label-sm text-label-sm text-primary hover:underline bg-transparent border-0 cursor-pointer p-0"
        >
          View All Requests →
        </button>
      </div>
      <div className="flex flex-col divide-y divide-border-subtle">
        {STAT_LAB_REQUESTS.map((item) => {
          const request = getLabRequestById(item.id)
          const action = request ? getRowAction(request) : 'enter_results'
          const buttonClass = request
            ? getRowActionButtonClass(request)
            : item.priority === 'stat'
              ? 'bg-error hover:bg-error/90 text-white border-0'
              : 'bg-warning hover:bg-warning/90 text-white border-0'
          const buttonLabel = request ? getRowActionLabel(action) : 'Process'

          return (
          <div
            key={item.id}
            className="p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md hover:bg-surface-container-low transition-colors"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md text-on-surface">{item.patientName}</span>
                <InvestigationPriorityBadge priority={item.priority} />
              </div>
              <span className="font-body-sm text-body-sm text-secondary">{item.testName}</span>
            </div>
            <div className="flex flex-col sm:items-end">
              <span className="font-body-sm text-body-sm text-secondary">Req by: {item.requestedBy}</span>
              <span className="font-label-sm text-label-sm text-secondary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {item.requestedAgo}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onProcess(item.id)}
              className={`h-8 font-label-md text-label-md px-4 rounded transition-colors whitespace-nowrap mt-2 sm:mt-0 cursor-pointer ${buttonClass}`}
            >
              {buttonLabel} →
            </button>
          </div>
          )
        })}
      </div>
    </div>
  )
}

function CriticalValuesCard({ onNotify }: { onNotify: (id: string) => void }) {
  return (
    <div className="bg-surface-white border border-border-subtle border-l-[3px] border-l-error rounded-lg overflow-hidden flex flex-col">
      <div className="px-md py-sm border-b border-border-subtle bg-error/10">
        <h2 className="font-headline-sm text-headline-sm text-error m-0">
          Critical Values — Action Required
        </h2>
      </div>
      <div className="flex flex-col divide-y divide-border-subtle">
        {CRITICAL_VALUES.map((item) => (
          <div
            key={item.id}
            className="p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md"
          >
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-sm items-center">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary uppercase">Patient</span>
                <span className="font-body-sm text-body-sm text-on-surface mt-1">{item.patientName}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary uppercase">Test</span>
                <span className="font-body-sm text-body-sm text-on-surface mt-1">{item.testName}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary uppercase">Result</span>
                <span className="font-label-md text-label-md text-error mt-1">{item.result}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary uppercase">Ref Range</span>
                <span className="font-body-sm text-body-sm text-secondary mt-1">{item.refRange}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNotify(item.id)}
              className="h-8 border border-error text-error hover:bg-error/10 font-label-md text-label-md px-4 rounded transition-colors whitespace-nowrap mt-2 sm:mt-0 bg-transparent cursor-pointer"
            >
              Notify Doctor
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function CompletedTodayCard({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div className="bg-surface-white border border-border-subtle rounded-lg flex flex-col">
      <div className="px-md py-sm border-b border-border-subtle">
        <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Completed Today</h2>
      </div>
      <ul className="divide-y divide-border-subtle m-0 p-0 list-none">
        {COMPLETED_TODAY.map((item) => (
          <li
            key={item.id}
            className="px-md py-sm hover:bg-surface-container-low transition-colors flex justify-between items-center"
          >
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">{item.testName}</span>
              <span className="font-body-sm text-body-sm text-secondary">
                ID: {item.requestId} • {item.completedAt}
              </span>
            </div>
            <span className="material-symbols-outlined text-success text-lg">check_circle</span>
          </li>
        ))}
      </ul>
      <div className="px-md py-sm border-t border-border-subtle bg-surface-bright text-center">
        <button
          type="button"
          onClick={onViewAll}
          className="font-label-sm text-label-sm text-primary hover:underline bg-transparent border-0 cursor-pointer p-0"
        >
          View All {LAB_DASHBOARD_STATS.completedToday} Completed
        </button>
      </div>
    </div>
  )
}

function TurnaroundTimeCard() {
  return (
    <div className="bg-surface-white border border-border-subtle rounded-lg flex flex-col">
      <div className="px-md py-sm border-b border-border-subtle">
        <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Avg Turnaround Time</h2>
        <span className="font-label-sm text-label-sm text-secondary">Current shift metrics</span>
      </div>
      <div className="p-md flex flex-col gap-md">
        {TURNAROUND_METRICS.map((metric) =>
          metric.isStat ? (
            <div
              key={metric.department}
              className="flex flex-col gap-1 mt-2 p-sm bg-warning/10 rounded border border-warning/20"
            >
              <div className="flex justify-between items-end">
                <span className="font-label-md text-label-md text-warning flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">electric_bolt</span>
                  {metric.department}
                </span>
                <span className="font-body-sm text-body-sm text-warning font-bold">{metric.minutes} mins</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-warning h-full rounded-full"
                  style={{ width: `${metric.barPercent}%` }}
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
                  style={{ width: `${metric.barPercent}%` }}
                />
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

export function LabDashboardContent() {
  const navigate = useNavigate()

  const handleNotifyDoctor = (id: string) => {
    const item = CRITICAL_VALUES.find((cv) => cv.id === id)
    toast.success(
      item
        ? `Physician notified for ${item.patientName} — ${item.testName}`
        : 'Physician notification sent.',
    )
  }

  const handleProcess = (id: string) => {
    const request = getLabRequestById(id)
    if (request && getRowAction(request) === 'collect_specimen') {
      navigate('/laboratory/specimens', { state: { requestId: id, openModal: true } })
      return
    }
    navigate(`/laboratory/requests/${id}`)
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-xl">
      <div className="flex flex-col lg:flex-row gap-xl">
        <div className="w-full lg:w-[65%] flex flex-col gap-xl">
          <StatCards />
          <StatRequestsCard
            onViewAll={() => navigate('/laboratory/requests')}
            onProcess={handleProcess}
          />
          <CriticalValuesCard onNotify={handleNotifyDoctor} />
        </div>

        <div className="w-full lg:w-[35%] flex flex-col gap-xl">
          <CompletedTodayCard onViewAll={() => navigate('/laboratory/requests?status=completed')} />
          <TurnaroundTimeCard />
        </div>
      </div>
    </div>
  )
}
