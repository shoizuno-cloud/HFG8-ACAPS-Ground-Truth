/* /desk -- the analyst desk, projector first (1920 px, 16:9) and still usable on a laptop.
   Envelope tray on the left, the round and its draft in the middle, radar and integrity on the right.
   Integrity notes are descriptions with their evidence. No verdict colours, no automatic penalties. */
import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  CircleDot,
  FileText,
  Link2,
  Lock,
  Radar,
  ShieldAlert,
  Unlock,
} from 'lucide-react'
import {
  ApiError,
  events,
  get,
  post,
  type DemoLink,
  type Draft,
  type IntegrityNote,
  type Pulse,
  type RadarStatus,
  type Risk,
  type RoundResult,
  type Tray,
} from '../api'
import {
  CopyButton,
  CorroborationChip,
  DistributionChart,
  Empty,
  ErrorState,
  ICON,
  Loading,
  Stat,
  SyntheticFooter,
  VerdictChip,
} from '../components'

type Shift = {
  risk_id: string
  country: string
  trigger_id: string
  title: string
  completion_rate: number
  acaps_probability: string | null
}

export default function Desk() {
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [pulse, setPulse] = useState<Pulse | null>(null)
  const [risk, setRisk] = useState<Risk | null>(null)
  const [tray, setTray] = useState<Tray | null>(null)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [notes, setNotes] = useState<IntegrityNote[] | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [status, setStatus] = useState<RadarStatus | null>(null)
  const [links, setLinks] = useState<DemoLink[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [live, setLive] = useState(false)

  const [whatDecision, setWhatDecision] = useState('Pre-position shelter and cash in Ouaddai')
  const [forWhom, setForWhom] = useState('NGO preparedness lead, eastern Chad')
  const [byWhen, setByWhen] = useState('2026-11-20')
  const [note, setNote] = useState('')

  const refreshTray = useCallback((id: string) => {
    get<Tray>(`/pulses/${id}/tray`).then(setTray).catch(() => undefined)
  }, [])

  const loadPulse = useCallback(
    async (id: string) => {
      setPulseId(id)
      const loadedPulse = await get<Pulse>(`/pulses/${id}`)
      setPulse(loadedPulse)
      setRisk(await get<Risk>(`/risks/${loadedPulse.risk_id}`))
      refreshTray(id)
      await get<RoundResult>(`/pulses/${id}/result`)
        .then(async (revealed) => {
          setResult(revealed)
          setNotes((await get<{ integrity_notes: IntegrityNote[] }>(`/integrity/${id}`)).integrity_notes)
        })
        .catch(() => setResult(null))
    },
    [refreshTray],
  )

  const boot = useCallback(() => {
    setError(null)
    Promise.all([
      get<RadarStatus>('/radar/status'),
      get<{ links: DemoLink[] }>('/demo/links'),
    ])
      .then(async ([radarStatus, demo]) => {
        setStatus(radarStatus)
        setLinks(demo.links)
        const first = demo.links[0]?.pulse_id
        if (first) await loadPulse(first)
      })
      .catch((exception: ApiError) => setError(exception.message))
  }, [loadPulse])

  useEffect(boot, [boot])

  useEffect(() => {
    const stop = events((name, payload) => {
      setLive(true)
      const data = payload as { pulse_id?: string }
      if (name === 'answer_sealed' && data.pulse_id) refreshTray(data.pulse_id)
      if (name === 'pulse_fired' && data.pulse_id) void loadPulse(data.pulse_id)
    })
    return stop
  }, [loadPulse, refreshTray])

  const act = async (label: string, action: () => Promise<void>) => {
    setBusy(label)
    setError(null)
    try {
      await action()
    } catch (exception) {
      setError((exception as ApiError).message)
    } finally {
      setBusy(null)
    }
  }

  const runDoorbell = () =>
    act('doorbell', async () => {
      const response = await get<{ shifts: Shift[] }>('/pulses/doorbell/run?threshold=40')
      setShifts(response.shifts.slice(0, 12))
    })

  const reveal = () =>
    act('reveal', async () => {
      if (!pulseId) return
      setResult(await post<RoundResult>(`/pulses/${pulseId}/reveal`))
      setNotes((await get<{ integrity_notes: IntegrityNote[] }>(`/integrity/${pulseId}`)).integrity_notes)
    })

  const makeDraft = () =>
    act('draft', async () => {
      if (!pulseId) return
      setDraft(await post<Draft>(`/pulses/${pulseId}/draft`))
    })

  const decide = (action: 'accept' | 'edit' | 'reject') =>
    act(action, async () => {
      if (!draft) return
      const decided = await post<Draft>(`/drafts/${draft.id}/decision`, {
        action,
        decided_by: 'analyst',
        what_decision: whatDecision,
        for_whom: forWhom,
        by_when: byWhen,
        note: note || null,
      })
      setDraft(decided)
    })

  if (error && !status) {
    return (
      <main className="page page-wide">
        <ErrorState error={error} retry={boot} />
      </main>
    )
  }
  if (!status) {
    return (
      <main className="page page-wide">
        <Loading lines={6} label="Opening the desk" />
      </main>
    )
  }

  const acapsNumber = risk?.probability_assumed_number ?? null

  return (
    <>
      <main className="page page-wide">
        <div className="row" style={{ marginBottom: 16 }}>
          <h1>Analyst desk</h1>
          <span className={`chip ${status.token_present ? 'chip-good' : ''}`}>
            <Radar {...ICON} size={13} aria-hidden /> source: {status.risk_list.source.toUpperCase()}
          </span>
          <span className="chip">
            {status.risk_list.n} risks, {status.risk_list.n_active} active
          </span>
          <span className={`chip ${live ? 'chip-accent' : ''}`}>
            <CircleDot {...ICON} size={13} aria-hidden /> {live ? 'live' : 'listening'}
          </span>
          <div style={{ marginLeft: 'auto' }} className="row">
            <button className="btn" onClick={runDoorbell} disabled={busy === 'doorbell'}>
              <Bell {...ICON} aria-hidden />
              {busy === 'doorbell' ? 'Running' : 'Run doorbell'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <ErrorState error={error} />
          </div>
        )}

        {risk && pulse && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <h2>
                {risk.risk_id} -- {risk.country}
              </h2>
              <span className="chip chip-accent">ACAPS {risk.probability_acaps ?? 'unrated'}</span>
              <span className="chip">impact {risk.impact_acaps ?? '--'}/5</span>
              <span className="chip">{risk.status}</span>
            </div>
            <p style={{ color: 'var(--ink-2)' }}>{risk.title}</p>
            <div className="stack-tight" style={{ marginTop: 16 }}>
              <span className="label">Why this pulse fired ({pulse.reason})</span>
              {pulse.evidence.map((item) => (
                <div key={item.indicator} className="row" style={{ gap: 8 }}>
                  <span className="chip">{item.value}% complete</span>
                  <span style={{ fontSize: 'var(--text-sm)' }}>{item.note ?? item.indicator}</span>
                  <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)' }}>
                    {item.source}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-2">
          {/* -- tray -------------------------------------------------------- */}
          <section className="card">
            <div className="card-head">
              <h2>Envelope tray</h2>
              {tray && (
                <span className="chip">
                  {tray.n_answers} of {tray.k_min} needed
                </span>
              )}
            </div>
            {!tray ? (
              <Loading lines={4} />
            ) : tray.n_answers === 0 ? (
              <Empty title="Nothing sealed yet">
                Open a card from the links below, or run the doorbell to fire a pulse.
              </Empty>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Sealed at</th>
                        <th>Mask</th>
                        <th>Commitment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tray.envelopes.map((item) => (
                        <tr key={item.id} className="envelope-enter">
                          <td className="num">{new Date(item.committed_at).toLocaleTimeString()}</td>
                          <td>
                            <span className="chip">
                              {item.mask === 'pseudonym' ? (item.pseudonym ?? 'nickname') : item.mask}
                            </span>
                          </td>
                          <td className="mono-hash">{item.commitment.slice(0, 20)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="hint" style={{ marginTop: 12 }}>
                  <Lock {...ICON} size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
                  Values are not readable here. The tray holds the commitment and the time only, which is
                  what blocks anchoring between panel members.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={reveal}
                  disabled={!tray.revealable || busy === 'reveal' || Boolean(result)}
                >
                  <Unlock {...ICON} aria-hidden />
                  {result ? 'Round revealed' : busy === 'reveal' ? 'Revealing' : 'Reveal the round'}
                </button>
                {!tray.revealable && (
                  <p className="hint" style={{ marginTop: 8 }}>
                    Below {tray.k_min} answers nothing is aggregated or shown. That is a disclosure rule,
                    not an anonymity guarantee.
                  </p>
                )}
              </>
            )}
          </section>

          {/* -- doorbell log ------------------------------------------------ */}
          <section className="card">
            <div className="card-head">
              <h2>Doorbell</h2>
              <span className="chip">ACAPS trigger completion at or above 40%</span>
            </div>
            {shifts.length === 0 ? (
              <Empty title="Not run yet">
                The detector watches each risk's own triggers, not a general news feed.
              </Empty>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Risk</th>
                      <th>Country</th>
                      <th>Trigger</th>
                      <th>Complete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((shift) => (
                      <tr key={`${shift.risk_id}-${shift.trigger_id}`}>
                        <td className="num">{shift.risk_id}</td>
                        <td>{shift.country}</td>
                        <td>{shift.title}</td>
                        <td className="num">{shift.completion_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* -- result ---------------------------------------------------------- */}
        <section className="card" style={{ marginTop: 16 }}>
            <div className="card-head">
              <h2>The round</h2>
              {result && <span className="chip">n = {result.n}</span>}
            </div>
            {!result ? (
              <Empty title="Not revealed yet">
                The aggregate appears once the analyst opens the round for everyone at the same moment.
              </Empty>
            ) : (
              <>
                <div className="grid grid-3" style={{ marginBottom: 20, maxWidth: 760 }}>
                  <Stat
                    label="Equal-weight mean (primary)"
                    value={result.mean?.toFixed(2) ?? '--'}
                    sub={`${result.n_estimates} of ${result.n} gave a number`}
                    large
                  />
                  <Stat
                    label="Spread"
                    value={
                      result.spread ? `${result.spread.min.toFixed(2)}-${result.spread.max.toFixed(2)}` : '--'
                    }
                    sub={`IQR ${result.spread?.iqr.toFixed(2) ?? '--'}`}
                  />
                  <Stat
                    label="Weighted (secondary)"
                    value={result.weighted_mean?.toFixed(2) ?? '--'}
                    sub="shrunk to a prior and capped"
                  />
                </div>

                <DistributionChart
                  distribution={result.distribution}
                  mean={result.mean}
                  spread={result.spread}
                  acapsNumber={acapsNumber}
                  acapsLabel={risk?.probability_acaps ?? null}
                  spHighlight={result.sp_experiment.answer as 'yes' | 'no' | null}
                />

                <div className="row" style={{ marginTop: 12 }}>
                  <span className="chip chip-warn">
                    surprisingly-popular: {result.sp_experiment.answer ?? 'not available'} ({result.sp_experiment.label})
                  </span>
                  {result.abstentions.map((item) => (
                    <span key={item.stance} className="chip">
                      {item.stance.replace(/_/g, ' ')}: {item.count}
                    </span>
                  ))}
                </div>

                {result.minority_rationales.length > 0 && (
                  <div className="stack-tight" style={{ marginTop: 16 }}>
                    <span className="label">Minority view, kept in</span>
                    {result.minority_rationales.map((text) => (
                      <p key={text} style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-2)' }}>
                        {text}
                      </p>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16 }}>
                  <span className="label">Agreement by region</span>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Region</th>
                          <th>n</th>
                          <th>Mean</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.agreement_by_region.map((row) => (
                          <tr key={row.region}>
                            <td>{row.region}</td>
                            <td className="num">{row.n}</td>
                            <td className="num">
                              {row.mean?.toFixed(2) ?? <span className="hint">one voice, withheld</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <span className="label">What the panel says we are missing</span>
                  <div className="stack-tight" style={{ marginTop: 6 }}>
                    {result.missing_themes.map((theme) => (
                      <div key={theme.theme} className="row" style={{ gap: 8 }}>
                        <span className="chip">x{theme.count}</span>
                        <span style={{ fontSize: 'var(--text-sm)', flex: 1 }}>{theme.theme}</span>
                        <CorroborationChip status={theme.corroboration} />
                      </div>
                    ))}
                  </div>
                </div>

                {!draft && (
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 20 }}
                    onClick={makeDraft}
                    disabled={busy === 'draft'}
                  >
                    <FileText {...ICON} aria-hidden />
                    {busy === 'draft' ? 'Drafting' : 'Draft the update'}
                  </button>
                )}
              </>
            )}
        </section>

        {/* -- draft --------------------------------------------------------- */}
        {draft && (
          <section className="card" style={{ marginTop: 16 }}>
            <div className="card-head">
              <h2>Draft update</h2>
              <span className="chip chip-accent">proposes {draft.proposed_probability}</span>
              <span className="chip">ACAPS {draft.acaps_probability ?? 'unrated'}</span>
              <span className="chip">{draft.generator}</span>
              <span className={`chip ${draft.status === 'draft' ? '' : 'chip-good'}`}>{draft.status}</span>
            </div>

            <div className="grid grid-2">
              <div>
                <span className="label">Claims, each with the evidence it rests on</span>
                <div className="table-wrap" style={{ marginTop: 6 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Claim</th>
                        <th>Kind</th>
                        <th>Skeptic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.claims.map((claim) => {
                        const verdict = draft.skeptic.find((item) => item.claim_id === claim.claim_id)
                        const flagged = draft.judge.flagged_claim_ids.includes(claim.claim_id)
                        return (
                          <tr key={claim.claim_id} style={flagged ? { background: '#fdf8ee' } : undefined}>
                            <td>
                              {claim.text}
                              <div className="hint" style={{ marginTop: 4 }}>
                                {claim.evidence_ref}
                              </div>
                            </td>
                            <td>
                              <span className="chip">{claim.evidence_kind}</span>
                            </td>
                            <td>
                              {verdict && <VerdictChip verdict={verdict.verdict} />}
                              <div className="hint" style={{ marginTop: 4 }}>
                                {verdict?.checks.join('; ')}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="row" style={{ marginTop: 12 }}>
                  <span className="chip">judge coverage {draft.judge.coverage.toFixed(2)}</span>
                  <span className="chip">numbers match {draft.judge.numbers_match.toFixed(2)}</span>
                  <span className={`chip ${draft.judge.flagged_claim_ids.length ? 'chip-warn' : 'chip-good'}`}>
                    {draft.judge.flagged_claim_ids.length
                      ? `flagged: ${draft.judge.flagged_claim_ids.join(', ')}`
                      : 'nothing flagged'}
                  </span>
                </div>
              </div>

              <div>
                <span className="label">Rationale</span>
                <div
                  style={{
                    marginTop: 6,
                    padding: 12,
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-sm)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: 280,
                    overflow: 'auto',
                  }}
                >
                  {draft.rationale_md}
                </div>
                <div className="row" style={{ marginTop: 8 }}>
                  <CopyButton text={draft.rationale_md} label="Copy rationale" />
                </div>

                <div className="stack-tight" style={{ marginTop: 20 }}>
                  <span className="label">
                    Before this can be accepted: what decision, for whom, by when
                  </span>
                  <input
                    type="text"
                    aria-label="What decision"
                    value={whatDecision}
                    onChange={(event) => setWhatDecision(event.target.value)}
                  />
                  <input
                    type="text"
                    aria-label="For whom"
                    value={forWhom}
                    onChange={(event) => setForWhom(event.target.value)}
                  />
                  <input
                    type="date"
                    aria-label="By when"
                    value={byWhen}
                    onChange={(event) => setByWhen(event.target.value)}
                  />
                  <textarea
                    aria-label="Analyst rationale"
                    placeholder="Rationale. Required if you reject the panel's view; it is published."
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => decide('accept')}
                    disabled={draft.status !== 'draft' || busy !== null}
                  >
                    Accept
                  </button>
                  <button
                    className="btn"
                    onClick={() => decide('edit')}
                    disabled={draft.status !== 'draft' || busy !== null}
                  >
                    Edit and accept
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => decide('reject')}
                    disabled={draft.status !== 'draft' || busy !== null}
                  >
                    Reject
                  </button>
                </div>
                <p className="hint" style={{ marginTop: 8 }}>
                  Nothing publishes itself. Whatever you choose, the decision and this rationale go on the
                  public ledger.
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="grid grid-2" style={{ marginTop: 16 }}>
          {/* -- integrity --------------------------------------------------- */}
          <section className="card">
            <div className="card-head">
              <h2>Integrity notes</h2>
              <span className="chip">moderator only</span>
            </div>
            {!notes ? (
              <Empty title="Available after the reveal">
                These describe the shape of the round. They are not verdicts about anyone.
              </Empty>
            ) : notes.length === 0 ? (
              <Empty title="Nothing to note on this round" />
            ) : (
              <div className="stack-tight">
                {notes.map((item, index) => (
                  <div key={index} className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                    <ShieldAlert {...ICON} color="var(--ink-3)" style={{ marginTop: 3 }} aria-hidden />
                    <div>
                      <span className="chip">{item.kind.replace(/_/g, ' ')}</span>
                      <p style={{ fontSize: 'var(--text-sm)', marginTop: 6 }}>{item.text}</p>
                      <span className="hint">evidence: {item.evidence}</span>
                    </div>
                  </div>
                ))}
                <p className="hint" style={{ marginTop: 8 }}>
                  Descriptions, not diagnoses. Nothing here penalises an expert or changes a weight; the
                  analyst reads them and decides.
                </p>
              </div>
            )}
          </section>

        </div>

        {/* -- magic links --------------------------------------------------- */}
        <section className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h2>Panel links</h2>
            <span className="chip">synthetic panel, plus four open links for the room</span>
          </div>
          {links.length === 0 ? (
            <Empty title="No links issued" />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pseudonym</th>
                    <th>Region</th>
                    <th>State</th>
                    <th>Card</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.token}>
                      <td>{link.pseudonym}</td>
                      <td>{link.region}</td>
                      <td>
                        <span className={`chip ${link.answered ? 'chip-good' : ''}`}>
                          {link.answered ? 'sealed' : 'open'}
                        </span>
                      </td>
                      <td>
                        <div className="row">
                          <a href={link.card_url} target="_blank" rel="noreferrer">
                            <Link2 {...ICON} size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
                            open
                          </a>
                          <CopyButton text={`${window.location.origin}${link.card_url}`} label="Copy link" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <SyntheticFooter extra={<span>{status.risk_list.note}</span>} />
    </>
  )
}
