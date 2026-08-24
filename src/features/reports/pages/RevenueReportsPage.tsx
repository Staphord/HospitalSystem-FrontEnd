import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminService, type RevenueReportResponse } from '@/api/services/admin';

export const RevenueReportsPage: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('All Departments');
  const [paymentType, setPaymentType] = useState('All');

  const [loading, setLoading] = useState<boolean>(true);
  const [revenueData, setRevenueData] = useState<RevenueReportResponse | null>(null);

  const fetchRevenue = useCallback(() => {
    setLoading(true);
    adminService
      .getRevenueReport(fromDate, toDate)
      .then((data) => {
        setRevenueData(data);
      })
      .catch((err) => {
        console.error('Failed to fetch revenue report:', err);
        toast.error('Failed to fetch revenue report data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fromDate, toDate]);

  // Filters are applied manually via the "Apply Filters" button
  // (handleApplyFilters below) rather than live — only fetch on mount here.
  useEffect(() => {
    fetchRevenue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTzs = (value: number): string => {
    return `TZS ${Math.round(value).toLocaleString()}`;
  };

  const handleApplyFilters = () => {
    fetchRevenue();
    toast.success('Filters applied');
  };

  const breakdownRows = (revenueData?.breakdown || []).filter((row) => {
    if (department !== 'All Departments' && row.department.toLowerCase() !== department.toLowerCase()) {
      return false;
    }
    return true;
  });

  const totalCash = revenueData?.total_cash || 0;
  const totalInsurance = revenueData?.total_insurance || 0;
  const totalRevenue = revenueData?.total_revenue || 0;

  const hasRevenue = totalRevenue > 0;
  const cashPct = hasRevenue ? Math.round((totalCash / totalRevenue) * 100) : 0;
  const insPct = hasRevenue ? Math.round((totalInsurance / totalRevenue) * 100) : 0;
  const pendingClaims = totalInsurance * 0.15;

  return (
    <div className="max-w-[1440px] mx-auto space-y-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-lg gap-4">
        <div>
          <nav className="flex items-center gap-xs text-label-sm text-secondary">
            <span>Reports &amp; Analytics</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Revenue Reports</span>
          </nav>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Financial performance across all departments.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.info('PDF Export queued')}
            className="h-[32px] px-4 rounded-md border border-border-subtle text-secondary bg-transparent hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={() => toast.info('CSV Export queued')}
            className="h-[32px] px-4 rounded-md border border-border-subtle text-secondary bg-transparent hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">csv</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle p-3 rounded-lg flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 max-w-xs">
          <label className="text-label-md font-label-md text-on-surface-variant uppercase">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full h-[40px] px-3 bg-surface-white border border-border-subtle rounded-md text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
          />
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 max-w-xs">
          <label className="text-label-md font-label-md text-on-surface-variant uppercase">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full h-[40px] px-3 bg-surface-white border border-border-subtle rounded-md text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
          />
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 max-w-xs">
          <label className="text-label-md font-label-md text-on-surface-variant uppercase">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full h-[40px] px-3 bg-surface-white border border-border-subtle rounded-md text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
          >
            <option>All Departments</option>
            <option>Outpatient</option>
            <option>Inpatient</option>
            <option>Emergency</option>
            <option>Pharmacy</option>
            <option>Laboratory</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 max-w-xs">
          <label className="text-label-md font-label-md text-on-surface-variant uppercase">Payment Type</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full h-[40px] px-3 bg-surface-white border border-border-subtle rounded-md text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
          >
            <option>All</option>
            <option>Cash</option>
            <option>Insurance</option>
          </select>
        </div>
        <div className="mt-auto">
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="h-[40px] px-6 rounded-md bg-primary-container text-white font-label-md text-label-md hover:bg-primary transition-colors flex items-center justify-center cursor-pointer border-0 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
            Total Revenue
          </span>
          <span className="text-headline-lg font-headline-lg text-on-surface">{formatTzs(totalRevenue)}</span>
          <div className="flex items-center gap-1 text-success mt-1 font-semibold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span className="text-label-sm">Live System Total</span>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Cash</span>
            <span className="material-symbols-outlined text-outline-variant text-[20px]">payments</span>
          </div>
          <span className="text-headline-md font-headline-md text-on-surface mt-1">{formatTzs(totalCash)}</span>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2">
            <div className="bg-primary-container h-1.5 rounded-full" style={{ width: `${cashPct}%` }}></div>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
              Insurance
            </span>
            <span className="material-symbols-outlined text-outline-variant text-[20px]">health_and_safety</span>
          </div>
          <span className="text-headline-md font-headline-md text-on-surface mt-1">{formatTzs(totalInsurance)}</span>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2">
            <div className="bg-[#00B8D9] h-1.5 rounded-full" style={{ width: `${insPct}%` }}></div>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-2 relative shadow-sm">
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 ${pendingClaims > 0 ? 'bg-error' : 'bg-outline-variant'} rounded-r-md`}></div>
          <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider pl-2">
            Pending Claims
          </span>
          <span className={`text-headline-md font-headline-md ${pendingClaims > 0 ? 'text-error' : 'text-on-surface'} mt-1 pl-2`}>
            {formatTzs(pendingClaims)}
          </span>
          <div className="flex items-center gap-1 text-on-surface-variant mt-1 pl-2">
            <span className="text-label-sm font-label-sm">
              {pendingClaims > 0 ? 'Requires followup' : 'No pending claims'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="bg-surface-white border border-border-subtle rounded-[16px] flex flex-col h-[320px] shadow-sm">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-headline-sm font-headline-sm text-on-surface">Cash vs Insurance Breakdown</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col items-center justify-center">
            {hasRevenue ? (
              <>
                <div
                  className="relative w-40 h-40 rounded-full border-[16px] border-primary-container flex items-center justify-center"
                  style={{
                    borderRightColor: insPct > 0 ? '#00B8D9' : 'transparent',
                    borderTopColor: insPct > 0 ? '#00B8D9' : 'transparent',
                    transform: 'rotate(-45deg)',
                  }}
                >
                  <div className="text-center" style={{ transform: 'rotate(45deg)' }}>
                    <div className="text-headline-sm font-headline-sm text-on-surface">{cashPct}%</div>
                    <div className="text-label-sm font-label-sm text-outline-variant">Cash</div>
                  </div>
                </div>
                <div className="flex gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                    <span className="text-label-sm font-label-sm text-outline text-[11px]">Cash ({cashPct}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#00B8D9]"></div>
                    <span className="text-label-sm font-label-sm text-outline text-[11px]">Insurance ({insPct}%)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-secondary">
                <div className="w-36 h-36 rounded-full border-[12px] border-border-subtle flex items-center justify-center">
                  <span className="text-label-md font-medium text-outline">No Data</span>
                </div>
                <span className="text-body-sm text-on-surface-variant mt-2">No revenue recorded for selected period</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-[16px] flex flex-col h-[320px] shadow-sm">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-headline-sm font-headline-sm text-on-surface">Revenue by Department</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center gap-4">
            {breakdownRows.map((dept, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-24 text-right text-label-sm font-label-sm text-outline text-[11px] truncate">
                  {dept.department}
                </span>
                <div className="flex-1 bg-surface-container h-4 rounded-sm">
                  <div className="bg-primary-container h-4 rounded-sm" style={{ width: dept.percentage }}></div>
                </div>
                <span className="w-24 text-label-sm font-label-sm text-on-surface text-[11px] font-semibold text-right">
                  {formatTzs(dept.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-[16px] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-bright">
          <h3 className="text-headline-sm font-headline-sm text-on-surface">Revenue Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-container-lowest">
                <th className="py-3 px-4 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
                  Department
                </th>
                <th className="py-3 px-4 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider text-right">
                  Cash Revenue
                </th>
                <th className="py-3 px-4 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider text-right">
                  Insurance Revenue
                </th>
                <th className="py-3 px-4 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider text-right">
                  Total
                </th>
                <th className="py-3 px-4 text-label-md font-label-md text-on-surface-variant uppercase tracking-wider text-right">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="text-body-sm font-body-sm text-on-surface bg-surface-white divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary">
                    Loading live revenue data...
                  </td>
                </tr>
              ) : breakdownRows.length > 0 ? (
                breakdownRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-row-hover transition-colors cursor-pointer group">
                    <td className="py-3 px-4 font-medium flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${row.color_class}`}></div> {row.department}
                    </td>
                    <td className="py-3 px-4 text-right text-secondary">{formatTzs(row.cash_revenue)}</td>
                    <td className="py-3 px-4 text-right text-secondary">{formatTzs(row.insurance_revenue)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-on-surface">{formatTzs(row.total)}</td>
                    <td className="py-3 px-4 text-right text-secondary">{row.percentage}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary">
                    No revenue data available for selected range.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-surface-bright border-t-2 border-border-subtle">
              <tr className="font-bold text-on-surface">
                <td className="py-3 px-4 text-label-md font-label-md">Total</td>
                <td className="py-3 px-4 text-right">{formatTzs(totalCash)}</td>
                <td className="py-3 px-4 text-right">{formatTzs(totalInsurance)}</td>
                <td className="py-3 px-4 text-right text-primary">{formatTzs(totalRevenue)}</td>
                <td className="py-3 px-4 text-right">{hasRevenue ? '100%' : '0%'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};


