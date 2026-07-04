# Jurepi · Free Online Tools Hub

<sub>**English** · [한국어](README.md)</sub>

> **Handy tools, all free.** — [apps.jurepi.kr](https://apps.jurepi.kr)

Jurepi is a free online tool collection you pick from a card-grid dashboard.
It's a **static site (SSG) built on the Next.js 15 App Router**, runs with no backend or database,
and every tool has its own indexable URL.

Two tools are live today:

- **Ghost Leg (사다리타기)** — a statistically *proven-fair* draw (each participant's odds are exactly `1/N`, regardless of starting position)
- **Q&A a Day (1일 1질문)** — answer one daily question in a local journal stored only in your browser

---

## 🧭 About

> **Why it exists** — As the gap in access to AI's benefits keeps widening, we wanted to use that
> technology to build tools that genuinely help everyone who visits — completely **free**.
> Tell us what tool or feature you need, and we'll build it and add it, one at a time.

Jurepi is a **free online tool collection you use instantly, with no login or install**. Most visitors
arrive via search or mobile to finish "one specific task" and move on — e.g., settling order/winners
fairly with Ghost Leg, or keeping a short daily record with Q&A a Day.

The home is a **card-grid dashboard** for discovery, and each tool is an **interactive app mounted on a
static (SSG) page** with its own indexable URL. There is no backend, database, or account; user data
(journal entries, theme, etc.) stays **only in the browser (localStorage)**.

- **Frictionless** — use it the moment you land; share results by URL
- **Discoverable** — each tool has its own URL, metadata, and JSON-LD (search traffic is the growth engine)
- **Usability first** — full keyboard operation, screen readers, `prefers-reduced-motion` respected (targets WCAG 2.1 AA)
- **Extensible** — a new tool = one registry entry + a module (no dashboard redesign)

Korean (default) and English are supported; each locale is routed under a `/ko`, `/en` prefix.

---

## ✨ Features

- **Tool dashboard** — registry-driven card grid, category filter, global search
- **Ghost Leg game** — draws a uniform permutation first and realizes it as a ladder, so each participant's
  winning odds are exactly `1/N` regardless of starting position (no center bias — the "ugly truth" is excluded)
- **Q&A a Day** — a local date-engine-driven 365-question bank with an immutable journal, stats, and calendar, stored only in the browser
- **i18n** — Korean (default) / English, locale-prefix routing (`/ko`, `/en`)
- **Accessibility** — full keyboard operation, `aria-live` result announcements, `prefers-reduced-motion` fallbacks, targets WCAG 2.1 AA
- **Performance** — static shell + reserved ad-slot height to hold CWV targets (LCP < 2.5s · CLS < 0.1)
- **Extensibility** — a new tool = registry entry + messages + module (no dashboard redesign)

## 🧱 Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Next.js 15 (App Router, React 19), TypeScript 5 (strict) |
| Rendering | SSG (`generateStaticParams`) · static export (`output: 'export'`), Server Components by default |
| Styling | Tailwind CSS v4 + CSS custom-property tokens (`src/styles/tokens.css` ↔ `docs/DESIGN.md`) |
| i18n | next-intl v3 (`ko`/`en`, `localePrefix: "always"`) |
| Icons | lucide-react |
| Testing | Vitest + Testing Library (unit/component), Playwright (E2E) |
| Monetization | Google AdSense · GA4 + Google Consent Mode *(optional)* |

The data layer is compile-time TypeScript modules (`src/tools/registry.ts`); there is **no server, DB, or first-party API.**
User settings (theme/consent) are stored only in `localStorage`.

## 🏛 Architecture — Clean Architecture

Dependencies always point **inward**; business rules are protected from frameworks.

```
Frameworks & Drivers   app/, next-intl runtime, Tailwind, AdSense, localStorage
  └ Interface Adapters  React components/hooks, lib/seo, storage adapters
      └ Use Cases       pure reducers (state machines), selectors, search/consent flows
          └ Domain      ladder fairness engine, registry types/invariants (no react/next)
```

- The **domain** (`src/lib/ladder.ts`, `src/lib/ladder-reducer.ts`) is pure functions that never import `react`/`next`/DOM;
  RNG is injected so tests reproduce deterministically.
- For the full layer mapping, see `.claude/skills/clean-architecture/`.

## 🚀 Getting Started

### Requirements
- Node.js **22** (pinned via `.nvmrc`)
- pnpm 9+ *(or npm/yarn)*

### Install & Run

```bash
pnpm install
cp .env.example .env.local   # fill values (all optional / client-safe)
pnpm dev                     # dev server → http://localhost:3000/ko
```

> The root `/` → `/ko` redirect is production-only (`public/_redirects`). In dev, go to `/ko`.

### Environment Variables

All variables are `NEXT_PUBLIC_*` (client-safe) and **not secrets.**

| Variable | Required | Description |
|----------|:---:|------|
| `NEXT_PUBLIC_SITE_URL` | ✅ | Absolute base URL for canonical/sitemap/OG |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⬜ | AdSense publisher ID (loads the loader when set; GDPR handled by Google Consent Mode/CMP) |
| `NEXT_PUBLIC_GA_ID` | ⬜ | GA4 measurement ID (loads when set; `analytics_storage` governed by Consent Mode) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | ⬜ | Default locale on `/` entry (defaults to `ko`) |

## 📜 Scripts

| Command | Description |
|---------|------|
| `pnpm dev` | Dev server |
| `pnpm build` | Production static build → `out/` (`output: 'export'`) |
| `npx serve out` | Local preview of the static build (`next start` is incompatible with `output: 'export'`) |
| `pnpm lint` | ESLint (next/core-web-vitals) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit/component tests (Vitest, single run) |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm test:coverage` | Coverage |
| `pnpm exec playwright test` | E2E (auto-builds + starts the server) |

## ✅ Testing & Quality

Developed test-first (TDD). The domain layer is pure functions with no `react`/`next` dependency,
reproduced deterministically in tests via injected RNG.

- **Unit/component** — 751 tests pass (Vitest), domain 100% / application layer ≥80% target
- **Fairness** — chi-square goodness-of-fit for `N∈{2..10}`, large-scale simulation verifying uniform reach to every column
- **Design-token gate** — every color utility class is checked to resolve to a real token (prevents "missing token = transparent render")
- **E2E** — Playwright (Ghost Leg full game/display modes/edge counts, Q&A persistence, i18n/keyboard/reduced-motion)
- **Performance** — CWV targets (LCP < 2.5s · CLS < 0.1); reserved ad-slot height blocks layout shift

> Cross-browser (Firefox/WebKit) and detailed axe a11y scans are planned to expand in CI.

## 📂 Project Structure

```
src/
├── app/                 # App Router (layout, [locale], tools/[slug], sitemap/robots/manifest)
├── components/
│   ├── ui/              # Primitives (Button, TextInput, Toggle, Stepper, Modal, Toast, Badge)
│   ├── layout/          # Header·Footer·theme toggle·locale switcher·global search
│   ├── home/            # Dashboard (Hero·search·category filter·tool card grid)
│   ├── consent/         # Ad/analytics consent (Google Consent Mode)
│   ├── legal/           # Privacy·terms·contact prose pages
│   ├── analytics/       # GA4·AdSense loaders (Google Consent Mode)
│   └── tools/
│       ├── ladder/      # Ghost Leg (Setup·Board(SVG)·PlayerHeader·PrizeCards ...) + useLadder
│       └── qna-a-day/   # Q&A a Day (Today·Calendar·Journal·Settings tabs) + useDailyJournal
├── lib/                 # Domain: ladder engine·reducer · qna-a-day date/journal engine · consent · seo · search
├── hooks/               # Global hooks (useReducedMotion · useToolSearch) — tool hooks are co-located per module
├── tools/               # Tool registry + types (single source)
├── i18n/                # next-intl routing + ko/en messages
└── styles/              # tokens.css (mirror of DESIGN.md)

docs/                    # SPEC · DESIGN system (requirements single source)
```

## ➕ Adding a Tool

1. Add a `ToolMeta` entry to `src/tools/registry.ts`
2. Add `tools.<id>.*` copy to `src/i18n/messages/{ko,en}.json`
3. If `live`, add a `src/components/tools/<id>/` module + a branch in `tools/[slug]/page.tsx`

> A `coming_soon` tool shows a "coming soon" card from the registry entry alone.

### Adding an entry to a content tool (zero code changes)

Markdown-collection tools (New Word Glossary, Rankings, Bookmarks, **Developer People Dictionary**)
only need a markdown pair (`<slug>.md` + `<slug>_en.md`): rebuild and the hub card, detail (spoke)
page, and sitemap all follow automatically. Each tool ships with a Claude Code **skill** that
encapsulates the whole procedure — just ask in natural language.

```text
# In Claude Code — the dev-people-author skill triggers automatically and handles
# fact verification → photo licensing (Commons PD/CC) → markdown pair → validation → deploy
Add Alan Turing to the people dictionary
```

📖 **[Developer People Dictionary tool docs → `docs/services/dev/dev-people/README.md`](docs/services/dev/dev-people/README.md)**
— content pipeline, skill usage examples, manual authoring guide, and content principles
(fact verification, photo licensing).

## 🤖 Development Harness

This repo includes an agent team (7) and skills (8) under `.claude/` that enforce **Clean Architecture + TDD**.
The build team (`architect` · `domain-engineer` · `ui-engineer` · `platform-engineer` · `qa-integration`) and
specialists (`seo-geo-engineer` · `deploy-engineer`) are coordinated by the orchestrator skill `jurepi-build`.

📖 For the full composition, workflow, and non-negotiable gates, see **[the Development Harness doc → `docs/HARNESS.en.md`](docs/HARNESS.en.md)**.

## 🌐 Deploy

**Deploy = `git push` (production branch `main`).** Cloudflare Workers Builds (Git-connected) detects the push and
**automatically runs** `pnpm build` + `wrangler deploy` inside the CF pipeline — you do not run `wrangler deploy`
locally. Changes on a feature branch/worktree must be merged into `main` to be included in a deploy.

Because of static export (`output: 'export'`), `next.config`'s `headers()` and `src/middleware` do not run, so
the equivalents are moved to these files (copied into `out/` at build time):

- `public/_headers` — security headers (HSTS · X-Content-Type-Options · Referrer-Policy, etc.)
- `public/_redirects` — root `/` → default locale `/ko`

> **Verify the deploy:** after pushing, wait for the CF build to finish (tens of seconds to a few minutes), then
> `curl -I https://apps.jurepi.kr` to confirm security headers · `/`→`/ko` · locale 200 · unknown path 404.
> Local pre-check: `serve out` / `wrangler dev`. `NEXT_PUBLIC_*` are public (non-secret), committed in
> `.env.production` and inlined at build. Details: [Development Harness doc](docs/HARNESS.en.md).

## 📄 License

[MIT](LICENSE) © 2026 Jurepi
