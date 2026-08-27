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

vi.mock('@/api/services/assistant', () => ({
  assistantService: {
    chat: chatMock,
    sendFeedback: feedbackMock,
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
    it('shows a loading state, then the answer and its sources', async () => {
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
      expect(screen.getByText(/reception help \(version 1\.0\.0\)/i)).toBeInTheDocument()
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

    it('sends a suggested question when one is chosen', async () => {
      chatMock.mockResolvedValue(answer())

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.click(screen.getByRole('button', { name: /how do i register a new patient/i }))

      await waitFor(() => expect(chatMock).toHaveBeenCalledTimes(1))
    })

    it('labels an unsupported answer rather than presenting it as a normal reply', async () => {
      chatMock.mockResolvedValue(
        answer({
          status: 'unsupported',
          answer: 'That is outside what I can help with.',
          sources: [],
        }),
      )

      const user = userEvent.setup()
      render(<AssistantLauncher />)
      await openPanel(user)

      await user.type(screen.getByLabelText(/ask the hospital assistant/i), 'unrelated nonsense')
      await user.click(screen.getByRole('button', { name: /^send$/i }))

      expect(await screen.findByText(/outside what i can answer/i)).toBeInTheDocument()
      expect(screen.queryByText(/^sources$/i)).not.toBeInTheDocument()
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
