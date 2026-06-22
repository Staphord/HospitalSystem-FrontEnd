/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Invoice, Tenant } from '@/api/types/master'

export function OverdueAccountsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [invoicesData, tenantsData] = await Promise.all([
        masterService.listInvoices(),
        masterService.listTenants()
      ])
      setInvoices(invoicesData)
      setTenants(tenantsData)
      setLoading(false)
    } catch {
      toast.error('Failed to load delinquency records.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getHospitalName = (tenantId: string) => {
    return tenants.find((t) => t.tenant_id === tenantId)?.hospital_name || tenantId
  }

  const getHospitalGraceDays = (tenantId: string) => {
    return tenants.find((t) => t.tenant_id === tenantId)?.grace_days || 14
  }

  const [now] = useState(() => Date.now())

  // Calculate days overdue
  const getDaysOverdue = useCallback((dueDate: string) => {
    const dueTime = new Date(dueDate).getTime()
    const diffTime = now - dueTime
    return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
  }, [now])

  // Filter invoices strictly by backend confirmed overdue status
  const overdueInvoices = invoices.filter((i) => i.status.toLowerCase() === 'overdue')

  // Get 4-tier status attributes
  const getTierInfo = (days: number) => {
    if (days <= 7) {
      return {
        tier: 'Tier 1 (Grace Period)',
        daysRange: '1-7 days',
        style: {
          backgroundColor: '#fffdf3',
          borderLeft: '5px solid #ffab00',
        },
        badgeColor: '#ffab00',
        textColor: '#b78103',
        action: 'Automated email warning notification broadcasted daily.'
      }
    } else if (days <= 14) {
      return {
        tier: 'Tier 2 (Late Notice)',
        daysRange: '8-14 days',
        style: {
          backgroundColor: '#fffcf5',
          borderLeft: '5px solid #ff9f1a',
        },
        badgeColor: '#ff9f1a',
        textColor: '#d97706',
        action: 'Second warning notice sent. Tenant admin dashboard warning active.'
      }
    } else if (days <= 30) {
      return {
        tier: 'Tier 3 (Impending Suspension)',
        daysRange: '15-30 days',
        style: {
          backgroundColor: '#fff5f5',
          borderLeft: '5px solid #ff5630',
        },
        badgeColor: '#ff5630',
        textColor: '#bf2600',
        action: 'Grace period expired. Manual outreach initiated by platform admins.'
      }
    } else {
      return {
        tier: 'Tier 4 (Critical Delinquency)',
        daysRange: '>30 days',
        style: {
          backgroundColor: '#ffebe6',
          borderLeft: '5px solid #bf2600',
        },
        badgeColor: '#bf2600',
        textColor: '#93000a',
        action: 'Critical lockout. Automated terminal access suspension active.'
      }
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="Overdue Accounts & Delinquency Matrix"
          description="Monitor delinquent tenant billing records, track overdue age, and review automated escalations."
        />
        <Link to="/master/invoices" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>credit_card</span>
          Manage All Invoices
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          Loading delinquency matrix records...
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Delinquency Matrix Table */}
          <div className="card col-8" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Delinquency Matrix Ledger</span>
              <span className="badge badge-error">{overdueInvoices.length} Outstanding</span>
            </h3>

            {overdueInvoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1.5rem', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem', color: '#ffab00' }}>auto_awesome</span>
                <h4 style={{ marginTop: '0.75rem', color: 'var(--color-success)', fontSize: '1rem', fontWeight: 600 }}>Zero Delinquent Accounts</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  No outstanding hospital invoices exceed their payment due date terms.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                  <thead>
                    <tr>
                      <th>Hospital</th>
                      <th>Invoice ID</th>
                      <th>Due Date</th>
                      <th>Overdue Age</th>
                      <th>Delinquency Tier</th>
                      <th style={{ textAlign: 'right' }}>Balance Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueInvoices.map((inv) => {
                      const days = inv.due_date ? getDaysOverdue(inv.due_date) : 1
                      const info = getTierInfo(days)
                      const graceDays = getHospitalGraceDays(inv.tenant_id)
                      const remainingBalance = inv.amount - (inv.amount_paid || 0)

                      return (
                        <tr
                          key={inv.id}
                          style={{
                            ...info.style,
                            borderRadius: '8px',
                          }}
                        >
                          <td style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', padding: '1rem' }}>
                            <strong>{getHospitalName(inv.tenant_id)}</strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              Grace Period: {graceDays} Days
                            </div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <code>#{inv.id}</code>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <strong style={{ color: info.textColor }}>{days} days overdue</strong>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: `rgba(${info.badgeColor === '#ffab00' ? '255, 171, 0' : info.badgeColor === '#ff9f1a' ? '255, 159, 26' : info.badgeColor === '#ff5630' ? '255, 86, 48' : '191, 38, 0'}, 0.1)`,
                                color: info.textColor,
                                fontSize: '0.6875rem'
                              }}
                            >
                              {info.daysRange}
                            </span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              {info.tier}
                            </div>
                          </td>
                          <td style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px', textAlign: 'right', padding: '1rem' }}>
                            <strong style={{ color: info.textColor }}>
                              ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              Total: ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Escalation Policy Sidebar Panel */}
          <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Escalation Procedures Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 600 }}>Delinquency Escalation Policy</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 171, 0, 0.1)',
                    color: '#b78103',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>1</span>
                  <div>
                    <strong style={{ fontSize: '0.8125rem', display: 'block' }}>Tier 1 (1 - 7 Days)</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Grace period alert. Daily reminders sent automatically. All application modules remain fully active.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 159, 26, 0.1)',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>2</span>
                  <div>
                    <strong style={{ fontSize: '0.8125rem', display: 'block' }}>Tier 2 (8 - 14 Days)</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Late notice warning banner displayed on hospital administrator dashboard login sessions.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 86, 48, 0.1)',
                    color: '#bf2600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>3</span>
                  <div>
                    <strong style={{ fontSize: '0.8125rem', display: 'block' }}>Tier 3 (15 - 30 Days)</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Impending suspension protocol. Support team initiates direct contact. Account marked for manual freeze.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(191, 38, 0, 0.1)',
                    color: '#93000a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>4</span>
                  <div>
                    <strong style={{ fontSize: '0.8125rem', display: 'block' }}>Tier 4 (&gt;30 Days)</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Critical billing lockout. All physician, nurse, and registrar terminal portals suspended. Only invoice page accessible.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action History Info Box */}
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fafbfc' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Active Auto-Escalations</h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Email reminders dispatched to delinquent billing contacts.</li>
                <li>Banner warnings appended to active tenant dashboard headers.</li>
                <li>Suspension triggers compiled for Tier 3 and Tier 4 nodes.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
