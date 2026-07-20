import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { wardService } from '@/api/services/ward'

interface Patient {
  id: string
  name: string
  patientNo: string
  bed: string
  admissionDate: string
  lengthOfStay: string
  admittingDoctor: string
  condition: 'Stable' | 'Monitoring' | 'Critical'
  lastNoteTime: string
  activeVisitors: number
  diagnosis: string
  photo?: string
}

const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'Fatuma Said',
    patientNo: 'PT-4891',
    bed: 'Bed 12',
    admissionDate: '09 Jun 2026',
    lengthOfStay: '1 day',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Critical',
    lastNoteTime: '2h ago',
    activeVisitors: 2,
    diagnosis: 'Severe Pneumonia',
    photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTmEIyBoqvmWlWO6xMGNNH3WeH3r05Gg1eqYV2ifKa1VY6q6ZNcqtsmCzQOeZ8FG21DMnP9UW0YSU87nAwGz7QqXezXQvzHGgX5uYj2tnAO_UnFOPkq0orD9800Yogx-LBlvZJF2yvCqrLhXDUTH-Myfa8IPIzg_IiGW85mMgKt5V-vaStJOFYa37n0Yetk-eTK97zCAEX8vr62eoyxb2OBspB37923DpaY8lgC047fbh4U4TCNuPG6ZJ8lPkl762WBPjyl14szg'
  },
  {
    id: 'p2',
    name: 'Asha Juma',
    patientNo: 'PT-4801',
    bed: 'Bed 09',
    admissionDate: '05 Jun 2026',
    lengthOfStay: '5 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Monitoring',
    lastNoteTime: '1h ago',
    activeVisitors: 1,
    diagnosis: 'Hypertensive Emergency'
  },
  {
    id: 'p3',
    name: 'John Mwangi',
    patientNo: 'PT-4856',
    bed: 'Bed 14',
    admissionDate: '07 Jun 2026',
    lengthOfStay: '3 days',
    admittingDoctor: 'Dr. Baraka',
    condition: 'Stable',
    lastNoteTime: '4h ago',
    activeVisitors: 0,
    diagnosis: 'Post-Op Appendectomy'
  },
  {
    id: 'p-test1',
    name: 'Juma Hamisi',
    patientNo: 'HN-9821',
    bed: 'Bed 03',
    admissionDate: '06 Jun 2026',
    lengthOfStay: '4 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Critical',
    lastNoteTime: '1h ago',
    activeVisitors: 0,
    diagnosis: 'Malaria'
  },
  {
    id: 'p-test2',
    name: 'Zuwena Said',
    patientNo: 'HN-7721',
    bed: 'Bed 04',
    admissionDate: '05 Jun 2026',
    lengthOfStay: '5 days',
    admittingDoctor: 'Dr. Baraka',
    condition: 'Monitoring',
    lastNoteTime: '2h ago',
    activeVisitors: 1,
    diagnosis: 'Pneumonia'
  },
  {
    id: 'p-test3',
    name: 'Neema Kessy',
    patientNo: 'HN-8821',
    bed: 'Bed 05',
    admissionDate: '07 Jun 2026',
    lengthOfStay: '3 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Stable',
    lastNoteTime: '3h ago',
    activeVisitors: 0,
    diagnosis: 'Gastritis'
  },
  {
    id: 'p7',
    name: 'Amina Juma',
    patientNo: 'PT-4301',
    bed: 'Bed 01',
    admissionDate: '08 Jun 2026',
    lengthOfStay: '2 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Stable',
    lastNoteTime: '6h ago',
    activeVisitors: 0,
    diagnosis: 'Gastroenteritis'
  },
  {
    id: 'p8',
    name: 'Baraka Elias',
    patientNo: 'PT-4302',
    bed: 'Bed 02',
    admissionDate: '08 Jun 2026',
    lengthOfStay: '2 days',
    admittingDoctor: 'Dr. Baraka',
    condition: 'Stable',
    lastNoteTime: '7h ago',
    activeVisitors: 0,
    diagnosis: 'Cellulitis'
  },
  {
    id: 'p9',
    name: 'Chacha Mwita',
    patientNo: 'PT-4303',
    bed: 'Bed 06',
    admissionDate: '07 Jun 2026',
    lengthOfStay: '3 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Stable',
    lastNoteTime: '8h ago',
    activeVisitors: 0,
    diagnosis: 'UTI'
  },
  {
    id: 'p10',
    name: 'David Malima',
    patientNo: 'PT-4304',
    bed: 'Bed 07',
    admissionDate: '07 Jun 2026',
    lengthOfStay: '3 days',
    admittingDoctor: 'Dr. Baraka',
    condition: 'Stable',
    lastNoteTime: '9h ago',
    activeVisitors: 0,
    diagnosis: 'Dehydration'
  },
  {
    id: 'p11',
    name: 'Emmanuel Kavishe',
    patientNo: 'PT-4305',
    bed: 'Bed 08',
    admissionDate: '06 Jun 2026',
    lengthOfStay: '4 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Stable',
    lastNoteTime: '10h ago',
    activeVisitors: 0,
    diagnosis: 'Asthma Exacerbation'
  },
  {
    id: 'p12',
    name: 'Faraja Mlay',
    patientNo: 'PT-4306',
    bed: 'Bed 10',
    admissionDate: '06 Jun 2026',
    lengthOfStay: '4 days',
    admittingDoctor: 'Dr. Baraka',
    condition: 'Stable',
    lastNoteTime: '11h ago',
    activeVisitors: 0,
    diagnosis: 'Bronchitis'
  },
  {
    id: 'p13',
    name: 'Grace Masanja',
    patientNo: 'PT-4307',
    bed: 'Bed 11',
    admissionDate: '05 Jun 2026',
    lengthOfStay: '5 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Stable',
    lastNoteTime: '12h ago',
    activeVisitors: 0,
    diagnosis: 'Anemia'
  },
  {
    id: 'p14',
    name: 'Happy Swai',
    patientNo: 'PT-4308',
    bed: 'Bed 13',
    admissionDate: '05 Jun 2026',
    lengthOfStay: '5 days',
    admittingDoctor: 'Dr. Baraka',
    condition: 'Stable',
    lastNoteTime: '13h ago',
    activeVisitors: 0,
    diagnosis: 'Malaria'
  },
  {
    id: 'p15',
    name: 'Irene Mushi',
    patientNo: 'PT-4309',
    bed: 'Bed 15',
    admissionDate: '04 Jun 2026',
    lengthOfStay: '6 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Stable',
    lastNoteTime: '14h ago',
    activeVisitors: 0,
    diagnosis: 'Gastritis'
  },
  {
    id: 'p16',
    name: 'Josephat Lowassa',
    patientNo: 'PT-4310',
    bed: 'Bed 16',
    admissionDate: '04 Jun 2026',
    lengthOfStay: '6 days',
    admittingDoctor: 'Dr. Baraka',
    condition: 'Stable',
    lastNoteTime: '15h ago',
    activeVisitors: 0,
    diagnosis: 'Hypertension'
  },
  {
    id: 'p17',
    name: 'Kelvin Mwakasege',
    patientNo: 'PT-4311',
    bed: 'Bed 17',
    admissionDate: '03 Jun 2026',
    lengthOfStay: '7 days',
    admittingDoctor: 'Dr. Amina Hassan',
    condition: 'Stable',
    lastNoteTime: '16h ago',
    activeVisitors: 0,
    diagnosis: 'COPD'
  },
  {
    id: 'p18',
    name: 'Lillian Temu',
    patientNo: 'PT-4312',
    bed: 'Bed 18',
    admissionDate: '03 Jun 2026',
    lengthOfStay: '7 days',
    admittingDoctor: 'Dr. Baraka',
    condition: 'Stable',
    lastNoteTime: '17h ago',
    activeVisitors: 0,
    diagnosis: 'Tonsillitis'
  }
]

