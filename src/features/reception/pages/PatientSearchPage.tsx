import { useState, useEffect, type InputHTMLAttributes } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { receptionService } from '@/api/services/reception'
import type { BackendPatient, BackendInsurancePolicy } from '@/api/types/reception'

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

type ActiveField = 'id' | 'phone' | 'name'

type SearchState = {
  results: BackendPatient[]
  field: ActiveField
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

function genderBadgeClass(gender: string) {
  switch (gender?.toLowerCase()) {
    case 'female':
      return 'bg-primary-fixed text-primary'
    case 'male':
      return 'bg-info/10 text-info'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function PatientDetailModal({ patient, onClose }: { patient: BackendPatient; onClose: () => void }) {
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
            <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">{patient.full_name}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient #</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.patient_number}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">National ID</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.national_id ?? '—'}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Phone</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.phone_primary ?? '—'}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Date of Birth</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.date_of_birth}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Gender</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0" style={{ textTransform: 'capitalize' }}>{patient.gender}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Next of Kin</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">
              {patient.next_of_kin_name ? `${patient.next_of_kin_name} (${patient.next_of_kin_relationship ?? ''}) · ${patient.next_of_kin_phone ?? ''}` : '—'}
            </p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Blood Group</p>
            <p className="font-body-sm text-body-sm text-on-surface m-0">{patient.blood_group ?? '—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PatientFoundCard({
  patient,
  checkingIn,
  onCheckIn,
  onViewQueue,
  onViewDetails,
}: {
  patient: BackendPatient
  checkingIn: boolean
  onCheckIn: (paymentType: 'cash' | 'insurance', insuranceId?: string) => void
  onViewQueue: () => void
  onViewDetails: () => void
}) {
  const [policies, setPolicies] = useState<BackendInsurancePolicy[]>([])
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  const [paymentType, setPaymentType] = useState<'cash' | 'insurance'>('cash')
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('')

  // Inline Add Policy form states
  const [showAddPolicy, setShowAddPolicy] = useState(false)
  const [insurerName, setInsurerName] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')
  const [savingPolicy, setSavingPolicy] = useState(false)

  const loadPolicies = async () => {
    setLoadingPolicies(true)
    try {
      const data = await receptionService.getInsurancePolicies(patient.id)
      setPolicies(data)
      // Auto-select the first active policy if any
      const active = data.filter((p) => p.is_active)
      if (active.length > 0) {
        setSelectedPolicyId(active[0].insurance_id)
        setPaymentType('insurance')
      } else {
        setPaymentType('cash')
      }
    } catch {
      toast.error('Failed to load insurance policies.')
    } finally {
      setLoadingPolicies(false)
    }
  }

  useEffect(() => {
    void loadPolicies()
  }, [patient.id])

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!insurerName.trim() || !policyNumber.trim()) {
      toast.error('Please enter insurer name and policy number.')
      return
    }
    setSavingPolicy(true)
    try {
      const newPolicy = await receptionService.addInsurancePolicy(patient.id, {
        insurer_name: insurerName.trim(),
        policy_number: policyNumber.trim(),
      })
      toast.success('Insurance policy registered!')
      setInsurerName('')
      setPolicyNumber('')
      setShowAddPolicy(false)
      // Reload policies and select new one
      const data = await receptionService.getInsurancePolicies(patient.id)
      setPolicies(data)
      setSelectedPolicyId(newPolicy.insurance_id)
      setPaymentType('insurance')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(detail ?? 'Failed to add insurance policy.')
    } finally {
      setSavingPolicy(false)
    }
  }

  return (
    <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
      <div className="p-md border-b border-border-subtle bg-surface-bright flex justify-between items-center gap-md">
        <div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0">
            Patient Found
          </h3>
          <p className="font-body-sm text-body-sm text-secondary m-0 mt-xs">Returning patient record</p>
        </div>
        <span className={`${STATUS_BADGE} ${genderBadgeClass(patient.gender)}`} style={{ textTransform: 'capitalize' }}>
          {patient.gender}
        </span>
      </div>

      <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-md">
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient Name</p>
          <p className="font-body-md text-body-md font-semibold text-on-surface m-0">{patient.full_name}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Patient #</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.patient_number}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">National ID</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.national_id ?? '—'}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Phone</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.phone_primary ?? '—'}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Date of Birth</p>
          <p className="font-body-md text-body-md text-on-surface m-0">{patient.date_of_birth}</p>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary uppercase m-0 mb-xs">Registered</p>
          <p className="font-body-md text-body-md text-on-surface m-0">
            {new Date(patient.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Payment Selection Section */}
      <div className="p-lg border-t border-border-subtle bg-surface-bright/50">
        <h4 className="font-label-md text-label-md text-secondary uppercase mb-sm m-0">Check-In Payment Option</h4>
        <div className="flex gap-md mb-md mt-sm">
          <label className="flex items-center gap-sm cursor-pointer font-body-sm text-body-sm m-0 text-on-surface">
            <input
              type="radio"
              name="search_payment_type"
              checked={paymentType === 'cash'}
              onChange={() => setPaymentType('cash')}
              className="text-primary focus:ring-primary w-4 h-4"
            />
            Cash / Private
          </label>
          <label className="flex items-center gap-sm cursor-pointer font-body-sm text-body-sm m-0 text-on-surface">
            <input
              type="radio"
              name="search_payment_type"
              checked={paymentType === 'insurance'}
              onChange={() => setPaymentType('insurance')}
              className="text-primary focus:ring-primary w-4 h-4"
            />
            Insurance
          </label>
        </div>

        {paymentType === 'insurance' && (
          <div className="space-y-sm mb-md mt-sm">
            {loadingPolicies ? (
              <p className="text-body-sm text-secondary animate-pulse m-0">Loading insurance policies...</p>
            ) : policies.length === 0 ? (
              <div className="p-md rounded-lg bg-warning/5 border border-warning/20 text-warning text-body-sm">
                No insurance policies registered for this patient.
              </div>
            ) : (
              <div>
                <label className="block text-label-sm font-label-sm text-secondary mb-xs uppercase">Select Insurance Policy</label>
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full h-10 px-md border border-border-subtle rounded-lg outline-none font-body-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose registered policy --</option>
                  {policies.map((p) => (
                    <option key={p.insurance_id} value={p.insurance_id}>
                      {p.insurer_name} (Policy: {p.policy_number}) — [{p.verification_status}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!showAddPolicy && (
              <button
                type="button"
                onClick={() => setShowAddPolicy(true)}
                className="text-primary hover:underline text-body-sm font-medium border-0 bg-transparent p-0 cursor-pointer flex items-center gap-xs mt-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span> Add New Policy
              </button>
            )}
          </div>
        )}

        {showAddPolicy && (
          <form onSubmit={handleAddPolicy} className="p-md bg-white rounded-lg border border-border-subtle space-y-md mb-md mt-sm">
            <div className="flex justify-between items-center pb-xs border-b border-border-subtle">
              <span className="font-label-md text-label-md font-semibold text-on-surface">Add Insurance Policy</span>
              <button
                type="button"
                onClick={() => setShowAddPolicy(false)}
                className="text-secondary hover:text-on-surface border-0 bg-transparent cursor-pointer font-body-sm font-medium"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className="block text-label-sm font-label-sm text-secondary mb-xs uppercase">Insurer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jubilee Insurance"
                  value={insurerName}
                  onChange={(e) => setInsurerName(e.target.value)}
                  className="w-full h-10 px-md border border-border-subtle rounded-lg outline-none font-body-sm bg-white"
                  list="insurer-suggestions"
                />
                <datalist id="insurer-suggestions">
                  <option value="Aetna International" />
                  <option value="BlueCross BlueShield" />
                  <option value="Cigna Healthcare" />
                  <option value="Jubilee Insurance" />
                  <option value="NHIF" />
                </datalist>
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-secondary mb-xs uppercase">Policy Number</label>
                <input
                  type="text"
                  placeholder="e.g. POL-1002"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full h-10 px-md border border-border-subtle rounded-lg outline-none font-body-sm bg-white"
                />
              </div>
            </div>
            <div className="flex justify-end pt-xs">
              <button
                type="submit"
                disabled={savingPolicy}
                className="px-md h-8 bg-primary-container text-white text-body-sm rounded-md font-medium hover:opacity-90 transition-opacity border-0 cursor-pointer disabled:opacity-60"
              >
                {savingPolicy ? 'Saving...' : 'Register Policy'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-lg border-t border-border-subtle bg-surface-bright flex flex-wrap gap-sm">
        <button
          type="button"
          onClick={() => onCheckIn(paymentType, selectedPolicyId || undefined)}
          disabled={checkingIn || (paymentType === 'insurance' && !selectedPolicyId)}
          className="h-10 px-lg rounded font-body-sm text-body-sm font-semibold text-white bg-primary-container hover:bg-primary transition-colors border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-sm"
        >
          {checkingIn && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
          Check In to Queue
        </button>
        <button
          type="button"
          onClick={onViewQueue}
          className="h-10 px-lg rounded font-body-sm text-body-sm font-semibold text-white bg-success/80 hover:bg-success transition-colors border-0 cursor-pointer"
        >
          View Queue
        </button>
        <button
          type="button"
          onClick={onViewDetails}
          className="h-10 px-lg rounded font-body-sm text-body-sm font-medium text-secondary border border-border-subtle bg-white hover:bg-surface-container-low transition-colors cursor-pointer"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

function SearchResultsTable({
  results,
  onSelect,
}: {
  results: BackendPatient[]
  onSelect: (patient: BackendPatient) => void
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
              <th className={TH_CLASS}>Date of Birth</th>
              <th className={`${TH_CLASS} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {results.map((patient) => (
              <tr key={patient.id} className="hover:bg-hover-tint transition-colors">
                <td className="py-md px-md font-body-sm text-body-sm font-semibold text-on-surface">
                  {patient.full_name}
                </td>
                <td className={TD_MUTED}>{patient.patient_number}</td>
                <td className={TD_MUTED}>{patient.national_id ?? '—'}</td>
                <td className={TD_MUTED}>{patient.phone_primary ?? '—'}</td>
                <td className={TD_MUTED}>{patient.date_of_birth}</td>
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
        Enter the patient's <span className="font-semibold text-on-surface">National ID / Passport #</span>,{' '}
        <span className="font-semibold text-on-surface">Contact Phone Number</span>, or{' '}
        <span className="font-semibold text-on-surface">Full Name</span> to look up their record and check them in.
      </p>
    </div>
  )
}

export function PatientSearchPage() {
  const navigate = useNavigate()

  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [activeField, setActiveField] = useState<ActiveField>('id')
  const [hasSearched, setHasSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [searchState, setSearchState] = useState<SearchState | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<BackendPatient | null>(null)
  const [detailPatient, setDetailPatient] = useState<BackendPatient | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSelectedPatient(null)

    const term = activeField === 'id' ? nationalId : activeField === 'phone' ? phone : name
    if (!term.trim()) {
      toast.error('Enter a National ID, phone number, or patient name to search.')
      return
    }

    setSearching(true)
    try {
      const response = await receptionService.searchPatients(term.trim())
      const results = response.patients
      setSearchState({ results, field: activeField, term: term.trim() })
      setHasSearched(true)
      if (results.length === 1) {
        setSelectedPatient(results[0])
      }
    } catch {
      toast.error('Search failed. Please check your connection and try again.')
    } finally {
      setSearching(false)
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

  const handleCheckIn = async (
    patient: BackendPatient,
    paymentType: 'cash' | 'insurance',
    insuranceId?: string
  ) => {
    setCheckingIn(true)
    try {
      const result = await receptionService.createVisit({
        patient_id: patient.id,
        visit_type: 'outpatient',
        payment_type: paymentType,
        insurance_id: insuranceId || undefined,
      })
      toast.success(
        `${patient.full_name} checked in — Queue Position ${result.queue.queue_number}`
      )
      navigate('/reception/queue')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(detail ?? 'Check-in failed. Please try again.')
    } finally {
      setCheckingIn(false)
    }
  }

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
              disabled={searching}
              className="w-full h-10 bg-primary-container text-on-primary rounded font-medium hover:bg-primary transition-colors flex items-center justify-center border-0 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {searching
                ? <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-[20px]">search</span>
              }
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
          key={displayPatient.id}
          patient={displayPatient}
          checkingIn={checkingIn}
          onCheckIn={(payType, insId) => handleCheckIn(displayPatient, payType, insId)}
          onViewQueue={() => navigate('/reception/queue')}
          onViewDetails={() => setDetailPatient(displayPatient)}
        />
      )}

      {detailPatient && (
        <PatientDetailModal patient={detailPatient} onClose={() => setDetailPatient(null)} />
      )}
    </div>
  )
}
