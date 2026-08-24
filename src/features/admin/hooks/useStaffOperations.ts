import { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  doctor: 'Consultation',
  clinician: 'Consultation',
  triage_nurse: 'Triage',
  ward_nurse: 'Ward',
  nurse: 'Triage',
  receptionist: 'Reception',
  lab_technician: 'Laboratory',
  tech: 'Laboratory',
  radiographer: 'Radiology',
  radiologist: 'Radiology',
  radiology: 'Radiology',
  radiology_tech: 'Radiology',
  pharmacist: 'Pharmacy',
  billing_officer: 'Billing',
  cashier: 'Billing',
  hospital_admin: 'Admin',
  admin: 'Admin',
};

export const getLandingDepartmentForRole = (role: string): string => {
  const normalized = (role || '').toLowerCase();
  if (normalized.includes('radio')) return 'Radiology';
  if (normalized.includes('lab')) return 'Laboratory';
  if (normalized.includes('pharm')) return 'Pharmacy';
  if (normalized.includes('recept')) return 'Reception';
  if (normalized.includes('bill') || normalized.includes('cash')) return 'Billing';
  if (normalized.includes('ward')) return 'Ward';
  if (normalized.includes('triage')) return 'Triage';
  if (normalized.includes('doc') || normalized.includes('clinic')) return 'Consultation';

  return ROLE_DEPARTMENT_MAP[normalized] || 'Admin';
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
    const state = useAuthStore.getState();
    const isHospitalAdmin = (state.roles || []).includes('hospital_admin') || state.user?.role === 'hospital_admin';
    if (!isHospitalAdmin) {
      return;
    }

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
    syncBackendUsers();
  }, []);

  const formatBackendError = (err: any): string => {
    const detail = err.response?.data?.detail;
    if (!detail) return err.message || 'API operation failed.';
    
    if (typeof detail === 'string') {
      const lower = detail.toLowerCase();
      if (lower.includes('email') && (lower.includes('already') || lower.includes('exist') || lower.includes('registered'))) {
        return 'Email: Email already exists.';
      }
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((d: any) => {
          const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
          let msg = d.msg ? (d.msg.startsWith('Value error, ') ? d.msg.replace('Value error, ', '') : d.msg) : 'Invalid field';
          if (field === 'email') {
            if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('registered')) {
              msg = 'Email already exists.';
            }
            return `Email: ${msg}`;
          }
          if (field === 'username' || field === 'full_name' || field === 'name') {
            return `Username: ${msg}`;
          }
          return field && field !== 'body' ? `${field}: ${msg}` : msg;
        })
        .join('; ');
    }

    if (typeof detail === 'object') {
      const rawMsg = detail.message || detail.msg || JSON.stringify(detail);
      const lower = String(rawMsg).toLowerCase();
      if (lower.includes('email') && (lower.includes('already') || lower.includes('exist') || lower.includes('registered'))) {
        return 'Email: Email already exists.';
      }
      return String(rawMsg);
    }
    return String(detail);
  };

  // Add staff registration under account plan constraints
  const addStaff = async (data: Omit<StaffMember, 'id' | 'status' | 'createdAt'> & { password?: string }): Promise<boolean> => {
    if (staffList.length >= 20) {
      setError('Plan limit reached: Maximum of 20 active staff accounts allowed.');
      return false;
    }

    const normalizedRole = data.role === 'admin' ? 'hospital_admin' : (data.role === 'tech' ? 'lab_technician' : data.role);
    const derivedDept = data.landingDepartment || getLandingDepartmentForRole(normalizedRole);

    let rawUsername = data.email.split('@')[0].trim();
    if (rawUsername.length < 3) {
      rawUsername = `${rawUsername}_staff`;
    }

    const payload = {
      username: rawUsername,
      password: data.password || 'Gilgal#2026!Staff',
      email: data.email,
      full_name: data.name,
      role: normalizedRole,
      phone: data.phone,
      landingDepartment: derivedDept,
      mfaEnabled: data.mfaEnabled,
      avatarUrl: data.avatarUrl || ''
    };

    try {
      await adminService.createUser(payload);
      toast.success(`User "${data.name}" created. A welcome email was sent to ${data.email}.`);
      syncBackendUsers();
      setError(null);
      return true;
    } catch (err: any) {
      const msg = formatBackendError(err);
      toast.error(msg);
      setError(msg);
      return false;
    }
  };

  // Modify staff details
  const updateStaff = async (id: string, data: Partial<StaffMember>): Promise<boolean> => {
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

    try {
      await adminService.updateUser(id, payload);
      toast.success('User details updated.');
      syncBackendUsers();
      setError(null);
      return true;
    } catch (err: any) {
      const msg = formatBackendError(err);
      toast.error(msg);
      setError(msg);
      return false;
    }
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
