import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

interface Patient {
  id: string
  name: string
  patientNo: string
  condition: 'Stable' | 'Monitoring' | 'Critical'
  admittingDoctor: string
  activeVisitors: number
  diagnosis: string
  admissionDate?: string
  los?: string
}

interface Bed {
  id: string
  code: string
  status: 'Stable' | 'Monitoring' | 'Critical' | 'Available' | 'Cleaning' | 'Reserved'
  patient?: Patient
  reservedFor?: string
  reservedEta?: string
  alert?: string
}

const getBedsWithPatients = (): Bed[] => {
  const beds = JSON.parse(localStorage.getItem('hf_mock_beds') || '[]')
  const patients = JSON.parse(localStorage.getItem('hf_mock_admitted_patients') || '[]')
  return beds.map((b: any) => {
    if (b.patientId) {
      const patient = patients.find((p: any) => p.id === b.patientId)
      // Fall back to inline _extraPatient for demo beds not in admitted list
      return { ...b, patient: patient ?? b._extraPatient ?? undefined }
    }
    return b
  })
}

// Left strip color per status
const stripColor = (status: Bed['status']) => {
  switch (status) {
    case 'Stable':      return 'bg-success'
    case 'Monitoring':  return 'bg-warning'
    case 'Critical':    return 'bg-error'
    default:            return ''
  }
}

// Progress bar color
const barColor = (status: Bed['status']) => {
  switch (status) {
    case 'Stable':     return 'bg-success'
    case 'Monitoring': return 'bg-warning'
    case 'Critical':   return 'bg-error'
    default:           return 'bg-surface-container'
  }
}

