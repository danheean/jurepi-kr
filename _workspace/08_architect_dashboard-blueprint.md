# Jurepi Dashboard + Shared Shell — Clean Architecture Blueprint

**Date:** 2026-06-29  
**Phase:** Main Dashboard (home page) + Shared Application Shell  
**Team:** domain-engineer · ui-engineer · platform-engineer  
**Blueprint Owner:** architect  

---

## Executive Summary

This blueprint designs the **main dashboard** (hero + search + category filter + tool-card grid + empty state) and **shared shell** (header/footer) of Jurepi using clean-architecture 4-layer decomposition. The goal: parallel independent work with zero drift via **exact contracts** (types, function signatures, i18n keys, component props).

**Key Design Decisions (from DESIGN.md + PRD):**
- Light-first design, white cards, soft brand-tinted shadows, generous rounding (16–28px).
- 7 tools total: **1 live** (ladder: random/coral/ListTree) + **6 coming_soon**.
- Brand violet (#6c5ce7) ONLY for CTAs/actions. Accent colors (coral/mint/sky/sun/grape/rose) = tool/category identity, never CTAs.
- Gmarket Sans (700) display + Pretendard (500/600) body.
- Card hover lift (-4px, shadow-card-hover); motion is compositor-friendly + prefers-reduced-motion honored.

---

## A. Layer Decomposition

### Layer 1: Domain (Pure, No React/Next/DOM)

**Responsibility:** Stateless business logic — matching, filtering, sorting tools; resolving theme preference to a concrete value.  
**Ownership:** domain-engineer  
**Files:**
- `src/lib/tool-search.ts` — Pure tool matcher + filter + sort.
- `src/lib/theme.ts` — Pure theme preference resolution.

**Rules:**
- Zero React/Next/DOM imports.
- All functions are pure: same input → same output, no side effects.
- Fully unit-testable (Vitest, no mocks needed).
- Exported functions have explicit TS signatures.

---

### Layer 2: Use Cases / State Management

**Responsibility:** Compose domain logic with React state; React hooks that do NOT manage DOM or side effects beyond state.  
**Ownership:** ui-engineer (in custom hooks)  
**Files:**
- `src/hooks/useToolSearch.ts` — Wraps domain search logic; manages query/category state.
- `src/hooks/useTheme.ts` — Wraps domain theme resolution; manages pref state + localStorage sync.

**Rules:**
- Hooks call domain functions but do NOT render DOM directly.
- Side effects (localStorage, nav, DOM refs) are deferred to adapters (layer 3).
- Testable via Vitest + React Testing Library (mock localStorage, useRouter).

---

### Layer 3: Adapter / UI Components

**Responsibility:** React components that render DOM, consume domain/usecase logic, and adapt it to user interaction.  
**Ownership:** ui-engineer  
**Files:**

#### Shell & Layout:
- `src/components/layout/Header.tsx` — Sticky 64px bar: wordmark, search trigger, locale switch, theme toggle.
- `src/components/layout/Footer.tsx` — Footer band with wordmark, links, locale, consent re-open.
- `src/components/layout/ThemeToggle.tsx` — Icon button (sun/moon toggle).
- `src/components/layout/LocaleSwitcher.tsx` — Dropdown or button trio (KO/EN).
- `src/components/ui/IconButton.tsx` — 44px tap-friendly icon-only button (NEW PRIMITIVE).
- `src/components/ui/EmptyState.tsx` — Mascot + heading + reset button (NEW PRIMITIVE).

#### Home / Dashboard:
- `src/components/home/Hero.tsx` — Server or Client (debatable; see §D); eyebrow + H1 + subhead + SearchBar.
- `src/components/home/HeroMascot.tsx` — next/image mascot with greeting + priority loading.
- `src/components/home/ToolExplorer.tsx` — CLIENT container; owns search+category state; debounce ~120ms; manages URL ?q=&?cat= via next-intl router.
- `src/components/home/SearchBar.tsx` — Controlled input; triggers ToolExplorer onInput.
- `src/components/home/CategoryFilter.tsx` — Horizontal pill row; reflects active ?cat= in URL; CLIENT component.
- `src/components/home/ToolGrid.tsx` — Renders ToolCard array; handles empty state.
- `src/components/home/ToolCard.tsx` — Single tool card: accent tile + title + description + badges. Whole card is Link for live; non-clickable for coming_soon.
- `src/components/home/toolStyle.ts` — Helper exporting `accentTileClass(accent): string` (maps accent to Tailwind classes) and `ToolIcon.tsx` component (lucide icon by name).

**Rules:**
- Components consume props from parent or domain functions via hooks.
- No direct localStorage access; use hooks that wrap it.
- Next/Image usage: mascot in Hero is `priority`, cards/empty are `lazy`.
- Accent → class mapping is centralized in toolStyle.ts (tree-shake friendly).

---

### Layer 4: Framework / Platform Configuration

**Responsibility:** Next.js app shell, routing, i18n wiring, font loading, ad slots, build config.  
**Ownership:** platform-engineer  
**Files:**

#### Layout & Root:
- `src/app/layout.tsx` — Root: <html lang>, fonts, metadata, theme bootstrap script, **NO** <body> (child layout owns it).
- `src/app/[locale]/layout.tsx` — Single owner of <html lang={locale}><head>...</head><body>...providers + Header + {children} + Footer + ConsentBanner...
- `src/app/[locale]/page.tsx` — HOME PAGE: Server Component resolving tools + i18n; passes to <ToolExplorer>; renders Hero above.

#### Tool Route:
- `src/app/[locale]/tools/[slug]/page.tsx` — SSG dynamic route; mounts tool module by slug; renders single <main> (no duplication with layout).

#### i18n & Messages:
- `src/i18n/messages/{ko,en}.json` — Keyed by namespace; add all new keys per contract §C.

#### Other:
- `src/styles/tokens.css` — Already exists; dark theme restructure per below.
- `tailwind.config.ts` — Tokens → Tailwind theme (already wired).
- `next.config.ts` — next-intl plugin, image unoptimized if static host.

**Rules:**
- Root layout does NOT render <body>; all layout is in [locale] layout.
- [locale] layout calls `setRequestLocale(locale)` for SSG + exports it for pages.
- Theme toggle persists to localStorage; inline bootstrap script (no flash) sets `document.documentElement.dataset.theme` before paint.
- Fonts: Pretendard via jsDelivr + @font-face swap; Gmarket Sans fallback to Pretendard 700 if CDN unavailable (graceful degrade).
- Ad slots: `<AdSlot variant="leaderboard" />` (90px mobile / up to 250px desktop, reserved) below hero; footer slot; locked in <main>.
- Breadcrumb/main structure: tool pages render their own <main>, not wrapped by shell main (prevent double <main>).

---

## B. Domain Contracts (Pure Layer 1)

### `src/lib/tool-search.ts`

**Purpose:** Pure matching, filtering, sorting over a tool list. Zero React/Next/DOM.

```typescript
/**
 * A tool with localized name, description, and searchable metadata.
 * Used as the common contract between registry + UI layer.
 */
export interface SearchableTool {
  id: string;
  slug: string;
  category: ToolCategory;
  accent: AccentColor;
  icon: string;
  status: 'live' | 'coming_soon';
  isNew?: boolean;
  isPopular?: boolean;
  order: number;
  keywords: string[];
  /** Localized at render time from messages */
  name: string;
  description: string;
}

/**
 * Case-insensitive substring match over name, description, keywords.
 * Empty query returns true (matches all).
 * Trims query; handles ko/en seamlessly.
 */
export function matchTool(tool: SearchableTool, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  return (
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.keywords.some(kw => kw.toLowerCase().includes(q))
  );
}

/**
 * Filter by query + optional category.
 * Returns new array (immutable).
 */
export interface FilterOptions {
  query?: string;
  category?: ToolCategory | 'all';
}

export function filterTools(tools: SearchableTool[], opts: FilterOptions): SearchableTool[] {
  return tools.filter(tool => {
    const matchesQuery = matchTool(tool, opts.query || '');
    const matchesCat = !opts.category || opts.category === 'all' || tool.category === opts.category;
    return matchesQuery && matchesCat;
  });
}

/**
 * Sort: isPopular DESC → order ASC → coming_soon last.
 * Returns new array (immutable).
 */
export function sortTools(tools: SearchableTool[]): SearchableTool[] {
  return [...tools].sort((a, b) => {
    // Popular first
    if (a.isPopular !== b.isPopular) return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    // Order ascending
    if (a.order !== b.order) return a.order - b.order;
    // coming_soon last
    if (a.status !== b.status) return (a.status === 'coming_soon' ? 1 : 0) - (b.status === 'coming_soon' ? 1 : 0);
    return 0;
  });
}

/**
 * Derive unique categories present in the tool list.
 * Order: random → calculator → text → converter → fun (stable per DESIGN.md).
 * Always includes "all" as the first pill.
 */
export interface ToolCategory {
  id: ToolCategory | 'all';
  labelKey: string; // e.g. 'categories.all', 'categories.random'
}

const CATEGORY_ORDER: Array<ToolCategory | 'all'> = ['all', 'random', 'calculator', 'text', 'converter', 'fun'];

export function deriveCategories(tools: SearchableTool[]): ToolCategory[] {
  const present = new Set(tools.map(t => t.category));
  return CATEGORY_ORDER.filter(cat => cat === 'all' || present.has(cat)).map(cat => ({
    id: cat,
    labelKey: cat === 'all' ? 'categories.all' : `categories.${cat}`,
  }));
}
```

**Tests (Vitest, domain-engineer):**
- `matchTool` with various queries (ko, en, mixed case, substring, non-match).
- `filterTools` with query + category combinations.
- `sortTools` order precedence (popular, order, coming_soon).
- `deriveCategories` uniqueness + stable order.
- Edge case: empty tool list, single tool, all coming_soon.

---

### `src/lib/theme.ts`

**Purpose:** Pure preference → resolved theme.

```typescript
export type ThemePref = 'light' | 'dark' | 'system';

/**
 * Resolve a theme preference to a concrete value.
 * @param pref - User preference from localStorage or default.
 * @param systemPrefersDark - Result of matchMedia('(prefers-color-scheme:dark)').matches.
 * @returns Concrete 'light' or 'dark'.
 */
export function resolveTheme(pref: ThemePref, systemPrefersDark: boolean): 'light' | 'dark' {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  // pref === 'system'
  return systemPrefersDark ? 'dark' : 'light';
}

/**
 * Type guard: is unknown value a valid ThemePref?
 */
export function isThemePref(v: unknown): v is ThemePref {
  return v === 'light' || v === 'dark' || v === 'system';
}

/**
 * Default preference.
 */
export const DEFAULT_THEME_PREF: ThemePref = 'light';
```

**Tests (Vitest, domain-engineer):**
- Resolve 'light' / 'dark' / 'system' with systemPrefersDark true/false.
- Type guard with valid + invalid values.

---

## C. i18n Contract (Shared Keys)

All keys are namespaced; define both **ko.json** and **en.json** with identical structure. Platform-engineer adds translations.

### Platform Shell Keys:
```json
{
  "header": {
    "themeLight": "라이트",
    "themeDark": "다크",
    "themeSystem": "시스템",
    "themeToggleAria": "테마 전환",
    "localeAria": "언어 선택",
    "homeLink": "홈"
  },
  "footer": {
    "tagline": "무료 온라인 도구 모음",
    "about": "소개",
    "privacy": "개인정보 처리방침",
    "terms": "이용약관",
    "contact": "문의",
    "copyright": "© 2026 Jurepi · 모든 도구는 무료입니다.",
    "consentReopen": "개인정보 설정 변경"
  }
}
```

### Home Page Keys:
```json
{
  "home": {
    "eyebrow": "무료 온라인 도구",
    "headline": "필요한 도구, 전부 무료로.",
    "subhead": "매일 필요한 도구를 한곳에서 찾아보세요.",
    "searchPlaceholder": "도구 검색…",
    "searchAria": "도구 검색",
    "resultCount": "{count, plural, one {# 개의 도구} other {# 개의 도구}}",
    "mascotGreeting": "안녕하세요! 원하는 도구를 찾아보세요."
  },
  "categories": {
    "all": "전체",
    "random": "랜덤/추첨",
    "calculator": "계산기",
    "text": "텍스트",
    "converter": "변환",
    "fun": "재미"
  },
  "emptyState": {
    "heading": "검색 결과가 없어요",
    "body": "다른 검색어를 시도해보거나, 아래의 카테고리를 선택해보세요.",
    "resetButton": "다시 시작"
  },
  "card": {
    "comingSoon": "준비중",
    "new": "새로운",
    "popular": "인기"
  }
}
```

### Tool Metadata Keys:
Define for each tool (registry id): `tools.<id>.title` and `tools.<id>.description`.

**Live Tool — Ladder:**
```json
{
  "tools.ladder.title": "사다리 타기",
  "tools.ladder.description": "사다리를 타고 아래로 내려와 상품을 얻어보세요. 공정한 추첨 게임입니다."
}
```

**Coming-Soon Tools:**
```json
{
  "tools.picker.title": "랜덤 추첨기",
  "tools.picker.description": "목록에서 무작위로 선택해주는 도구입니다.",
  
  "tools.wordcounter.title": "글자 수 세기",
  "tools.wordcounter.description": "텍스트의 글자, 단어, 문장 수를 세어줍니다.",
  
  "tools.unitconverter.title": "단위 변환기",
  "tools.unitconverter.description": "길이, 무게, 온도 등 다양한 단위를 변환해줍니다.",
  
  "tools.percentcalc.title": "퍼센트 계산기",
  "tools.percentcalc.description": "비율과 퍼센트를 쉽게 계산할 수 있습니다.",
  
  "tools.timer.title": "타이머",
  "tools.timer.description": "시간을 재고 알림을 받으세요.",
  
  "tools.ddaycounter.title": "디데이 계산기",
  "tools.ddaycounter.description": "특정 날짜까지 남은 일수를 계산해줍니다."
}
```

**English variants** (`en.json`): translate each key. Structure identical.

---

## D. Component & Adapter Contracts (Layer 3)

### Shell Components

#### `src/components/layout/Header.tsx`

```typescript
'use client';

interface HeaderProps {
  // No props; uses context/hooks for locale, theme.
}

export function Header(props: HeaderProps): React.ReactNode {
  // Sticky 64px, white surface, 1px border bottom (hairline).
  // Left: Wordmark (Link to home, Gmarket Sans 22px/700, brand color).
  // Right (gap 8px): SearchTrigger (IconButton, magnifying glass), LocaleSwitcher, ThemeToggle.
  // Tap targets ≥44px; focus-visible brand ring.
  // On scroll: background alpha 0.8 + backdrop-filter blur(8px).
}
```

**Usage:** Rendered by [locale]/layout.tsx as first child of <body>.

---

#### `src/components/layout/Footer.tsx`

```typescript
interface FooterProps {
  // No props; uses context/hooks.
}

export function Footer(props: FooterProps): React.ReactNode {
  // surface-muted background, padding 48px 24px.
  // Wordmark + tagline; three link columns (소개/privacy/terms/contact); locale switch; copyright in caption.
  // "© 2026 Jurepi · 모든 도구는 무료입니다."
}
```

**Usage:** Rendered by [locale]/layout.tsx after {children}.

---

#### `src/components/layout/ThemeToggle.tsx`

```typescript
'use client';

interface ThemeToggleProps {
  // No props; uses useTheme() hook internally.
}

export function ThemeToggle(props: ThemeToggleProps): React.ReactNode {
  // IconButton with sun/moon icon (lucide).
  // On click, cycle: light → dark → system → light.
  // Icon reflects current resolved theme (not pref; shows what user sees now).
}
```

---

#### `src/components/layout/LocaleSwitcher.tsx`

```typescript
'use client';

interface LocaleSwitcherProps {
  // No props; uses useRouter + usePathname from next-intl.
}

export function LocaleSwitcher(props: LocaleSwitcherProps): React.ReactNode {
  // Dropdown or button trio (KO / EN).
  // On select, navigate to same path in other locale (preserves query).
}
```

---

#### `src/components/ui/IconButton.tsx` (NEW PRIMITIVE)

```typescript
import React from 'react';

interface IconButtonProps {
  /** lucide-react icon component or element. */
  icon: React.ReactNode;
  /** Aria-label for accessibility. */
  ariaLabel: string;
  /** Click handler. */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Tailwind size: 'sm' (32px), 'md' (40px), 'lg' (48px); default 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Variant: 'ghost' (transparent), 'secondary' (surface-muted); default 'ghost'. */
  variant?: 'ghost' | 'secondary';
  /** CSS class override. */
  className?: string;
}

export function IconButton({
  icon,
  ariaLabel,
  onClick,
  size = 'md',
  variant = 'ghost',
  className,
}: IconButtonProps): React.ReactNode {
  // Tap target ≥44px (md = 40px inner, 2px padding = 44px effective).
  // Hover: lift (translateY -1px), shadow.
  // Focus-visible: brand ring, offset 2px.
  // Press: scale 0.98.
  // Prefers-reduced-motion: no transform, fade only.
}
```

**Usage:** Header controls (search trigger, settings button).

---

#### `src/components/ui/EmptyState.tsx` (NEW PRIMITIVE)

```typescript
interface EmptyStateProps {
  /** Heading text (from i18n). */
  heading: string;
  /** Body text (from i18n). */
  body: string;
  /** Reset/action button label. */
  actionLabel: string;
  /** Reset/action callback. */
  onAction: () => void;
  /** Show mascot (default true). Mascot is the 꿀주먹 caricature. */
  showMascot?: boolean;
}

export function EmptyState({
  heading,
  body,
  actionLabel,
  onAction,
  showMascot = true,
}: EmptyStateProps): React.ReactNode {
  // Centered layout: mascot (if shown, 160px fixed), heading (24px Gmarket), body (16px Pretendard), button.
  // Mascot: next/image, lazy load, rounded clip.
  // Button: primary (brand), centered.
}
```

**Usage:** Home grid empty state (no search results); 404 page; console error fallback.

---

### Home Dashboard Components

#### `src/components/home/Hero.tsx`

```typescript
interface HeroProps {
  // Data resolved server-side by page.tsx.
  mascotGreeting?: string;
}

export function Hero({ mascotGreeting }: HeroProps): React.ReactNode {
  // Server Component (no 'use client').
  // Layout: eyebrow (12px, brand, uppercase) → H1 (clamp 32–56px) → subhead → SearchBar.
  // Centered, padding 64px/40px (desktop/mobile).
  // HeroMascot rendered to the right of H1 (or below on mobile); greeting text below mascot.
  // Decorative blobs behind (low-opacity accents, pointer-events none, static under prefers-reduced-motion).
  // SearchBar is interactive (see below).
}
```

---

#### `src/components/home/HeroMascot.tsx`

```typescript
'use client';

interface HeroMascotProps {
  /** Localized greeting text. */
  greeting?: string;
  /** Image width in pixels (fixed, CLS-safe). */
  width?: number; // default 160
  /** Image height in pixels (fixed, CLS-safe). */
  height?: number; // default 160
  /** Load immediately (true in hero, false in empty state). */
  priority?: boolean;
}

export function HeroMascot({
  greeting,
  width = 160,
  height = 160,
  priority = true,
}: HeroMascotProps): React.ReactNode {
  // Uses next/image to load public/mascot/jurepi-mascot-512.webp (with .png fallback).
  // Explicit width/height to prevent CLS. Rounded clipped.
  // Greeting text below mascot (caption, 13px, text-muted).
}
```

---

#### `src/components/home/ToolExplorer.tsx`

```typescript
'use client';

import { SearchableTool } from '@/lib/tool-search';

interface ToolExplorerProps {
  /** Localized, sorted tools from registry. */
  initialTools: SearchableTool[];
}

export function ToolExplorer({ initialTools }: ToolExplorerProps): React.ReactNode {
  // CLIENT component.
  // Manages local state: query (string), category (ToolCategory | 'all').
  // Debounce search ~120ms (useEffect + ref).
  // On query/category change:
  //   1. Call filterTools + sortTools.
  //   2. Reflect in URL via useRouter + useSearchParams (next-intl).
  //   3. Re-render grid.
  // Renders: CategoryFilter + ToolGrid.
  // Grid receives filtered+sorted tools + onReset callback.
}
```

---

#### `src/components/home/SearchBar.tsx`

```typescript
interface SearchBarProps {
  /** Placeholder text (from i18n). */
  placeholder: string;
  /** Input value. */
  value: string;
  /** On input; caller debounces if needed (or debounce here). */
  onChange: (value: string) => void;
}

export function SearchBar({
  placeholder,
  value,
  onChange,
}: SearchBarProps): React.ReactNode {
  // Controlled input, 56px tall, 1px border hairline, rounded-xl.
  // Leading search icon (magnifying glass, lucide).
  // Focus-visible: brand ring + border brand.
  // Placeholder: text-muted.
  // Used in Hero.
}
```

---

#### `src/components/home/CategoryFilter.tsx`

```typescript
'use client';

interface ToolCategory {
  id: string; // 'all' | ToolCategory
  labelKey: string; // e.g. 'categories.all'
}

interface CategoryFilterProps {
  categories: ToolCategory[];
  active: string; // 'all' or a ToolCategory
  onChange: (cat: string) => void;
  labels: Record<string, string>; // labelKey → human label (from i18n)
}

export function CategoryFilter({
  categories,
  active,
  onChange,
  labels,
}: CategoryFilterProps): React.ReactNode {
  // CLIENT component (responds to URL query on mount via useSearchParams).
  // Horizontal pill row, scroll-snap on mobile (no scrollbar).
  // Pills: inactive (surface-muted, text-secondary) → active (brand bg, white text).
  // Hover: slight lift on inactive.
  // Each pill is a button; on click, call onChange + update URL.
  // Tap targets ≥44px.
}
```

---

#### `src/components/home/ToolGrid.tsx`

```typescript
import { SearchableTool } from '@/lib/tool-search';

interface ToolGridProps {
  tools: SearchableTool[];
  onReset: () => void;
  /** Whether the grid is showing a filtered/search result (affects empty state). */
  isFiltered: boolean;
}

export function ToolGrid({
  tools,
  onReset,
  isFiltered,
}: ToolGridProps): React.ReactNode {
  // 1-col <480, 2-col 480–767, 3-col 768–1023, 4-col ≥1024.
  // Gap 20px. Max-width 1120px centered with gutters.
  // Map tools → ToolCard.
  // If tools.length === 0:
  //   Render EmptyState with onAction → onReset callback.
  //   Heading/body from i18n.
}
```

---

#### `src/components/home/ToolCard.tsx`

```typescript
import Link from 'next/link';
import { SearchableTool } from '@/lib/tool-search';

interface ToolCardProps {
  tool: SearchableTool;
  locale: string; // 'ko' | 'en'
}

export function ToolCard({ tool, locale }: ToolCardProps): React.ReactNode {
  // surface white, 1px border hairline, rounded-xl (20px), padding 20px, min-height 150px.
  // Shadow: shadow-card (default) → shadow-card-hover (on hover).
  // Layout:
  //   - Top-left: icon tile (48px, rounded-lg, accent-*-soft bg, accent glyph).
  //   - Top-right: badges (NEW / 인기 / 준비중, overlaid).
  //   - Title: card-title (17px/700), full width.
  //   - Description: body-sm (14px/500, text-secondary), 2-line clamp.
  //
  // If tool.status === 'live':
  //   - Whole card is Next Link to /[locale]/tools/[slug].
  //   - Hover: translateY(-4px), shadow-card-hover, border brand-soft, 200ms ease-out.
  //   - Press: translateY(-1px), scale(0.99).
  //   - Cursor: pointer.
  //   - Focus-visible: 2px brand ring, offset 2px.
  //
  // If tool.status === 'coming_soon':
  //   - Card is NOT a Link (div).
  //   - Opacity 0.7.
  //   - No hover lift or press.
  //   - Cursor: default.
  //   - Always show 'card.comingSoon' badge.
  //
  // Prefers-reduced-motion: no translate, only shadow/opacity change.
}
```

---

#### `src/components/home/toolStyle.ts`

```typescript
import { AccentColor } from '@/tools/types';
import * as Icons from 'lucide-react';

/** Map accent to Tailwind bg + text classes for icon tile. */
export function accentTileClass(accent: AccentColor): { bg: string; text: string } {
  const map: Record<AccentColor, { bg: string; text: string }> = {
    coral: { bg: 'bg-accent-coral-soft', text: 'text-accent-coral' },
    mint: { bg: 'bg-accent-mint-soft', text: 'text-accent-mint' },
    sky: { bg: 'bg-accent-sky-soft', text: 'text-accent-sky' },
    sun: { bg: 'bg-accent-sun-soft', text: 'text-accent-sun' },
    grape: { bg: 'bg-accent-grape-soft', text: 'text-accent-grape' },
    rose: { bg: 'bg-accent-rose-soft', text: 'text-accent-rose' },
  };
  return map[accent];
}

/** Lucide icon name → React component. Tree-shake friendly (only used icons). */
export function ToolIcon({ name }: { name: string }): React.ReactNode {
  const iconMap: Record<string, React.ComponentType<any>> = {
    ListTree: Icons.ListTree,
    Dices: Icons.Dices,
    Type: Icons.Type,
    Ruler: Icons.Ruler,
    Percent: Icons.Percent,
    Timer: Icons.Timer,
    CalendarDays: Icons.CalendarDays,
  };
  const Icon = iconMap[name];
  if (!Icon) return null; // Fallback to placeholder if icon not found.
  return <Icon className="w-6 h-6" strokeWidth={1.75} />;
}
```

---

## E. Framework / Platform Layer Tasks (Layer 4)

### E.1: Layout Structure Fix

**Current Problem:** Root `app/layout.tsx` AND `[locale]/layout.tsx` both render `<html><body>`.  
**Solution:** Root layout renders ONLY <html lang><head>..., yields to child via `{children}`. [locale] layout owns <body> + providers + header/footer.

**Files to Create/Modify:**

#### `src/app/layout.tsx` (MODIFY)
```typescript
import type { Metadata } from 'next';
import './globals.css';
import { ThemeBootstrap } from '@/components/providers/ThemeBootstrap';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Jurepi — Free Online Tools',
  description: 'Collection of free online tools for everyday tasks.',
  // ... existing metadata
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <ThemeBootstrap />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### `src/app/[locale]/layout.tsx` (CREATE)
```typescript
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ConsentProvider } from '@/components/providers/ConsentProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';

