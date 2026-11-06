import { test, expect, hydrated } from "./fixtures";

test("log line draws with scroll", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop scroll check");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  const line = page.getByTestId("log-line");
  const scaleY = () =>
    line.evaluate((n) => {
      const m = getComputedStyle(n).transform;
      if (m === "none") return 1;
      const v = m.match(/matrix\(([^)]+)\)/)![1].split(",").map(Number);
      return v[3];
    });
  await page.evaluate(() => {
    const top = document.getElementById("log")!.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top - innerHeight);
  });
  await expect.poll(scaleY, { timeout: 10000 }).toBeLessThan(0.2);
  await page.evaluate(() => {
    const ol = document.querySelector("#log ol")!;
    window.scrollTo(0, ol.getBoundingClientRect().bottom + scrollY - innerHeight * 0.4);
  });
  await expect.poll(scaleY, { timeout: 10000 }).toBeGreaterThan(0.8);
  await expect(page.locator("#log ol > li .is-lit").first()).toBeAttached();
});

test("next missions get a light beam", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#log [data-beam]")).toHaveCount(2);
});
