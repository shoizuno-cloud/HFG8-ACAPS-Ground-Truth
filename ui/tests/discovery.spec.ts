import { expect } from "@playwright/test";
import { test } from "./workspace-session";
import AxeBuilder from "@axe-core/playwright";

test("country context connects official analysis to the analyst workflow", async ({
  page,
}) => {
  await page.goto("/countries");
  await page
    .getByRole("textbox", { name: "Search countries", exact: true })
    .fill("Chad");
  await expect(
    page.getByRole("status").filter({ hasText: "countries in this directory" }),
  ).toHaveText("1 countries in this directory");
  await page.getByRole("link", { name: "Explore country" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chad");
  await expect(
    page.getByRole("link", { name: "Official Chad analysis" }),
  ).toHaveAttribute("href", "https://www.acaps.org/en/countries/chad");
  await page.getByRole("link", { name: "Review risk" }).click();
  await expect(page).toHaveURL(/\/desk\?risk_id=R1043/);
});
test("analysis filters, empty state, and country deep link work", async ({
  page,
}) => {
  await page.goto("/analysis");
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("Natural hazards");
  await expect(page.getByRole("status")).toHaveText("2 selected reports");
  await page.getByLabel("Published from").fill("2026-10-01");
  await expect(page.getByRole("status")).toHaveText("1 selected reports");
  await expect(
    page.getByRole("link", { name: "Read on ACAPS" }),
  ).toHaveAttribute("href", /afghanistan-community-perspectives/);
  await page
    .getByRole("combobox", { name: "Country", exact: true })
    .selectOption("COL");
  await expect(
    page.getByText("No selected reports match", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("status")).toHaveText("4 selected reports");
  await page.goto("/analysis?country=UKR");
  await expect(page.getByRole("status")).toHaveText("1 selected reports");
  await page
    .getByRole("link", { name: "Country context", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ukraine");
});
test("global search and official resource navigation are accessible", async ({
  page,
}) => {
  await page.goto("/topics");
  await expect(
    page.getByRole("link", { name: "Open official service" }),
  ).toHaveCount(7);
  await page
    .getByRole("textbox", { name: "Search the portal", exact: true })
    .fill("R1043");
  await page
    .getByRole("button", { name: "Search portal", exact: true })
    .click();
  await expect(page).toHaveURL(/\/search\?q=R1043/);
  await expect(page.getByRole("link", { name: "Review risk" })).toBeVisible();
  await page.locator("summary").click();
  await expect(
    page.getByRole("link", { name: "Analyst desk", exact: true }),
  ).toBeVisible();
  await page.locator("summary").click();
  await expect(page.locator("body")).toHaveJSProperty(
    "scrollWidth",
    await page.evaluate(() => innerWidth),
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/analysis");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Analysis library",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath("analysis.png"),
    fullPage: true,
  });
});
