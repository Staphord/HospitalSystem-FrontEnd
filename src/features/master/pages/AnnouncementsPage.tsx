import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { toast } from 'sonner'
import { monitoringService } from '@/api/services/monitoring'
import { masterService } from '@/api/services/master'
import type { Announcement, AnnouncementCreate } from '@/api/services/monitoring'
import type { Tenant } from '@/api/types/master'

import { AnnouncementStats } from '../components/announcements/AnnouncementStats'
import { AnnouncementTable } from '../components/announcements/AnnouncementTable'
import { AnnouncementDrawer } from '../components/announcements/AnnouncementDrawer'
import { AnnouncementPreview } from '../components/announcements/AnnouncementPreview'
import { DeleteConfirmationModal } from '../components/announcements/DeleteConfirmationModal'

export function AnnouncementsPage() {
  // Data States
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  // Filter / Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all')

  // Drawer / Form States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<'all' | 'selected'>('all')
  const [targetTenantIds, setTargetTenantIds] = useState<string[]>([])
  const [publishAt, setPublishAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Preview State
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null)
  
  // Delete Confirmation State
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)

  // Helper to format ISO to datetime-local format (YYYY-MM-DDThh:mm)
  const formatIsoToDatetimeLocal = (isoString?: string | null) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const pad = (num: number) => String(num).padStart(2, '0')
    const yyyy = date.getFullYear()
    const MM = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const mm = pad(date.getMinutes())
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
  }

  // Fetch announcements and tenants on mount
  const fetchData = async () => {
    try {
      setLoading(true)
      const [annData, tenantData] = await Promise.all([
        monitoringService.listAnnouncements(),
        masterService.listTenants()
      ])
      setAnnouncements(annData)
      setTenants(tenantData)
    } catch (err) {
      toast.error('Failed to load announcements or tenant list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate status of an announcement
  const getAnnouncementStatus = (ann: Announcement): 'active' | 'scheduled' | 'expired' => {
    const now = new Date()
    const pub = new Date(ann.publish_at)
    const exp = ann.expires_at ? new Date(ann.expires_at) : null

    if (pub > now) return 'scheduled'
    if (exp && exp < now) return 'expired'
    return 'active'
  }

  // Open drawer for creating a new announcement
  const handleOpenCreate = () => {
    setEditingId(null)
    setTitle('')
    setBody('')
    setAudience('all')
    setTargetTenantIds([])
    setPublishAt(formatIsoToDatetimeLocal(new Date().toISOString()))
    setExpiresAt('')
    setIsDrawerOpen(true)
  }

  // Open drawer for editing an announcement
  const handleOpenEdit = (ann: Announcement) => {
    setEditingId(ann.announcement_id)
    setTitle(ann.title)
    setBody(ann.body)
    setAudience(ann.audience)
    setTargetTenantIds(ann.target_tenant_ids || [])
    setPublishAt(formatIsoToDatetimeLocal(ann.publish_at))
    setExpiresAt(formatIsoToDatetimeLocal(ann.expires_at))
    setIsDrawerOpen(true)
  }

  // Handle Form Submission (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim() || !publishAt) {
      toast.error('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    const payload: AnnouncementCreate = {
      title,
      body,
      audience,
      target_tenant_ids: audience === 'selected' ? targetTenantIds : null,
      publish_at: new Date(publishAt).toISOString(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
    }

    try {
      if (editingId) {
        await monitoringService.updateAnnouncement(editingId, payload)
        toast.success('Announcement updated successfully!')
      } else {
        await monitoringService.createAnnouncement(payload)
        toast.success('Announcement broadcasted successfully!')
      }
      setIsDrawerOpen(false)
      fetchData()
    } catch (err) {
      toast.error(editingId ? 'Failed to update announcement.' : 'Failed to create announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Deactivation / Expiry
  const handleDeactivate = async (ann: Announcement) => {
    try {
      await monitoringService.updateAnnouncement(ann.announcement_id, {
        expires_at: new Date().toISOString()
      })
      toast.success('Announcement deactivated successfully.')
      fetchData()
    } catch (err) {
      toast.error('Failed to deactivate announcement.')
    }
  }

  // Handle Re-activation
  const handleActivate = async (ann: Announcement) => {
    try {
      await monitoringService.updateAnnouncement(ann.announcement_id, {
        publish_at: new Date().toISOString(),
        expires_at: null
      })
      toast.success('Announcement activated successfully.')
      fetchData()
    } catch (err) {
      toast.error('Failed to activate announcement.')
    }
  }

  // Handle Deletion
  const confirmDelete = async () => {
    if (!announcementToDelete) return
    try {
      await monitoringService.deleteAnnouncement(announcementToDelete)
      toast.success('Announcement deleted successfully.')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete announcement.')
    } finally {
      setAnnouncementToDelete(null)
    }
  }

  // Calculate Metrics
  const activeCount = announcements.filter(ann => getAnnouncementStatus(ann) === 'active').length
  const scheduledCount = announcements.filter(ann => getAnnouncementStatus(ann) === 'scheduled').length
  const expiredCount = announcements.filter(ann => getAnnouncementStatus(ann) === 'expired').length

  const activeAndScheduled = announcements.filter(ann => {
    const status = getAnnouncementStatus(ann)
    return status === 'active' || status === 'scheduled'
  })
  
  const reachedTenantIds = new Set<string>()
  let hasAllAudience = false

  activeAndScheduled.forEach(ann => {
    if (ann.audience === 'all') {
      hasAllAudience = true
    } else if (ann.target_tenant_ids) {
      ann.target_tenant_ids.forEach(id => reachedTenantIds.add(id))
    }
  })

  const reachCount = hasAllAudience ? tenants.length : reachedTenantIds.size

  // Filter & Search List
  const filteredAnnouncements = announcements.filter(ann => {
    const status = getAnnouncementStatus(ann)
    const matchesStatus = statusFilter === 'all' || status === statusFilter
    const matchesSearch = 
      ann.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ann.body.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Helpers
  const getAudienceLabel = (ann: Announcement) => {
    if (ann.audience === 'all') return 'All Tenants'
    const count = ann.target_tenant_ids?.length || 0
    return `${count} Selected ${count === 1 ? 'Tenant' : 'Tenants'}`
  }

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const dateStr = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} Local`
    return { dateStr, timeStr }
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg">
        <div>
          <PageHeader
            title="Announcements & Broadcasts"
            description="Manage platform-wide communications, updates, and notices for all tenants."
          />
        </div>
        <button 
          className="bg-primary-container text-white hover:bg-on-primary-fixed-variant transition-colors font-label-md text-label-md px-md py-sm rounded-lg flex items-center gap-xs shadow-sm whitespace-nowrap h-10 border-0 cursor-pointer"
          onClick={handleOpenCreate}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Announcement
        </button>
      </div>

      {/* Stats Cards Grid */}
      <AnnouncementStats 
        activeCount={activeCount}
        scheduledCount={scheduledCount}
        reachCount={reachCount}
        expiredCount={expiredCount}
      />

      {/* Announcements Table Block */}
      <div className="bg-surface-container-lowest border border-solid border-outline-variant rounded-lg overflow-hidden flex flex-col">
        {/* Filters and Search toolbar */}
        <div className="p-md border-0 border-b border-solid border-outline-variant flex flex-col sm:flex-row gap-md items-center justify-between bg-surface-bright">
          <div className="relative grid items-center w-full sm:w-72">
  <span className="material-symbols-outlined absolute left-sm text-outline text-[18px] h-full flex items-center">
    search
  </span>
  <input 
    className="w-full pl-xl pr-sm py-sm rounded border border-solid border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-sm text-body-sm bg-surface-container-lowest" 
    placeholder="Search announcements..." 
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>
          <div className="flex gap-sm w-full sm:w-auto">
            <select 
              className="border border-solid border-outline-variant rounded px-sm py-sm font-body-sm text-body-sm bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container w-full sm:w-auto cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Now</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Table Body */}
        <AnnouncementTable 
          announcements={filteredAnnouncements}
          loading={loading}
          getAnnouncementStatus={getAnnouncementStatus}
          getAudienceLabel={getAudienceLabel}
          formatDateTime={formatDateTime}
          onPreview={setPreviewAnnouncement}
          onEdit={handleOpenEdit}
          onDeactivate={handleDeactivate}
          onActivate={handleActivate}
          onDelete={(id) => setAnnouncementToDelete(id)}
        />
      </div>

      <AnnouncementDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        editingId={editingId}
        title={title}
        setTitle={setTitle}
        body={body}
        setBody={setBody}
        audience={audience}
        setAudience={setAudience}
        tenants={tenants}
        targetTenantIds={targetTenantIds}
        setTargetTenantIds={setTargetTenantIds}
        publishAt={publishAt}
        setPublishAt={setPublishAt}
        expiresAt={expiresAt}
        setExpiresAt={setExpiresAt}
      />

      <AnnouncementPreview 
        announcement={previewAnnouncement}
        onClose={() => setPreviewAnnouncement(null)}
        getAudienceLabel={getAudienceLabel}
        formatDateTime={formatDateTime}
      />

      <DeleteConfirmationModal
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
