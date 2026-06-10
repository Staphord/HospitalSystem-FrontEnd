import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { monitoringService } from '@/api/services/monitoring'
import type { SystemHealthData } from '@/api/services/monitoring'

export function SystemHealthPage() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPublishOpen, setIsPublishOpen] = useState(false)

  // Incident Publish Form State
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<'warning' | 'critical'>('warning')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchHealth = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const data = await monitoringService.getSystemHealth()
      setHealthData(data)
    } catch (err) {
      toast.error('Failed to query system health telemetry.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Poll for real-time telemetry updates every 3 seconds
  useEffect(() => {
    fetchHealth(true)
    const interval = setInterval(() => {
      fetchHealth(false)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handlePublishIncident = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await monitoringService.createIncident({
        title,
        severity,
        message,
      })
      toast.success('Incident published successfully!')
      setIsPublishOpen(false)
      // Reset form
      setTitle('')
      setSeverity('warning')
      setMessage('')
      fetchHealth(false)
    } catch (err) {
      toast.error('Failed to publish system incident.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolveIncident = async (incId: string) => {
    try {
      await monitoringService.updateIncident(incId, { status: 'resolved' })
      toast.success('Incident resolved and closed.')
      fetchHealth(false)
    } catch (err) {
      toast.error('Failed to resolve incident.')
    }
  }

  const activeIncidents = healthData?.incidents.filter((i) => i.status === 'active') || []

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="System Health & Monitoring"
          description="Real-time telemetry feeds, server vitals, and live system incident tracking."
        />
        <button className="btn btn-primary" onClick={() => setIsPublishOpen(true)}>
          🚨 Report Incident / Maintenance
        </button>
      </div>

      {loading && !healthData ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
          Loading platform metrics telemetry...
        </div>
      ) : (
        healthData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Vitals Telemetry Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>System Uptime</div>
                <strong style={{ fontSize: '1.75rem', color: '#28a745' }}>{healthData.telemetry.uptime}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Core Cluster Online</div>
              </div>

              <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Active Sockets / Users</div>
                <strong style={{ fontSize: '1.75rem', color: 'var(--primary-color)' }}>{healthData.telemetry.active_users}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Live connections</div>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>CPU Usage</span>
                  <strong>{healthData.telemetry.cpu_usage}%</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${healthData.telemetry.cpu_usage}%`,
                    height: '100%',
                    backgroundColor: healthData.telemetry.cpu_usage > 80 ? '#dc3545' : '#0052cc',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Load Average balanced</div>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>RAM Utilization</span>
                  <strong>{healthData.telemetry.ram_usage}%</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${healthData.telemetry.ram_usage}%`,
                    height: '100%',
                    backgroundColor: '#17a2b8',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>9.28 GB / 16.00 GB</div>
              </div>

              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <span>Disk Storage</span>
                  <strong>{healthData.telemetry.disk_usage}%</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${healthData.telemetry.disk_usage}%`,
                    height: '100%',
                    backgroundColor: '#ffc107',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Primary mount point space</div>
              </div>
            </div>

            {/* Incidents Section */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Active Incidents & Alerts</span>
                <span
                  className="badge"
                  style={{
                    backgroundColor: activeIncidents.length > 0 ? '#dc3545' : '#28a745',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                  }}
                >
                  {activeIncidents.length} Active
                </span>
              </h2>

              {activeIncidents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', border: '1px dashed #ddd', borderRadius: '8px' }}>
                  <span style={{ fontSize: '2rem' }}>💚</span>
                  <h3 style={{ marginTop: '0.5rem', color: '#28a745' }}>All Systems Operational</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    No service interruptions or performance degradation incidents active.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '8px',
                        borderLeft: `5px solid ${inc.severity === 'critical' ? '#dc3545' : '#ffc107'}`,
                        backgroundColor: inc.severity === 'critical' ? '#fff5f5' : '#fffdf3',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <strong style={{ fontSize: '1.125rem' }}>{inc.title}</strong>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: inc.severity === 'critical' ? '#dc3545' : '#ffc107',
                              color: inc.severity === 'critical' ? '#fff' : '#000',
                              fontSize: '0.6875rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            {inc.severity}
                          </span>
                        </div>
                        <p style={{ margin: '0.5rem 0 0.25rem', fontSize: '0.875rem', color: '#444' }}>
                          {inc.message}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Reported: {new Date(inc.created_at).toLocaleString()}
                        </span>
                      </div>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleResolveIncident(inc.id)}
                      >
                        Resolve Alert
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}

      {isPublishOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header">
              <h2>Publish Incident / Maintenance Alert</h2>
              <button className="modal-close" onClick={() => setIsPublishOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handlePublishIncident}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Incident Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Keycloak IAM Server latency spike"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Severity Tier</label>
                    <select
                      className="form-control"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                    >
                      <option value="warning">Warning (Minor Degradation)</option>
                      <option value="critical">Critical (Service Interruption)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Details / Diagnostics Message</label>
                    <textarea
                      className="form-control"
                      required
                      rows={3}
                      placeholder="Describe the incident, impacted modules, and ETA for a hotfix..."
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
                  onClick={() => setIsPublishOpen(false)}
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
