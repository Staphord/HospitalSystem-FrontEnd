import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/PageHeader'
import { assistantConfigService } from '@/api/services/assistantConfig'
import type {
  AssistantConfigResponse,
  AssistantConfigUpdate,
  AssistantLimitField,
} from '@/api/types/assistantConfig'

/**
 * Platform configuration for the Hospital Assistant.
 *
 * These settings used to be environment variables on report-service, which
 * meant changing a model or rotating a leaked key needed a deploy. They are now
 * one row in the master database, edited here.
 *
 * Platform scope, not tenant scope: one key, one model and one set of limits
 * serve every hospital. That is why this page lives in the master portal and
 * why no hospital administrator can reach the routes behind it.
 *
 * The one thing this page cannot change is whether the assistant runs at all.
 * That stays an environment switch, so turning the assistant on for every
 * hospital on the platform is a deploy-time act with a record, not a click. The
 * banner at the top says which way it is set.
 */

/** The numeric settings, grouped the way an operator thinks about them. */
const LIMIT_GROUPS: {
  title: string
  description: string
  fields: { key: AssistantLimitField; label: string; help: string; unit?: string }[]
}[] = [
  {
    title: 'Questions and answers',
    description: 'What one question may cost before the assistant gives up on it.',
    fields: [
      {
        key: 'max_question_chars',
        label: 'Longest question',
        help: 'A longer question is refused before it reaches the model.',
        unit: 'characters',
      },
      {
        key: 'request_timeout_seconds',
        label: 'Answer timeout',
        help: 'Must stay under the gateway’s 30 second proxy timeout, or a slow answer reaches staff as a gateway error instead of the assistant’s own message.',
        unit: 'seconds',
      },
    ],
  },
  {
    title: 'Chat history',
    description:
      'Per staff member. The oldest conversation is dropped at the ceiling, and a thread that fills up rolls into a new one, so one person leaving the panel open cannot fill a hospital’s database.',
    fields: [
      {
        key: 'history_max_conversations',
        label: 'Conversations kept',
        help: 'Oldest first out.',
        unit: 'conversations',
      },
      {
        key: 'history_max_messages',
        label: 'Messages per conversation',
        help: 'A full thread starts a new one rather than growing without limit.',
        unit: 'messages',
      },
    ],
  },
  {
    title: 'Push-to-talk voice',
    description:
      'Bounds on one recording, all enforced on the server. Raw audio is never stored, and there is deliberately no retention setting to turn on.',
    fields: [
      {
        key: 'max_audio_bytes',
        label: 'Largest recording',
        help: 'Checked against the declared length before the body is read, and against the real length after.',
        unit: 'bytes',
      },
      {
        key: 'max_audio_duration_ms',
        label: 'Longest recording',
        help: 'Read out of the audio itself, not taken from the browser.',
        unit: 'milliseconds',
      },
      {
        key: 'voice_timeout_seconds',
        label: 'Transcription timeout',
        help: 'Same gateway ceiling as the answer timeout.',
        unit: 'seconds',
      },
    ],
  },
  {
    title: 'Live operational figures',
    description:
      'Bed availability, queue depth, stock levels and takings, read from the hospital’s own database over a read-only transaction.',
    fields: [
      {
        key: 'live_data_cache_seconds',
        label: 'Figure lifetime',
        help: 'Keep it short. It is what stops twenty questions a minute about beds becoming twenty database scans.',
        unit: 'seconds',
      },
      {
        key: 'live_data_timeout_seconds',
        label: 'Query timeout',
        help: 'Applied as a statement timeout inside the transaction, so a slow query releases its connection instead of holding it.',
        unit: 'seconds',
      },
      {
        key: 'live_data_max_metrics',
        label: 'Figures per question',
        help: 'How many figures one question may read.',
        unit: 'figures',
      },
    ],
  },
]

const CARD =
  'bg-surface-container-lowest border border-solid border-outline-variant rounded-lg p-lg mb-lg'
const LABEL = 'block font-label-md text-label-md text-on-surface mb-xs'
const HELP = 'font-body-sm text-body-sm text-secondary mt-xs'
const INPUT =
  'w-full px-md py-sm rounded-lg border border-solid border-outline-variant bg-surface font-body-md text-body-md text-on-surface'
const BUTTON =
  'px-md py-sm rounded-lg font-label-md text-label-md border-0 cursor-pointer transition-colors whitespace-nowrap h-10 flex items-center gap-xs'

