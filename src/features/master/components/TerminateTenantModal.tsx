import React, { useState } from 'react'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import type { Tenant, Subscription, Invoice } from '@/api/types/master'
import type { AuditLog } from '@/api/services/monitoring'

export interface TerminateTenantModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
  tenantName: string
  stats?: {
    user_count?: number
    kc_user_count?: number
    patient_count?: number
    db_size_mb?: number
  } | null
  storageGb?: number | string
  tenantProfile?: Tenant | null
  subscriptions?: Subscription[]
  invoices?: Invoice[]
  auditLogs?: AuditLog[]
  onSuccess: () => void
}

export function TerminateTenantModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  stats = null,
  storageGb = 0,
  tenantProfile = null,
  subscriptions = [],
  invoices = [],
  auditLogs = [],
  onSuccess
}: TerminateTenantModalProps) {
  const [terminateStep, setTerminateStep] = useState(1)
  const [hospitalNameConfirm, setHospitalNameConfirm] = useState('')
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false)
  const [backupVerified, setBackupVerified] = useState(false)
  const [finalConsent1, setFinalConsent1] = useState(false)
  const [finalConsent2, setFinalConsent2] = useState(false)
  const [terminating, setTerminating] = useState(false)



  if (!isOpen) return null

  const handleDownloadBackup = () => {
    const backupData = {
      tenant_id: tenantId,
      hospital_name: tenantName,
      exported_at: new Date().toISOString(),
      statistics: {
        active_staff_users: stats ? (stats.user_count || stats.kc_user_count || 0) : 0,
        total_patients: stats ? (stats.patient_count || 0) : 0,
        storage_gb: storageGb,
        db_size_mb: stats ? (stats.db_size_mb || 0) : 0
      },
      profile: tenantProfile || { tenant_id: tenantId, hospital_name: tenantName },
      subscriptions: subscriptions,
      invoices: invoices,
      audit_logs: auditLogs
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tenantId}_clinical_data_export.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setHasDownloadedBackup(true)
    toast.success('Backup export file generated and downloaded successfully!')
  }

  const handleTerminate = async () => {
    if (!tenantId) return
    setTerminating(true)

    try {
      await masterService.updateTenant(tenantId, { status: 'terminated' })
      toast.success(`Tenant organization "${tenantName}" has been permanently terminated.`)
      onSuccess()
      onClose()
    } catch {
      toast.error('Failed to terminate organization.')
    } finally {
      setTerminating(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid #f5c6cb' }}>
          <h3 style={{ color: '#ff5630' }}>Terminate Hospital Account - Step {terminateStep} of 3</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Step 1: Warning with statistics & lock */}
        {terminateStep === 1 && (
          <div className="modal-body">
            <div style={{ backgroundColor: '#ffebe6', color: '#ff5630', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.8125rem', border: '1px solid #f5c6cb', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
              <div>
                <strong>CRITICAL WARNING:</strong> This action is permanent and completely irreversible. Proceeding will permanently delete all records associated with this hospital.
              </div>
            </div>

            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Data Loss Statistics Summary:</h4>
            <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--color-border)' }}>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', lineHeight: '1.5' }}>
                <li>Active Hospital Staff Accounts: <strong>{stats ? (stats.user_count || stats.kc_user_count || 0) : '0'} accounts</strong></li>
                <li>Stored Patient Demographic Profiles: <strong>{stats ? (stats.patient_count || 0).toLocaleString() : '0'} records</strong></li>
                <li>Document Storage attachments: <strong>{storageGb} GB</strong></li>
                <li>Provisioned Database Space: <strong>{stats ? (stats.db_size_mb || 0) : '0'} MB</strong></li>
              </ul>
            </div>

            <div className="form-group">
              <label>Type the hospital name (<strong>{tenantName}</strong>) to unlock Next:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter hospital name exactly..."
                value={hospitalNameConfirm}
                onChange={(e) => setHospitalNameConfirm(e.target.value)}
              />
            </div>

            <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none', backgroundColor: 'transparent' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={hospitalNameConfirm !== tenantName}
                onClick={() => setTerminateStep(2)}
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Backup Export */}
        {terminateStep === 2 && (
          <div className="modal-body">
            <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              A compliance backup of the organization database must be downloaded before termination can proceed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownloadBackup}
                style={{ padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span className="material-symbols-outlined">download</span>
                Generate & Download Backup Export (JSON)
              </button>
            </div>

            {hasDownloadedBackup && (
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: '#e3fcef',
                  border: '1px solid #c3e6cb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}
              >
                <input
                  type="checkbox"
                  id="chk_verify_backup"
                  checked={backupVerified}
                  onChange={(e) => setBackupVerified(e.target.checked)}
                  style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                />
                <label htmlFor="chk_verify_backup" style={{ fontSize: '0.8125rem', color: '#155724', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                  I confirm that the database backup has been successfully downloaded, archived, and verified as readable.
                </label>
              </div>
            )}

            <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none', backgroundColor: 'transparent' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setTerminateStep(1)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!backupVerified}
                onClick={() => setTerminateStep(3)}
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Final confirmation */}
        {terminateStep === 3 && (
          <div className="modal-body">
            <div style={{ backgroundColor: '#ffebe6', color: '#ff5630', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8125rem', border: '1px solid #f5c6cb', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
              <div>
                <strong>FINAL WARNING:</strong> Pressing "Terminate Organization" will execute a hard delete of the tenant database. This operation cannot be canceled or recovered.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={finalConsent1}
                  onChange={(e) => setFinalConsent1(e.target.checked)}
                  style={{ marginTop: '0.2rem' }}
                />
                <span>I understand that this will delete all clinical records, staff accounts, invoices, and payment audits.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={finalConsent2}
                  onChange={(e) => setFinalConsent2(e.target.checked)}
                  style={{ marginTop: '0.2rem' }}
                />
                <span>I understand that this action is permanent and completely irreversible.</span>
              </label>
            </div>

            <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none', backgroundColor: 'transparent' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setTerminateStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={!finalConsent1 || !finalConsent2 || terminating}
                onClick={handleTerminate}
              >
                {terminating ? 'Terminating...' : 'Terminate Organization'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
