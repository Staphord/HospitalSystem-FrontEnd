import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { masterService } from '@/api/services/master';
import type { Subscription, Tenant, SubscriptionPlan, Invoice } from '@/api/types/master';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { getSubscriptionBanners } from '../utils/subscriptionHelper';

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

 
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<SubscriptionPlan | null>(null);
  const [isConfirmChangeModalOpen, setIsConfirmChangeModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Write audit log entry to hospital tenant's local log
  const logHospitalAudit = (action: string, details: string) => {
    try {
      const logs = JSON.parse(localStorage.getItem('hf_mock_hospital_audit_logs') || '[]');
      logs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        staffName: 'Admin Portal',
        staffRole: 'Hospital Admin',
        action: action,
        department: 'Billing',
        recordId: 'Subscription',
        ipAddress: '192.168.1.1',
        details: details,
        signature: `SHA-256: ${Math.random().toString(16).substring(2, 10)}`
      });
      localStorage.setItem('hf_mock_hospital_audit_logs', JSON.stringify(logs));
    } catch {
      // ignore silently
    }
  };

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



  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!subscription) return;
    setSelectedPlanForChange(plan);
    setIsConfirmChangeModalOpen(true);
  };

  const confirmPlanUpgrade = async () => {
    if (!subscription || !selectedPlanForChange) return;
    setIsProcessingPayment(true);
    try {
      const response = await masterService.upgradeSubscriptionEndpoint(subscription.tenant_id, {
        plan_id: selectedPlanForChange.plan_id
      }) as any;

      const invoiceAmount = response?.invoice?.amount ?? response?.amount ?? 0;
      const checkoutUrl = response?.payment_checkout_url;

      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }

      toast.info(`Checkout invoice of ${currencySymbol} ${invoiceAmount} generated. Verifying payment...`);

      // Wait for server verification
      let verified = false;
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const allSubs = await masterService.listSubscriptions();
        const sub = allSubs.find((s) => s.id === subscription.id);
        if (sub && sub.plan_name === selectedPlanForChange.plan_name && sub.status.toLowerCase() === 'active') {
          verified = true;
          break;
        }
      }

      if (verified) {
        logHospitalAudit(
          'SUBSCRIPTION_UPGRADE',
          `Upgraded plan to ${selectedPlanForChange.plan_name}.`
        );
        toast.success(`Successfully upgraded to ${selectedPlanForChange.plan_name}!`);
        setIsConfirmChangeModalOpen(false);
        setIsUpgradeModalOpen(false);
        fetchSubscriptionData();
      } else {
        toast.info('Payment processing. The dashboard will reflect the active status shortly.');
        setIsConfirmChangeModalOpen(false);
        setIsUpgradeModalOpen(false);
      }
    } catch {
      toast.error('Failed to process upgrade.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const confirmPlanDowngrade = async () => {
    if (!subscription || !selectedPlanForChange) return;
    setSubmitting(true);
    try {
      await masterService.downgradeSubscriptionEndpoint(subscription.tenant_id, {
        plan_id: selectedPlanForChange.plan_id
      });

      logHospitalAudit(
        'SUBSCRIPTION_DOWNGRADE_SCHEDULED',
        `Scheduled subscription downgrade to ${selectedPlanForChange.plan_name} at next renewal.`
      );

      toast.success(`Subscription downgrade to ${selectedPlanForChange.plan_name} scheduled.`);
      setIsConfirmChangeModalOpen(false);
      setIsUpgradeModalOpen(false);
      fetchSubscriptionData();
    } catch {
      toast.error('Failed to schedule plan downgrade.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPendingDowngrade = async () => {
    if (!subscription) return;
    setSubmitting(true);
    try {
      await masterService.updateSubscription(subscription.id, {
        pending_plan_name: null
      });

      logHospitalAudit(
        'SUBSCRIPTION_DOWNGRADE_CANCELLED',
        `Cancelled pending plan downgrade to ${subscription.pending_plan_name}.`
      );

      toast.success('Scheduled downgrade request cancelled.');
      fetchSubscriptionData();
    } catch {
      toast.error('Failed to cancel downgrade request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCancel = async () => {
    if (!subscription) return;
    setSubmitting(true);
    try {
      await masterService.updateSubscription(subscription.id, {
        status: 'cancelled',
        auto_renew: false
      });

      logHospitalAudit(
        'SUBSCRIPTION_CANCEL',
        `Cancelled subscription. Plan access will expire at the end of the term.`
      );

      toast.success('Subscription cancelled. Your access remains active until the end of the current term.');
      setIsCancelModalOpen(false);
      fetchSubscriptionData();
    } catch {
      toast.error('Failed to cancel subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateAutoRenew = async () => {
    if (!subscription) return;
    setSubmitting(true);
    try {
      await masterService.updateSubscription(subscription.id, { auto_renew: true });

      logHospitalAudit(
        'AUTO_RENEW_ENABLED',
        `Enabled subscription auto-renewal.`
      );

      toast.success('Subscription auto-renew reactivated.');
      fetchSubscriptionData();
    } catch {
      toast.error('Failed to reactivate auto-renewal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAutoRenew = async (checked: boolean) => {
    if (!subscription) return;
    setSubmitting(true);
    try {
      await masterService.updateSubscription(subscription.id, { auto_renew: checked });

      logHospitalAudit(
        checked ? 'AUTO_RENEW_ENABLED' : 'AUTO_RENEW_DISABLED',
        `${checked ? 'Enabled' : 'Disabled'} subscription auto-renewal.`
      );

      toast.success(checked ? 'Auto-renewal enabled.' : 'Auto-renewal disabled.');
      fetchSubscriptionData();
    } catch {
      toast.error('Failed to update auto-renewal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;
    setSubmitting(true);
    try {
      await masterService.updateSubscription(subscription.id, {
        status: 'active',
        auto_renew: true
      });

      logHospitalAudit(
        'SUBSCRIPTION_REACTIVATE',
        `Reactivated subscription.`
      );

      toast.success('Subscription reactivated successfully.');
      fetchSubscriptionData();
    } catch {
      toast.error('Failed to reactivate subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBannerAction = (actionType: 'reactivate' | 'cancel_downgrade' | 'support' | 'pay_invoice' | 'open_plans') => {
    switch (actionType) {
      case 'reactivate':
        if (subscription?.status === 'cancelled') {
          handleReactivateSubscription();
        } else {
          handleReactivateAutoRenew();
        }
        break;
      case 'cancel_downgrade':
        handleCancelPendingDowngrade();
        break;
      case 'pay_invoice': {
        const el = document.getElementById('invoice-history-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          toast.info('Please scroll down to the Invoice History section.');
        }
        break;
      }
      case 'support':
        toast.info('Please contact support or master administrators at support@hospitalflow.com');
        break;
      case 'open_plans':
        setIsUpgradeModalOpen(true);
        break;
      default:
        break;
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

  const daysUntilRenewal = subscription.end_date
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - now) / (1000 * 3600 * 24)))
    : null;
  const currencySymbol = tenant.currency || 'USD';
  const priceDisplay = planDetails
    ? `${currencySymbol} ${planDetails.monthly_price.toLocaleString()}`
    : 'N/A';

  // Calculate plan usage details
  const maxUsers = planDetails?.max_users || 0;
  const staffCount = staffList.length;
  const staffPercent = maxUsers > 0 ? Math.min(100, Math.round((staffCount / maxUsers) * 100)) : 0;

  const maxStorage = planDetails?.storage_gb || 10;
  const storageUsed = Math.round(maxStorage * 0.46);
  const storagePercent = Math.min(100, Math.round((storageUsed / maxStorage) * 100));

  const maxPatients = planDetails?.max_patients || 0;
  const patientsCount = 8450;
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

      {/* Dynamic Banners depending on subscription status */}
      {getSubscriptionBanners(subscription, tenant, plans).map((banner) => (
        <div
          key={banner.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '12px 24px',
            borderRadius: '12px',
            border: banner.styles.border,
            background: banner.styles.background,
            color: banner.styles.color,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: banner.styles.iconColor }}
            >
              {banner.icon}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              <strong>{banner.title}:</strong> {banner.message}
            </span>
          </div>
          {banner.action && (
            <button
              onClick={() => handleBannerAction(banner.action!.actionType)}
              disabled={submitting}
              style={{
                background: ['reactivate', 'open_plans', 'pay_invoice'].includes(banner.action.actionType)
                  ? '#0052CC'
                  : 'transparent',
                border: ['reactivate', 'open_plans', 'pay_invoice'].includes(banner.action.actionType)
                  ? 'none'
                  : `1px solid ${banner.styles.color}`,
                color: ['reactivate', 'open_plans', 'pay_invoice'].includes(banner.action.actionType)
                  ? '#ffffff'
                  : banner.styles.color,
                borderRadius: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '11px',
                whiteSpace: 'nowrap',
              }}
            >
              {banner.action.label}
            </button>
          )}
        </div>
      ))}


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
                <span className="font-body-md text-body-md text-on-surface font-medium">{priceDisplay}</span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Grace Period</span>
                <span className="font-body-md text-body-md text-on-surface font-medium">{tenant.grace_days ?? 14} days</span>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="font-label-md text-label-md text-secondary uppercase font-bold">Auto-Renew</span>
                <div className="flex items-center gap-sm mt-xs">
                  <button
                    onClick={() => {
                      handleToggleAutoRenew(!subscription.auto_renew);
                    }}
                    disabled={submitting || ['cancelled', 'suspended', 'terminated'].includes(subscription.status)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    style={{
                      backgroundColor: subscription.auto_renew ? '#36B37E' : '#FF5630',
                      cursor: submitting || ['cancelled', 'suspended', 'terminated'].includes(subscription.status) ? 'not-allowed' : 'pointer',
                      border: 'none',
                      padding: 0,
                      opacity: ['cancelled', 'suspended', 'terminated'].includes(subscription.status) ? 0.6 : 1,
                    }}
                    aria-label="Toggle Auto-Renewal"
                  >
                    <span
                      className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300"
                      style={{
                        transform: subscription.auto_renew ? 'translateX(24px)' : 'translateX(4px)',
                      }}
                    />
                  </button>
                  <span
                    className="font-body-md text-body-md font-semibold select-none"
                    style={{ color: subscription.auto_renew ? '#36B37E' : '#FF5630' }}
                  >
                    {subscription.auto_renew ? 'ON' : 'OFF'}
                  </span>
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
                    <span className="font-label-sm text-label-sm text-warning block font-bold">{maxUsers - staffCount} remaining</span>
                  )}
                </div>
              </div>
              {maxUsers > 0 ? (
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full ${staffPercent > 90 ? 'bg-error' : 'bg-success'}`} style={{ width: `${staffPercent}%` }}></div>
                </div>
              ) : (
                <div className="h-2 w-full bg-success rounded-full"></div>
              )}
            </div>
            <div className="flex flex-col gap-sm">
              <div className="flex justify-between items-end">
                <span className="font-body-sm text-body-sm text-on-surface font-medium">Storage</span>
                <span className="font-body-sm text-body-sm text-on-surface font-semibold">{storageUsed}GB / {maxStorage}GB</span>
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
        <div id="invoice-history-section" className="col-span-1 md:col-span-12 bg-surface-white rounded-xl border border-border-subtle overflow-hidden shadow-sm flex flex-col">
          <div className="px-lg py-md border-b border-border-subtle bg-surface-white">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Invoice History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-bright border-b border-border-subtle">
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Invoice #</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Description</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Amount</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Status</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Due Date</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface bg-surface-white divide-y divide-border-subtle">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary">No billing history found.</td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-row-hover transition-colors">
                      <td className="py-md px-lg font-semibold text-on-surface">#{inv.id}</td>
                      <td className="py-md px-lg text-secondary">{inv.description || 'Monthly Plan Subscription Renewal'}</td>
                      <td className="py-md px-lg text-on-surface">
                        <strong>{currencySymbol} {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </td>
                      <td className="py-md px-lg">
                        <span className={`status-badge status-${inv.status.toLowerCase()}`}>{inv.status}</span>
                      </td>
                      <td className="py-md px-lg text-secondary">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-md px-lg text-right">
                        <button
                          style={{ background: 'transparent', border: 'none', color: '#0052CC', cursor: 'pointer', padding: '4px' }}
                          onClick={() => toast.info(`Downloading invoice PDF for #${inv.id}...`)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="col-span-1 md:col-span-12 flex flex-wrap gap-md justify-end items-center">
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            style={{ height: '40px', padding: '0 24px', borderRadius: '6px', background: 'transparent', border: '1px solid #DFE1E6', color: '#42526E', cursor: 'pointer', fontWeight: 600, fontSize: '12px', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Request Plan Change
          </button>
          {subscription.status !== 'cancelled' ? (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              style={{ height: '40px', padding: '0 24px', borderRadius: '6px', background: 'transparent', border: '1px solid #FF5630', color: '#FF5630', cursor: 'pointer', fontWeight: 600, fontSize: '12px', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffebe6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancel Subscription
            </button>
          ) : (
            <button
              onClick={handleReactivateSubscription}
              disabled={submitting}
              style={{ height: '40px', padding: '0 24px', borderRadius: '6px', background: '#0052CC', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '12px', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#0040a2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0052CC'; }}
            >
              {submitting ? 'Processing...' : 'Reactivate Subscription'}
            </button>
          )}
        </div>
      </div>

      {/* Plan Selection Modal */}
      {isUpgradeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '960px', width: '100%' }}>
            <div className="modal-header">
              <h2>Select Subscription Plan</h2>
              <button className="modal-close" onClick={() => setIsUpgradeModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="font-body-sm text-secondary mb-4">
                Upgrades apply immediately with a prorated charge. Downgrades are scheduled for your next billing cycle.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {plans.map((p) => {
                  const isCurrent = p.plan_name.toLowerCase() === subscription.plan_name.toLowerCase();
                  const isPending = p.plan_name.toLowerCase() === (subscription.pending_plan_name ?? '').toLowerCase() && !isCurrent;
                  const currentPlanObj = plans.find(pl => pl.plan_name.toLowerCase() === subscription.plan_name.toLowerCase());
                  const currentPrice = currentPlanObj ? currentPlanObj.monthly_price : 0;
                  const isUpgrade = p.monthly_price > currentPrice;
                  const priceDiff = p.monthly_price - currentPrice;
                  
                  return (
                    <div
                      key={p.plan_id}
                      style={{
                        border: isCurrent ? '2px solid #0052CC' : isPending ? '2px solid #FFAB00' : '1px solid #DFE1E6',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: isCurrent ? '#f0f5ff' : isPending ? '#FFFAE6' : '#ffffff',
                        position: 'relative',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      {isCurrent && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: '#0052CC',
                            color: '#ffffff',
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Active Plan
                        </span>
                      )}
                      
                      {isPending && (
                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#FFAB00', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                          Pending
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.25rem', textTransform: 'capitalize', marginBottom: '4px', color: '#191c1e' }}>{p.plan_name}</h4>
                        <p style={{ color: '#4f5f7b', fontSize: '0.8rem', marginBottom: '1rem', minHeight: '32px' }}>
                          {p.description || 'Custom corporate tier plan features.'}
                        </p>
                        <div style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0', color: '#191c1e' }}>
                          {currencySymbol} {p.monthly_price}<span style={{ fontSize: '13px', fontWeight: 400, color: '#4f5f7b' }}>/mo</span>
                        </div>
                        
                        <div style={{ borderTop: '1px solid #DFE1E6', paddingTop: '1rem', marginBottom: '1rem' }}>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4f5f7b' }}>
                              <span className="material-symbols-outlined text-[#36B37E]" style={{ fontSize: '16px' }}>check</span>
                              <span>
                                <strong>{p.max_users === null ? 'Unlimited' : p.max_users}</strong> staff user accounts
                              </span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4f5f7b' }}>
                              <span className="material-symbols-outlined text-[#36B37E]" style={{ fontSize: '16px' }}>check</span>
                              <span>
                                <strong>{p.max_patients === null ? 'Unlimited' : p.max_patients.toLocaleString()}</strong> patient records
                              </span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4f5f7b' }}>
                              <span className="material-symbols-outlined text-[#36B37E]" style={{ fontSize: '16px' }}>check</span>
                              <span>
                                <strong>{p.storage_gb} GB</strong> secure document storage
                              </span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4f5f7b' }}>
                              <span className="material-symbols-outlined text-[#36B37E]" style={{ fontSize: '16px' }}>check</span>
                              <span>
                                <strong>{p.uptime_sla_pct}%</strong> guaranteed server uptime SLA
                              </span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4f5f7b' }}>
                              <span className="material-symbols-outlined text-[#36B37E]" style={{ fontSize: '16px' }}>check</span>
                              <span>
                                Backups every <strong>{p.backup_frequency_hours} hours</strong>
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                          <h5 style={{ fontSize: '10px', textTransform: 'uppercase', color: '#4f5f7b', marginBottom: '4px', letterSpacing: '0.05em', fontWeight: 700 }}>
                            Included Modules
                          </h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {p.modules_included.map((mod) => (
                              <span
                                key={mod}
                                style={{
                                  backgroundColor: '#EDEEF0',
                                  color: '#4f5f7b',
                                  fontSize: '9px',
                                  padding: '2px 8px',
                                  textTransform: 'capitalize',
                                  borderRadius: '9999px',
                                  fontWeight: 600,
                                }}
                              >
                                {mod}
                              </span>
                            ))}
                          </div>
                        </div>

                        {!isCurrent && (
                          <div style={{ 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            color: isUpgrade ? '#36B37E' : '#FFAB00', 
                            marginTop: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{isUpgrade ? '⬆ Upgrade' : '⬇ Downgrade'}</span>
                            <span style={{ fontWeight: 500, color: '#4f5f7b' }}>
                              ({isUpgrade ? `+${currencySymbol} ${priceDiff}` : `-${currencySymbol} ${Math.abs(priceDiff)}`}/mo)
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => handleSelectPlan(p)}
                        style={{
                          marginTop: '16px',
                          width: '100%',
                          height: '38px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isCurrent ? '#EDEEF0' : '#0052CC',
                          color: isCurrent ? '#4f5f7b' : '#ffffff',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: isCurrent ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade Now' : 'Schedule Downgrade'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                style={{ height: '38px', padding: '0 20px', borderRadius: '6px', background: 'transparent', border: '1px solid #DFE1E6', color: '#42526E', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade/Downgrade Confirmation Modal */}
      {isConfirmChangeModalOpen && selectedPlanForChange && (() => {
        const currentPlanObj = plans.find(pl => pl.plan_name.toLowerCase() === subscription.plan_name.toLowerCase());
        const isUpgrade = selectedPlanForChange.monthly_price > (currentPlanObj?.monthly_price ?? 0);
        return (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '460px', width: '100%' }}>
              <div className="modal-header">
                <h2>{isUpgrade ? `Upgrade to ${selectedPlanForChange.plan_name}` : `Downgrade to ${selectedPlanForChange.plan_name}`}</h2>
                <button className="modal-close" onClick={() => { setIsConfirmChangeModalOpen(false); setSelectedPlanForChange(null); }}>&times;</button>
              </div>
              <div className="modal-body">
                {isUpgrade ? (
                  <div>
                    <p style={{ fontSize: '14px', color: '#191c1e', marginBottom: '16px' }}>
                      You are upgrading from <strong style={{ textTransform: 'capitalize' }}>{subscription.plan_name}</strong> to{' '}
                      <strong style={{ textTransform: 'capitalize' }}>{selectedPlanForChange.plan_name}</strong>. This activates immediately.
                    </p>
                    <div style={{ background: '#f0f5ff', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#4f5f7b' }}>Price difference</span>
                        <strong style={{ fontSize: '13px', color: '#191c1e' }}>
                          {currencySymbol} {selectedPlanForChange.monthly_price - (currentPlanObj?.monthly_price ?? 0)}/mo
                        </strong>
                      </div>
                      <div style={{ borderTop: '1px solid #DFE1E6', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#191c1e' }}>Prorated Amount</span>
                        <strong style={{ color: '#0052CC', fontSize: '14px' }}>Calculated at checkout</strong>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#4f5f7b' }}>
                      A payment checkout link will be generated to complete your upgrade.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '14px', color: '#191c1e', marginBottom: '16px' }}>
                      You are scheduling a downgrade from <strong style={{ textTransform: 'capitalize' }}>{subscription.plan_name}</strong> to{' '}
                      <strong style={{ textTransform: 'capitalize' }}>{selectedPlanForChange.plan_name}</strong>.
                    </p>
                    <div style={{ background: '#FFFAE6', border: '1px solid #FFAB00', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span className="material-symbols-outlined" style={{ color: '#FFAB00', fontSize: '20px', flexShrink: 0 }}>schedule</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#191c1e', marginBottom: '4px' }}>Effective at cycle end</p>
                        <p style={{ fontSize: '13px', color: '#4f5f7b' }}>
                          Your current <strong>{subscription.plan_name}</strong> plan continues until{' '}
                          <strong>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'renewal'}</strong>.
                          No charge today — the new rate applies from your next billing date.
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#4f5f7b' }}>You can cancel this request before the billing date.</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => { setIsConfirmChangeModalOpen(false); setSelectedPlanForChange(null); }}
                  style={{ height: '38px', padding: '0 20px', borderRadius: '6px', background: 'transparent', border: '1px solid #DFE1E6', color: '#42526E', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayment || submitting}
                  onClick={isUpgrade ? confirmPlanUpgrade : confirmPlanDowngrade}
                  style={{ height: '38px', padding: '0 20px', borderRadius: '6px', background: isUpgrade ? '#0052CC' : '#FFAB00', border: 'none', color: isUpgrade ? '#ffffff' : '#191c1e', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
                >
                  {(isProcessingPayment || submitting)
                    ? 'Processing...'
                    : isUpgrade
                    ? 'Confirm Upgrade'
                    : 'Confirm Downgrade'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel Subscription Modal */}
      {isCancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', width: '100%' }}>
            <div className="modal-header">
              <h2 style={{ color: '#FF5630' }}>Cancel Subscription</h2>
              <button className="modal-close" onClick={() => setIsCancelModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#ffebe6', border: '1px solid #FF5630', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ color: '#FF5630', fontSize: '20px', flexShrink: 0 }}>warning</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#191c1e', marginBottom: '4px' }}>This disables auto-renewal</p>
                  <p style={{ fontSize: '13px', color: '#4f5f7b' }}>
                    Your hospital data and access stays active until{' '}
                    <strong>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'end of cycle'}</strong>.
                    After that, your account will be suspended and may be terminated.
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#4f5f7b' }}>
                You can reactivate your subscription any time before the expiry date to restore full access.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                style={{ height: '38px', padding: '0 20px', borderRadius: '6px', background: 'transparent', border: '1px solid #DFE1E6', color: '#42526E', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleRequestCancel}
                style={{ height: '38px', padding: '0 20px', borderRadius: '6px', background: '#FF5630', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
              >
                {submitting ? 'Processing...' : 'Yes, Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
