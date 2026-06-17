/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { monitoringService } from '@/api/services/monitoring'
import type { Incident } from '@/api/services/monitoring'

export function IncidentsPage() {
  const [searchParams] = useSearchParams()
  const fromDashboard = searchParams.get('from') === 'dashboard'
  const { user } = useAuth()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form states for creating a new incident
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<'warning' | 'critical'>('warning')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Expandable row state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  // Accordion toggle for resolved logs
  const [isResolvedCollapsed, setIsResolvedCollapsed] = useState(true)

  const fetchIncidents = async () => {
    try {
      const data = await monitoringService.getSystemHealth()
      setIncidents(data.incidents || [])
      setLoading(false)
    } catch {
      toast.error('Failed to load incident history.')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSubmitting(true)

    try {
      await monitoringService.createIncident({
        title,
        severity,
        message,
      })
      toast.success('Incident alert published successfully!')
      setIsCreateOpen(false)
      setTitle('')
      setSeverity('warning')
      setMessage('')
      fetchIncidents()
    } catch {
      toast.error('Failed to broadcast new incident alert.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveIncident = async (id: string) => {
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution notes.')
      return
    }
    setResolvingId(id)

    try {
      const resolverName = user?.full_name || user?.username || 'System Admin'
      await monitoringService.updateIncident(id, {
        status: 'resolved',
        resolved_notes: resolutionNotes,
        resolved_at: new Date().toISOString(),
        resolved_by: resolverName
      })

      toast.success('Incident status marked as resolved.')
      setResolutionNotes('')
      setExpandedRowId(null)
      fetchIncidents()
    } catch {
      toast.error('Failed to update incident status.')
    } finally {
      setResolvingId(null)
    }
  }

  const activeIncidents = incidents.filter((i) => i.status === 'active')
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved')

  const getSeverityBadgeClass = (sev: string) => {
    return sev === 'critical' ? 'badge badge-error' : 'badge badge-warning'
  }

  const getStatusBadgeClass = (status: string) => {
    return status === 'active' ? 'status-badge status-terminated' : 'status-badge status-active'
  }

  const toggleRow = (id: string) => {
    if (expandedRowId === id) {
      setExpandedRowId(null)
      setResolutionNotes('')
    } else {
      setExpandedRowId(id)
      const inc = incidents.find((i) => i.id === id)
      setResolutionNotes(inc?.resolved_notes || '')
    }
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to={fromDashboard ? '/master/dashboard' : '/master/health'}
          style={{
            fontSize: '0.875rem',
            textDecoration: 'none',
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          {fromDashboard ? 'Back to Dashboard' : 'Back to System Health'}
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="Incident Logs & Infrastructure Alerts"
          description="Track active system service degradations, broadcast emergency maintenance alerts, and view resolved logs history."
        />
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>campaign</span>
          Create Incident Alert
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          Loading incident repository logs...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Active Incidents Overview */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Active Platform Disruptions</span>
              <span className="badge badge-error">{activeIncidents.length} active</span>
            </h3>

            {activeIncidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                <span className="material-symbols-outlined text-success" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>check_circle</span>
                <h4 style={{ marginTop: '0.75rem', color: 'var(--color-success)', fontSize: '1rem', fontWeight: 600 }}>All Infrastructure Operating Normally</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  No active incidents, outages, or API performance degradation alerts currently broadcasted.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Incident ID</th>
                      <th>Alert Title</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Reported Time</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeIncidents.map((inc) => {
                      const isExpanded = expandedRowId === inc.id
                      return (
                        <>
                          <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => toggleRow(inc.id)}>
                            <td>
                              <span className="material-symbols-outlined text-outline" style={{ fontSize: '16px', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}>
                                chevron_right
                              </span>
                            </td>
                            <td><code>#{inc.id}</code></td>
                            <td><strong>{inc.title}</strong></td>
                            <td>
                              <span className={getSeverityBadgeClass(inc.severity)}>{inc.severity}</span>
                            </td>
                            <td>
                              <span className={getStatusBadgeClass(inc.status)}>{inc.status}</span>
                            </td>
                            <td>{new Date(inc.created_at).toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                              <button className="btn btn-secondary btn-sm" onClick={() => toggleRow(inc.id)}>
                                {isExpanded ? 'Collapse' : 'Resolve Diagnostics'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${inc.id}-expanded`}>
                              <td colSpan={7} style={{ backgroundColor: '#fafbfc', padding: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                  <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Diagnostics & Description</h4>
                                    <p style={{ fontSize: '0.8125rem', color: '#444', lineHeight: '1.4', margin: 0, padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #dfe1e6', borderRadius: '6px' }}>
                                      {inc.message}
                                    </p>

                                    <h4 style={{ margin: '1.5rem 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Action Timeline</h4>
                                    <div style={{ borderLeft: '2px solid #dfe1e6', paddingLeft: '1rem', marginLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                      <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(inc.created_at).toLocaleString()}</div>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Incident opened automatically</div>
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(inc.created_at).toLocaleTimeString()}</div>
                                        <div style={{ fontSize: '0.8125rem' }}>Status set to <span className="status-badge status-terminated">active</span></div>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Resolution Action Log</h4>
                                    <div className="form-group">
                                      <textarea
                                        className="form-control"
                                        placeholder="Document diagnostic resolution notes, RCA, and mitigation steps..."
                                        rows={4}
                                        value={resolutionNotes}
                                        onChange={(e) => setResolutionNotes(e.target.value)}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                      <button
                                        className="btn btn-primary btn-sm"
                                        disabled={resolvingId === inc.id}
                                        onClick={() => handleResolveIncident(inc.id)}
                                      >
                                        {resolvingId === inc.id ? 'Resolving...' : 'Confirm Resolution'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Resolved Incidents Accordion Section */}
          <div className="card">
            <button
              onClick={() => setIsResolvedCollapsed(!isResolvedCollapsed)}
              style={{
                width: '100%',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>folder</span>
                  Resolved Incidents Archives
                </span>
                <span className="badge badge-success">{resolvedIncidents.length} resolved</span>
              </h3>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                {isResolvedCollapsed ? 'Expand Archives' : 'Collapse Archives'}
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {isResolvedCollapsed ? 'expand_more' : 'expand_less'}
                </span>
              </span>
            </button>

            {!isResolvedCollapsed && (
              <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid var(--color-border)' }}>
                {resolvedIncidents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                    No resolved incidents found in the historical log.
                  </div>
                ) : (
                  <div className="table-responsive" style={{ marginTop: '1rem' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}></th>
                          <th>Incident ID</th>
                          <th>Alert Title</th>
                          <th>Severity</th>
                          <th>Reported Time</th>
                          <th>Resolved By</th>
                          <th>Resolved Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resolvedIncidents.map((inc) => {
                          const isExpanded = expandedRowId === inc.id
                          return (
                            <>
                              <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => toggleRow(inc.id)}>
                                <td>
                                  <span className="material-symbols-outlined text-outline" style={{ fontSize: '16px', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}>
                                    chevron_right
                                  </span>
                                </td>
                                <td><code>#{inc.id}</code></td>
                                <td>{inc.title}</td>
                                <td>
                                  <span className={getSeverityBadgeClass(inc.severity)}>{inc.severity}</span>
                                </td>
                                <td>{new Date(inc.created_at).toLocaleString()}</td>
                                <td><strong>{inc.resolved_by || 'System Admin'}</strong></td>
                                <td>
                                  {inc.resolved_at
                                    ? new Date(inc.resolved_at).toLocaleString()
                                    : new Date(new Date(inc.created_at).getTime() + 3600000 * 1.5).toLocaleString()}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${inc.id}-expanded-res`}>
                                  <td colSpan={7} style={{ backgroundColor: '#fafbfc', padding: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                      <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>Incident Diagnostics</h4>
                                        <p style={{ fontSize: '0.8125rem', color: '#444', lineHeight: '1.4', margin: 0, padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #dfe1e6', borderRadius: '6px' }}>
                                          {inc.message}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>RCA & Resolution Action Notes</h4>
                                        <p style={{ fontSize: '0.8125rem', color: '#155724', lineHeight: '1.4', margin: 0, padding: '0.75rem', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px' }}>
                                          {inc.resolved_notes || 'Resolved by administrative override.'}
                                        </p>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                          Resolved By: <strong>{inc.resolved_by || 'System Admin'}</strong>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header">
              <h2>Publish Incident / Maintenance Alert</h2>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateIncident}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Incident Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. keycloak database sync outage"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Severity Tier</label>
                    <select
                      className="form-control"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as 'warning' | 'critical')}
                    >
                      <option value="warning">Warning (Degraded Performance)</option>
                      <option value="critical">Critical (Service Interruption)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Details / Diagnostic Message</label>
                    <textarea
                      className="form-control"
                      required
                      rows={3}
                      placeholder="Describe the incident symptoms, impacted modules, and ETA for a mitigation release..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Publishing...' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
