import { DraftNarrative, pendingClaims } from "./Grounding";
import { HonestyBox, IntegrityPanel, PanelMatch } from "./V2Panels";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Check, Copy, LockKeyhole, Radio } from "lucide-react";
import {
  apiBase,
  endpoint,
  safeUrl,
  validResult,
  type Board,
  type Draft,
  type LedgerEntry,
  type Pulse,
  type Result,
  type Risk,
} from "./service";
import { date, percent } from "./desk-model";
import "./workspace.css";

export function Frame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} | Sealed Signals`;
  }, [title]);
  return (
    <>
      <a className="skip-link" href="#page-content">
        Skip to content
      </a>
      <header className="site-header workspace-header">
        <a className="brand" href="/">
          <span className="brand-mark">
            <LockKeyhole size={19} />
          </span>
          Sealed Signals
        </a>
        <nav aria-label="Main navigation">
          <a
            href="/"
            aria-current={location.pathname === "/" ? "page" : undefined}
          >
            Radar
          </a>
          <a href="/committee">Committee</a>
          <a
            href="/desk"
            aria-current={location.pathname === "/desk" ? "page" : undefined}
          >
            Analyst desk
          </a>
          <a
            href="/ledger"
            aria-current={location.pathname === "/ledger" ? "page" : undefined}
          >
            Public ledger
          </a>
          <a
            href="/stage"
            aria-current={location.pathname === "/stage" ? "page" : undefined}
          >
            Jury access
          </a>
        </nav>
      </header>
      <main id="page-content" className="workspace live-workspace">
        <div className="workspace-title">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        {children}
        <footer className="workspace-footer">
          Synthetic experts and answers only. Public output is aggregate only.
          Analyst approval is required.
        </footer>
      </main>
    </>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="workspace-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [status, setStatus] = useState("");
  return (
    <span className="copy-control">
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus("Copied");
          } catch {
            setStatus("Copy unavailable. Select the text to copy it.");
          }
        }}
      >
        <Copy size={15} />
        {label}
      </button>
      <span role="status">{status}</span>
    </span>
  );
}
function GroupChart({
  result,
  reference,
}: {
  result: Result;
  reference: string;
}) {
  if (!validResult(result))
    return (
      <p>
        Group view withheld until at least five contributions are confirmed.
      </p>
    );
  const acaps = (
    {
      "Very Low": 0.1,
      Low: 0.3,
      Medium: 0.5,
      High: 0.7,
      "Very High": 0.9,
    } as Record<string, number>
  )[reference];
  return (
    <>
      <div className="stat-row">
        <div>
          <span>Weighted panel</span>
          <strong>{percent(result.weighted_probability)}</strong>
        </div>
        <div>
          <span>Contributions</span>
          <strong>{result.n}</strong>
        </div>
        <div>
          <span>Surprisingly popular</span>
          <strong className="small-stat">
            {result.surprisingly_popular === "yes" ? "Yes" : "No"}
          </strong>
        </div>
      </div>
      <svg
        className="probability-chart"
        viewBox="0 0 560 185"
        role="img"
        aria-label={`Panel probability ${percent(result.weighted_probability)}, ${result.n} answers. ACAPS ${reference}.`}
      >
        <line x1="40" y1="134" x2="520" y2="134" className="chart-axis" />
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line
              x1={40 + v * 4.8}
              x2={40 + v * 4.8}
              y1="24"
              y2="134"
              className="chart-grid"
            />
            <text x={40 + v * 4.8} y="155" textAnchor="middle">
              {v}%
            </text>
          </g>
        ))}
        {acaps !== undefined && (
          <>
            <line
              x1={40 + acaps * 480}
              x2={40 + acaps * 480}
              y1="20"
              y2="134"
              className="acaps-line"
            />
            <text x={40 + acaps * 480 - 8} y="16" textAnchor="end">
              ACAPS
            </text>
          </>
        )}
        {result.distribution.flatMap((b) =>
          Array.from({ length: Math.min(50, b.count) }, (_, i) => {
            const [lo, hi] = b.bucket.split("-").map(Number);
            return (
              <circle
                key={`${b.bucket}-${i}`}
                cx={40 + ((lo + hi) / 2) * 480}
                cy={118 - i * 20}
                r="6"
                className="panel-dot"
              />
            );
          }),
        )}
        {result.confidence_interval && (
          <g stroke="var(--accent)" strokeWidth="2">
            <line
              x1={40 + 480 * result.confidence_interval.lower}
              x2={40 + 480 * result.confidence_interval.upper}
              y1="42"
              y2="42"
            />
            {[
              result.confidence_interval.lower,
              result.confidence_interval.upper,
            ].map((v) => (
              <line
                key={v}
                x1={40 + 480 * v}
                x2={40 + 480 * v}
                y1="36"
                y2="48"
              />
            ))}
          </g>
        )}
        <circle
          cx={40 + result.weighted_probability * 480}
          cy="42"
          r="7"
          className="weighted-dot"
        />
        <text x="280" y="180" textAnchor="middle">
          Probability of materialisation within six months
        </text>
      </svg>
      <p className="panel-caption">
        Dots show bucket counts. Dashed line: ACAPS scale mapped to probability.
        Upper marker: weighted panel.
        {!result.confidence_interval &&
          " Confidence intervals are unavailable."}
      </p>
      <details>
        <summary>Distribution data</summary>
        <table>
          <thead>
            <tr>
              <th>Probability bucket</th>
              <th>Answers</th>
            </tr>
          </thead>
          <tbody>
            {result.distribution.map((b) => (
              <tr key={b.bucket}>
                <td>{b.bucket}</td>
                <td>{b.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
export function Verification({ draft }: { draft: Draft }) {
  return (
    <div className="draft-verification">
      <h3>Evidence checks</h3>
      <p className="panel-caption">
        Numeric support does not establish source corroboration. Claims still
        needing corroboration stay in the review queue.
      </p>
      {draft.judge ? (
        <>
          <div className="stat-row">
            <div>
              <span>Citation coverage</span>
              <strong>{percent(draft.judge.coverage)}</strong>
            </div>
            <div>
              <span>Numbers match</span>
              <strong>{percent(draft.judge.numbers_match)}</strong>
            </div>
            <div>
              <span>Judge overall</span>
              <strong>{percent(draft.judge.overall)}</strong>
            </div>
          </div>
          {draft.claims?.map((claim) => (
            <div
              className={
                draft.judge!.flagged_claim_ids.includes(claim.claim_id)
                  ? "claim flagged"
                  : "claim"
              }
              key={claim.claim_id}
            >
              <strong>
                {claim.claim_id} ·{" "}
                {draft.skeptic?.find((s) => s.claim_id === claim.claim_id)
                  ?.verdict || "Not checked"}
              </strong>
              <p>{claim.text}</p>
              <small>
                {claim.evidence_kind}: {claim.evidence_ref}
              </small>
              {draft.skeptic
                ?.find((s) => s.claim_id === claim.claim_id)
                ?.checks.map((check, i) => (
                  <p key={i}>{check}</p>
                ))}
            </div>
          ))}
        </>
      ) : (
        <p className="panel-caption">
          Skeptic verdicts and Judge scores have not been supplied. Review the
          cited evidence before deciding.
        </p>
      )}
      {draft.missing_checks?.map((check) => (
        <p key={check.theme}>
          {check.theme}: {check.status}
        </p>
      ))}
    </div>
  );
}
function LiveDesk() {
  const [risks, setRisks] = useState<Risk[]>([]),
    [board, setBoard] = useState<Board | null>(null),
    [selected, setSelected] = useState(
      new URLSearchParams(location.search).get("risk_id") || "",
    );
  const [pulse, setPulse] = useState<Pulse | null>(null),
    [group, setGroup] = useState<Result | null>(null),
    [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState("Loading risks"),
    [message, setMessage] = useState(""),
    [connection, setConnection] = useState("Connecting");
  const [note, setNote] = useState(""),
    [edit, setEdit] = useState(false),
    [probability, setProbability] = useState("High"),
    [pulseId, setPulseId] = useState("");
  const [outcome, setOutcome] = useState("materialised"),
    [resolvedAt, setResolvedAt] = useState(""),
    [confirmResolve, setConfirmResolve] = useState(false);
  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    setError("");
    try {
      await task();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  async function load() {
    await run("Loading risks", async () => {
      const response = await endpoint.risks();
      setRisks(response.risks);
      setSelected((previous) => previous || response.risks[0]?.risk_id || "");
      try {
        setBoard(await endpoint.board());
      } catch {
        setMessage(
          "Reliability board unavailable. Other controls remain available.",
        );
      }
    });
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    const events = new EventSource(`${apiBase}/events`);
    events.onopen = () => setConnection("Connected");
    events.onerror = () =>
      setConnection("Disconnected · retrying automatically");
    const onEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.pulse_id && pulse && data.pulse_id !== pulse.id) return;
        if (
          event.type === "answer_sealed" &&
          pulse &&
          Number.isInteger(data.n_answers)
        )
          setPulse((p) => (p ? { ...p, n_answers: data.n_answers } : p));
        if (event.type === "round_revealed" && pulse)
          void endpoint
            .result(pulse.id)
            .then((value) => {
              if (validResult(value)) setGroup(value);
            })
            .catch(() =>
              setMessage("Round changed. Refresh the result to retrieve it."),
            );
        if (event.type === "pulse_fired")
          setMessage(
            `A new pulse is available: ${data.pulse_id || "refresh the pulse list"}.`,
          );
        if (event.type === "draft_decided")
          setMessage(
            "An analyst decision was recorded. Refresh the ledger to view it.",
          );
        if (event.type === "risk_resolved") {
          setMessage(
            "Risk resolved. Calibration reports are ready to refresh.",
          );
          void endpoint
            .board()
            .then(setBoard)
            .catch(() => {});
        }
      } catch {
        setMessage(
          "An unreadable event was ignored. Refresh to check the current state.",
        );
      }
    };
    for (const type of [
      "pulse_fired",
      "answer_sealed",
      "round_revealed",
      "draft_decided",
      "risk_resolved",
    ])
      events.addEventListener(type, onEvent as EventListener);
    return () => events.close();
  }, [pulse?.id]);
  const risk = risks.find((r) => r.risk_id === selected);
  function clearRound(value: Pulse) {
    setPulse(value);
    setGroup(null);
    setDraft(null);
    setNote("");
    setEdit(false);
  }
  async function decision(action: "accept" | "edit" | "reject") {
    if (!draft) return;
    if (!note.trim()) {
      setError("Add a decision note before continuing.");
      document.getElementById("live-note")?.focus();
      return;
    }
    await run("Saving analyst decision", async () => {
      const value = await endpoint.decision(
        draft.id,
        action,
        note.trim(),
        probability,
      );
      setDraft(value);
      setMessage(`Draft ${value.status}. The ledger follows the API decision.`);
    });
  }
  return (
    <Frame
      title="Analyst desk"
      subtitle="Independent answers. Cited evidence. Your decision."
    >
      <div className="mode-banner">
        <Radio size={16} />
        <span>API mode · Events: {connection}</span>
      </div>
      <div className="live-toolbar">
        <label htmlFor="risk-select">Risk</label>
        <select
          id="risk-select"
          value={selected}
          disabled={!!busy}
          onChange={(e) => {
            setSelected(e.target.value);
            setPulse(null);
            setGroup(null);
            setDraft(null);
          }}
        >
          <option value="" disabled>
            Select a risk
          </option>
          {risks.map((r) => (
            <option value={r.risk_id} key={r.risk_id}>
              {r.country} / {r.risk_id}
            </option>
          ))}
        </select>
        <button disabled={!!busy} onClick={() => void load()}>
          Refresh risks
        </button>
        <button
          disabled={!!busy || !selected}
          onClick={() =>
            void run("Creating pulse", async () =>
              clearRound(await endpoint.create(selected)),
            )
          }
        >
          Ask panel
        </button>
        <button
          disabled={!!busy}
          onClick={() =>
            void run("Checking indicators", async () => {
              const value = await endpoint.doorbell();
              setMessage(
                `${value.shifts.length} shifts detected; ${value.pulses_fired.length} pulses fired.`,
              );
              if (value.pulses_fired[0]) {
                setPulseId(value.pulses_fired[0]);
                clearRound(await endpoint.pulse(value.pulses_fired[0]));
              }
            })
          }
        >
          Run doorbell
        </button>
      </div>
      {error && (
        <div className="error-box" role="alert">
          <p>{error}</p>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
      <p className="workspace-message" role="status">
        {busy || message}
      </p>
      {risk ? (
        <>
          <div className="risk-strip">
            <div>
              <span className="rating">{risk.level} risk</span>
              <h2>{risk.title}</h2>
            </div>
            <span>{risk.horizon_months}-month horizon</span>
          </div>
          <div className="desk-grid">
            <div className="desk-main">
              <Section title="Panel pulse">
                <div className="live-toolbar">
                  <label htmlFor="pulse-id">Pulse ID</label>
                  <input
                    id="pulse-id"
                    value={pulseId}
                    onChange={(e) => setPulseId(e.target.value)}
                    placeholder="Open an existing pulse"
                  />
                  <button
                    disabled={!!busy || !pulseId.trim()}
                    onClick={() =>
                      void run("Opening pulse", async () => {
                        const value = await endpoint.pulse(pulseId.trim());
                        if (value.risk_id !== selected)
                          throw new Error(
                            "This pulse belongs to another risk. Select that risk first.",
                          );
                        clearRound(value);
                      })
                    }
                  >
                    Open pulse
                  </button>
                </div>
                {pulse ? (
                  <>
                    <p>
                      {pulse.id} · Round {pulse.round} · {pulse.n_answers}{" "}
                      sealed answers
                    </p>
                    <div className="envelope-tray">
                      {Array.from(
                        { length: Math.min(10, Math.max(5, pulse.n_answers)) },
                        (_, i) => (
                          <span
                            className={`envelope ${i < pulse.n_answers ? "filled" : ""}`}
                            key={i}
                          >
                            <LockKeyhole size={22} />
                          </span>
                        ),
                      )}
                    </div>
                    <div className="panel-actions">
                      <button
                        className="primary"
                        disabled={!!busy || pulse.n_answers < 5 || !!group}
                        onClick={() =>
                          void run("Revealing round", async () => {
                            const value = await endpoint.reveal(pulse.id);
                            if (!validResult(value))
                              throw new Error(
                                "Group view withheld: at least five contributions are required.",
                              );
                            setGroup(value);
                          })
                        }
                      >
                        Reveal round
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() =>
                          void run("Refreshing panel", async () =>
                            setPulse(await endpoint.pulse(pulse.id)),
                          )
                        }
                      >
                        Refresh answers
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() =>
                          void run("Opening result", async () => {
                            const value = await endpoint.result(pulse.id);
                            if (!validResult(value))
                              throw new Error(
                                "Group view withheld: fewer than five contributions.",
                              );
                            setGroup(value);
                          })
                        }
                      >
                        Refresh result
                      </button>
                    </div>
                    <p className="panel-caption">
                      At least five answers are required to reveal.
                    </p>
                  </>
                ) : (
                  <p>
                    Ask the panel or open a pulse to begin. No answers have been
                    loaded.
                  </p>
                )}
              </Section>
              <Section title="Panel distribution">
                {group ? (
                  <GroupChart
                    result={group}
                    reference={risk.probability_acaps}
                  />
                ) : (
                  <div className="empty-panel">
                    <LockKeyhole size={24} />
                    <p>The group view stays sealed until reveal.</p>
                  </div>
                )}
              </Section>
              <Section title="Draft update">
                {!draft ? (
                  <button
                    disabled={!!busy || !group || !pulse}
                    onClick={() =>
                      void run("Preparing cited draft", async () => {
                        const value = await endpoint.draft(pulse!.id);
                        setDraft(value);
                        setProbability(value.proposed_probability);
                      })
                    }
                  >
                    Prepare draft
                  </button>
                ) : (
                  <>
                    <div className="draft-rating">
                      <span className="rating">
                        {draft.proposed_probability} probability
                      </span>
                      <span>
                        {draft.proposed_level} risk · {draft.status}
                      </span>
                    </div>
                    <DraftNarrative
                      draft={draft}
                      themes={group?.missing_themes}
                    />
                    <div className="citations">
                      {draft.citations
                        ?.filter((c) => safeUrl(c.url))
                        .map((c) => (
                          <a
                            href={safeUrl(c.url)}
                            key={c.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {c.text}
                          </a>
                        ))}
                    </div>
                    <Verification draft={draft} />
                    {draft.status === "draft" ? (
                      <div className="decision-form">
                        {pendingClaims(draft, group?.missing_themes).length >
                          0 && (
                          <button
                            disabled={!!busy}
                            onClick={() =>
                              void run("Refreshing checked draft", async () =>
                                setDraft(await endpoint.draft(pulse!.id)),
                              )
                            }
                          >
                            Request refreshed draft
                          </button>
                        )}
                        <label htmlFor="live-note">Decision note</label>
                        <textarea
                          id="live-note"
                          maxLength={500}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                        {edit && (
                          <>
                            <label htmlFor="live-probability">
                              Edited probability
                            </label>
                            <select
                              id="live-probability"
                              value={probability}
                              onChange={(e) => setProbability(e.target.value)}
                            >
                              {[
                                "Very Low",
                                "Low",
                                "Medium",
                                "High",
                                "Very High",
                              ].map((v) => (
                                <option key={v}>{v}</option>
                              ))}
                            </select>
                          </>
                        )}
                        <div className="panel-actions">
                          <button
                            disabled={
                              !!busy ||
                              pendingClaims(draft, group?.missing_themes)
                                .length > 0
                            }
                            className="primary"
                            onClick={() =>
                              void decision(edit ? "edit" : "accept")
                            }
                          >
                            {edit ? "Save edited decision" : "Accept draft"}
                          </button>
                          <button
                            disabled={!!busy}
                            onClick={() => setEdit((v) => !v)}
                          >
                            {edit ? "Cancel edit" : "Edit probability"}
                          </button>
                          <button
                            disabled={!!busy}
                            onClick={() => void decision("reject")}
                          >
                            Reject draft
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="decision-log">
                        <h3>Decision log</h3>
                        <p>
                          {draft.status}: {draft.note}
                        </p>
                        {draft.decided_at && (
                          <time>{date(draft.decided_at)}</time>
                        )}
                        <a href="/ledger">
                          Open public ledger <ArrowRight size={15} />
                        </a>
                      </div>
                    )}
                  </>
                )}
              </Section>
              {draft && ["accepted", "edited"].includes(draft.status) && (
                <Section title="Resolve and score">
                  <p>
                    Record the observed outcome when this forecast resolves.
                  </p>
                  <div className="resolution-form">
                    <label htmlFor="outcome">Observed outcome</label>
                    <select
                      id="outcome"
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                    >
                      <option value="materialised">Materialised</option>
                      <option value="not_materialised">Not materialised</option>
                    </select>
                    <label htmlFor="resolved-at">Resolution date (UTC)</label>
                    <input
                      id="resolved-at"
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={resolvedAt}
                      onChange={(e) => setResolvedAt(e.target.value)}
                    />
                    <label className="changed">
                      <input
                        type="checkbox"
                        checked={confirmResolve}
                        onChange={(e) => setConfirmResolve(e.target.checked)}
                      />{" "}
                      I confirm this is an observed outcome.
                    </label>
                    <button
                      disabled={!!busy || !confirmResolve || !resolvedAt}
                      onClick={() =>
                        void run("Resolving and scoring", async () => {
                          const value = await endpoint.resolve(
                            selected,
                            outcome,
                            `${resolvedAt}T00:00:00Z`,
                          );
                          setMessage(
                            `${value.scores_written} scores written; ${value.weights_updated} reliability weights updated.`,
                          );
                          setConfirmResolve(false);
                        })
                      }
                    >
                      Resolve risk and score forecasts
                    </button>
                  </div>
                </Section>
              )}
            </div>
            <aside className="desk-side">
              <PanelMatch riskId={selected} />
              {pulse && group && <IntegrityPanel pulseId={pulse.id} />}
              <Section title="Doorbell evidence">
                {pulse?.evidence.length ? (
                  pulse.evidence.map((e) => (
                    <div className="indicator-row" key={e.indicator}>
                      <a href={safeUrl(e.url)} target="_blank" rel="noreferrer">
                        {e.source}
                      </a>
                      <span>{e.indicator.replaceAll("_", " ")}</span>
                      <strong>
                        {e.value.toLocaleString()}{" "}
                        <small>vs {e.baseline.toLocaleString()} baseline</small>
                      </strong>
                      <span>z = {e.z}</span>
                    </div>
                  ))
                ) : (
                  <p>No pulse evidence loaded.</p>
                )}
              </Section>
              <Section title="Agreement by region">
                {group ? (
                  <>
                    {group.agreement_by_region
                      .filter((r) => r.n >= 3 && r.mean !== null)
                      .map((r) => (
                        <p className="region-line" key={r.region}>
                          {r.region}
                          <strong>{percent(r.mean!)}</strong>
                          <span>{r.n} answers</span>
                        </p>
                      ))}
                    <p className="panel-caption">
                      Regions below three answers are withheld.
                    </p>
                  </>
                ) : (
                  <p>Regional views open after reveal.</p>
                )}
              </Section>
              <Section title="Missing themes">
                {group ? (
                  <ul className="theme-list">
                    {group.missing_themes.map((t) => (
                      <li key={t.theme}>
                        <span>
                          {t.theme}
                          <small className="theme-provenance">
                            Origin: {t.origin} · {t.corroboration}
                          </small>
                        </span>
                        <strong>{t.count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Themes open after reveal.</p>
                )}
              </Section>
              <Section title="Super-estimator board">
                {board ? (
                  <>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Pseudonym</th>
                            <th>Resolved</th>
                            <th>Brier</th>
                            <th>Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {board.super_estimators.map((e) => (
                            <tr key={e.pseudonym}>
                              <td>{e.pseudonym}</td>
                              <td>{e.n}</td>
                              <td>{e.mean_brier.toFixed(2)}</td>
                              <td>{e.weight.toFixed(1)}×</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="panel-caption">
                      Lower Brier scores are better. Reliability weights affect
                      the group probability.
                    </p>
                    <h3 className="subheading">Panel divergence</h3>
                    {board.divergence
                      .filter(
                        (d) =>
                          group && validResult(group) && d.risk_id === selected,
                      )
                      .map((d) => (
                        <p className="divergence-line" key={d.risk_id}>
                          <span>{d.risk_id}</span>
                          <span>Panel {percent(d.panel)}</span>
                          <span>ACAPS {percent(d.acaps)}</span>
                        </p>
                      ))}
                    <p className="panel-caption">
                      Panel comparisons are shown only for the selected,
                      revealed group with at least five contributions.
                    </p>
                  </>
                ) : (
                  <p>Reliability data unavailable.</p>
                )}
              </Section>
            </aside>
          </div>
        </>
      ) : (
        !busy && (
          <Section title="No active risks">
            <p>No risk cards are available. Refresh to check again.</p>
          </Section>
        )
      )}
    </Frame>
  );
}
function LiveLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]),
    [hidden, setHidden] = useState(0),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [receipts, setReceipts] = useState<
    Record<string, { valid: boolean; anchor: string | null }>
  >({});
  async function load() {
    setBusy("Loading ledger");
    setError("");
    setReceipts({});
    try {
      const value = await endpoint.ledger();
      const checked = await Promise.all(
        value.entries.map(async (entry) => {
          if (typeof entry.honesty?.n === "number")
            return {
              ...entry,
              n:
                typeof entry.n === "number"
                  ? Math.min(entry.n, entry.honesty.n)
                  : entry.honesty.n,
            };
          if (typeof entry.n === "number") return entry;
          try {
            const result = await endpoint.result(entry.pulse_id);
            return {
              ...entry,
              n:
                validResult(result) && result.pulse_id === entry.pulse_id
                  ? result.n
                  : 0,
            };
          } catch {
            return { ...entry, n: 0 };
          }
        }),
      );
      const safe = checked.filter(
        (e) => Number.isInteger(e.n) && e.n! >= Math.max(5, value.k_min || 5),
      );
      setEntries(safe);
      setHidden(checked.length - safe.length);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <Frame
      title="Public ledger"
      subtitle="Group forecasts, analyst decisions and observed outcomes."
    >
      <div className="ledger-toolbar">
        <label htmlFor="search">Find a risk</label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Risk ID"
        />
        <button disabled={!!busy} onClick={() => void load()}>
          Refresh ledger
        </button>
      </div>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      <p role="status" className="workspace-message">
        {busy || message}
      </p>
      {entries
        .filter((e) => e.risk_id.toLowerCase().includes(query.toLowerCase()))
        .map((entry) => (
          <Section
            key={`${entry.risk_id}-${entry.pulse_id}`}
            title={`${entry.risk_id} / ${entry.pulse_id}`}
          >
            <div className="ledger-stats">
              <div>
                <span>Group probability</span>
                <strong>{percent(entry.group_probability)}</strong>
                <small>{entry.n} contributions</small>
              </div>
              <div>
                <span>ACAPS probability</span>
                <strong>{entry.acaps_probability}</strong>
                <small>Risk level: {entry.acaps_level}</small>
              </div>
              <div>
                <span>Outcome</span>
                <strong className="small-stat">
                  {entry.outcome?.replaceAll("_", " ") || "Unresolved"}
                </strong>
                {entry.resolved_at && <small>{date(entry.resolved_at)}</small>}
              </div>
            </div>
            <HonestyBox value={entry.honesty} />
            <dl className="ledger-details">
              <div>
                <dt>Sealed at</dt>
                <dd>{date(entry.sealed_at)}</dd>
              </div>
              <div>
                <dt>Verification hash</dt>
                <dd>
                  <code>{entry.verify_hash}</code>
                </dd>
              </div>
            </dl>
            <div className="panel-actions">
              <button
                disabled={!!busy}
                className={
                  receipts[entry.verify_hash]?.valid ? "verified-button" : ""
                }
                onClick={async () => {
                  setBusy("Verifying ledger entry");
                  setError("");
                  try {
                    const receipt = await endpoint.verify(entry.verify_hash);
                    setReceipts((v) => ({
                      ...v,
                      [entry.verify_hash]: receipt,
                    }));
                    setMessage(
                      receipt.valid
                        ? "API reports a valid ledger entry."
                        : "Verification failed. The API reports a hash mismatch.",
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                {receipts[entry.verify_hash]?.valid && <Check size={16} />}
                Verify entry
              </button>
              <CopyButton value={entry.verify_hash} label="Copy hash" />
            </div>
            {receipts[entry.verify_hash] && (
              <p className="panel-caption">
                {receipts[entry.verify_hash].valid
                  ? "API verification passed."
                  : "Verification failed."}{" "}
                {receipts[entry.verify_hash].anchor ? (
                  <a
                    href={
                      safeUrl(receipts[entry.verify_hash].anchor!) || undefined
                    }
                  >
                    Timestamp anchor: {receipts[entry.verify_hash].anchor}
                  </a>
                ) : (
                  "No blockchain or timestamp anchor is configured."
                )}
              </p>
            )}
          </Section>
        ))}
      {!busy &&
        !error &&
        entries.filter((e) =>
          e.risk_id.toLowerCase().includes(query.toLowerCase()),
        ).length === 0 && (
          <Section
            title={query ? "No matching risks" : "No eligible ledger entries"}
          >
            <p>
              {query
                ? "Try another risk ID."
                : "Entries appear after analyst approval and require at least five confirmed contributions."}
            </p>
          </Section>
        )}
      {hidden > 0 && (
        <p className="panel-caption">
          {hidden} entries withheld because five contributions could not be
          confirmed.
        </p>
      )}
    </Frame>
  );
}
export function LiveWorkspace({ page }: { page: "desk" | "ledger" }) {
  return page === "desk" ? <LiveDesk /> : <LiveLedger />;
}
