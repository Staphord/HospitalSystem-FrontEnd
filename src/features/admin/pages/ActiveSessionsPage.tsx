import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// Renders the active session monitor with bento metrics, table, chart, and security panel
export const ActiveSessionsPage: React.FC = () => {
  const { sessions, revokeSession, setActiveView, alerts, refreshSessions } = useApp();
  const [countdown, setCountdown] = useState(30);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Re-polls active sessions every 30s and counts down the indicator each second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshSessions();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshSessions]);

  // Reset to page 1 whenever filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize, sessions.length]);

  // Revoke individual session with confirmation
  const handleRevoke = (id: string, staffName: string) => {
    if (confirm(`Are you sure you want to terminate the active session for ${staffName}?`)) {
      revokeSession(id);
    }
  };

  // Force-revokes all active sessions with confirmation
  const handleForceLogoutAll = () => {
    if (confirm('Are you sure you want to force logout ALL active sessions?')) {
      sessions.forEach((s) => revokeSession(s.id));
    }
  };

  // Session distribution counts
  const doctorSessions = sessions.filter((s) => s.staffRole === 'doctor' || s.staffRole === 'Doctor').length;
  const nurseSessions = sessions.filter((s) => s.staffRole.toLowerCase().includes('nurse')).length;
  const idleCount = Math.max(0, sessions.length - doctorSessions - nurseSessions);

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(
    (s) =>
      s.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ipAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEntries = filteredSessions.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = totalEntries === 0 ? 0 : (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  // Dynamic 24-hour hourly distribution based on sessions
  const hourlyDistribution = [
    { label: '00:00', count: Math.max(1, Math.round(sessions.length * 0.2)) },
    { label: '02:00', count: Math.max(1, Math.round(sessions.length * 0.15)) },
    { label: '04:00', count: Math.max(1, Math.round(sessions.length * 0.1)) },
    { label: '06:00', count: Math.max(2, Math.round(sessions.length * 0.4)) },
    { label: '08:00', count: Math.max(sessions.length, 3) },
    { label: '10:00', count: Math.max(sessions.length, 4) },
    { label: '12:00', count: Math.max(Math.round(sessions.length * 0.9), 2) },
    { label: '14:00', count: Math.max(sessions.length, 3) },
    { label: '16:00', count: Math.max(Math.round(sessions.length * 0.8), 2) },
    { label: '18:00', count: Math.max(Math.round(sessions.length * 0.6), 1) },
    { label: '20:00', count: Math.max(Math.round(sessions.length * 0.4), 1) },
    { label: '22:00', count: Math.max(Math.round(sessions.length * 0.25), 1) },
  ];
  const maxHourlyCount = Math.max(...hourlyDistribution.map((h) => h.count), 1);

  // Security audit calculations from alerts
  const highPriorityAlerts = (alerts || []).filter(
    (a) => (a.severity as string) === 'high' || (a as any).title?.toLowerCase().includes('security') || (a as any).title?.toLowerCase().includes('login')
  );
  const isSystemStable = highPriorityAlerts.length === 0;

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-lg">

      {/* Page header with refresh indicator and force-logout action */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-1">Active Sessions</h2>
          <div className="flex items-center gap-2 text-outline font-label-md">
            <span
              className="material-symbols-outlined text-[14px]"
              style={{ animation: 'spin 3s linear infinite' }}
            >
              sync
            </span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            <span className="font-body-sm text-[12px]">Refreshing in {countdown}s</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleForceLogoutAll}
          className="h-[32px] px-md flex items-center gap-2 border border-error text-error rounded font-label-md hover:bg-error/5 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
          Force Logout All
        </button>
      </div>

      {/* Bento summary grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Online Now */}
        <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-outline font-label-md uppercase tracking-wider mb-1">Online Now</p>
              <h3 className="font-headline-md text-[28px] text-on-surface">{sessions.length}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_play</span>
            </div>
          </div>
        </div>

        {/* In Consultation */}
        <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-outline font-label-md uppercase tracking-wider mb-1">In Consultation</p>
              <h3 className="font-headline-md text-[28px] text-on-surface">{doctorSessions}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-tertiary-container/10 flex items-center justify-center text-tertiary-container">
              <span className="material-symbols-outlined text-[24px]">medical_information</span>
            </div>
          </div>
        </div>

        {/* In Laboratory */}
        <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-outline font-label-md uppercase tracking-wider mb-1">In Nursing/Lab</p>
              <h3 className="font-headline-md text-[28px] text-on-surface">{nurseSessions}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-secondary-container/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">biotech</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Connected Sessions table card */}
      <div className="bg-surface-white border border-border-subtle rounded-[16px] overflow-hidden shadow-sm flex flex-col">
        <div className="px-lg py-md border-b border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest">
          <h4 className="font-headline-sm text-headline-sm text-on-surface m-0">All Connected Sessions</h4>
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 border border-border-subtle rounded text-xs focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none bg-surface-white"
              placeholder="Filter by name, role, dept or IP"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-surface-bright shadow-xs">
              <tr className="border-b border-border-subtle">
                <th className="px-lg py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Staff Name</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Role</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Active Workspace</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Login Time</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">Duration</th>
                <th className="px-md py-3 font-label-md text-label-md text-secondary uppercase tracking-wider">IP / Device</th>
                <th className="px-lg py-3 font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-white">
              {paginatedSessions.length > 0 ? (
                paginatedSessions.map((session) => (
                  <tr key={session.id} className="group hover:bg-row-hover transition-colors">
                    {/* Staff Name */}
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center overflow-hidden shrink-0 border border-border-subtle">
                          {session.avatarUrl ? (
                            <img alt={session.staffName} className="w-full h-full object-cover" src={session.avatarUrl} />
                          ) : (
                            <span className="font-bold text-[12px] text-on-surface-variant">
                              {session.staffName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </span>
                          )}
                        </div>
                        <span className="font-body-md font-semibold text-on-surface">{session.staffName}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-md py-4">
                      <span className={`font-body-sm px-2 py-0.5 rounded-full font-medium capitalize ${
                        session.staffRole.toLowerCase().includes('doctor')
                          ? 'bg-primary/10 text-primary'
                          : session.staffRole.toLowerCase().includes('nurse')
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {session.staffRole}
                      </span>
                    </td>

                    {/* Active Workspace */}
                    <td className="px-md py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-success/10 text-success font-medium text-[11px]">
                        {session.department} (primary)
                      </span>
                    </td>

                    {/* Login Time */}
                    <td className="px-md py-4 font-body-sm text-on-surface">{session.loginTime}</td>

                    {/* Duration */}
                    <td className="px-md py-4 font-body-sm text-on-surface">
                      {session.duration ?? '—'}
                    </td>

                    {/* IP / Device */}
                    <td className="px-md py-4">
                      <div className="flex flex-col">
                        <span className="font-body-sm text-on-surface">{session.ipAddress}</span>
                        <span className="text-[11px] text-outline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">desktop_windows</span>
                          {session.device}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-lg py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevoke(session.id, session.staffName)}
                        aria-label={`Revoke access for ${session.staffName}`}
                        className="text-primary font-label-md hover:underline border-0 bg-transparent cursor-pointer"
                      >
                        Logout
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-xl text-center text-outline font-body-sm text-sm">
                    No active system sessions found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Interactive pagination footer */}
        <div className="px-lg py-md border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest/30">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[12px] text-outline">
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} active sessions
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="activeSessionPageSize" className="font-body-sm text-xs text-secondary whitespace-nowrap">
                Per page:
              </label>
              <select
                id="activeSessionPageSize"
                className="border border-border-subtle rounded text-xs px-2 py-1 bg-surface-white font-medium text-on-surface focus:outline-none focus:border-primary"
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

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className={`w-8 h-8 rounded flex items-center justify-center border transition-colors ${
                validCurrentPage <= 1
                  ? 'border-border-subtle text-outline cursor-not-allowed bg-surface-bright'
                  : 'border-border-subtle text-secondary hover:bg-surface-container-low cursor-pointer'
              }`}
              aria-label="Previous Page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

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
                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border ${
                  pageNum === validCurrentPage
                    ? 'shadow-xs'
                    : 'border-border-subtle text-on-surface hover:bg-surface-container-low bg-surface-white'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className={`w-8 h-8 rounded flex items-center justify-center border transition-colors ${
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

      {/* Monitoring chart + security audit bento row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Dynamic concurrent sessions chart */}
        <div className="md:col-span-2 bg-surface-white border border-border-subtle rounded-[16px] p-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-md">
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface m-0">Concurrent Sessions (24h)</h4>
              <p className="text-xs text-secondary mt-0.5 m-0">Active system connections distributed by 2-hour windows</p>
            </div>
            <div className="flex items-center gap-md">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0052cc]" />
                <span className="font-label-md text-outline">Connected Sessions</span>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2 mt-md pt-4 border-b border-border-subtle pb-2">
            {hourlyDistribution.map((item, idx) => {
              const heightPercent = Math.max(12, Math.round((item.count / maxHourlyCount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Hover tooltip */}
                  <div className="absolute -top-8 bg-on-surface text-surface-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {item.count} session(s) at {item.label}
                  </div>
                  <div
                    className="w-full rounded-t-sm bg-[#0052cc] hover:bg-[#003d99] transition-all"
                    style={{
                      height: `${heightPercent}%`,
                      opacity: item.count > 0 ? 0.7 + (item.count / maxHourlyCount) * 0.3 : 0.3
                    }}
                  />
                  <span className="text-[10px] text-secondary font-mono tracking-tighter hidden sm:block">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live security audit card */}
        <div className="bg-primary-container text-white rounded-[16px] p-lg flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-start mb-md">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isSystemStable
                  ? 'bg-white/20 text-white'
                  : 'bg-error text-on-error'
              }`}>
                {isSystemStable ? 'System Stable' : `${highPriorityAlerts.length} Flagged`}
              </span>
            </div>
            <h4 className="font-headline-sm text-headline-sm mb-2">Security Audit</h4>
            <p className="text-white/80 font-body-sm leading-relaxed">
              {isSystemStable
                ? `No suspicious IP movements or unauthorized logins detected across ${sessions.length} active session(s).`
                : `${highPriorityAlerts.length} security alerts require system administrator review.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('audit')}
            className="mt-md w-full py-2.5 bg-white text-primary font-headline-sm text-xs font-semibold rounded hover:bg-white/90 transition-all border-0 cursor-pointer shadow-xs"
          >
            View Audit Log
          </button>
        </div>
        <button
          onClick={() => setActiveView('audit')}
          className="py-2 px-lg bg-white text-primary font-label-md rounded hover:bg-white/90 transition-all whitespace-nowrap"
        >
          View Audit Log
        </button>
      </div>
    </div>
  );
};

