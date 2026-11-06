import { useEffect, useState } from "react";
import { mock } from "./api";
import { endpoint } from "./service";
import { percent } from "./desk-model";
import { Section } from "./LiveWorkspace";
import type { Honesty, Integrity, Match } from "./v2-types";

export function HonestyBox({ value }: { value?: Honesty }) {
  if (!value || value.n < 5)
    return (
      <div className="honesty-box">
        <h3>What fed into this view</h3>
        <p>
          Honesty details are unavailable. This entry needs a confirmed group of
          at least five.
        </p>
      </div>
    );
  return (
    <section className="honesty-box" aria-label="Public honesty box">
      <h3>What fed into this view</h3>
      <div className="honesty-grid">
        <div>
          <span>Contributions</span>
          <strong>{value.n}</strong>
        </div>
        <div>
          <span>Agreement</span>
          <strong>{percent(value.agreement)}</strong>
        </div>
        <div>
          <span>Confidence band</span>
          <strong>
            {percent(value.confidence_band[0])}–
            {percent(value.confidence_band[1])}
          </strong>
        </div>
        <div>
          <span>Claims corroborated</span>
          <strong>
            {value.claims_corroborated} / {value.claims_total}
          </strong>
        </div>
        <div>
          <span>Past panel hit rate</span>
          <strong>
            {value.panel_hit_rate === null
              ? "No track record yet"
              : percent(value.panel_hit_rate)}
          </strong>
          <small>Includes misses</small>
        </div>
        <div>
          <span>Coverage gaps</span>
          <strong>
            {value.coverage_gaps.length
              ? value.coverage_gaps.join("; ")
              : "None reported"}
          </strong>
        </div>
      </div>
      <p className="caveat">{value.caveat}</p>
      <p className="panel-caption">
        One validation layer among others. This view does not automatically
        change an ACAPS product.
      </p>
    </section>
  );
}
export function IntegrityPanel({ pulseId }: { pulseId: string }) {
  const [value, setValue] = useState<Integrity | null>(null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setValue(null);
    setError("");
    const job = mock
      ? import("../../fixtures/GET_integrity_pulse.json").then((m) => m.default)
      : endpoint.integrity(pulseId);
    job
      .then((v) => {
        if (active) setValue(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [pulseId, reload]);
  return (
    <Section title="Bias and integrity">
      <p className="panel-caption">
        Moderator-only evidence. Flags indicate checks to review, not findings
        about a person.
      </p>
      {error ? (
        <>
          <p role="alert">{error}</p>
          <button onClick={() => setReload((v) => v + 1)}>
            Retry integrity checks
          </button>
        </>
      ) : value ? (
        <>
          <dl className="integrity-grid">
            <div>
              <dt>Anchoring shift</dt>
              <dd>{percent(value.anchoring_shift)}</dd>
            </div>
            <div>
              <dt>Herding</dt>
              <dd>{value.herding}</dd>
            </div>
            <div>
              <dt>Collusion pairs</dt>
              <dd>{value.collusion_pairs}</dd>
            </div>
            <div>
              <dt>Recency</dt>
              <dd>{value.recency}</dd>
            </div>
            <div>
              <dt>Aggregate uses</dt>
              <dd>Round {value.used_round}</dd>
            </div>
          </dl>
          <h3 className="subheading">Coverage gaps</h3>
          {value.coverage_gaps.length ? (
            <ul>
              {value.coverage_gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          ) : (
            <p>None reported.</p>
          )}
          {value.herding === "suspected" && (
            <p className="caveat">
              Herding suspected. Review whether the aggregate uses independent
              round-one answers.
            </p>
          )}
          <details>
            <summary>Evidence for each check</summary>
            {value.evidence ? (
              Object.entries(value.evidence).map(([key, evidence]) => (
                <p className="claim" key={key}>
                  <strong>{key}</strong>
                  <br />
                  {evidence}
                </p>
              ))
            ) : (
              <p>No check evidence supplied.</p>
            )}
          </details>
        </>
      ) : (
        <p role="status">Loading integrity checks…</p>
      )}
    </Section>
  );
}
export function PanelMatch({ riskId }: { riskId: string }) {
  const [value, setValue] = useState<Match | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setValue(
        mock
          ? (await import("../../fixtures/GET_panels_match.json")).default
          : await endpoint.match(riskId),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setValue(null);
    setError("");
  }, [riskId]);
  return (
    <Section title="Panel matching">
      <p>
        Approved experts matched by geography and theme. Affiliation cap: three
        of eight.
      </p>
      <button disabled={loading || !riskId} onClick={() => void load()}>
        {loading ? "Matching experts…" : "Preview matched panel"}
      </button>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {value && (
        <>
          <div className="composition-banner">
            Composition check:{" "}
            {value.composition.ok ? "passes" : "needs review"}
            <br />
            Geographic spread: {value.composition.geo_spread.join(", ")}
            <br />
            Themes covered: {value.composition.theme_cover.join(", ")}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Synthetic pseudonym</th>
                  <th>Match</th>
                  <th>Geography</th>
                  <th>Themes</th>
                </tr>
              </thead>
              <tbody>
                {value.experts.map((e) => (
                  <tr key={e.pseudonym}>
                    <td>{e.pseudonym}</td>
                    <td>{percent(e.match)}</td>
                    <td>{e.geo_tags.join(", ")}</td>
                    <td>{e.theme_tags.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {value.composition.gaps.length > 0 && (
            <p className="caveat">
              Coverage gaps: {value.composition.gaps.join("; ")}
            </p>
          )}
        </>
      )}
    </Section>
  );
}
