import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { AssistantLauncher } from '@/features/assistant/components/AssistantLauncher'
import { formatLastUsed } from '@/features/assistant/components/AssistantPanel'
import { turnsFromMessages } from '@/features/assistant/hooks/useAssistantChat'
import type {
  AssistantChatResponse,
  AssistantConversationResponse,
  AssistantConversationSummary,
  AssistantStoredMessage,
} from '@/api/types/assistant'

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
const listConversationsMock = vi.hoisted(() => vi.fn())
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

const CONVERSATION_ID = '3f1a0b8e-1111-4222-8333-444444444444'

function summary(
  overrides: Partial<AssistantConversationSummary> = {},
): AssistantConversationSummary {
  return {
    conversation_id: CONVERSATION_ID,
    title: 'How do I register a new patient?',
    message_count: 2,
    created_at: '2026-08-28T09:00:00Z',
    last_message_at: '2026-08-28T09:00:00Z',
    ...overrides,
  }
}

function storedConversation(
  overrides: Partial<AssistantConversationResponse> = {},
): AssistantConversationResponse {
  return {
    conversation_id: CONVERSATION_ID,
    title: 'How do I register a new patient?',
    created_at: '2026-08-28T09:00:00Z',
    last_message_at: '2026-08-28T09:00:00Z',
    messages: [
      {
        message_id: 'm-1',
        author: 'user',
        body: 'How do I register a new patient?',
        answer_status: null,
        sources: [],
        request_id: 'req-1',
        created_at: '2026-08-28T09:00:00Z',
      },
      {
        message_id: 'm-2',
        author: 'assistant',
        body: 'Open Reception, then Register patient.',
        answer_status: 'supported',
        sources: [{ label: 'Reception help', kind: 'help', version: '1.0.0' }],
        request_id: 'req-1',
        created_at: '2026-08-28T09:00:00Z',
      },
    ],
    ...overrides,
  }
}

function answer(overrides: Partial<AssistantChatResponse> = {}): AssistantChatResponse {
  return {
    request_id: 'req-abc',
    status: 'supported',
    answer: 'Open Reception, then Register patient.',
    sources: [],
    follow_ups: [],
    conversation_id: CONVERSATION_ID,
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

async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /open hospital assistant/i }))
  return screen.getByRole('dialog')
}

async function openHistory(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /previous chats/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
  getSuggestionsMock.mockResolvedValue({ request_id: 'req-s', suggestions: [] })
  auth.current = {
    isAuthenticated: true,
    isReadOnly: false,
    roles: ['receptionist'],
    user: { role: 'receptionist' },
  }
  chatMock.mockResolvedValue(answer())
  listConversationsMock.mockResolvedValue({ conversations: [summary()] })
  getConversationMock.mockResolvedValue(storedConversation())
  deleteConversationMock.mockResolvedValue(undefined)
  clearConversationsMock.mockResolvedValue(undefined)
})

describe('rebuilding a stored conversation', () => {
  it('pairs each question with the answer that followed it', () => {
    const turns = turnsFromMessages(storedConversation().messages)

    expect(turns).toHaveLength(1)
    expect(turns[0].question).toBe('How do I register a new patient?')
    expect(turns[0].answer).toBe('Open Reception, then Register patient.')
    expect(turns[0].answerStatus).toBe('supported')
  })

  it('keeps the request id so a reopened answer can still be rated', () => {
    expect(turnsFromMessages(storedConversation().messages)[0].requestId).toBe('req-1')
  })

  it('shows a question whose answer never arrived rather than dropping it', () => {
    const messages: AssistantStoredMessage[] = [storedConversation().messages[0]]

    const turns = turnsFromMessages(messages)

    expect(turns).toHaveLength(1)
    expect(turns[0].answer).toBeUndefined()
  })

  it('shows an answer with no question ahead of it rather than losing it', () => {
    const messages: AssistantStoredMessage[] = [storedConversation().messages[1]]

    const turns = turnsFromMessages(messages)

    expect(turns).toHaveLength(1)
    expect(turns[0].question).toBe('')
    expect(turns[0].answer).toBe('Open Reception, then Register patient.')
  })

  it('handles an empty conversation without throwing', () => {
    expect(turnsFromMessages([])).toEqual([])
  })
})

describe('when a conversation was last used', () => {
  const now = new Date('2026-08-29T15:00:00Z')

  it('shows a time for today', () => {
    expect(formatLastUsed('2026-08-29T09:30:00Z', now)).toMatch(/\d/)
  })

  it('names yesterday rather than showing a date', () => {
    expect(formatLastUsed('2026-08-28T09:30:00Z', now)).toBe('Yesterday')
  })

  it('shows a date for anything older', () => {
    expect(formatLastUsed('2026-08-01T09:30:00Z', now)).not.toBe('Yesterday')
  })

  it('renders nothing for a value it cannot read', () => {
    expect(formatLastUsed('not a date', now)).toBe('')
  })
})

