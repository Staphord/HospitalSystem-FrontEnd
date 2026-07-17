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
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

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

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterAction])

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
    const actorName = (l.actor_name || '').toLowerCase()
    const action = l.action.toLowerCase()
    const details = l.details.toLowerCase()
    const ip = l.ip_address.toLowerCase()
    const query = search.toLowerCase()

    const matchesSearch =
      actor.includes(query) ||
      actorName.includes(query) ||
      action.includes(query) ||
      details.includes(query) ||
      ip.includes(query)

    const matchesFilter = filterAction === '' || l.action === filterAction

    return matchesSearch && matchesFilter
  })

  // Pagination calculations
  const totalItems = filteredLogs.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

  const getPageNumbers = () => {
    const pageNumbers: number[] = []
    const range = 2
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
        pageNumbers.push(i)
      } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
        pageNumbers.push(-1)
      }
    }
    return pageNumbers
  }

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
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, maxWidth: '650px' }}>
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

          <select
            className="form-control"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            Loading audit transactions...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            No audit logs match the current search or filters.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor ID</th>
                    <th>Actor Name</th>
                    <th>Action / Event</th>
                    <th>Log Details</th>
                    <th>Origin IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{log.actor}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)' }}>{log.actor_name || 'N/A'}</span>
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

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Showing <strong>{totalItems > 0 ? startIndex + 1 : 0}</strong> to <strong>{endIndex}</strong> of{' '}
                <strong>{totalItems}</strong> entries
              </span>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                </button>
                
                {getPageNumbers().map((page, idx) => {
                  if (page === -1) {
                    return <span key={`ellipsis-${idx}`} style={{ padding: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>...</span>
                  }
                  return (
                    <button
                      key={page}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                })}
                
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.5rem', minWidth: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
