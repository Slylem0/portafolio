import { test, expect, type Page } from "@playwright/test";

// This spec talks to the intro directly, so it uses the plain Playwright `test`
// (the shared fixture in ./fixtures marks the intro as already seen).

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("lang");
    } catch {
      /* ignore */
    }
  });
});

const intro = (page: Page) => page.getByRole("dialog", { name: "Intro" });
const enter = (page: Page) => page.getByRole("button", { name: "ENTER" });

async function expectDismissed(page: Page) {
  await expect(page.locator("#intro")).toHaveCount(0);
  await expect(page.locator("#home").getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/intro-open/);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
  await expect(page.locator("main")).not.toHaveAttribute("inert", /.*/);
}

test("intro shows on first visit as a modal with ENTER focused", async ({ page }) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await expect(intro(page)).toHaveAttribute("aria-modal", "true");
  await expect(enter(page)).toBeVisible();
  await expect(enter(page)).toBeFocused();
  await expect(intro(page)).toContainText("PABLO NICOLÁS MARÍN · CLOUD & BACKEND BUILDER");
  await expect(intro(page)).toContainText("click · enter · esc");
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
});

test("the spiral canvas animates behind the button", async ({ page }) => {
  await page.goto("/");
  const canvas = page.getByTestId("intro-canvas");
  await expect(canvas).toBeAttached({ timeout: 10_000 });
  await expect(canvas).toHaveAttribute("data-mode", "animated");
  const a = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.waitForTimeout(400);
  const b = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  expect(a).not.toBe(b);
});

test("clicking ENTER dismisses the intro, lands on the hero and remembers it", async ({ page }) => {
  await page.goto("/");
  await enter(page).click();
  await expectDismissed(page);
  await expect(page.locator("#hero-title")).toBeFocused();
  expect(await page.evaluate(() => sessionStorage.getItem("intro-seen"))).toBe("1");
  expect(page.url()).not.toContain("#");
  // Second load in the same session skips it.
  await page.reload();
  await expect(page.locator("#home").getByRole("heading", { level: 1 })).toBeVisible();
  await expect(intro(page)).toBeHidden();
});

test("Escape dismisses the intro", async ({ page }) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expectDismissed(page);
});

test("clicking anywhere on the overlay dismisses it", async ({ page }) => {
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await page.mouse.click(20, 20);
  await expectDismissed(page);
});

test("?nointro skips the intro", async ({ page }) => {
  await page.goto("/?nointro");
  await expect(page.locator("#home").getByRole("heading", { level: 1 })).toBeVisible();
  await expect(intro(page)).toBeHidden();
  await expect(page.locator("main")).not.toHaveAttribute("inert", /.*/);
});

test("a deep link skips the intro and lands on the section", async ({ page }) => {
  await page.goto("/#sessions");
  await expect(intro(page)).toBeHidden();
  await expect(page.locator("#sessions")).toBeInViewport();
});

test("with JavaScript disabled ENTER still dismisses", async ({ browser, viewport }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport });
  const page = await context.newPage();
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await enter(page).click();
  await expect(intro(page)).toBeHidden();
  await expect(page.locator("#home").getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});

test("reduced motion draws one static frame and still dismisses", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.getByTestId("intro-canvas");
  await expect(canvas).toHaveAttribute("data-mode", "static", { timeout: 10_000 });
  const a = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.waitForTimeout(500);
  const b = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  expect(a).toBe(b);
  // The frame is not blank: some pixels are lit.
  const lit = await canvas.evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 128) n++;
    return n;
  });
  expect(lit).toBeGreaterThan(100);
  await page.keyboard.press("Enter");
  await expectDismissed(page);
});

test("no horizontal overflow at 390 px and ENTER fits on screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  const box = (await enter(page).boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
});

test("Ctrl+K and Super do not open Omarchy Mode while the intro is up", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("astro-island[component-url*='OmarchyLoader']:not([ssr])", { state: "attached" });
  await page.keyboard.press("Control+k");
  await page.keyboard.press("Meta");
  await page.waitForTimeout(300);
  await expect(page.getByTestId("omarchy-linking")).toHaveCount(0);
  await expect(page.getByTestId("omarchy-boot")).toHaveCount(0);
  await expect(intro(page)).toBeVisible();
  // Once inside, the shortcut works again.
  await page.keyboard.press("Escape");
  await expectDismissed(page);
  await page.keyboard.press("Control+k");
  await expect(page.getByTestId("omarchy-boot")).toBeVisible();
});

test("uses the stored Spanish preference", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("lang", "es"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "ENTRAR" })).toBeVisible();
  await expect(intro(page)).toContainText("clic · enter · esc");
});

test("works when sessionStorage throws (shown once per page load)", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(intro(page)).toBeVisible();
  await enter(page).click();
  await expectDismissed(page);
  expect(errors).toEqual([]);
});

test("Space dismisses without submitting the form or reloading", async ({ page }) => {
  await page.goto("/");
  await expect(enter(page)).toBeFocused();
  await page.evaluate(() => ((window as unknown as { __introMarker: number }).__introMarker = 42));
  await page.keyboard.press("Space");
  // A late activation of the still-focused button (Firefox/WebKit fire it on keyup after close).
  await page.evaluate(() => document.getElementById("intro-enter")?.click());
  await expectDismissed(page);
  await page.waitForTimeout(300);
  expect(page.url()).not.toContain("?");
  expect(page.url()).not.toContain("#");
  expect(await page.evaluate(() => (window as unknown as { __introMarker?: number }).__introMarker)).toBe(42);
});

test("ENTER and the sub-line are painted from the first frame", async ({ page }) => {
  await page.goto("/");
  const rise = page.locator("#intro form");
  const opacity = await rise.evaluate((el) => {
    const a = el.getAnimations()[0];
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    return Number(getComputedStyle(el).opacity);
  });
  expect(opacity).toBeGreaterThanOrEqual(0.6);
});
