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

const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'ST-1001',
    name: 'Dr. Sarah Chen',
    email: 's.chen@muhimbili.go.tz',
    phone: '712 345 678',
    role: 'doctor',
    landingDepartment: 'Consultation',
    additionalDepartments: ['Emergency Department', 'Radiology'],
    mfaEnabled: true,
    status: 'active',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsFdwJlsoEY6YWqUIzmDuyNBBS_giKeGh6IjYOOy7Q-EY5W5fAQNKZL3HDwdPSwXKA78U_cMRLt_nslrSsHcY9ryh1PfVIUn9ZtMg84PIGbTeE-mMVs-Tnk4fJAulw3W0coEjqlWw8bWedLbW2QqIQswxG9Vq1F8-CaYZiSrwvd2GRgdPO8E5iNSZU2hgMwzP36sNtmOvvq-lbv830dbyCdwn5dMVi4AMuTuIjggH6dSJc0cSP49DzppYMc',
    createdAt: '2026-06-01'
  },
  {
    id: 'ST-1002',
    name: 'Nurse James O.',
    email: 'j.o@muhimbili.go.tz',
    phone: '712 987 654',
    role: 'nurse',
    landingDepartment: 'Triage',
    additionalDepartments: ['Emergency Department'],
    mfaEnabled: true,
    status: 'active',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLtrAwAy1k-muCJdZ_8Qx09eWqn8dUzlstfzbJLXK6u3YE2Ti0UHrqQr7MCaXC0fz7690sfJqWL9ivTACYrImVx7LphuaY__vgVJlbYK1ySkQKRJ7uZCS86vDr-ib1QnBNTtJtnRAJTATBNKB48t3dKlETUaIZ4LX3YQ4Qj86JX6JLVb4Ra56_PdD5WVLEdIcjIFjYb7gHWooxhM5DUqiWfvVdeQX1CV6PsuF8xPtQSPhboAi4nZ8ONOFMnc',
    createdAt: '2026-06-02'
  },
  {
    id: 'ST-1003',
    name: 'Tech Ali M.',
    email: 'a.m@muhimbili.go.tz',
    phone: '712 111 222',
    role: 'tech',
    landingDepartment: 'Laboratory',
    additionalDepartments: [],
    mfaEnabled: true,
    status: 'active',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLttGcflTJkMQI6Om6qQ-pDJlZa2NlNycuozOul20T7KsNKwYjjfxQaop6wYRUyeiz2C6t7ivfOOPhUOS7F-xU6xHxiFzsPP0LJp_5o3BWTa9rR4IRqfCs-bWfQedR3q-Ck6Dgjh5xd0-z00Z5wz8uvGAvp3e_l2mLQbUpoT7xKefYWDQNxkoGM3WFE8gypH5E8Vzq9PTNWaxa4bYY7vUlNmRKcX4QaLUXw8pyrpzamjQthWZXJ3A7UxcQNU',
    createdAt: '2026-06-03'
  },
  {
    id: 'ST-1004',
    name: 'Dr. Amina Hassan',
    email: 'a.hassan@muhimbili.go.tz',
    phone: '712 555 999',
    role: 'doctor',
    landingDepartment: 'Cardiology',
    additionalDepartments: ['Consultation'],
    mfaEnabled: true,
    status: 'active',
    avatarUrl: 'https://lh3.googleusercontent.com/aida/AP1WRLsFdwJlsoEY6YWqUIzmDuyNBBS_giKeGh6IjYOOy7Q-EY5W5fAQNKZL3HDwdPSwXKA78U_cMRLt_nslrSsHcY9ryh1PfVIUn9ZtMg84PIGbTeE-mMVs-Tnk4fJAulw3W0coEjqlWw8bWedLbW2QqIQswxG9Vq1F8-CaYZiSrwvd2GRgdPO8E5iNSZU2hgMwzP36sNtmOvvq-lbv830dbyCdwn5dMVi4AMuTuIjggH6dSJc0cSP49DzppYMc',
    createdAt: '2026-06-04'
  }
];

// Seed staff list up to 18 members
for (let i = 5; i <= 18; i++) {
  INITIAL_STAFF.push({
    id: `ST-10${i < 10 ? '0' + i : i}`,
    name: `Staff Member ${i}`,
    email: `staff.${i}@muhimbili.go.tz`,
    phone: `712 000 0${i}`,
    role: i % 3 === 0 ? 'doctor' : (i % 3 === 1 ? 'nurse' : 'admin'),
    landingDepartment: i % 2 === 0 ? 'General Surgery' : 'Pediatrics',
    additionalDepartments: [],
    mfaEnabled: false,
    status: 'active',
    avatarUrl: '',
    createdAt: '2026-06-05'
  });
}

// Hook managing mockup and live operations for hospital staff list
export const useStaffOperations = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [error, setError] = useState<string | null>(null);

  const syncBackendUsers = async () => {
    try {
      const data = await adminService.listUsers();
      if (data && data.length > 0) {
        const mappedUsers: StaffMember[] = data.map((u) => {
          let roleMap: 'doctor' | 'nurse' | 'admin' | 'tech' = 'admin';
          if (u.role.includes('doctor')) roleMap = 'doctor';
          else if (u.role.includes('nurse') || u.role.includes('triage')) roleMap = 'nurse';
          else if (u.role.includes('tech') || u.role.includes('lab')) roleMap = 'tech';

          return {
            id: u.keycloak_sub || u.username,
            name: u.full_name || u.username,
            email: u.email,
            phone: '712 000 000',
            role: roleMap,
            landingDepartment: roleMap === 'doctor' ? 'Consultation' : (roleMap === 'nurse' ? 'Triage' : 'General Admin'),
            additionalDepartments: [],
            mfaEnabled: false,
            status: 'active',
            avatarUrl: '',
            createdAt: new Date().toISOString().split('T')[0]
          };
        });
        setStaffList(mappedUsers);
      }
    } catch (err) {
      console.log('Using static staff list fallback.');
    }
  };

  useEffect(() => {
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
      role: data.role === 'admin' ? 'hospital_admin' : data.role
    };

    adminService.createUser(payload)
      .then(() => {
        toast.success(`User "${data.name}" created in Keycloak.`);
        syncBackendUsers();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'API creation failed, adding locally.');
        const newStaff: StaffMember = {
          id: `ST-${Date.now().toString().slice(-4)}`,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
          ...data
        };
        setStaffList((prev) => [...prev, newStaff]);
      });

    setError(null);
    return true;
  };

  // Modify staff details
  const updateStaff = (id: string, data: Partial<StaffMember>) => {
    const payload = {
      email: data.email,
      full_name: data.name,
      role: data.role === 'admin' ? 'hospital_admin' : data.role
    };

    adminService.updateUser(id, payload)
      .then(() => {
        toast.success('User details updated.');
        syncBackendUsers();
      })
      .catch(() => {
        setStaffList((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...data } : s))
        );
      });
  };

  // Delete staff profile
  const deleteStaff = (id: string) => {
    adminService.deleteUser(id)
      .then(() => {
        toast.success('User deactivated.');
        syncBackendUsers();
      })
      .catch(() => {
        setStaffList((prev) => prev.filter((s) => s.id !== id));
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
