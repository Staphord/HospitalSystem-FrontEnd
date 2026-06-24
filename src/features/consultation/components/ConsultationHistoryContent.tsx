import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  RECENT_CONSULTATION_PATIENTS,
  searchConsultationHistory,
} from '@/features/consultation/data/mockConsultationHistory'
import type {
  ConsultationHistoryPatient,
  ConsultationHistorySearchResult,
} from '@/features/consultation/types/consultationHistory'

// ── Recent patients quick-access grid ─────────────────────────────────────────

function RecentPatientsSection({
  patients,
  onSelect,
  className = '',
}: {
  patients: ConsultationHistoryPatient[]
  onSelect: (p: ConsultationHistoryPatient) => void
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md px-md">
        {patients.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            className="flex items-center gap-md p-sm border border-border-subtle rounded-lg hover:bg-hover-tint transition-colors cursor-pointer bg-transparent text-left w-full"
          >
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0 font-bold text-xs text-on-secondary-container">
              {p.avatarInitials}
            </div>
            <div className="min-w-0">
              <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0 truncate">
                {p.name}
              </p>
              <p className="font-label-sm text-label-sm text-outline m-0">
                {p.patientNumber} · {p.lastVisitDate}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Search results table ───────────────────────────────────────────────────────

function HistoryResultsPanel({
  results,
  query,
  onViewPatient,
}: {
  results: ConsultationHistorySearchResult[]
  query: string
  onViewPatient: (id: string) => void
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] bg-surface-container-lowest border border-dashed border-border-subtle rounded-xl p-xl text-center">
        <span
          className="material-symbols-outlined text-[64px] text-outline/40 mb-md select-none"
          style={{ fontVariationSettings: "'wght' 200" }}
        >
          person_search
        </span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm m-0">No patient found</h3>
        <p className="font-body-md text-body-md text-outline max-w-md m-0">
          No patient matching{' '}
          <span className="font-semibold text-on-surface">&quot;{query}&quot;</span>. Check the name,
          patient ID, or phone number and try again.
        </p>
      </div>
    )
  }

  return (
    <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
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
              {['Patient', 'Patient #', 'Age / Gender', 'Last Visit', 'Last Diagnosis', 'Actions'].map((h, i) => (
                <th
                  key={h}
                  className={`px-lg py-sm font-label-md text-label-md text-secondary uppercase tracking-widest ${i === 5 ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {results.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-hover-tint transition-colors cursor-pointer group"
                onClick={() => onViewPatient(p.id)}
              >
                <td className="px-lg py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center font-bold text-xs text-on-secondary-container shrink-0">
                      {p.avatarInitials}
                    </div>
                    <span className="font-body-sm text-body-sm font-semibold text-on-surface">{p.name}</span>
                  </div>
                </td>
                <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">
                  {p.patientNumber}
                </td>
                <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">
                  {p.age}y / {p.gender}
                </td>
                <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                  {p.lastVisitDate}
                </td>
                <td className="px-lg py-md">
                  <span className="font-body-sm text-body-sm text-on-surface">{p.lastDiagnosis}</span>
                </td>
                <td className="px-lg py-md text-right">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onViewPatient(p.id) }}
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

// ── Main export ────────────────────────────────────────────────────────────────

export function ConsultationHistoryContent() {
  const navigate = useNavigate()
  const [query, setQuery]               = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [hasSearched, setHasSearched]   = useState(false)
  const [results, setResults]           = useState<ConsultationHistorySearchResult[]>([])

  const runSearch = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) {
      toast.error('Enter a patient name, ID or phone number to search.')
      return
    }
    setQuery(trimmed)
    setHasSearched(true)
    setResults(searchConsultationHistory(trimmed))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runSearch(query)
  }

  const handleViewPatient = (id: string) => {
    navigate(`/consultation/history/${id}`)
  }

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col flex-1 min-h-0">
      {/* Search bar */}
      <section className="mb-xl">
        <form
          onSubmit={handleSubmit}
          className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col sm:flex-row items-stretch sm:items-center gap-md shadow-sm focus-within:shadow-md transition-shadow"
        >
          <div
            className={`flex-1 flex items-center gap-sm bg-surface-container-lowest border rounded-lg px-md py-sm transition-all ${
              searchFocused ? 'border-primary ring-1 ring-primary' : 'border-border-subtle'
            }`}
          >
            <span className={`material-symbols-outlined shrink-0 leading-none select-none ${searchFocused ? 'text-primary' : 'text-outline'}`}>
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search patient by name, patient ID or phone number"
              className="flex-1 bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-outline outline-none min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setHasSearched(false); setResults([]) }}
                className="text-outline hover:text-on-surface bg-transparent border-0 cursor-pointer leading-none"
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined text-[18px] leading-none">close</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-primary text-white px-xl py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-xs border-0 cursor-pointer shrink-0 h-10 sm:h-auto active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">search</span>
            Search
          </button>
        </form>
      </section>

      {/* Empty / results state */}
      {!hasSearched ? (
        <div className="flex flex-col flex-1">
          <div className="flex flex-col items-center justify-center flex-1 min-h-[420px] bg-surface-container-lowest border border-dashed border-border-subtle rounded-xl p-xl">
            {/* Illustration */}
            <div className="relative w-56 h-56 mb-lg opacity-80">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="p-xl bg-surface-white rounded-full border border-border-subtle shadow-sm flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[88px] text-primary/40 select-none"
                    style={{ fontVariationSettings: "'wght' 200" }}
                  >
                    folder_shared
                  </span>
                </div>
              </div>
              <div className="absolute top-4 right-4 w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center rotate-12">
                <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
              </div>
              <div className="absolute bottom-10 left-0 w-14 h-14 bg-secondary-container/30 rounded-full flex items-center justify-center -rotate-6">
                <span className="material-symbols-outlined text-on-secondary-container text-[22px]">history</span>
              </div>
              <div className="absolute top-1/2 -right-6 w-9 h-9 bg-error/5 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-error/40 text-[14px]">warning</span>
              </div>
            </div>

            <div className="text-center max-w-md mb-xl">
              <p className="font-body-md text-body-md text-outline mb-sm m-0">
                Search for a patient to view their clinical history
              </p>
              <p className="font-label-sm text-label-sm text-outline/80 px-lg m-0">
                Access full medical records, previous encounters, diagnoses, prescriptions and clinical
                observations from the hospital&apos;s unified patient database.
              </p>
            </div>

            <RecentPatientsSection
              patients={RECENT_CONSULTATION_PATIENTS}
              onSelect={(p) => handleViewPatient(p.id)}
            />
          </div>
        </div>
      ) : (
        <HistoryResultsPanel results={results} query={query} onViewPatient={handleViewPatient} />
      )}
    </div>
  )
}
