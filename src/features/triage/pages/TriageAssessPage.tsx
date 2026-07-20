import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { triageService } from '@/api/services/triage'
import type { TriageVisit } from '@/features/triage/types/triageAssessment'
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

  const [visit, setVisit] = useState<TriageVisit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stateVisit = (location.state as any)?.visit as TriageVisit | undefined
    if (stateVisit && stateVisit.visitId === visitId) {
      setVisit(stateVisit)
      setLoading(false)
      return
    }

    // Fallback: fetch queue and find the visit
    const resolveVisitFromQueue = async () => {
      try {
        const data = await triageService.getQueue()
        const foundItem = data.queue.find((item) => item.visit.visit_id === visitId)
        if (foundItem) {
          const initials = foundItem.patient.full_name
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
          
          const dob = new Date(foundItem.patient.date_of_birth)
          const age = isNaN(dob.getTime())
            ? 0
            : Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970)
            
          const arrivalDate = new Date(foundItem.created_at)
          const arrival = isNaN(arrivalDate.getTime())
            ? '--'
            : arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            
          const diffMins = isNaN(arrivalDate.getTime())
            ? 0
            : Math.floor((Date.now() - arrivalDate.getTime()) / 60000)
            
          const waitTime = `${diffMins}m`
          let waitColor = 'text-success'
          if (foundItem.priority === 'emergency') {
            waitColor = 'text-error font-bold'
          } else if (diffMins > 30) {
            waitColor = 'text-warning'
          }

          setVisit({
            queueId: foundItem.queue_id,
            status: foundItem.status,
            visitId: foundItem.visit.visit_id,
            patientId: foundItem.patient.patient_id,
            queueNumber: foundItem.queue_number,
            name: foundItem.patient.full_name,
            initials,
            patientNumber: foundItem.patient.patient_number,
            gender: foundItem.patient.gender,
            age,
            arrival,
            waitTime,
            waitColor,
            waitWarningIcon: diffMins > 30,
            payment: foundItem.visit.payment_type,
            source: foundItem.visit.visit_type,
            priority: foundItem.priority === 'emergency' ? 'emergency' : foundItem.priority === 'urgent' ? 'urgent' : 'routine',
            isEmergency: foundItem.priority === 'emergency'
          })
        } else {
          setVisit(null)
        }
      } catch (err) {
        console.error('Failed to resolve visit from queue:', err)
        setVisit(null)
      } finally {
        setLoading(false)
      }
    }

    void resolveVisitFromQueue()
  }, [visitId, location.state])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-sm">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
        <p className="font-label-md text-secondary m-0">Resolving patient visit details...</p>
      </div>
    )
  }

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
