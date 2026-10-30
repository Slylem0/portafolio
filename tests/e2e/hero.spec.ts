import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("lang");
    } catch {
      /* ignore */
    }
  });
});

test("hero shows name, coordinates and hint", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#home");
  await expect(hero.getByRole("heading", { level: 1 })).toContainText("PABLO NICOLÁS");
  await expect(hero.getByRole("heading", { level: 1 })).toContainText("MARÍN");
  await expect(hero.getByText("LAT 3.90° N · LONG 76.30° W").first()).toBeVisible();
  const hint = page.getByTestId("omarchy-hint");
  await expect(hint).toBeVisible();
  await expect(hint).toHaveText("⚠ EMERGENCY — PRESS ⊞ SUPER");
  // Hint must be reachable without scrolling.
  const box = await hint.boundingBox();
  const vh = page.viewportSize()!.height;
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(vh);
  await expect(hero.getByRole("link", { name: "[ VIEW SESSIONS ]" })).toHaveAttribute("href", "#sessions");
  await expect(hero.getByRole("link", { name: "[ CONTACT ]" })).toHaveAttribute("href", "#footer");
});

test("language toggle switches hero subtitle to Spanish", async ({ page, isMobile }) => {
  await page.goto("/");
  const subtitle = page.getByTestId("hero-role");
  await expect(subtitle).toHaveText("Cloud & Backend Builder");
  if (isMobile) await page.getByRole("button", { name: "MENU" }).click();
  await page.getByRole("button", { name: /LANG/ }).click();
  await expect(subtitle).toHaveText("Constructor Cloud & Backend");
});

test("hint click dispatches omarchy:open", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    (window as any).__omarchyOpened = false;
    window.addEventListener("omarchy:open", () => {
      (window as any).__omarchyOpened = true;
    });
  });
  await page.getByTestId("omarchy-hint").click();
  await expect.poll(() => page.evaluate(() => (window as any).__omarchyOpened)).toBe(true);
});

test("no horizontal overflow on hero", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
