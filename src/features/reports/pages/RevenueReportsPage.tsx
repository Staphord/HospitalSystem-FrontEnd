import React, { useState } from 'react';

interface RevenueBreakdownRow {
  department: string;
  cashRevenue: number;
  insuranceRevenue: number;
  total: number;
  percentage: string;
  colorClass: string;
}

export const RevenueReportsPage: React.FC = () => {
  const [department, setDepartment] = useState('All Departments');
  const [paymentType, setPaymentType] = useState('All');

  const breakdownData: RevenueBreakdownRow[] = [
    {
      department: 'Outpatient',
      cashRevenue: 12500000,
      insuranceRevenue: 6000000,
      total: 18500000,
      percentage: '38.4%',
      colorClass: 'bg-primary-container',
    },
    {
      department: 'Pharmacy',
      cashRevenue: 9000000,
      insuranceRevenue: 3200000,
      total: 12200000,
      percentage: '25.3%',
      colorClass: 'bg-[#00B8D9]',
    },
    {
      department: 'Inpatient',
      cashRevenue: 4400000,
      insuranceRevenue: 5000000,
      total: 9400000,
      percentage: '19.5%',
      colorClass: 'bg-success',
    },
    {
      department: 'Emergency',
      cashRevenue: 3600000,
      insuranceRevenue: 1500000,
      total: 5100000,
      percentage: '10.6%',
      colorClass: 'bg-warning',
    },
    {
      department: 'Laboratory',
      cashRevenue: 2000000,
      insuranceRevenue: 1000000,
      total: 3000000,
      percentage: '6.2%',
      colorClass: 'bg-secondary',
    },
  ];

  const formatTzs = (value: number): string => {
    return `TZS ${value.toLocaleString()}`;
  };

  const handleApplyFilters = () => {
    // Client-side visual state trigger only
  };

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
          <button className="h-[32px] px-4 rounded-md border border-border-subtle text-secondary bg-transparent hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button className="h-[32px] px-4 rounded-md border border-border-subtle text-secondary bg-transparent hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">csv</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle p-3 rounded-lg flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 max-w-xs">
          <label className="text-label-md font-label-md text-on-surface-variant">Date Range</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">
              calendar_today
            </span>
            <input
              className="w-full h-[40px] pl-10 pr-4 bg-surface-white border border-border-subtle rounded-md text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-on-surface cursor-pointer"
              readOnly
              type="text"
              defaultValue="Oct 1, 2023 - Oct 31, 2023"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 max-w-xs">
          <label className="text-label-md font-label-md text-on-surface-variant">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full h-[40px] px-3 bg-surface-white border border-border-subtle rounded-md text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-on-surface"
          >
            <option>All Departments</option>
            <option>Outpatient</option>
            <option>Inpatient</option>
            <option>Emergency</option>
            <option>Pharmacy</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto flex-1 max-w-xs">
          <label className="text-label-md font-label-md text-on-surface-variant">Payment Type</label>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full h-[40px] px-3 bg-surface-white border border-border-subtle rounded-md text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-on-surface"
          >
            <option>All</option>
            <option>Cash</option>
            <option>Insurance</option>
          </select>
        </div>
        <div className="mt-auto">
          <button
            onClick={handleApplyFilters}
            className="h-[40px] px-6 rounded-md bg-primary-container text-white font-label-md text-label-md hover:bg-primary transition-colors flex items-center justify-center cursor-pointer border-0"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
            Total Revenue
          </span>
          <span className="text-headline-lg font-headline-lg text-on-surface">TZS 48,200,000</span>
          <div className="flex items-center gap-1 text-success mt-1 font-semibold">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            <span className="text-label-sm">+12% vs last month</span>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Cash</span>
            <span className="material-symbols-outlined text-outline-variant text-[20px]">payments</span>
          </div>
          <span className="text-headline-md font-headline-md text-on-surface mt-1">TZS 31,500,000</span>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2">
            <div className="bg-primary-container h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
              Insurance
            </span>
            <span className="material-symbols-outlined text-outline-variant text-[20px]">health_and_safety</span>
          </div>
          <span className="text-headline-md font-headline-md text-on-surface mt-1">TZS 16,700,000</span>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-2">
            <div className="bg-[#00B8D9] h-1.5 rounded-full" style={{ width: '35%' }}></div>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-2 relative shadow-sm">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-error rounded-r-md"></div>
          <span className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider pl-2">
            Outstanding
          </span>
          <span className="text-headline-md font-headline-md text-error mt-1 pl-2">TZS 3,200,000</span>
          <div className="flex items-center gap-1 text-on-surface-variant mt-1 pl-2">
            <span className="text-label-sm font-label-sm">Requires followup</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="bg-surface-white border border-border-subtle rounded-[16px] flex flex-col h-[320px] shadow-sm">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-headline-sm font-headline-sm text-on-surface">Revenue by Month</h3>
            <button className="text-outline-variant hover:text-on-surface transition-colors bg-transparent border-0 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-end relative">
            <div className="absolute left-4 top-4 bottom-8 flex flex-col justify-between text-label-sm font-label-sm text-outline text-[11px]">
              <span>50M</span>
              <span>40M</span>
              <span>30M</span>
              <span>20M</span>
              <span>10M</span>
              <span>0</span>
            </div>
            <div className="ml-10 h-full border-b border-border-subtle flex items-end justify-between px-2 gap-2 relative">
              <div className="w-full bg-primary-container rounded-t-sm transition-all hover:opacity-80" style={{ height: '40%' }}></div>
              <div className="w-full bg-primary-container rounded-t-sm transition-all hover:opacity-80" style={{ height: '55%' }}></div>
              <div className="w-full bg-primary-container rounded-t-sm transition-all hover:opacity-80" style={{ height: '45%' }}></div>
              <div className="w-full bg-primary-container rounded-t-sm transition-all hover:opacity-80" style={{ height: '70%' }}></div>
              <div className="w-full bg-primary-container rounded-t-sm transition-all hover:opacity-80" style={{ height: '85%' }}></div>
              <div className="w-full bg-primary-container rounded-t-sm transition-all hover:opacity-80" style={{ height: '96%' }}></div>
            </div>
            <div className="ml-10 mt-2 flex justify-between px-2 text-label-sm font-label-sm text-outline text-[11px]">
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span>Sep</span>
              <span>Oct</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-[16px] flex flex-col h-[320px] shadow-sm">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-headline-sm font-headline-sm text-on-surface">Cash vs Insurance</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col items-center justify-center">
            <div
              className="relative w-40 h-40 rounded-full border-[16px] border-primary-container flex items-center justify-center"
              style={{
                borderRightColor: '#00B8D9',
                borderTopColor: '#00B8D9',
                transform: 'rotate(-45deg)',
              }}
            >
              <div className="text-center" style={{ transform: 'rotate(45deg)' }}>
                <div className="text-headline-sm font-headline-sm text-on-surface">65%</div>
                <div className="text-label-sm font-label-sm text-outline-variant">Cash</div>
              </div>
            </div>
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-container"></div>
                <span className="text-label-sm font-label-sm text-outline text-[11px]">Cash (65%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00B8D9]"></div>
                <span className="text-label-sm font-label-sm text-outline text-[11px]">Insurance (35%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-[16px] flex flex-col h-[320px] shadow-sm">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-headline-sm font-headline-sm text-on-surface">Revenue by Department</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center gap-4">
            {[
              { name: 'Outpatient', val: '18.5M', pct: '80%' },
              { name: 'Pharmacy', val: '12.2M', pct: '60%' },
              { name: 'Inpatient', val: '9.4M', pct: '45%' },
              { name: 'Emergency', val: '5.1M', pct: '30%' },
              { name: 'Laboratory', val: '3.0M', pct: '15%' },
            ].map((dept, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-20 text-right text-label-sm font-label-sm text-outline text-[11px] truncate">
                  {dept.name}
                </span>
                <div className="flex-1 bg-surface-container h-4 rounded-sm">
                  <div className="bg-primary-container h-4 rounded-sm" style={{ width: dept.pct }}></div>
                </div>
                <span className="w-12 text-label-sm font-label-sm text-on-surface text-[11px] font-semibold">
                  {dept.val}
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
              {breakdownData.map((row, idx) => (
                <tr key={idx} className="hover:bg-row-hover transition-colors cursor-pointer group">
                  <td className="py-3 px-4 font-medium flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${row.colorClass}`}></div> {row.department}
                  </td>
                  <td className="py-3 px-4 text-right text-secondary">{formatTzs(row.cashRevenue)}</td>
                  <td className="py-3 px-4 text-right text-secondary">{formatTzs(row.insuranceRevenue)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-on-surface">{formatTzs(row.total)}</td>
                  <td className="py-3 px-4 text-right text-secondary">{row.percentage}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-bright border-t-2 border-border-subtle">
              <tr className="font-bold text-on-surface">
                <td className="py-3 px-4 text-label-md font-label-md">Total</td>
                <td className="py-3 px-4 text-right">{formatTzs(31500000)}</td>
                <td className="py-3 px-4 text-right">{formatTzs(16700000)}</td>
                <td className="py-3 px-4 text-right text-primary">{formatTzs(48200000)}</td>
                <td className="py-3 px-4 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
