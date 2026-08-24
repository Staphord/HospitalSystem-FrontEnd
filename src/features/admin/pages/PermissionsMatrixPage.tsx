import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { adminService } from '@/api/services/admin';
import type { RolePermission } from '@/api/types/admin';
import { getStoredTenantRoles, getStoredRealmRoles } from './RolesManagementPage';

const MODULES = [
  'admin', 'reception', 'triage', 'consultation', 'laboratory',
  'radiology', 'pharmacy', 'ward', 'billing', 'reports',
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'configure', 'report', 'backup'];

interface DraftPermission {
  modules: Set<string>;
  actions: Set<string>;
}

const BUILTIN_SYSTEM_ROLES = [
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
];

const DEFAULT_SYSTEM_PERMISSIONS: Record<string, { modules: string[]; actions: string[] }> = {
  hospital_admin: { modules: MODULES, actions: ACTIONS },
  hospital_user: { modules: ['reception', 'triage', 'consultation'], actions: ['read'] },
  receptionist: { modules: ['reception', 'billing', 'reports'], actions: ['create', 'read', 'update'] },
  triage_nurse: { modules: ['triage', 'reception', 'consultation'], actions: ['create', 'read', 'update'] },
  nurse: { modules: ['triage', 'ward', 'consultation'], actions: ['create', 'read', 'update'] },
  clinician: { modules: ['consultation', 'ward', 'reports', 'triage'], actions: ['create', 'read', 'update'] },
  doctor: { modules: ['consultation', 'ward', 'laboratory', 'radiology', 'pharmacy', 'reports'], actions: ['create', 'read', 'update'] },
  lab_technician: { modules: ['laboratory', 'reports'], actions: ['create', 'read', 'update'] },
  radiographer: { modules: ['radiology', 'reports'], actions: ['create', 'read', 'update'] },
  pharmacist: { modules: ['pharmacy', 'billing', 'reports'], actions: ['create', 'read', 'update'] },
  cashier: { modules: ['billing', 'reception', 'reports'], actions: ['create', 'read', 'update'] },
  patient: { modules: ['reception'], actions: ['read'] },
};

