import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Subscription, Tenant, SubscriptionPlan } from '@/api/types/master'
import { ChangePlanModal } from '../components/ChangePlanModal'

export function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [now] = useState(() => Date.now())
  const [invoices, setInvoices] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [historyTab, setHistoryTab] = useState<'invoices' | 'plan-events'>('invoices')

  // Invoices Tab Pagination & Filters State
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all')
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoicePageSize, setInvoicePageSize] = useState(25)

  // Plan Events Tab Pagination & Filters State
  const [eventFilter, setEventFilter] = useState('all')
  const [eventPage, setEventPage] = useState(1)
  const [eventPageSize, setEventPageSize] = useState(25)

  const safeLower = (value: string | null | undefined) => String(value || '').toLowerCase()

  useEffect(() => {
    setInvoicePage(1)
  }, [invoiceStatusFilter])

  useEffect(() => {
    setEventPage(1)
  }, [eventFilter])

  useEffect(() => {
    if (!id) return
    let active = true
    const fetchData = async () => {
      try {
        const allSubs = await masterService.listSubscriptions()
        const sub = allSubs.find((s) => s.id === id)

        if (!sub) {
          toast.error('Subscription not found.')
          navigate('/master/subscriptions')
          return
        }

        if (active) {
          setSubscription(sub)
        }

        const [tenantData, plansData, invoicesData, auditLogsData] = await Promise.all([
          masterService.getTenant(sub.tenant_id),
          masterService.listPlans(),
          masterService.listInvoices(sub.tenant_id),
          masterService.listSubscriptionAuditLogs(sub.tenant_id)
        ])

        if (active) {
          setTenant(tenantData)
          setPlans(plansData)
          setInvoices(invoicesData)
          setAuditLogs(auditLogsData)
          setLoading(false)
        }
      } catch {
        toast.error('Failed to load subscription details.')
        navigate('/master/subscriptions')
      }
    }

    fetchData()
    return () => {
      active = false
    }
  }, [id, navigate])

  const handleToggleAutoRenew = async () => {
    if (!subscription || !id) return
    setUpdating(true)
    const newAutoRenew = !subscription.auto_renew
    try {
      await masterService.updateSubscription(id, { auto_renew: newAutoRenew })
      setSubscription({ ...subscription, auto_renew: newAutoRenew })
      toast.success(`Auto-renew has been ${newAutoRenew ? 'enabled' : 'disabled'}.`)
    } catch {
      toast.error('Failed to update subscription auto-renew status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePlan = async (newPlanName: string, billingCycle: 'monthly' | 'annual', effectiveAtEnd: boolean) => {
    if (!subscription || !id) return
    const planSlug = newPlanName.toLowerCase()
 
    const targetPlan = plans.find((p) => p.plan_name.toLowerCase() === planSlug)
    if (!targetPlan) {
      toast.error('Selected plan was not found.')
      return
    }
 
    // Map plan names to their rankings
    const PLAN_RANKS: Record<string, number> = {
      'free trial': 0,
      'free_trial': 0,
      'trial': 0,
      'basic': 1,
      'standard': 2,
      'premium': 3
    }
 
    const currentRank = PLAN_RANKS[subscription.plan_name.toLowerCase()] ?? 0
    const targetRank = PLAN_RANKS[planSlug] ?? 0
 
    const isBillingCycleUpgrade = subscription.billing_cycle === 'monthly' && billingCycle === 'annual'
    const isUpgradeChange = targetRank > currentRank || (targetRank === currentRank && isBillingCycleUpgrade)

    try {
      if (subscription.status.toLowerCase() === 'trial') {
        await masterService.upgradeSubscriptionEndpoint(subscription.tenant_id, {
          plan_id: targetPlan.plan_id,
          billing_cycle: billingCycle,
          effective_at_end: effectiveAtEnd
        })
      } else if (isUpgradeChange) {
        await masterService.upgradeSubscriptionEndpoint(subscription.tenant_id, {
          plan_id: targetPlan.plan_id,
          billing_cycle: billingCycle,
          effective_at_end: effectiveAtEnd
        })
      } else {
        await masterService.downgradeSubscriptionEndpoint(subscription.tenant_id, {
          plan_id: targetPlan.plan_id,
          billing_cycle: billingCycle,
          effective_at_end: effectiveAtEnd
        })
      }

      // Reload all page data to reflect the plan change, new subscription record,
      // and any generated invoice. Use the tenant_id to filter subscriptions.
      const [allSubs, tenantData, invoicesData, auditLogsData] = await Promise.all([
        masterService.listSubscriptions(subscription.tenant_id),
        masterService.getTenant(subscription.tenant_id),
        masterService.listInvoices(subscription.tenant_id),
        masterService.listSubscriptionAuditLogs(subscription.tenant_id),
      ])

      // Pick the newest subscription record for this tenant
      const newestSub = allSubs.length > 0 ? allSubs[0] : null

      if (newestSub) {
        setSubscription(newestSub)
        setTenant(tenantData)
        setInvoices(invoicesData)
        setAuditLogs(auditLogsData)
        if (newestSub.id !== id) {
          navigate(`/master/subscriptions/${newestSub.id}`, { replace: true })
        }
      }
    } catch {
      toast.error('Failed to change subscription plan.')
      throw new Error('Failed to change subscription plan.')
    }
  }

  const getDaysRemaining = () => {
    if (!subscription?.end_date) return null
    const end = new Date(subscription.end_date)
    const diff = end.getTime() - now
    return Math.ceil(diff / (1000 * 3600 * 24))
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-light)' }}>
        Loading subscription details...
      </div>
    )
  }

  if (!subscription || !tenant) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-light)' }}>
        Subscription not found.
      </div>
    )
  }

  const daysRemaining = getDaysRemaining()
  const activePlanDetails = plans.find(
    (p) => safeLower(p.plan_name) === safeLower(subscription.plan_name)
  )
  const includedModules = Array.isArray(activePlanDetails?.modules_included)
    ? activePlanDetails.modules_included
    : []

  // Filter and Paginate Invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceStatusFilter === 'all') return true
    return safeLower(inv.status) === invoiceStatusFilter.toLowerCase()
  })
  const totalInvoices = filteredInvoices.length
  const totalInvoicePages = Math.ceil(totalInvoices / invoicePageSize) || 1
  const startInvoiceIndex = (invoicePage - 1) * invoicePageSize
  const endInvoiceIndex = Math.min(startInvoiceIndex + invoicePageSize, totalInvoices)
  const paginatedInvoices = filteredInvoices.slice(startInvoiceIndex, endInvoiceIndex)

  // Filter and Paginate Plan Events
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (eventFilter === 'all') return true
    return safeLower(log.event_type) === eventFilter.toLowerCase()
  })
  const totalEvents = filteredAuditLogs.length
  const totalEventPages = Math.ceil(totalEvents / eventPageSize) || 1
  const startEventIndex = (eventPage - 1) * eventPageSize
  const endEventIndex = Math.min(startEventIndex + eventPageSize, totalEvents)
  const paginatedEvents = filteredAuditLogs.slice(startEventIndex, endEventIndex)

  // Determine styles and labels for countdown display
  let countdownBg = 'rgba(54, 179, 126, 0.1)'
  let countdownColor = '#36b37e'
  let countdownLabel = 'Healthy'

  if (safeLower(subscription.status) === 'suspended' || safeLower(subscription.status) === 'expired') {
    countdownBg = 'rgba(255, 86, 48, 0.1)'
    countdownColor = '#ff5630'
    countdownLabel = 'Expired / Suspended'
  } else if (daysRemaining !== null) {
    if (daysRemaining <= 0) {
      countdownBg = 'rgba(255, 86, 48, 0.1)'
      countdownColor = '#ff5630'
      countdownLabel = 'Expired'
    } else if (daysRemaining <= 14) {
      countdownBg = 'rgba(255, 171, 0, 0.1)'
      countdownColor = '#ffab00'
      countdownLabel = 'Expiring Soon'
    }
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/master/subscriptions" style={{ fontSize: '0.875rem', textDecoration: 'none', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Back to Subscriptions
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title={`Subscription Details: ${tenant.hospital_name}`}
          description={`Manage active plan logs and auto-billing configurations for tenant: ${tenant.hospital_name}.`}
        />
        {['active', 'trial', 'grace'].includes(safeLower(subscription.status)) && (
          <button
            className="btn btn-primary"
            onClick={() => setIsChangePlanOpen(true)}
          >
            Change Plan Tiers
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>

        {/* Left Column: Plan Information Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Subscription Status & Terms</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Plan Tier</div>
                <strong style={{ fontSize: '1.125rem', textTransform: 'capitalize' }}>{subscription.plan_name}</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Current Status</div>
                <span className={`status-badge status-${safeLower(subscription.status)}`}>
                  {subscription.status ? subscription.status.replace('_', ' ') : 'unknown'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Start Date</div>
                <div>{subscription.start_date ? new Date(subscription.start_date).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.25rem' }}>Renewal/Expiration Date</div>
                <div>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.875rem', display: 'block' }}>Auto-Renew</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Automatically generates invoice renewals upon expiration.</span>
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!subscription.auto_renew}
                  disabled={updating}
                  onChange={handleToggleAutoRenew}
                  style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{subscription.auto_renew ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>
          </div>

          {activePlanDetails && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Provisioned Plan Limits</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Staff Accounts</div>
                  <strong style={{ fontSize: '1.25rem' }}>{activePlanDetails.max_users == null ? 'Unlimited' : activePlanDetails.max_users}</strong>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Patient Records</div>
                  <strong style={{ fontSize: '1.25rem' }}>{activePlanDetails.max_patients == null ? 'Unlimited' : activePlanDetails.max_patients.toLocaleString()}</strong>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Storage Space</div>
                  <strong style={{ fontSize: '1.25rem' }}>{activePlanDetails.storage_gb} GB</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                  Included Application Modules
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {includedModules.map((mod) => (
                    <span
                      key={mod}
                      className="badge"
                      style={{
                        backgroundColor: 'var(--color-secondary-light)',
                        color: 'var(--color-secondary)',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        borderRadius: '9999px',
                        padding: '0.2rem 0.6rem'
                      }}
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subscription & Billing History Card */}
          <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: 600 }}>Subscription & Billing History</h3>

            {/* Tab Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setHistoryTab('invoices')}
                style={{
                  padding: '0.6rem 1.2rem',
                  border: 'none',
                  background: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  borderBottom: historyTab === 'invoices' ? '2px solid var(--color-primary)' : 'none',
                  color: historyTab === 'invoices' ? 'var(--color-primary)' : 'var(--color-text-light)'
                }}
              >
                Invoices & Payments
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('plan-events')}
                style={{
                  padding: '0.6rem 1.2rem',
                  border: 'none',
                  background: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  borderBottom: historyTab === 'plan-events' ? '2px solid var(--color-primary)' : 'none',
                  color: historyTab === 'plan-events' ? 'var(--color-primary)' : 'var(--color-text-light)'
                }}
              >
                Plan Change Log
              </button>
            </div>

            {/* Tab Content */}
            {historyTab === 'invoices' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    style={{ maxWidth: '200px', width: 'auto' }}
                    aria-label="Filter Invoices by Status"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="overdue">Overdue</option>
                    <option value="partially_paid">Partially Paid</option>
                  </select>

                  <select
                    className="form-control"
                    value={invoicePageSize}
                    onChange={(e) => {
                      setInvoicePageSize(Number(e.target.value))
                      setInvoicePage(1)
                    }}
                    style={{ maxWidth: '150px', width: 'auto' }}
                    title="Page Size"
                  >
                    <option value={10}>Show: 10</option>
                    <option value={25}>Show: 25</option>
                    <option value={50}>Show: 50</option>
                    <option value={100}>Show: 100</option>
                  </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  {filteredInvoices.length === 0 ? (
                    <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
                      No invoice history records found matching your filters.
                    </div>
                  ) : (
                    <>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-light)' }}>
                            <th style={{ padding: '0.5rem' }}>Invoice Number</th>
                            <th style={{ padding: '0.5rem' }}>Billing Period</th>
                            <th style={{ padding: '0.5rem' }}>Plan</th>
                            <th style={{ padding: '0.5rem' }}>Amount</th>
                            <th style={{ padding: '0.5rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedInvoices.map((inv) => (
                            <tr key={inv.invoice_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{inv.invoice_number}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                {new Date(inv.billing_period_start).toLocaleDateString()} - {new Date(inv.billing_period_end).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '0.75rem 0.5rem', textTransform: 'capitalize' }}>{inv.plan_name}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>${Number(inv.amount).toFixed(2)}</td>
                              <td style={{ padding: '0.75rem 0.5rem' }}>
                                <span
                                  className={`badge ${
                                    inv.status === 'paid' ? 'badge-success' : inv.status === 'overdue' ? 'badge-danger' : 'badge-warning'
                                  }`}
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination Controls */}
                      {totalInvoices > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Showing <strong>{startInvoiceIndex + 1}</strong> to <strong>{endInvoiceIndex}</strong> of{' '}
                            <strong>{totalInvoices}</strong> entries
                          </span>
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              disabled={invoicePage === 1}
                              onClick={() => setInvoicePage(invoicePage - 1)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                            </button>

                            {Array.from({ length: totalInvoicePages }, (_, i) => i + 1).map((page) => {
                              if (page === 1 || page === totalInvoicePages || (page >= invoicePage - 2 && page <= invoicePage + 2)) {
                                return (
                                  <button
                                    key={page}
                                    type="button"
                                    className={`btn ${invoicePage === page ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }}
                                    onClick={() => setInvoicePage(page)}
                                  >
                                    {page}
                                  </button>
                                )
                              }
                              if (page === invoicePage - 3 || page === invoicePage + 3) {
                                return <span key={`ellipsis-${page}`} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>...</span>
                              }
                              return null
                            })}

                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              disabled={invoicePage === totalInvoicePages}
                              onClick={() => setInvoicePage(invoicePage + 1)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <select
                    className="form-control"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    style={{ maxWidth: '200px', width: 'auto' }}
                    aria-label="Filter Events by Type"
                  >
                    <option value="all">All Events</option>
                    {Array.from(new Set(auditLogs.map((log) => log.event_type))).map((t) => (
                      <option key={t} value={t}>
                        {String(t).replace('_', ' ')}
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-control"
                    value={eventPageSize}
                    onChange={(e) => {
                      setEventPageSize(Number(e.target.value))
                      setEventPage(1)
                    }}
                    style={{ maxWidth: '150px', width: 'auto' }}
                    title="Page Size"
                  >
                    <option value={10}>Show: 10</option>
                    <option value={25}>Show: 25</option>
                    <option value={50}>Show: 50</option>
                    <option value={100}>Show: 100</option>
                  </select>
                </div>

                {filteredAuditLogs.length === 0 ? (
                  <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
                    No subscription logs found matching your filters.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {paginatedEvents.map((log) => (
                        <div
                          key={log.log_id || log.id}
                          style={{
                            padding: '1rem',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            backgroundColor: 'var(--color-background-light, #fdfdfd)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>
                              {log.event_type.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                            {log.reason || 'No description provided.'}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalEvents > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          Showing <strong>{startEventIndex + 1}</strong> to <strong>{endEventIndex}</strong> of{' '}
                          <strong>{totalEvents}</strong> entries
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            disabled={eventPage === 1}
                            onClick={() => setEventPage(eventPage - 1)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                          </button>

                          {Array.from({ length: totalEventPages }, (_, i) => i + 1).map((page) => {
                            if (page === 1 || page === totalEventPages || (page >= eventPage - 2 && page <= eventPage + 2)) {
                              return (
                                <button
                                  key={page}
                                  type="button"
                                  className={`btn ${eventPage === page ? 'btn-primary' : 'btn-secondary'}`}
                                  style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }}
                                  onClick={() => setEventPage(page)}
                                >
                                  {page}
                                </button>
                              )
                            }
                            if (page === eventPage - 3 || page === eventPage + 3) {
                              return <span key={`ellipsis-${page}`} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>...</span>
                            }
                            return null
                          })}

                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            disabled={eventPage === totalEventPages}
                            onClick={() => setEventPage(eventPage + 1)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Expiry & Quick Links Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Expiration Countdown Chip Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              border: `1px solid ${countdownColor}`,
              backgroundColor: countdownBg,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: countdownColor }}>hourglass_empty</span>
            <h4 style={{ margin: '0 0 0.25rem 0', color: countdownColor, fontWeight: 700 }}>{countdownLabel}</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--color-text)' }}>
              {daysRemaining !== null ? (
                daysRemaining > 0 ? (
                  `${daysRemaining} Days Left`
                ) : daysRemaining === 0 ? (
                  'Expires Today'
                ) : (
                  `${Math.abs(daysRemaining)} Days Overdue`
                )
              ) : (
                'Lifetime Access'
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              Current billing parameters
            </span>
          </div>

          {/* Quick Actions & Links */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600 }}>Quick Navigation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to={`/master/tenants/${tenant.tenant_id}`}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_hospital</span>
                View Hospital Profile
              </Link>
              <Link
                to={`/master/invoices?tenant_id=${tenant.tenant_id}`}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
                View Invoices Ledger
              </Link>
              <Link
                to="/master/health"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_up</span>
                View System Health
              </Link>
            </div>
          </div>
        </div>

      </div>

      {isChangePlanOpen && (
        <ChangePlanModal
          currentPlanName={subscription.plan_name}
          currentBillingCycle={subscription.billing_cycle}
          onClose={() => setIsChangePlanOpen(false)}
          onSelectPlan={handleChangePlan}
        />
      )}
    </>
  )
}
