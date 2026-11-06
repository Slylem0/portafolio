import { test, expect, hydrated } from "./fixtures";

test("scroll progress reaches 100", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop HUD");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  const bar = page.getByTestId("scroll-progress");
  await expect(bar).toBeAttached();
  // A late pin refresh can grow the page after the jump: keep going to the end, as a visitor would.
  await expect(async () => {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.getByText("SYNC 100%")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10000 });
  const sx = await bar.evaluate(
    (n) => new DOMMatrix(getComputedStyle(n).transform).a,
  );
  expect(sx).toBeGreaterThanOrEqual(0.99);
});

test.describe("touch device", () => {
  // The mobile project sets isMobile without touch input; a phone reports a coarse pointer.
  test.use({ hasTouch: true });
  test("no custom cursor on touch", async ({ page, isMobile }) => {
    test.skip(!isMobile, "touch only");
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await hydrated(page);
    await expect(page.getByTestId("hud-cursor")).toHaveCount(0);
  });
});

test("hud cursor follows the mouse on desktop", async ({ page, isMobile }) => {
  test.skip(isMobile, "fine pointer only");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  await page.mouse.move(300, 300);
  await expect(page.getByTestId("hud-cursor")).toBeVisible();
});

test("footer farewell is revealed by scrolling", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop scroll check");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  const title = page.getByTestId("footer-farewell");
  const clip = () => title.evaluate((n) => getComputedStyle(n).clipPath);
  await page.evaluate(() => {
    const top =
      document.getElementById("footer")!.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top - innerHeight);
  });
  await expect
    .poll(clip, { timeout: 10000 })
    .toMatch(/inset\((?!0px 0px 0px 0px)/);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect
    .poll(clip, { timeout: 10000 })
    .toMatch(/^(inset\(0(px|%)?( 0(px|%)?){0,3}\)|none)$/);
});
