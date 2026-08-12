import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatTzs } from '../data/mockPayments'
import { billingService } from '@/api/services/billing'

interface BillItem {
  id: string
  category: 'Consultation' | 'Laboratory' | 'Radiology' | 'Pharmacy' | 'Procedures' | 'Registration'
  label: string
  qty: number
  unitPrice: number
}

interface BillData {
  id: string
  patientName: string
  patientNo: string
  visitDate: string
  paymentMethod: 'Cash' | 'Insurance' | 'Exempt'
  insurer: string | null
  policyNo: string | null
  items: BillItem[]
  paid: number
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Insurance Pending'
}

function getCategoryFromLabel(label: string): BillItem['category'] {
  const lower = label.toLowerCase()
  if (lower.includes('consultation')) return 'Consultation'
  if (lower.includes('laboratory') || lower.includes('lab') || lower.includes('blood') || lower.includes('malaria')) return 'Laboratory'
  if (lower.includes('radiology') || lower.includes('x-ray') || lower.includes('ultrasound')) return 'Radiology'
  if (lower.includes('pharmacy') || lower.includes('medication') || lower.includes('tab') || lower.includes('capsule') || lower.includes('artemether') || lower.includes('paracetamol')) return 'Pharmacy'
  if (lower.includes('procedure') || lower.includes('surgery')) return 'Procedures'
  return 'Registration'
}

