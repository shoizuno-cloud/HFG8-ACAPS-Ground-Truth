import { useState } from "react";
import { VerificationTrail } from "./VerificationTrail";
import ledger from "../../fixtures/GET_ledger.json";
import { HonestyBox } from "./V2Panels";
import { Section, CopyButton } from "./LiveWorkspace";
import { date, percent } from "./desk-model";
export function HistoricalLedger({ query }: { query: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  return (
    <>
      {ledger.entries
        .filter(
          (e) =>
            e.outcome &&
            e.honesty.n >= 5 &&
            e.risk_id.toLowerCase().includes(query.toLowerCase()),
        )
        .map((e) => (
          <Section key={e.risk_id} title={`Resolved history / ${e.risk_id}`}>
            <div className="ledger-stats">
              <div>
                <span>Group probability</span>
                <strong>{percent(e.group_probability)}</strong>
              </div>
              <div>
                <span>ACAPS probability</span>
                <strong>{e.acaps_probability}</strong>
              </div>
              <div>
                <span>Outcome</span>
                <strong className="small-stat">
                  {e.outcome?.replaceAll("_", " ")}
                </strong>
                <small>{e.resolved_at && date(e.resolved_at)}</small>
              </div>
            </div>
            <HonestyBox
              value={e.honesty}
              context={`${e.risk_id} / ${e.pulse_id}`}
            />
            <VerificationTrail
              entry={e}
              fixture
              receipt={
                checked[e.verify_hash]
                  ? { valid: true, anchor: null }
                  : undefined
              }
            />
            <dl className="ledger-details">
              <div>
                <dt>Sealed at</dt>
                <dd>{date(e.sealed_at)}</dd>
              </div>
              <div>
                <dt>Verification hash</dt>
                <dd>
                  <code>{e.verify_hash}</code>
                </dd>
              </div>
            </dl>
            <div className="panel-actions">
              <button
                className={checked[e.verify_hash] ? "verified-button" : ""}
                onClick={() =>
                  setChecked((v) => ({ ...v, [e.verify_hash]: true }))
                }
              >
                {checked[e.verify_hash]
                  ? "Historical fixture matched"
                  : "Check historical receipt"}
              </button>
              <CopyButton value={e.verify_hash} label="Copy historical hash" />
            </div>
            {checked[e.verify_hash] && (
              <p role="status" className="panel-caption">
                Historical fixture match only. No blockchain or timestamp
                anchor.
              </p>
            )}
          </Section>
        ))}
    </>
  );
}
