import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { receptionService } from '@/api/services/reception'
import type { BackendPatient } from '@/api/types/reception'

const FIELD_LABEL = 'block font-label-md text-label-md text-secondary mb-xs uppercase'
const INLINE_ERROR = 'text-error font-label-sm text-label-sm font-semibold mt-xs m-0'

const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234f5f7b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundPosition: 'right 8px center',
  backgroundRepeat: 'no-repeat' as const,
}

type FormField =
  | 'fullName'
  | 'dob'
  | 'gender'
  | 'nationalId'
  | 'phone'
  | 'nokName'
  | 'nokRelationship'
  | 'nokPhone'
  | 'policyNumber'

type FormErrors = Partial<Record<FormField, string>>

function fieldInputClass(hasError: boolean) {
  return `w-full h-10 px-md border rounded-lg outline-none transition-all font-body-md bg-white ${
    hasError
      ? 'border-error focus:ring-1 focus:ring-error'
      : 'border-border-subtle focus:ring-1 focus:ring-primary focus:border-primary'
  }`
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className={FIELD_LABEL}>
      {children}
      <span className="text-error font-semibold ml-0.5" aria-hidden>
        *
      </span>
    </label>
  )
}

function InlineError({ message }: { message?: string }) {
  if (!message) return null
  return <p className={INLINE_ERROR}>{message}</p>
}

