import React, { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import type { FeeItem } from '@/api/types/admin';

const CATEGORIES = ['Consultation', 'Lab', 'Radiology', 'Pharmacy', 'Procedure', 'Ward'];
const CURRENCIES = ['TZS', 'USD', 'EUR'];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  CONSULTATION: { bg: '#e8f4ff', text: '#0052cc' },
  LAB:          { bg: '#e3fcef', text: '#006644' },
  RADIOLOGY:    { bg: '#f3f0ff', text: '#5243aa' },
  PHARMACY:     { bg: '#fff7e6', text: '#974f0c' },
  PROCEDURE:    { bg: '#fce4ec', text: '#b71c1c' },
  WARD:         { bg: '#e0f7fa', text: '#006064' },
};

function categoryStyle(cat: string) {
  return CATEGORY_COLORS[cat?.toUpperCase()] ?? { bg: '#f4f5f7', text: '#5e6c84' };
}

const parseFeeAmount = (val: string | number): number => {
  if (val === null || val === undefined) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

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

const EMPTY_FORM = { name: '', category: 'Consultation', amount: '', currency: 'TZS', insuranceCovered: false, active: true };

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '14px',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
};

function ModalFooter({ onCancel, submitLabel, loading: l }: { onCancel: () => void; submitLabel: string; loading: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
      <button type="button" onClick={onCancel}
        style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer', lineHeight: '1' }}>
        Cancel
      </button>
      <button type="submit" disabled={l}
        style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#0052cc', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: l ? 'not-allowed' : 'pointer', lineHeight: '1', opacity: l ? 0.6 : 1 }}>
        {l ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{label}</label>
      {children}
    </div>
  );
}

export function FeesPage() {
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);


  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [currencyFilter, setCurrencyFilter] = useState('TZS');
  const [searchQuery, setSearchQuery] = useState('');

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<FeeItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchFees = (showLoading = true) => {
    if (showLoading) setLoading(true);
    adminService.listFeeSchedules()
      .then(setFeeItems)
      .catch((err) => console.error('Failed to load fees:', err))
      .finally(() => { if (showLoading) setLoading(false); });
  };

  useEffect(() => { fetchFees(true); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchQuery, categoryFilter, currencyFilter, pageSize]);

  const toggleInsuranceCovered = (id: string) => {
    const item = feeItems.find(f => f.id === id);
    if (!item) return;
    const newCovered = !item.insuranceCovered;
    setFeeItems(prev => prev.map(f => f.id === id ? { ...f, insuranceCovered: newCovered } : f));
    adminService.updateFeeSchedule(id, { insuranceCovered: newCovered, amount: item.amount })
      .catch((err) => {
        console.error('Failed to update insurance coverage:', err);
        setFeeItems(prev => prev.map(f => f.id === id ? { ...f, insuranceCovered: item.insuranceCovered } : f));
      });
  };

  const toggleActive = (id: string) => {
    const item = feeItems.find(f => f.id === id);
    if (!item) return;
    const newActive = !item.active;
    setFeeItems(prev => prev.map(f => f.id === id ? { ...f, active: newActive } : f));
    adminService.updateFeeSchedule(id, { active: newActive })
      .catch((err) => {
        console.error('Failed to update active state:', err);
        setFeeItems(prev => prev.map(f => f.id === id ? { ...f, active: item.active } : f));
      });
  };

  const openAdd = () => { setForm(EMPTY_FORM); setIsAddModalOpen(true); };
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    adminService.createFeeSchedule({ name: form.name, category: form.category.toUpperCase(), amount: form.amount, currency: form.currency, insuranceCovered: form.insuranceCovered, active: form.active })
      .then(() => { fetchFees(false); setIsAddModalOpen(false); })
      .catch(console.error)
      .finally(() => setIsSubmitting(false));
  };

  const openEdit = (item: FeeItem) => {
    setEditingItem(item);
    setForm({ name: item.name, category: item.category.charAt(0) + item.category.slice(1).toLowerCase(), amount: item.amount, currency: item.currency, insuranceCovered: item.insuranceCovered, active: item.active });
    setIsEditModalOpen(true);
  };
  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    adminService.updateFeeSchedule(editingItem.id, { name: form.name, category: form.category.toUpperCase(), amount: form.amount, currency: form.currency, insuranceCovered: form.insuranceCovered, active: form.active })
      .then(() => { fetchFees(false); setIsEditModalOpen(false); setEditingItem(null); })
      .catch(console.error)
      .finally(() => setIsSubmitting(false));
  };

  const openDelete = (item: FeeItem) => { setDeletingItem(item); setIsDeleteModalOpen(true); };
  const handleDelete = () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    adminService.deleteFeeSchedule(deletingItem.id)
      .then(() => { fetchFees(false); setIsDeleteModalOpen(false); setDeletingItem(null); })
      .catch(console.error)
      .finally(() => setIsSubmitting(false));
  };

  const filteredItems = feeItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || item.category.toUpperCase() === categoryFilter.toUpperCase();
    const matchesCurrency = item.currency === currencyFilter;
    return matchesSearch && matchesCategory && matchesCurrency;
  });

  const totalEntries = filteredItems.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = totalEntries === 0 ? 0 : (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const activeCount = feeItems.filter(f => f.active).length;
  const insuredCount = feeItems.filter(f => f.insuranceCovered).length;
  const coveragePercent = feeItems.length > 0 ? Math.round((insuredCount / feeItems.length) * 100) : 0;
  const tzsFees = feeItems.filter(f => f.currency === 'TZS');
  const avgFee = tzsFees.length > 0 ? Math.round(tzsFees.reduce((sum, f) => sum + parseFeeAmount(f.amount), 0) / tzsFees.length) : 0;

  return (
    <div className="max-w-container-max mx-auto flex flex-col gap-lg">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div />
        <div className="flex gap-2">
          <button
            className="h-10 px-4 rounded font-label-md flex items-center gap-2 hover:bg-surface-container-low transition-colors cursor-pointer"
            style={{ border: '1px solid #d1d5db', background: '#ffffff', color: '#374151' }}
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Import CSV
          </button>
          <button
            onClick={openAdd}
            className="h-10 px-4 rounded font-label-md flex items-center gap-2 transition-colors shadow-sm cursor-pointer border-0"
            style={{ background: '#0052cc', color: '#ffffff' }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Fee Item
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-white border border-border-subtle rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e8f4ff' }}>
            <span className="material-symbols-outlined" style={{ color: '#0052cc', fontSize: '20px' }}>attach_money</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-0.5">Avg Fee (TZS)</p>
            <p className="font-headline-sm text-on-surface">{avgFee.toLocaleString()} TZS</p>
          </div>
        </div>
        <div className="bg-surface-white border border-border-subtle rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e3fcef' }}>
            <span className="material-symbols-outlined" style={{ color: '#006644', fontSize: '20px' }}>verified_user</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-0.5">Insurance Coverage</p>
            <p className="font-headline-sm text-on-surface">{coveragePercent}% of services</p>
          </div>
        </div>
        <div className="bg-surface-white border border-border-subtle rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#e3fcef' }}>
            <span className="material-symbols-outlined" style={{ color: '#006644', fontSize: '20px' }}>check_circle</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider mb-0.5">Active Items</p>
            <p className="font-headline-sm text-on-surface">{activeCount} of {feeItems.length}</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-surface-white border border-border-subtle rounded-lg overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="p-4 border-b border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-bright">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              className="w-full pl-9 pr-3 py-1.5 border border-border-subtle rounded text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              placeholder="Search by service name or category"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              className="border border-border-subtle rounded text-sm py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option>All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              className="border border-border-subtle rounded text-sm py-1.5 pl-3 pr-8 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
            >
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button
              onClick={() => { setSearchQuery(''); setCategoryFilter('All Categories'); setCurrencyFilter('TZS'); }}
              className="p-1.5 text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer rounded"
              aria-label="Reset filters"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-surface-bright shadow-xs">
              <tr className="border-b border-border-subtle">
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Service Name</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Category</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider">Amount</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider text-center">Currency</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider text-center">Insurance</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider text-center">Active</th>
                <th className="p-4 font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-white">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-secondary text-sm">Loading fee schedules...</td></tr>
              ) : paginatedItems.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-secondary text-sm">No items found matching the selected filters.</td></tr>
              ) : paginatedItems.map(item => {
                const cs = categoryStyle(item.category);
                return (
                  <tr key={item.id} className="hover:bg-row-hover transition-colors">
                    <td className="p-4 font-label-md text-on-surface font-semibold">{item.name}</td>
                    <td className="p-4">
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: cs.bg, color: cs.text }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-on-surface">{parseFeeAmount(item.amount).toLocaleString()}</td>
                    <td className="p-4 text-center text-sm text-secondary">{item.currency}</td>
                    <td className="p-4 text-center">
                      <Toggle checked={item.insuranceCovered} onChange={() => toggleInsuranceCovered(item.id)} label={`Toggle insurance for ${item.name}`} />
                    </td>
                    <td className="p-4 text-center">
                      <Toggle checked={item.active} onChange={() => toggleActive(item.id)} label={`Toggle active for ${item.name}`} />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="p-1 hover:bg-surface-container rounded transition-colors border-0 bg-transparent cursor-pointer" aria-label={`Edit ${item.name}`}>
                          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button onClick={() => openDelete(item)} className="p-1 hover:bg-surface-container rounded transition-colors border-0 bg-transparent cursor-pointer" aria-label={`Delete ${item.name}`}>
                          <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
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

      {/* Add Fee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[480px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-on-surface m-0">Add Fee Item</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormField label="Service Name">
                  <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. General Consultation" />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Category">
                    <select required style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Currency">
                    <select required style={inputStyle} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                </div>
                <FormField label="Amount">
                  <input required type="number" min="0" style={inputStyle} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
                </FormField>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                    <input type="checkbox" checked={form.insuranceCovered} onChange={e => setForm(f => ({ ...f, insuranceCovered: e.target.checked }))} />
                    Insurance Covered
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                    <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                    Active
                  </label>
                </div>
              </div>
              <ModalFooter onCancel={() => setIsAddModalOpen(false)} submitLabel="Save Fee Item" loading={isSubmitting} />
            </form>
          </div>
        </div>
      )}

      {/* Edit Fee Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[480px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-on-surface m-0">Edit Fee Item</h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleEdit}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <FormField label="Service Name">
                  <input required style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormField label="Category">
                    <select required style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Currency">
                    <select required style={inputStyle} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                      {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                </div>
                <FormField label="Amount">
                  <input required type="number" min="0" style={inputStyle} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </FormField>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                    <input type="checkbox" checked={form.insuranceCovered} onChange={e => setForm(f => ({ ...f, insuranceCovered: e.target.checked }))} />
                    Insurance Covered
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                    <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                    Active
                  </label>
                </div>
              </div>
              <ModalFooter onCancel={() => setIsEditModalOpen(false)} submitLabel="Update Fee Item" loading={isSubmitting} />
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-md">
          <div className="bg-surface-white w-full max-w-[400px] rounded-xl shadow-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="text-[18px] font-semibold text-on-surface m-0">Delete Fee Item</h3>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                Are you sure you want to delete <strong>{deletingItem.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)}
                style={{ padding: '9px 20px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer', lineHeight: '1' }}>
                Cancel
              </button>
              <button type="button" onClick={handleDelete} disabled={isSubmitting}
                style={{ padding: '9px 20px', border: 'none', borderRadius: '8px', background: '#dc2626', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer', lineHeight: '1', opacity: isSubmitting ? 0.6 : 1 }}>
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
