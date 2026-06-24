import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { MasterAdminUser } from '@/api/types/master'
import { CreateAdminDrawer } from '../components/admins/CreateAdminDrawer'
import { EditAdminDrawer } from '../components/admins/EditAdminDrawer'

export function MasterAdminsPage() {
  const [admins, setAdmins] = useState<MasterAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [adminToEdit, setAdminToEdit] = useState<MasterAdminUser | null>(null)

  // Delete Confirmation State
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null)

  // Dual Tab & Sessions State
  const [activeTab, setActiveTab] = useState<'accounts' | 'sessions'>('accounts')
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionToRevoke, setSessionToRevoke] = useState<{ id: string; name: string } | null>(null)
  const [isForceAllConfirmOpen, setIsForceAllConfirmOpen] = useState(false)
  const [revokingAll, setRevokingAll] = useState(false)

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const data = await masterService.listMasterAdmins()
      setAdmins(data)
    } catch (err) {
      toast.error('Failed to load platform admins.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true)
      const data = await masterService.listActiveSessions()
      setSessions(data)
    } catch (err) {
      toast.error('Failed to load active sessions.')
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions()
    }
  }, [activeTab])

  const handleCreateSuccess = (newUsername: string) => {
    setIsCreateOpen(false)
    fetchAdmins()
  }

  const handleEditClick = (admin: MasterAdminUser) => {
    setAdminToEdit(admin)
    setIsEditOpen(true)
  }

  const handleToggleActive = async (admin: MasterAdminUser) => {
    try {
      const newStatus = !admin.is_active
      await masterService.updateMasterAdmin(admin.super_admin_id, { is_active: newStatus })
      toast.success(`Platform administrator "${admin.username}" is now ${newStatus ? 'active' : 'inactive'}.`)
      fetchAdmins()
    } catch (err) {
      toast.error('Failed to change administrator status.')
    }
  }

  const confirmDelete = async () => {
    if (!adminToDelete) return
    try {
      await masterService.deleteMasterAdmin(adminToDelete)
      toast.success(`Deleted administrator "${adminToDelete}".`)
      fetchAdmins()
    } catch (err) {
      toast.error('Failed to delete administrator.')
    } finally {
      setAdminToDelete(null)
    }
  }

  const confirmRevokeSession = async () => {
    if (!sessionToRevoke) return
    try {
      await masterService.revokeSession(sessionToRevoke.id)
      toast.success(`Session for "${sessionToRevoke.name}" has been revoked.`)
      fetchSessions()
    } catch (err) {
      toast.error('Failed to revoke session.')
    } finally {
      setSessionToRevoke(null)
    }
  }

  const confirmRevokeAll = async () => {
    try {
      setRevokingAll(true)
      await masterService.revokeAllSessions()
      toast.success('All active Super Admin sessions have been revoked.')
      fetchSessions()
    } catch (err) {
      toast.error('Failed to revoke all sessions.')
    } finally {
      setRevokingAll(false)
      setIsForceAllConfirmOpen(false)
    }
  }

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'Never'
    const d = new Date(isoString)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg">
        <div>
          <PageHeader
            title="Platform Admins"
            description="Manage super administration accounts and configure MFA requirements."
          />
        </div>
        {activeTab === 'accounts' ? (
          <button 
            className="bg-primary-container text-white hover:bg-on-primary-fixed-variant transition-colors font-label-md text-label-md px-md py-sm rounded-lg flex items-center gap-xs shadow-sm whitespace-nowrap h-10 border-0 cursor-pointer"
            onClick={() => setIsCreateOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Create Administrator
          </button>
        ) : (
          <button 
            className="bg-error text-white hover:bg-error/95 transition-colors font-label-md text-label-md px-md py-sm rounded-lg flex items-center gap-xs shadow-sm whitespace-nowrap h-10 border-0 cursor-pointer"
            onClick={() => setIsForceAllConfirmOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Force Logout All
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-0 border-b border-solid border-outline-variant mb-lg gap-md">
        <button
          className={`pb-md font-label-md text-label-md bg-transparent border-0 cursor-pointer transition-all border-b-2 border-solid px-xs ${
            activeTab === 'accounts'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('accounts')}
        >
          Administrator Accounts
        </button>
        <button
          className={`pb-md font-label-md text-label-md bg-transparent border-0 cursor-pointer transition-all border-b-2 border-solid px-xs ${
            activeTab === 'sessions'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-secondary hover:text-on-surface'
          }`}
          onClick={() => setActiveTab('sessions')}
        >
          Active Sessions
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'accounts' ? (
        /* Main Table Card (Accounts) */
        <div className="bg-surface-container-lowest border border-solid border-outline-variant rounded-lg overflow-hidden flex flex-col">
          {loading ? (
            <div className="text-center py-20 text-secondary font-body-md">
              Loading platform administrators...
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-20 text-secondary font-body-md">
              No platform administrators found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse m-0">
                <thead>
                  <tr className="bg-surface-container-low border-0 border-b border-solid border-outline-variant">
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Administrator</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">System Role</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Status</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Security Policy</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Last Login</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface">
                  {admins.map((admin) => (
                    <tr key={admin.super_admin_id || admin.username} className="border-0 border-b border-solid border-outline-variant hover:bg-row-hover transition-colors">
                      <td className="p-md whitespace-nowrap">
                        <div className="flex items-center gap-sm">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {admin.full_name ? admin.full_name.charAt(0).toUpperCase() : admin.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-on-surface">{admin.full_name || admin.username}</span>
                            <span className="text-xs text-secondary">{admin.email}</span>
                            <span className="text-xs text-outline font-mono mt-0.5">@{admin.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-md whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-label-sm text-label-sm border border-solid border-purple-200">
                          {admin.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-md whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-solid ${
                          admin.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-md whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-success">
                          <span className="material-symbols-outlined text-[16px]">verified_user</span>
                          <span className="font-medium">MFA Enforced</span>
                        </div>
                      </td>
                      <td className="p-md whitespace-nowrap text-secondary">
                        {formatDateTime(admin.last_login_at)}
                      </td>
                      <td className="p-md text-right whitespace-nowrap">
                        <div className="flex justify-end gap-xs">
                          <button 
                            className={`p-xs rounded hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center ${
                              admin.is_active ? 'text-success hover:text-success/80' : 'text-secondary hover:text-secondary/80'
                            }`}
                            title={admin.is_active ? 'Deactivate Administrator' : 'Activate Administrator'}
                            onClick={() => handleToggleActive(admin)}
                          >
                            <span className="material-symbols-outlined text-[22px]">
                              {admin.is_active ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                          <button 
                            className="text-secondary hover:text-primary p-xs rounded hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center" 
                            title="Edit Administrator"
                            onClick={() => handleEditClick(admin)}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button 
                            className="text-secondary hover:text-error p-xs rounded hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center" 
                            title="Delete Administrator"
                            onClick={() => setAdminToDelete(admin.username)}
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Sessions Table Card */
        <div className="bg-surface-container-lowest border border-solid border-outline-variant rounded-lg overflow-hidden flex flex-col">
          {sessionsLoading ? (
            <div className="text-center py-20 text-secondary font-body-md">
              Loading active sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-20 text-secondary font-body-md">
              No active administrative sessions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse m-0">
                <thead>
                  <tr className="bg-surface-container-low border-0 border-b border-solid border-outline-variant">
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Administrator</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">System Role</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Session Type</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Active Workspace</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Login Time</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">IP / Device</th>
                    <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface">
                  {sessions.map((session) => (
                    <tr 
                      key={session.id} 
                      className={`border-0 border-b border-solid border-outline-variant transition-colors ${
                        session.is_impersonation 
                          ? 'bg-purple-50/70 hover:bg-purple-100/70 dark:bg-purple-950/20 dark:hover:bg-purple-900/20' 
                          : 'hover:bg-row-hover'
                      }`}
                    >
                      <td className="p-md whitespace-nowrap">
                        <div className="flex items-center gap-sm">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            session.is_impersonation 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {session.full_name ? session.full_name.charAt(0).toUpperCase() : session.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-on-surface">{session.full_name || session.username}</span>
                            <span className="text-xs text-secondary">{session.email}</span>
                            <span className="text-xs text-outline font-mono mt-0.5">@{session.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-md whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-label-sm text-label-sm border border-solid border-purple-200">
                          {session.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-md whitespace-nowrap">
                        {session.is_impersonation ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-label-sm text-label-sm border border-solid border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                            Impersonation
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-container/10 text-success font-label-sm text-label-sm border border-solid border-success/20">
                            Direct Login
                          </span>
                        )}
                      </td>
                      <td className="p-md whitespace-nowrap">
                        {session.is_impersonation ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-purple-800">{session.impersonation_tenant_name || 'Loading...'}</span>
                            <span className="text-xs text-secondary font-mono">ID: {session.impersonation_tenant_id}</span>
                          </div>
                        ) : (
                          <span className="text-secondary font-body-sm">—</span>
                        )}
                      </td>
                      <td className="p-md whitespace-nowrap text-secondary">
                        {formatDateTime(session.login_time)}
                      </td>
                      <td className="p-md whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-body-sm text-on-surface">{session.ip_address || '127.0.0.1'}</span>
                          <span className="text-[11px] text-outline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">desktop_windows</span>
                            {session.device || 'Web Browser'}
                          </span>
                        </div>
                      </td>
                      <td className="p-md text-right whitespace-nowrap">
                        <button 
                          className="text-primary hover:underline font-label-md bg-transparent border-0 cursor-pointer"
                          onClick={() => setSessionToRevoke({ id: session.id, name: session.full_name || session.username })}
                        >
                          Logout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Drawer */}
      <CreateAdminDrawer 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Drawer */}
      <EditAdminDrawer 
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setAdminToEdit(null)
        }}
        onSuccess={fetchAdmins}
        admin={adminToEdit}
      />


      {/* Delete Confirmation Modal */}
      {adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 transition-opacity duration-300">
          <div className="absolute inset-0 bg-transparent" onClick={() => setAdminToDelete(null)} />
          
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full z-10 overflow-hidden flex flex-col border border-solid border-outline-variant relative p-lg gap-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-sm">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 font-semibold">Delete Administrator</h3>
            </div>
            
            <p className="font-body-sm text-body-sm text-secondary m-0">
              Are you sure you want to permanently delete administrator <strong>@{adminToDelete}</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-md justify-end mt-sm">
              <button 
                type="button" 
                className="bg-transparent border border-solid border-outline-variant text-secondary hover:bg-surface-container px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors"
                onClick={() => setAdminToDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="bg-error text-white border-0 hover:bg-error/90 px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors shadow-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Session Confirmation Modal */}
      {sessionToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 transition-opacity duration-300">
          <div className="absolute inset-0 bg-transparent" onClick={() => setSessionToRevoke(null)} />
          
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full z-10 overflow-hidden flex flex-col border border-solid border-outline-variant relative p-lg gap-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-sm">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[24px]">logout</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 font-semibold">Terminate Session</h3>
            </div>
            
            <p className="font-body-sm text-body-sm text-secondary m-0">
              Are you sure you want to terminate the active session for <strong>{sessionToRevoke.name}</strong>?
            </p>

            <div className="flex gap-md justify-end mt-sm">
              <button 
                type="button" 
                className="bg-transparent border border-solid border-outline-variant text-secondary hover:bg-surface-container px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors"
                onClick={() => setSessionToRevoke(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="bg-error text-white border-0 hover:bg-error/90 px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors shadow-sm"
                onClick={confirmRevokeSession}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Logout All Confirmation Modal */}
      {isForceAllConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 transition-opacity duration-300">
          <div className="absolute inset-0 bg-transparent" onClick={() => setIsForceAllConfirmOpen(false)} />
          
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full z-10 overflow-hidden flex flex-col border border-solid border-outline-variant relative p-lg gap-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-sm">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 font-semibold">Force Logout All</h3>
            </div>
            
            <p className="font-body-sm text-body-sm text-secondary m-0">
              Are you sure you want to force logout <strong>all</strong> active administrative sessions? This will invalidate all active Super Admin tokens and session states.
            </p>

            <div className="flex gap-md justify-end mt-sm">
              <button 
                type="button" 
                className="bg-transparent border border-solid border-outline-variant text-secondary hover:bg-surface-container px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors"
                onClick={() => setIsForceAllConfirmOpen(false)}
                disabled={revokingAll}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="bg-error text-white border-0 hover:bg-error/90 px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors shadow-sm"
                onClick={confirmRevokeAll}
                disabled={revokingAll}
              >
                {revokingAll ? 'Revoking...' : 'Logout All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
