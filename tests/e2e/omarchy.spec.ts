import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("lang");
      localStorage.removeItem("omarchy-theme");
    } catch {
      /* ignore */
    }
  });
});

async function gotoReady(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // The loader island hydrates on idle; Astro drops the `ssr` attribute once it has.
  await page.waitForSelector("astro-island[component-url*='OmarchyLoader']:not([ssr])", { state: "attached" });
}

/** Opens Omarchy Mode with Ctrl+K and skips the boot sequence. */
async function openDesktop(page: Page) {
  await gotoReady(page);
  await page.keyboard.press("Control+k");
  await expect(page.getByTestId("omarchy-boot")).toBeVisible();
  await page.keyboard.press("x");
  await expect(page.getByTestId("omarchy-topbar")).toBeVisible({ timeout: 1000 });
}

const activeWorkspace = (page: Page) =>
  page.getByTestId("omarchy-topbar").locator("[data-workspace][aria-current='true']");

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop tiling only");

  test("hint opens Omarchy, boot can be skipped, desktop shows top bar", async ({ page }) => {
    await gotoReady(page);
    await expect(page.getByTestId("omarchy")).toHaveCount(0);
    const loaded = () =>
      page.evaluate(() => performance.getEntriesByType("resource").some((r) => r.name.includes("OmarchyMode")));
    expect(await loaded()).toBe(false); // the desktop chunk is lazy
    await page.getByTestId("omarchy-hint").click();
    const root = page.getByTestId("omarchy");
    await expect(root).toBeVisible();
    await expect(root).toHaveAttribute("role", "dialog");
    await expect(root).toHaveAttribute("aria-modal", "true");
    await expect(page.getByTestId("omarchy-boot")).toBeVisible();
    await page.keyboard.press("Space");
    const bar = page.getByTestId("omarchy-topbar");
    await expect(bar).toBeVisible({ timeout: 1000 });
    await expect(bar).toContainText("now playing ♪ lo-fi jazz");
    await expect(bar.locator("[data-workspace]")).toHaveCount(5);
    await expect(page.getByTestId("omarchy-boot")).toHaveCount(0);
    await expect(root).toHaveAttribute("data-theme", /^(eva|bebop|omarchy)$/);
    // Dock exposes the plain-key hints.
    await expect(page.getByTestId("omarchy-dock")).toContainText("1–5 · T · P · Q · ESC");
  });

  test("Ctrl+K opens; Ctrl+Enter opens terminal; typing whoami prints Pablo", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("Control+Enter");
    const input = page.getByTestId("omarchy-terminal-input");
    await expect(input).toBeFocused();
    await input.pressSequentially("whoami");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("omarchy-terminal-output").last()).toContainText("Pablo Nicolás Marín");
  });

  test("typing digits in terminal does not switch workspace", async ({ page }) => {
    await openDesktop(page);
    await expect(activeWorkspace(page)).toHaveAttribute("data-workspace", "1");
    await page.keyboard.press("Control+Enter");
    const input = page.getByTestId("omarchy-terminal-input");
    await expect(input).toBeFocused();
    await page.keyboard.type("3");
    await expect(input).toHaveValue("3");
    await expect(activeWorkspace(page)).toHaveAttribute("data-workspace", "1");
  });

  test("Ctrl+3 switches to Skills workspace", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("Control+3");
    await expect(activeWorkspace(page)).toHaveAttribute("data-workspace", "3");
    await expect(page.getByRole("group", { name: "Skills" })).toBeVisible();
    await expect(page.getByRole("group", { name: "About" })).toBeHidden();
  });

  test("plain 3 switches to Skills when focus is not in an input", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("3");
    await expect(activeWorkspace(page)).toHaveAttribute("data-workspace", "3");
    await expect(page.getByRole("group", { name: "Skills" })).toBeVisible();
  });

  test("windows tile with dwindle and close with Q", async ({ page }) => {
    await openDesktop(page);
    const wins = page.locator("[data-testid='omarchy-window']:visible");
    await expect(wins).toHaveCount(1);
    await page.keyboard.press("t");
    await expect(wins).toHaveCount(2);
    await page.getByTestId("omarchy-terminal-input").pressSequentially("neofetch");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("omarchy-terminal-output").last()).toContainText("WM: Hyprland");
    await page.keyboard.press("Control+p");
    await expect(wins).toHaveCount(3);
    // Side by side: first window on the left half, the others share the right half.
    await expect
      .poll(async () => {
        const [a, b] = await Promise.all([wins.nth(0).boundingBox(), wins.nth(1).boundingBox()]);
        return !!a && !!b && b.x > a.x + a.width - 1;
      })
      .toBe(true);
    // Display Switch re-themes the desktop.
    await page.getByRole("button", { name: /Bebop/ }).click();
    await expect(page.getByTestId("omarchy")).toHaveAttribute("data-theme", "bebop");
    await page.getByTestId("omarchy").focus();
    await page.keyboard.press("q");
    await expect(wins).toHaveCount(2);
  });

  test("terminal open <n> opens a session window", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("Control+Enter");
    await page.getByTestId("omarchy-terminal-input").pressSequentially("open 2");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("group", { name: /Grandma's Bouncer/ })).toBeVisible();
  });

  test("terminal exit leaves Omarchy Mode", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("Control+Enter");
    await page.getByTestId("omarchy-terminal-input").pressSequentially("exit");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("omarchy")).toHaveCount(0);
  });

  test("reduced motion shows a short static boot frame, then the desktop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoReady(page);
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("omarchy-boot")).toBeVisible();
    await expect(page.locator(".om-alert-flash")).toHaveCount(0);
    await expect(page.getByTestId("omarchy-topbar")).toBeVisible({ timeout: 1500 });
  });

  test("Escape exits and restores scroll position", async ({ page }) => {
    await gotoReady(page);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(1200);
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("omarchy-boot")).toBeVisible();
    await page.keyboard.press("x");
    await expect(page.getByTestId("omarchy-topbar")).toBeVisible({ timeout: 1000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("omarchy")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(1200);
    await expect(page.getByTestId("omarchy-hint")).toBeFocused();
    // Normal navigation still works afterwards and the desktop can be reopened.
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("omarchy")).toBeVisible();
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile single-window mode");

  test("one window visible at a time, dock switches", async ({ page }) => {
    await gotoReady(page);
    await page.getByTestId("omarchy-hint").click();
    await page.getByTestId("omarchy-boot").click();
    await expect(page.getByTestId("omarchy-topbar")).toBeVisible({ timeout: 1000 });
    const wins = page.locator("[data-testid='omarchy-window']:visible");
    await expect(wins).toHaveCount(1);
    await expect(page.getByRole("group", { name: "About" })).toBeVisible();
    await page.getByTestId("omarchy-dock").getByRole("button", { name: /Skills/ }).click();
    await expect(wins).toHaveCount(1);
    await expect(page.getByRole("group", { name: "Skills" })).toBeVisible();
    await expect(page.getByRole("group", { name: "About" })).toBeHidden();
    // Terminal also shows as the single fullscreen window.
    await page.getByTestId("omarchy-dock").getByRole("button", { name: /Terminal/ }).click();
    await expect(wins).toHaveCount(1);
    await expect(page.getByTestId("omarchy-terminal-input")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("horizontal swipe switches workspace", async ({ page }) => {
    await gotoReady(page);
    await page.getByTestId("omarchy-hint").click();
    await page.getByTestId("omarchy-boot").click();
    await expect(page.getByTestId("omarchy-topbar")).toBeVisible({ timeout: 1000 });
    await expect(activeWorkspace(page)).toHaveAttribute("data-workspace", "1");
    const area = page.getByTestId("omarchy-area");
    const box = (await area.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width - 40, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, y, { steps: 4 });
    await page.mouse.move(box.x + 40, y, { steps: 4 });
    await page.mouse.up();
    await expect(activeWorkspace(page)).toHaveAttribute("data-workspace", "2");
    await expect(page.getByRole("group", { name: "Sessions" })).toBeVisible();
  });
});
