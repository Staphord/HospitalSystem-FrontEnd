import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ModalityBadge } from '@/features/radiology/components/ModalityBadge'
import {
  getDemoCurrentImages,
  getDemoPriorStudies,
  ImagingComparisonPanel,
} from '@/features/radiology/components/ImagingComparisonPanel'
import {
  getImagingRequestById,
  patchImagingRequest,
} from '@/features/radiology/utils/imagingRequestStore'
import { MODALITY_LABELS } from '@/features/radiology/utils/imagingRequestUtils'
import type { ReportAttachment } from '@/features/radiology/types/radiology'

const DEMO_ATTACHMENT: ReportAttachment = {
  id: 'att-1',
  fileName: 'chest_xray_final.png',
  fileSize: '4.2 MB',
}

export function ImagingReportContent() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()

  // Always read from store so we get the latest persisted state
  const request = requestId ? getImagingRequestById(requestId) : undefined

  const [findings, setFindings] = useState(request?.findings ?? '')
  const [impression, setImpression] = useState(request?.impression ?? '')
  const [attachments, setAttachments] = useState<ReportAttachment[]>(
    request?.modality === 'x-ray' && request.bodyPart === 'Chest' ? [DEMO_ATTACHMENT] : [],
  )
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [comparisonOpen, setComparisonOpen] = useState(false)

  // Auto-set to in-progress when radiographer opens for the first time
  const markedInProgress = useRef(false)
  useEffect(() => {
    if (!request || markedInProgress.current) return
    if (request.status === 'requested' || request.status === 'scheduled') {
      patchImagingRequest(request.id, { status: 'in-progress' })
    }
    markedInProgress.current = true
  }, [request])

  const isReadOnly = request?.status === 'complete'

  useEffect(() => {
    if (!request) return
    setFindings(request.findings ?? '')
    setImpression(request.impression ?? '')
    setAttachments(
      request.modality === 'x-ray' && request.bodyPart === 'Chest' ? [DEMO_ATTACHMENT] : [],
    )
  }, [requestId])

  if (!requestId || !request) {
    return <Navigate to="/radiology/requests" replace />
  }

  const modalityLabel = MODALITY_LABELS[request.modality]
  const breadcrumbLabel = `Report — ${request.patientNumber} ${request.patientName} — ${modalityLabel}`
  const priorStudies = getDemoPriorStudies(request.modality, request.bodyPart)
  const currentImages = getDemoCurrentImages(request.modality, request.bodyPart)
  const hasPriorImaging = priorStudies.length > 0

  const handleSaveDraft = () => {
    patchImagingRequest(request.id, { findings, impression })
    setLastSaved('just now')
    toast.success('Draft saved — your findings are preserved.')
  }

  const handleSubmit = () => {
    if (!findings.trim() && !impression.trim()) {
      toast.error('Please enter findings or impression before submitting.')
      return
    }
    patchImagingRequest(request.id, { status: 'complete', findings, impression })
    toast.success(`Report submitted. ${request.requestedBy} has been notified.`)
    navigate('/radiology/requests')
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleUploadClick = () => {
    toast.info('Image upload will be available when radiology API is connected.')
  }

  return (
    <div className="max-w-container-max mx-auto w-full pb-28">
      <nav className="flex items-center gap-2 mb-lg" aria-label="Breadcrumb">
        <Link
          to="/radiology/requests"
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary no-underline"
        >
          Imaging Requests
        </Link>
        <span className="material-symbols-outlined text-sm text-on-surface-variant">chevron_right</span>
        <span className="font-label-md text-label-md text-on-surface-variant">{breadcrumbLabel}</span>
      </nav>

      <div className="grid grid-cols-12 gap-gutter">
        <div className="col-span-12 bg-surface border border-border-subtle rounded-xl p-lg flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm m-0">{request.patientName}</h3>
                <span className="font-label-sm text-label-sm bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant">
                  {request.patientNumber}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
                {request.age} / {request.sex}
              </p>
            </div>
          </div>

          <div className="h-10 w-px bg-border-subtle hidden md:block" />

          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Modality
            </span>
            <div className="mt-1">
              <ModalityBadge modality={request.modality} />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Body Part
            </span>
            <span className="font-body-md text-body-md font-semibold mt-1">{request.bodyPart}</span>
          </div>

          <div className="flex flex-col max-w-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Clinical Indication
            </span>
            <span className="font-body-md text-body-md mt-1 truncate">{request.clinicalIndication}</span>
          </div>

          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Requested By
            </span>
            <span className="font-body-md text-body-md font-semibold mt-1">{request.requestedBy}</span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm m-0">Radiology Report</h3>
              {!isReadOnly && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">history</span>
                  <span className="font-label-sm text-label-sm">Autosaved {lastSaved}</span>
                </div>
              )}
            </div>

            <div className="p-lg space-y-lg">
              <div className="flex flex-col gap-2">
                <label htmlFor="findings" className="font-label-md text-label-md text-on-surface flex items-center gap-2">
                  Findings
                  <span className="material-symbols-outlined text-sm text-primary">info</span>
                </label>
                <textarea
                  id="findings"
                  value={findings}
                  disabled={isReadOnly}
                  onChange={(e) => setFindings(e.target.value)}
                  className="w-full border border-border-subtle rounded-lg p-3 text-body-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline disabled:bg-surface-container-low"
                  placeholder="Enter clinical findings here..."
                  rows={8}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="impression" className="font-label-md text-label-md text-on-surface">
                  Impression
                </label>
                <textarea
                  id="impression"
                  value={impression}
                  disabled={isReadOnly}
                  onChange={(e) => setImpression(e.target.value)}
                  className="w-full border border-border-subtle rounded-lg p-3 text-body-sm font-semibold focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-outline disabled:bg-surface-container-low"
                  placeholder="Enter final clinical impression..."
                  rows={4}
                />
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <label className="font-label-md text-label-md text-on-surface mb-3 block">
                  Image/Scan Attachment
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      className="border-2 border-dashed border-border-subtle rounded-xl p-6 flex flex-col items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer group"
                    >
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary transition-colors">
                        cloud_upload
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant m-0">
                        Upload image or scanned report
                      </p>
                      <span className="font-label-sm text-label-sm text-outline m-0">
                        PNG, JPG, DICOM up to 20MB
                      </span>
                    </button>
                  )}

                  <div className="flex flex-col gap-3">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="bg-surface-container border border-border-subtle rounded-lg px-4 py-3 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">image</span>
                          <div>
                            <p className="font-label-md text-label-md truncate max-w-[150px] m-0">
                              {file.fileName}
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant m-0">
                              {file.fileSize} • Uploaded
                            </p>
                          </div>
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error-container text-on-surface-variant hover:text-error transition-all border-0 bg-transparent cursor-pointer"
                            aria-label={`Remove ${file.fileName}`}
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>
                    ))}
                    {!isReadOnly && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant px-2 italic m-0">
                        Add up to 4 clinical images to this report.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-gutter">
          <div className="bg-primary-container text-on-primary-container rounded-xl p-lg relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <h4 className="font-headline-sm text-headline-sm mb-2 m-0">Previous Imaging</h4>
              <p className="font-body-sm text-body-sm text-on-primary-container/80 mb-4 m-0">
                {hasPriorImaging
                  ? `Patient has ${priorStudies.length} previous ${request.bodyPart} ${modalityLabel}${priorStudies.length > 1 ? 's' : ''} on file.`
                  : 'No prior imaging records on file for this study.'}
              </p>
              <button
                type="button"
                onClick={() => setComparisonOpen(true)}
                disabled={!hasPriorImaging}
                className="bg-surface-bright text-primary px-4 py-2 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:bg-white transition-colors border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                View Comparison
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px]">radiology</span>
            </div>
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <footer className="fixed bottom-16 lg:bottom-0 left-0 lg:left-[240px] right-0 bg-surface border-t border-border-subtle px-lg py-4 flex flex-col sm:flex-row items-center justify-between gap-md z-40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="font-label-md text-label-md text-on-surface-variant">
              {lastSaved ? `Draft saved ${lastSaved}` : 'Unsaved changes — remember to save draft'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-6 py-[10px] rounded-lg border border-secondary text-secondary font-label-md text-label-md hover:bg-surface-container transition-colors bg-transparent cursor-pointer"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 h-10 rounded-lg bg-primary-container text-white font-label-md text-label-md flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm border-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              Submit Report &amp; Notify Doctor
            </button>
          </div>
        </footer>
      )}

      <ImagingComparisonPanel
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        patientName={request.patientName}
        patientNumber={request.patientNumber}
        modality={request.modality}
        bodyPart={request.bodyPart}
        currentStudyLabel={`Today — ${modalityLabel} ${request.bodyPart}`}
        currentImages={currentImages}
        priorStudies={priorStudies}
      />
    </div>
  )
}