export function BedMapPage() {
  const [beds, setBeds] = useState<Bed[]>(() => getBedsWithPatients())
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null)
  const [assigningBed, setAssigningBed] = useState<Bed | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [pendingAdmissions] = useState<any[]>(() =>
    JSON.parse(localStorage.getItem('hf_mock_pending_admissions') || '[]')
  )

  const filteredAdmissions = pendingAdmissions.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssignPatient = (patientName: string, diagnosis: string) => {
    if (!assigningBed) return
    const newPatient: Patient = {
      id: `p-${Date.now()}`,
      name: patientName,
      patientNo: `HN-${Math.floor(1000 + Math.random() * 9000)}`,
      condition: 'Stable',
      admittingDoctor: 'Dr. Sarah Mwangi',
      activeVisitors: 0,
      diagnosis,
    }

    const currentPatients = JSON.parse(localStorage.getItem('hf_mock_admitted_patients') || '[]')
    currentPatients.push(newPatient)
    localStorage.setItem('hf_mock_admitted_patients', JSON.stringify(currentPatients))

    const currentBeds = JSON.parse(localStorage.getItem('hf_mock_beds') || '[]')
    const updatedBeds = currentBeds.map((b: any) =>
      b.id === assigningBed.id ? { ...b, status: 'Stable', patientId: newPatient.id } : b
    )
    localStorage.setItem('hf_mock_beds', JSON.stringify(updatedBeds))

    setBeds(getBedsWithPatients())
    toast.success(`Patient ${patientName} assigned to ${assigningBed.code}`)
    setAssigningBed(null)
    setSearchQuery('')
  }

  const handleBedClick = (bed: Bed) => {
    if (bed.status === 'Available') {
      setAssigningBed(bed)
      setSelectedBed(null)
    } else if (bed.patient) {
      setSelectedBed(bed)
      setAssigningBed(null)
    } else {
      toast.info(`${bed.code} is currently ${bed.status.toLowerCase()}`)
    }
  }

  const isOccupied = (bed: Bed) =>
    bed.status === 'Stable' || bed.status === 'Monitoring' || bed.status === 'Critical'

  return (
    <div className="p-lg max-w-container-max mx-auto min-h-screen bg-neutral-bg">

      {/* Page header */}
      <div className="mb-lg">
        <div className="flex justify-between items-center mb-md">
          <h2 className="font-headline-md text-headline-md text-on-surface m-0">
            Bed Map — General Ward
          </h2>
          <button className="flex items-center gap-sm px-md py-1.5 bg-white border border-border-default rounded-lg hover:bg-neutral-bg transition-colors">
            <span className="font-label-md text-label-md text-slate-secondary">General Ward</span>
            <span className="material-symbols-outlined text-secondary text-[16px]">expand_more</span>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-xl p-md bg-white border border-border-default rounded-xl flex-wrap">
          {[
            { dot: 'bg-success', label: 'Stable' },
            { dot: 'bg-warning', label: 'Monitoring' },
            { dot: 'bg-error', label: 'Critical' },
            { dot: 'bg-white border border-border-default', label: 'Available' },
            { dot: 'bg-border-default', label: 'Cleaning' },
            { dot: 'bg-[#DEEBFF]', label: 'Reserved' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-sm">
              <div className={`w-3 h-3 rounded-full ${item.dot}`} />
              <span className="text-label-md font-label-md text-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bed grid */}
      <div className="bg-white border border-border-default rounded-2xl p-lg">
        <div
          className="grid gap-md"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          }}
        >
          {beds.map((bed) => {
            // Available bed card
            if (bed.status === 'Available') {
              return (
                <div
                  key={bed.id}
                  onClick={() => handleBedClick(bed)}
                  className="h-[120px] bg-white border border-dashed border-border-default rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-all"
                >
                  <span className="material-symbols-outlined text-secondary text-[24px] mb-xs">
                    add_circle
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary uppercase">
                    {bed.code}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Available
                  </span>
                </div>
              )
            }

            // Cleaning bed card
            if (bed.status === 'Cleaning') {
              return (
                <div
                  key={bed.id}
                  className="h-[120px] bg-border-default/50 border border-border-default rounded-lg flex flex-col items-center justify-center"
                >
                  <span className="material-symbols-outlined text-secondary text-[24px] mb-xs">
                    cleaning_services
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary uppercase">
                    {bed.code}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Cleaning
                  </span>
                </div>
              )
            }

            // Reserved bed card
            if (bed.status === 'Reserved') {
              return (
                <div
                  key={bed.id}
                  className="h-[120px] bg-[#DEEBFF] border border-clinical-blue/20 rounded-lg flex flex-col p-sm pl-md relative"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-label-sm text-label-sm text-clinical-blue uppercase font-bold">
                      {bed.code}
                    </span>
                    <span className="material-symbols-outlined text-clinical-blue text-[18px]">
                      event_repeat
                    </span>
                  </div>
                  <p className="font-label-md text-label-md text-on-surface font-bold m-0">
                    Reserved
                  </p>
                  <p className="font-label-sm text-label-sm text-secondary mt-1 m-0 line-clamp-2">
                    {bed.reservedFor ?? bed.patient?.name ?? '—'}
                  </p>
                  {bed.reservedEta && (
                    <div className="mt-auto">
                      <p className="font-label-sm text-label-sm text-clinical-blue m-0">
                        ETA: {bed.reservedEta}
                      </p>
                    </div>
                  )}
                </div>
              )
            }

            // Occupied bed card (Stable / Monitoring / Critical)
            const isCritical = bed.status === 'Critical'
            return (
              <div
                key={bed.id}
                onClick={() => handleBedClick(bed)}
                className={`h-[120px] border rounded-lg relative overflow-hidden flex flex-col cursor-pointer transition-all ${
                  isCritical
                    ? 'bg-[#FFF4F4] border-error hover:shadow-lg'
                    : 'bg-white border-border-default hover:border-clinical-blue'
                }`}
              >
                {/* Left status strip */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${stripColor(bed.status)}`}
                />

                <div className="p-sm flex flex-col h-full pl-lg">
                  {/* Top row */}
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`font-label-sm text-label-sm uppercase ${
                        isCritical ? 'text-error' : 'text-secondary'
                      }`}
                    >
                      {bed.code}
                    </span>
                    {isCritical ? (
                      <span
                        className="material-symbols-outlined text-error text-[20px]"
                        style={{
                          fontVariationSettings: "'FILL' 1",
                          animation: 'pulse-red 2s infinite',
                        }}
                      >
                        warning
                      </span>
                    ) : bed.patient ? (
                      <span className="flex items-center gap-xs px-1.5 py-0.5 bg-surface-container rounded font-label-sm text-label-sm text-secondary">
                        <span className="material-symbols-outlined text-[12px]">group</span>{' '}
                        {bed.patient.activeVisitors}
                      </span>
                    ) : null}
                  </div>

                  {/* Patient name */}
                  <p
                    className={`font-label-md text-label-md line-clamp-1 mb-2 m-0 ${
                      isCritical ? 'text-error' : 'text-on-surface'
                    }`}
                  >
                    {bed.patient?.name ?? bed.status}
                  </p>

                  {/* Bottom row */}
                  <div className="mt-auto">
                    {bed.status === 'Monitoring' && (
                      <span className="text-label-sm font-label-sm text-warning flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">vitals</span>
                        Vitals Check Due
                      </span>
                    )}
                    {isCritical && bed.alert && (
                      <p className="font-label-sm text-label-sm text-on-error-container m-0">
                        {bed.alert}
                      </p>
                    )}
                    {bed.status === 'Stable' && (
                      <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                        <div className={`${barColor(bed.status)} h-full w-3/4`} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Patient details popover — modal overlay */}
      {selectedBed && selectedBed.patient && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl border border-border-default shadow-2xl p-lg space-y-md relative">
            <button
              onClick={() => setSelectedBed(null)}
              className="absolute top-4 right-4 p-1 text-secondary hover:bg-neutral-bg rounded-lg transition border-0 bg-transparent cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">
                  {selectedBed.patient.name}
                </h3>
                <p className="text-label-md font-label-md text-secondary m-0 mt-1">
                  Patient ID: #{selectedBed.patient.patientNo}
                </p>
              </div>
              <div
                className={`px-2 py-1 rounded font-label-sm text-label-sm font-bold uppercase ${
                  selectedBed.patient.condition === 'Critical'
                    ? 'bg-error-container text-on-error-container'
                    : selectedBed.patient.condition === 'Monitoring'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-success/10 text-success'
                }`}
              >
                {selectedBed.patient.condition}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-md gap-x-md">
              {selectedBed.patient.admissionDate && (
                <div>
                  <p className="text-label-sm text-secondary uppercase m-0">Admission Date</p>
                  <p className="text-body-sm font-medium m-0">{selectedBed.patient.admissionDate}</p>
                </div>
              )}
              {selectedBed.patient.los && (
                <div>
                  <p className="text-label-sm text-secondary uppercase m-0">LOS</p>
                  <p className="text-body-sm font-medium m-0">{selectedBed.patient.los}</p>
                </div>
              )}
              <div className={selectedBed.patient.admissionDate ? 'col-span-2' : ''}>
                <p className="text-label-sm text-secondary uppercase m-0">Diagnosis</p>
                <p className="text-body-sm font-medium m-0">{selectedBed.patient.diagnosis}</p>
              </div>
              <div className="col-span-2">
                <p className="text-label-sm text-secondary uppercase m-0">Admitting Doctor</p>
                <p className="text-body-sm font-medium m-0">{selectedBed.patient.admittingDoctor}</p>
              </div>
            </div>

            <div className="flex gap-md pt-2">
              <Link
                to={`/ward/patients/${selectedBed.patient.id}/notes`}
                className="flex-1 px-md py-sm bg-clinical-blue text-white hover:text-white rounded font-label-md text-label-md hover:opacity-90 transition-opacity text-center no-underline hover:no-underline"
              >
                Record Notes
              </Link>
              <Link
                to="/ward/orders"
                className="flex-1 px-md py-sm border border-border-default text-slate-secondary rounded font-label-md text-label-md hover:bg-neutral-bg transition-colors text-center no-underline hover:no-underline"
              >
                View Orders
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Assign patient popover — modal overlay */}
      {assigningBed && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xs rounded-xl border border-border-default shadow-2xl p-md space-y-md relative">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-label-md text-on-surface m-0">
                Assign {assigningBed.code}
              </h3>
              <button
                onClick={() => {
                  setAssigningBed(null)
                  setSearchQuery('')
                }}
                className="p-1 text-secondary hover:bg-neutral-bg rounded-lg border-0 bg-transparent cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-body-sm border border-border-default rounded-lg focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue outline-none"
              />
              <span className="material-symbols-outlined absolute left-2 top-2 text-secondary text-[18px]">
                search
              </span>
            </div>

            <div className="max-h-[200px] overflow-y-auto divide-y divide-border-default/30">
              {filteredAdmissions.length > 0 ? (
                filteredAdmissions.map((pa) => (
                  <div
                    key={pa.id}
                    onClick={() => handleAssignPatient(pa.name, pa.diagnosis)}
                    className="py-3 cursor-pointer hover:bg-neutral-bg/50 rounded-lg px-2 transition flex justify-between items-center"
                  >
                    <div>
                      <h5 className="font-semibold text-on-surface text-sm m-0">{pa.name}</h5>
                      <p className="text-xs text-secondary mt-0.5 m-0">Diagnosis: {pa.diagnosis}</p>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-base">
                      chevron_right
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-secondary text-center py-4 m-0">
                  No pending admissions found.
                </p>
              )}
            </div>

            <button
              onClick={() => {
                if (filteredAdmissions.length > 0) {
                  handleAssignPatient(filteredAdmissions[0].name, filteredAdmissions[0].diagnosis)
                }
              }}
              className="w-full py-2 bg-clinical-blue text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity"
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      )}

      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse-red {
          0%   { transform: scale(1);   opacity: 1; }
          50%  { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
