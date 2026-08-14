import { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

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

// Hook managing active logged-in user sessions
export const useSessionsData = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);

  const syncSessions = async () => {
    const state = useAuthStore.getState();
    const isHospitalAdmin = (state.roles || []).includes('hospital_admin') || state.user?.role === 'hospital_admin';
    if (!isHospitalAdmin) {
      return;
    }

    try {
      const data = await adminService.listActiveSessions();
      if (data) {
        setSessions(data as ActiveSession[]);
      }
    } catch (err) {
      console.error('Failed to sync active sessions:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncSessions();
  }, []);

  // Terminate a user session
  const revokeSession = (sessionId: string) => {
    adminService.revokeSession(sessionId)
      .then(() => {
        toast.success('Session revoked.');
        syncSessions();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to revoke session.');
      });
  };

  return {
    sessions,
    revokeSession,
    refreshSessions: syncSessions
  };
};
