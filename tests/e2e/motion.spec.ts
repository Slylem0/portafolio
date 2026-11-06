import { test, expect } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("lang");
    } catch {
      /* ignore */
    }
  });
});

test("no horizontal overflow", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile layout check");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  for (const id of ["about", "skills", "sessions", "log", "footer"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
  }
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  expect(sw).toBeLessThanOrEqual(iw);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("reduced motion shows all content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    for (const sel of ["#about h2", "#skills h2", "#sessions h2", "#log h2"]) {
      const el = page.locator(sel).first();
      await el.scrollIntoViewIfNeeded();
      await expect(el).toBeVisible();
      expect(await el.evaluate((n) => getComputedStyle(n).opacity)).toBe("1");
    }
    const posters = page.locator("#sessions ul").first().locator(":scope > li");
    await expect(posters).toHaveCount(7);
    for (let i = 0; i < 7; i++) {
      const li = posters.nth(i);
      await li.scrollIntoViewIfNeeded();
      await expect(li).toBeVisible();
      expect(await li.evaluate((n) => getComputedStyle(n).opacity)).toBe("1");
    }
  });
});

test("anchor nav lands on sessions", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop nav");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "03 SESSIONS" }).filter({ visible: true }).click();
  await page.waitForTimeout(1500);
  await expect(page.locator("#sessions-title")).toBeInViewport();
});

test("omarchy keeps scroll position with smooth scroll", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop shortcut");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.mouse.move(600, 400);
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(1000);
  await page.keyboard.press("Control+k");
  await expect(page.getByTestId("omarchy")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("omarchy-topbar")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("omarchy")).toHaveCount(0);
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => scrollY);
  expect(Math.abs(after - before)).toBeLessThanOrEqual(5);
});

test("about bio words light up", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop scroll check");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  const word = page.getByTestId("about-story").locator("p").first().locator("[data-word]").first();
  expect(await word.evaluate((n) => getComputedStyle(n).color)).toBe("rgb(64, 64, 64)");
  await page.getByTestId("about-story").scrollIntoViewIfNeeded();
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(1500);
  expect(await word.evaluate((n) => getComputedStyle(n).color)).toBe("rgb(245, 245, 245)");
});

test("about story keeps its text for assistive tech", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const first = page.getByTestId("about-story").locator("p").first();
  // Words are split into spans but read as one paragraph: the text stays intact, word by word.
  await expect(first).toContainText(/Systems Engineering student at Universidad del Valle|Ingenier/);
});
