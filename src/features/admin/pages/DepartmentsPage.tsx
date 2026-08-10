import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { clearDepartmentCache } from '@/hooks/useDepartmentStatus';
import { adminService } from '@/api/services/admin';
import type { Department, WardItem } from '@/api/types/admin';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { AdminModal, AdminModalButton, AdminModalFooter } from '@/components/ui/AdminModal';

const DEPARTMENT_TYPES = [
  'Reception', 'Triage', 'Consultation', 'Laboratory', 'Radiology',
  'Pharmacy', 'Ward', 'Icu', 'Billing', 'Admin',
];

// Reusable dropdown menu matching the style from VisitQueuePage
function ActionsMenu({
  id,
  openMenuId,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  id: string;
  openMenuId: string | null;
  onOpenChange: (id: string | null) => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const isOpen = openMenuId === id;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onOpenChange]);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isOpen) {
      onOpenChange(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setAnchor({ top: rect.bottom + 4, left: rect.right - 180 });
    onOpenChange(id);
  };

  const menuItemClass =
    'w-full flex items-center gap-sm px-md py-sm font-body-sm text-body-sm text-left bg-transparent border-0 cursor-pointer hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent';

  return (
    <>
      <button
        type="button"
        title="More actions"
        onClick={handleToggle}
        className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container transition-colors border-0 bg-transparent cursor-pointer"
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {isOpen && anchor && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default border-0 bg-transparent p-0"
            aria-label="Close menu"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(null);
            }}
          />
          <div
            className="fixed z-50 min-w-[180px] py-xs bg-surface-white border border-border-subtle rounded shadow-lg"
            style={{ top: anchor.top, left: Math.max(8, anchor.left) }}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-on-surface`}
              onClick={() => {
                onOpenChange(null);
                onEdit();
              }}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </button>
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                className={`${menuItemClass} text-error`}
                onClick={() => {
                  onOpenChange(null);
                  onDelete();
                }}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

// Renders the departments roster directory and ward occupancy panel
export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Consultation');
  const [wardName, setWardName] = useState('');
  const [wardBeds, setWardBeds] = useState(4);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptType, setEditDeptType] = useState('Consultation');
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);

  const [editingWard, setEditingWard] = useState<WardItem | null>(null);
  const [addBedsCount, setAddBedsCount] = useState(2);
  const [isEditWardModalOpen, setIsEditWardModalOpen] = useState(false);

  const openEditDeptModal = (dept: Department) => {
    setEditingDept(dept);
    setEditDeptName(dept.name);
    setEditDeptType(dept.type || 'Consultation');
    setIsEditDeptModalOpen(true);
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editDeptName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    adminService.updateDepartment(editingDept.id, {
      name: editDeptName.trim(),
      type: editDeptType,
    })
      .then(() => {
        toast.success(`Department "${editDeptName.trim()}" updated.`);
        setIsEditDeptModalOpen(false);
        setEditingDept(null);
        fetchData(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to update department.');
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDeleteDepartment = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete department "${name}"?`)) {
      adminService.deleteDepartment(id)
        .then(() => {
          toast.success(`Department "${name}" deleted.`);
          fetchData(false);
        })
        .catch((err) => {
          toast.error(err.response?.data?.detail || 'Failed to delete department.');
        });
    }
  };

  const openEditWardModal = (ward: WardItem) => {
    setEditingWard(ward);
    setAddBedsCount(2);
    setIsEditWardModalOpen(true);
  };

  const handleAddBedsToWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWard || isSubmitting) return;
    setIsSubmitting(true);
    adminService.createWard({
      name: editingWard.name,
      totalBeds: Math.max(1, addBedsCount),
      occupiedBeds: 0,
    })
      .then(() => {
        toast.success(`Added ${addBedsCount} bed(s) to "${editingWard.name}".`);
        setIsEditWardModalOpen(false);
        setEditingWard(null);
        fetchData(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to update ward capacity.');
      })
      .finally(() => setIsSubmitting(false));
  };

  const fetchData = (showLoading = true) => {
    if (showLoading) setLoading(true);
    Promise.all([
      adminService.listDepartments(),
      adminService.listWards()
    ])
      .then(([deptData, wardData]) => {
        setDepartments(deptData);
        setWards(wardData);
      })
      .catch((err) => {
        console.error('Failed to load departments data:', err);
      })
      .finally(() => {
        if (showLoading) setLoading(false);
      });
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  // Toggle active status
  const toggleDepartmentActive = (id: string) => {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;
    const newActive = !dept.active;
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, active: newActive } : d));
    adminService.updateDepartment(id, { active: newActive })
      .then(() => {
        clearDepartmentCache();
        toast.success(`Department "${dept.name}" ${newActive ? 'activated' : 'deactivated'}.`);
      })
      .catch((err) => {
        console.error('Failed to update department status:', err);
        toast.error(err.response?.data?.detail || 'Failed to update department status.');
        setDepartments(prev => prev.map(d => d.id === id ? { ...d, active: dept.active } : d));
      });
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const name = formName.trim();
    const request = editingDept
      ? adminService.updateDepartment(editingDept.id, { name, type: formType }).then(() => {
          toast.success(`Department "${name}" updated.`);
        })
      : adminService.createDepartment({ name, type: formType }).then(() => {
          toast.success(`Department "${name}" created.`);
        });

    request
      .then(() => {
        toast.success(`Department "${formName.trim()}" created.`);
        setIsModalOpen(false);
        setFormName('');
        fetchData(false);
      })
      .catch((err) => {
        toast.error(
          err.response?.data?.detail ||
            (editingDept ? 'Failed to update department.' : 'Failed to create department.'),
        );
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleCreateWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    adminService
      .createWard({
        name: wardName.trim(),
        totalBeds: Math.max(1, wardBeds),
        occupiedBeds: 0,
      })
      .then(() => {
        toast.success(`Ward "${wardName.trim()}" created with ${Math.max(1, wardBeds)} bed(s).`);
        setIsWardModalOpen(false);
        setWardName('');
        setWardBeds(4);
        fetchData(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to create ward.');
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-lg">
      {/* Page Header */}
      <div className="flex justify-end items-center mb-lg">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-container hover:bg-primary-container/90 text-white px-md h-[40px] rounded-lg flex items-center gap-sm font-label-md transition-colors shadow-sm border-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Department
        </button>
      </div>

      <div className="flex flex-col gap-lg">
        {/* Render department entries list */}
        <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="px-md py-sm flex justify-between items-center border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Departments</h3>
            <div className="flex gap-sm">
              <button className="p-xs text-secondary hover:bg-row-hover rounded-md transition-colors bg-transparent border-0 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button className="p-xs text-secondary hover:bg-row-hover rounded-md transition-colors bg-transparent border-0 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-border-subtle">
                  <th className="px-md py-sm font-label-md text-label-md text-outline uppercase tracking-wider">Dept Name</th>
                  <th className="px-md py-sm font-label-md text-label-md text-outline uppercase tracking-wider">Type</th>
                  <th className="px-md py-sm font-label-md text-label-md text-outline uppercase tracking-wider">Staff Count</th>
                  <th className="px-md py-sm font-label-md text-label-md text-outline uppercase tracking-wider">Status</th>
                  <th className="px-md py-sm font-label-md text-label-md text-outline uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface-white">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-md py-lg text-center text-secondary text-body-sm">
                      Loading departments...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-md py-lg text-center text-secondary text-body-sm">
                      No departments found.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-row-hover transition-colors group">
                      <td className="px-md py-md font-body-md text-on-surface font-medium">{dept.name}</td>
                      <td className="px-md py-md font-body-sm text-secondary">{dept.type || '—'}</td>
                      <td className="px-md py-md font-body-sm text-on-surface">{dept.staffCount}</td>
                      <td className="px-md py-md">
                        <button
                          onClick={() => toggleDepartmentActive(dept.id)}
                          className={`w-10 h-5 rounded-full relative transition-all shadow-inner border-0 cursor-pointer ${
                            dept.active ? 'bg-success' : 'bg-outline-variant'
                          }`}
                          aria-label={`Toggle active state for ${dept.name}`}
                        >
                          <div
                            className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${
                              dept.active ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-md py-md text-right">
                        <div className="flex justify-end">
                          <ActionsMenu
                            id={dept.id}
                            openMenuId={openDropdownId}
                            onOpenChange={setOpenDropdownId}
                            onEdit={() => openEditDeptModal(dept)}
                            onDelete={() => handleDeleteDepartment(dept.id, dept.name)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Render ward capacity panel */}
        <section className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
          <div className="px-md py-sm flex justify-between items-center border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Wards &amp; Beds</h3>
            <button
              onClick={() => setIsWardModalOpen(true)}
              className="bg-surface-white border border-primary text-primary px-sm h-[32px] rounded-md flex items-center gap-xs font-label-md hover:bg-primary/5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Ward
            </button>
          </div>
          
          <div className="p-md space-y-md bg-surface-white">
            {loading ? (
              <div className="text-center text-secondary text-body-sm py-md">Loading wards...</div>
            ) : wards.length === 0 ? (
              <div className="text-center text-secondary text-body-sm py-md">No wards found.</div>
            ) : (
              wards.map((ward) => {
                const occupancyPercentage = Math.round((ward.occupiedBeds / ward.totalBeds) * 100) || 0;
                const barColorClass = ward.isUrgent ? 'bg-warning' : 'bg-success';
                const badgeColorClass = ward.isUrgent 
                  ? 'text-warning bg-warning/10' 
                  : 'text-success bg-success/10';

                return (
                  <div key={ward.id} className="flex items-center gap-lg group border-b border-border-subtle pb-md last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-sm">
                        <div className="flex items-center gap-sm">
                          <span className={`material-symbols-outlined ${ward.isUrgent ? 'text-error' : 'text-secondary'}`}>
                            {ward.isUrgent ? 'emergency' : 'bed'}
                          </span>
                          <span className="font-body-md font-medium text-on-surface">{ward.name}</span>
                          {ward.isUrgent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-error text-white rounded-md uppercase tracking-wide">
                              High Alert
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-sm">
                          <span className="font-body-sm text-on-surface font-medium">
                            {ward.occupiedBeds} / {ward.totalBeds} <span className="text-secondary font-normal">Beds</span>
                          </span>
                          <ActionsMenu
                            id={ward.id}
                            openMenuId={openDropdownId}
                            onOpenChange={setOpenDropdownId}
                            onEdit={() => openEditWardModal(ward)}
                          />
                        </div>
                      </div>
                      
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${barColorClass}`}
                          style={{ width: `${occupancyPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-32 text-right">
                      <span className={`text-label-sm font-semibold px-sm py-1 rounded-full ${badgeColorClass}`}>
                        {occupancyPercentage}% Occ.
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Add Department modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[420px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-headline-sm text-[18px] font-semibold text-on-surface">Add Department</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveDepartment}>
              <div className="px-lg py-lg space-y-md">
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Department Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g. Emergency Department"
                  />
                </div>
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Department Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
                  >
                    {DEPARTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t === 'Icu' ? 'ICU' : t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer', lineHeight: '1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#0052cc', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', lineHeight: '1', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ward modal */}
      {isWardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[420px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-headline-sm text-[18px] font-semibold text-on-surface">Add Ward</h3>
              <button
                type="button"
                onClick={() => setIsWardModalOpen(false)}
                className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer"
                aria-label="Close ward modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateWard}>
              <div className="px-lg py-lg space-y-md">
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Ward Name</label>
                  <input
                    type="text"
                    required
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g. General Ward A"
                  />
                </div>
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Number of Beds</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={wardBeds}
                    onChange={(e) => setWardBeds(Number(e.target.value))}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <button
                  type="button"
                  onClick={() => setIsWardModalOpen(false)}
                  style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer', lineHeight: '1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#0052cc', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', lineHeight: '1', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Department Modal */}
      {isEditDeptModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[420px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-headline-sm text-[18px] font-semibold text-on-surface">Edit Department</h3>
              <button
                type="button"
                onClick={() => setIsEditDeptModalOpen(false)}
                className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer"
                aria-label="Close edit department modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateDepartment}>
              <div className="px-lg py-lg space-y-md">
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Department Name</label>
                  <input
                    type="text"
                    required
                    value={editDeptName}
                    onChange={(e) => setEditDeptName(e.target.value)}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Department Type</label>
                  <select
                    value={editDeptType}
                    onChange={(e) => setEditDeptType(e.target.value)}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
                  >
                    {DEPARTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t === 'Icu' ? 'ICU' : t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <button
                  type="button"
                  onClick={() => setIsEditDeptModalOpen(false)}
                  style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer', lineHeight: '1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#0052cc', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', lineHeight: '1', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? 'Updating...' : 'Update Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Ward / Add Beds Modal */}
      {isEditWardModalOpen && editingWard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[420px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-headline-sm text-[18px] font-semibold text-on-surface">Manage Ward Beds</h3>
              <button
                type="button"
                onClick={() => setIsEditWardModalOpen(false)}
                className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer"
                aria-label="Close edit ward modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAddBedsToWard}>
              <div className="px-lg py-lg space-y-md">
                <div>
                  <p className="font-body-md font-semibold text-on-surface mb-1">{editingWard.name}</p>
                  <p className="text-xs text-secondary">
                    Current Capacity: {editingWard.occupiedBeds} / {editingWard.totalBeds} Beds
                  </p>
                </div>
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Additional Beds to Add</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={addBedsCount}
                    onChange={(e) => setAddBedsCount(Number(e.target.value))}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <button
                  type="button"
                  onClick={() => setIsEditWardModalOpen(false)}
                  style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer', lineHeight: '1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#0052cc', color: '#ffffff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', lineHeight: '1', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? 'Adding...' : 'Add Beds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

