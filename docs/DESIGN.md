---
version: alpha
name: Jurepi-design-system
description: "A bright, friendly, playful design system for Jurepi (jurepi.kr) — a free online tools hub. Built on a cheerful violet brand (#6C5CE7) anchored by a palette of six accent colors (coral, mint, sky, sun, grape, rose) that act as per-tool / per-category identity tokens rather than decoration. Display type is Gmarket Sans set in 700 with tight line-heights (1.1–1.2); body/UI type is Pretendard at 500/600 with relaxed line-heights (1.5–1.6). Surfaces are pure white cards lifted by soft, brand-tinted shadows over a faint-lavender app ground (#F5F3FC), with generously rounded corners (16–28px) and accent-tinted icon tiles. The system reads as welcoming, low-friction, and consumer-friendly — every tool card feels like an inviting, tappable object, and motion (card lift, prize flip, ladder trace) clarifies play rather than decorating it. Light theme is the canonical mode; a dark theme is provided as an optional Phase 2 toggle."

colors:
  brand: "#6c5ce7"
  brand-strong: "#5a48d6"
  brand-soft: "#efeaff"
  on-brand: "#ffffff"
  bg: "#ffffff"
  surface: "#ffffff"
  surface-muted: "#f5f3fc"
  surface-sunken: "#eeeafa"
  hairline: "#ece9f7"
  hairline-strong: "#d8d3ee"
  text: "#1e1b3a"
  text-secondary: "#5c5780"
  text-muted: "#6f6a8f"
  accent-coral: "#ff7a85"
  accent-coral-soft: "#ffe7e9"
  accent-mint: "#2dd4bf"
  accent-mint-soft: "#d7f7f2"
  accent-sky: "#38bdf8"
  accent-sky-soft: "#ddf2fe"
  accent-sun: "#fbbf24"
  accent-sun-soft: "#fef1d2"
  accent-grape: "#a78bfa"
  accent-grape-soft: "#ece6fe"
  accent-rose: "#fb7185"
  accent-rose-soft: "#fee2e7"
  accent-mint-ink: "#0f766e"
  accent-sun-ink: "#92400e"
  semantic-success: "#22c55e"
  semantic-warning: "#f59e0b"
  semantic-danger: "#ef4444"
  semantic-info: "#3b82f6"
  focus-ring: "#6c5ce7"
  dark-bg: "#15131f"
  dark-surface: "#1e1b2e"
  dark-surface-muted: "#262238"
  dark-hairline: "#322c49"
  dark-hairline-strong: "#463e63"
  dark-text: "#f4f2ff"
  dark-text-secondary: "#b7b1d6"
  dark-text-muted: "#7e7799"
  dark-brand: "#8b7bff"
  dark-brand-strong: "#a294ff"
  dark-brand-soft: "#2a2545"

typography:
  display-xl:
    fontFamily: Gmarket Sans
    fontSize: 56px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -1.5px
  display-lg:
    fontFamily: Gmarket Sans
    fontSize: 40px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -1.0px
  headline:
    fontFamily: Gmarket Sans
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.4px
  card-title:
    fontFamily: Pretendard
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.2px
  body-lg:
    fontFamily: Pretendard
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: 0
  body:
    fontFamily: Pretendard
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: 0
  body-sm:
    fontFamily: Pretendard
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: Pretendard
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  button:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0
  eyebrow:
    fontFamily: Pretendard
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.6px

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  xxl: 28px
  pill: 9999px
  full: 9999px

