/* The one place that talks to the engine. In production the UI is served under /app by the same
   process that serves the API, so paths are absolute from the root. In dev, Vite proxies them. */

const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError(0, 'The engine is not reachable. Is it running on :18000?')
  }
  const text = await response.text()
  const body = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new ApiError(response.status, body.detail ?? `Request failed (${response.status})`)
  }
  return body as T
}

export const get = <T,>(path: string) => request<T>(path)
export const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

export function events(onEvent: (name: string, data: unknown) => void): () => void {
  const source = new EventSource(`${BASE}/events`)
  const names = ['pulse_fired', 'answer_sealed', 'round_revealed', 'draft_decided', 'risk_resolved']
  const handlers = names.map((name) => {
    const handler = (event: MessageEvent) => {
      try {
        onEvent(name, JSON.parse(event.data))
      } catch {
        onEvent(name, {})
      }
    }
    source.addEventListener(name, handler as EventListener)
    return { name, handler }
  })
  return () => {
    handlers.forEach(({ name, handler }) => source.removeEventListener(name, handler as EventListener))
    source.close()
  }
}

/* -- shapes the screens rely on -------------------------------------------- */
export type Trigger = {
  id: string
  acaps_trigger_id: string | null
  title: string
  description: string
  completion_rate: number | null
  sources: { text: string; url: string }[]
}

export type Risk = {
  risk_id: string
  title: string
  country: string
  country_iso: string
  probability_acaps?: string | null
  probability_assumed_number?: number | null
  impact_acaps: number | null
  level?: string | null
  status: string
  trend: string | null
  risk_type: string | null
  horizon_months: number
  triggers: Trigger[]
  sources: { text: string; url: string }[]
}

export type Evidence = {
  source: string
  indicator: string
  value: number
  baseline: number
  z: number | null
  url: string
  note?: string
}

export type Pulse = {
  id: string
  risk_id: string
  panel_id: string
  fired_at: string
  reason: string
  round: number
  evidence: Evidence[]
  question: string
  expires_at: string
  n_answers: number
}

export type Card = {
  pulse: Pulse
  risk: Risk
  round: number
  already_answered: boolean
  group_view_if_round2: { mean: number; n: number; distribution: Bucket[]; spread: Spread } | null
  mask_options: string[]
  mask_note: string
  stances: string[]
  source_tags: string[]
  accuracy_prompt: string
  elicitation: string
  rating_hidden_until_submission: boolean
}

export type Bucket = { bucket: string; count: number }
export type Spread = { min: number; max: number; iqr: number }

export type RoundResult = {
  pulse_id: string
  n: number
  n_estimates: number
  mean: number | null
  spread: Spread | null
  weighted_mean: number | null
  minority_rationales: string[]
  sp_experiment: {
    answer: string | null
    label: string
    method: string
    actual_share_above_0_5?: number
    predicted_share?: number
    note?: string
  }
  dissent_index: number | null
  distribution: Bucket[]
  agreement_by_region: { region: string; n: number; mean: number | null }[]
  missing_themes: { theme: string; count: number; origin: string; corroboration: string }[]
  abstentions: { stance: string; count: number }[]
  revealed_at: string
  verify_hash: string
}

export type IntegrityNote = { kind: string; text: string; evidence: string }

export type Claim = {
  claim_id: string
  text: string
  evidence_kind: string
  evidence_ref: string
  numbers: (number | null)[]
}

export type Draft = {
  id: string
  risk_id: string
  pulse_id: string
  proposed_probability: string
  proposed_level: string
  acaps_probability: string | null
  acaps_level: string | null
  rationale_md: string
  claims: Claim[]
  skeptic: { claim_id: string; verdict: string; checks: string[] }[]
  missing_checks: { theme: string; status: string }[]
  judge: { coverage: number; numbers_match: number; overall: number; flagged_claim_ids: string[] }
  citations: { text: string; url: string }[]
  status: string
  decided_by: string | null
  note: string | null
  generator: string
}

export type LedgerEntry = {
  risk_id: string
  pulse_id: string
  sealed_at: string
  group_probability: number | null
  acaps_probability: string | null
  acaps_level: string | null
  proposed_probability: string
  decision: string
  outcome: string | null
  resolved_at: string | null
  verify_hash: string
  honesty: {
    n: number
    agreement: number | null
    spread: (number | null)[]
    coverage_gaps: string[]
    claims_corroborated: number
    claims_total: number
    claims_in_verification_queue: number
    panel_hit_rate: number | null
    misses: number
    caveat: string
    decision_use: { what_decision: string | null; for_whom: string | null; by_when: string | null }
    panel_view_rejected: boolean
    analyst_rationale: string | null
  }
}

export type Tray = {
  pulse_id: string
  n_answers: number
  k_min: number
  revealable: boolean
  envelopes: { id: string; committed_at: string; commitment: string; mask: string; pseudonym: string | null }[]
}

export type RadarStatus = {
  source: string
  live_available: boolean
  fetched_at: string
  n_risks: number
  n_active: number
  n_resolved: number
  note: string
  probability_assumption: Record<string, number>
}

export type DemoLink = {
  token: string
  pulse_id: string
  pseudonym: string
  region: string
  answered: boolean
  card_url: string
}
