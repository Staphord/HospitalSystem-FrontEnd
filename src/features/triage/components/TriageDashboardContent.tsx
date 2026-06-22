import { useNavigate } from 'react-router-dom'
import { MOCK_TRIAGE_VISITS } from '@/features/triage/data/mockTriageVisits'
import { buildAssessNavigateState } from '@/features/triage/utils/triageAssessNav'

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

const AWAITING_TRIAGE = MOCK_TRIAGE_VISITS

const RECENTLY_ASSESSED: RecentlyAssessedItem[] = [
  {
    name: 'Zainab Ally',
    assessedAgo: '4m ago',
    category: 'Non-Urgent',
    dotColor: 'bg-success',
    badgeClass: 'bg-success/10 text-success',
  },
  {
    name: 'David Kessi',
    assessedAgo: '12m ago',
    category: 'Semi-Urgent',
    dotColor: 'bg-[#00B8D9]',
    badgeClass: 'bg-[#00B8D9]/10 text-[#00B8D9]',
  },
  {
    name: 'Grace Mushi',
    assessedAgo: '18m ago',
    category: 'Urgent',
    dotColor: 'bg-warning',
    badgeClass: 'bg-warning/10 text-warning',
  },
  {
    name: 'Thomas Massawe',
    assessedAgo: '25m ago',
    category: 'Non-Urgent',
    dotColor: 'bg-success',
    badgeClass: 'bg-success/10 text-success',
  },
]

const TRIAGE_DISTRIBUTION: DistributionItem[] = [
  {
    label: 'Emergency (Category 1)',
    labelColor: 'text-error',
    count: 2,
    percent: 11,
    barColor: 'bg-error',
  },
  {
    label: 'Urgent (Category 2)',
    labelColor: 'text-warning',
    count: 4,
    percent: 22,
    barColor: 'bg-warning',
  },
  {
    label: 'Semi-Urgent (Category 3)',
    labelColor: 'text-[#00B8D9]',
    count: 8,
    percent: 44,
    barColor: 'bg-[#00B8D9]',
  },
  {
    label: 'Non-Urgent (Category 4)',
    labelColor: 'text-success',
    count: 4,
    percent: 22,
    barColor: 'bg-success',
  },
]

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
    <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex flex-col justify-between">
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

  return (
    <div className="max-w-container-max mx-auto">
      <div className="grid grid-cols-12 gap-lg">
        <div className="col-span-12 lg:col-span-8 space-y-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            <StatCard label="Awaiting Triage" value={String(AWAITING_TRIAGE.length)} icon="hourglass_empty" />
            <StatCard
              label="Assessed Today"
              value="18"
              icon="trending_up"
              iconClassName="text-success"
            />
            <StatCard
              label="Critical"
              value="1"
              valueClassName="text-error"
              icon="emergency_home"
              iconClassName="text-error"
              iconFilled
            />
            <StatCard label="Avg Assessment" value="7 min" icon="timer" />
          </div>

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
                  {AWAITING_TRIAGE.map((row) => (
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
                      <td className={`px-lg py-md font-semibold ${row.waitColor}`}>{row.waitTime}</td>
                      <td className="px-lg py-md">{row.payment}</td>
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
                  ))}
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

        <div className="col-span-12 lg:col-span-4 space-y-lg">
          <section className="bg-surface-white border border-border-subtle rounded-xl shadow-sm">
            <div className="px-lg py-md border-b border-border-subtle">
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Recently Assessed</h3>
            </div>
            <div className="p-lg space-y-md">
              {RECENTLY_ASSESSED.map((item) => (
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
              ))}
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

          <section className="bg-surface-white border border-border-subtle rounded-xl shadow-sm p-lg">
            <div className="mb-lg">
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">
                Today&apos;s Triage Distribution
              </h3>
              <div className="h-px bg-border-subtle mt-md" />
            </div>
            <div className="space-y-lg">
              {TRIAGE_DISTRIBUTION.map((item) => (
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
