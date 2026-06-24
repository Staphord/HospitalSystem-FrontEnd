import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { InpatientPatientHeader } from '@/features/consultation/components/InpatientPatientHeader'
import { getAdmittedPatientById, getInitialOrdersForAdmission } from '@/features/consultation/data/mockInpatientOrders'
import type {
  InpatientOrder,
  OrderStatus,
  OrderType,
} from '@/features/consultation/types/inpatientOrders'

// ── Config ─────────────────────────────────────────────────────────────────────

const ORDER_TYPE_CONFIG: Record<OrderType, { icon: string; color: string; bg: string; label: string }> = {
  medication:    { icon: 'pill',             color: 'text-[#6554C0]', bg: 'bg-[#6554C0]/10', label: 'Medication'    },
  nursing:       { icon: 'medical_services', color: 'text-success',   bg: 'bg-success/10',   label: 'Nursing'       },
  diet:          { icon: 'restaurant',       color: 'text-warning',   bg: 'bg-warning/10',   label: 'Diet'          },
  investigation: { icon: 'biotech',          color: 'text-primary',   bg: 'bg-primary/10',   label: 'Investigation' },
}

const ORDER_STATUS_CONFIG: Record<OrderStatus, { badge: string; ping?: boolean }> = {
  pending:       { badge: 'bg-warning/10 text-[#B86D00] border border-warning/30', ping: true },
  done:          { badge: 'bg-success/10 text-success border border-success/30' },
  discontinued:  { badge: 'bg-surface-container text-outline border border-border-subtle' },
}

const DRUG_SUGGESTIONS = [
  'Aspirin 75mg', 'Amoxicillin 500mg', 'Metformin 500mg', 'Paracetamol 1g',
  'Salbutamol Inhaler', 'Omeprazole 20mg', 'Amlodipine 5mg', 'Morphine 10mg',
]

const TEST_SUGGESTIONS = [
  'ECG (12-Lead Electrocardiogram)', 'Full Blood Count', 'Chest X-Ray',
  'Urea & Electrolytes', 'CT Head', 'Abdominal Ultrasound',
]

const FREQUENCIES = ['Daily', 'Twice Daily (BID)', 'Three Times Daily (TID)', 'Every 4 Hours', 'STAT (Immediate)']
const ROUTES = ['PO (Oral)', 'IV (Intravenous)', 'IM (Intramuscular)', 'SC (Subcutaneous)']

type ModalTab = 'medication' | 'nursing' | 'diet' | 'investigation'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// ── Issue Order Modal ─────────────────────────────────────────────────────────

