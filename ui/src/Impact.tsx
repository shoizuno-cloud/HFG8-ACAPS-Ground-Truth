import { ContributionStory } from "./ContributionStory";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { mock } from "./api";
import { endpoint, type Calibration } from "./service";
import "./impact.css";

export function Impact({ token }: { token: string }) {
  const [report, setReport] = useState<Calibration | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const work = mock
      ? import("../../fixtures/GET_me_calibration.json").then((m) => m.default)
      : endpoint.calibration(token);
    work
      .then((value) => {
        if (active) setReport(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    document.title = "Your contribution | Sealed Signals";
    return () => {
      active = false;
    };
  }, [token, reload]);
  return (
    <>
      <a className="skip-link" href="#impact-content">
        Skip to your contribution
      </a>
      <header className="site-header">
        <a className="brand" href="/">
          <span className="brand-mark">
            <LockKeyhole size={19} />
          </span>
          Sealed Signals
        </a>
        <span className="private-label">
          <LockKeyhole size={15} />
          Private to you
        </span>
      </header>
      <main id="impact-content" className="impact-page">
        {loading ? (
          <div className="impact-state" role="status">
            Opening your contribution story…
          </div>
        ) : error ? (
          <section className="impact-state">
            <h1>Your report is unavailable</h1>
            <p role="alert" className="error-box">
              {error}
            </p>
            <button onClick={() => setReload((value) => value + 1)}>
              Try again
            </button>
          </section>
        ) : (
          report && <ContributionStory report={report} token={token} />
        )}
        <footer className="impact-page-footer">
          Synthetic experts and answers. Your private contribution is never
          displayed on the public ledger.
        </footer>
      </main>
    </>
  );
}
