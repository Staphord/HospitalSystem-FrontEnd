/* eslint-disable react-refresh/only-export-components */
import { Navigate } from 'react-router-dom'
import { AuthLayout } from '@/app/layout/AuthLayout'
import { HospitalLayout } from '@/app/layout/HospitalLayout'
import { MasterLayout } from '@/app/layout/MasterLayout'
import { ProtectedRoute } from '@/app/router/ProtectedRoute'
import { RoleRoute } from '@/app/router/RoleRoute'
import { ROLES } from '@/lib/roles'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { HospitalLoginPage } from '@/features/auth/pages/HospitalLoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage'
import { AccountLockedPage } from '@/features/auth/pages/AccountLockedPage'
import { MfaLoginPage } from '@/features/auth/pages/MfaLoginPage'
import { MfaSelectionPage } from '@/features/auth/pages/MfaSelectionPage'
import { MfaVerificationPage } from '@/features/auth/pages/MfaVerificationPage'
import { FirstLoginChangePasswordPage } from '@/features/auth/pages/FirstLoginChangePasswordPage'
import { DeactivatedAccountPage } from '@/features/auth/pages/DeactivatedAccountPage'
import { ImpersonationSwitchPage } from '@/features/auth/pages/ImpersonationSwitchPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { UserManagementPage } from '@/features/admin/pages/UserManagementPage'
import { AddStaffPage } from '@/features/admin/pages/AddStaffPage'
import { StaffDetailPage } from '@/features/admin/pages/StaffDetailPage'
import { ActiveSessionsPage } from '@/features/admin/pages/ActiveSessionsPage'
import { DepartmentsPage } from '@/features/admin/pages/DepartmentsPage'
import { FeesPage } from '@/features/admin/pages/FeesPage'
import { InsurancePage } from '@/features/admin/pages/InsurancePage'
import { SettingsPage } from '@/features/admin/pages/SettingsPage'
import { AuditLogsPage as AdminAuditLogsPage } from '@/features/admin/pages/AuditLogsPage'
import { DataBackupPage } from '@/features/admin/pages/DataBackupPage'
import { SubscriptionPage } from '@/features/admin/pages/SubscriptionPage'
import { MasterDashboardPage } from '@/features/master/pages/MasterDashboardPage'
import { TenantManagementPage } from '@/features/master/pages/TenantManagementPage'
import { TenantDetailPage } from '@/features/master/pages/TenantDetailPage'
import { CreateTenantPage } from '@/features/master/pages/CreateTenantPage'
import { SubscriptionManagementPage } from '@/features/master/pages/SubscriptionManagementPage'
import { SubscriptionDetailPage } from '@/features/master/pages/SubscriptionDetailPage'
import { InvoiceManagementPage } from '@/features/master/pages/InvoiceManagementPage'
import { PaymentsPage } from '@/features/master/pages/PaymentsPage'
import { OverdueAccountsPage } from '@/features/master/pages/OverdueAccountsPage'
import { MasterAdminsPage } from '@/features/master/pages/MasterAdminsPage'
import { SystemHealthPage } from '@/features/master/pages/SystemHealthPage'
import { IncidentsPage } from '@/features/master/pages/IncidentsPage'
import { AnnouncementsPage } from '@/features/master/pages/AnnouncementsPage'
import { AuditLogsPage } from '@/features/master/pages/AuditLogsPage'
import { ReportsDashboardPage } from '@/features/reports/pages/ReportsDashboardPage'
import { PatientReportsPage } from '@/features/reports/pages/PatientReportsPage'
import { RevenueReportsPage } from '@/features/reports/pages/RevenueReportsPage'
import { OperationalReportsPage } from '@/features/reports/pages/OperationalReportsPage'
import { PatientRegistrationPage } from '@/features/reception/pages/PatientRegistrationPage'
import { PatientSearchPage } from '@/features/reception/pages/PatientSearchPage'
import { VisitQueuePage } from '@/features/reception/pages/VisitQueuePage'
import { TriageQueuePage } from '@/features/triage/pages/TriageQueuePage'
import { TriageHistoryPage } from '@/features/triage/pages/TriageHistoryPage'
import { TriageHistoryPatientPage } from '@/features/triage/pages/TriageHistoryPatientPage'
import { TriageAssessPage } from '@/features/triage/pages/TriageAssessPage'
import { ConsultationQueuePage } from '@/features/consultation/pages/ConsultationQueuePage'
import { EncounterPage } from '@/features/consultation/pages/EncounterPage'
import { InvestigationResultsPage } from '@/features/consultation/pages/InvestigationResultsPage'
import { ConsultationHistoryPage } from '@/features/consultation/pages/ConsultationHistoryPage'
import { ConsultationHistoryPatientPage } from '@/features/consultation/pages/ConsultationHistoryPatientPage'
import { InpatientPage } from '@/features/consultation/pages/InpatientPage'
import { InpatientOrdersPage } from '@/features/consultation/pages/InpatientOrdersPage'
import { InpatientDischargePage } from '@/features/consultation/pages/InpatientDischargePage'
import { MyReferralsPage } from '@/features/consultation/pages/MyReferralsPage'
import { LabRequestsPage } from '@/features/laboratory/pages/LabRequestsPage'
import { LabRequestDetailPage } from '@/features/laboratory/pages/LabRequestDetailPage'
import { LabResultsPage } from '@/features/laboratory/pages/LabResultsPage'
import { SpecimenTrackingPage } from '@/features/laboratory/pages/SpecimenTrackingPage'
import { ImagingSchedulePage } from '@/features/radiology/pages/ImagingSchedulePage'
import { DispensingPage } from '@/features/pharmacy/pages/DispensingPage'
import { BillsPage } from '@/features/billing/pages/BillsPage'
import { AdmissionsPage } from '@/features/ward/pages/AdmissionsPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { EmptyState } from '@/components/ui/EmptyState'

