import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  RECENT_TRIAGE_PATIENTS,
  searchTriageHistory,
} from '@/features/triage/data/mockTriageHistory'
import type { TriageHistoryPatient, TriageHistorySearchResult } from '@/features/triage/types/triageHistory'

function categoryBadgeClass(category: string): string {
  switch (category) {
    case 'Emergency':
      return 'bg-error/10 text-error'
    case 'Urgent':
      return 'bg-warning/10 text-warning'
    case 'Semi-Urgent':
      return 'bg-primary-fixed text-primary'
    case 'Non-Urgent':
      return 'bg-success/10 text-success'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function RecentPatientsSection({
  patients,
  onSelect,
  className = '',
}: {
  patients: TriageHistoryPatient[]
  onSelect: (patient: TriageHistoryPatient) => void
  className?: string
}) {
  return (
    <div className={className}>
      <div className="flex items-center gap-sm mb-md px-md">
        <span className="material-symbols-outlined text-[18px] text-outline">history</span>
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          Recent Patients
        </span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md px-md">
        {patients.map((patient) => (
          <button
            key={patient.id}
            type="button"
            onClick={() => onSelect(patient)}
            className="flex items-center gap-md p-sm border border-border-subtle rounded-lg hover:bg-hover-tint transition-colors cursor-pointer bg-transparent text-left w-full"
          >
            <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-outline">person</span>
            </div>
            <div className="min-w-0">
              <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0 truncate">
                {patient.name}
              </p>
              <p className="font-label-sm text-label-sm text-outline m-0">
                {patient.patientNumber} • {patient.lastVisitDate}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function HistoryResultsPanel({
  results,
  query,
  onViewPatient,
}: {
  results: TriageHistorySearchResult[]
  query: string
  onViewPatient: (id: string) => void
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[320px] bg-surface-container-lowest border border-dashed border-border-subtle rounded-xl p-xl text-center">
        <span
          className="material-symbols-outlined text-[64px] text-outline/40 mb-md"
          style={{ fontVariationSettings: "'wght' 200" }}
        >
          person_search
        </span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm m-0">No patient found</h3>
        <p className="font-body-md text-body-md text-outline max-w-md m-0">
          We couldn&apos;t find any patient matching{' '}
          <span className="font-semibold text-on-surface">&quot;{query}&quot;</span>. Verify the name
          or patient number and try again.
        </p>
      </div>
    )
  }

  return (
    <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden">
      <div className="px-lg py-md border-b border-border-subtle">
        <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">
          Search Results
          <span className="font-body-sm text-body-sm text-outline font-normal ml-sm">
            ({results.length} patient{results.length === 1 ? '' : 's'})
          </span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-border-subtle">
              <th className="px-lg py-sm font-label-md text-label-md text-secondary">Patient</th>
              <th className="px-lg py-sm font-label-md text-label-md text-secondary">Patient #</th>
              <th className="px-lg py-sm font-label-md text-label-md text-secondary">Last Category</th>
              <th className="px-lg py-sm font-label-md text-label-md text-secondary">Last Assessed</th>
              <th className="px-lg py-sm font-label-md text-label-md text-secondary text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {results.map((patient) => (
              <tr
                key={patient.id}
                className="hover:bg-hover-tint transition-colors cursor-pointer"
                onClick={() => onViewPatient(patient.id)}
              >
                <td className="px-lg py-md">
                  <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0">
                    {patient.name}
                  </p>
                  <p className="font-label-sm text-label-sm text-outline m-0">
                    {patient.gender}, {patient.age} years
                  </p>
                </td>
                <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">
                  {patient.patientNumber}
                </td>
                <td className="px-lg py-md">
                  <span
                    className={`inline-flex px-sm py-xs rounded-full font-label-sm text-label-sm font-semibold ${categoryBadgeClass(patient.lastTriageCategory)}`}
                  >
                    {patient.lastTriageCategory}
                  </span>
                </td>
                <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">
                  {patient.lastAssessedAt}
                </td>
                <td className="px-lg py-md text-right">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onViewPatient(patient.id) }}
                    className="text-on-secondary-container hover:text-primary border border-border-subtle px-sm py-xs rounded font-label-sm text-label-sm font-semibold transition-colors hover:bg-surface-white bg-transparent cursor-pointer"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function TriageHistoryContent() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<TriageHistorySearchResult[]>([])

  const runSearch = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) {
      toast.error('Enter a patient name or patient number to search.')
      return
    }
    setQuery(trimmed)
    setHasSearched(true)
    setResults(searchTriageHistory(trimmed))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query)
  }

  const handleRecentSelect = (patient: TriageHistoryPatient) => {
    navigate(`/triage/history/${patient.id}`)
  }

  const handleViewPatient = (id: string) => {
    navigate(`/triage/history/${id}`)
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col flex-1 min-h-0">
      <div className="mb-lg">
        <h1 className="font-headline-md text-headline-md text-on-surface m-0">Patient History</h1>
      </div>

      <section className="mb-xl">
        <form
          onSubmit={handleSubmit}
          className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col sm:flex-row items-stretch sm:items-center gap-md shadow-sm focus-within:shadow-md transition-shadow"
        >
          <div className="flex-1 flex items-center gap-sm bg-surface-container-lowest border border-border-subtle rounded-lg px-md py-sm">
            <span
              className={`material-symbols-outlined shrink-0 ${
                searchFocused ? 'text-primary' : 'text-outline'
              }`}
            >
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search patient by name or patient number"
              className="flex-1 bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline outline-none min-w-0"
            />
          </div>
          <button
            type="submit"
            className="bg-primary-container text-white px-xl py-sm rounded-lg font-label-md text-label-md hover:bg-primary transition-colors flex items-center justify-center gap-xs border-0 cursor-pointer shrink-0 h-10 sm:h-auto"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Search
          </button>
        </form>
      </section>

      {!hasSearched ? (
        <div className="flex flex-col flex-1">
          <div className="flex flex-col items-center justify-center flex-1 min-h-[420px] bg-surface-container-lowest border border-dashed border-border-subtle rounded-xl p-xl">
            <div className="relative w-64 h-64 mb-lg opacity-80">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="p-xl bg-surface-white rounded-full border border-border-subtle shadow-sm flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[96px] text-primary/40 select-none"
                    style={{ fontVariationSettings: "'wght' 200" }}
                  >
                    clinical_notes
                  </span>
                </div>
              </div>
              <div className="absolute top-4 right-4 w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center rotate-12">
                <span className="material-symbols-outlined text-success text-[20px]">check_circle</span>
              </div>
              <div className="absolute bottom-10 left-0 w-16 h-16 bg-secondary-container/30 rounded-full flex items-center justify-center -rotate-6">
                <span className="material-symbols-outlined text-on-secondary-container text-[24px]">
                  history
                </span>
              </div>
              <div className="absolute top-1/2 -right-8 w-10 h-10 bg-error/5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-error/40 text-[16px]">emergency</span>
              </div>
            </div>

            <div className="text-center max-w-md">
              <p className="font-body-md text-body-md text-outline mb-sm m-0">
                Search for a patient to view their history
              </p>
              <p className="font-label-sm text-label-sm text-outline/80 px-lg m-0">
                Access detailed medical records, previous triage assessments, and clinical observations
                from the hospital&apos;s unified patient database.
              </p>
            </div>

            <RecentPatientsSection
              className="mt-xl w-full max-w-2xl"
              patients={RECENT_TRIAGE_PATIENTS.slice(0, 2)}
              onSelect={handleRecentSelect}
            />
          </div>
        </div>
      ) : (
        <HistoryResultsPanel results={results} query={query} onViewPatient={handleViewPatient} />
      )}
    </div>
  )
}