describe('browsing previous chats', () => {
  it('lists the conversations the server returned', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await openHistory(user)

    expect(
      await screen.findByRole('button', { name: /^How do I register a new patient\?/ }),
    ).toBeInTheDocument()
  })

  it('reopens a conversation with its question and answer on screen', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await openHistory(user)

    await user.click(
      await screen.findByRole('button', { name: /^How do I register a new patient\?/ }),
    )

    await waitFor(() => {
      expect(getConversationMock).toHaveBeenCalledWith(
        CONVERSATION_ID,
        expect.anything(),
      )
    })
    expect(
      await screen.findByText('Open Reception, then Register patient.'),
    ).toBeInTheDocument()
  })

  it('continues the reopened thread when the next question is asked', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await openHistory(user)
    await user.click(
      await screen.findByRole('button', { name: /^How do I register a new patient\?/ }),
    )
    await screen.findByText('Open Reception, then Register patient.')

    await user.type(screen.getByRole('textbox'), 'And how do I find them again?')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(chatMock).toHaveBeenCalledWith(
        expect.objectContaining({ conversation_id: CONVERSATION_ID }),
        expect.anything(),
      )
    })
  })

  it('starts a fresh thread when New chat is pressed', async () => {
    // Nobody has asked anything before, so the panel opens on an empty thread
    // rather than reopening one. This suite is about what New chat does to the
    // thread in front of the user.
    listConversationsMock.mockResolvedValue({ conversations: [] })
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)

    await user.type(screen.getByRole('textbox'), 'How do I register a new patient?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('Open Reception, then Register patient.')

    await user.click(screen.getByRole('button', { name: /start a new chat/i }))

    expect(
      screen.queryByText('Open Reception, then Register patient.'),
    ).not.toBeInTheDocument()

    await user.type(screen.getByRole('textbox'), 'What reports can I run?')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(chatMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ conversation_id: undefined }),
        expect.anything(),
      )
    })
  })

  it('carries the thread from the first answer into the next question', async () => {
    listConversationsMock.mockResolvedValue({ conversations: [] })
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)

    await user.type(screen.getByRole('textbox'), 'How do I register a new patient?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('Open Reception, then Register patient.')

    await user.type(screen.getByRole('textbox'), 'What reports can I run?')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(chatMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ conversation_id: CONVERSATION_ID }),
        expect.anything(),
      )
    })
  })
})

describe('carrying on where the user left off', () => {
  it('reopens the most recent conversation when the panel is opened', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)

    await waitFor(() => {
      expect(getConversationMock).toHaveBeenCalledWith(
        CONVERSATION_ID,
        expect.anything(),
      )
    })
    expect(
      await screen.findByText('Open Reception, then Register patient.'),
    ).toBeInTheDocument()
  })

  it('sends the next question into the thread it reopened', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await screen.findByText('Open Reception, then Register patient.')

    await user.type(screen.getByRole('textbox'), 'And how do I find them again?')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(chatMock).toHaveBeenCalledWith(
        expect.objectContaining({ conversation_id: CONVERSATION_ID }),
        expect.anything(),
      )
    })
  })

  it('does not reopen anything once New chat has been pressed', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await screen.findByText('Open Reception, then Register patient.')
    getConversationMock.mockClear()

    await user.click(screen.getByRole('button', { name: /start a new chat/i }))
    await user.click(screen.getByRole('button', { name: /previous chats/i }))
    await user.click(screen.getByRole('button', { name: /back to this chat/i }))

    await waitFor(() => expect(listConversationsMock).toHaveBeenCalledTimes(2))
    expect(getConversationMock).not.toHaveBeenCalled()
    expect(
      screen.queryByText('Open Reception, then Register patient.'),
    ).not.toBeInTheDocument()
  })

  it('reopens nothing when there is nothing to reopen', async () => {
    listConversationsMock.mockResolvedValue({ conversations: [] })
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)

    await waitFor(() => expect(listConversationsMock).toHaveBeenCalled())
    expect(getConversationMock).not.toHaveBeenCalled()
  })
})