export function PatientRegistrationPage() {
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('Select Gender')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [nokName, setNokName] = useState('')
  const [nokRelationship, setNokRelationship] = useState('Select Relationship')
  const [nokPhone, setNokPhone] = useState('')

  const [paymentType, setPaymentType] = useState<'cash' | 'insurance'>('insurance')
  const [insurerName, setInsurerName] = useState('')
  const [policyNumber, setPolicyNumber] = useState('')

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // Duplicate Check States
  const [duplicatePatient, setDuplicatePatient] = useState<BackendPatient | null>(null)
  const [duplicateQueueStatus, setDuplicateQueueStatus] = useState<string | null>(null)
  const [duplicateQueueNumber, setDuplicateQueueNumber] = useState<string | null>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

  const visitSetupRef = useRef<HTMLDivElement>(null)

  const scrollToVisitSetup = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    visitSetupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const clearError = (field: FormField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validateForm = (): FormErrors => {
    const next: FormErrors = {}

    if (!fullName.trim()) next.fullName = 'Full name is required'
    if (!dob) {
      next.dob = 'Date of birth is required'
    } else {
      const selectedDate = new Date(dob)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate > today) {
        next.dob = 'Date of birth cannot be in the future'
      }
    }
    if (gender === 'Select Gender') next.gender = 'Please select a gender'
    if (!phone.trim()) next.phone = 'Contact phone is required'
    if (!nokName.trim()) next.nokName = 'Next of kin full name is required'
    if (nokRelationship === 'Select Relationship') {
      next.nokRelationship = 'Please select a relationship'
    }
    if (!nokPhone.trim()) next.nokPhone = 'Next of kin phone number is required'
    if (paymentType === 'insurance' && !policyNumber.trim()) {
      next.policyNumber = 'Policy number is required'
    }

    return next
  }

  const handleNationalIdCheck = async () => {
    const trimmed = nationalId.trim()
    if (!trimmed) {
      setDuplicatePatient(null)
      setDuplicateQueueStatus(null)
      setDuplicateQueueNumber(null)
      return
    }

    setCheckingDuplicate(true)
    try {
      const response = await receptionService.searchPatients(trimmed)
      const results = response.patients
      
      const exactMatch = results.find(
        (p) => p.national_id?.toLowerCase() === trimmed.toLowerCase()
      )

      if (exactMatch) {
        setDuplicatePatient(exactMatch)
        
        // Auto-populate patient details
        setFullName(exactMatch.full_name || '')
        setDob(exactMatch.date_of_birth || '')
        
        if (exactMatch.gender) {
          const capitalizedGender = exactMatch.gender.charAt(0).toUpperCase() + exactMatch.gender.slice(1).toLowerCase()
          setGender(capitalizedGender)
        } else {
          setGender('Select Gender')
        }
        
        setPhone(exactMatch.phone_primary || '')
        setEmail(exactMatch.email || '')
        setNokName(exactMatch.next_of_kin_name || '')
        
        if (exactMatch.next_of_kin_relationship) {
          const capitalizedNokRel = exactMatch.next_of_kin_relationship.charAt(0).toUpperCase() + exactMatch.next_of_kin_relationship.slice(1).toLowerCase()
          setNokRelationship(capitalizedNokRel)
        } else {
          setNokRelationship('Select Relationship')
        }
        
        setNokPhone(exactMatch.next_of_kin_phone || '')
        setErrors({})
        
        try {
          const activeStatus = await receptionService.getActiveVisit(exactMatch.id)
          if (activeStatus.active) {
            const qStatus = activeStatus.queue_status?.toLowerCase()
            const qType = activeStatus.queue_type?.toLowerCase()

            if (qType === 'triage' && (qStatus === 'waiting' || qStatus === 'in_progress')) {
              setDuplicateQueueStatus(qStatus)
            } else {
              setDuplicateQueueStatus('in_consultation')
            }
            setDuplicateQueueNumber(activeStatus.queue_number || null)
          } else {
            setDuplicateQueueStatus(null)
            setDuplicateQueueNumber(null)
          }
        } catch (queueErr) {
          console.error('Failed to verify active queue status for duplicate', queueErr)
        }
      } else {
        setDuplicatePatient(null)
        setDuplicateQueueStatus(null)
        setDuplicateQueueNumber(null)
      }
    } catch (err) {
      console.error('Failed to check duplicate National ID', err)
    } finally {
      setCheckingDuplicate(false)
    }
  }

  const handleCheckInDuplicate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!duplicatePatient) return

    // Run full validation to verify any edited patient details as well as check-in policy
    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setTimeout(() => {
        const el = document.querySelector('[aria-invalid="true"]')
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (el instanceof HTMLElement) el.focus()
      }, 50)
      return
    }

    setSubmitting(true)
    try {
      // Check if any details changed and call updatePatient if so
      const genderValue = gender.toLowerCase() as 'male' | 'female' | 'other'
      const nokRelationValue = nokRelationship !== 'Select Relationship'
        ? nokRelationship.toLowerCase()
        : undefined

      const hasChanges =
        fullName.trim() !== (duplicatePatient.full_name || '') ||
        dob !== (duplicatePatient.date_of_birth || '') ||
        genderValue !== (duplicatePatient.gender?.toLowerCase() || '') ||
        phone.trim() !== (duplicatePatient.phone_primary || '') ||
        email.trim() !== (duplicatePatient.email || '') ||
        nokName.trim() !== (duplicatePatient.next_of_kin_name || '') ||
        (nokRelationValue || '') !== (duplicatePatient.next_of_kin_relationship?.toLowerCase() || '') ||
        nokPhone.trim() !== (duplicatePatient.next_of_kin_phone || '')

      if (hasChanges) {
        await receptionService.updatePatient(duplicatePatient.id, {
          full_name: fullName.trim(),
          date_of_birth: dob,
          gender: genderValue,
          phone_primary: phone.trim() || null,
          email: email.trim() || null,
          next_of_kin_name: nokName.trim() || null,
          next_of_kin_relationship: nokRelationValue || null,
          next_of_kin_phone: nokPhone.trim() || null,
        })
        toast.success('Patient details updated successfully!')
      }

      let activePolicyId = undefined
      if (paymentType === 'insurance' && policyNumber.trim()) {
        const newPolicy = await receptionService.addInsurancePolicy(duplicatePatient.id, {
          insurer_name: insurerName,
          policy_number: policyNumber.trim(),
        })
        activePolicyId = newPolicy.insurance_id
      }

      const result = await receptionService.createVisit({
        patient_id: duplicatePatient.id,
        visit_type: 'outpatient',
        payment_type: paymentType,
        insurance_id: activePolicyId,
      })

      toast.success(
        `${fullName.trim()} checked in — Queue Position ${result.queue.queue_number}`
      )
      navigate('/reception/queue')
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(detail ?? 'Check-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setTimeout(() => {
        const firstInvalidEl = document.querySelector('[aria-invalid="true"]')
        if (firstInvalidEl) {
          firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
          if (firstInvalidEl instanceof HTMLElement) {
            firstInvalidEl.focus()
          }
        }
      }, 50)
      return
    }

    setSubmitting(true)
    try {
      const genderValue = gender.toLowerCase() as 'male' | 'female' | 'other'

      const result = await receptionService.registerAndVisit({
        patient: {
          full_name: fullName.trim(),
          date_of_birth: dob,
          gender: genderValue,
          national_id: nationalId.trim() || undefined,
          phone_primary: phone.trim() || undefined,
          email: email.trim() || undefined,
          next_of_kin_name: nokName.trim() || undefined,
          next_of_kin_relationship: nokRelationship !== 'Select Relationship'
            ? nokRelationship.toLowerCase()
            : undefined,
          next_of_kin_phone: nokPhone.trim() || undefined,
        },
        visit: {
          visit_type: 'outpatient',
          payment_type: paymentType,
        },
        insurance: paymentType === 'insurance'
          ? {
              insurer_name: insurerName,
              policy_number: policyNumber.trim(),
            }
          : undefined,
      })

      const queueNumber = result.visit.queue?.queue_number ?? 'assigned'
      toast.success(`Patient registered — Triage Queue Position ${queueNumber}`)
      setTimeout(() => {
        navigate('/reception/queue')
      }, 1500)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      
      if (detail) {
        const detailLower = detail.toLowerCase()
        if (detailLower.includes('national id') || detailLower.includes('already exists')) {
          setErrors((prev) => ({ ...prev, nationalId: 'A patient with this National ID already exists' }))
          toast.error('Duplicate National ID — patient already registered.')
          
          setTimeout(() => {
            const el = document.querySelector('[aria-invalid="true"]')
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            if (el instanceof HTMLElement) el.focus()
          }, 50)
          return
        }

        // Map backend validation errors (joined as a string) back to inline fields
        const newErrors: FormErrors = {}
        let hasMappedErrors = false
        const parts = detail.split(',')
        parts.forEach(part => {
          const colonIndex = part.indexOf(':')
          if (colonIndex !== -1) {
            const fieldPath = part.slice(0, colonIndex).trim()
            const errorMsg = part.slice(colonIndex + 1).trim()

            if (fieldPath.includes('date_of_birth')) {
              newErrors.dob = errorMsg
              hasMappedErrors = true
            } else if (fieldPath.includes('full_name')) {
              newErrors.fullName = errorMsg
              hasMappedErrors = true
            } else if (fieldPath.includes('gender')) {
              newErrors.gender = errorMsg
              hasMappedErrors = true
            } else if (fieldPath.includes('phone_primary')) {
              newErrors.phone = errorMsg
              hasMappedErrors = true
            } else if (fieldPath.includes('national_id')) {
              newErrors.nationalId = errorMsg
              hasMappedErrors = true
            } else if (fieldPath.includes('policy_number')) {
              newErrors.policyNumber = errorMsg
              hasMappedErrors = true
            }
          }
        })

        if (hasMappedErrors) {
          setErrors((prev) => ({ ...prev, ...newErrors }))
          toast.error('Validation failed. Please correct the fields marked in red.')
          
          setTimeout(() => {
            const el = document.querySelector('[aria-invalid="true"]')
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            if (el instanceof HTMLElement) el.focus()
          }, 50)
          return
        }
      }

      toast.error(detail ?? 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-[720px] mx-auto px-gutter pb-48 lg:pb-36">
      <div className="mb-lg flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-on-surface m-0">Register New Patient</h2>
      </div>

      <form
        onSubmit={
          duplicatePatient
            ? (duplicateQueueStatus
              ? (e) => e.preventDefault()
              : handleCheckInDuplicate)
            : handleSave
        }
        noValidate
        className="space-y-lg"
      >
        <section className="bg-surface-white border border-border-subtle rounded-xl p-lg shadow-sm">
          <div className="flex items-center mb-md pb-sm border-b border-surface-container">
            <span
              className="material-symbols-outlined text-primary mr-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
            <h3 className="font-headline-sm text-headline-sm m-0">Patient Information</h3>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div className="col-span-2">
              <RequiredLabel>Full Name</RequiredLabel>
              <input
                className={fieldInputClass(Boolean(errors.fullName))}
                placeholder="e.g. John Doe"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  clearError('fullName')
                }}
                aria-invalid={Boolean(errors.fullName)}
                disabled={Boolean(duplicateQueueStatus)}
              />
              <InlineError message={errors.fullName} />
            </div>
            <div>
              <RequiredLabel>Date of Birth</RequiredLabel>
              <input
                className={fieldInputClass(Boolean(errors.dob))}
                type="date"
                max={new Date().toLocaleDateString('en-CA')}
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value)
                  clearError('dob')
                }}
                aria-invalid={Boolean(errors.dob)}
                disabled={Boolean(duplicateQueueStatus)}
              />
              <InlineError message={errors.dob} />
            </div>
            <div>
              <RequiredLabel>Gender</RequiredLabel>
              <select
                className={`${fieldInputClass(Boolean(errors.gender))} appearance-none bg-no-repeat bg-right`}
                style={selectChevronStyle}
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value)
                  clearError('gender')
                }}
                aria-invalid={Boolean(errors.gender)}
                disabled={Boolean(duplicateQueueStatus)}
              >
                <option>Select Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <InlineError message={errors.gender} />
            </div>
            <div>
              <label className={`${FIELD_LABEL} flex items-center gap-xs`}>
                National ID / Passport # (Optional)
                {checkingDuplicate && (
                  <span className="material-symbols-outlined text-[14px] text-primary animate-spin">
                    progress_activity
                  </span>
                )}
              </label>
              <input
                className={fieldInputClass(Boolean(errors.nationalId || duplicatePatient))}
                type="text"
                value={nationalId}
                onChange={(e) => {
                  setNationalId(e.target.value)
                  clearError('nationalId')
                  if (duplicatePatient) {
                    setDuplicatePatient(null)
                    setDuplicateQueueStatus(null)
                    setDuplicateQueueNumber(null)
                  }
                }}
                onBlur={handleNationalIdCheck}
                aria-invalid={Boolean(errors.nationalId || duplicatePatient)}
              />
              <InlineError message={errors.nationalId} />
              {duplicatePatient && (
                <div className="text-warning font-label-sm text-label-sm font-semibold mt-xs flex items-center flex-wrap gap-xs">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>
                    Patient &quot;{duplicatePatient.full_name}&quot; already exists
                    {duplicateQueueNumber ? ` (Queue #${duplicateQueueNumber})` : ''}.
                  </span>
                  {duplicateQueueStatus ? (
                    <button
                      type="button"
                      onClick={() => navigate('/reception/queue')}
                      className="text-primary hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer text-label-sm inline-flex items-center gap-xs"
                    >
                      [View in Queue]
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={scrollToVisitSetup}
                      className="text-primary hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer text-label-sm inline-flex items-center gap-xs"
                    >
                      [Check In Now]
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <RequiredLabel>Contact Phone</RequiredLabel>
              <input
                className={fieldInputClass(Boolean(errors.phone))}
                placeholder="e.g. 0712 345 678"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  clearError('phone')
                }}
                aria-invalid={Boolean(errors.phone)}
                disabled={Boolean(duplicateQueueStatus)}
              />
              <InlineError message={errors.phone} />
            </div>
            <div className="col-span-2">
              <label className={FIELD_LABEL}>Contact Email (Optional)</label>
              <input
                className={fieldInputClass(false)}
                placeholder="email@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={Boolean(duplicateQueueStatus)}
              />
            </div>
          </div>
        </section>

        <section className="bg-surface-white border border-border-subtle rounded-xl p-lg shadow-sm">
          <div className="flex items-center mb-md pb-sm border-b border-surface-container">
            <span
              className="material-symbols-outlined text-primary mr-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              family_restroom
            </span>
            <h3 className="font-headline-sm text-headline-sm m-0">Next of Kin</h3>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div className="col-span-2">
              <RequiredLabel>Full Name</RequiredLabel>
              <input
                className={fieldInputClass(Boolean(errors.nokName))}
                type="text"
                value={nokName}
                onChange={(e) => {
                  setNokName(e.target.value)
                  clearError('nokName')
                }}
                aria-invalid={Boolean(errors.nokName)}
                disabled={Boolean(duplicateQueueStatus)}
              />
              <InlineError message={errors.nokName} />
            </div>
            <div>
              <RequiredLabel>Relationship</RequiredLabel>
              <select
                className={`${fieldInputClass(Boolean(errors.nokRelationship))} appearance-none`}
                style={selectChevronStyle}
                value={nokRelationship}
                onChange={(e) => {
                  setNokRelationship(e.target.value)
                  clearError('nokRelationship')
                }}
                aria-invalid={Boolean(errors.nokRelationship)}
                disabled={Boolean(duplicateQueueStatus)}
              >
                <option>Select Relationship</option>
                <option>Spouse</option>
                <option>Parent</option>
                <option>Sibling</option>
                <option>Guardian</option>
              </select>
              <InlineError message={errors.nokRelationship} />
            </div>
            <div>
              <RequiredLabel>Phone Number</RequiredLabel>
              <input
                className={fieldInputClass(Boolean(errors.nokPhone))}
                type="tel"
                value={nokPhone}
                onChange={(e) => {
                  setNokPhone(e.target.value)
                  clearError('nokPhone')
                }}
                aria-invalid={Boolean(errors.nokPhone)}
                disabled={Boolean(duplicateQueueStatus)}
              />
              <InlineError message={errors.nokPhone} />
            </div>
          </div>
        </section>

        <section ref={visitSetupRef} className="bg-surface-white border border-border-subtle rounded-xl p-lg shadow-sm">
          <div className="flex items-center mb-md pb-sm border-b border-surface-container">
            <span
              className="material-symbols-outlined text-primary mr-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              payments
            </span>
            <h3 className="font-headline-sm text-headline-sm m-0">Visit Setup</h3>
          </div>
          <label className={`${FIELD_LABEL} mb-md`}>Payment Type</label>
          <div className="grid grid-cols-2 gap-md mb-lg">
            <label
              className={`relative flex items-center p-md border rounded-xl transition-colors ${
                duplicateQueueStatus ? 'cursor-not-allowed opacity-60 border-border-subtle bg-surface-container-low' : 'cursor-pointer hover:bg-surface-container-low'
              } ${
                paymentType === 'cash' && !duplicateQueueStatus ? 'border-2 border-primary bg-hover-tint' : 'border-border-subtle bg-white'
              }`}
            >
              <input
                className="w-4 h-4 text-primary focus:ring-primary border-border-subtle disabled:opacity-50"
                name="payment_type"
                type="radio"
                checked={paymentType === 'cash'}
                disabled={Boolean(duplicateQueueStatus)}
                onChange={() => {
                  setPaymentType('cash')
                  clearError('policyNumber')
                }}
              />
              <div className="ml-md">
                <span
                  className={`block font-body-md font-semibold ${paymentType === 'cash' ? 'text-primary' : 'text-on-surface'}`}
                >
                  Cash / Private
                </span>
                <span className="text-label-sm text-secondary">Pay at counter</span>
              </div>
              {paymentType === 'cash' && (
                <span
                  className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              )}
            </label>

            <label
              className={`relative flex items-center p-md border rounded-xl transition-colors ${
                duplicateQueueStatus ? 'cursor-not-allowed opacity-60 border-border-subtle bg-surface-container-low' : 'cursor-pointer hover:bg-surface-container-low'
              } ${
                paymentType === 'insurance' && !duplicateQueueStatus ? 'border-2 border-primary bg-hover-tint' : 'border-border-subtle bg-white'
              }`}
            >
              <input
                className="w-4 h-4 text-primary focus:ring-primary border-border-subtle disabled:opacity-50"
                name="payment_type"
                type="radio"
                checked={paymentType === 'insurance'}
                disabled={Boolean(duplicateQueueStatus)}
                onChange={() => setPaymentType('insurance')}
              />
              <div className="ml-md">
                <span
                  className={`block font-body-md font-semibold ${paymentType === 'insurance' ? 'text-primary' : 'text-on-surface'}`}
                >
                  Insurance
                </span>
                <span className="text-label-sm text-secondary">Corporate coverage</span>
              </div>
              {paymentType === 'insurance' && (
                <span
                  className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              )}
            </label>
          </div>

          {paymentType === 'insurance' && (
            <div className="p-md bg-surface-container-lowest rounded-lg border border-border-subtle space-y-md">
              <div className="grid grid-cols-2 gap-md">
                <div className="col-span-2">
                  <label className={FIELD_LABEL}>Insurer Name</label>
                  <input
                    type="text"
                    placeholder="Enter or select insurer (e.g. Jubilee Insurance)"
                    className={fieldInputClass(false)}
                    value={insurerName}
                    onChange={(e) => setInsurerName(e.target.value)}
                    disabled={Boolean(duplicateQueueStatus)}
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
                <div className="col-span-2">
                  <RequiredLabel>Policy Number</RequiredLabel>
                  <input
                    className={fieldInputClass(Boolean(errors.policyNumber))}
                    placeholder="e.g. PN-129302"
                    type="text"
                    value={policyNumber}
                    onChange={(e) => {
                      setPolicyNumber(e.target.value)
                      clearError('policyNumber')
                    }}
                    aria-invalid={Boolean(errors.policyNumber)}
                    disabled={Boolean(duplicateQueueStatus)}
                  />
                  <InlineError message={errors.policyNumber} />
                </div>
              </div>
            </div>
          )}

          {duplicatePatient ? (
            duplicateQueueStatus ? (
              <div className="mt-lg p-md bg-error/5 border border-error/20 rounded-lg flex items-center">
                <span className="material-symbols-outlined text-error mr-md">info</span>
                <p className="font-body-md text-error font-medium m-0">
                  Patient <strong>{duplicatePatient.full_name}</strong> has an active visit today (status: {duplicateQueueStatus === 'in_consultation' ? 'With Doctor' : duplicateQueueStatus === 'in_progress' ? 'In Triage' : 'Waiting in Triage'}). You can view their details on the queue page.
                </p>
              </div>
            ) : (
              <div className="mt-lg p-md bg-warning/5 border border-warning/20 rounded-lg flex items-center">
                <span className="material-symbols-outlined text-warning mr-md">info</span>
                <p className="font-body-md text-on-surface font-medium m-0">
                  Patient <strong>{duplicatePatient.full_name}</strong> is already registered. Choose Cash or fill in their Insurance Details below to check them into the queue.
                </p>
              </div>
            )
          ) : (
            <div className="mt-lg p-md bg-hover-tint border border-primary-container/20 rounded-lg flex items-center">
              <span className="material-symbols-outlined text-primary mr-md">assignment_ind</span>
              <p className="font-body-md text-primary font-medium m-0">
                Patient {fullName.trim() ? <strong>{fullName.trim()}</strong> : 'record'} will be registered and routed to the next available Triage Queue position.
              </p>
            </div>
          )}
        </section>

        <footer className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-auto lg:right-0 w-full lg:w-[calc(100%-240px)] bg-surface-white border-t border-border-subtle px-lg py-md z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="max-w-[720px] mx-auto flex flex-col items-center">
            <div className="flex items-center justify-between w-full gap-md">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-lg h-10 rounded-lg border border-border-subtle text-secondary font-headline-sm hover:bg-surface-container-low transition-colors bg-white cursor-pointer"
              >
                Cancel
              </button>
              {duplicatePatient ? (
                duplicateQueueStatus ? (
                  <button
                    type="button"
                    onClick={() => navigate('/reception/queue')}
                    className="bg-success text-white px-xl h-10 rounded-lg font-headline-sm flex items-center hover:opacity-90 transition-all shadow-sm border-0 cursor-pointer"
                  >
                    <span>View in Queue</span>
                    <span className="material-symbols-outlined ml-sm text-[20px]">chevron_right</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary-container text-on-primary px-xl h-10 rounded-lg font-headline-sm flex items-center hover:opacity-90 transition-all shadow-sm border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined ml-sm text-[20px] animate-spin">progress_activity</span>
                        <span className="ml-sm">Checking In...</span>
                      </>
                    ) : (
                      <>
                        <span>Check In {duplicatePatient.full_name.split(' ')[0]}</span>
                        <span className="material-symbols-outlined ml-sm text-[20px]">chevron_right</span>
                      </>
                    )}
                  </button>
                )
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary-container text-on-primary px-xl h-10 rounded-lg font-headline-sm flex items-center hover:opacity-90 transition-all shadow-sm border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined ml-sm text-[20px] animate-spin">progress_activity</span>
                      <span className="ml-sm">Registering...</span>
                    </>
                  ) : (
                    <>
                      <span>Save &amp; Assign to Queue</span>
                      <span className="material-symbols-outlined ml-sm text-[20px]">chevron_right</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </footer>
      </form>
    </div>
  )
}
