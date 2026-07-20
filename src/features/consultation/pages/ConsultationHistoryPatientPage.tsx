import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { wardService } from '@/api/services/ward'
import type { PatientHistoryData } from '@/api/services/ward'
import { ConsultationHistoryPatientContent } from '@/features/consultation/components/ConsultationHistoryPatientContent'

export function ConsultationHistoryPatientPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()

  const [data, setData]       = useState<PatientHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!patientId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    wardService.getPatientHistory(patientId)
      .then((res) => { setData(res); setLoading(false) })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Failed to load patient history'
        setError(msg)
        setLoading(false)
      })
  }, [patientId])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center justify-center min-h-[400px] gap-md">
        <span className="material-symbols-outlined text-primary text-[48px] animate-spin">sync</span>
        <p className="font-body-md text-body-md text-outline m-0">Loading patient history…</p>
      </div>
    )
  }

  // ── Error / Not found ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center justify-center min-h-[400px] text-center gap-md">
        <span
          className="material-symbols-outlined text-[64px] text-outline/40 select-none"
          style={{ fontVariationSettings: "'wght' 200" }}
        >
          person_off
        </span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Patient not found</h3>
        <p className="font-body-md text-body-md text-outline max-w-sm m-0">
          {error ?? `No patient record found for ID "${patientId ?? ''}". They may not exist in the system.`}
        </p>
        <button
          type="button"
          onClick={() => navigate('/consultation/history')}
          className="mt-sm bg-primary text-white px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity border-0 cursor-pointer flex items-center gap-xs"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">arrow_back</span>
          Back to Patient History
        </button>
      </div>
    )
  }

  return <ConsultationHistoryPatientContent data={data} />
}
