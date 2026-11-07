import { expect, type Page } from "@playwright/test";
import { test } from "./workspace-session";
import AxeBuilder from "@axe-core/playwright";
import risks from "../../fixtures/GET_risks.json" with { type: "json" };
import pulse from "../../fixtures/POST_pulses_response.json" with { type: "json" };
import result from "../../fixtures/GET_pulses_result.json" with { type: "json" };
import draft from "../../fixtures/POST_pulses_draft_response.json" with { type: "json" };
import board from "../../fixtures/GET_analyst_board.json" with { type: "json" };
import ledger from "../../fixtures/GET_ledger.json" with { type: "json" };
import calibration from "../../fixtures/GET_me_calibration.json" with { type: "json" };
import card from "../../fixtures/GET_e_token.json" with { type: "json" };
import seal from "../../fixtures/POST_e_token_answer_response.json" with { type: "json" };
import integrity from "../../fixtures/GET_integrity_pulse.json" with { type: "json" };
import radar from "../../fixtures/GET_radar_status.json" with { type: "json" };
import matched from "../../fixtures/GET_panels_match.json" with { type: "json" };

test("discovery uses connected risks and retains official links when the service fails", async ({
  page,
}) => {
  await contractApi(page);
  await page.goto("/countries/TCD");
  await expect(page.getByRole("link", { name: "Review risk" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "Connected risk service",
  );
  await page.route("http://127.0.0.1:18000/risks", (route) => route.abort());
  await page.reload();
  await expect(page.getByRole("status")).toContainText(
    "Risk service unavailable",
  );
  await expect(page.getByRole("link", { name: "Review risk" })).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Official Chad analysis" }),
  ).toHaveAttribute("href", "https://www.acaps.org/en/countries/chad");
  await page.goto("/analysis");
  await expect(page.getByRole("link", { name: "Read on ACAPS" })).toHaveCount(
    4,
  );
});

async function contractApi(page: Page) {
  const writes: { path: string; body: any }[] = [];
  await page.route("http://127.0.0.1:18000/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    const body = request.method() === "POST" ? request.postDataJSON() : null;
    if (body) writes.push({ path, body });
    const respond = (json: unknown, status = 200) =>
      route.fulfill({
        status,
        json,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    if (request.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "content-type",
          "Access-Control-Allow-Methods": "GET, POST",
        },
      });
    if (path === "/events")
      return route.fulfill({
        contentType: "text/event-stream",
        body: 'event: answer_sealed\ndata: {"pulse_id":"P-0001","n_answers":8}\n\n',
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    if (path === "/radar/status") return respond(radar);
    if (path.startsWith("/integrity/")) return respond(integrity);
    if (path === "/panels/match") return respond(matched);
    if (path === "/experts/apply")
      return respond({ expert_id: "X-0009", status: "applied" });
    if (path === "/experts/X-0009/approve")
      return respond({
        expert_id: "X-0009",
        status: "applied",
        approved_by: ["admin-a"],
      });
    if (path === "/risks") return respond(risks);
    if (path.endsWith("/contract"))
      return respond({
        ...body,
        risk_id: "R1043",
        frozen_at: "2026-11-06T09:00:00Z",
      });
    if (path.endsWith("/outcome-report"))
      return respond({
        pulse_id: "P-0001",
        group_mean: 0.69,
        outcome: "materialised",
        analyst_decision_summary: "Retained High.",
      });
    if (path === "/analyst/board") return respond(board);
    if (path === "/pulses" && body) return respond(pulse, 201);
    if (path === "/pulses/P-0001") return respond({ ...pulse, n_answers: 8 });
    if (path.endsWith("/reveal") || path.endsWith("/result"))
      return respond(result);
    if (path.endsWith("/draft"))
      return respond({
        ...draft,
        claims: [
          {
            claim_id: "c1",
            text: "The equal-weight panel mean is 69%.",
            evidence_kind: "panel",
            evidence_ref: "P-0001:mean",
            numbers: [0.69],
          },
        ],
        skeptic: [
          {
            claim_id: "c1",
            verdict: "supported",
            checks: ["Eight contributions confirmed."],
          },
        ],
        judge: {
          coverage: 1,
          numbers_match: 1,
          overall: 1,
          flagged_claim_ids: [],
        },
      });
    if (path.endsWith("/decision"))
      return respond({
        ...draft,
        status:
          body.action === "edit"
            ? "edited"
            : body.action === "accept"
              ? "accepted"
              : "rejected",
        proposed_probability: body.edited_probability || "High",
        note: body.note,
        decided_at: "2026-11-06T12:00:00Z",
      });
    if (path === "/ledger")
      return respond({
        ...ledger,
        entries: [
          { ...ledger.entries[0], n: 8 },
          {
            ...ledger.entries[1],
            n: 4,
            honesty: { ...ledger.entries[1].honesty, n: 4 },
          },
        ],
      });
    if (path === "/ledger/verify")
      return respond({
        valid: false,
        sealed_at: ledger.entries[0].sealed_at,
        anchor: null,
      });
    if (path.endsWith("/resolve"))
      return respond({ scores_written: 8, weights_updated: 8 });
    if (path.endsWith("/calibration")) return respond(calibration);
    if (path.startsWith("/e/") && path.endsWith("/answer"))
      return respond(seal, 201);
    if (path.startsWith("/e/")) return respond(card);
    if (path === "/pulses/doorbell/run")
      return respond({ shifts: [{}], pulses_fired: ["P-0001"] });
    return respond({ detail: "Not available" }, 404);
  });
  return writes;
}
test("API pulse, SSE, reveal, checked draft, decision and resolution", async ({
  page,
}, info) => {
  const writes = await contractApi(page);
  await page.goto("/desk");
  await page.getByRole("button", { name: "Ask panel" }).click();
  await expect(
    page.getByText("P-0001 · Round 1 · 8 sealed answers", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reveal round", exact: true }).click();
  await expect(page.getByText("69%", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Prepare draft" }).click();
  await expect(page.getByText("c1 · supported", { exact: true })).toBeVisible();
  await page
    .getByLabel("Decision note")
    .fill("Reviewed panel and indicator evidence.");
  await page
    .getByLabel("Decision to inform", { exact: true })
    .fill("Pre-position shelter");
  await page
    .getByLabel("Decision owner", { exact: true })
    .fill("NGO preparedness lead");
  await page
    .getByLabel("Decision needed by", { exact: true })
    .fill("2026-11-20");
  await page.getByRole("button", { name: "Edit probability" }).click();
  await page.getByLabel("Edited probability").selectOption("Very High");
  await page.getByRole("button", { name: "Save edited decision" }).click();
  await expect(
    page.getByRole("heading", { name: "Decision log" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Resolve risk and score forecasts" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Freeze question contract" }).click();
  await expect(
    page.getByText("Contract frozen and confirmed by the API."),
  ).toBeVisible();
  await page.getByLabel("Resolution date (UTC)").fill("2026-11-05");
  await page.getByLabel("I confirm this is an observed outcome.").check();
  await page
    .getByRole("button", { name: "Resolve risk and score forecasts" })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "8 scores written" }),
  ).toBeVisible();
  expect(writes.find((w) => w.path === "/pulses")?.body).toEqual({
    risk_id: "R1043",
    reason: "analyst",
  });
  expect(writes.find((w) => w.path.endsWith("/decision"))?.body).toMatchObject({
    action: "edit",
    edited_probability: "Very High",
  });
  expect(writes.find((w) => w.path.endsWith("/resolve"))?.body).toEqual({
    outcome: "materialised",
    resolved_at: "2026-11-05T00:00:00Z",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/live-desk-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("ledger suppresses small groups and reports failed verification; calibration stays private", async ({
  page,
}, info) => {
  await contractApi(page);
  await page.goto("/ledger");
  await expect(page.getByText("8 contributions")).toBeVisible();
  await expect(page.getByRole("heading", { name: /R0987/ })).toHaveCount(0);
  await expect(page.getByText("quiet-heron")).toHaveCount(0);
  await page.getByRole("button", { name: "Verify entry" }).click();
  await expect(page.getByRole("status").first()).toContainText("hash mismatch");
  await page.goto("/me/private-invitation/calibration");
  await page
    .getByRole("button", { name: "View my private calibration" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Resolved forecast calibration" }),
  ).toBeVisible();
  await expect(page.getByText("0.12", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/calibration-${info.project.name}.png`,
    fullPage: true,
  });
});
test("network errors retry without fixture fallback and expert answers use selected values", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:18000/**", (route) =>
    route.abort("connectionrefused"),
  );
  await page.goto("/desk");
  await expect(page.getByRole("alert")).toContainText("Cannot reach the API");
  await expect(
    page.getByRole("button", { name: "Load synthetic answers" }),
  ).toHaveCount(0);
  await page.unrouteAll();
  const writes = await contractApi(page);
  await page.getByRole("button", { name: "Refresh risks" }).click();
  await expect(page.getByRole("button", { name: "Ask panel" })).toBeEnabled();
  await page.goto("/e/private-invitation");
  await page
    .getByRole("button", { name: "Pseudonym Nickname to peers" })
    .click();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Submitted. You’ll get the group outcome.",
    }),
  ).toBeVisible();
  expect(writes.find((w) => w.path.endsWith("/answer"))?.body).toMatchObject({
    mask: "pseudonym",
    probability: 0.5,
    panel_share_yes: 0.5,
    changed_mind: false,
    stance: "estimate",
    round: 1,
    confidence: 3,
    source_tag: null,
  });
  await expect(page.getByText("Fixture receipt · not a live seal")).toHaveCount(
    0,
  );
});

test("v2 application and committee requests do not invent approval or credentials", async ({
  page,
}) => {
  const writes = await contractApi(page);
  await page.goto("/apply");
  await page
    .getByLabel("This is a synthetic expert application.", { exact: false })
    .check();
  await page
    .getByRole("button", { name: "Apply for committee review" })
    .click();
  await page
    .getByRole("link", { name: "Review synthetic application" })
    .click();
  await page.getByRole("button", { name: "Record my approval" }).click();
  await expect(
    page.getByRole("heading", { name: "Awaiting second approval" }),
  ).toBeVisible();
  expect(writes.find((w) => w.path === "/experts/apply")?.body).toMatchObject({
    geo_tags: ["TCD", "SDN"],
    theme_tags: ["conflict"],
    channel: "email",
  });
  expect(
    writes.find((w) => w.path === "/experts/X-0009/approve")?.body,
  ).toEqual({});
});

test("uncorroborated API claims remain to verify and block publication", async ({
  page,
}) => {
  await contractApi(page);
  await page.route("**/pulses/P-0001/draft", (route) =>
    route.fulfill({
      json: draft,
      headers: { "Access-Control-Allow-Origin": "*" },
    }),
  );
  await page.goto("/desk");
  await page.getByRole("button", { name: "Ask panel" }).click();
  await expect(
    page.getByRole("button", { name: "Reveal round", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Reveal round", exact: true }).click();
  await page.getByRole("button", { name: "Prepare draft" }).click();
  await expect(
    page.getByRole("heading", { name: "To verify before inclusion" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept draft" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Reject draft" }),
  ).toBeEnabled();
});

test("a result for another pulse is not revealed on the selected desk", async ({
  page,
}) => {
  await contractApi(page);
  await page.route("**/pulses/P-0001/reveal", (route) =>
    route.fulfill({
      json: { ...result, pulse_id: "P-another" },
      headers: { "Access-Control-Allow-Origin": "*" },
    }),
  );
  await page.goto("/desk");
  await page.getByRole("button", { name: "Ask panel" }).click();
  await page.getByRole("button", { name: "Reveal round", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("different pulse");
  await expect(
    page.getByRole("button", { name: "Prepare draft" }),
  ).toBeDisabled();
  await expect(
    page.getByText("Equal-weight mean", { exact: true }),
  ).toHaveCount(0);
});
