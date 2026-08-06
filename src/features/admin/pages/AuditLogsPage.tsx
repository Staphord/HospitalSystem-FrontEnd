import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { adminService } from '@/api/services/admin';
import type { AuditLogRow, HospitalUser } from '@/api/types/admin';

const PAGE_SIZE = 25;

export const AuditLogsPage: React.FC = () => {
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedAction, setSelectedAction] = useState('All Actions');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [users, setUsers] = useState<HospitalUser[]>([]);
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [deptOptions, setDeptOptions] = useState<{ label: string; tableName: string }[]>([]);

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.keycloak_sub, u.full_name || u.username));
    return map;
  }, [users]);

  // Load staff list + a broad unfiltered sample of logs once, to populate filter option lists
  useEffect(() => {
    adminService.listUsers().then(setUsers).catch(() => {});
    adminService
      .listHospitalAuditLogs({ limit: 200 })
      .then((rows) => {
        setActionOptions(Array.from(new Set(rows.map((r) => r.action))).sort());
        const deptMap = new Map<string, string>();
        rows.forEach((r) => {
          if (!deptMap.has(r.department)) {
            deptMap.set(r.department, r.department.toLowerCase().replace(/ /g, '_'));
          }
        });
        setDeptOptions(
          Array.from(deptMap.entries()).map(([label, tableName]) => ({ label, tableName })),
        );
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLogs = () => {
    setLoading(true);
    adminService
      .listHospitalAuditLogsPage({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        user_id: selectedStaff !== 'all' ? selectedStaff : undefined,
        action: selectedAction !== 'All Actions' ? selectedAction : undefined,
        table_name:
          selectedDept !== 'All Departments'
            ? deptOptions.find((d) => d.label === selectedDept)?.tableName
            : undefined,
        from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        to: dateTo ? new Date(dateTo).toISOString() : undefined,
      })
      .then(({ items, total: totalCount }) => {
        setLogs(
          items.map((log) => ({
            ...log,
            staffName: userNameById.get(log.staffName) || log.staffName,
          })),
        );
        setTotal(totalCount);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedStaff, selectedAction, selectedDept, dateFrom, dateTo, userNameById]);

  useEffect(() => {
    setPage(1);
  }, [selectedStaff, selectedAction, selectedDept, dateFrom, dateTo]);

  const handleExport = () => {
    setExporting(true);
    adminService
      .exportAuditLogs(
        {
          user_id: selectedStaff !== 'all' ? selectedStaff : undefined,
          action: selectedAction !== 'All Actions' ? selectedAction : undefined,
          table_name:
            selectedDept !== 'All Departments'
              ? deptOptions.find((d) => d.label === selectedDept)?.tableName
              : undefined,
          from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
          to: dateTo ? new Date(dateTo).toISOString() : undefined,
        },
        'csv',
      )
      .then(() => toast.success('Audit log export downloaded.'))
      .catch((err) => toast.error(err.response?.data?.detail || 'Failed to export audit logs.'))
      .finally(() => setExporting(false));
  };

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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

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
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-xs px-3 py-1.5 border border-border-subtle rounded bg-surface-white text-secondary font-label-md hover:bg-surface-container-low transition-all disabled:opacity-60 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          {exporting ? 'Exporting...' : 'Export CSV'}
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
            <option value="all">All Staff</option>
            {users.map((u) => (
              <option key={u.keycloak_sub} value={u.keycloak_sub}>
                {u.full_name || u.username}
              </option>
            ))}
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
            {actionOptions.map((a) => (
              <option key={a}>{a}</option>
            ))}
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
            {deptOptions.map((d) => (
              <option key={d.tableName}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[280px]">
          <label className="block font-label-md text-secondary mb-base uppercase">Date Range</label>
          <div className="flex items-center gap-xs">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full h-10 px-md border border-border-subtle rounded bg-surface-white text-body-sm focus:border-primary focus:ring-0 outline-none"
            />
            <span className="text-secondary">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full h-10 px-md border border-border-subtle rounded bg-surface-white text-body-sm focus:border-primary focus:ring-0 outline-none"
            />
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
            Showing <span className="font-semibold">{rangeStart}-{rangeEnd}</span> of {total} logs
          </p>
          <div className="flex items-center gap-base">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-surface-container-low transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-md font-label-md text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle hover:bg-surface-container-low transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