function UnauthorizedPage() {
  return (
    <EmptyState
      title="Access denied"
      description="You do not have permission to view this page."
    />
  )
}

export const routes = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <HospitalLoginPage /> },
      { path: '/master/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/account-locked', element: <AccountLockedPage /> },
      { path: '/mfa-login', element: <MfaLoginPage /> },
      { path: '/mfa-select', element: <MfaSelectionPage /> },
      { path: '/mfa-verify', element: <MfaVerificationPage /> },
      { path: '/first-login-change-password', element: <FirstLoginChangePasswordPage /> },
      { path: '/deactivated-account', element: <DeactivatedAccountPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/impersonation/switching', element: <ImpersonationSwitchPage /> },
      {
        element: <RoleRoute allowed={[ROLES.superAdmin]} />,
        children: [
          {
            element: <MasterLayout />,
            children: [
              { path: '/master/dashboard', element: <MasterDashboardPage /> },
              { path: '/master/tenants', element: <TenantManagementPage /> },
              { path: '/master/tenants/new', element: <CreateTenantPage /> },
              { path: '/master/tenants/:id', element: <TenantDetailPage /> },
              { path: '/master/subscriptions', element: <SubscriptionManagementPage /> },
              { path: '/master/subscriptions/:id', element: <SubscriptionDetailPage /> },

              { path: '/master/invoices', element: <InvoiceManagementPage /> },
              { path: '/master/invoices/overdue', element: <OverdueAccountsPage /> },
              { path: '/master/payments', element: <PaymentsPage /> },
              { path: '/master/incidents', element: <IncidentsPage /> },
              { path: '/master/admins', element: <MasterAdminsPage /> },
              { path: '/master/health', element: <SystemHealthPage /> },
              { path: '/master/announcements', element: <AnnouncementsPage /> },
              { path: '/master/audit-logs', element: <AuditLogsPage /> },
              { path: '/master/profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <HospitalLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          {
            element: <RoleRoute allowed={[ROLES.hospitalAdmin]} />,
            children: [
              { path: '/admin/dashboard', element: <DashboardPage /> },
              { path: '/admin/staff', element: <UserManagementPage /> },
              { path: '/admin/staff/new', element: <AddStaffPage /> },
              { path: '/admin/staff/:id/edit', element: <AddStaffPage /> },
              { path: '/admin/staff/:id', element: <StaffDetailPage /> },
              { path: '/admin/sessions', element: <ActiveSessionsPage /> },
              { path: '/admin/departments', element: <DepartmentsPage /> },
              { path: '/admin/fees', element: <FeesPage /> },
              { path: '/admin/insurance', element: <InsurancePage /> },
              { path: '/admin/settings', element: <SettingsPage /> },
              { path: '/admin/audit-logs', element: <AdminAuditLogsPage /> },
              { path: '/admin/backup', element: <DataBackupPage /> },
              { path: '/admin/subscription', element: <SubscriptionPage /> },
              { path: '/admin/reports', element: <ReportsDashboardPage /> },
              { path: '/admin/reports/patients', element: <PatientReportsPage /> },
              { path: '/admin/reports/revenue', element: <RevenueReportsPage /> },
              { path: '/admin/reports/operations', element: <OperationalReportsPage /> },
            ],
          },
          {
            element: <RoleRoute allowed={[ROLES.hospitalAdmin, ROLES.receptionist]} />,
            children: [
              { path: '/reception/register', element: <PatientRegistrationPage /> },
              { path: '/reception/search', element: <PatientSearchPage /> },
              { path: '/reception/queue', element: <VisitQueuePage /> },
            ],
          },
          {
            element: <RoleRoute allowed={[ROLES.triageNurse, ROLES.hospitalAdmin]} />,
            children: [
              { path: '/triage/queue', element: <TriageQueuePage /> },
              { path: '/triage/history', element: <TriageHistoryPage /> },
              { path: '/triage/history/:patientId', element: <TriageHistoryPatientPage /> },
              { path: '/triage/assess/:visitId', element: <TriageAssessPage /> },
            ],
          },
          {
            element: <RoleRoute allowed={[ROLES.doctor, ROLES.hospitalAdmin]} />,
            children: [
              { path: '/consultation/queue', element: <ConsultationQueuePage /> },
              { path: '/consultation/encounter/:visitId', element: <EncounterPage /> },
              { path: '/consultation/results', element: <InvestigationResultsPage /> },
              { path: '/consultation/inpatient', element: <InpatientPage /> },
              { path: '/consultation/inpatient/:admissionId/orders', element: <InpatientOrdersPage /> },
              { path: '/consultation/inpatient/:admissionId/discharge', element: <InpatientDischargePage /> },
              { path: '/consultation/history', element: <ConsultationHistoryPage /> },
              { path: '/consultation/history/:patientId', element: <ConsultationHistoryPatientPage /> },
              { path: '/consultation/referrals', element: <MyReferralsPage /> },
            ],
          },
          {
            element: <RoleRoute allowed={[ROLES.labTechnician, ROLES.doctor, ROLES.hospitalAdmin]} />,
            children: [
              { path: '/laboratory/requests', element: <LabRequestsPage /> },
              { path: '/laboratory/requests/:requestId', element: <LabRequestDetailPage /> },
            ],
          },
          {
            element: <RoleRoute allowed={[ROLES.labTechnician, ROLES.hospitalAdmin]} />,
            children: [
              { path: '/laboratory/results', element: <LabResultsPage /> },
              { path: '/laboratory/specimens', element: <SpecimenTrackingPage /> },
            ],
          },
          {
            element: <RoleRoute allowed={[ROLES.radiographer, ROLES.doctor, ROLES.hospitalAdmin]} />,
            children: [{ path: '/radiology/schedule', element: <ImagingSchedulePage /> }],
          },
          {
            element: <RoleRoute allowed={[ROLES.pharmacist, ROLES.hospitalAdmin]} />,
            children: [{ path: '/pharmacy/dispense', element: <DispensingPage /> }],
          },
          {
            element: <RoleRoute allowed={[ROLES.cashier, ROLES.hospitalAdmin, ROLES.receptionist]} />,
            children: [{ path: '/billing', element: <BillsPage /> }],
          },
          {
            element: <RoleRoute allowed={[ROLES.triageNurse, ROLES.doctor, ROLES.hospitalAdmin]} />,
            children: [{ path: '/ward/admissions', element: <AdmissionsPage /> }],
          },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/unauthorized', element: <UnauthorizedPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]
