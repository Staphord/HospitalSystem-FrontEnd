import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { adminService } from '@/api/services/admin';
import type { StaffActivityLog, StaffLoginLog } from '@/api/types/admin';
import { useApp } from '../context/AppContext';

const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

type DetailTab = 'profile' | 'login-history' | 'activity-log';

export function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { staffList, updateStaff, setActiveView } = useApp();
  const [activeTab, setActiveTab] = useState<DetailTab>('profile');
  const [selectedModule, setSelectedModule] = useState('All Modules');
  const [loginLogs, setLoginLogs] = useState<StaffLoginLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<StaffActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const staff = staffList.find((s) => s.id === id);

  useEffect(() => {
    if (!id) return;
    setLogsLoading(true);
    Promise.all([
      adminService.listStaffLoginHistory(id).catch(() => [] as StaffLoginLog[]),
      adminService.listStaffActivityLogs(id).catch(() => [] as StaffActivityLog[]),
    ])
      .then(([logins, activities]) => {
        setLoginLogs(logins);
        setActivityLogs(activities);
      })
      .finally(() => setLogsLoading(false));
  }, [id]);

  // Return to staff roster view
  const handleBack = () => {
    setActiveView('staff');
  };

  if (!staff) {
    return (
      <div className="p-xl text-center text-outline">
        <p>Staff member record not found.</p>
        <button onClick={handleBack} className="mt-md text-primary underline text-xs font-semibold bg-transparent border-0 cursor-pointer">
          Back to List
        </button>
      </div>
    );
  }

  // Toggle active status between active and inactive
  const handleToggleStatus = () => {
    const nextStatus = staff.status === 'active' ? 'inactive' : 'active';
    updateStaff(staff.id, { status: nextStatus });
  };

  // Sets a new temporary password for the staff member via Keycloak (admin-service)
  const handleResetPassword = () => {
    if (isResettingPassword) return;
    setIsResettingPassword(true);
    const tempPassword = generateTempPassword();
    adminService
      .updateUser(staff.id, { password: tempPassword, forcePasswordChange: true })
      .then(() => {
        toast.success(
          `Password reset for ${staff.name}. Temporary password: ${tempPassword} (share securely — they'll be required to change it on next login).`,
          { duration: 15000 },
        );
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to reset password.');
      })
      .finally(() => setIsResettingPassword(false));
  };

  const moduleOptions = Array.from(
    new Set(activityLogs.map((a) => a.module).filter(Boolean)),
  ).sort();

  // Filter activities by the selected module dropdown option
  const filteredActivities = activityLogs.filter((act) => {
    if (selectedModule === 'All Modules') return true;
    return act.module === selectedModule;
  });

  // Downloads the currently filtered activity log as CSV
  const handleExportActivity = () => {
    const header = ['Timestamp', 'Action', 'Module', 'Target ID', 'Details'];
    const rows = filteredActivities.map((a) => [a.timestamp, a.action, a.module, a.targetId, a.details]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${staff?.name || 'staff'}-activity-log.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Get initials for profile picture replacement avatar badge
  const initials = staff.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="max-w-container-max mx-auto space-y-lg pb-32">
      {/* Breadcrumb section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-sm text-secondary font-body-sm text-body-sm">
          <a
            href="/admin/users"
            onClick={(e) => {
              e.preventDefault();
              handleBack();
            }}
            className="hover:text-primary hover:underline font-semibold"
          >
            Staff Management
          </a>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface">{staff.name}</span>
        </div>
      </div>

      {/* Header card info section */}
      <section className="bg-surface-white border border-border-subtle rounded-xl p-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
        <div className="flex items-center gap-md">
          {staff.avatarUrl ? (
            <img alt={staff.name} className="w-16 h-16 rounded-full border border-border-subtle object-cover" src={staff.avatarUrl} />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
              {initials}
            </div>
          )}
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-xs font-bold">{staff.name}</h2>
            <div className="flex items-center gap-sm">
              <span className="bg-primary-container text-on-primary-container font-label-md text-label-md px-sm py-xs rounded-full capitalize">
                {staff.role}
              </span>
              <span className={`font-label-md text-label-md px-sm py-xs rounded-full ${
                staff.status === 'active' ? 'bg-success/20 text-success' : 'bg-surface-dim text-secondary'
              } capitalize`}>
                {staff.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <button
            onClick={() => setActiveView('edit-staff', { staffId: staff.id })}
            className="px-md py-sm rounded border border-border-subtle text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors bg-transparent cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={handleResetPassword}
            disabled={isResettingPassword}
            className="px-md py-sm rounded border border-border-subtle text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors bg-transparent cursor-pointer disabled:opacity-60"
          >
            {isResettingPassword ? 'Resetting...' : 'Reset Password'}
          </button>
          <button
            onClick={handleToggleStatus}
            className={`px-md py-sm rounded border font-label-md text-label-md transition-colors bg-transparent cursor-pointer ${
              staff.status === 'active'
                ? 'border-error text-error hover:bg-error-container'
                : 'border-success text-success hover:bg-[#E3FCEF]'
            }`}
          >
            {staff.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </section>

      {/* Department scopes detail row */}
      <section className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-wrap items-center gap-md">
        <div className="flex items-center gap-base">
          <span className="font-label-md text-label-md text-secondary">Primary:</span>
          <span className="bg-primary-container text-on-primary-container font-label-md text-label-md px-sm py-xs rounded-full flex items-center gap-xs">
            {staff.landingDepartment}
            <span className="w-1 h-1 rounded-full bg-on-primary-container mx-xs"></span>
            Full Access
          </span>
        </div>
        {staff.additionalDepartments.length > 0 && (
          <>
            <div className="w-px h-6 bg-border-subtle hidden md:block"></div>
            <div className="flex items-center gap-base flex-wrap">
              <span className="font-label-md text-label-md text-secondary">Additional:</span>
              {staff.additionalDepartments.map((dept) => (
                <span key={dept} className="bg-row-hover text-primary font-label-md text-label-md px-sm py-xs rounded-full flex items-center gap-xs">
                  {dept}
                  <span className="w-1 h-1 rounded-full bg-primary mx-xs"></span>
                  Read Only
                </span>
              ))}
            </div>
          </>
        )}
        <div className="ml-auto font-body-sm text-body-sm text-outline">
          Default on Login: {staff.landingDepartment}
        </div>
      </section>

      {/* Tab panel switcher wrapper */}
      <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden flex flex-col">
        {/* Navigation list */}
        <div className="flex border-b border-border-subtle px-lg gap-lg">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-md border-b-2 font-label-md text-label-md transition-colors bg-transparent border-0 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('login-history')}
            className={`py-md border-b-2 font-label-md text-label-md transition-colors bg-transparent border-0 cursor-pointer ${
              activeTab === 'login-history'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Login History
          </button>
          <button
            onClick={() => setActiveTab('activity-log')}
            className={`py-md border-b-2 font-label-md text-label-md transition-colors bg-transparent border-0 cursor-pointer ${
              activeTab === 'activity-log'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            Activity Log
          </button>
        </div>

        {/* Profile Details Tab Panel */}
        {activeTab === 'profile' && (
          <div className="p-lg grid grid-cols-1 md:grid-cols-2 gap-y-lg gap-x-xl">
            <div>
              <label className="block font-label-md text-label-md text-outline uppercase mb-xs">Full Name</label>
              <div className="font-body-md text-body-md text-on-surface">{staff.name}</div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-outline uppercase mb-xs">Email</label>
              <div className="font-body-md text-body-md text-on-surface">{staff.email}</div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-outline uppercase mb-xs">Phone</label>
              <div className="font-body-md text-body-md text-on-surface">{staff.phone || 'N/A'}</div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-outline uppercase mb-xs">Role</label>
              <div className="font-body-md text-body-md text-on-surface capitalize">{staff.role}</div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-outline uppercase mb-xs">Primary Department</label>
              <div className="font-body-md text-body-md text-on-surface">{staff.landingDepartment}</div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-outline uppercase mb-xs">Additional Departments</label>
              <div className="font-body-md text-body-md text-on-surface">
                {staff.additionalDepartments.length > 0 ? staff.additionalDepartments.join(', ') : 'None'}
              </div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-outline uppercase mb-xs">MFA Status</label>
              <div className="font-body-md text-body-md text-on-surface flex items-center gap-xs">
                <span className={`w-2 h-2 rounded-full ${staff.mfaEnabled ? 'bg-success' : 'bg-outline-variant'}`}></span>
                {staff.mfaEnabled ? 'Enabled (App)' : 'Disabled'}
              </div>
            </div>
            <div>
              <label className="block font-label-md text-label-md text-outline uppercase mb-xs">Account Created</label>
              <div className="font-body-md text-body-md text-on-surface">
                {staff.createdAt ? staff.createdAt.split('T')[0] : ''}
              </div>
            </div>
          </div>
        )}

        {/* Login History Tab Panel */}
        {activeTab === 'login-history' && (
          <div className="flex flex-col">
            {/* Filter controls row */}
            <div className="p-md border-b border-border-subtle flex justify-between items-center bg-surface-bright">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Session Logs</h3>
              <span className="font-label-sm text-label-sm text-secondary flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                Last 30 days
              </span>
            </div>

            {/* Logs list table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-border-subtle">
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Timestamp</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">IP Address</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Device/Browser</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Duration</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Workspace</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-lg px-md text-center text-secondary">
                        Loading login history...
                      </td>
                    </tr>
                  ) : loginLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-lg px-md text-center text-secondary">
                        No login history recorded for this staff member yet.
                      </td>
                    </tr>
                  ) : (
                    loginLogs.map((log, index) => (
                      <tr key={index} className="border-b border-border-subtle hover:bg-row-hover transition-colors">
                        <td className="py-sm px-md text-on-surface">{log.timestamp}</td>
                        <td className="py-sm px-md text-secondary font-mono">{log.ip}</td>
                        <td className="py-sm px-md text-on-surface">{log.device}</td>
                        <td className="py-sm px-md text-on-surface">{log.duration}</td>
                        <td className="py-sm px-md text-on-surface">{log.workspace}</td>
                        <td className="py-sm px-md">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm font-bold ${
                            log.status === 'Success'
                              ? 'bg-success/10 text-success'
                              : log.status === 'Failed'
                              ? 'bg-[#FF5630]/10 text-[#FF5630]'
                              : 'bg-[#FFAB00]/10 text-[#FFAB00]'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-md border-t border-border-subtle flex justify-between items-center bg-surface-white">
              <span className="font-body-sm text-body-sm text-secondary">
                Showing {loginLogs.length} login event{loginLogs.length === 1 ? '' : 's'} (last 30 days)
              </span>
            </div>
          </div>
        )}

        {/* Activity Log Tab Panel */}
        {activeTab === 'activity-log' && (
          <div className="flex flex-col">
            {/* Warning tamper banner */}
            <div className="bg-[#DEEBFF] px-md py-sm flex items-center gap-sm border-b border-border-subtle">
              <span className="material-symbols-outlined text-[#0052CC] text-[18px]">lock</span>
              <span className="font-body-sm text-body-sm text-[#0052CC] font-medium">
                This log is read-only. System actions cannot be modified or deleted.
              </span>
            </div>

            {/* Filter select bar inputs */}
            <div className="p-md border-b border-border-subtle bg-surface-container-lowest flex flex-col sm:flex-row items-end gap-md">
              <div className="flex flex-col gap-xs flex-1 max-w-xs w-full">
                <label className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Module</label>
                <div className="relative">
                  <select
                    className="w-full h-[32px] pl-3 pr-8 rounded border border-border-subtle bg-surface-white text-body-sm font-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                  >
                    <option>All Modules</option>
                    {moduleOptions.map((mod) => (
                      <option key={mod}>{mod}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
                </div>
              </div>
              <button
                onClick={handleExportActivity}
                disabled={filteredActivities.length === 0}
                className="h-[32px] px-md rounded bg-surface-white border border-border-subtle text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors sm:ml-auto flex items-center gap-xs cursor-pointer disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>Export CSV
              </button>
            </div>

            {/* Activity entries table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bright border-b border-border-subtle">
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Timestamp</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Action</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Module</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Target ID</th>
                    <th className="py-sm px-md font-label-md text-label-md text-secondary font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={5} className="p-xl text-center text-outline font-body-sm text-sm">
                        Loading activity log...
                      </td>
                    </tr>
                  ) : filteredActivities.length > 0 ? (
                    filteredActivities.map((act, index) => (
                      <tr key={index} className="border-b border-border-subtle hover:bg-row-hover transition-colors group cursor-pointer">
                        <td className="py-md px-md whitespace-nowrap text-secondary">{act.timestamp}</td>
                        <td className="py-md px-md">
                          <span className="inline-flex items-center px-2 py-1 rounded font-medium bg-surface-container-high text-on-surface">
                            {act.action}
                          </span>
                        </td>
                        <td className="py-md px-md">{act.module}</td>
                        <td className="py-md px-md font-mono text-xs text-secondary">{act.targetId}</td>
                        <td className="py-md px-md text-secondary max-w-xs truncate group-hover:text-on-surface">{act.details}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-xl text-center text-outline font-body-sm text-sm">
                        No activity records found for this staff member.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-md flex justify-between items-center bg-surface-white border-t border-border-subtle text-body-sm font-body-sm text-secondary">
              <span>
                Showing {filteredActivities.length} activit{filteredActivities.length === 1 ? 'y' : 'ies'}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
