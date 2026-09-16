import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AssistantConfigPage } from '../AssistantConfigPage'
import { assistantConfigService } from '@/api/services/assistantConfig'
import type { AssistantConfigResponse } from '@/api/types/assistantConfig'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/api/services/assistantConfig', () => ({
  assistantConfigService: {
    get: vi.fn(),
    update: vi.fn(),
    test: vi.fn(),
  },
}))

function config(overrides: Partial<AssistantConfigResponse> = {}): AssistantConfigResponse {
  return {
    provider: 'groq',
    api_key_set: true,
    api_key_hint: '****KZp7',
    base_url: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-120b',
    transcription_model: 'whisper-large-v3',
    max_question_chars: 2000,
    request_timeout_seconds: 20,
    history_max_conversations: 50,
    history_max_messages: 200,
    max_audio_bytes: 5242880,
    max_audio_duration_ms: 60000,
    voice_timeout_seconds: 20,
    live_data_cache_seconds: 30,
    live_data_timeout_seconds: 3,
    live_data_max_metrics: 3,
    is_stored: true,
    updated_by: 'superadmin',
    updated_at: '2026-09-09T10:00:00Z',
    providers: ['groq'],
    chat_models: [
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', note: 'Default.' },
      { id: 'qwen/qwen3-32b', label: 'Qwen 3 32B', note: 'Strong Swahili.' },
    ],
    transcription_models: [
      { id: 'whisper-large-v3', label: 'Whisper Large v3', note: 'Default.' },
    ],
    bounds: {
      max_question_chars: { minimum: 200, maximum: 8000 },
      request_timeout_seconds: { minimum: 5, maximum: 28 },
      history_max_conversations: { minimum: 5, maximum: 500 },
      history_max_messages: { minimum: 10, maximum: 2000 },
      max_audio_bytes: { minimum: 262144, maximum: 26214400 },
      max_audio_duration_ms: { minimum: 5000, maximum: 300000 },
      voice_timeout_seconds: { minimum: 5, maximum: 28 },
      live_data_cache_seconds: { minimum: 0, maximum: 300 },
      live_data_timeout_seconds: { minimum: 1, maximum: 15 },
      live_data_max_metrics: { minimum: 1, maximum: 10 },
    },
    assistant_enabled: true,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AssistantConfigPage />
    </MemoryRouter>,
  )
}

describe('AssistantConfigPage (Master)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assistantConfigService.get).mockResolvedValue(config())
    vi.mocked(assistantConfigService.update).mockResolvedValue(config())
  })

  it('shows which key is loaded without ever holding the key', async () => {
    renderPage()

    // The masked tail is enough to tell two keys apart and useless on its own.
    // The field itself starts empty: a box pre-filled with a mask would send
    // the mask back as the new key on the next save.
    const field = await screen.findByLabelText(/api key/i)
    expect(field).toHaveValue('')
    expect(field).toHaveAttribute('placeholder', expect.stringContaining('****KZp7'))
  })

  it('says when the deployment switch is off, because nothing here works then', async () => {
    vi.mocked(assistantConfigService.get).mockResolvedValue(
      config({ assistant_enabled: false }),
    )

    renderPage()

    expect(
      await screen.findByText(/assistant is switched off for this deployment/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/ASSISTANT_OPERATIONAL_CHAT_ENABLED/)).toBeInTheDocument()
  })

  it('offers only the approved models', async () => {
    renderPage()

    const select = await screen.findByLabelText(/answering model/i)
    const offered = Array.from(select.querySelectorAll('option')).map((o) => o.value)

    expect(offered).toEqual(['openai/gpt-oss-120b', 'qwen/qwen3-32b'])
    expect(offered.some((id) => id.startsWith('groq/compound'))).toBe(false)
  })

  it('holds the numeric fields to the ranges the server enforces', async () => {
    renderPage()

    const timeout = await screen.findByLabelText(/answer timeout/i)
    expect(timeout).toHaveAttribute('min', '5')
    expect(timeout).toHaveAttribute('max', '28')
  })

  it('cannot be saved until something has changed', async () => {
    const user = userEvent.setup()
    renderPage()

    const save = await screen.findByRole('button', { name: /save changes/i })
    expect(save).toBeDisabled()

    await user.type(screen.getByLabelText(/api key/i), 'gsk_new')

    expect(save).toBeEnabled()
  })

  it('sends only what changed, so a timeout edit cannot wipe the key', async () => {
    const user = userEvent.setup()
    renderPage()

    const timeout = await screen.findByLabelText(/answer timeout/i)
    await user.clear(timeout)
    await user.type(timeout, '25')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(assistantConfigService.update).toHaveBeenCalled()
    })
    const payload = vi.mocked(assistantConfigService.update).mock.calls[0][0]
    expect(payload.request_timeout_seconds).toBe(25)
    expect(payload).not.toHaveProperty('api_key')
    expect(payload).not.toHaveProperty('clear_api_key')
  })

  it('says when nobody has configured it yet', async () => {
    vi.mocked(assistantConfigService.get).mockResolvedValue(config({ is_stored: false }))

    renderPage()

    expect(
      await screen.findByText(/running on its built-in defaults/i),
    ).toBeInTheDocument()
  })

  it('cannot test a provider with no key set', async () => {
    vi.mocked(assistantConfigService.get).mockResolvedValue(
      config({ api_key_set: false, api_key_hint: null }),
    )

    renderPage()

    expect(await screen.findByRole('button', { name: /test/i })).toBeDisabled()
  })
})
