import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { wardService } from '@/api/services/ward'
import type { AdmissionCondition } from '@/api/types/ward'

const conditionLabel = (c: AdmissionCondition): 'Stable' | 'Monitoring' | 'Critical' =>
  c === 'critical' ? 'Critical' : c === 'monitoring' ? 'Monitoring' : 'Stable'

interface PatientHandover {
  id: string
  name: string
  bed: string
  activeVisitors: number
  condition: string
  handoverNote: string
}

interface HandoverHistory {
  id: string
  timestamp: string
  date: string
  shift: string
  submittedBy: string
  patientCount: number
  incidents: string
  overallSummary: string
  patientNotes: { [key: string]: string }
}

function mapApiHandover(h: {
  handoverId: string
  shiftLabel: string
  submittedBy: string
  overallSummary: string
  incidentsSummary?: string | null
  patientCount: number
  patientNotes?: Record<string, string> | null
  createdAt: string
}): HandoverHistory {
  const created = new Date(h.createdAt)
  const date = created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return {
    id: h.handoverId,
    timestamp: `${date}, ${time}`,
    date,
    shift: h.shiftLabel,
    submittedBy: h.submittedBy,
    patientCount: h.patientCount,
    incidents: h.incidentsSummary || '0 Reported',
    overallSummary: h.overallSummary,
    patientNotes: h.patientNotes || {},
  }
}

