import { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import { toast } from 'sonner';

export const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  doctor: 'Consultation',
  triage_nurse: 'Triage',
  ward_nurse: 'Ward',
  nurse: 'Triage',
  receptionist: 'Reception',
  lab_technician: 'Laboratory',
  tech: 'Laboratory',
  pharmacist: 'Pharmacy',
  billing_officer: 'Billing',
  hospital_admin: 'Admin',
  admin: 'Admin',
};

export const getLandingDepartmentForRole = (role: string): string => {
  return ROLE_DEPARTMENT_MAP[role] || 'Admin';
};

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'triage_nurse' | 'ward_nurse' | 'nurse' | 'hospital_admin' | 'admin' | 'lab_technician' | 'tech' | 'receptionist' | 'pharmacist' | 'billing_officer' | string;
  landingDepartment: string;
  additionalDepartments?: string[];
  mfaEnabled: boolean;
  status: 'active' | 'inactive';
  avatarUrl: string;
  createdAt: string;
}

// Hook managing mockup and live operations for hospital staff list
export const useStaffOperations = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  const syncBackendUsers = async () => {
    try {
      const data = await adminService.listUsers();
      if (data) {
        const mappedUsers: StaffMember[] = data.map((u) => {
          const roleMap = u.role || 'hospital_admin';

          return {
            id: u.keycloak_sub || u.username,
            name: u.full_name || u.username,
            email: u.email,
            phone: u.phone || '',
            role: roleMap,
            landingDepartment: u.landingDepartment || getLandingDepartmentForRole(roleMap),
            additionalDepartments: [],
            mfaEnabled: u.mfaEnabled || false,
            status: u.status === 'inactive' ? 'inactive' : 'active',
            avatarUrl: u.avatarUrl || '',
            createdAt: u.createdAt || new Date().toISOString().split('T')[0]
          };
        });
        setStaffList(mappedUsers);
      }
    } catch (err) {
      console.error('Failed to sync backend users:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncBackendUsers();
  }, []);

  // Add staff registration under account plan constraints
  const addStaff = (data: Omit<StaffMember, 'id' | 'status' | 'createdAt'> & { password?: string }): boolean => {
    if (staffList.length >= 20) {
      setError('Plan limit reached: Maximum of 20 active staff accounts allowed.');
      return false;
    }

    const normalizedRole = data.role === 'admin' ? 'hospital_admin' : (data.role === 'tech' ? 'lab_technician' : data.role);
    const derivedDept = data.landingDepartment || getLandingDepartmentForRole(normalizedRole);

    const payload = {
      username: data.email.split('@')[0],
      password: data.password || 'Gilgal#2026!Staff',
      email: data.email,
      full_name: data.name,
      role: normalizedRole,
      phone: data.phone,
      landingDepartment: derivedDept,
      mfaEnabled: data.mfaEnabled,
      avatarUrl: data.avatarUrl || ''
    };

    adminService.createUser(payload)
      .then(() => {
        toast.success(`User "${data.name}" created.`);
        syncBackendUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'API creation failed.');
      });

    setError(null);
    return true;
  };

  // Modify staff details
  const updateStaff = (id: string, data: Partial<StaffMember>) => {
    const normalizedRole = data.role ? (data.role === 'admin' ? 'hospital_admin' : (data.role === 'tech' ? 'lab_technician' : data.role)) : undefined;
    const derivedDept = normalizedRole ? getLandingDepartmentForRole(normalizedRole) : data.landingDepartment;

    const payload = {
      email: data.email,
      full_name: data.name,
      role: normalizedRole,
      phone: data.phone,
      landingDepartment: derivedDept,
      mfaEnabled: data.mfaEnabled,
      status: data.status
    };

    adminService.updateUser(id, payload)
      .then(() => {
        toast.success('User details updated.');
        syncBackendUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Update failed.');
      });
  };

  // Delete staff profile
  const deleteStaff = (id: string) => {
    adminService.deleteUser(id)
      .then(() => {
        toast.success('User deactivated.');
        syncBackendUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Deactivation failed.');
      });
  };

  const clearError = () => setError(null);

  return {
    staffList,
    error,
    addStaff,
    updateStaff,
    deleteStaff,
    clearError
  };
};
