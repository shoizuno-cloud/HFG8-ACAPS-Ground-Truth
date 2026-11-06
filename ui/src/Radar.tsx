import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import countries from "world-atlas/countries-110m.json";
import type { FeatureCollection, Geometry } from "geojson";
import { mock } from "./api";
import { endpoint, type Risk } from "./service";
import { Frame, Section } from "./LiveWorkspace";
import { date } from "./desk-model";
import type { RadarStatus } from "./v2-types";

const world = feature(
  countries as unknown as Topology<{ countries: GeometryCollection }>,
  (countries as unknown as Topology<{ countries: GeometryCollection }>).objects
    .countries,
) as FeatureCollection<Geometry, { name: string }>;
const path = geoPath(
  geoNaturalEarth1().fitExtent(
    [
      [16, 8],
      [944, 430],
    ],
    world,
  ),
);
function normalise(name: string) {
  const names: Record<string, string> = {
    "democratic republic of the congo": "dem. rep. congo",
    "republic of the congo": "congo",
    "south sudan": "s. sudan",
    "central african republic": "central african rep.",
    "united states": "united states of america",
  };
  return names[name.toLowerCase()] || name.toLowerCase();
}
export function Radar() {
  const [risks, setRisks] = useState<Risk[]>([]),
    [status, setStatus] = useState<RadarStatus | null>(null),
    [query, setQuery] = useState(""),
    [level, setLevel] = useState("all"),
    [country, setCountry] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const jobs = mock
      ? Promise.all([
          import("../../fixtures/GET_risks.json").then((m) => m.default),
          import("../../fixtures/GET_radar_status.json").then((m) => m.default),
        ])
      : Promise.all([endpoint.risks(), endpoint.radar()]);
    jobs
      .then(([list, meta]) => {
        if (active) {
          setRisks(list.risks);
          setStatus(meta as RadarStatus);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reload]);
  const visible = useMemo(
    () =>
      risks.filter(
        (r) =>
          (level === "all" || r.level === level) &&
          (!country || r.country === country) &&
          `${r.title} ${r.country} ${r.risk_id}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [risks, level, country, query],
  );
  const byCountry = new Map<string, Risk[]>();
  for (const risk of risks) {
    const key = normalise(risk.country);
    byCountry.set(key, [...(byCountry.get(key) || []), risk]);
  }
  return (
    <Frame
      title="Risk Radar"
      subtitle="Follow the Risk List. Invite independent expert validation."
    >
      <div className="radar-source">
        <span className="source-badge">
          {mock ? "Fixture demo · " : ""}Source:{" "}
          {status?.source === "acaps-api"
            ? "ACAPS API"
            : status?.source === "csv"
              ? "CSV fallback"
              : "Awaiting source"}
        </span>
        {status && (
          <span>
            {risks.length} risks loaded · source dataset {status.n_risks}
            <br />
            <small>Fetched {date(status.fetched_at)}</small>
          </span>
        )}
        <button disabled={loading} onClick={() => setReload((v) => v + 1)}>
          Refresh Radar
        </button>
      </div>
      {loading && <p role="status">Loading Risk Radar…</p>}
      {error && (
        <p className="error-box" role="alert">
          {error} Use Refresh Radar to retry. No local fixture fallback is used
          in API mode.
        </p>
      )}
      <Section title="Countries with active risks">
        <svg
          className="world-map"
          viewBox="0 0 960 456"
          role="group"
          aria-label="World map. Countries with loaded risks can be selected to filter the list."
        >
          {world.features.map((f) => {
            const matches = byCountry.get(normalise(f.properties.name)) || [];
            const name = matches[0]?.country;
            return (
              <path
                key={f.id || f.properties.name}
                d={path(f) || ""}
                className={
                  name === country
                    ? "map-country selected"
                    : matches.length
                      ? "map-country active"
                      : "map-country"
                }
                {...(name
                  ? {
                      tabIndex: 0,
                      role: "button",
                      "aria-label": `${name}, ${matches.length} risks`,
                      "aria-pressed": name === country,
                      onClick: () =>
                        setCountry((v) => (v === name ? "" : name)),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setCountry((v) => (v === name ? "" : name));
                        }
                      },
                    }
                  : {})}
              >
                <title>
                  {f.properties.name}
                  {matches.length ? `: ${matches.length} loaded risks` : ""}
                </title>
              </path>
            );
          })}
          <text x="16" y="450">
            Highlighted countries have loaded risk cards. Select a country to
            filter.
          </text>
        </svg>
        <p className="panel-caption">
          Country boundaries: Natural Earth via world-atlas. This map is a
          locator, not an endorsement of boundaries or status. Risk ratings are
          not crisis severity ratings.
        </p>
      </Section>
      <Section title="Risk List">
        <div className="radar-filters">
          <div>
            <label htmlFor="risk-search">Search risks</label>
            <input
              id="risk-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Country, title or risk ID"
            />
          </div>
          <div>
            <label htmlFor="risk-level">Risk level</label>
            <select
              id="risk-level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="all">All levels</option>
              {["High", "Medium", "Low"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="country-filter">Country</label>
            <select
              id="country-filter"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">All countries</option>
              {Array.from(new Set(risks.map((r) => r.country)))
                .sort()
                .map((v) => (
                  <option key={v}>{v}</option>
                ))}
            </select>
          </div>
          <button
            onClick={() => {
              setQuery("");
              setLevel("all");
              setCountry("");
            }}
          >
            Clear filters
          </button>
        </div>
        <p className="panel-caption" role="status">
          {visible.length} matching risk{visible.length === 1 ? "" : "s"}
        </p>
        {visible.length ? (
          <div className="table-wrap">
            <table className="radar-table">
              <thead>
                <tr>
                  <th>Country / ID</th>
                  <th>Risk</th>
                  <th>Probability</th>
                  <th>Level</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.risk_id}>
                    <td>
                      {r.country}
                      <small>{r.risk_id}</small>
                    </td>
                    <td>{r.title}</td>
                    <td>{r.probability_acaps}</td>
                    <td>
                      <span className="rating">{r.level}</span>
                    </td>
                    <td>
                      <a
                        href={`/desk?risk_id=${encodeURIComponent(r.risk_id)}`}
                      >
                        Review risk
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <p>
              No risks match these filters. Clear filters to see the loaded
              list.
            </p>
          )
        )}
      </Section>
      <div className="radar-next">
        <a href="/apply">Apply as a synthetic expert</a>
        <a href="/committee">Committee review</a>
      </div>
      <details className="about-platform">
        <summary>About this validation layer</summary>
        <p>{platformDescription}</p>
      </details>
    </Frame>
  );
}
const platformDescription =
  "Sealed Signals is the Risk Radar platform ACAPS does not have: the live Risk List from the ACAPS API, with an expert loop, a bias and integrity layer and a public audit trail built on top. It lets ACAPS ask a small, trusted panel of vetted experts (5–10, matched by geographic and thematic tags) to challenge and forecast its risk analyses in one minute, behind a mask each expert chooses. A daily \"doorbell\" watches open indicators mapped to the risk's own triggers and fires a pulse when something shifts (or when an analyst, or two experts, ask). Answers are sealed, opened together, aggregated with the surprisingly-popular method and reliability weights, turned into a cited draft update the analyst accepts or rejects, and published as a group view on a public ledger. When the risk resolves, every forecast is Brier-scored, weights update, and experts get a private calibration report. Nothing identifying ever leaves the expert's device; nothing publishes itself.";
