import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { ClinicalSuggestionCard } from '@/features/cds/components/ClinicalSuggestionCard'
import { useDifferentialSupport } from '@/features/cds/hooks/useDifferentialSupport'
import type { CdsDifferentialResponse } from '@/api/types/cds'

const differentialMock = vi.hoisted(() => vi.fn())
const feedbackMock = vi.hoisted(() => vi.fn())

vi.mock('@/api/services/cds', () => ({
  cdsService: {
    differential: differentialMock,
    differentialFeedback: feedbackMock,
    check: vi.fn(),
    finalizationGate: vi.fn(),
    alertAction: vi.fn(),
    normalize: vi.fn(),
    activeRuleset: vi.fn(),
  },
}))

const VISIT = 'b2000002-0002-4002-8002-00000000000a'

function suggestion(
  overrides: Partial<CdsDifferentialResponse> = {},
): CdsDifferentialResponse {
  return {
    request_id: 'req-1',
    suggestion_id: '22222222-2222-4222-8222-222222222222',
    visit_id: VISIT,
    status: 'suggestions',
    inputs: {
      chief_complaint: 'Cough for three days',
      symptoms: [{ name: 'cough', duration: '3 days' }],
      department: 'general_opd',
      encounter_type: null,
      vitals: [
        {
          label: 'Blood pressure',
          value: '128/82',
          recorded_at: '2026-08-27T08:15:00Z',
          source: 'triage assessment',
        },
      ],
      patient_factors: [{ label: 'Age', value: '41 years', source: 'patient record' }],
      allergies: ['penicillin'],
      allergy_history_recorded: true,
      current_medicines: ['Warfarin 5mg tablet'],
      notes_used: null,
      context_retrieved_at: '2026-08-28T09:00:00Z',
    },
    considerations: [
      {
        label: 'Viral upper respiratory tract infection',
        rationale: 'Three-day cough with no recorded fever.',
        supporting_findings: ['No fever recorded'],
        contradicting_findings: ['Nothing recorded contradicts this'],
        evidence_references: [],
      },
    ],
    red_flags: [],
    missing_information: ['Respiratory examination'],
    contradictions: [],
    limitations: ['These are considerations for clinician review, not a diagnosis.'],
    evidence_references: [],
    department: 'general_opd',
    knowledge_version: 'k-1',
    redflag_ruleset_version: 'rf-1',
    prompt_version: 'p-1',
    model_version: 'stub-1',
    requires_human_review: true,
    evaluated_at: '2026-08-28T09:00:00Z',
    ...overrides,
  }
}

function httpError(status: number, code?: string): AxiosError {
  const error = new AxiosError('failed')
  error.response = {
    status,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data: code ? { request_id: 'req-e', code, message: 'server text that must not be shown' } : {},
  }
  return error
}

function Harness({ visitId = VISIT }: { visitId?: string | null }) {
  const state = useDifferentialSupport(visitId)
  return (
    <div>
      <ClinicalSuggestionCard state={state} defaultChiefComplaint="Cough for three days" />
      <span data-testid="absent">{String(state.absent)}</span>
    </div>
  )
}

