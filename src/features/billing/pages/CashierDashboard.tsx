import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTzs } from '../data/mockPayments'

interface PendingBill {
  id: string
  patientName: string
  patientNo: string
  amount: number
  status: string
}

interface RecentTransaction {
  id: string
  patientName: string
  amount: number
  method: 'Cash' | 'Mobile Money' | 'Insurance'
  timestamp: string
}

export function CashierDashboard() {
  const [statsData] = useState(() => {
    return JSON.parse(localStorage.getItem('hf_mock_cashier_stats') || '{}')
  })

  const todayRevenue = statsData.todayRevenue || 1240000
  const transactionCount = statsData.transactionCount || 28
  const pendingBillsCount = statsData.pendingBillsCount || 5
  const insurancePendingCount = statsData.insurancePendingCount || 3
  const insurancePendingValue = statsData.insurancePendingValue || 185000

  const [pendingBills] = useState<PendingBill[]>(() => {
    const allPayments = JSON.parse(localStorage.getItem('hf_mock_payment_rows') || '[]')
    const pending = allPayments.filter((p: any) => p.status !== 'Paid')
    
    const defaultPending: PendingBill[] = [
      { id: 'INV-2023-0891', patientName: 'Juma Kassim', patientNo: 'PT-4889', amount: 45000, status: 'Pending' },
      { id: 'INV-2023-0892', patientName: 'Aisha Omary', patientNo: 'PT-4890', amount: 120000, status: 'Pending' },
      { id: 'INV-2023-0893', patientName: 'Musa John', patientNo: 'PT-4891', amount: 1500, status: 'Pending' },
      { id: 'INV-2023-0894', patientName: 'Fatuma Said', patientNo: 'PT-4892', amount: 85000, status: 'Pending' }
    ]

    return pending.length > 0 
      ? pending.slice(0, 4).map((p: any) => ({
          id: p.id,
          patientName: p.patientName,
          patientNo: p.patientNumber || p.patientNo || 'PT-4889',
          amount: p.totalBill - p.paid,
          status: p.status
        }))
      : defaultPending
  })

  const [transactions] = useState<RecentTransaction[]>(() => {
    const list = JSON.parse(localStorage.getItem('hf_mock_daily_transactions') || '[]')
    
    const defaultTx: RecentTransaction[] = [
      { id: 'tx1', patientName: 'Mariam Ali', amount: 25000, method: 'Cash', timestamp: '10:42 AM' },
      { id: 'tx2', patientName: 'NHIF Claim #892', amount: 150000, method: 'Insurance', timestamp: '10:15 AM' },
      { id: 'tx3', patientName: 'Peter Simon', amount: 60000, method: 'Mobile Money', timestamp: '09:58 AM' },
      { id: 'tx4', patientName: 'Grace Kimaro', amount: 8500, method: 'Cash', timestamp: '09:12 AM' }
    ]

    return list.length > 0
      ? list.slice(0, 4).map((t: any) => ({
          id: t.id,
          patientName: t.patientName,
          amount: t.amount,
          method: t.method,
          timestamp: t.time || t.timestamp
        }))
      : defaultTx
  })

  const [revenueBreakdown] = useState(() => {
    const breakdown = statsData.revenueBreakdown || [
      { method: 'Cash', amount: 340000, percentage: 27 },
      { method: 'Insurance', amount: 550000, percentage: 44 },
      { method: 'Mobile Money', amount: 350000, percentage: 29 }
    ]
    return breakdown.map((item: any) => {
      let bg = 'bg-[#0052cc]'
      if (item.method === 'Mobile Money') bg = 'bg-[#00b8d9]'
      if (item.method === 'Insurance') bg = 'bg-[#004b59]'
      return { ...item, bg }
    })
  })

  const formatRevenueK = (val: number) => {
    return `TZS ${Math.round(val / 1000).toLocaleString()}k`
  }

  return (
    <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-lg">
      {/* Hidden container for accessibility metadata */}
      <div className="sr-only" aria-hidden="true">
        <span>Cashier Portal</span>
        <span>My Dashboard</span>
      </div>

      {/* Main dashboard columns layout */}
      <div className="lg:col-span-8 flex flex-col gap-lg">
        {/* Render key performance indicator cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          <div className="bg-white border border-solid border-[#dfe1e6] rounded-xl p-md flex flex-col gap-xs">
            <span className="font-label-md text-label-md text-[#42526e] uppercase">
              Revenue Today
            </span>
            <span className="font-headline-md text-headline-md font-bold text-[#1a1b21]">
              {formatRevenueK(todayRevenue)}
            </span>
          </div>

          <div className="bg-white border border-solid border-[#dfe1e6] rounded-xl p-md flex flex-col gap-xs">
            <span className="font-label-md text-label-md text-[#42526e] uppercase">
              Transactions
            </span>
            <span className="font-headline-md text-headline-md font-bold text-[#1a1b21]">
              {transactionCount}
            </span>
          </div>

          <div className="bg-[#ffab00]/5 border border-solid border-[#ffab00]/30 rounded-xl p-md flex flex-col gap-xs relative overflow-hidden">
            {/* Soft background watermark positioned on the right */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none flex items-center">
              <span className="material-symbols-outlined text-[64px] text-[#ffab00]" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
            </div>
            
            <span className="font-label-md text-label-md text-[#ffab00] uppercase relative z-10 flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px] text-[#ffab00]">pending_actions</span>
              Pending Bills
            </span>
            <span className="font-headline-md text-headline-md font-bold text-[#ffab00] relative z-10">
              {pendingBillsCount}
            </span>
          </div>

          <div className="bg-white border border-solid border-[#dfe1e6] rounded-xl p-md flex flex-col gap-xs">
            <span className="font-label-md text-label-md text-[#42526e] uppercase">
              Insurance Claims
            </span>
            <span className="font-headline-md text-headline-md font-bold text-[#1a1b21]">
              {insurancePendingCount}
            </span>
          </div>
        </div>

        {/* Display queue list for bills awaiting payment */}
        <div className="bg-white border border-solid border-[#dfe1e6] rounded-xl overflow-hidden flex flex-col">
          <div className="px-lg py-md border-b border-solid border-[#dfe1e6] flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-[#1a1b21] font-semibold m-0">
              Bills Awaiting Payment
            </h3>
            <Link
              to="/billing/bills"
              className="font-label-sm text-label-sm text-[#0052cc] hover:text-[#003d9b] font-semibold transition-colors no-underline hover:no-underline"
            >
              View All Bills →
            </Link>
          </div>
          <div className="flex flex-col">
            {pendingBills.length === 0 ? (
              <div className="p-lg text-center text-[#434652] text-sm">
                No bills awaiting payment.
              </div>
            ) : (
              pendingBills.map((b) => (
                <div
                  key={b.id}
                  className="px-lg py-sm border-b border-solid border-[#dfe1e6] last:border-b-0 flex items-center justify-between hover:bg-[#dae2ff]/30 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-body-md text-body-md text-[#1a1b21] font-medium">
                      {b.patientName}
                    </span>
                    <span className="font-label-sm text-label-sm text-[#42526e]">
                      {b.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-md">
                    <span className="font-body-md text-body-md font-semibold text-[#1a1b21]">
                      {formatTzs(b.amount)}
                    </span>
                    <span className="px-2 py-1 rounded bg-[#ffab00]/20 text-[#ffab00] font-label-sm text-label-sm uppercase">
                      Pending
                    </span>
                    <Link
                      to={`/billing/payment/${b.id}`}
                      className="bg-[#0052cc] text-white h-8 px-3 rounded font-label-md text-label-md hover:bg-[#003d9b] hover:text-white hover:no-underline transition-colors flex items-center gap-xs no-underline"
                    >
                      Process
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Display list of recent completed transactions */}
        <div className="bg-white border border-solid border-[#dfe1e6] rounded-xl overflow-hidden flex flex-col">
          <div className="px-lg py-md border-b border-solid border-[#dfe1e6]">
            <h3 className="font-headline-sm text-headline-sm text-[#1a1b21] font-semibold m-0">
              Recent Transactions
            </h3>
          </div>
          <div className="flex flex-col">
            {transactions.length === 0 ? (
              <div className="p-lg text-center text-[#434652] text-sm">
                No completed transactions today.
              </div>
            ) : (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="px-lg py-sm border-b border-solid border-[#dfe1e6] last:border-b-0 flex items-center justify-between hover:bg-[#dae2ff]/30 transition-colors"
                >
                  <div className="flex items-center gap-md w-1/3">
                    <div className="w-8 h-8 rounded-full bg-[#36b37e]/20 text-[#36b37e] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                    <span className="font-body-md text-body-md text-[#1a1b21] truncate">
                      {t.patientName}
                    </span>
                  </div>
                  <div className="w-1/4 text-right">
                    <span className="font-body-md text-body-md font-semibold text-[#1a1b21]">
                      {formatTzs(t.amount)}
                    </span>
                  </div>
                  <div className="w-1/4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full border border-solid text-[10px] font-bold uppercase ${
                        t.method === 'Cash'
                          ? 'border-[#dfe1e6] bg-[#f4f5f7] text-[#42526e]'
                          : t.method === 'Insurance'
                          ? 'border-[#dae2ff] bg-[#dae2ff]/30 text-[#0052cc]'
                          : 'border-[#00b8d9]/30 bg-[#00b8d9]/10 text-[#00b8d9]'
                      }`}
                    >
                      {t.method.toUpperCase()}
                    </span>
                  </div>
                  <div className="w-1/6 text-right">
                    <span className="font-body-sm text-label-sm text-[#42526e]">
                      {t.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right panel layout container */}
      <div className="lg:col-span-4 flex flex-col gap-lg">
        {/* Render today's revenue breakdown panel */}
        <div className="bg-white border border-solid border-[#dfe1e6] rounded-xl p-lg flex flex-col gap-md">
          <div className="flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-[#1a1b21] font-semibold m-0">
              Today's Revenue
            </h3>
            <span className="text-[10px] text-[#42526e] font-bold uppercase tracking-wider">
              Revenue Breakdown
            </span>
          </div>
          <div className="flex items-baseline gap-xs">
            <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-[#36b37e]">
              {formatTzs(todayRevenue)}
            </span>
          </div>
          <div className="flex flex-col gap-sm mt-sm">
            {revenueBreakdown.map((item) => (
              <div key={item.method} className="flex flex-col gap-xs mt-xs">
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-[#42526e] uppercase">
                    {item.method}
                  </span>
                  <span className="font-body-sm text-body-sm font-semibold text-[#1a1b21]">
                    {formatTzs(item.amount)}
                  </span>
                </div>
                <div className="w-full bg-[#e8e7f0] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.bg} rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Render pending insurance claims card panel */}
        <div className="bg-white border border-solid border-[#dfe1e6] rounded-xl p-lg flex flex-col gap-md">
          <h3 className="font-headline-sm text-headline-sm text-[#1a1b21] font-semibold m-0">
            Pending Insurance Claims
          </h3>
          
          {/* Display metrics and aligned shield badge in a row */}
          <div className="flex items-center justify-between mt-sm">
            <div className="flex items-center gap-md">
              <span className="text-4xl font-semibold text-[#0052cc] leading-none">
                {insurancePendingCount}
              </span>
              <div className="flex flex-col">
                <span className="font-label-sm text-[10px] text-[#42526e] uppercase tracking-wider">
                  Estimated Value
                </span>
                <span className="font-body-md text-body-md font-semibold text-[#1a1b21]">
                  {formatTzs(insurancePendingValue)}
                </span>
              </div>
            </div>
            
            {/* Aligned decorative medical shield badge */}
            <div className="w-14 h-14 rounded-full bg-[#dae2ff]/60 flex items-center justify-center text-[#0052cc] shrink-0">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                health_and_safety
              </span>
            </div>
          </div>

          <Link
            to="/billing/bills"
            className="mt-sm w-full h-[40px] border border-solid border-[#dfe1e6] hover:border-[#0052cc]/30 rounded-lg text-[#42526e] hover:text-[#0052cc] font-semibold transition-colors flex items-center justify-center gap-xs bg-white no-underline hover:no-underline text-xs"
          >
            Review Claims
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
