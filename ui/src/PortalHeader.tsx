import { LockKeyhole, Search, ArrowUpRight } from "lucide-react";

export function PortalHeader() {
  const path = location.pathname;
  return (
    <header className="site-header workspace-header portal-header">
      <div className="portal-topline">
        <a className="brand" href="/">
          <span className="brand-mark">
            <LockKeyhole size={19} />
          </span>
          Sealed Signals
        </a>
        <span className="portal-purpose">
          Humanitarian analysis · Expert validation
        </span>
        <a className="official-link" href="https://www.acaps.org/en/">
          ACAPS website <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
      <div className="portal-navigation">
        <nav aria-label="Main navigation">
          {[
            ["/", "Radar"],
            ["/countries", "Countries"],
            ["/analysis", "Analysis"],
            ["/topics", "Topics & data"],
            ["/ledger", "Public ledger"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              aria-current={
                path === href ||
                (href === "/countries" && path.startsWith("/countries/"))
                  ? "page"
                  : undefined
              }
            >
              {label}
            </a>
          ))}
          <details className="workspace-menu">
            <summary>Workspace</summary>
            <div>
              {[
                ["/desk", "Analyst desk"],
                ["/committee", "Committee"],
                ["/stage", "Jury access"],
                ["/apply", "Apply as an expert"],
              ].map(([href, label]) => (
                <a
                  href={href}
                  key={href}
                  aria-current={path === href ? "page" : undefined}
                >
                  {label}
                </a>
              ))}
            </div>
          </details>
        </nav>
        <form action="/search" role="search" className="portal-search">
          <label className="sr-only" htmlFor="portal-query">
            Search the portal
          </label>
          <input
            id="portal-query"
            name="q"
            placeholder="Search countries, analysis…"
            defaultValue={new URLSearchParams(location.search).get("q") || ""}
          />
          <button aria-label="Search portal">
            <Search size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </header>
  );
}