spacing:
  hair: 1px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  ml: 20px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 12px 20px
  button-primary-hover:
    backgroundColor: "{colors.brand-strong}"
    textColor: "{colors.on-brand}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 12px 20px
  button-secondary:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 12px 20px
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 12px 20px
  tool-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.card-title}"
    rounded: "{rounded.xl}"
    padding: 20px
  tool-card-icon:
    backgroundColor: "{colors.accent-coral-soft}"
    textColor: "{colors.accent-coral}"
    rounded: "{rounded.lg}"
    padding: 12px
  category-pill:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
  category-pill-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
  badge-new:
    backgroundColor: "{colors.accent-mint-soft}"
    textColor: "{colors.accent-mint-ink}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  badge-popular:
    backgroundColor: "{colors.accent-sun-soft}"
    textColor: "{colors.accent-sun-ink}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  badge-soon:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.pill}"
    padding: 3px 8px
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  text-input-focused:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 10px 14px
  hero-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.xl}"
    padding: 16px 20px
  stepper:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.headline}"
    rounded: "{rounded.lg}"
    padding: 8px
  player-chip:
    backgroundColor: "{colors.accent-coral-soft}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 6px 14px
  prize-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px
  prize-card-hidden:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-muted}"
    typography: "{typography.headline}"
    rounded: "{rounded.md}"
    padding: 12px
  toast:
    backgroundColor: "{colors.text}"
    textColor: "{colors.on-brand}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 12px 16px
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.xxl}"
    padding: 24px
  ad-slot:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.lg}"
    padding: 0px
  top-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    height: 64px
  footer:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.xs}"
    padding: 48px 24px
---

## Overview

Jurepi's canvas is the inverse of an enterprise dark system: it is **light, warm, and playful by default**. The page ground is pure white (`{colors.bg}`) with sections lifting onto a faint-lavender `{colors.surface-muted}`; cards are white objects raised by **soft, brand-tinted shadows** rather than borders or dark surface steps. The chrome is anchored by one cheerful violet brand (`{colors.brand}`), and the system is held together by a **palette of six accent colors** — coral, mint, sky, sun, grape, rose — that signal which **tool or category** a card belongs to, exactly the way an enterprise system might use per-product accents, but warm and consumer-friendly instead of technical.

Display type is **Gmarket Sans** at 700 with tight line-heights (1.1–1.2) — a rounded, friendly Korean+Latin face that gives headings character without shouting. Body and UI type is **Pretendard** at 500/600 with relaxed line-heights (1.5–1.6); Pretendard carries both Korean and Latin cleanly, which matters for a bilingual (ko/en) product. The pairing is deliberate: a rounded display voice for personality, a neutral humanist sans for everything readable.

The signature device is the **tool-card** — a white, generously rounded (`{rounded.xl}` 20px) tappable object with an **accent-tinted icon tile** at top-left. Each card's accent comes from its tool's category, so a visitor scanning the grid reads color as meaning: coral = random/draw, mint = text, sky = converters, sun = calculators, grape = date/time, rose = fun. Cards lift on hover, press down slightly on tap, and the whole surface is the click target. The same accent system extends into the Ladder Game: each player gets an accent, their trace line is drawn in it, and the prize they land on flips to that accent face.

**Key Characteristics:**
- Light-first, white-card system: `{colors.bg}` ground, `{colors.surface}` cards, `{colors.surface-muted}` lavender sections — never dark by default.
- **Per-tool / per-category color identity**: coral, mint, sky, sun, grape, rose — each with a saturated value and a `*-soft` tint used for icon tiles, chips, and reveal faces.
- One playful violet brand (`{colors.brand}`) for all primary actions, links, and focus — accents never replace the brand for CTAs.
- Display runs Gmarket Sans 700 (tight 1.1–1.2); body runs Pretendard 500/600 (relaxed 1.5–1.6) — the rounded-display / neutral-body contrast is the brand voice.
- Generously rounded corners (`{rounded.lg}`–`{rounded.xxl}`, 16–28px) and **soft brand-tinted shadows** carry depth — no hard borders-as-elevation, no flat gray boxes.
- Motion clarifies play: cards lift, prize cards flip, ladder traces draw — all on compositor-friendly properties, all gated by `prefers-reduced-motion`.
- Eyebrow typography (12px, 700, 0.6px tracking, uppercase) marks hero and section openers.

## Colors

