# Portfolio "SEE YOU SPACE BUILDER" — Design Spec

- **Date:** 2026-10-30
- **Owner:** Pablo Nicolás Marín González (GitHub `Slylem0`)
- **Context:** AWS Student Builder Challenge "Build Your Tech Superpower". Deadline **2026-11-06 23:59 GMT-8**. Goal: finish top 5 to win the AWS Foundational Certification voucher (target: AWS Certified AI Practitioner).
- **Repo:** `github.com/Slylem0/portafolio`
- **Hosting:** AWS Amplify Hosting (Gen 2)

## 1. Goals and success criteria

The challenge rubric drives every decision:

| Rubric item | Weight | How this design scores |
|---|---|---|
| Creativity and memorability | 30% | Omarchy Mode (secret Hyprland desktop) + TRIAD (three AI cores vote), styled as an Evangelion × Cowboy Bebop homage that reflects Pablo's real interests |
| Working AWS implementation | 25% | Amplify Hosting + Lambda + Bedrock + DynamoDB + IAM + CloudWatch + Budgets, all defined as code and documented |
| Communication quality | 25% | Screenshots of site and AWS console, architecture diagram, write-up of lessons and challenges |
| Completeness and usability | 20% | About / Skills / Projects sections, working nav, mobile at 390 px with no horizontal scroll, reduced-motion support |

Hard requirements from the rules (all must hold):

1. Public site on AWS, live URL, online through judging (until end of Nov 2026).
2. Three core sections: About Me, Skills, Projects/Achievements.
3. One interactive creative feature that works, has a **visible hint**, and does not block normal navigation.
4. Public GitHub repo link.
5. Original work, not previously published.

## 2. Content source of truth

From GitHub profile, repos and LinkedIn PDF (2026-10-30):

- Systems Engineering student, Universidad del Valle (Feb 2024 – Dec 2029). Lives in Buga, Valle del Cauca, Colombia.
- **AWS Certified Cloud Practitioner.**
- **Partnerships & Academy Lead**, AWS Student Builder Group @ Univalle (Core Team Member badge). AWS Student Community Day participant.
- **Academic tutor (monitor)**, Univalle, Jan–Jul 2026: Imperative, Object-Oriented, Event-Driven and Functional Programming.
- Interests: backend, cloud, Linux, DevOps, math, logic, cybersecurity, a little quantum. Learning Go. Daily driver: Omarchy · Hyprland · Neovim · tmux. Also hardware tech support experience.
- Contact: GitHub, LinkedIn (`linkedin.com/in/pablo-nicolas-marin`), email. **No Instagram.**

Projects ("Sessions"), in order:

| # | Project | Status / link | Stack |
|---|---|---|---|
| 01 | Shaggy Barber | **In development** for a real barbershop; frontend live at `d2ficupb35lp6p.cloudfront.net`; repo private | Astro, TypeScript, Tailwind, CDK, Lambda, DynamoDB, API Gateway, Cognito, EventBridge |
| 02 | Grandma's Bouncer | Public repo, demo video | Strands Agents, Decider 2B, Bedrock (Nova 2 Lite) |
| 03 | Dr. Cloud | Public repo (`AWS-Weekend-challenge`) | Bedrock, Strands, Streamlit, App Runner, ECR, IAM |
| 04 | AWS Daily Topic Agent | Public repo | EventBridge Scheduler, Lambda, Bedrock (Nova), S3 |
| 05 | Quantum Dice | Public repo, Qollab × IonQ hackathon 2026 | Python, Qiskit, IonQ |
| 06 | Omarchy Display Switch | Public repo, ⭐ 11 | QML, Shell, Hyprland |
| 07 | Compressed-range query engine | Public repo | C++, algorithms |

Shaggy Barber copy must say it is in development (honest status), e.g. `STATUS: IN PRODUCTION PREP · frontend live, serverless backend in progress`.

Mission Log (Achievements): AWS Certified Cloud Practitioner; Partnerships & Academy Lead; Academic tutor; hackathons (Qollab × IonQ, AWS Agent Experience); open-source Omarchy plugins.

## 3. Language

English by default with an `LANG: EN ▸ ES` toggle. All copy lives in typed dictionaries (`src/i18n/en.ts`, `src/i18n/es.ts`) with the same keys; the choice is remembered in `localStorage` (wrapped in try/catch) and the page defaults to EN if storage fails.

## 4. Site structure (normal mode)

Single page, fixed HUD navbar: `00 HOME · 01 ABOUT · 02 SKILLS · 03 SESSIONS · 04 LOG · LANG EN▸ES` plus the Omarchy Mode hint button. Mobile: HUD-style hamburger menu.

