import React, { useState } from 'react';

interface ReportItem {
  id: string;
  name: string;
  category: string;
  status: 'Completed' | 'Processing';
  generatedBy: string;
  date: string;
}

export const PatientReportsPage: React.FC = () => {
  const [department, setDepartment] = useState('All Departments');
  const [reportType, setReportType] = useState('Census');

  const reports: ReportItem[] = [
    {
      id: '1',
      name: 'Monthly_Census_Oct23.pdf',
      category: 'Inpatient Statistics',
      status: 'Completed',
      generatedBy: 'Admin Mwalimu',
      date: 'Oct 31, 2023',
    },
    {
      id: '2',
      name: 'ER_Wait_Time_Weekly_Rpt.csv',
      category: 'Efficiency Metrics',
      status: 'Completed',
      generatedBy: 'Systems Auto',
      date: 'Oct 28, 2023',
    },
    {
      id: '3',
      name: 'Radiology_Throughput_Summary.pdf',
      category: 'Departmental Workload',
      status: 'Processing',
      generatedBy: 'Admin Mwalimu',
      date: 'Oct 27, 2023',
    },
  ];

  const handleApplyFilters = () => {
    // Client-side visual state trigger only
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-lg">
      <div className="flex justify-between items-end mb-lg">
        <div>
          <nav className="flex items-center gap-xs text-label-sm text-secondary">
            <span>Analytics</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-bold">Patient Reports</span>
          </nav>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded text-secondary font-label-md hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded text-secondary font-label-md hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent">
            <span className="material-symbols-outlined text-[18px]">csv</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label-md font-label-md text-secondary mb-1.5 uppercase">Date Range</label>
          <div className="relative">
            <input
              className="w-full border border-border-subtle rounded px-3 py-2 text-body-sm bg-surface-container-lowest cursor-pointer focus:ring-1 focus:ring-primary outline-none"
              readOnly
              type="text"
              defaultValue="Oct 1, 2023 - Oct 31, 2023"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              calendar_today
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label-md font-label-md text-secondary mb-1.5 uppercase">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border border-border-subtle rounded px-3 py-2 text-body-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
          >
            <option>All Departments</option>
            <option>Emergency</option>
            <option>Cardiology</option>
            <option>Pediatrics</option>
            <option>Outpatient</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label-md font-label-md text-secondary mb-1.5 uppercase">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full border border-border-subtle rounded px-3 py-2 text-body-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
          >
            <option>Census</option>
            <option>Wait Times</option>
            <option>Discharge Stats</option>
          </select>
        </div>
        <button
          onClick={handleApplyFilters}
          className="px-6 py-2 bg-primary-container text-surface-white font-label-md rounded hover:bg-primary transition-colors h-[38px] flex items-center justify-center cursor-pointer border-0"
        >
          Apply Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex items-start justify-between shadow-sm">
          <div>
            <p className="text-label-md font-label-md text-secondary uppercase mb-1">Total Patients This Period</p>
            <h3 className="text-headline-lg font-headline-lg text-primary">1,240</h3>
            <p className="text-label-sm text-success flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +12% from last month
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">groups</span>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex items-start justify-between shadow-sm">
          <div>
            <p className="text-label-md font-label-md text-secondary uppercase mb-1">Avg Wait Time</p>
            <h3 className="text-headline-lg font-headline-lg text-on-surface">18 min</h3>
            <p className="text-label-sm text-success flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_down</span>
              -4 min improvement
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-warning">
            <span className="material-symbols-outlined">timer</span>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex items-start justify-between shadow-sm">
          <div>
            <p className="text-label-md font-label-md text-secondary uppercase mb-1">Discharged</p>
            <h3 className="text-headline-lg font-headline-lg text-on-surface">892</h3>
            <p className="text-label-sm text-secondary flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">sync</span>
              Stable
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-success">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              logout
            </span>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex items-start justify-between shadow-sm">
          <div>
            <p className="text-label-md font-label-md text-secondary uppercase mb-1">Admitted</p>
            <h3 className="text-headline-lg font-headline-lg text-error">48</h3>
            <p className="text-label-sm text-error flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              Capacity threshold (85%)
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-error">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              bed
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Patient Census (Last 30 Days)</h4>
            <button className="text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="p-lg h-64 flex items-end gap-1.5 relative mt-auto">
            <div className="absolute left-4 top-4 bottom-10 flex flex-col justify-between text-[11px] font-medium text-outline">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div className="flex-1 h-full pl-8 flex items-end justify-between">
              <div className="w-2.5 bg-primary opacity-40 rounded-t-sm" style={{ height: '45%' }} />
              <div className="w-2.5 bg-primary opacity-50 rounded-t-sm" style={{ height: '55%' }} />
              <div className="w-2.5 bg-primary opacity-60 rounded-t-sm" style={{ height: '65%' }} />
              <div className="w-2.5 bg-primary opacity-40 rounded-t-sm" style={{ height: '40%' }} />
              <div className="w-2.5 bg-primary rounded-t-sm" style={{ height: '85%' }} />
              <div className="w-2.5 bg-primary opacity-50 rounded-t-sm" style={{ height: '60%' }} />
              <div className="w-2.5 bg-primary opacity-30 rounded-t-sm" style={{ height: '35%' }} />
              <div className="w-2.5 bg-primary rounded-t-sm" style={{ height: '90%' }} />
              <div className="w-2.5 bg-primary opacity-70 rounded-t-sm" style={{ height: '75%' }} />
              <div className="w-2.5 bg-primary opacity-50 rounded-t-sm" style={{ height: '50%' }} />
              <div className="w-2.5 bg-primary opacity-80 rounded-t-sm" style={{ height: '80%' }} />
              <div className="w-2.5 bg-primary rounded-t-sm" style={{ height: '95%' }} />
              <div className="w-2.5 bg-primary opacity-40 rounded-t-sm" style={{ height: '45%' }} />
              <div className="w-2.5 bg-primary opacity-90 rounded-t-sm" style={{ height: '88%' }} />
              <div className="w-2.5 bg-primary opacity-60 rounded-t-sm" style={{ height: '65%' }} />
              <div className="w-2.5 bg-primary rounded-t-sm" style={{ height: '78%' }} />
            </div>
          </div>
          <div className="px-lg pb-4 text-[11px] text-outline text-center bg-surface-white">
            Data visualized daily. Last update: Today, 08:00 AM
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Average Wait Time by Department</h4>
            <button className="text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="p-lg space-y-3 flex-1 flex flex-col justify-center bg-surface-white">
            {[
              { label: 'Reception', time: '8m', pct: '25%' },
              { label: 'Triage', time: '15m', pct: '45%' },
              { label: 'Consultation', time: '42m', pct: '85%' },
              { label: 'Laboratory', time: '30m', pct: '65%' },
              { label: 'Radiology', time: '38m', pct: '75%' },
              { label: 'Pharmacy', time: '12m', pct: '40%' },
              { label: 'Billing', time: '10m', pct: '30%' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-24 text-[11px] font-medium text-outline text-right uppercase tracking-wider">
                  {item.label}
                </span>
                <div className="flex-1 h-3 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-[#00B8D9] rounded-full" style={{ width: item.pct }} />
                </div>
                <span className="w-10 text-[11px] font-bold text-secondary">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm lg:col-span-2">
          <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Discharge Statistics</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-label-sm font-semibold">
                <span className="w-3 h-3 rounded-full bg-success"></span>
                <span>Successful Discharge</span>
              </div>
              <button className="text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
          </div>
          <div className="p-lg relative h-72 bg-surface-white">
            <div className="absolute left-8 top-8 bottom-12 flex flex-col justify-between text-[11px] font-medium text-outline">
              <span>500</span>
              <span>400</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>
            <div className="absolute left-20 right-8 top-8 bottom-12">
              <svg className="w-full h-full overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <path
                  d="M0,150 C30,150 70,145 100,145 C130,145 170,110 200,110 C230,110 270,130 300,130 C330,130 370,90 400,90 C430,90 470,105 500,105 C530,105 570,60 600,60 C630,60 670,80 700,80 C730,80 770,40 800,40 C830,40 870,55 900,55 C930,55 970,30 1000,30 L1000,200 L0,200 Z"
                  fill="url(#patientLineGradient)"
                  opacity="0.3"
                />
                <path
                  d="M0,150 C30,150 70,145 100,145 C130,145 170,110 200,110 C230,110 270,130 300,130 C330,130 370,90 400,90 C430,90 470,105 500,105 C530,105 570,60 600,60 C630,60 670,80 700,80 C730,80 770,40 800,40 C830,40 870,55 900,55 C930,55 970,30 1000,30"
                  fill="none"
                  stroke="#36B37E"
                  strokeWidth="3"
                />
                <defs>
                  <linearGradient id="patientLineGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#36B37E', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: '#36B37E', stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute -bottom-6 w-full flex justify-between text-[11px] font-medium text-outline uppercase tracking-wider">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
                <span>Week 5</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle bg-surface-container-low">
          <h4 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight">
            Recent Generated Reports
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-border-subtle">
                <th className="px-lg py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-lg py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">
                  Category
                </th>
                <th className="px-lg py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-lg py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">
                  Generated By
                </th>
                <th className="px-lg py-3 text-label-md font-label-md text-secondary uppercase tracking-wider">
                  Date
                </th>
                <th className="px-lg py-3 text-label-md font-label-md text-secondary uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-body-sm divide-y divide-border-subtle bg-surface-white">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-row-hover transition-colors">
                  <td className="px-lg py-4 font-semibold text-primary">{report.name}</td>
                  <td className="px-lg py-4 text-secondary">{report.category}</td>
                  <td className="px-lg py-4">
                    <span
                      className={`px-2 py-1 text-[11px] font-bold rounded uppercase ${
                        report.status === 'Completed' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-lg py-4 text-on-surface">{report.generatedBy}</td>
                  <td className="px-lg py-4 text-secondary">{report.date}</td>
                  <td className="px-lg py-4 text-right">
                    <button
                      disabled={report.status === 'Processing'}
                      className="text-secondary hover:text-primary px-2 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent border-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                    <button
                      disabled={report.status === 'Processing'}
                      className="text-secondary hover:text-primary px-2 disabled:opacity-30 disabled:cursor-not-allowed bg-transparent border-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
