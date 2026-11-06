import { test, expect, type Page } from "./fixtures";

test.beforeEach(async ({ page, isMobile }) => {
  test.skip(isMobile, "the horizontal track is desktop-only");
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("lang");
    } catch {
      /* ignore */
    }
  });
});

const transformOf = (page: Page) =>
  page.getByTestId("sessions-track").evaluate((n) => getComputedStyle(n).transform);

async function reachTrack(page: Page) {
  await page.locator("#sessions-title").scrollIntoViewIfNeeded();
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(1200);
}

test("track moves while scrolling", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await reachTrack(page);
  const counter = page.getByTestId("sessions-counter");
  const before = await transformOf(page);
  const label = await counter.textContent();
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(1500);
  expect(await transformOf(page)).not.toBe(before);
  await expect(counter).not.toHaveText(label ?? "");
  await expect(counter).toHaveText(/#0\d \/ 07/);
});

test("tab to last poster brings it into view", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await reachTrack(page);
  const posters = page.getByTestId("sessions-track").locator(":scope > li");
  const last = posters.last();
  await last.getByRole("link").first().focus();
  await page.waitForTimeout(1500);
  await expect(last).toBeInViewport({ ratio: 0.6 });
});

test("lang switch keeps sessions track scrollable", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /LANG/ }).filter({ visible: true }).first().click();
  await page.waitForTimeout(400);
  await reachTrack(page);
  const before = await transformOf(page);
  await page.mouse.wheel(0, 1500);
  await page.waitForTimeout(1500);
  expect(await transformOf(page)).not.toBe(before);
});
