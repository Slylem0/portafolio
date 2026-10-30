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
    await expect(page.getByTestId("omarchy-boot")).toContainText("press any key to skip");
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

  test("Esc in the terminal clears it, a second Esc leaves it, then plain 3 switches", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("t");
    const input = page.getByTestId("omarchy-terminal-input");
    await expect(input).toBeFocused();
    const dock = page.getByTestId("omarchy-dock");
    await expect(dock).toContainText("Esc leaves the terminal · then 1–5 · T · P · Q");
    await page.keyboard.type("ls 3");
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(page.getByTestId("omarchy")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(input).not.toBeFocused();
    await expect(page.getByTestId("omarchy")).toBeVisible();
    await expect(page.locator("[data-kind='terminal']")).toHaveAttribute("data-focused", "true");
    await expect(dock).toContainText("1–5 · T · P · Q · ESC");
    await page.keyboard.press("3");
    await expect(activeWorkspace(page)).toHaveAttribute("data-workspace", "3");
    // React state was cleared too: the terminal submits nothing stale.
    await page.keyboard.press("1");
    await page.keyboard.press("t");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("omarchy-terminal-output").last()).not.toContainText("ls 3");
  });

  test("keyboard focus moves the WM focus", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("t");
    await expect(page.locator("[data-kind='terminal']")).toHaveAttribute("data-focused", "true");
    await page.getByRole("button", { name: "Close About" }).focus();
    await expect(page.locator("[data-kind='about']")).toHaveAttribute("data-focused", "true");
    await expect(page.locator("[data-kind='terminal']")).toHaveAttribute("data-focused", "false");
  });

  test("a closed workspace window comes back on revisit, or via Restore", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("q");
    await expect(page.getByRole("button", { name: "Restore About" })).toBeVisible();
    await page.getByRole("button", { name: "Restore About" }).click();
    await expect(page.getByRole("group", { name: "About" })).toBeVisible();
    await page.getByTestId("omarchy").focus();
    await page.keyboard.press("q");
    await page.keyboard.press("2");
    await page.keyboard.press("1");
    await expect(page.getByRole("group", { name: "About" })).toBeVisible();
  });

  test("Ctrl+K toggles Omarchy Mode off", async ({ page }) => {
    await openDesktop(page);
    await page.keyboard.press("t");
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("omarchy")).toHaveCount(0);
  });

  test("top bar controls have clean accessible names", async ({ page }) => {
    await openDesktop(page);
    const bar = page.getByTestId("omarchy-topbar");
    await expect(bar.getByRole("button", { name: "EXIT", exact: true })).toBeVisible();
    await expect(bar.getByRole("button", { name: "Switch language to Spanish (current: English)" })).toBeVisible();
  });

  test("Super+click does not open Omarchy Mode; a bare Super tap does", async ({ page }) => {
    await gotoReady(page);
    await page.keyboard.down("Meta");
    await page.mouse.click(640, 500);
    await page.keyboard.up("Meta");
    await page.keyboard.down("Meta");
    await page.mouse.wheel(0, 200);
    await page.keyboard.up("Meta");
    await page.waitForTimeout(300);
    await expect(page.getByTestId("omarchy")).toHaveCount(0);
    await expect(page.getByTestId("omarchy-linking")).toHaveCount(0);
    await page.keyboard.press("Meta");
    await expect(page.getByTestId("omarchy")).toBeVisible();
  });

  test("hint clicked right after navigation (before hydration) still opens", async ({ page }) => {
    // Hold back the navbar and loader islands so the click lands on un-hydrated markup.
    await page.route(/\/(Navbar|OmarchyLoader)\.[^/]*\.js$/, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto("/", { waitUntil: "commit" });
    await page.getByTestId("omarchy-hint").click();
    await expect(page.locator("astro-island[component-url*='OmarchyLoader'][ssr]")).toHaveCount(1);
    await expect(page.getByTestId("omarchy")).toBeVisible();
  });

  test("Ctrl+K pressed before hydration still opens", async ({ page }) => {
    // Delay the loader island so the keypress definitely lands before it hydrates.
    await page.route(/OmarchyLoader.*\.js$/, async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("astro-island[component-url*='OmarchyLoader'][ssr]")).toHaveCount(1);
    await page.keyboard.press("Control+k");
    await expect(page.getByTestId("omarchy")).toBeVisible({ timeout: 10000 });
  });

  test("shows LINKING while the chunk loads and an error toast if it fails", async ({ page }) => {
    await page.route(/OmarchyMode.*\.js$/, (route) => route.abort());
    await gotoReady(page);
    await page.getByTestId("omarchy-hint").click();
    await expect(page.getByRole("alert")).toContainText("failed to load");
    await expect(page.getByTestId("omarchy")).toHaveCount(0);
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
  test.use({ hasTouch: true });

  test("one window visible at a time, dock switches", async ({ page }) => {
    await gotoReady(page);
    await page.getByTestId("omarchy-hint").click();
    await expect(page.getByTestId("omarchy-boot")).toContainText("tap to skip");
    await page.getByTestId("omarchy-boot").click();
    await expect(page.getByTestId("omarchy-topbar")).toBeVisible({ timeout: 1000 });
    await expect(page.getByTestId("omarchy-dock")).toContainText("swipe ← → to switch");
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

test.describe("TRIAD", () => {
  const FAKE = "https://triad.e2e.test/";
  const valid = {
    cores: [
      { id: "ENGINEER", vote: "YES", line: "Go compiles fast and deploys as one binary." },
      { id: "COWBOY", vote: "NO", line: "Whatever happens, happens — <b>not today</b>." },
      { id: "STUDENT", vote: "YES", line: "New language, new notes. I'm in." },
    ],
    verdict: "APPROVED",
  };

  test.beforeEach(async ({ page }) => {
    // Inject a fake backend URL so page.route can intercept it (see triadClient.resolveTriadUrl).
    await page.addInitScript((u) => ((window as unknown as { __TRIAD_URL__: string }).__TRIAD_URL__ = u), FAKE);
  });

  async function openTriad(page: Page, isMobile: boolean) {
    if (isMobile) {
      await gotoReady(page);
      await page.getByTestId("omarchy-hint").click();
      await page.getByTestId("omarchy-boot").click();
      await expect(page.getByTestId("omarchy-topbar")).toBeVisible({ timeout: 1000 });
    } else await openDesktop(page);
    if (isMobile) await page.getByTestId("omarchy-dock").getByRole("button", { name: /TRIAD/ }).click();
    else await page.getByTestId("omarchy-topbar").locator("[data-workspace='4']").click();
    await expect(page.getByTestId("triad")).toBeVisible();
  }

  test("TRIAD answers offline when backend unreachable and button disables while pending", async ({ page, isMobile }) => {
    let calls = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    await page.route(`${FAKE}**`, async (route) => {
      if (route.request().method() === "POST") calls++;
      await gate;
      await route.abort("connectionrefused");
    });
    await openTriad(page, isMobile);
    await page.getByTestId("triad-input").fill("Should I learn Go next?");
    const submit = page.getByTestId("triad-submit");
    await submit.dblclick();
    await expect(submit).toBeDisabled();
    await expect(page.getByTestId("triad-status")).toBeVisible();
    await page.getByTestId("triad-input").press("Enter"); // form submit is also ignored while pending
    release();
    await expect(page.getByTestId("triad-offline")).toHaveText("LINK LOST — LOCAL MODE");
    await expect(page.getByTestId("triad-resolution")).toHaveText(/^RESOLUTION: (APPROVED|REJECTED) [0-3]–[0-3]$/);
    await expect(page.getByTestId("triad-core").and(page.locator("[data-vote='YES'], [data-vote='NO']"))).toHaveCount(3);
    await expect(submit).toBeEnabled();
    await expect(page.getByTestId("triad-live")).toContainText("LINK LOST — LOCAL MODE");
    if (!isMobile) await expect(page.getByTestId("triad-input")).toBeFocused();
    expect(calls).toBe(1);
  });

  test("TRIAD shows the backend verdict with cores revealed in order", async ({ page, isMobile }) => {
    const bodies: unknown[] = [];
    await page.route(`${FAKE}**`, async (route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(valid),
      });
    });
    await openTriad(page, isMobile);
    await page.getByTestId("triad-example").first().click();
    await expect(page.getByTestId("triad-input")).toHaveValue("Should I learn Go next?");
    const cores = page.getByTestId("triad-core");
    await expect(cores.nth(0)).toHaveAttribute("data-vote", "YES");
    await expect(page.getByTestId("triad-resolution")).toHaveText("RESOLUTION: APPROVED 2–1");
    await expect(cores.nth(1)).toHaveAttribute("data-vote", "NO");
    await expect(cores.nth(1)).toContainText("<b>not today</b>"); // model text rendered as text
    await expect(page.getByTestId("triad-online")).toBeVisible();
    await expect(page.getByTestId("triad-live")).toHaveText(
      "CORE·ENGINEER YES, CORE·COWBOY NO, CORE·STUDENT YES — RESOLUTION: APPROVED 2–1",
    );
    await expect(page.getByTestId("triad-input")).toHaveAttribute("aria-describedby", "triad-counter");
    await expect(page.locator("#triad-counter")).toContainText("23/200");
    if (!isMobile) await expect(page.getByTestId("triad-input")).toBeFocused();
    await expect(page.getByTestId("triad-offline")).toHaveCount(0);
    expect(bodies).toEqual([{ question: "Should I learn Go next?", lang: "en" }]);
    // Nothing overflows horizontally inside the window, nor the page.
    const overflow = await page.getByTestId("triad").evaluate((el) => {
      const scroller = el.parentElement!;
      return scroller.scrollWidth > scroller.clientWidth || document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);
    if (isMobile) {
      const [a, b] = [await cores.nth(0).boundingBox(), await cores.nth(1).boundingBox()];
      expect(b!.y).toBeGreaterThan(a!.y + a!.height - 1); // stacked vertically
    }
  });

  test("Esc in the TRIAD input clears it; typing digits does not switch workspace", async ({ page, isMobile }) => {
    test.skip(isMobile, "keyboard shortcuts");
    await page.route(`${FAKE}**`, (route) => route.abort());
    await openTriad(page, isMobile);
    const input = page.getByTestId("triad-input");
    await input.click();
    await page.keyboard.type("4 or 5?");
    await expect(input).toHaveValue("4 or 5?");
    await expect(activeWorkspace(page)).toHaveAttribute("data-workspace", "4");
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
    await expect(page.getByTestId("omarchy")).toBeVisible();
  });
});
