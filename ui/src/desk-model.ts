import risk from "../../fixtures/GET_risks_R1043.json";
import pulse from "../../fixtures/POST_pulses_response.json";
import result from "../../fixtures/GET_pulses_result.json";
import draft from "../../fixtures/POST_pulses_draft_response.json";
import board from "../../fixtures/GET_analyst_board.json";
import ledger from "../../fixtures/GET_ledger.json";
import verification from "../../fixtures/POST_ledger_verify_response.json";

export { risk, pulse, result, draft, board };
export type Decision = {
  action: "accept" | "edit" | "reject";
  probability: string;
  note: string;
  at: string;
};
export const storageKey = "sealed-signals-demo-decision-v1";
export function readDecision(): Decision | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    return value &&
      ["accept", "edit", "reject"].includes(value.action) &&
      typeof value.note === "string" &&
      typeof value.at === "string" &&
      ["Very Low", "Low", "Medium", "High", "Very High"].includes(
        value.probability,
      )
      ? value
      : null;
  } catch {
    return null;
  }
}
// V2 carries the public contribution count inside the honesty box.
export const eligibleEntries = ledger.entries.filter(
  (entry) => entry.honesty.n >= Math.max(5, ledger.k_min),
);
export function verifyFixture(hash: string) {
  const entry = eligibleEntries.find((item) => item.verify_hash === hash);
  return entry
    ? { ...verification, sealed_at: entry.sealed_at }
    : { ...verification, valid: false };
}
export const percent = (v: number) => `${Math.round(v * 100)}%`;
export const date = (v: string) =>
  `${new Date(v).toLocaleString("en-GB", { timeZone: "UTC" })} UTC`;
