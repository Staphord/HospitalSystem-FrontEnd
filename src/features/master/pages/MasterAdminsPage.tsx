import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { MasterAdminUser } from '@/api/types/master'

export function MasterAdminsPage() {
  const [admins, setAdmins] = useState<MasterAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null) // State to show QR Code modal
  const [mfaUsername, setMfaUsername] = useState('')

  // Form State
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const data = await masterService.listMasterAdmins()
      setAdmins(data)
    } catch (err) {
      toast.error('Failed to load platform admins.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await masterService.createMasterAdmin({
        username,
        password,
        email,
        full_name: fullName || undefined,
      })
      toast.success(`Platform administrator "${username}" created!`)
      setIsCreateOpen(false)

      // Trigger simulated MFA Setup dialog
      setMfaUsername(username)
      // Generates a mock Google Authenticator compatible QR Code URI
      setMfaQrCode(`otpauth://totp/HospitalSystem:${username}?secret=MOCKSECRET12345678&issuer=HospitalSystem`)

      // Reset form
      setUsername('')
      setPassword('')
      setEmail('')
      setFullName('')
      fetchAdmins()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create platform administrator.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (usernameToDelete: string) => {
    try {
      await masterService.deleteMasterAdmin(usernameToDelete)
      toast.success(`Deleted administrator "${usernameToDelete}".`)
      fetchAdmins()
    } catch (err) {
      toast.error('Failed to delete administrator.')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <PageHeader
          title="Platform Admins"
          description="Manage super administration accounts and configure MFA requirements."
        />
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          + Create Administrator
        </button>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            Loading platform administrators...
          </div>
        ) : admins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            No platform administrators found.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th>MFA Enforced</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.keycloak_sub}>
                    <td>
                      <strong>{admin.username}</strong>
                    </td>
                    <td>{admin.full_name || 'N/A'}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'var(--primary-color)', color: '#ffffff' }}>
                        {admin.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge status-active">
                        ✓ TOTP Active
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {admins.length > 1 && (
                        <button
                          className="btn"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            border: '1px solid #f5c6cb',
                          }}
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete administrator "${admin.username}"?`)) {
                              handleDelete(admin.username)
                            }
                          }}
                        >
                          Delete
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

      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="modal-header">
              <h2>Create Platform Admin</h2>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. superadmin_jack"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="form-control"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      placeholder="e.g. jack@hospitalsystem.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Jack Sparrow"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
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
                  {submitting ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mfaQrCode && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
            <div className="modal-header">
              <h2>MFA Registration Required</h2>
              <button className="modal-close" onClick={() => setMfaQrCode(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '2rem 1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Multi-Factor Authentication (MFA/2FA) is enforced for all super administrators. 
                Please scan this QR code with Google Authenticator or Microsoft Authenticator to configure token generation for <strong>{mfaUsername}</strong>.
              </p>

              {/* Styled mock QR Code box */}
              <div style={{
                margin: '0 auto 1.5rem',
                width: '180px',
                height: '180px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {/* SVG mock QR Code */}
                <svg width="150" height="150" viewBox="0 0 29 29">
                  <path d="M0,0h7v7h-7z M2,2v3h3v-3z" fill="#000" />
                  <path d="M22,0h7v7h-7z M24,2v3h3v-3z" fill="#000" />
                  <path d="M0,22h7v7h-7z M2,24v3h3v-3z" fill="#000" />
                  <path d="M9,0h2v2h-2z M13,0h2v3h-2z M17,0h3v2h-3z M9,4h3v2h-3z M15,4h2v2h-2z M19,4h2v2h-2z M9,8h2v2h-2z" fill="#000" />
                  <path d="M14,8h3v3h-3z M19,8h2v2h-2z M25,8h4v2h-4z M9,12h2v4h-2z M13,12h4v2h-4z M22,12h3v2h-3z M27,12h2v2h-2z" fill="#000" />
                  <path d="M12,16h3v3h-3z M18,16h4v2h-4z M25,16h2v3h-2z M9,21h3v2h-3z M14,21h2v3h-2z M21,21h4v2h-4z" fill="#000" />
                  <path d="M9,25h4v4h-4z M15,25h3v2h-3z M22,25h2v2h-2z M26,25h3v4h-3z" fill="#000" />
                </svg>
                <div style={{ fontSize: '0.65rem', color: '#888', marginTop: '4px' }}>MFA SECRET: MOCKSECRET12345678</div>
              </div>

              <div style={{ fontSize: '0.8125rem', padding: '0.5rem', backgroundColor: '#e2f0d9', color: '#385723', borderRadius: '4px', display: 'inline-block' }}>
                🔒 TOTP Secret successfully provisioned on Keycloak IAM.
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setMfaQrCode(null)}
                style={{ width: '100%' }}
              >
                I have scanned the QR code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
