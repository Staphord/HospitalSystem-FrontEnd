import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

interface ActiveVisitor {
  id: string
  name: string
  patientName: string
  bed: string
  relationship: string
  checkIn: string
  timeLeft: number // in seconds
  totalDuration: number // in seconds
}

export function ActiveVisitorsPage() {
  const [visitors, setVisitors] = useState<ActiveVisitor[]>(() =>
    JSON.parse(localStorage.getItem('hf_mock_active_visitors') || '[]')
  )

  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  // Countdown timer ticks down every second
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitors((prev) =>
        prev.map((v) => ({
          ...v,
          timeLeft: Math.max(0, v.timeLeft - 1),
        }))
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-refresh simulations every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      toast.info('Active visitor list refreshed from nurse ledger.')
    }, 30000)
    return () => clearInterval(refreshInterval)
  }, [])

  const handleCheckOutClick = (visitorId: string) => {
    setConfirmingId(visitorId)
  }

  const handleConfirmCheckOut = (visitorId: string, name: string) => {
    const updated = visitors.filter((v) => v.id !== visitorId)
    setVisitors(updated)
    localStorage.setItem('hf_mock_active_visitors', JSON.stringify(updated))

    const records = JSON.parse(localStorage.getItem('hf_mock_visitor_records') || '[]')
    const updatedRecords = records.map((r: any) => {
      if (r.visitorName === name && (r.status === 'Active' || r.status === 'Overstay')) {
        return {
          ...r,
          status: 'Departed',
          checkOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      }
      return r
    })
    localStorage.setItem('hf_mock_visitor_records', JSON.stringify(updatedRecords))

    setConfirmingId(null)
    toast.success(`Visitor ${name} checked out and departed the ward.`)
  }

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'OVERSTAY EXCEEDED'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')} left`
  }

  return (
    <div className="w-full text-on-surface">
      <style>{`
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
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dfe1e6;
          border-radius: 10px;
        }
        .custom-shadow { box-shadow: 0px 4px 12px rgba(9, 30, 66, 0.15); }
      `}</style>

      <section className="px-xl py-lg max-w-container-max mx-auto">
        {/* Header Actions */}
        <div className="flex justify-between items-end mb-lg">
          <div>
            <h3 className="font-headline-md text-headline-md font-semibold text-on-surface m-0">Active Visitors Log — General Ward</h3>
            <p className="text-slate-secondary text-body-sm m-0 mt-xs">Live monitoring of visitors currently inside the inpatient ward.</p>
          </div>
          <div className="flex items-center gap-sm">
            <Link
              to="/ward/dashboard"
              className="flex items-center justify-center px-md h-10 text-label-md font-label-md text-slate-secondary bg-surface-container-lowest border border-border-default hover:bg-neutral-bg rounded-lg shadow-sm transition-all cursor-pointer no-underline"
            >
              Dashboard
            </Link>
            <Link
              to="/ward/visitors"
              className="flex items-center justify-center px-md h-10 text-label-md font-label-md text-white bg-clinical-blue hover:opacity-90 rounded-lg shadow-sm transition-all cursor-pointer no-underline"
            >
              Visitor Logs
            </Link>
          </div>
        </div>

        {/* Summary Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-lg">
          <div className="bg-white p-lg rounded-lg border border-border-default shadow-sm">
            <p className="text-label-md text-slate-secondary uppercase m-0">Total Visitors in Ward</p>
            <div className="flex items-baseline mt-sm">
              <span className="text-[28px] font-bold text-on-surface">{visitors.length}</span>
            </div>
          </div>
          <div className="bg-white p-lg rounded-lg border border-border-default shadow-sm">
            <p className="text-label-md text-slate-secondary uppercase m-0">Within Time Limit</p>
            <div className="flex items-baseline mt-sm">
              <span className="text-[28px] font-bold text-success">
                {visitors.filter((v) => v.timeLeft > 0).length}
              </span>
            </div>
          </div>
          <div className="bg-white p-lg rounded-lg border border-border-default shadow-sm">
            <p className="text-label-md text-slate-secondary uppercase m-0">Overstay Alerts</p>
            <div className="flex items-baseline mt-sm">
              <span className="text-[28px] font-bold text-error">
                {visitors.filter((v) => v.timeLeft === 0).length}
              </span>
            </div>
          </div>
        </section>

        {/* Info Banner */}
        <div className="bg-[#DEEBFF] text-clinical-blue p-md rounded-lg mb-lg flex items-center gap-3 border border-[#DEEBFF] select-none">
          <span className="material-symbols-outlined text-[20px]">schedule</span>
          <p className="font-body-md font-medium m-0">Visiting hours today: <span className="font-bold">10:00 AM – 8:00 PM</span>. Outside these hours requires supervisor override.</p>
        </div>

        {/* Visitor Log Table Card */}
        <div className="bg-white rounded-xl border border-border-default shadow-sm overflow-hidden">
          {/* Table Header & Filters */}
          <div className="px-lg py-md border-b border-border-default flex justify-between items-center bg-surface-container-lowest">
            <h4 className="font-headline-sm text-headline-sm font-semibold m-0">Live Active Visitors</h4>
            <div className="flex gap-md select-none">
              <div className="flex items-center gap-2 px-3 py-1.5 border border-border-default rounded-lg bg-white">
                <span className="material-symbols-outlined text-[18px] text-outline">calendar_today</span>
                <span className="text-body-sm font-medium">Oct 24, 2023</span>
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-border-default">
                  <th className="px-md py-3 text-label-md text-slate-secondary uppercase">Visitor Name</th>
                  <th className="px-md py-3 text-label-md text-slate-secondary uppercase">Relationship</th>
                  <th className="px-md py-3 text-label-md text-slate-secondary uppercase">Patient Admitted</th>
                  <th className="px-md py-3 text-label-md text-slate-secondary uppercase">Bed Assigned</th>
                  <th className="px-md py-3 text-label-md text-slate-secondary uppercase">Check In Time</th>
                  <th className="px-md py-3 text-label-md text-slate-secondary uppercase">Time Remaining</th>
                  <th className="px-md py-3 text-label-md text-slate-secondary uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-body-sm font-body-sm divide-y divide-border-default">
                {visitors.length > 0 ? (
                  visitors.map((v) => {
                    const isOverstay = v.timeLeft === 0
                    const isNearOverstay = v.timeLeft > 0 && v.timeLeft <= 600 // 10 mins

                    let rowStyle = 'hover:bg-[#DEEBFF] transition-colors'
                    let badgeStyle = 'bg-[#E6F4EA] text-[#36B37E] px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider'

                    if (isOverstay) {
                      rowStyle = 'bg-[#FFFAE5] border-b border-[#FFEAB6] hover:bg-[#FFF4C2] transition-colors'
                      badgeStyle = 'bg-[#FFF1CC] text-[#FFAB00] px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider'
                    } else if (isNearOverstay) {
                      badgeStyle = 'bg-warning/10 text-warning px-2 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider'
                    }

                    return (
                      <tr key={v.id} className={rowStyle}>
                        <td className="px-md py-4 font-semibold text-on-surface">{v.name}</td>
                        <td className="px-md py-4 text-slate-secondary">{v.relationship}</td>
                        <td className="px-md py-4 font-semibold text-on-surface">{v.patientName}</td>
                        <td className="px-md py-4 text-slate-secondary">{v.bed}</td>
                        <td className="px-md py-4 text-slate-secondary">{v.checkIn}</td>
                        <td className="px-md py-4">
                          <span className={badgeStyle}>
                            {formatTimeRemaining(v.timeLeft)}
                          </span>
                        </td>
                        <td className="px-md py-4 text-right flex justify-end gap-2 items-center">
                          {confirmingId === v.id ? (
                            <div className="flex items-center justify-end gap-1.5 animate-fadeIn">
                              <span className="text-xs font-semibold text-error mr-2">Confirm?</span>
                              <button
                                onClick={() => handleConfirmCheckOut(v.id, v.name)}
                                className="px-md h-8 text-xs font-bold text-white bg-error hover:opacity-90 rounded border-0 cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmingId(null)}
                                className="px-md h-8 text-xs font-semibold text-slate-secondary bg-transparent border border-border-default hover:bg-neutral-bg rounded cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleCheckOutClick(v.id)}
                                className="text-clinical-blue hover:underline font-semibold px-2 py-1 border-0 bg-transparent cursor-pointer"
                              >
                                Check Out
                              </button>
                              <button className="p-1 hover:bg-white rounded transition-colors text-slate-secondary border-0 bg-transparent cursor-pointer flex items-center justify-center">
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-body-sm">
                      No active visitors in the ward.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination/Footer */}
          <div className="px-lg py-md border-t border-border-default flex justify-between items-center text-body-sm text-slate-secondary bg-surface-container-lowest select-none">
            <p className="m-0">Showing {visitors.length} of {visitors.length} visitors</p>
            <div className="flex gap-2">
              <button className="p-1.5 border border-border-default rounded-lg bg-transparent hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center" disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="p-1.5 border border-border-default rounded-lg bg-transparent hover:bg-surface-container transition-colors cursor-pointer flex items-center justify-center">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
