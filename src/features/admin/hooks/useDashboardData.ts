import { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  department: string;
  message: string;
  timestamp: string;
}

export interface Department {
  id: string;
  name: string;
  staffCount: number;
  queueCount: number;
  status: 'success' | 'warning' | 'error';
  alerts: number;
  occupancy?: number;
}

export interface DashboardStats {
  totalStaff: number;
  onlineNow: number;
  departmentsActive: number;
  bedsOccupied: number;
  totalBeds: number;
}

// Custom hook to fetch dynamic telemetry for the hospital dashboard
export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    onlineNow: 0,
    departmentsActive: 0,
    bedsOccupied: 0,
    totalBeds: 0
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, departmentsRes, alertsRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.listDepartments(),
        adminService.getDashboardAlerts()
      ]);

      if (statsRes) {
        setStats(statsRes);
      }
      if (departmentsRes) {
        setDepartments(departmentsRes as Department[]);
      }
      if (alertsRes) {
        setAlerts(alertsRes as Alert[]);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboardData();
  }, []);

  // Refresh operational stats
  const refreshTelemetry = () => {
    fetchDashboardData();
  };

  return {
    stats,
    alerts,
    departments,
    loading,
    refreshTelemetry
  };
};
