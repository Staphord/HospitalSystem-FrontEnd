import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { masterService } from '@/api/services/master';
import type { Subscription, Tenant, SubscriptionPlan, Invoice } from '@/api/types/master';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export const SubscriptionPage: React.FC = () => {
  const { staffList } = useApp();
  const tenantId = useAuthStore((s) => s.tenantId) || 'gilgal';

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states for customer requests
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [now] = useState(() => Date.now());

  // Load tenant subscription, plans, and invoices from mock service
  const fetchSubscriptionData = React.useCallback(async () => {
    try {
      const [tenantData, allSubs, plansData, invoicesData] = await Promise.all([
        masterService.getTenant(tenantId),
        masterService.listSubscriptions(),
        masterService.listPlans(),
        masterService.listInvoices(tenantId),
      ]);

      setTenant(tenantData);
      setPlans(plansData);
      setInvoices(invoicesData);

      const activeSub = allSubs.find((s) => s.tenant_id === tenantId);
      if (activeSub) {
        setSubscription(activeSub);
      }
      setLoading(false);
    } catch {
      toast.error('Failed to load subscription details.');
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleRequestPlanChange = async (planName: string) => {
    if (!subscription) return;
    setSubmitting(true);
    try {
      await masterService.updateSubscription(subscription.id, { plan_name: planName });
      toast.success(`Subscription plan change to ${planName} requested and applied!`);
      setIsUpgradeModalOpen(false);
      fetchSubscriptionData();
    } catch {
      toast.error('Failed to request plan change.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCancel = async () => {
    if (!subscription) return;
    setSubmitting(true);
    try {
      await masterService.updateSubscription(subscription.id, { auto_renew: false });
      toast.success('Auto-renew disabled. Subscription will cancel at the end of the current term.');
      setIsCancelModalOpen(false);
      fetchSubscriptionData();
    } catch {
      toast.error('Failed to update subscription auto-renew.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-secondary font-body-md">
        Loading subscription overview...
      </div>
    );
  }

  if (!subscription || !tenant) {
    return (
      <div className="text-center py-12 text-secondary font-body-md">
        No active subscription found.
      </div>
    );
  }

  // Find detailed features of the current plan
  const planDetails = plans.find(
    (p) => p.plan_name.toLowerCase() === subscription.plan_name.toLowerCase()
  );

  const getDaysUntilRenewal = () => {
    if (!subscription.end_date) return null;
    const diff = new Date(subscription.end_date).getTime() - now;
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const daysUntilRenewal = getDaysUntilRenewal();
  const currencySymbol = tenant.currency || 'USD';
  const priceDisplay = planDetails
    ? `${currencySymbol} ${planDetails.monthly_price.toLocaleString()}`
    : 'N/A';

  // Calculate plan usage details
  const maxUsers = planDetails?.max_users || 0;
  const staffCount = staffList.length;
  const staffPercent = maxUsers > 0 ? Math.min(100, Math.round((staffCount / maxUsers) * 100)) : 0;

  const maxStorage = planDetails?.storage_gb || 10;
  const storageUsed = Math.round(maxStorage * 0.46); // simulated usage metric
  const storagePercent = Math.min(100, Math.round((storageUsed / maxStorage) * 100));

  const maxPatients = planDetails?.max_patients || 0;
  const patientsCount = 8450; // simulated count metric
  const patientsPercent = maxPatients > 0 ? Math.min(100, Math.round((patientsCount / maxPatients) * 100)) : 0;

  return (
    <div className="max-w-[1440px] mx-auto space-y-lg">
      <div className="flex items-center justify-between mb-lg">
        <div>
          <nav className="flex items-center gap-xs text-secondary">
            <span className="font-label-sm text-label-sm">System</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-label-sm text-label-sm text-primary">My Subscription</span>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        {/* Current Plan Overview Card */}
        <div className="col-span-1 md:col-span-8 bg-surface-white rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="px-lg py-md border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Current Plan</h3>
          </div>
          <div className="p-lg flex-1 bg-surface-white flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg">
              <div className="flex items-center gap-md">
                <span className="font-headline-lg text-headline-lg text-primary capitalize">
                  {subscription.plan_name}
                </span>
                <span className={`status-badge status-${subscription.status.toLowerCase()}`}>
                  {subscription.status}
                </span>
                <span className="bg-surface-container text-on-surface-variant font-label-md text-label-md px-sm py-[2px] rounded-full uppercase font-bold">
                  Monthly
                </span>
              </div>
              {daysUntilRenewal !== null && daysUntilRenewal <= 14 && (
                <div className="bg-[#FFF0B3] text-[#FF8B00] font-label-sm text-label-sm px-sm py-xs rounded flex items-center gap-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  {daysUntilRenewal} days until renewal
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mt-xl">
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Next Billing</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Amount</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  {priceDisplay}
                </span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Grace Period</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  {tenant.grace_days ?? 14} days
                </span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Auto-Renew</span>
                <div className="flex items-center gap-sm font-body-md text-body-md text-on-surface font-medium">
                  {subscription.auto_renew ? 'ON' : 'OFF'}
                  <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Usage Gauges Card */}
        <div className="col-span-1 md:col-span-4 bg-surface-white rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="px-lg py-md border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Plan Usage</h3>
          </div>
          <div className="p-lg space-y-lg bg-surface-white">
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-end">
                <span className="font-body-sm text-body-sm text-on-surface font-medium">Staff Accounts</span>
                <div className="text-right">
                  <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                    {staffCount} / {maxUsers > 0 ? maxUsers : 'Unlimited'}
                  </span>
                  {maxUsers > 0 && maxUsers - staffCount > 0 && (
                    <span className="font-label-sm text-label-sm text-warning block font-bold">
                      {maxUsers - staffCount} remaining
                    </span>
                  )}
                </div>
              </div>
              {maxUsers > 0 ? (
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full ${staffPercent > 90 ? 'bg-error' : 'bg-success'}`}
                    style={{ width: `${staffPercent}%` }}
                  ></div>
                </div>
              ) : (
                <div className="h-2 w-full bg-success rounded-full"></div>
              )}
            </div>
            
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-end">
                <span className="font-body-sm text-body-sm text-on-surface font-medium">Storage</span>
                <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                  {storageUsed}GB / {maxStorage}GB
                </span>
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${storagePercent}%` }}></div>
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-end">
                <span className="font-body-sm text-body-sm text-on-surface font-medium">Patient Records</span>
                <span className="font-body-sm text-body-sm text-on-surface font-semibold">
                  {patientsCount.toLocaleString()} / {maxPatients > 0 ? maxPatients.toLocaleString() : 'Unlimited'}
                </span>
              </div>
              {maxPatients > 0 ? (
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${patientsPercent}%` }}></div>
                </div>
              ) : (
                <div className="h-2 w-full bg-success rounded-full"></div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice History Card */}
        <div className="col-span-1 md:col-span-12 bg-surface-white rounded-xl border border-border-subtle overflow-hidden shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Invoice History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bright border-b border-border-subtle">
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Invoice #
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Description
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Amount
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Status
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">
                    Due Date
                  </th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface bg-surface-white divide-y divide-border-subtle">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary">
                      No billing history found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-row-hover transition-colors">
                      <td className="py-md px-lg font-semibold text-on-surface">#{inv.id}</td>
                      <td className="py-md px-lg text-secondary">{inv.description || 'Monthly Plan Subscription Renewal'}</td>
                      <td className="py-md px-lg text-on-surface">
                        <strong>
                          {currencySymbol} {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td className="py-md px-lg">
                        <span className={`status-badge status-${inv.status.toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-md px-lg text-secondary">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-md px-lg text-right">
                        <button
                          className="text-primary hover:text-primary-container p-xs bg-transparent border-0 cursor-pointer"
                          onClick={() => {
                            toast.info(`Downloading invoice PDF for #${inv.id}...`);
                          }}
                        >
                          <span className="material-symbols-outlined text-[20px]">download</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Self-Service Plan Management Toggles */}
        <div className="col-span-1 md:col-span-12 flex flex-wrap gap-md mt-md justify-end">
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="h-10 px-lg rounded bg-transparent border border-border-subtle text-secondary font-label-md text-label-md uppercase hover:bg-surface-container-low transition-colors duration-200 cursor-pointer"
          >
            Request Plan Change
          </button>
          {subscription.auto_renew && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="h-10 px-lg rounded bg-transparent border border-error text-error font-label-md text-label-md uppercase hover:bg-error-container hover:text-on-error-container transition-colors duration-200 ml-auto md:ml-0 cursor-pointer"
            >
              Request Cancellation
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Upgrade / Downgrade Selection Modal */}
      {isUpgradeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', width: '100%' }}>
            <div className="modal-header">
              <h2>Select Subscription Plan</h2>
              <button className="modal-close" onClick={() => setIsUpgradeModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="font-body-sm text-secondary mb-4">
                Choose a plan tier to request an upgrade or downgrade of your active system capacity. Changes take effect immediately.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {plans.map((p) => {
                  const isCurrent = p.plan_name.toLowerCase() === subscription.plan_name.toLowerCase();
                  return (
                    <div
                      key={p.plan_id}
                      style={{
                        border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: isCurrent ? '#f0f5ff' : '#ffffff',
                      }}
                    >
                      <div>
                        <h4 className="font-semibold capitalize text-on-surface">{p.plan_name}</h4>
                        <div className="text-xl font-bold my-2">
                          ${p.monthly_price}/mo
                        </div>
                        <ul className="text-[11px] text-secondary space-y-1">
                          <li>✔️ {p.max_users ? `${p.max_users} Users` : 'Unlimited'}</li>
                          <li>✔️ {p.storage_gb} GB Storage</li>
                          <li>✔️ {p.uptime_sla_pct}% SLA</li>
                        </ul>
                      </div>
                      <button
                        type="button"
                        className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'} btn-sm w-full mt-3`}
                        disabled={isCurrent || submitting}
                        onClick={() => handleRequestPlanChange(p.plan_name)}
                      >
                        {isCurrent ? 'Current Plan' : 'Select Plan'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsUpgradeModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Warning Dialog */}
      {isCancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', width: '100%' }}>
            <div className="modal-header">
              <h2 className="text-error">Cancel Subscription Auto-Renew</h2>
              <button className="modal-close" onClick={() => setIsCancelModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="font-body-sm text-on-surface mb-2">
                Are you sure you want to disable automatic renewal?
              </p>
              <p className="font-body-sm text-secondary">
                Your hospital data will remain accessible until the end of the current billing cycle on{' '}
                <strong>
                  {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}
                </strong>
                . After that, access will be suspended.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Keep Plan Active
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: '#ff5630', borderColor: '#ff5630' }}
                disabled={submitting}
                onClick={handleRequestCancel}
              >
                {submitting ? 'Disabling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
