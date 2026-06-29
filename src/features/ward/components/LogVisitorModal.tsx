import { useState, useEffect } from 'react'

interface Patient {
  id: string
  name: string
  bed: string
  condition: 'Stable' | 'Monitoring' | 'Critical'
  activeVisitors: number
  diagnosis: string
}

interface LogVisitorModalProps {
  isOpen: boolean
  onClose: () => void
  onAddVisitor: (visitorData: {
    patientId: string
    patientName: string
    bed: string
    visitorName: string
    relationship: string
    nationalId: string
    duration: string
    approved: boolean
    denialReason?: string
  }) => void
}

const WARD_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Fatuma Said', bed: 'Bed 12', condition: 'Critical', activeVisitors: 0, diagnosis: 'Severe Pneumonia' },
  { id: 'p3', name: 'John Mwangi', bed: 'Bed 14', condition: 'Stable', activeVisitors: 0, diagnosis: 'Post-Op Appendectomy' },
  { id: 'p-test1', name: 'Juma Hamisi', bed: 'Bed 03', condition: 'Critical', activeVisitors: 2, diagnosis: 'Severe Malaria' },
  { id: 'p-test2', name: 'Zuwena Said', bed: 'Bed 04', condition: 'Monitoring', activeVisitors: 1, diagnosis: 'Pneumonia' },
  { id: 'p-test3', name: 'Neema Kessy', bed: 'Bed 05', condition: 'Stable', activeVisitors: 1, diagnosis: 'Gastritis' }
]

