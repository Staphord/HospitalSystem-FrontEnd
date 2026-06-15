import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// Renders the active session monitor with bento metrics, table, chart, and security panel
export const ActiveSessionsPage: React.FC = () => {
  const { sessions, revokeSession, setActiveView } = useApp();
  const [countdown, setCountdown] = useState(30);

  // Counts down refresh indicator every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
  const idleCount = Math.max(0, sessions.length - doctorSessions - nurseSessions);

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
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
          <div className="mt-2 flex items-center gap-1 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-[11px] font-medium">+12% vs last hr</span>
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
          <div className="mt-2 flex items-center gap-1 text-success">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-[11px] font-medium">Stable load</span>
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
          <div className="mt-2 flex items-center gap-1 text-error">
            <span className="material-symbols-outlined text-[16px]">trending_down</span>
            <span className="text-[11px] font-medium">-2 from peak</span>
          </div>
        </div>

        {/* Idle */}
        <div className="bg-surface-white border border-border-subtle p-md rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-outline font-label-md uppercase tracking-wider mb-1">Idle (&gt;10min)</p>
              <h3 className="font-headline-md text-[28px] text-on-surface">{idleCount}</h3>
            </div>
            <div className="w-10 h-10 rounded bg-warning/10 flex items-center justify-center text-warning">
              <span className="material-symbols-outlined text-[24px]">hourglass_empty</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-warning">
            <span className="material-symbols-outlined text-[16px]">priority_high</span>
            <span className="text-[11px] font-medium">Requires attention</span>
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

      {/* Monitoring chart + security audit bento row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Concurrent sessions chart */}
        <div className="md:col-span-2 bg-surface-white border border-border-subtle rounded-[16px] p-lg">
          <div className="flex justify-between items-center mb-md">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Concurrent Sessions (24h)</h4>
            <div className="flex items-center gap-md">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="font-label-md text-outline">Total</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success" />
                <span className="font-label-md text-outline">Mobile</span>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-1 mt-md">
            {[20, 25, 15, 40, 65, 85, 95, 100, 80, 60, 30, 15].map((h, i) => (
              <div
                key={i}
                className={`w-full rounded-t-sm ${h > 50 ? 'bg-primary' : 'bg-surface-container-low'}`}
                style={{ height: `${h}%`, opacity: h > 50 ? Math.min(1, 0.5 + h / 200) : 1 }}
              />
            ))}
          </div>
        </div>

        {/* Security audit card */}
        <div className="bg-primary-container text-white rounded-[16px] p-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-md">
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
              <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase">System Stable</span>
            </div>
            <h4 className="font-headline-sm text-headline-sm mb-2">Security Audit</h4>
            <p className="text-white/80 font-body-sm">
              No suspicious IP movements or multiple logins detected in the last 4 hours.
            </p>
          </div>
          <button
            onClick={() => setActiveView('audit')}
            className="mt-md w-full py-2 bg-white text-primary font-label-md rounded hover:bg-white/90 transition-all"
          >
            View Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
