import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { formatTzs } from '../data/mockPayments'

type PaymentView = 'cash' | 'mobile_money' | 'insurance'

interface BillItem {
  id: string
  category: 'Consultation' | 'Lab' | 'Radiology' | 'Medications' | 'Procedures' | 'Registration'
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
  items: BillItem[]
  paid: number
}

const CATEGORY_LABELS: Record<BillItem['category'], string> = {
  Consultation: 'CONSULTATION',
  Lab: 'LABORATORY',
  Radiology: 'RADIOLOGY',
  Medications: 'PHARMACY',
  Procedures: 'PROCEDURES',
  Registration: 'REGISTRATION',
}

const VIEW_OPTIONS: Record<
  PaymentView,
  { label: string; options: Array<{ value: PaymentView; label: string }>; methodPill: string }
> = {
  cash: {
    label: 'Cash',
    methodPill: 'Payment Type: Cash',
    options: [
      { value: 'cash', label: 'Cash' },
      { value: 'mobile_money', label: 'Mobile Money' },
      { value: 'insurance', label: 'Insurance Claim' },
    ],
  },
  mobile_money: {
    label: 'Mobile Money (M-Pesa)',
    methodPill: 'Payment Type: Mobile Money',
    options: [
      { value: 'mobile_money', label: 'Mobile Money (M-Pesa)' },
      { value: 'cash', label: 'Cash' },
      { value: 'insurance', label: 'Insurance Claim' },
    ],
  },
  insurance: {
    label: 'Insurance Claim',
    methodPill: 'Payment Type: Insurance',
    options: [
      { value: 'insurance', label: 'Insurance Claim' },
      { value: 'cash', label: 'Cash' },
      { value: 'mobile_money', label: 'Mobile Money' },
    ],
  },
}

const BILL_FALLBACK: BillData = {
  id: 'pay4',
  patientName: 'Hassan Mwita',
  patientNo: 'PT-4889',
  visitDate: '2026-06-11',
  paymentMethod: 'Insurance',
  insurer: 'Jubilee Insurance',
  paid: 20000,
  items: [
    { id: 'i1', category: 'Consultation', label: 'Specialist consultation - Physician', qty: 1, unitPrice: 20000 },
    { id: 'i2', category: 'Radiology', label: 'Chest X-Ray AP/LAT', qty: 1, unitPrice: 25000 },
    { id: 'i3', category: 'Radiology', label: 'Abdominal Ultrasound', qty: 1, unitPrice: 15000 },
    { id: 'i4', category: 'Lab', label: 'Full Blood Picture (FBP)', qty: 1, unitPrice: 12000 },
    { id: 'i5', category: 'Lab', label: 'Malaria Rapid Test (mRDT)', qty: 1, unitPrice: 8000 },
    { id: 'i6', category: 'Medications', label: 'Artemether-Lumefantrine tabs', qty: 1, unitPrice: 10000 },
    { id: 'i7', category: 'Medications', label: 'Paracetamol 500mg tabs x20', qty: 1, unitPrice: 2000 },
    { id: 'i8', category: 'Registration', label: 'Outpatient Registration Fee', qty: 1, unitPrice: 10000 },
  ],
}

function getCategoryFromLabel(label: string): BillItem['category'] {
  const lower = label.toLowerCase()
  if (lower.includes('consultation')) return 'Consultation'
  if (lower.includes('laboratory') || lower.includes('lab') || lower.includes('blood') || lower.includes('malaria')) return 'Lab'
  if (lower.includes('radiology') || lower.includes('x-ray') || lower.includes('ultrasound')) return 'Radiology'
  if (lower.includes('pharmacy') || lower.includes('medication') || lower.includes('tab') || lower.includes('capsule') || lower.includes('artemether') || lower.includes('paracetamol')) return 'Medications'
  if (lower.includes('procedure') || lower.includes('surgery')) return 'Procedures'
  return 'Registration'
}

