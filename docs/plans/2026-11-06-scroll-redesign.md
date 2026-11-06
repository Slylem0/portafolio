# Scroll Redesign Implementation Plan

Steps use checkbox (`- [ ]`) syntax for tracking. Work on branch `redesign-scroll`.

**Goal:** Every section of the portfolio gets scroll- and pointer-driven effects at component-gallery quality while keeping the monochrome Evangelion × Bebop HUD identity.

**Architecture:** A small motion core (`src/lib/motion/`) wraps GSAP ScrollTrigger and one Lenis smooth-scroll instance; pure math lives in testable helpers; reusable effect components live in `src/components/fx/`; each section adopts them through the `useScrollFx` hook. Everything degrades to the current static layout without JS or with reduced motion.

**Tech Stack:** Astro 7 islands, React 19, Tailwind 4, GSAP 3.15 (ScrollTrigger), Lenis, Vitest, Playwright.

**Spec:** `docs/specs/2026-11-06-scroll-redesign.md`

## Global Constraints

- Palette stays monochrome (`R = G = B`); effects use white light only.
- Server render shows every piece of content in its final state; JS arms animations only when `canAnimate()`.
- Pointer effects only on `(hover: hover) and (pointer: fine)`.
- Pinned / horizontal scroll only at `min-width: 1024px` (via `gsap.matchMedia`, so a resize across it builds/tears down).
- Do not modify `IntroGate`, `src/components/omarchy/**`, `amplify/**`, `src/data/**`.
- New decorative copy goes in both `src/i18n/en.ts` and `src/i18n/es.ts`.
- Only new dependency: `lenis`.
- Commits authored by the repo's git identity, no attribution trailers.
- Before every commit: `npm test` passes; before merging to `main`: `npm run check`, `npm run build`, `npm run e2e` pass.

## Review Focus

