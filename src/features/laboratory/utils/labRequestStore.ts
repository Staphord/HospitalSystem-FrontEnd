import { MOCK_LAB_REQUESTS } from '@/features/laboratory/data/mockLabRequests'
import type { LabResultParameter, LabTestRequest } from '@/features/laboratory/types/laboratory'
import { deriveRequestSpecimenStatus } from '@/features/laboratory/utils/specimenStatus'
import { getSpecimenByRequestId } from '@/features/laboratory/utils/specimenStore'

const requestPatches = new Map<string, Partial<LabTestRequest>>()

export const TROPONIN_PARAMETERS: LabResultParameter[] = [
  {
    id: 'trop-i',
    name: 'Troponin I',
    unit: 'ng/mL',
    refRange: '<0.04',
    criticalHigh: 2.8,
    abnormalHigh: 0.04,
  },
]

export function getDefaultParameters(request: LabTestRequest): LabResultParameter[] {
  if (request.testName.toLowerCase().includes('troponin')) {
    return TROPONIN_PARAMETERS
  }
  return [
    {
      id: 'result-1',
      name: request.testName,
      unit: '—',
      refRange: 'See lab reference',
      abnormalHigh: undefined,
    },
  ]
}

export function enrichLabRequest(request: LabTestRequest): LabTestRequest {
  const specimen = getSpecimenByRequestId(request.id)
  const specimenStatus = specimen
    ? deriveRequestSpecimenStatus(specimen.status)
    : request.specimenStatus

  return {
    ...request,
    specimenStatus,
    specimenId: specimen?.id ?? request.specimenId ?? `SPEC-${request.id.slice(-4).toUpperCase()}`,
    collectedAt: specimen?.collectedAt ?? request.collectedAt ?? request.requestedAt,
    parameters: request.parameters ?? getDefaultParameters(request),
    resultValues: request.resultValues ?? {},
  }
}

export function getAllLabRequests(): LabTestRequest[] {
  return MOCK_LAB_REQUESTS.map((request) => {
    const patch = requestPatches.get(request.id)
    const merged = patch ? { ...request, ...patch } : request
    return enrichLabRequest(merged)
  })
}

export function getLabRequestById(id: string): LabTestRequest | undefined {
  const request = getAllLabRequests().find((r) => r.id === id)
  return request ? enrichLabRequest(request) : undefined
}

export function patchLabRequest(id: string, patch: Partial<LabTestRequest>): void {
  const existing = requestPatches.get(id) ?? {}
  requestPatches.set(id, { ...existing, ...patch })
}
