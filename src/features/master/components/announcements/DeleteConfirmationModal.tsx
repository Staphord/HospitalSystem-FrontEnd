type Props = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 transition-opacity duration-300">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full z-10 overflow-hidden flex flex-col border border-solid border-outline-variant relative p-lg gap-md animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 font-semibold">Delete Announcement</h3>
        </div>
        
        <p className="font-body-sm text-body-sm text-secondary m-0">
          Are you sure you want to permanently delete this announcement? This action cannot be undone.
        </p>

        <div className="flex gap-md justify-end mt-sm">
          <button 
            type="button" 
            className="bg-transparent border border-solid border-outline-variant text-secondary hover:bg-surface-container px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="bg-error text-white border-0 hover:bg-error/90 px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors shadow-sm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