function IssueOrderModal({
  onClose,
  onIssue,
}: {
  onClose: () => void
  onIssue: (order: InpatientOrder) => void
}) {
  const [tab, setTab] = useState<ModalTab>('medication')

  // Medication
  const [drug, setDrug] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState('Daily')
  const [route, setRoute] = useState('PO (Oral)')
  const [duration, setDuration] = useState('')
  const [instructions, setInstructions] = useState('')

  // Nursing
  const [nursingTask, setNursingTask] = useState('')
  const [nursingNotes, setNursingNotes] = useState('')

  // Diet
  const [dietType, setDietType] = useState('Regular')
  const [dietNotes, setDietNotes] = useState('')

  // Investigation
  const [testName, setTestName] = useState('')
  const [urgency, setUrgency] = useState<'stat' | 'urgent' | 'routine'>('routine')
  const [clinicalReason, setClinicalReason] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleIssue = () => {
    let description = ''
    let subDescription: string | undefined

    switch (tab) {
      case 'medication':
        if (!drug.trim()) return
        description = `${drug.trim()}${dose ? ` ${dose.trim()}` : ''} ${frequency}`
        subDescription = route
        break
      case 'nursing':
        if (!nursingTask.trim()) return
        description = nursingTask.trim()
        subDescription = nursingNotes.trim() || undefined
        break
      case 'diet':
        description = `${dietType} Diet`
        subDescription = dietNotes.trim() || undefined
        break
      case 'investigation':
        if (!testName.trim()) return
        description = testName.trim()
        subDescription = clinicalReason.trim() || undefined
        break
    }

    onIssue({
      id: uid(),
      admissionId: '',
      type: tab === 'medication' ? 'medication' : tab === 'nursing' ? 'nursing' : tab === 'diet' ? 'diet' : 'investigation',
      description,
      subDescription,
      issuedAt: 'Issued Today ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      dueLabel: tab === 'investigation' && urgency === 'stat' ? 'ASAP' : frequency || 'Due as scheduled',
      status: 'pending',
    })
    onClose()
  }

  const TABS: { id: ModalTab; label: string }[] = [
    { id: 'medication', label: 'Medication' },
    { id: 'nursing', label: 'Nursing Care' },
    { id: 'diet', label: 'Diet' },
    { id: 'investigation', label: 'Investigation' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[560px] bg-surface-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-container-low">
          <h3 className="font-headline-md text-headline-md text-on-surface m-0">Issue Inpatient Order</h3>
          <button type="button" onClick={onClose} className="p-xs rounded-full hover:bg-surface-container transition-colors bg-transparent border-0 cursor-pointer text-outline">
            <span className="material-symbols-outlined leading-none">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle overflow-x-auto bg-surface-white">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-lg py-sm font-label-md text-label-md whitespace-nowrap border-b-2 transition-colors bg-transparent border-x-0 border-t-0 cursor-pointer ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-outline hover:bg-surface-container-low'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-lg space-y-md">
          {tab === 'medication' && (
            <>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Drug Search</label>
                <div className="relative">
                  <span className="absolute left-sm top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px] leading-none pointer-events-none">search</span>
                  <input
                    type="text"
                    value={drug}
                    onChange={(e) => setDrug(e.target.value)}
                    list="drug-suggestions"
                    placeholder="Start typing medication name…"
                    className="w-full pl-xl pr-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none"
                  />
                  <datalist id="drug-suggestions">
                    {DRUG_SUGGESTIONS.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-label-md text-outline mb-xs">Dose</label>
                  <input type="text" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 500mg" className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none" />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-outline mb-xs">Frequency</label>
                  <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none cursor-pointer">
                    {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block font-label-md text-label-md text-outline mb-xs">Route</label>
                  <select value={route} onChange={(e) => setRoute(e.target.value)} className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none cursor-pointer">
                    {ROUTES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-outline mb-xs">Duration</label>
                  <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 7 days" className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Special Instructions</label>
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Additional details…" className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none resize-none" />
              </div>
            </>
          )}

          {tab === 'nursing' && (
            <>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Nursing Task <span className="text-error">*</span></label>
                <input type="text" value={nursingTask} onChange={(e) => setNursingTask(e.target.value)} placeholder="e.g. Vitals every 4 hours" className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Instructions / Details</label>
                <textarea value={nursingNotes} onChange={(e) => setNursingNotes(e.target.value)} rows={3} placeholder="Include BP, HR, Temp, SpO2…" className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none resize-none" />
              </div>
            </>
          )}

          {tab === 'diet' && (
            <>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Diet Type</label>
                <select value={dietType} onChange={(e) => setDietType(e.target.value)} className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none cursor-pointer">
                  {['Regular', 'Soft', 'Liquid', 'Diabetic', 'Low Sodium', 'NPO (Nil Per Os)'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Dietary Notes</label>
                <textarea value={dietNotes} onChange={(e) => setDietNotes(e.target.value)} rows={3} placeholder="Allergies, restrictions…" className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none resize-none" />
              </div>
            </>
          )}

          {tab === 'investigation' && (
            <>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Test / Imaging</label>
                <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} list="test-suggestions" placeholder="Search test name…" className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none" />
                <datalist id="test-suggestions">
                  {TEST_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Urgency</label>
                <div className="flex gap-sm">
                  {(['stat', 'urgent', 'routine'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u)}
                      className={`flex-1 py-sm rounded-lg font-label-md text-label-md uppercase border transition-all cursor-pointer flex items-center justify-center gap-xs ${
                        urgency === u
                          ? u === 'stat' ? 'bg-error-container text-on-error-container border-error ring-2 ring-error' : 'border-primary text-primary ring-1 ring-primary'
                          : 'border-border-subtle text-outline hover:bg-surface-container-low bg-transparent'
                      }`}
                    >
                      {u === 'stat' && <span className="material-symbols-outlined text-[16px] leading-none">warning</span>}
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Clinical Reason</label>
                <input type="text" value={clinicalReason} onChange={(e) => setClinicalReason(e.target.value)} placeholder="Clinical indication…" className="w-full px-md py-sm border border-border-subtle rounded-lg focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md outline-none" />
              </div>
              <div>
                <label className="block font-label-md text-label-md text-outline mb-xs">Schedule</label>
                <input type="text" readOnly value={urgency === 'stat' ? 'ASAP' : urgency === 'urgent' ? 'Within 24 hours' : 'Routine schedule'} className="w-full px-md py-sm border border-border-subtle rounded-lg font-body-md text-body-md outline-none bg-surface-container-low font-semibold" />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex justify-end gap-sm">
          <button type="button" onClick={onClose} className="px-lg h-10 border border-border-subtle text-on-surface font-semibold rounded-lg hover:bg-surface-container transition-colors bg-transparent cursor-pointer font-label-md text-label-md">
            Cancel
          </button>
          <button type="button" onClick={handleIssue} className="px-lg h-10 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-all active:scale-95 border-0 cursor-pointer flex items-center gap-xs font-label-md text-label-md">
            {tab === 'investigation' && <span className="material-symbols-outlined text-[20px] leading-none">send</span>}
            Issue Order
          </button>
        </div>
      </div>
    </div>
  )
}

export function InpatientOrdersPage() {
  const { admissionId } = useParams<{ admissionId: string }>()
  const navigate = useNavigate()
  const patient = admissionId ? getAdmittedPatientById(admissionId) : undefined

  const [orders, setOrders] = useState<InpatientOrder[]>(() =>
    admissionId ? getInitialOrdersForAdmission(admissionId).filter((o) => o.status !== 'discontinued') : [],
  )
  const [showModal, setShowModal] = useState(false)

  if (!patient) {
    return (
      <div className="max-w-container-max mx-auto flex flex-col items-center justify-center min-h-[400px] text-center gap-md">
        <span className="material-symbols-outlined text-[64px] text-outline/40 leading-none select-none" style={{ fontVariationSettings: "'wght' 200" }}>bed</span>
        <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Admission not found</h3>
        <p className="font-body-md text-body-md text-outline max-w-sm m-0">No admission record found for ID &quot;{admissionId ?? ''}&quot;.</p>
        <button type="button" onClick={() => navigate('/consultation/inpatient')} className="mt-sm bg-primary text-white px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity border-0 cursor-pointer flex items-center gap-xs">
          <span className="material-symbols-outlined text-[18px] leading-none">arrow_back</span>
          Back to Admitted Patients
        </button>
      </div>
    )
  }

  const activeOrders = orders.filter((o) => o.status !== 'discontinued')

  const discontinueOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  const addOrder = (order: InpatientOrder) => {
    setOrders((prev) => [...prev, { ...order, admissionId: patient.id }])
  }

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg">

      {/* Breadcrumb + title + action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-md">
        <div>
          <nav className="flex items-center gap-xs font-label-md text-label-md text-outline mb-xs" aria-label="Breadcrumb">
            <button type="button" onClick={() => navigate('/consultation/inpatient')} className="hover:text-primary transition-colors bg-transparent border-0 cursor-pointer p-0 text-outline font-label-md">
              Admitted Patients
            </button>
            <span className="material-symbols-outlined text-[14px] leading-none">chevron_right</span>
            <span className="text-on-surface-variant">Inpatient Orders — {patient.name}, {patient.bed}</span>
          </nav>
          <h2 className="font-headline-md text-headline-md text-on-surface m-0">Inpatient Orders</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-lg h-10 rounded-lg font-semibold flex items-center gap-sm hover:opacity-90 transition-colors shadow-sm border-0 cursor-pointer active:scale-95 font-label-md text-label-md"
        >
          <span className="material-symbols-outlined leading-none">add</span>
          Issue New Order
        </button>
      </div>

      {/* Patient header */}
      <InpatientPatientHeader
        patient={patient}
        variant="orders"
        onViewHistory={() => navigate(`/consultation/history/${patient.patientId}`)}
      />

      {/* Active orders table */}
      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between bg-surface-container-lowest">
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Active Orders for This Patient</h3>
          <span className="font-body-sm text-body-sm text-outline">Showing {activeOrders.length} order{activeOrders.length === 1 ? '' : 's'}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                {['Order Type', 'Description', 'Timeline', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-lg py-sm font-label-md text-label-md text-secondary uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {activeOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-lg py-xl text-center font-body-sm text-body-sm text-outline italic">
                    No active orders for this patient. Click &quot;Issue New Order&quot; to add one.
                  </td>
                </tr>
              ) : (
                activeOrders.map((order) => {
                  const tCfg = ORDER_TYPE_CONFIG[order.type]
                  const sCfg = ORDER_STATUS_CONFIG[order.status]

                  return (
                    <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-sm">
                          <div className={`w-8 h-8 rounded-lg ${tCfg.bg} flex items-center justify-center ${tCfg.color}`}>
                            <span className="material-symbols-outlined text-[18px] leading-none">{tCfg.icon}</span>
                          </div>
                          <span className="font-semibold font-body-md text-body-md">{tCfg.label}</span>
                        </div>
                      </td>
                      <td className="px-lg py-md">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">{order.description}</span>
                          {order.subDescription && <span className="font-body-sm text-body-sm text-outline">{order.subDescription}</span>}
                        </div>
                      </td>
                      <td className="px-lg py-md">
                        <div className="flex flex-col font-body-sm text-body-sm">
                          <span className="text-on-surface">{order.issuedAt}</span>
                          <span className="text-outline">{order.dueLabel}</span>
                        </div>
                      </td>
                      <td className="px-lg py-md">
                        <div className="flex flex-col gap-xs">
                          <span className={`inline-flex items-center gap-xs px-md py-xs rounded-full font-label-sm text-[11px] uppercase font-bold w-fit ${sCfg.badge}`}>
                            {sCfg.ping && <span className="w-1.5 h-1.5 rounded-full bg-warning animate-ping shrink-0" />}
                            {order.status === 'done' ? 'Done' : order.status}
                          </span>
                          {order.completedBy && (
                            <span className="font-label-sm text-[10px] text-outline italic">by {order.completedBy}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-lg py-md text-right">
                        <button
                          type="button"
                          onClick={() => discontinueOrder(order.id)}
                          className="text-error font-semibold font-label-md text-label-md hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          Discontinue
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-lg bg-surface-container-low text-center border-t border-border-subtle">
          <p className="font-body-sm text-body-sm text-outline m-0">Manage all orders with precision to ensure patient safety.</p>
        </div>
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg opacity-40 grayscale pointer-events-none select-none">
        <div className="h-32 border border-dashed border-border-subtle rounded-xl bg-surface flex items-center justify-center font-body-sm text-body-sm text-outline italic">
          Placeholder for Laboratory Investigations
        </div>
        <div className="h-32 border border-dashed border-border-subtle rounded-xl bg-surface flex items-center justify-center font-body-sm text-body-sm text-outline italic">
          Placeholder for Radiology Reports
        </div>
      </div>

      {showModal && (
        <IssueOrderModal onClose={() => setShowModal(false)} onIssue={addOrder} />
      )}
    </div>
  )
}
