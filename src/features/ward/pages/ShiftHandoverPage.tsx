import { useState } from 'react'
import { toast } from 'sonner'

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

export function ShiftHandoverPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')

  const [patients, setPatients] = useState<PatientHandover[]>(() => {
    const list = JSON.parse(localStorage.getItem('hf_mock_admitted_patients') || '[]')
    return list.map((p: any) => ({
      id: p.id,
      name: p.name,
      bed: p.bed,
      activeVisitors: p.activeVisitors || 0,
      condition: p.condition || 'Stable',
      handoverNote: ''
    }))
  })

  const [overallSummary, setOverallSummary] = useState('')

  const [history, setHistory] = useState<HandoverHistory[]>(() => {
    const raw = localStorage.getItem('hf_mock_handover_history')

    const defaults: HandoverHistory[] = [
      {
        id: 'h-1',
        timestamp: 'Jun 25, 2026, 07:30 PM',
        date: 'Jun 25, 2026',
        shift: 'Night Shift',
        submittedBy: 'Nurse John S.',
        patientCount: 18,
        incidents: '0 Reported',
        overallSummary: 'All patients stable. No major incidents during the night shift. Handover completed smoothly.',
        patientNotes: {
          'Fatuma Said': 'Stable overnight, vital signs monitored hourly.',
          'John Mwangi': 'NPO maintained for morning endoscopy.',
          'Juma Hamisi': 'Vitals stable. SpO2 stable at 97% on room air.',
          'Zuwena Said': 'Close monitoring of blood glucose levels. Insulin infusion ongoing.'
        }
      },
      {
        id: 'h-2',
        timestamp: 'Jun 25, 2026, 07:30 AM',
        date: 'Jun 25, 2026',
        shift: 'Day Shift',
        submittedBy: 'Nurse Thomas Lowassa, RN',
        patientCount: 5,
        incidents: '1 Incident',
        overallSummary: 'One minor incident: Bed 301-B patient had temporary IV line displacement, re-sited by medical officer. All other care completed successfully.',
        patientNotes: {
          'Juma Hamisi': 'Monitor vitals every 2 hours. High malaria count, IV Artesunate ongoing.',
          'Zuwena Said': 'Diabetic ketoacidosis. Check blood glucose levels every 4 hours.',
          'Emmanuel John': 'Post-op coronary bypass. Critical monitoring. Chest drain output is normal.',
          'Mariam Athuman': 'Stable. Blood pressure well controlled with current anti-hypertensive regimen.',
          'Neema Kessy': 'Pneumonia recovery. Oxygenation stable at 96% room air.'
        }
      },
      {
        id: 'h-3',
        timestamp: 'Jun 24, 2026, 07:30 PM',
        date: 'Jun 24, 2026',
        shift: 'Night Shift',
        submittedBy: 'Nurse Esther M.',
        patientCount: 5,
        incidents: '0 Reported',
        overallSummary: 'All patients stable. Routine checks performed. Morning labs drawn at 6:00 AM for all acute patients.',
        patientNotes: {
          'Juma Hamisi': 'Resting quietly. IV fluids running as scheduled.',
          'Zuwena Said': 'Blood glucose monitored, stable between 7.8 and 9.2 mmol/L.',
          'Emmanuel John': 'Resting comfortably, pain managed with analgesics.',
          'Mariam Athuman': 'Asleep. Vital signs stable throughout the night.',
          'Neema Kessy': 'Productive cough decreasing. Slept well.'
        }
      },
      {
        id: 'h-4',
        timestamp: 'Jun 24, 2026, 07:30 AM',
        date: 'Jun 24, 2026',
        shift: 'Day Shift',
        submittedBy: 'Nurse Amina Masoud, RN',
        patientCount: 6,
        incidents: '0 Reported',
        overallSummary: 'Regular day shift. Patient admissions completed from triage. Rounding doctors adjusted care plans.',
        patientNotes: {
          'Juma Hamisi': 'Admitted today from Emergency Department. Initiated severe malaria protocol.',
          'Zuwena Said': 'Transferred in for diabetic ketoacidosis management.',
          'Emmanuel John': 'Post-op monitoring. Checked surgical site, clean and dry.',
          'Mariam Athuman': 'Monitored for elevated blood pressure. Rest prescribed.',
          'Neema Kessy': 'Initiated chest physiotherapy.',
          'Ali Selemani': 'Admitted for scheduled appendectomy.'
        }
      },
      {
        id: 'h-5',
        timestamp: 'Jun 23, 2026, 07:30 PM',
        date: 'Jun 23, 2026',
        shift: 'Night Shift',
        submittedBy: 'Nurse Thomas Lowassa, RN',
        patientCount: 4,
        incidents: '1 Incident',
        overallSummary: 'Incident: Bed 303-A patient had minor wound site ooze, dressing reinforced, surgical team notified. No active bleeding. Other patients stable.',
        patientNotes: {
          'Emmanuel John': 'Wound site ooze noted. Dressing changed and reinforced.',
          'Mariam Athuman': 'Stable. Rested well with no complaints.',
          'Neema Kessy': 'SpO2 maintained above 95% on room air.',
          'Ali Selemani': 'Resting post-surgery, pain controlled.'
        }
      }
    ]

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        // Upgrade legacy records or empty cells in list
        const isOld = parsed.some((h: any) => h.fromNurse !== undefined || h.submittedBy === undefined || !h.shift || !h.date)
        const isWrongFirst = parsed[0]?.submittedBy !== 'Nurse John S.'
        if (!isOld && !isWrongFirst && parsed.length >= 3) {
          return parsed
        }
      } catch (e) {
        // Fall back to defaults on parse errors
      }
    }

    localStorage.setItem('hf_mock_handover_history', JSON.stringify(defaults))
    return defaults
  })

  const [selectedReport, setSelectedReport] = useState<HandoverHistory | null>(null)

  const handlePatientNoteChange = (patientId: string, note: string) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, handoverNote: note } : p))
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
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newHandover: HandoverHistory = {
      id: `h-${Date.now()}`,
      timestamp: `${formattedDate}, ${formattedTime}`,
      date: formattedDate,
      shift: now.getHours() >= 7 && now.getHours() < 19 ? 'Day Shift' : 'Night Shift',
      submittedBy: 'Nurse Esther Komba',
      patientCount: patients.length,
      incidents: '0 Reported',
      overallSummary,
      patientNotes: patientNotesMap,
    }

    const updatedHistory = [newHandover, ...history]
    setHistory(updatedHistory)
    localStorage.setItem('hf_mock_handover_history', JSON.stringify(updatedHistory))
    toast.success('Shift handover submitted successfully.')

    setOverallSummary('')
    setPatients((prev) => prev.map((p) => ({ ...p, handoverNote: '' })))
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
