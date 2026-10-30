import { test, expect } from "@playwright/test";

test("page loads with title and no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Pablo Nicolás Marín/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
