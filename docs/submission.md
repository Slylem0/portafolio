# SEE YOU SPACE BUILDER: a portfolio with a secret Hyprland desktop and three AI cores on Amazon Bedrock

**Live site:** https://main.dx1vkp1smlyu7.amplifyapp.com
**Code:** https://github.com/Slylem0/portafolio

## Intro

I'm Pablo Nicolás Marín, a Systems Engineering student at Universidad del Valle in Buga, Colombia. I'm an AWS Certified Cloud Practitioner and the Partnerships & Academy Lead of the AWS Student Builder Group Univalle. I like the parts of software nobody sees: backends, cloud and Linux. This portfolio is built to show that side of me.

## The creative feature: Omarchy Mode

**What it is.** At first glance the site is a portfolio styled like an Evangelion × Cowboy Bebop HUD, with About, Skills, Sessions (projects) and a Mission Log. Press the blinking **⚠ EMERGENCY — PRESS ⊞ SUPER** button, and the page plays an emergency boot sequence. Then it becomes a tiling desktop modeled on Omarchy and Hyprland, the setup I use every day. The desktop has:

- **Dwindle tiling:** each new window splits the last one, like Hyprland. Five workspaces: About, Sessions, Skills, TRIAD, Log.
- **A working terminal:** `help`, `whoami`, `ls sessions`, `cat about.md`, `neofetch`, `open <n>`, `lang en|es`, `clear`, `exit`.
- **Display Switch:** re-themes the desktop (Eva / Bebop / Omarchy). It's a nod to my open-source Omarchy plugin of the same name, which has 11 stars on GitHub.
- **TRIAD (workspace 4):** you ask a yes/no question and three AI cores vote. CORE·ENGINEER is logical, CORE·COWBOY is laid-back and CORE·STUDENT is curious. Each core gives YES or NO plus one line, and the site shows `RESOLUTION: APPROVED 2–1`. The cores run on **Amazon Nova Lite through Amazon Bedrock**, and they know my profile, so you can ask them about me. The verdict is computed in code from the votes, never by the model. If AWS can't be reached, TRIAD switches to a local answer pool and shows `LINK LOST — LOCAL MODE`, so it never breaks.

**How to find it.**

| Where | Key | What it does |
|---|---|---|
| Normal page | Click the hint, **Super**, or **Ctrl+K** / **Cmd+K** | Open Omarchy Mode |
| Desktop | **T** / **Enter** | Terminal |
| Desktop | **1–5** | Switch workspace |
| Desktop | **P** | Display Switch |
| Desktop | **Q** | Close window |
| Desktop | **Esc** | Exit back to the page, at the same scroll position |
| Phone | Dock buttons or horizontal swipe | One fullscreen window at a time |

**Why it's me.**

- I use Omarchy and Hyprland every day and write plugins for them, so a secret tiling desktop is how I'd want someone to explore my work.
- The Eva and Bebop styling is there because I'm a fan of both. All of it is original CSS and ASCII art, with no official assets.
- TRIAD is my first public Amazon Bedrock feature on my own site. Building it is part of preparing for my next goal, the AWS Certified AI Practitioner.

## Screenshots

<!-- Capture each image into docs/screenshots/ with the exact file name below. Delete this comment before posting. -->

| # | File | What to capture | Suggested caption |
|---|---|---|---|
| 1 | `docs/screenshots/01-hero-desktop.png` | Home page at 1280 px wide: ASCII octahedron, name, hint button | The landing page: an original ASCII octahedron and the emergency hint that leads to Omarchy Mode. |
| 2 | `docs/screenshots/02-sessions-desktop.png` | Sessions section with the wanted posters | Seven projects as Bebop-style wanted posters, each with its stack and links. |
| 3 | `docs/screenshots/03-mobile.png` | Home page on a phone (or DevTools at 390×844), menu open | Mobile at 390 px: no horizontal scroll, full navigation. |
| 4 | `docs/screenshots/04-boot.png` | The red emergency boot screen ("PATTERN DETECTED: BUILDER") | Pressing Super starts an emergency boot sequence. |
| 5 | `docs/screenshots/05-desktop-terminal.png` | Omarchy desktop with several tiled windows and a terminal after `neofetch` | Omarchy Mode: Hyprland-style dwindle tiling and a working terminal. |
| 6 | `docs/screenshots/06-display-switch.png` | The Display Switch window with the Bebop theme applied | Display Switch re-themes the desktop, a nod to my open-source Omarchy plugin. |
| 7 | `docs/screenshots/07-triad-online.png` | TRIAD showing three voted cores, the verdict banner and "LINK ACTIVE — AWS BEDROCK" | TRIAD: three cores answer through Amazon Nova Lite, and the verdict is computed in code. |
| 8 | `docs/screenshots/08-triad-offline.png` | TRIAD in "LINK LOST — LOCAL MODE" (DevTools → Network → Offline, then ask) | If the backend is unreachable, TRIAD answers from a local pool instead of breaking. |
| 9 | `docs/screenshots/09-amplify-build.png` | Amplify console: the `main` branch with a successful build (Backend + Frontend steps) | Every push to main deploys both the backend and the site through Amplify Hosting. |
| 10 | `docs/screenshots/10-lambda.png` | Lambda console: the `triad` function's Configuration → Function URL (CORS) and General configuration (Node.js 22, 15 s) | The TRIAD Lambda: Node.js 22 behind a Function URL that only accepts the site's origin. |
| 11 | `docs/screenshots/11-iam-policy.png` | IAM: the Lambda role's inline policy (InvokeModel + UpdateItem) | Least privilege: the function can call one model and update one table, nothing else. |
| 12 | `docs/screenshots/12-dynamodb.png` | DynamoDB: the `TriadUsage` table's items (hashed keys, `count`, `ttl`) | The rate limiter: one counter per hashed IP per hour, deleted by TTL. |
| 13 | `docs/screenshots/13-cloudwatch.png` | CloudWatch Logs: the triad log group with several JSON log lines | One structured line per request (status, length, latency), never the question text. |
| 14 | `docs/screenshots/14-bedrock-access.png` | Bedrock console: model access showing Amazon Nova Lite as granted in us-east-1 | Amazon Nova Lite enabled in us-east-1. |
| 15 | `docs/screenshots/15-budget.png` | AWS Budgets: the USD 5 monthly cost budget with its email alert | A USD 5/month budget alert as the final cost guard. |
| 16 | `docs/screenshots/16-lighthouse.png` | Lighthouse report for the live URL (desktop) | Lighthouse: performance, accessibility, best practices and SEO. |