describe('what to ask next', () => {
  it('offers the follow-ups the server returned with an answer', async () => {
    listConversationsMock.mockResolvedValue({ conversations: [] })
    chatMock.mockResolvedValue(
      answer({ follow_ups: ['How do I take a payment?', 'What reports can I run?'] }),
    )
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)

    await user.type(screen.getByRole('textbox'), 'How do I register a new patient?')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(
      await screen.findByRole('button', { name: 'How do I take a payment?' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'What reports can I run?' }),
    ).toBeInTheDocument()
  })

  it('asks a follow-up when it is pressed', async () => {
    listConversationsMock.mockResolvedValue({ conversations: [] })
    chatMock.mockResolvedValue(answer({ follow_ups: ['How do I take a payment?'] }))
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await user.type(screen.getByRole('textbox'), 'How do I register a new patient?')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    await user.click(
      await screen.findByRole('button', { name: 'How do I take a payment?' }),
    )

    await waitFor(() => {
      expect(chatMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ question: 'How do I take a payment?' }),
        expect.anything(),
      )
    })
  })

  it('offers follow-ups under a reopened conversation too', async () => {
    getConversationMock.mockResolvedValue(
      storedConversation({ follow_ups: ['How do I take a payment?'] }),
    )
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)

    expect(
      await screen.findByRole('button', { name: 'How do I take a payment?' }),
    ).toBeInTheDocument()
  })

  it('offers them under the newest answer only', async () => {
    listConversationsMock.mockResolvedValue({ conversations: [] })
    chatMock.mockResolvedValue(answer({ follow_ups: ['How do I take a payment?'] }))
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await user.type(screen.getByRole('textbox'), 'How do I register a new patient?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByRole('button', { name: 'How do I take a payment?' })

    chatMock.mockResolvedValue(answer({ answer: 'Open Billing.', follow_ups: [] }))
    await user.type(screen.getByRole('textbox'), 'What reports can I run?')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    await screen.findByText('Open Billing.')

    expect(
      screen.queryByRole('button', { name: 'How do I take a payment?' }),
    ).not.toBeInTheDocument()
  })
})

describe('deleting previous chats', () => {
  it('deletes one conversation and drops it from the list', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await openHistory(user)

    await user.click(
      await screen.findByRole('button', { name: /delete chat: How do I register/i }),
    )

    await waitFor(() => {
      expect(deleteConversationMock).toHaveBeenCalledWith(CONVERSATION_ID)
    })
    expect(
      screen.queryByRole('button', { name: /^How do I register a new patient\?/ }),
    ).not.toBeInTheDocument()
  })

  it('asks before deleting everything', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await openHistory(user)

    await user.click(await screen.findByRole('button', { name: /delete all chats/i }))

    expect(screen.getByText(/delete all your chats\?/i)).toBeInTheDocument()
    expect(clearConversationsMock).not.toHaveBeenCalled()
  })

  it('keeps everything when the confirmation is declined', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await openHistory(user)
    await user.click(await screen.findByRole('button', { name: /delete all chats/i }))

    await user.click(screen.getByRole('button', { name: /keep them/i }))

    expect(clearConversationsMock).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: /^How do I register a new patient\?/ }),
    ).toBeInTheDocument()
  })

  it('clears everything once the confirmation is accepted', async () => {
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)
    await openHistory(user)
    await user.click(await screen.findByRole('button', { name: /delete all chats/i }))

    await user.click(screen.getByRole('button', { name: /^delete all$/i }))

    await waitFor(() => expect(clearConversationsMock).toHaveBeenCalled())
    expect(
      await screen.findByText(/you have no previous chats yet/i),
    ).toBeInTheDocument()
  })
})

describe('when history is switched off for the deployment', () => {
  it('offers no history controls at all', async () => {
    listConversationsMock.mockRejectedValue(httpError(404, 'CAPABILITY_DISABLED'))
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    const panel = await openPanel(user)

    await waitFor(() => {
      expect(
        within(panel).queryByRole('button', { name: /previous chats/i }),
      ).not.toBeInTheDocument()
    })
    expect(
      within(panel).queryByRole('button', { name: /start a new chat/i }),
    ).not.toBeInTheDocument()
  })

  it('leaves asking a question working exactly as before', async () => {
    listConversationsMock.mockRejectedValue(httpError(404, 'CAPABILITY_DISABLED'))
    chatMock.mockResolvedValue(answer({ conversation_id: null }))
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    await openPanel(user)

    await user.type(screen.getByRole('textbox'), 'How do I register a new patient?')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(
      await screen.findByText('Open Reception, then Register patient.'),
    ).toBeInTheDocument()
  })

  it('shows no error message about history', async () => {
    listConversationsMock.mockRejectedValue(httpError(404, 'CAPABILITY_DISABLED'))
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    const panel = await openPanel(user)

    await waitFor(() => expect(listConversationsMock).toHaveBeenCalled())
    expect(within(panel).queryByText(/not enabled|unavailable/i)).not.toBeInTheDocument()
  })
})

describe('when the history store is unreachable', () => {
  it('says so without taking the assistant away', async () => {
    listConversationsMock.mockRejectedValue(httpError(503, 'PROVIDER_UNAVAILABLE'))
    const user = userEvent.setup()
    render(<AssistantLauncher />)
    const panel = await openPanel(user)

    expect(
      await within(panel).findByText(/temporarily unavailable/i),
    ).toBeInTheDocument()
    expect(within(panel).getByRole('textbox')).toBeInTheDocument()
  })
})
