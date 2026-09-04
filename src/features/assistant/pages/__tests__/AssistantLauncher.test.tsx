import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { AssistantLauncher } from '@/features/assistant/components/AssistantLauncher'
import type { AssistantChatResponse } from '@/api/types/assistant'

const auth = vi.hoisted(() => ({
  current: {
    isAuthenticated: true,
    isReadOnly: false,
    roles: ['receptionist'] as string[],
    user: { role: 'receptionist' } as { role: string } | null,
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => auth.current,
}))

const chatMock = vi.hoisted(() => vi.fn())
const feedbackMock = vi.hoisted(() => vi.fn())
// The panel asks for the history list when it opens. Answering with an empty
// list here keeps these tests about chat, not about history.
const listConversationsMock = vi.hoisted(() => vi.fn(async () => ({ conversations: [] })))
const getConversationMock = vi.hoisted(() => vi.fn())
const deleteConversationMock = vi.hoisted(() => vi.fn())
const clearConversationsMock = vi.hoisted(() => vi.fn())

// Starting questions come from the server now, so the panel calls this on
// mount. It resolves to an empty list here: these suites are about the
// conversation, and AssistantSuggestions.test.tsx covers the list itself.
const getSuggestionsMock = vi.hoisted(() =>
  vi.fn(async () => ({ request_id: 'req-s', suggestions: [] })),
)

vi.mock('@/api/services/assistant', () => ({
  assistantService: {
    chat: chatMock,
    getSuggestions: getSuggestionsMock,
    sendFeedback: feedbackMock,
    listConversations: listConversationsMock,
    getConversation: getConversationMock,
    deleteConversation: deleteConversationMock,
    clearConversations: clearConversationsMock,
  },
}))

function answer(overrides: Partial<AssistantChatResponse> = {}): AssistantChatResponse {
  return {
    request_id: 'req-abc',
    status: 'supported',
    answer: 'Open the Reception screen and choose Register Patient.',
    sources: [{ label: 'Reception help', kind: 'help', version: '1.0.0' }],
    follow_ups: [],
    ...overrides,
  }
}

function httpError(status: number, code?: string): AxiosError {
  const error = new AxiosError('failed')
  error.response = {
    status,
    statusText: '',
    data: code ? { request_id: 'req-err', code, message: 'server text' } : undefined,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  }
  return error
}

function setAuth(partial: Partial<typeof auth.current>) {
  auth.current = { ...auth.current, ...partial }
}

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /open hospital assistant/i }))
  return screen.getByRole('dialog')
}

