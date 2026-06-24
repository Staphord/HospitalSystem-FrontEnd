import { useNavigate } from 'react-router-dom'
import { getReferralStats } from '@/features/consultation/data/mockReferrals'

// ── Static mock data (will be replaced with API calls) ──────────────────────

const STAT_CARDS = [
  { label: 'Waiting to See Me', value: 4, unit: 'Patients' },
  { label: 'In Progress', value: 1, unit: 'Consulting' },
  { label: 'Completed Today', value: 7, unit: 'Discharged' },
  { label: 'Pending Results', value: 3, unit: 'Reports' },
]

type UrgencyLevel = 'urgent' | 'consulting' | 'normal'

interface QueuePatient {
  name: string
  patientId: string
  condition: string
  waitTime: string
  urgency: UrgencyLevel
  visitId: string
}

const NEXT_PATIENTS: QueuePatient[] = [
  {
    name: 'Fatuma Said',
    patientId: 'PT-4891',
    condition: 'Acute Respiratory Distressed',
    waitTime: '48 min',
    urgency: 'urgent',
    visitId: 'v-001',
  },
  {
    name: 'Hassan Mwita',
    patientId: 'PT-4889',
    condition: 'Persistent Fever',
    waitTime: '38 min',
    urgency: 'normal',
    visitId: 'v-002',
  },
  {
    name: 'Grace Kimaro',
    patientId: 'PT-4892',
    condition: 'Sprained Ankle',
    waitTime: '15 min',
    urgency: 'normal',
    visitId: 'v-003',
  },
  {
    name: 'Amir Juma',
    patientId: 'PT-4903',
    condition: 'Severe Headache',
    waitTime: '8 min',
    urgency: 'consulting',
    visitId: 'v-004',
  },
]

type ResultStatus = 'critical' | 'ready' | 'pending'

interface PendingResult {
  patientName: string
  test: string
  time: string
  status: ResultStatus
}

const PENDING_RESULTS: PendingResult[] = [
  { patientName: 'Bakari Juma', test: 'HbA1c', time: '08:30', status: 'critical' },
  { patientName: 'Z. Suleiman', test: 'Potassium', time: '09:15', status: 'ready' },
  { patientName: 'Abeid Mariam', test: 'WBC Count', time: '10:00', status: 'pending' },
]

const SUMMARY_ROWS = [
  { icon: 'medical_information', label: 'Diagnoses count', value: 12 },
  { icon: 'prescriptions', label: 'Prescriptions issued', value: 8 },
  { icon: 'biotech', label: 'Investigations ordered', value: 5 },
  { icon: 'outbound', label: 'Referrals made', value: 2 },
]

interface CriticalAlert {
  title: string
  description: string
  primaryAction: string
  secondaryAction?: string
  isHighlight: boolean
}

const CRITICAL_ALERTS: CriticalAlert[] = [
  {
    title: 'Critical Lab Value: Bakari Juma',
    description: 'HbA1c 11.4% (Severely Elevated). Immediate therapeutic adjustment required.',
    primaryAction: 'Acknowledge',
    secondaryAction: 'Contact Patient',
    isHighlight: true,
  },
  {
    title: 'Abnormal Result: Z. Suleiman',
    description: 'Potassium 6.2 mmol/L. Hyperkalemia risk detected.',
    primaryAction: 'Review Now',
    isHighlight: false,
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
      {STAT_CARDS.map((card) => (
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
  onOpenEncounter,
  onViewQueue,
}: {
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
            {NEXT_PATIENTS.map((patient) => {
              const isUrgent = patient.urgency === 'urgent'
              const isConsulting = patient.urgency === 'consulting'

              return (
                <tr
                  key={patient.patientId}
                  className={`border-b border-border-subtle transition-colors last:border-0 ${
                    isUrgent
                      ? 'bg-[#FFF4F4] hover:bg-[#FFE8E8]'
                      : 'hover:bg-hover-tint'
                  }`}
                >
                  <td className="px-md py-md">
                    <div className="font-semibold text-on-surface">{patient.name}</div>
                    <div className="text-[11px] text-secondary">{patient.patientId}</div>
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
                    {patient.waitTime}
                  </td>

                  <td className="px-md py-md text-right">
                    <button
                      type="button"
                      onClick={() => onOpenEncounter(patient.visitId)}
                      className="bg-primary-container text-white px-md py-xs rounded font-body-sm font-medium h-8 hover:bg-primary transition-colors active:scale-95 border-0 cursor-pointer whitespace-nowrap"
                    >
                      Open Encounter →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PendingResultsList({ onViewAll }: { onViewAll: () => void }) {
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
        {PENDING_RESULTS.map((result) => {
          const cfg = statusConfig[result.status]
          const isCritical = result.status === 'critical'
          const isPending = result.status === 'pending'

          return (
            <div
              key={`${result.patientName}-${result.test}`}
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
                  <div className="font-body-sm font-bold text-on-surface">{result.patientName}</div>
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
        })}
      </div>
    </section>
  )
}

function TodaySummaryCard() {
  const dailyLoadPercent = 70
  const referralCount = getReferralStats().total

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
              {row.label === 'Referrals made' ? referralCount : row.value}
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
          {dailyLoadPercent}% of expected daily patient load reached
        </p>
      </div>
    </section>
  )
}

function CriticalAlertsCard() {
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
          {CRITICAL_ALERTS.map((alert) => (
            <div
              key={alert.title}
              className={`rounded-lg p-md border ${
                alert.isHighlight
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
                  className={`text-white text-[12px] px-md py-xs rounded transition-colors border-0 cursor-pointer ${
                    alert.isHighlight
                      ? 'bg-error hover:bg-on-error-container'
                      : 'bg-on-surface-variant hover:bg-on-surface'
                  }`}
                >
                  {alert.primaryAction}
                </button>
                {alert.secondaryAction && (
                  <button
                    type="button"
                    className="border border-error text-error text-[12px] px-md py-xs rounded hover:bg-[#FFE8E8] transition-colors cursor-pointer bg-transparent"
                  >
                    {alert.secondaryAction}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function DoctorDashboardContent() {
  const navigate = useNavigate()

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-lg lg:flex-row">
      {/* Left column — 65% */}
      <div className="w-full lg:w-[65%] space-y-lg">
        <StatCards />
        <NextPatientsTable
          onOpenEncounter={(visitId) => navigate(`/consultation/encounter/${visitId}`)}
          onViewQueue={() => navigate('/consultation/queue')}
        />
        <PendingResultsList onViewAll={() => navigate('/consultation/results')} />
      </div>

      {/* Right column — 35% */}
      <div className="w-full lg:w-[35%] space-y-lg">
        <TodaySummaryCard />
        <CriticalAlertsCard />
      </div>
    </div>
  )
}
