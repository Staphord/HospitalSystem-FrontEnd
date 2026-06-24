import { useNavigate, useParams } from 'react-router-dom'
import { getConsultationPatientById } from '@/features/consultation/data/mockConsultationHistory'
import { ConsultationHistoryPatientContent } from '@/features/consultation/components/ConsultationHistoryPatientContent'

export function ConsultationHistoryPatientPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const patient = patientId ? getConsultationPatientById(patientId) : undefined

  if (!patient) {
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
          No patient record found for ID &quot;{patientId ?? ''}&quot;. They may not exist in the system.
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

  return <ConsultationHistoryPatientContent patient={patient} />
}