## AWS architecture and services

```text
Visitor ─▶ Amplify Hosting (CDN, HTTPS) ─▶ static Astro site
              │
              └─ TRIAD ─▶ Lambda Function URL ─▶ Amazon Bedrock (Nova Lite, Converse)
                               │
                               ├─▶ DynamoDB (per-IP-per-hour counter, TTL)
                               └─▶ CloudWatch Logs (structured, no question text)

GitHub push to main ─▶ Amplify CI/CD: backend (ampx pipeline-deploy) ─▶ frontend build
```

Everything runs in **us-east-1**, and the backend is defined as code with Amplify Gen 2 and CDK.

| Service | What it does here | Why I chose it |
|---|---|---|
| **AWS Amplify Hosting** | Hosts the static site on a CDN with HTTPS. Each push to `main` deploys the backend first (`ampx pipeline-deploy`), then builds the frontend. | One pipeline and one repo for both front and back. |
| **AWS Lambda** | The `triad` function: Node.js 22, 15 s timeout. It is exposed through a Function URL, with CORS locked to the site origin and POST only. | Pay per request, and no API Gateway needed for a single endpoint. |
| **Amazon Bedrock** | Amazon Nova Lite via the Converse API, using the cross-region inference profile `us.amazon.nova-lite-v1:0`, with `maxTokens` 300. | It's fast and low-cost, which is enough for three short JSON answers. |
| **Amazon DynamoDB** | Rate limit of 10 questions per IP per hour. The key is an HMAC of the IP plus the hour, so no raw IPs are stored, and TTL deletes items after 2 h. | One atomic `UpdateItem` per request, on-demand billing, and nothing to clean up. |
| **AWS IAM** | The function's role allows `bedrock:InvokeModel` on the two Nova Lite ARNs and `dynamodb:UpdateItem` on the one table. | Least privilege by design. |
| **Amazon CloudWatch Logs** | One JSON line per request: status, question length, language, whether it retried, and latency. | Enough to debug, without keeping what people asked. |
| **AWS Budgets** | A USD 5/month alert. | A safety net under all the other limits. |

There are more limits in code:

- Questions are capped at 200 characters.
- The browser times out at 8 s.
- The function is set to reserved concurrency 5. New accounts have a Lambda limit of 10, so for now this is switched off with an environment variable, and the account-wide limit of 10 caps the function instead.

## How I built it

I worked the way I'd want a real project to run:

1. **Spec first.** I wrote a design spec that maps every decision to the challenge rubric. It covers what the creative feature is, which AWS services it uses and why, and what's out of scope. It also fixed the rules early: no official Eva/Bebop assets, and the verdict computed in code, never by the model.
2. **Plan.** I split the work into 14 small tasks, each with its files, tests and commit message, ordered so the site could be deployed after every task.
3. **TDD.** Pure logic was written test-first:
   - the octahedron renderer
   - dwindle tiling
   - shortcuts
   - the terminal parser
   - the Lambda's parser and rate limiter
   - the TRIAD client's fallbacks
4. **Review after every task.** Each task got a review pass against the spec, and the fixes went in before the next task started.
5. **Deploy continuously.** The site was live on Amplify from the first days, and the backend joined the same pipeline once TRIAD existed. Before wiring TRIAD to the main branch, I tested it on a personal `ampx sandbox` with real Bedrock calls: CORS from an allowed and a blocked origin, the 10-per-hour limit, and the log contents.

