import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'

export function ReportsDashboardPage() {
  const reportCards = [
    {
      title: 'Patient Reports',
      description: 'Analyze outpatient/inpatient census, department wait times, and patient discharge metrics.',
      path: '/reports/patients',
      icon: 'groups',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Revenue Reports',
      description: 'Track hospital collections, department revenue breakdown, and cash vs insurance payment shares.',
      path: '/reports/revenue',
      icon: 'payments',
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Operational Reports',
      description: 'Monitor bed occupancy rates, average length of stay, and staff utilization performance.',
      path: '/reports/operations',
      icon: 'analytics',
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ]

  return (
    <div className="max-w-[1440px] mx-auto p-lg space-y-lg">
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive diagnostic data, occupancy telemetry, and financial performance."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg pt-md">
        {reportCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.path}
            className="flex flex-col bg-surface-white border border-border-subtle rounded-xl p-lg hover:border-primary transition-all duration-200 shadow-sm group hover:-translate-y-1 cursor-pointer no-underline text-inherit"
          >
            <div className="flex justify-between items-start mb-md">
              <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center ${card.color}`}>
                <span className="material-symbols-outlined text-headline-sm">{card.icon}</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                arrow_forward
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-xs group-hover:text-primary transition-colors">
              {card.title}
            </h3>
            <p className="font-body-sm text-body-sm text-secondary leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
