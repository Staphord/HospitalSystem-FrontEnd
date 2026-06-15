import { useState } from 'react';

export interface ActiveSession {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  avatarUrl: string;
  department: string;
  loginTime: string;
  duration?: string;
  device: string;
  ipAddress: string;
}

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'SES-9001',
    staffId: 'ST-1001',
    staffName: 'Dr. Sarah Chen',
    staffRole: 'Doctor',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsFdwJlsoEY6YWqUIzmDuyNBBS_giKeGh6IjYOOy7Q-EY5W5fAQNKZL3HDwdPSwXKA78U_cMRLt_nslrSsHcY9ryh1PfVIUn9ZtMg84PIGbTeE-mMVs-Tnk4fJAulw3W0coEjqlWw8bWedLbW2QqIQswxG9Vq1F8-CaYZiSrwvd2GRgdPO8E5iNSZU2hgMwzP36sNtmOvvq-lbv830dbyCdwn5dMVi4AMuTuIjggH6dSJc0cSP49DzppYMc',
    department: 'Consultation',
    loginTime: '08:15 AM',
    duration: '2h 14m',
    device: 'MacBook Pro • Chrome',
    ipAddress: '196.43.12.89'
  },
  {
    id: 'SES-9002',
    staffId: 'ST-1002',
    staffName: 'Nurse James O.',
    staffRole: 'Nurse',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLtrAwAy1k-muCJdZ_8Qx09eWqn8dUzlstfzbJLXK6u3YE2Ti0UHrqQr7MCaXC0fz7690sfJqWL9ivTACYrImVx7LphuaY__vgVJlbYK1ySkQKRJ7uZCS86vDr-ib1QnBNTtJtnRAJTATBNKB48t3dKlETUaIZ4LX3YQ4Qj86JX6JLVb4Ra56_PdD5WVLEdIcjIFjYb7gHWooxhM5DUqiWfvVdeQX1CV6PsuF8xPtQSPhboAi4nZ8ONOFMnc',
    department: 'Triage',
    loginTime: '07:45 AM',
    duration: '1h 41m',
    device: 'iPad Air • Safari',
    ipAddress: '196.43.12.92'
  },
  {
    id: 'SES-9003',
    staffId: 'ST-1003',
    staffName: 'Tech Ali M.',
    staffRole: 'Tech',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLttGcflTJkMQI6Om6qQ-pDJlZa2NlNycuozOul20T7KsNKwYjjfxQaop6wYRUyeiz2C6t7ivfOOPhUOS7F-xU6xHxiFzsPP0LJp_5o3BWTa9rR4IRqfCs-bWfQedR3q-Ck6Dgjh5xd0-z00Z5wz8uvGAvp3e_l2mLQbUpoT7xKefYWDQNxkoGM3WFE8gypH5E8Vzq9PTNWaxa4bYY7vUlNmRKcX4QaLUXw8pyrpzamjQthWZXJ3A7UxcQNU',
    department: 'Laboratory',
    loginTime: '08:30 AM',
    duration: '57m',
    device: 'Windows Workstation • Edge',
    ipAddress: '196.43.12.101'
  }
];

// Seed dummy sessions to match online count telemetry (23 total sessions)
for (let i = 4; i <= 23; i++) {
  INITIAL_SESSIONS.push({
    id: `SES-90${i < 10 ? '0' + i : i}`,
    staffId: `ST-10${i < 10 ? '0' + i : i}`,
    staffName: `Staff Member ${i}`,
    staffRole: i % 2 === 0 ? 'Nurse' : 'Doctor',
    avatarUrl: '',
    department: i % 3 === 0 ? 'General Surgery' : 'Pediatrics',
    loginTime: `07:${i < 10 ? '0' + i : i} AM`,
    device: 'Generic Desktop • Firefox',
    ipAddress: `196.43.12.${100 + i}`
  });
}

// Hook managing active logged-in user sessions
export const useSessionsData = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);

  // Terminate a user session
  const revokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  return {
    sessions,
    revokeSession
  };
};
