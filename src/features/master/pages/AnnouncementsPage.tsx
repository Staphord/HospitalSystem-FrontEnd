import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { monitoringService } from '@/api/services/monitoring'
import type { Announcement } from '@/api/services/monitoring'

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'info' | 'alert' | 'maintenance'>('info')
  const [scope, setScope] = useState<'all' | 'tenants_only' | 'staff_only'>('all')
  const [displayFormat, setDisplayFormat] = useState<'banner' | 'modal' | 'toast'>('banner')
  const [submitting, setSubmitting] = useState(false)

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const data = await monitoringService.listAnnouncements()
      setAnnouncements(data)
    } catch (err) {
      toast.error('Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await monitoringService.createAnnouncement({
        title,
        message,
        type,
        scope,
        display_format: displayFormat,
      })
      toast.success('Announcement broadcasted successfully!')
      setIsCreateOpen(false)
      // Reset form
      setTitle('')
      setMessage('')
      setType('info')
      setScope('all')
      setDisplayFormat('banner')
      fetchAnnouncements()
    } catch (err) {
      toast.error('Failed to create announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (ann: Announcement) => {
    try {
      await monitoringService.updateAnnouncement(ann.id, { active: !ann.active })
      toast.success(`Announcement ${ann.active ? 'deactivated' : 'activated'} successfully.`)
      fetchAnnouncements()
    } catch (err) {
      toast.error('Failed to update announcement state.')
    }
  }

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'all':
        return 'All Users'
      case 'tenants_only':
        return 'Tenant Admins Only'
      case 'staff_only':
        return 'Hospital Staff Only'
      default:
        return scope
    }
  }

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'alert':
        return 'status-badge status-terminated'
      case 'maintenance':
        return 'status-badge status-suspended'
      case 'info':
      default:
        return 'status-badge status-active'
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="Announcements & Broadcasts"
          description="Create system-wide notices, maintenance banners, and popups for target tenant scopes."
        />
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          📢 New Broadcast Notice
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            Loading broadcast log...
          </div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            No system announcements broadcasted yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Title & Message</th>
                  <th>Type</th>
                  <th>Target Scope</th>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann) => (
                  <tr key={ann.id}>
                    <td style={{ maxWidth: '300px' }}>
                      <strong>{ann.title}</strong>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ann.message}
                      </p>
                    </td>
                    <td>
                      <span className={getTypeBadgeClass(ann.type)}>
                        {ann.type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#e9ecef', color: '#495057' }}>
                        {getScopeBadge(ann.scope)}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ textTransform: 'capitalize' }}>
                        {ann.display_format}
                      </span>
                    </td>
                    <td>
                      <span className={ann.active ? 'status-badge status-active' : 'status-badge status-terminated'}>
                        {ann.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(ann.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleActive(ann)}
                      >
                        {ann.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', width: '100%' }}>
            <div className="modal-header">
              <h2>New System Broadcast</h2>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Announcement Title</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Scheduled Maintenance - June 15th"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Broadcast Message / Content</label>
                    <textarea
                      className="form-control"
                      required
                      rows={3}
                      placeholder="Enter the notification message detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Severity/Type</label>
                      <select
                        className="form-control"
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                      >
                        <option value="info">Info (Blue/General)</option>
                        <option value="alert">Alert (Red/Important)</option>
                        <option value="maintenance">Maintenance (Amber)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Audience / Scope</label>
                      <select
                        className="form-control"
                        value={scope}
                        onChange={(e) => setScope(e.target.value as any)}
                      >
                        <option value="all">All Registered Users</option>
                        <option value="tenants_only">Tenant Space Admins Only</option>
                        <option value="staff_only">Clinical Staff / Roles Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Display UI Format</label>
                    <select
                      className="form-control"
                      value={displayFormat}
                      onChange={(e) => setDisplayFormat(e.target.value as any)}
                    >
                      <option value="banner">Global Header Banner Warning</option>
                      <option value="modal">On-Login Modal Pop-up</option>
                      <option value="toast">Ephemeral Toast Notification</option>
                    </select>
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
                  {submitting ? 'Broadcasting...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
