import { useEffect, useRef, useState } from 'react'
import { getMenuActions } from '@/features/radiology/utils/imagingRequestUtils'
import type { ImagingRequestSecondaryAction } from '@/features/radiology/utils/imagingRequestUtils'
import { ModalityBadge } from '@/features/radiology/components/ModalityBadge'
import { ImagingStatusBadge } from '@/features/radiology/components/ImagingStatusBadge'
import type { ImagingRequest } from '@/features/radiology/types/radiology'

interface ImagingRequestsTableProps {
  requests: ImagingRequest[]
  onSecondaryAction: (request: ImagingRequest, action: ImagingRequestSecondaryAction) => void
}

export function ImagingRequestsTable({ requests, onSecondaryAction }: ImagingRequestsTableProps) {
  return (
    <table className="w-full border-collapse min-w-[1100px]">
      <thead>
        <tr className="bg-background">
          <th className="px-lg py-3 text-left text-label-md font-label-md text-secondary uppercase tracking-wider">
            Patient Name
          </th>
          <th className="px-md py-3 text-left text-label-md font-label-md text-secondary uppercase tracking-wider">
            Patient #
          </th>
          <th className="px-md py-3 text-left text-label-md font-label-md text-secondary uppercase tracking-wider">
            Modality
          </th>
          <th className="px-md py-3 text-left text-label-md font-label-md text-secondary uppercase tracking-wider">
            Body Part
          </th>
          <th className="px-md py-3 text-left text-label-md font-label-md text-secondary uppercase tracking-wider">
            Clinical Indication
          </th>
          <th className="px-md py-3 text-left text-label-md font-label-md text-secondary uppercase tracking-wider">
            Requested By
          </th>
          <th className="px-md py-3 text-left text-label-md font-label-md text-secondary uppercase tracking-wider">
            Time
          </th>
          <th className="px-md py-3 text-center text-label-md font-label-md text-secondary uppercase tracking-wider">
            Status
          </th>
          <th className="px-lg py-3 text-center text-label-md font-label-md text-secondary uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-subtle">
        {requests.map((request) => (
          <ImagingRequestRow
            key={request.id}
            request={request}
            onSecondaryAction={onSecondaryAction}
          />
        ))}
      </tbody>
    </table>
  )
}

function ImagingRequestRow({
  request,
  onSecondaryAction,
}: {
  request: ImagingRequest
  onSecondaryAction: (request: ImagingRequest, action: ImagingRequestSecondaryAction) => void
}) {
  const menuItems = getMenuActions(request)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <tr className="hover:bg-primary/5 transition-colors group">
      <td className="px-lg py-4 font-medium text-on-background">{request.patientName}</td>
      <td className="px-md py-4 text-body-sm text-secondary">{request.patientNumber}</td>
      <td className="px-md py-4">
        <ModalityBadge modality={request.modality} />
      </td>
      <td className="px-md py-4 text-body-sm">{request.bodyPart}</td>
      <td
        className="px-md py-4 text-body-sm italic truncate max-w-[150px]"
        title={request.clinicalIndication}
      >
        {request.clinicalIndication}
      </td>
      <td className="px-md py-4 text-body-sm">{request.requestedBy}</td>
      <td className="px-md py-4 text-body-sm">{request.requestedAt}</td>
      <td className="px-md py-4 text-center">
        <ImagingStatusBadge status={request.status} />
      </td>
      <td className="px-lg py-4 text-center">
        <div className="relative inline-block" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center justify-center bg-transparent border-0 cursor-pointer text-secondary hover:text-on-surface transition-colors mx-auto p-1"
            aria-label="Actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-surface-white border border-border-subtle rounded-xl shadow-lg overflow-hidden min-w-[190px]">
              {menuItems.map((item, idx) => (
                <div key={item.action}>
                  {/* Divider before danger zone */}
                  {item.danger && idx > 0 && <div className="h-px bg-border-subtle mx-3" />}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onSecondaryAction(request, item.action)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-0 bg-transparent cursor-pointer ${
                      item.danger
                        ? 'text-error hover:bg-error/5'
                        : item.primary
                          ? 'text-primary font-semibold hover:bg-primary/5'
                          : 'text-on-surface hover:bg-surface-container-low'
                    } text-label-md`}
                  >
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        item.danger
                          ? 'text-error'
                          : item.primary
                            ? 'text-primary'
                            : 'text-secondary'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
