import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { receptionService } from '@/api/services/reception'
import type { TriageHistorySearchResult } from '@/features/triage/types/triageHistory'
import { TriageHistoryPatientContent } from '@/features/triage/components/TriageHistoryPatientContent'
import { TriageVisitNotFound } from '@/features/triage/components/TriageVisitNotFound'

export function TriageHistoryPatientPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<TriageHistorySearchResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!patientId) return
    const fetchPatient = async () => {
      setLoading(true)
      try {
        const p = await receptionService.getPatient(patientId)
        
        let age = 0
        if (p.date_of_birth) {
          const birthDate = new Date(p.date_of_birth)
          const today = new Date()
          age = today.getFullYear() - birthDate.getFullYear()
          const m = today.getMonth() - birthDate.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }
        }

        const dobFormatted = p.date_of_birth 
          ? new Date(p.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : ''

        setPatient({
          id: p.id,
          name: p.full_name,
          patientNumber: p.patient_number,
          lastVisitDate: '',
          gender: p.gender.charAt(0).toUpperCase() + p.gender.slice(1),
          age,
          dob: dobFormatted,
          phone: p.phone_primary,
          lastTriageCategory: 'None',
          lastAssessedAt: 'Never',
          assessmentCount: 0,
        })
      } catch (err) {
        console.error('Failed to fetch patient details for history page:', err)
      } finally {
        setLoading(false)
      }
    }
    void fetchPatient()
  }, [patientId])

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center justify-center py-20 gap-sm">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
        <p className="font-label-md text-secondary m-0">Loading patient profile...</p>
      </div>
    )
  }

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
