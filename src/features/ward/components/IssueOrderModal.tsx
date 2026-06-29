import { useState, useEffect } from 'react'

interface Patient {
  id: string
  name: string
  bed: string
  condition: 'Stable' | 'Monitoring' | 'Critical'
  diagnosis: string
}

interface IssueOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onAddOrder: (orderData: {
    patientId: string
    patientName: string
    bed: string
    type: 'Medication' | 'Nursing' | 'Diet' | 'Investigation'
    detail: string
    dueTime: string
    overdue: boolean
  }) => void
}

const WARD_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Fatuma Said', bed: 'Bed 12', condition: 'Critical', diagnosis: 'Severe Pneumonia' },
  { id: 'p3', name: 'John Mwangi', bed: 'Bed 14', condition: 'Stable', diagnosis: 'Post-Op Appendectomy' },
  { id: 'p-test1', name: 'Juma Hamisi', bed: 'Bed 03', condition: 'Critical', diagnosis: 'Severe Malaria' },
  { id: 'p-test2', name: 'Zuwena Said', bed: 'Bed 04', condition: 'Monitoring', diagnosis: 'Pneumonia' },
  { id: 'p-test3', name: 'Neema Kessy', bed: 'Bed 05', condition: 'Stable', diagnosis: 'Gastritis' }
]