export function PermissionsMatrixPage() {
  const [searchParams] = useSearchParams();
  const highlightedRole = searchParams.get('role');

  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, DraftPermission>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);

  const fetchPermissions = () => {
    setLoading(true);
    Promise.all([
      adminService.listPermissions().catch(() => []),
      adminService.listTenantRoles().catch(() => []),
      adminService.listRealmRoles().catch(() => []),
    ])
      .then(([rows, tenantRoles, realmRoles]) => {
        const existingRoles = new Set((rows || []).map((r) => r.roleName.toLowerCase()));

        const storedTenant = getStoredTenantRoles();
        const storedRealm = getStoredRealmRoles();

        // Collect all custom tenant roles and realm roles
        const allRolesFromList = [
          ...BUILTIN_SYSTEM_ROLES,
          ...(tenantRoles || []).map((r) => r.name),
          ...storedTenant.map((r) => r.name),
          ...(realmRoles || []).map((r) => r.name),
          ...storedRealm.map((r) => r.name),
        ];

        const missingPerms: RolePermission[] = [];
        allRolesFromList.forEach((roleName) => {
          if (!existingRoles.has(roleName.toLowerCase())) {
            existingRoles.add(roleName.toLowerCase());
            missingPerms.push({
              roleName,
              modules: DEFAULT_SYSTEM_PERMISSIONS[roleName]?.modules || ['reception', 'reports'],
              actions: DEFAULT_SYSTEM_PERMISSIONS[roleName]?.actions || ['read'],
              updatedAt: new Date().toISOString(),
            });
          }
        });

        // Ensure URL target role is also included if present
        if (highlightedRole && !existingRoles.has(highlightedRole.toLowerCase())) {
          existingRoles.add(highlightedRole.toLowerCase());
          missingPerms.push({
            roleName: highlightedRole,
            modules: ['reception', 'reports'],
            actions: ['read'],
            updatedAt: new Date().toISOString(),
          });
        }

        const merged = [...missingPerms, ...(rows || [])];
        setPermissions(merged);

        const nextDrafts: Record<string, DraftPermission> = {};
        merged.forEach((row) => {
          nextDrafts[row.roleName] = {
            modules: new Set(row.modules),
            actions: new Set(row.actions),
          };
        });
        setDrafts(nextDrafts);
      })
      .catch((err) => {
        console.error('Failed to load permissions:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (highlightedRole && !loading) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`role-card-${highlightedRole.toLowerCase()}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [highlightedRole, loading]);

  const toggleModule = (roleName: string, mod: string) => {
    setDrafts((prev) => {
      const current = prev[roleName] || { modules: new Set(), actions: new Set() };
      const modules = new Set(current.modules);
      if (modules.has(mod)) modules.delete(mod);
      else modules.add(mod);
      return { ...prev, [roleName]: { ...current, modules } };
    });
  };

  const toggleAction = (roleName: string, action: string) => {
    setDrafts((prev) => {
      const current = prev[roleName] || { modules: new Set(), actions: new Set() };
      const actions = new Set(current.actions);
      if (actions.has(action)) actions.delete(action);
      else actions.add(action);
      return { ...prev, [roleName]: { ...current, actions } };
    });
  };

  const isDirty = (roleName: string): boolean => {
    const original = permissions.find((p) => p.roleName === roleName);
    const draft = drafts[roleName];
    if (!original || !draft) return false;
    const origModules = new Set(original.modules);
    const origActions = new Set(original.actions);
    if (origModules.size !== draft.modules.size || origActions.size !== draft.actions.size) return true;
    for (const m of draft.modules) if (!origModules.has(m)) return true;
    for (const a of draft.actions) if (!origActions.has(a)) return true;
    return false;
  };

  const handleSave = (roleName: string) => {
    const draft = drafts[roleName];
    if (!draft || savingRole) return;
    setSavingRole(roleName);
    adminService
      .updatePermissions(roleName, {
        modules: Array.from(draft.modules),
        actions: Array.from(draft.actions),
      })
      .then((updated) => {
        toast.success(`Permissions updated for "${roleName}".`);
        setPermissions((prev) => prev.map((p) => (p.roleName === roleName ? updated : p)));
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to update permissions.');
      })
      .finally(() => setSavingRole(null));
  };

  return (
    <div className="max-w-[1024px] mx-auto space-y-lg pb-32">
      <div className="mb-sm">
        <p className="text-body-sm text-secondary">
          Controls which modules and actions each role can access in the UI.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-secondary py-xl">Loading permissions...</div>
      ) : permissions.length === 0 ? (
        <div className="text-center text-secondary py-xl">No permission entries found.</div>
      ) : (
        <div className="space-y-md">
          {permissions.map((perm) => {
            const draft = drafts[perm.roleName] || { modules: new Set<string>(), actions: new Set<string>() };
            const dirty = isDirty(perm.roleName);
            const isHighlighted = highlightedRole && highlightedRole.toLowerCase() === perm.roleName.toLowerCase();
            return (
              <div
                key={perm.roleName}
                id={`role-card-${perm.roleName.toLowerCase()}`}
                className={`bg-surface-white border rounded-xl overflow-hidden shadow-sm transition-all ${
                  isHighlighted ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-border-subtle'
                }`}
              >
                <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between bg-white">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface capitalize">{perm.roleName.replace(/_/g, ' ')}</h3>
                  <button
                    type="button"
                    onClick={() => handleSave(perm.roleName)}
                    disabled={!dirty || savingRole === perm.roleName}
                    className="px-md py-1.5 bg-primary-container text-white rounded-lg font-label-md hover:opacity-90 shadow-sm transition-all active:scale-[0.98] border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingRole === perm.roleName ? 'Saving...' : dirty ? 'Save Changes' : 'Saved'}
                  </button>
                </div>
                <div className="px-lg py-md grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <div>
                    <p className="text-label-sm text-secondary uppercase tracking-wider mb-sm">Modules</p>
                    <div className="flex flex-wrap gap-sm">
                      {MODULES.map((mod) => {
                        const checked = draft.modules.has(mod);
                        return (
                          <label
                            key={mod}
                            className={`px-sm py-1 rounded-md text-label-sm capitalize cursor-pointer border transition-colors ${
                              checked
                                ? 'bg-primary-container/10 border-primary-container text-primary-container font-semibold'
                                : 'bg-surface-container-low border-border-subtle text-secondary'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleModule(perm.roleName, mod)}
                              className="hidden"
                            />
                            {mod}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-label-sm text-secondary uppercase tracking-wider mb-sm">Actions</p>
                    <div className="flex flex-wrap gap-sm">
                      {ACTIONS.map((action) => {
                        const checked = draft.actions.has(action);
                        return (
                          <label
                            key={action}
                            className={`px-sm py-1 rounded-md text-label-sm capitalize cursor-pointer border transition-colors ${
                              checked
                                ? 'bg-success/10 border-success text-success font-semibold'
                                : 'bg-surface-container-low border-border-subtle text-secondary'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleAction(perm.roleName, action)}
                              className="hidden"
                            />
                            {action}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
