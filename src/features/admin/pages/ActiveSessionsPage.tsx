import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// Renders the active session monitor with bento metrics, table, chart, and security panel
export const ActiveSessionsPage: React.FC = () => {
  const { sessions, revokeSession, refreshSessions, setActiveView } = useApp();
  const [countdown, setCountdown] = useState(30);

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
  const doctorSessions = sessions.filter((s) => s.staffRole === 'doctor').length;
  const nurseSessions = sessions.filter((s) => s.staffRole === 'nurse').length;

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
          onClick={handleForceLogoutAll}
          className="h-[32px] px-md flex items-center gap-2 border border-error text-error rounded font-label-md hover:bg-error/5 transition-all"
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
              <p className="text-outline font-label-md uppercase tracking-wider mb-1">In Laboratory</p>
              <h3 className="font-headline-md text-[28px] text-on-surface">{nurseSessions}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-secondary-container/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">biotech</span>
            </div>
          </div>
        </div>
      </div>

      {/* All Connected Sessions table card */}
      <div className="bg-surface-white border border-border-subtle rounded-[16px] overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-container-lowest">
          <h4 className="font-headline-sm text-headline-sm text-on-surface">All Connected Sessions</h4>
          <div className="flex gap-sm">
            <button className="p-1.5 rounded hover:bg-surface-container-low text-outline">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-1.5 rounded hover:bg-surface-container-low text-outline">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-lg py-3 font-label-md text-outline uppercase tracking-wider">Staff Name</th>
                <th className="px-md py-3 font-label-md text-outline uppercase tracking-wider">Role</th>
                <th className="px-md py-3 font-label-md text-outline uppercase tracking-wider">Active Workspace</th>
                <th className="px-md py-3 font-label-md text-outline uppercase tracking-wider">Login Time</th>
                <th className="px-md py-3 font-label-md text-outline uppercase tracking-wider">Duration</th>
                <th className="px-md py-3 font-label-md text-outline uppercase tracking-wider">IP / Device</th>
                <th className="px-lg py-3 font-label-md text-outline uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {sessions.length > 0 ? (
                sessions.map((session) => (
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
                        session.staffRole === 'doctor'
                          ? 'bg-primary/10 text-primary'
                          : session.staffRole === 'nurse'
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
                        onClick={() => handleRevoke(session.id, session.staffName)}
                        aria-label={`Revoke access for ${session.staffName}`}
                        className="text-primary font-label-md hover:underline"
                      >
                        Logout
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-xl text-center text-outline font-body-sm text-sm">
                    No active system sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-lg py-md border-t border-border-subtle flex items-center justify-between bg-surface-container-lowest/30">
          <span className="text-[12px] text-outline">Showing {sessions.length} active sessions</span>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded border border-border-subtle opacity-30 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="p-1 rounded border border-border-subtle hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security audit link card */}
      <div className="bg-primary-container text-white rounded-[16px] p-lg flex flex-col md:flex-row items-center justify-between gap-md">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
          <div>
            <h4 className="font-headline-sm text-headline-sm mb-1">Security Audit</h4>
            <p className="text-white/80 font-body-sm">
              Review the full audit trail for login activity and session revocations.
            </p>
          </div>
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
