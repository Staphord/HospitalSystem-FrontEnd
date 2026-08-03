import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

type Props = {
  isOpen: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function AdminModal({ isOpen, title, onClose, children }: Props) {
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
        aria-labelledby="admin-modal-title"
        className="bg-surface-white w-full max-w-[420px] rounded-xl shadow-2xl overflow-hidden border border-solid border-border-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
          <h3
            id="admin-modal-title"
            className="font-headline-sm text-[18px] font-semibold text-on-surface m-0"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-xs hover:bg-surface-container-low rounded-full transition-colors text-outline bg-transparent border-0 cursor-pointer flex items-center justify-center"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

type FooterProps = {
  children: ReactNode
}

export function AdminModalFooter({ children }: FooterProps) {
  return (
    <div className="px-lg py-md bg-surface-container-low border-t border-border-subtle flex items-center justify-end gap-md">
      {children}
    </div>
  )
}

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  variant?: 'secondary' | 'primary'
}

export function AdminModalButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'secondary',
}: ButtonProps) {
  if (variant === 'primary') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="px-lg py-sm rounded bg-primary-container text-white font-label-md hover:bg-[#0040a2] transition-all shadow-sm active:scale-95 border-0 cursor-pointer disabled:opacity-60"
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="px-lg py-sm rounded border border-border-subtle text-secondary font-label-md hover:bg-surface-container transition-colors active:scale-95 bg-surface-white cursor-pointer disabled:opacity-60"
    >
      {children}
    </button>
  )
}