- **00 Hero** — ASCII octahedron (own canvas renderer, see §6) reacting to pointer; corner frames; Buga coordinates `LAT 3.90° N · LONG 76.30° W`; title **PABLO NICOLÁS MARÍN** / *Cloud & Backend Builder*; buttons `[ VIEW SESSIONS ]`, `[ CONTACT ]`; blinking hint **⚠ EMERGENCY — PRESS ⊞ SUPER**.
- **01 About Me** — Eva-style episode title card *"EPISODE 01: THE BUILDER FROM BUGA"*; story paragraph; "pilot dossier" card (name, base, status, daily driver, sync ratio).
- **02 Tech Superpowers** — sync-ratio panel, grouped: Cloud/AWS, Languages, Linux/DevOps, AI.
- **03 Sessions** — Bebop-style WANTED poster cards for the 7 projects (title, one-line pitch, stack chips, links, status).
- **04 Mission Log** — timeline of achievements.
- **Footer** — GitHub, LinkedIn, email; **"SEE YOU SPACE BUILDER..."**.

## 5. Visual system

Palette (CSS custom properties / Tailwind theme tokens):

| Token | Value | Use |
|---|---|---|
| `--bg` | `#07070a` | page background |
| `--alert` | `#ff6a00` | primary, warnings, CTAs |
| `--unit` | `#7b4dff` | secondary accents |
| `--phosphor` | `#39ff88` | terminal, sync bars, HUD data |
| `--jazz` | `#1e3a8a` | Bebop panels |
| `--amber` | `#f5c542` | Bebop titles, WANTED posters |
| `--bone` | `#e8e6df` | body text |

Fonts (Google Fonts): *Shippori Mincho* (bold, Eva title cards), *Bebas Neue* (Sessions, posters), *JetBrains Mono* (HUD, data, terminal).

Recurring motifs: corner frames, coordinates, `001` counters, diagonal warning stripes, hexagons, subtle film grain and scanlines, smash-cut transitions between sections.

Accessibility: text contrast ≥ WCAG AA; `prefers-reduced-motion` disables the red flashing alert, smash cuts, and slows the octahedron; all interactive elements reachable by keyboard with visible focus.

**IP rule:** homage only. No character art, official logos (NERV, Bebop), official fonts or soundtrack. Names are original (TRIAD, not MAGI).

## 6. ASCII octahedron (hero + desktop wallpaper)

Replaces the 21st.dev Unicorn Studio embed (that embed is someone else's project and its code strips the vendor's watermark; neither is acceptable).

- React component `AsciiOctahedron` rendering to a `<canvas>`.
- Pure module `octahedron.ts`: 6 vertices, 8 faces; rotate, project, shade faces by light direction, and map brightness to a character ramp (` .:-=+*#%@`). Output is a grid of characters; no DOM dependencies, so it is unit-testable.
- Pointer position tilts the rotation; idle rotation otherwise.
- Resolution adapts to viewport (fewer cells on mobile); pauses when off-screen (`IntersectionObserver`) and when the tab is hidden.
- Same component reused as Omarchy Mode wallpaper at larger scale.

## 7. Creative feature: Omarchy Mode

### Activation
- Visible hint button in hero and navbar: **⚠ EMERGENCY — PRESS ⊞ SUPER**.
- Triggers: click/tap on hint; `Meta` key (Super); `Ctrl+K` fallback (Windows captures Super).
- The Omarchy Mode bundle is lazy-loaded on first activation.

### Boot sequence (~3 s, skippable with any key/tap, reduced when `prefers-reduced-motion`)
1. Red screen, hexagons, *"PATTERN DETECTED: BUILDER"*.
2. Cut to black, fast boot log (`[ OK ] Started Hyprland...`).
3. Desktop appears.

### Desktop
- **Top bar:** workspaces 1–5, clock, `LANG`, decorative "now playing ♪ lo-fi jazz" (no audio), ✕ exit button.
- **Wallpaper:** large ASCII octahedron.
- **Tiling:** dwindle layout like Hyprland. Pure function `layout(windows, area) → rects`; each new window splits the last one, alternating horizontal/vertical by aspect ratio; windows animate to new rects.
- **Workspaces:** 1 About, 2 Sessions, 3 Skills, 4 TRIAD, 5 Log. Each opens with its window(s).
- **Shortcuts** (also exposed as dock buttons for non-keyboard users):
  - `Super+Enter` — terminal
  - `Super+1..5` — switch workspace
  - `Super+P` — Display Switch window: re-themes desktop (Eva / Bebop / Omarchy)
  - `Super+Q` — close focused window
  - `Esc` — exit Omarchy Mode
  - `Ctrl` is accepted in place of `Super` for every shortcut.
- **Terminal commands:** `help`, `whoami`, `ls sessions`, `cat about.md`, `neofetch`, `open <n>` (opens a session window), `lang en|es`, `clear`, `exit`. Unknown commands print a friendly hint. Pure parser `runCommand(input, ctx) → output lines | action`.
- **Mobile (< 768 px):** one fullscreen window at a time; switch via dock or horizontal swipe.
- Exiting returns to normal mode at the same scroll position.

### TRIAD window (workspace 4)
- Visitor types a question (max 200 chars).
- Three hexagon cores answer **YES/NO** + one short sentence each:
  - **CORE·ENGINEER** — logical, technical.
  - **CORE·COWBOY** — laid-back, intuitive, Bebop vibe.
  - **CORE·STUDENT** — curious, the learning Pablo.
