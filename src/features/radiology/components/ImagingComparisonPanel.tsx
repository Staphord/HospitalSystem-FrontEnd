import { useEffect, useState } from 'react'
import type { ImagingModality } from '@/features/radiology/types/radiology'
import { MODALITY_LABELS } from '@/features/radiology/utils/imagingRequestUtils'

export interface StudyImage {
  id: string
  label: string
}

export interface PriorStudy {
  id: string
  date: string
  label: string
  modality: ImagingModality
  bodyPart: string
  images: StudyImage[]
}

interface ImagingComparisonPanelProps {
  open: boolean
  onClose: () => void
  patientName: string
  patientNumber: string
  modality: ImagingModality
  bodyPart: string
  currentStudyLabel: string
  currentImages: StudyImage[]
  priorStudies: PriorStudy[]
}

function ImageViewerPane({
  title,
  subtitle,
  badge,
  badgeClass = 'bg-primary',
  images,
}: {
  title: string
  subtitle: string
  badge: string
  badgeClass?: string
  images: StudyImage[]
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const hasMultiple = images.length > 1
  const safeIndex = Math.min(selectedIndex, Math.max(images.length - 1, 0))
  const activeImage = images[safeIndex]

  useEffect(() => {
    setSelectedIndex(0)
  }, [images])

  const goPrev = () => setSelectedIndex((i) => Math.max(0, i - 1))
  const goNext = () => setSelectedIndex((i) => Math.min(images.length - 1, i + 1))

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between mb-2 px-1 gap-2">
        <div className="min-w-0">
          <p className="font-label-md text-label-md font-semibold text-on-surface m-0">{title}</p>
          <p className="font-label-sm text-label-sm text-secondary m-0 mt-0.5 truncate">
            {activeImage ? `${subtitle} · ${activeImage.label}` : subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasMultiple && (
            <span className="text-label-sm text-secondary font-mono">
              {safeIndex + 1} / {images.length}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${badgeClass}`}>
            {badge}
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-h-[240px] lg:min-h-[380px] rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#0d1117]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(#3a3a3a 1px, transparent 1px), linear-gradient(90deg, #3a3a3a 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-px h-full bg-white/10 absolute" />
          <div className="h-px w-full bg-white/10 absolute" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[100px] text-white/8 select-none">radiology</span>
          {activeImage && (
            <span className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">
              {activeImage.label}
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 flex items-end justify-between">
          <p className="text-[11px] text-white/60 font-mono m-0">WW: 2000 · WL: 400 · Zoom: 100%</p>
          {hasMultiple && (
            <p className="text-[11px] text-white/50 m-0">{activeImage?.label}</p>
          )}
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              disabled={safeIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border-0 cursor-pointer hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous image"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={safeIndex === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border-0 cursor-pointer hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next image"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </>
        )}

        <div className="absolute top-2 right-2 flex gap-1">
          <button
            type="button"
            className="w-7 h-7 rounded bg-black/50 text-white/70 flex items-center justify-center border-0 cursor-pointer hover:bg-black/70 transition-colors"
            aria-label="Zoom in"
          >
            <span className="material-symbols-outlined text-[16px]">zoom_in</span>
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded bg-black/50 text-white/70 flex items-center justify-center border-0 cursor-pointer hover:bg-black/70 transition-colors"
            aria-label="Zoom out"
          >
            <span className="material-symbols-outlined text-[16px]">zoom_out</span>
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded bg-black/50 text-white/70 flex items-center justify-center border-0 cursor-pointer hover:bg-black/70 transition-colors"
            aria-label="Reset view"
          >
            <span className="material-symbols-outlined text-[16px]">fit_screen</span>
          </button>
        </div>
      </div>

      {hasMultiple && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`shrink-0 flex flex-col items-center gap-1 border-0 cursor-pointer bg-transparent p-0 ${
                idx === safeIndex ? 'opacity-100' : 'opacity-60 hover:opacity-90'
              }`}
            >
              <div
                className={`w-16 h-16 rounded-lg bg-[#0d1117] border-2 flex items-center justify-center transition-colors ${
                  idx === safeIndex ? 'border-primary' : 'border-[#2a2a2a]'
                }`}
              >
                <span className="material-symbols-outlined text-white/30 text-[24px]">image</span>
              </div>
              <span
                className={`text-[10px] font-semibold max-w-[64px] truncate ${
                  idx === safeIndex ? 'text-primary' : 'text-secondary'
                }`}
              >
                {img.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ImagingComparisonPanel({
  open,
  onClose,
  patientName,
  patientNumber,
  modality,
  bodyPart,
  currentStudyLabel,
  currentImages,
  priorStudies,
}: ImagingComparisonPanelProps) {
  const [selectedPriorId, setSelectedPriorId] = useState(priorStudies[0]?.id ?? '')

  useEffect(() => {
    if (open && priorStudies.length > 0) {
      setSelectedPriorId(priorStudies[0].id)
    }
  }, [open, priorStudies])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const selectedPrior = priorStudies.find((s) => s.id === selectedPriorId) ?? priorStudies[0]
  const modalityLabel = MODALITY_LABELS[modality]

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-on-surface/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Imaging comparison"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 m-3 lg:m-6 flex flex-col flex-1 min-h-0 bg-surface-white rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
        <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between gap-md shrink-0 bg-surface-container-low">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Image Comparison</h2>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-label-sm font-semibold rounded">
                {modalityLabel} · {bodyPart}
              </span>
            </div>
            <p className="text-body-sm text-secondary m-0 mt-1">
              {patientName} · {patientNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container border-0 bg-transparent cursor-pointer text-outline hover:text-on-surface shrink-0"
            aria-label="Close comparison"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {priorStudies.length > 1 && (
          <div className="px-lg py-2 border-b border-border-subtle flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-label-sm text-secondary font-semibold shrink-0">Compare with:</span>
            {priorStudies.map((study) => (
              <button
                key={study.id}
                type="button"
                onClick={() => setSelectedPriorId(study.id)}
                className={`px-3 py-1 rounded-lg text-label-sm font-medium border transition-colors cursor-pointer shrink-0 ${
                  selectedPriorId === study.id
                    ? 'bg-primary-container text-white border-primary-container'
                    : 'bg-transparent text-secondary border-border-subtle hover:bg-surface-container'
                }`}
              >
                {study.label}
                {study.images.length > 1 && (
                  <span className="ml-1 opacity-70">({study.images.length} images)</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 p-lg flex flex-col lg:flex-row gap-lg overflow-y-auto">
          <ImageViewerPane
            title="Current Study"
            subtitle={currentStudyLabel}
            badge="Current"
            badgeClass="bg-primary-container"
            images={currentImages}
          />

          <div className="hidden lg:flex items-center justify-center shrink-0">
            <div className="w-px h-full bg-border-subtle min-h-[200px]" />
          </div>

          {selectedPrior ? (
            <ImageViewerPane
              title="Previous Study"
              subtitle={selectedPrior.label}
              badge="Prior"
              badgeClass="bg-secondary"
              images={selectedPrior.images}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary">
              <p className="m-0">No prior study selected.</p>
            </div>
          )}
        </div>

        <div className="px-lg py-3 border-t border-border-subtle bg-surface-container-low shrink-0 flex items-center justify-between gap-md">
          <p className="text-label-sm text-secondary m-0 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            Use thumbnails or arrows to switch views within each study. Full DICOM viewer when PACS is connected.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-9 rounded-lg border border-border-subtle bg-surface-white text-label-md font-semibold hover:bg-surface-container transition-colors cursor-pointer shrink-0"
          >
            Back to Report
          </button>
        </div>
      </div>
    </div>
  )
}

const CHEST_XRAY_CURRENT_IMAGES: StudyImage[] = [
  { id: 'cur-pa', label: 'PA View' },
  { id: 'cur-lat', label: 'Lateral View' },
]

export function getDemoCurrentImages(modality: ImagingModality, bodyPart: string): StudyImage[] {
  if (modality === 'x-ray' && bodyPart === 'Chest') {
    return CHEST_XRAY_CURRENT_IMAGES
  }
  return [{ id: 'cur-1', label: 'Primary View' }]
}

export function getDemoPriorStudies(modality: ImagingModality, bodyPart: string): PriorStudy[] {
  if (modality === 'x-ray' && bodyPart === 'Chest') {
    return [
      {
        id: 'prior-1',
        date: '2023-08-14',
        label: 'Aug 14, 2023 — Chest X-Ray',
        modality: 'x-ray',
        bodyPart: 'Chest',
        images: [
          { id: 'p1-pa', label: 'PA View' },
          { id: 'p1-lat', label: 'Lateral View' },
        ],
      },
      {
        id: 'prior-2',
        date: '2023-03-02',
        label: 'Mar 2, 2023 — Chest X-Ray',
        modality: 'x-ray',
        bodyPart: 'Chest',
        images: [
          { id: 'p2-pa', label: 'PA View' },
          { id: 'p2-lat', label: 'Lateral View' },
          { id: 'p2-obl', label: 'Oblique View' },
        ],
      },
    ]
  }
  return []
}
