import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { laboratoryService } from '@/api/services/laboratory'

interface CollectSpecimenModalProps {
  requestId: string
  patientName: string
  testName: string
  onClose: () => void
  onSuccess: () => void
}

const SPECIMEN_TYPES = [
  'Blood (Venous)',
  'Blood (Capillary)',
  'Urine (Midstream)',
  'Urine (24-hour)',
  'Swab (Nasopharyngeal)',
  'Swab (Throat)',
  'Stool',
  'Sputum',
  'CSF',
  'Tissue / Biopsy',
  'Other',
]

export function CollectSpecimenModal({
  requestId,
  patientName,
  testName,
  onClose,
  onSuccess,
}: CollectSpecimenModalProps) {
  const [specimenType, setSpecimenType] = useState('Blood (Venous)')
  const [customType, setCustomType] = useState('')
  const [collectionSite, setCollectionSite] = useState('')
  const [specimenLabel, setSpecimenLabel] = useState(
    () => `SP-${Math.floor(100000 + Math.random() * 900000)}`,
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.clearTimeout(handleKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalType = specimenType === 'Other' ? customType.trim() : specimenType
    if (!finalType) {
      toast.error('Please specify a specimen type')
      return
    }

    setSubmitting(true)
    try {
      await laboratoryService.collectSpecimen(requestId, {
        specimen_type: finalType,
        collection_site: collectionSite.trim() || undefined,
        specimen_label: specimenLabel.trim() || undefined,
        collected_at: new Date().toISOString(),
      })
      toast.success('Specimen collected successfully')
      onSuccess()
      onClose()
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err.message || 'Failed to collect specimen'
      toast.error(detail)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 backdrop-blur-sm p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collect-specimen-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-surface-white rounded-xl border border-border-subtle shadow-lg w-full max-w-[460px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-md border-b border-border-subtle flex justify-between items-center bg-background/50">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">biotech</span>
            <h3
              id="collect-specimen-modal-title"
              className="font-headline-sm text-headline-sm text-on-surface m-0"
            >
              Collect Specimen
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface border-0 bg-transparent cursor-pointer p-0"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-lg flex flex-col gap-md">
            <div className="bg-surface-container-low p-md rounded-lg grid grid-cols-2 gap-sm text-body-sm">
              <div>
                <span className="text-secondary font-label-sm block">Patient</span>
                <span className="font-medium text-on-surface">{patientName}</span>
              </div>
              <div>
                <span className="text-secondary font-label-sm block">Investigation</span>
                <span className="font-medium text-on-surface">{testName}</span>
              </div>
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="specimen-type-select" className="font-label-sm text-label-sm text-secondary">
                Specimen Type <span className="text-error">*</span>
              </label>
              <select
                id="specimen-type-select"
                value={specimenType}
                onChange={(e) => setSpecimenType(e.target.value)}
                className="w-full border border-border-subtle rounded-lg font-body-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none bg-surface-white"
              >
                {SPECIMEN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {specimenType === 'Other' && (
              <div className="flex flex-col gap-xs">
                <label htmlFor="custom-specimen-type" className="font-label-sm text-label-sm text-secondary">
                  Specify Specimen Type <span className="text-error">*</span>
                </label>
                <input
                  id="custom-specimen-type"
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="e.g. Synovial Fluid"
                  className="w-full border border-border-subtle rounded-lg font-body-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-xs">
              <label htmlFor="collection-site" className="font-label-sm text-label-sm text-secondary">
                Collection Site (Optional)
              </label>
              <input
                id="collection-site"
                type="text"
                value={collectionSite}
                onChange={(e) => setCollectionSite(e.target.value)}
                placeholder="e.g. Left antecubital fossa"
                className="w-full border border-border-subtle rounded-lg font-body-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label htmlFor="specimen-label" className="font-label-sm text-label-sm text-secondary">
                Specimen Label / Barcode ID
              </label>
              <input
                id="specimen-label"
                type="text"
                value={specimenLabel}
                onChange={(e) => setSpecimenLabel(e.target.value)}
                className="w-full border border-border-subtle rounded-lg font-body-sm px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
              />
            </div>
          </div>

          <div className="p-md bg-surface-container-low flex justify-end gap-sm border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-subtle rounded-lg text-secondary font-label-md hover:bg-surface-container-high transition-colors bg-transparent cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary text-white rounded-lg font-label-md hover:bg-primary-container transition-colors border-0 cursor-pointer flex items-center gap-xs"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Collecting...
                </>
              ) : (
                'Collect & Save Specimen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