export function AssistantConfigPage() {
  const [config, setConfig] = useState<AssistantConfigResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  // The form is held separately from what the server last returned, so the
  // Save button can be disabled until something actually differs.
  const [draft, setDraft] = useState<AssistantConfigUpdate>({})

  // Never seeded from the server: the key does not come back, and a field
  // pre-filled with a mask would be sent back as the literal mask on save.
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await assistantConfigService.get(signal)
      setConfig(data)
      setDraft({})
      setApiKey('')
    } catch {
      toast.error('Could not read the assistant configuration.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const value = useCallback(
    <K extends keyof AssistantConfigResponse>(key: K) => {
      const pending = (draft as Record<string, unknown>)[key as string]
      if (pending !== undefined) return pending as AssistantConfigResponse[K]
      return config?.[key] as AssistantConfigResponse[K]
    },
    [config, draft],
  )

  const isDirty = useMemo(
    () => Object.keys(draft).length > 0 || apiKey.trim().length > 0,
    [draft, apiKey],
  )

  const set = <K extends keyof AssistantConfigUpdate>(
    key: K,
    next: AssistantConfigUpdate[K],
  ) => {
    setDraft((current) => {
      const updated = { ...current, [key]: next }
      // Setting a field back to what the server holds is not a change.
      if (config && next === (config as unknown as Record<string, unknown>)[key as string]) {
        delete updated[key]
      }
      return updated
    })
  }

  const save = async () => {
    if (!config) return

    const payload: AssistantConfigUpdate = { ...draft }
    if (apiKey.trim()) payload.api_key = apiKey.trim()

    if (Object.keys(payload).length === 0) return

    setSaving(true)
    try {
      const updated = await assistantConfigService.update(payload)
      setConfig(updated)
      setDraft({})
      setApiKey('')
      toast.success('Assistant configuration saved.')
    } catch (error) {
      const message =
        (error as { response?: { data?: { detail?: { message?: string } } } })
          ?.response?.data?.detail?.message ?? 'Could not save the configuration.'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const clearKey = async () => {
    if (!config?.api_key_set) return
    if (
      !window.confirm(
        'Remove the stored API key? The assistant will stop answering for every hospital until a new key is set.',
      )
    ) {
      return
    }

    setSaving(true)
    try {
      const updated = await assistantConfigService.update({ clear_api_key: true })
      setConfig(updated)
      setApiKey('')
      toast.success('API key removed.')
    } catch {
      toast.error('Could not remove the API key.')
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setTesting(true)
    try {
      const result = await assistantConfigService.test()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    } catch {
      toast.error('Could not reach the provider.')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="AI Assistant" />
        <div className="text-center py-20 text-secondary font-body-md">
          Reading the assistant configuration&hellip;
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div>
        <PageHeader title="AI Assistant" />
        <div className={CARD}>
          <p className="font-body-md text-body-md text-on-surface m-0">
            The assistant configuration could not be read. This page needs
            report-service to be running and master migration 0023 applied.
          </p>
        </div>
      </div>
    )
  }

  const bound = (field: AssistantLimitField) => config.bounds?.[field]

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        description="The model, the credential, and the limits every hospital's assistant runs under."
      />

      {/* The switch this page cannot set. Without this banner a super admin can
          configure a model perfectly and watch nothing happen. */}
      {!config.assistant_enabled && (
        <div className="bg-error/10 border border-solid border-error rounded-lg p-md mb-lg">
          <div className="font-label-md text-label-md text-error mb-xs">
            The assistant is switched off for this deployment
          </div>
          <p className="font-body-sm text-body-sm text-on-surface m-0">
            Nothing configured here has any effect until{' '}
            <code>ASSISTANT_OPERATIONAL_CHAT_ENABLED</code> is set to{' '}
            <code>true</code> in the environment and report-service is restarted.
            While it is off, staff are not shown the assistant at all. It is
            deliberately not settable from this page: switching the assistant on
            for every hospital on the platform is a deploy-time decision.
          </p>
        </div>
      )}

      {!config.is_stored && (
        <div className="bg-primary/10 border border-solid border-outline-variant rounded-lg p-md mb-lg">
          <p className="font-body-sm text-body-sm text-on-surface m-0">
            Nobody has saved a configuration yet, so the assistant is running on
            its built-in defaults. Saving once takes ownership of these values.
          </p>
        </div>
      )}

      {/* Provider */}
      <div className={CARD}>
        <h3 className="font-title-md text-title-md text-on-surface mt-0 mb-xs">
          Model provider
        </h3>
        <p className="font-body-sm text-body-sm text-secondary mt-0 mb-lg">
          The credential is stored encrypted and is never sent back to a browser,
          written to a log, or put in an audit record.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label className={LABEL} htmlFor="assistant-provider">
              Provider
            </label>
            <select
              id="assistant-provider"
              className={INPUT}
              value={String(value('provider') ?? '')}
              onChange={(e) => set('provider', e.target.value)}
            >
              {config.providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} htmlFor="assistant-base-url">
              Base URL
            </label>
            <input
              id="assistant-base-url"
              className={INPUT}
              type="url"
              value={String(value('base_url') ?? '')}
              onChange={(e) => set('base_url', e.target.value)}
            />
            <p className={HELP}>Must use https.</p>
          </div>
        </div>

        <div className="mt-lg">
          <label className={LABEL} htmlFor="assistant-api-key">
            API key
          </label>
          <div className="flex flex-col sm:flex-row gap-sm">
            <input
              id="assistant-api-key"
              className={INPUT}
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              placeholder={
                config.api_key_set
                  ? `A key is set (${config.api_key_hint}). Type a new one to replace it.`
                  : 'No key set. The assistant cannot answer until one is.'
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              type="button"
              className={`${BUTTON} bg-surface-container-low text-on-surface border border-solid border-outline-variant`}
              onClick={() => setShowKey((shown) => !shown)}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showKey ? 'visibility_off' : 'visibility'}
              </span>
              {showKey ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              className={`${BUTTON} bg-surface-container-low text-on-surface border border-solid border-outline-variant`}
              onClick={test}
              disabled={testing || !config.api_key_set}
            >
              <span className="material-symbols-outlined text-[18px]">
                network_check
              </span>
              {testing ? 'Testing…' : 'Test'}
            </button>
            {config.api_key_set && (
              <button
                type="button"
                className={`${BUTTON} bg-error text-white`}
                onClick={clearKey}
                disabled={saving}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Remove
              </button>
            )}
          </div>
          <p className={HELP}>
            Leave this empty to keep the key that is already stored. Test asks the
            provider to list its models: it sends no prompt, costs nothing in
            tokens, and also reports when the key works but the chosen model is
            not one this account serves.
          </p>
        </div>
      </div>

      {/* Models */}
      <div className={CARD}>
        <h3 className="font-title-md text-title-md text-on-surface mt-0 mb-xs">
          Models
        </h3>
        <p className="font-body-sm text-body-sm text-secondary mt-0 mb-lg">
          A fixed list, not a free text box. The agentic models perform
          server-side web search and code execution, which the assistant must
          never reach, and a mistyped model id fails at the provider minutes
          later in whichever ward asked the next question.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <label className={LABEL} htmlFor="assistant-model">
              Answering model
            </label>
            <select
              id="assistant-model"
              className={INPUT}
              value={String(value('model') ?? '')}
              onChange={(e) => set('model', e.target.value)}
            >
              {config.chat_models.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className={HELP}>
              {config.chat_models.find((m) => m.id === value('model'))?.note}
            </p>
          </div>

          <div>
            <label className={LABEL} htmlFor="assistant-transcription-model">
              Transcription model
            </label>
            <select
              id="assistant-transcription-model"
              className={INPUT}
              value={String(value('transcription_model') ?? '')}
              onChange={(e) => set('transcription_model', e.target.value)}
            >
              {config.transcription_models.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className={HELP}>
              {
                config.transcription_models.find(
                  (m) => m.id === value('transcription_model'),
                )?.note
              }
            </p>
          </div>
        </div>
      </div>

      {/* Limits */}
      {LIMIT_GROUPS.map((group) => (
        <div className={CARD} key={group.title}>
          <h3 className="font-title-md text-title-md text-on-surface mt-0 mb-xs">
            {group.title}
          </h3>
          <p className="font-body-sm text-body-sm text-secondary mt-0 mb-lg">
            {group.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {group.fields.map((field) => {
              const limits = bound(field.key)
              return (
                <div key={field.key}>
                  <label className={LABEL} htmlFor={`assistant-${field.key}`}>
                    {field.label}
                    {field.unit && (
                      <span className="text-secondary font-normal">
                        {' '}
                        ({field.unit})
                      </span>
                    )}
                  </label>
                  <input
                    id={`assistant-${field.key}`}
                    className={INPUT}
                    type="number"
                    min={limits?.minimum}
                    max={limits?.maximum}
                    value={Number(value(field.key) ?? 0)}
                    onChange={(e) => {
                      const next = Number(e.target.value)
                      if (Number.isFinite(next)) set(field.key, next)
                    }}
                  />
                  <p className={HELP}>
                    {field.help}
                    {limits && (
                      <>
                        {' '}
                        Allowed: {limits.minimum}&ndash;{limits.maximum}.
                      </>
                    )}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg">
        <div className="font-body-sm text-body-sm text-secondary">
          {config.updated_at ? (
            <>
              Last changed {new Date(config.updated_at).toLocaleString()}
              {config.updated_by ? ` by ${config.updated_by}` : ''}.
            </>
          ) : (
            'Never changed from this page.'
          )}
        </div>

        <div className="flex gap-sm">
          <button
            type="button"
            className={`${BUTTON} bg-surface-container-low text-on-surface border border-solid border-outline-variant`}
            onClick={() => void load()}
            disabled={saving}
          >
            <span className="material-symbols-outlined text-[18px]">undo</span>
            Discard changes
          </button>
          <button
            type="button"
            className={`${BUTTON} bg-primary-container text-white shadow-sm disabled:opacity-50`}
            onClick={save}
            disabled={saving || !isDirty}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <p className="font-body-sm text-body-sm text-secondary">
        Every value here applies to all hospitals at once. Changes reach a
        running service within about ten seconds; nothing needs restarting.
      </p>
    </div>
  )
}