I built it with an AI coding agent (Claude Code), as the challenge's Day 2 guide suggests. I directed the design, made the calls, and checked every result.

## Challenges and what I learned

**1. The build image's Node was too old.**

- **Problem:** Amplify's build image shipped Node 22.18, but Astro 7 needs Node 22.23 or newer, so the first build failed.
- **Fix:** I pinned Node 24 with `nvm install 24 && nvm use 24` in `amplify.yml`, and in `.nvmrc`.
- **Lesson:** pin your runtime in the build spec. Don't trust the image default.

**2. `npm ci` failed on a lockfile out of sync.**

- **Problem:** after I added the backend dependencies, `package-lock.json` no longer matched `package.json`, and `npm ci` refused to install on Amplify.
- **Fix:** I re-synced the lockfile and confirmed a clean `npm ci` locally before pushing.
- **Lesson:** run `npm ci`, not `npm install`, locally before pushing.

**3. CDK bundling fell back to Docker.**

- **Problem:** the first backend deploy failed because CDK couldn't find a local esbuild, switched to Docker bundling, and broke there.
- **Fix:** I added `esbuild` as a dev dependency.
- **Lesson:** read the first warning in the log, not only the final error.

**4. A new account can't reserve Lambda concurrency.**

- **Problem:** I wanted reserved concurrency 5 as a cost cap. The deploy failed: the account's Lambda concurrency limit is 10, and Lambda requires 10 to stay unreserved.
- **Fix:** the code still sets 5 by default. The Amplify branch sets `TRIAD_RESERVED_CONCURRENCY=0` to skip it, so the account limit of 10 caps the function, with the per-IP rate limit on top. A quota increase restores the cap of 5.
- **Lesson:** new AWS accounts start with low service quotas. Check them before you design around them.

**5. Browsers swallow some shortcuts.**

- **Problem:** Ctrl+1..5 switches browser tabs, and Ctrl+Q can quit Firefox on Linux, so the page never sees those keys.
- **Fix:** plain keys (1–5, T, P, Q) work whenever you aren't typing in an input. The Ctrl/Super chords still work where the browser allows them, Esc is always the way out, and the dock gives mouse and touch users the same actions.
- **Lesson:** a web page doesn't own the keyboard, so always give users another way to trigger an action.

**6. About 10% of Nova replies weren't clean JSON.**

- **Problem:** in live tests, roughly one answer in ten couldn't be parsed.
- **Fix:** three layers:
  - a more tolerant parser
  - one retry at temperature 0.2, only when it can still finish inside the browser's 8 s budget
  - the offline fallback, so the visitor never sees an error
- **Lesson:** treat LLM output as untrusted input. Validate it, compute decisions in code, and design the failure path first.

**7. The first click could be lost.**

- **Problem:** a click on the hint before the page's JavaScript had hydrated did nothing.
- **Fix:** a small inline script records a "pending open" flag, and the Omarchy loader acts on it once it is ready.
- **Lesson:** with islands architecture, the interval before hydration is a real state, and it needs a test.

**8. The hero I started from wasn't mine to use.**

- **Problem:** the 21st.dev hero component I first liked embedded someone else's Unicorn Studio scene, and its code stripped the vendor's watermark.
- **Fix:** I wrote my own ASCII octahedron renderer: pure math for rotation, projection and shading, mapped to a character ramp and drawn on a canvas. The desktop wallpaper uses it too.
- **Lesson:** check the license and origin of every component you paste. Here, building my own also gave the site a more distinctive look.

## Results

- **Lighthouse** (production build, local preview):
  - desktop: Performance 99, Accessibility 100, Best Practices 100, SEO 100
  - mobile: Performance 95, Accessibility 100, Best Practices 100, SEO 100
- **Bundle:** about 100 KB of gzipped JavaScript on the normal page. The Omarchy Mode code loads only when you open it.
- **Tests:**
  - 106 Vitest unit tests
  - 43 Playwright end-to-end scenarios on desktop (1280×800) and mobile (390×844): 64 runs pass, and 22 are skipped on purpose because they only apply to one viewport
- **Backend behavior:**
  - On the sandbox, a Bedrock-backed answer took about 0.7–1.3 s.
  - The 11th request from one IP in an hour got a 429.
  - A request from a non-allowed origin got no CORS headers.
- **Accessibility:**
  - every control is reachable by keyboard with a visible focus outline
  - TRIAD results are announced to screen readers
  - `prefers-reduced-motion` turns off the flashing and smash cuts

## Links

- Live site: https://main.dx1vkp1smlyu7.amplifyapp.com
- Source code: https://github.com/Slylem0/portafolio
- My Omarchy plugin: https://github.com/Slylem0/omarchy-display-switch
- GitHub: https://github.com/Slylem0
- LinkedIn: https://www.linkedin.com/in/pablo-nicolas-marin

*SEE YOU SPACE BUILDER...*
