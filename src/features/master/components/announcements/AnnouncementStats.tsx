export function AnnouncementStats({
  activeCount,
  scheduledCount,
  reachCount,
  expiredCount
}: {
  activeCount: number
  scheduledCount: number
  reachCount: number
  expiredCount: number
}) {
  return (
    <div className="grid grid-cols-1 gap-md mb-lg md:grid-cols-4">
      {/* Active Now Card */}
      <div className="bg-surface-container-lowest border border-solid border-outline-variant rounded-xl p-lg flex flex-col relative overflow-hidden">
        <div className="flex flex-col gap-1">
          <p className="font-label-md text-label-md text-secondary uppercase tracking-wider m-0">Active Now</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface m-0 mt-xs">{activeCount}</h3>
        </div>
        <div className="absolute top-lg right-lg w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-green-600 text-[24px] font-bold">sensors</span>
        </div>
      </div>

      {/* Scheduled Card */}
      <div className="bg-surface-container-lowest border border-solid border-outline-variant rounded-xl p-lg flex flex-col relative overflow-hidden">
        <div className="flex flex-col gap-1">
          <p className="font-label-md text-label-md text-secondary uppercase tracking-wider m-0">Scheduled</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface m-0 mt-xs">{scheduledCount}</h3>
        </div>
        <div className="absolute top-lg right-lg w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-600 text-[24px] font-bold">calendar_today</span>
        </div>
      </div>

      {/* Total Reach Card */}
      <div className="bg-surface-container-lowest border border-solid border-outline-variant rounded-xl p-lg flex flex-col relative overflow-hidden">
        <div className="flex flex-col gap-1">
          <p className="font-label-md text-label-md text-secondary uppercase tracking-wider m-0">Total Reach</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface m-0 mt-xs">{reachCount} Hospitals</h3>
        </div>
        <div className="absolute top-lg right-lg w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-purple-600 text-[24px] font-bold">group</span>
        </div>
      </div>

      {/* Expired Card */}
      <div className="bg-surface-container-lowest border border-solid border-outline-variant rounded-xl p-lg flex flex-col relative overflow-hidden">
        <div className="flex flex-col gap-1">
          <p className="font-label-md text-label-md text-secondary uppercase tracking-wider m-0">Expired</p>
          <h3 className="font-headline-lg text-headline-lg text-on-surface m-0 mt-xs">{expiredCount}</h3>
        </div>
        <div className="absolute top-lg right-lg w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant text-[24px] font-bold">history</span>
        </div>
      </div>
    </div>
  )
}
