import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

// Renders the staff directory with plan-limit alerts, stat cards, filters, and table
export const UserManagementPage: React.FC = () => {
  const { staffList, deleteStaff, setActiveView } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'doctor' | 'nurse' | 'admin'>('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const PLAN_LIMIT = 20;
  const isAtLimit = staffList.length >= PLAN_LIMIT;

  // Navigates to addition wizard
  const handleAddStaffClick = () => {
    setActiveView('add-staff');
  };

  // Navigates to editing wizard
  const handleEditClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveView('edit-staff', { staffId: id });
  };

  // Triggers deletion confirmation
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this staff member?')) {
      deleteStaff(id);
    }
  };

  // Triggers detail card navigation
  const handleRowClick = (id: string) => {
    setActiveView('staff-detail', { staffId: id });
  };

  // Collect unique departments from staff list
  const departments = Array.from(new Set(staffList.map((s) => s.landingDepartment))).sort();

  // Filter staff entries based on selected queries
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
    const matchesDept = deptFilter === 'all' || staff.landingDepartment === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  const activeCount = staffList.filter((s) => s.status === 'active').length;
  const inactiveCount = staffList.filter((s) => s.status !== 'active').length;

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-lg">

      {/* Plan limit alert banner */}
      {isAtLimit && (
        <div className="bg-[#FFAB00]/10 border border-[#FFAB00] rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-warning" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <p className="font-body-sm text-body-sm text-on-surface">
              You have reached your {PLAN_LIMIT} staff account limit. Contact the system owner to upgrade your plan.
            </p>
          </div>
          <button
            onClick={() => setActiveView('subscription')}
            className="font-label-md text-primary-container font-semibold hover:underline whitespace-nowrap"
          >
            View Subscription
          </button>
        </div>
      )}

      {/* Page header actions row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div />
        <div className="flex gap-2">
          <button className="h-10 px-4 rounded border border-border-subtle bg-surface-white text-secondary font-label-md text-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
          {isAtLimit ? (
            <button
              className="h-10 px-4 rounded bg-border-subtle text-outline font-label-md text-label-md flex items-center gap-2 cursor-not-allowed"
              disabled
              title="Plan limit reached"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add New Staff
            </button>
          ) : (
            <button
              onClick={handleAddStaffClick}
              className="h-10 px-4 rounded bg-primary text-on-primary font-label-md text-label-md flex items-center gap-2 hover:bg-[#0040a2] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add New Staff
            </button>
          )}
        </div>
      </div>

      {/* Stats summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff — warning state when at limit */}
        <div className={`bg-surface-white rounded-lg p-4 relative overflow-hidden ${isAtLimit ? 'border-2 border-warning' : 'border border-border-subtle'}`}>
          <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">Total Staff</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`font-headline-lg text-headline-lg ${isAtLimit ? 'text-warning' : 'text-on-surface'}`}>
              {staffList.length}
            </h3>
            <span className="font-body-sm text-body-sm text-secondary">/ {PLAN_LIMIT} Limit</span>
          </div>
          <div className="w-full bg-surface-container h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${isAtLimit ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${(staffList.length / PLAN_LIMIT) * 100}%` }}
            />
          </div>
        </div>

        {/* Active */}
        <div className="bg-surface-white border border-border-subtle rounded-lg p-4">
          <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">Active</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{activeCount}</h3>
          <p className="font-label-sm text-label-sm text-success mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            {staffList.length > 0 ? Math.round((activeCount / staffList.length) * 100) : 0}%
          </p>
        </div>

        {/* Inactive */}
        <div className="bg-surface-white border border-border-subtle rounded-lg p-4">
          <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">Inactive</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{inactiveCount}</h3>
          <p className="font-label-sm text-label-sm text-secondary mt-2">Requires review</p>
        </div>

        {/* Online Now (from sessions in context) */}
        <div className="bg-surface-white border border-border-subtle rounded-lg p-4">
          <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-1">Online Now</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface">{activeCount}</h3>
          <p className="font-label-sm text-label-sm text-success mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" /> Live
          </p>
        </div>
      </div>

      {/* Table container */}
      <div className="bg-surface-white border border-border-subtle rounded-lg overflow-hidden flex flex-col">
        {/* Table toolbar */}
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-bright">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              className="w-full pl-9 pr-3 py-1.5 border border-border-subtle rounded text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              placeholder="Search by name, ID or role"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              className="border border-border-subtle rounded text-sm py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              className="border border-border-subtle rounded text-sm py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'doctor' | 'nurse' | 'admin')}
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Staff table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-bright border-b border-border-subtle">
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Staff Member</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Role & Dept</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Status</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Last Active</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    onClick={() => handleRowClick(staff.id)}
                    className="hover:bg-row-hover transition-colors group cursor-pointer"
                  >
                    {/* Staff Member column */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center font-label-md overflow-hidden shrink-0">
                          {staff.avatarUrl ? (
                            <img alt={staff.name} className="w-full h-full object-cover" src={staff.avatarUrl} />
                          ) : (
                            staff.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
                          )}
                        </div>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface group-hover:text-primary">{staff.name}</p>
                          <p className="font-body-sm text-body-sm text-secondary">ID: {staff.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept column */}
                    <td className="p-4">
                      <p className="font-body-sm text-body-sm text-on-surface capitalize">{staff.role}</p>
                      <p className="font-body-sm text-body-sm text-secondary">{staff.landingDepartment}</p>
                    </td>

                    {/* Status column */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        staff.status === 'active'
                          ? 'bg-[#E3FCEF] text-[#006644]'
                          : 'bg-surface-container text-secondary'
                      }`}>
                        {staff.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Last Active column */}
                    <td className="p-4 text-body-sm text-on-surface">
                      {staff.createdAt ? staff.createdAt.split('T')[0] : ''}
                    </td>

                    {/* Actions column */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-xs" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEditClick(staff.id, e)}
                          className="p-1 hover:bg-surface-container rounded transition-colors"
                          aria-label={`Edit ${staff.name}`}
                        >
                          <span className="material-symbols-outlined text-secondary hover:text-primary">edit</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(staff.id, e)}
                          className="p-1 hover:bg-surface-container rounded transition-colors"
                          aria-label={`Delete ${staff.name}`}
                        >
                          <span className="material-symbols-outlined text-secondary hover:text-error">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-xl text-center text-outline font-body-sm text-sm">
                    No staff entries found matching search queries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-white flex items-center justify-between">
          <p className="font-body-sm text-body-sm text-secondary">
            Showing 1 to {filteredStaff.length} of {filteredStaff.length} entries
          </p>
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded flex items-center justify-center border border-border-subtle text-outline cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center bg-primary-container text-on-primary-container font-label-sm">1</button>
            <button className="w-8 h-8 rounded flex items-center justify-center border border-border-subtle text-outline cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
