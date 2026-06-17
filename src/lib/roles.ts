// Roles from microservices architecture (backend/microservicearchitecture.md)

export const ROLES = {
  superAdmin: 'super_admin',
  hospitalAdmin: 'hospital_admin',
  receptionist: 'receptionist',
  triageNurse: 'triage_nurse',
  doctor: 'doctor',
  labTechnician: 'lab_technician',
  radiographer: 'radiographer',
  pharmacist: 'pharmacist',
  cashier: 'cashier',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export interface NavItem {
  label: string
  path: string
  roles: Role[]
}

export const HOSPITAL_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Dashboard',
    path: '/dashboard',
    roles: [
      ROLES.receptionist,
      ROLES.triageNurse,
      ROLES.doctor,
      ROLES.labTechnician,
      ROLES.radiographer,
      ROLES.pharmacist,
      ROLES.cashier,
    ],
  },
  {
    label: 'Reports',
    path: '/admin/reports',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'All Staff',
    path: '/admin/staff',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Active Sessions',
    path: '/admin/sessions',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Departments & Wards',
    path: '/admin/departments',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Fee Schedules',
    path: '/admin/fees',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Insurance Providers',
    path: '/admin/insurance',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Hospital Settings',
    path: '/admin/settings',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Audit Logs',
    path: '/admin/audit-logs',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Data Backup',
    path: '/admin/backup',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'My Subscription',
    path: '/admin/subscription',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Patient Reports',
    path: '/admin/reports/patients',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Revenue Reports',
    path: '/admin/reports/revenue',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Operational Reports',
    path: '/admin/reports/operations',
    roles: [ROLES.hospitalAdmin],
  },
  {
    label: 'Reception',
    path: '/reception/register',
    roles: [ROLES.hospitalAdmin, ROLES.receptionist],
  },
  {
    label: 'Queue',
    path: '/reception/queue',
    roles: [ROLES.hospitalAdmin, ROLES.receptionist],
  },
  {
    label: 'Triage',
    path: '/triage/queue',
    roles: [ROLES.triageNurse, ROLES.hospitalAdmin],
  },
  {
    label: 'Consultation',
    path: '/consultation/queue',
    roles: [ROLES.doctor, ROLES.hospitalAdmin],
  },
  {
    label: 'Laboratory',
    path: '/laboratory/requests',
    roles: [ROLES.labTechnician, ROLES.doctor, ROLES.hospitalAdmin],
  },
  {
    label: 'Radiology',
    path: '/radiology/schedule',
    roles: [ROLES.radiographer, ROLES.doctor, ROLES.hospitalAdmin],
  },
  {
    label: 'Pharmacy',
    path: '/pharmacy/dispense',
    roles: [ROLES.pharmacist, ROLES.hospitalAdmin],
  },
  {
    label: 'Billing',
    path: '/billing',
    roles: [ROLES.cashier, ROLES.hospitalAdmin],
  },
  {
    label: 'Ward',
    path: '/ward/admissions',
    roles: [ROLES.triageNurse, ROLES.doctor, ROLES.hospitalAdmin],
  },
  {
    label: 'Notifications',
    path: '/notifications',
    roles: [
      ROLES.hospitalAdmin,
      ROLES.receptionist,
      ROLES.triageNurse,
      ROLES.doctor,
      ROLES.labTechnician,
      ROLES.radiographer,
      ROLES.pharmacist,
      ROLES.cashier,
    ],
  },
]

export const MASTER_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/master/dashboard', roles: [ROLES.superAdmin] },
  { label: 'Tenants', path: '/master/tenants', roles: [ROLES.superAdmin] },
  { label: 'Subscriptions', path: '/master/subscriptions', roles: [ROLES.superAdmin] },
  { label: 'Invoices', path: '/master/invoices', roles: [ROLES.superAdmin] },
  { label: 'Payments', path: '/master/payments', roles: [ROLES.superAdmin] },
  { label: 'Platform Admins', path: '/master/admins', roles: [ROLES.superAdmin] },
  { label: 'System Health', path: '/master/health', roles: [ROLES.superAdmin] },
  { label: 'Announcements', path: '/master/announcements', roles: [ROLES.superAdmin] },
  { label: 'Audit Logs', path: '/master/audit-logs', roles: [ROLES.superAdmin] },
]

export function getDefaultRoute(roles: string[]): string {
  if (roles.includes(ROLES.superAdmin)) return '/master/dashboard'
  if (roles.includes(ROLES.hospitalAdmin)) return '/admin/dashboard'
  if (roles.includes(ROLES.doctor)) return '/consultation/queue'
  if (roles.includes(ROLES.triageNurse)) return '/triage/queue'
  if (roles.includes(ROLES.receptionist)) return '/reception/register'
  if (roles.includes(ROLES.labTechnician)) return '/laboratory/requests'
  if (roles.includes(ROLES.radiographer)) return '/radiology/schedule'
  if (roles.includes(ROLES.pharmacist)) return '/pharmacy/dispense'
  if (roles.includes(ROLES.cashier)) return '/billing'
  return '/dashboard'
}