describe('AssistantLauncher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSuggestionsMock.mockResolvedValue({ request_id: 'req-s', suggestions: [] })
    localStorage.clear()
    setAuth({
      isAuthenticated: true,
      isReadOnly: false,
      roles: ['receptionist'],
      user: { role: 'receptionist' },
    })
  })

  describe('who sees the launcher', () => {
    it('shows exactly one launcher for a signed-in staff member', () => {
      render(<AssistantLauncher />)

      expect(screen.getAllByRole('button', { name: /hospital assistant/i })).toHaveLength(1)
    })

    it('does not render on an unauthenticated surface', () => {
      setAuth({ isAuthenticated: false })
      render(<AssistantLauncher />)

      expect(screen.queryByRole('button', { name: /hospital assistant/i })).not.toBeInTheDocument()
    })

    it('does not render for a platform super admin', () => {
      setAuth({ roles: ['super_admin'], user: { role: 'super_admin' } })
      render(<AssistantLauncher />)

      expect(screen.queryByRole('button', { name: /hospital assistant/i })).not.toBeInTheDocument()
    })

    it('does not render for a super admin who also holds a tenant role', () => {
      setAuth({ roles: ['super_admin', 'doctor'], user: { role: 'doctor' } })
      render(<AssistantLauncher />)

      expect(screen.queryByRole('button', { name: /hospital assistant/i })).not.toBeInTheDocument()
    })

    it('does not render for a signed-in user holding no assistant role', () => {
      setAuth({ roles: ['hospital_user'], user: { role: 'hospital_user' } })
      render(<AssistantLauncher />)

      expect(screen.queryByRole('button', { name: /hospital assistant/i })).not.toBeInTheDocument()
    })

    it('does not render during a read-only impersonation session', () => {
      setAuth({ isReadOnly: true })
      render(<AssistantLauncher />)

      expect(screen.queryByRole('button', { name: /hospital assistant/i })).not.toBeInTheDocument()
    })

    it.each([
      'hospital_admin',
      'receptionist',
      'triage_nurse',
      'ward_nurse',
      'doctor',
      'lab_technician',
      'radiographer',
      'pharmacist',
      'cashier',
    ])('renders for %s', (role) => {
      setAuth({ roles: [role], user: { role } })
      render(<AssistantLauncher />)

      expect(screen.getByRole('button', { name: /open hospital assistant/i })).toBeInTheDocument()
    })
  })

  describe('opening and closing', () => {
    it('opens the panel on click and reports its expanded state', async () => {
      const user = userEvent.setup()
      render(<AssistantLauncher />)

      const launcher = screen.getByRole('button', { name: /open hospital assistant/i })
      expect(launcher).toHaveAttribute('aria-expanded', 'false')

      await user.click(launcher)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /close hospital assistant/i }),
      ).toHaveAttribute('aria-expanded', 'true')
    })

    it('is reachable and operable with the keyboard alone', async () => {
      const user = userEvent.setup()
      render(<AssistantLauncher />)

      await user.tab()
      expect(screen.getByRole('button', { name: /open hospital assistant/i })).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('moves focus to the question box when the panel opens', async () => {
      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await waitFor(() => {
        expect(screen.getByLabelText(/ask the hospital assistant/i)).toHaveFocus()
      })
    })

    it('closes on Escape and returns focus to the launcher', async () => {
      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.keyboard('{Escape}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /open hospital assistant/i })).toHaveFocus()
    })

    it('closes with the close control', async () => {
      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.click(screen.getByRole('button', { name: /^close assistant$/i }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('explains the scope and states the assistant cannot change records', async () => {
      const user = userEvent.setup()
      render(<AssistantLauncher />)
      const dialog = await openPanel(user)

      expect(within(dialog).getByText(/cannot give clinical advice/i)).toBeInTheDocument()
      expect(within(dialog).getByText(/cannot change any hospital record/i)).toBeInTheDocument()
    })
  })

  describe('asking a question', () => {
    it('shows a loading state, then the answer', async () => {
      let resolve: (value: AssistantChatResponse) => void = () => {}
      chatMock.mockReturnValue(
        new Promise<AssistantChatResponse>((r) => {
          resolve = r
        }),
      )

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'how do I register a patient')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      expect(await screen.findByText(/thinking/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()

      resolve(answer())

      expect(
        await screen.findByText(/open the reception screen and choose register patient/i),
      ).toBeInTheDocument()
      // No Sources footnote under the answer. Retrieval cites everything that
      // scored above zero, so a question about taking a payment was footnoted
      // "Do not share accounts or sign-in details" and no reader was better off
      // for it. The trace is kept server-side on the stored exchange and the
      // audit record instead.
      expect(screen.queryByText(/^sources$/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/reception help/i)).not.toBeInTheDocument()
    })

    it('sends the question through the assistant service, not a bare axios call', async () => {
      chatMock.mockResolvedValue(answer())

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'what reports can I run')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      await waitFor(() => expect(chatMock).toHaveBeenCalledTimes(1))
      expect(chatMock.mock.calls[0][0]).toEqual({ question: 'what reports can I run' })
    })

    it('never sends a tenant, role, or provider field the server owns', async () => {
      chatMock.mockResolvedValue(answer())

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'hello')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      await waitFor(() => expect(chatMock).toHaveBeenCalled())
      const sent = Object.keys(chatMock.mock.calls[0][0])
      for (const forbidden of ['tenant_id', 'role', 'roles', 'api_key', 'system_prompt', 'sql']) {
        expect(sent).not.toContain(forbidden)
      }
    })

    it('offers the questions the server returned, and no others', async () => {
      // The panel used to hardcode three questions here, two of which matched no
      // content on the server and one of which only worked for reception. They
      // now come from the server, which is the only side that knows what this
      // user can actually get an answer to, so the panel must render what it was
      // given rather than a list of its own.
      getSuggestionsMock.mockResolvedValue({
        request_id: 'req-s',
        suggestions: [
          { question: 'How do I dispense a prescription?', kind: 'content' },
          { question: 'Which medicines are out of stock?', kind: 'live_metric' },
        ],
      })
      chatMock.mockResolvedValue(answer())

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      expect(
        await screen.findByRole('button', { name: /how do i dispense a prescription/i }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /how do i register a new patient/i }),
      ).not.toBeInTheDocument()
    })

    it('marks a live figure so a count does not read as a help page', async () => {
      getSuggestionsMock.mockResolvedValue({
        request_id: 'req-s',
        suggestions: [
          { question: 'Which medicines are out of stock?', kind: 'live_metric' },
        ],
      })

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      expect(
        await screen.findByRole('button', { name: /which medicines are out of stock.*live figure/i }),
      ).toBeInTheDocument()
    })

    it('sends a suggested question when one is chosen', async () => {
      getSuggestionsMock.mockResolvedValue({
        request_id: 'req-s',
        suggestions: [
          { question: 'How do I dispense a prescription?', kind: 'content' },
        ],
      })
      chatMock.mockResolvedValue(answer())

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.click(
        await screen.findByRole('button', { name: /how do i dispense a prescription/i }),
      )

      await waitFor(() => expect(chatMock).toHaveBeenCalledTimes(1))
      expect(chatMock.mock.calls[0][0].question).toBe('How do I dispense a prescription?')
    })

    it('marks a medicine question so it does not read as a help page', async () => {
      getSuggestionsMock.mockResolvedValue({
        request_id: 'req-s',
        suggestions: [
          { question: 'Can ibuprofen and enalapril be given together?', kind: 'medicine' },
        ],
      })

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      expect(
        await screen.findByRole('button', {
          name: /can ibuprofen and enalapril be given together.*medicines reference/i,
        }),
      ).toBeInTheDocument()
    })

    it('stops saying it gives no clinical advice once it answers about medicines', async () => {
      // The panel has no role check of its own and should not grow one. A
      // medicine suggestion is only ever returned to a caller who can have one
      // answered, so its presence is the server telling the panel what to say.
      getSuggestionsMock.mockResolvedValue({
        request_id: 'req-s',
        suggestions: [
          { question: 'Can ibuprofen and enalapril be given together?', kind: 'medicine' },
        ],
      })

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      const panel = await openPanel(user)

      expect(
        await within(panel).findByText(/decision support from the hospital reference/i),
      ).toBeInTheDocument()
      expect(
        within(panel).queryByText(/i cannot give clinical advice/i),
      ).not.toBeInTheDocument()
    })

    it('still says it gives no clinical advice for everybody else', async () => {
      getSuggestionsMock.mockResolvedValue({
        request_id: 'req-s',
        suggestions: [
          { question: 'How do I dispense a prescription?', kind: 'content' },
        ],
      })

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      const panel = await openPanel(user)

      expect(
        await within(panel).findByText(/i cannot give clinical advice/i),
      ).toBeInTheDocument()
    })

    it('shows no suggestions at all when the server cannot supply any', async () => {
      // Deliberately no fallback list: a suggestion that fails teaches people the
      // assistant does not work, which is exactly what the hardcoded three did.
      getSuggestionsMock.mockRejectedValue(new Error('unavailable'))

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      expect(screen.queryByText(/try asking/i)).not.toBeInTheDocument()
    })

    it('shows a refusal as the server wrote it, with no banner repeating it', async () => {
      // The "Outside what I can answer" banner is gone. A refusal now opens with
      // "I can't help with that" and goes straight on to what this user can ask,
      // so the banner only said the same thing twice, and more coldly.
      chatMock.mockResolvedValue(
        answer({
          status: 'unsupported',
          answer:
            "I can't help with that. But I can help you with: 1. Registration and visits - how to register a patient.",
          sources: [],
        }),
      )

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'unrelated nonsense')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      expect(await screen.findByText(/but i can help you with/i)).toBeInTheDocument()
      expect(screen.queryByText(/outside what i can answer/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/^sources$/i)).not.toBeInTheDocument()
    })

    it('still marks an unavailable answer, which is a failure rather than a refusal', async () => {
      chatMock.mockResolvedValue(
        answer({
          status: 'unavailable',
          answer: 'That figure could not be read just now.',
          sources: [],
        }),
      )

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'how many beds are free')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      expect(await screen.findByText(/^unavailable$/i)).toBeInTheDocument()
    })

    it('blocks an over-long question before it reaches the network', async () => {
      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      const box = screen.getByLabelText(/ask the hospital assistant/i)
      await user.click(box)
      await user.paste('x'.repeat(2001))

      expect(await screen.findByText(/too long/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^send$/i })).toBeDisabled()
      expect(chatMock).not.toHaveBeenCalled()
    })
  })

  describe('failure states', () => {
    it('shows a timeout as retryable and retries on request', async () => {
      chatMock.mockRejectedValueOnce(httpError(504, 'PROVIDER_TIMEOUT'))
      chatMock.mockResolvedValueOnce(answer())

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'a question')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      expect(await screen.findByText(/took too long/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /try again/i }))

      expect(
        await screen.findByText(/open the reception screen and choose register patient/i),
      ).toBeInTheDocument()
    })

    it('shows an unavailable provider without inventing an answer', async () => {
      chatMock.mockRejectedValue(httpError(503, 'PROVIDER_UNAVAILABLE'))

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'a question')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument()
    })

    it('shows a permission denial instead of a generic error', async () => {
      chatMock.mockRejectedValue(httpError(403, 'PERMISSION_DENIED'))

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'a question')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      expect(
        await screen.findByText(/your role does not have access to the assistant/i),
      ).toBeInTheDocument()
    })

    it('withdraws the launcher when the deployment has the capability switched off', async () => {
      chatMock.mockRejectedValue(httpError(404, 'CAPABILITY_DISABLED'))

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'a question')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /hospital assistant/i })).not.toBeInTheDocument()
      })
    })

    it('never puts server error text on the screen', async () => {
      chatMock.mockRejectedValue(httpError(503, 'PROVIDER_UNAVAILABLE'))

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'a question')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      await screen.findByText(/temporarily unavailable/i)
      expect(document.body.textContent).not.toContain('server text')
    })
  })

  describe('feedback', () => {
    it('sends a rating scoped to the answer request id', async () => {
      chatMock.mockResolvedValue(answer())
      feedbackMock.mockResolvedValue(undefined)

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'a question')
      await user.click(screen.getByRole('button', { name: /^send$/i }))
      await screen.findByText(/was this helpful/i)

      await user.click(screen.getByRole('button', { name: /^yes$/i }))

      await waitFor(() =>
        expect(feedbackMock).toHaveBeenCalledWith({ request_id: 'req-abc', rating: 'helpful' }),
      )
      expect(await screen.findByText(/thanks for the feedback/i)).toBeInTheDocument()
    })

    it('does not interrupt the user when a rating fails to send', async () => {
      chatMock.mockResolvedValue(answer())
      feedbackMock.mockRejectedValue(httpError(503))

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'a question')
      await user.click(screen.getByRole('button', { name: /^send$/i }))
      await screen.findByText(/was this helpful/i)

      await user.click(screen.getByRole('button', { name: /^no$/i }))

      expect(await screen.findByText(/thanks for the feedback/i)).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('what is stored in the browser', () => {
    it('never writes the question, the answer, or its sources to local storage', async () => {
      chatMock.mockResolvedValue(answer())

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(
        screen.getByLabelText(/ask the hospital assistant/i),
        'how do I register a patient',
      )
      await user.click(screen.getByRole('button', { name: /^send$/i }))
      await screen.findByText(/open the reception screen/i)

      const stored = JSON.stringify(localStorage)
      expect(stored).not.toContain('how do I register a patient')
      expect(stored).not.toContain('Open the Reception screen')
      expect(stored).not.toContain('Reception help')
    })
  })
})
