import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  BookOpen,
  Layers3,
} from "lucide-react";
import { Frame, Section } from "./LiveWorkspace";
import { mock } from "./api";
import { endpoint, type Risk } from "./service";
import {
  checkedOn,
  countryProfiles,
  publications,
  resources,
} from "./acaps-catalog";

function useRisks() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [status, setStatus] = useState("Loading connected risks…");
  useEffect(() => {
    let active = true;
    const task = mock
      ? import("../../fixtures/GET_risks.json").then((m) => m.default)
      : endpoint.risks();
    task
      .then((data) => {
        if (active) {
          setRisks(data.risks);
          setStatus(
            mock
              ? "Demo risk fixtures · synthetic expert workflow"
              : `Connected risk service · ${[...new Set(data.risks.map((r) => r.served_from))].join(", ") || "no loaded"} source`,
          );
        }
      })
      .catch(() => {
        if (active)
          setStatus(
            "Risk service unavailable. Official analysis links remain available; retry by refreshing.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  return { risks, status };
}
function Snapshot() {
  return (
    <p className="catalog-source">
      Selected official ACAPS links · checked {checkedOn}. This catalogue is a
      discovery snapshot, not a live publications feed.{" "}
      <a href="https://www.acaps.org/en/countries/archives">
        Browse the complete current archive{" "}
        <ArrowUpRight size={13} aria-hidden="true" />
      </a>
    </p>
  );
}
function ReportCards({ items }: { items: typeof publications }) {
  return (
    <div className="discovery-grid">
      {items.map((p) => (
        <article className="discovery-card report-card" key={p.url}>
          <div className="card-eyebrow">
            {p.country} <span>{p.theme}</span>
          </div>
          <time dateTime={p.date}>
            {new Date(`${p.date}T12:00:00Z`).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
          </time>
          <h2>{p.title}</h2>
          <a href={p.url}>
            Read on ACAPS <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          {countryProfiles.some((c) => c.iso === p.iso) && (
            <a
              className="secondary-discovery-link"
              href={`/countries/${p.iso}`}
            >
              Country context <ArrowRight size={15} aria-hidden="true" />
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
function RiskCards({ risks }: { risks: Risk[] }) {
  return (
    <div className="risk-discovery-list">
      {risks.map((r) => (
        <article className="discovery-card" key={r.risk_id}>
          <p className="card-eyebrow">
            {r.risk_id} · {r.status} · {r.level} risk
          </p>
          <h3>{r.title}</h3>
          <a href={`/desk?risk_id=${encodeURIComponent(r.risk_id)}`}>
            Review risk <ArrowRight size={16} aria-hidden="true" />
          </a>
        </article>
      ))}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="discovery-empty">{children}</div>;
}
export function Discovery({
  page,
  iso,
}: {
  page: "countries" | "analysis" | "topics" | "search";
  iso?: string;
}) {
  const { risks, status } = useRisks();
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get("q") || "");
  const [country, setCountry] = useState(params.get("country") || "");
  const [theme, setTheme] = useState(params.get("theme") || "");
  const [since, setSince] = useState(params.get("from") || "");
  const [sort, setSort] = useState("newest");
  const matches = (...texts: string[]) =>
    texts
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase());
  const countries = [
    ...countryProfiles.map((c) => ({ ...c, selected: true })),
    ...risks
      .filter((r) => !countryProfiles.some((c) => c.iso === r.country_iso))
      .map((r) => ({
        iso: r.country_iso,
        name: r.country,
        url: "https://www.acaps.org/en/countries",
        slug: "",
        selected: false,
      })),
  ]
    .filter((c, i, all) => all.findIndex((a) => a.iso === c.iso) === i)
    .sort((a, b) => a.name.localeCompare(b.name));
  const profile = countries.find((c) => c.iso === iso);
  const filteredReports = publications
    .filter(
      (p) =>
        matches(p.title, p.country, p.theme) &&
        (!country || p.iso === country) &&
        (!theme || p.theme === theme) &&
        (!since || p.date >= since),
    )
    .sort((a, b) =>
      sort === "oldest"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
  const reset = () => {
    setQuery("");
    setCountry("");
    setTheme("");
    setSince("");
    setSort("newest");
    history.replaceState(null, "", location.pathname);
  };
  if (iso)
    return (
      <Frame
        title={profile?.name || "Country context"}
        subtitle="Official analysis alongside the connected expert-validation workflow."
      >
        <a href="/countries" className="back-link">
          All countries
        </a>
        <p className="catalog-source" role="status">
          {status}
        </p>
        {!profile ? (
          <Empty>
            No country profile is loaded for this address.{" "}
            <a href="https://www.acaps.org/en/countries">Find it on ACAPS</a>.
          </Empty>
        ) : (
          <>
            <div className="discovery-feature">
              <Globe2 size={32} aria-hidden="true" />
              <div>
                <h2>Understand the context. Then test the signal.</h2>
                <p>
                  Use official country analysis for the wider picture, and
                  review connected risks with the expert panel. A missing risk
                  here does not mean there is no crisis.
                </p>
                <a href={profile.url}>
                  {profile.selected
                    ? `Official ${profile.name} analysis`
                    : "Find official country analysis"}{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
            <Section title="Connected risks">
              {risks.some((r) => r.country_iso === iso) ? (
                <RiskCards risks={risks.filter((r) => r.country_iso === iso)} />
              ) : (
                <Empty>
                  No risks for this country are loaded in the connected service.{" "}
                  <a href="/radar">Browse Risk Radar</a>.
                </Empty>
              )}
            </Section>
            <Section title="Selected country analysis">
              <Snapshot />
              <ReportCards items={publications.filter((p) => p.iso === iso)} />
              {!publications.some((p) => p.iso === iso) && (
                <Empty>
                  No report is included in this selected catalogue. Use the
                  official country page for available publications.
                </Empty>
              )}
              <a href={`/analysis?country=${iso}`}>
                Open analysis filters{" "}
                <ArrowRight size={15} aria-hidden="true" />
              </a>
            </Section>
          </>
        )}
      </Frame>
    );
  const titles = {
    countries: [
      "Country analysis",
      "Explore country context, official publications and connected risks.",
    ],
    analysis: [
      "Analysis library",
      "Find the analysis behind a better-informed decision.",
    ],
    topics: [
      "Topics & data",
      "Go deeper with official thematic analysis, datasets and methodology.",
    ],
    search: [
      "Search the portal",
      "Search selected country profiles, analysis, topics and connected risks.",
    ],
  };
  return (
    <Frame title={titles[page][0]} subtitle={titles[page][1]}>
      <div className="discovery-intro">
        <span>
          <BookOpen size={19} aria-hidden="true" /> Evidence before decisions
        </span>
        <p>
          ACAPS research gives the wider context. Sealed Signals adds expert
          validation and an accountable decision trail.
        </p>
      </div>
      {page !== "topics" && (
        <form
          className="discovery-filters"
          onSubmit={(e) => {
            e.preventDefault();
            const next = new URLSearchParams();
            if (query) next.set("q", query);
            if (country) next.set("country", country);
            if (theme) next.set("theme", theme);
            if (since) next.set("from", since);
            history.replaceState(
              null,
              "",
              `${location.pathname}${next.size ? `?${next}` : ""}`,
            );
          }}
        >
          <label>
            Search {page === "countries" ? "countries" : "this collection"}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                page === "countries"
                  ? "Country name or ISO code"
                  : "Country, topic or keyword"
              }
            />
          </label>
          {page === "analysis" && (
            <>
              <label htmlFor="analysis-country">
                Country
                <select
                  id="analysis-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="">All countries</option>
                  {[
                    ...new Map(
                      publications.map((p) => [p.iso, p.country]),
                    ).entries(),
                  ].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                  {country && !publications.some((p) => p.iso === country) && (
                    <option value={country}>
                      {countries.find((c) => c.iso === country)?.name ||
                        country}
                    </option>
                  )}
                </select>
              </label>
              <label htmlFor="analysis-theme">
                Theme
                <select
                  id="analysis-theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="">All themes</option>
                  {[...new Set(publications.map((p) => p.theme))].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Published from
                <input
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                />
              </label>
              <label htmlFor="analysis-sort">
                Sort
                <select
                  id="analysis-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </>
          )}
          <button type="submit">Search</button>
          <button type="button" className="secondary" onClick={reset}>
            Clear filters
          </button>
        </form>
      )}
      {page === "countries" && (
        <>
          <p className="catalog-source" role="status">
            {status}. Selected country links checked {checkedOn}.{" "}
            <a href="https://www.acaps.org/en/countries">
              All ACAPS countries <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </p>
          <p role="status">
            {countries.filter((c) => matches(c.name, c.iso)).length} countries
            in this directory
          </p>
          <div className="discovery-grid country-grid">
            {countries
              .filter((c) => matches(c.name, c.iso))
              .map((c) => (
                <article className="discovery-card" key={c.iso}>
                  <Globe2 size={23} aria-hidden="true" />
                  <span className="card-eyebrow">{c.iso}</span>
                  <h2>
                    <a href={`/countries/${c.iso}`}>{c.name}</a>
                  </h2>
                  <p>
                    {risks.filter((r) => r.country_iso === c.iso).length}{" "}
                    connected risks
                  </p>
                  <a href={`/countries/${c.iso}`}>
                    Explore country <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </article>
              ))}
          </div>
          {!countries.some((c) => matches(c.name, c.iso)) && (
            <Empty>
              No countries match. Clear filters or browse all countries on
              ACAPS.
            </Empty>
          )}
        </>
      )}
      {page === "analysis" && (
        <>
          <Snapshot />
          <p role="status">{filteredReports.length} selected reports</p>
          <ReportCards items={filteredReports} />
          {!filteredReports.length && (
            <Empty>
              No selected reports match these filters. Try clearing filters or
              open the complete ACAPS archive.
            </Empty>
          )}
        </>
      )}
      {page === "topics" && (
        <>
          <p className="catalog-source">
            Official services · links checked {checkedOn}. Downloads and
            subscriptions are handled on ACAPS.
          </p>
          <div className="discovery-grid">
            {resources.map((r) => (
              <article className="discovery-card" key={r.url}>
                <Layers3 size={24} aria-hidden="true" />
                <p className="card-eyebrow">{r.kind}</p>
                <h2>{r.title}</h2>
                <p>{r.text}</p>
                <a href={r.url}>
                  Open official service{" "}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
          <a
            className="catalog-source"
            href="https://www.acaps.org/en/thematics/all-topics"
          >
            Explore all ACAPS topics{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </>
      )}
      {page === "search" && (
        <>
          <p className="catalog-source" role="status">
            {status}
          </p>
          {!query.trim() ? (
            <Empty>
              Enter a country, risk ID, topic or report keyword to search.
            </Empty>
          ) : (
            <>
              <Section title="Countries">
                <div className="search-link-list">
                  {countries
                    .filter((c) => matches(c.name, c.iso))
                    .map((c) => (
                      <a key={c.iso} href={`/countries/${c.iso}`}>
                        {c.name} <ArrowRight size={15} aria-hidden="true" />
                      </a>
                    ))}
                  {!countries.some((c) => matches(c.name, c.iso)) && (
                    <p>No matching countries.</p>
                  )}
                </div>
              </Section>
              <Section title="Connected risks">
                <RiskCards
                  risks={risks.filter((r) =>
                    matches(r.title, r.country, r.risk_id),
                  )}
                />
                {!risks.some((r) => matches(r.title, r.country, r.risk_id)) && (
                  <p>No matching connected risks.</p>
                )}
              </Section>
              <Section title="Analysis">
                <Snapshot />
                <ReportCards
                  items={publications.filter((p) =>
                    matches(p.title, p.country, p.theme),
                  )}
                />
                {!publications.some((p) =>
                  matches(p.title, p.country, p.theme),
                ) && <p>No matching selected reports.</p>}
              </Section>
              <Section title="Topics & data">
                <div className="search-link-list">
                  {resources
                    .filter((r) => matches(r.title, r.text))
                    .map((r) => (
                      <a key={r.url} href={r.url}>
                        {r.title} <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    ))}
                  {!resources.some((r) => matches(r.title, r.text)) && (
                    <p>No matching resources.</p>
                  )}
                </div>
              </Section>
            </>
          )}
        </>
      )}
    </Frame>
  );
}
