import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import type {
  LabRequestStatus,
  LabTestRequest,
  ResultFlag,
} from '@/features/laboratory/types/laboratory'
import {
  getLabRequestById,
  patchLabRequest,
} from '@/features/laboratory/utils/labRequestStore'
import { getSpecimenByRequestId } from '@/features/laboratory/utils/specimenStore'
import {
  SPECIMEN_TRACKING_STATUS_LABEL,
} from '@/features/laboratory/utils/specimenStatus'
import { evaluateResultFlag, getWorstFlag } from '@/features/laboratory/utils/labResultFlags'

function FlagPill({ flag }: { flag: ResultFlag }) {
  if (!flag || flag === 'normal') return null

  if (flag === 'critical') {
    return (
      <span className="px-sm py-[2px] rounded-full text-[10px] font-bold uppercase bg-error/10 text-error border border-error/20">
        Critical
      </span>
    )
  }

  return (
    <span className="px-sm py-[2px] rounded-full text-[10px] font-bold uppercase bg-warning/10 text-warning border border-warning/20">
      Abnormal
    </span>
  )
}

export function LabRequestDetailContent() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  const initial = requestId ? getLabRequestById(requestId) : undefined

  const defaultResults = (): Record<string, string> => {
    if (initial?.resultValues && Object.keys(initial.resultValues).length > 0) {
      return initial.resultValues
    }
    if (initial?.testName.toLowerCase().includes('troponin')) {
      return { 'trop-i': '2.8' }
    }
    return {}
  }

  const [request, setRequest] = useState<LabTestRequest | null>(initial ?? null)
  const [resultValues, setResultValues] = useState<Record<string, string>>(defaultResults)
  const [observations, setObservations] = useState(initial?.observations ?? '')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!requestId) return
    const loaded = getLabRequestById(requestId)
    if (loaded) {
      setRequest(loaded)
      const values =
        loaded.resultValues && Object.keys(loaded.resultValues).length > 0
          ? loaded.resultValues
          : loaded.testName.toLowerCase().includes('troponin')
            ? { 'trop-i': '2.8' }
            : {}
      setResultValues(values)
      setObservations(loaded.observations ?? '')
    }
  }, [requestId])

  const parameters = request?.parameters ?? []
  const isReadOnly = request?.status === 'completed'

  const parameterFlags = useMemo(() => {
    return parameters.map((param) => evaluateResultFlag(resultValues[param.id] ?? '', param))
  }, [parameters, resultValues])

  const worstFlag = useMemo(() => getWorstFlag(parameterFlags), [parameterFlags])
  const isCritical = worstFlag === 'critical'

  if (!requestId || !request) {
    return <Navigate to="/laboratory/requests" replace />
  }

  const persistRequest = (patch: Partial<LabTestRequest>) => {
    patchLabRequest(request.id, patch)
    const updated = { ...request, ...patch }
    setRequest(updated)
    setIsDirty(false)
  }

  const handleStatusChange = (status: LabRequestStatus) => {
    persistRequest({ status })
    toast.success(`Status updated to ${status.replace('_', ' ')}.`)
  }

  const trackedSpecimen = getSpecimenByRequestId(request.id)

  const handleSaveDraft = () => {
    persistRequest({ resultValues, observations })
    toast.success('Draft saved.')
  }

  const handleSubmit = () => {
    persistRequest({
      resultValues,
      observations,
      status: 'completed',
    })
    if (isCritical) {
      toast.success('Results submitted. Doctor notified of critical value.')
    } else {
      toast.success('Results submitted successfully.')
    }
    navigate('/laboratory/requests')
  }

  const handleResultChange = (paramId: string, value: string) => {
    setResultValues((prev) => ({ ...prev, [paramId]: value }))
    setIsDirty(true)
  }

  return (
    <div className="max-w-container-max mx-auto w-full pb-28">
      <nav className="mb-sm" aria-label="Breadcrumb">
        <p className="font-label-md text-label-md text-secondary m-0">
          <Link to="/laboratory/requests" className="text-primary hover:underline no-underline">
            Test Requests
          </Link>
          {' '}
          &gt; Results Entry —{' '}
          <span className="text-on-surface">
            {request.patientNumber} {request.patientName} — {request.testName}
          </span>
        </p>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center gap-md mb-lg">
        <div className="flex flex-wrap items-center gap-md">
          <label className="flex items-center gap-sm font-label-md text-label-md text-secondary">
            Request status
            <select
              value={request.status}
              disabled={isReadOnly}
              onChange={(e) => handleStatusChange(e.target.value as LabRequestStatus)}
              className="h-9 px-sm border border-border-subtle rounded-lg font-body-sm bg-surface-white focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <div className="flex items-center gap-sm font-label-md text-label-md text-secondary">
            <span>Specimen</span>
            <span
              className={`h-9 px-sm border border-border-subtle rounded-lg font-body-sm inline-flex items-center ${
                request.specimenStatus === 'collected'
                  ? 'bg-[#00B8D9]/10 text-[#008DA6]'
                  : 'bg-warning/10 text-[#CC8900]'
              }`}
            >
              {request.specimenStatus === 'collected' ? 'Collected' : 'Not Collected'}
            </span>
            {trackedSpecimen && (
              <span className="font-label-sm text-label-sm text-secondary">
                ({SPECIMEN_TRACKING_STATUS_LABEL[trackedSpecimen.status]} in tracking)
              </span>
            )}
            <Link
              to="/laboratory/specimens"
              state={{ requestId: request.id }}
              className="font-label-sm text-label-sm text-primary hover:underline no-underline"
            >
              Manage in Specimen Tracking
            </Link>
          </div>
        </div>
        {isDirty && !isReadOnly && (
          <span className="font-label-sm text-label-sm text-warning">Unsaved changes</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-lg">
        <section className="bg-surface-white border border-border-subtle p-lg rounded-lg flex flex-wrap gap-xl">
          {[
            { label: 'Patient', value: request.patientName },
            { label: 'ID', value: request.patientNumber },
            { label: 'Test', value: request.testName },
            { label: 'Requested By', value: request.requestedBy },
            { label: 'Specimen ID', value: request.specimenId ?? '—' },
            { label: 'Collected At', value: request.collectedAt ?? '—' },
          ].map((field) => (
            <div key={field.label} className="flex-1 min-w-[150px]">
              <p className="text-label-sm font-label-sm text-secondary uppercase tracking-wider mb-xs m-0">
                {field.label}
              </p>
              <p className="text-body-md font-body-md font-semibold m-0">{field.value}</p>
            </div>
          ))}
        </section>

        {isCritical && !isReadOnly && (
          <div className="w-full bg-error/10 border border-error/20 p-md rounded-lg flex items-center gap-md">
            <span
              className="material-symbols-outlined text-error"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <p className="text-error font-body-sm font-semibold m-0">
              Critical value detected. Doctor will be automatically notified on submission.
            </p>
          </div>
        )}

        <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden">
          <header className="px-lg py-md border-b border-border-subtle">
            <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">
              Results — {request.testName}
            </h3>
          </header>
          <div className="p-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-label-md font-label-md text-secondary bg-surface-container-low">
                    <th className="px-md py-sm border-b border-border-subtle">Parameter</th>
                    <th className="px-md py-sm border-b border-border-subtle w-48">Result Input</th>
                    <th className="px-md py-sm border-b border-border-subtle">Unit</th>
                    <th className="px-md py-sm border-b border-border-subtle">Reference Range</th>
                    <th className="px-md py-sm border-b border-border-subtle">Flag</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm font-body-sm">
                  {parameters.map((param, index) => (
                    <tr key={param.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-md py-md border-b border-border-subtle font-medium">
                        {param.name}
                      </td>
                      <td className="px-md py-md border-b border-border-subtle">
                        <input
                          type="text"
                          value={resultValues[param.id] ?? ''}
                          disabled={isReadOnly}
                          onChange={(e) => handleResultChange(param.id, e.target.value)}
                          className="w-full h-8 px-2 border border-border-subtle rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all disabled:bg-surface-container-low"
                        />
                      </td>
                      <td className="px-md py-md border-b border-border-subtle text-secondary">
                        {param.unit}
                      </td>
                      <td className="px-md py-md border-b border-border-subtle">
                        <span className="px-sm py-xs bg-background rounded text-secondary">
                          {param.refRange}
                        </span>
                      </td>
                      <td className="px-md py-md border-b border-border-subtle">
                        <FlagPill flag={parameterFlags[index]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-lg">
              <label
                htmlFor="lab-observations"
                className="block text-label-md font-label-md text-secondary mb-xs"
              >
                Additional observations
              </label>
              <textarea
                id="lab-observations"
                value={observations}
                disabled={isReadOnly}
                onChange={(e) => {
                  setObservations(e.target.value)
                  setIsDirty(true)
                }}
                className="w-full p-md border border-border-subtle rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all disabled:bg-surface-container-low"
                placeholder="Enter any notable findings..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <footer className="fixed bottom-16 lg:bottom-0 left-0 lg:left-[240px] right-0 bg-surface-white border-t border-border-subtle p-md px-lg flex justify-end gap-md z-40">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-lg h-10 border border-border-subtle rounded-lg text-secondary font-label-md hover:bg-surface-container-high transition-all bg-transparent cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`px-lg h-10 rounded-lg font-label-md text-white border-0 cursor-pointer transition-all hover:opacity-90 active:scale-[0.98] ${
              isCritical ? 'bg-error' : 'bg-primary'
            }`}
          >
            {isCritical ? 'Submit & Notify Doctor' : 'Submit Results'}
          </button>
        </footer>
      )}
    </div>
  )
}
