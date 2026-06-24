import type { AdmittedPatient, AdmissionStatus } from '@/features/consultation/types/inpatientOrders'

const ADMISSION_STATUS: Record<AdmissionStatus, { badge: string; label: string; dot?: boolean }> = {
  critical:        { badge: 'bg-error-container text-on-error-container', label: 'Critical' },
  stable:          { badge: 'bg-success/10 text-success border border-success/30', label: 'Stable', dot: true },
  monitoring:      { badge: 'bg-primary/10 text-primary border border-primary/20', label: 'Monitoring' },
  'discharge-ready': { badge: 'bg-[#E3FCEF] text-[#006644] border border-success/40', label: 'Discharge Ready', dot: true },
}

interface Props {
  patient: AdmittedPatient
  variant: 'orders' | 'discharge'
  onViewHistory?: () => void
}

export function InpatientPatientHeader({ patient, variant, onViewHistory }: Props) {
  const sCfg = ADMISSION_STATUS[patient.status]

  if (variant === 'discharge') {
    return (
      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-wrap items-center gap-md lg:gap-lg shadow-sm">
        <div className="flex items-center gap-md min-w-[200px]">
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold font-headline-sm shrink-0">
            {patient.initials}
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">{patient.name}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              {patient.patientNumber} · {patient.gender}, {patient.age} years
            </p>
          </div>
        </div>

        <div className="hidden md:block h-10 w-px bg-border-subtle" />

        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-outline uppercase">Location</span>
          <span className="font-body-md text-body-md font-semibold">{patient.ward}, {patient.bed}</span>
        </div>

        <div className="hidden md:block h-10 w-px bg-border-subtle" />

        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-outline uppercase">Status</span>
          <span className={`inline-flex items-center gap-xs px-sm py-1 rounded-full font-label-sm text-[11px] uppercase font-bold w-fit mt-0.5 ${sCfg.badge}`}>
            {sCfg.dot && <span className="w-1.5 h-1.5 bg-success rounded-full shrink-0" />}
            {sCfg.label}
          </span>
        </div>

        <div className="hidden md:block h-10 w-px bg-border-subtle" />

        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-outline uppercase">Admission Date</span>
          <span className="font-body-md text-body-md font-semibold">{patient.admissionDate}</span>
        </div>

        <div className="hidden md:block h-10 w-px bg-border-subtle" />

        <div className="flex flex-col">
          <span className="font-label-md text-label-md text-outline uppercase">Duration</span>
          <span className="font-body-md text-body-md font-semibold text-primary">
            {patient.lengthOfStay} {patient.lengthOfStay === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-white border border-border-subtle rounded-xl p-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-lg shadow-sm">
      <div className="flex items-center gap-lg flex-1 min-w-0">
        <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center font-bold text-lg text-on-secondary-container border border-border-subtle shrink-0">
          {patient.initials}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-xl gap-y-sm flex-1">
          <div>
            <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs">Patient Name</span>
            <span className="font-headline-sm text-headline-sm text-on-surface">{patient.name}</span>
          </div>
          <div>
            <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs">Patient ID</span>
            <span className="font-body-md text-body-md font-semibold">#{patient.patientNumber}</span>
          </div>
          <div>
            <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs">Location</span>
            <span className="font-body-md text-body-md font-semibold">{patient.bed}</span>
          </div>
          <div>
            <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs">Status</span>
            <span className={`inline-flex px-sm py-0.5 rounded-full font-label-sm text-[10px] uppercase font-bold ${sCfg.badge}`}>{sCfg.label}</span>
          </div>
          <div className="col-span-2">
            <span className="block font-label-sm text-label-sm text-outline uppercase tracking-wider mb-xs">Primary Diagnosis</span>
            <span className="font-body-md text-body-md font-semibold">{patient.primaryDiagnosis}</span>
          </div>
        </div>
      </div>
      {onViewHistory && (
        <div className="flex gap-sm shrink-0">
          <button
            type="button"
            onClick={onViewHistory}
            className="p-sm rounded-lg hover:bg-surface-container transition-colors text-primary border border-border-subtle flex items-center gap-xs bg-transparent cursor-pointer font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">history</span>
            View History
          </button>
          <button
            type="button"
            className="p-sm rounded-lg hover:bg-surface-container transition-colors text-primary border border-border-subtle flex items-center gap-xs bg-transparent cursor-pointer font-label-md text-label-md"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">assignment</span>
            Case Summary
          </button>
        </div>
      )}
    </div>
  )
}
