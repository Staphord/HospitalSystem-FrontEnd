import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

type Props = {
  isOpen: boolean
  title: string
  message: ReactNode
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  isLoading?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Delete',
  isLoading = false,
}: Props) {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-md bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        className="bg-surface-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col border border-solid border-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-lg py-lg flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3
              id="delete-confirmation-title"
              className="font-headline-sm text-headline-sm text-on-surface m-0 font-semibold"
            >
              {title}
            </h3>
          </div>

          <p className="font-body-sm text-body-sm text-secondary m-0">{message}</p>
        </div>

        <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex items-center justify-end gap-md">
          <button
            type="button"
            className="px-lg py-sm rounded border border-border-subtle text-secondary font-label-md hover:bg-surface-container transition-colors active:scale-95 bg-surface-white cursor-pointer disabled:opacity-60"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-lg py-sm rounded bg-error text-white font-label-md hover:bg-[#e03e1a] transition-all shadow-sm active:scale-95 border-0 cursor-pointer disabled:opacity-60"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
