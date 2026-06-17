import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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

  // Record Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [recordingPayment, setRecordingPayment] = useState(false)

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  // Auto-populate invoice parameters when selecting a tenant
  const handleTenantSelection = (selectedId: string) => {
    setTenantId(selectedId)
    if (!selectedId) {
      setAmount('')
      setDescription('')
      setDueDate('')
      return
    }

    const sub = subscriptions.find((s) => s.tenant_id === selectedId)
    const plan = sub ? plans.find((p) => p.plan_name.toLowerCase() === sub.plan_name.toLowerCase()) : null

    if (plan) {
      setAmount(plan.monthly_price.toString())
      const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      setDescription(`${plan.plan_name} Plan Monthly Subscription - ${monthLabel}`)
    } else {
      setAmount('299') // default fallback
      setDescription('Monthly Plan Subscription Renewal')
    }

    const defaultDue = new Date(Date.now() + 3600000 * 24 * 14).toISOString().split('T')[0]
    setDueDate(defaultDue)
  }

  const getHospitalName = (id: string) => {
    return tenants.find((t) => t.tenant_id === id)?.hospital_name || id
  }

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenantId) {
      toast.error('Please select a hospital.')
      return
    }
    setGenerating(true)

    try {
      await masterService.createInvoice({
        tenant_id: tenantId,
        amount: Number(amount),
        due_date: dueDate || undefined,
        description: description || undefined,
        status: 'unpaid',
      })
      toast.success('Invoice generated successfully!')
      setIsGenerateOpen(false)
      // Reset form
      setTenantId('')
      setAmount('')
      setDueDate('')
      setDescription('')
      fetchData()
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to generate invoice.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoiceForPayment) return
    setRecordingPayment(true)

    try {
      await masterService.updateInvoice(selectedInvoiceForPayment.id, {
        status: 'paid',
        payment_method: paymentMethod,
      })
      toast.success(`Payment recorded for invoice ${selectedInvoiceForPayment.id}!`)
      setSelectedInvoiceForPayment(null)
      fetchData()
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to record payment.')
    } finally {
      setRecordingPayment(false)
    }
  }

  // Filter invoices list by search and URL tenant ID query param
  const filteredInvoices = invoices.filter((i) => {
    const matchesTenantParam = !tenantIdParam || i.tenant_id === tenantIdParam
    
    const hospital = getHospitalName(i.tenant_id).toLowerCase()
    const id = i.id.toLowerCase()
    const status = i.status.toLowerCase()
    const query = search.toLowerCase()

    const matchesSearch = hospital.includes(query) || id.includes(query) || status.includes(query)

    return matchesTenantParam && matchesSearch
  })

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'status-badge status-active'
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
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            📍 Filtering invoices for tenant: <strong>{getHospitalName(tenantIdParam)}</strong>
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
            <span className="search-input-icon">🔍</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by hospital name, invoice ID, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                      <strong>${i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(i.status)}>{i.status}</span>
                    </td>
                    <td>{i.due_date ? new Date(i.due_date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>
                      {i.status !== 'paid' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => setSelectedInvoiceForPayment(i)}
                        >
                          💵 Record Payment
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

                  <div className="form-group">
                    <label>Billing Amount ($ USD)</label>
                    <input
                      type="number"
                      className="form-control"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 1500.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
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

      {selectedInvoiceForPayment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', width: '100%' }}>
            <div className="modal-header">
              <h2>Record Invoice Payment</h2>
              <button className="modal-close" onClick={() => setSelectedInvoiceForPayment(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Hospital</div>
                  <strong style={{ fontSize: '1rem' }}>{getHospitalName(selectedInvoiceForPayment.tenant_id)}</strong>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Invoice ID</div>
                      <strong>#{selectedInvoiceForPayment.id}</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount Due</div>
                      <strong style={{ color: 'var(--primary-color)' }}>
                        ${selectedInvoiceForPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
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
                  {recordingPayment ? 'Recording...' : 'Confirm Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
