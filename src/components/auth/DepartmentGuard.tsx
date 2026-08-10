import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDepartmentStatus } from '@/hooks/useDepartmentStatus';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface DepartmentGuardProps {
  moduleName: 'reception' | 'triage' | 'consultation' | 'laboratory' | 'radiology' | 'pharmacy' | 'ward' | 'billing';
  children?: React.ReactNode;
}

export function DepartmentGuard({ moduleName, children }: DepartmentGuardProps) {
  const { getDepartmentStatus } = useDepartmentStatus();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  
  const { isInactive, deptName } = getDepartmentStatus(moduleName);

  useEffect(() => {
    if (isInactive) {
      clearAuth();
      const message = `The ${deptName || moduleName} department has been temporarily deactivated by hospital administration. You have been logged out.`;
      toast.error(message, { id: 'dept-deactivated-toast', duration: 6000 });
      navigate('/login', { replace: true });
    }
  }, [isInactive, deptName, moduleName, clearAuth, navigate]);

  if (isInactive === null) {
    // Show strict loading state to prevent flash of unprotected content
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-ground">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-secondary font-medium animate-pulse">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (isInactive) {
    return null;
  }

  return <>{children || <Outlet />}</>;
}


