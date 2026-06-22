import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useApp } from '@/features/admin/context/AppContext'
import { StatCard } from '../components/StatCard'
import { DepartmentCard } from '../components/DepartmentCard'
import { AlertFeedItem } from '../components/AlertFeedItem'
import { ROLES } from '@/lib/roles'

export function DashboardPage() {
  const { user, tenantId, roles } = useAuth()
  const { stats, alerts, departments, sessions, setActiveView } = useApp()

  const isHospitalAdmin = roles.includes(ROLES.hospitalAdmin)

  // Retrieve dynamic hospital name based on the active tenant ID
  const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
  const currentTenant = tenants.find((t: any) => t.tenant_id === tenantId)
  const hospitalName =
    user?.hospital_name ||
    (currentTenant ? currentTenant.hospital_name : null) ||
    'Muhimbili National Hospital'

  if (isHospitalAdmin) {
    const previewSessions = sessions.slice(0, 3)

    return (
      <div className="max-w-container-max mx-auto h-full flex flex-col lg:flex-row gap-lg xl:gap-xl">
        {/* Left Column: Telemetry and Metrics */}
        <div className="w-full lg:w-[70%] flex flex-col gap-lg">
          {/* Status operational banner */}
          <div className="w-full flex items-center gap-sm p-md bg-[#e6f6ef] border border-success/20 rounded-lg">
            <span className="material-symbols-outlined text-success">check_circle</span>
            <span className="font-headline-sm text-on-surface text-[14px]">
              All Systems Operational — {hospitalName}
            </span>
          </div>

          {/* Telemetry card row grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md w-full">
            <StatCard
              title="Total Staff"
              value={stats.totalStaff}
              icon="group"
              trend="up"
            />
            <StatCard
              title="Online Now"
              value={stats.onlineNow}
              icon="history"
              trend="up"
            />
            <StatCard
              title="Departments Active"
              value={stats.departmentsActive}
              icon="domain"
              trend="flat"
            />
            <StatCard
              title="Beds Occupied"
              value={stats.bedsOccupied}
              subValue={`/${stats.totalBeds}`}
              icon="bedroom_parent"
              trend="flat"
            />
          </div>

          {/* Clinical departments operational grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md w-full">
            {departments.map((dept) => (
              <DepartmentCard
                key={dept.id}
                name={dept.name}
                staffCount={dept.staffCount}
                queueCount={dept.queueCount}
                status={dept.status}
                alerts={dept.alerts}
                occupancy={dept.occupancy}
                onViewClick={() => setActiveView('departments')}
              />
            ))}
          </div>

          {/* Live system alerts log feeds */}
          <div className="bg-surface-white border border-border-subtle rounded-lg flex flex-col">
            <div className="p-md border-b border-border-subtle">
              <h3 className="font-headline-sm text-on-surface text-base font-semibold">
                Active Alerts
              </h3>
            </div>
            <div className="flex flex-col">
              {alerts.map((alert) => (
                <AlertFeedItem
                  key={alert.id}
                  severity={alert.severity}
                  department={alert.department}
                  message={alert.message}
                  timestamp={alert.timestamp}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions and Session Telemetry */}
        <div className="w-full lg:w-[30%] flex flex-col gap-lg">
          {/* Quick configuration actions */}
          <div className="flex flex-col gap-md">
            <h3 className="font-headline-sm text-on-surface text-base font-semibold">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-sm">
              <button
                onClick={() => setActiveView('add-staff')}
                className="w-full h-10 px-md border border-border-subtle rounded text-secondary font-label-md text-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm justify-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Add New Staff
              </button>
              <button
                onClick={() => setActiveView('departments')}
                className="w-full h-10 px-md border border-border-subtle rounded text-secondary font-label-md text-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm justify-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">account_tree</span>
                Manage Departments
              </button>
              <button
                onClick={() => setActiveView('reports-operational')}
                className="w-full h-10 px-md border border-border-subtle rounded text-secondary font-label-md text-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm justify-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">description</span>
                Generate Report
              </button>
              <button
                onClick={() => setActiveView('backup')}
                className="w-full h-10 px-md border border-border-subtle rounded text-secondary font-label-md text-sm hover:bg-surface-container-low transition-colors flex items-center gap-sm justify-start cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                Run Backup
              </button>
            </div>
          </div>

          {/* Live sessions online roster */}
          <div className="flex flex-col gap-md mt-md">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-on-surface text-base font-semibold">
                Staff Online
              </h3>
              <button
                onClick={() => setActiveView('sessions')}
                className="font-label-md text-primary text-xs font-semibold hover:underline cursor-pointer bg-transparent border-0"
              >
                View All
              </button>
            </div>
            <div className="bg-surface-white border border-border-subtle rounded-lg flex flex-col p-md gap-md">
              {previewSessions.map((session) => (
                <div key={session.id} className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline overflow-hidden shrink-0 border border-border-subtle">
                    {session.avatarUrl ? (
                      <img
                        alt={session.staffName}
                        className="w-full h-full object-cover"
                        src={session.avatarUrl}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-sm">person</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <p className="font-body-sm font-semibold text-on-surface leading-tight truncate text-xs">
                      {session.staffName}
                    </p>
                    <p className="font-label-sm text-outline leading-tight text-[10px] truncate">
                      {session.department} • {session.loginTime}
                    </p>
                  </div>
                  <span className="px-2 py-[2px] bg-row-hover text-primary font-label-sm rounded-full text-[10px] uppercase font-bold shrink-0">
                    {session.staffRole}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${user?.full_name || user?.username || 'there'}.`}
      />
      {tenantId && <p className="text-muted">Hospital ID: {tenantId}</p>}
    </>
  )
}
