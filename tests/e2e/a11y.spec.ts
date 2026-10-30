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
  await page.waitForSelector("astro-island[component-url*='OmarchyLoader']:not([ssr])", { state: "attached" });
}

test("reduced motion: no element has class flash animating", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoReady(page);
  await page.getByTestId("omarchy-hint").click();
  await expect(page.getByTestId("omarchy")).toBeVisible();
  // Probe every flashing class (page and Omarchy stylesheets are both loaded now),
  // plus whatever flashing element is actually on screen.
  const names = await page.evaluate(() => {
    const probes = ["flash", "smash-cut", "title-cut", "hint-blink", "om-alert-flash"].map((c) => {
      const el = document.createElement("div");
      el.className = c;
      document.querySelector('[data-testid="omarchy"]')!.appendChild(el);
      return el;
    });
    const live = [...document.querySelectorAll<HTMLElement>("[class*='flash'], .hint-blink, .title-cut")];
    const out = [...new Set([...probes, ...live])].map((el) => `${el.className}: ${getComputedStyle(el).animationName}`);
    probes.forEach((el) => el.remove());
    return out;
  });
  expect(names.length).toBeGreaterThan(0);
  for (const n of names) expect(n).toMatch(/: none$/);
});

test("all interactive elements are keyboard focusable with visible outline", async ({ page }) => {
  await gotoReady(page);
  // Let every client:visible island hydrate so the tab order is the final one.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.scrollTo(0, 0));

  const interactive = await page.evaluate(
    () =>
      [...document.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]")].filter(
        (el) => el.tabIndex >= 0 && el.getClientRects().length > 0 && !el.closest("[inert]"),
      ).length,
  );
  expect(interactive).toBeGreaterThan(5);

  const seen: string[] = [];
  for (let i = 0; i < interactive + 2; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      // Track elements, not labels: the navbar and hero hints share the same text.
      const again = el.hasAttribute("data-tab-seen");
      el.setAttribute("data-tab-seen", "");
      const cs = getComputedStyle(el);
      return {
        again,
        id: `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}"`,
        width: parseFloat(cs.outlineWidth),
        style: cs.outlineStyle,
        focusVisible: el.matches(":focus-visible"),
      };
    });
    if (!info) break;
    if (info.again) break;
    seen.push(info.id);
    expect(info.focusVisible, info.id).toBe(true);
    expect(info.style, info.id).not.toBe("none");
    expect(info.width, info.id).toBeGreaterThan(0);
  }
  // Header, hero CTAs, poster links and footer links are all reachable.
  expect(seen.length).toBeGreaterThanOrEqual(interactive);
});

test("Omarchy chunk not loaded before activation", async ({ page }) => {
  const chunk: string[] = [];
  page.on("request", (r) => {
    if (/OmarchyMode/.test(r.url())) chunk.push(r.url());
  });
  await gotoReady(page);
  // Scroll the whole page so every lazy island hydrates; none of them may pull the chunk.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState("networkidle");
  expect(chunk).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByTestId("omarchy-hint").click();
  await expect(page.getByTestId("omarchy")).toBeVisible();
  expect(chunk.length).toBeGreaterThan(0);
});
