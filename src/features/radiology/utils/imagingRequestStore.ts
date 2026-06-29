import type { ImagingRequest } from '@/features/radiology/types/radiology'
import { IMAGING_REQUESTS } from '@/features/radiology/data/mockImagingRequests'

// In-memory mutable store — survives navigation within a session
const store: ImagingRequest[] = IMAGING_REQUESTS.map((r) => ({ ...r }))

export function getAllImagingRequests(): ImagingRequest[] {
  return store
}

export function getImagingRequestById(id: string): ImagingRequest | undefined {
  return store.find((r) => r.id === id)
}

export function patchImagingRequest(id: string, patch: Partial<ImagingRequest>): void {
  const idx = store.findIndex((r) => r.id === id)
  if (idx >= 0) {
    store[idx] = { ...store[idx], ...patch }
  }
}
