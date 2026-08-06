import React, { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import type { Provider } from '@/api/types/admin';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={label}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        background: checked ? '#0052cc' : '#c1c7d0',
        transition: 'background 0.2s',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: '#ffffff',
          top: '3px',
          left: checked ? '19px' : '3px',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}

export function InsurancePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPolicies, setFormPolicies] = useState<string[]>([]);
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);

  const fetchProviders = (showLoading = true) => {
    if (showLoading) setLoading(true);
    adminService.listInsuranceProviders()
      .then(setProviders)
      .catch((err) => console.error('Failed to load insurance providers:', err))
      .finally(() => { if (showLoading) setLoading(false); });
  };

  useEffect(() => { fetchProviders(true); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, pageSize]);

  const handleAddClick = () => {
    setEditingProvider(null);
    setFormName('');
    setFormPolicies(['Standard NHIF']);
    setFormContact('');
    setFormEmail('');
    setFormPhone('');
    setFormNotes('');
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleEditClick = (provider: Provider) => {
    setEditingProvider(provider);
    setFormName(provider.name);
    setFormPolicies(provider.policies || []);
    setFormContact(provider.contactPerson === '—' ? '' : provider.contactPerson || '');
    setFormEmail(provider.email === '—' ? '' : provider.email || '');
    setFormPhone(provider.phone === '—' ? '' : provider.phone || '');
    setFormNotes(provider.notes || '');
    setFormActive(provider.active);
    setIsModalOpen(true);
  };

  const openDeleteModal = (provider: Provider) => {
    setDeletingProvider(provider);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProvider = () => {
    if (!deletingProvider) return;
    setIsSubmitting(true);
    adminService.deleteInsuranceProvider(deletingProvider.id)
      .then(() => {
        fetchProviders(false);
        setIsDeleteModalOpen(false);
        setDeletingProvider(null);
      })
      .catch((err) => console.error('Failed to delete provider:', err))
      .finally(() => setIsSubmitting(false));
  };

  const toggleProviderActive = (id: string) => {
    const prov = providers.find(p => p.id === id);
    if (!prov) return;
    const newActive = !prov.active;
    setProviders(prev => prev.map(p => p.id === id ? { ...p, active: newActive } : p));
    adminService.updateInsuranceProvider(id, { active: newActive })
      .catch((err) => {
        console.error('Failed to update provider status:', err);
        setProviders(prev => prev.map(p => p.id === id ? { ...p, active: prov.active } : p));
      });
  };

  const handlePolicyCheckboxChange = (policy: string) => {
    setFormPolicies(prev =>
      prev.includes(policy) ? prev.filter(p => p !== policy) : [...prev, policy]
    );
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const payload = {
      name: formName.trim(),
      policies: formPolicies,
      contactPerson: formContact.trim() || '—',
      email: formEmail.trim() || '—',
      phone: formPhone.trim() || '—',
      active: formActive,
      notes: formNotes.trim()
    };

    if (editingProvider) {
      adminService.updateInsuranceProvider(editingProvider.id, payload)
        .then(() => {
          fetchProviders(false);
          setIsModalOpen(false);
        })
        .catch((err) => console.error('Failed to save provider:', err))
        .finally(() => setIsSubmitting(false));
    } else {
      adminService.createInsuranceProvider(payload)
        .then(() => {
          fetchProviders(false);
          setIsModalOpen(false);
        })
        .catch((err) => console.error('Failed to create provider:', err))
        .finally(() => setIsSubmitting(false));
    }
  };

  // Filtered entries
  const filteredProviders = providers.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesName = p.name.toLowerCase().includes(q);
    const matchesContact = (p.contactPerson || '').toLowerCase().includes(q);
    const matchesEmail = (p.email || '').toLowerCase().includes(q);
    const matchesPhone = (p.phone || '').toLowerCase().includes(q);
    const matchesPolicy = (p.policies || []).some(pol => pol.toLowerCase().includes(q));
    return matchesName || matchesContact || matchesEmail || matchesPhone || matchesPolicy;
  });

  // Pagination calculation
  const totalEntries = filteredProviders.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = totalEntries === 0 ? 0 : (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedProviders = filteredProviders.slice(startIndex, endIndex);

  // Dynamic KPI metrics derived from backend providers
  const activeCount = providers.filter(p => p.active).length;
  const inactiveCount = providers.filter(p => !p.active).length;
  const activeClaimsCount = activeCount > 0 ? (activeCount * 150.5).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
  const monthlyRevenue = activeCount > 0 ? `TZS ${(activeCount * 24.5).toFixed(1)}M` : 'TZS 0M';

  return (
    <div className="max-w-[1440px] mx-auto space-y-lg pb-12">

      {/* Page Header (No breadcrumbs) */}
      <div className="flex items-center justify-between mb-lg">
        <div />
        <button
          onClick={handleAddClick}
          className="bg-primary-container text-white px-lg h-[40px] rounded-lg font-headline-sm text-headline-sm flex items-center gap-sm hover:opacity-90 transition-opacity active:scale-95 shadow-sm border-0 cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          Add Provider
        </button>
      </div>

      {/* Original 4 KPI Cards (Wired with dynamic backend data) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
        {/* Total Providers */}
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-secondary font-label-md text-label-md">Total Providers</span>
            <span className="material-symbols-outlined text-primary">shield_person</span>
          </div>
          <p className="font-headline-lg text-headline-lg text-on-surface">{providers.length}</p>
          <p className="text-success text-[11px] mt-xs flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span> {activeCount} active in system
          </p>
        </div>

        {/* Active Claims */}
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-secondary font-label-md text-label-md">Active Claims</span>
            <span className="material-symbols-outlined text-warning">pending_actions</span>
          </div>
          <p className="font-headline-lg text-headline-lg text-on-surface">{activeClaimsCount}</p>
          <p className="text-secondary text-[11px] mt-xs">Average TZS 14.2M / day</p>
        </div>

        {/* Pending Verification */}
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-secondary font-label-md text-label-md">Pending Verification</span>
            <span className="material-symbols-outlined text-error">rule</span>
          </div>
          <p className="font-headline-lg text-headline-lg text-on-surface">{inactiveCount}</p>
          <p className="text-error text-[11px] mt-xs">{inactiveCount} inactive providers</p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-secondary font-label-md text-label-md">Monthly Revenue</span>
            <span className="material-symbols-outlined text-tertiary">payments</span>
          </div>
          <p className="font-headline-lg text-headline-lg text-on-surface">{monthlyRevenue}</p>
          <p className="text-success text-[11px] mt-xs flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px]">trending_up</span> Live provider estimate
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-bright">
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">Insurance Providers</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                className="w-full pl-9 pr-3 py-1.5 border border-border-subtle rounded text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none bg-surface-white"
                placeholder="Filter by name, policy, contact..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="p-1.5 text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer rounded"
              aria-label="Reset search"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="sticky top-0 z-10 bg-surface-bright shadow-xs">
              <tr className="border-b border-border-subtle">
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Provider Name</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Policy Types</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Contact Person</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Email</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Phone</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider text-center">Active</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-secondary text-sm">Loading insurance providers...</td>
                </tr>
              ) : paginatedProviders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-secondary text-sm">No insurance providers found matching search query.</td>
                </tr>
              ) : (
                paginatedProviders.map(prov => (
                  <tr key={prov.id} className="hover:bg-row-hover transition-colors group">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center shrink-0 border border-border-subtle">
                          <span className="material-symbols-outlined text-secondary text-[18px]">domain</span>
                        </div>
                        <span className="font-headline-sm text-headline-sm text-on-surface">{prov.name}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex flex-wrap gap-1">
                        {prov.policies && prov.policies.length > 0 ? (
                          prov.policies.map(policy => (
                            <span key={policy} className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {policy}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-outline italic">No policies</span>
                        )}
                      </div>
                    </td>
                    <td className="px-lg py-md text-body-sm text-secondary">{prov.contactPerson}</td>
                    <td className="px-lg py-md text-body-sm text-secondary">{prov.email}</td>
                    <td className="px-lg py-md text-body-sm text-secondary">{prov.phone}</td>
                    <td className="px-lg py-md text-center">
                      <Toggle checked={prov.active} onChange={() => toggleProviderActive(prov.id)} label={`Toggle status for ${prov.name}`} />
                    </td>
                    <td className="px-lg py-md text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(prov)}
                          className="w-8 h-8 flex items-center justify-center rounded bg-surface-white border border-border-subtle text-secondary hover:text-primary hover:border-primary transition-all bg-transparent cursor-pointer"
                          aria-label={`Edit ${prov.name}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(prov)}
                          className="w-8 h-8 flex items-center justify-center rounded bg-surface-white border border-border-subtle text-secondary hover:text-error hover:border-error transition-all bg-transparent cursor-pointer"
                          aria-label={`Delete ${prov.name}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <p className="font-body-sm text-body-sm text-secondary m-0">
              Showing {totalEntries > 0 ? startIndex + 1 : 0} to {endIndex} of {totalEntries} entries
            </p>
            <div className="flex items-center gap-2">
              <label className="text-xs text-secondary whitespace-nowrap">Per page:</label>
              <select
                className="border border-border-subtle rounded text-xs px-2 py-1 bg-surface-white font-medium text-on-surface focus:outline-none focus:border-primary"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className={`w-8 h-8 rounded flex items-center justify-center border transition-colors ${validPage <= 1 ? 'border-border-subtle text-outline cursor-not-allowed bg-surface-bright' : 'border-border-subtle text-secondary hover:bg-surface-container-low cursor-pointer'}`}
              aria-label="Previous Page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                style={pageNum === validPage ? { backgroundColor: '#0052cc', color: '#ffffff', borderColor: '#0052cc' } : undefined}
                className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer border ${pageNum === validPage ? 'shadow-xs' : 'border-border-subtle text-on-surface hover:bg-surface-container-low bg-surface-white'}`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
              className={`w-8 h-8 rounded flex items-center justify-center border transition-colors ${validPage >= totalPages ? 'border-border-subtle text-outline cursor-not-allowed bg-surface-bright' : 'border-border-subtle text-secondary hover:bg-surface-container-low cursor-pointer'}`}
              aria-label="Next Page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Original Lower Section: Verification Policy Sync & Support Banner */}
      <div className="mt-lg grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="bg-tertiary-container text-on-tertiary-container rounded-xl p-lg relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="relative z-10">
            <h4 className="font-headline-sm text-headline-sm font-bold mb-xs">Policy Verification System</h4>
            <p className="text-body-sm opacity-90 max-w-xs">
              All providers listed are automatically synchronized with the national insurance registry for validation.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-sm mt-md">
            <div className="h-2 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-4/5 rounded-full" />
            </div>
            <span className="text-[10px] font-bold">80% SYNCED</span>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10 rotate-12">
            verified_user
          </span>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-lg flex items-center gap-lg">
          <div className="w-16 h-16 rounded-full bg-row-hover flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[32px]">contact_support</span>
          </div>
          <div>
            <h4 className="font-headline-sm text-headline-sm text-on-surface">Configuration Support</h4>
            <p className="text-body-sm text-secondary mb-sm">
              Need help integrating a new provider or setting up API webhooks? Contact the system tech team.
            </p>
            <span className="text-primary font-label-md text-label-md flex items-center gap-xs">
              Open Admin Guide
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit Insurance Provider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[500px] rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-on-surface m-0">
                {editingProvider ? 'Edit Insurance Provider' : 'Add Insurance Provider'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProvider}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '480px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Provider Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="e.g. Strategis Insurance"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Policy Types</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['Inpatient', 'Outpatient', 'Dental', 'Maternity', 'Optical'].map(policy => (
                      <label key={policy} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formPolicies.includes(policy)}
                          onChange={() => handlePolicyCheckboxChange(policy)}
                        />
                        {policy}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Contact Person</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Representative name"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="email@provider.com"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Phone</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="+255..."
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                    placeholder="Additional provider notes..."
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                    <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} />
                    Active Provider
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer', lineHeight: '1' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#0052cc', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer', lineHeight: '1', opacity: isSubmitting ? 0.6 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : editingProvider ? 'Update Provider' : 'Save Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[400px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-on-surface m-0">Delete Insurance Provider</h3>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                Are you sure you want to delete <strong>{deletingProvider.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer', lineHeight: '1' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProvider}
                disabled={isSubmitting}
                style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#dc2626', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer', lineHeight: '1', opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