export function BillDetailsPage() {
  const { billId } = useParams<{ billId: string }>()

  const [showAddModal, setShowAddModal] = useState(false)
  const [newDescription, setNewDescription] = useState('')
  const [newPrice, setNewPrice] = useState('')

  const [bill, setBill] = useState<BillData>({
    id: billId || 'pay4',
    patientName: 'Hassan Mwita',
    patientNo: 'PT-4889',
    visitDate: '2026-06-11',
    paymentMethod: 'Insurance',
    insurer: 'Jubilee Insurance',
    policyNo: 'JUB-441205',
    paid: 20000,
    status: 'Partial',
    items: [
      { id: 'i1', category: 'Consultation', label: 'Specialist consultation - Physician', qty: 1, unitPrice: 20000 },
      { id: 'i2', category: 'Radiology', label: 'Chest X-Ray AP/LAT', qty: 1, unitPrice: 25000 },
      { id: 'i3', category: 'Radiology', label: 'Abdominal Ultrasound', qty: 1, unitPrice: 15000 },
      { id: 'i4', category: 'Laboratory', label: 'Full Blood Picture (FBP)', qty: 1, unitPrice: 12000 },
      { id: 'i5', category: 'Laboratory', label: 'Malaria Rapid Test (mRDT)', qty: 1, unitPrice: 8000 },
      { id: 'i6', category: 'Pharmacy', label: 'Artemether-Lumefantrine tabs', qty: 1, unitPrice: 10000 },
      { id: 'i7', category: 'Pharmacy', label: 'Paracetamol 500mg tabs x20', qty: 1, unitPrice: 2000 },
      { id: 'i8', category: 'Registration', label: 'Outpatient Registration Fee', qty: 1, unitPrice: 10000 },
    ],
  })

  useEffect(() => {
    if (billId && !billId.startsWith('pay')) {
      billingService.getBill(billId)
        .then((realBill) => {
          if (realBill) {
            setBill({
              id: realBill.bill_id,
              patientName: realBill.patient_name || `Patient (${realBill.patient_id.slice(0, 8)})`,
              patientNo: realBill.patient_number || `PT-${realBill.patient_id.slice(0, 6).toUpperCase()}`,
              visitDate: new Date(realBill.created_at).toISOString().split('T')[0],
              paymentMethod: 'Cash',
              insurer: null,
              policyNo: null,
              paid: realBill.status === 'paid' ? Number(realBill.total_amount) : 0,
              status: realBill.status === 'paid' ? 'Paid' : 'Unpaid',
              items: realBill.items ? realBill.items.map((it, idx) => ({
                id: it.item_id || `i${idx}`,
                category: getCategoryFromLabel(it.description),
                label: it.description,
                qty: Number(it.quantity) || 1,
                unitPrice: Number(it.unit_price) || Number(it.line_total),
              })) : [],
            })
          }
        })
        .catch((err) => console.error('Failed to load bill details in BillDetailsPage:', err))
    }
  }, [billId])

  const handleAddCharge = async () => {
    if (!newDescription.trim() || !newPrice || Number.parseFloat(newPrice) <= 0) {
      return
    }
    const priceNum = Number.parseFloat(newPrice)
    if (bill.id && !bill.id.startsWith('pay')) {
      try {
        const updatedBill = await billingService.addBillItem(bill.id, {
          description: newDescription.trim(),
          unit_price: priceNum,
          quantity: 1,
          item_code: 'FEE',
          item_type: 'service',
        })
        setBill({
          ...bill,
          items: updatedBill.items.map((it, idx) => ({
            id: it.item_id || `i${idx}`,
            category: getCategoryFromLabel(it.description),
            label: it.description,
            qty: Number(it.quantity) || 1,
            unitPrice: Number(it.unit_price) || Number(it.line_total),
          })),
        })
      } catch (err) {
        console.error('Failed to add manual charge:', err)
      }
    } else {
      const newItem: BillItem = {
        id: `i-${Date.now()}`,
        category: getCategoryFromLabel(newDescription),
        label: newDescription.trim(),
        qty: 1,
        unitPrice: priceNum,
      }
      setBill({ ...bill, items: [...bill.items, newItem] })
    }
    setNewDescription('')
    setNewPrice('')
    setShowAddModal(false)
  }

  // Group bill items by category
  const categories = Array.from(new Set(bill.items.map((item) => item.category)))

  const getCategorySubtotal = (cat: string) => {
    return bill.items
      .filter((item) => item.category === cat)
      .reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  }

  const grossTotal = bill.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const outstanding = Math.max(0, grossTotal - bill.paid)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* Breadcrumbs */}
      <nav className="flex text-xs font-semibold text-slate-400 uppercase tracking-wider gap-2">
        <Link to="/billing/dashboard" className="hover:text-slate-600">Cashier Dashboard</Link>
        <span>/</span>
        <Link to="/billing" className="hover:text-slate-600">Patient Bills</Link>
        <span>/</span>
        <span className="text-slate-700">Bill Details</span>
      </nav>

      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Details</h1>
          <p className="text-sm text-slate-500">Invoice: {bill.id} · Date: {bill.visitDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/billing"
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-all no-underline hover:no-underline"
          >
            Back to Bills
          </Link>
          {outstanding > 0 && (
            <Link
              to={`/billing/payment/${bill.id}`}
              className="px-4 py-2 text-sm font-semibold text-white hover:text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all no-underline hover:no-underline"
            >
              Process Payment
            </Link>
          )}
        </div>
      </div>

      {/* Patient info card */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase">Patient Name</span>
          <span className="font-bold text-slate-800 text-sm mt-1 block">{bill.patientName}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase">File / ID Number</span>
          <span className="font-semibold text-slate-700 text-sm mt-1 block font-mono">{bill.patientNo}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase">Payment Method</span>
          <span className="font-semibold text-slate-700 text-sm mt-1 block">
            {bill.paymentMethod} {bill.insurer ? `(${bill.insurer})` : ''}
          </span>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block uppercase">Status</span>
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold mt-1 ${
              bill.status === 'Paid'
                ? 'bg-emerald-100 text-emerald-700'
                : bill.status === 'Partial'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {bill.status}
          </span>
        </div>
      </div>

      {/* Itemized card grouped by category */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Itemized Charge Sheet</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {categories.map((cat) => (
            <div key={cat} className="p-6 space-y-4">
              {/* Category sub-header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{cat}</h4>
                <span className="text-xs font-bold text-slate-700">
                  Subtotal: {formatTzs(getCategorySubtotal(cat))}
                </span>
              </div>

              {/* Category items list */}
              <div className="space-y-3">
                {bill.items
                  .filter((item) => item.category === cat)
                  .map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-start gap-4">
                        <span className="text-slate-400 font-mono text-xs w-6 text-right mt-0.5">x{item.qty}</span>
                        <span className="text-slate-700 font-medium">{item.label}</span>
                      </div>
                      <span className="text-slate-600 font-mono">
                        {formatTzs(item.qty * item.unitPrice)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Summary card */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 text-sm text-slate-500">
          <p className="flex justify-between w-64">
            <span>Gross Invoice Total:</span>
            <span className="font-mono font-semibold text-slate-800">{formatTzs(grossTotal)}</span>
          </p>
          <p className="flex justify-between w-64">
            <span>Total Paid Amount:</span>
            <span className="font-mono font-semibold text-emerald-600">{formatTzs(bill.paid)}</span>
          </p>
          <hr className="border-slate-100 my-2 w-64" />
          <p className="flex justify-between w-64 text-base font-bold text-slate-900">
            <span>Outstanding Due:</span>
            <span className="font-mono text-rose-600">{formatTzs(outstanding)}</span>
          </p>
        </div>

        {outstanding > 0 ? (
          <div className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700 shadow-sm max-w-sm">
            <h4 className="font-bold text-xs mb-1 uppercase tracking-wider text-rose-400">Payment Collection Action</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              This invoice has an outstanding balance of {formatTzs(outstanding)}. Ensure collection before patient discharge.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex-1 py-2 text-xs font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition border-0 cursor-pointer"
              >
                + Add Fee
              </button>
              <Link
                to={`/billing/payment/${bill.id}`}
                className="flex-1 text-center py-2 text-xs font-bold text-white hover:text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition no-underline hover:no-underline"
              >
                Collect Payment
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl max-w-sm flex items-center gap-3 text-emerald-800">
            <span className="material-symbols-outlined text-emerald-500 text-2xl">check_circle</span>
            <div>
              <h4 className="font-bold text-xs">Fully Settled Invoice</h4>
              <p className="text-[11px] text-emerald-600 leading-relaxed">
                This invoice has been settled in full. No outstanding actions required.
              </p>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="m-0 text-base font-bold text-slate-900">Add Service Charge / Fee (FR-34)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Charge Description</label>
                <input
                  type="text"
                  placeholder="e.g. Consultation Fee, Procedure Charge"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Unit Price (TZS)</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 border-0 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCharge}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 border-0 cursor-pointer"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