### Brand & Action
- **Brand Violet** (`{colors.brand}`): Primary CTAs, links, active pills, focus rings, the wordmark. The single action color across the whole product.
- **Brand Strong** (`{colors.brand-strong}`): Hover / pressed state of brand surfaces.
- **Brand Soft** (`{colors.brand-soft}`): Focus halos, active-card border tint, light brand washes.
- **On-Brand** (`{colors.on-brand}`): White text/icons on brand-filled surfaces.

### Surface
- **Background** (`{colors.bg}`): Default page ground — pure white.
- **Surface** (`{colors.surface}`): Cards, inputs, nav — also white, separated from the ground by shadow, not color.
- **Surface Muted** (`{colors.surface-muted}`): Faint lavender — app sections, filter pills, hidden prize cards, footer, ad-slot placeholder.
- **Surface Sunken** (`{colors.surface-sunken}`): One step deeper than muted — pressed pills, track of toggles.
- **Hairline** (`{colors.hairline}`): 1px borders on cards and dividers — felt, not loud.
- **Hairline Strong** (`{colors.hairline-strong}`): Ladder vertical lines and rungs; stronger dividers.

### Text
- **Text** (`{colors.text}`): Primary text — a deep indigo-near-black (#1e1b3a), warmer than pure black.
- **Text Secondary** (`{colors.text-secondary}`): Descriptions, secondary labels.
- **Text Muted** (`{colors.text-muted}`): Captions, placeholders, disabled, "준비중".

### Per-Accent Identity (signature)
Jurepi isn't held together by a single accent — it's held together by a system of category accents, each used to mark which kind of tool a card represents. Each accent ships as a **saturated value** (icon glyph, trace line, badge text) and a **`*-soft` tint** (icon tile background, chip background, reveal face).

- **Coral** (`{colors.accent-coral}` / `{colors.accent-coral-soft}`): 랜덤·추첨 (random/draw) — the Ladder Game's home category.
- **Mint** (`{colors.accent-mint}` / `{colors.accent-mint-soft}`): 텍스트 (text tools).
- **Sky** (`{colors.accent-sky}` / `{colors.accent-sky-soft}`): 변환 (converters).
- **Sun** (`{colors.accent-sun}` / `{colors.accent-sun-soft}`): 계산기 (calculators).
- **Grape** (`{colors.accent-grape}` / `{colors.accent-grape-soft}`): 날짜·시간 (date/time).
- **Rose** (`{colors.accent-rose}` / `{colors.accent-rose-soft}`): 재미 (fun/misc).

### Semantic
- **Success** (`{colors.semantic-success}`): Copy-done toasts, positive confirmations.
- **Warning** (`{colors.semantic-warning}`): Caution; also the text color for the "인기" badge on sun-soft.
- **Danger** (`{colors.semantic-danger}`): Error toasts, destructive confirmations.
- **Info** (`{colors.semantic-info}`): Neutral information.

### Dark Theme (optional, Phase 2)
Dark is NOT the launch default. When the theme toggle is set to dark, swap to the `dark-*` token set: ground `{colors.dark-bg}`, cards `{colors.dark-surface}`, text `{colors.dark-text}`, brand `{colors.dark-brand}`. Accent **glyph** values lift ~8% lightness; accent **tints** become low-alpha overlays of the accent over the dark surface rather than the pastel `*-soft` values.

## Typography

### Font Families

- **Gmarket Sans** — display face for headings and the Jurepi wordmark. Rounded, friendly, supports Korean + Latin. Used at 700 only. Free for commercial use.
- **Pretendard (Variable)** — the body/UI workhorse. Neutral humanist sans with excellent Korean + Latin coverage; weights 500 (body) and 600 (buttons/emphasis). Fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

The pairing is intentional: Gmarket Sans gives personality at large sizes; Pretendard keeps everything readable and bilingual at small sizes. Do not introduce a third family.

### Hierarchy

| Token | Family | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|---|
| `{typography.display-xl}` | Gmarket Sans | 56px | 700 | 1.1 | -1.5px | Home hero H1 (scales via clamp on mobile) |
| `{typography.display-lg}` | Gmarket Sans | 40px | 700 | 1.15 | -1.0px | Tool page H1 |
| `{typography.headline}` | Gmarket Sans | 24px | 700 | 1.2 | -0.4px | Section headings, stepper value |
| `{typography.card-title}` | Pretendard | 17px | 700 | 1.3 | -0.2px | Tool card title |
| `{typography.body-lg}` | Pretendard | 18px | 500 | 1.6 | 0 | Hero subhead, lead body, search field |
| `{typography.body}` | Pretendard | 16px | 500 | 1.55 | 0 | Default body, inputs |
| `{typography.body-sm}` | Pretendard | 14px | 500 | 1.5 | 0 | Card description, footer, toasts |
| `{typography.caption}` | Pretendard | 13px | 500 | 1.4 | 0 | Meta, copyright, ad label |
| `{typography.button}` | Pretendard | 15px | 600 | 1.2 | 0 | Buttons, pills, chips |
| `{typography.eyebrow}` | Pretendard | 12px | 700 | 1.2 | 0.6px | Uppercase eyebrows, badges |

### Principles

- **Rounded display, neutral body.** Gmarket Sans carries headings and the wordmark; Pretendard carries everything readable. The contrast IS the voice.
- **Tight on display, relaxed on body.** Display line-heights sit at 1.1–1.2; body lifts to 1.5–1.6.
- **Hero H1 uses clamp.** `clamp(32px, 6vw, 56px)` so the playful headline scales gracefully to mobile without a separate token.
- **Eyebrow is the section opener.** Uppercase, 0.6px tracking, brand-colored — used above the hero headline and major sections.
- **One H1 per page.** Home → "필요한 도구, 전부 무료로."; tool page → the tool name.

## Layout

### Spacing System
- **Base unit**: 4px. Increments 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64.
- **Tokens**: `{spacing.hair}` 1px · `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.ml}` 20px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 64px.
- Tool-card interior padding: `{spacing.ml}` 20px. Grid gap: `{spacing.ml}` 20px.
- Section vertical rhythm: `{spacing.xxl}`–`{spacing.section}` (48–64px) between major bands.
- Button padding: 12px vertical · 20px horizontal on `{components.button-primary}`.

### Grid & Container
- Max content width **1120px**, centered; side gutters scale `{spacing.lg}` 24px desktop → `{spacing.md}` 16px mobile.
- **Tool card grid**: 4-up ≥1024px, 3-up 768–1023px, 2-up 480–767px, 1-up <480px.
- Ladder setup: two columns (참가자 / 결과) side by side ≥768px, stacked below.

### Whitespace Philosophy
White IS the system's breathing room. Sections separate by lifting onto `{colors.surface-muted}` lavender, not by heavy rules. Within a band, generous `{spacing.ml}` 20px gaps separate cards; cards themselves are airy with 20px padding. The hero is deliberately spacious — a big rounded headline, one line of subhead, and a prominent search field.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 (flat) | No shadow, sits on `{colors.bg}` | Display type, hero copy, section headings |
| 1 (soft lift) | `{colors.surface}` + `0 2px 8px rgba(108,92,231,0.08)` (`--shadow-card`) | Default tool cards, setup card, inputs at rest |
| 2 (hover lift) | translateY(-4px) + `0 10px 28px rgba(108,92,231,0.18)` (`--shadow-card-hover`) | Hovered tool cards |
| 3 (pop) | `0 16px 40px rgba(108,92,231,0.22)` (`--shadow-pop`) | Modals, toasts, consent sheet |

Elevation is expressed by **soft brand-tinted shadow**, never by darkening a surface or thickening a border. Shadows carry a faint violet tint (not neutral gray) so depth feels warm and on-brand.

### Decorative Depth
- **Hero blobs**: large, low-opacity accent shapes (`{colors.accent-*}` at ~12% alpha) behind the hero, pure CSS, `pointer-events: none`. Static by default; any drift animation is disabled under `prefers-reduced-motion`.
- **Accent icon tiles**: each tool card's 48px icon tile uses its accent `*-soft` background with the saturated accent glyph — a small but constant hit of color identity.
- **1px hairlines** (`{colors.hairline}`) define inner dividers and the nav underline — present but quiet.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Nav underline, tiny rules |
| `{rounded.sm}` | 8px | Inner chips, small inset elements |
| `{rounded.md}` | 12px | Text inputs, prize cards, small buttons |
| `{rounded.lg}` | 16px | CTA buttons, icon tiles, stepper, ad slot |
| `{rounded.xl}` | 20px | Tool cards, hero search field |
| `{rounded.xxl}` | 28px | Modals, consent sheet, hero panels |
| `{rounded.pill}` | 9999px | Filter pills, badges, player chips |
| `{rounded.full}` | 9999px | Avatars / circular controls (rare) |

### Illustration & Icon Geometry
- Icons: **lucide-react**, 24px default (20px in dense UI), stroke-width 1.75, `currentColor`.
- Tool icon glyphs sit inside `{rounded.lg}` 16px accent-soft tiles.
- The ladder is rendered as crisp **SVG** with rounded line caps; trace lines are 4px, ladder structure 3px.
- Empty-state and 404 use a friendly rounded illustration style consistent with the rounded display face.

## Components

### Buttons

**`button-primary`** — Violet rounded CTA. The single primary action on any screen ("사다리 만들기", "전체 결과 보기").
- Background `{colors.brand}`, text `{colors.on-brand}`, type `{typography.button}`, rounded `{rounded.lg}`, padding 12px 20px.
- Hover → `button-primary-hover` (`{colors.brand-strong}`) + translateY(-1px); press → scale(0.99); disabled → opacity 0.5.

**`button-secondary`** — Lavender rounded button. Secondary actions ("다시 섞기", "처음으로").
- Background `{colors.surface-muted}`, text `{colors.text}`, 1px border `{colors.hairline}`, rounded `{rounded.lg}`, padding 12px 20px. Hover → border `{colors.brand-soft}`.

**`button-ghost`** — Text-forward button on white. Tertiary ("설정", "더보기").
- Background `{colors.surface}`, text `{colors.brand}`, rounded `{rounded.lg}`.

### Cards & Containers

**`tool-card`** — The hub's hero object. White, rounded, soft-lifted, fully tappable.
- Background `{colors.surface}`, text `{colors.text}`, title type `{typography.card-title}`, rounded `{rounded.xl}`, padding 20px, 1px border `{colors.hairline}`, shadow `--shadow-card`, min-height 150px.
- Contains `tool-card-icon` (top-left), title, 2-line description (`{typography.body-sm}` `{colors.text-secondary}`), and optional badge (top-right).
- Hover (live tools): translateY(-4px) + `--shadow-card-hover` + border `{colors.brand-soft}`, 200ms `--ease-out`. Press: translateY(-1px) scale(0.99). Focus-visible: 2px `{colors.focus-ring}` ring, offset 2px.
- `coming_soon`: opacity 0.7, no hover lift, cursor default, `badge-soon`.

**`tool-card-icon`** — 48px accent-tinted icon tile.
- Background = the card's accent `*-soft` token; glyph color = the saturated accent; rounded `{rounded.lg}`. Shown here with the coral variant; **swap both tokens to the card's accent** (mint, sky, sun, grape, rose).

**`modal`** — Centered dialog / clipboard-fallback / settings.
- Background `{colors.surface}`, rounded `{rounded.xxl}` 28px, padding 24px, shadow `--shadow-pop`, backdrop `rgba(30,27,58,0.4)`.

### Inputs & Forms

**`text-input`** + **`text-input-focused`** — Player/prize labels, contact fields.
- Background `{colors.surface}`, text `{colors.text}`, type `{typography.body}`, 1px border `{colors.hairline}`, rounded `{rounded.md}`, padding 10px 14px.
- Focused: border `{colors.brand}` + 3px `{colors.brand-soft}` ring. Min 44px tap height on touch.

**`hero-search`** — Prominent search field in the hero.
- Background `{colors.surface}`, type `{typography.body-lg}`, rounded `{rounded.xl}`, padding 16px 20px, leading search icon, shadow `--shadow-card`. 56px tall.

**`stepper`** — Player-count control (2–10).
- White surface, rounded `{rounded.lg}`, − / + buttons 40px, value in `{typography.headline}`; buttons disable at bounds.

### Pills, Chips & Badges

**`category-pill`** / **`category-pill-active`** — Home category filter row.
- Inactive: `{colors.surface-muted}` / `{colors.text-secondary}`. Active: `{colors.brand}` / `{colors.on-brand}`. Both rounded `{rounded.pill}`, padding 8px 16px. Row scrolls horizontally with snap on mobile.

**`player-chip`** — Clickable player label above the ladder.
- Accent-tinted (`*-soft` background, `{colors.text}` label), rounded `{rounded.pill}`. Shown with coral; **each chip uses its player's assigned accent**. Revealed → accent border + check glyph.

**`badge-new` / `badge-popular` / `badge-soon`** — Card status markers.
- NEW = mint-soft/mint; 인기 = sun-soft/warning; 준비중 = muted. All `{typography.eyebrow}`, rounded `{rounded.pill}`.

### Ladder-Specific

**`prize-card`** / **`prize-card-hidden`** — Bottom result cards that flip to reveal.
- Hidden: `{colors.surface-muted}` with a large "?" (`{typography.headline}` `{colors.text-muted}`). Revealed: flips (rotateY 300ms) to a face tinted with the landing player's accent and the label in `{typography.button}`.

### Feedback

**`toast`** — Transient confirmation/error.
- Background `{colors.text}` (dark pill on light UI), text `{colors.on-brand}`, type `{typography.body-sm}`, rounded `{rounded.md}`, shadow `--shadow-pop`. Bottom-center mobile / bottom-right desktop. Success accented with `{colors.semantic-success}` leading dot; error with `{colors.semantic-danger}`.

### Advertising

**`ad-slot`** — AdSense container.
- Background `{colors.surface-muted}` placeholder (dev only), `{colors.text-muted}` "광고" label, rounded `{rounded.lg}`. **CRITICAL: reserve fixed height** (leaderboard 90px, in-content ≥250px, footer 90px) to protect CLS < 0.1. Renders the `<ins>` only after ad consent; collapses to empty (no placeholder) in production if unfilled.

### Navigation & Footer

**`top-nav`** — Sticky white bar, 64px, with the Jurepi wordmark left and search / locale / theme controls right. 1px bottom `{colors.hairline}`; on scroll, background alpha 0.8 + `backdrop-filter: blur(8px)`. No hamburger needed — controls are compact icons.

**`footer`** — `{colors.surface-muted}` band, padding 48px 24px. Wordmark + tagline, link columns (소개/개인정보/약관/문의), locale switch, and "© 2026 Jurepi · 모든 도구는 무료입니다." in `{typography.caption}`.

## Do's and Don'ts

### Do
- Keep `{colors.bg}` white as the ground and lift cards with **soft brand-tinted shadow** (`--shadow-card`), not borders or dark surfaces.
- Use a tool's **category accent** consistently — for its `tool-card-icon` tile, its badge tint, and (in the Ladder Game) its player trace + reveal face.
- Reserve `{colors.brand}` violet for **actions and identity** (CTAs, links, focus, wordmark). One action color everywhere.
- Pair Gmarket Sans display (700, tight) with Pretendard body (500/600, relaxed). The rounded-vs-neutral contrast is the voice.
- Round generously — `{rounded.xl}` 20px on cards, `{rounded.xxl}` 28px on modals. Playful means soft corners.
- Give every interactive element a designed hover, press, and focus-visible state; keep touch targets ≥ 44px.
- Reserve fixed height on every `ad-slot` and gate ads/analytics behind consent.
- Honor `prefers-reduced-motion` on hero blobs, card lift, prize flip, and ladder traces.

### Don't
- Don't ship a dark-by-default page. Jurepi is light-first; dark is an optional Phase 2 toggle.
- Don't use a category accent as a **CTA color**. Accents are identity; the brand violet is action. A coral "사다리 만들기" button is a violation.
- Don't pile multiple saturated accents into one viewport as decoration — accent = "this is THAT kind of tool/player", and mixing it noisily breaks the signal.
- Don't square off corners or use hard 1px borders as the primary elevation device — that reads as a default template, not Jurepi.
- Don't introduce a third font family or use Gmarket Sans for long body text (it's a display face).
- Don't place an ad above the H1 or inside the interactive ladder board, and never let an unfilled ad shift layout.
- Don't use pure black (#000) text — use `{colors.text}` (#1e1b3a), the warm indigo-near-black.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | 0–479px | 1-up card grid; full-width CTAs; ladder setup columns stack; search opens as overlay; hero H1 clamps toward 32px |
| Mobile-Lg | 480–767px | 2-up card grid |
| Tablet | 768–1023px | 3-up card grid; inline hero search; ladder setup two-column |
| Desktop | 1024px+ | 4-up card grid; 1120px max container, centered |

