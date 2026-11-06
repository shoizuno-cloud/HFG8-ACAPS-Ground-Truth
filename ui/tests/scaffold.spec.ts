import { expect, test } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  const response = await request.get("/api/health");
  expect(
    response.ok(),
    "Start the local scaffold API on port 18000 before this suite.",
  ).toBe(true);
  expect((await response.json()).status).toBe("ok");
});

test("actual scaffold API flows through the proxy into Radar and desk", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByText("Source: CSV fallback", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Review risk" }).click();
  await expect(
    page.getByText("API mode · Events:", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview matched panel" }).click();
  await expect(
    page.getByText("Composition check: passes", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ask panel" }).click();
  await expect(
    page.getByText("P-0001 · Round 1 · 0 sealed answers"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reveal round", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Pulse ID").fill("P-0001");
  await page.getByRole("button", { name: "Open pulse" }).click();
  await expect(page.getByRole("alert")).toContainText("not available");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results-scaffold/desk-${info.project.name}.png`,
    fullPage: true,
  });
});

test("actual scaffold card stays blind, seals synthetic input and opens private calibration", async ({
  page,
}) => {
  await page.goto("/e/scaffold-synthetic");
  await expect(page.getByText("Independent first round")).toBeVisible();
  await expect(
    page.getByText("ACAPS rates this High.", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "I read it" }).click();
  await page.getByRole("button", { name: "Seal my answer" }).click();
  await expect(
    page.getByRole("heading", { name: "Sealed. You’ll hear how it resolves." }),
  ).toBeVisible();
  await expect(
    page.getByText("API seal receipt", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "View your private calibration" })
    .click();
  await expect(page.getByText("0.12", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View your contribution" }),
  ).toHaveCount(0);
});

test("actual scaffold ledger has public honesty while unavailable approvals fail clearly", async ({
  page,
}, info) => {
  await page.goto("/ledger");
  await expect(
    page.getByRole("region", { name: "Public honesty box" }),
  ).toHaveCount(2);
  await expect(page.getByText("quiet-heron")).toHaveCount(0);
  await page.getByRole("button", { name: "Verify entry" }).first().click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "API reports a valid ledger entry." }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results-scaffold/ledger-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto("/committee?expert_id=X-0009");
  await page.getByRole("button", { name: "Record my approval" }).click();
  await expect(page.getByRole("alert")).toContainText("not available");
  await expect(
    page.getByRole("heading", { name: "Expert approved" }),
  ).toHaveCount(0);
});
