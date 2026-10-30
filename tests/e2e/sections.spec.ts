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

test("nav ABOUT scrolls to about and shows episode title", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  if (isMobile) await page.getByRole("button", { name: "MENU" }).click();
  await page.getByRole("link", { name: "01 ABOUT" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/#about$/);
  const about = page.locator("#about");
  await expect(about).toBeInViewport();
  const heading = about.getByRole("heading", { level: 2 });
  await expect(heading).toContainText("EPISODE 01");
  await expect(heading).toContainText("THE BUILDER FROM BUGA");
  await expect(heading).toBeVisible();
  const dossier = about.getByTestId("pilot-dossier");
  await expect(dossier).toContainText("PILOT DOSSIER");
  await expect(dossier).toContainText("Pablo Nicolás Marín");
  await expect(dossier).toContainText("learning Go");
  await expect(dossier).toContainText("Omarchy · Hyprland · Neovim · tmux");
});

test("skills renders 4 groups with meters", async ({ page }) => {
  await page.goto("/");
  const skills = page.locator("#skills");
  await expect(skills.getByRole("heading", { level: 2 })).toContainText("TECH SUPERPOWERS");
  for (const g of ["CLOUD / AWS", "LANGUAGES", "LINUX / DEVOPS", "AI"]) {
    await expect(skills.getByRole("heading", { level: 3, name: g, exact: true })).toBeVisible();
  }
  const meters = skills.getByRole("meter");
  expect(await meters.count()).toBeGreaterThanOrEqual(8);
  const lambda = skills.getByRole("meter", { name: /AWS Lambda/ });
  await expect(lambda).toHaveAttribute("aria-valuenow", "80");
  await expect(lambda).toHaveAttribute("aria-valuemin", "0");
  await expect(lambda).toHaveAttribute("aria-valuemax", "100");
});

test("sections switch to Spanish", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  if (isMobile) await page.getByRole("button", { name: "MENU" }).click();
  await page.getByRole("button", { name: /LANG/ }).filter({ visible: true }).click();
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.locator("#about").getByRole("heading", { level: 2 })).toContainText("EL CONSTRUCTOR DE BUGA");
  // Islands hydrate on visibility (client:visible), so bring Skills into view first.
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await expect(page.locator("#skills").getByRole("heading", { level: 2 })).toContainText("SUPERPODERES TECH");
  await expect(page.getByTestId("pilot-dossier")).toContainText("aprendiendo Go");
});

test("no horizontal overflow on about and skills", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.locator("#skills").scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
