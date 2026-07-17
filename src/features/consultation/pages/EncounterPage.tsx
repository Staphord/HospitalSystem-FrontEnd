import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { consultationService } from '@/api/services/consultation'
import type { EncounterViewResponse } from '@/api/types/consultation'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VitalReading {
  label: string
  value: string
  isAbnormal?: boolean
}

interface MockPatient {
  name: string
  patientId: string
  age: number
  sex: string
  priority: 'emergency' | 'urgent' | 'non-urgent' | 'general'
  payment: string
  visitNumber: number
  vitals: VitalReading[]
}

interface InvestigationOrder {
  id: string
  testName: string
  department: string
  priority: 'routine' | 'urgent' | 'stat'
  time: string
  status: 'requested' | 'in-progress' | 'resulted'
  notes?: string
}

interface Prescription {
  id: string
  name: string
  dose: string
  route: string
  frequency: string
  duration: string
  instructions?: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PATIENTS: Record<string, MockPatient> = {
  'v-001': {
    name: 'Fatuma Said', patientId: 'PT-4891', age: 42, sex: 'Female',
    priority: 'emergency', payment: 'Cash', visitNumber: 3,
    vitals: [
      { label: 'BP', value: '145/95', isAbnormal: true },
      { label: 'Temp', value: '38.2°C', isAbnormal: true },
      { label: 'Pulse', value: '92 bpm' },
      { label: 'SpO2', value: '96%' },
      { label: 'Weight', value: '68kg' },
    ],
  },
  'v-002': {
    name: 'Hassan Mwita', patientId: 'PT-4889', age: 35, sex: 'Male',
    priority: 'urgent', payment: 'Insurance', visitNumber: 1,
    vitals: [
      { label: 'Temp', value: '39.1°C', isAbnormal: true },
      { label: 'BP', value: '122/78' },
      { label: 'Pulse', value: '88 bpm' },
      { label: 'SpO2', value: '98%' },
    ],
  },
  'v-003': {
    name: 'Grace Kimaro', patientId: 'PT-4892', age: 28, sex: 'Female',
    priority: 'non-urgent', payment: 'Cash', visitNumber: 2,
    vitals: [
      { label: 'BP', value: '118/76' },
      { label: 'Pulse', value: '72 bpm' },
      { label: 'SpO2', value: '99%' },
      { label: 'Weight', value: '58kg' },
    ],
  },
}

const PRIORITY_BADGE: Record<string, string> = {
  emergency: 'bg-[#ffebe6] text-[#bf2600]',
  urgent: 'bg-warning/10 text-warning',
  'non-urgent': 'bg-success/10 text-success',
  general: 'bg-surface-container text-secondary',
}
const PAYMENT_BADGE = 'bg-[#e6f0ff] text-[#0052cc]'

const ORDER_PRIORITY_BADGE: Record<InvestigationOrder['priority'], string> = {
  routine: 'bg-surface-container text-secondary border border-border-subtle',
  urgent: 'bg-warning/20 text-[#916a00]',
  stat: 'bg-error/10 text-error border border-error/20',
}

const STATUS_BADGE: Record<InvestigationOrder['status'], string> = {
  requested: 'bg-warning/20 text-[#916a00]',
  'in-progress': 'bg-primary/10 text-primary',
  resulted: 'bg-success/10 text-success',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// ── Add Order Modal ───────────────────────────────────────────────────────────

const TEST_SUGGESTIONS = [
  'Full Blood Count (FBC)',
  'CRP (C-Reactive Protein)',
  'Urea & Electrolytes',
  'Liver Function Tests (LFT)',
  'Blood Glucose (RBS)',
  'HbA1c',
  'Thyroid Function Tests',
  'Malaria RDT',
  'Urine Full Report',
  'Urine Culture & Sensitivity',
  'Sputum AFB',
  'Chest X-Ray',
  'Abdominal Ultrasound',
  'ECG',
  'CT Head',
]

function AddOrderModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (order: InvestigationOrder) => void
}) {
  const [testName, setTestName] = useState('')
  const [department, setDepartment] = useState('Laboratory')
  const [priority, setPriority] = useState<InvestigationOrder['priority']>('routine')
  const [notes, setNotes] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = TEST_SUGGESTIONS.filter((t) =>
    t.toLowerCase().includes(testName.toLowerCase())
  )

  const isValid = testName.trim().length > 0

  const handleAdd = () => {
    if (!isValid) return
    onAdd({
      id: uid(),
      testName: testName.trim(),
      department,
      priority,
      time: nowTime(),
      status: 'requested',
      notes: notes.trim() || undefined,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-xl w-full max-w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-order-title"
      >
        {/* Header */}
        <div className="p-md border-b border-border-subtle flex items-center justify-between">
          <h2 id="add-order-title" className="font-headline-sm text-headline-sm text-on-surface">
            Add Investigation Order
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container border-0 bg-transparent cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-md space-y-md">
          {/* Test Name with autocomplete */}
          <div className="relative">
            <label className="block font-label-md text-label-md text-secondary mb-xs">
              Test / Investigation <span className="text-error">*</span>
            </label>
            <div className="flex items-center border border-border-subtle rounded-lg bg-surface-white px-sm py-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-secondary mr-sm text-[20px]">search</span>
              <input
                type="text"
                value={testName}
                autoFocus
                onChange={(e) => { setTestName(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search or type test name…"
                className="flex-1 border-none bg-transparent p-0 focus:ring-0 font-body-sm text-body-sm outline-none"
              />
            </div>
            {showSuggestions && testName.length > 0 && filtered.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-surface-white border border-border-subtle rounded-lg shadow-lg max-h-[180px] overflow-y-auto">
                {filtered.map((s) => (
                  <li
                    key={s}
                    onMouseDown={() => { setTestName(s); setShowSuggestions(false) }}
                    className="px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint cursor-pointer transition-colors"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs">
              Department <span className="text-error">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm px-sm py-2 outline-none transition-all cursor-pointer"
            >
              <option>Laboratory</option>
              <option>Radiology</option>
              <option>Cardiology</option>
              <option>Microbiology</option>
              <option>Other</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs">Priority</label>
            <div className="flex gap-sm">
              {(['routine', 'urgent', 'stat'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-sm rounded-lg font-label-md text-label-md uppercase font-bold border transition-all cursor-pointer ${
                    priority === p
                      ? p === 'stat'
                        ? 'bg-error text-white border-error'
                        : p === 'urgent'
                        ? 'bg-warning text-white border-warning'
                        : 'bg-primary text-white border-primary'
                      : 'bg-surface-container text-secondary border-border-subtle hover:bg-surface-container-high'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs">
              Notes / Instructions <span className="text-outline font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Fasting sample required, collect EDTA tube…"
              className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm p-sm outline-none resize-none transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-md border-t border-border-subtle bg-surface-container-low flex justify-end gap-sm">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-md border border-border-subtle rounded-lg font-label-md text-label-md text-secondary bg-white hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isValid}
            className="h-10 px-md rounded-lg font-label-md text-label-md text-white bg-primary-container hover:bg-primary transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Order
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Medication Modal ──────────────────────────────────────────────────────

const DRUG_SUGGESTIONS = [
  'Salbutamol Inhaler',
  'Amoxicillin 500mg',
  'Metformin 500mg',
  'Paracetamol 1g',
  'Ibuprofen 400mg',
  'Omeprazole 20mg',
  'Amlodipine 5mg',
  'Atorvastatin 40mg',
  'Ciprofloxacin 500mg',
  'Prednisolone 5mg',
  'Furosemide 40mg',
  'Metronidazole 400mg',
  'Morphine 10mg',
  'Diazepam 5mg',
  'ORS Sachet',
]

const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Inhaled', 'Topical', 'Sublingual', 'Rectal']
const FREQUENCIES = ['OD', 'BD', 'TDS', 'QID', 'PRN', 'Stat', 'Weekly', 'Monthly']
const DURATION_UNITS = ['Days', 'Weeks', 'Months']

function AddMedicationModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (rx: Prescription) => void
}) {
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [route, setRoute] = useState('Oral')
  const [frequency, setFrequency] = useState('OD')
  const [duration, setDuration] = useState('')
  const [durationUnit, setDurationUnit] = useState('Days')
  const [instructions, setInstructions] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = DRUG_SUGGESTIONS.filter((d) =>
    d.toLowerCase().includes(name.toLowerCase())
  )

  const isValid = name.trim().length > 0 && dose.trim().length > 0

  const handleAdd = () => {
    if (!isValid) return
    const doseStr = [
      dose.trim(),
      route,
      frequency,
      duration ? `× ${duration} ${durationUnit}` : '',
      instructions.trim() ? `(${instructions.trim()})` : '',
    ]
      .filter(Boolean)
      .join(' ')

    onAdd({
      id: uid(),
      name: name.trim(),
      dose: dose.trim(),
      route,
      frequency,
      duration: duration ? `${duration} ${durationUnit}` : '',
      instructions: instructions.trim() || undefined,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-md"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-surface-white rounded-xl shadow-xl w-full max-w-[520px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-med-title"
      >
        {/* Header */}
        <div className="p-md border-b border-border-subtle flex items-center justify-between">
          <h2 id="add-med-title" className="font-headline-sm text-headline-sm text-on-surface">
            Add Medication
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container border-0 bg-transparent cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-md space-y-md">
          {/* Drug name with autocomplete */}
          <div className="relative">
            <label className="block font-label-md text-label-md text-secondary mb-xs">
              Drug Name <span className="text-error">*</span>
            </label>
            <div className="flex items-center border border-border-subtle rounded-lg bg-surface-white px-sm py-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-secondary mr-sm text-[20px]">medication</span>
              <input
                type="text"
                value={name}
                autoFocus
                onChange={(e) => { setName(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search drug name…"
                className="flex-1 border-none bg-transparent p-0 focus:ring-0 font-body-sm text-body-sm outline-none"
              />
            </div>
            {showSuggestions && name.length > 0 && filtered.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-surface-white border border-border-subtle rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
                {filtered.map((d) => (
                  <li
                    key={d}
                    onMouseDown={() => { setName(d); setShowSuggestions(false) }}
                    className="px-md py-sm font-body-sm text-body-sm text-on-surface hover:bg-hover-tint cursor-pointer transition-colors"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dose + Route row */}
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">
                Dose <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g. 500mg, 2 puffs"
                className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm px-sm py-2 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">Route</label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm px-sm py-2 outline-none transition-all cursor-pointer"
              >
                {ROUTES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Frequency + Duration row */}
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">
                Frequency <span className="text-error">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm px-sm py-2 outline-none transition-all cursor-pointer"
              >
                {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">
                Duration <span className="text-outline font-normal">(optional)</span>
              </label>
              <div className="flex gap-xs">
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-16 rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm px-sm py-2 outline-none transition-all"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                  className="flex-1 rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm px-sm py-2 outline-none transition-all cursor-pointer"
                >
                  {DURATION_UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs">
              Instructions <span className="text-outline font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Take with food, As needed for pain…"
              className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm px-sm py-2 outline-none transition-all"
            />
          </div>

          {/* Live preview */}
          {isValid && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-sm">
              <p className="font-label-md text-label-md text-secondary mb-xs uppercase">Preview</p>
              <p className="font-body-sm text-body-sm font-bold text-on-surface">{name}</p>
              <p className="font-label-sm text-label-sm text-secondary">
                {[dose, route, frequency, duration ? `× ${duration} ${durationUnit}` : '', instructions ? `(${instructions})` : ''].filter(Boolean).join(' ')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-md border-t border-border-subtle bg-surface-container-low flex justify-end gap-sm">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-md border border-border-subtle rounded-lg font-label-md text-label-md text-secondary bg-white hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isValid}
            className="h-10 px-md rounded-lg font-label-md text-label-md text-white bg-primary-container hover:bg-primary transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Medication
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SectionCard({
  number, title, locked, actionLabel, onAction, children, collapsible,
}: {
  number: number
  title: string
  locked?: boolean
  actionLabel?: string
  onAction?: () => void
  children?: React.ReactNode
  collapsible?: boolean
}) {
  const [open, setOpen] = useState(!collapsible)

  if (locked) {
    return (
      <div className="bg-surface-container-low border border-border-subtle rounded-xl p-md flex items-center justify-between opacity-70">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs shrink-0">{number}</span>
          <h3 className="font-headline-sm text-headline-sm text-secondary">{title}</h3>
        </div>
        <span className="material-symbols-outlined text-secondary">lock</span>
      </div>
    )
  }

  return (
    <div className="bg-surface-white border border-border-subtle rounded-xl shadow-sm overflow-hidden">
      <div
        className={`px-md py-3 border-b border-border-subtle flex items-center justify-between bg-surface-container-lowest ${collapsible ? 'cursor-pointer hover:bg-surface-container/50 transition-colors' : ''}`}
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e) => e.key === 'Enter' && setOpen((v) => !v) : undefined}
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{number}</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
        </div>
        {collapsible ? (
          <span className={`material-symbols-outlined text-secondary transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
        ) : (
          actionLabel && (
            <button type="button" onClick={onAction} className="text-primary hover:text-primary-container font-semibold font-label-md text-label-md flex items-center gap-1 bg-transparent border-0 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">add</span>
              {actionLabel}
            </button>
          )
        )}
      </div>
      {(!collapsible || open) && <div className="p-md">{children}</div>}
    </div>
  )
}

// ── Disposition types ─────────────────────────────────────────────────────────

type DispositionType = 'discharge' | 'admit' | 'refer' | 'return-visit'

interface DispositionConfig {
  id: DispositionType
  label: string
  icon: string
  description: string
  color: string
  selectedColor: string
  selectedBorder: string
  selectedBg: string
}

const DISPOSITION_OPTIONS: DispositionConfig[] = [
  {
    id: 'discharge', label: 'Discharge Home', icon: 'home', description: 'Patient is stable and can be safely discharged.',
    color: 'text-success', selectedColor: 'text-success', selectedBorder: 'border-success', selectedBg: 'bg-success/5',
  },
  {
    id: 'admit', label: 'Admit to Ward', icon: 'local_hospital', description: 'Patient requires inpatient admission.',
    color: 'text-primary', selectedColor: 'text-primary', selectedBorder: 'border-primary', selectedBg: 'bg-primary/5',
  },
  {
    id: 'refer', label: 'Refer to Specialist', icon: 'swap_horiz', description: 'Refer for specialist or facility management.',
    color: 'text-[#00B8D9]', selectedColor: 'text-[#00B8D9]', selectedBorder: 'border-[#00B8D9]', selectedBg: 'bg-[#00B8D9]/5',
  },
  {
    id: 'return-visit', label: 'Schedule Return Visit', icon: 'event', description: 'Patient to return for follow-up.',
    color: 'text-warning', selectedColor: 'text-warning', selectedBorder: 'border-warning', selectedBg: 'bg-warning/5',
  },
]

const SPECIALTIES = ['Cardiology', 'Pulmonology', 'Neurology', 'Gastroenterology', 'Nephrology', 'Endocrinology', 'Orthopaedics', 'Oncology', 'Psychiatry', 'Paediatrics']

// ── What happens next illustration (Admit flow) ───────────────────────────────

function AdmissionFlowIllustration() {
  const steps = [
    { icon: 'local_hospital', label: 'Bed Assigned', sub: 'Ward receives admission request', color: 'bg-primary/10 text-primary border-primary/20' },
    { icon: 'badge', label: 'Patient Tagged', sub: 'Wristband & ID verified', color: 'bg-[#00B8D9]/10 text-[#00B8D9] border-[#00B8D9]/20' },
    { icon: 'monitor_heart', label: 'Monitoring Begins', sub: 'Vitals tracked by ward nurse', color: 'bg-success/10 text-success border-success/20' },
    { icon: 'medication', label: 'Medications Active', sub: 'Prescription passed to pharmacy', color: 'bg-warning/10 text-warning border-warning/20' },
  ]

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-md mt-md">
      <div className="flex items-center gap-sm mb-md">
        <span className="material-symbols-outlined text-primary leading-none text-[20px]">info</span>
        <p className="font-label-md text-label-md text-primary uppercase tracking-wider m-0">What happens after admission</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-col items-center text-center gap-xs">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${s.color}`}>
              <span className="material-symbols-outlined leading-none">{s.icon}</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface m-0">{s.label}</p>
            <p className="font-label-sm text-label-sm text-outline m-0 leading-snug">{s.sub}</p>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-md pt-md border-t border-primary/20 flex items-center gap-sm">
        <span className="material-symbols-outlined text-primary text-[16px] leading-none shrink-0">check_circle</span>
        <p className="font-body-sm text-body-sm text-primary/80 m-0">
          Completing this encounter will send the admission request to the <strong>Ward Admissions</strong> module and notify the assigned ward.
        </p>
      </div>
    </div>
  )
}

// ── Disposition detail fields interface ───────────────────────────────────────

export interface DispositionDetails {
  admitReason: string
  specialty: string
  referUrgency: 'routine' | 'urgent' | 'emergency'
  referReason: string
  dischargeInstructions: string
  followUpDate: string
  returnReason: string
}

function validateDisposition(
  disp: DispositionType,
  fields: DispositionDetails,
  pendingOrdersCount: number
): string[] {
  const errors: string[] = []

  if (disp === 'discharge' && pendingOrdersCount > 0) {
    errors.push('Cannot discharge — there are pending investigation orders. Consider scheduling a return-visit instead.')
  }
  if (disp === 'admit') {
    if (!fields.admitReason.trim()) errors.push('Admission reason is required.')
  }
  if (disp === 'refer') {
    if (!fields.specialty.trim()) errors.push('Department / Specialty is required.')
    if (!fields.referReason.trim()) errors.push('Referral reason is required.')
  }
  if (disp === 'return-visit') {
    if (!fields.followUpDate.trim()) errors.push('Return date is required.')
    if (!fields.returnReason.trim()) errors.push('Return reason is required.')
  }

  return errors
}

// ── Disposition section content ───────────────────────────────────────────────

function DispositionContent({
  disposition,
  confirmedDisposition,
  onSelectDisposition,
  onConfirmDisposition,
  pendingOrdersCount,
  confirmingDisposition,
  isReadOnly,
  initialDetails,
}: {
  disposition: DispositionType | null
  confirmedDisposition: DispositionType | null
  onSelectDisposition: (d: DispositionType) => void
  onConfirmDisposition: (d: DispositionType, details: DispositionDetails) => void
  pendingOrdersCount: number
  confirmingDisposition: boolean
  isReadOnly: boolean
  initialDetails: any
}) {
  const [admitReason, setAdmitReason] = useState('')
  const [specialty, setSpecialty]     = useState(SPECIALTIES[0])
  const [referUrgency, setReferUrgency] = useState<'routine' | 'urgent' | 'emergency'>('routine')
  const [referReason, setReferReason] = useState('')
  const [dischargeInstructions, setDischargeInstructions] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [warningDismissed, setWarningDismissed] = useState(false)

  const showWarning = pendingOrdersCount > 0 && !warningDismissed && !isReadOnly

  // Load initial details on mount / load
  useEffect(() => {
    if (initialDetails) {
      if (initialDetails.admission_reason) setAdmitReason(initialDetails.admission_reason)
      if (initialDetails.referral_type) setSpecialty(initialDetails.referral_type)
      if (initialDetails.referral_notes) setReferReason(initialDetails.referral_notes)
      if (initialDetails.discharge_instructions) setDischargeInstructions(initialDetails.discharge_instructions)
      if (initialDetails.follow_up_date) {
        setFollowUpDate(initialDetails.follow_up_date.substring(0, 10))
      } else if (initialDetails.return_date) {
        setFollowUpDate(initialDetails.return_date.substring(0, 10))
      }
      if (initialDetails.return_reason) setReturnReason(initialDetails.return_reason)
    }
  }, [initialDetails])

  // Clear fields when switching disposition (or restore if switching back to confirmed)
  const handleSelectDisposition = (d: DispositionType) => {
    if (d !== disposition) {
      if (d === confirmedDisposition && initialDetails) {
        setAdmitReason(initialDetails.admission_reason || '')
        setSpecialty(initialDetails.referral_type || SPECIALTIES[0])
        setReferReason(initialDetails.referral_notes || '')
        setDischargeInstructions(initialDetails.discharge_instructions || '')
        setFollowUpDate(
          initialDetails.follow_up_date?.substring(0, 10) || 
          initialDetails.return_date?.substring(0, 10) || 
          ''
        )
        setReturnReason(initialDetails.return_reason || '')
      } else {
        setAdmitReason('')
        setSpecialty(SPECIALTIES[0])
        setReferUrgency('routine')
        setReferReason('')
        setDischargeInstructions('')
        setFollowUpDate('')
        setReturnReason('')
      }
      setValidationErrors([])
    }
    onSelectDisposition(d)
  }

  const handleConfirm = () => {
    if (!disposition || isReadOnly) return
    const details: DispositionDetails = {
      admitReason,
      specialty,
      referUrgency,
      referReason,
      dischargeInstructions,
      followUpDate,
      returnReason,
    }
    const errors = validateDisposition(disposition, details, pendingOrdersCount)
    setValidationErrors(errors)
    if (errors.length > 0) return
    onConfirmDisposition(disposition, details)
  }

  const inputErrorClass = 'border-error focus:border-error focus:ring-error'
  const inputBaseClass = 'w-full rounded-lg border bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm outline-none transition-all disabled:bg-surface-container-low disabled:text-secondary disabled:cursor-not-allowed'

  return (
    <div className="space-y-md">
      {/* Pending investigations warning */}
      {showWarning && (
        <div className="bg-warning/5 border border-warning/30 rounded-xl p-md flex items-start gap-md">
          <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-warning text-[20px] leading-none">lab_research</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label-md text-label-md text-warning uppercase tracking-wider m-0 mb-xs">
              {pendingOrdersCount} pending investigation{pendingOrdersCount > 1 ? 's' : ''}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              {pendingOrdersCount === 1
                ? 'One of your investigation orders has not yet resulted. Consider reviewing the result before finalising disposition.'
                : `${pendingOrdersCount} of your investigation orders are still pending. Consider reviewing all results before finalising disposition.`}
            </p>
            <button
              type="button"
              onClick={() => setWarningDismissed(true)}
              className="mt-sm inline-flex items-center gap-xs font-label-md text-label-md text-warning hover:underline bg-transparent border-0 cursor-pointer p-0"
            >
              <span className="material-symbols-outlined text-[16px] leading-none">arrow_forward</span>
              Set disposition anyway
            </button>
          </div>
          <button
            type="button"
            onClick={() => setWarningDismissed(true)}
            className="p-xs text-outline hover:text-on-surface rounded-full hover:bg-surface-container transition-colors bg-transparent border-0 cursor-pointer shrink-0"
            aria-label="Dismiss warning"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">close</span>
          </button>
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="bg-error/5 border border-error/30 rounded-xl p-md">
          <div className="flex items-center gap-sm mb-xs">
            <span className="material-symbols-outlined text-error text-[18px] leading-none">error</span>
            <p className="font-label-md text-label-md text-error uppercase tracking-wider m-0">Please fix the following</p>
          </div>
          <ul className="list-disc pl-lg m-0 space-y-xs">
            {validationErrors.map((err) => (
              <li key={err} className="font-body-sm text-body-sm text-error">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Option cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        {DISPOSITION_OPTIONS.map((opt) => {
          const isSelected = disposition === opt.id
          const isConfirmed = confirmedDisposition === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelectDisposition(opt.id)}
              className={`relative flex flex-col items-center text-center gap-sm p-md rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? `${opt.selectedBorder} ${opt.selectedBg} shadow-sm`
                  : 'border-border-subtle bg-surface-container-low hover:bg-hover-tint hover:border-border-subtle'
              }`}
            >
              {isConfirmed && (
                <div className="absolute top-2 right-2">
                  <span className="material-symbols-outlined text-success text-[18px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              )}
              <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isSelected ? `${opt.selectedBg} border border-current` : 'bg-surface-container'}`}>
                <span className={`material-symbols-outlined leading-none text-[22px] ${isSelected ? opt.selectedColor : 'text-secondary'}`} style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {opt.icon}
                </span>
              </div>
              <div>
                <p className={`font-label-md text-label-md m-0 ${isSelected ? opt.selectedColor : 'text-on-surface'}`}>{opt.label}</p>
                <p className="font-label-sm text-label-sm text-outline m-0 mt-0.5 leading-tight">{opt.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Conditional fields */}
      {disposition === 'admit' && (
        <div className="space-y-md pt-sm border-t border-border-subtle">
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs">Reason for Admission <span className="text-error">*</span></label>
            <textarea
              value={admitReason}
              onChange={(e) => setAdmitReason(e.target.value)}
              rows={3}
              disabled={isReadOnly}
              placeholder="Describe the clinical indication for inpatient admission…"
              className={`${inputBaseClass} p-sm resize-none ${validationErrors.some((e) => e.includes('Admission reason')) ? inputErrorClass : 'border-border-subtle'}`}
            />
          </div>
          <AdmissionFlowIllustration />
        </div>
      )}

      {disposition === 'refer' && (
        <div className="space-y-md pt-sm border-t border-border-subtle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">Specialty / Department <span className="text-error">*</span></label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                disabled={isReadOnly}
                className={`${inputBaseClass} px-sm py-2 cursor-pointer ${validationErrors.some((e) => e.includes('Department')) ? inputErrorClass : 'border-border-subtle'}`}
              >
                {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">Urgency <span className="text-error">*</span></label>
              <div className="flex gap-sm">
                {(['routine', 'urgent', 'emergency'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setReferUrgency(u)}
                    className={`flex-1 py-2 rounded-lg font-label-md text-label-md capitalize border transition-all cursor-pointer ${
                      referUrgency === u
                        ? u === 'emergency' ? 'bg-error text-white border-error'
                          : u === 'urgent' ? 'bg-warning text-white border-warning'
                          : 'bg-primary text-white border-primary'
                        : 'bg-surface-container text-secondary border-border-subtle hover:bg-surface-container-high'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs">Referral Reason <span className="text-error">*</span></label>
            <textarea
              value={referReason}
              onChange={(e) => setReferReason(e.target.value)}
              rows={3}
              disabled={isReadOnly}
              placeholder="Clinical reason for referral and relevant history…"
              className={`${inputBaseClass} p-sm resize-none ${validationErrors.some((e) => e.includes('Referral reason')) ? inputErrorClass : 'border-border-subtle'}`}
            />
          </div>
          <div className="bg-[#00B8D9]/5 border border-[#00B8D9]/20 rounded-xl p-md flex items-start gap-sm">
            <span className="material-symbols-outlined text-[#00B8D9] leading-none shrink-0">info</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              A referral letter will be generated on encounter completion and sent to the <strong>My Referrals</strong> module for tracking.
            </p>
          </div>
        </div>
      )}

      {disposition === 'discharge' && (
        <div className="space-y-md pt-sm border-t border-border-subtle">
          <div>
            <label className="block font-label-md text-label-md text-secondary mb-xs">Discharge Instructions</label>
            <textarea
              value={dischargeInstructions}
              onChange={(e) => setDischargeInstructions(e.target.value)}
              rows={3}
              disabled={isReadOnly}
              placeholder="Instructions for the patient on medications, activity, diet and when to return…"
              className={`${inputBaseClass} p-sm resize-none border-border-subtle`}
            />
          </div>
          <div className="w-56">
            <label className="block font-label-md text-label-md text-secondary mb-xs">Follow-up Date <span className="text-outline font-normal">(optional)</span></label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              disabled={isReadOnly}
              className={`${inputBaseClass} px-sm py-2 cursor-pointer border-border-subtle`}
            />
          </div>
          <div className="bg-success/5 border border-success/20 rounded-xl p-md flex items-start gap-sm">
            <span className="material-symbols-outlined text-success leading-none shrink-0">check_circle</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              Completing this encounter will discharge the patient from the active queue and generate a <strong>discharge summary</strong>.
            </p>
          </div>
        </div>
      )}

      {disposition === 'return-visit' && (
        <div className="space-y-md pt-sm border-t border-border-subtle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">Return Date <span className="text-error">*</span></label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                disabled={isReadOnly}
                className={`${inputBaseClass} px-sm py-2 cursor-pointer ${validationErrors.some((e) => e.includes('Return date')) ? inputErrorClass : 'border-border-subtle'}`}
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">Return Reason <span className="text-error">*</span></label>
              <input
                type="text"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Review results, wound check…"
                className={`${inputBaseClass} px-sm py-2 ${validationErrors.some((e) => e.includes('Return reason')) ? inputErrorClass : 'border-border-subtle'}`}
              />
            </div>
          </div>
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-md flex items-start gap-sm">
            <span className="material-symbols-outlined text-warning leading-none shrink-0">event</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
              A follow-up appointment will be scheduled and the patient will receive a reminder. The encounter is closed as <strong>Return Visit</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Confirm disposition button */}
      {disposition && !isReadOnly && (
        <div className="flex justify-end pt-sm border-t border-border-subtle">
          {confirmedDisposition === disposition ? (
            <span className="inline-flex items-center gap-xs font-label-md text-label-md text-success">
              <span className="material-symbols-outlined text-[18px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Disposition confirmed
            </span>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirmingDisposition}
              className="inline-flex items-center gap-sm px-lg py-2 bg-primary text-white font-label-md text-label-md rounded-lg border-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmingDisposition ? (
                <>
                  <span className="material-symbols-outlined text-[18px] leading-none animate-spin">sync</span>
                  Confirming…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] leading-none">check</span>
                  Confirm Disposition
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function EncounterPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [encounter, setEncounter] = useState<EncounterViewResponse | null>(null)
  const isReadOnly = encounter?.consultation?.consultation_status === 'completed'
  
  const hasLoadedRef = useRef<string | null>(null)

  // §2 Clinical Notes
  const [hpc, setHpc] = useState('')
  const [exam, setExam] = useState('')
  const [impression, setImpression] = useState('')

  // §3 Diagnosis Addition Form state
  const [diagDesc, setDiagDesc] = useState('')
  const [diagCode, setDiagCode] = useState('')
  const [diagType, setDiagType] = useState<'provisional' | 'differential' | 'final'>('provisional')

  const [showAddOrder, setShowAddOrder] = useState(false)
  const [showAddMedication, setShowAddMedication] = useState(false)

  // §6 Disposition
  const [disposition, setDisposition] = useState<DispositionType | null>(null)

  const loadEncounter = async (showLoading = true) => {
    if (!visitId) return
    console.log("[DEBUG] loadEncounter called. hasLoadedRef.current:", hasLoadedRef.current, "visitId:", visitId)
    if (hasLoadedRef.current === visitId) {
      console.log("[DEBUG] loadEncounter bypassed because already loaded.")
      return
    }
    hasLoadedRef.current = visitId

    if (showLoading) setLoading(true)
    try {
      const data = await consultationService.getEncounter(visitId)
      console.log("[DEBUG] loadEncounter fetched data:", data.consultation.disposition)
      setEncounter(data)
      setHpc(data.consultation.history_of_presenting_illness || '')
      setExam(data.consultation.examination_findings || '')
      setImpression(data.consultation.clinical_impression || '')
      if (data.consultation.disposition) {
        const disp = data.consultation.disposition
        let uiDisp: DispositionType | null = null
        if (disp === 'outpatient') uiDisp = 'discharge'
        else if (disp === 'admission') uiDisp = 'admit'
        else if (disp === 'referral') uiDisp = 'refer'
        else if (disp === 'return_visit') uiDisp = 'return-visit'
        if (uiDisp) {
          console.log("[DEBUG] loadEncounter setting disposition to:", uiDisp)
          setDisposition(uiDisp)
          setConfirmedDisposition(uiDisp)
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          await consultationService.openEncounter(visitId)
          const data = await consultationService.getEncounter(visitId)
          setEncounter(data)
          setHpc(data.consultation.history_of_presenting_illness || '')
          setExam(data.consultation.examination_findings || '')
          setImpression(data.consultation.clinical_impression || '')
        } catch (openErr: any) {
          hasLoadedRef.current = null
          console.error("Failed to open encounter:", openErr)
          toast.error(openErr.response?.data?.detail || "Failed to initialize encounter.")
        }
      } else {
        hasLoadedRef.current = null
        console.error("Failed to fetch encounter:", err)
        toast.error("Failed to load encounter details.")
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const refreshEncounter = async () => {
    if (!visitId) return
    console.log("[DEBUG] refreshEncounter called.")
    try {
      const data = await consultationService.getEncounter(visitId)
      setEncounter(data)
    } catch (err) {
      console.error("Failed to refresh encounter:", err)
    }
  }

  useEffect(() => {
    loadEncounter(true)
    const interval = setInterval(() => {
      refreshEncounter()
    }, 10000)
    return () => clearInterval(interval)
  }, [visitId])

  const patient = useMemo(() => {
    if (!encounter?.patient) {
      return {
        name: 'Loading...',
        patientId: '',
        age: 0,
        sex: '',
        priority: 'general' as const,
        payment: 'Cash',
        visitNumber: 1,
        vitals: [] as VitalReading[]
      }
    }
    const ts = encounter.triage_summary
    const vitalsList: VitalReading[] = []
    if (ts) {
      if (ts.blood_pressure_systolic && ts.blood_pressure_diastolic) {
        vitalsList.push({
          label: 'BP',
          value: `${ts.blood_pressure_systolic}/${ts.blood_pressure_diastolic}`,
          isAbnormal: ts.blood_pressure_systolic > 140 || ts.blood_pressure_diastolic > 90
        })
      }
      if (ts.temperature) {
        vitalsList.push({
          label: 'Temp',
          value: `${ts.temperature}°C`,
          isAbnormal: ts.temperature > 38.0
        })
      }
      if (ts.pulse_rate) {
        vitalsList.push({
          label: 'Pulse',
          value: `${ts.pulse_rate} bpm`,
          isAbnormal: ts.pulse_rate > 100 || ts.pulse_rate < 60
        })
      }
      if (ts.oxygen_saturation) {
        vitalsList.push({
          label: 'SpO2',
          value: `${ts.oxygen_saturation}%`,
          isAbnormal: ts.oxygen_saturation < 95
        })
      }
      if (ts.weight_kg) {
        vitalsList.push({
          label: 'Weight',
          value: `${ts.weight_kg}kg`
        })
      }
    }
    
    let patientAge = 0
    if (encounter.patient.date_of_birth) {
      patientAge = Math.floor((new Date().getTime() - new Date(encounter.patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    }

    let uiPriority: 'emergency' | 'urgent' | 'non-urgent' | 'general' = 'general'
    const normPriority = (ts?.triage_category || '').toLowerCase().replace('_', '-')
    if (normPriority === 'emergency') uiPriority = 'emergency'
    else if (normPriority === 'urgent') uiPriority = 'urgent'
    else if (normPriority === 'non-urgent') uiPriority = 'non-urgent'

    return {
      name: encounter.patient.full_name,
      patientId: encounter.patient.patient_number,
      age: patientAge,
      sex: encounter.patient.gender,
      priority: uiPriority,
      payment: encounter.patient.blood_group || 'Cash',
      visitNumber: 1,
      vitals: vitalsList
    }
  }, [encounter])

  const orders = useMemo((): InvestigationOrder[] => {
    if (!encounter?.consultation?.investigation_requests) return []
    return encounter.consultation.investigation_requests
      .filter((inv) => inv.status !== 'cancelled')
      .map((inv): InvestigationOrder => {
        let uiStatus: InvestigationOrder['status'] = 'requested'
        if (inv.status === 'in_progress') uiStatus = 'in-progress'
        else if (inv.status === 'completed') uiStatus = 'resulted'
        
        let uiPriority: InvestigationOrder['priority'] = 'routine'
        if (inv.urgency === 'urgent') uiPriority = 'urgent'
        else if (inv.urgency === 'stat') uiPriority = 'stat'

        return {
          id: inv.id,
          testName: inv.test_name,
          department: inv.request_type === 'radiology' ? 'Radiology' : 'Laboratory',
          priority: uiPriority,
          time: inv.requested_at ? new Date(inv.requested_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
          status: uiStatus,
          notes: inv.clinical_history || undefined
        }
      })
  }, [encounter])

  const prescriptions = useMemo((): Prescription[] => {
    if (!encounter?.consultation?.prescriptions) return []
    return encounter.consultation.prescriptions.map((p): Prescription => {
      return {
        id: p.id,
        name: p.drug_name,
        dose: p.dose,
        route: p.route,
        frequency: p.frequency,
        duration: p.duration,
        instructions: p.instructions || undefined
      }
    })
  }, [encounter])

  const handleSaveNotes = async () => {
    if (!encounter?.consultation?.id) return
    try {
      setSaving(true)
      await consultationService.updateNotes(encounter.consultation.id, hpc, exam, impression)
      toast.success("Notes saved as draft.")
      await refreshEncounter()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to save notes.")
    } finally {
      setSaving(false)
    }
  }

  const handleAddDiagnosis = async () => {
    if (!encounter?.consultation?.id || !diagDesc.trim()) return
    try {
      await consultationService.addDiagnosis(
        encounter.consultation.id,
        diagType,
        diagDesc,
        diagCode || undefined
      )
      toast.success("Diagnosis added.")
      setDiagDesc('')
      setDiagCode('')
      await refreshEncounter()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to add diagnosis.")
    }
  }

  const handleDeleteDiagnosis = async (id: string) => {
    try {
      await consultationService.deleteDiagnosis(id)
      toast.success("Diagnosis deleted.")
      await refreshEncounter()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to delete diagnosis.")
    }
  }

  const handleAddInvestigation = async (order: InvestigationOrder) => {
    if (!encounter?.consultation?.id) return
    try {
      await consultationService.addInvestigation(
        encounter.consultation.id,
        order.department,
        order.testName,
        order.notes || "Requested during consultation",
        order.priority
      )
      toast.success("Investigation requested.")
      await refreshEncounter()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to request investigation.")
    }
  }

  const handleCancelInvestigation = async (id: string) => {
    try {
      await consultationService.deleteInvestigation(id)
      toast.success("Investigation request cancelled.")
      await refreshEncounter()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to cancel investigation.")
    }
  }

  const handleAddPrescription = async (rx: Omit<Prescription, 'id'>) => {
    if (!encounter?.consultation?.id) return
    try {
      await consultationService.addPrescription(
        encounter.consultation.id,
        rx.name,
        rx.dose,
        rx.frequency,
        rx.duration,
        rx.route,
        rx.instructions
      )
      toast.success("Prescription added.")
      await refreshEncounter()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to add prescription.")
    }
  }

  const handleRemovePrescription = async (id: string) => {
    try {
      await consultationService.deletePrescription(id)
      toast.success("Prescription removed.")
      await refreshEncounter()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to remove prescription.")
    }
  }

  // Track both selected (card click) and confirmed (validated + saved) disposition
  const [confirmedDisposition, setConfirmedDisposition] = useState<DispositionType | null>(null)
  const [confirmingDisposition, setConfirmingDisposition] = useState(false)

  const handleSelectDisposition = (dispKey: DispositionType) => {
    setDisposition(dispKey)
    // Don't clear confirmed — user might be switching to review then come back
  }

  const handleConfirmDisposition = async (dispKey: DispositionType, details: DispositionDetails) => {
    if (!encounter?.consultation?.id) return

    let mappedDisp = 'outpatient'
    if (dispKey === 'admit') mappedDisp = 'admission'
    else if (dispKey === 'refer') mappedDisp = 'referral'
    else if (dispKey === 'return-visit') mappedDisp = 'return_visit'

    setConfirmingDisposition(true)
    try {
      await consultationService.updateDisposition(encounter.consultation.id, mappedDisp, {
        admissionReason: details.admitReason || undefined,
        referralType: details.specialty || undefined,
        referralNotes: details.referReason || undefined,
        dischargeInstructions: details.dischargeInstructions || undefined,
        followUpDate: details.followUpDate || undefined,
        returnDate: dispKey === 'return-visit' ? details.followUpDate : undefined,
        returnReason: details.returnReason || undefined,
      })
      setDisposition(dispKey)
      setConfirmedDisposition(dispKey)
      toast.success("Disposition confirmed.")
      await refreshEncounter()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to update disposition.")
    } finally {
      setConfirmingDisposition(false)
    }
  }

  const handleCompleteEncounter = async () => {
    if (!encounter?.consultation?.id) return
    try {
      setSaving(true)
      await consultationService.completeConsultation(encounter.consultation.id)
      toast.success("Consultation completed successfully!")
      navigate('/consultation/queue')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to complete consultation.")
    } finally {
      setSaving(false)
    }
  }

  const priorityLabel = patient.priority.replace('-', ' ').toUpperCase()
  const priorityBadgeClass = PRIORITY_BADGE[patient.priority] ?? PRIORITY_BADGE.general

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto w-full pb-24">
      {/* Breadcrumb */}
      <div className="mb-xl flex items-center gap-xs font-body-sm text-body-sm text-outline">
        <button type="button" onClick={() => navigate('/consultation/queue')} className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-outline font-body-sm text-body-sm">
          Patient Queue
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">Encounter — {patient.patientId} {patient.name}</span>
      </div>

      {/* Patient Header Card */}
      <div className="bg-surface-white border border-border-subtle rounded-xl p-md mb-lg shadow-sm">
        <div className="flex items-start justify-between mb-sm">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-lg shrink-0 border border-border-subtle">
              {patient.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex items-center gap-sm flex-wrap">
                <h2 className="font-headline-md text-headline-md text-on-surface">{patient.name}</h2>
                <span className="font-label-md text-label-md text-secondary bg-surface-container px-2 py-0.5 rounded">{patient.patientId}</span>
                <span className="font-label-md text-label-md text-secondary">{patient.age}y/{patient.sex}</span>
              </div>
              <div className="flex items-center gap-sm mt-xs flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityBadgeClass}`}>{priorityLabel}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${PAYMENT_BADGE}`}>{patient.payment}</span>
                <span className="font-label-sm text-label-sm text-secondary">Visit #{patient.visitNumber}</span>
              </div>
            </div>
          </div>
          <button type="button" className="text-secondary hover:text-primary p-2 rounded-lg hover:bg-surface-container border-0 bg-transparent cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
        </div>
        {/* Vitals strip */}
        <div className="flex flex-wrap gap-2 pt-sm border-t border-border-subtle mt-sm">
          {patient.vitals.map((v) =>
            v.isAbnormal ? (
              <div key={v.label} className="bg-[#ffebe6] text-[#bf2600] px-3 py-1.5 rounded-lg font-label-md text-label-md flex items-center gap-1.5 border border-[#ff8f73]/30">
                <span className="font-bold">{v.label} {v.value}</span>
                <span className="material-symbols-outlined text-[16px]">warning</span>
              </div>
            ) : (
              <div key={v.label} className="bg-surface-container px-3 py-1.5 rounded-lg font-label-md text-label-md text-on-surface">
                {v.label} {v.value}
              </div>
            )
          )}
        </div>
      </div>

      {/* Encounter Sections */}
      <div className="space-y-md">
        {/* §1 Triage Summary */}
        <SectionCard number={1} title="Triage Summary" collapsible>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase mb-xs">Chief Complaint</p>
              <p className="font-body-sm text-body-sm text-on-surface">{encounter?.triage_summary?.chief_complaint || 'No complaint recorded'}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase mb-xs">Priority</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${priorityBadgeClass}`}>{priorityLabel}</span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase mb-xs">Triage Time</p>
              <p className="font-body-sm text-body-sm text-on-surface">
                {encounter?.triage_summary?.assessed_at ? new Date(encounter.triage_summary.assessed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase mb-xs">Allergies</p>
              <p className="font-body-sm text-body-sm text-error font-semibold">{encounter?.patient?.allergies || 'No allergies recorded'}</p>
            </div>
            <div>
              <p className="font-label-md text-label-md text-secondary uppercase mb-xs">Triage Notes</p>
              <p className="font-body-sm text-body-sm text-on-surface">{encounter?.triage_summary?.triage_notes || 'No triage notes'}</p>
            </div>
          </div>
        </SectionCard>

        {/* §2 Clinical Notes */}
        <SectionCard number={2} title="Clinical Notes">
          <div className="space-y-md">
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">History of Presenting Complaint</label>
              <textarea
                value={hpc}
                onChange={(e) => setHpc(e.target.value)}
                rows={3}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm p-sm outline-none resize-none transition-all disabled:bg-surface-container-low disabled:text-secondary disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">Physical Examination</label>
              <textarea
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                rows={3}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm p-sm outline-none resize-none transition-all disabled:bg-surface-container-low disabled:text-secondary disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-secondary mb-xs">Impression / Assessment</label>
              <textarea
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                rows={2}
                disabled={isReadOnly}
                className="w-full rounded-lg border border-border-subtle bg-surface-white focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm p-sm outline-none resize-none transition-all disabled:bg-surface-container-low disabled:text-secondary disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </SectionCard>

        {/* §3 Diagnosis */}
        <SectionCard number={3} title="Diagnosis">
          <div className="space-y-md">
            {/* Added Diagnoses List */}
            <div className="space-y-sm mb-md">
              {encounter?.consultation?.diagnoses.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-sm border border-border-subtle rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors group">
                  <div className="flex items-center gap-md">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                      d.diagnosis_type === 'final' 
                        ? 'bg-success/10 text-success border-success/30' 
                        : d.diagnosis_type === 'differential' 
                          ? 'bg-warning/10 text-[#916a00] border-warning/30' 
                          : 'bg-primary/10 text-primary border-primary/30'
                    }`}>
                      {d.diagnosis_type}
                    </span>
                    <div>
                      <span className="block font-body-sm text-body-sm font-bold text-on-surface">
                        {d.description}
                      </span>
                      {d.code && (
                        <span className="block font-label-sm text-label-sm text-secondary">
                          ICD-10: {d.code}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isReadOnly && (
                    <button 
                      type="button" 
                      onClick={() => handleDeleteDiagnosis(d.id)}
                      className="p-1.5 text-secondary hover:text-error rounded-md hover:bg-surface-white border border-transparent hover:border-border-subtle bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              ))}
              {encounter?.consultation?.diagnoses.length === 0 && (
                <p className="font-body-sm text-body-sm text-secondary italic text-center py-md">
                  No diagnoses recorded yet.
                </p>
              )}
            </div>

            {/* Add Diagnosis Form */}
            {!isReadOnly && (
              <div className="p-sm bg-surface-container-lowest rounded-lg border border-border-subtle space-y-sm">
                <p className="font-label-md text-label-md text-secondary uppercase m-0">Add Diagnosis</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                  <input
                    type="text"
                    placeholder="Diagnosis name (e.g. Acute Bronchitis)"
                    value={diagDesc}
                    onChange={(e) => setDiagDesc(e.target.value)}
                    className="rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm px-sm py-2 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="ICD-10 Code (e.g. J20.9)"
                    value={diagCode}
                    onChange={(e) => setDiagCode(e.target.value)}
                    className="rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm px-sm py-2 outline-none"
                  />
                  <select
                    value={diagType}
                    onChange={(e) => setDiagType(e.target.value as any)}
                    className="rounded-lg border border-border-subtle bg-surface-white font-body-sm text-body-sm px-sm py-2 outline-none cursor-pointer"
                  >
                    <option value="provisional">Provisional</option>
                    <option value="differential">Differential</option>
                    <option value="final">Final Diagnosis</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddDiagnosis}
                    disabled={!diagDesc.trim()}
                    className="h-9 px-md rounded-lg font-label-md text-label-md text-white bg-primary hover:bg-primary-container border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Record Diagnosis
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* §4 Investigations */}
        <SectionCard
          number={4}
          title="Investigations"
          actionLabel={isReadOnly ? undefined : "Add Order"}
          onAction={isReadOnly ? undefined : () => setShowAddOrder(true)}
        >
          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-md">
            {orders.map((o) => (
              <span key={o.id} className="inline-flex items-center gap-sm px-sm py-1.5 rounded-lg bg-surface-container border border-border-subtle font-body-sm text-body-sm text-on-surface">
                {o.testName}
                {!isReadOnly && o.status === 'requested' && (
                  <button type="button" onClick={() => handleCancelInvestigation(o.id)} className="text-secondary hover:text-error transition-colors border-0 bg-transparent cursor-pointer p-0 flex items-center">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </span>
            ))}
            {orders.length === 0 && <span className="font-body-sm text-body-sm text-secondary italic">No active orders.</span>}
          </div>
          {/* Table */}
          {orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="py-2 font-label-sm text-label-sm text-outline uppercase tracking-wider">Test Name</th>
                    <th className="py-2 font-label-sm text-label-sm text-outline uppercase tracking-wider">Department</th>
                    <th className="py-2 font-label-sm text-label-sm text-outline uppercase tracking-wider">Priority</th>
                    <th className="py-2 font-label-sm text-label-sm text-outline uppercase tracking-wider">Requested At</th>
                    <th className="py-2 text-right font-label-sm text-label-sm text-outline uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-border-subtle hover:bg-hover-tint/30 transition-colors">
                      <td className="py-3 font-body-sm text-body-sm font-semibold text-on-surface">{o.testName}</td>
                      <td className="py-3 font-body-sm text-body-sm text-secondary">{o.department}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] uppercase ${ORDER_PRIORITY_BADGE[o.priority]}`}>{o.priority}</span>
                      </td>
                      <td className="py-3 font-body-sm text-body-sm text-secondary">{o.time}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-tighter ${STATUS_BADGE[o.status]}`}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* §5 Prescription */}
        <SectionCard
          number={5}
          title="Prescription"
          actionLabel={isReadOnly ? undefined : "Add Medication"}
          onAction={isReadOnly ? undefined : () => setShowAddMedication(true)}
        >
          {/* Drug interaction warning */}
          {!isReadOnly && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-sm mb-md flex items-start gap-sm">
              <span className="material-symbols-outlined text-error mt-0.5 shrink-0">warning</span>
              <div>
                <h4 className="font-label-md text-label-md text-error font-bold">Drug interaction warning active</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Always verify contraindications for polypharmacy prescriptions.</p>
              </div>
            </div>
          )}
          {/* Medication list */}
          <div className="space-y-sm">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="flex items-center justify-between p-sm border border-border-subtle rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors group">
                <div>
                  <span className="block font-body-sm text-body-sm font-bold text-on-surface">{rx.name}</span>
                  <span className="block font-label-sm text-label-sm text-secondary">{rx.dose} — {rx.route} ({rx.frequency} for {rx.duration})</span>
                </div>
                {!isReadOnly && (
                  <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => handleRemovePrescription(rx.id)} className="p-1.5 text-secondary hover:text-error rounded-md hover:bg-surface-white border border-transparent hover:border-border-subtle bg-transparent cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            {prescriptions.length === 0 && (
              <p className="font-body-sm text-body-sm text-secondary italic text-center py-md">No medications added yet.</p>
            )}
          </div>
        </SectionCard>

        {/* §6 Disposition */}
        <SectionCard number={6} title="Disposition">
          <DispositionContent
            disposition={disposition}
            confirmedDisposition={confirmedDisposition}
            onSelectDisposition={handleSelectDisposition}
            onConfirmDisposition={handleConfirmDisposition}
            pendingOrdersCount={orders.filter((o) => o.status === 'requested' || o.status === 'in-progress').length}
            confirmingDisposition={confirmingDisposition}
            isReadOnly={isReadOnly}
            initialDetails={encounter?.consultation}
          />
        </SectionCard>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-240px)] bg-surface-white border-t border-border-subtle p-md flex justify-end items-center gap-md z-40 shadow-[0_-8px_12px_-1px_rgba(0,0,0,0.03)]">
        {isReadOnly ? (
          <span className="flex items-center gap-sm font-label-md text-label-md text-success font-bold py-2">
            <span className="material-symbols-outlined text-[22px] leading-none text-success font-semibold" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Encounter Completed (Read-Only Mode)
          </span>
        ) : (
          <>
            {confirmedDisposition ? (
              <span className="mr-auto flex items-center gap-xs font-label-sm text-label-sm text-success">
                <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Disposition confirmed: {DISPOSITION_OPTIONS.find((d) => d.id === confirmedDisposition)?.label}
              </span>
            ) : disposition ? (
              <span className="mr-auto flex items-center gap-xs font-label-sm text-label-sm text-warning">
                <span className="material-symbols-outlined text-[16px] leading-none">pending</span>
                Disposition selected but not confirmed
              </span>
            ) : null}
            <button 
              type="button" 
              onClick={handleSaveNotes}
              disabled={saving}
              className="px-6 py-2 border border-border-subtle text-on-surface font-semibold font-label-md text-label-md rounded-lg hover:bg-surface-container transition-all active:scale-95 h-[44px] cursor-pointer bg-transparent disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={!confirmedDisposition || saving}
              onClick={handleCompleteEncounter}
              className={`px-6 py-2 font-semibold font-label-md text-label-md rounded-lg flex items-center gap-sm h-[44px] border-0 transition-all ${
                confirmedDisposition && !saving
                  ? 'bg-primary text-white cursor-pointer hover:opacity-90 active:scale-95'
                  : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-70'
              }`}
            >
              {confirmedDisposition ? (
                <>
                  <span className="material-symbols-outlined text-[20px] leading-none">check_circle</span>
                  {saving ? 'Completing...' : 'Complete Encounter'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px] leading-none">lock</span>
                  {disposition ? 'Confirm Disposition to Complete' : 'Set Disposition to Complete'}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Modals */}
      {showAddOrder && (
        <AddOrderModal
          onClose={() => setShowAddOrder(false)}
          onAdd={handleAddInvestigation}
        />
      )}
      {showAddMedication && (
        <AddMedicationModal
          onClose={() => setShowAddMedication(false)}
          onAdd={handleAddPrescription}
        />
      )}
    </div>
  )
}
