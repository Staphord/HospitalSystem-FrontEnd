import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/api/services/admin';

let globalDeptsPromise: Promise<any[]> | null = null;
let globalDeptsCache: any[] | null = null;

export function useDepartmentStatus() {
  const [departments, setDepartments] = useState<any[]>(globalDeptsCache || []);
  const [isLoading, setIsLoading] = useState(!globalDeptsCache);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (globalDeptsCache) {
      setDepartments(globalDeptsCache);
      setIsLoading(false);
      return;
    }

    if (!globalDeptsPromise) {
      globalDeptsPromise = adminService.listDepartments();
    }

    let mounted = true;
    globalDeptsPromise
      .then((depts) => {
        globalDeptsCache = depts;
        if (mounted) {
          setDepartments(depts);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load department statuses:', err);
        if (mounted) {
          setIsError(true);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const getDepartmentStatus = useCallback((moduleName: string) => {
    if (isLoading) return { isInactive: null, deptName: '' };
    if (isError) return { isInactive: false, deptName: '' }; // Fail open on error
    
    const m = moduleName.toLowerCase();
    const target = departments.find((d) => {
      const t = (d.type || '').toLowerCase();
      const n = (d.name || '').toLowerCase();
      const id = (d.id || '').toLowerCase();
      return (
        t.includes(m) ||
        n.includes(m) ||
        id.includes(m) ||
        (m === 'consultation' && (t.includes('doctor') || n.includes('doctor') || t.includes('clinical') || n.includes('clinical') || t.includes('outpatient') || n.includes('outpatient'))) ||
        (m === 'reception' && (t.includes('registration') || n.includes('registration'))) ||
        (m === 'laboratory' && (t.includes('lab') || n.includes('lab'))) ||
        (m === 'radiology' && (t.includes('imaging') || n.includes('imaging') || t.includes('x-ray') || n.includes('x-ray'))) ||
        (m === 'pharmacy' && (t.includes('dispensary') || n.includes('dispensary')))
      );
    });

    if (target) {
      return { isInactive: target.active === false, deptName: target.name };
    }
    return { isInactive: false, deptName: '' };
  }, [departments, isLoading, isError]);

  return { isLoading, isError, getDepartmentStatus };
}
