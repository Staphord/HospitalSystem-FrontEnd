/**
 * Clinical decision support contracts.
 *
 * These mirror the server contracts in clinical-decision-support-service
 * (app/cds/contracts.py) exactly. Fields the server owns - tenant, role, red
 * flags, and the versions a result was produced by - are deliberately absent
 * from every request type: they are resolved on the server and are rejected
 * outright if a browser sends them.
 */

export type CdsErrorCode =
  | 'capability_disabled'
  | 'permission_denied'
  | 'invalid_request'
  | 'resource_not_found'
  | 'suggestion_unavailable'

export interface CdsErrorResponse {
  request_id: string
  code: CdsErrorCode
  message: string
}

// Clinical differential support

/** The outcome of one differential request. Never "diagnosed". */
export type CdsDifferentialStatus = 'suggestions' | 'insufficient_input' | 'unavailable'

export type CdsProgression = 'improving' | 'unchanged' | 'worsening' | 'fluctuating' | 'unknown'

/** Severity as the patient reported it. Not a graded clinical judgement. */
export type CdsReportedSeverity = 'mild' | 'moderate' | 'severe' | 'unknown'

export interface CdsSymptomInput {
  name: string
  onset?: string | null
  duration?: string | null
  reported_severity?: CdsReportedSeverity
  location?: string | null
  progression?: CdsProgression
}

/** One piece of retrieved context, with when it was recorded. */
export interface CdsObservedValue {
  label: string
  value: string
  recorded_at?: string | null
  source: string
}

export interface CdsDifferentialRequest {
  visit_id: string
  chief_complaint: string
  symptoms?: CdsSymptomInput[]
  department: string
  encounter_type?: string | null
  additional_notes?: string | null
}

/** Exactly what the suggestion was built from, and how fresh it was. */
export interface CdsDifferentialInputs {
  chief_complaint: string
  symptoms: CdsSymptomInput[]
  department: string
  encounter_type?: string | null
  vitals: CdsObservedValue[]
  patient_factors: CdsObservedValue[]
  allergies: string[]
  allergy_history_recorded: boolean
  current_medicines: string[]
  notes_used?: string | null
  context_retrieved_at: string
}

/** A red flag from the deterministic rule pack. Never model-authored. */
export interface CdsRedFlag {
  rule_id: string
  ruleset_version: string
  label: string
  detail: string
  matched_on: string[]
}

/** One thing worth considering. Carries no probability, score, or rank. */
export interface CdsConsideration {
  label: string
  rationale: string
  supporting_findings: string[]
  contradicting_findings: string[]
  evidence_references: string[]
}

export interface CdsDifferentialResponse {
  request_id: string
  suggestion_id: string
  visit_id: string
  status: CdsDifferentialStatus
  inputs: CdsDifferentialInputs
  considerations: CdsConsideration[]
  red_flags: CdsRedFlag[]
  missing_information: string[]
  contradictions: string[]
  limitations: string[]
  evidence_references: string[]
  department: string
  knowledge_version: string
  redflag_ruleset_version: string
  prompt_version: string
  model_version?: string | null
  requires_human_review: boolean
  evaluated_at: string
}

export type CdsFeedbackRating = 'useful' | 'not_useful' | 'incorrect' | 'unsafe'

export interface CdsDifferentialFeedbackRequest {
  suggestion_id: string
  rating: CdsFeedbackRating
  comment?: string | null
}

export interface CdsDifferentialFeedbackResponse {
  request_id: string
  suggestion_id: string
  recorded_at: string
}
