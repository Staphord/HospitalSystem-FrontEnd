import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { monitoringService } from '@/api/services/monitoring'
import type { AuditLog } from '@/api/services/monitoring'

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const data = await monitoringService.getAuditLogs()
      setLogs(data)
    } catch (err) {
      toast.error('Failed to load global audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Export utility
  const handleExportJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `audit_logs_${Date.now()}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      toast.success('Audit logs exported successfully as JSON file.')
    } catch (err) {
      toast.error('Failed to export logs.')
    }
  }

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)))

  const filteredLogs = logs.filter((l) => {
    const actor = l.actor.toLowerCase()
    const action = l.action.toLowerCase()
    const details = l.details.toLowerCase()
    const ip = l.ip_address.toLowerCase()
    const query = search.toLowerCase()

    const matchesSearch =
      actor.includes(query) ||
      action.includes(query) ||
      details.includes(query) ||
      ip.includes(query)

    const matchesFilter = filterAction === '' || l.action === filterAction

    return matchesSearch && matchesFilter
  })

  const getActionBadgeClass = (action: string) => {
    if (action.includes('RESOLVE') || action.includes('PAYMENT')) {
      return 'badge' // green-ish, default
    } else if (action.includes('CREATE') || action.includes('GENERATE') || action.includes('UPDATE')) {
      return 'badge' // amber/blue
    }
    return 'badge'
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="Security & Audit Logs"
          description="Read-only immutable transaction logs tracking tenant provisioning, billing modifications, and admin actions."
        />
        <button className="btn btn-secondary" onClick={handleExportJSON}>
          <span className="material-symbols-outlined" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.35rem' }}>download</span>
          Export Log Data (JSON)
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '350px', flex: 1 }}>
            <span className="search-input-icon material-symbols-outlined" aria-hidden="true" style={{ fontSize: '1rem' }}>search</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by details, actor, IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ maxWidth: '250px', width: 'auto' }}
          >
            <option value="">-- All Actions / Events --</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          {(search !== '' || filterAction !== '') && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearch('')
                setFilterAction('')
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            Loading audit transactions...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            No audit logs match the current search or filters.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action / Event</th>
                  <th>Log Details</th>
                  <th>Origin IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{log.actor}</span>
                    </td>
                    <td>
                      <span className={getActionBadgeClass(log.action)}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.details}</td>
                    <td>
                      <code>{log.ip_address}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
