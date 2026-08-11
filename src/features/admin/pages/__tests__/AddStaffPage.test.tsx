import { describe, it, expect } from 'vitest'
import { getLandingDepartmentForRole, ROLE_DEPARTMENT_MAP } from '../../hooks/useStaffOperations'

describe('Staff Role Landing Department Mapping', () => {
  it('correctly maps radiographer and radiology roles to Radiology department', () => {
    expect(getLandingDepartmentForRole('radiographer')).toBe('Radiology')
    expect(getLandingDepartmentForRole('radiologist')).toBe('Radiology')
    expect(getLandingDepartmentForRole('radiology')).toBe('Radiology')
    expect(getLandingDepartmentForRole('radiology_tech')).toBe('Radiology')
  })

  it('correctly maps clinical, lab, pharmacy, and cashier roles to their respective departments', () => {
    expect(getLandingDepartmentForRole('doctor')).toBe('Consultation')
    expect(getLandingDepartmentForRole('clinician')).toBe('Consultation')
    expect(getLandingDepartmentForRole('lab_technician')).toBe('Laboratory')
    expect(getLandingDepartmentForRole('pharmacist')).toBe('Pharmacy')
    expect(getLandingDepartmentForRole('cashier')).toBe('Billing')
    expect(getLandingDepartmentForRole('receptionist')).toBe('Reception')
  })

  it('falls back appropriately for admin and unknown roles', () => {
    expect(getLandingDepartmentForRole('hospital_admin')).toBe('Admin')
    expect(getLandingDepartmentForRole('unknown_role')).toBe('Admin')
  })
})