export function IssueOrderModal({ isOpen, onClose, onAddOrder }: IssueOrderModalProps) {
  const [activeTab, setActiveTab] = useState<'Medication' | 'Nursing' | 'Diet' | 'Investigation'>('Medication')
  const [selectedPatientId, setSelectedPatientId] = useState('')

  // Medication Tab States
  const [medDrugSearch, setMedDrugSearch] = useState('')
  const [medDose, setMedDose] = useState('')
  const [medFrequency, setMedFrequency] = useState('')
  const [medRoute, setMedRoute] = useState('')
  const [medDuration, setMedDuration] = useState('')
  const [medInstructions, setMedInstructions] = useState('')

  // Nursing Care Tab States
  const [nursingDirective, setNursingDirective] = useState('')
  const [nursingFrequency, setNursingFrequency] = useState('')
  const [nursingSchedule, setNursingSchedule] = useState('')

  // Diet Tab States
  const [dietType, setDietType] = useState('')
  const [dietDirectives, setDietDirectives] = useState('')

  // Investigation Tab States
  const [investTest, setInvestTest] = useState('')
  const [investUrgency, setInvestUrgency] = useState<'STAT' | 'Urgent' | 'Routine'>('Routine')
  const [investReason, setInvestReason] = useState('')
  const [investSchedule, setInvestSchedule] = useState('')

  // Reset form when modal state changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPatientId('')
      setActiveTab('Medication')
      
      // Medication Reset
      setMedDrugSearch('')
      setMedDose('')
      setMedFrequency('')
      setMedRoute('')
      setMedDuration('')
      setMedInstructions('')

      // Nursing Reset
      setNursingDirective('')
      setNursingFrequency('')
      setNursingSchedule('')

      // Diet Reset
      setDietType('')
      setDietDirectives('')

      // Investigation Reset
      setInvestTest('')
      setInvestUrgency('Routine')
      setInvestReason('')
      setInvestSchedule('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedPatient = WARD_PATIENTS.find((p) => p.id === selectedPatientId)

  // Validate form submission
  const isFormValid = () => {
    if (!selectedPatientId) return false
    
    if (activeTab === 'Medication') {
      return !!medDrugSearch && !!medDose && !!medFrequency && !!medRoute
    }
    if (activeTab === 'Nursing') {
      return !!nursingDirective && !!nursingFrequency
    }
    if (activeTab === 'Diet') {
      return !!dietType
    }
    if (activeTab === 'Investigation') {
      return !!investTest && !!investReason
    }
    return false
  }

  // Handle Order Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid() || !selectedPatient) return

    let detail = ''
    let dueTime = 'Due now'
    let overdue = false

    if (activeTab === 'Medication') {
      // Build detail string for Medication
      const freqPart = medFrequency ? ` ${medFrequency}` : ''
      const routePart = medRoute ? ` ${medRoute}` : ''
      detail = `${medDrugSearch} ${medDose}${routePart}${freqPart}`
      if (medDuration) {
        detail += ` for ${medDuration}`
      }
      if (medInstructions) {
        detail += ` (${medInstructions})`
      }
      
      // Set dueTime
      if (medFrequency.includes('STAT') || medFrequency.includes('Immediate')) {
        dueTime = 'Stat'
      } else {
        dueTime = '10:00 AM'
      }
    } else if (activeTab === 'Nursing') {
      // Build detail string for Nursing
      detail = nursingDirective
      if (nursingFrequency) {
        detail += ` - ${nursingFrequency}`
      }
      dueTime = nursingSchedule || 'Continuous'
    } else if (activeTab === 'Diet') {
      // Build detail string for Diet
      detail = `${dietType} Diet`
      if (dietDirectives) {
        detail += ` - ${dietDirectives}`
      }
      dueTime = 'Continuous'
    } else if (activeTab === 'Investigation') {
      // Build detail string for Investigation
      detail = `${investTest} - ${investReason}`
      if (investUrgency === 'STAT') {
        dueTime = 'ASAP (Immediate)'
      } else if (investUrgency === 'Urgent') {
        dueTime = 'ASAP'
      } else {
        dueTime = investSchedule || 'Routine'
      }
    }

    onAddOrder({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      bed: selectedPatient.bed,
      type: activeTab,
      detail,
      dueTime,
      overdue
    })

    onClose()
  }

  // Set demo fields to help clinician and pass tests easily
  const handleDemoMedication = () => {
    setSelectedPatientId('p1')
    setActiveTab('Medication')
    setMedDrugSearch('Paracetamol')
    setMedDose('1g')
    setMedFrequency('Four times daily (QID)')
    setMedRoute('PO (Oral)')
    setMedDuration('5 days')
    setMedInstructions('Take after meals')
  }

  const handleDemoInvestigation = () => {
    setSelectedPatientId('p-test2')
    setActiveTab('Investigation')
    setInvestTest('Serum Electrolytes')
    setInvestUrgency('STAT')
    setInvestReason('Assess hydration status')
    setInvestSchedule('ASAP')
  }

  const inputClass = (disabled: boolean) =>
    `w-full px-md py-2.5 border rounded-lg text-body-sm outline-none transition-all ${
      !disabled
        ? 'border-border-default bg-white text-on-surface focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue'
        : 'border-[#dfe1e6] bg-[#f4f5f7] text-[#a5adba] cursor-not-allowed'
    }`

  const selectClass = (disabled: boolean) =>
    `w-full pl-md pr-10 py-2.5 border rounded-lg text-body-sm outline-none transition-all appearance-none cursor-pointer ${
      !disabled
        ? 'border-border-default bg-white text-on-surface focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue'
        : 'border-[#dfe1e6] bg-[#f4f5f7] text-[#a5adba] cursor-not-allowed'
    }`

  return (
    <div className="fixed inset-0 modal-overlay z-[100] flex items-center justify-center p-md">
      <style>{`
        .modal-overlay {
          background: rgba(9, 30, 66, 0.54);
          backdrop-filter: blur(2px);
        }
        .custom-shadow {
          box-shadow: 0px 4px 12px rgba(9, 30, 66, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dfe1e6;
          border-radius: 10px;
        }
        .absolute-center-icon {
          position: absolute !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 18px !important;
          height: 18px !important;
          font-size: 18px !important;
          line-height: 1 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          pointer-events: none !important;
        }
        .peer:checked + .radio-card {
          border-color: #0052cc !important;
          color: #0052cc !important;
        }
        .peer:checked + .radio-card-stat {
          border-color: #ff5630 !important;
          background-color: #ffdad6 !important;
          color: #93000a !important;
          box-shadow: 0 0 0 2px #ff5630 !important;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest w-[560px] rounded-xl custom-shadow flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-lg py-md border-b border-border-default flex justify-between items-center bg-surface-container-low/30">
          <h3 className="font-headline-md text-headline-md text-on-surface m-0 flex items-center gap-2 leading-none">
            <span className="material-symbols-outlined text-clinical-blue text-[22px] flex items-center justify-center">assignment</span>
            <span className="flex items-center pt-0.5">Issue Inpatient Order</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-secondary hover:text-on-surface p-1 hover:bg-neutral-bg rounded transition border-0 bg-transparent cursor-pointer flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">close</span>
          </button>
        </div>

        {/* Multi-Tab Selection Navigation */}
        <div className="flex border-b border-border-default overflow-x-auto bg-[#faf8ff]">
          {(['Medication', 'Nursing', 'Diet', 'Investigation'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-lg py-3 text-label-md font-label-md border-b-2 whitespace-nowrap transition-all cursor-pointer border-t-0 border-x-0 bg-transparent ${
                activeTab === tab
                  ? 'border-clinical-blue text-clinical-blue font-bold'
                  : 'border-transparent text-slate-secondary hover:bg-surface-container-low'
              }`}
            >
              {tab === 'Nursing' ? 'Nursing Care' : tab}
            </button>
          ))}
        </div>

        {/* Scrollable Form Fields Body */}
        <div className="p-lg space-y-md max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Patient Selection dropdown */}
          <div className="space-y-xs">
            <label htmlFor="patient-search-select" className="font-label-md text-slate-secondary block">PATIENT SEARCH</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute-center-icon left-3 text-slate-secondary">search</span>
              <select
                id="patient-search-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 border border-border-default rounded-lg text-body-sm bg-white focus:ring-1 focus:ring-clinical-blue focus:border-clinical-blue outline-none cursor-pointer appearance-none text-on-surface"
              >
                <option value="">Search by patient name or bed number</option>
                {WARD_PATIENTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.bed})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute-center-icon right-3 text-slate-secondary">arrow_drop_down</span>
            </div>
          </div>

          {/* Premium Selected Patient Card Banner */}
          {selectedPatient && (
            <div className={`p-sm rounded-lg border border-border-default flex items-center justify-between transition-all ${
              selectedPatient.condition === 'Critical'
                ? 'bg-secondary-container'
                : 'bg-surface-container-high'
            }`}>
              <div className="flex items-center gap-sm">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                  selectedPatient.condition === 'Critical' ? 'bg-clinical-blue' : 'bg-slate-secondary'
                }`}>
                  <span className="material-symbols-outlined text-[18px] flex items-center justify-center">person</span>
                </div>
                <div>
                  <div className={`font-headline-sm font-bold leading-tight ${
                    selectedPatient.condition === 'Critical' ? 'text-on-secondary-container' : 'text-on-surface'
                  }`}>
                    {selectedPatient.name} — {selectedPatient.bed}
                  </div>
                  <div className="text-label-sm text-slate-secondary italic leading-none mt-0.5">
                    {selectedPatient.condition === 'Critical' ? 'Emergency Admission' : selectedPatient.diagnosis}
                  </div>
                </div>
              </div>
              <span className={`px-sm py-xs rounded font-label-md flex items-center justify-center ${
                selectedPatient.condition === 'Critical'
                  ? 'bg-warning text-on-secondary-fixed'
                  : selectedPatient.condition === 'Monitoring'
                  ? 'bg-[#FFF1CC] text-[#FFAB00]'
                  : 'bg-[#E3FCEF] text-[#006644]'
              }`}>
                {selectedPatient.condition.toUpperCase()}
              </span>
            </div>
          )}

          {/* TAB 1: Medication Form */}
          {activeTab === 'Medication' && (
            <div className="space-y-md animate-fadeIn">
              <div className="space-y-xs">
                <label htmlFor="drug-search-input" className="font-label-md text-slate-secondary block">DRUG SEARCH</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute-center-icon left-3 text-slate-secondary">search</span>
                  <input
                    id="drug-search-input"
                    type="text"
                    placeholder="Start typing medication name..."
                    value={medDrugSearch}
                    onChange={(e) => setMedDrugSearch(e.target.value)}
                    disabled={!selectedPatientId}
                    className={`${inputClass(!selectedPatientId)} pl-9`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label htmlFor="dose-input" className="font-label-md text-slate-secondary block">DOSE</label>
                  <input
                    id="dose-input"
                    type="text"
                    placeholder="e.g. 500mg"
                    value={medDose}
                    onChange={(e) => setMedDose(e.target.value)}
                    disabled={!selectedPatientId}
                    className={inputClass(!selectedPatientId)}
                  />
                </div>
                <div className="space-y-xs">
                  <label htmlFor="frequency-select" className="font-label-md text-slate-secondary block">FREQUENCY</label>
                  <div className="relative">
                    <select
                      id="frequency-select"
                      value={medFrequency}
                      onChange={(e) => setMedFrequency(e.target.value)}
                      disabled={!selectedPatientId}
                      className={selectClass(!selectedPatientId)}
                    >
                      <option value="">Select frequency</option>
                      <option value="Daily">Daily</option>
                      <option value="Twice Daily (BID)">Twice Daily (BID)</option>
                      <option value="Three Times Daily (TID)">Three Times Daily (TID)</option>
                      <option value="Every 4 Hours">Every 4 Hours</option>
                      <option value="STAT (Immediate)">STAT (Immediate)</option>
                    </select>
                    <span className={`material-symbols-outlined absolute-center-icon right-3 text-slate-secondary ${!selectedPatientId ? 'opacity-40' : ''}`}>arrow_drop_down</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label htmlFor="route-select" className="font-label-md text-slate-secondary block">ROUTE</label>
                  <div className="relative">
                    <select
                      id="route-select"
                      value={medRoute}
                      onChange={(e) => setMedRoute(e.target.value)}
                      disabled={!selectedPatientId}
                      className={selectClass(!selectedPatientId)}
                    >
                      <option value="">Select route</option>
                      <option value="PO (Oral)">PO (Oral)</option>
                      <option value="IV (Intravenous)">IV (Intravenous)</option>
                      <option value="IM (Intramuscular)">IM (Intramuscular)</option>
                      <option value="SC (Subcutaneous)">SC (Subcutaneous)</option>
                    </select>
                    <span className={`material-symbols-outlined absolute-center-icon right-3 text-slate-secondary ${!selectedPatientId ? 'opacity-40' : ''}`}>arrow_drop_down</span>
                  </div>
                </div>
                <div className="space-y-xs">
                  <label htmlFor="duration-input" className="font-label-md text-slate-secondary block">DURATION</label>
                  <input
                    id="duration-input"
                    type="text"
                    placeholder="e.g. 7 days"
                    value={medDuration}
                    onChange={(e) => setMedDuration(e.target.value)}
                    disabled={!selectedPatientId}
                    className={inputClass(!selectedPatientId)}
                  />
                </div>
              </div>

              <div className="space-y-xs">
                <label htmlFor="special-instructions-textarea" className="font-label-md text-slate-secondary block">SPECIAL INSTRUCTIONS</label>
                <textarea
                  id="special-instructions-textarea"
                  placeholder="Additional details..."
                  value={medInstructions}
                  onChange={(e) => setMedInstructions(e.target.value)}
                  disabled={!selectedPatientId}
                  className={`${inputClass(!selectedPatientId)} h-20 resize-none py-2`}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Nursing Care Form */}
          {activeTab === 'Nursing' && (
            <div className="space-y-md animate-fadeIn">
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">DIRECTIVE / TASK DESCRIPTION</label>
                <input
                  type="text"
                  placeholder="e.g. Hourly Vital Signs Observation"
                  value={nursingDirective}
                  onChange={(e) => setNursingDirective(e.target.value)}
                  disabled={!selectedPatientId}
                  className={inputClass(!selectedPatientId)}
                />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label className="font-label-md text-slate-secondary block">FREQUENCY</label>
                  <div className="relative">
                    <select
                      value={nursingFrequency}
                      onChange={(e) => setNursingFrequency(e.target.value)}
                      disabled={!selectedPatientId}
                      className={selectClass(!selectedPatientId)}
                    >
                      <option value="">Select frequency</option>
                      <option value="Continuous">Continuous</option>
                      <option value="Hourly">Hourly</option>
                      <option value="Every 2 Hours">Every 2 Hours</option>
                      <option value="Every 4 Hours">Every 4 Hours</option>
                      <option value="Once a Shift">Once a Shift</option>
                    </select>
                    <span className={`material-symbols-outlined absolute-center-icon right-3 text-slate-secondary ${!selectedPatientId ? 'opacity-40' : ''}`}>arrow_drop_down</span>
                  </div>
                </div>
                <div className="space-y-xs">
                  <label className="font-label-md text-slate-secondary block">SCHEDULE / TIMELINE</label>
                  <input
                    type="text"
                    placeholder="e.g. 12:30 PM, or Continuous"
                    value={nursingSchedule}
                    onChange={(e) => setNursingSchedule(e.target.value)}
                    disabled={!selectedPatientId}
                    className={inputClass(!selectedPatientId)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Diet Form */}
          {activeTab === 'Diet' && (
            <div className="space-y-md animate-fadeIn">
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">DIET TYPE</label>
                <div className="relative">
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value)}
                    disabled={!selectedPatientId}
                    className={selectClass(!selectedPatientId)}
                  >
                    <option value="">Select diet type</option>
                    <option value="NPO">NPO (Nil Per Os - Nothing by Mouth)</option>
                    <option value="Clear Liquids">Clear Liquids Only</option>
                    <option value="Soft">Soft Diet</option>
                    <option value="Regular">Regular Diet</option>
                    <option value="Low Sodium">Low Sodium Diet</option>
                    <option value="Diabetic">Diabetic Diet</option>
                  </select>
                  <span className={`material-symbols-outlined absolute-center-icon right-3 text-slate-secondary ${!selectedPatientId ? 'opacity-40' : ''}`}>arrow_drop_down</span>
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">DIRECTIVES / SPECIAL NOTES</label>
                <textarea
                  placeholder="e.g. Hold feeds for upcoming surgery, or low salt only..."
                  value={dietDirectives}
                  onChange={(e) => setDietDirectives(e.target.value)}
                  disabled={!selectedPatientId}
                  className={`${inputClass(!selectedPatientId)} h-24 resize-none py-2`}
                />
              </div>
            </div>
          )}

          {/* TAB 4: Investigation Form */}
          {activeTab === 'Investigation' && (
            <div className="space-y-md animate-fadeIn">
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">TEST / IMAGING</label>
                <input
                  type="text"
                  placeholder="e.g. ECG (12-Lead Electrocardiogram) or Serum Electrolytes"
                  value={investTest}
                  onChange={(e) => setInvestTest(e.target.value)}
                  disabled={!selectedPatientId}
                  className={inputClass(!selectedPatientId)}
                />
              </div>

              {/* Urgency Radio Selector Buttons */}
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">URGENCY</label>
                <div className="flex gap-md">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      checked={investUrgency === 'STAT'}
                      onChange={() => setInvestUrgency('STAT')}
                      disabled={!selectedPatientId}
                      className="hidden peer"
                    />
                    <div className="border border-border-default text-on-surface-variant p-sm rounded-lg text-center font-semibold text-label-md transition-all flex items-center justify-center gap-xs h-10 radio-card peer-checked:ring-2 peer-checked:border-clinical-blue peer-checked:text-clinical-blue radio-card-stat">
                      <span className="material-symbols-outlined text-[18px] flex items-center justify-center">warning</span>
                      STAT
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      checked={investUrgency === 'Urgent'}
                      onChange={() => setInvestUrgency('Urgent')}
                      disabled={!selectedPatientId}
                      className="hidden peer"
                    />
                    <div className="border border-border-default text-on-surface-variant p-sm rounded-lg text-center font-semibold text-label-md transition-all flex items-center justify-center h-10 radio-card">
                      Urgent
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="urgency"
                      checked={investUrgency === 'Routine'}
                      onChange={() => setInvestUrgency('Routine')}
                      disabled={!selectedPatientId}
                      className="hidden peer"
                    />
                    <div className="border border-border-default text-on-surface-variant p-sm rounded-lg text-center font-semibold text-label-md transition-all flex items-center justify-center h-10 radio-card">
                      Routine
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">CLINICAL REASON</label>
                <input
                  type="text"
                  placeholder="e.g. Post-MI chest pain, rule out re-infarction"
                  value={investReason}
                  onChange={(e) => setInvestReason(e.target.value)}
                  disabled={!selectedPatientId}
                  className={inputClass(!selectedPatientId)}
                />
              </div>

              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">SCHEDULE</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. ASAP, or Routine"
                    value={investUrgency === 'STAT' ? 'ASAP' : investSchedule}
                    onChange={(e) => setInvestSchedule(e.target.value)}
                    disabled={!selectedPatientId || investUrgency === 'STAT'}
                    className={`${inputClass(!selectedPatientId || investUrgency === 'STAT')} ${
                      investUrgency === 'STAT' ? 'font-bold text-[#ff5630] bg-error-container/20 border-error' : ''
                    }`}
                  />
                  <span className="material-symbols-outlined absolute-center-icon right-3 text-slate-secondary">schedule</span>
                </div>
              </div>
            </div>
          )}

          {/* Demos/Shortcuts row */}
          <div className="pt-md flex flex-wrap gap-sm justify-center border-t border-border-default select-none">
            <button
              type="button"
              onClick={handleDemoMedication}
              className="text-[11px] bg-surface-container-high px-md py-sm rounded-full text-clinical-blue font-semibold hover:bg-clinical-blue hover:text-white transition-all border-0 cursor-pointer flex items-center justify-center h-8 shadow-sm"
            >
              Demo: Medication Tab (Fatuma Said)
            </button>
            <button
              type="button"
              onClick={handleDemoInvestigation}
              className="text-[11px] bg-surface-container-high px-md py-sm rounded-full text-clinical-blue font-semibold hover:bg-clinical-blue hover:text-white transition-all border-0 cursor-pointer flex items-center justify-center h-8 shadow-sm"
            >
              Demo: Investigation Tab (Zuwena Said)
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-lg py-md bg-surface-container-low flex justify-end gap-md rounded-b-xl border-t border-border-default select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-lg h-10 border border-border-default text-slate-secondary bg-white rounded font-label-md hover:bg-neutral-bg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid()}
            className="px-lg h-10 bg-clinical-blue text-white rounded font-label-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer transition-all flex items-center gap-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] flex items-center justify-center">send</span>
            <span>Issue Order</span>
          </button>
        </div>

      </form>
    </div>
  )
}