### Touch Targets
- Buttons, player chips, prize cards, and inputs hold ≥ 44px tap height on touch viewports.
- Category pills grow vertical padding slightly on touch; the row swipes horizontally with snap.

### Collapsing Strategy
- **Nav**: stays a single compact bar at all sizes (icon controls only) — no hamburger.
- **Card grid**: 4-up → 3-up (1024) → 2-up (768) → 1-up (480).
- **Ladder setup**: 참가자 / 결과 columns side-by-side ≥768px → stacked below.
- **Ladder board**: columns keep ≥ 44px gap; with >7 players on very narrow screens the SVG scrolls horizontally rather than crushing columns.
- **Display type**: hero H1 uses `clamp(32px, 6vw, 56px)`; tool H1 `clamp(28px, 5vw, 40px)`.
- **Toasts**: bottom-right on desktop → bottom-center on mobile.

### Motion Behavior
- All motion uses transform / opacity / clip-path / stroke-dashoffset (compositor-friendly): card lift, prize flip (rotateY), ladder trace (stroke-dashoffset), pill/blob fades.
- `--ease-out` = cubic-bezier(0.16, 1, 0.3, 1); durations 150 / 250 / 350ms.
- Under `prefers-reduced-motion`, transforms and dash-draw are dropped: ladder paths render instantly, prize faces cross-fade, cards change shadow without translate.