- The cores know Pablo's profile (§2) and can answer questions about him.
- Majority verdict animation: *"RESOLUTION: APPROVED 2–1"* / *"REJECTED 1–2"*.
- **Fallback:** on network error, timeout (8 s), rate limit (429) or invalid response, TRIAD answers from a local pool of pre-written answers and shows `LINK LOST — LOCAL MODE`. TRIAD never shows a broken state.

## 8. AWS architecture

All in one repo with **Amplify Gen 2** (`amplify/` folder), one deploy per `git push` to `main`.

```
Visitor ─▶ Amplify Hosting (global CDN, HTTPS) ─▶ static Astro site
             │
             └─ TRIAD ─▶ Lambda Function URL ─▶ Amazon Bedrock (Amazon Nova Lite)
                              │
                              └─▶ DynamoDB (per-IP usage counter, TTL)
```

- **Lambda `triad`** (Node.js 22, TypeScript) via `defineFunction`; Function URL with CORS restricted to the site's Amplify domain (and `localhost` in sandbox) added through the CDK escape hatch in `amplify/backend.ts`.
- **Request:** `POST { question: string, lang: "en"|"es" }`. **Response:** `{ cores: [{ id, vote: "YES"|"NO", line }] ×3, verdict: "APPROVED"|"REJECTED" }`.
- **One Bedrock call** (`Converse` API, Nova Lite, region `us-east-1`) with a system prompt containing the profile and the three personas; the model returns JSON; Lambda validates it and computes the verdict itself (never trusts a model-computed verdict). `maxTokens` 300.
- **Input guard:** trim, reject empty or > 200 chars (400).
- **Rate limit:** DynamoDB table `TriadUsage` (pk = hashed IP + hour bucket, TTL 2 h); max 10 requests per IP per hour → 429.
- **Concurrency:** reserved concurrency 5.
- **IAM least privilege:** `bedrock:InvokeModel` on the Nova Lite model/inference-profile ARNs only; `dynamodb:UpdateItem` on `TriadUsage` only.
- **Observability:** CloudWatch logs (no visitor question text logged beyond length) and metrics.
- **Cost guard:** AWS Budgets alert at USD 5/month (created once in the console, documented in the write-up).
- Bedrock model access for Nova Lite must be enabled in `us-east-1` before deploy.

## 9. Project layout

```
src/
  pages/index.astro
  layouts/Base.astro
  components/
    ui/                 # shadcn + own primitives (HudFrame, TitleCard, WantedPoster, SyncBar)
    sections/           # Hero, About, Skills, Sessions, MissionLog, Footer
    ascii/              # AsciiOctahedron.tsx, octahedron.ts
    omarchy/            # OmarchyMode.tsx, Boot.tsx, Desktop.tsx, TopBar.tsx, Window.tsx,
                        # tiling.ts, shortcuts.ts, terminal.ts, Triad.tsx, triadClient.ts, fallback.ts
  i18n/                 # en.ts, es.ts, index.ts
  data/                 # profile.ts, sessions.ts, skills.ts, log.ts
  styles/global.css
amplify/
  backend.ts
  functions/triad/      # resource.ts, handler.ts, prompt.ts, parse.ts, rateLimit.ts
tests/                  # Vitest unit tests; e2e/ for Playwright
docs/superpowers/specs/
```

## 10. Testing

- **Vitest (unit):** `octahedron.ts` (projection and ramp mapping), `tiling.ts` (rects cover the area, no overlap, 1–6 windows), `terminal.ts` (each command, unknown command), `shortcuts.ts` (key → action, Ctrl/Meta equivalence), Lambda `parse.ts` (valid JSON, malformed, missing cores, verdict computed by majority), `rateLimit.ts` (under/over limit with mocked DynamoDB), `triadClient.ts` (fallback on error/timeout/429), i18n dictionaries have identical keys.
- **Playwright (smoke):** page loads; nav anchors scroll to each section; language toggle switches copy; Omarchy Mode opens via hint and via `Ctrl+K`, `Super+Enter` opens terminal, `Esc` exits; at 390 px width there is no horizontal scroll.
- **Manual:** real phone check, live TRIAD call after deploy.

## 11. Schedule

| Date | Work |
|---|---|
| Oct 30–31 | Scaffold, visual system, ASCII hero, first Amplify deploy (live from day 1) |
| Nov 1–2 | About, Skills, Sessions, Mission Log, EN/ES toggle |
| Nov 3–4 | Omarchy Mode: boot, desktop, tiling, terminal, shortcuts |
| Nov 5 | TRIAD Lambda + Bedrock, rate limit, mobile polish |
| Nov 6 (early) | Screenshots, Builder Center write-up, submit |

## 12. Out of scope

Blog, CMS, analytics, contact form backend, audio playback, user accounts, custom domain (optional later if time remains).
