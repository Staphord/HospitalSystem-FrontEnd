import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Invoice, Tenant } from '@/api/types/master'

export function InvoiceManagementPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
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

  const fetchData = async () => {
    try {
      setLoading(true)
      const [invoicesData, tenantsData] = await Promise.all([
        masterService.listInvoices(),
        masterService.listTenants(),
      ])
      setInvoices(invoicesData)
      setTenants(tenantsData)
    } catch (err) {
      toast.error('Failed to load invoices and tenants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getHospitalName = (tenantId: string) => {
    return tenants.find((t) => t.tenant_id === tenantId)?.hospital_name || tenantId
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
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to generate invoice.')
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
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to record payment.')
    } finally {
      setRecordingPayment(false)
    }
  }

  const filteredInvoices = invoices.filter((i) => {
    const hospital = getHospitalName(i.tenant_id).toLowerCase()
    const id = i.id.toLowerCase()
    const status = i.status.toLowerCase()
    const query = search.toLowerCase()

    return hospital.includes(query) || id.includes(query) || status.includes(query)
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
                      onChange={(e) => setTenantId(e.target.value)}
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
