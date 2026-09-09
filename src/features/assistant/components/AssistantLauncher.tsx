import { useCallback, useEffect, useRef, useState } from 'react'
import { AssistantPanel } from '@/features/assistant/components/AssistantPanel'
import { useAssistantChat } from '@/features/assistant/hooks/useAssistantChat'
import { useAssistantStatus } from '@/features/assistant/hooks/useAssistantStatus'
import { useDraggableLauncher } from '@/features/assistant/hooks/useDraggableLauncher'
import { LAUNCHER_MARGIN_PX, LAUNCHER_SIZE_PX } from '@/features/assistant/lib/launcherPosition'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES } from '@/lib/roles'

/**
 * Roles permitted to use operational chat.
 *
 * Mirrors the server matrix in report-service (app/assistant/permissions.py).
 * The server is the authority: this list only avoids sending a status request
 * for a session that could not use the assistant whatever the answer. A
 * platform super admin is excluded here and denied there, because super admins
 * administer tenants and must never read tenant content.
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

  // Worth asking the server about at all. A read-only impersonation session and
  // a platform super admin are refused by every assistant route, so neither is
  // asked.
  const couldUseAssistant =
    isAuthenticated && !isReadOnly && !isSuperAdmin() && hasAnyRole(ASSISTANT_ROLES)

  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const status = useAssistantStatus(couldUseAssistant)
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

  if (!couldUseAssistant) return null

  // Nothing is drawn until the server has answered. Rendering the button first
  // and withdrawing it on the answer would put a control on screen that
  // disappears under the user's cursor.
  if (status.isLoading) return null

  // The deployment has the assistant switched off, or this user's roles reach
  // none of it. Either way there is no launcher, rather than a button that
  // answers 404 the first time somebody presses it.
  if (!status.isEnabled) return null

  // Switched off while the session was open - the answer to a question came
  // back as an absent capability. Stop offering the launcher for the rest of
  // the session.
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
