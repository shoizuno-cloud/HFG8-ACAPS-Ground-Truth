import { useEffect, useState, type FormEvent } from "react";
import * as Slider from "@radix-ui/react-slider";
import {
  BadgeCheck,
  Check,
  Clock3,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  getCard,
  sealAnswer,
  mock,
  type Card,
  type Mask,
  type Answer,
} from "./api";
import { CopyButton } from "./LiveWorkspace";
import { safeUrl } from "./service";
import { en } from "./locales/en";

function Probability({
  id,
  label,
  help,
  value,
  change,
}: {
  id: string;
  label: string;
  help: string;
  value: number;
  change: (value: number) => void;
}) {
  return (
    <div className="question">
      <div className="question-heading">
        <span className="field-label" id={`${id}-label`}>
          {label}
        </span>
        <output>
          {value}
          <span>%</span>
        </output>
      </div>
      <p className="help" id={`${id}-help`}>
        {help}
      </p>
      <Slider.Root
        className="slider"
        min={0}
        max={100}
        step={1}
        value={[value]}
        onValueChange={([value]) => change(value)}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help`}
      >
        <Slider.Track className="track">
          <Slider.Range className="range" />
        </Slider.Track>
        <Slider.Thumb className="thumb" aria-label={label} />
      </Slider.Root>
      <div className="scale">
        <span>0% · Very unlikely</span>
        <span>100% · Very likely</span>
      </div>
    </div>
  );
}
export function ExpertCard({ token }: { token: string }) {
  const [card, setCard] = useState<Card | null>(null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  const [probability, setProbability] = useState(50),
    [panel, setPanel] = useState(50),
    [confidence, setConfidence] = useState(3),
    [source, setSource] = useState<Answer["source_tag"]>(null),
    [missing, setMissing] = useState(""),
    [mask, setMask] = useState<Mask>("anonymous"),
    [agree, setAgree] = useState(true),
    [changed, setChanged] = useState(false);
  const [seconds, setSeconds] = useState(60),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<Awaited<
      ReturnType<typeof sealAnswer>
    > | null>(null),
    [submitError, setSubmitError] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    setCard(null);
    getCard(token)
      .then((value) => {
        if (active) {
          setCard(value);
          setSeconds(value.seconds || 60);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    document.title = "Expert pulse | Sealed Signals";
    return () => {
      active = false;
    };
  }, [token, reload]);
  useEffect(() => {
    if (!card || receipt) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [card, receipt]);
  const blind = card?.round !== 2; // Round one remains blind even if an older API includes a rating.
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || receipt) return;
    setBusy(true);
    setSubmitError("");
    try {
      setReceipt(
        await sealAnswer(token, {
          agree: blind ? null : agree,
          probability: probability / 100,
          panel_guess: panel / 100,
          confidence,
          source_tag: source,
          mask,
          missing: missing.trim(),
          changed_mind: !blind && changed,
        }),
      );
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#expert-content">
        Skip to expert card
      </a>
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">
            <LockKeyhole size={19} />
          </span>
          Sealed Signals
        </a>
        <span className="header-note">Independent expert perspective</span>
      </header>
      <main id="expert-content">
        <aside className="intro">
          <p className="eyebrow">
            Expert pulse{" "}
            {mock && <span className="mock-tag">Fixture demo</span>}
          </p>
          <h1>Your independent view, first.</h1>
          <p>
            Forecast the risk before seeing the panel. Your chosen mask applies
            to this answer.
          </p>
          <div className="trust">
            <ShieldCheck size={20} />
            <span>
              One validation layer among others.
              <br />
              An ACAPS analyst decides what changes.
            </span>
          </div>
        </aside>
        <section className="card" aria-label="Expert response card">
          {error ? (
            <div className="state" role="alert">
              <h2>We couldn’t open this card.</h2>
              <p>{error}</p>
              <button onClick={() => setReload((v) => v + 1)}>Try again</button>
            </div>
          ) : !card ? (
            <div className="state" role="status">
              Opening your expert card…
            </div>
          ) : receipt ? (
            <div className="state receipt" role="status">
              <span className="success-mark">
                <Check size={28} />
              </span>
              <h2>{en.sealed}</h2>
              <p>
                Your answer uses the <strong>{mask}</strong> mask. Only a group
                view with at least five answers can be published.
              </p>
              <div className="receipt-box">
                <span>
                  {mock
                    ? "Fixture receipt · not a live seal"
                    : "API seal receipt"}
                </span>
                <time>
                  {new Date(receipt.sealed_at).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </time>
                <span>Commitment</span>
                <code>{receipt.commitment}</code>
                <CopyButton
                  value={receipt.commitment}
                  label="Copy commitment"
                />
              </div>
              <a href={`/me/${encodeURIComponent(token)}/calibration`}>
                View your private calibration
              </a>
            </div>
          ) : (
            <>
              <div className="card-top">
                <span>
                  {card.risk.country} / {card.risk.risk_id}
                </span>
                <span className="timer">
                  <Clock3 size={15} />
                  {seconds
                    ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                    : "Take your time"}
                </span>
              </div>
              <div className="risk-context">
                <div className="risk-meta">
                  <span>Round {card.round}</span>
                  <span>Next {card.risk.horizon_months} months</span>
                  {blind ? (
                    <span className="blind-badge">Independent first round</span>
                  ) : (
                    <span className="rating">
                      ACAPS probability:{" "}
                      {card.risk.probability_acaps || "Not supplied"}
                    </span>
                  )}
                </div>
                <h2>{card.risk.title}</h2>
                <details className="evidence">
                  <summary>
                    {card.pulse.evidence[0]
                      ? `${card.pulse.evidence[0].source}: ${card.pulse.evidence[0].value.toLocaleString("en-GB")} versus ${card.pulse.evidence[0].baseline.toLocaleString("en-GB")} baseline`
                      : "Indicator evidence"}
                  </summary>
                  {card.pulse.evidence.map((e) => (
                    <p key={e.indicator}>
                      <a href={safeUrl(e.url)} target="_blank" rel="noreferrer">
                        {e.source}
                      </a>
                      : {e.value.toLocaleString("en-GB")} versus{" "}
                      {e.baseline.toLocaleString("en-GB")} baseline.
                    </p>
                  ))}
                </details>
              </div>
              {!blind && (
                <section className="group-view">
                  <h3>How the panel answered</h3>
                  {card.group_view_if_round2 &&
                  card.group_view_if_round2.n >= 5 ? (
                    <>
                      <p>
                        {card.group_view_if_round2.n} synthetic answers ·
                        Weighted probability{" "}
                        {Math.round(
                          card.group_view_if_round2.weighted_probability * 100,
                        )}
                        %
                      </p>
                      <div
                        className="distribution"
                        aria-label="Panel probability distribution"
                      >
                        {card.group_view_if_round2.distribution.map((b) => (
                          <div key={b.bucket}>
                            <span className="bar-space">
                              <span
                                style={{
                                  height: `${(b.count / card.group_view_if_round2!.n) * 100}%`,
                                }}
                              />
                            </span>
                            <span>
                              {b.bucket
                                .split("-")
                                .map((v) => Math.round(Number(v) * 100))
                                .join("–")}
                              %
                            </span>
                            <strong>{b.count}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p>
                      Group view withheld until at least five answers are
                      confirmed.
                    </p>
                  )}
                </section>
              )}
              <form onSubmit={submit}>
                <fieldset disabled={busy}>
                  {!blind && (
                    <div className="agree-row">
                      <span className="field-label">
                        Still {card.risk.probability_acaps || "the same rating"}
                        ?
                      </span>
                      <div
                        className="segmented"
                        role="group"
                        aria-label="Do you agree with the ACAPS rating?"
                      >
                        <button
                          type="button"
                          aria-pressed={agree}
                          onClick={() => setAgree(true)}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          aria-pressed={!agree}
                          onClick={() => setAgree(false)}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                  <Probability
                    id="probability"
                    label={en.probability}
                    help="Give your own estimate before considering anyone else’s."
                    value={probability}
                    change={setProbability}
                  />
                  <div className="question confidence-field">
                    <label htmlFor="confidence">
                      How confident are you in this estimate?
                    </label>
                    <select
                      id="confidence"
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                    >
                      {[
                        "Very uncertain",
                        "Somewhat uncertain",
                        "Moderately confident",
                        "Confident",
                        "Very confident",
                      ].map((label, i) => (
                        <option key={label} value={i + 1}>
                          {i + 1} · {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Probability
                    id="panel"
                    label={en.panel}
                    help="What share of experts will say this risk is more likely than not to materialise?"
                    value={panel}
                    change={setPanel}
                  />
                  <div className="question">
                    <label htmlFor="missing">
                      What are we missing?{" "}
                      <span className="optional">Optional</span>
                    </label>
                    <p className="help" id="accuracy-prompt">
                      {card.accuracy_prompt ||
                        "Is this something you saw, read, or heard?"}
                    </p>
                    <div
                      className="source-picker"
                      role="group"
                      aria-label="Source of your observation"
                    >
                      {(["saw", "read", "heard"] as const).map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          aria-pressed={source === tag}
                          onClick={() =>
                            setSource((v) => (v === tag ? null : tag))
                          }
                        >
                          {tag === "saw"
                            ? "I saw it"
                            : tag === "read"
                              ? "I read it"
                              : "I heard it"}
                        </button>
                      ))}
                    </div>
                    <textarea
                      id="missing"
                      aria-describedby="accuracy-prompt missing-help"
                      maxLength={240}
                      rows={2}
                      value={missing}
                      onChange={(e) => setMissing(e.target.value)}
                      placeholder="A signal, a local shift, a different perspective…"
                    />
                    <p className="help" id="missing-help">
                      Leave out names and identifying details.
                    </p>
                    <span className="char-count">{missing.length}/240</span>
                  </div>
                  {!blind && (
                    <label className="changed">
                      <input
                        type="checkbox"
                        checked={changed}
                        onChange={(e) => setChanged(e.target.checked)}
                      />{" "}
                      I changed my mind after seeing the panel
                    </label>
                  )}
                  <div className="question mask-question">
                    <span className="field-label" id="mask-label">
                      Choose your mask for this answer
                    </span>
                    <div
                      className="masks"
                      role="group"
                      aria-labelledby="mask-label"
                    >
                      {(["known", "pseudonym", "anonymous"] as Mask[])
                        .filter((m) => card.mask_options.includes(m))
                        .map((m, i) => {
                          const Icon = [BadgeCheck, UserRound, Fingerprint][i];
                          return (
                            <button
                              type="button"
                              key={m}
                              aria-pressed={mask === m}
                              onClick={() => setMask(m)}
                            >
                              <Icon size={19} />
                              <strong>{en.masks[m][0]}</strong>
                              <span>{en.masks[m][1]}</span>
                            </button>
                          );
                        })}
                    </div>
                    <p className="help">
                      {mask === "known"
                        ? "ACAPS can associate this answer with your invitation."
                        : mask === "pseudonym"
                          ? "Peers see a nickname, not your identity."
                          : "No pseudonym is shown. Your answer counts only in the aggregate."}{" "}
                      Public output is group-only.
                    </p>
                  </div>
                  {submitError && (
                    <p role="alert" className="error-box">
                      {submitError} Your inputs are kept here.
                    </p>
                  )}
                  <button type="submit" className="seal-button">
                    <LockKeyhole size={18} />
                    {busy ? "Sealing your answer…" : "Seal my answer"}
                  </button>
                  <p className="seal-note">
                    {seconds
                      ? "Opened together, after the panel responds."
                      : "Take the time you need. Your answer is still open."}
                  </p>
                </fieldset>
              </form>
            </>
          )}
          <footer className="card-footer">
            <ShieldCheck size={14} />
            Synthetic experts and answers. Demonstration only.
          </footer>
        </section>
      </main>
    </>
  );
}