export function LogVisitorModal({ isOpen, onClose, onAddVisitor }: LogVisitorModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [visitorName, setVisitorName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [duration, setDuration] = useState('30 mins')
  const [isApproved, setIsApproved] = useState(true)
  const [denialReason, setDenialReason] = useState('')
  
  // Custom states for simulating warnings in demo
  const [forceOutsideHours, setForceOutsideHours] = useState(false)
  const [forceLimitReached, setForceLimitReached] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPatientId('')
      setVisitorName('')
      setRelationship('')
      setNationalId('')
      setPhone('')
      setDuration('30 mins')
      setIsApproved(true)
      setDenialReason('')
      setForceOutsideHours(false)
      setForceLimitReached(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const selectedPatient = WARD_PATIENTS.find((p) => p.id === selectedPatientId)

  // Demos shortcuts
  const handleDemoFatuma = () => {
    setSelectedPatientId('p1')
    setIsApproved(true)
    setForceOutsideHours(false)
    setForceLimitReached(false)
    setVisitorName('Hassan Said')
    setRelationship('Husband')
    setNationalId('ID-88291')
    setPhone('0712345678')
  }

  const handleDemoJohn = () => {
    setSelectedPatientId('p3')
    setIsApproved(false)
    setForceOutsideHours(true)
    setForceLimitReached(true)
    setVisitorName('Unknown Visitor')
    setRelationship('Friend')
    setNationalId('ID-55021')
    setPhone('')
    setDenialReason('Outside visiting hours, no supervisor override provided.')
  }

  // Calculate check warnings
  const isCritical = selectedPatient?.condition === 'Critical'
  const isLimitReached = selectedPatient ? (selectedPatient.activeVisitors >= 2 || forceLimitReached) : false
  const isOutsideHours = forceOutsideHours

  // Dynamic input/select style generator for premium disabled state look and feel
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
    <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-md">
      <style>{`
        .text-primary { color: #00296d !important; }
        .text-success { color: #36b37e !important; }
        .bg-success { background-color: #36b37e !important; }
        .bg-success\/10 { background-color: rgba(54, 179, 126, 0.1) !important; }
        .text-warning { color: #ffab00 !important; }
        .bg-warning { background-color: #ffab00 !important; }
        .bg-warning\/10 { background-color: rgba(255, 171, 0, 0.1) !important; }
        .text-error { color: #ff5630 !important; }
        .bg-error { background-color: #ff5630 !important; }
        .bg-error-container { background-color: #ffdad6 !important; }
        .text-on-error-container { color: #93000a !important; }
        .text-clinical-blue { color: #0052cc !important; }
        .bg-clinical-blue { background-color: #0052cc !important; }
        .border-border-default { border-color: #dfe1e6 !important; }
        .bg-surface-container-lowest { background-color: #ffffff !important; }
        .bg-surface-container-low { background-color: #f3f3fb !important; }
        .bg-surface-container-high { background-color: #e8e7f0 !important; }
        .bg-neutral-bg { background-color: #f4f5f7 !important; }
        .bg-secondary-container { background-color: #cdddff !important; }
        .text-on-secondary-container { color: #51617d !important; }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
        .custom-shadow { box-shadow: 0px 4px 12px rgba(9, 30, 66, 0.15); }
        .modal-overlay { background: rgba(9, 30, 66, 0.54); backdrop-filter: blur(2px); }
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
        ::placeholder {
          color: #8993a4 !important;
          opacity: 1 !important;
        }
        input:disabled::placeholder, textarea:disabled::placeholder {
          color: #a5adba !important;
        }

        /* Absolute centering utility for input icons */
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
      `}</style>

      <div className="bg-surface-container-lowest w-[520px] rounded-xl custom-shadow flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="px-lg py-md border-b border-border-default flex justify-between items-center bg-surface-container-low/30">
          <h3 className="font-headline-md text-headline-md text-on-surface m-0 flex items-center gap-2 leading-none">
            <span className="material-symbols-outlined text-clinical-blue text-[22px] flex items-center justify-center">person_add</span>
            <span className="flex items-center pt-0.5">Log New Visitor</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-secondary hover:text-on-surface p-1 hover:bg-neutral-bg rounded transition border-0 bg-transparent cursor-pointer flex items-center justify-center w-8 h-8"
          >
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-lg space-y-md max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Patient Search dropdown */}
          <div className="space-y-xs">
            <label className="font-label-md text-slate-secondary block">PATIENT SEARCH</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute-center-icon left-3 text-slate-secondary">search</span>
              <select
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value)
                  // Reset warnings when patient changes
                  setForceOutsideHours(false)
                  setForceLimitReached(false)
                  setIsApproved(true)
                }}
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

          {/* Premium Patient Banner Card */}
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

          {/* Warning Panels */}
          {selectedPatient && (
            <div className="space-y-sm">
              {isCritical && (
                <div className="p-md bg-[#FFFAE5] border border-warning rounded-lg flex items-center gap-md select-none">
                  <span className="material-symbols-outlined text-warning text-[20px] flex items-center justify-center">warning</span>
                  <p className="text-body-sm text-on-surface m-0 leading-normal">Patient is in Critical condition. Confirm visit is appropriate before proceeding.</p>
                </div>
              )}

              {isOutsideHours && (
                <div className="p-md bg-error-container border border-error rounded-lg flex items-center gap-md select-none">
                  <span className="material-symbols-outlined text-error text-[20px] flex items-center justify-center">error</span>
                  <p className="text-body-sm text-on-error-container m-0 leading-normal">Outside visiting hours (10:00 AM–8:00 PM). Supervisor approval required to proceed.</p>
                </div>
              )}

              {isLimitReached && (
                <div className="p-md bg-error-container border border-error rounded-lg flex items-center gap-md select-none">
                  <span className="material-symbols-outlined text-error text-[20px] flex items-center justify-center">group</span>
                  <p className="text-body-sm text-on-error-container m-0 leading-normal">Patient already has 2 active visitors. Additional visitors not permitted.</p>
                </div>
              )}
            </div>
          )}

          {/* Visitor Fields */}
          <div className="space-y-md">
            
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">VISITOR NAME</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  disabled={!selectedPatient}
                  className={inputClass(!selectedPatient)}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">RELATIONSHIP</label>
                <input
                  type="text"
                  placeholder="Select relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  disabled={!selectedPatient}
                  className={inputClass(!selectedPatient)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">NATIONAL ID / PASSPORT #</label>
                <input
                  type="text"
                  placeholder="ID or passport number"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  disabled={!selectedPatient}
                  className={`${inputClass(!selectedPatient)} font-mono`}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">PHONE NUMBER</label>
                <input
                  type="text"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!selectedPatient}
                  className={inputClass(!selectedPatient)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">ALLOWED DURATION</label>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={!selectedPatient}
                    className={selectClass(!selectedPatient)}
                  >
                    <option value="15 mins">15 minutes</option>
                    <option value="30 mins">30 minutes</option>
                    <option value="45 mins">45 minutes</option>
                    <option value="60 mins">60 minutes</option>
                  </select>
                  <span className={`material-symbols-outlined absolute-center-icon right-3 text-slate-secondary ${!selectedPatient ? 'opacity-40' : ''}`}>arrow_drop_down</span>
                </div>
              </div>

              {/* Override Checkbox inside Denied State */}
              {selectedPatient && !isApproved && (
                <div className="space-y-xs flex flex-col justify-end">
                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="suspendOverride"
                      checked={forceOutsideHours}
                      onChange={(e) => setForceOutsideHours(e.target.checked)}
                      className="rounded border-border-default text-clinical-blue focus:ring-clinical-blue cursor-pointer"
                    />
                    <label htmlFor="suspendOverride" className="text-xs text-[#AE2E24] font-bold cursor-pointer select-none">
                      Override Outside Hours
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Decision Toggle Selector */}
            {selectedPatient && (
              <div className="space-y-xs">
                <label className="font-label-md text-slate-secondary block">DECISION</label>
                <div className="flex border border-border-default rounded-lg overflow-hidden h-10 select-none bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setIsApproved(true)
                      setDenialReason('')
                    }}
                    className={`flex-1 font-label-md flex items-center justify-center gap-sm border-0 cursor-pointer transition-all ${
                      isApproved
                        ? 'bg-success text-white'
                        : 'bg-white text-slate-secondary hover:bg-neutral-bg'
                    }`}
                  >
                    {isApproved && <span className="material-symbols-outlined text-[18px] flex items-center justify-center">check_circle</span>}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsApproved(false)
                      if (!denialReason) {
                        setDenialReason('Outside visiting hours, no supervisor override provided.')
                      }
                    }}
                    className={`flex-1 font-label-md flex items-center justify-center gap-sm border-0 cursor-pointer transition-all ${
                      !isApproved
                        ? 'bg-error text-white'
                        : 'bg-white text-slate-secondary hover:bg-neutral-bg'
                    }`}
                  >
                    {!isApproved && <span className="material-symbols-outlined text-[18px] flex items-center justify-center">cancel</span>}
                    Deny
                  </button>
                </div>
              </div>
            )}

            {/* Reason for Denial Textarea */}
            {selectedPatient && !isApproved && (
              <div className="space-y-xs animate-fadeIn">
                <label className="font-label-md text-slate-secondary block">REASON FOR DENIAL</label>
                <textarea
                  placeholder="Specify clinical or operational reasons for denial..."
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="w-full px-md py-sm border border-error rounded-lg text-body-sm focus:ring-1 focus:ring-error focus:border-error outline-none h-24 resize-none"
                />
              </div>
            )}
          </div>

          {/* Demos/Shortcuts row */}
          <div className="pt-md flex flex-wrap gap-sm justify-center border-t border-border-default select-none">
            <button
              type="button"
              onClick={handleDemoFatuma}
              className="text-[11px] bg-surface-container-high px-md py-sm rounded-full text-clinical-blue font-semibold hover:bg-clinical-blue hover:text-white transition-all border-0 cursor-pointer flex items-center justify-center h-8 shadow-sm"
            >
              Demo: Select Fatuma Said (Approve)
            </button>
            <button
              type="button"
              onClick={handleDemoJohn}
              className="text-[11px] bg-surface-container-high px-md py-sm rounded-full text-clinical-blue font-semibold hover:bg-clinical-blue hover:text-white transition-all border-0 cursor-pointer flex items-center justify-center h-8 shadow-sm"
            >
              Demo: Select John Mwangi (Deny)
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

          {isApproved ? (
            <button
              type="button"
              onClick={() => {
                if (!selectedPatient || !visitorName.trim() || !relationship.trim() || !nationalId.trim()) return
                onAddVisitor({
                  patientId: selectedPatient.id,
                  patientName: selectedPatient.name,
                  bed: selectedPatient.bed,
                  visitorName,
                  relationship,
                  nationalId,
                  duration,
                  approved: true
                })
                onClose()
              }}
              disabled={!selectedPatient || !visitorName.trim() || !relationship.trim() || !nationalId.trim()}
              className="px-lg h-10 bg-clinical-blue text-white rounded font-label-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer transition-all"
            >
              Log Visit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!selectedPatient || !visitorName.trim() || !relationship.trim() || !nationalId.trim() || !denialReason.trim()) return
                onAddVisitor({
                  patientId: selectedPatient.id,
                  patientName: selectedPatient.name,
                  bed: selectedPatient.bed,
                  visitorName,
                  relationship,
                  nationalId,
                  duration,
                  approved: false,
                  denialReason
                })
                onClose()
              }}
              disabled={!selectedPatient || !visitorName.trim() || !relationship.trim() || !nationalId.trim() || !denialReason.trim()}
              className="px-lg h-10 bg-error text-white rounded font-label-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer transition-all"
            >
              Confirm Denial
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