export function ShiftHandoverPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')

  const [patients, setPatients] = useState<PatientHandover[]>([])
  const [overallSummary, setOverallSummary] = useState('')
  const [incidentsSummary, setIncidentsSummary] = useState('')
  const [history, setHistory] = useState<HandoverHistory[]>([])
  const [selectedReport, setSelectedReport] = useState<HandoverHistory | null>(null)

  useEffect(() => {
    Promise.all([
      wardService.listAdmissions({ status: 'active', limit: 200 }),
      wardService.listActiveVisitors(),
      wardService.listHandovers(50),
    ])
      .then(([admissions, activeVisitors, handovers]) => {
        const visitorCounts = new Map<string, number>()
        activeVisitors.forEach((v) => {
          if (!v.admissionId) return
          visitorCounts.set(v.admissionId, (visitorCounts.get(v.admissionId) || 0) + 1)
        })
        setPatients(
          admissions.map((a) => ({
            id: a.admissionId,
            name: `Patient ${a.patientId.slice(0, 8)}`,
            bed: a.bedNumber ? `Bed ${a.bedNumber}` : a.wardName || '—',
            activeVisitors: visitorCounts.get(a.admissionId) || 0,
            condition: conditionLabel(a.condition),
            handoverNote: '',
          })),
        )
        setHistory(handovers.map(mapApiHandover))
      })
      .catch(() => toast.error('Failed to load handover data.'))
  }, [])

  const handlePatientNoteChange = (patientId: string, note: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, handoverNote: note } : p)),
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!overallSummary.trim()) {
      toast.error('Please provide an overall shift summary.')
      return
    }

    const patientNotesMap: { [key: string]: string } = {}
    patients.forEach((p) => {
      patientNotesMap[p.name] = p.handoverNote || 'No specific notes recorded.'
    })

    const now = new Date()
    const shiftLabel = now.getHours() >= 7 && now.getHours() < 19 ? 'Day Shift' : 'Night Shift'

    wardService
      .createHandover({
        shiftLabel,
        overallSummary,
        incidentsSummary: incidentsSummary.trim() || '0 Reported',
        patientNotes: patientNotesMap,
      })
      .then((created) => {
        setHistory((prev) => [mapApiHandover(created), ...prev])
        toast.success('Shift handover submitted successfully.')
        setOverallSummary('')
        setIncidentsSummary('')
        setPatients((prev) => prev.map((p) => ({ ...p, handoverNote: '' })))
      })
      .catch(() => toast.error('Failed to submit handover.'))
  }

  return (
    <div className="w-full text-on-surface">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap');

        .font-headline-lg, .font-headline-md, .font-headline-sm {
          font-family: 'Manrope', sans-serif !important;
        }
        .font-body-lg, .font-body-md, .font-body-sm, .font-label-md, .font-label-sm, input, textarea, select, button, table {
          font-family: 'Inter', sans-serif !important;
        }

        .text-primary { color: #00296d !important; }
        .bg-primary\/10 { background-color: rgba(0, 41, 109, 0.1) !important; }
        .text-success { color: #36b37e !important; }
        .bg-success { background-color: #36b37e !important; }
        .bg-success\/10 { background-color: rgba(54, 179, 126, 0.1) !important; }
        .text-warning { color: #ffab00 !important; }
        .bg-warning { background-color: #ffab00 !important; }
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
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dfe1e6;
          border-radius: 10px;
        }
        .custom-shadow { box-shadow: 0px 4px 12px rgba(9, 30, 66, 0.15); }
        .modal-overlay { background: rgba(9, 30, 66, 0.54); backdrop-filter: blur(2px); }
      `}</style>

      <section className="px-xl py-lg max-w-container-max mx-auto">
        {/* Page Header Section */}
        <div className="flex justify-between items-end mb-lg">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface m-0">Shift Handover</h3>
            <div className="mt-base flex items-center gap-sm">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <p className="font-body-sm text-body-sm text-slate-secondary m-0">Ward 4B • General Ward</p>
            </div>
          </div>
          <div className="bg-surface-container-low border border-border-default px-md py-sm rounded-lg flex items-center gap-sm select-none">
            <span className="material-symbols-outlined text-[18px] text-slate-secondary">schedule</span>
            <span className="font-body-sm text-body-sm text-slate-secondary">Day Shift — 07:00 to 19:00</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-default mb-lg gap-xl select-none">
          <button
            id="tab-new"
            onClick={() => { setActiveTab('new'); }}
            className={`pb-md px-xs font-label-md text-label-md border-b-2 transition-all cursor-pointer bg-transparent border-0 ${
              activeTab === 'new'
                ? 'border-clinical-blue text-clinical-blue font-semibold'
                : 'border-transparent text-slate-secondary hover:text-on-surface'
            }`}
          >
            New Handover
          </button>
          <button
            id="tab-history"
            onClick={() => { setActiveTab('history'); }}
            className={`pb-md px-xs font-label-md text-label-md border-b-2 transition-all cursor-pointer bg-transparent border-0 ${
              activeTab === 'history'
                ? 'border-clinical-blue text-clinical-blue font-semibold'
                : 'border-transparent text-slate-secondary hover:text-on-surface'
            }`}
          >
            Handover History
          </button>
        </div>

        {/* State 1: New Handover View */}
        {activeTab === 'new' && (
          <form onSubmit={handleSubmit} className="space-y-lg">
            <div className="bg-surface-container-lowest border border-border-default rounded-xl overflow-hidden shadow-sm">
              <div className="px-lg py-md border-b border-border-default flex justify-between items-center bg-surface-container-low/30">
                <h4 className="font-headline-sm text-headline-sm m-0">Patients — General Ward ({patients.length})</h4>
                <div className="flex gap-sm select-none">
                  <button type="button" className="p-base hover:bg-surface-container rounded transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px] text-slate-secondary">filter_list</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest">
                      <th className="px-lg py-md font-label-md text-label-md text-slate-secondary border-b border-border-default w-24">Bed #</th>
                      <th className="px-lg py-md font-label-md text-label-md text-slate-secondary border-b border-border-default w-64">Patient Name</th>
                      <th className="px-lg py-md font-label-md text-label-md text-slate-secondary border-b border-border-default w-32">Status</th>
                      <th className="px-lg py-md font-label-md text-label-md text-slate-secondary border-b border-border-default w-32">Visitors</th>
                      <th className="px-lg py-md font-label-md text-label-md text-slate-secondary border-b border-border-default">Handover Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default text-body-sm">
                    {patients.map((p) => (
                      <tr key={p.id} className="hover:bg-[#DEEBFF] transition-colors">
                        <td className="px-lg py-md font-body-sm text-body-sm font-bold text-on-surface">{p.bed}</td>
                        <td className="px-lg py-md font-body-sm text-body-sm text-on-surface">{p.name}</td>
                        <td className="px-lg py-md">
                          <span className={`inline-flex items-center px-sm py-xs rounded text-[11px] font-bold uppercase ${
                            p.condition === 'Critical'
                              ? 'bg-error/10 text-error'
                              : p.condition === 'Stable'
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {p.condition}
                          </span>
                        </td>
                        <td className="px-lg py-md font-body-sm text-body-sm text-slate-secondary">
                          {p.activeVisitors} {p.activeVisitors === 1 ? 'Visitor' : 'Visitors'}
                        </td>
                        <td className="px-lg py-md">
                          <textarea
                            rows={2}
                            placeholder="Add clinical status updates..."
                            value={p.handoverNote}
                            onChange={(e) => handlePatientNoteChange(p.id, e.target.value)}
                            className="w-full border border-border-default rounded-lg p-sm text-body-sm focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue outline-none transition-all resize-none bg-white"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overall Shift Notes */}
            <div className="bg-surface-container-lowest border border-border-default rounded-xl p-lg space-y-md shadow-sm">
              <label className="font-headline-sm text-headline-sm block">Overall Shift Notes</label>
              <textarea
                rows={6}
                placeholder="General ward notes, incidents, equipment issues, etc. Describe general ward issues."
                value={overallSummary}
                onChange={(e) => setOverallSummary(e.target.value)}
                className="w-full border border-border-default rounded-lg p-md text-body-md focus:ring-2 focus:ring-clinical-blue/20 focus:border-clinical-blue outline-none transition-all bg-white"
              />
            </div>

            {/* Incidents */}
            <div className="bg-surface-container-lowest border border-border-default rounded-xl p-lg space-y-md shadow-sm">
              <label className="font-headline-sm text-headline-sm block">Incidents</label>
              <input
                type="text"
                placeholder="e.g. 1 Incident: minor IV line displacement, re-sited. Leave blank if none reported."
                value={incidentsSummary}
                onChange={(e) => setIncidentsSummary(e.target.value)}
                className="w-full border border-border-default rounded-lg p-md text-body-md focus:ring-2 focus:ring-clinical-blue/20 focus:border-clinical-blue outline-none transition-all bg-white"
              />
            </div>

            {/* Sticky CTA Container */}
            <div className="sticky bottom-xl bg-white/80 backdrop-blur-md border border-border-default p-md rounded-xl flex justify-end shadow-lg z-10">
              <button
                type="submit"
                className="bg-clinical-blue text-white font-label-md text-label-md px-xl h-10 rounded-lg hover:bg-primary-container transition-all flex items-center gap-sm border-0 cursor-pointer"
              >
                <span>Submit Handover</span>
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </form>
        )}

        {/* State 2: Handover History */}
        {activeTab === 'history' && !selectedReport && (
          <div className="bg-surface-container-lowest border border-border-default rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/30 border-b border-border-default">
                    <th className="px-lg py-md font-label-md text-label-md text-slate-secondary">Shift</th>
                    <th className="px-lg py-md font-label-md text-label-md text-slate-secondary">Date</th>
                    <th className="px-lg py-md font-label-md text-label-md text-slate-secondary">Submitted By</th>
                    <th className="px-lg py-md font-label-md text-label-md text-slate-secondary">Patients Covered</th>
                    <th className="px-lg py-md font-label-md text-label-md text-slate-secondary">Incidents</th>
                    <th className="px-lg py-md font-label-md text-label-md text-slate-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default text-body-sm">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-[#DEEBFF] transition-colors">
                      <td className="px-lg py-md font-body-sm text-body-sm font-medium text-on-surface">{h.shift}</td>
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface">{h.date}</td>
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface">{h.submittedBy}</td>
                      <td className="px-lg py-md font-body-sm text-body-sm text-on-surface">{h.patientCount}/{h.patientCount}</td>
                      <td className="px-lg py-md">
                        <span className={`inline-flex items-center px-sm py-xs rounded text-[11px] font-bold ${
                          h.incidents === '0 Reported'
                            ? 'bg-surface-container text-slate-secondary'
                            : 'bg-error/10 text-error'
                        }`}>
                          {h.incidents}
                        </span>
                      </td>
                      <td className="px-lg py-md text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(h)}
                          className="text-clinical-blue font-label-md text-label-md px-md h-8 border border-clinical-blue rounded hover:bg-clinical-blue/5 transition-all bg-transparent cursor-pointer"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Read-Only View Report Modal Overlay */}
        {selectedReport && (
          <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-md">
            <div className="bg-surface-container-lowest w-[600px] rounded-xl custom-shadow flex flex-col overflow-hidden animate-fadeIn">
              
              {/* Header */}
              <div className="px-lg py-md border-b border-border-default flex justify-between items-center bg-surface-container-low/30">
                <div>
                  <h4 className="font-headline-sm text-headline-sm m-0">Shift Handover Report Details</h4>
                  <span className="text-xs text-slate-400">{selectedReport.timestamp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="text-slate-secondary hover:text-on-surface p-1 hover:bg-neutral-bg rounded transition border-0 bg-transparent cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-lg space-y-md max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 py-3 bg-surface-container-low/30 rounded-lg px-4 border border-border-default">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Submitted By</span>
                    <span className="font-semibold text-slate-700">{selectedReport.submittedBy}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Shift / Date</span>
                    <span className="font-semibold text-slate-700">{selectedReport.shift} — {selectedReport.date}</span>
                  </div>
                </div>

                {/* Overall Summary */}
                <div className="space-y-xs">
                  <label className="font-label-md text-slate-secondary block">OVERALL SUMMARY</label>
                  <div className="p-4 bg-neutral-bg border border-border-default rounded-lg text-body-sm text-slate-700 leading-relaxed">
                    {selectedReport.overallSummary}
                  </div>
                </div>

                {/* Patient Notes */}
                <div className="space-y-xs">
                  <label className="font-label-md text-slate-secondary block">PATIENT NOTES</label>
                  <div className="border border-border-default rounded-xl overflow-hidden divide-y divide-border-default">
                    {Object.entries(selectedReport.patientNotes).map(([pName, pNote]) => (
                      <div key={pName} className="p-4 flex flex-col sm:flex-row justify-between items-start gap-2 hover:bg-[#DEEBFF] transition-colors bg-white">
                        <span className="font-bold text-slate-800 w-48 shrink-0">{pName}</span>
                        <p className="text-slate-600 text-body-sm leading-relaxed m-0 flex-1">{pNote}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-lg py-md bg-surface-container-low flex justify-end rounded-b-xl border-t border-border-default">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-lg h-10 bg-clinical-blue text-white rounded font-label-md hover:bg-primary-container transition-all border-0 cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}
      </section>
    </div>
  )
}
