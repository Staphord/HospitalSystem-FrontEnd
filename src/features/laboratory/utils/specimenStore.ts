import { MOCK_SPECIMENS } from '@/features/laboratory/data/mockSpecimens'
import type { TrackedSpecimen } from '@/features/laboratory/types/laboratory'

const specimenPatches = new Map<string, Partial<TrackedSpecimen>>()

function mergeSpecimen(base: TrackedSpecimen): TrackedSpecimen {
  const patch = specimenPatches.get(base.id)
  return patch ? { ...base, ...patch } : base
}

export function getAllSpecimens(): TrackedSpecimen[] {
  return MOCK_SPECIMENS.map(mergeSpecimen)
}

export function getSpecimenById(id: string): TrackedSpecimen | undefined {
  return getAllSpecimens().find((s) => s.id === id)
}

export function getSpecimenByRequestId(requestId: string): TrackedSpecimen | undefined {
  return getAllSpecimens().find((s) => s.requestId === requestId)
}

export function patchSpecimen(id: string, patch: Partial<TrackedSpecimen>): TrackedSpecimen | undefined {
  const base = MOCK_SPECIMENS.find((s) => s.id === id)
  if (!base) return undefined

  const existing = specimenPatches.get(id) ?? {}
  specimenPatches.set(id, { ...existing, ...patch })
  return mergeSpecimen(base)
}

export function updateSpecimenStatus(
  id: string,
  status: TrackedSpecimen['status'],
  extras?: Pick<TrackedSpecimen, 'notes' | 'rejectionReason' | 'location' | 'collectedBy' | 'collectedAt'>,
): TrackedSpecimen | undefined {
  const current = getSpecimenById(id)
  if (!current) return undefined

  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const patch: Partial<TrackedSpecimen> = {
    status,
    ...extras,
  }

  if (status === 'collected' && !current.collectedAt && !extras?.collectedAt) {
    patch.collectedAt = now
    patch.collectedBy = patch.collectedBy ?? 'Lab Technician'
  }

  if (status !== 'rejected') {
    patch.rejectionReason = undefined
  }

  return patchSpecimen(id, patch)
}
