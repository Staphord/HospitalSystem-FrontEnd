import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getTriageVisitById } from '@/features/triage/data/mockTriageVisits'
import { TriageAssessContent } from '@/features/triage/components/TriageAssessContent'
import { TriageVisitNotFound } from '@/features/triage/components/TriageVisitNotFound'
import {
  getTriageAssessParent,
  resolveTriageAssessFrom,
} from '@/features/triage/utils/triageAssessNav'

export function TriageAssessPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const from = resolveTriageAssessFrom(location.state)
  const parent = getTriageAssessParent(from)
  const visit = visitId ? getTriageVisitById(visitId) : undefined

  if (!visit) {
    return (
      <div className="max-w-container-max mx-auto">
        <TriageVisitNotFound
          visitId={visitId}
          backLabel={`Back to ${parent.label}`}
          onBack={() => navigate(parent.path)}
        />
      </div>
    )
  }

  return <TriageAssessContent visit={visit} from={from} />
}