1. Nav links (`#about`, `#sessions`…) must still land on their section with pins and Lenis active → test in Task 1 (`anchor nav lands on sessions`).
2. Switching EN↔ES mid-page changes text length; pins must recompute (`ScrollTrigger.refresh()` on `lang-change`) → test in Task 3 (`lang switch keeps sessions track scrollable`).
3. Opening and closing Omarchy Mode must return to the same scroll position with Lenis running → test in Task 1 (`omarchy keeps scroll position with smooth scroll`).
4. Keyboard users tabbing through the horizontal Sessions track must see the focused poster → test in Task 3 (`tab to last poster brings it into view`).
5. Scrambled hero name must stay readable to screen readers and search (final text in DOM) → test in Task 5 (`hero name accessible name is final text`).

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/motion/env.ts` | `canAnimate()`, `hasFinePointer()`, `isDesktop()`, `isPageLocked(html)` |
| `src/lib/motion/gsap.ts` | registers ScrollTrigger, exports `gsap`, `ScrollTrigger` |
| `src/lib/motion/lenis.ts` | `initSmoothScroll(): void` singleton, lock observer, `lang-change` refresh |
| `src/lib/motion/useScrollFx.ts` | `useScrollFx(ref, setup, deps?)` |
| `src/components/fx/math.ts` | pure pointer / scramble / progress math |
| `src/components/fx/*.tsx` | one effect component per file (spec §3.2) |
| `tests/unit/motion-env.test.ts`, `tests/unit/fx-math.test.ts` | unit tests |
| `tests/e2e/motion.spec.ts` | cross-cutting motion e2e (overflow, reduced motion, Omarchy, anchors) |
| `tests/e2e/sessions-scroll.spec.ts` | Sessions track behaviour |

---

### Task 1: Motion core, smooth scroll and safety e2e

**Files:**
- Create: `src/lib/motion/env.ts`, `src/lib/motion/gsap.ts`, `src/lib/motion/lenis.ts`, `src/lib/motion/useScrollFx.ts`
- Modify: `package.json` (add `lenis`), `src/components/sections/Navbar.tsx` (call `initSmoothScroll()` in an effect), `src/pages/index.astro` (About, Skills, Sessions, MissionLog, Footer: `client:visible` → `client:idle`, so pins exist before the visitor reaches them)
- Test: `tests/unit/motion-env.test.ts`, `tests/e2e/motion.spec.ts`

**Interfaces:**
- Produces: `canAnimate(): boolean`, `hasFinePointer(): boolean`, `isDesktop(): boolean` (`min-width: 1024px`), `isPageLocked(html: HTMLElement): boolean` (true when `html.style.overflow === "hidden"` or `html.classList.contains("intro-open")`); `gsap`, `ScrollTrigger`; `initSmoothScroll(): void` (idempotent); `useScrollFx<T extends Element>(ref: RefObject<T>, setup: (ctx: { el: T; mm: gsap.MatchMedia }) => void, deps?: unknown[]): void` — runs `setup` inside `gsap.context` only when `canAnimate()`, reverts on unmount, then calls `ScrollTrigger.refresh()` once (debounced 100 ms across islands).

- [ ] **Step 1: Write failing unit tests** in `tests/unit/motion-env.test.ts`:
  - `isPageLocked` returns true for `style.overflow = "hidden"`, true for class `intro-open`, false otherwise (build a bare object `{ style: { overflow }, classList: { contains } }`).
  - `canAnimate` returns false when `window` is undefined and when `matchMedia("(prefers-reduced-motion: reduce)").matches` is true (stub `globalThis.window`).
- [ ] **Step 2:** `npx vitest run tests/unit/motion-env.test.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement `env.ts`, `gsap.ts`, `lenis.ts` (Lenis `{ anchors: true, lerp: 0.1 }`, driven by `gsap.ticker`, `lenis.on("scroll", ScrollTrigger.update)`, `MutationObserver` on `<html>` attributes `style`/`class` → `lenis.stop()` / `lenis.start()` via `isPageLocked`; `window.addEventListener("lang-change", () => ScrollTrigger.refresh())`; skip entirely when `!canAnimate()`), `useScrollFx.ts`. `npm i lenis`.
- [ ] **Step 4:** Unit tests PASS.
- [ ] **Step 5: Write e2e** `tests/e2e/motion.spec.ts`:
  - `no horizontal overflow` (mobile project): after scrolling to bottom, `scrollWidth <= innerWidth`.
  - `reduced motion shows all content` (`test.use({ reducedMotion: "reduce" })`): each of `#about h2`, `#skills h2`, `#sessions h2`, `#log h2` and all 7 `#sessions li` are visible after `scrollIntoViewIfNeeded`, and have computed `opacity === "1"`.
  - `anchor nav lands on sessions` (desktop): click `03 SESSIONS`, wait 1500 ms, `#sessions-title` in viewport.
  - `omarchy keeps scroll position with smooth scroll` (desktop): scroll to 2000, open Omarchy via the hint button, press Escape, `scrollY` within 5 px of the pre-open value.
- [ ] **Step 6:** `npm run e2e -- tests/e2e/motion.spec.ts` → PASS; `npm run e2e` all PASS.
- [ ] **Step 7: Commit** `feat: motion core with smooth scroll and scroll-fx hook`

### Task 2: Pointer effect components

**Files:**
- Create: `src/components/fx/math.ts`, `src/components/fx/TiltCard.tsx`, `src/components/fx/SpotlightCard.tsx`, `src/components/fx/MagneticButton.tsx`
- Test: `tests/unit/fx-math.test.ts`

**Interfaces:**
- Produces:
  - `tilt(rect: {left:number;top:number;width:number;height:number}, x: number, y: number, max: number): { rx: number; ry: number; gx: number; gy: number }` — `rx`/`ry` in degrees clamped to `[-max, max]` (pointer at top edge → `rx = max`, right edge → `ry = max`), `gx`/`gy` glare position in % (0–100).
  - `magnet(rect, x, y, strength: number, radius: number): { dx: number; dy: number }` — offset toward pointer = `(pointer − center) × strength`, zero when distance > `radius`.
  - `<TiltCard max?: number (default 8) className? children>`; `<SpotlightCard className? children>` (sets CSS vars `--mx`/`--my`, renders a radial `rgb(245 245 245 / 0.10)` layer + border highlight); `<MagneticButton as?: "a" | "button" strength?: number (0.3) radius?: number (120) …anchor/button props>`.
  - All three render plain children with no listeners unless `hasFinePointer() && canAnimate()`.

- [ ] **Step 1: Failing tests** in `tests/unit/fx-math.test.ts`: `tilt` at center → `{rx:0, ry:0, gx:50, gy:50}`; at top-left corner with max 8 → `rx = 8, ry = -8, gx = 0, gy = 0`; outside rect clamps to ±8. `magnet` at center → `{0,0}`; pointer 50 px right of center, strength 0.3 → `dx = 15, dy = 0`; pointer 200 px away, radius 120 → `{0,0}`.
- [ ] **Step 2:** `npx vitest run tests/unit/fx-math.test.ts` → FAIL.
- [ ] **Step 3:** Implement `math.ts` and the three components (pointer handlers write transforms via `gsap.to(el, { duration: 0.4, ease: "power3.out" })`; leave → spring back with `ease: "elastic.out(1, 0.5)"`).
- [ ] **Step 4:** Unit tests PASS, `npm run check` clean.
- [ ] **Step 5: Commit** `feat: tilt, spotlight and magnetic effect components`

### Task 3: Sessions — pinned horizontal track

**Files:**
- Modify: `src/components/sections/Sessions.tsx`, `src/i18n/en.ts`, `src/i18n/es.ts` (add `sessions.drag: "SCROLL ▸"` / `"DESLIZA ▸"`)
- Test: `tests/e2e/sessions-scroll.spec.ts`

**Interfaces:**
- Consumes: `useScrollFx`, `TiltCard`, `isDesktop` (through `mm.add("(min-width: 1024px)")`).
- Produces: `data-testid="sessions-track"` on the `<ul>`, `data-testid="sessions-counter"` showing `#0n / 07`.

- [ ] **Step 1: Failing e2e** `tests/e2e/sessions-scroll.spec.ts` (desktop project only):
  - `track moves while scrolling`: scroll `#sessions` to top, read track `transform`, `mouse.wheel(0, 1500)`, wait 800 ms, transform differs and counter text changed from `#01 / 07`.
  - `tab to last poster brings it into view`: focus the last poster's first link via `locator.focus()` then press Tab once more back and forth; the last `#sessions li` is `toBeInViewport()`.
  - `lang switch keeps sessions track scrollable`: switch to ES via the nav, scroll into sessions, wheel 1500, transform changed.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Desktop: section pinned (`pin: true, scrub: 1, end: () => "+=" + (track.scrollWidth - innerWidth)`), track `x: () => -(track.scrollWidth - innerWidth)`, `invalidateOnRefresh: true`; title parallax `xPercent: -15` scrubbed; counter updates from `onUpdate` progress → `Math.round(p * 6) + 1`. Track becomes a single flex row (`lg:flex lg:w-max lg:gap-10`, poster width `lg:w-[26rem]`) only under the desktop media query; mobile keeps the existing grid with a fade-up per poster (`y: 40, opacity: 0` from, `toggleActions: "play none none none"`). Posters wrapped in `TiltCard`. Focus handling: `focusin` on the track → `lenis.scrollTo` the scroll position that maps the focused `li` into view (`st.start + (li.offsetLeft / (track.scrollWidth - innerWidth)) * (st.end - st.start)`).
- [ ] **Step 4:** `npm run e2e -- tests/e2e/sessions-scroll.spec.ts tests/e2e/motion.spec.ts` → PASS. Screenshot 1440 px and 390 px of `#sessions` mid-scroll and review.
- [ ] **Step 5: Commit** `feat: sessions pinned horizontal track with tilting posters`

### Task 4: About — scroll-lit bio and spotlight dossier

**Files:**
- Create: `src/components/fx/ScrollRevealText.tsx`
- Modify: `src/components/sections/About.tsx`, `src/components/ui/TitleCard.tsx` (title words rise in, scrubbed, while pinned for `+=60%` on desktop)

**Interfaces:**
- Produces: `<ScrollRevealText as?: "p" | "span" text: string className?>` — splits on spaces into `<span>`s, server render all `text-bone`; when animating, words start `color: var(--g-700)` and scrub to `var(--bone)` with `stagger: 0.1` from `start: "top 80%"` to `end: "bottom 50%"`; the element keeps `aria-label={text}` and word spans `aria-hidden`.
- Consumes: `SpotlightCard` for `data-testid="pilot-dossier"`.

- [ ] **Step 1:** Add to `tests/e2e/motion.spec.ts`: `about bio words light up` (desktop): before scrolling, first word span of the first bio paragraph has color `rgb(64, 64, 64)`; after `scrollIntoViewIfNeeded` + 1000 ms it is `rgb(245, 245, 245)`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Test PASS, existing `sections.spec.ts` PASS (dossier text unchanged). Screenshot review.
- [ ] **Step 5: Commit** `feat: about section scroll-lit bio and spotlight dossier`

### Task 5: Hero — scramble name, magnetic CTAs, scroll-out

**Files:**
- Create: `src/components/fx/ScrambleText.tsx`
- Modify: `src/components/fx/math.ts` (add `scrambleFrame`), `src/components/sections/Hero.tsx`, `src/components/ascii/AsciiOctahedron.tsx` (accept `lean?: { x: number; y: number }` and `spinBoost?: number` props applied on top of its current rotation)
- Test: `tests/unit/fx-math.test.ts`, `tests/e2e/hero.spec.ts`

**Interfaces:**
- Produces: `scrambleFrame(target: string, progress: number, rand: () => number, glyphs?: string): string` — same length as target; characters at index `< floor(progress × length)` equal target; spaces always preserved; `progress >= 1` returns target. `<ScrambleText text: string durationMs?: number (900) className?>` renders `aria-label={text}` with the animated string `aria-hidden`.

- [ ] **Step 1: Failing tests:** unit — `scrambleFrame("AB CD", 0, () => 0)` has length 5 and index 2 is `" "`; progress 0.4 → first 2 chars `"AB"`; progress 1 → `"AB CD"`. e2e in `hero.spec.ts` — `hero name accessible name is final text`: `getByRole("heading", { level: 1 })` has accessible name containing `PABLO NICOLÁS` (case per current markup) immediately after load.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement: name lines via `ScrambleText`; `HudButton`s wrapped in `MagneticButton`; pointer over hero → octahedron `lean` (±10°); `useScrollFx` scrubbed timeline from `top top` to `bottom top`: hero content `scale: 0.92, opacity: 0.2, y: -60`, octahedron `spinBoost` 0→3.
- [ ] **Step 4:** Unit + `hero.spec.ts` PASS. Screenshot review.
- [ ] **Step 5: Commit** `feat: hero scramble name, magnetic actions and scroll-out`

### Task 6: Skills — marquee, bento spotlight cards, scrubbed sync

**Files:**
- Create: `src/components/fx/Marquee.tsx`
- Modify: `src/components/sections/Skills.tsx`, `src/components/ui/SyncBar.tsx` (accept `scrub?: boolean`: fill width and the number count-up tied to scroll between `top 85%` and `top 45%`)

**Interfaces:**
- Produces: `<Marquee items: string[] speed?: number (40 px/s) className?>` — duplicates items for a seamless loop, direction flips with `ScrollTrigger` velocity sign, pauses on hover; reduced motion → static wrapped row. Items list built in `Skills.tsx` from `src/data/skills.ts` names (no new data).
- Layout: groups in a bento grid `lg:grid-cols-6`, first group `lg:col-span-4`, then `2`, `3`, `3` (repeat pattern), each wrapped in `SpotlightCard`.

- [ ] **Step 1:** Add to `motion.spec.ts`: `skills bars fill with scroll` (desktop): first sync bar fill width at `#skills` top is less than at `#skills` scrolled to center.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS; 390 px overflow test still PASS (marquee clipped by `overflow-hidden`). Screenshot review.
- [ ] **Step 5: Commit** `feat: skills bento grid, stack marquee and scrubbed sync bars`

### Task 7: Mission Log — drawn timeline and beamed next missions

**Files:**
- Create: `src/components/fx/BorderBeam.tsx`
- Modify: `src/components/sections/MissionLog.tsx`

**Interfaces:**
- Produces: `<BorderBeam durationS?: number (6) className?>` absolutely positioned inside a `relative` parent; a 2px white segment travelling the border via an animated `conic-gradient` mask; static (hidden) under reduced motion.
- Timeline: the vertical line element gets `data-testid="log-line"`, `transform-origin: top`, `scaleY` 0→1 scrubbed from `top 70%` to `bottom 60%`; each node toggles class `is-lit` (white fill + glow) when the line passes it (`ScrollTrigger` per node, `start: "top 60%"`).

- [ ] **Step 1:** Add to `motion.spec.ts`: `log line draws with scroll` (desktop): `log-line` computed transform scaleY < 0.2 at section top, > 0.8 after scrolling to its bottom.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS, screenshot review.
- [ ] **Step 5: Commit** `feat: mission log drawn timeline and beamed next missions`

### Task 8: Footer reveal, HUD cursor and scroll progress

**Files:**
- Create: `src/components/fx/HudCursor.tsx`, `src/components/fx/ScrollProgress.tsx`
- Modify: `src/components/sections/Footer.tsx`, `src/components/sections/Navbar.tsx` (render `ScrollProgress` under the bar and `HudCursor` once)

**Interfaces:**
- `ScrollProgress`: 1px bone bar `data-testid="scroll-progress"` with `scaleX` = page progress, plus mono label `SYNC nn%` (desktop only).
- `HudCursor`: fixed crosshair + trailing ring (`gsap.quickTo`, 0.15 s / 0.45 s), ring scales ×2 over `a, button, [role=button]`; adds `cursor: none` to `html` only while active; not rendered without fine pointer.
- Footer: big title `clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)` scrubbed from `top 90%` to `top 40%`; contact cards wrapped in `MagneticButton`.

- [ ] **Step 1:** Add to `motion.spec.ts`: `scroll progress reaches 100` (desktop): at bottom of page `SYNC 100%` visible and bar scaleX ≥ 0.99; `no custom cursor on touch` (mobile): no element `[data-testid="hud-cursor"]`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** PASS. Screenshot review.
- [ ] **Step 5: Commit** `feat: footer reveal, hud cursor and scroll progress`

### Task 9: Ship

- [ ] **Step 1:** `npm test && npm run check && npm run build && npm run e2e` → all PASS.
- [ ] **Step 2:** Full-page Playwright screenshots at 1440 px and 390 px, normal and `reducedMotion: "reduce"`; review every section.
- [ ] **Step 3:** Ask the owner before merging: `git switch main && git merge --ff-only redesign-scroll && git push` (Amplify deploys `main`). After deploy, open the live URL and repeat the 1440 px screenshot pass.
- [ ] **Step 4:** Update `README.md` "What's on the site" with one line on the scroll experience; commit `docs: describe the scroll experience`.
