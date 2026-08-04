import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { adminService } from '@/api/services/admin';
import type { Department, WardItem } from '@/api/types/admin';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';
import { AdminModal, AdminModalButton, AdminModalFooter } from '@/components/ui/AdminModal';

const DEPARTMENT_TYPES = [
  'Reception', 'Triage', 'Consultation', 'Laboratory', 'Radiology',
  'Pharmacy', 'Ward', 'Icu', 'Billing', 'Admin',
];

// Renders the departments roster directory and ward occupancy panel
export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Consultation');
  const [wardName, setWardName] = useState('');
  const [wardBeds, setWardBeds] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [editingWard, setEditingWard] = useState<WardItem | null>(null);
  const [editWardName, setEditWardName] = useState('');
  const [editWardBeds, setEditWardBeds] = useState(4);
  const [isSavingWard, setIsSavingWard] = useState(false);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormName('');
    setFormType('Consultation');
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormName(dept.name);
    const matchedType = DEPARTMENT_TYPES.find(
      (t) => t.toLowerCase() === (dept.type || '').toLowerCase(),
    );
    setFormType(matchedType || 'Consultation');
    setIsModalOpen(true);
  };

  const closeDeptModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setFormName('');
    setFormType('Consultation');
  };

  const fetchData = () => {
    setLoading(true);
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
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  // Toggle active status
  const toggleDepartmentActive = (id: string) => {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;
    adminService.updateDepartment(id, { active: !dept.active })
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        console.error('Failed to update department status:', err);
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
        closeDeptModal();
        fetchData();
      })
      .catch((err) => {
        toast.error(
          err.response?.data?.detail ||
            (editingDept ? 'Failed to update department.' : 'Failed to create department.'),
        );
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleDeleteDepartment = () => {
    if (!deptToDelete || deletingId) return;

    setDeletingId(deptToDelete.id);
    adminService
      .deleteDepartment(deptToDelete.id)
      .then(() => {
        toast.success(`Department "${deptToDelete.name}" deleted.`);
        setDeptToDelete(null);
        fetchData();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to delete department.');
      })
      .finally(() => setDeletingId(null));
  };

  const openEditWardModal = (ward: WardItem) => {
    setEditingWard(ward);
    setEditWardName(ward.name);
    setEditWardBeds(ward.totalBeds);
  };

  const closeEditWardModal = () => {
    setEditingWard(null);
  };

  const handleUpdateWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWard || !editWardName.trim() || isSavingWard) return;
    setIsSavingWard(true);
    const name = editWardName.trim();
    adminService
      .updateWard(editingWard.id, { name, totalBeds: Math.max(editWardBeds, editingWard.totalBeds) })
      .then(() => {
        toast.success(`Ward "${name}" updated.`);
        closeEditWardModal();
        fetchData();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to update ward.');
      })
      .finally(() => setIsSavingWard(false));
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
        fetchData();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to create ward.');
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-lg">
      {/* Page Header and breadcrumb links */}
      <div className="flex justify-between items-center mb-lg">
        <div>
          <nav className="flex text-label-sm text-outline mt-1 gap-1">
            <span className="text-secondary font-medium">Hospital Configuration</span>
            <span>/</span>
            <span className="text-secondary">Departments &amp; Wards</span>
          </nav>
        </div>
        <button
          onClick={openCreateModal}
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
                        <div className="flex items-center justify-end gap-xs">
                          <button
                            type="button"
                            onClick={() => openEditModal(dept)}
                            className="w-8 h-8 flex items-center justify-center rounded bg-surface-white border border-border-subtle text-secondary hover:text-primary hover:border-primary transition-all cursor-pointer"
                            aria-label={`Edit ${dept.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeptToDelete(dept)}
                            disabled={deletingId === dept.id}
                            className="w-8 h-8 flex items-center justify-center rounded bg-surface-white border border-error/30 text-error hover:bg-error/10 hover:border-error transition-all cursor-pointer disabled:opacity-60"
                            aria-label={`Delete ${dept.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px] text-error">
                              {deletingId === dept.id ? 'hourglass_empty' : 'delete'}
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
                          <button
                            type="button"
                            onClick={() => openEditWardModal(ward)}
                            className="text-outline hover:text-primary transition-colors p-1 rounded hover:bg-row-hover bg-transparent border-0 cursor-pointer"
                            aria-label={`Edit ${ward.name}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
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

      <AdminModal
        isOpen={isModalOpen}
        title={editingDept ? 'Edit Department' : 'Add Department'}
        onClose={closeDeptModal}
      >
        <form onSubmit={handleSaveDepartment}>
          <div className="px-lg py-lg space-y-md">
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-secondary">Department Name</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
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
          <AdminModalFooter>
            <AdminModalButton type="button" onClick={closeDeptModal}>
              Cancel
            </AdminModalButton>
            <AdminModalButton type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingDept ? 'Update Department' : 'Save Department'}
            </AdminModalButton>
          </AdminModalFooter>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={isWardModalOpen}
        title="Add Ward"
        onClose={() => setIsWardModalOpen(false)}
      >
        <form onSubmit={handleCreateWard}>
          <div className="px-lg py-lg space-y-md">
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-secondary">Ward Name</label>
              <input
                type="text"
                required
                value={wardName}
                onChange={(e) => setWardName(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
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
                className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
              />
            </div>
          </div>
          <AdminModalFooter>
            <AdminModalButton type="button" onClick={() => setIsWardModalOpen(false)}>
              Cancel
            </AdminModalButton>
            <AdminModalButton type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Ward'}
            </AdminModalButton>
          </AdminModalFooter>
        </form>
      </AdminModal>
      <AdminModal
        isOpen={!!editingWard}
        title="Edit Ward"
        onClose={closeEditWardModal}
      >
        <form onSubmit={handleUpdateWard}>
          <div className="px-lg py-lg space-y-md">
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-secondary">Ward Name</label>
              <input
                type="text"
                required
                value={editWardName}
                onChange={(e) => setEditWardName(e.target.value)}
                className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
              />
            </div>
            <div className="space-y-xs">
              <label className="block font-label-md text-label-md text-secondary">Number of Beds</label>
              <input
                type="number"
                min={editingWard?.totalBeds ?? 1}
                max={100}
                required
                value={editWardBeds}
                onChange={(e) => setEditWardBeds(Number(e.target.value))}
                className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none bg-surface-white"
              />
              <p className="text-label-sm text-secondary">
                Existing beds can't be removed here since they may be occupied; increasing this adds new beds.
              </p>
            </div>
          </div>
          <AdminModalFooter>
            <AdminModalButton type="button" onClick={closeEditWardModal}>
              Cancel
            </AdminModalButton>
            <AdminModalButton type="submit" variant="primary" disabled={isSavingWard}>
              {isSavingWard ? 'Saving...' : 'Update Ward'}
            </AdminModalButton>
          </AdminModalFooter>
        </form>
      </AdminModal>

      <DeleteConfirmationModal
        isOpen={!!deptToDelete}
        title="Delete Department"
        message={
          <>
            Are you sure you want to permanently delete department{' '}
            <strong>{deptToDelete?.name}</strong>? This action cannot be undone.
          </>
        }
        onClose={() => {
          if (!deletingId) setDeptToDelete(null);
        }}
        onConfirm={handleDeleteDepartment}
        isLoading={!!deletingId}
      />

      {/* System Footer info */}
      <footer className="mt-xl flex flex-col md:flex-row justify-between items-center text-label-sm text-secondary gap-md border-t border-border-subtle pt-md">
        <p>© 2024 Muhimbili National Hospital. Internal Management System.</p>
        <div className="flex gap-lg">
          <span className="text-[11px]">System Health: Normal</span>
          <span className="text-[11px]">Security Protocol v4.2</span>
        </div>
      </footer>
    </div>
  );
}

