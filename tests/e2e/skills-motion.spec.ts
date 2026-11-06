import { test, expect, hydrated } from "./fixtures";

test("skills bars fill with scroll", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop scroll check");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await hydrated(page);
  const meter = page.locator("#skills [role=meter]").first();
  const lit = () => meter.locator(".sync-seg.bg-bone").count();
  // Section just entering from below: the first meter is still under the fold.
  await page.evaluate(() => {
    const top = document.getElementById("skills")!.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top - innerHeight + 40);
  });
  await page.waitForTimeout(800);
  const early = await lit();
  await meter.evaluate((n) => n.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1200);
  const late = await lit();
  expect(early).toBeLessThan(late);
  await expect(meter.getByText(/^\d+%$/)).toHaveText("80%");
});

test("stack marquee runs above the skills", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const marquee = page.getByTestId("stack-marquee");
  await expect(marquee).toContainText("Amazon Bedrock");
  await marquee.scrollIntoViewIfNeeded();
});
