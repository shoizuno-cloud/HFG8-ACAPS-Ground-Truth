/* /alerts -- the Risk Alert Engine's page on the desk (section 6b, section 8).

   The engine proposes; the analyst decides. Every row shows the rule that fired, the numbers behind it,
   and the edition's reliability, so approving is a judgement about evidence rather than about a colour.
   Nothing on this page can open a round by itself. */
import { useCallback, useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Play, Rewind, Send, X } from 'lucide-react'
import {
  ApiError,
  get,
  post,
  type AlertRun,
  type Crisis,
  type RadarStatus,
  type ShiftEvent,
} from '../api'
import { Empty, ErrorState, ICON, Loading, SyntheticFooter } from '../components'

const METRIC_LABEL: Record<string, string> = {
  index: 'INFORM severity index',
  human_impact: 'Human impact',
  conditions: 'Conditions of affected people',
  people_in_need: 'People in need',
  access: 'Humanitarian access',
  category: 'Severity category',
}

/* The crisis's monthly index, with the shift marked. Same scale, same type, same colours as
   every other chart in the product. */
function SeriesChart({ crisis, event }: { crisis: Crisis; event: ShiftEvent }) {
  const points = crisis.series.filter((p) => typeof p.index === 'number') as {
    month: string
    index: number
  }[]
  if (points.length < 2) return null

  const width = 560
  const height = 150
  const pad = { top: 16, right: 14, bottom: 30, left: 32 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const values = points.map((p) => p.index)
  const lo = Math.floor(Math.min(...values) - 0.5)
  const hi = Math.ceil(Math.max(...values) + 0.5)
  const x = (i: number) => pad.left + (points.length === 1 ? 0 : (i / (points.length - 1)) * plotW)
  const y = (v: number) => pad.top + plotH - ((v - lo) / (hi - lo)) * plotH

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.index)}`).join(' ')
  const fromIndex = points.findIndex((p) => p.month === event.month_from)
  const toIndex = points.findIndex((p) => p.month === event.month_to)

  return (
    <figure style={{ margin: '12px 0 0' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={`Monthly INFORM severity index for ${crisis.crisis_name}, ${points[0].month} to ${
          points[points.length - 1].month
        }. The shift from ${event.month_from} to ${event.month_to} is marked.`}
        style={{ display: 'block', fontFamily: 'var(--font)' }}
      >
        {[lo, (lo + hi) / 2, hi].map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={pad.left + plotW} y1={y(tick)} y2={y(tick)} stroke="var(--line)" />
            <text x={pad.left - 6} y={y(tick) + 4} fontSize="10" fill="var(--ink-3)" textAnchor="end" className="num">
              {tick.toFixed(1)}
            </text>
          </g>
        ))}

        {fromIndex >= 0 && toIndex >= 0 && (
          <rect
            x={x(fromIndex)}
            y={pad.top}
            width={Math.max(2, x(toIndex) - x(fromIndex))}
            height={plotH}
            fill="var(--accent-weak)"
          />
        )}

        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />

        {points.map((p, i) => (
          <g key={p.month}>
            <circle
              cx={x(i)}
              cy={y(p.index)}
              r={p.month === event.month_to ? 4.5 : 2.5}
              fill={p.month === event.month_to ? 'var(--accent)' : 'var(--surface)'}
              stroke="var(--accent)"
              strokeWidth="1.5"
            />
            <text
              x={x(i)}
              y={height - 10}
              fontSize="9.5"
              fill="var(--ink-3)"
              /* the first and last labels are anchored inward, or they hang off the viewBox */
              textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}
            >
              {p.month.replace(/(\d{4})$/, " '$1").replace(" '20", " '")}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="hint">
        Monthly INFORM severity index from the cached ACAPS editions. The shaded span is the shift this
        event reports; months ACAPS did not publish are absent rather than flattened.
      </figcaption>
    </figure>
  )
}

export default function Alerts() {
  const [run, setRun] = useState<AlertRun | null>(null)
  const [status, setStatus] = useState<RadarStatus | null>(null)
  const [crises, setCrises] = useState<Record<string, Crisis>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    Promise.all([get<RadarStatus>('/radar/status'), get<{ events: ShiftEvent[] }>('/alerts')])
      .then(([radar, listed]) => {
        setStatus(radar)
        if (listed.events.length) {
          setRun({
            month_from: listed.events[0].month_from,
            month_to: listed.events[0].month_to,
            n_crises: listed.events[0].n_crises_this_month,
            events: listed.events,
            rules: {},
            note: '',
          })
        }
      })
      .catch((exception: ApiError) => setError(exception.message))
  }, [])

  useEffect(load, [load])

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

  const runEngine = () =>
    act('run', async () => setRun(await post<AlertRun>('/alerts/run', {})))

  const replayApril = () =>
    act('replay', async () =>
      setRun(await post<AlertRun>('/alerts/replay', { month_from: 'Mar2026', month_to: 'Apr2026' })),
    )

  const refresh = async () => {
    const listed = await get<{ events: ShiftEvent[] }>('/alerts')
    setRun((previous) => (previous ? { ...previous, events: listed.events } : previous))
  }

  const approve = (event: ShiftEvent) =>
    act(`pulse:${event.id}`, async () => {
      await post(`/alerts/${event.id}/pulse`, {})
      await refresh()
    })

  const dismiss = (event: ShiftEvent) =>
    act(`dismiss:${event.id}`, async () => {
      await post(`/alerts/${event.id}/dismiss`, { note: notes[event.id] || '' })
      await refresh()
    })

  const openCrisis = async (crisisId: string) => {
    setExpanded(expanded === crisisId ? null : crisisId)
    if (!crises[crisisId]) {
      try {
        const crisis = await get<Crisis>(`/crises/${crisisId}`)
        setCrises((previous) => ({ ...previous, [crisisId]: crisis }))
      } catch {
        /* the row still reads fine without its series */
      }
    }
  }

  if (error && !status) {
    return (
      <main className="page page-wide">
        <ErrorState error={error} retry={load} />
      </main>
    )
  }
  if (!status) {
    return (
      <main className="page page-wide">
        <Loading lines={5} label="Opening the alert engine" />
      </main>
    )
  }

  const editions = status.editions ?? []

  return (
    <>
      <main className="page page-wide" style={{ maxWidth: 1180 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <h1>Risk alerts</h1>
          {editions.map((edition) => (
            <span key={edition.dataset} className="chip">
              {edition.dataset.replace('-', ' ')}: {edition.month} ({edition.source})
            </span>
          ))}
          <span className={`chip ${status.token_present ? 'chip-good' : ''}`}>
            {status.token_present ? 'live API token present' : 'offline, cached editions'}
          </span>
          <div className="row" style={{ marginLeft: 'auto' }}>
            <button className="btn" onClick={runEngine} disabled={busy === 'run'}>
              <Play {...ICON} aria-hidden />
              {busy === 'run' ? 'Running' : 'Run engine'}
            </button>
            <button className="btn" onClick={replayApril} disabled={busy === 'replay'}>
              <Rewind {...ICON} aria-hidden />
              {busy === 'replay' ? 'Replaying' : 'Replay April 2026'}
            </button>
          </div>
        </div>

        <p className="hint" style={{ marginBottom: 16 }}>
          The engine diffs two ACAPS monthly editions and applies fixed numeric rules. It proposes; it never
          opens a round. Ranks are per metric and per direction, so an improvement is never listed as the
          month's top warning.
        </p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <ErrorState error={error} />
          </div>
        )}

        {!run || run.events.length === 0 ? (
          <Empty title={run ? 'No crisis moved enough to trip a rule' : 'The engine has not run yet'}>
            {run
              ? `${run.n_crises} crises diffed between ${run.month_from} and ${run.month_to}. Saying nothing is the correct output of a quiet month.`
              : 'Run the engine on the current editions, or replay April 2026 to see the real TCD005 shift.'}
          </Empty>
        ) : (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <span className="chip chip-accent">
                {run.month_from} to {run.month_to}
              </span>
              <span className="chip">{run.n_crises} crises diffed</span>
              <span className="chip">{run.events.length} events</span>
            </div>

            <div className="stack">
              {run.events.map((event) => {
                const worse = event.direction === 'deterioration'
                const crisis = crises[event.crisis_id]
                return (
                  <section
                    className="card"
                    key={event.id}
                    style={event.status === 'dismissed' ? { opacity: 0.62 } : undefined}
                  >
                    <div className="card-head" style={{ flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 'var(--text-base)' }}>
                        {event.crisis_id} — {event.crisis_name}
                      </h2>
                      <span className={`chip ${worse ? 'chip-warn' : 'chip-good'}`}>
                        {worse ? <ArrowUpRight {...ICON} size={13} aria-hidden /> : <ArrowDownRight {...ICON} size={13} aria-hidden />}
                        {event.direction}
                      </span>
                      <span className="chip">
                        rank {event.rank_this_month} of {event.n_crises_this_month}
                      </span>
                      {event.risk_id ? (
                        <span className="chip chip-accent">
                          {event.risk_id}
                          {event.risk_link_confirmed ? '' : ' (suggested link)'}
                        </span>
                      ) : (
                        <span className="chip">no linked risk</span>
                      )}
                      <span
                        className={`chip ${
                          event.status === 'pulsed' ? 'chip-good' : event.status === 'dismissed' ? '' : ''
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    <div className="row" style={{ gap: 24, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 190 }}>
                        <span className="label">{METRIC_LABEL[event.metric] ?? event.metric}</span>
                        <div className="row" style={{ gap: 8, marginTop: 2 }}>
                          <span className="num" style={{ fontSize: 'var(--text-xl)', color: 'var(--ink-3)' }}>
                            {String(event.before ?? '--')}
                          </span>
                          <span style={{ color: 'var(--ink-3)' }}>&rarr;</span>
                          <span className="num" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600 }}>
                            {String(event.after ?? '--')}
                          </span>
                          <span className="num chip">
                            {event.delta >= 0 ? '+' : ''}
                            {event.delta.toFixed(2)}
                          </span>
                        </div>
                        <span className="hint" style={{ display: 'block', marginTop: 6 }}>
                          rule: {event.rule_hit}
                        </span>
                        <span className="hint" style={{ display: 'block' }}>
                          reliability: {event.reliability ?? 'not stated'}
                        </span>
                        {event.rank_by_abs_delta !== null && event.rank_by_abs_delta !== event.rank_this_month && (
                          <span className="hint" style={{ display: 'block' }}>
                            rank {event.rank_by_abs_delta} if ranked by absolute move
                          </span>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 220 }}>
                        <span className="label">Components</span>
                        <div className="stack-tight" style={{ marginTop: 4 }}>
                          {Object.entries(event.components)
                            .filter(([, pair]) => pair[0] !== null && pair[1] !== null)
                            .map(([name, pair]) => (
                              <div key={name} className="row" style={{ gap: 8 }}>
                                <span style={{ fontSize: 'var(--text-sm)', minWidth: 150 }}>
                                  {METRIC_LABEL[name] ?? name.replace(/_/g, ' ')}
                                </span>
                                <span className="num" style={{ fontSize: 'var(--text-sm)' }}>
                                  {pair[0]} &rarr; {pair[1]}
                                </span>
                              </div>
                            ))}
                          {event.adm1.length > 0 && (
                            <div className="row" style={{ gap: 6, marginTop: 4 }}>
                              {event.adm1.map((area) => (
                                <span key={area} className="chip">
                                  {area}
                                </span>
                              ))}
                            </div>
                          )}
                          {event.connected_crises.length > 0 && (
                            <span className="hint">connected: {event.connected_crises.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="row" style={{ marginTop: 16, gap: 8 }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => approve(event)}
                        disabled={event.status !== 'proposed' || busy !== null || !event.risk_id}
                        title={event.risk_id ? undefined : 'Confirm a risk-to-crisis link first'}
                      >
                        <Send {...ICON} aria-hidden />
                        {event.status === 'pulsed' ? `Pulsed as ${event.pulse_id}` : 'Approve: ask the panel'}
                      </button>
                      <input
                        type="text"
                        aria-label={`Why dismiss ${event.crisis_id}`}
                        placeholder="Why are you dismissing this?"
                        style={{ flex: 1, minWidth: 180 }}
                        value={notes[event.id] ?? ''}
                        disabled={event.status !== 'proposed'}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [event.id]: e.target.value }))}
                      />
                      <button
                        className="btn btn-danger"
                        onClick={() => dismiss(event)}
                        disabled={event.status !== 'proposed' || busy !== null || !(notes[event.id] || '').trim()}
                      >
                        <X {...ICON} aria-hidden />
                        Dismiss
                      </button>
                      <button className="btn" onClick={() => openCrisis(event.crisis_id)}>
                        {expanded === event.crisis_id ? 'Hide history' : 'Show history'}
                      </button>
                    </div>

                    {event.status === 'dismissed' && event.note && (
                      <p className="hint" style={{ marginTop: 10 }}>
                        Dismissed: {event.note}
                      </p>
                    )}

                    {expanded === event.crisis_id &&
                      (crisis ? <SeriesChart crisis={crisis} event={event} /> : <Loading lines={2} />)}
                  </section>
                )
              })}
            </div>
          </>
        )}
      </main>
      <SyntheticFooter
        extra={<span>Severity and access figures are ACAPS's own, from the cached monthly editions.</span>}
      />
    </>
  )
}
