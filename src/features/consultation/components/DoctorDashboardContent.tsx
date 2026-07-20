import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { consultationService } from '@/api/services/consultation'
import type { DoctorDashboardStatsResponse } from '@/api/services/consultation'

type UrgencyLevel = 'urgent' | 'consulting' | 'normal'
type ResultStatus = 'critical' | 'ready' | 'pending'

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCards({ stats }: { stats: DoctorDashboardStatsResponse['stats'] }) {
  const cards = [
    { label: 'Waiting to See Me', value: stats.waiting_patients, unit: 'Patients' },
    { label: 'In Progress', value: stats.in_progress, unit: 'Consulting' },
    { label: 'Completed Today', value: stats.completed_today, unit: 'Discharged' },
    { label: 'Pending Results', value: stats.pending_results, unit: 'Reports' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface-white border border-border-subtle rounded-lg overflow-hidden shadow-sm"
        >
          <div className="p-md flex flex-col gap-xs">
            <p className="font-label-md text-label-md text-secondary uppercase tracking-wider">
              {card.label}
            </p>
            <div className="flex items-baseline gap-xs">
              <span className="text-[30px] leading-[38px] font-bold text-primary font-headline-lg">
                {card.value}
              </span>
              <span className="font-body-sm text-body-sm text-secondary">{card.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function NextPatientsTable({
  patients,
  onOpenEncounter,
  onViewQueue,
}: {
  patients: DoctorDashboardStatsResponse['next_patients']
  onOpenEncounter: (visitId: string) => void
  onViewQueue: () => void
}) {
  return (
    <section className="bg-surface-white border border-border-subtle rounded-[16px] overflow-hidden">
      <div className="px-md py-md border-b border-border-subtle flex justify-between items-center">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Next Patients</h2>
        <button
          type="button"
          onClick={onViewQueue}
          className="text-primary-container font-label-md text-label-md hover:underline flex items-center gap-xs bg-transparent border-0 cursor-pointer"
        >
          View Full Queue
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-border-subtle">
              <th className="px-md py-sm font-label-md text-label-md text-secondary">PATIENT &amp; ID</th>
              <th className="px-md py-sm font-label-md text-label-md text-secondary">CONDITION / REASON</th>
              <th className="px-md py-sm font-label-md text-label-md text-secondary">WAIT TIME</th>
              <th className="px-md py-sm font-label-md text-label-md text-secondary text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface">
            {patients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-md py-xl text-center text-outline font-body-sm">
                  No patients currently in your queue.
                </td>
              </tr>
            ) : (
              patients.map((patient) => {
                const isUrgent = patient.urgency === 'urgent'
                const isConsulting = patient.urgency === 'consulting'

                return (
                  <tr
                    key={patient.patient_id}
                    className={`border-b border-border-subtle transition-colors last:border-0 ${
                      isUrgent
                        ? 'bg-[#FFF4F4] hover:bg-[#FFE8E8]'
                        : 'hover:bg-hover-tint'
                    }`}
                  >
                    <td className="px-md py-md">
                      <div className="font-semibold text-on-surface">{patient.name}</div>
                      <div className="text-[11px] text-secondary">{patient.patient_id}</div>
                    </td>

                    <td className="px-md py-md">
                      {isUrgent ? (
                        <span className="flex items-center gap-xs text-error font-semibold">
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            emergency
                          </span>
                          {patient.condition}
                        </span>
                      ) : isConsulting ? (
                        <div>
                          <span className="flex items-center gap-xs text-primary font-medium">
                            <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                            Consulting
                          </span>
                          <div className="text-[11px] text-secondary">{patient.condition}</div>
                        </div>
                      ) : (
                        patient.condition
                      )}
                    </td>

                    <td
                      className={`px-md py-md font-medium ${
                        isUrgent ? 'text-error' : 'text-secondary'
                      }`}
                    >
                      {patient.wait_time}
                    </td>

                    <td className="px-md py-md text-right">
                      <button
                        type="button"
                        onClick={() => onOpenEncounter(patient.visit_id)}
                        className="bg-primary text-white px-md py-xs rounded font-body-sm font-medium h-8 hover:opacity-90 transition-opacity active:scale-95 border-0 cursor-pointer whitespace-nowrap"
                      >
                        Open Encounter →
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PendingResultsList({
  results,
  onViewAll,
}: {
  results: DoctorDashboardStatsResponse['pending_results']
  onViewAll: () => void
}) {
  const statusConfig: Record<
    ResultStatus,
    { bgIcon: string; iconColor: string; icon: string; badgeBg: string; badgeText: string; label: string }
  > = {
    critical: {
      bgIcon: 'bg-error-container',
      iconColor: 'text-error',
      icon: 'priority_high',
      badgeBg: 'bg-error text-white',
      badgeText: 'Critical',
      label: 'text-error underline hover:text-on-error-container',
    },
    ready: {
      bgIcon: 'bg-success/10',
      iconColor: 'text-success',
      icon: 'check',
      badgeBg: 'bg-success/10 text-success',
      badgeText: 'Ready',
      label: 'text-primary-container hover:underline',
    },
    pending: {
      bgIcon: 'bg-warning/10',
      iconColor: 'text-warning',
      icon: 'schedule',
      badgeBg: 'bg-warning/10 text-warning',
      badgeText: 'Pending',
      label: '',
    },
  }

  return (
    <section className="bg-surface-white border border-border-subtle rounded-[16px] overflow-hidden">
      <div className="px-md py-md border-b border-border-subtle flex justify-between items-center">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Pending Results</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-primary-container font-label-md text-label-md hover:underline flex items-center gap-xs bg-transparent border-0 cursor-pointer"
        >
          View All
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>

      <div className="p-md space-y-sm">
        {results.length === 0 ? (
          <div className="py-lg text-center text-outline font-body-sm bg-surface-white border border-border-subtle rounded">
            No pending results.
          </div>
        ) : (
          results.map((result) => {
            const cfg = statusConfig[result.status]
            const isCritical = result.status === 'critical'
            const isPending = result.status === 'pending'

            return (
              <div
                key={result.id}
                className={`flex items-center justify-between p-sm rounded border transition-colors ${
                  isCritical
                    ? 'bg-[#FFF4F4] border-error/20 hover:border-error/40'
                    : 'bg-surface-white border-border-subtle hover:border-success/40'
                }`}
              >
                <div className="flex items-center gap-md">
                  <div
                    className={`w-10 h-10 rounded-full ${cfg.bgIcon} flex items-center justify-center ${cfg.iconColor} shrink-0`}
                  >
                    <span className="material-symbols-outlined">{cfg.icon}</span>
                  </div>
                  <div>
                    <div className="font-body-sm font-bold text-on-surface">{result.patient_name}</div>
                    <div className="text-[11px] text-secondary">
                      {result.test} • {result.time}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-lg shrink-0">
                  <span
                    className={`px-sm py-xs rounded text-[10px] font-bold uppercase tracking-wider ${cfg.badgeBg}`}
                  >
                    {cfg.badgeText}
                  </span>
                  {isPending ? (
                    <span className="material-symbols-outlined text-secondary opacity-20">more_horiz</span>
                  ) : (
                    <button
                      type="button"
                      onClick={onViewAll}
                      className={`font-label-md text-label-md bg-transparent border-0 cursor-pointer ${cfg.label}`}
                    >
                      {isCritical ? 'View Now' : 'View'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function TodaySummaryCard({ summary }: { summary: DoctorDashboardStatsResponse['summary'] }) {
  const dailyLoadPercent = 100
  const SUMMARY_ROWS = [
    { icon: 'medical_information', label: 'Diagnoses count', value: summary.diagnoses_count },
    { icon: 'prescriptions', label: 'Prescriptions issued', value: summary.prescriptions_issued },
    { icon: 'biotech', label: 'Investigations ordered', value: summary.investigations_ordered },
    { icon: 'outbound', label: 'Referrals made', value: summary.referrals_made },
  ]

  return (
    <section className="bg-surface-white border border-border-subtle rounded-[16px] p-md">
      <h2 className="font-headline-sm text-headline-sm text-on-surface mb-md">Today's Summary</h2>

      <div className="space-y-xs">
        {SUMMARY_ROWS.map((row, idx) => (
          <div
            key={row.label}
            className={`flex items-center justify-between p-sm ${
              idx < SUMMARY_ROWS.length - 1 ? 'border-b border-border-subtle' : ''
            }`}
          >
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-secondary">{row.icon}</span>
              <span className="font-body-sm text-body-sm text-secondary">{row.label}</span>
            </div>
            <span className="font-body-md text-body-md font-bold text-on-surface">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-xl pt-md border-t border-border-subtle">
        <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${dailyLoadPercent}%` }}
          />
        </div>
        <p className="font-label-sm text-label-sm text-secondary mt-sm text-center">
          Live statistics updated from active patient encounters.
        </p>
      </div>
    </section>
  )
}

function CriticalAlertsCard({
  alerts,
  onAcknowledge,
}: {
  alerts: DoctorDashboardStatsResponse['critical_alerts']
  onAcknowledge: (id: string) => void
}) {
  return (
    <section className="bg-surface-white border border-border-subtle rounded-[16px] overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error rounded-l-[16px]" />

      <div className="p-md">
        <div className="flex items-center gap-sm text-error mb-md">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            warning
          </span>
          <h2 className="font-headline-sm text-headline-sm">Critical Alerts</h2>
        </div>

        <div className="space-y-md">
          {alerts.length === 0 ? (
            <div className="py-md text-center text-outline font-body-sm">
              No active critical alerts.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg p-md border ${
                  alert.is_highlight
                    ? 'bg-[#FFF4F4] border-error/10'
                    : 'bg-surface-container-low border-border-subtle'
                }`}
              >
                <p className="font-body-sm text-body-sm font-bold text-on-surface-variant mb-xs">
                  {alert.title}
                </p>
                <p className="font-body-sm text-body-sm text-secondary leading-relaxed mb-md">
                  {alert.description}
                </p>
                <div className="flex gap-sm flex-wrap">
                  <button
                    type="button"
                    onClick={() => onAcknowledge(alert.id)}
                    className={`text-white text-[12px] px-md py-xs rounded transition-colors border-0 cursor-pointer ${
                      alert.is_highlight
                        ? 'bg-error hover:opacity-90'
                        : 'bg-on-surface-variant hover:opacity-90'
                    }`}
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function DoctorDashboardContent() {
  const navigate = useNavigate()
  const [data, setData] = useState<DoctorDashboardStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    consultationService.getDashboardStats()
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to load dashboard statistics'
        toast.error(msg)
        setLoading(false)
      })
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleAcknowledgeAlert = (id: string) => {
    consultationService.acknowledgeInvestigation(id)
      .then(() => {
        toast.success('Investigation result acknowledged successfully')
        refresh()
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to acknowledge result'
        toast.error(msg)
      })
  }

  if (loading || !data) {
    return (
      <div className="max-w-container-max mx-auto h-[60vh] flex flex-col items-center justify-center gap-sm">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <p className="font-body-md text-body-md text-outline m-0">Retrieving clinic dashboard statistics...</p>
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-lg lg:flex-row">
      {/* Left column — 65% */}
      <div className="w-full lg:w-[65%] space-y-lg">
        <StatCards stats={data.stats} />
        <NextPatientsTable
          patients={data.next_patients}
          onOpenEncounter={(visitId) => navigate(`/consultation/encounter/${visitId}`)}
          onViewQueue={() => navigate('/consultation/queue')}
        />
        <PendingResultsList results={data.pending_results} onViewAll={() => navigate('/consultation/results')} />
      </div>

      {/* Right column — 35% */}
      <div className="w-full lg:w-[35%] space-y-lg">
        <TodaySummaryCard summary={data.summary} />
        <CriticalAlertsCard alerts={data.critical_alerts} onAcknowledge={handleAcknowledgeAlert} />
      </div>
    </div>
  )
}
