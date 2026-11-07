/* /ledger -- the public ledger. Group views only: no names anywhere, and nothing about any individual.
   The honesty box has to be able to say an uncomfortable thing, so it does: coverage gaps, how many
   claims are still unchecked, and when the analyst rejected the panel and why. */
import { useCallback, useEffect, useState } from 'react'
import { BadgeCheck, CircleSlash, ShieldCheck } from 'lucide-react'
import { ApiError, get, post, type LedgerEntry } from '../api'
import { Empty, ErrorState, ICON, Loading, Stat, SyntheticFooter } from '../components'

type Verification = {
  valid: boolean
  sealed_at: string
  anchor: string | null
  checked: string
  n_commitments: number
  note: string
}

export default function Ledger() {
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState<Record<string, Verification>>({})
  const [verifying, setVerifying] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    get<{ entries: LedgerEntry[] }>('/ledger')
      .then((body) => setEntries(body.entries))
      .catch((exception: ApiError) => setError(exception.message))
  }, [])

  useEffect(load, [load])

  const verify = async (hash: string) => {
    setVerifying(hash)
    try {
      const outcome = await post<Verification>('/ledger/verify', { verify_hash: hash })
      setVerified((previous) => ({ ...previous, [hash]: outcome }))
    } catch (exception) {
      setError((exception as ApiError).message)
    } finally {
      setVerifying(null)
    }
  }

  if (error && !entries) {
    return (
      <main className="page page-wide">
        <ErrorState error={error} retry={load} />
      </main>
    )
  }
  if (!entries) {
    return (
      <main className="page page-wide">
        <Loading lines={5} label="Loading the ledger" />
      </main>
    )
  }

  return (
    <>
      <main className="page page-wide" style={{ maxWidth: 980 }}>
        <h1>Public ledger</h1>
        <p className="hint" style={{ marginTop: 6, marginBottom: 20 }}>
          Every group view this panel published, what the analyst decided, and what happened next. Group
          figures only: no expert is named here, and nothing on this page describes an individual.
        </p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <ErrorState error={error} />
          </div>
        )}

        {entries.length === 0 ? (
          <Empty title="Nothing published yet">
            A group view reaches this page only after an analyst accepts, edits or rejects a draft on the
            desk. Nothing publishes itself.
          </Empty>
        ) : (
          entries.map((entry) => {
            const check = verified[entry.verify_hash]
            const honesty = entry.honesty
            return (
              <section className="card" key={entry.pulse_id}>
                <div className="card-head">
                  <h2>
                    {entry.risk_id} -- {entry.pulse_id}
                  </h2>
                  <span className={`chip ${entry.decision === 'rejected' ? 'chip-warn' : 'chip-good'}`}>
                    {entry.decision}
                  </span>
                  {entry.outcome ? (
                    <span className={`chip ${entry.outcome === 'materialised' ? 'chip-crit' : 'chip-good'}`}>
                      {entry.outcome.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className="chip">not resolved yet</span>
                  )}
                </div>

                <div className="grid grid-3" style={{ marginBottom: 20 }}>
                  <Stat
                    label="Group probability"
                    value={entry.group_probability?.toFixed(2) ?? '--'}
                    sub={`equal-weight mean of ${honesty.n} answers`}
                    large
                  />
                  <Stat
                    label="ACAPS rating at the time"
                    value={entry.acaps_probability ?? '--'}
                    sub={`level ${entry.acaps_level ?? 'unrated'}`}
                  />
                  <Stat
                    label="Panel proposed"
                    value={entry.proposed_probability}
                    sub={`sealed ${new Date(entry.sealed_at).toLocaleString()}`}
                  />
                </div>

                {/* -- honesty box ---------------------------------------- */}
                <div
                  className="card"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--line-strong)' }}
                >
                  <div className="card-head">
                    <h3>Honesty box</h3>
                    <span className="hint">everything that should make you trust this less</span>
                  </div>

                  <div className="grid grid-3">
                    <Stat label="Answers (n)" value={honesty.n} />
                    <Stat
                      label="Spread"
                      value={
                        honesty.spread[0] !== null && honesty.spread[1] !== null
                          ? `${honesty.spread[0]?.toFixed(2)}-${honesty.spread[1]?.toFixed(2)}`
                          : '--'
                      }
                    />
                    <Stat
                      label="Claims checked"
                      value={`${honesty.claims_corroborated}/${honesty.claims_total}`}
                      sub={`${honesty.claims_in_verification_queue} still in the queue`}
                    />
                    <Stat
                      label="Panel hit rate"
                      value={honesty.panel_hit_rate === null ? 'no record' : honesty.panel_hit_rate.toFixed(2)}
                      sub={honesty.panel_hit_rate === null ? 'nothing resolved yet' : `${honesty.misses} miss(es)`}
                    />
                  </div>

                  {honesty.coverage_gaps.length > 0 && (
                    <div className="stack-tight" style={{ marginTop: 16 }}>
                      <span className="label">Coverage gaps on this panel</span>
                      {honesty.coverage_gaps.map((gap) => (
                        <div key={gap} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                          <CircleSlash {...ICON} size={14} color="var(--warning)" style={{ marginTop: 3 }} aria-hidden />
                          <span style={{ fontSize: 'var(--text-sm)' }}>{gap}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {honesty.panel_view_rejected && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 12,
                        borderLeft: '3px solid var(--warning)',
                        background: '#fdf8ee',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <span className="label">The analyst rejected the panel's view</span>
                      <p style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
                        {honesty.analyst_rationale ?? 'No rationale recorded.'}
                      </p>
                    </div>
                  )}

                  <div className="stack-tight" style={{ marginTop: 16 }}>
                    <span className="label">What this was used to decide</span>
                    <p style={{ fontSize: 'var(--text-sm)' }}>
                      {honesty.decision_use.what_decision ?? 'Not recorded'}
                      {honesty.decision_use.for_whom ? ` -- for ${honesty.decision_use.for_whom}` : ''}
                      {honesty.decision_use.by_when ? `, by ${honesty.decision_use.by_when}` : ''}
                    </p>
                  </div>

                  <p className="hint" style={{ marginTop: 16 }}>
                    {honesty.caveat}
                  </p>
                </div>

                {/* -- verify --------------------------------------------- */}
                <div style={{ marginTop: 20 }}>
                  <span className="label">Verify hash</span>
                  <p className="mono-hash" style={{ marginTop: 4 }}>
                    {entry.verify_hash}
                  </p>
                  <div className="row" style={{ marginTop: 10 }}>
                    <button
                      className={`btn ${check?.valid ? 'btn-primary' : ''}`}
                      onClick={() => verify(entry.verify_hash)}
                      disabled={verifying === entry.verify_hash}
                      style={
                        check?.valid
                          ? { background: 'var(--good)', borderColor: 'var(--good)', color: '#fff' }
                          : undefined
                      }
                    >
                      {check?.valid ? <BadgeCheck {...ICON} aria-hidden /> : <ShieldCheck {...ICON} aria-hidden />}
                      {verifying === entry.verify_hash
                        ? 'Checking'
                        : check
                          ? check.valid
                            ? 'Verified'
                            : 'Does not match'
                          : 'Verify'}
                    </button>
                    {check && (
                      <span className="hint" style={{ flex: 1 }}>
                        {check.checked}. {check.n_commitments} commitments. {check.note}
                      </span>
                    )}
                  </div>
                </div>
              </section>
            )
          })
        )}
      </main>
      <SyntheticFooter />
    </>
  )
}