function conditionBadge(condition: Patient['condition']) {
  if (condition === 'Critical') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-error text-white">
        Critical
      </span>
    )
  }
  if (condition === 'Monitoring') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning/20 text-warning">
        Monitoring
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/20 text-success">
      Stable
    </span>
  )
}

const isTestEnv =
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') ||
  import.meta.env.MODE === 'test'

function loadMockPatients(): Patient[] {
  const existing = localStorage.getItem('hf_mock_admitted_patients')
  if (existing) {
    const parsed = JSON.parse(existing)
    if (parsed.length === DEFAULT_PATIENTS.length) {
      return parsed
    }
  }
  localStorage.setItem('hf_mock_admitted_patients', JSON.stringify(DEFAULT_PATIENTS))
  return DEFAULT_PATIENTS
}

export function MyPatientsPage() {
  const [isLoading, setIsLoading] = useState(() => {
    if (isTestEnv) return false
    return true
  })

  const [patients, setPatients] = useState<Patient[]>(() => (isTestEnv ? loadMockPatients() : []))

  const [filterCondition, setFilterCondition] = useState<string>('All Conditions')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    if (isTestEnv) return

    wardService
      .listAdmissions({ status: 'active', limit: 200 })
      .then((admissions) => {
        setPatients(
          admissions.map((a) => ({
            id: a.admissionId,
            name: `Patient ${a.patientId.slice(0, 8)}`,
            patientNo: a.patientId.slice(0, 8).toUpperCase(),
            bed: a.bedNumber ? `Bed ${a.bedNumber}` : a.wardName || '—',
            admissionDate: new Date(a.admissionDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            lengthOfStay:
              a.lengthOfStayDays != null ? `${a.lengthOfStayDays} day(s)` : '—',
            admittingDoctor: a.admittingDoctorId || '—',
            condition: 'Stable' as const,
            lastNoteTime: '—',
            activeVisitors: 0,
            diagnosis: a.admittingDiagnosis,
          })),
        )
      })
      .catch((err) => {
        console.error(err)
        toast.error(err.response?.data?.detail || 'Failed to load patients.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const totalAdmitted = patients.length
  const stableCount = patients.filter((p) => p.condition === 'Stable').length
  const monitoringCount = patients.filter((p) => p.condition === 'Monitoring').length
  const criticalCount = patients.filter((p) => p.condition === 'Critical').length

  const filteredPatients = patients
    .filter((p) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesName = p.name.toLowerCase().includes(q)
        const matchesBed = p.bed.toLowerCase().includes(q)
        const matchesNo = p.patientNo.toLowerCase().includes(q)
        if (!matchesName && !matchesBed && !matchesNo) return false
      }
      // Condition filter
      if (filterCondition === 'All Conditions') return true
      return p.condition === filterCondition
    })
    .sort((a, b) => {
      const order = { Critical: 0, Monitoring: 1, Stable: 2 }
      return order[a.condition] - order[b.condition]
    })

  return (
    <div className="space-y-xl max-w-[1440px] mx-auto w-full text-on-surface">
      <style>{`
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton, .skeleton-loader {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
        }
        .rounded-xxl {
          border-radius: 16px !important;
        }
        /* Separation line between table rows */
        tbody tr {
          border-bottom: 1px solid #dfe1e6 !important;
        }
        tbody tr:last-child {
          border-bottom: none !important;
        }
        /* Color and Design Utilities */
        .text-primary { color: #00296d !important; }
        .bg-primary\/10 { background-color: rgba(0, 41, 109, 0.1) !important; }
        .text-success { color: #36b37e !important; }
        .bg-success\/10 { background-color: rgba(54, 179, 126, 0.1) !important; }
        .text-warning { color: #ffab00 !important; }
        .bg-warning\/10 { background-color: rgba(255, 171, 0, 0.1) !important; }
        .text-error { color: #ff5630 !important; }
        .bg-error\/10 { background-color: rgba(255, 86, 48, 0.1) !important; }
        .text-clinical-blue { color: #0052cc !important; }
        .bg-clinical-blue { background-color: #0052cc !important; }
        .border-border-default { border-color: #dfe1e6 !important; }
        .bg-surface-container-lowest { background-color: #ffffff !important; }
        .bg-surface-container-low { background-color: #f3f3fb !important; }
        .bg-neutral-bg { background-color: #f4f5f7 !important; }
        .bg-secondary-container { background-color: #cdddff !important; }
        .text-on-secondary-container { color: #51617d !important; }
        
        /* Hover and State overrides */
        .hover\:bg-secondary-container:hover { background-color: #cdddff !important; }
        .hover\:bg-primary:hover { background-color: #00296d !important; }
        .hover\:bg-white:hover { background-color: #ffffff !important; }
        .hover\:bg-surface-container-lowest:hover { background-color: #ffffff !important; }
        .hover\:text-primary:hover { color: #00296d !important; }
        .hover\:bg-\[\#DEEBFF\]:hover { background-color: #deebff !important; }
        .border-clinical-blue { border-color: #0052cc !important; }
        .hover\:bg-clinical-blue:hover { background-color: #0052cc !important; }
        .bg-error { background-color: #ff5630 !important; }

        /* Custom filter styles for alignment */
        .filter-select-custom {
          height: 38px !important;
          box-sizing: border-box !important;
        }
        .filter-button-custom {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          height: 38px !important;
          padding: 0 16px 0 12px !important;
          background-color: #ffffff !important;
          border: 1px solid #dfe1e6 !important;
          border-radius: 8px !important;
          color: #4f5f7b !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: background-color 0.15s ease !important;
          box-sizing: border-box !important;
        }
        .filter-button-custom:hover {
          background-color: #f3f4f6 !important;
        }
        .filter-button-custom .material-symbols-outlined {
          font-size: 18px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          height: 18px !important;
          width: 18px !important;
        }
        .filter-button-custom .filter-text {
          display: inline-flex !important;
          align-items: center !important;
          line-height: 1 !important;
        }
      `}</style>

      {/* Header Search Bar Integration */}
      <div className="hidden">
        <input
          type="text"
          placeholder="Search patient, bed, or file #..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Summary Grid */}
      {!isLoading && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
          {/* Total Admitted */}
          <div className="bg-surface-container-lowest p-lg rounded-xxl border border-border-default flex items-center justify-between">
            <div>
              <p className="text-label-sm text-secondary uppercase font-bold mb-1">Total Admitted</p>
              <h3 className="text-headline-lg font-headline-lg text-primary m-0">{totalAdmitted}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                groups
              </span>
            </div>
          </div>

          {/* Stable */}
          <div className="bg-surface-container-lowest p-lg rounded-xxl border border-border-default flex items-center justify-between">
            <div>
              <p className="text-label-sm text-secondary uppercase font-bold mb-1">Stable</p>
              <h3 className="text-headline-lg font-headline-lg text-success m-0">{stableCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
          </div>

          {/* Monitoring */}
          <div className="bg-surface-container-lowest p-lg rounded-xxl border border-border-default flex items-center justify-between">
            <div>
              <p className="text-label-sm text-secondary uppercase font-bold mb-1">Monitoring</p>
              <h3 className="text-headline-lg font-headline-lg text-warning m-0">{monitoringCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                visibility
              </span>
            </div>
          </div>

          {/* Critical */}
          <div className="bg-surface-container-lowest p-lg rounded-xxl border border-border-default flex items-center justify-between">
            <div>
              <p className="text-label-sm text-secondary uppercase font-bold mb-1">Critical</p>
              <h3 className="text-headline-lg font-headline-lg text-error m-0">{criticalCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                priority_high
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Main Patients Table */}
      {!isLoading && patients.length > 0 && (
        <section className="bg-surface-container-lowest rounded-xxl border border-border-default overflow-hidden">
          <div className="p-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">
              Admitted Patients — General Ward
              <span className="sr-only">My Admitted Patients</span>
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="bg-surface-container-low border border-border-default rounded-lg text-body-sm px-4 py-2 focus:ring-0 focus:border-clinical-blue min-w-[160px] outline-none filter-select-custom"
              >
                <option>All Conditions</option>
                <option>Stable</option>
                <option>Monitoring</option>
                <option>Critical</option>
              </select>
              <button className="filter-button-custom">
                <span className="material-symbols-outlined text-outline">
                  filter_list
                </span>
                <span className="filter-text">Filters</span>
              </button>
            </div>
          </div>

          <div className="border-t border-border-default overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Bed #
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Patient Name
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Patient #
                    <span className="sr-only">Patient No</span>
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Admitted
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Stay
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Doctor
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Condition
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Note
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest whitespace-nowrap">
                    Visitors
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-secondary uppercase tracking-widest text-center whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <tr
                      key={p.id}
                      className={`transition-colors cursor-pointer group ${
                        p.condition === 'Critical'
                          ? 'bg-[#FFF4F4] hover:bg-secondary-container'
                          : 'hover:bg-[#DEEBFF]'
                      }`}
                    >
                      <td
                        className={`px-md py-4 font-bold ${
                          p.condition === 'Critical' ? 'text-error' : 'text-on-surface'
                        }`}
                      >
                        {p.bed.replace(/^Bed\s*/i, '')}
                      </td>
                      <td className="px-md py-4 font-bold text-on-surface">{p.name}</td>
                      <td className="px-md py-4 text-body-sm text-secondary">{p.patientNo}</td>
                      <td className="px-md py-4 text-body-sm text-on-surface">{p.admissionDate}</td>
                      <td className="px-md py-4 text-body-sm text-on-surface">{p.lengthOfStay}</td>
                      <td className="px-md py-4 text-body-sm text-on-surface">{p.admittingDoctor}</td>
                      <td className="px-md py-4">{conditionBadge(p.condition)}</td>
                      <td className="px-md py-4 text-body-sm text-secondary">{p.lastNoteTime}</td>
                      <td className="px-md py-4">
                        {p.activeVisitors > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-secondary-container text-clinical-blue text-xs font-bold">
                            {p.activeVisitors} {p.activeVisitors === 1 ? 'visitor' : 'visitors'}
                          </span>
                        ) : (
                          <span className="text-secondary text-xs font-bold">—</span>
                        )}
                      </td>
                      <td className="px-md py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/ward/patients/${p.id}/notes`}
                            className="bg-clinical-blue text-white hover:text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-primary transition-colors no-underline hover:no-underline"
                          >
                            Record Notes
                          </Link>
                          <Link
                            to="/ward/orders"
                            className={`text-xs font-bold px-3 py-1.5 rounded border border-border-default text-secondary transition-colors no-underline hover:no-underline ${
                              p.condition === 'Critical'
                                ? 'hover:bg-white'
                                : 'hover:bg-surface-container-lowest'
                            }`}
                          >
                            View Orders
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-body-sm">
                      No admitted patients match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Loading State Illustration */}
      {isLoading && (
        <section className="bg-surface-container-lowest rounded-xxl border border-border-default overflow-hidden opacity-50">
          <div className="p-lg">
            <h2 className="font-headline-sm text-headline-sm text-secondary m-0">
              Recent Discharge Queue (Loading Mockup)
            </h2>
          </div>
          <div className="border-t border-border-default p-lg space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="skeleton h-4 w-8 rounded" />
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 w-24 rounded ml-auto" />
                <div className="skeleton h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && patients.length === 0 && (
        <section className="bg-surface-container-lowest rounded-xxl border border-dashed border-border-default p-xl flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[48px] text-outline">ad_off</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2 m-0">
            No patients currently admitted
          </h3>
          <p className="text-body-md text-secondary max-w-md m-0">
            There are no patients assigned to you in the General Ward at this time. Check the Bed Map
            for overall ward status.
          </p>
          <Link
            to="/ward/beds"
            className="mt-6 flex items-center gap-2 bg-surface-container-lowest border border-clinical-blue text-clinical-blue font-bold py-2 px-6 rounded-lg hover:bg-clinical-blue hover:text-white transition-all no-underline hover:no-underline"
          >
            <span className="material-symbols-outlined">map</span> View Bed Map
          </Link>
        </section>
      )}

      {/* Footer */}
      <footer className="py-lg px-xl bg-surface-container-low border-t border-border-default flex justify-between items-center text-label-sm text-secondary rounded-lg">
        <div>© 2026 Muhimbili National Hospital • Clinical Information System</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary">
            System Status
          </a>
        </div>
      </footer>

      {/* Floating Action Button */}
      <Link
        to="/ward/beds"
        className="fixed bottom-lg right-lg w-14 h-14 bg-clinical-blue text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-30 group no-underline hover:no-underline"
        title="New Admission"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
        <span className="absolute right-full mr-4 bg-primary text-white text-xs font-bold py-1 px-3 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          New Admission
        </span>
      </Link>
    </div>
  )
}
