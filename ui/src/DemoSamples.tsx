import { useState } from "react";
import { mock } from "./api";
import {
  loadSampleWorkspace,
  clearSampleWorkspace,
  startSampleRound,
  sampleDataEnabled,
  sampleApplications,
} from "./demo-data";

export function DemoSamples() {
  const [error, setError] = useState("");
  if (!mock) return null;
  const enabled = sampleDataEnabled();
  function run(action: () => void) {
    try {
      action();
      location.reload();
    } catch {
      setError(
        "Sample data could not be saved in this tab. Allow session storage and retry.",
      );
    }
  }
  return (
    <section className="demo-samples" aria-labelledby="demo-samples-heading">
      <div>
        <h2 id="demo-samples-heading">Sample workspace</h2>
        <p>
          {enabled
            ? `6 risk records · 8 panel estimates · 5 resolved forecasts · ${sampleApplications().length} synthetic applications`
            : "Load a populated example across the Radar, desk, ledger, committee and calibration pages."}
        </p>
        <p className="panel-caption">
          All expert forecasts, decisions and dates are synthetic. Risk titles
          and historical outcomes use the repository export. Data stays in this
          browser tab.
        </p>
        <p className="panel-caption">
          Reload resets sample decisions and approvals. Clear returns to the
          original fixture demo.
        </p>
      </div>
      <div className="panel-actions">
        <button onClick={() => run(loadSampleWorkspace)}>
          {enabled ? "Reload sample workspace" : "Load sample workspace"}
        </button>
        {enabled && (
          <>
            <button onClick={() => run(startSampleRound)}>
              Start a fresh round
            </button>
            <button onClick={() => run(clearSampleWorkspace)}>
              Clear sample data
            </button>
          </>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
