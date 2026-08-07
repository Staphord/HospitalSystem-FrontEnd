import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  adminService,
  type BedOccupancyReportResponse,
  type DischargeReportResponse,
  type PatientCensusReportResponse,
  type WaitTimeReportResponse,
} from '@/api/services/admin';

interface ReportItem {
  id: string;
  name: string;
  category: string;
  status: 'Completed' | 'Processing';
  generatedBy: string;
  date: string;
}

export const PatientReportsPage: React.FC = () => {
  const { user } = useAuth();
  const adminName = user?.full_name || user?.username || 'Admin';

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('All Departments');
  const [reportType, setReportType] = useState('Census');

  const [loading, setLoading] = useState(true);
  const [censusData, setCensusData] = useState<PatientCensusReportResponse | null>(null);
  const [waitTimeData, setWaitTimeData] = useState<WaitTimeReportResponse | null>(null);
  const [dischargeData, setDischargeData] = useState<DischargeReportResponse | null>(null);
  const [bedData, setBedData] = useState<BedOccupancyReportResponse | null>(null);

  // Pagination & Page Size State (matching ActiveSessionsPage)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchReports = () => {
    setLoading(true);
    Promise.all([
      adminService.getPatientCensusReport(fromDate, toDate).catch(() => null),
      adminService.getWaitTimesReport(fromDate, toDate).catch(() => null),
      adminService.getDischargesReport(fromDate, toDate).catch(() => null),
      adminService.getBedOccupancyReport().catch(() => null),
    ])
      .then(([census, wait, discharge, beds]) => {
        setCensusData(census);
        setWaitTimeData(wait);
        setDischargeData(discharge);
        setBedData(beds);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const reports: ReportItem[] = [
    {
      id: '1',
      name: `Patient_Census_${fromDate}_to_${toDate}.csv`,
      category: 'Inpatient Statistics',
      status: 'Completed',
      generatedBy: adminName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      id: '2',
      name: `Wait_Time_Summary_${fromDate}.csv`,
      category: 'Efficiency Metrics',
      status: 'Completed',
      generatedBy: adminName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      id: '3',
      name: `Discharge_Report_${fromDate}.csv`,
      category: 'Discharge Statistics',
      status: 'Completed',
      generatedBy: adminName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      id: '4',
      name: `Bed_Occupancy_Summary.csv`,
      category: 'Ward Management',
      status: 'Completed',
      generatedBy: adminName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      id: '5',
      name: `Departmental_Throughput_${fromDate}.csv`,
      category: 'Departmental Workload',
      status: 'Completed',
      generatedBy: adminName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      id: '6',
      name: `Emergency_Wait_Time_Analysis.csv`,
      category: 'Efficiency Metrics',
      status: 'Completed',
      generatedBy: adminName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      id: '7',
      name: `Monthly_Patient_Log_${fromDate}.csv`,
      category: 'Inpatient Statistics',
      status: 'Completed',
      generatedBy: adminName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
  ];

  // Reset to page 1 whenever filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, reports.length]);

  const handleApplyFilters = () => {
    fetchReports();
    setCurrentPage(1);
    toast.success('Filters applied');
  };

  const handleExportCSV = () => {
    if (!censusData && !waitTimeData) {
      toast.error('No report data available to export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Patient Reports Summary\n';
    csvContent += `Period,${fromDate} to ${toDate}\n`;
    csvContent += `Active Patients,${censusData?.active_patients ?? 0}\n`;
    csvContent += `Total Visits,${censusData?.total_visits ?? 0}\n\n`;

    csvContent += 'Date,Visits\n';
    (censusData?.visits_by_day || []).forEach((row) => {
      csvContent += `${row.date},${row.visits}\n`;
    });

    csvContent += '\nQueue Type,Avg Wait (Minutes),Samples\n';
    (waitTimeData?.by_queue_type || []).forEach((row) => {
      const mins = row.avg_wait_seconds ? Math.round(row.avg_wait_seconds / 60) : 0;
      csvContent += `${row.queue_type},${mins},${row.samples}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Patient_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report CSV exported');
  };

  // Derived metrics
  const totalPatients = censusData?.active_patients ?? 0;
  const totalVisits = censusData?.total_visits ?? 0;

  const waitTimesList = waitTimeData?.by_queue_type || [];
  const validWaitSeconds = waitTimesList.filter((w) => w.avg_wait_seconds != null);
  const avgWaitSec = validWaitSeconds.length > 0
    ? validWaitSeconds.reduce((acc, curr) => acc + (curr.avg_wait_seconds || 0), 0) / validWaitSeconds.length
    : 0;
  const avgWaitMin = Math.round(avgWaitSec / 60);

  const dischargedCount = dischargeData?.discharged ?? dischargeData?.completed ?? 0;
  const occupiedBeds = bedData?.occupied ?? 0;
  const totalBeds = bedData?.total ?? 0;
  const bedOccupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Chart max calculation
  const visitsByDay = censusData?.visits_by_day || [];
  const maxVisitsDay = Math.max(...visitsByDay.map((v) => v.visits), 1);

  // Pagination calculation matching ActiveSessionsPage pattern
  const totalEntries = reports.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = totalEntries === 0 ? 0 : (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedReports = reports.slice(startIndex, endIndex);

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
          <button
            onClick={() => toast.info('PDF report generation queued.')}
            className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded text-secondary font-label-md hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded text-secondary font-label-md hover:bg-surface-container-low transition-colors cursor-pointer bg-transparent"
          >
            <span className="material-symbols-outlined text-[18px]">csv</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-label-md font-label-md text-secondary mb-1.5 uppercase">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full border border-border-subtle rounded px-3 py-2 text-body-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-label-md font-label-md text-secondary mb-1.5 uppercase">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full border border-border-subtle rounded px-3 py-2 text-body-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-label-md font-label-md text-secondary mb-1.5 uppercase">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border border-border-subtle rounded px-3 py-2 text-body-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
          >
            <option>All Departments</option>
            <option>Emergency</option>
            <option>Reception</option>
            <option>Triage</option>
            <option>Consultation</option>
            <option>Laboratory</option>
            <option>Radiology</option>
            <option>Pharmacy</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
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
          disabled={loading}
          className="px-6 py-2 bg-primary-container text-surface-white font-label-md rounded hover:bg-primary transition-colors h-[38px] flex items-center justify-center cursor-pointer border-0"
        >
          {loading ? 'Loading...' : 'Apply Filters'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex items-start justify-between shadow-sm">
          <div>
            <p className="text-label-md font-label-md text-secondary uppercase mb-1">Active Patients</p>
            <h3 className="text-headline-lg font-headline-lg text-primary">
              {loading ? '...' : totalPatients.toLocaleString()}
            </h3>
            <p className="text-label-sm text-secondary flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {totalVisits.toLocaleString()} visits recorded
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">groups</span>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex items-start justify-between shadow-sm">
          <div>
            <p className="text-label-md font-label-md text-secondary uppercase mb-1">Avg Wait Time</p>
            <h3 className="text-headline-lg font-headline-lg text-on-surface">
              {loading ? '...' : `${avgWaitMin} min`}
            </h3>
            <p className="text-label-sm text-success flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              Across queues
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-warning">
            <span className="material-symbols-outlined">timer</span>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle p-lg rounded-xl flex items-start justify-between shadow-sm">
          <div>
            <p className="text-label-md font-label-md text-secondary uppercase mb-1">Discharged / Completed</p>
            <h3 className="text-headline-lg font-headline-lg text-on-surface">
              {loading ? '...' : dischargedCount.toLocaleString()}
            </h3>
            <p className="text-label-sm text-secondary flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">sync</span>
              Period discharges
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
            <p className="text-label-md font-label-md text-secondary uppercase mb-1">Bed Occupancy</p>
            <h3 className="text-headline-lg font-headline-lg text-error">
              {loading ? '...' : `${bedOccupancyPct}%`}
            </h3>
            <p className="text-label-sm text-error flex items-center gap-1 mt-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">bed</span>
              {occupiedBeds} of {totalBeds} occupied
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-error">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              bed
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Patient Census Visual */}
        <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Daily Visit Volume</h4>
            <span className="text-label-sm text-secondary">{fromDate} to {toDate}</span>
          </div>
          <div className="p-lg h-64 flex items-end gap-1.5 relative mt-auto">
            {visitsByDay.length === 0 ? (
              <div className="w-full text-center text-outline my-auto font-body-sm">
                No visit records for selected period
              </div>
            ) : (
              <div className="flex-1 h-full flex items-end justify-between gap-1 overflow-x-auto">
                {visitsByDay.map((v, i) => {
                  const pct = Math.max(Math.round((v.visits / maxVisitsDay) * 100), 8);
                  return (
                    <div
                      key={i}
                      title={`${v.date}: ${v.visits} visits`}
                      className="flex-1 bg-primary rounded-t-sm hover:opacity-80 transition-all cursor-pointer min-w-[8px]"
                      style={{ height: `${pct}%` }}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <div className="px-lg pb-4 text-[11px] text-outline text-center bg-surface-white border-t border-border-subtle pt-2">
            Data sourced from tenant visit logs.
          </div>
        </div>

        {/* Wait Times by Department Visual */}
        <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Average Wait Time by Queue</h4>
            <span className="text-label-sm text-secondary">In Minutes</span>
          </div>
          <div className="p-lg space-y-3 flex-1 flex flex-col justify-center bg-surface-white">
            {waitTimesList.length === 0 ? (
              <div className="text-center text-outline my-auto font-body-sm">
                No queue data available for selected period
              </div>
            ) : (
              waitTimesList.map((item, idx) => {
                const mins = item.avg_wait_seconds ? Math.round(item.avg_wait_seconds / 60) : 0;
                const pct = Math.min(Math.max(mins * 3, 10), 100);
                const label = item.queue_type
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-28 text-[11px] font-medium text-outline text-right uppercase tracking-wider truncate">
                      {label}
                    </span>
                    <div className="flex-1 h-3 bg-surface-container-low rounded-full overflow-hidden">
                      <div className="h-full bg-primary-container rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-12 text-[11px] font-bold text-secondary">{mins} min</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Generated Reports Table Card (styled to match ActiveSessionsPage) */}
      <div className="bg-surface-white border border-border-subtle rounded-[16px] overflow-hidden shadow-sm flex flex-col">
        <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest">
          <h4 className="font-headline-sm text-headline-sm text-on-surface m-0">Recent Generated Reports</h4>
          <span className="text-label-sm text-secondary font-medium">
            Total {totalEntries} Reports
          </span>
        </div>

        {/* Scrollable table container matching ActiveSessionsPage max height */}
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-surface-bright shadow-xs">
              <tr className="border-b border-border-subtle">
                <th className="px-lg py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Report Name</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Category</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Status</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Generated By</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Date</th>
                <th className="px-lg py-3 font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-white">
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report) => (
                  <tr key={report.id} className="group hover:bg-row-hover transition-colors">
                    <td className="px-lg py-4 font-semibold text-primary">{report.name}</td>
                    <td className="px-md py-4 text-secondary">{report.category}</td>
                    <td className="px-md py-4">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-full uppercase ${
                          report.status === 'Completed' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-md py-4 text-on-surface">{report.generatedBy}</td>
                    <td className="px-md py-4 text-secondary">{report.date}</td>
                    <td className="px-lg py-4 text-right">
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="text-secondary hover:text-primary p-1 rounded hover:bg-surface-container-low transition-colors border-0 bg-transparent cursor-pointer"
                        title="Download Report"
                      >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-xl text-center text-outline font-body-sm text-sm">
                    No generated reports available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Interactive pagination footer (exact mirror of ActiveSessionsPage) */}
        <div className="px-lg py-md border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest/30">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[12px] text-outline">
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} generated reports
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="reportPageSize" className="font-body-sm text-xs text-secondary whitespace-nowrap">
                Per page:
              </label>
              <select
                id="reportPageSize"
                className="border border-border-subtle rounded text-xs px-2 py-1 bg-surface-white font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 max-w-full overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className={`w-8 h-8 rounded flex items-center justify-center border transition-colors shrink-0 ${
                validCurrentPage <= 1
                  ? 'border-border-subtle text-outline cursor-not-allowed bg-surface-bright'
                  : 'border-border-subtle text-secondary hover:bg-surface-container-low cursor-pointer'
              }`}
              aria-label="Previous Page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto max-w-[220px] sm:max-w-[320px] scrollbar-none py-0.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  style={
                    pageNum === validCurrentPage
                      ? { backgroundColor: '#0052cc', color: '#ffffff', borderColor: '#0052cc' }
                      : undefined
                  }
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border shrink-0 ${
                    pageNum === validCurrentPage
                      ? 'shadow-xs'
                      : 'border-border-subtle text-on-surface hover:bg-surface-container-low bg-surface-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className={`w-8 h-8 rounded flex items-center justify-center border transition-colors shrink-0 ${
                validCurrentPage >= totalPages
                  ? 'border-border-subtle text-outline cursor-not-allowed bg-surface-bright'
                  : 'border-border-subtle text-secondary hover:bg-surface-container-low cursor-pointer'
              }`}
              aria-label="Next Page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