function mapBillFromStorage(billId?: string): BillData {
  const allPayments = JSON.parse(localStorage.getItem('hf_mock_payment_rows') || '[]')
  const match = allPayments.find((p: any) => p.id === billId)

  if (!match) {
    return BILL_FALLBACK
  }

  return {
    id: match.id,
    patientName: match.patientName,
    patientNo: match.patientNumber || match.patientNo || BILL_FALLBACK.patientNo,
    visitDate: match.visitDate || BILL_FALLBACK.visitDate,
    paymentMethod: match.paymentMethod as BillData['paymentMethod'],
    insurer: match.insurer || null,
    paid: match.paid || 0,
    items:
      match.lineItems?.map((item: any, idx: number) => ({
        id: `i${idx}`,
        category: getCategoryFromLabel(item.label),
        label: item.label,
        qty: 1,
        unitPrice: item.amount,
      })) || BILL_FALLBACK.items,
  }
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(date)
}

function selectInitialView(method: BillData['paymentMethod']): PaymentView {
  if (method === 'Cash') return 'cash'
  if (method === 'Insurance') return 'insurance'
  return 'mobile_money'
}

function groupByCategory(items: BillItem[]) {
  return ['Consultation', 'Lab', 'Radiology', 'Medications', 'Procedures', 'Registration'].flatMap((category) => {
    const categoryItems = items.filter((item) => item.category === category)
    if (categoryItems.length === 0) return []
    return [{ category: category as BillItem['category'], items: categoryItems }]
  })
}

