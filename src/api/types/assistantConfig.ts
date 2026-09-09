/**
 * Platform assistant configuration, owned by the super admin.
 *
 * Not tenant scoped: one key, one model and one set of limits serve every
 * hospital on the platform. A hospital administrator is refused these routes.
 *
 * The API key is write-only across this boundary. It is sent on a save and
 * never returned - reads carry a masked tail and a boolean instead, so the
 * page can show which key is loaded without ever holding it.
 */

/** One selectable model, with the note the portal shows beside it. */
export interface AssistantModelOption {
  id: string
  label: string
  note: string
}

/** The range the server will accept for one numeric setting. */
export interface AssistantFieldBound {
  minimum: number
  maximum: number
}

/** Every numeric setting the super admin can change. */
export interface AssistantConfigLimits {
  max_question_chars: number
  request_timeout_seconds: number
  history_max_conversations: number
  history_max_messages: number
  max_audio_bytes: number
  max_audio_duration_ms: number
  voice_timeout_seconds: number
  live_data_cache_seconds: number
  live_data_timeout_seconds: number
  live_data_max_metrics: number
}

export type AssistantLimitField = keyof AssistantConfigLimits

export interface AssistantConfigResponse extends AssistantConfigLimits {
  provider: string
  /** Whether a credential is loaded. The key itself never crosses this line. */
  api_key_set: boolean
  /** A masked tail such as "****KZp7", enough to tell two keys apart. */
  api_key_hint: string | null
  base_url: string
  model: string
  transcription_model: string

  /** False when nobody has saved a configuration yet and defaults are running. */
  is_stored: boolean
  updated_by: string | null
  updated_at: string | null

  /** Reference data, so the whole form renders from one call. */
  providers: string[]
  chat_models: AssistantModelOption[]
  transcription_models: AssistantModelOption[]
  bounds: Record<string, AssistantFieldBound>

  /**
   * Whether ASSISTANT_OPERATIONAL_CHAT_ENABLED is on for the deployment. It is
   * not settable here - it is an environment switch - but the page has to say
   * so, because a perfectly configured model does nothing while it is off.
   */
  assistant_enabled: boolean
}

/**
 * A partial update. Only what is sent is changed.
 *
 * `api_key` omitted means "keep the stored key", which is what lets the page
 * render a masked key it never received. Clearing takes the explicit flag,
 * because an empty string is what an untouched field looks like.
 */
export interface AssistantConfigUpdate extends Partial<AssistantConfigLimits> {
  provider?: string
  api_key?: string
  clear_api_key?: boolean
  base_url?: string
  model?: string
  transcription_model?: string
}

/** The result of one cheap call to the provider, used by the Test button. */
export interface AssistantProviderTestResult {
  ok: boolean
  message: string
  model: string | null
}
