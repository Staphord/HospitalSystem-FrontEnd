import type { Announcement } from '@/api/services/monitoring'

type Props = {
  announcement: Announcement | null
  onClose: () => void
  getAudienceLabel: (ann: Announcement) => string
  formatDateTime: (iso: string) => { dateStr: string; timeStr: string }
}

export function AnnouncementPreview({
  announcement,
  onClose,
  getAudienceLabel,
  formatDateTime
}: Props) {
  if (!announcement) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 transition-opacity duration-300">
      <div 
        className="absolute inset-0 bg-transparent" 
        onClick={onClose} 
      />
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full z-10 overflow-hidden flex flex-col border border-solid border-outline-variant relative">
        
        {/* Simulation Header Banner */}
        <div className="bg-primary text-white px-md py-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-xs">
          <span className="material-symbols-outlined text-[16px] font-bold">campaign</span>
          Tenant Broadcast Simulator
        </div>

        {/* Simulation Outer Shell */}
        <div className="p-lg bg-surface-container-lowest">
          <div className="bg-blue-50 border border-solid border-blue-200 rounded-lg p-md flex gap-md relative">
            <span className="material-symbols-outlined text-blue-600 text-[24px] font-bold mt-[2px]">info</span>
            <div className="flex-1">
              <h4 className="font-headline-sm text-headline-sm text-blue-900 m-0 font-semibold mb-1">
                {announcement.title}
              </h4>
              <p className="text-body-sm text-blue-800 m-0 whitespace-pre-wrap leading-relaxed">
                {announcement.body}
              </p>
              
              {/* Scope Details */}
              <div className="mt-md pt-sm border-0 border-t border-dotted border-blue-200 flex items-center justify-between text-xs text-blue-700">
                <span>Audience: {getAudienceLabel(announcement)}</span>
                <span>Starts: {formatDateTime(announcement.publish_at).dateStr}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulator Footer */}
        <div className="p-md bg-surface-bright border-0 border-t border-solid border-outline-variant flex justify-end">
          <button 
            type="button" 
            className="bg-secondary text-white border-0 hover:bg-on-secondary-fixed-variant px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors"
            onClick={onClose}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
