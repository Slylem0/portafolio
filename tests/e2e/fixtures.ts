import { test as base } from "@playwright/test";

export { expect, type Page } from "@playwright/test";

/**
 * Shared `test` for every spec that is not about the intro: marks the intro as
 * already seen (sessionStorage["intro-seen"]="1") before any page script runs,
 * so `page.goto("/")` lands straight on the portfolio.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("intro-seen", "1");
      } catch {
        /* ignore */
      }
    });
    await use(context);
  },
});
