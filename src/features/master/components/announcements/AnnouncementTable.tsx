import type { Announcement } from '@/api/services/monitoring'

type Props = {
  announcements: Announcement[]
  loading: boolean
  getAnnouncementStatus: (ann: Announcement) => 'active' | 'scheduled' | 'expired'
  getAudienceLabel: (ann: Announcement) => string
  formatDateTime: (iso: string) => { dateStr: string; timeStr: string }
  onPreview: (ann: Announcement) => void
  onEdit: (ann: Announcement) => void
  onDeactivate: (ann: Announcement) => void
  onActivate: (ann: Announcement) => void
  onDelete: (id: string) => void
}

export function AnnouncementTable({
  announcements,
  loading,
  getAnnouncementStatus,
  getAudienceLabel,
  formatDateTime,
  onPreview,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="text-center py-20 text-secondary font-body-md">
        Loading announcements from platform server...
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-20 text-secondary font-body-md">
        No announcements found matching the criteria.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse m-0">
        <thead>
          <tr className="bg-surface-container-low border-0 border-b border-solid border-outline-variant">
            <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Title & Summary</th>
            <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Audience</th>
            <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Schedule</th>
            <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap">Status</th>
            <th className="p-md font-label-md text-label-md text-secondary whitespace-nowrap text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="font-body-sm text-body-sm text-on-surface">
          {announcements.map((ann) => {
            const status = getAnnouncementStatus(ann)
            const pubSched = formatDateTime(ann.publish_at)
            return (
              <tr key={ann.announcement_id} className="border-0 border-b border-solid border-outline-variant hover:bg-row-hover transition-colors group">
                <td className="p-md max-w-xs sm:max-w-md">
                  <div className="font-medium text-primary-fixed-variant group-hover:text-primary-container truncate mb-1">
                    {ann.title}
                  </div>
                  <div className="text-xs text-secondary line-clamp-1">
                    {ann.body}
                  </div>
                </td>
                <td className="p-md text-secondary whitespace-nowrap">{getAudienceLabel(ann)}</td>
                <td className="p-md text-secondary whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-medium">{pubSched.dateStr}</span>
                    <span className="text-xs text-outline">{pubSched.timeStr}</span>
                  </div>
                </td>
                <td className="p-md whitespace-nowrap">
                  {status === 'active' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E3FCEF] text-[#006644] font-label-sm text-label-sm border border-solid border-[#006644]/20">
                      Active
                    </span>
                  )}
                  {status === 'scheduled' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#DEEBFF] text-[#0052CC] font-label-sm text-label-sm border border-solid border-[#0052CC]/20">
                      Scheduled
                    </span>
                  )}
                  {status === 'expired' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFEFEF] text-[#CC0000] font-label-sm text-label-sm border border-solid border-[#CC0000]/20">
                      Expired
                    </span>
                  )}
                </td>
                <td className="p-md text-right whitespace-nowrap">
                  <div className="flex justify-end gap-xs">
                    {/* Preview Button */}
                    <button 
                      className="text-secondary hover:text-primary-container p-xs rounded hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center" 
                      title="Preview Notification"
                      onClick={() => onPreview(ann)}
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>

                    {/* Edit Button */}
                    <button 
                      className="text-secondary hover:text-primary-container p-xs rounded hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center" 
                      title="Edit Details"
                      onClick={() => onEdit(ann)}
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>

                    {/* Toggle Active / Expire state */}
                    {status === 'active' ? (
                      <button 
                        className="text-secondary hover:text-warning p-xs rounded hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center" 
                        title="Deactivate Notice"
                        onClick={() => onDeactivate(ann)}
                      >
                        <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                      </button>
                    ) : (
                      <button 
                        className="text-secondary hover:text-success p-xs rounded hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center" 
                        title="Activate Notice"
                        onClick={() => onActivate(ann)}
                      >
                        <span className="material-symbols-outlined text-[18px]">play_circle</span>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button 
                      className="text-secondary hover:text-error p-xs rounded hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer flex items-center" 
                      title="Delete Permanently"
                      onClick={() => onDelete(ann.announcement_id)}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
