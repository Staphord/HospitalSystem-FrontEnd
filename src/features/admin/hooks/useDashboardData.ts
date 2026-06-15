import { useState } from 'react';

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

// Custom hook to fetch static mockup telemetry for the hospital dashboard
export const useDashboardData = () => {
  const [stats] = useState<DashboardStats>({
    totalStaff: 47,
    onlineNow: 23,
    departmentsActive: 8,
    bedsOccupied: 34,
    totalBeds: 50
  });

  const [alerts] = useState<Alert[]>([
    {
      id: 'AL-001',
      severity: 'critical',
      department: 'Laboratory',
      message: 'Critical lab value for patient #PT-4421',
      timestamp: '5 min ago'
    },
    {
      id: 'AL-002',
      severity: 'warning',
      department: 'Pharmacy',
      message: 'Paracetamol stock below minimum level',
      timestamp: '12 min ago'
    },
    {
      id: 'AL-003',
      severity: 'info',
      department: 'System',
      message: 'Scheduled maintenance starting in 2 hours',
      timestamp: '1 hr ago'
    }
  ]);

  const [departments] = useState<Department[]>([
    { id: 'DP-001', name: 'Reception', staffCount: 4, queueCount: 12, status: 'success', alerts: 0 },
    { id: 'DP-002', name: 'Triage', staffCount: 3, queueCount: 5, status: 'success', alerts: 0 },
    { id: 'DP-003', name: 'Consultation', staffCount: 8, queueCount: 18, status: 'success', alerts: 0 },
    { id: 'DP-004', name: 'Laboratory', staffCount: 6, queueCount: 22, status: 'error', alerts: 1 },
    { id: 'DP-005', name: 'Radiology', staffCount: 4, queueCount: 3, status: 'success', alerts: 0 },
    { id: 'DP-006', name: 'Pharmacy', staffCount: 5, queueCount: 15, status: 'warning', alerts: 1 },
    { id: 'DP-007', name: 'Billing', staffCount: 3, queueCount: 2, status: 'success', alerts: 0 },
    { id: 'DP-008', name: 'Ward', staffCount: 14, queueCount: 0, occupancy: 68, status: 'success', alerts: 0 }
  ]);

  // Refresh operational stats
  const refreshTelemetry = () => {
    console.log('Telemetry refreshed.');
  };

  return {
    stats,
    alerts,
    departments,
    refreshTelemetry
  };
};