async function ask() {
  await userEvent.click(
    await screen.findByRole('button', { name: /get considerations for review/i }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  differentialMock.mockResolvedValue(suggestion())
  feedbackMock.mockResolvedValue({})
})

describe('ClinicalSuggestionCard', () => {
  describe('how it presents itself', () => {
    it('is labelled as clinician review support, never as AI diagnosis', async () => {
      render(<Harness />)

      expect(
        screen.getByRole('heading', { name: /clinical differential support/i }),
      ).toBeInTheDocument()
      expect(screen.getByText(/diagnosis suggestions for clinician review/i)).toBeInTheDocument()
      expect(screen.queryByText(/ai diagnosis/i)).not.toBeInTheDocument()
    })

    it('says the result is not a diagnosis and not ranked', async () => {
      render(<Harness />)
      await ask()

      expect(
        await screen.findByText(/considerations for your review, not a diagnosis/i),
      ).toBeInTheDocument()
    })

    it('states that a clinician remains responsible', async () => {
      render(<Harness />)
      await ask()

      expect(
        await screen.findByText(/clinician remains responsible for diagnosis/i),
      ).toBeInTheDocument()
    })
  })

  describe('reviewability', () => {
    it('shows what supports and what argues against each consideration', async () => {
      render(<Harness />)
      await ask()

      expect(await screen.findByText(/supported by/i)).toBeInTheDocument()
      expect(screen.getByText(/argues against/i)).toBeInTheDocument()
      expect(screen.getByText(/No fever recorded/)).toBeInTheDocument()
    })

    it('exposes the exact inputs the result was built from', async () => {
      render(<Harness />)
      await ask()

      await userEvent.click(await screen.findByText(/what this was based on/i))

      expect(screen.getByText(/128\/82/)).toBeInTheDocument()
      expect(screen.getByText(/Warfarin 5mg tablet/)).toBeInTheDocument()
      expect(screen.getByText(/penicillin/)).toBeInTheDocument()
    })

    it('shows when each retrieved value was recorded', async () => {
      render(<Harness />)
      await ask()
      await userEvent.click(await screen.findByText(/what this was based on/i))

      // The timestamp is rendered in the same list item as the value, split
      // across text nodes, so match on the item's whole text.
      const vital = screen
        .getAllByRole('listitem')
        .find((item) => item.textContent?.includes('Blood pressure'))

      expect(vital).toBeDefined()
      expect(vital?.textContent).toMatch(/recorded/i)
    })

    it('says plainly when no allergy history has been taken', async () => {
      differentialMock.mockResolvedValue(
        suggestion({
          inputs: { ...suggestion().inputs, allergy_history_recorded: false, allergies: [] },
        }),
      )
      render(<Harness />)
      await ask()
      await userEvent.click(await screen.findByText(/what this was based on/i))

      expect(screen.getByText(/no allergy history has been taken/i)).toBeInTheDocument()
    })

    it('shows missing information and limitations', async () => {
      render(<Harness />)
      await ask()

      expect(await screen.findByText(/Respiratory examination/)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /limitations/i })).toBeInTheDocument()
    })

    it('shows the versions that produced the result', async () => {
      render(<Harness />)
      await ask()

      expect(await screen.findByText(/knowledge k-1/i)).toBeInTheDocument()
      expect(screen.getByText(/prompt p-1/i)).toBeInTheDocument()
    })
  })

  describe('red flags', () => {
    it('shows a deterministic red flag with its rule and version', async () => {
      differentialMock.mockResolvedValue(
        suggestion({
          red_flags: [
            {
              rule_id: 'RF-001',
              ruleset_version: 'rf-1',
              label: 'Chest pain with breathlessness',
              detail: 'This combination warrants clinician assessment.',
              matched_on: ['chest pain'],
            },
          ],
        }),
      )
      render(<Harness />)
      await ask()

      expect(await screen.findByText(/Chest pain with breathlessness/)).toBeInTheDocument()
      expect(screen.getByText(/Rule RF-001/)).toBeInTheDocument()
    })

    it('shows red flags even when no considerations were produced', async () => {
      differentialMock.mockResolvedValue(
        suggestion({
          status: 'unavailable',
          considerations: [],
          red_flags: [
            {
              rule_id: 'RF-001',
              ruleset_version: 'rf-1',
              label: 'Chest pain with breathlessness',
              detail: 'This combination warrants clinician assessment.',
              matched_on: ['chest pain'],
            },
          ],
        }),
      )
      render(<Harness />)
      await ask()

      expect(await screen.findByText(/Chest pain with breathlessness/)).toBeInTheDocument()
    })
  })

  describe('never reassuring when nothing was established', () => {
    it('says nothing was ruled out when the service was unavailable', async () => {
      differentialMock.mockResolvedValue(
        suggestion({ status: 'unavailable', considerations: [] }),
      )
      render(<Harness />)
      await ask()

      expect(
        await screen.findByText(/not a statement that there is nothing to consider/i),
      ).toBeInTheDocument()
    })

    it('says nothing was ruled out when the inputs were too thin', async () => {
      differentialMock.mockResolvedValue(
        suggestion({ status: 'insufficient_input', considerations: [] }),
      )
      render(<Harness />)
      await ask()

      expect(
        await screen.findByText(/not a statement that there is nothing to consider/i),
      ).toBeInTheDocument()
    })

    it('never shows a probability or a rank, because none is ever sent', async () => {
      render(<Harness />)
      await ask()
      await screen.findByText(/Viral upper respiratory tract infection/)

      expect(document.body.textContent).not.toMatch(/\d+\s*%/)
      expect(document.body.textContent).not.toMatch(/probability/i)
    })
  })

  describe('failure and absence', () => {
    it('withdraws entirely when the capability is switched off', async () => {
      differentialMock.mockRejectedValue(httpError(404, 'capability_disabled'))
      render(<Harness />)
      await ask()

      await waitFor(() => expect(screen.getByTestId('absent')).toHaveTextContent('true'))
      expect(
        screen.queryByRole('heading', { name: /clinical differential support/i }),
      ).toBeNull()
    })

    it('withdraws entirely for a role that may not use it', async () => {
      differentialMock.mockRejectedValue(httpError(403, 'permission_denied'))
      render(<Harness />)
      await ask()

      await waitFor(() => expect(screen.getByTestId('absent')).toHaveTextContent('true'))
    })

    it('never puts server error text on the screen', async () => {
      differentialMock.mockRejectedValue(httpError(503, 'check_unavailable'))
      render(<Harness />)
      await ask()

      expect(await screen.findByRole('alert')).toBeInTheDocument()
      expect(screen.queryByText(/server text that must not be shown/i)).not.toBeInTheDocument()
    })

    it('clears a previous suggestion when a later request fails', async () => {
      render(<Harness />)
      await ask()
      expect(await screen.findByText(/Viral upper respiratory tract infection/)).toBeInTheDocument()

      differentialMock.mockRejectedValue(httpError(503, 'check_unavailable'))
      await ask()

      await waitFor(() =>
        expect(
          screen.queryByText(/Viral upper respiratory tract infection/),
        ).not.toBeInTheDocument(),
      )
    })
  })

  describe('feedback', () => {
    it('records a rating without changing the suggestion', async () => {
      render(<Harness />)
      await ask()

      await userEvent.click(await screen.findByRole('button', { name: /^not useful$/i }))

      await waitFor(() =>
        expect(feedbackMock).toHaveBeenCalledWith({
          suggestion_id: '22222222-2222-4222-8222-222222222222',
          rating: 'not_useful',
        }),
      )
      expect(await screen.findByText(/recorded for review/i)).toBeInTheDocument()
      expect(screen.getByText(/Viral upper respiratory tract infection/)).toBeInTheDocument()
    })

    it('does not interrupt the clinician when feedback fails to send', async () => {
      feedbackMock.mockRejectedValue(httpError(503))
      render(<Harness />)
      await ask()

      await userEvent.click(await screen.findByRole('button', { name: /^useful$/i }))

      await waitFor(() => expect(feedbackMock).toHaveBeenCalled())
      expect(screen.getByText(/Viral upper respiratory tract infection/)).toBeInTheDocument()
    })
  })

  describe('behaviour and accessibility', () => {
    it('asks for nothing until the clinician requests it', async () => {
      render(<Harness />)

      await waitFor(() => expect(differentialMock).not.toHaveBeenCalled())
    })

    it('will not send an empty chief complaint', async () => {
      render(<Harness />)
      await userEvent.clear(screen.getByLabelText(/chief complaint/i))

      expect(
        screen.getByRole('button', { name: /get considerations for review/i }),
      ).toBeDisabled()
      expect(differentialMock).not.toHaveBeenCalled()
    })

    it('is operable from the keyboard', async () => {
      render(<Harness />)
      const button = screen.getByRole('button', { name: /get considerations for review/i })

      button.focus()
      expect(button).toHaveFocus()
      await userEvent.keyboard('{Enter}')

      await waitFor(() => expect(differentialMock).toHaveBeenCalled())
    })

    it('writes nothing to browser storage', async () => {
      // The shared API client seeds unrelated mock data into localStorage, so
      // the claim under test is that this card adds nothing of its own, not
      // that storage is empty.
      const before = JSON.stringify({ ...localStorage, ...sessionStorage })

      render(<Harness />)
      await ask()
      await screen.findByText(/Viral upper respiratory tract infection/)

      const after = JSON.stringify({ ...localStorage, ...sessionStorage })

      expect(after).toEqual(before)
      expect(after.toLowerCase()).not.toContain('warfarin')
      expect(after.toLowerCase()).not.toContain('penicillin')
    })

    it('does nothing at all without a visit', async () => {
      render(<Harness visitId={null} />)
      await ask()

      expect(differentialMock).not.toHaveBeenCalled()
    })
  })
})
