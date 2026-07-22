import { useState, useEffect } from 'react';
import { adminService } from '@/api/services/admin';
import type { FeeItem } from '@/api/types/admin';

// Renders the fee schedule list layout, category filtering, and metrics dashboard
export function FeesPage() {
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFees = () => {
    setLoading(true);
    adminService.listFeeSchedules()
      .then((data) => {
        setFeeItems(data);
      })
      .catch((err) => {
        console.error('Failed to load fees:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFees();
  }, []);

  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [currencyFilter, setCurrencyFilter] = useState<string>('TZS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toggle insurance covered state value (amount passed so backend can set insurance price)
  const toggleInsuranceCovered = (id: string) => {
    const item = feeItems.find(f => f.id === id);
    if (!item) return;
    adminService.updateFeeSchedule(id, { insuranceCovered: !item.insuranceCovered, amount: item.amount })
      .then(() => {
        fetchFees();
      });
  };

  // Toggle fee item active state value
  const toggleActive = (id: string) => {
    const item = feeItems.find(f => f.id === id);
    if (!item) return;
    adminService.updateFeeSchedule(id, { active: !item.active })
      .then(() => {
        fetchFees();
      });
  };

  // Filter list records based on search and selector criteria
  const filteredItems = feeItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All Categories' || 
                            item.category === categoryFilter.toUpperCase();
    
    const matchesCurrency = item.currency === currencyFilter;

    return matchesSearch && matchesCategory && matchesCurrency;
  });

  return (
    <div className="max-w-[1024px] mx-auto space-y-lg pb-32">
      {/* Page Header and breadcrumb links */}
      <div className="flex justify-between items-center mb-xl">
        <div>
          <nav className="flex items-center gap-xs text-secondary font-label-md text-[11px] uppercase tracking-wider mb-xs">
            <span>Hospital Configuration</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Fee Schedules</span>
          </nav>
        </div>
        <div className="flex items-center gap-md">
          <button className="flex items-center gap-sm px-md py-2 border border-border-subtle rounded-lg text-secondary font-label-md bg-white hover:bg-surface-container transition-colors cursor-pointer">
            <span className="material-symbols-outlined">download</span>
            Import CSV
          </button>
          <button className="flex items-center gap-sm px-md py-2 bg-primary-container text-white rounded-lg font-label-md hover:opacity-90 shadow-sm transition-all active:scale-[0.98] border-0 cursor-pointer">
            <span className="material-symbols-outlined">add</span>
            Add Fee Item
          </button>
        </div>
      </div>

      {/* Filter Row controls */}
      <div className="flex flex-wrap items-center gap-md mb-lg">
        <div className="w-full md:w-48">
          <label className="block font-label-md text-secondary mb-xs">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-white border border-border-subtle rounded-lg py-2 px-md text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
            <option>All Categories</option>
            <option>Consultation</option>
            <option>Lab</option>
            <option>Radiology</option>
            <option>Pharmacy</option>
            <option>Procedure</option>
            <option>Ward</option>
          </select>
        </div>

        <div className="w-full md:w-32">
          <label className="block font-label-md text-secondary mb-xs">Currency</label>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="w-full bg-white border border-border-subtle rounded-lg py-2 px-md text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
            <option>TZS</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block font-label-md text-secondary mb-xs">Quick Search</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              filter_list
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-border-subtle rounded-lg py-2 pl-10 pr-4 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              placeholder="Filter by service name or code..."
            />
          </div>
        </div>

        <div className="self-end pb-1">
          <button 
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All Categories');
              setCurrencyFilter('TZS');
            }}
            className="p-2.5 text-secondary hover:text-primary transition-colors font-body-sm bg-transparent border-0 cursor-pointer"
            aria-label="Refresh filters"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {/* Renders main fee listings table */}
      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-xl py-md border-b border-border-subtle flex justify-between items-center bg-white">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Fee Schedule</h3>
          <div className="flex gap-sm">
            <span className="px-2 py-1 bg-surface-container rounded text-[10px] font-bold text-secondary uppercase tracking-widest">
              Master List
            </span>
            <span className="px-2 py-1 bg-success/10 rounded text-[10px] font-bold text-success uppercase tracking-widest">
              Active
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-xl py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider">Service Name</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider">Category</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider">Fee Amount</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider text-center">Currency</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider text-center">Insurance Covered</th>
                <th className="px-lg py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider text-center">Active</th>
                <th className="px-xl py-md font-label-md text-label-md text-secondary border-b border-border-subtle uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-row-hover transition-colors duration-150">
                  <td className="px-xl py-md font-body-md text-on-surface font-semibold">{item.name}</td>
                  <td className="px-lg py-md">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold ${
                      item.category === 'CONSULTATION' ? 'bg-primary-container/10 text-primary-container' :
                      item.category === 'LAB' ? 'bg-success/10 text-success' :
                      item.category === 'RADIOLOGY' ? 'bg-tertiary-fixed-dim/20 text-tertiary-container' :
                      'bg-secondary-fixed/50 text-on-secondary-fixed-variant'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-lg py-md font-body-md text-on-surface">{item.amount}</td>
                  <td className="px-lg py-md text-center text-secondary font-label-md">{item.currency}</td>
                  <td className="px-lg py-md text-center">
                    <button
                      onClick={() => toggleInsuranceCovered(item.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none border-0 cursor-pointer ${
                        item.insuranceCovered ? 'bg-success' : 'bg-outline'
                      }`}
                      aria-label={`Toggle insurance coverage for ${item.name}`}
                    >
                      <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
                        item.insuranceCovered ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="px-lg py-md text-center">
                    <button
                      onClick={() => toggleActive(item.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none border-0 cursor-pointer ${
                        item.active ? 'bg-success' : 'bg-outline'
                      }`}
                      aria-label={`Toggle status for ${item.name}`}
                    >
                      <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
                        item.active ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </td>
                  <td className="px-xl py-md text-right">
                    <div className="flex justify-end gap-sm">
                      <button className="p-1.5 text-on-secondary-container hover:bg-surface-container rounded transition-colors bg-transparent border-0 cursor-pointer" title="Edit Item">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button className="p-1.5 text-on-secondary-container hover:bg-error/10 hover:text-error rounded transition-colors bg-transparent border-0 cursor-pointer" title="Delete Item">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-xl py-lg text-center text-secondary text-body-md">
                    Loading fee schedules...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-xl py-lg text-center text-secondary text-body-md">
                    No items found matching the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Table Pagination controls */}
        <div className="px-xl py-md border-t border-border-subtle flex items-center justify-between bg-surface-container-low">
          <p className="font-body-sm text-secondary">
            Showing <span className="font-bold text-on-surface">1 - {filteredItems.length}</span> of <span className="font-bold text-on-surface">128</span> entries
          </p>
          <div className="flex gap-base">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-white text-secondary hover:bg-surface-container transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-md">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-primary-container text-white font-label-md border-0">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-white text-on-surface hover:bg-surface-container font-label-md">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-white text-on-surface hover:bg-surface-container font-label-md">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-border-subtle bg-white text-secondary hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-md">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render lower metrics analysis row */}
      <div className="mt-xl grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="p-lg bg-surface-white border border-border-subtle rounded-xl flex items-center gap-md">
          <div className="w-12 h-12 bg-primary-container/10 text-primary-container rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">attach_money</span>
          </div>
          <div>
            <p className="font-label-md text-secondary uppercase tracking-wider">Average Fee</p>
            <p className="font-headline-sm text-on-surface">21,750 TZS</p>
          </div>
        </div>

        <div className="p-lg bg-surface-white border border-border-subtle rounded-xl flex items-center gap-md">
          <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <p className="font-label-md text-secondary uppercase tracking-wider">Insurance Coverage</p>
            <p className="font-headline-sm text-on-surface">82.4% Services</p>
          </div>
        </div>

        <div className="p-lg bg-surface-white border border-border-subtle rounded-xl flex items-center gap-md relative overflow-hidden group">
          <div className="w-12 h-12 bg-warning/10 text-warning rounded-full flex items-center justify-center relative z-10">
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className="relative z-10">
            <p className="font-label-md text-secondary uppercase tracking-wider">Pending Updates</p>
            <p className="font-headline-sm text-on-surface">14 Items</p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300">
            <span className="material-symbols-outlined" style={{ fontSize: '80px' }}>
              monitoring
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
