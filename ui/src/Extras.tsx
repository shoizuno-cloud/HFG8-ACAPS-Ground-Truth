import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { mock } from "./api";
import { endpoint, type Calibration as Report } from "./service";
import { CopyButton, Frame, Section } from "./LiveWorkspace";
import { en } from "./locales/en";

export function Stage() {
  const [invitation, setInvitation] = useState(
    mock ? `${location.origin}/e/demo` : "",
  );
  const [qr, setQr] = useState(mock ? invitation : "");
  const [error, setError] = useState("");
  const [presentation, setPresentation] = useState(false);
  return (
    <Frame
      title="Jury access"
      subtitle="One invitation. One focused expert card."
    >
      <div className="stage-grid">
        <Section title="Open the expert card">
          <form
            className="stage-form"
            onSubmit={(e) => {
              e.preventDefault();
              setError("");
              try {
                const url = new URL(invitation);
                if (
                  !["http:", "https:"].includes(url.protocol) ||
                  !/^\/e\/[^/]+\/?$/.test(url.pathname) ||
                  url.username ||
                  url.password ||
                  url.search ||
                  url.hash
                )
                  throw new Error(
                    "Use a complete http or https invitation URL with the path /e/token.",
                  );
                if (!mock && /\/(demo|round2|empty)\/?$/.test(url.pathname))
                  throw new Error(
                    "Use a backend-issued expert invitation for API mode.",
                  );
                setQr(url.href);
              } catch (e) {
                setQr("");
                setError(
                  (e as Error).message || "Enter a valid invitation URL.",
                );
              }
            }}
          >
            <label htmlFor="invitation">{en.stage.invitation}</label>
            <input
              id="invitation"
              type="url"
              value={invitation}
              onChange={(e) => setInvitation(e.target.value)}
              placeholder="http://venue-host:5173/e/invitation-token"
              aria-describedby="invitation-help"
            />
            <p id="invitation-help" className="help">
              {mock
                ? "Demo invitation only: answers return fixture receipts."
                : "Paste a backend-issued invitation. Each expert needs their own invitation; this page does not issue credentials."}{" "}
              Use your LAN hostname or HTTPS deployment for phones. A 127.0.0.1
              link works only on this computer.
            </p>
            <button className="primary" type="submit">
              Generate QR
            </button>
          </form>
          {error && (
            <p role="alert" className="error-box">
              {error}
            </p>
          )}
          <div className="stage-instructions">
            <h3>Before inviting the panel</h3>
            <ol>
              <li>
                Connect the phone to the same Wi-Fi, or use a reachable HTTPS
                deployment.
              </li>
              <li>
                Replace the loopback hostname in the invitation with your
                machine’s LAN address.
              </li>
              <li>
                Test opening and sealing on two real phones before presenting.
              </li>
              <li>
                Keep invitations off public ledgers. They grant access to an
                expert card.
              </li>
            </ol>
            <a href="/desk">
              Open analyst desk <ArrowRight size={15} />
            </a>
          </div>
        </Section>
        <Section title="Scan to contribute">
          {qr ? (
            <div
              className={presentation ? "qr-panel presentation-qr" : "qr-panel"}
            >
              <QRCodeSVG
                value={qr}
                size={256}
                marginSize={4}
                level="M"
                role="img"
                aria-label="QR code for the expert invitation shown below"
              />
              <p>
                {mock
                  ? "Synthetic panel demonstration"
                  : "Private expert invitation"}
              </p>
              <a
                className="invitation-link"
                href={qr}
                target="_blank"
                rel="noreferrer"
              >
                {qr}
              </a>
              <CopyButton value={qr} label="Copy invitation" />
              <button
                aria-pressed={presentation}
                onClick={() => setPresentation((v) => !v)}
              >
                {presentation ? "Standard QR size" : "Enlarge QR"}
              </button>
            </div>
          ) : (
            <div className="empty-panel">
              <LockKeyhole size={28} />
              <p>Add a reachable invitation URL to generate a QR code.</p>
            </div>
          )}
        </Section>
      </div>
    </Frame>
  );
}
export function Calibration({ token }: { token: string }) {
  const [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true);
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
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [token, reload]);
  return (
    <Frame
      title="Your calibration"
      subtitle="A private view of how your forecasts resolve."
    >
      <a
        className="button-link"
        href={`/me/${encodeURIComponent(token)}/impact`}
      >
        View your contribution
      </a>
      <div className="mode-banner">
        <LockKeyhole size={16} />
        {mock
          ? "Synthetic calibration fixture · not linked to your demo answer"
          : "Private report · accessible through your invitation only"}
      </div>
      {busy ? (
        <p className="workspace-message" role="status">
          Loading calibration…
        </p>
      ) : error ? (
        <Section title="Report unavailable">
          <p role="alert">{error}</p>
          <button onClick={() => setReload((v) => v + 1)}>Try again</button>
        </Section>
      ) : (
        report && (
          <Section
            title={
              report.n_resolved
                ? `Track record for ${report.pseudonym}`
                : "No resolved forecasts yet"
            }
          >
            {report.n_resolved ? (
              <>
                <div className="ledger-stats">
                  <div>
                    <span>Resolved forecasts</span>
                    <strong>{report.n_resolved}</strong>
                  </div>
                  <div>
                    <span>Mean Brier score</span>
                    <strong>{report.mean_brier.toFixed(2)}</strong>
                    <small>Lower is better · 0 is perfect</small>
                  </div>
                  <div>
                    <span>Reliability weight</span>
                    <strong>{report.reliability_weight.toFixed(2)}×</strong>
                  </div>
                </div>
                <p>{report.note}</p>
                <p className="panel-caption">
                  Overconfidence index:{" "}
                  {report.overconfidence === undefined
                    ? "Not supplied by the API"
                    : report.overconfidence.toFixed(2)}
                  . A full calibration curve requires forecast-level
                  observations.
                </p>
                <div className="calibration-scale">
                  <span
                    style={{
                      left: `${Math.max(0, Math.min(1, report.mean_brier)) * 100}%`,
                    }}
                    aria-hidden="true"
                  />
                </div>
                <div className="scale">
                  <span>0 · Accurate</span>
                  <span>1 · Incorrect with certainty</span>
                </div>
                <p className="panel-caption">
                  Brier score measures the squared difference between a
                  probability and the observed outcome. Reliability weights help
                  combine future forecasts. This report is not published to the
                  public ledger.
                </p>
              </>
            ) : (
              <p>
                Your calibration report will appear after your first risk
                resolves.
              </p>
            )}
          </Section>
        )
      )}
    </Frame>
  );
}
