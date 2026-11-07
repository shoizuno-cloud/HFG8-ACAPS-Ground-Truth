import { Journey, journey } from "./Journey";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, LockKeyhole } from "lucide-react";
import { Frame } from "./LiveWorkspace";
import { DemoSamples } from "./DemoSamples";
import { checkedOn, publications } from "./acaps-catalog";
import { startDemoSession, workspaceDestination } from "./workspace-session";

function DemoLoginButton({
  children = "Login",
}: {
  children?: React.ReactNode;
}) {
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="public-login"
        onClick={() => {
          try {
            startDemoSession();
            location.assign(
              workspaceDestination(
                new URLSearchParams(location.search).get("next"),
              ),
            );
          } catch {
            setError(
              "Allow session storage for this site to open the demo workspace.",
            );
          }
        }}
      >
        <LockKeyhole size={15} aria-hidden="true" />
        {children}
      </button>
      {error && (
        <p className="public-login-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
function PublicHeader() {
  return (
    <header className="public-header">
      <a className="acaps-wordmark" href="/">
        ACAPS<span>Humanitarian analysis</span>
      </a>
      <nav aria-label="Public navigation">
        <a href="https://www.acaps.org/en/countries">Countries</a>
        <a href="https://www.acaps.org/en/countries/archives">Analysis</a>
        <a href="https://www.acaps.org/en/thematics/all-topics">
          Topics & data
        </a>
        <a href="https://www.acaps.org/en/about-us/who-we-are">About ACAPS</a>
        <a href="/e/demo">Expert card</a>
      </nav>
      <DemoLoginButton />
    </header>
  );
}
function PublicFooter() {
  return (
    <footer className="public-footer">
      <div>
        <a className="acaps-wordmark" href="https://www.acaps.org/en/">
          ACAPS
        </a>
        <p>
          Independent humanitarian analysis.
          <br />
          Explore the evidence. Inform the response.
        </p>
      </div>
      <div>
        <a href="https://www.acaps.org/en/newsletter">
          Newsletter <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <a href="https://api.acaps.org">
          ACAPS API <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        <a href="https://www.acaps.org/en/">
          Official ACAPS website <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}

export function PublicHome() {
  useEffect(() => {
    document.title = "Humanitarian analysis | ACAPS-connected prototype";
  }, []);
  return (
    <>
      <a className="skip-link" href="#public-content">
        Skip to content
      </a>
      <PublicHeader />
      <main id="public-content" className="public-home">
        <section className="public-hero">
          <div className="public-hero-copy">
            <h1>
              See the crisis.
              <br />
              Change the outcome.
            </h1>
            <p>
              Find country analysis, explore humanitarian research and access
              the data that supports informed decisions.
            </p>
            <a
              className="public-primary"
              href="https://www.acaps.org/en/countries"
            >
              Explore country analysis{" "}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
          <a className="public-feature" href={publications[0].url}>
            <img
              src="/acaps-feature.webp"
              alt="Featured image from ACAPS’s Afghanistan analysis"
              fetchPriority="high"
            />
            <div>
              <p>Featured analysis · Afghanistan</p>
              <h2>{publications[0].title}</h2>
              <span>
                Read the report <ArrowUpRight size={18} aria-hidden="true" />
              </span>
            </div>
          </a>
        </section>
        <section className="public-research">
          <div className="public-section-heading">
            <div>
              <p>Humanitarian research</p>
              <h2>Analysis for a clearer picture.</h2>
            </div>
            <a href="https://www.acaps.org/en/countries/archives">
              Explore the publications library{" "}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <p className="public-source">
            Selected publications · links checked {checkedOn}. Visit ACAPS for
            the current archive.
          </p>
          <div className="public-report-grid">
            {publications.slice(1).map((p) => (
              <article key={p.url}>
                <p>{p.country}</p>
                <time dateTime={p.date}>{p.date}</time>
                <h3>
                  <a href={p.url}>{p.title}</a>
                </h3>
                <a className="public-report-link" href={p.url}>
                  Read analysis <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>
        <section className="public-workspace-entry">
          <div>
            <LockKeyhole size={23} aria-hidden="true" />
            <h2>Sealed Signals workspace</h2>
            <p>
              Team access to expert validation, risk metrics and the decision
              ledger.
            </p>
          </div>
          <DemoLoginButton />
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

export function LoginRequired() {
  useEffect(() => {
    location.replace(
      `/?next=${encodeURIComponent(location.pathname + location.search)}`,
    );
  }, []);
  return (
    <main className="login-redirect">
      <p role="status">Opening the public website…</p>
      <a
        href={`/?next=${encodeURIComponent(location.pathname + location.search)}`}
      >
        Return to the public website
      </a>
    </main>
  );
}

export function WorkspaceHome() {
  return (
    <Frame
      title="From a signal to an accountable decision"
      subtitle="One question. Independent judgement. A record you can check."
    >
      <Journey />
      <section className="journey-intro">
        <div>
          <span>Chad · R1043</span>
          <h2>Displacement from Sudan to Chad</h2>
          <p>A rise in severity raises a question for the expert panel.</p>
          <a className="button-link primary" href="/alerts">
            Start with the alert <ArrowRight size={17} />
          </a>
        </div>
        <div className="intro-change">
          <span>INFORM Severity · March → April 2026</span>
          <strong>
            6.1 <ArrowRight size={28} /> 6.9
          </strong>
          <small>+0.8 points · largest deterioration among 123 crises</small>
        </div>
      </section>
      <div className="journey-overview">
        {journey.map((step, i) => (
          <a href={step.href} key={step.href}>
            <span className="journey-number">{i + 1}</span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        ))}
      </div>
      <details className="workspace-support">
        <summary>Workspace data and supporting tools</summary>
        <DemoSamples />
        <div className="support-links">
          <a href="/radar">Risk Radar & metrics</a>
          <a href="/stage">Stage & jury access</a>
          <a href="/calibration">Calibration report</a>
          <a href="/committee">Expert committee</a>
          <a href="/apply">Expert application</a>
        </div>
      </details>
    </Frame>
  );
}
