import React, { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import type { Provider } from '@/api/types/admin';

export function InsurancePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const [formName, setFormName] = useState('');
  const [formPolicies, setFormPolicies] = useState<string[]>([]);
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formActive, setFormActive] = useState(true);

  const fetchProviders = () => {
    setLoading(true);
    adminService.listInsuranceProviders()
      .then((data) => {
        setProviders(data);
      })
      .catch((err) => {
        console.error('Failed to load insurance providers:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProviders();
  }, []);

  const handleAddClick = () => {
    setEditingProvider(null);
    setFormName('');
    setFormPolicies([]);
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
    setFormContact(provider.contactPerson || '');
    setFormEmail(provider.email || '');
    setFormPhone(provider.phone || '');
    setFormNotes(provider.notes || '');
    setFormActive(provider.active);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      adminService.deleteInsuranceProvider(id)
        .then(() => {
          fetchProviders();
        })
        .catch((err) => {
          console.error('Failed to delete provider:', err);
        });
    }
  };

  const toggleProviderActive = (id: string) => {
    const prov = providers.find(p => p.id === id);
    if (!prov) return;
    adminService.updateInsuranceProvider(id, { active: !prov.active })
      .then(() => {
        fetchProviders();
      })
      .catch((err) => {
        console.error('Failed to update provider status:', err);
      });
  };

  const handlePolicyCheckboxChange = (policy: string) => {
    setFormPolicies(prev =>
      prev.includes(policy) ? prev.filter(p => p !== policy) : [...prev, policy]
    );
  };

  const handleSaveProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = {
      name: formName,
      policies: formPolicies,
      contactPerson: formContact || '—',
      email: formEmail || '—',
      phone: formPhone || '—',
      active: formActive,
      notes: formNotes
    };

    if (editingProvider) {
      adminService.updateInsuranceProvider(editingProvider.id, payload)
        .then(() => {
          fetchProviders();
          setIsModalOpen(false);
        })
        .catch((err) => {
          console.error('Failed to save provider:', err);
        });
    } else {
      adminService.createInsuranceProvider(payload)
        .then(() => {
          fetchProviders();
          setIsModalOpen(false);
        })
        .catch((err) => {
          console.error('Failed to create provider:', err);
        });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-lg pb-12">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <nav className="flex items-center gap-xs mt-xs text-secondary">
            <span className="font-label-sm text-label-sm">Hospital Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary">Insurance Providers</span>
          </nav>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-primary-container text-white px-lg h-[40px] rounded-lg font-headline-sm text-headline-sm flex items-center gap-sm hover:opacity-90 transition-opacity active:scale-95 shadow-sm border-0 cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
        <div className="bg-surface-white border border-border-subtle rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-secondary font-label-md text-label-md">Total Providers</span>
            <span className="material-symbols-outlined text-primary">shield_person</span>
          </div>
          <p className="font-headline-lg text-headline-lg text-on-surface">{providers.length}</p>
          <p className="text-success text-[11px] mt-xs flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 2 added this month
          </p>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-secondary font-label-md text-label-md">Active Claims</span>
            <span className="material-symbols-outlined text-warning">pending_actions</span>
          </div>
          <p className="font-headline-lg text-headline-lg text-on-surface">1,204</p>
          <p className="text-secondary text-[11px] mt-xs">Average TZS 14.2M / day</p>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-secondary font-label-md text-label-md">Pending Verification</span>
            <span className="material-symbols-outlined text-error">rule</span>
          </div>
          <p className="font-headline-lg text-headline-lg text-on-surface">45</p>
          <p className="text-error text-[11px] mt-xs">8 requests</p>
        </div>

        <div className="bg-surface-white border border-border-subtle rounded-xl p-md">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-secondary font-label-md text-label-md">Monthly Revenue</span>
            <span className="material-symbols-outlined text-tertiary">payments</span>
          </div>
          <p className="font-headline-lg text-headline-lg text-on-surface">TZS 185M</p>
          <p className="text-success text-[11px] mt-xs flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px]">trending_up</span> 12.4% vs last month
          </p>
        </div>
      </div>

      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Insurance Providers</h3>
          <div className="flex gap-sm">
            <button className="p-xs text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-xs text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer">
              <span className="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="text-left px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Provider Name</th>
                <th className="text-left px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Policy Types</th>
                <th className="text-left px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Contact Person</th>
                <th className="text-left px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Email</th>
                <th className="text-left px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Phone</th>
                <th className="text-center px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Active</th>
                <th className="text-right px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-lg py-lg text-center text-secondary text-body-md">
                    Loading insurance providers...
                  </td>
                </tr>
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-lg py-lg text-center text-secondary text-body-md">
                    No insurance providers found.
                  </td>
                </tr>
              ) : (
                providers.map(prov => (
                  <tr key={prov.id} className={`hover:bg-row-hover transition-colors group ${!prov.active ? 'opacity-60' : ''}`}>
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
                          <span className="material-symbols-outlined text-secondary">domain</span>
                        </div>
                        <span className="font-headline-sm text-headline-sm text-on-surface">{prov.name}</span>
                      </div>
                    </td>
                    <td className="px-lg py-md">
                      <div className="flex flex-wrap gap-xs">
                        {prov.policies && prov.policies.map(policy => (
                          <span key={policy} className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {policy}
                          </span>
                        ))}
                        {(!prov.policies || prov.policies.length === 0) && (
                          <span className="text-[10px] text-outline italic">No policies</span>
                        )}
                      </div>
                    </td>
                    <td className="px-lg py-md text-body-sm text-secondary">{prov.contactPerson}</td>
                    <td className="px-lg py-md text-body-sm text-secondary">{prov.email}</td>
                    <td className="px-lg py-md text-body-sm text-secondary">{prov.phone}</td>
                    <td className="px-lg py-md text-center">
                      <button
                        onClick={() => toggleProviderActive(prov.id)}
                        className={`w-9 h-5 rounded-full relative transition-all shadow-inner border-0 cursor-pointer ${
                          prov.active ? 'bg-success' : 'bg-border-subtle'
                        }`}
                        aria-label={`Toggle active state for ${prov.name}`}
                      >
                        <div
                          className={`absolute top-[2px] w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                            prov.active ? 'right-[2px]' : 'left-[2px]'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-lg py-md text-right">
                      <div className="flex items-center justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(prov)}
                          className="w-8 h-8 flex items-center justify-center rounded bg-surface-white border border-border-subtle text-secondary hover:text-primary hover:border-primary transition-all bg-transparent cursor-pointer"
                          aria-label={`Edit ${prov.name}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(prov.id)}
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

        <div className="px-lg py-md border-t border-border-subtle flex items-center justify-between">
          <p className="text-body-sm text-secondary">Showing {providers.length} of 12 providers</p>
          <div className="flex gap-sm">
            <button className="px-sm py-1 border border-border-subtle rounded text-label-sm text-secondary hover:bg-surface-container transition-colors disabled:opacity-50 bg-transparent" disabled>
              Previous
            </button>
            <div className="flex items-center">
              <span className="w-8 h-8 flex items-center justify-center rounded bg-primary-container text-white text-label-sm border-0">1</span>
              <span className="w-8 h-8 flex items-center justify-center rounded text-secondary text-label-sm hover:bg-surface-container cursor-pointer">2</span>
            </div>
            <button className="px-sm py-1 border border-border-subtle rounded text-label-sm text-secondary hover:bg-surface-container transition-colors bg-transparent cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Verification Policy Sync details banner */}
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

      {/* Add / Edit modal dialog overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-surface-white w-full max-w-[520px] rounded-xl shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-headline-sm text-[18px] font-semibold text-on-surface">
                {editingProvider ? 'Edit Insurance Provider' : 'Add Insurance Provider'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProvider}>
              <div className="px-lg py-lg space-y-md max-h-[500px] overflow-y-auto custom-scrollbar">
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Provider Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g. Strategis Insurance"
                  />
                </div>

                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary mb-sm">Policy Types</label>
                  <div className="grid grid-cols-2 gap-y-sm gap-x-md">
                    {['Inpatient', 'Outpatient', 'Dental', 'Maternity', 'Optical'].map(policy => (
                      <label key={policy} className="flex items-center gap-sm cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formPolicies.includes(policy)}
                          onChange={() => handlePolicyCheckboxChange(policy)}
                          className="w-4 h-4 rounded text-primary-container border-border-subtle focus:ring-primary-container"
                        />
                        <span className="text-body-md text-on-surface group-hover:text-primary transition-colors">
                          {policy}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-md">
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-secondary">Contact Person</label>
                    <input
                      type="text"
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                      placeholder="Full name of representative"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-md">
                    <div className="space-y-xs">
                      <label className="block font-label-md text-label-md text-secondary">Email</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                        placeholder="email@provider.com"
                      />
                    </div>
                    <div className="space-y-xs">
                      <label className="block font-label-md text-label-md text-secondary">Phone</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary outline-none"
                        placeholder="+255..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-secondary">Notes</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full border border-border-subtle rounded-lg px-md py-sm text-body-md focus:ring-primary focus:border-primary resize-none outline-none"
                    placeholder="Additional details or agreement terms..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between py-sm border-t border-border-subtle">
                  <div className="space-y-xs">
                    <span className="block font-headline-sm text-[14px] text-on-surface">Active Status</span>
                    <p className="text-label-md text-secondary font-normal">Enable provider to be selectable in billing.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormActive(!formActive)}
                    className={`w-11 h-6 rounded-full relative transition-all shadow-inner border-0 cursor-pointer ${
                      formActive ? 'bg-success' : 'bg-surface-container-highest'
                    }`}
                    aria-label="Toggle active status form field"
                  >
                    <div
                      className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                        formActive ? 'right-[2px]' : 'left-[2px]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex items-center justify-end gap-md">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-lg py-sm rounded border border-border-subtle text-secondary font-label-md hover:bg-surface-container transition-colors active:scale-95 bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-lg py-sm rounded bg-primary-container text-white font-label-md hover:bg-[#0040a2] transition-all shadow-sm active:scale-95 border-0 cursor-pointer"
                >
                  Save Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

