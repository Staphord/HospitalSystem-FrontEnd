import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EQUIPMENT_STATUS,
  MODALITY_BREAKDOWN,
  RADIOLOGY_DASHBOARD_STATS,
  REPORTS_DUE,
  TODAYS_IMAGING_SCHEDULE,
} from '@/features/radiology/data/mockRadiologyDashboard'
import type { EquipmentStatus } from '@/features/radiology/types/radiology'

const EQUIPMENT_STATUS_CONFIG: Record<
  EquipmentStatus,
  { dotClass: string; labelClass: string; label: string }
> = {
  optimal: {
    dotClass: 'bg-success',
    labelClass: 'text-success',
    label: 'Optimal',
  },
  online: {
    dotClass: 'bg-info',
    labelClass: 'text-info',
    label: 'Online',
  },
  maintenance: {
    dotClass: 'bg-error animate-pulse',
    labelClass: 'text-error',
    label: 'Maintenance Req.',
  },
}

function StatCards() {
  const { pending, scheduledToday, inProgress, reportsDue } = RADIOLOGY_DASHBOARD_STATS

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary">Pending</span>
          <span className="material-symbols-outlined text-[20px]">hourglass_empty</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{pending}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary">Scheduled Today</span>
          <span className="material-symbols-outlined text-[20px]">calendar_today</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{scheduledToday}</span>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-lg p-md flex flex-col gap-xs hover:border-outline-variant transition-colors">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="font-label-md text-label-md text-secondary">In Progress</span>
          <span className="material-symbols-outlined text-[20px] text-primary">sync</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">{inProgress}</span>
      </div>

      <div className="bg-warning/10 border border-warning rounded-lg p-md flex flex-col gap-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 w-16 h-16 bg-warning rounded-bl-full opacity-10" />
        <div className="flex items-center justify-between text-warning relative z-10">
          <span className="font-label-md text-label-md">Reports Due</span>
          <span className="material-symbols-outlined text-[20px]">error_outline</span>
        </div>
        <span className="font-headline-lg text-headline-lg text-warning relative z-10">{reportsDue}</span>
      </div>
    </div>
  )
}

function TodaysImagingSchedule({ onStart }: { onStart: (id: string) => void }) {
  return (
    <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden flex flex-col">
      <div className="px-md py-md flex justify-between items-center">
        <h2 className="text-headline-sm font-headline-sm text-on-surface m-0">Today&apos;s Imaging Schedule</h2>
        <Link
          to="/radiology/schedule"
          className="text-primary text-label-md font-label-md hover:underline no-underline"
        >
          View Full Schedule →
        </Link>
      </div>
      <div className="h-px bg-border-subtle" />
      <div className="divide-y divide-border-subtle overflow-y-auto">
        {TODAYS_IMAGING_SCHEDULE.map((item) => (
          <div
            key={item.id}
            className="p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md hover:bg-surface-container-low transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md flex-1 items-center">
              <div className="flex items-center gap-sm">
                <span className="text-label-md font-bold text-primary">{item.time}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-body-md font-semibold">{item.patientName}</span>
                <span className="text-label-sm text-secondary">{item.patientNumber}</span>
              </div>
              <div className="flex items-center">
                <span className="px-sm py-xs bg-surface-container text-on-surface-variant text-label-sm rounded font-medium truncate">
                  Modality: {item.modality}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onStart(item.id)}
              className="sm:ml-lg px-md h-8 bg-primary-container text-white text-label-md font-label-md rounded hover:bg-primary transition-colors flex-shrink-0 border-0 cursor-pointer"
            >
              Start →
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReportsDueCard() {
  return (
    <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-warning" />
      <div className="px-md py-md flex items-center gap-sm">
        <span className="material-symbols-outlined text-warning">report_gmailerrorred</span>
        <h2 className="text-headline-sm font-headline-sm text-on-surface m-0">Reports Due</h2>
      </div>
      <div className="px-md pb-md overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="py-sm text-label-md text-secondary uppercase tracking-wider font-bold">Patient</th>
              <th className="py-sm text-label-md text-secondary uppercase tracking-wider font-bold">Modality</th>
              <th className="py-sm text-label-md text-secondary uppercase tracking-wider font-bold">Completed</th>
              <th className="py-sm text-label-md text-secondary uppercase tracking-wider font-bold text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {REPORTS_DUE.map((item) => (
              <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                <td className="py-md text-body-sm font-medium">{item.patientName}</td>
                <td className="py-md text-body-sm">{item.modality}</td>
                <td className="py-md text-body-sm">{item.completedAt}</td>
                <td className="py-md text-right">
                  <Link
                    to={`/radiology/requests/${item.requestId}/report`}
                    className="text-primary text-label-md font-bold hover:underline no-underline"
                  >
                    Write Report →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ModalityBreakdownCard() {
  return (
    <section className="bg-surface-white border border-border-subtle rounded-xl p-md">
      <div className="flex items-center gap-sm mb-lg">
        <span className="material-symbols-outlined text-primary">analytics</span>
        <h2 className="text-headline-sm font-headline-sm text-on-surface m-0">Modality Breakdown Today</h2>
      </div>
      <div className="space-y-md">
        {MODALITY_BREAKDOWN.map((item) => (
          <div key={item.modality}>
            <div className="flex justify-between text-label-sm mb-xs">
              <span className="text-secondary">{item.modality}</span>
              <span className="font-bold">
                {item.sessions} Session{item.sessions !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2">
              <div
                className="bg-primary-container h-2 rounded-full"
                style={{ width: `${item.barPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EquipmentMonitoringCard() {
  return (
    <section className="bg-surface-white border border-border-subtle rounded-xl p-md">
      <div className="flex items-center gap-sm mb-lg">
        <span className="material-symbols-outlined text-primary">settings_input_component</span>
        <h2 className="text-headline-sm font-headline-sm text-on-surface m-0">Equipment Monitoring</h2>
      </div>
      <div className="space-y-md">
        {EQUIPMENT_STATUS.map((item) => {
          const config = EQUIPMENT_STATUS_CONFIG[item.status]
          return (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                <span className="text-body-sm font-medium">{item.name}</span>
              </div>
              <span className={`text-label-sm font-bold uppercase ${config.labelClass}`}>
                {config.label}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function RadiologyDashboardContent() {
  const navigate = useNavigate()

  const handleStart = (id: string) => {
    const item = TODAYS_IMAGING_SCHEDULE.find((s) => s.id === id)
    if (item?.requestId) {
      toast.success(`Opening report for ${item.patientName}`)
      navigate(`/radiology/requests/${item.requestId}/report`)
      return
    }
    toast.success(item ? `Starting imaging for ${item.patientName}` : 'Imaging session started.')
    navigate('/radiology/schedule')
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <div className="flex flex-col lg:flex-row gap-lg">
        <div className="w-full lg:w-[65%] flex flex-col gap-lg">
          <StatCards />
          <TodaysImagingSchedule onStart={handleStart} />
          <ReportsDueCard />
        </div>

        <div className="w-full lg:w-[35%] flex flex-col gap-lg">
          <ModalityBreakdownCard />
          <EquipmentMonitoringCard />
        </div>
      </div>
    </div>
  )
}
