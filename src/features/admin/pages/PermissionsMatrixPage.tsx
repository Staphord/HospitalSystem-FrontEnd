import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminService } from '@/api/services/admin';
import type { RolePermission } from '@/api/types/admin';

const MODULES = [
  'admin', 'reception', 'triage', 'consultation', 'laboratory',
  'radiology', 'pharmacy', 'ward', 'billing', 'reports',
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'configure', 'report', 'backup'];

interface DraftPermission {
  modules: Set<string>;
  actions: Set<string>;
}

export function PermissionsMatrixPage() {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, DraftPermission>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);

  const fetchPermissions = () => {
    setLoading(true);
    adminService
      .listPermissions()
      .then((rows) => {
        setPermissions(rows);
        const nextDrafts: Record<string, DraftPermission> = {};
        rows.forEach((row) => {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPermissions();
  }, []);

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
      <div className="mb-xl">
        <nav className="flex items-center gap-xs text-secondary font-label-md text-[11px] uppercase tracking-wider">
          <span>Hospital Configuration</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Permissions</span>
        </nav>
        <p className="text-body-sm text-secondary mt-xs">
          Controls which modules and actions each role can access in the UI. This is a display-level ACL,
          separate from the role assigned to a user account.
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
            return (
              <div key={perm.roleName} className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
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
