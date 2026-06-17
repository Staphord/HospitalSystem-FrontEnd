import React, { useState } from 'react';

interface StaffActivityRow {
  initials: string;
  name: string;
  role: string;
  actionsPerformed: number;
  patientsHandled: number;
  avgResponseTime: string;
}

export const OperationalReportsPage: React.FC = () => {
  const [department, setDepartment] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');

  const staffActivities: StaffActivityRow[] = [
    {
      initials: 'DM',
      name: 'Dr. David Mvungi',
      role: 'Chief Surgeon',
      actionsPerformed: 142,
      patientsHandled: 28,
      avgResponseTime: '12 mins',
    },
    {
      initials: 'SM',
      name: 'Sr. Sarah Moshi',
      role: 'Head Nurse',
      actionsPerformed: 318,
      patientsHandled: 54,
      avgResponseTime: '8 mins',
    },
    {
      initials: 'JK',
      name: 'Dr. Juma Kapuya',
      role: 'Pediatrician',
      actionsPerformed: 184,
      patientsHandled: 42,
      avgResponseTime: '15 mins',
    },
    {
      initials: 'EK',
      name: 'Elisa Kimaro',
      role: 'Lab Technician',
      actionsPerformed: 521,
      patientsHandled: 88,
      avgResponseTime: '5 mins',
    },
    {
      initials: 'MT',
      name: 'Mariam Tunu',
      role: 'Admissions Officer',
      actionsPerformed: 245,
      patientsHandled: 112,
      avgResponseTime: '18 mins',
    },
  ];

  const handleApplyFilters = () => {
    // Client-side visual state trigger only
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-xs text-secondary">
            <span className="font-label-sm text-label-sm">Reports &amp; Analytics</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary">Operational Reports</span>
          </nav>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-border-subtle bg-surface-white rounded text-body-sm font-medium flex items-center gap-2 hover:bg-surface-container transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button className="px-3 py-1.5 border border-border-subtle bg-surface-white rounded text-body-sm font-medium flex items-center gap-2 hover:bg-surface-container transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">description</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm">
        <div className="space-y-1">
          <label className="text-label-md text-secondary block font-semibold uppercase">Date Range</label>
          <div className="relative">
            <input
              className="pl-10 pr-4 py-2 border border-border-subtle rounded bg-white text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none w-64 cursor-pointer"
              readOnly
              type="text"
              defaultValue="Oct 01, 2023 - Oct 31, 2023"
            />
            <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[18px]">
              calendar_today
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-label-md text-secondary block font-semibold uppercase">Department</label>
          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="pl-4 pr-10 py-2 border border-border-subtle rounded bg-white text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none w-56 appearance-none"
            >
              <option>All Departments</option>
              <option>Emergency</option>
              <option>Pediatrics</option>
              <option>Cardiology</option>
              <option>Oncology</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
        <button
          onClick={handleApplyFilters}
          className="ml-auto px-4 py-2 bg-primary text-white rounded text-body-sm font-semibold flex items-center gap-2 hover:bg-primary-container transition-transform active:scale-95 h-[38px] cursor-pointer border-0"
        >
          Apply Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
        <div className="p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm space-y-2">
          <p className="text-label-md text-secondary uppercase font-bold tracking-wider">Bed Occupancy Rate</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">72%</h3>
            <span className="text-success flex items-center text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> 4.2%
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: '72%' }}></div>
          </div>
        </div>

        <div className="p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm space-y-2">
          <p className="text-label-md text-secondary uppercase font-bold tracking-wider">Avg Length of Stay</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">
              2.4 <span className="text-body-md font-normal text-secondary">days</span>
            </h3>
            <span className="text-success flex items-center text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">trending_down</span> 0.3d
            </span>
          </div>
          <p className="text-label-sm text-outline italic">Stable against hospital average</p>
        </div>

        <div className="p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm space-y-2">
          <p className="text-label-md text-secondary uppercase font-bold tracking-wider">Staff Utilization</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">84%</h3>
            <span className="text-warning flex items-center text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">info</span> Warning
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div className="bg-warning h-full" style={{ width: '84%' }}></div>
          </div>
        </div>

        <div className="p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm space-y-2">
          <p className="text-label-md text-secondary uppercase font-bold tracking-wider">Patient Throughput</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">412</h3>
            <span className="text-success flex items-center text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> 12%
            </span>
          </div>
          <p className="text-label-sm text-outline italic">+42 patients from previous month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <div className="bg-surface-white border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h4 className="text-headline-sm font-headline-sm text-on-surface">Bed Occupancy Over Time</h4>
            <button className="p-1 hover:bg-surface-container rounded transition-colors bg-transparent border-0 cursor-pointer">
              <span className="material-symbols-outlined text-outline">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 p-4 h-[300px] relative bg-surface-white">
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
              {[
                { label: '100%' },
                { label: '75%' },
                { label: '50%' },
                { label: '25%' },
                { label: '0%' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 w-full">
                  <span className="text-[11px] font-medium text-outline w-8 text-right">{item.label}</span>
                  <div className="flex-1 h-[1px] bg-border-subtle/50"></div>
                </div>
              ))}
            </div>
            <div className="relative h-full ml-10 mr-2">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#DEEBFF" stopOpacity="1"></stop>
                    <stop offset="100%" stopColor="#DEEBFF" stopOpacity="0.2"></stop>
                  </linearGradient>
                </defs>
                <path
                  d="M 0,100 L 0,75 Q 5,70 10,78 T 20,70 T 30,85 T 40,65 T 50,55 T 60,45 T 70,25 T 80,35 T 90,20 T 100,15 L 100,100 Z"
                  fill="url(#chartGradient)"
                ></path>
                <path
                  d="M 0,75 Q 5,70 10,78 T 20,70 T 30,85 T 40,65 T 50,55 T 60,45 T 70,25 T 80,35 T 90,20 T 100,15"
                  fill="none"
                  stroke="#0052CC"
                  strokeWidth="1.5"
                ></path>
                <circle cx="10" cy="78" fill="#0052CC" r="1.5"></circle>
                <circle cx="40" cy="65" fill="#0052CC" r="1.5"></circle>
                <circle cx="70" cy="25" fill="#0052CC" r="1.5"></circle>
                <circle cx="90" cy="20" fill="#0052CC" r="1.5"></circle>
              </svg>
              <div className="absolute top-[15%] left-[65%] -translate-x-1/2 -translate-y-full mb-2 bg-inverse-surface text-white px-2 py-1 rounded text-[10px] shadow-lg z-10">
                <div className="font-bold">Oct 20</div>
                <div className="">78% Occupancy</div>
                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-inverse-surface"></div>
              </div>
            </div>
            <div className="absolute bottom-4 left-14 right-6 flex justify-between text-label-sm text-secondary">
              <span>Oct 1</span>
              <span>Oct 8</span>
              <span>Oct 15</span>
              <span>Oct 22</span>
              <span>Oct 29</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h4 className="text-headline-sm font-headline-sm text-on-surface">Patient Throughput by Department</h4>
            <button className="p-1 hover:bg-surface-container rounded transition-colors bg-transparent border-0 cursor-pointer">
              <span className="material-symbols-outlined text-outline">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 p-6 flex items-end justify-between gap-4 h-[300px] bg-surface-white">
            {[
              { label: 'Emergency', val: 142, h: '100%' },
              { label: 'Pediatrics', val: 98, h: '69%' },
              { label: 'Cardiology', val: 76, h: '53%' },
              { label: 'Oncology', val: 54, h: '38%' },
              { label: 'Neurology', val: 42, h: '29%' },
            ].map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-label-sm font-bold text-primary">{item.val}</span>
                <div className="w-full bg-primary rounded-t-lg" style={{ height: item.h }}></div>
                <span className="text-label-sm text-secondary truncate w-full text-center">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-white">
          <h4 className="text-headline-sm font-headline-sm text-on-surface">Staff Activity Summary</h4>
          <div className="flex gap-2">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 border border-border-subtle rounded text-body-sm focus:ring-1 focus:ring-primary outline-none"
                placeholder="Search staff..."
                type="text"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-outline text-[18px]">search</span>
            </div>
            <button className="p-2 border border-border-subtle rounded text-secondary hover:bg-surface-container-low transition-colors bg-transparent cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                <th className="px-6 py-3 text-label-md text-secondary font-bold uppercase tracking-wider">Staff Name</th>
                <th className="px-6 py-3 text-label-md text-secondary font-bold uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-label-md text-secondary font-bold uppercase tracking-wider text-center">
                  Actions Performed
                </th>
                <th className="px-6 py-3 text-label-md text-secondary font-bold uppercase tracking-wider text-center">
                  Patients Handled
                </th>
                <th className="px-6 py-3 text-label-md text-secondary font-bold uppercase tracking-wider text-right">
                  Avg Response Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-white">
              {staffActivities
                .filter((row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((row, idx) => (
                  <tr key={idx} className="hover:bg-row-hover transition-colors group cursor-pointer">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-[10px]">
                        {row.initials}
                      </div>
                      <span className="text-body-sm font-semibold text-primary">{row.name}</span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-secondary">{row.role}</td>
                    <td className="px-6 py-4 text-body-sm text-center text-on-surface">{row.actionsPerformed}</td>
                    <td className="px-6 py-4 text-body-sm text-center text-on-surface">{row.patientsHandled}</td>
                    <td className="px-6 py-4 text-body-sm text-right font-medium text-on-surface">
                      {row.avgResponseTime}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border-subtle flex justify-between items-center bg-surface-container-low">
          <p className="text-label-sm text-secondary">Showing 5 of 124 staff members</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-border-subtle rounded text-body-sm disabled:opacity-50 bg-transparent cursor-pointer" disabled>
              Previous
            </button>
            <button className="px-3 py-1 border border-border-subtle rounded text-body-sm hover:bg-surface-container-high transition-colors bg-transparent cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
