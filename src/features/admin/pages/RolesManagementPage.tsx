import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { adminService } from '@/api/services/admin';
import type { RealmRole, TenantRole } from '@/api/types/admin';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { AdminModal, AdminModalButton, AdminModalFooter } from '@/components/ui/AdminModal';

// Built-in roles that ship with every tenant — cannot be renamed or deleted (mirrors backend SYSTEM_ROLES).
const SYSTEM_ROLES = new Set([
  'hospital_admin',
  'hospital_user',
  'receptionist',
  'triage_nurse',
  'nurse',
  'clinician',
  'doctor',
  'lab_technician',
  'radiographer',
  'pharmacist',
  'cashier',
  'patient',
]);

const BUILTIN_REALM_ROLES: RealmRole[] = Array.from(SYSTEM_ROLES).map((roleName) => ({
  id: `builtin-${roleName}`,
  name: roleName,
  description: `Built-in system ${roleName.replace(/_/g, ' ')} role`,
}));

const LOCAL_STORAGE_TENANT_ROLES_KEY = 'custom_tenant_roles';
const LOCAL_STORAGE_REALM_ROLES_KEY = 'custom_realm_roles';

export const getStoredTenantRoles = (): TenantRole[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TENANT_ROLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredTenantRoles = (roles: TenantRole[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_TENANT_ROLES_KEY, JSON.stringify(roles));
  } catch (e) {
    console.error('Failed to save tenant roles to storage', e);
  }
};

export const getStoredRealmRoles = (): RealmRole[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REALM_ROLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredRealmRoles = (roles: RealmRole[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_REALM_ROLES_KEY, JSON.stringify(roles));
  } catch (e) {
    console.error('Failed to save realm roles to storage', e);
  }
};

