import { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import { toast } from 'sonner';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'nurse' | 'admin' | 'tech';
  landingDepartment: string;
  additionalDepartments: string[];
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
          let roleMap: 'doctor' | 'nurse' | 'admin' | 'tech' = 'admin';
          if (u.role.includes('doctor')) roleMap = 'doctor';
          else if (u.role.includes('nurse') || u.role.includes('triage')) roleMap = 'nurse';
          else if (u.role.includes('tech') || u.role.includes('lab')) roleMap = 'tech';

          return {
            id: u.keycloak_sub || u.username,
            name: u.full_name || u.username,
            email: u.email,
            phone: u.phone || '712 000 000',
            role: roleMap,
            landingDepartment: u.landingDepartment || (roleMap === 'doctor' ? 'Consultation' : (roleMap === 'nurse' ? 'Triage' : 'General Admin')),
            additionalDepartments: u.additionalDepartments || [],
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
  const addStaff = (data: Omit<StaffMember, 'id' | 'status' | 'createdAt'>): boolean => {
    if (staffList.length >= 20) {
      setError('Plan limit reached: Maximum of 20 active staff accounts allowed.');
      return false;
    }

    const payload = {
      username: data.email.split('@')[0],
      password: 'TemporaryPassword123!',
      email: data.email,
      full_name: data.name,
      role: data.role === 'admin' ? 'hospital_admin' : data.role,
      phone: data.phone,
      landingDepartment: data.landingDepartment,
      additionalDepartments: data.additionalDepartments,
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
    const payload = {
      email: data.email,
      full_name: data.name,
      role: data.role === 'admin' ? 'hospital_admin' : data.role,
      phone: data.phone,
      landingDepartment: data.landingDepartment,
      additionalDepartments: data.additionalDepartments,
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
