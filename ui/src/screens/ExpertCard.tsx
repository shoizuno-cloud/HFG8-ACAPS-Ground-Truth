/* /e/:token -- the expert card. Phone first (375 px), and it should read like a message from a
   colleague, not a form. ACAPS's own rating stays hidden until after submission, so it cannot anchor
   the answer. No countdown: the product does not hurry anyone. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, Eye, Lock, UserRound, Users } from 'lucide-react'
import { ApiError, get, post, type Card } from '../api'
import {
  DistributionChart,
  ErrorState,
  ICON,
  Loading,
  SyntheticFooter,
} from '../components'

const WORDS: [number, string][] = [
  [0.1, 'almost certainly not'],
  [0.25, 'unlikely'],
  [0.45, 'possible, leaning no'],
  [0.55, 'genuinely uncertain'],
  [0.75, 'likely'],
  [0.9, 'very likely'],
  [1.01, 'almost certain'],
]

function words(probability: number): string {
  return WORDS.find(([edge]) => probability < edge)?.[1] ?? 'genuinely uncertain'
}

type Submitted = {
  committed_at: string
  commitment: string
  mask: string
  pseudonym: string | null
  message: string
  sealing_note: string
  acaps_rating_now_visible: { probability_acaps: string | null; level: string | null }
}

export default function ExpertCard() {
  const { token = '' } = useParams()
  const [card, setCard] = useState<Card | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Submitted | null>(null)
  const [sending, setSending] = useState(false)

  const [stance, setStance] = useState('estimate')
  const [probability, setProbability] = useState(0.5)
  const [confidence, setConfidence] = useState(3)
  const [panelShare, setPanelShare] = useState(0.5)
  const [missing, setMissing] = useState('')
  const [sourceTag, setSourceTag] = useState<string | null>(null)
  const [mask, setMask] = useState('pseudonym')
  const [changedMind, setChangedMind] = useState(false)

  const load = useCallback(() => {
    setError(null)
    get<Card>(`/e/${token}`)
      .then(setCard)
      .catch((exception: ApiError) => setError(exception.message))
  }, [token])

  useEffect(load, [load])

  const round2 = card?.round === 2
  const groupView = card?.group_view_if_round2 ?? null

  const submit = async () => {
    setSending(true)
    setError(null)
    try {
      const body = {
        stance,
        mask,
        round: card?.round ?? 1,
        probability: stance === 'estimate' ? probability : null,
        confidence: stance === 'estimate' ? confidence : null,
        panel_share_yes: panelShare,
        missing: missing.slice(0, 240),
        source_tag: sourceTag,
        changed_mind: round2 ? changedMind : false,
      }
      setSubmitted(await post<Submitted>(`/e/${token}/answer`, body))
    } catch (exception) {
      setError((exception as ApiError).message)
    } finally {
      setSending(false)
    }
  }

  const evidenceLine = useMemo(() => {
    const items = card?.pulse.evidence ?? []
    if (!items.length) return null
    const first = items[0]
    return first.note
      ? `${first.note} -- ${first.source} puts this trigger at ${first.value}% complete.`
      : `${first.source}: ${first.indicator} at ${first.value} against a baseline of ${first.baseline}.`
  }, [card])

  if (error && !card) {
    return (
      <main className="page page-narrow">
        <ErrorState error={error} retry={load} />
      </main>
    )
  }
  if (!card) {
    return (
      <main className="page page-narrow">
        <Loading lines={5} label="Opening your card" />
      </main>
    )
  }

  if (submitted) {
    return (
      <>
        <main className="page page-narrow">
          <div className="card">
            <div className="row" style={{ marginBottom: 12 }}>
              <Lock {...ICON} color="var(--accent)" aria-hidden />
              <h1 style={{ fontSize: 'var(--text-lg)' }}>Sealed</h1>
            </div>
            <p>{submitted.message}</p>
            <div className="stack-tight" style={{ marginTop: 20 }}>
              <span className="label">Sealed at</span>
              <span className="num">{new Date(submitted.committed_at).toLocaleString()}</span>
              <span className="label" style={{ marginTop: 8 }}>
                Your commitment
              </span>
              <span className="mono-hash">{submitted.commitment}</span>
              <p className="hint" style={{ marginTop: 8 }}>
                {submitted.sealing_note}
              </p>
            </div>
            <div className="card" style={{ marginTop: 20, background: 'var(--surface-2)' }}>
              <span className="label">What ACAPS currently rates this</span>
              <div className="row" style={{ marginTop: 6 }}>
                <span className="chip chip-accent">
                  {submitted.acaps_rating_now_visible.probability_acaps ?? 'unrated'}
                </span>
                <span className="hint">
                  Hidden until now so it could not pull your answer toward it.
                </span>
              </div>
            </div>
            <p className="hint" style={{ marginTop: 16 }}>
              You chose the {submitted.mask} mask
              {submitted.pseudonym ? `, shown to peers as ${submitted.pseudonym}` : ''}.{' '}
              {card.mask_note}
            </p>
          </div>
        </main>
        <SyntheticFooter />
      </>
    )
  }

  return (
    <>
      <main className="page page-narrow">
        {card.already_answered && (
          <div className="card" style={{ background: 'var(--surface-2)', marginBottom: 16 }}>
            <span className="label">You have already answered this round</span>
            <p className="hint">Submitting again adds a second answer. Round 2 is optional.</p>
          </div>
        )}

        <div className="card">
          {evidenceLine && (
            <div className="row" style={{ marginBottom: 12 }}>
              <Activity {...ICON} color="var(--accent)" aria-hidden />
              <span className="hint" style={{ color: 'var(--ink-2)' }}>
                {evidenceLine}
              </span>
            </div>
          )}

          <h1 style={{ fontSize: 'var(--text-lg)', lineHeight: 1.35 }}>{card.risk.title}</h1>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="chip">{card.risk.country}</span>
            <span className="chip">{card.risk.horizon_months}-month horizon</span>
            {card.rating_hidden_until_submission && (
              <span className="chip">
                <Eye {...ICON} size={13} aria-hidden /> rating hidden until you submit
              </span>
            )}
          </div>

          <p style={{ marginTop: 20, fontWeight: 500 }}>{card.pulse.question}</p>

          {round2 && groupView && (
            <div style={{ marginTop: 20 }}>
              <span className="label">Where the panel landed in round 1</span>
              <DistributionChart
                distribution={groupView.distribution}
                mean={groupView.mean}
                spread={groupView.spread}
                acapsNumber={card.risk.probability_assumed_number ?? null}
                acapsLabel={card.risk.probability_acaps ?? null}
              />
            </div>
          )}

          <fieldset style={{ border: 0, padding: 0, margin: '24px 0 0' }}>
            <legend className="label" style={{ marginBottom: 8 }}>
              Your answer
            </legend>
            <div className="seg" role="group" aria-label="Your stance">
              {card.stances.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={stance === option}
                  onClick={() => setStance(option)}
                >
                  {option === 'estimate'
                    ? 'Give a number'
                    : option === 'outside_my_expertise'
                      ? 'Outside my expertise'
                      : 'Not enough evidence'}
                </button>
              ))}
            </div>
          </fieldset>

          {stance === 'estimate' && (
            <>
              <div style={{ marginTop: 24 }}>
                <label className="label" htmlFor="probability">
                  Probability it materialises within the horizon
                </label>
                <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <span className="num" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600 }}>
                    {probability.toFixed(2)}
                  </span>
                  <span className="hint">{words(probability)}</span>
                </div>
                <input
                  id="probability"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={probability}
                  onChange={(event) => setProbability(Number(event.target.value))}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label className="label" htmlFor="confidence">
                  How sure are you of that number? ({confidence} of 5)
                </label>
                <input
                  id="confidence"
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={confidence}
                  onChange={(event) => setConfidence(Number(event.target.value))}
                />
              </div>
            </>
          )}

          <div style={{ marginTop: 20 }}>
            <label className="label" htmlFor="share">
              <Users {...ICON} size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
              {card.elicitation}
            </label>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <span className="num" style={{ fontWeight: 500 }}>
                {Math.round(panelShare * 100)}%
              </span>
              <span className="hint">of this panel</span>
            </div>
            <input
              id="share"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={panelShare}
              onChange={(event) => setPanelShare(Number(event.target.value))}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <label className="label" htmlFor="missing">
              What are we missing? ({missing.length}/240)
            </label>
            <textarea
              id="missing"
              maxLength={240}
              value={missing}
              placeholder="One line. The thing you know that the reporting does not."
              onChange={(event) => setMissing(event.target.value)}
            />
            <span className="label" style={{ display: 'block', marginTop: 10 }}>
              {card.accuracy_prompt}
            </span>
            <div className="seg" style={{ marginTop: 6 }} role="group" aria-label={card.accuracy_prompt}>
              {card.source_tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={sourceTag === tag}
                  onClick={() => setSourceTag(sourceTag === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <span className="label">
              <UserRound {...ICON} size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
              How should this appear?
            </span>
            <div className="seg" style={{ marginTop: 6 }} role="group" aria-label="Your mask">
              {card.mask_options.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mask === option}
                  onClick={() => setMask(option)}
                >
                  {option === 'known' ? 'Badge' : option === 'pseudonym' ? 'Nickname' : 'Ghost'}
                </button>
              ))}
            </div>
            <p className="hint" style={{ marginTop: 8 }}>
              {card.mask_note}
              {mask === 'anonymous' &&
                ' A ghost answer is stored with no link to you, so it cannot be claimed or scored later.'}
            </p>
          </div>

          {round2 && (
            <label className="row" style={{ marginTop: 16, gap: 8 }}>
              <input
                type="checkbox"
                checked={changedMind}
                onChange={(event) => setChangedMind(event.target.checked)}
              />
              <span style={{ fontSize: 'var(--text-sm)' }}>I changed my mind since round 1</span>
            </label>
          )}

          {error && (
            <div style={{ marginTop: 16 }}>
              <ErrorState error={error} />
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            style={{ marginTop: 24 }}
            onClick={submit}
            disabled={sending}
          >
            <Lock {...ICON} aria-hidden />
            {sending ? 'Sealing' : 'Seal my answer'}
          </button>
          <p className="hint" style={{ marginTop: 10 }}>
            Your answer is sealed with a hash of its contents and the time. Nobody on the panel sees it
            until the round opens for everyone at once.
          </p>
        </div>
      </main>
      <SyntheticFooter />
    </>
  )
}
