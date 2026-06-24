import type { LabResultParameter, ResultFlag } from '@/features/laboratory/types/laboratory'

export function evaluateResultFlag(value: string, parameter: LabResultParameter): ResultFlag {
  const num = parseFloat(value)
  if (Number.isNaN(num)) return null

  if (parameter.criticalHigh !== undefined && num >= parameter.criticalHigh) return 'critical'
  if (parameter.criticalLow !== undefined && num <= parameter.criticalLow) return 'critical'
  if (parameter.abnormalHigh !== undefined && num > parameter.abnormalHigh) return 'abnormal'
  if (parameter.abnormalLow !== undefined && num < parameter.abnormalLow) return 'abnormal'

  return 'normal'
}

export function getWorstFlag(flags: ResultFlag[]): ResultFlag {
  if (flags.includes('critical')) return 'critical'
  if (flags.includes('abnormal')) return 'abnormal'
  if (flags.includes('normal')) return 'normal'
  return null
}
