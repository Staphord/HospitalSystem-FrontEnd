import { useCallback, useEffect, useRef, useState } from 'react'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'
import { useAssistantChat } from '@/features/assistant/hooks/useAssistantChat'
import { useDraggableLauncher } from '@/features/assistant/hooks/useDraggableLauncher'
import { LAUNCHER_MARGIN_PX, LAUNCHER_SIZE_PX } from '@/features/assistant/lib/launcherPosition'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES } from '@/lib/roles'

/**
 * Roles permitted to use operational chat.
 *
 * Mirrors the server matrix in report-service (app/assistant/permissions.py).
 * The server is the authority: this gate only avoids showing staff a control
 * that would be refused. A platform super admin is excluded here and denied
 * there, because super admins administer tenants and must never read tenant
 * content.
 */
const ASSISTANT_ROLES: string[] = [
  ROLES.hospitalAdmin,
  ROLES.receptionist,
  ROLES.triageNurse,
  ROLES.wardNurse,
  ROLES.doctor,
  ROLES.labTechnician,
  ROLES.radiographer,
  ROLES.pharmacist,
  ROLES.cashier,
]

/**
 * The floating assistant launcher.
 *
 * Mounted once by HospitalLayout, never per page. It is draggable, keyboard
 * operable, and remembers only where the user parked it.
 */
export function AssistantLauncher() {
  const { isAuthenticated, isReadOnly } = useAuth()
  const { hasAnyRole, isSuperAdmin } = usePermissions()

  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const chat = useAssistantChat()
  const drag = useDraggableLauncher()

  const close = useCallback(() => {
    setIsOpen(false)
    chat.cancel()
    // Focus returns to the control that opened the panel, so keyboard users are
    // not dropped at the top of the document.
    buttonRef.current?.focus()
  }, [chat])

  // Escape closes the panel from anywhere inside it.
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  const allowed = isAuthenticated && !isSuperAdmin() && hasAnyRole(ASSISTANT_ROLES)

  // A read-only impersonation session is refused by the server, so the control
  // is not offered rather than being offered and always failing.
  if (!allowed || isReadOnly) return null

  // The deployment has the capability switched off. Stop offering the launcher
  // for the rest of the session instead of leaving a button that cannot work.
  if (chat.isCapabilityDisabled) return null

  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
  const panelBottom = Math.max(
    LAUNCHER_MARGIN_PX,
    (typeof window === 'undefined' ? 0 : window.innerHeight) -
      drag.position.y +
      LAUNCHER_MARGIN_PX / 2,
  )
  const panelLeft = Math.max(
    LAUNCHER_MARGIN_PX,
    Math.min(drag.position.x, viewportWidth - 384 - LAUNCHER_MARGIN_PX),
  )

  return (
    <>
      {isOpen && (
        <div
          className="fixed z-50"
          style={{ left: `${panelLeft}px`, bottom: `${panelBottom}px` }}
        >
          <AssistantPanel chat={chat} onClose={close} />
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        aria-label={isOpen ? 'Close hospital assistant' : 'Open hospital assistant'}
        aria-expanded={isOpen}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
        onClick={() => {
          // A press that turned into a drag must not also toggle the panel.
          if (drag.consumeDragSuppression()) return
          setIsOpen((open) => !open)
        }}
        style={{
          left: `${drag.position.x}px`,
          top: `${drag.position.y}px`,
          width: `${LAUNCHER_SIZE_PX}px`,
          height: `${LAUNCHER_SIZE_PX}px`,
          touchAction: 'none',
          cursor: drag.isDragging ? 'grabbing' : 'grab',
        }}
        className="fixed z-50 flex items-center justify-center rounded-full bg-primary text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>
          {isOpen ? 'close' : 'support_agent'}
        </span>
      </button>
    </>
  )
}
