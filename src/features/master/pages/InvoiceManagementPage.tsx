
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Invoice, Tenant, Subscription, SubscriptionPlan } from '@/api/types/master'

export function InvoiceManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tenantIdParam = searchParams.get('tenant_id')

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null)

  // Generate Invoice Form State
  const [tenantId, setTenantId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [billingPeriodStart, setBillingPeriodStart] = useState('')
  const [billingPeriodEnd, setBillingPeriodEnd] = useState('')
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isManualOverride, setIsManualOverride] = useState(false)

  // Record Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = useCallback(async () => {
    try {
      const [invoicesData, tenantsData, subsData, plansData] = await Promise.all([
        masterService.listInvoices(),
        masterService.listTenants(),
        masterService.listSubscriptions(),
        masterService.listPlans(),
      ])
      setInvoices(invoicesData)
      setTenants(tenantsData)
      setSubscriptions(subsData)
      setPlans(plansData)
      setLoading(false)
    } catch {
      toast.error('Failed to load billing configurations.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Synchronize payment amount with invoice balance
  useEffect(() => {
    if (selectedInvoiceForPayment) {
      const remaining = selectedInvoiceForPayment.amount - (selectedInvoiceForPayment.amount_paid || 0)
      setPaymentAmount(remaining.toString())
      setReferenceNumber('')
    } else {
      setPaymentAmount('')
      setReferenceNumber('')
    }
  }, [selectedInvoiceForPayment])

  // Auto-populate invoice parameters when selecting a tenant
  const handleTenantSelection = (selectedId: string) => {
    setTenantId(selectedId)
    setIsManualOverride(false)
    if (!selectedId) {
      setSelectedSub(null)
      setSelectedPlan(null)
      setAmount('')
      setDescription('')
      setDueDate('')
      setBillingPeriodStart('')
      setBillingPeriodEnd('')
      return
    }

    const sub = subscriptions.find((s) => s.tenant_id === selectedId) || null
    setSelectedSub(sub)

    const plan = sub ? plans.find((p) => (p.plan_name || '').toLowerCase() === (sub.plan_name || '').toLowerCase()) : null
    setSelectedPlan(plan || null)

    const baseAmount = plan ? plan.monthly_price : 299
    setAmount(baseAmount.toString())

    const planName = plan ? plan.plan_name : (sub ? sub.plan_name : 'Basic')
    const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    setDescription(`${planName} Plan Monthly Subscription - ${monthLabel}`)

    const defaultStart = new Date().toISOString().split('T')[0]
    const defaultEnd = new Date()
    defaultEnd.setDate(defaultEnd.getDate() + 30)
    setBillingPeriodStart(defaultStart)
    setBillingPeriodEnd(defaultEnd.toISOString().split('T')[0])

    const defaultDue = new Date(Date.now() + 3600000 * 24 * 14).toISOString().split('T')[0]
    setDueDate(defaultDue)
  }

  const getHospitalName = (id: string) => {
    if (!id) return ''
    const name = tenants.find((t) => t.tenant_id === id)?.hospital_name || id
    return String(name)
  }

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) {
      toast.error('Please select a hospital.')
      return
    }
    const tenant = tenants.find((t) => t.tenant_id === tenantId)
    const sub = subscriptions.find((s) => s.tenant_id === tenantId)
    const subId = sub?.id || ''
    if (!subId) {
      toast.error('The selected hospital does not have an active subscription.')
      return
    }
    const planName = selectedPlan?.plan_name || sub?.plan_name || 'Basic'
    const currency = tenant?.currency || 'USD'

    const finalAmount = Number(amount)
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }

    setGenerating(true)

    const finalDescription = description
      ? `${description} (Billing Period: ${billingPeriodStart} to ${billingPeriodEnd})`
      : `Subscription renewal (Billing Period: ${billingPeriodStart} to ${billingPeriodEnd})`

    const invoiceNumber = 'INV-' + tenantId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + '-' + Date.now().toString().slice(-6)

    try {
      await masterService.createInvoice({
        tenant_id: tenantId,
        subscription_id: subId,
        invoice_number: invoiceNumber,
        plan_name: planName,
        billing_period_start: billingPeriodStart,
        billing_period_end: billingPeriodEnd,
        currency: currency,
        amount: finalAmount,
        due_date: dueDate,
        description: finalDescription,
        status: 'unpaid',
      })
      toast.success('Invoice generated successfully!')
      setIsGenerateOpen(false)
      // Reset form
      setTenantId('')
      setAmount('')
      setDueDate('')
      setDescription('')
      setBillingPeriodStart('')
      setBillingPeriodEnd('')
      setSelectedSub(null)
      setSelectedPlan(null)
      setIsManualOverride(false)
      fetchData()
    } catch (err: any) {
      const errorDetail = err?.response?.data?.detail || err?.message || 'Failed to generate invoice.'
      toast.error(errorDetail)
    } finally {
      setGenerating(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoiceForPayment) return
    const enteredAmount = Number(paymentAmount)
    if (isNaN(enteredAmount) || enteredAmount <= 0) {
      toast.error('Please enter a valid payment amount.')
      return
    }
    const remainingBefore = selectedInvoiceForPayment.amount - (selectedInvoiceForPayment.amount_paid || 0)
    if (enteredAmount > remainingBefore) {
      toast.error('Payment amount cannot exceed the remaining balance.')
      return
    }

    setRecordingPayment(true)

    try {
      await masterService.recordPayment(selectedInvoiceForPayment.tenant_id, {
        invoice_id: selectedInvoiceForPayment.id || selectedInvoiceForPayment.invoice_id,
        amount: enteredAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
      })
      toast.success(`Payment of $${enteredAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} recorded for invoice ${selectedInvoiceForPayment.id}!`)
      setSelectedInvoiceForPayment(null)
      setReferenceNumber('')
      fetchData()
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to record payment.')
    } finally {
      setRecordingPayment(false)
    }
  }

  // Filter invoices list by search, status filter, and URL tenant ID query param
  const filteredInvoices = invoices.filter((i) => {
    const matchesTenantParam = !tenantIdParam || i.tenant_id === tenantIdParam
    const matchesStatusFilter = statusFilter === 'all' || (i.status || '').toLowerCase() === statusFilter.toLowerCase()
    
    const hospital = getHospitalName(i.tenant_id).toLowerCase()
    const id = (i.id || i.invoice_id || '').toLowerCase()
    const invNum = (i.invoice_number || '').toLowerCase()
    const status = (i.status || '').toLowerCase()
    const query = search.toLowerCase()

    const matchesSearch = hospital.includes(query) || id.includes(query) || invNum.includes(query) || status.includes(query)

    return matchesTenantParam && matchesSearch && matchesStatusFilter
  })

  const getStatusBadgeClass = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'paid':
        return 'status-badge status-active'
      case 'partially_paid':
        return 'status-badge status-suspended'
      case 'unpaid':
        return 'status-badge status-suspended'
      case 'overdue':
        return 'status-badge status-terminated'
      default:
        return 'status-badge'
    }
  }

  const clearTenantFilter = () => {
    searchParams.delete('tenant_id')
    setSearchParams(searchParams)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="Invoices"
          description="Manage tenant invoices, record payments, and monitor outstanding balances."
        />
        <button className="btn btn-primary" onClick={() => setIsGenerateOpen(true)}>
          + Generate Invoice
        </button>
      </div>

      {invoices.filter((i) => (i.status || '').toLowerCase() === 'overdue').length > 0 && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.5rem',
            backgroundColor: 'rgba(220, 53, 69, 0.08)',
            border: '1px solid rgba(220, 53, 69, 0.2)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc3545', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="material-symbols-outlined text-[18px]">warning</span>
            There are {invoices.filter((i) => (i.status || '').toLowerCase() === 'overdue').length} overdue invoices that require immediate attention.
          </span>
          <Link
            to="/master/invoices/overdue"
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
          >
            View Overdue Accounts
          </Link>
        </div>
      )}

      {tenantIdParam && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.5rem',
            backgroundColor: 'rgba(0, 82, 204, 0.08)',
            border: '1px solid var(--color-primary)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            Filtering invoices for tenant: <strong>{getHospitalName(tenantIdParam)}</strong>
          </span>
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
            onClick={clearTenantFilter}
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '400px', flex: 1 }}>
            <span className="search-input-icon material-symbols-outlined" aria-hidden="true" style={{ fontSize: '1rem' }}>search</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by hospital name, invoice ID, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: '200px' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Status"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="partially_paid">Partially Paid</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            Loading invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            No invoices found matching your query.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Hospital / Tenant</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((i) => (
                  <tr key={i.id}>
                    <td><code>#{i.id}</code></td>
                    <td>
                      <strong>{getHospitalName(i.tenant_id)}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        ID: <code>{i.tenant_id}</code>
                      </div>
                    </td>
                    <td>
                      <strong>${(Number(i.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(i.status)}>
                        {i.status === 'partially_paid' ? 'partially paid' : i.status}
                      </span>
                    </td>
                    <td>{i.due_date ? new Date(i.due_date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {i.status !== 'paid' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          onClick={() => setSelectedInvoiceForPayment(i)}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '1rem' }}>paid</span>
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isGenerateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header">
              <h2>Generate New Invoice</h2>
              <button className="modal-close" onClick={() => setIsGenerateOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleGenerateInvoice}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Select Hospital</label>
                    <select
                      className="form-control"
                      value={tenantId}
                      onChange={(e) => handleTenantSelection(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Tenant Hospital --</option>
                      {tenants.map((t) => (
                        <option key={t.tenant_id} value={t.tenant_id}>
                          {t.hospital_name} ({t.tenant_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {tenantId && selectedSub && (
                    <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.875rem' }}>
                      <div><strong>Active Subscription:</strong> {selectedSub.plan_name} ({selectedSub.status})</div>
                      <div><strong>Billing Currency:</strong> {tenants.find(t => t.tenant_id === tenantId)?.currency || 'USD'}</div>
                    </div>
                  )}

                  {tenantId && !selectedSub && (
                    <div style={{ color: '#dc3545', fontSize: '0.875rem', fontWeight: 500 }}>
                      ⚠️ No active subscription found for this tenant.
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Billing Period Start</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={billingPeriodStart}
                        onChange={(e) => setBillingPeriodStart(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Billing Period End</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={billingPeriodEnd}
                        onChange={(e) => setBillingPeriodEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="manual-override-checkbox"
                      checked={isManualOverride}
                      onChange={(e) => {
                        setIsManualOverride(e.target.checked)
                        if (!e.target.checked) {
                          const sub = subscriptions.find((s) => s.tenant_id === tenantId)
                          const plan = sub ? plans.find((p) => (p.plan_name || '').toLowerCase() === (sub.plan_name || '').toLowerCase()) : null
                          setAmount(plan ? plan.monthly_price.toString() : '299')
                        }
                      }}
                    />
                    <label htmlFor="manual-override-checkbox" style={{ margin: 0, fontWeight: 500, cursor: 'pointer' }}>
                      Manual Price Override
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Billing Amount ($ USD)</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 1500.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={!isManualOverride}
                    />
                    {isManualOverride && (
                      <div style={{ color: '#b58900', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 500 }} id="manual-override-warning">
                        ⚠️ Warning: Manual price override is active. Ensure this change is authorized.
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description / Memo</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Premium Tier Subscription renewal for June 2026"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsGenerateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvoiceForPayment && (() => {
        const remaining = selectedInvoiceForPayment.amount - (selectedInvoiceForPayment.amount_paid || 0)
        const entered = Number(paymentAmount) || 0
        const balanceAfter = Math.max(0, remaining - entered)
        const isFull = balanceAfter <= 0

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '450px', width: '100%' }}>
              <div className="modal-header">
                <h2>Record Invoice Payment</h2>
                <button className="modal-close" onClick={() => setSelectedInvoiceForPayment(null)} type="button">
                  &times;
                </button>
              </div>
              <form onSubmit={handleRecordPayment}>
                <div className="modal-body">
                  <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hospital</div>
                    <strong style={{ fontSize: '1rem' }}>{getHospitalName(selectedInvoiceForPayment.tenant_id)}</strong>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Invoice ID</div>
                        <strong>#{selectedInvoiceForPayment.id}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Amount</div>
                        <strong>${(Number(selectedInvoiceForPayment.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Previously Paid</div>
                        <strong>${(Number(selectedInvoiceForPayment.amount_paid) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Remaining Balance</div>
                        <strong style={{ color: remaining > 0 ? '#b58900' : '#28a745' }}>
                          ${(Number(remaining) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Payment Amount ($ USD)</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min="0.01"
                      max={remaining}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Remaining after payment:</span>
                      {isFull ? (
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(40, 167, 69, 0.1)',
                          color: '#28a745',
                          borderRadius: '4px',
                          border: '1px solid rgba(40, 167, 69, 0.2)'
                        }}>
                          Paid in Full
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(255, 193, 7, 0.15)',
                          color: '#b58900',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 193, 7, 0.3)'
                        }}>
                          Partial Payment: ${(Number(balanceAfter) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} remaining
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Payment Channel / Method</label>
                    <select
                      className="form-control"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Bank Transfer">Bank Wire Transfer</option>
                      <option value="Credit Card">Credit/Debit Card Online</option>
                      <option value="Cheque">Corporate Cheque</option>
                      <option value="Mobile Money">Mobile Money (M-Pesa, etc.)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Reference / Transaction Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. TXN-1002345"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedInvoiceForPayment(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={recordingPayment}
                  >
                    {recordingPayment ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}
    </>
  )
}
