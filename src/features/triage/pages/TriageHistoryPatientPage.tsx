import { useNavigate, useParams } from 'react-router-dom'
import { getTriageHistoryPatientById } from '@/features/triage/data/mockTriageHistory'
import { TriageHistoryPatientContent } from '@/features/triage/components/TriageHistoryPatientContent'
import { TriageVisitNotFound } from '@/features/triage/components/TriageVisitNotFound'

export function TriageHistoryPatientPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const patient = patientId ? getTriageHistoryPatientById(patientId) : undefined

  if (!patient) {
    return (
      <div className="max-w-container-max mx-auto">
        <TriageVisitNotFound
          visitId={patientId}
          backLabel="Back to Patient History"
          onBack={() => navigate('/triage/history')}
        />
      </div>
    )
  }

  return <TriageHistoryPatientContent patient={patient} />
}
