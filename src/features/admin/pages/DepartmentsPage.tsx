import { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import type { Department, WardItem } from '@/api/types/admin';

// Renders the departments roster directory and ward occupancy panel
export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        <button className="bg-primary-container hover:bg-primary-container/90 text-white px-md h-[40px] rounded-lg flex items-center gap-sm font-label-md transition-colors shadow-sm border-0 cursor-pointer">
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
                        <button className="h-[32px] px-sm border border-border-subtle rounded-md font-label-md text-secondary hover:border-primary hover:text-primary transition-all bg-surface-white cursor-pointer">
                          Edit
                        </button>
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
            <button className="bg-surface-white border border-primary text-primary px-sm h-[32px] rounded-md flex items-center gap-xs font-label-md hover:bg-primary/5 transition-all cursor-pointer">
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
                          <button className="text-outline hover:text-primary transition-colors p-1 rounded hover:bg-row-hover bg-transparent border-0 cursor-pointer" aria-label={`Edit ${ward.name}`}>
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