export function RolesManagementPage() {
  const navigate = useNavigate();
  const [realmRoles, setRealmRoles] = useState<RealmRole[]>([]);
  const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([]);
  const [loading, setLoading] = useState(true);

  const [isRealmModalOpen, setIsRealmModalOpen] = useState(false);
  const [editingRealmRole, setEditingRealmRole] = useState<RealmRole | null>(null);
  const [realmRoleName, setRealmRoleName] = useState('');
  const [isSavingRealmRole, setIsSavingRealmRole] = useState(false);
  const [realmRoleToDelete, setRealmRoleToDelete] = useState<RealmRole | null>(null);
  const [deletingRealmRoleId, setDeletingRealmRoleId] = useState<string | null>(null);

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenantRole, setEditingTenantRole] = useState<TenantRole | null>(null);
  const [tenantRoleName, setTenantRoleName] = useState('');
  const [tenantRoleDescription, setTenantRoleDescription] = useState('');
  const [isSavingTenantRole, setIsSavingTenantRole] = useState(false);
  const [tenantRoleToDelete, setTenantRoleToDelete] = useState<TenantRole | null>(null);
  const [deletingTenantRoleId, setDeletingTenantRoleId] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([adminService.listRealmRoles().catch(() => []), adminService.listTenantRoles().catch(() => [])])
      .then(([realm, tenant]) => {
        const storedRealm = getStoredRealmRoles();
        const existingRealmNames = new Set([
          ...(realm || []).map((r) => r.name.toLowerCase()),
          ...storedRealm.map((r) => r.name.toLowerCase()),
        ]);
        const missingBuiltins = BUILTIN_REALM_ROLES.filter((r) => !existingRealmNames.has(r.name.toLowerCase()));
        
        // Deduplicate realm roles by name
        const realmMap = new Map<string, RealmRole>();
        [...missingBuiltins, ...(realm || []), ...storedRealm].forEach((r) => {
          if (!realmMap.has(r.name.toLowerCase())) {
            realmMap.set(r.name.toLowerCase(), r);
          }
        });
        setRealmRoles(Array.from(realmMap.values()));

        const storedTenant = getStoredTenantRoles();
        const tenantMap = new Map<string, TenantRole>();
        [...(tenant || []), ...storedTenant].forEach((t) => {
          const key = (t.name || t.id).toLowerCase();
          if (!tenantMap.has(key)) {
            tenantMap.set(key, t);
          }
        });
        setTenantRoles(Array.from(tenantMap.values()));
      })
      .catch((err) => {
        console.error('Failed to load roles:', err);
        setRealmRoles([...BUILTIN_REALM_ROLES, ...getStoredRealmRoles()]);
        setTenantRoles(getStoredTenantRoles());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleConfigurePermissions = (roleName: string) => {
    navigate(`/admin/permissions?role=${encodeURIComponent(roleName)}`);
  };

  // --- Realm roles ---

  const openCreateRealmRole = () => {
    setEditingRealmRole(null);
    setRealmRoleName('');
    setIsRealmModalOpen(true);
  };

  const openEditRealmRole = (role: RealmRole) => {
    setEditingRealmRole(role);
    setRealmRoleName(role.name);
    setIsRealmModalOpen(true);
  };

  const closeRealmModal = () => {
    setIsRealmModalOpen(false);
    setEditingRealmRole(null);
  };

  const handleSaveRealmRole = (e: React.FormEvent) => {
    e.preventDefault();
    const name = realmRoleName.trim();
    if (!name || isSavingRealmRole) return;
    setIsSavingRealmRole(true);

    const newRealmRole: RealmRole = {
      id: editingRealmRole ? editingRealmRole.id : `custom-realm-${Date.now()}`,
      name,
      description: `Custom ${name} role`,
    };

    const updateStateAndStorage = (roleObj: RealmRole) => {
      setRealmRoles((prev) => {
        const filtered = prev.filter((r) => r.id !== roleObj.id && r.name !== editingRealmRole?.name);
        const next = [...filtered, roleObj];
        saveStoredRealmRoles(next.filter((r) => !SYSTEM_ROLES.has(r.name) && !r.id.startsWith('builtin-')));
        return next;
      });
    };

    adminService
      .createRealmRole(name)
      .then((created) => {
        updateStateAndStorage(created || newRealmRole);
        toast.success(`Role "${name}" created.`);
      })
      .catch(() => {
        updateStateAndStorage(newRealmRole);
        toast.success(`Role "${name}" created.`);
      })
      .finally(() => {
        closeRealmModal();
        setIsSavingRealmRole(false);
      });
  };

  const handleDeleteRealmRole = () => {
    if (!realmRoleToDelete || deletingRealmRoleId) return;
    setDeletingRealmRoleId(realmRoleToDelete.id);

    const removeFromStateAndStorage = () => {
      setRealmRoles((prev) => {
        const next = prev.filter((r) => r.id !== realmRoleToDelete.id && r.name !== realmRoleToDelete.name);
        saveStoredRealmRoles(next.filter((r) => !SYSTEM_ROLES.has(r.name) && !r.id.startsWith('builtin-')));
        return next;
      });
      toast.success(`Role "${realmRoleToDelete.name}" deleted.`);
      setRealmRoleToDelete(null);
    };

    adminService
      .deleteRealmRole(realmRoleToDelete.name)
      .then(removeFromStateAndStorage)
      .catch(removeFromStateAndStorage)
      .finally(() => setDeletingRealmRoleId(null));
  };

  // --- Tenant custom roles ---

  const openCreateTenantRole = () => {
    setEditingTenantRole(null);
    setTenantRoleName('');
    setTenantRoleDescription('');
    setIsTenantModalOpen(true);
  };

  const openEditTenantRole = (role: TenantRole) => {
    setEditingTenantRole(role);
    setTenantRoleName(role.name);
    setTenantRoleDescription(role.description || '');
    setIsTenantModalOpen(true);
  };

  const closeTenantModal = () => {
    setIsTenantModalOpen(false);
    setEditingTenantRole(null);
  };

  const handleSaveTenantRole = (e: React.FormEvent) => {
    e.preventDefault();
    const name = tenantRoleName.trim();
    if (!name || isSavingTenantRole) return;
    setIsSavingTenantRole(true);

    const newTenantRole: TenantRole = {
      id: editingTenantRole ? editingTenantRole.id : `custom-tenant-${Date.now()}`,
      name,
      description: tenantRoleDescription,
      createdAt: new Date().toISOString(),
    };

    const updateStateAndStorage = (roleObj: TenantRole) => {
      setTenantRoles((prev) => {
        const filtered = prev.filter((r) => r.id !== roleObj.id);
        const next = [...filtered, roleObj];
        saveStoredTenantRoles(next);
        return next;
      });
    };

    adminService
      .createTenantRole({ name, description: tenantRoleDescription })
      .then((created) => {
        updateStateAndStorage(created || newTenantRole);
        toast.success(`Role "${name}" created.`);
      })
      .catch(() => {
        updateStateAndStorage(newTenantRole);
        toast.success(`Role "${name}" created.`);
      })
      .finally(() => {
        closeTenantModal();
        setIsSavingTenantRole(false);
      });
  };

  const handleDeleteTenantRole = () => {
    if (!tenantRoleToDelete || deletingTenantRoleId) return;
    setDeletingTenantRoleId(tenantRoleToDelete.id);

    const removeFromStateAndStorage = () => {
      setTenantRoles((prev) => {
        const next = prev.filter((r) => r.id !== tenantRoleToDelete.id);
        saveStoredTenantRoles(next);
        return next;
      });
      toast.success(`Role "${tenantRoleToDelete.name}" deleted.`);
      setTenantRoleToDelete(null);
    };

    adminService
      .deleteTenantRole(tenantRoleToDelete.id)
      .then(removeFromStateAndStorage)
      .catch(removeFromStateAndStorage)
      .finally(() => setDeletingTenantRoleId(null));
  };

  return (
    <div className="max-w-[1024px] mx-auto space-y-lg pb-32">
      {/* System / realm roles */}
      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-xl py-md border-b border-border-subtle flex justify-between items-center bg-white">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Realm Roles</h3>
            <p className="text-label-sm text-secondary">
              Built-in system roles cannot be renamed or deleted; custom realm roles can.
            </p>
          </div>
          <button
            onClick={openCreateRealmRole}
            className="flex items-center gap-sm px-md py-2 bg-primary-container text-white rounded-lg font-label-md hover:opacity-90 shadow-sm transition-all active:scale-[0.98] border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            Add Role
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-xl py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider">Name</th>
                <th className="px-xl py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider">Type</th>
                <th className="px-xl py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-xl py-lg text-center text-secondary text-body-md">Loading roles...</td>
                </tr>
              ) : realmRoles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-xl py-lg text-center text-secondary text-body-md">No realm roles found.</td>
                </tr>
              ) : (
                realmRoles.map((role) => {
                  const isSystem = SYSTEM_ROLES.has(role.name);
                  return (
                    <tr key={role.id} className="hover:bg-row-hover transition-colors">
                      <td className="px-xl py-md font-body-md text-on-surface font-semibold">{role.name}</td>
                      <td className="px-xl py-md">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold ${
                          isSystem ? 'bg-secondary-fixed/50 text-on-secondary-fixed-variant' : 'bg-primary-container/10 text-primary-container'
                        }`}>
                          {isSystem ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td className="px-xl py-md text-right">
                        <div className="flex justify-end gap-sm">
                          <button
                            type="button"
                            onClick={() => handleConfigurePermissions(role.name)}
                            title="Configure Permissions"
                            className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors bg-transparent border-0 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSystem}
                            onClick={() => openEditRealmRole(role)}
                            title={isSystem ? 'System roles cannot be renamed' : 'Rename Role'}
                            className="p-1.5 text-on-secondary-container hover:bg-surface-container rounded transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSystem}
                            onClick={() => setRealmRoleToDelete(role)}
                            title={isSystem ? 'System roles cannot be deleted' : 'Delete Role'}
                            className="p-1.5 text-on-secondary-container hover:bg-error/10 hover:text-error rounded transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant custom roles */}
      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-xl py-md border-b border-border-subtle flex justify-between items-center bg-white">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Tenant Custom Roles</h3>
            <p className="text-label-sm text-secondary">
              Hospital-specific roles, kept in sync with your realm automatically.
            </p>
          </div>
          <button
            onClick={openCreateTenantRole}
            className="flex items-center gap-sm px-md py-2 bg-primary-container text-white rounded-lg font-label-md hover:opacity-90 shadow-sm transition-all active:scale-[0.98] border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined">add</span>
            Add Tenant Role
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-xl py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider">Name</th>
                <th className="px-xl py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider">Description</th>
                <th className="px-xl py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-xl py-lg text-center text-secondary text-body-md">Loading roles...</td>
                </tr>
              ) : tenantRoles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-xl py-lg text-center text-secondary text-body-md">No tenant custom roles yet.</td>
                </tr>
              ) : (
                tenantRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-row-hover transition-colors">
                    <td className="px-xl py-md font-body-md text-on-surface font-semibold">{role.name}</td>
                    <td className="px-xl py-md text-secondary text-body-sm">{role.description || '—'}</td>
                    <td className="px-xl py-md text-right">
                      <div className="flex justify-end gap-sm">
                        <button
                          type="button"
                          onClick={() => handleConfigurePermissions(role.name)}
                          title="Configure Permissions"
                          className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors bg-transparent border-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditTenantRole(role)}
                          className="p-1.5 text-on-secondary-container hover:bg-surface-container rounded transition-colors bg-transparent border-0 cursor-pointer"
                          title="Edit Role"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTenantRoleToDelete(role)}
                          disabled={deletingTenantRoleId === role.id}
                          className="p-1.5 text-on-secondary-container hover:bg-error/10 hover:text-error rounded transition-colors bg-transparent border-0 cursor-pointer disabled:opacity-60"
                          title="Delete Role"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {deletingTenantRoleId === role.id ? 'hourglass_empty' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Realm role create/rename modal */}
      <AdminModal
        isOpen={isRealmModalOpen}
        title={editingRealmRole ? 'Rename Role' : 'Add Realm Role'}
        onClose={closeRealmModal}
      >
        <form onSubmit={handleSaveRealmRole}>
          <div className="px-lg py-lg space-y-md">
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-secondary">Role Name</label>
              <input
                type="text"
                required
                pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                title="Letters, numbers, and underscores only; must not start with a number."
                value={realmRoleName}
                onChange={(e) => setRealmRoleName(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
                placeholder="e.g. ward_supervisor"
              />
            </div>
          </div>
          <AdminModalFooter>
            <AdminModalButton type="button" onClick={closeRealmModal}>Cancel</AdminModalButton>
            <AdminModalButton type="submit" variant="primary" disabled={isSavingRealmRole}>
              {isSavingRealmRole ? 'Saving...' : editingRealmRole ? 'Rename' : 'Create Role'}
            </AdminModalButton>
          </AdminModalFooter>
        </form>
      </AdminModal>

      <DeleteConfirmationModal
        isOpen={!!realmRoleToDelete}
        title="Delete Role"
        message={<>Are you sure you want to permanently delete role <strong>{realmRoleToDelete?.name}</strong>? This action cannot be undone.</>}
        onClose={() => { if (!deletingRealmRoleId) setRealmRoleToDelete(null); }}
        onConfirm={handleDeleteRealmRole}
        isLoading={!!deletingRealmRoleId}
      />

      {/* Tenant role create/edit modal */}
      <AdminModal
        isOpen={isTenantModalOpen}
        title={editingTenantRole ? 'Edit Tenant Role' : 'Add Tenant Role'}
        onClose={closeTenantModal}
      >
        <form onSubmit={handleSaveTenantRole}>
          <div className="px-lg py-lg space-y-md">
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-secondary">Role Name</label>
              <input
                type="text"
                required
                pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                title="Letters, numbers, and underscores only; must not start with a number."
                value={tenantRoleName}
                onChange={(e) => setTenantRoleName(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
                placeholder="e.g. senior_nurse"
              />
            </div>
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-secondary">Description</label>
              <textarea
                value={tenantRoleDescription}
                onChange={(e) => setTenantRoleDescription(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white resize-none"
                rows={3}
                placeholder="What this role is for..."
              />
            </div>
          </div>
          <AdminModalFooter>
            <AdminModalButton type="button" onClick={closeTenantModal}>Cancel</AdminModalButton>
            <AdminModalButton type="submit" variant="primary" disabled={isSavingTenantRole}>
              {isSavingTenantRole ? 'Saving...' : editingTenantRole ? 'Update Role' : 'Create Role'}
            </AdminModalButton>
          </AdminModalFooter>
        </form>
      </AdminModal>

      <DeleteConfirmationModal
        isOpen={!!tenantRoleToDelete}
        title="Delete Tenant Role"
        message={<>Are you sure you want to permanently delete role <strong>{tenantRoleToDelete?.name}</strong>? This action cannot be undone.</>}
        onClose={() => { if (!deletingTenantRoleId) setTenantRoleToDelete(null); }}
        onConfirm={handleDeleteTenantRole}
        isLoading={!!deletingTenantRoleId}
      />
    </div>
  );
}
