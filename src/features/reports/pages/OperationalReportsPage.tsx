import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminService, type StaffActivityRow, type BedOccupancyReportResponse } from '@/api/services/admin';
import { formatRoleLabel } from '@/lib/roles';

export const OperationalReportsPage: React.FC = () => {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('All Departments');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState<boolean>(true);
  const [staffActivities, setStaffActivities] = useState<StaffActivityRow[]>([]);
  const [bedData, setBedData] = useState<BedOccupancyReportResponse | null>(null);

  const [activeStaffCount, setActiveStaffCount] = useState<number>(0);
  const [, setTotalStaffCount] = useState<number>(0);
  const [avgLos, setAvgLos] = useState<number>(0);


  const fetchOperationalData = () => {
    setLoading(true);
    Promise.all([
      adminService.getOperationalActivityReport(fromDate, toDate, department).catch(() => null),
      adminService.getBedOccupancyReport().catch(() => null),
      adminService.listUsers().catch(() => []),
    ])
      .then(([opData, beds, users]) => {
        if (opData) {
          if (opData.staff_activities) setStaffActivities(opData.staff_activities);
          if (opData.avg_length_of_stay_days !== undefined) setAvgLos(opData.avg_length_of_stay_days);
        }
        if (beds) {
          setBedData(beds);
        }
        if (Array.isArray(users)) {
          const activeUsers = users.filter((u) => u.status === 'active');
          setActiveStaffCount(activeUsers.length);
          setTotalStaffCount(users.length);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch operational report:', err);
        toast.error('Failed to fetch operational report');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOperationalData();
  }, []);

  const handleApplyFilters = () => {
    fetchOperationalData();
    toast.success('Filters applied');
  };

  const occupancyRate =
    bedData && bedData.total > 0
      ? Math.round((bedData.occupied / bedData.total) * 100)
      : 0;

  const filteredStaff = staffActivities.filter((row) =>
    row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <button
            onClick={() => toast.info('Exporting PDF...')}
            className="px-3 py-1.5 border border-border-subtle bg-surface-white rounded text-body-sm font-medium flex items-center gap-2 hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={() => toast.info('Exporting CSV...')}
            className="px-3 py-1.5 border border-border-subtle bg-surface-white rounded text-body-sm font-medium flex items-center gap-2 hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">description</span>
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm">
        <div className="space-y-1">
          <label className="text-label-md text-secondary block font-semibold uppercase">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border border-border-subtle rounded bg-white text-body-sm focus:ring-1 focus:ring-primary outline-none w-44"
          />
        </div>
        <div className="space-y-1">
          <label className="text-label-md text-secondary block font-semibold uppercase">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border border-border-subtle rounded bg-white text-body-sm focus:ring-1 focus:ring-primary outline-none w-44"
          />
        </div>
        <div className="space-y-1">
          <label className="text-label-md text-secondary block font-semibold uppercase">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 border border-border-subtle rounded bg-white text-body-sm focus:ring-1 focus:ring-primary outline-none w-48"
          >
            <option>All Departments</option>
            <option>Emergency</option>
            <option>Pediatrics</option>
            <option>Cardiology</option>
            <option>Oncology</option>
            <option>Laboratory</option>
            <option>Pharmacy</option>
          </select>
        </div>
        <button
          onClick={handleApplyFilters}
          disabled={loading}
          className="ml-auto px-4 py-2 bg-primary text-white rounded text-body-sm font-semibold flex items-center gap-2 hover:bg-primary-container transition-transform active:scale-95 h-[38px] cursor-pointer border-0 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter">
        <div className="p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm space-y-2">
          <p className="text-label-md text-secondary uppercase font-bold tracking-wider">Bed Occupancy Rate</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">{occupancyRate}%</h3>
            <span className="text-success flex items-center text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> Live
            </span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        <div className="p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm space-y-2">
          <p className="text-label-md text-secondary uppercase font-bold tracking-wider">Avg Length of Stay</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">
              {avgLos} <span className="text-body-md font-normal text-secondary">days</span>
            </h3>
            <span className="text-success flex items-center text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">schedule</span> Live
            </span>
          </div>
          <p className="text-label-sm text-outline italic">Calculated from discharged admissions</p>
        </div>


        <div className="p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm space-y-2">
          <p className="text-label-md text-secondary uppercase font-bold tracking-wider">Active Staff Count</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">{activeStaffCount}</h3>
            <span className="text-success flex items-center text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">check_circle</span> Active
            </span>
          </div>
          <p className="text-label-sm text-outline italic">Registered active staff accounts</p>
        </div>



        <div className="p-4 bg-surface-white border border-border-subtle rounded-xl shadow-sm space-y-2">
          <p className="text-label-md text-secondary uppercase font-bold tracking-wider">Total Actions Recorded</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-lg font-headline-lg text-on-surface">
              {staffActivities.reduce((acc, curr) => acc + curr.actions_performed, 0)}
            </h3>
            <span className="text-success flex items-center text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> Live
            </span>
          </div>
          <p className="text-label-sm text-outline italic">Actions in selected time period</p>
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary">
                    Loading staff operational activity...
                  </td>
                </tr>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((row, idx) => (
                  <tr key={idx} className="hover:bg-row-hover transition-colors group cursor-pointer">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-[10px]">
                        {row.initials}
                      </div>
                      <span className="text-body-sm font-semibold text-primary">{row.name}</span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-secondary">{formatRoleLabel(row.role)}</td>
                    <td className="px-6 py-4 text-body-sm text-center text-on-surface">{row.actions_performed}</td>
                    <td className="px-6 py-4 text-body-sm text-center text-on-surface">{row.patients_handled}</td>
                    <td className="px-6 py-4 text-body-sm text-right font-medium text-on-surface">
                      {row.avg_response_time}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-secondary">
                    No staff activity records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border-subtle flex justify-between items-center bg-surface-container-low">
          <p className="text-label-sm text-secondary">Showing {filteredStaff.length} staff members</p>
        </div>
      </div>
    </div>
  );
};

