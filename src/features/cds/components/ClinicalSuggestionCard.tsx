import { useState } from 'react'
import type { CdsDifferentialResponse, CdsFeedbackRating } from '@/api/types/cds'
import type { UseDifferentialSupportResult } from '../hooks/useDifferentialSupport'

/**
 * The heading is the product name, and it is not negotiable.
 *
 * The phase rules forbid presenting this as "AI Diagnosis". What it produces
 * are considerations a clinician reviews, and the label on the screen has to
 * say so before anybody reads a word of the content.
 */
const TITLE = 'Clinical Differential Support'
const SUBTITLE = 'Diagnosis suggestions for clinician review'

const STATUS_LINES: Record<CdsDifferentialResponse['status'], string> = {
  suggestions:
    'These are considerations for your review, not a diagnosis and not a ranked list.',
  insufficient_input:
    'No consideration could be supported by what is recorded for this visit. This is not a statement that there is nothing to consider.',
  unavailable:
    'The suggestion service was unavailable, so no considerations were produced. This is not a statement that there is nothing to consider.',
}

const RATINGS: { value: CdsFeedbackRating; label: string }[] = [
  { value: 'useful', label: 'Useful' },
  { value: 'not_useful', label: 'Not useful' },
  { value: 'incorrect', label: 'Incorrect' },
  { value: 'unsafe', label: 'Unsafe' },
]

