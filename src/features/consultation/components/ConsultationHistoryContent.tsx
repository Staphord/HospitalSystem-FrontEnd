import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { wardService } from '@/api/services/ward'
import type { PatientListItem } from '@/api/services/ward'

// ── Formatting/calculation helpers ───────────────────────────────────────────

function calcAge(dob: string) {
  try {
    const b = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - b.getFullYear()
    if (today < new Date(today.getFullYear(), b.getMonth(), b.getDate())) age--
    return age
  } catch { return 0 }
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'PT'
}

// ── Recent patients quick-access grid ─────────────────────────────────────────

interface RecentSectionProps {
  patients: PatientListItem[]
  loading: boolean
  onSelect: (p: PatientListItem) => void
  className?: string
}

function RecentPatientsSection({
  patients,
  loading,
  onSelect,
  className = '',
}: RecentSectionProps) {
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center gap-sm mb-md px-md">
          <span className="material-symbols-outlined text-[18px] text-outline">history</span>
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Loading Recent Patients...
          </span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md px-md animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-surface-container-low border border-border-subtle rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (patients.length === 0) {
    return null
  }

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
        {patients.map((p) => {
          const name = p.full_name
          const num = p.patient_number
          const age = calcAge(p.date_of_birth)
          const gen = p.gender
          const init = initials(name)

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className="flex items-center gap-md p-sm border border-border-subtle rounded-lg hover:bg-hover-tint transition-colors cursor-pointer bg-transparent text-left w-full"
            >
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0 font-bold text-xs text-on-secondary-container">
                {init}
              </div>
              <div className="min-w-0">
                <p className="font-body-sm text-body-sm font-semibold text-on-surface m-0 truncate">
                  {name}
                </p>
                <p className="font-label-sm text-label-sm text-outline m-0">
                  {num} · {gen} ({age}y)
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Search results table ───────────────────────────────────────────────────────

interface ResultsPanelProps {
  results: PatientListItem[]
  query: string
  onViewPatient: (id: string) => void
}

function HistoryResultsPanel({
  results,
  query,
  onViewPatient,
}: ResultsPanelProps) {
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
              {['Patient', 'Patient #', 'Age / Gender', 'Phone Number', 'Known Allergies', 'Actions'].map((h, i) => (
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
            {results.map((p) => {
              const age = calcAge(p.date_of_birth)
              const init = initials(p.full_name)
              const allergyText = p.allergies || 'None'

              return (
                <tr
                  key={p.id}
                  className="hover:bg-hover-tint transition-colors cursor-pointer group"
                  onClick={() => onViewPatient(p.id)}
                >
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center font-bold text-xs text-on-secondary-container shrink-0">
                        {init}
                      </div>
                      <span className="font-body-sm text-body-sm font-semibold text-on-surface">{p.full_name}</span>
                    </div>
                  </td>
                  <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">
                    {p.patient_number}
                  </td>
                  <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant">
                    {age}y / {p.gender}
                  </td>
                  <td className="px-lg py-md font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                    {p.phone_primary || '—'}
                  </td>
                  <td className="px-lg py-md">
                    <span className={`font-body-sm text-body-sm ${p.allergies ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                      {allergyText}
                    </span>
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
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ConsultationHistoryContent() {
  const navigate = useNavigate()
  const [query, setQuery]                 = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [hasSearched, setHasSearched]     = useState(false)
  const [searching, setSearching]         = useState(false)
  const [results, setResults]             = useState<PatientListItem[]>([])

  const [recent, setRecent]               = useState<PatientListItem[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  // Load recent patients on mount
  useEffect(() => {
    setLoadingRecent(true)
    wardService.getRecentPatients(6)
      .then((res) => { setRecent(res); setLoadingRecent(false) })
      .catch(() => setLoadingRecent(false))
  }, [])

  const runSearch = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) {
      toast.error('Enter a patient name, ID or phone number to search.')
      return
    }
    setQuery(trimmed)
    setSearching(true)
    setHasSearched(true)
    
    wardService.searchPatients(trimmed, 1, 50)
      .then((res) => {
        setResults(res.patients || [])
        setSearching(false)
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || err?.message || 'Search failed'
        toast.error(msg)
        setSearching(false)
      })
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
            disabled={searching}
            className="bg-primary text-white px-xl py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-xs border-0 cursor-pointer shrink-0 h-10 sm:h-auto active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">
              {searching ? 'sync' : 'search'}
            </span>
            {searching ? 'Searching...' : 'Search'}
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
              patients={recent}
              loading={loadingRecent}
              onSelect={(p) => handleViewPatient(p.id)}
            />
          </div>
        </div>
      ) : searching ? (
        <div className="flex flex-col items-center justify-center min-h-[320px] bg-surface-container-lowest border border-dashed border-border-subtle rounded-xl p-xl text-center">
          <span className="material-symbols-outlined text-[48px] text-primary animate-spin mb-md">sync</span>
          <p className="font-body-md text-body-md text-outline m-0">Searching database...</p>
        </div>
      ) : (
        <HistoryResultsPanel results={results} query={query} onViewPatient={handleViewPatient} />
      )}
    </div>
  )
}
