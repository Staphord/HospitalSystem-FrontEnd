import type { Subscription, SubscriptionPlan, Tenant } from '@/api/types/master';

export interface BannerAction {
  label: string;
  actionType: 'reactivate' | 'cancel_downgrade' | 'support' | 'pay_invoice' | 'open_plans';
}

export interface SubscriptionBanner {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  icon: string;
  action?: BannerAction;
  styles: {
    background: string;
    border: string;
    color: string;
    iconColor: string;
  };
}

/**
 * Dynamically determines the active subscription banners based on status, auto-renew,
 * and pending changes. All messages and styles are centralized here instead of being
 * hardcoded in the component JSX.
 */
export const getSubscriptionBanners = (
  subscription: Subscription,
  tenant: Tenant,
  plans: SubscriptionPlan[]
): SubscriptionBanner[] => {
  const banners: SubscriptionBanner[] = [];
  const planName = subscription.plan_name;
  const endDateStr = subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'renewal date';

  // 1. Terminated Status Banner
  if (subscription.status === 'terminated') {
    banners.push({
      id: 'banner-terminated',
      type: 'error',
      title: 'Subscription Terminated',
      message: 'Your hospital subscription has been terminated. Please contact support or the master administrator to reactivate your access.',
      icon: 'cancel',
      action: {
        label: 'Contact Support',
        actionType: 'support',
      },
      styles: {
        background: '#FFEBE6',
        border: '1px solid #FF5630',
        color: '#BF2600',
        iconColor: '#FF5630',
      },
    });
    return banners; // If terminated, don't show other banners
  }

  // 2. Suspended Status Banner
  if (subscription.status === 'suspended') {
    banners.push({
      id: 'banner-suspended',
      type: 'error',
      title: 'Subscription Suspended',
      message: 'Your subscription is suspended due to outstanding invoices. Please settle your payment to restore full access.',
      icon: 'error',
      action: {
        label: 'Pay Invoices',
        actionType: 'pay_invoice',
      },
      styles: {
        background: '#FFEBE6',
        border: '1px solid #FF5630',
        color: '#BF2600',
        iconColor: '#FF5630',
      },
    });
    return banners;
  }

  // 3. Grace Period Banner
  if (subscription.status.toLowerCase() === 'grace_period' || subscription.status.toLowerCase() === 'grace') {
    banners.push({
      id: 'banner-grace',
      type: 'warning',
      title: 'Grace Period Active',
      message: `Your subscription is in a grace period. Please renew by ${endDateStr} to avoid service disruption.`,
      icon: 'warning',
      action: {
        label: 'Pay Outstanding Invoices',
        actionType: 'pay_invoice',
      },
      styles: {
        background: '#FFFAE6',
        border: '1px solid #FFAB00',
        color: '#7A4F00',
        iconColor: '#FFAB00',
      },
    });
  }

  // 4. Pending Downgrade Banner
  if (subscription.pending_plan_name) {
    banners.push({
      id: 'banner-pending-downgrade',
      type: 'info',
      title: 'Scheduled Downgrade',
      message: `Your plan will switch to ${subscription.pending_plan_name.toUpperCase()} at the end of your billing cycle on ${endDateStr}.`,
      icon: 'schedule',
      action: {
        label: 'Cancel Downgrade',
        actionType: 'cancel_downgrade',
      },
      styles: {
        background: '#DEEBFF',
        border: '1px solid #4C9AFF',
        color: '#0747A6',
        iconColor: '#0052CC',
      },
    });
  }

  // 5. Cancelled Status Banner
  if (subscription.status === 'cancelled') {
    banners.push({
      id: 'banner-cancelled',
      type: 'warning',
      title: 'Subscription Cancelled',
      message: `Your subscription is cancelled. Your ${planName.toUpperCase()} plan remains active and you have full access until ${endDateStr}. After that date, your account will be suspended unless you reactivate.`,
      icon: 'warning',
      action: {
        label: 'Reactivate Subscription',
        actionType: 'reactivate',
      },
      styles: {
        background: '#FFFAE6',
        border: '1px solid #FFAB00',
        color: '#7A4F00',
        iconColor: '#FFAB00',
      },
    });
  }

  // 6. Auto-renew disabled banner (only when active and not cancelled)
  if (!subscription.auto_renew && subscription.status === 'active' && !subscription.pending_plan_name) {
    banners.push({
      id: 'banner-auto-renew-off',
      type: 'info',
      title: 'Auto-renewal Off',
      message: `Auto-renewal is turned off. Your ${planName.toUpperCase()} plan remains active, but you must manually renew or pay the next invoice to keep your service active after ${endDateStr}.`,
      icon: 'info',
      action: {
        label: 'Enable Auto-Renew',
        actionType: 'reactivate',
      },
      styles: {
        background: '#F4F5F7',
        border: '1px solid #DFE1E6',
        color: '#42526E',
        iconColor: '#42526E',
      },
    });
  }

  // 6. Trial Banner
  if (subscription.status === 'trial') {
    banners.push({
      id: 'banner-trial',
      type: 'info',
      title: 'Trial Account',
      message: `You are currently on a trial of the ${planName.toUpperCase()} plan expiring on ${endDateStr}. Upgrade today to prevent losing access.`,
      icon: 'explore',
      action: {
        label: 'Upgrade Now',
        actionType: 'open_plans',
      },
      styles: {
        background: '#EAE6FF',
        border: '1px solid #8F7EE6',
        color: '#403294',
        iconColor: '#6554C0',
      },
    });
  }

  return banners;
};
