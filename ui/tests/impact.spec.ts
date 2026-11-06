import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

async function goToChapter(page: Page, id: string) {
  await page
    .locator(`#${id}`)
    .evaluate((node) =>
      window.scrollTo({
        top: node.getBoundingClientRect().top + scrollY + 4,
        behavior: "instant",
      }),
    );
}

test("private contribution recognises forecasts without inventing human outcomes", async ({
  page,
}, info) => {
  await page.goto("/me/demo/impact");
  await expect(
    page.getByRole("region", { name: "Your verified contribution" }),
  ).toBeVisible();
  await expect(page.locator(".contribution-number")).toHaveText(
    "5resolved forecasts",
  );
  await expect(page.locator(".early-count")).toHaveText("3");
  await expect(page.getByText("Not yet measured", { exact: true })).toHaveCount(
    2,
  );
  await expect(page.getByText("quiet-heron")).toHaveCount(0);
  await expect(page.getByText("Private to you", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/impact-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "View your calibration" }).click();
  await expect(
    page.getByRole("heading", { name: "Your calibration", exact: true }),
  ).toBeVisible();
});

test("sealed expert can open their own contribution report", async ({
  page,
}) => {
  await page.goto("/e/demo");
  await page.getByRole("button", { name: "Seal my answer" }).click();
  await page
    .getByRole("link", { name: "View your private contribution" })
    .click();
  await expect(page).toHaveURL(/\/me\/demo\/impact$/);
  await expect(
    page.getByText("historical fixture, not linked to your new demo answer", {
      exact: false,
    }),
  ).toBeVisible();
});

test("one real 3D world spans teamwork, outcomes and thanks, with reversible motion", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/me/demo/impact");
  const story = page.getByRole("region", {
      name: "Your verified contribution",
    }),
    canvas = page.locator(".community-canvas");
  await expect(story).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20000,
  });
  const original = await canvas.elementHandle();
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-triangles")))
    .toBeGreaterThan(1000);
  await page.screenshot({
    path: `test-results/community-opening-${info.project.name}.png`,
  });
  await goToChapter(page, "joining-perspectives");
  await expect(story).toHaveAttribute("data-chapter", "3");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-progress")))
    .toBeGreaterThan(2.95);
  await page.screenshot({
    path: `test-results/community-team-${info.project.name}.png`,
  });
  await goToChapter(page, "human-outcomes");
  await expect(story).toHaveAttribute("data-chapter", "4");
  await expect(page.getByText("Not yet measured", { exact: true })).toHaveCount(
    2,
  );
  await expect(page.locator(".community-canvas")).toHaveCount(1);
  expect(
    await canvas.evaluate((node, first) => node.isSameNode(first), original),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/community-outcomes-${info.project.name}.png`,
  });
  await goToChapter(page, "seeing-earlier");
  await expect(story).toHaveAttribute("data-chapter", "2");
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-progress")))
    .toBeLessThan(2.05);
  await page.getByRole("button", { name: "Pause motion" }).click();
  await expect(story).toHaveAttribute("data-motion", "paused");
  const paused = await canvas.getAttribute("data-progress");
  await goToChapter(page, "thank-you");
  await expect(story).toHaveAttribute("data-chapter", "5");
  await expect(canvas).toHaveAttribute("data-progress", paused!);
  await page.getByRole("button", { name: "Resume motion" }).click();
  await expect
    .poll(async () => Number(await canvas.getAttribute("data-progress")))
    .toBeGreaterThan(4.95);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("reduced motion uses a static community poster and ordinary document flow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/me/demo/impact");
  const story = page.getByRole("region", {
    name: "Your verified contribution",
  });
  await expect(story).toHaveAttribute("data-motion", "reduced");
  await expect(story).toHaveAttribute("data-renderer", "poster");
  await expect(page.getByRole("button", { name: "Pause motion" })).toHaveCount(
    0,
  );
  expect(
    await page
      .locator(".community-world")
      .evaluate((node) => getComputedStyle(node).position),
  ).toBe("relative");
  await expect(page.getByText("Not yet measured", { exact: true })).toHaveCount(
    2,
  );
  await expect(page.locator(".community-poster")).toBeVisible();
  await page.getByRole("link", { name: "View your calibration" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/calibration$/);
});

test("context loss preserves the poster, metrics and final action", async ({
  page,
}) => {
  await page.goto("/me/demo/impact");
  const story = page.getByRole("region", {
    name: "Your verified contribution",
  });
  await expect(story).toHaveAttribute("data-renderer", "webgl", {
    timeout: 20000,
  });
  await page
    .locator(".community-canvas")
    .evaluate((node) =>
      node.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(story).toHaveAttribute("data-renderer", "fallback");
  await expect(page.locator(".community-poster")).toBeVisible();
  await expect(page.locator(".contribution-number")).toHaveText(
    "5resolved forecasts",
  );
  await expect(
    page.getByRole("link", { name: "View your calibration" }),
  ).toBeAttached();
});
