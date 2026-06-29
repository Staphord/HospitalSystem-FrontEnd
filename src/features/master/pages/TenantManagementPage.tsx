import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { masterService } from '@/api/services/master'
import { SuspendTenantModal } from '@/features/master/components/SuspendTenantModal'
import type { Tenant } from '@/api/types/master'

export function TenantManagementPage() {
  const navigate = useNavigate()
  
  // Data states
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  
  // Action dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; right: number } | null>(null)
  
  // Suspend Modal states
  const [selectedTenantForSuspend, setSelectedTenantForSuspend] = useState<Tenant | null>(null)

  const fetchTenants = async () => {
    try {
      setLoading(true)
      // Simulating a minor load latency to demonstrate the skeleton state
      await new Promise((r) => setTimeout(r, 600))
      const data = await masterService.listTenants()
      setTenants(data)
    } catch (err) {
      toast.error('Failed to load tenants.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleUpdateStatus = async (tenantId: string, newStatus: string) => {
    try {
      await masterService.updateTenant(tenantId, { status: newStatus })
      toast.success(`Tenant status updated to ${newStatus}.`)
      fetchTenants()
    } catch (err) {
      toast.error('Failed to update tenant status.')
    }
  }

  const handleImpersonate = (tenant: Tenant) => {
    navigate(`/impersonation/switching?tenant_id=${tenant.tenant_id}&return_to=/admin/dashboard`, { replace: true })
  }

  // Filtering logic
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.hospital_name.toLowerCase().includes(search.toLowerCase()) ||
      t.tenant_id.toLowerCase().includes(search.toLowerCase()) ||
      (t.city && t.city.toLowerCase().includes(search.toLowerCase())) ||
      (t.country && t.country.toLowerCase().includes(search.toLowerCase()))
    
    const matchesStatus =
      statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase()
      
    const matchesCountry =
      countryFilter === 'all' || (t.country && t.country.toLowerCase() === countryFilter.toLowerCase())

    const matchesPlan =
      planFilter === 'all' || (t.subscription_plan && t.subscription_plan.toLowerCase() === planFilter.toLowerCase())

    return matchesSearch && matchesStatus && matchesCountry && matchesPlan
  })

  // Pagination calculations
  const totalItems = filteredTenants.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex)

  // Reset page and active dropdown on filters change
  useEffect(() => {
    setCurrentPage(1)
    setActiveDropdown(null)
    setDropdownCoords(null)
  }, [search, statusFilter, countryFilter, planFilter, pageSize])

  // KPI stats calculations
  const totalHospitals = tenants.length
  const activeCount = tenants.filter(t => t.status.toLowerCase() === 'active').length
  const suspendedCount = tenants.filter(t => t.status.toLowerCase() === 'suspended').length
  const trialCount = tenants.filter(t => t.status.toLowerCase() === 'trial').length
  const terminatedCount = tenants.filter(t => t.status.toLowerCase() === 'terminated').length

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700'
      case 'trial':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700'
      case 'suspended':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-error-container text-error'
      case 'terminated':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700'
      default:
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700'
    }
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-xl gap-md">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-xs">Hospitals</h2>
          <p className="font-body-md text-body-md text-secondary">Manage and monitor health facility infrastructure subscriptions</p>
        </div>
        <button 
          className="inline-flex items-center justify-center gap-sm px-lg h-10 bg-primary text-white rounded-lg font-bold hover:brightness-110 active:opacity-80 transition-all shadow-sm"
          onClick={() => navigate('/master/tenants/new')}
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Onboard New Hospital</span>
        </button>
      </div>

      {/* KPI Cards Bento */}
      <div className="grid grid-cols-1 gap-md mb-lg md:grid-cols-5">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider m-0">Total Hospitals</p>
            <h3 className="font-headline-md text-headline-md text-on-surface m-0 leading-none font-bold">{totalHospitals}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">domain</span>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider m-0">Active</p>
            <h3 className="font-headline-md text-headline-md text-on-surface m-0 leading-none font-bold">{activeCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-green-600 text-[22px]">check_circle</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider m-0">Suspended</p>
            <h3 className="font-headline-md text-headline-md text-on-surface m-0 leading-none font-bold">{suspendedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">pause_circle</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider m-0">Trial</p>
            <h3 className="font-headline-md text-headline-md text-on-surface m-0 leading-none font-bold">{trialCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-purple-600 text-[22px]">hourglass_top</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <p className="font-label-sm text-label-sm text-secondary uppercase tracking-wider m-0">Terminated</p>
            <h3 className="font-headline-md text-headline-md text-on-surface m-0 leading-none font-bold">{terminatedCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant text-[22px]">cancel</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-md rounded-t-xl border-x border-t border-outline-variant flex flex-wrap items-center gap-md">
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-sm top-[7px] text-outline text-[20px] select-none pointer-events-none z-10 leading-none">search</span>
          <input 
            className="w-full pl-xl pr-md py-2 border border-outline-variant rounded-lg bg-white text-body-sm placeholder:text-outline-variant text-on-surface focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all" 
            placeholder="Search by name, city or ID..." 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-sm flex-wrap">
          <select 
            className="border border-outline-variant rounded-lg px-md py-2 text-body-sm focus:ring-primary focus:border-primary bg-white cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trial">Trial</option>
            <option value="terminated">Terminated</option>
          </select>

          <select 
            className="border border-outline-variant rounded-lg px-md py-2 text-body-sm focus:ring-primary focus:border-primary bg-white cursor-pointer"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
          >
            <option value="all">Country: All</option>
            <option value="tanzania">Tanzania</option>
            <option value="kenya">Kenya</option>
            <option value="uganda">Uganda</option>
          </select>

          <select 
            className="border border-outline-variant rounded-lg px-md py-2 text-body-sm focus:ring-primary focus:border-primary bg-white cursor-pointer"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="all">Plan: All</option>
            <option value="premium">Premium</option>
            <option value="standard">Standard</option>
            <option value="basic">Basic</option>
          </select>

          <select 
            className="border border-outline-variant rounded-lg px-md py-2 text-body-sm focus:ring-primary focus:border-primary bg-white cursor-pointer text-secondary font-medium"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            title="Page Size"
          >
            <option value={5}>Show: 5</option>
            <option value={10}>Show: 10</option>
            <option value={25}>Show: 25</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border-x border-b border-outline-variant rounded-b-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        
        {loading ? (
          /* SKELETON LOADING STATE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ width: '100%' }}>
              <thead>
                <tr className="bg-surface-container-low border-y border-outline-variant">
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Hospital Name</th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Tenant ID</th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Country</th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">City</th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Plan</th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Expiry Date</th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Created</th>
                  <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className="border-b border-outline-variant">
                    <td className="px-lg py-md">
                      <div className="h-4 w-40 bg-surface-container-highest rounded animate-pulse" />
                    </td>
                    <td className="px-lg py-md">
                      <div className="h-4 w-20 bg-surface-container-highest rounded animate-pulse" />
                    </td>
                    <td className="px-lg py-md">
                      <div className="h-4 w-20 bg-surface-container-highest rounded animate-pulse" />
                    </td>
                    <td className="px-lg py-md">
                      <div className="h-4 w-24 bg-surface-container-highest rounded animate-pulse" />
                    </td>
                    <td className="px-lg py-md">
                      <div className="h-6 w-16 bg-surface-container-highest rounded-full animate-pulse" />
                    </td>
                    <td className="px-lg py-md">
                      <div className="h-4 w-20 bg-surface-container-highest rounded animate-pulse" />
                    </td>
                    <td className="px-lg py-md">
                      <div className="h-4 w-24 bg-surface-container-highest rounded animate-pulse" />
                    </td>
                    <td className="px-lg py-md">
                      <div className="h-4 w-24 bg-surface-container-highest rounded animate-pulse" />
                    </td>
                    <td className="px-lg py-md text-right">
                      <div className="h-8 w-8 bg-surface-container-highest rounded-full ml-auto animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : paginatedTenants.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center py-16 px-4 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[48px] mb-md">local_hospital</span>
            <h4 className="text-headline-sm font-bold text-on-surface mb-xs">No Hospitals Found</h4>
            <p className="text-secondary text-body-sm max-w-sm mb-lg">
              We couldn't find any onboarded hospital tenants matching your current filters or search query.
            </p>
            {(search || statusFilter !== 'all' || countryFilter !== 'all' || planFilter !== 'all') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setCountryFilter('all')
                  setPlanFilter('all')
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          /* POPULATED STATE */
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-y border-outline-variant">
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Hospital Name</th>
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Tenant ID</th>
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Country</th>
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">City</th>
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Plan</th>
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Expiry Date</th>
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider">Created</th>
                    <th className="px-lg py-md font-label-md text-label-md text-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {paginatedTenants.map((t) => {
                    const expiryStr = t.subscription_end 
                      ? new Date(t.subscription_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Continuous';
                    const createdStr = t.created_at
                      ? new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'N/A';

                    return (
                      <tr 
                        key={t.tenant_id} 
                        className="hover:bg-primary-fixed/10 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/master/tenants/${t.tenant_id}`)}
                      >
                        <td className="px-lg py-md font-bold text-on-surface">
                          {t.hospital_name}
                        </td>
                        <td className="px-lg py-md text-body-sm font-mono text-secondary">
                          {t.tenant_id}
                        </td>
                        <td className="px-lg py-md text-body-sm">
                          {t.country || '-'}
                        </td>
                        <td className="px-lg py-md text-body-sm">
                          {t.city || '-'}
                        </td>
                        <td className="px-lg py-md">
                          <span className={getStatusBadgeClass(t.status)}>{t.status}</span>
                        </td>
                        <td className="px-lg py-md text-body-sm font-medium">
                          {t.subscription_plan || 'Basic'}
                        </td>
                        <td className="px-lg py-md text-body-sm">
                          {expiryStr}
                        </td>
                        <td className="px-lg py-md text-body-sm text-secondary">
                          {createdStr}
                        </td>
                        <td 
                          className="px-lg py-md text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="text-secondary hover:text-primary p-xs rounded-full hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center w-8 h-8 ml-auto"
                            title="More actions"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (activeDropdown === t.tenant_id) {
                                setActiveDropdown(null)
                                setDropdownCoords(null)
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const dropdownHeight = 160
                                const goesOffBottom = rect.bottom + dropdownHeight > window.innerHeight
                                
                                setActiveDropdown(t.tenant_id)
                                setDropdownCoords({
                                  top: goesOffBottom ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
                                  right: window.innerWidth - rect.right,
                                })
                              }
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                            <span className="sr-only">⋮</span>
                          </button>

                          {activeDropdown === t.tenant_id && dropdownCoords && createPortal(
                            <>
                              <div
                                style={{
                                  position: 'fixed',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  zIndex: 999,
                                  background: 'transparent',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveDropdown(null)
                                  setDropdownCoords(null)
                                }}
                              />
                              <div
                                className="dropdown-menu-wrapper"
                                style={{
                                  position: 'fixed',
                                  top: `${dropdownCoords.top}px`,
                                  right: `${dropdownCoords.right}px`,
                                  zIndex: 1000,
                                  margin: 0,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="dropdown-item-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/master/tenants/${t.tenant_id}`)
                                    setActiveDropdown(null)
                                    setDropdownCoords(null)
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                  <span className="material-symbols-outlined text-[16px]">info</span> View details
                                </button>
                                
                                <div className="dropdown-menu-divider" />

                                {t.status === 'active' && (
                                  <button
                                    className="dropdown-item-btn"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleImpersonate(t)
                                      setActiveDropdown(null)
                                      setDropdownCoords(null)
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">login</span> Impersonate
                                  </button>
                                )}
                                {t.status === 'active' && (
                                  <button
                                    className="dropdown-item-btn"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedTenantForSuspend(t)
                                      setActiveDropdown(null)
                                      setDropdownCoords(null)
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">pause</span> Suspend
                                  </button>
                                )}
                                {t.status === 'suspended' && (
                                  <button
                                    className="dropdown-item-btn"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateStatus(t.tenant_id, 'active')
                                      setActiveDropdown(null)
                                      setDropdownCoords(null)
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">play_arrow</span> Unsuspend
                                  </button>
                                )}
                              </div>
                            </>,
                            document.body
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-md bg-surface-bright flex items-center justify-between border-t border-outline-variant">
              <span className="font-body-sm text-body-sm text-secondary">
                Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
                <strong>{totalItems}</strong> entries
              </span>
              <div className="flex gap-xs">
                <button
                  className="px-sm py-xs border border-outline-variant rounded bg-surface-container-lowest text-outline font-body-sm flex items-center justify-center min-w-[32px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">chevron_left</span>
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`px-sm py-xs border rounded font-body-sm font-medium ${currentPage === i + 1 ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-surface-container-lowest text-secondary hover:bg-surface-container-low'}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  className="px-sm py-xs border border-outline-variant rounded bg-surface-container-lowest text-outline font-body-sm flex items-center justify-center min-w-[32px] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>



      {/* SUSPEND TENANT MODAL */}
      <SuspendTenantModal
        isOpen={selectedTenantForSuspend !== null}
        onClose={() => setSelectedTenantForSuspend(null)}
        tenantId={selectedTenantForSuspend?.tenant_id || ''}
        tenantName={selectedTenantForSuspend?.hospital_name || ''}
        onSuccess={fetchTenants}
      />
    </>
  )
}

