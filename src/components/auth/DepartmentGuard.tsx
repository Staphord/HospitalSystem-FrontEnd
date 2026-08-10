import React from 'react';
import { Outlet } from 'react-router-dom';
import { useDepartmentStatus } from '@/hooks/useDepartmentStatus';

interface DepartmentGuardProps {
  moduleName: 'reception' | 'triage' | 'consultation' | 'laboratory' | 'radiology' | 'pharmacy' | 'ward' | 'billing';
  children?: React.ReactNode;
}

export function DepartmentGuard({ moduleName, children }: DepartmentGuardProps) {
  const { getDepartmentStatus } = useDepartmentStatus();
  
  const { isInactive, deptName } = getDepartmentStatus(moduleName);

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
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-surface-white border border-border-subtle rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-error/10 text-error flex items-center justify-center">
          <span className="material-symbols-outlined text-[36px]">block</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface">Department Temporarily Suspended</h2>
        <p className="text-secondary text-sm max-w-md mx-auto">
          The <strong>{deptName || moduleName}</strong> department is currently deactivated by the hospital administration. Operational access to this module is temporarily suspended.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all border-0 cursor-pointer shadow-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children || <Outlet />}</>;
}

