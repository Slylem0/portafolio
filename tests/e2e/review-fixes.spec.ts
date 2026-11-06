import { test, expect, hydrated } from "./fixtures";
import { test as base } from "@playwright/test";

test("omarchy window content scrolls with the mouse wheel", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop windows");
  await page.setViewportSize({ width: 1100, height: 520 }); // short screen: window bodies overflow
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Space");
  await expect(page.getByTestId("omarchy-topbar")).toBeVisible();
  // Find a window whose body overflows, and wheel over it.
  const body = page.locator("[data-testid=omarchy-window] .overflow-auto").filter({ visible: true });
  const n = await body.count();
  let target = -1;
  for (let i = 0; i < n; i++) {
    if (await body.nth(i).evaluate((e) => e.scrollHeight > e.clientHeight + 20)) { target = i; break; }
  }
  if (target < 0) {
    await page.keyboard.press("3"); // Skills workspace: a long list
    await page.waitForTimeout(400);
    for (let i = 0; i < (await body.count()); i++) {
      if (await body.nth(i).evaluate((e) => e.scrollHeight > e.clientHeight + 20)) { target = i; break; }
    }
  }
  expect(target).toBeGreaterThanOrEqual(0);
  const box = (await body.nth(target).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => body.nth(target).evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
});

test("nav link lands with the section title below the navbar", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  if (isMobile) await page.getByRole("button", { name: "MENU" }).click();
  await page.getByRole("link", { name: "04 LOG" }).filter({ visible: true }).click();
  await page.waitForTimeout(2000);
  const header = await page.locator("header").first().evaluate((h) => h.getBoundingClientRect().bottom);
  const top = await page.locator("#log").evaluate((s) => s.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(header - 2);
  expect(top).toBeLessThan(header + 60);
});

test("sessions section never gets shifted sideways by focus", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop track");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  await page.locator("#sessions-title").scrollIntoViewIfNeeded();
  await page.getByTestId("sessions-track").locator(":scope > li").nth(5).getByRole("link").first().focus();
  await page.waitForTimeout(1500);
  expect(await page.locator("#sessions").evaluate((s) => s.scrollLeft)).toBe(0);
});

base("hero name decodes after the intro is dismissed", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // longer than the whole decode
  await page.getByRole("button", { name: /ENTER/ }).click();
  const shown = page.locator("#home [data-scramble]").first();
  await expect.poll(() => shown.textContent(), { timeout: 600, intervals: [30] }).not.toBe("PABLO NICOLÁS");
  await expect(shown).toHaveText("PABLO NICOLÁS", { timeout: 3000 });
});
