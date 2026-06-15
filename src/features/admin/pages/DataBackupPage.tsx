import React, { useState } from 'react';
import { useApp } from '@/features/admin/context/AppContext';

interface BackupHistoryRow {
  timestamp: string;
  size: string;
  status: 'Successful' | 'Failed';
  duration: string;
}

export const DataBackupPage: React.FC = () => {
  const { setActiveView } = useApp();
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [backupTriggered, setBackupTriggered] = useState(false);

  const backupHistory: BackupHistoryRow[] = [
    { timestamp: 'Oct 24, 2023 06:00 EAT', size: '2.4 GB', status: 'Successful', duration: '4m 12s' },
    { timestamp: 'Oct 24, 2023 00:00 EAT', size: '2.4 GB', status: 'Successful', duration: '4m 08s' },
    { timestamp: 'Oct 23, 2023 18:00 EAT', size: '2.3 GB', status: 'Successful', duration: '3m 55s' },
    { timestamp: 'Oct 23, 2023 12:00 EAT', size: '2.3 GB', status: 'Successful', duration: '4m 02s' },
    { timestamp: 'Oct 23, 2023 06:00 EAT', size: '2.3 GB', status: 'Successful', duration: '3m 48s' },
  ];

  const handleTriggerBackup = () => {
    setIsBackupRunning(true);
    setBackupTriggered(false);
    setTimeout(() => {
      setIsBackupRunning(false);
      setBackupTriggered(true);
      setTimeout(() => {
        setBackupTriggered(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-lg">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-xs text-secondary">
            <span className="font-label-sm text-label-sm">System</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary">Data Backup</span>
          </nav>
        </div>
      </div>

      <div className="bg-row-hover border border-primary-container rounded-lg p-md flex gap-md items-start shadow-sm">
        <span className="material-symbols-outlined text-primary-container p-1" style={{ fontVariationSettings: "'FILL' 1" }}>
          lock
        </span>
        <p className="text-body-md text-on-secondary-fixed-variant leading-relaxed">
          Backup schedule is controlled by your subscription plan (Standard: every 6 hours). Manual backups can be
          triggered at any time to ensure the most recent clinical records are safely preserved outside of scheduled
          windows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="bg-surface-white border border-border-subtle rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Last Backup</h3>
            <span className="text-label-sm font-label-md text-secondary uppercase tracking-wider">System Status</span>
          </div>
          <div className="p-lg flex flex-col gap-md bg-surface-white">
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success">
                <span className="material-symbols-outlined text-headline-md" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <div>
                <p className="font-headline-sm text-headline-sm text-success">Successful</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">All clinical databases synced correctly</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-md py-md bg-surface-container-low rounded-lg px-md">
              <div>
                <p className="font-label-md text-label-md text-secondary uppercase">Timestamp</p>
                <p className="font-body-md text-body-md text-on-surface font-semibold">Today 06:00 EAT</p>
              </div>
              <div>
                <p className="font-label-md text-label-md text-secondary uppercase">Size</p>
                <p className="font-body-md text-body-md text-on-surface font-semibold">2.4 GB</p>
              </div>
            </div>
            <button
              onClick={handleTriggerBackup}
              disabled={isBackupRunning || backupTriggered}
              className={`w-full h-10 rounded font-label-md text-label-md transition-all active:scale-[0.98] flex items-center justify-center gap-sm text-white ${
                backupTriggered
                  ? 'bg-success hover:bg-success/90'
                  : 'bg-primary-container hover:bg-primary'
              }`}
            >
              {isBackupRunning ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Initializing...
                </>
              ) : backupTriggered ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  Backup Triggered
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  Run Manual Backup
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl flex flex-col overflow-hidden shadow-sm">
          <div className="px-lg py-md border-b border-border-subtle flex justify-between items-center bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Backup Schedule</h3>
            <span className="text-label-sm font-label-md text-secondary tracking-wider">Configuration</span>
          </div>
          <div className="p-lg flex flex-col gap-lg bg-surface-white">
            <div className="space-y-md">
              <div className="space-y-base">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase">Frequency</label>
                <div className="flex items-center justify-between p-sm bg-surface-container border border-border-subtle rounded text-secondary cursor-not-allowed">
                  <span className="font-body-md text-body-md">Every 6 hours (Standard Plan)</span>
                  <span className="material-symbols-outlined text-sm">lock</span>
                </div>
              </div>
              <div className="space-y-base">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase">Retention Period</label>
                <div className="flex items-center justify-between p-sm bg-surface-container border border-border-subtle rounded text-secondary cursor-not-allowed">
                  <span className="font-body-md text-body-md">30 days</span>
                  <span className="material-symbols-outlined text-sm">lock</span>
                </div>
              </div>
            </div>
            <div className="pt-md border-t border-border-subtle flex flex-col gap-sm">
              <p className="font-body-sm text-body-sm text-secondary">To change backup frequency, upgrade your plan.</p>
              <button
                type="button"
                onClick={() => setActiveView('subscription')}
                className="text-primary font-label-md text-label-md flex items-center gap-xs hover:underline bg-transparent border-none cursor-pointer p-0 w-fit"
              >
                View Subscription <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-md bg-surface-white">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Backup History</h3>
            <p className="font-body-sm text-label-sm text-secondary">Complete log of all automated and manual snapshots</p>
          </div>
          <div className="flex items-center gap-sm">
            <button className="px-md py-sm bg-surface-white border border-border-subtle rounded text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filter
            </button>
            <button className="px-md py-sm bg-surface-white border border-border-subtle rounded text-secondary font-label-md text-label-md hover:bg-surface-container-low transition-colors flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle">TIMESTAMP</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle">SIZE</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle">STATUS</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle">DURATION</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-white">
              {backupHistory.map((row, idx) => (
                <tr key={idx} className="hover:bg-row-hover transition-colors">
                  <td className="px-lg py-md font-body-md text-body-md text-on-surface">{row.timestamp}</td>
                  <td className="px-lg py-md font-body-md text-body-md text-on-surface">{row.size}</td>
                  <td className="px-lg py-md">
                    <span className="px-sm py-1 bg-success/15 text-success rounded-full text-label-sm font-label-md inline-block font-semibold">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-lg py-md font-body-md text-body-md text-on-surface-variant">{row.duration}</td>
                  <td className="px-lg py-md">
                    <a className="text-primary font-label-md text-label-md hover:underline flex items-center gap-xs" href="#" onClick={e => e.preventDefault()}>
                      <span className="material-symbols-outlined text-[18px]">download</span> Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex items-center justify-between">
          <p className="font-body-sm text-label-sm text-secondary">Showing 5 of 120 backup records</p>
          <div className="flex items-center gap-sm">
            <button className="p-1 hover:bg-surface-variant rounded disabled:opacity-30" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="font-label-md text-label-md text-on-surface">Page 1 of 24</span>
            <button className="p-1 hover:bg-surface-variant rounded">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