## Iteration Guide

1. Focus on ONE component at a time and reference it by its `components:` token name.
2. When adding a tool, FIRST decide its category → that fixes its accent token. Apply the accent only to the icon tile, badge tint, and any per-tool identity surface — never to the CTA.
3. Default body to `{typography.body}` (Pretendard 500); reach for Gmarket Sans only at `{typography.headline}` and above.
4. Express elevation with the three shadow levels (`--shadow-card` / `-hover` / `--shadow-pop`), not by darkening surfaces.
5. Keep the brand violet as the only action/identity color; if you find yourself coloring a button with an accent, step back.
6. Run `npx @google/design.md lint DESIGN.md` after edits to validate token references.
7. Verify brand-violet-on-white and text-on-accent contrast meets WCAG AA (≥ 4.5:1 body, ≥ 3:1 large) whenever you introduce a new pairing.
8. Treat the six accents as identity tokens, not a rainbow — one accent per card, one per player.

## Known Gaps

- Dark theme tokens (`dark-*`) are provided but the dark mode is intentionally a Phase 2 toggle; its accent-tint treatment (low-alpha overlays vs pastel `*-soft`) needs a dedicated pass before shipping.
- Only the coral variant of `tool-card-icon` and `player-chip` is written as a formal entry; the mint / sky / sun / grape / rose variants follow the identical structure with their accent + `*-soft` token pair.
- Illustration style (empty state, 404, hero blobs) is described in prose; exact assets are not yet specified.
- AdSense ad unit visual treatment beyond the reserved container is governed by Google; only the slot wrapper is defined here.
- Form error/validation styling for the contact page is light at launch (inline message in `{colors.semantic-danger}`); expand if the form grows.
