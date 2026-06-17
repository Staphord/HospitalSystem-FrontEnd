import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { masterService } from '@/api/services/master'
import type { SubscriptionPlan } from '@/api/types/master'
import { toast } from 'sonner'

export function CreateTenantPage() {
  const navigate = useNavigate()
  
  // Section 1: Hospital Info
  const [hospitalName, setHospitalName] = useState('')
  const [country, setCountry] = useState('Tanzania')
  const [city, setCity] = useState('Dar es Salaam')
  const [address, setAddress] = useState('')
  const [timezone, setTimezone] = useState('Africa/Dar_es_Salaam')
  const [currency, setCurrency] = useState('TZS')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  
  // Section 2: Primary Contact
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminFullName, setAdminFullName] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Section 3: Billing Details
  const [billingEmail, setBillingEmail] = useState('')
  const [taxId, setTaxId] = useState('')

  // Section 4: System Config
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [mfaEnforced, setMfaEnforced] = useState(true)
  const [rateLimit, setRateLimit] = useState('1000')
  const [storageQuota, setStorageQuota] = useState('50')
  
  // Section 5: Subscription Setup
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('standard')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [subscriptionEnd, setSubscriptionEnd] = useState(() => {
    const nextMonth = new Date()
    nextMonth.setDate(nextMonth.getDate() + 30)
    return nextMonth.toISOString().split('T')[0]
  })

  // Section 6: Branding & Contingency Settings
  const [logoUrl, setLogoUrl] = useState('')
  const [graceDays, setGraceDays] = useState('14')
  const [nasBackupPath, setNasBackupPath] = useState('/mnt/backup/nas')
  const [secondaryContactName, setSecondaryContactName] = useState('')
  const [secondaryContactPhone, setSecondaryContactPhone] = useState('')
  const [contingencyChecked, setContingencyChecked] = useState(false)

  // Validation & Submit UI states
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Fetch available plans for radio cards
    masterService.listPlans().then((data) => {
      setPlans(data)
    }).catch(() => {
   
    })
  }, [])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!hospitalName.trim()) newErrors.hospitalName = 'Hospital Name is required.'
    if (!adminUsername.trim()) newErrors.adminUsername = 'Admin Username is required.'
    if (!adminPassword.trim()) newErrors.adminPassword = 'Admin Password is required.'
    else if (adminPassword.length < 8) newErrors.adminPassword = 'Password must be at least 8 characters.'
    
    if (!adminEmail.trim()) newErrors.adminEmail = 'Admin Email is required.'
    else if (!/\S+@\S+\.\S+/.test(adminEmail)) newErrors.adminEmail = 'Admin Email is invalid.'
    
    if (billingEmail && !/\S+@\S+\.\S+/.test(billingEmail)) newErrors.billingEmail = 'Billing Email is invalid.'
    
    if (!rateLimit || Number(rateLimit) <= 0) newErrors.rateLimit = 'Rate Limit must be positive number.'
    if (!storageQuota || Number(storageQuota) <= 0) newErrors.storageQuota = 'Storage Quota must be positive number.'
    if (!graceDays || Number(graceDays) < 0) newErrors.graceDays = 'Grace Period cannot be negative.'
    
    if (!contingencyChecked) {
      newErrors.contingencyChecked = 'You must confirm that physical contingency folders are stocked.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please resolve validation errors before submitting.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)

    const payload = {
      hospital_name: hospitalName,
      admin_username: adminUsername,
      admin_password: adminPassword,
      admin_email: adminEmail,
      admin_full_name: adminFullName || undefined,
      country,
      city,
      address,
      timezone,
      currency,
      logo: logoUrl || undefined,
      data_region: country === 'Tanzania' ? 'AF-East' : 'AF-South',
      billing_email: billingEmail || adminEmail,
      tax_id: taxId || undefined,
      grace_days: Number(graceDays),
      nas_backup_path: nasBackupPath || undefined,
      secondary_contact_name: secondaryContactName || undefined,
      secondary_contact_phone: secondaryContactPhone || undefined,
      plan_id: selectedPlanId,
      billing_cycle: billingCycle,
      subscription_end: subscriptionEnd ? new Date(subscriptionEnd).toISOString() : undefined
    }

    try {
      await masterService.createTenant(payload)
      toast.success(`Hospital "${hospitalName}" onboarded successfully!`)
      navigate('/master/tenants')
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } }
      toast.error(error.response?.data?.detail || 'Failed to onboard hospital.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/master/tenants" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          ← Back to Hospitals list
        </Link>
      </div>

      <PageHeader
        title="Onboard New Hospital"
        description="Fill out all required fields in the configuration profile to register and provision a new hospital tenant."
      />

      {Object.keys(errors).length > 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error)',
            borderRadius: '8px',
            color: 'var(--color-error)',
            fontSize: '0.875rem'
          }}
        >
          <strong>Please correct the following errors:</strong>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
            {Object.values(errors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1: Hospital Info */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
            1. Hospital Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Official Hospital Name *</label>
              <input
                type="text"
                className={`form-control ${errors.hospitalName ? 'is-invalid' : ''}`}
                placeholder="e.g. Dar es Salaam General Hospital"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />
              {errors.hospitalName && <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{errors.hospitalName}</span>}
            </div>

            <div className="form-group">
              <label>Country</label>
              <select className="form-control" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="Tanzania">Tanzania</option>
                <option value="Kenya">Kenya</option>
                <option value="Uganda">Uganda</option>
                <option value="Rwanda">Rwanda</option>
              </select>
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                className="form-control"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Physical Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ali Hassan Mwinyi Road, Oysterbay"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Timezone</label>
              <select className="form-control" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (EAT)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                <option value="Africa/Kigali">Africa/Kigali (CAT)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Billing Currency</label>
              <select className="form-control" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="TZS">TZS (Tanzanian Shilling)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (United States Dollar)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Date Format</label>
              <select className="form-control" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Primary Contact */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
            2. Primary Contact & Admin User
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Admin Username *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. admin_dar"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Admin Password *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Minimum 8 characters"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Admin Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Dr. Jane Mwenye"
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Primary Contact Email Address *</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. contact@dargeneral.go.tz"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Primary Contact Phone Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +255 22 2123456"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Billing Contact */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
            3. Billing Contact
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Billing Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. finance@dargeneral.go.tz"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                Defaults to Primary Contact Email if left empty.
              </span>
            </div>

            <div className="form-group">
              <label>Tax ID / Business Registration Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. TIN-102-998-374"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4: System Config */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
            4. System Configuration
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: 'span 2' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.875rem' }}>MFA Enforcement</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  Require multi-factor authentication (MFA) setup for all hospital administrators.
                </span>
              </div>
              <input
                type="checkbox"
                checked={mfaEnforced}
                onChange={(e) => setMfaEnforced(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: 'span 2', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.875rem' }}>Maintenance Mode</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  Temporarily lock the tenant site to display a maintenance banner screen.
                </span>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <label>API Rate Limiting Cap (Requests / Minute)</label>
              <input
                type="number"
                className="form-control"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <label>Storage Quota Limit (GB)</label>
              <input
                type="number"
                className="form-control"
                value={storageQuota}
                onChange={(e) => setStorageQuota(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* Section 5: Subscription Setup */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
            5. Subscription Setup
          </h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Select Subscription Plan Tier *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {plans.map((p) => (
                <label
                  key={p.plan_id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem',
                    border: selectedPlanId === p.plan_id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedPlanId === p.plan_id ? 'var(--color-primary-light)' : 'transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="plan_selection"
                    checked={selectedPlanId === p.plan_id}
                    onChange={() => {
                      setSelectedPlanId(p.plan_id)
                      setStorageQuota(p.storage_gb.toString())
                    }}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text)' }}>{p.plan_name} Plan</strong>
                      <span className="badge badge-info">${p.monthly_price}/mo</span>
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', display: 'block', marginTop: '0.25rem' }}>
                      {p.description || 'Access standard modules and configurations.'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Billing Cycle</label>
              <select
                className="form-control"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'annual')}
              >
                <option value="monthly">Monthly billing</option>
                <option value="annual">Annual billing (discounted)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Subscription Expiration Date</label>
              <input
                type="date"
                className="form-control"
                value={subscriptionEnd}
                onChange={(e) => setSubscriptionEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 6: Branding & Contingency Settings */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontSize: '1.15rem' }}>
            6. Branding & Contingency Setup
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Hospital Brand Logo URL</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. https://domain.com/assets/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Grace Period Configuration (Days)</label>
              <input
                type="number"
                className="form-control"
                value={graceDays}
                onChange={(e) => setGraceDays(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Local Backup NAS Storage Directory Path</label>
              <input
                type="text"
                className="form-control"
                value={nasBackupPath}
                onChange={(e) => setNasBackupPath(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Secondary Incident Lead Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Richard Kimaro"
                value={secondaryContactName}
                onChange={(e) => setSecondaryContactName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Secondary Incident Lead Phone</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +255 754 987654"
                value={secondaryContactPhone}
                onChange={(e) => setSecondaryContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fafbfc',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              marginTop: '1.5rem'
            }}
          >
            <input
              type="checkbox"
              id="contingency_chk"
              checked={contingencyChecked}
              onChange={(e) => setContingencyChecked(e.target.checked)}
              style={{ marginTop: '0.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="contingency_chk" style={{ fontSize: '0.8125rem', color: 'var(--color-text)', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
              I confirm that a minimum of 50 contingency physical form packets are currently printed and locked in the red folders in reception, triage, consultation, laboratory, pharmacy, and cashier workstations at this site. *
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/master/tenants')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Onboarding...' : 'Onboard Hospital Tenant'}
          </button>
        </div>

      </form>
    </div>
  )
}
