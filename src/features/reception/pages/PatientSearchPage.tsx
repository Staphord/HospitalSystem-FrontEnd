import { useState, type InputHTMLAttributes } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  addMockCheckIn,
  isPatientInQueueToday,
  searchPatients,
  type MockPatient,
  type SearchField,
} from '@/features/reception/data/mockPatients'

const FIELD_LABEL = 'block text-label-md font-label-md text-secondary mb-xs'
const INPUT_CLASS =
  'w-full h-10 py-0 pl-10 pr-4 border border-border-subtle rounded focus:border-primary focus:ring-1 focus:ring-primary text-body-md font-body-md bg-white outline-none placeholder:text-outline'
const INPUT_ICON_WRAPPER =
  'pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center select-none'
const INPUT_ICON = 'material-symbols-outlined text-[20px] leading-none text-outline block'
const TH_CLASS =
  'py-md px-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-border-subtle'
const TD_MUTED = 'py-md px-md font-body-sm text-body-sm text-on-surface-variant'
const STATUS_BADGE =
  'inline-flex items-center px-sm py-xs rounded-full font-label-md text-label-md font-bold'
const ICON_VARIATION = {
  fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
} as const

type SearchState = {
  results: MockPatient[]
  field: SearchField
  term: string
}

function SearchInput({
  icon,
  onFocus,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: string }) {
  return (
    <div className="relative">
      <span className={INPUT_ICON_WRAPPER} aria-hidden="true">
        <span className={INPUT_ICON} style={ICON_VARIATION}>
          {icon}
        </span>
      </span>
      <input className={INPUT_CLASS} onFocus={onFocus} {...props} />
    </div>
  )
}

