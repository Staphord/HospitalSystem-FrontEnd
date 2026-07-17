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
  const [stats, setStats] = useState<any>(null);

  // Pending request state 
  const [pendingRequest, setPendingRequest] = useState<{ pending_action: string; requested_plan?: string; request_reason?: string; requested_at?: string } | null>(null);

  // Modal states for customer requests
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [now] = useState(() => Date.now());

  
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<SubscriptionPlan | null>(null);
  const [isConfirmChangeModalOpen, setIsConfirmChangeModalOpen] = useState(false);

  // Request billing cycle & timing states
  const [requestBillingCycle, setRequestBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [requestEffectiveAtEnd, setRequestEffectiveAtEnd] = useState(false);

  // Request History states
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [requestsSearch, setRequestsSearch] = useState('');
  const [requestsFilterAction, setRequestsFilterAction] = useState<'all' | 'upgrade' | 'downgrade' | 'cancellation'>('all');
  const [requestsFilterStatus, setRequestsFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requestsCurrentPage, setRequestsCurrentPage] = useState(1);
  const [requestsPageSize, setRequestsPageSize] = useState(25);

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

  // Load tenant subscription, plans, invoices, pending request, and request history
  const fetchSubscriptionData = React.useCallback(async () => {
    try {
      const [tenantData, allSubs, plansData, invoicesData, pendingReq, statsData, allReqs] = await Promise.all([
        masterService.getMyTenantDetails(),
        masterService.getMySubscription(),
        masterService.listMyPlans(),
        masterService.listMyInvoices(),
        masterService.getMyRequestStatus().catch(() => null),
        masterService.getMyTenantStats().catch(() => null),
        masterService.listMySubscriptionRequests().catch(() => []),
      ]);

      setTenant(tenantData);
      setPlans(plansData);
      setInvoices(invoicesData);
      setPendingRequest(pendingReq && pendingReq.pending_action ? pendingReq : null);
      setStats(statsData);
      setRequestsList(allReqs);

      const activeSub = allSubs[0];
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

  const confirmPlanChangeRequest = async () => {
    if (!subscription || !selectedPlanForChange) return;
    setSubmitting(true);
    try {
      const cycleLabel = requestBillingCycle === 'annual' ? 'annual' : 'monthly';
      const timingLabel = requestEffectiveAtEnd ? 'at next renewal' : 'immediately';
      await masterService.requestPlanChange({
        plan: selectedPlanForChange.plan_name,
        reason: `Requested change to ${selectedPlanForChange.plan_name} (${cycleLabel}, effective ${timingLabel}).`,
        billing_cycle: requestBillingCycle,
        effective_at_end: requestEffectiveAtEnd,
      });

      logHospitalAudit(
        'SUBSCRIPTION_CHANGE_REQUESTED',
        `Requested plan change to ${selectedPlanForChange.plan_name} (${cycleLabel}, ${timingLabel}). Awaiting super admin approval.`
      );

      toast.success(`Plan change request submitted to ${selectedPlanForChange.plan_name}. Awaiting approval.`);
      setIsConfirmChangeModalOpen(false);
      setIsUpgradeModalOpen(false);
      fetchSubscriptionData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit plan change request.';
      toast.error(typeof msg === 'string' ? msg : 'Failed to submit plan change request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPendingDowngrade = async () => {
    toast.info('Please contact the super administrator to cancel or update a pending request.');
  };

  const handleRequestCancel = async () => {
    if (!subscription) return;
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }
    setSubmitting(true);
    try {
      await masterService.requestCancellation({ reason: cancelReason });

      logHospitalAudit(
        'SUBSCRIPTION_CANCEL_REQUESTED',
        `Cancellation requested: ${cancelReason}. Awaiting super admin approval.`
      );

      toast.success('Cancellation request submitted. Awaiting super admin confirmation.');
      setIsCancelModalOpen(false);
      setCancelReason('');
      fetchSubscriptionData();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to submit cancellation request.';
      toast.error(typeof msg === 'string' ? msg : 'Failed to submit cancellation request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateAutoRenew = async () => {
    if (!subscription) return;
    setSubmitting(true);
    try {
      await masterService.toggleAutoRenew(true);

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
      await masterService.toggleAutoRenew(checked);

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
      await masterService.toggleAutoRenew(true);

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
  const staffCount = stats && typeof stats.active_user_count === 'number' ? stats.active_user_count : staffList.length;
  const staffPercent = maxUsers > 0 ? Math.min(100, Math.round((staffCount / maxUsers) * 100)) : 0;

  const maxStorage = planDetails?.storage_gb || 10;
  const storageUsed = stats && typeof stats.db_size_bytes === 'number'
    ? parseFloat((stats.db_size_bytes / (1024 * 1024 * 1024)).toFixed(3))
    : parseFloat((maxStorage * 0.46).toFixed(3));
  const storagePercent = Math.max(1, Math.min(100, Math.round((storageUsed / maxStorage) * 100)));

  const maxPatients = planDetails?.max_patients || 0;
  const patientsCount = stats && typeof stats.patient_count === 'number' ? stats.patient_count : 8450;
  const patientsPercent = maxPatients > 0 ? Math.min(100, Math.round((patientsCount / maxPatients) * 100)) : 0;

  // Requests pagination and filtering calculations
  const filteredRequests = requestsList.filter((req) => {
    const plan = (req.requested_plan || '').toLowerCase();
    const reason = (req.request_reason || '').toLowerCase();
    const notes = (req.review_notes || '').toLowerCase();
    const action = (req.pending_action || '').toLowerCase();
    const status = (req.status || 'pending').toLowerCase();
    const query = requestsSearch.toLowerCase();

    const matchesSearch =
      plan.includes(query) ||
      reason.includes(query) ||
      notes.includes(query) ||
      action.includes(query) ||
      status.includes(query);

    const matchesAction =
      requestsFilterAction === 'all' ||
      req.pending_action === requestsFilterAction;

    const matchesStatus =
      requestsFilterStatus === 'all' ||
      status === requestsFilterStatus;

    return matchesSearch && matchesAction && matchesStatus;
  });

  const totalRequestsItems = filteredRequests.length;
  const totalRequestsPages = Math.ceil(totalRequestsItems / requestsPageSize) || 1;
  const startRequestsIndex = (requestsCurrentPage - 1) * requestsPageSize;
  const endRequestsIndex = Math.min(startRequestsIndex + requestsPageSize, totalRequestsItems);
  const paginatedRequests = filteredRequests.slice(startRequestsIndex, endRequestsIndex);

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

      {/* Pending Request Banner (FR-85, FR-86) */}
      {pendingRequest && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '12px 24px',
            borderRadius: '12px',
            border: '1px solid #4C9AFF',
            background: '#DEEBFF',
            color: '#0747A6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0052CC' }}>
              schedule
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              <strong>Pending {pendingRequest.pending_action === 'cancellation' ? 'Cancellation' : 'Plan Change'} Request:</strong>{' '}
              {pendingRequest.pending_action === 'cancellation'
                ? 'A cancellation request has been submitted and awaits super admin approval.'
                : `A ${pendingRequest.pending_action} to ${pendingRequest.requested_plan} is awaiting super admin approval.`}
            </span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#0747A6', whiteSpace: 'nowrap' }}>
            Submitted: {pendingRequest.requested_at ? new Date(pendingRequest.requested_at).toLocaleDateString() : 'recently'}
          </span>
        </div>
      )}

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
                          onClick={async () => {
                            try {
                              const blob = await masterService.downloadInvoice(inv.invoice_id || inv.id);
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `invoice_${inv.invoice_number || inv.id}.pdf`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                              toast.success('Invoice downloaded.');
                            } catch {
                              toast.error('Failed to download invoice.');
                            }
                          }}
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

        {/* Subscription Request History Card */}
        <div className="col-span-1 md:col-span-12 bg-surface-white rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between" style={{ marginTop: '20px' }}>
          <div className="px-lg py-md border-b border-border-subtle bg-surface-white flex flex-wrap gap-md justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Subscription Request History</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-input-wrapper" style={{ minWidth: '200px', height: '32px', display: 'flex', alignItems: 'center', border: '1px solid #dfe1e6', borderRadius: '4px', padding: '0 8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#7a869a', marginRight: '4px' }}>search</span>
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={requestsSearch}
                  onChange={(e) => { setRequestsSearch(e.target.value); setRequestsCurrentPage(1); }}
                  style={{ border: 'none', outline: 'none', fontSize: '12px', width: '100%' }}
                />
              </div>
              <select
                value={requestsFilterAction}
                onChange={(e) => { setRequestsFilterAction(e.target.value as any); setRequestsCurrentPage(1); }}
                style={{ height: '32px', padding: '0 8px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '12px', outline: 'none' }}
                title="Action Filter"
              >
                <option value="all">All Actions</option>
                <option value="upgrade">Upgrades</option>
                <option value="downgrade">Downgrades</option>
                <option value="cancellation">Cancellations</option>
              </select>
              <select
                value={requestsFilterStatus}
                onChange={(e) => { setRequestsFilterStatus(e.target.value as any); setRequestsCurrentPage(1); }}
                style={{ height: '32px', padding: '0 8px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '12px', outline: 'none' }}
                title="Status Filter"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={requestsPageSize}
                onChange={(e) => { setRequestsPageSize(Number(e.target.value)); setRequestsCurrentPage(1); }}
                style={{ height: '32px', padding: '0 8px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '12px', outline: 'none' }}
                title="Page Size"
              >
                <option value={10}>Show: 10</option>
                <option value={25}>Show: 25</option>
                <option value={50}>Show: 50</option>
              </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr className="bg-surface-bright border-b border-border-subtle">
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Action</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Details</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Reason</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Status</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Requested At</th>
                  <th className="py-sm px-lg font-label-md text-label-md text-secondary uppercase font-semibold tracking-wider">Review / Notes</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface bg-surface-white divide-y divide-border-subtle">
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-secondary">No requests found.</td>
                  </tr>
                ) : (
                  paginatedRequests.map((req, idx) => (
                    <tr key={req.request_id || idx} className="hover:bg-row-hover transition-colors">
                      <td className="py-md px-lg" style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        <span className={`status-badge status-${req.pending_action === 'cancellation' ? 'terminated' : 'active'}`}>
                          {req.pending_action}
                        </span>
                      </td>
                      <td className="py-md px-lg text-on-surface">
                        {req.requested_plan ? (
                          <span>Target Plan: <strong>{req.requested_plan.toUpperCase()}</strong></span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                        )}
                        {req.billing_cycle && (
                          <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ({req.billing_cycle})
                          </span>
                        )}
                      </td>
                      <td className="py-md px-lg text-secondary">{req.request_reason || '-'}</td>
                      <td className="py-md px-lg">
                        <span className={`status-badge status-${req.status === 'pending' ? 'trial' : req.status === 'approved' ? 'active' : 'terminated'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-md px-lg text-secondary">
                        {req.requested_at ? new Date(req.requested_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-md px-lg text-secondary">
                        {req.review_notes ? (
                          <span style={{ fontStyle: 'italic' }}>"{req.review_notes}"</span>
                        ) : (
                          <span style={{ color: '#ccc' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalRequestsItems > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 24px', borderTop: '1px solid #dfe1e6', fontSize: '12px', color: '#7a869a' }}>
              <span>
                Showing <strong>{startRequestsIndex + 1}</strong> to <strong>{endRequestsIndex}</strong> of{' '}
                <strong>{totalRequestsItems}</strong> requests
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  disabled={requestsCurrentPage === 1}
                  onClick={() => setRequestsCurrentPage(p => Math.max(1, p - 1))}
                  style={{ height: '28px', padding: '0 10px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#fff', cursor: requestsCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={requestsCurrentPage === totalRequestsPages}
                  onClick={() => setRequestsCurrentPage(p => Math.min(totalRequestsPages, p + 1))}
                  style={{ height: '28px', padding: '0 10px', borderRadius: '4px', border: '1px solid #dfe1e6', background: '#fff', cursor: requestsCurrentPage === totalRequestsPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="col-span-1 md:col-span-12 flex flex-wrap gap-md justify-end items-center">
          <button
            onClick={() => {
              if (!pendingRequest) {
                const currentCycle = String(subscription?.billing_cycle || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly';
                setRequestBillingCycle(currentCycle);
                setRequestEffectiveAtEnd(false);
                setIsUpgradeModalOpen(true);
              }
            }}
            disabled={!!pendingRequest}
            title={pendingRequest ? 'A request is already pending approval' : ''}
            style={{ height: '40px', padding: '0 24px', borderRadius: '6px', background: pendingRequest ? '#f4f5f7' : 'transparent', border: `1px solid ${pendingRequest ? '#dfe1e6' : '#DFE1E6'}`, color: pendingRequest ? '#999' : '#42526E', cursor: pendingRequest ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!pendingRequest) e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={e => { if (!pendingRequest) e.currentTarget.style.background = 'transparent'; }}
          >
            Request Plan Change
          </button>
          {subscription.status !== 'cancelled' ? (
            <button
              onClick={() => !pendingRequest && setIsCancelModalOpen(true)}
              disabled={!!pendingRequest}
              title={pendingRequest ? 'A request is already pending approval' : ''}
              style={{ height: '40px', padding: '0 24px', borderRadius: '6px', background: pendingRequest ? '#f4f5f7' : 'transparent', border: `1px solid ${pendingRequest ? '#dfe1e6' : '#FF5630'}`, color: pendingRequest ? '#999' : '#FF5630', cursor: pendingRequest ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '12px', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!pendingRequest) e.currentTarget.style.background = '#ffebe6'; }}
              onMouseLeave={e => { if (!pendingRequest) e.currentTarget.style.background = 'transparent'; }}
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
              <button className="modal-close" onClick={() => setIsUpgradeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: '#4f5f7b', marginBottom: '1.5rem' }}>
                Compare plans and submit a plan change request. Upgrades apply immediately with a prorated charge. Downgrades are scheduled for your next billing cycle.
              </p>

              {/* Billing Cycle Option Selector */}
              <div style={{ display: 'flex', gap: '2rem', padding: '0.75rem 1rem', backgroundColor: '#f8f9fa', border: '1px solid #DFE1E6', borderRadius: '8px', marginBottom: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#191c1e' }}>Billing Cycle:</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer', userSelect: 'none', color: '#191c1e' }}>
                  <input type="radio" name="billingCycle" checked={requestBillingCycle === 'monthly'} onChange={() => setRequestBillingCycle('monthly')} style={{ cursor: 'pointer' }} />
                  Monthly Billing
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer', userSelect: 'none', color: '#191c1e' }}>
                  <input type="radio" name="billingCycle" checked={requestBillingCycle === 'annual'} onChange={() => setRequestBillingCycle('annual')} style={{ cursor: 'pointer' }} />
                  Annual Billing (Discounted)
                </label>
              </div>

              {/* Activation Timing Option Selector */}
              <div style={{ display: 'flex', gap: '2rem', padding: '0.75rem 1rem', backgroundColor: '#f8f9fa', border: '1px solid #DFE1E6', borderRadius: '8px', marginBottom: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#191c1e' }}>Activation Timing:</span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer', userSelect: 'none', color: '#191c1e' }}>
                  <input type="radio" name="timing" checked={!requestEffectiveAtEnd} onChange={() => setRequestEffectiveAtEnd(false)} style={{ cursor: 'pointer' }} />
                  Immediate (Prorated)
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', cursor: 'pointer', userSelect: 'none', color: '#191c1e' }}>
                  <input type="radio" name="timing" checked={requestEffectiveAtEnd} onChange={() => setRequestEffectiveAtEnd(true)} style={{ cursor: 'pointer' }} />
                  Next Billing Cycle (Deferred)
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                {plans
                  .filter((plan) => {
                    const isTrial = plan.plan_name.toLowerCase().includes('free') || plan.plan_name.toLowerCase() === 'trial';
                    return !(requestBillingCycle === 'annual' && isTrial);
                  })
                  .map((p) => {
                    const currentPlanObj = plans.find(pl => pl.plan_name.toLowerCase() === subscription.plan_name.toLowerCase());
                    const currentPrice = currentPlanObj
                      ? (String(subscription.billing_cycle || '').toLowerCase() === 'annual' ? currentPlanObj.annual_price : currentPlanObj.monthly_price)
                      : 0;

                    const isCurrent = p.plan_name.toLowerCase() === subscription.plan_name.toLowerCase() &&
                      requestBillingCycle === String(subscription.billing_cycle || '').toLowerCase();
                    const isPending = !!(tenant && tenant.pending_plan &&
                      p.plan_name.toLowerCase() === tenant.pending_plan.toLowerCase() &&
                      requestBillingCycle === String(tenant.pending_billing_cycle || '').toLowerCase());

                    const targetPrice = requestBillingCycle === 'annual' ? p.annual_price : p.monthly_price;
                    const priceDiff = targetPrice - currentPrice;
                    const isUpgrade = targetPrice > currentPrice;
                    
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
                            {currencySymbol} {targetPrice}<span style={{ fontSize: '13px', fontWeight: 400, color: '#4f5f7b' }}>/{requestBillingCycle === 'annual' ? 'yr' : 'mo'}</span>
                          </div>
                          
                          <div style={{ borderTop: '1px solid #DFE1E6', paddingTop: '1rem', marginBottom: '1rem' }}>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4f5f7b' }}>
                                <span className="material-symbols-outlined text-[#36B37E]" style={{ fontSize: '16px' }}>check</span>
                                <span>
                                  <strong>{p.max_users == null || p.max_users === 0 ? 'Unlimited' : p.max_users}</strong> staff user accounts
                                </span>
                              </li>
                              <li style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4f5f7b' }}>
                                <span className="material-symbols-outlined text-[#36B37E]" style={{ fontSize: '16px' }}>check</span>
                                <span>
                                  <strong>{p.max_patients == null ? 'Unlimited' : p.max_patients.toLocaleString()}</strong> patient records
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
                                ({isUpgrade ? `+` : `-`}{currencySymbol} {Math.abs(priceDiff)}/{requestBillingCycle === 'annual' ? 'yr' : 'mo'})
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isCurrent || isPending || !!pendingRequest}
                          onClick={() => handleSelectPlan(p)}
                          style={{
                            marginTop: '16px',
                            width: '100%',
                            height: '38px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isCurrent || isPending || !!pendingRequest ? '#EDEEF0' : '#0052CC',
                            color: isCurrent || isPending || !!pendingRequest ? '#4f5f7b' : '#ffffff',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: isCurrent || isPending || !!pendingRequest ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isCurrent ? 'Current Plan' : isPending ? 'Pending Activation' : !!pendingRequest ? 'Request Pending' : isUpgrade ? 'Select Upgrade' : 'Select Downgrade'}
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

      {/* Plan Change Request Confirmation Modal (FR-85: submits request for super admin approval) */}
      {isConfirmChangeModalOpen && selectedPlanForChange && (() => {
        const currentPlanObj = plans.find(pl => pl.plan_name.toLowerCase() === subscription.plan_name.toLowerCase());
        const currentPrice = currentPlanObj
          ? (String(subscription.billing_cycle || '').toLowerCase() === 'annual' ? currentPlanObj.annual_price : currentPlanObj.monthly_price)
          : 0;
        const targetPrice = requestBillingCycle === 'annual' ? selectedPlanForChange.annual_price : selectedPlanForChange.monthly_price;
        const isUpgrade = targetPrice > currentPrice;
        const priceDiff = targetPrice - currentPrice;
        const cycleLabel = requestBillingCycle === 'annual' ? 'year' : 'month';
        const timingLabel = requestEffectiveAtEnd ? 'at next renewal' : 'immediately';
        return (
          <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '460px', width: '100%' }}>
              <div className="modal-header">
                <h2>{isUpgrade ? `Request Upgrade to ${selectedPlanForChange.plan_name}` : `Request Downgrade to ${selectedPlanForChange.plan_name}`}</h2>
                <button className="modal-close" onClick={() => { setIsConfirmChangeModalOpen(false); setSelectedPlanForChange(null); }}>&times;</button>
              </div>
              <div className="modal-body">
                <div>
                  <p style={{ fontSize: '14px', color: '#191c1e', marginBottom: '16px' }}>
                    You are requesting a plan change from <strong style={{ textTransform: 'capitalize' }}>{subscription.plan_name} ({subscription.billing_cycle})</strong> to{' '}
                    <strong style={{ textTransform: 'capitalize' }}>{selectedPlanForChange.plan_name} ({requestBillingCycle})</strong> to take effect <strong>{timingLabel}</strong>.
                  </p>
                  <div style={{ background: '#f0f5ff', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#4f5f7b' }}>Price difference</span>
                      <strong style={{ fontSize: '13px', color: '#191c1e' }}>
                        {priceDiff >= 0 ? `+` : `-`}{currencySymbol} {Math.abs(priceDiff)}/{cycleLabel}
                      </strong>
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#4f5f7b' }}>
                    A super admin will review and approve your request. You will be notified once processed.
                  </p>
                </div>
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
                  disabled={submitting}
                  onClick={confirmPlanChangeRequest}
                  style={{ height: '38px', padding: '0 20px', borderRadius: '6px', background: '#0052CC', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel Subscription Modal (FR-86: submits request for super admin approval) */}
      {isCancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', width: '100%' }}>
            <div className="modal-header">
              <h2 style={{ color: '#FF5630' }}>Request Cancellation</h2>
              <button className="modal-close" onClick={() => setIsCancelModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#ffebe6', border: '1px solid #FF5630', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ color: '#FF5630', fontSize: '20px', flexShrink: 0 }}>warning</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#191c1e', marginBottom: '4px' }}>Super Admin confirmation required</p>
                  <p style={{ fontSize: '13px', color: '#4f5f7b' }}>
                    Your cancellation request will be submitted for super admin review. Access stays active until{' '}
                    <strong>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'end of cycle'}</strong>{' '}
                    or until the request is approved, whichever comes later.
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#191c1e', marginBottom: '6px' }}>
                  Reason for cancellation <span style={{ color: '#FF5630' }}>*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancelling your subscription..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #DFE1E6',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#4f5f7b' }}>
                You can cancel this request before the super admin reviews it by contacting support.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => { setIsCancelModalOpen(false); setCancelReason(''); }}
                style={{ height: '38px', padding: '0 20px', borderRadius: '6px', background: 'transparent', border: '1px solid #DFE1E6', color: '#42526E', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                Keep Active
              </button>
              <button
                type="button"
                disabled={submitting || !cancelReason.trim()}
                onClick={handleRequestCancel}
                style={{ height: '38px', padding: '0 20px', borderRadius: '6px', background: cancelReason.trim() ? '#FF5630' : '#DFE1E6', border: 'none', color: cancelReason.trim() ? '#ffffff' : '#999', cursor: cancelReason.trim() ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '12px' }}
              >
                {submitting ? 'Processing...' : 'Submit Cancellation Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
