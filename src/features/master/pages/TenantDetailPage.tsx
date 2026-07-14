import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import { monitoringService } from '@/api/services/monitoring'
import { SuspendTenantModal } from '@/features/master/components/SuspendTenantModal'
import { TerminateTenantModal } from '@/features/master/components/TerminateTenantModal'
import type { Tenant, Subscription, Invoice } from '@/api/types/master'
import type { AuditLog } from '@/api/services/monitoring'
import { formatTenantDate, formatTenantCurrency, formatTenantDateTime } from '@/lib/localization'

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  interface TenantStats {
    user_count?: number
    kc_user_count?: number
    patient_count?: number
    db_size_mb?: number
  }

  interface TenantAnalytics {
    storage_growth?: number[]
    uptime_trend?: number[]
    active_users_peak?: number[]
    module_usage?: Record<string, number>
    activity_logs?: unknown[]
  }

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<TenantStats | null>(null)
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'invoices' | 'audit' | 'config'>('overview')

  // Modal states
  const [isSuspendOpen, setIsSuspendOpen] = useState(false)
  const [isTerminateOpen, setIsTerminateOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [profileForm, setProfileForm] = useState({
    hospital_name: '',
    timezone: '',
    currency: '',
    date_format: '',
    grace_period_days: 7,
  })

  const handleOpenEditProfile = () => {
    if (!tenant) return
    setProfileForm({
      hospital_name: tenant.hospital_name || tenant.name || '',
      timezone: tenant.timezone || 'UTC',
      currency: tenant.currency || 'USD',
      date_format: tenant.date_format || 'DD/MM/YYYY',
      grace_period_days: (tenant as any).grace_period_days !== undefined ? (tenant as any).grace_period_days : 7,
    })
    setEditLogoFile(null)
    setIsEditProfileOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !tenant) return
    try {
      let finalLogoUrl: string | undefined = undefined
      if (editLogoFile) {
        finalLogoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(editLogoFile)
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = (error) => reject(error)
        })
      }

      const updated = await masterService.updateTenant(id, {
        hospital_name: profileForm.hospital_name,
        timezone: profileForm.timezone,
        currency: profileForm.currency,
        date_format: profileForm.date_format,
        grace_period_days: Number(profileForm.grace_period_days),
        logo_url: finalLogoUrl || undefined,
      })
      setTenant(updated)
      setIsEditProfileOpen(false)
    } catch (err) {
      console.error("Failed to update profile", err)
      alert("Failed to update tenant profile settings.")
    }
  }

  const fetchData = useCallback(async () => {
    if (!id) return
    await Promise.resolve()
    try {
      setLoading(true)
      const tData = await masterService.getTenant(id)
      setTenant(tData)
      
      // Parallel requests for related info
      const [subs, invs, logs, statsData, analyticsData] = await Promise.all([
        masterService.listSubscriptions(id).catch(() => []),
        masterService.listInvoices(id).catch(() => []),
        monitoringService.getAuditLogs().catch(() => []),
        masterService.getTenantStats(id).catch((err) => {
          console.error("Failed to fetch tenant stats", err)
          return null
        }),
        monitoringService.getTenantAnalytics(id).catch((err) => {
          console.error("Failed to fetch tenant analytics", err)
          return null
        })
      ])
      
      setSubscriptions(subs)
      setInvoices(invs)
      setStats(statsData as TenantStats)
      setAnalytics(analyticsData as any)
      
      // Filter logs related to this tenant
      const filteredLogs = logs.filter(
        (l) =>
          l.details.toLowerCase().includes(id.toLowerCase()) ||
          l.details.toLowerCase().includes(tData.hospital_name.toLowerCase())
      )
      setAuditLogs(filteredLogs)
    } catch {
      toast.error('Failed to load tenant details.')
      navigate('/master/tenants')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    let active = true
    const load = async () => {
      await Promise.resolve()
      if (!active) return
      fetchData()
    }
    load()
    return () => {
      active = false
    }
  }, [id, fetchData])


  const handleUnsuspend = async () => {
    if (!tenant || !id) return
    try {
      await masterService.updateTenant(id, { status: 'active' })
      toast.success(`Tenant "${tenant.hospital_name}" reactivated successfully.`)
      fetchData()
    } catch {
      toast.error('Failed to reactivate tenant.')
    }
  }



  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        Loading tenant details...
      </div>
    )
  }

  if (!tenant) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        Tenant not found. <Link to="/master/tenants">Back to list</Link>
      </div>
    )
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-badge status-active'
      case 'trial':
        return 'status-badge status-trial'
      case 'suspended':
        return 'status-badge status-suspended'
      case 'terminated':
        return 'status-badge status-terminated'
      default:
        return 'status-badge'
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link 
          to="/master/tenants" 
          style={{ 
            fontSize: '0.875rem', 
            color: 'var(--color-primary)', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.35rem',
            marginBottom: '1rem' 
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            arrow_back
          </span>
          Back to Tenants
        </Link>

        <div className="bg-white border border-outline-variant rounded-xl p-lg mb-xl">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="w-20 h-20 rounded-full bg-white border border-outline-variant flex items-center justify-center overflow-hidden">
                <img 
                  className="w-14 h-14 object-contain" 
                  alt="Hospital logo" 
                  src={
                    tenant.logo_url
                      ? (tenant.logo_url.startsWith('data:') || tenant.logo_url.startsWith('http')
                        ? tenant.logo_url
                        : `http://localhost:8000${tenant.logo_url}`)
                      : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnyDKq2GekSnkqmmjmD0cl-m8HqCrfHt5-2qJJf0muZNvFrj8iVVhQqkPQ2QTdeH-TchFOL4a3e2mGpdWideoGjntHMnfMJzIt_NDuTtWG9agmRldID3Vx2ZUKQFq6LEVrlKgzJuGf1DZXyWgF3mDobpHddkWL5hc7ugyT23vsL8qgUfBlaj8FY4craQUBeuUqFVWu6Rk7Awc0HBuyY5CfkpuZUzlIPRBTqRuDoR6SAO30MdY6FDLYpwj2wT8Aj_U1vg7nj2hc9iDS'
                  }
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-headline-lg font-headline-lg text-on-surface margin-0">{tenant.hospital_name}</h2>
                  {tenant.status.toLowerCase() === 'active' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded border border-green-200 uppercase">ACTIVE</span>
                  )}
                  {tenant.status.toLowerCase() === 'suspended' && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded border border-red-200 uppercase">SUSPENDED</span>
                  )}
                  {tenant.status.toLowerCase() === 'trial' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded border border-amber-200 uppercase">TRIAL</span>
                  )}
                  {tenant.status.toLowerCase() === 'terminated' && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded border border-gray-200 uppercase">TERMINATED</span>
                  )}
                </div>
                <p className="text-body-md text-secondary mb-3">
                  <span>{tenant.tenant_id}</span> • <span>{tenant.city || '-'}, {tenant.country || '-'}</span>
                </p>
                {tenant.status.toLowerCase() !== 'terminated' && (
                  <button 
                    onClick={handleOpenEditProfile}
                    className="flex items-center gap-2 px-3 py-1.5 text-secondary border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors font-label-md bg-transparent cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>
            
            {tenant.status.toLowerCase() !== 'terminated' && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Suspend Button */}
                {tenant.status.toLowerCase() === 'active' || tenant.status.toLowerCase() === 'trial' ? (
                  <button 
                    className="px-4 py-2 bg-[#FF9900] text-white rounded-lg hover:opacity-90 transition-colors font-label-md flex items-center gap-2 border-0 cursor-pointer"
                    onClick={() => setIsSuspendOpen(true)}
                  >
                    <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                    <span>Suspend</span>
                  </button>
                ) : (
                  <button 
                    className="px-4 py-2 bg-surface-container-highest text-secondary border border-outline-variant rounded-lg cursor-not-allowed font-label-md flex items-center gap-2 bg-transparent"
                    disabled
                  >
                    <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                    <span>Suspend</span>
                  </button>
                )}

                {/* Reactivate Button */}
                {tenant.status.toLowerCase() === 'suspended' ? (
                  <button 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90 transition-colors font-label-md flex items-center gap-2 border-0 cursor-pointer"
                    onClick={handleUnsuspend}
                  >
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                    <span>Reactivate</span>
                  </button>
                ) : (
                  <button 
                    className="px-4 py-2 bg-surface-container-highest text-secondary border border-outline-variant rounded-lg cursor-not-allowed font-label-md flex items-center gap-2 bg-transparent"
                    disabled
                  >
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                    <span>Reactivate</span>
                  </button>
                )}

                {/* Impersonate Button */}
                {tenant.status.toLowerCase() === 'active' || tenant.status.toLowerCase() === 'trial' ? (
                  <button 
                    className="px-4 py-2 text-primary border border-primary rounded-lg hover:bg-primary-container hover:bg-opacity-10 transition-colors font-label-md flex items-center gap-2 bg-transparent cursor-pointer" 
                    onClick={() => {
                      navigate(`/impersonation/switching?tenant_id=${tenant.tenant_id}&return_to=/admin/dashboard`, { replace: true })
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                    <span>Impersonate</span>
                  </button>
                ) : (
                  <button 
                    className="px-4 py-2 text-secondary border border-outline-variant rounded-lg font-label-md flex items-center gap-2 bg-transparent cursor-not-allowed" 
                    disabled
                  >
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                    <span>Impersonate</span>
                  </button>
                )}

                {/* Terminate Button */}
                <button 
                  className="px-4 py-2 bg-[#BA1A1A] text-white rounded-lg hover:opacity-90 transition-colors font-label-md flex items-center gap-2 border-0 cursor-pointer"
                  onClick={() => setIsTerminateOpen(true)}
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  <span>Terminate</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant mb-xl">
        <nav className="flex gap-8 overflow-x-auto no-scrollbar">
          <button 
            className={`px-1 py-4 font-label-md whitespace-nowrap bg-transparent border-t-0 border-x-0 cursor-pointer ${
              activeTab === 'overview' 
                ? 'text-primary border-b-2 border-primary font-semibold' 
                : 'text-on-surface-variant hover:text-primary transition-colors border-b-2 border-transparent'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`px-1 py-4 font-label-md whitespace-nowrap bg-transparent border-t-0 border-x-0 cursor-pointer ${
              activeTab === 'subscription' 
                ? 'text-primary border-b-2 border-primary font-semibold' 
                : 'text-on-surface-variant hover:text-primary transition-colors border-b-2 border-transparent'
            }`}
            onClick={() => setActiveTab('subscription')}
          >
            Subscription
          </button>
          <button 
            className={`px-1 py-4 font-label-md whitespace-nowrap bg-transparent border-t-0 border-x-0 cursor-pointer ${
              activeTab === 'invoices' 
                ? 'text-primary border-b-2 border-primary font-semibold' 
                : 'text-on-surface-variant hover:text-primary transition-colors border-b-2 border-transparent'
            }`}
            onClick={() => setActiveTab('invoices')}
          >
            <span>Invoices</span><span> and Payments</span>
          </button>
          <button 
            className={`px-1 py-4 font-label-md whitespace-nowrap bg-transparent border-t-0 border-x-0 cursor-pointer ${
              activeTab === 'audit' 
                ? 'text-primary border-b-2 border-primary font-semibold' 
                : 'text-on-surface-variant hover:text-primary transition-colors border-b-2 border-transparent'
            }`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Log
          </button>
          <button 
            className={`px-1 py-4 font-label-md whitespace-nowrap bg-transparent border-t-0 border-x-0 cursor-pointer ${
              activeTab === 'config' 
                ? 'text-primary border-b-2 border-primary font-semibold' 
                : 'text-on-surface-variant hover:text-primary transition-colors border-b-2 border-transparent'
            }`}
            onClick={() => setActiveTab('config')}
          >
            System Config
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl mt-md">
          
          {/* General Info Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
            <div className="flex items-center gap-2 mb-xl">
              <span className="material-symbols-outlined text-primary">info</span>
              <h3 className="text-headline-sm font-headline-sm m-0">General Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b border-outline-variant pb-3">
                <div>
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Hospital Name</p>
                  <p className="text-body-md font-medium text-on-surface m-0">{tenant.hospital_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border-b border-outline-variant pb-3">
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Country</p>
                  <p className="text-body-md font-medium text-on-surface m-0">{tenant.country || '-'}</p>
                </div>
                <div className="border-b border-outline-variant pb-3">
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">City</p>
                  <p className="text-body-md font-medium text-on-surface m-0">{tenant.city || '-'}</p>
                </div>
              </div>
              
              <div className="border-b border-outline-variant pb-3">
                <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Address</p>
                <p className="text-body-md font-medium text-on-surface m-0">{tenant.address || '-'}</p>
              </div>
              
              <div className="border-b border-outline-variant pb-3">
                <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Primary Contact</p>
                <p className="text-body-md font-medium text-on-surface m-0">{tenant.contact_name || '-'}</p>
                <p className="text-body-sm text-secondary m-0">
                  {tenant.contact_email || '-'} • {tenant.contact_phone || '-'}
                </p>
              </div>
              
              <div className="border-b border-outline-variant pb-3">
                <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Billing Email</p>
                <p className="text-body-md font-medium text-on-surface m-0">{tenant.billing_email || tenant.contact_email || '-'}</p>
              </div>
            </div>
          </div>

          {/* System & Localization Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
            <div className="flex items-center gap-2 mb-xl">
              <span className="material-symbols-outlined text-primary">dns</span>
              <h3 className="text-headline-sm font-headline-sm m-0">System & Localization</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border-b border-outline-variant pb-3">
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Timezone</p>
                  <p className="text-body-md font-medium text-on-surface m-0">{tenant.timezone || 'UTC'}</p>
                </div>
                <div className="border-b border-outline-variant pb-3">
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Currency</p>
                  <p className="text-body-md font-medium text-on-surface m-0">{tenant.currency || 'USD'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-b border-outline-variant pb-3">
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Date Format</p>
                  <p className="text-body-md font-medium text-on-surface m-0">{tenant.date_format || 'DD/MM/YYYY'}</p>
                </div>
                <div className="border-b border-outline-variant pb-3">
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Data Region</p>
                  <p className="text-body-md font-medium text-on-surface m-0">{tenant.data_region || '-'}</p>
                </div>
              </div>

              <div className="border-b border-outline-variant pb-3">
                <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Database Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-body-md font-medium text-on-surface m-0">Provisioned</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border-b border-outline-variant pb-3">
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Created Date</p>
                  <p className="text-body-md font-medium text-on-surface m-0">
                    {formatTenantDate(tenant.created_at, tenant.date_format)}
                  </p>
                </div>
                <div className="border-b border-outline-variant pb-3">
                  <p className="text-label-sm font-label-sm text-secondary uppercase tracking-tight m-0">Trial End Date</p>
                  <div className="flex items-center gap-2">
                    <p className="text-body-md font-medium text-on-surface m-0">
                      {tenant.subscription_end ? formatTenantDate(tenant.subscription_end, tenant.date_format) : 'Continuous'}
                    </p>
                    {tenant.subscription_plan && (
                      <span className="px-1.5 py-0.5 bg-primary-container text-on-primary-container text-[10px] rounded font-bold uppercase">
                        {tenant.subscription_plan}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

        {/* Danger Zone Card */}
        {tenant.status.toLowerCase() !== 'terminated' && (
          <div className="border border-error rounded-xl overflow-hidden mt-xl">
            <div className="bg-error bg-opacity-[0.03] p-lg border-b border-error">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-error">warning</span>
                <h3 className="text-headline-sm font-headline-sm text-error m-0">Danger Zone</h3>
              </div>
            </div>
            <div className="p-lg bg-surface-container-lowest">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg py-4 border-b border-outline-variant last:border-0">
                <div>
                  <p className="text-body-md font-bold text-on-surface m-0">Suspend Account</p>
                  <p className="text-body-sm text-secondary m-0">Instantly revoke access for all users in this hospital. Recurring billing will continue until canceled.</p>
                </div>
                {tenant.status === 'suspended' ? (
                  <button 
                    className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary-container hover:bg-opacity-10 transition-colors font-label-md whitespace-nowrap bg-transparent cursor-pointer"
                    onClick={handleUnsuspend}
                  >
                    Unsuspend Account
                  </button>
                ) : (
                  <button 
                    className="px-4 py-2 border border-error text-error rounded-lg hover:bg-error-container hover:bg-opacity-20 transition-colors font-label-md whitespace-nowrap bg-transparent cursor-pointer"
                    onClick={() => setIsSuspendOpen(true)}
                  >
                    Suspend Account
                  </button>
                )}
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg py-4 last:border-0">
                <div>
                  <p className="text-body-md font-bold text-on-surface m-0">Terminate Account</p>
                  <p className="text-body-sm text-secondary m-0">Permanently delete the organization, all associated records, patient data, and clinical history. This action cannot be undone.</p>
                </div>
                <button 
                  className="px-4 py-2 bg-error text-on-error rounded-lg hover:opacity-90 transition-colors font-label-md whitespace-nowrap border-0 cursor-pointer"
                  onClick={() => setIsTerminateOpen(true)}
                >
                  Terminate Account
                </button>
              </div>
            </div>
          </div>
        )}
      </>
      )}

      {activeTab === 'subscription' && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
              Subscription Plan Details
            </h3>

            <Link
              to={`/master/subscriptions?tenant_id=${tenant.tenant_id}`}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
              View Subscription Logs
            </Link>
          </div>
          {subscriptions.length === 0 ? (
            <div style={{ color: 'var(--color-text-light)', padding: '1rem 0' }}>No subscription history found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td><strong>{sub.plan_name}</strong></td>
                      <td>
                        <span className={getStatusBadgeClass(sub.status)}>{sub.status}</span>
                      </td>
                      <td>{formatTenantDate(sub.start_date, tenant.date_format)}</td>
                      <td>{sub.end_date ? formatTenantDate(sub.end_date, tenant.date_format) : 'Continuous'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
              Invoices and Payments
            </h3>
            <Link
              to={`/master/invoices?tenant_id=${tenant.tenant_id}`}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
              View Invoices Ledger
            </Link>
          </div>
          {invoices.length === 0 ? (
            <div style={{ color: 'var(--color-text-light)', padding: '1rem 0' }}>No invoice records found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><code>{inv.invoice_number || `#${inv.id}`}</code></td>
                      <td>{inv.description || 'Subscription invoice'}</td>
                      <td><strong>{formatTenantCurrency(inv.amount, tenant.currency)}</strong></td>
                      <td>{formatTenantDate(inv.due_date, tenant.date_format)}</td>
                      <td>
                        <span className={`status-badge ${inv.status === 'paid' ? 'status-active' : inv.status === 'overdue' ? 'status-terminated' : 'status-suspended'}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
            System Audit Log
          </h3>
          {auditLogs.length === 0 ? (
            <div style={{ color: 'var(--color-text-light)', padding: '1rem 0' }}>No log history matching this tenant.</div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8125rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td><code>{log.actor}</code></td>
                      <td><span className="status-badge" style={{ backgroundColor: '#e2e5e9', color: '#333' }}>{log.action}</span></td>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                      <td><code>{log.ip_address}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'config' && (
        <div className="card" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', fontSize: '1.125rem' }}>
            Read-only System Configuration & Settings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '600px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9375rem' }}>Maintenance Mode</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ verticalAlign: 'middle' }}>
                    {tenant.maintenance_mode ? 'lock' : 'lock_open'}
                  </span>
                  {tenant.maintenance_mode ? 'ACTIVE - Site is locked for maintenance.' : 'INACTIVE - Standard portal access.'}
                </span>
              </div>
              <input 
                type="checkbox" 
                disabled
                checked={tenant.maintenance_mode || false} 
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.9375rem' }}>MFA Enforcement</strong>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ verticalAlign: 'middle' }}>
                    {tenant.mfa_enforced ?? true ? 'lock' : 'lock_open'}
                  </span>
                  {tenant.mfa_enforced ?? true ? 'ENFORCED - Mandatory two-factor auth.' : 'OPTIONAL - MFA is not required.'}
                </span>
              </div>
              <input 
                type="checkbox" 
                disabled
                checked={tenant.mfa_enforced ?? true} 
                style={{ width: '1.25rem', height: '1.25rem', cursor: 'not-allowed' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'block', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>API Rate Limiting Cap</strong>
                <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                  Throttling cap threshold applied globally to hospital traffic.
                </span>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="material-symbols-outlined text-[18px]">vpn_key</span>
                  <span>{tenant.rate_limit ?? 1000} requests / minute (Read-Only)</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'block', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Storage Space Quota Allocation</strong>
                <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                  Upper storage limit for attachments, patient medical files, and scans.
                </span>
                <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="material-symbols-outlined text-[18px]">folder</span>
                  <span>{tenant.storage_gb ?? 50} GB (Read-Only)</span>
                </div>
              </div>
            </div>

            {tenant.nas_backup_path && (
              <div>
                <div style={{ display: 'block', marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>Local Backup NAS storage directory path</strong>
                  <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                    {tenant.nas_backup_path}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUSPEND TENANT MODAL */}
      <SuspendTenantModal
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        tenantId={id || ''}
        tenantName={tenant?.hospital_name || ''}
        onSuccess={fetchData}
      />

      {/* 3-STEP TERMINATE TENANT MODAL */}
      {isTerminateOpen && (
        <TerminateTenantModal
          isOpen={isTerminateOpen}
          onClose={() => setIsTerminateOpen(false)}
          tenantId={id || ''}
          tenantName={tenant?.hospital_name || ''}
          stats={stats}
          storageGb={analytics && analytics.storage_growth ? analytics.storage_growth[analytics.storage_growth.length - 1] : 0}
          tenantProfile={tenant}
          subscriptions={subscriptions}
          invoices={invoices}
          auditLogs={auditLogs}
          onSuccess={() => {
            setIsTerminateOpen(false)
            navigate('/master/tenants')
          }}
        />
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface-white border border-border-subtle rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-lg border-b border-border-subtle flex justify-between items-center bg-surface-container-low">
              <h3 className="font-headline-sm text-headline-sm m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Edit Hospital Profile
              </h3>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="text-secondary hover:text-on-surface bg-transparent border-0 cursor-pointer flex items-center justify-center p-1 rounded-full hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-lg space-y-md">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs font-semibold">
                  Hospital Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.hospital_name}
                  onChange={(e) => setProfileForm({ ...profileForm, hospital_name: e.target.value })}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs font-semibold">
                  Timezone
                </label>
                <select
                  value={profileForm.timezone}
                  onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface-white"
                >
                  <option value="Africa/Dar_es_Salaam">East Africa Time (GMT+3) - Dar es Salaam</option>
                  <option value="Africa/Nairobi">East Africa Time (GMT+3) - Nairobi</option>
                  <option value="Africa/Kampala">East Africa Time (GMT+3) - Kampala</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs font-semibold">
                  Currency
                </label>
                <select
                  value={profileForm.currency}
                  onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface-white"
                >
                  <option value="TZS">Tanzanian Shilling (TZS)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="UGX">Ugandan Shilling (UGX)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs font-semibold">
                  Date Format
                </label>
                <select
                  value={profileForm.date_format}
                  onChange={(e) => setProfileForm({ ...profileForm, date_format: e.target.value })}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs font-semibold">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={profileForm.grace_period_days}
                  onChange={(e) => setProfileForm({ ...profileForm, grace_period_days: Number(e.target.value) })}
                  className="w-full border border-border-subtle rounded-lg px-md py-2 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface-white"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-xs font-semibold">
                  Hospital Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditLogoFile(e.target.files[0])
                    }
                  }}
                  className="w-full text-body-md border border-border-subtle rounded-lg px-md py-1.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface-white"
                />
              </div>

              <div className="flex justify-end gap-md pt-md border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-lg py-2 border border-outline-variant text-secondary rounded-lg hover:bg-surface-container-low transition-colors font-label-md bg-transparent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-lg py-2 bg-primary text-white rounded-lg hover:bg-primary-container transition-all active:scale-95 font-label-md border-0 cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
