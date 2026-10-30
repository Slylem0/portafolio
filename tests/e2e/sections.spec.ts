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

test("7 wanted posters with session numbers", async ({ page }) => {
  await page.goto("/");
  const sessions = page.locator("#sessions");
  await expect(sessions.getByRole("heading", { level: 2 })).toContainText("SESSIONS");
  const posters = sessions.getByTestId("wanted-poster");
  await expect(posters).toHaveCount(7);
  for (let i = 0; i < 7; i++) {
    const poster = posters.nth(i);
    await expect(poster).toContainText("WANTED");
    await expect(poster).toContainText(`SESSION #0${i + 1}`);
  }
  await expect(posters.nth(1)).toContainText("Grandma's Bouncer");
  await expect(posters.nth(5)).toContainText("11");
});

test("shaggy barber shows in production prep", async ({ page }) => {
  await page.goto("/");
  const shaggy = page.locator("#sessions").getByTestId("wanted-poster").first();
  await expect(shaggy).toContainText("Shaggy Barber");
  await expect(shaggy).toContainText(
    "STATUS: IN PRODUCTION PREP · frontend live, serverless backend in progress",
  );
});

test("mission log renders timeline entries", async ({ page }) => {
  await page.goto("/");
  const log = page.locator("#log");
  await expect(log.getByRole("heading", { level: 2 })).toContainText("MISSION LOG");
  await expect(log.locator("ol > li")).toHaveCount(7);
  await expect(log).toContainText("AWS Certified Cloud Practitioner");
  const next = log.getByRole("list", { name: "NEXT MISSIONS" });
  await expect(next.getByRole("listitem")).toHaveCount(2);
  await expect(next).toContainText("Solutions Architect – Associate");
  await expect(next).toContainText("AI Practitioner");
});

test("footer has github, linkedin, email links and sign-off", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer#footer");
  await expect(footer.getByRole("link", { name: /GitHub/ })).toHaveAttribute("href", "https://github.com/Slylem0");
  await expect(footer.getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/pablo-nicolas-marin",
  );
  await expect(footer.getByRole("link", { name: /Email/ })).toHaveAttribute(
    "href",
    "mailto:pnicolasmarin2007@gmail.com",
  );
  await expect(footer).toContainText("SEE YOU SPACE BUILDER...");
});

test("every external link has rel noopener", async ({ page }) => {
  await page.goto("/");
  const external = page.locator('a[href^="http"]');
  expect(await external.count()).toBeGreaterThanOrEqual(10);
  for (const a of await external.all()) {
    await expect(a).toHaveAttribute("target", "_blank");
    await expect(a).toHaveAttribute("rel", /noopener/);
  }
});

test("no horizontal overflow on sessions, log and footer", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  for (const sel of ["#sessions", "#log", "#footer"]) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, sel).toBe(false);
  }
});
