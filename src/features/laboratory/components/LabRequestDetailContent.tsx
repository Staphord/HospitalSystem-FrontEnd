import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { laboratoryService, type BackendLabRequestDetail } from '@/api/services/laboratory'

export function LabRequestDetailContent() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<BackendLabRequestDetail | null>(null)

  // Result entry state
  const [resultValue, setResultValue] = useState('')
  const [unit, setUnit] = useState('')
  const [referenceRange, setReferenceRange] = useState('')
  const [isCritical, setIsCritical] = useState(false)
  const [resultNotes, setResultNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [billing, setBilling] = useState(false)
  const [billCreated, setBillCreated] = useState(false)

  const loadDetail = async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const data = await laboratoryService.getRequestDetail(requestId)
      setDetail(data)
      if (data.result) {
        setResultValue(data.result.result_value || '')
        setUnit(data.result.unit || '')
        setReferenceRange(data.result.reference_range || '')
        setIsCritical(data.result.is_critical || false)
      }
    } catch (err: any) {
      toast.error('Failed to load lab request detail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [requestId])

  if (!requestId) {
    return <Navigate to="/laboratory/requests" replace />
  }

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg animate-pulse">
        <div className="h-10 bg-surface-container rounded w-1/4" />
        <div className="h-64 bg-surface-white border border-border-subtle rounded-xl" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="max-w-container-max mx-auto w-full p-xl text-center">
        <h3 className="font-headline-sm text-on-surface mb-sm">Lab Request Not Found</h3>
        <Link to="/laboratory/requests" className="text-primary hover:underline font-label-md">
          Return to requests list
        </Link>
      </div>
    )
  }

  const isVerified = detail.result?.status === 'verified' || detail.status === 'completed'
  const hasResult = !!detail.result

  const handleSaveResult = async () => {
    if (!resultValue.trim()) {
      toast.error('Please enter a result value')
      return
    }

    setSubmitting(true)
    try {
      if (hasResult) {
        await laboratoryService.updateResult(detail.request_id, {
          result_value: resultValue,
          unit,
          reference_range: referenceRange,
          is_critical: isCritical,
          result_notes: resultNotes,
        })
        toast.success('Result updated successfully')
      } else {
        await laboratoryService.createResult(detail.request_id, {
          result_value: resultValue,
          unit,
          reference_range: referenceRange,
          is_critical: isCritical,
          result_notes: resultNotes,
          specimen_type: detail.specimen?.specimen_type || 'blood',
        })
        toast.success('Result created successfully')
      }
      await loadDetail()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save result')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyResult = async () => {
    if (!detail.result?.result_id) {
      toast.error('Result must be saved before verification')
      return
    }

    setVerifying(true)
    try {
      await laboratoryService.verifyResult(detail.result.result_id)
      toast.success('Result verified and locked successfully')
      await loadDetail()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to verify result')
    } finally {
      setVerifying(false)
    }
  }

  const handleGenerateBill = async () => {
    setBilling(true)
    try {
      await laboratoryService.createBill(detail.request_id, {
        unit_price: 15000,
        description: `Lab Charge: ${detail.test_name}`,
      })
      toast.success('Billing item generated successfully')
      setBillCreated(true)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate bill item')
    } finally {
      setBilling(false)
    }
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <Link
            to="/laboratory/requests"
            className="p-xs hover:bg-surface-container rounded-md text-secondary transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-sm">
              <h1 className="font-headline-md text-headline-md text-on-surface m-0">
                {detail.test_name}
              </h1>
              {detail.test_code && (
                <span className="font-mono text-body-sm text-secondary bg-surface-container px-xs py-0.5 rounded">
                  {detail.test_code}
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-secondary m-0">
              Request ID: <span className="font-mono text-on-surface">{detail.request_id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <span
            className={`px-md py-xs rounded-full text-label-md font-label-md capitalize ${
              detail.status === 'completed'
                ? 'bg-success/10 text-success border border-success/30'
                : detail.status === 'in_progress' || detail.status === 'specimen_collected'
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-warning/10 text-warning border border-warning/30'
            }`}
          >
            Status: {detail.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column: Dossier Details */}
        <div className="lg:col-span-1 flex flex-col gap-md">
          {/* Patient Card */}
          <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-sm">
            <h3 className="font-headline-xs text-on-surface m-0 border-b border-border-subtle pb-xs">
              Patient Information
            </h3>
            <div className="flex flex-col gap-xs text-body-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Full Name:</span>
                <span className="font-medium text-on-surface">{detail.patient.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Patient No:</span>
                <span className="font-mono font-medium text-on-surface">{detail.patient.patient_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Gender:</span>
                <span className="capitalize text-on-surface">{detail.patient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Date of Birth:</span>
                <span className="text-on-surface">{detail.patient.date_of_birth}</span>
              </div>
            </div>
          </div>

          {/* Order Meta Card */}
          <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-sm">
            <h3 className="font-headline-xs text-on-surface m-0 border-b border-border-subtle pb-xs">
              Order Details
            </h3>
            <div className="flex flex-col gap-xs text-body-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Urgency:</span>
                <span className="capitalize font-bold text-error">{detail.urgency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Requested By:</span>
                <span className="font-medium text-on-surface">{detail.requested_by_name || 'Doctor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary">Requested At:</span>
                <span className="text-on-surface">
                  {detail.requested_at ? new Date(detail.requested_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              {detail.clinical_indication && (
                <div className="mt-xs pt-xs border-t border-border-subtle">
                  <span className="text-secondary block mb-1">Clinical Indication:</span>
                  <p className="text-on-surface bg-surface-container/50 p-xs rounded m-0 text-body-xs italic">
                    "{detail.clinical_indication}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active Specimen Card */}
          <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col gap-sm">
            <h3 className="font-headline-xs text-on-surface m-0 border-b border-border-subtle pb-xs flex items-center justify-between">
              <span>Specimen Status</span>
              {detail.specimen && (
                <span className="text-body-xs font-mono text-primary bg-primary/10 px-xs py-0.5 rounded">
                  {detail.specimen.specimen_type}
                </span>
              )}
            </h3>
            {detail.specimen ? (
              <div className="flex flex-col gap-xs text-body-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Status:</span>
                  <span className="capitalize font-medium text-primary">{detail.specimen.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Collected At:</span>
                  <span className="text-on-surface">
                    {new Date(detail.specimen.collected_at).toLocaleString()}
                  </span>
                </div>
                {detail.specimen.received_at && (
                  <div className="flex justify-between">
                    <span className="text-secondary">Received At:</span>
                    <span className="text-on-surface">
                      {new Date(detail.specimen.received_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-body-sm text-secondary italic">
                No active specimen collected yet.
                <button
                  type="button"
                  onClick={() => navigate('/laboratory/specimens', { state: { requestId: detail.request_id, openModal: true } })}
                  className="mt-xs text-primary font-label-md hover:underline block cursor-pointer"
                >
                  + Collect Specimen Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Result Entry & Verification Panel */}
        <div className="lg:col-span-2 flex flex-col gap-md">
          <div className="bg-surface-white border border-border-subtle rounded-xl p-lg flex flex-col gap-md">
            <div className="flex items-center justify-between border-b border-border-subtle pb-sm">
              <div>
                <h2 className="font-headline-sm text-on-surface m-0">Test Result Entry</h2>
                <p className="text-body-sm text-secondary m-0">
                  {isVerified ? 'Result has been verified and locked.' : 'Enter diagnostic values and observations.'}
                </p>
              </div>

              {detail.result && (
                <span className={`px-sm py-xs rounded text-label-sm font-label-sm uppercase ${
                  detail.result.status === 'verified' ? 'bg-success/10 text-success border border-success/30' : 'bg-primary/10 text-primary border border-primary/30'
                }`}>
                  {detail.result.status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-on-surface">Result Value *</label>
                <input
                  type="text"
                  disabled={isVerified}
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  placeholder="e.g. 14.2 or Positive"
                  className="h-10 px-sm border border-border-subtle rounded-lg text-body-md font-medium text-on-surface focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-surface-container"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-sm text-on-surface">Unit (e.g. g/dL, mmol/L)</label>
                <input
                  type="text"
                  disabled={isVerified}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. g/dL"
                  className="h-10 px-sm border border-border-subtle rounded-lg text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-surface-container"
                />
              </div>

              <div className="flex flex-col gap-xs sm:col-span-2">
                <label className="font-label-sm text-on-surface">Reference Range</label>
                <input
                  type="text"
                  disabled={isVerified}
                  value={referenceRange}
                  onChange={(e) => setReferenceRange(e.target.value)}
                  placeholder="e.g. 12.0 – 16.0 g/dL"
                  className="h-10 px-sm border border-border-subtle rounded-lg text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-surface-container"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-sm bg-warning/10 p-sm rounded-lg border border-warning/30">
                <input
                  type="checkbox"
                  id="critical-check"
                  disabled={isVerified}
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  className="w-5 h-5 accent-warning cursor-pointer"
                />
                <label htmlFor="critical-check" className="font-label-md text-on-surface cursor-pointer">
                  Flag as Critical Value (Triggers Immediate Doctor Alert)
                </label>
              </div>

              <div className="flex flex-col gap-xs sm:col-span-2">
                <label className="font-label-sm text-on-surface">Result Notes / Observations</label>
                <textarea
                  rows={3}
                  disabled={isVerified}
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                  placeholder="Add technical notes or observations..."
                  className="p-sm border border-border-subtle rounded-lg text-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-surface-container"
                />
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex flex-wrap items-center justify-between gap-md pt-md border-t border-border-subtle">
              {!isVerified && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSaveResult}
                  className="h-10 px-md bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving Result...' : hasResult ? 'Update Result Draft' : 'Save Result Draft'}
                </button>
              )}

              {hasResult && !isVerified && (
                <button
                  type="button"
                  disabled={verifying}
                  onClick={handleVerifyResult}
                  className="h-10 px-md bg-success text-on-primary rounded-lg font-label-md hover:bg-success/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {verifying ? 'Verifying...' : 'Verify & Lock Result'}
                </button>
              )}

              {isVerified && (
                <div className="flex items-center gap-md">
                  <span className="text-success font-label-md flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    Result Verified & Completed
                  </span>

                  <button
                    type="button"
                    disabled={billing || billCreated}
                    onClick={handleGenerateBill}
                    className="h-10 px-md bg-secondary text-on-secondary rounded-lg font-label-md hover:bg-secondary/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {billing ? 'Generating Bill...' : billCreated ? 'Bill Item Generated' : 'Generate Lab Bill Item'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