function InputsSummary({ inputs }: { inputs: CdsDifferentialResponse['inputs'] }) {
  return (
    <details className="mt-md border border-border-subtle rounded-lg">
      <summary className="px-md py-2 cursor-pointer font-label-md text-label-md text-on-surface">
        What this was based on
      </summary>
      <div className="px-md pb-md pt-1 flex flex-col gap-2">
        <p className="font-body-sm text-body-sm text-on-surface m-0">
          <span className="font-semibold">Chief complaint: </span>
          {inputs.chief_complaint}
        </p>

        {inputs.symptoms.length > 0 && (
          <div>
            <p className="font-label-md text-label-md text-secondary m-0">Symptoms</p>
            <ul className="m-0 mt-1 pl-4 list-disc">
              {inputs.symptoms.map((symptom) => (
                <li key={symptom.name} className="font-body-sm text-body-sm text-on-surface">
                  {symptom.name}
                  {symptom.duration ? ` · ${symptom.duration}` : ''}
                  {symptom.location ? ` · ${symptom.location}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {inputs.vitals.length > 0 && (
          <div>
            <p className="font-label-md text-label-md text-secondary m-0">Vitals used</p>
            <ul className="m-0 mt-1 pl-4 list-disc">
              {inputs.vitals.map((vital) => (
                <li key={vital.label} className="font-body-sm text-body-sm text-on-surface">
                  {vital.label}: {vital.value}
                  {/* Freshness is part of the input, not a detail. */}
                  {vital.recorded_at
                    ? ` (recorded ${new Date(vital.recorded_at).toLocaleString()})`
                    : ' (time not recorded)'}
                </li>
              ))}
            </ul>
          </div>
        )}

        {inputs.patient_factors.length > 0 && (
          <p className="font-body-sm text-body-sm text-on-surface m-0">
            <span className="font-semibold">Patient factors: </span>
            {inputs.patient_factors.map((f) => `${f.label} ${f.value}`).join(', ')}
          </p>
        )}

        <p className="font-body-sm text-body-sm text-on-surface m-0">
          <span className="font-semibold">Allergies: </span>
          {!inputs.allergy_history_recorded
            ? 'no allergy history has been taken'
            : inputs.allergies.length > 0
              ? inputs.allergies.join(', ')
              : 'recorded, none listed'}
        </p>

        <p className="font-body-sm text-body-sm text-on-surface m-0">
          <span className="font-semibold">Current medicines: </span>
          {inputs.current_medicines.length > 0
            ? inputs.current_medicines.join(', ')
            : 'none recorded for this visit'}
        </p>

        <p className="font-body-sm text-xs text-secondary m-0">
          Context retrieved {new Date(inputs.context_retrieved_at).toLocaleString()}
        </p>
      </div>
    </details>
  )
}

export interface ClinicalSuggestionCardProps {
  state: UseDifferentialSupportResult
  /** Prefilled from the encounter so the clinician is not retyping. */
  defaultChiefComplaint?: string
  /** The department this workflow is approved for. */
  department?: string
}

/**
 * Clinical Differential Support for one visit.
 *
 * Shows the considerations, what supports and contradicts each, the
 * deterministic red flags, what is missing, what conflicts, the limitations,
 * and the versions that produced the result. It renders server text as text,
 * never as HTML, and it never shows a probability or a rank because the server
 * never sends one.
 *
 * When the capability is switched off for the deployment, or the signed-in role
 * may not use it, the card renders nothing at all.
 */
export function ClinicalSuggestionCard({
  state,
  defaultChiefComplaint = '',
  department = 'general_opd',
}: ClinicalSuggestionCardProps) {
  const { suggestion, loading, failure, absent, rating, request, sendFeedback } = state
  const [complaint, setComplaint] = useState(defaultChiefComplaint)
  const [notes, setNotes] = useState('')

  if (absent) return null

  const canAsk = complaint.trim().length > 0 && !loading

  return (
    <section
      aria-labelledby="differential-heading"
      className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm"
    >
      <div className="px-md py-md border-b border-border-subtle">
        <h2 id="differential-heading" className="font-headline-sm text-headline-sm m-0">
          {TITLE}
        </h2>
        <p className="font-body-sm text-body-sm text-secondary m-0 mt-0.5">{SUBTITLE}</p>
      </div>

      <div className="px-md py-md">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="differential-complaint"
            className="font-label-md text-label-md text-on-surface"
          >
            Chief complaint
          </label>
          <input
            id="differential-complaint"
            value={complaint}
            onChange={(event) => setComplaint(event.target.value)}
            className="w-full rounded-lg border border-border-subtle p-2 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label
            htmlFor="differential-notes"
            className="font-label-md text-label-md text-on-surface mt-2"
          >
            Additional notes (optional)
          </label>
          <textarea
            id="differential-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border-subtle p-2 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div>
            <button
              type="button"
              disabled={!canAsk}
              onClick={() =>
                request({
                  chief_complaint: complaint.trim(),
                  department,
                  ...(notes.trim() ? { additional_notes: notes.trim() } : {}),
                })
              }
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-white font-label-md text-label-md disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {loading ? 'Working...' : 'Get considerations for review'}
            </button>
          </div>
        </div>

        {loading && (
          <p role="status" className="font-body-sm text-body-sm text-secondary m-0 mt-md">
            Preparing considerations for your review...
          </p>
        )}

        {!loading && failure && (
          <div role="alert" className="mt-md rounded-lg border border-error/30 bg-error/[0.04] p-md">
            <p className="font-body-sm text-body-sm text-on-surface m-0">{failure.message}</p>
          </div>
        )}

        {!loading && !failure && suggestion && (
          <div className="mt-md">
            {/* Red flags first, and visually distinct: they are deterministic
                and do not depend on the model having answered. */}
            {suggestion.red_flags.length > 0 && (
              <div className="rounded-lg border border-error/40 bg-error/[0.06] p-md mb-md">
                <h3 className="font-headline-sm text-body-lg text-error m-0">
                  Findings that warrant clinician assessment
                </h3>
                <ul className="list-none p-0 m-0 mt-2 flex flex-col gap-2">
                  {suggestion.red_flags.map((flag) => (
                    <li key={flag.rule_id}>
                      <p className="font-body-sm text-body-sm text-on-surface m-0 font-semibold">
                        {flag.label}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface m-0">
                        {flag.detail}
                      </p>
                      <p className="font-body-sm text-xs text-secondary m-0">
                        Rule {flag.rule_id} &middot; {flag.ruleset_version}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="font-body-sm text-body-sm text-on-surface m-0">
              {STATUS_LINES[suggestion.status]}
            </p>

            {suggestion.considerations.length > 0 && (
              <ul className="list-none p-0 m-0 mt-md flex flex-col gap-3">
                {suggestion.considerations.map((consideration) => (
                  <li
                    key={consideration.label}
                    className="border border-border-subtle rounded-lg p-md bg-surface-container-low"
                  >
                    <p className="font-body-sm text-body-sm text-on-surface font-semibold m-0">
                      {consideration.label}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface m-0 mt-1">
                      {consideration.rationale}
                    </p>

                    {consideration.supporting_findings.length > 0 && (
                      <div className="mt-2">
                        <p className="font-label-md text-label-md text-secondary m-0">
                          Supported by
                        </p>
                        <ul className="m-0 mt-0.5 pl-4 list-disc">
                          {consideration.supporting_findings.map((item) => (
                            <li key={item} className="font-body-sm text-body-sm text-on-surface">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {consideration.contradicting_findings.length > 0 && (
                      <div className="mt-2">
                        <p className="font-label-md text-label-md text-secondary m-0">
                          Argues against
                        </p>
                        <ul className="m-0 mt-0.5 pl-4 list-disc">
                          {consideration.contradicting_findings.map((item) => (
                            <li key={item} className="font-body-sm text-body-sm text-on-surface">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {suggestion.missing_information.length > 0 && (
              <div className="mt-md">
                <h3 className="font-label-md text-label-md text-on-surface m-0">
                  Missing information
                </h3>
                <ul className="m-0 mt-1 pl-4 list-disc">
                  {suggestion.missing_information.map((item) => (
                    <li key={item} className="font-body-sm text-body-sm text-secondary">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {suggestion.contradictions.length > 0 && (
              <div className="mt-md">
                <h3 className="font-label-md text-label-md text-on-surface m-0">Contradictions</h3>
                <ul className="m-0 mt-1 pl-4 list-disc">
                  {suggestion.contradictions.map((item) => (
                    <li key={item} className="font-body-sm text-body-sm text-secondary">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <InputsSummary inputs={suggestion.inputs} />

            {suggestion.limitations.length > 0 && (
              <div className="mt-md">
                <h3 className="font-label-md text-label-md text-on-surface m-0">Limitations</h3>
                <ul className="m-0 mt-1 pl-4 list-disc">
                  {suggestion.limitations.map((item) => (
                    <li key={item} className="font-body-sm text-xs text-secondary">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-md flex flex-wrap items-center gap-2">
              <span className="font-label-md text-label-md text-secondary">
                Was this useful?
              </span>
              {RATINGS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={rating !== null}
                  onClick={() => sendFeedback(option.value)}
                  className={`px-3 py-1.5 rounded-lg border font-label-md text-label-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
                    rating === option.value
                      ? 'border-primary text-primary'
                      : 'border-border-subtle'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              {rating !== null && (
                <span role="status" className="font-body-sm text-body-sm text-success">
                  Recorded for review.
                </span>
              )}
            </div>

            <p className="font-body-sm text-xs text-secondary m-0 mt-md">
              A clinician remains responsible for diagnosis and every decision that follows.
              {' '}
              Knowledge {suggestion.knowledge_version} &middot; rules{' '}
              {suggestion.redflag_ruleset_version} &middot; prompt {suggestion.prompt_version}
              {suggestion.model_version ? ` · model ${suggestion.model_version}` : ''}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
