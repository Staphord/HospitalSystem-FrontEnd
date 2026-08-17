import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/api/client'

let globalDeptsPromise: Promise<any[]> | null = null
let globalDeptsCache: any[] | null = null

export function clearDepartmentCache() {
  globalDeptsCache = null
  globalDeptsPromise = null
}

async function fetchDepartmentStatuses(): Promise<any[]> {
  const res = await apiClient.get<
    Array<{ department_id: string; department_name: string; department_type: string; is_active: boolean }>
  >('/admin/shared/departments')
  return res.data.map((d) => ({
    id: d.department_id,
    name: d.department_name,
    type: d.department_type,
    active: d.is_active,
  }))
}

export function useDepartmentStatus() {
  const [departments, setDepartments] = useState<any[]>(globalDeptsCache || [])
  const [isLoading, setIsLoading] = useState(!globalDeptsCache)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (globalDeptsCache) {
      setDepartments(globalDeptsCache)
      setIsLoading(false)
      return
    }

    if (!globalDeptsPromise) {
      globalDeptsPromise = fetchDepartmentStatuses()
    }

    let mounted = true
    globalDeptsPromise
      .then((depts) => {
        globalDeptsCache = depts
        if (mounted) {
          setDepartments(depts)
          setIsLoading(false)
          setIsError(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load department statuses:', err)
        globalDeptsPromise = null // Clear failed promise to allow retry
        if (mounted) {
          setIsError(true)
          setIsLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const getDepartmentStatus = useCallback(
    (moduleName: string) => {
      const formattedFallback = moduleName
        ? moduleName.charAt(0).toUpperCase() + moduleName.slice(1)
        : 'Department'

      if (isLoading) return { isInactive: false, isUnavailable: false, isPending: true, deptName: '' }

      // CRITICAL FIX: On network/API error, treat status as UNAVAILABLE, not INACTIVE.
      // Do NOT log out user because of department API network errors or timeouts.
      if (isError) return { isInactive: false, isUnavailable: true, isPending: false, deptName: formattedFallback }

      const m = moduleName.toLowerCase()
      const target = departments.find((d) => {
        const t = (d.type || '').toLowerCase()
        const n = (d.name || '').toLowerCase()
        const id = (d.id || '').toLowerCase()
        return (
          t.includes(m) ||
          n.includes(m) ||
          id.includes(m) ||
          (m === 'consultation' &&
            (t.includes('doctor') ||
              n.includes('doctor') ||
              t.includes('clinical') ||
              n.includes('clinical') ||
              t.includes('outpatient') ||
              n.includes('outpatient'))) ||
          (m === 'reception' && (t.includes('registration') || n.includes('registration'))) ||
          (m === 'laboratory' && (t.includes('lab') || n.includes('lab'))) ||
          (m === 'radiology' &&
            (t.includes('imaging') || n.includes('imaging') || t.includes('x-ray') || n.includes('x-ray'))) ||
          (m === 'pharmacy' && (t.includes('dispensary') || n.includes('dispensary')))
        )
      })

      if (target) {
        return {
          isInactive: target.active === false,
          isUnavailable: false,
          isPending: false,
          deptName: target.name,
        }
      }
      return { isInactive: false, isUnavailable: false, isPending: false, deptName: formattedFallback }
    },
    [departments, isLoading, isError],
  )

  return { isLoading, isError, getDepartmentStatus }
}