function paymentBadgeClass(type: MockPatient['paymentType']) {
  switch (type) {
    case 'Cash':
      return 'bg-success/10 text-success'
    case 'Insurance':
      return 'bg-primary-fixed text-primary'
    case 'Exempt':
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function queueStatusClass(status: MockPatient['queueStatus']) {
  switch (status) {
    case 'Waiting':
      return 'bg-warning/10 text-warning'
    case 'In Triage':
      return 'bg-info/10 text-info'
    case 'With Doctor':
      return 'bg-success/10 text-success'
    case 'Complete':
      return 'bg-surface-container-high text-on-surface-variant'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function PatientDetailModal({ patient, onClose }: { patient: MockPatient; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-lg w-full max-w-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-detail-title"
      >
        <div className="p-lg border-b border-border-subtle flex justify-between items-center">
          <h2 id="patient-detail-title" className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Patient Details
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
        <div className="p-lg grid grid-cols-2 gap-md">
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Full Name</p>
            <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{patient.fullName}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient #</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.patientNumber}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">National ID</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.nationalId}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Phone</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.phone}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Date of Birth</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.dateOfBirth}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Gender</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.gender}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Last Visit</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.lastVisit}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Emergency Contact</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.emergencyContact}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PatientFoundCard({
  patient,
  onCheckIn,
  onViewQueue,
  onVerifyInsurance,
  onViewDetails,
}: {
  patient: MockPatient
  onCheckIn: () => void
  onViewQueue: () => void
  onVerifyInsurance: () => void
  onViewDetails: () => void
}) {
  const inQueue = isPatientInQueueToday(patient)
  const needsInsurance = patient.paymentType === 'Insurance' && patient.insuranceStatus === 'Pending'

  return (
    <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden">
      <div className="p-md border-b border-border-subtle bg-surface-bright flex justify-between items-center gap-md">
        <div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Patient Found
          </h3>
          <p className="font-body-sm text-body-sm text-secondary m-0 mt-xs">Returning patient record</p>
        </div>
        <span className={`${STATUS_BADGE} ${paymentBadgeClass(patient.paymentType)}`}>
          {patient.paymentType}
        </span>
      </div>

      {inQueue && (
        <div className="mx-md mt-md p-md rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-sm">
          <span className="material-symbols-outlined text-warning text-[20px] shrink-0">info</span>
          <div>
            <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">
              Already in today&apos;s queue
            </p>
            <p className="font-body-sm text-body-sm text-secondary m-0 mt-xs">
              {patient.fullName} ({patient.patientNumber}) is{' '}
              {patient.queueStatus ? `currently ${patient.queueStatus.toLowerCase()}` : 'already checked in'}.
            </p>
          </div>
        </div>
      )}

      <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-md">
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient Name</p>
          <p className="font-body-md text-body-md font-semibold text-on-surface m-0">{patient.fullName}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient #</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.patientNumber}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">National ID</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.nationalId}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Phone</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.phone}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Date of Birth</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.dateOfBirth}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Last Visit</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.lastVisit}</p>
        </div>
        {patient.insurer && (
          <>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Insurer</p>
              <p className="font-body-md text-body-md text-on-surface m-0">{patient.insurer}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Insurance Status</p>
              <span
                className={`${STATUS_BADGE} ${
                  patient.insuranceStatus === 'Verified'
                    ? 'bg-success/10 text-success'
                    : patient.insuranceStatus === 'Pending'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-error/10 text-error'
                }`}
              >
                {patient.insuranceStatus}
              </span>
            </div>
          </>
        )}
        {patient.queueStatus && inQueue && (
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Queue Status</p>
            <span className={`${STATUS_BADGE} ${queueStatusClass(patient.queueStatus)}`}>
              {patient.queueStatus}
            </span>
          </div>
        )}
      </div>

      <div className="p-lg border-t border-border-subtle bg-surface-bright flex flex-wrap gap-sm">
        {inQueue ? (
          <button
            type="button"
            onClick={onViewQueue}
            className="h-10 px-lg rounded font-body-sm text-body-sm font-semibold text-white bg-primary-container hover:bg-primary transition-colors border-0 cursor-pointer"
          >
            View in Queue
          </button>
        ) : (
          <button
            type="button"
            onClick={onCheckIn}
            className="h-10 px-lg rounded font-body-sm text-body-sm font-semibold text-white bg-primary-container hover:bg-primary transition-colors border-0 cursor-pointer"
          >
            Check In to Queue
          </button>
        )}
        <button
          type="button"
          onClick={onViewDetails}
          className="h-10 px-lg rounded font-body-sm text-body-sm font-medium text-secondary border border-border-subtle bg-white hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          View Details
        </button>
        {needsInsurance && (
          <button
            type="button"
            onClick={onVerifyInsurance}
            className="h-10 px-lg rounded font-body-sm text-body-sm font-medium text-primary-container border border-primary-container bg-white hover:bg-hover-tint transition-colors cursor-pointer"
          >
            Verify Insurance
          </button>
        )}
      </div>
    </div>
  )
}

function SearchResultsTable({
  results,
  onSelect,
}: {
  results: MockPatient[]
  onSelect: (patient: MockPatient) => void
}) {
  return (
    <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden">
      <div className="p-md border-b border-border-subtle bg-surface-bright">
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
          {results.length} patients found
        </h3>
        <p className="font-body-sm text-body-sm text-secondary m-0 mt-xs">Select a patient to continue</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-surface-container-low">
            <tr>
              <th className={TH_CLASS}>Patient Name</th>
              <th className={TH_CLASS}>Patient #</th>
              <th className={TH_CLASS}>National ID</th>
              <th className={TH_CLASS}>Phone</th>
              <th className={TH_CLASS}>Last Visit</th>
              <th className={`${TH_CLASS} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {results.map((patient) => (
              <tr key={patient.id} className="hover:bg-hover-tint transition-colors">
                <td className="py-md px-md font-body-sm text-body-sm font-semibold text-on-surface">
                  {patient.fullName}
                </td>
                <td className={TD_MUTED}>{patient.patientNumber}</td>
                <td className={TD_MUTED}>{patient.nationalId}</td>
                <td className={TD_MUTED}>{patient.phone}</td>
                <td className={TD_MUTED}>{patient.lastVisit}</td>
                <td className="py-md px-md text-right">
                  <button
                    type="button"
                    onClick={() => onSelect(patient)}
                    className="h-8 px-sm rounded font-body-sm text-body-sm font-medium text-white bg-primary-container hover:bg-primary transition-colors border-0 cursor-pointer"
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptySearchHint() {
  return (
    <div className="flex flex-col items-center justify-center py-xl bg-surface-white border border-border-subtle border-dashed rounded min-h-[280px]">
      <span
        className="material-symbols-outlined text-[64px] text-outline opacity-40 mb-md select-none"
        style={{ fontVariationSettings: "'wght' 200" }}
      >
        person_search
      </span>
      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-sm m-0">
        Search for a returning patient
      </h3>
      <p className="font-body-md text-body-md text-outline text-center max-w-lg px-md m-0 leading-relaxed">
        Try <span className="font-semibold text-on-surface">Grace Kimaro</span>, phone{' '}
        <span className="font-semibold text-on-surface">0712 345 678</span>, or ID{' '}
        <span className="font-semibold text-on-surface">1989051234567</span>. Use{' '}
        <span className="font-semibold text-on-surface">9945123476</span> to demo a not-found result.
      </p>
    </div>
  )
}

export function PatientSearchPage() {
  const navigate = useNavigate()

  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [activeField, setActiveField] = useState<SearchField>('id')
  const [hasSearched, setHasSearched] = useState(false)
  const [searchState, setSearchState] = useState<SearchState | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<MockPatient | null>(null)
  const [detailPatient, setDetailPatient] = useState<MockPatient | null>(null)
  const [checkInVersion, setCheckInVersion] = useState(0)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSelectedPatient(null)

    const outcome = searchPatients({ nationalId, phone, name }, activeField)
    if (!outcome) {
      toast.error('Enter a National ID, phone number, or patient name to search.')
      return
    }

    setSearchState(outcome)
    setHasSearched(true)

    if (outcome.results.length === 1) {
      setSelectedPatient(outcome.results[0])
    }
  }

  const displayPatient = selectedPatient

  const emptyMessage =
    searchState?.field === 'id' ? (
      <>
        We couldn&apos;t find any patient matching the ID{' '}
        <span className="font-bold text-on-surface">&quot;{searchState.term}&quot;</span> in the system.
        Please verify the number or register them as a new patient.
      </>
    ) : searchState?.field === 'phone' ? (
      <>
        We couldn&apos;t find any patient matching the phone number{' '}
        <span className="font-bold text-on-surface">&quot;{searchState.term}&quot;</span> in the system.
        Please verify the number or register them as a new patient.
      </>
    ) : (
      <>
        We couldn&apos;t find any patient matching the name{' '}
        <span className="font-bold text-on-surface">&quot;{searchState?.term}&quot;</span> in the system.
        Please verify the information or register them as a new patient.
      </>
    )

  const handleCheckIn = (patient: MockPatient) => {
    addMockCheckIn(patient.id)
    setCheckInVersion((v) => v + 1)
    toast.success(`${patient.fullName} checked in and added to today's queue.`)
  }

  void checkInVersion

  return (
    <div className="max-w-container-max mx-auto px-gutter">
      <div className="bg-surface-white border border-border-subtle rounded shadow-sm p-lg mb-xl">
        <form onSubmit={handleSearch} className="grid grid-cols-12 gap-md items-end">
          <div className="col-span-12 md:col-span-4">
            <label className={FIELD_LABEL}>Search by National ID</label>
            <SearchInput
              icon="id_card"
              placeholder="Enter National ID..."
              type="text"
              value={nationalId}
              onFocus={() => setActiveField('id')}
              onChange={(e) => setNationalId(e.target.value)}
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className={FIELD_LABEL}>Search by Phone Number</label>
            <SearchInput
              icon="call"
              placeholder="e.g. 0712 345 678"
              type="text"
              value={phone}
              onFocus={() => setActiveField('phone')}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className={FIELD_LABEL}>Patient Name</label>
            <SearchInput
              icon="person"
              placeholder="Enter Full Name"
              type="text"
              value={name}
              onFocus={() => setActiveField('name')}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="col-span-12 md:col-span-1">
            <button
              type="submit"
              className="w-full h-10 bg-primary-container text-on-primary rounded font-medium hover:bg-primary transition-colors flex items-center justify-center border-0 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
          </div>
        </form>
      </div>

      {!hasSearched && <EmptySearchHint />}

      {hasSearched && searchState && searchState.results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-xl bg-surface-white border border-border-subtle border-dashed min-h-[400px] rounded">
          <div className="w-64 h-64 mb-lg relative">
            <div className="absolute inset-0 bg-surface-container-low rounded-full opacity-20" />
            <div className="flex items-center justify-center h-full">
              <span
                className="material-symbols-outlined text-[96px] text-outline opacity-40 select-none"
                style={{ fontVariationSettings: "'wght' 200" }}
              >
                person_search
              </span>
            </div>
          </div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-sm m-0">
            No patient found
          </h3>
          <p className="font-body-md text-body-md text-outline text-center max-w-md px-md mb-xl leading-relaxed m-0">
            {emptyMessage}
          </p>
          <button
            type="button"
            onClick={() => navigate('/reception/register')}
            className="bg-[#0052CC] text-white px-lg py-md rounded font-label-md text-label-md hover:bg-primary transition-all duration-200 flex items-center gap-sm group shadow-md hover:shadow-lg active:scale-95 border-0 cursor-pointer"
          >
            Register as New Patient
            <span className="material-symbols-outlined transition-transform duration-200 group-hover:translate-x-1">
              arrow_forward
            </span>
          </button>
        </div>
      )}

      {hasSearched && searchState && searchState.results.length > 1 && !displayPatient && (
        <SearchResultsTable results={searchState.results} onSelect={setSelectedPatient} />
      )}

      {hasSearched && displayPatient && (
        <PatientFoundCard
          key={`${displayPatient.id}-${checkInVersion}`}
          patient={displayPatient}
          onCheckIn={() => handleCheckIn(displayPatient)}
          onViewQueue={() => navigate('/reception/queue')}
          onVerifyInsurance={() => navigate('/billing')}
          onViewDetails={() => setDetailPatient(displayPatient)}
        />
      )}

      {detailPatient && (
        <PatientDetailModal patient={detailPatient} onClose={() => setDetailPatient(null)} />
      )}
    </div>
  )
}
