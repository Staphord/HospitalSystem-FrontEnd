import React, { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import type { AuditLogRow } from '@/api/types/admin';

export const AuditLogsPage: React.FC = () => {
  const [selectedStaff, setSelectedStaff] = useState('All Staff');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [expandedRowId, setExpandedRowId] = useState<string | null>('1');

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    adminService.listHospitalAuditLogs()
      .then((data) => {
        setLogs(data);
      })
      .catch((err) => {
        console.error('Failed to load audit logs:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, []);

  const toggleRowExpanded = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'DIAGNOSIS':
        return 'bg-success text-white';
      case 'PATIENT_REGISTER':
        return 'bg-[#0052CC] text-white';
      case 'LOGIN':
        return 'bg-[#42526E] text-white';
      case 'LAB_RESULT':
        return 'bg-[#00B8D9] text-white';
      case 'PAYMENT':
        return 'bg-[#FFAB00] text-white';
      case 'DELETE':
        return 'bg-[#FF5630] text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-lg">
      <div className="flex items-center mb-lg">
        <div className="flex-1">
          <nav className="flex items-center gap-xs text-label-sm text-secondary">
            <span>System</span>
            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
            <span className="text-primary font-bold">Audit Logs</span>
          </nav>
        </div>
        <button className="flex items-center gap-xs px-3 py-1.5 border border-border-subtle rounded bg-surface-white text-secondary font-label-md hover:bg-surface-container-low transition-all">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
      </div>

      <div className="bg-[#DEEBFF] border border-[#0052CC] rounded-lg p-md flex items-center gap-md shadow-sm">
        <div className="flex items-center gap-sm text-primary">
          <span className="material-symbols-outlined text-[20px]">lock</span>
          <p className="font-body-md font-medium">
            This log is tamper-proof and read-only. No entries can be edited or deleted.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-md mb-lg bg-surface-white border border-border-subtle p-md rounded-lg shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block font-label-md text-secondary mb-base uppercase">Staff Member</label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="w-full h-10 px-md border border-border-subtle rounded bg-surface-white text-body-sm focus:border-primary focus:ring-0 outline-none"
          >
            <option>All Staff</option>
            <option>Dr. Amina Hassan</option>
            <option>Nurse Grace</option>
            <option>John Baraka</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block font-label-md text-secondary mb-base uppercase">Action Type</label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full h-10 px-md border border-border-subtle rounded bg-surface-white text-body-sm focus:border-primary focus:ring-0 outline-none"
          >
            <option>All Actions</option>
            <option>DIAGNOSIS</option>
            <option>PATIENT_REGISTER</option>
            <option>LOGIN</option>
            <option>DELETE</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block font-label-md text-secondary mb-base uppercase">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full h-10 px-md border border-border-subtle rounded bg-surface-white text-body-sm focus:border-primary focus:ring-0 outline-none"
          >
            <option>All Departments</option>
            <option>Consultation</option>
            <option>Triage</option>
            <option>Reception</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block font-label-md text-secondary mb-base uppercase">Date Range</label>
          <div className="relative">
            <input
              className="w-full h-10 pl-md pr-10 border border-border-subtle rounded bg-surface-white text-body-sm focus:border-primary focus:ring-0 outline-none cursor-pointer"
              readOnly
              type="text"
              defaultValue="Jun 01, 2026 - Jun 09, 2026"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
              calendar_today
            </span>
          </div>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-md py-md border-b border-border-subtle bg-surface-white">
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">Audit Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                <th className="px-md py-sm font-label-md text-secondary uppercase tracking-wider">Timestamp</th>
                <th className="px-md py-sm font-label-md text-secondary uppercase tracking-wider">Staff Name</th>
                <th className="px-md py-sm font-label-md text-secondary uppercase tracking-wider">Action</th>
                <th className="px-md py-sm font-label-md text-secondary uppercase tracking-wider">Department</th>
                <th className="px-md py-sm font-label-md text-secondary uppercase tracking-wider">Patient/Record ID</th>
                <th className="px-md py-sm font-label-md text-secondary uppercase tracking-wider">IP Address</th>
                <th className="px-md py-sm w-10"></th>
              </tr>
            </thead>
            <tbody className="text-body-sm divide-y divide-border-subtle bg-surface-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-xl text-center text-outline font-body-sm text-sm">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-xl text-center text-outline font-body-sm text-sm">
                    No audit logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedRowId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleRowExpanded(log.id)}
                        className={`hover:bg-row-hover transition-colors group cursor-pointer ${
                          isExpanded ? 'border-l-4 border-l-primary bg-row-hover' : ''
                        }`}
                      >
                        <td className="px-md py-md font-mono text-secondary">{log.timestamp}</td>
                        <td className="px-md py-md">
                          <div className="flex items-center gap-sm">
                            <span className="font-semibold text-on-surface">{log.staffName}</span>
                            <span className="px-1.5 py-0.5 bg-surface-container text-secondary text-[10px] font-bold rounded">
                              {log.staffRole}
                            </span>
                          </div>
                        </td>
                        <td className="px-md py-md">
                          <span className={`px-2 py-1 rounded-full text-[11px] font-bold inline-block ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-md py-md text-secondary">{log.department}</td>
                        <td className="px-md py-md font-mono text-primary font-medium">{log.recordId}</td>
                        <td className="px-md py-md font-mono text-secondary">{log.ipAddress}</td>
                        <td className="px-md py-md text-center">
                          <span
                            className={`material-symbols-outlined text-secondary transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          >
                            expand_more
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#F4F5F7]">
                          <td className="px-xl py-lg" colSpan={7}>
                            <div className="border-l-2 border-primary-container pl-md">
                              <p className="text-secondary font-label-sm uppercase mb-xs opacity-60">Full Action Details</p>
                              <p className="text-body-md text-on-surface leading-relaxed">
                                {log.details} Log authenticated via digital signature{' '}
                                <span className="text-[11px] font-mono opacity-50">{log.signature}</span>
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-md py-md flex items-center justify-between border-t border-border-subtle bg-surface-white">
          <p className="text-body-sm text-secondary">
            Showing <span className="font-semibold">1-25</span> of 1,248 logs
          </p>
          <div className="flex items-center gap-base">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-white font-label-md">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-surface-container-low transition-colors font-label-md">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-surface-container-low transition-colors font-label-md">
              3
            </button>
            <span className="px-base">...</span>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-surface-container-low transition-colors font-label-md">
              50
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