type LocaleParam = { locale: string };

export function generateStaticParams(): LocaleParam[] {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: LocaleParam;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'seo' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: LocaleParam;
}) {
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <ConsentProvider>
              <ToastProvider>
                <Header />
                <main>
                  {children}
                </main>
                <Footer />
              </ToastProvider>
            </ConsentProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### E.2: Theme Provider & Bootstrap

#### `src/components/providers/ThemeBootstrap.tsx` (CREATE)
```typescript
'use client';

export function ThemeBootstrap(): React.ReactNode {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          try {
            const pref = localStorage.getItem('jurepi-theme') || 'light';
            const isDark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);
            document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
          } catch (e) {}
        `,
      }}
    />
  );
}
```

#### `src/components/providers/ThemeProvider.tsx` (CREATE)
```typescript
'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { ThemePref, resolveTheme, DEFAULT_THEME_PREF } from '@/lib/theme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  pref: ThemePref;
  resolved: Theme;
  setPref: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }): React.ReactNode {
  const [pref, setPref] = useState<ThemePref>(DEFAULT_THEME_PREF);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('jurepi-theme');
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setPref(stored as ThemePref);
      }
    } catch (e) {}
    setIsMounted(true);
  }, []);

  const systemPrefersDark = isMounted && matchMedia('(prefers-color-scheme:dark)').matches;
  const resolved = resolveTheme(pref, systemPrefersDark);

  const handleSetPref = (newPref: ThemePref) => {
    try {
      localStorage.setItem('jurepi-theme', newPref);
    } catch (e) {}
    document.documentElement.dataset.theme = resolveTheme(newPref, systemPrefersDark) === 'dark' ? 'dark' : 'light';
    setPref(newPref);
  };

  return (
    <ThemeContext.Provider value={{ pref, resolved, setPref: handleSetPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

### E.3: Token Restructure (Dark Theme)

Modify `src/styles/tokens.css`:

```css
:root {
  /* Light (default) */
  --surface: #ffffff;
  /* ... all existing light vars ... */
}

/* Explicit dark mode: [data-theme="dark"] attribute */
[data-theme="dark"] {
  --surface: #1e1b2e;
  /* ... all dark overwrites ... */
}

/* System dark preference fallback (only if [data-theme] not set) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --surface: #1e1b2e;
    /* ... all dark overwrites ... */
  }
}
```

### E.4: Font Loading

Add to `src/app/layout.tsx` <head>:

```typescript
// Pretendard Variable via jsDelivr
<link
  rel="preconnect"
  href="https://cdn.jsdelivr.net"
  crossOrigin="anonymous"
/>
<link
  href="https://cdn.jsdelivr.net/npm/pretendard@3.3.8/dist/web/static/pretendard.css"
  rel="stylesheet"
/>

// Gmarket Sans attempt (graceful fallback)
<link
  href="https://cdn.jsdelivr.net/npm/gmarket-sans@latest/dist/GmarketSans-Bold.woff2"
  rel="preload"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

Add to tokens.css:

```css
@font-face {
  font-family: 'Gmarket Sans';
  src: url('https://cdn.jsdelivr.net/npm/gmarket-sans@latest/dist/GmarketSans-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
  unicode-range: U+0000–10FFFF;
}
```

Fallback in `tailwind.config.ts`:
```typescript
theme: {
  fontFamily: {
    display: ['"Gmarket Sans"', 'Pretendard', 'system-ui'],
    body: ['Pretendard', 'system-ui'],
  },
}
```

### E.5: Registry Expansion (6 Coming-Soon Tools)

Modify `src/tools/registry.ts`:

```typescript
export const tools: ToolMeta[] = [
  {
    id: 'ladder',
    slug: 'ladder',
    category: 'random',
    icon: 'ListTree',
    accent: 'coral',
    status: 'live',
    isNew: true,
    isPopular: true,
    order: 1,
    keywords: ['사다리', '사다리타기', 'ladder', '추첨', '제비뽑기'],
  },
  {
    id: 'picker',
    slug: 'picker',
    category: 'random',
    icon: 'Dices',
    accent: 'rose',
    status: 'coming_soon',
    order: 2,
    keywords: ['추첨', 'picker', 'random'],
  },
  {
    id: 'wordcounter',
    slug: 'wordcounter',
    category: 'text',
    icon: 'Type',
    accent: 'mint',
    status: 'coming_soon',
    order: 3,
    keywords: ['글자', '단어', '세기'],
  },
  {
    id: 'unitconverter',
    slug: 'unitconverter',
    category: 'converter',
    icon: 'Ruler',
    accent: 'sky',
    status: 'coming_soon',
    order: 4,
    keywords: ['변환', '단위', 'converter'],
  },
  {
    id: 'percentcalc',
    slug: 'percentcalc',
    category: 'calculator',
    icon: 'Percent',
    accent: 'sun',
    status: 'coming_soon',
    order: 5,
    keywords: ['계산기', '퍼센트', 'percent'],
  },
  {
    id: 'timer',
    slug: 'timer',
    category: 'fun',
    icon: 'Timer',
    accent: 'grape',
    status: 'coming_soon',
    order: 6,
    keywords: ['타이머', 'timer'],
  },
  {
    id: 'ddaycounter',
    slug: 'ddaycounter',
    category: 'calculator',
    icon: 'CalendarDays',
    accent: 'grape',
    status: 'coming_soon',
    order: 7,
    keywords: ['디데이', 'd-day', '날짜'],
  },
];
```

### E.6: Home Page Wiring

Create `src/app/[locale]/page.tsx`:

```typescript
import { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { tools } from '@/tools/registry';
import { Hero } from '@/components/home/Hero';
import { ToolExplorer } from '@/components/home/ToolExplorer';
import type { SearchableTool } from '@/lib/tool-search';

type LocaleParam = { locale: string };

export default async function HomePage({
  params: { locale },
}: {
  params: LocaleParam;
}): Promise<ReactNode> {
  setRequestLocale(locale);
  const t = await getTranslations();

  // Resolve tools to SearchableTool with localized name/description
  const searchableTools: SearchableTool[] = tools.map(tool => ({
    ...tool,
    name: t(`tools.${tool.id}.title`),
    description: t(`tools.${tool.id}.description`),
  }));

  return (
    <div className="min-h-screen bg-bg">
      <Hero mascotGreeting={t('home.mascotGreeting')} />
      <ToolExplorer initialTools={searchableTools} />
    </div>
  );
}
```

### E.7: Tool Route (No Duplication)

Ensure `src/app/[locale]/tools/[slug]/page.tsx` renders its own <main> or ensure the shell layout doesn't wrap page children in an extra <main>. Use the pattern:

```typescript
export default async function ToolPage({
  params: { locale, slug },
}: {
  params: LocaleParam & { slug: string };
}): Promise<ReactNode> {
  setRequestLocale(locale);
  // Resolve tool by slug; mount tool module.
  // Do NOT render <main>; shell layout already provides it.
  return <ToolModule slug={slug} />;
}
```

---

## F. Build Order & Parallelization

### Phase 1: Domain Contracts (domain-engineer, ~2–3 hours)
1. `src/lib/tool-search.ts` — pure matcher, filter, sort, deriveCategories.
2. `src/lib/theme.ts` — pure preference resolution.
3. **Tests:** Vitest unit tests for both modules, ≥90% coverage. RED → GREEN → REFACTOR.
4. **Completion:** All domain tests pass; zero TS errors.

### Phase 2: Framework Setup (platform-engineer, parallel, ~3–4 hours)
1. Fix layout double-html bug (layout.tsx + [locale]/layout.tsx + setRequestLocale).
2. Add ThemeProvider + ThemeBootstrap + token restructure (dark).
3. Expand registry with 6 coming_soon tools.
4. Add i18n keys (§C) to ko.json + en.json.
5. Font loading + fallbacks (Pretendard + Gmarket Sans graceful).
6. **Completion:** Root layout renders no double html/body; theme persists no-flash; registry has 7 tools.

### Phase 3: Shell UI Components (ui-engineer, parallel to Phase 2, ~3–4 hours)
1. `IconButton.tsx` (NEW PRIMITIVE) — reusable 44px+ tap target.
2. `EmptyState.tsx` (NEW PRIMITIVE) — mascot + heading + reset.
3. `Header.tsx` — wordmark + search trigger + locale + theme toggle.
4. `Footer.tsx` — links + wordmark + copyright.
5. `ThemeToggle.tsx` — icon button with sun/moon.
6. `LocaleSwitcher.tsx` — locale picker.
7. **Tests:** RTL component snapshots + keyboard nav + focus-visible; a11y axe checks.
8. **Completion:** All shell components render; Header/Footer pass RTL.

### Phase 4: Home Dashboard Components (ui-engineer, ~4–5 hours)
1. `Hero.tsx` — eyebrow + H1 + subhead (Server Component).
2. `HeroMascot.tsx` — next/image mascot with greeting.
3. `SearchBar.tsx` — controlled input.
4. `CategoryFilter.tsx` — pill row; CLIENT component.
5. `ToolCard.tsx` — accent tile, badges, live vs coming_soon styles.
6. `toolStyle.ts` — accent → class map + ToolIcon map.
7. `ToolGrid.tsx` — grid layout + empty state.
8. `ToolExplorer.tsx` — CLIENT container; manages search + category state; debounce ~120ms.
9. **Tests:** ToolCard live vs coming_soon states; SearchBar input; CategoryFilter pill toggle; ToolGrid empty state; ToolExplorer URL sync.
10. **Completion:** Home page renders and loads; search + filter work; cards are interactive.

### Phase 5: Home Page Integration (platform-engineer, ~2 hours)
1. Create `src/app/[locale]/page.tsx` — Server Component resolving tools + wiring to ToolExplorer.
2. Ensure tool route doesn't have double <main>.
3. Wire theme + consent providers in [locale]/layout.tsx.
4. **Completion:** Home page fully renders with live tool + 6 coming_soon.

### Phase 6: Testing & QA (qa-integration, ~3–4 hours)
1. **Unit:** Domain tests (tool-search, theme) ≥90% coverage.
2. **Component:** RTL for Shell + Home components; a11y axe; keyboard nav.
3. **E2E:** Playwright scenarios (home load, filter, search, card interaction, locale switch, theme toggle).
4. **Visual Regression:** Screenshots at 320/375/768/1024/1440 (both themes).
5. **Performance:** Lighthouse mobile ≥70 (LCP < 2.5s, CLS < 0.1, INP < 200ms).
6. **Registry↔Grid:** Verify all 7 tools render; coming_soon non-clickable.
7. **i18n:** All new keys present in ko + en.
8. **Theme Bootstrap:** No flash on reload; toggle works; persists.
9. **Mascot:** CLS-safe (fixed dimensions); priority on hero.
10. **Accent Identity:** No brand color used as accent on tiles; only on CTAs.
11. **Build Green:** `pnpm build` completes; no errors/warnings.
12. **Completion:** All tests pass; no regressions; Lighthouse green.

---

## G. Boundary Checks & Invariants

### Domain Invariants
- **Immutability:** `filterTools`, `sortTools` return new arrays, never mutate input.
- **Determinism:** Same tools + same query → same result order every time.
- **Null Safety:** No tool.keywords surprises; all fields are defined at registry time.

### UI Invariants
- **Accent ≠ CTA:** No tool card has brand-colored icon tile; only accent-tinted. Only CTA buttons use brand.
- **Live ≠ Coming-Soon:** Live cards are Links; coming_soon are non-clickable divs. Whole card is tap target for live ONLY.
- **Badges:** NEW = mint, 인기 = sun, 준비중 = muted. No mixing.
- **Keyboard:** All controls are keyboard-operable; focus-visible rings on all interactive elements; tab order is DOM order.
- **Motion:** All card lift/hover is translateY (compositor-friendly); disabled under prefers-reduced-motion.
- **CLS:** HeroMascot has explicit width/height; AdSlot reserves fixed height; no late-loading reflows above H1.

### Framework Invariants
- **Single Main:** Only one <main> per page (in [locale]/layout or page, not both).
- **Locale Consistency:** setRequestLocale called in [locale]/layout + each page for SSG.
- **Theme No-Flash:** Bootstrap script runs before body paint; sets data-theme before hydration.
- **Registry Source:** All 7 tools defined in registry.ts; UI derives from it (no hardcoded tool lists elsewhere).

### i18n Invariants
- **Key Presence:** Every newKey in §C is present in BOTH ko.json + en.json with identical structure.
- **Namespace Scope:** `tools.<id>.*` keys only for tools in registry; unused keys removed.
- **Plurals:** ICU plural syntax for counts (e.g., `{count, plural, one {#...} other {#...}}`).

---

## H. Success Criteria (QA Gate)

**Build Green:**
- `pnpm build` completes; zero errors; zero TS strict violations.
- `pnpm test` (Vitest) passes; domain coverage ≥90%; component snapshots pass.
- `pnpm e2e` (Playwright) passes all scenarios.

**Visual:**
- Home renders at 320/375/768/1024/1440 with no overflow/clipping.
- Both light + dark themes match DESIGN.md (light is default on load).
- Cards lift on hover (live only); coming_soon appear 0.7 opacity.
- Hero H1 scales smoothly via clamp (32–56px); mascot is CLS-safe.
- Brand violet ONLY on CTA + header/footer links; accents on tiles only.

**Functional:**
- Category filter narrows grid; URL reflects ?cat=.
- Search debounces ~120ms; narrows grid; empty state + reset work.
- Locale switch preserves page + query.
- Theme toggle cycles light → dark → system → light; persists via localStorage; no flash on reload.
- All 7 tools render (1 live clickable, 6 coming_soon non-clickable).
- Mascot loads via next/image; loads with priority in hero; lazy elsewhere.

**Accessibility:**
- axe audit: zero violations.
- Keyboard: all controls reach via Tab; focus-visible rings visible.
- Reduced motion: card hover/mascot render without transform.
- Color contrast: ≥4.5:1 body text; ≥3:1 large text (WCAG AA).

**Performance:**
- Lighthouse mobile: LCP < 2.5s, FCP < 1.5s, INP < 200ms, CLS < 0.1, TBT < 200ms.
- Bundle JS < 150kb gz (home), CSS < 30kb gz.
- No 3p scripts (ads, analytics) block FCP.

**i18n:**
- All new keys in ko.json + en.json.
- Locale switch displays correct language on all UI.
- Hreflang alternates correct (if implemented; otherwise deferred).

---

## I. Implementation Notes

### Domain-Engineer Checklist
- [ ] Implement `src/lib/tool-search.ts` + tests (RED → GREEN).
- [ ] Implement `src/lib/theme.ts` + tests (RED → GREEN).
- [ ] Domain coverage ≥90%.

### UI-Engineer Checklist
- [ ] Implement all shell components (Header, Footer, ThemeToggle, LocaleSwitcher, IconButton, EmptyState).
- [ ] Implement all home components (Hero, HeroMascot, SearchBar, CategoryFilter, ToolGrid, ToolCard, ToolExplorer).
- [ ] Implement `toolStyle.ts` (accent → class, ToolIcon map).
- [ ] Component tests via RTL; a11y axe; keyboard nav.
- [ ] Visual regression snapshots at 5 breakpoints, both themes.

### Platform-Engineer Checklist
- [ ] Fix layout double-html; ensure setRequestLocale in [locale] + pages.
- [ ] Implement ThemeProvider + ThemeBootstrap; dark token restructure.
- [ ] Expand registry to 7 tools (1 live, 6 coming_soon).
- [ ] Add i18n keys (§C) to ko.json + en.json.
- [ ] Font loading (Pretendard + Gmarket Sans graceful fallback).
- [ ] Create `src/app/[locale]/page.tsx` home wiring.
- [ ] Verify tool route doesn't duplicate <main>.

### QA Integration Checklist
- [ ] Domain unit tests ≥90% coverage; zero failures.
- [ ] Component RTL tests pass; snapshots stable.
- [ ] E2E Playwright 4 scenarios green.
- [ ] Lighthouse mobile ≥70 (CWV targets met).
- [ ] Registry ↔ grid visual verification (7 tools, accents, badges).
- [ ] i18n keys present both locales.
- [ ] Theme toggle + mascot CLS-safe; no flash.
- [ ] Accent identity + CTA color rules enforced (audit design).
- [ ] Keyboard nav + focus-visible complete.
- [ ] Build passes; zero console errors in prod.

---

## J. Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Domain logic bugs → grid broken | TDD on domain layer; ≥90% unit coverage before UI touches it. |
| UI context bleeding (search state) | ToolExplorer is isolated CLIENT; passes filtered tools to ToolGrid; no sibling state leak. |
| Font load FOUC | ThemeBootstrap inline script + font-display swap ensure no ugly reflow. |
| Accent misuse (on CTA) | Accent → class map isolated in toolStyle.ts; ToolCard uses only for tile, never CTA. Code review enforces brand-violet CTA rule. |
| Coming_soon clickable | ToolCard checks status; renders Link if live only; div if coming_soon. Test verifies both states. |
| Double <main> | Review [locale]/layout.tsx + tool page structure; one layout provides <main>, page never does. |
| i18n key typo | Lint script (or CI check) verifies all newKeys in both ko.json + en.json. |
| Mascot CLS | HeroMascot explicit width/height; next/image prevents reflow. Lighthouse audit confirms CLS < 0.1. |
| Dark theme flashing | ThemeBootstrap runs before body render; sets data-theme attribute. Verified on real device (not just emulated). |

---

## Appendix: File Checklist

### Layer 1 (Domain)
- [ ] `src/lib/tool-search.ts` — pure search + filter + sort + deriveCategories.
- [ ] `src/lib/theme.ts` — pure theme resolution.

### Layer 2 (Hooks / Use Cases)
- [ ] `src/hooks/useToolSearch.ts` — search + category state + debounce.
- [ ] `src/hooks/useTheme.ts` — theme pref state + localStorage.

### Layer 3 (UI Components)
- [ ] `src/components/layout/Header.tsx`
- [ ] `src/components/layout/Footer.tsx`
- [ ] `src/components/layout/ThemeToggle.tsx`
- [ ] `src/components/layout/LocaleSwitcher.tsx`
- [ ] `src/components/ui/IconButton.tsx`
- [ ] `src/components/ui/EmptyState.tsx`
- [ ] `src/components/home/Hero.tsx`
- [ ] `src/components/home/HeroMascot.tsx`
- [ ] `src/components/home/SearchBar.tsx`
- [ ] `src/components/home/CategoryFilter.tsx`
- [ ] `src/components/home/ToolGrid.tsx`
- [ ] `src/components/home/ToolCard.tsx`
- [ ] `src/components/home/ToolExplorer.tsx`
- [ ] `src/components/home/toolStyle.ts`

### Layer 4 (Framework)
- [ ] `src/app/layout.tsx` (MODIFY — remove <body>)
- [ ] `src/app/[locale]/layout.tsx` (CREATE — owns <html><body>)
- [ ] `src/app/[locale]/page.tsx` (CREATE — home wiring)
- [ ] `src/components/providers/ThemeProvider.tsx` (CREATE)
- [ ] `src/components/providers/ThemeBootstrap.tsx` (CREATE)
- [ ] `src/tools/registry.ts` (MODIFY — add 6 coming_soon)
- [ ] `src/i18n/messages/ko.json` (MODIFY — add §C keys)
- [ ] `src/i18n/messages/en.json` (MODIFY — add §C keys)
- [ ] `src/styles/tokens.css` (MODIFY — dark restructure)
- [ ] `tailwind.config.ts` (VERIFY font family integration)
- [ ] `next.config.ts` (VERIFY next-intl plugin)

### Tests
- [ ] `src/lib/tool-search.test.ts` (Vitest, ≥90% coverage)
- [ ] `src/lib/theme.test.ts` (Vitest, ≥90% coverage)
- [ ] `src/components/layout/Header.test.tsx` (RTL)
- [ ] `src/components/layout/Footer.test.tsx` (RTL)
- [ ] `src/components/home/ToolCard.test.tsx` (RTL, live + coming_soon states)
- [ ] `src/components/home/ToolExplorer.test.tsx` (RTL, search + filter URL sync)
- [ ] `tests/e2e/home.spec.ts` (Playwright, 4 scenarios)

---

**Blueprint Complete.** Ready for parallel implementation by 3 independent engineers. All contracts, layer boundaries, and QA gates defined. No ambiguity on types, signatures, or component props.

**Estimated Total Duration:** 5–6 work days (parallel phases 2–3 + sequential 1 → 4 → 5 → 6).

**Handoff:** This blueprint is the contract. Code review enforces layer boundaries + invariants. QA gate verifies all success criteria before merge.
