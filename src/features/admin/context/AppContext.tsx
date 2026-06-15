import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDashboardData, type Alert, type Department, type DashboardStats } from '../hooks/useDashboardData';
import { useStaffOperations, type StaffMember } from '../hooks/useStaffOperations';
import { useSessionsData, type ActiveSession } from '../hooks/useSessionsData';

export type AppView =
  | 'login'
  | 'dashboard'
  | 'staff'
  | 'sessions'
  | 'departments'
  | 'fees'
  | 'insurance'
  | 'settings'
  | 'reports-patient'
  | 'reports-revenue'
  | 'reports-operational'
  | 'audit'
  | 'backup'
  | 'subscription'
  | 'add-staff'
  | 'edit-staff'
  | 'staff-detail';

interface NavigationOptions {
  staffId?: string | null;
  replace?: boolean;
}

interface AppContextType {
  activeView: AppView;
  setActiveView: (view: AppView, options?: NavigationOptions) => void;
  selectedStaffId: string | null;
  setSelectedStaffId: (id: string | null) => void;
  
  // Staff Data & Actions
  staffList: StaffMember[];
  staffError: string | null;
  addStaff: (data: Omit<StaffMember, 'id' | 'status' | 'createdAt'>) => boolean;
  updateStaff: (id: string, data: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  clearStaffError: () => void;

  // Session Data & Actions
  sessions: ActiveSession[];
  revokeSession: (sessionId: string) => void;

  // Telemetry & Feed Data
  stats: DashboardStats;
  alerts: Alert[];
  departments: Department[];
  refreshTelemetry: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const viewToRouteMap: Record<Exclude<AppView, 'staff-detail' | 'edit-staff' | 'login'>, string> = {
  dashboard: '/admin/dashboard',
  staff: '/admin/staff',
  'add-staff': '/admin/staff/new',
  sessions: '/admin/sessions',
  departments: '/admin/departments',
  fees: '/admin/fees',
  insurance: '/admin/insurance',
  settings: '/admin/settings',
  'reports-patient': '/admin/reports/patients',
  'reports-revenue': '/admin/reports/revenue',
  'reports-operational': '/admin/reports/operations',
  audit: '/admin/audit-logs',
  backup: '/admin/backup',
  subscription: '/admin/subscription'
};

const getActiveViewFromPath = (path: string): AppView => {
  if (path === '/dashboard' || path === '/admin/dashboard') return 'dashboard';
  if (path === '/admin/staff') return 'staff';
  if (path === '/admin/staff/new') return 'add-staff';
  if (path.match(/^\/admin\/staff\/[^/]+\/edit$/)) return 'edit-staff';
  if (path.match(/^\/admin\/staff\/[^/]+$/)) return 'staff-detail';
  if (path === '/admin/sessions') return 'sessions';
  if (path === '/admin/departments') return 'departments';
  if (path === '/admin/fees') return 'fees';
  if (path === '/admin/insurance') return 'insurance';
  if (path === '/admin/settings') return 'settings';
  if (path === '/admin/reports/patients') return 'reports-patient';
  if (path === '/admin/reports/revenue') return 'reports-revenue';
  if (path === '/admin/reports/operations') return 'reports-operational';
  if (path === '/admin/audit-logs') return 'audit';
  if (path === '/admin/backup') return 'backup';
  if (path === '/admin/subscription') return 'subscription';
  return 'dashboard';
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [activeView, setActiveViewState] = useState<AppView>(getActiveViewFromPath(location.pathname));
  const [selectedStaffId, setSelectedStaffIdState] = useState<string | null>(params.id || null);

  const dashboardData = useDashboardData();
  const staffOps = useStaffOperations();
  const sessionOps = useSessionsData();

  useEffect(() => {
    setActiveViewState(getActiveViewFromPath(location.pathname));
    setSelectedStaffIdState(params.id || null);
  }, [location.pathname, params.id]);

  const setSelectedStaffId = useCallback((id: string | null) => {
    setSelectedStaffIdState(id);
  }, []);

  const setActiveView = useCallback((view: AppView, options: NavigationOptions = {}) => {
    if (view === 'login') {
      navigate('/login');
      return;
    }

    const nextStaffId = options.staffId !== undefined ? options.staffId : selectedStaffId;
    let nextRoute = '';

    if (view === 'staff-detail') {
      nextRoute = nextStaffId ? `/admin/staff/${encodeURIComponent(nextStaffId)}` : '/admin/staff';
    } else if (view === 'edit-staff') {
      nextRoute = nextStaffId ? `/admin/staff/${encodeURIComponent(nextStaffId)}/edit` : '/admin/staff';
    } else {
      nextRoute = viewToRouteMap[view] || '/dashboard';
    }

    navigate(nextRoute, { replace: options.replace });
  }, [navigate, selectedStaffId]);

  const computedStats: DashboardStats = {
    totalStaff: staffOps.staffList.length,
    onlineNow: sessionOps.sessions.length,
    departmentsActive: dashboardData.departments.filter(d => d.staffCount > 0).length,
    bedsOccupied: dashboardData.stats.bedsOccupied,
    totalBeds: dashboardData.stats.totalBeds
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedStaffId,
        setSelectedStaffId,
        staffList: staffOps.staffList,
        staffError: staffOps.error,
        addStaff: staffOps.addStaff,
        updateStaff: staffOps.updateStaff,
        deleteStaff: staffOps.deleteStaff,
        clearStaffError: staffOps.clearError,
        sessions: sessionOps.sessions,
        revokeSession: sessionOps.revokeSession,
        stats: computedStats,
        alerts: dashboardData.alerts,
        departments: dashboardData.departments,
        refreshTelemetry: dashboardData.refreshTelemetry
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