export function ProcessingPaymentPage() {
  const { billId } = useParams<{ billId: string }>()
  const navigate = useNavigate()

  const [bill] = useState<BillData>(() => mapBillFromStorage(billId))
  const grossTotal = bill.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
  const outstandingAmount = Math.max(0, grossTotal - bill.paid)
  const [paymentView, setPaymentView] = useState<PaymentView>(() => selectInitialView(bill.paymentMethod))

  const [cashTendered, setCashTendered] = useState('')
  const [changeAmount, setChangeAmount] = useState(0)
  const [mobilePhone, setMobilePhone] = useState('')
  const [mobileRef, setMobileRef] = useState('')
  const [mobileTxnId, setMobileTxnId] = useState('')
  const [smsReceipt, setSmsReceipt] = useState(true)
  const [insurerName, setInsurerName] = useState(bill.insurer || 'NHIF')
  const [coverageAmount] = useState('70,000')
  const [claimNumber, setClaimNumber] = useState('')
  const [preAuthNumber, setPreAuthNumber] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptNo, setReceiptNo] = useState('')

  useEffect(() => {
    if (paymentView !== 'cash') {
      setChangeAmount(0)
      return
    }

    const tendered = Number.parseFloat(cashTendered)
    setChangeAmount(Number.isFinite(tendered) ? Math.max(0, tendered - outstandingAmount) : 0)
  }, [cashTendered, outstandingAmount, paymentView])

  const handleIssueReceipt = (e?: React.FormEvent) => {
    e?.preventDefault()

    if (paymentView === 'cash') {
      const tendered = Number.parseFloat(cashTendered)
      if (!Number.isFinite(tendered) || tendered < outstandingAmount) {
        toast.error('Tendered cash amount is insufficient.')
        return
      }
    }

    if (paymentView === 'mobile_money') {
      if (!mobilePhone.trim() || !mobileRef.trim() || !mobileTxnId.trim()) {
        toast.error('Please complete the mobile money fields.')
        return
      }
    }

    if (paymentView === 'insurance') {
      if (!insurerName.trim() || !claimNumber.trim()) {
        toast.error('Please complete the insurance authorization fields.')
        return
      }
    }

    const allPayments = JSON.parse(localStorage.getItem('hf_mock_payment_rows') || '[]')
    const updatedPayments = allPayments.map((p: any) => {
      if (p.id !== bill.id) return p
      const newPaid = p.paid + outstandingAmount
      return {
        ...p,
        paid: newPaid,
        status: newPaid >= p.totalBill ? 'Paid' : 'Partial',
        paymentMethod:
          paymentView === 'cash' ? 'Cash' : paymentView === 'mobile_money' ? 'Mobile Money' : 'Insurance',
        lastPaymentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    })
    localStorage.setItem('hf_mock_payment_rows', JSON.stringify(updatedPayments))

    const transactions = JSON.parse(localStorage.getItem('hf_mock_daily_transactions') || '[]')
    transactions.unshift({
      id: `t-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      patientName: bill.patientName,
      patientNo: bill.patientNo,
      method:
        paymentView === 'cash' ? 'Cash' : paymentView === 'mobile_money' ? 'Mobile Money' : 'Insurance',
      amount: outstandingAmount,
      status: 'Settled',
    })
    localStorage.setItem('hf_mock_daily_transactions', JSON.stringify(transactions))

    setReceiptNo(`REC-${Math.floor(100000 + Math.random() * 900000)}`)
    setShowReceipt(true)
    toast.success('Payment processed successfully. Receipt generated.')
  }

  const handleDoneReceipt = () => {
    setShowReceipt(false)
    navigate('/billing')
  }

  const patientPayableLabel = formatTzs(outstandingAmount)
  const paymentViewConfig = VIEW_OPTIONS[paymentView]
  const groupedItems = groupByCategory(bill.items)
  const flatItems = bill.items.map((item) => ({
    ...item,
    department: CATEGORY_LABELS[item.category],
  }))

  return (
    <div className="w-full min-w-0 pb-32 text-[#1f2430]">
      <nav className="mb-4 flex items-center gap-2 font-body-sm text-[13px] text-[#51617e]">
        <Link to="/billing/dashboard" className="transition-colors hover:text-[#0052cc]">
          Patient Bills
        </Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-medium text-[#1f2430]">
          Process Payment - {bill.patientNo} {bill.patientName}
        </span>
      </nav>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <section className="overflow-hidden rounded-[12px] border border-[#dfe1e6] bg-white lg:col-span-7">
          <div className="flex items-center justify-between border-b border-[#dfe1e6] bg-[#f8f9fb] px-5 py-4">
            <h2 className="m-0 flex items-center gap-2 font-headline-sm text-[16px] font-semibold text-[#1f2430]">
              <span className="material-symbols-outlined text-[18px] text-[#0052cc]">receipt_long</span>
              Itemized Bill
            </h2>
            <span className="rounded-[6px] bg-[#e8effd] px-2 py-1 font-label-sm text-[11px] font-semibold uppercase tracking-[0.06em] text-[#42526e]">
              {paymentViewConfig.methodPill}
            </span>
          </div>

          {paymentView === 'cash' ? (
            <>
              <div className="flex flex-col">
                {groupedItems.map((group) => {
                  const subtotal = group.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)

                  return (
                    <div key={group.category}>
                      <div className="flex justify-between border-b border-[#dfe1e6] bg-[#f4f5f7] px-4 py-2.5 font-label-md text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                        <span>{CATEGORY_LABELS[group.category]}</span>
                        <span>Subtotal: {formatTzs(subtotal)}</span>
                      </div>
                      {group.items.map((item) => (
                        <div key={item.id} className="border-b border-[#dfe1e6] px-4 py-2.5 transition-colors hover:bg-[#deebff]/30">
                          <div className="flex items-center justify-between font-body-sm text-[13px] text-[#1f2430]">
                            <span>{item.label}</span>
                            <span>{formatTzs(item.qty * item.unitPrice)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-2 bg-[#f8f9fb] px-5 py-4">
                <div className="flex items-center justify-between font-body-sm text-[13px] text-[#51617e]">
                  <span>Subtotal</span>
                  <span>{formatTzs(grossTotal)}</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-[13px] text-[#51617e]">
                  <span>Insurance Deduction</span>
                  <span>{formatTzs(0)}</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-[13px] text-[#51617e]">
                  <span>Discount</span>
                  <span>{formatTzs(0)}</span>
                </div>
                <div className="my-1 h-px bg-[#dfe1e6]" />
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-[16px] font-semibold text-[#1f2430]">Patient Payable</span>
                  <span className="font-headline-md text-[20px] font-semibold text-[#0052cc] underline decoration-[#0052cc]/30 underline-offset-4">
                    {patientPayableLabel}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#dfe1e6] bg-[#f4f5f7]">
                      <th className="px-5 py-3 font-label-md text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                        Service Description
                      </th>
                      <th className="px-5 py-3 font-label-md text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                        Department
                      </th>
                      <th className="px-5 py-3 text-right font-label-md text-[12px] font-semibold uppercase tracking-[0.06em] text-[#51617e]">
                        Amount (TZS)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatItems.map((item) => (
                      <tr key={item.id} className="border-b border-[#dfe1e6] transition-colors hover:bg-[#deebff]/30">
                        <td className="px-5 py-3.5 font-body-sm text-[13px] text-[#1f2430]">{item.label}</td>
                        <td className="px-5 py-3.5 font-body-sm text-[13px] text-[#51617e]">{item.department}</td>
                        <td className="px-5 py-3.5 text-right font-body-sm text-[13px] text-[#1f2430]">
                          {formatTzs(item.qty * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f8f9fb]">
                      <td colSpan={2} className="px-5 py-4 text-right font-headline-sm text-[16px] text-[#1f2430]">
                        Total Due
                      </td>
                      <td className="px-5 py-4 text-right font-headline-sm text-[16px] font-semibold text-[#0052cc]">
                        {patientPayableLabel}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-3 bg-[#f8f9fb] px-5 py-4">
                <div className="flex items-center justify-between font-body-sm text-[13px] text-[#51617e]">
                  <span>Gross Total</span>
                  <span>{formatTzs(grossTotal)}</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-[13px] text-[#36b37e]">
                  <span>Insurance Deduction ({bill.insurer || 'NHIF'})</span>
                  <span>{formatTzs(Math.max(0, grossTotal - outstandingAmount))}</span>
                </div>
                <div className="flex items-center justify-between font-body-sm text-[13px] text-[#51617e]">
                  <span>Discount</span>
                  <span>{formatTzs(0)}</span>
                </div>
                <div className="my-1 h-px bg-[#dfe1e6]" />
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-[16px] font-semibold text-[#1f2430]">Patient Payable</span>
                  <span className="font-headline-md text-[20px] font-semibold text-[#0052cc]">{patientPayableLabel}</span>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="lg:col-span-5">
          <form
            id="payment-form"
            onSubmit={handleIssueReceipt}
            className="rounded-[12px] border border-[#dfe1e6] bg-white shadow-[0px_4px_12px_rgba(9,30,66,0.05)]"
          >
            <div className="border-b border-[#dfe1e6] px-5 py-4">
              <h2 className="m-0 font-headline-sm text-[16px] font-semibold text-[#1f2430]">Collect Payment</h2>
            </div>

            <div className="flex flex-col gap-4 px-5 py-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[12px] font-semibold text-[#51617e]">Amount to Collect</label>
                <div className="flex items-center justify-between rounded-[4px] border border-[#dfe1e6] bg-[#f4f5f7] px-4 py-3 font-body-lg text-[14px] font-semibold text-[#1f2430]">
                  <span>{patientPayableLabel}</span>
                  <span className="material-symbols-outlined text-[18px] text-[#737685]">lock</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="payment-method-select" className="font-label-md text-[12px] font-semibold text-[#51617e]">
                  Payment Method
                </label>
                <div className="relative">
                  <select
                    id="payment-method-select"
                    value={paymentView}
                    onChange={(e) => setPaymentView(e.target.value as PaymentView)}
                    className="w-full appearance-none rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 pr-10 font-body-sm text-[13px] text-[#1f2430] outline-none transition-colors focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                  >
                    {paymentViewConfig.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-[#737685]">
                    expand_more
                  </span>
                </div>
              </div>

              {paymentView === 'cash' && (
                <div className="flex flex-col gap-4 rounded-[4px] border border-[#dfe1e6] border-l-[4px] border-l-[#36b37e] bg-[#f4f5f7] p-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-[12px] font-semibold text-[#51617e]">Amount Tendered</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-body-sm text-[13px] text-[#51617e]">
                        TZS
                      </span>
                      <input
                        type="number"
                        placeholder="Enter cash received"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="w-full rounded-[4px] border border-[#dfe1e6] bg-white py-3 pl-12 pr-4 font-body-sm text-[13px] text-[#1f2430] outline-none transition-colors focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-[4px] border border-[#36b37e]/20 bg-white px-3 py-2.5">
                    <span className="font-label-md text-[12px] font-semibold text-[#51617e]">Change Due:</span>
                    <span className="font-headline-sm text-[16px] font-semibold text-[#36b37e]">{formatTzs(changeAmount)}</span>
                  </div>

                  <div className="pt-2">
                    <label className="mb-1 block font-label-md text-[12px] font-semibold text-[#51617e]">
                      Internal Notes (Optional)
                    </label>
                    <textarea
                      placeholder="Add transaction reference..."
                      rows={2}
                      className="w-full rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 font-body-sm text-[13px] text-[#1f2430] outline-none transition-colors focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                    />
                  </div>
                </div>
              )}

              {paymentView === 'mobile_money' && (
                <div className="flex flex-col gap-3 rounded-[4px] border border-[#b7c7e8] bg-[#dae2ff]/30 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#0052cc]">phone_iphone</span>
                    <span className="font-label-md text-[12px] font-bold uppercase tracking-[0.06em] text-[#0052cc]">
                      M-Pesa Details
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label-sm text-[11px] text-[#51617e]">Payer Phone Number</label>
                    <input
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      placeholder="e.g., 255700000000"
                      className="w-full rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 font-body-sm text-[13px] text-[#1f2430] outline-none transition-colors focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label-sm text-[11px] text-[#51617e]">Reference #</label>
                    <input
                      value={mobileRef}
                      onChange={(e) => setMobileRef(e.target.value)}
                      placeholder="Bill ID or Name"
                      className="w-full rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 font-body-sm text-[13px] text-[#1f2430] outline-none transition-colors focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-label-sm text-[11px] text-[#51617e]">Transaction ID (Required)</label>
                    <input
                      value={mobileTxnId}
                      onChange={(e) => setMobileTxnId(e.target.value)}
                      placeholder="e.g., QWE123RTY"
                      className="w-full rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 font-body-sm text-[13px] uppercase text-[#1f2430] outline-none transition-colors focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-2 pt-1">
                    <input
                      checked={smsReceipt}
                      onChange={(e) => setSmsReceipt(e.target.checked)}
                      type="checkbox"
                      className="mt-1 rounded-sm border-[#737685] text-[#0052cc] focus:ring-[#0052cc]"
                    />
                    <span className="font-body-sm text-[13px] text-[#51617e]">
                      Send SMS receipt to patient&apos;s registered phone number.
                    </span>
                  </label>
                </div>
              )}

              {paymentView === 'insurance' && (
                <div className="flex flex-col gap-3 rounded-[4px] border border-[#dfe1e6] bg-[#f4f5f7] p-4 text-[13px]">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-label-md text-[12px] font-semibold text-[#51617e]">Insurer</label>
                      <input
                        value={insurerName}
                        onChange={(e) => setInsurerName(e.target.value)}
                        className="w-full cursor-not-allowed rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 font-body-sm text-[13px] text-[#1f2430] outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-label-md text-[12px] font-semibold text-[#51617e]">
                        Coverage Amount (TZS)
                      </label>
                      <input
                        readOnly
                        value={coverageAmount}
                        className="w-full cursor-not-allowed rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 font-body-sm text-[13px] font-semibold text-[#36b37e] outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-label-md text-[12px] font-semibold text-[#51617e]">
                        Claim # <span className="text-[#ff5630]">*</span>
                      </label>
                      <input
                        value={claimNumber}
                        onChange={(e) => setClaimNumber(e.target.value)}
                        placeholder="Enter Claim Number"
                        className="w-full rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 font-body-sm text-[13px] text-[#1f2430] outline-none transition-colors focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-label-md text-[12px] font-semibold text-[#51617e]">
                        Pre-auth # <span className="font-normal text-[#737685]">(Optional)</span>
                      </label>
                      <input
                        value={preAuthNumber}
                        onChange={(e) => setPreAuthNumber(e.target.value)}
                        placeholder="Enter Pre-auth Number"
                        className="w-full rounded-[4px] border border-[#dfe1e6] bg-white px-4 py-3 font-body-sm text-[13px] text-[#1f2430] outline-none transition-colors focus:border-[#0052cc] focus:ring-1 focus:ring-[#0052cc]"
                      />
                    </div>
                  </div>

                  <div className="mt-1 flex items-start gap-3 rounded-[4px] border border-[#dfe1e6] bg-[#f8f9fb] p-4">
                    <span className="material-symbols-outlined text-[18px] text-[#ffab00]">info</span>
                    <p className="m-0 font-body-sm text-[13px] leading-[20px] text-[#51617e]">
                      Patient has a remaining balance of <strong>{patientPayableLabel}</strong>. You will need to collect this
                      remaining amount via another payment method before closing the bill.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dfe1e6] bg-white px-5 py-4 shadow-[0px_-4px_12px_rgba(9,30,66,0.05)] md:left-[240px]">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => toast.info('Split Payment flow coming soon')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] border border-[#dfe1e6] bg-white px-5 font-label-md text-[12px] font-semibold text-[#51617e] transition-colors hover:bg-[#f4f5f7]"
          >
            <span className="material-symbols-outlined text-[18px]">call_split</span>
            Split Payment
          </button>
          <button
            type="button"
            onClick={() => handleIssueReceipt()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[4px] border-0 bg-[#0052cc] px-5 font-label-md text-[12px] font-semibold text-white transition-colors hover:bg-[#0040a2]"
          >
            <span className="material-symbols-outlined text-[18px]">receipt</span>
            Issue Receipt
          </button>
        </div>
      </div>

      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[12px] border border-[#dfe1e6] bg-white p-6 text-[13px] text-[#1f2430] shadow-xl">
            <div className="space-y-1 text-center">
              <h2 className="m-0 text-[14px] font-bold uppercase tracking-[0.08em]">Hospital System Registry</h2>
              <p className="m-0 text-[#51617e]">PO Box 100, Dar es Salaam</p>
              <h3 className="my-2 border-y border-dashed border-[#dfe1e6] py-2 text-[14px] font-bold">
                OFFICIAL PAYMENT RECEIPT
              </h3>
            </div>

            <div className="space-y-1.5">
              <p className="m-0 flex justify-between">
                <span className="text-[#51617e]">Receipt No:</span>
                <span className="font-mono font-semibold">{receiptNo}</span>
              </p>
              <p className="m-0 flex justify-between">
                <span className="text-[#51617e]">Date:</span>
                <span>{new Date().toLocaleString()}</span>
              </p>
              <p className="m-0 flex justify-between">
                <span className="text-[#51617e]">Patient:</span>
                <span className="font-semibold">{bill.patientName}</span>
              </p>
              <p className="m-0 flex justify-between">
                <span className="text-[#51617e]">File No:</span>
                <span className="font-mono">{bill.patientNo}</span>
              </p>
              <p className="m-0 flex justify-between">
                <span className="text-[#51617e]">Method:</span>
                <span>{paymentViewConfig.label}</span>
              </p>
              {paymentView === 'mobile_money' && (
                <p className="m-0 flex justify-between">
                  <span className="text-[#51617e]">Ref ID:</span>
                  <span className="font-mono">{mobileRef}</span>
                </p>
              )}
              {paymentView === 'insurance' && (
                <p className="m-0 flex justify-between">
                  <span className="text-[#51617e]">Claim #:</span>
                  <span className="font-mono">{claimNumber}</span>
                </p>
              )}
            </div>

            <div className="mt-3 space-y-1 border-t border-dashed border-[#dfe1e6] pt-3">
              <p className="m-0 flex justify-between text-[14px] font-bold">
                <span>Amount Paid:</span>
                <span className="font-mono">{formatTzs(outstandingAmount)}</span>
              </p>
              {paymentView === 'cash' && (
                <>
                  <p className="m-0 flex justify-between">
                    <span className="text-[#51617e]">Cash Tendered:</span>
                    <span className="font-mono">{formatTzs(Number.parseFloat(cashTendered) || 0)}</span>
                  </p>
                  <p className="m-0 flex justify-between">
                    <span className="text-[#51617e]">Change Returned:</span>
                    <span className="font-mono">{formatTzs(changeAmount)}</span>
                  </p>
                </>
              )}
            </div>

            <div className="border-t border-[#dfe1e6] pt-4 text-center">
              <p className="m-0 mb-3 italic text-[#51617e]">Thank you for your cooperation.</p>
              <button
                type="button"
                onClick={handleDoneReceipt}
                className="inline-flex h-10 items-center justify-center rounded-[4px] border-0 bg-[#0052cc] px-5 font-label-md text-[12px] font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
