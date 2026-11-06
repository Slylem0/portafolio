# Scroll redesign — Design Spec

- **Date:** 2026-11-06
- **Branch:** `redesign-scroll` (merged to `main` only when a step is verified; Amplify deploys `main`)
- **Deadline:** challenge closes 2026-11-06 23:59 GMT-8 (2026-11-07 02:59 Colombia)
- **Builds on:** `docs/superpowers/specs/2026-10-30-portfolio-design.md`

## 1. Goal

Raise the site's visual quality to the level of component galleries such as 21st.dev and make it
react as the visitor scrolls, across every section, while keeping the current identity:
Evangelion × Cowboy Bebop HUD, strictly monochrome (`R = G = B`), Geist / Geist Mono, HUD frames.

Success means:

1. Every section has at least one scroll-linked or pointer-linked effect that a judge notices in
   the first pass.
2. Nothing the rubric already scores regresses: Omarchy Mode and TRIAD work, EN/ES works, mobile
   at 390 px has no horizontal scroll, `prefers-reduced-motion` shows all content with no motion.
3. Each step ships on its own: after any step the site builds, tests pass and it can go to `main`.

## 2. Constraints

- Palette stays monochrome. Effects use white light only (glow, spotlight, glare, noise).
- Content and copy come from `src/data/*` and `src/i18n/*` unchanged. No new copy except short
  decorative labels, added to both `en.ts` and `es.ts`.
- Progressive enhancement: the server render shows every piece of content in its final state.
  JS arms animations only when motion is allowed; without JS or with reduced motion the page is
  the static layout.
- Pointer effects (cursor, tilt, magnetic, spotlight) run only on `(hover: hover) and (pointer: fine)`.
- Pinned / horizontal scroll runs only at `min-width: 1024px`. Below that, sections stack vertically.
- Untouched: `IntroGate`, everything under `src/components/omarchy/`, the `amplify/` backend.
- New dependency allowed: `lenis` (smooth scroll). GSAP (already installed) provides ScrollTrigger.

## 3. Architecture

### 3.1 Motion core — `src/lib/motion/`

| File | Purpose |
|---|---|
| `gsap.ts` | Registers ScrollTrigger once; exports `gsap`, `ScrollTrigger`. |
| `lenis.ts` | Creates one Lenis instance on the client, drives it from `gsap.ticker`, calls `ScrollTrigger.update` on scroll. Exposes `pauseScroll()` / `resumeScroll()`. Not created when reduced motion is on. |
| `env.ts` | `canAnimate()` (JS + no reduced motion), `hasFinePointer()`, `isDesktop()` via `matchMedia`. |
| `useScrollFx.ts` | Hook: `useScrollFx(ref, (ctx) => { ... })` runs the callback inside `gsap.context` only when `canAnimate()`, reverts on unmount. All section animations go through it. |

Omarchy Mode and the intro gate lock the page by setting `overflow: hidden` on `<html>` (Omarchy)
or the `intro-open` class (intro). `lenis.ts` watches `<html>`'s `style` and `class` with a
MutationObserver and stops Lenis while either lock is present, so no Omarchy or intro code changes.
`useReveal.ts` stays for components that still use it.

### 3.2 Effect components — `src/components/fx/`

Each is self-contained, takes children / props, renders the static version when it can't animate.

| Component | Effect |
|---|---|
| `SpotlightCard` | Radial white glow and border highlight that follow the pointer. |
| `TiltCard` | 3D tilt toward the pointer with a moving glare layer; springs back on leave. |
| `ScrambleText` | Text decodes from random glyphs into the final string (on mount or on enter). Screen readers get the final text via `aria-label`. |
| `ScrollRevealText` | Words go from `g-700` to `bone` as the block scrolls through the viewport (scrubbed). |
| `Marquee` | Infinite horizontal band; speed and direction follow scroll velocity. Pauses on hover. |
| `MagneticButton` | Element drifts toward the pointer within a radius, springs back on leave. |
| `HudCursor` | Crosshair cursor with a trailing ring; ring grows over links and buttons. Hidden on touch. |
| `ScrollProgress` | Thin bar in the navbar labeled `SYNC nn%`, scrubbed to page progress. |
| `BorderBeam` | A light segment travelling around a card's border. |

## 4. Sections (implementation order = priority order)

1. **Sessions** — desktop: the section pins and the wanted posters slide horizontally as the
   visitor scrolls (scrubbed `x` of the track, pin length = track overflow). Each poster is a
   `TiltCard`. The `SESSIONS` title moves with parallax and a counter shows `#0n / 07`.
   Mobile: current vertical grid, posters fade/rise in.
2. **About** — the `THE BUILDER FROM BUGA` title card pins briefly; the bio paragraphs use
   `ScrollRevealText`. The pilot dossier is a `SpotlightCard`.
3. **Hero** — name uses `ScrambleText`; the ASCII octahedron leans toward the pointer and spins
   faster with scroll; CTA buttons are `MagneticButton`s. Scrolling out, the hero content scales
   down and fades as About comes in.
4. **Skills** — groups laid out as a bento grid of `SpotlightCard`s; sync bars fill scrubbed to
   scroll and percentages count up; a `Marquee` of the stack (AWS, Lambda, Bedrock, DynamoDB, Go,
   TypeScript, Linux, Hyprland…) sits above the grid.
5. **Mission Log** — the timeline's vertical line draws with scroll (scaleY scrubbed), each node
   lights up as the line reaches it; "Next missions" cards get a `BorderBeam`.
6. **Footer** — `SEE YOU SPACE BUILDER…` is revealed by a scrubbed clip mask; contact cards are
   `MagneticButton`s.

Global: `HudCursor` and `ScrollProgress` mount in `Base.astro` / `Navbar`.

## 5. Error handling and fallbacks

- Any effect that can't run (no IntersectionObserver, reduced motion, coarse pointer, narrow
  viewport) renders the static markup; no content is hidden behind an animation's start state.
- ScrollTrigger refreshes after fonts load and on language switch (text length changes).
- Lenis is stopped while Omarchy Mode or the intro gate holds the page lock (see 3.1).

## 6. Testing

- Existing `npm test` (vitest) and `npm run e2e` (Playwright) must pass after every step.
- New e2e checks:
  - 390 px: `document.documentElement.scrollWidth <= 390` on the whole page.
  - Reduced motion (`reducedMotion: 'reduce'`): every section title and every session poster is
    visible without scrolling interactions.
  - Desktop: scrolling through Sessions changes the track's transform; Omarchy Mode still opens
    and closes and the page keeps its scroll position.
- Unit tests for pure helpers (`env.ts`, scramble glyph generation).
- After each section, Playwright screenshots at 1440 px and 390 px are reviewed before merging.
- `npm run build` and `npm run check` clean before each merge to `main`.

## 7. Out of scope

New sections or copy, colour accents, WebGL / three.js scenes, changes to Omarchy Mode, TRIAD or
the AWS backend.
