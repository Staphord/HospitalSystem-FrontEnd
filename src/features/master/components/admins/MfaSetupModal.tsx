interface MfaSetupModalProps {
  mfaQrCode: string | null
  mfaUsername: string
  onClose: () => void
}

export function MfaSetupModal({ mfaQrCode, mfaUsername, onClose }: MfaSetupModalProps) {
  if (!mfaQrCode) return null

  const secret = mfaQrCode.split('secret=')[1]?.split('&')[0] || ''

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-md bg-black/50 transition-opacity duration-300">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full z-10 overflow-hidden flex flex-col border border-solid border-outline-variant relative">
        <div className="p-md border-0 border-b border-solid border-outline-variant flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface m-0 font-semibold">MFA Required</h3>
          <button 
            type="button"
            className="text-secondary hover:text-on-surface p-1 rounded-full bg-transparent border-0 cursor-pointer flex items-center justify-center hover:bg-surface-container"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="p-lg text-center flex flex-col items-center">
          <p className="text-body-sm text-secondary m-0 mb-lg">
            Multi-Factor Authentication (MFA) is strictly enforced. Please scan this QR code using Google Authenticator or Microsoft Authenticator for <strong>{mfaUsername}</strong>.
          </p>

          {/* Styled mock QR Code box */}
          <div className="mb-lg p-2 border border-solid border-outline-variant rounded-lg bg-white inline-flex flex-col items-center justify-center shadow-sm">
            <svg width="150" height="150" viewBox="0 0 29 29">
              <path d="M0,0h7v7h-7z M2,2v3h3v-3z" fill="#000" />
              <path d="M22,0h7v7h-7z M24,2v3h3v-3z" fill="#000" />
              <path d="M0,22h7v7h-7z M2,24v3h3v-3z" fill="#000" />
              <path d="M9,0h2v2h-2z M13,0h2v3h-2z M17,0h3v2h-3z M9,4h3v2h-3z M15,4h2v2h-2z M19,4h2v2h-2z M9,8h2v2h-2z" fill="#000" />
              <path d="M14,8h3v3h-3z M19,8h2v2h-2z M25,8h4v2h-4z M9,12h2v4h-2z M13,12h4v2h-4z M22,12h3v2h-3z M27,12h2v2h-2z" fill="#000" />
              <path d="M12,16h3v3h-3z M18,16h4v2h-4z M25,16h2v3h-2z M9,21h3v2h-3z M14,21h2v3h-2z M21,21h4v2h-4z" fill="#000" />
              <path d="M9,25h4v4h-4z M15,25h3v2h-3z M22,25h2v2h-2z M26,25h3v4h-3z" fill="#000" />
            </svg>
            <div className="text-[10px] text-outline font-mono mt-1 w-full overflow-hidden text-ellipsis whitespace-nowrap px-2 text-center" title={secret}>
              SECRET: {secret}
            </div>
          </div>

          <div className="text-xs bg-[#E3FCEF] text-[#006644] px-sm py-1.5 rounded-md border border-solid border-[#006644]/20 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            TOTP Secret Provisioned
          </div>
        </div>

        <div className="p-md bg-surface-bright border-0 border-t border-solid border-outline-variant">
          <button
            type="button"
            className="w-full bg-primary text-white border-0 hover:bg-on-primary-fixed-variant px-md py-sm rounded-lg font-label-md text-label-md cursor-pointer transition-colors shadow-sm"
            onClick={onClose}
          >
            I have scanned the QR code
          </button>
        </div>
      </div>
    </div>
  )
}
