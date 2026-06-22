interface TriageVisitNotFoundProps {
  visitId?: string
  onBack: () => void
  backLabel?: string
}

export function TriageVisitNotFound({
  visitId,
  onBack,
  backLabel = 'Back to Triage Queue',
}: TriageVisitNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-xl px-md min-h-[min(520px,70vh)]">
      <div className="w-full max-w-lg bg-surface-white border border-border-subtle rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col items-center text-center px-xl pt-xl pb-lg">
          <div className="relative mb-lg">
            <div className="absolute inset-0 bg-warning/10 rounded-full scale-150" />
            <div className="relative w-20 h-20 rounded-full bg-warning/15 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[44px] text-warning"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                assignment_late
              </span>
            </div>
          </div>

          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface m-0 mb-sm">
            Visit not found
          </h2>
          <p className="font-body-md text-body-md text-outline max-w-md leading-relaxed m-0 mb-md">
            This patient is not in the triage queue, or the visit may already have been assessed and
            moved to the doctor queue.
          </p>

          {visitId && (
            <span className="inline-flex items-center gap-xs font-label-md text-label-md text-secondary bg-surface-container-low px-md py-xs rounded-full mb-lg">
              <span className="material-symbols-outlined text-[16px]">tag</span>
              {visitId}
            </span>
          )}

          <ul className="w-full max-w-sm text-left space-y-sm mb-xl">
            <li className="flex items-start gap-sm font-body-sm text-body-sm text-secondary">
              <span className="material-symbols-outlined text-[18px] text-outline shrink-0 mt-px">
                check_circle
              </span>
              Confirm the patient is still listed under Triage Queue
            </li>
            <li className="flex items-start gap-sm font-body-sm text-body-sm text-secondary">
              <span className="material-symbols-outlined text-[18px] text-outline shrink-0 mt-px">
                refresh
              </span>
              Refresh the queue if they were just registered at reception
            </li>
          </ul>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-sm bg-primary-container text-on-primary px-lg h-10 rounded-lg font-label-md text-label-md hover:bg-primary active:scale-[0.98] transition-all border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            {backLabel}
          </button>
        </div>

        <div className="px-xl py-md bg-surface-container-lowest border-t border-border-subtle text-center">
          <p className="font-body-sm text-body-sm text-outline m-0">
            Need help? Contact reception if the patient should be in queue.
          </p>
        </div>
      </div>
    </div>
  )
}
