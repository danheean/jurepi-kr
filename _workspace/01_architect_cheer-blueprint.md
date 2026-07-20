# Everyone's Cheer (모두의 응원) — Architecture Blueprint

**Tool ID:** `cheer` | **Slug:** `cheer` | **Category:** `fun` | **Accent:** `coral` | **Status:** `coming_soon`

---

## 1. Layer Decomposition

### Domain Layer (`src/lib/cheer/`)

Pure, framework-agnostic TypeScript. No React, no Next, no DOM. All immutable, all TDD.

#### `schema.ts`
**Responsibility:** Define and validate CheerSettings, localStorage store schema, preset structure.

**Contracts:**
```typescript
// CheerSettings — user's current display configuration (immutable)
export interface CheerSettings {
  text: string                    // 1..80 chars, user message
  textColor: ColorSwatchId        // e.g. 'white', 'coral', 'sun', 'sky', 'grape', 'rose'
  bgColor: ColorSwatchId          // e.g. 'black', 'white', 'coral', 'grape'
  effect: 'static' | 'scroll' | 'flash' | 'neon'  // default 'scroll'
  speed: 'slow' | 'medium' | 'fast'               // default 'medium'
  size: 'S' | 'M' | 'L' | 'XL'                    // default 'L'
  landscape: boolean                              // default false
}

// CheerStore — JSON blob persisted to localStorage
export interface CheerStore {
  version: number                 // STORE_VERSION = 1
  recents: string[]               // max MAX_RECENTS (10), MRU order, deduped
  lastSettings: CheerSettings     // restored on mount
}

// Zod schemas for parse + infer
export const cheerSettingsSchema: z.ZodType<CheerSettings> = z.object({
  text: z.string().min(1).max(80),
  textColor: z.enum(['white', 'coral', 'sun', 'sky', 'grape', 'rose']),
  bgColor: z.enum(['black', 'white', 'coral', 'grape', 'sun', 'sky', 'grape', 'rose']),
  effect: z.enum(['static', 'scroll', 'flash', 'neon']).default('scroll'),
  speed: z.enum(['slow', 'medium', 'fast']).default('medium'),
  size: z.enum(['S', 'M', 'L', 'XL']).default('L'),
  landscape: z.boolean().default(false),
})

export const cheerStoreSchema: z.ZodType<CheerStore> = z.object({
  version: z.number().int().min(1),
  recents: z.array(z.string()).default([]),
  lastSettings: cheerSettingsSchema,
})

export type CheerSettingsInput = z.infer<typeof cheerSettingsSchema>
export type CheerStoreInput = z.infer<typeof cheerStoreSchema>

// Defaults
export const DEFAULT_SETTINGS: CheerSettings = {
  text: '',
  textColor: 'white',
  bgColor: 'black',
  effect: 'scroll',
  speed: 'medium',
  size: 'L',
  landscape: false,
}
```

#### `presets.ts`
**Responsibility:** Define curated preset phrases by situation. Labels come from i18n only (NOT stored in constants).

**Contracts:**
```typescript
export interface PresetPhrase {
  id: string                           // stable id: e.g. 'concert.cheer', 'sports.win'
  situation: 'concert' | 'sports' | 'birthday' | 'event'
  // label: string omitted — resolved via i18n `tools.cheer.presets.<situation>.<id>`
}

export const PRESET_PHRASES: PresetPhrase[] = [
  // CONCERT — roughly 6 phrases
  { id: 'cheer', situation: 'concert' },
  { id: 'encore', situation: 'concert' },
  // ... total ~6 concert presets
  
  // SPORTS — roughly 6 phrases
  { id: 'win', situation: 'sports' },
  { id: 'one-more-goal', situation: 'sports' },
  // ... total ~6 sports presets
  
  // BIRTHDAY — roughly 6 phrases
  { id: 'happy-birthday', situation: 'birthday' },
  { id: 'many-happy-returns', situation: 'birthday' },
  // ... total ~6 birthday presets
  
  // EVENT — roughly 6 phrases
  { id: 'let-go', situation: 'event' },
  { id: 'lets-do-it', situation: 'event' },
  // ... total ~6 event presets
]

// Helpers
export function getPresetsByCategory(situation: PresetPhrase['situation']): PresetPhrase[] {
  return PRESET_PHRASES.filter(p => p.situation === situation)
}
```

#### `recents.ts`
**Responsibility:** Immutable operations on the MRU (most-recently-used) recent-messages list.

**Contracts:**
```typescript
const MAX_RECENTS = 10

// Add a message to recents: MRU (most recent first), dedup, cap MAX_RECENTS
export function addRecent(recents: string[], message: string): string[] {
  const trimmed = normalizeMessage(message)
  if (!isValidMessage(trimmed)) return recents
  const deduplicated = recents.filter(r => r !== trimmed)
  return [trimmed, ...deduplicated].slice(0, MAX_RECENTS)
}

// Prune recents when store is restored (remove empty, cap MAX_RECENTS)
export function pruneRecents(recents: unknown): string[] {
  if (!Array.isArray(recents)) return []
  return recents
    .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
    .slice(0, MAX_RECENTS)
}
```

#### `sanitize.ts`
**Responsibility:** Normalize and validate user input message.

**Contracts:**
```typescript
const MIN_LEN = 1, MAX_LEN = 80

export function normalizeMessage(text: string): string {
  // Trim, collapse whitespace, cap length
  return text.trim().replace(/\s+/g, ' ').slice(0, MAX_LEN)
}

export function isValidMessage(text: string): boolean {
  const normalized = normalizeMessage(text)
  return normalized.length >= MIN_LEN && normalized.length <= MAX_LEN
}
```

#### `contrast.ts`
**Responsibility:** Compute text-to-background contrast ratio. Flag low-contrast pairs (< 3.0) as a warning, not blocked.

**Contracts:**
```typescript
type ColorSwatchId = 'white' | 'black' | 'coral' | 'sun' | 'sky' | 'grape' | 'rose' // ...extend as palette grows

// Map swatch ID to hex color (from DESIGN.md design tokens)
const SWATCH_COLORS: Record<ColorSwatchId, string> = {
  white: '#ffffff',
  black: '#000000',
  coral: '#fb7185',    // or actual token hex
  sun: '#f5a623',
  sky: '#3b82f6',
  grape: '#a78bfa',
  rose: '#ec4899',
  // ... etc
}

// Relative luminance (WCAG 2.1)
export function relativeLuminance(hex: string): number {
  // Convert hex to RGB, apply gamma, sum weighted components
  // ... standard WCAG formula
}

// Contrast ratio
export function contrastRatio(textColor: ColorSwatchId, bgColor: ColorSwatchId): number {
  const textLum = relativeLuminance(SWATCH_COLORS[textColor])
  const bgLum = relativeLuminance(SWATCH_COLORS[bgColor])
  const lighter = Math.max(textLum, bgLum)
  const darker = Math.min(textLum, bgLum)
  return (lighter + 0.05) / (darker + 0.05)
}

// Warning threshold
const MIN_CONTRAST = 3.0
export function isLowContrast(textColor: ColorSwatchId, bgColor: ColorSwatchId): boolean {
  return contrastRatio(textColor, bgColor) < MIN_CONTRAST
}
```

**Note:** Check if `src/lib/qr-code/contrast.ts` already implements this. If so, REUSE instead of duplicate (consistency rule).

---

### Hook Layer (`src/components/tools/cheer/`)

Two custom hooks that bridge domain to React state.

#### `useCheer.ts`
**Responsibility:** Manage CheerSettings + Recents state. Read/write localStorage. Feature-detect fullscreen/wake-lock.

**Contracts:**
```typescript
export interface UseCheerReturn {
  // Settings state
  settings: CheerSettings
  updateSettings: (updates: Partial<CheerSettings>) => void
  
  // Recents state
  recents: string[]
  clearMessage: () => void
  loadRecent: (msg: string) => void
  
  // Preset apply
  applyPreset: (presetId: string) => void
  
  // Fullscreen + Wake Lock wiring (feature-detected)
  isFullscreenSupported: boolean
  isFullscreenActive: boolean
  enterFullscreen: (element: HTMLElement) => Promise<void>
  exitFullscreen: () => Promise<void>
  isWakeLockSupported: boolean
  isWakeLocked: boolean
  toggleWakeLock: () => Promise<void>
  
  // Commit message to recents (called on "show")
  commitMessage: () => void
}

export function useCheer(): UseCheerReturn {
  // Mount: read localStorage jurepi-cheer → zod parse → restore settings + recents
  // Fail → use defaults (no throw)
  // On settings change: immutable setState + immediate persist to localStorage
  // On commitMessage: addRecent(text) → write to localStorage
  // ...fullscreen/wake-lock wiring (see useFullscreen contract)
}
```

#### `useFullscreen.ts`
**Responsibility:** Fullscreen API + Screen Wake Lock feature detection and lifecycle. Re-acquire wake lock on visibilitychange.

**Contracts:**
```typescript
export interface UseFullscreenReturn {
  isSupported: boolean           // Fullscreen API present
  isActive: boolean              // Currently in fullscreen
  enter: (element: HTMLElement) => Promise<void>
  exit: () => Promise<void>
  
  // Wake Lock (independent feature)
  isWakeLockSupported: boolean
  isWakeLocked: boolean
  acquire: () => Promise<void>   // Request wake lock
  release: () => Promise<void>   // Release wake lock
}

export function useFullscreen(): UseFullscreenReturn {
  // Feature-detect document.fullscreenEnabled, navigator.wakeLock
  // Track fullscreenchange + visibilitychange events
  // On enter: if wake-lock toggle ON and supported → acquire
  // On visibilitychange→visible: re-acquire if toggle ON
  // On exit: release wake lock
  // All feature-detected; unsupported → methods are no-ops, isSupported false
}
```

---

### Presentation Layer (`src/components/tools/cheer/`)

React components. Composed from domain + hooks. SEO sections rendered OUTSIDE the `mounted` gate.

#### `Cheer.tsx` (Orchestrator)
**Responsibility:** Layout + state coordination. Owner of useCheer() hook. Mounted gate for localStorage-only logic.

**Structure:**
```tsx
'use client'

export function Cheer() {
  const cheer = useCheer()
  
  return (
    <>
      {/* Gate-outside SSR: SEO sections (no localStorage, no Date) */}
      <ToolIntro {/* i18n intro.* */} />
      <CheerHowTo />
      <CheerFaq />
      <CheerStructuredData />
      
      {/* Gate-inside: interactive parts (localStorage-dependent) */}
      {mounted && (
        <>
          <div className="grid md:grid-cols-2 gap-8">
            <CheerDisplay settings={cheer.settings} />
            <div className="flex flex-col gap-6">
              <CheerInput
                text={cheer.settings.text}
                onChange={(text) => cheer.updateSettings({ text })}
                recents={cheer.recents}
                onSelectRecent={cheer.loadRecent}
              />
              <CheerPresets
                onApply={cheer.applyPreset}
              />
              <CheerControls
                settings={cheer.settings}
                onSettingsChange={cheer.updateSettings}
                isFullscreenSupported={cheer.isFullscreenSupported}
                isWakeLockSupported={cheer.isWakeLockSupported}
                isWakeLocked={cheer.isWakeLocked}
                onEnterFullscreen={() => cheer.enterFullscreen(displayRef.current)}
                onExitFullscreen={() => cheer.exitFullscreen()}
                onToggleWakeLock={() => cheer.toggleWakeLock()}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
```

#### `CheerDisplay.tsx`
**Responsibility:** Render the large banner with live effect. Respond to settings. Respect reduced-motion.

**Props:**
```typescript
interface CheerDisplayProps {
  settings: CheerSettings
  isFullscreen?: boolean
}
```

**Behavior:**
- Text is rendered as a **text node** (never dangerouslySetInnerHTML).
- Empty message → show placeholder hint ("여기에 응원 문구가 표시돼요").
- Effect rendering:
  - **static**: no animation
  - **scroll**: `@keyframes` on `transform: translateX(100% → -100%)`, duration `SCROLL_MS[speed]`, infinite, `overflow: hidden`
  - **flash**: `@keyframes` on `opacity: 1 → 0.15 → 1`, duration `FLASH_MS[speed]`, infinite
  - **neon**: no animation; layered `text-shadow` glow in `textColor`
- **Landscape:** `transform: rotate(90deg)` on container + dimension swap
- **prefers-reduced-motion:** scroll/flash become static; neon/static unaffected
- **a11y:** `role="img"` + `aria-label={settings.text}` so the message is announced.

#### `CheerInput.tsx`
**Responsibility:** Text input field + recent message chips.

**Props:**
```typescript
interface CheerInputProps {
  text: string
  onChange: (text: string) => void
  recents: string[]
  onSelectRecent: (msg: string) => void
}
```

**Behavior:**
- Controlled `<input maxLength={80}>`.
- Live preview updates as you type (no debounce — draft-bound).
- Recent chips row: tap to restore into input.
- "지우기" button to clear input.

#### `CheerPresets.tsx`
**Responsibility:** Situation tabs + preset phrase chips.

**Props:**
```typescript
interface CheerPresetsProps {
  onApply: (presetId: string) => void
}
```

**Behavior:**
- Situation tabs (roving tabindex): 콘서트, 스포츠, 생일, 이벤트.
- Under active tab: chips of curated phrases; tap sets input text.
- Phrase labels from i18n `tools.cheer.presets.<situation>.<id>`.

#### `CheerControls.tsx`
**Responsibility:** Effect, speed, colors, size, landscape, fullscreen, keep-awake toggles.

**Props:**
```typescript
interface CheerControlsProps {
  settings: CheerSettings
  onSettingsChange: (updates: Partial<CheerSettings>) => void
  isFullscreenSupported: boolean
  isWakeLockSupported: boolean
  isWakeLocked: boolean
  onEnterFullscreen: () => Promise<void>
  onExitFullscreen: () => Promise<void>
  onToggleWakeLock: () => Promise<void>
}
```

**Behavior:**
- **Effect selector:** segmented control (정적/스크롤/점멸/네온); active = brand pill.
- **Speed:** slow/medium/fast segmented; disabled when effect is static/neon.
- **Color swatches:** text color + background color; low-contrast pair shows warning chip (not blocked).
- **Size:** S/M/L/XL segmented.
- **Landscape toggle:** `aria-pressed`.
- **Fullscreen button:** hidden if unsupported; fallback overlay shown instead.
- **Keep-awake toggle:** hidden entirely if Wake Lock unsupported.

---

### SEO Layer

Rendered **OUTSIDE** the `mounted` gate (SSR for crawlers).

#### `CheerHowTo.tsx`
**Responsibility:** Long-form SEO content: how to use, when to use, tips (~400 words).

**Structure:**
- Game concept / overview (항상 보임, collapsed details 없음)
- How to use (4+ steps)
- When to use (use cases)
- Tips

#### `CheerFaq.tsx`
**Responsibility:** Q&A + FAQPage JSON-LD (single owner of FAQPage).

**Data:**
- 5–7 questions covering: fairness/feature explanation, mobile support, privacy, accessibility

#### `CheerStructuredData.tsx`
**Responsibility:** SoftwareApplication JSON-LD (url == canonical).

**Data:**
```typescript
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Everyone's Cheer",
  "description": "Show your cheer message big...",
  "url": "https://apps.jurepi.kr/[locale]/tools/cheer",
  "applicationCategory": "UtilityApplication",
  "offers": { "@type": "Offer", "price": "0" },
  "screenshot": "...",
  "operatingSystem": "Web"
}
```

---

## 2. Public API Contracts

### Domain Exports
All pure functions. No React, no Next.

```typescript
// schema.ts
export type CheerSettings = { text, textColor, bgColor, effect, speed, size, landscape }
export type CheerStore = { version, recents, lastSettings }
export const DEFAULT_SETTINGS: CheerSettings
export const cheerSettingsSchema: z.ZodType<CheerSettings>
export const cheerStoreSchema: z.ZodType<CheerStore>

// presets.ts
export type PresetPhrase = { id: string, situation: 'concert' | 'sports' | 'birthday' | 'event' }
export const PRESET_PHRASES: PresetPhrase[]
export function getPresetsByCategory(situation: string): PresetPhrase[]

// recents.ts
export const MAX_RECENTS: 10
export function addRecent(recents: string[], message: string): string[]
export function pruneRecents(recents: unknown): string[]

// sanitize.ts
export const MIN_LEN: 1, MAX_LEN: 80
export function normalizeMessage(text: string): string
export function isValidMessage(text: string): boolean

// contrast.ts
export type ColorSwatchId = 'white' | 'black' | 'coral' | 'sun' | 'sky' | 'grape' | 'rose'
export function contrastRatio(textColor: ColorSwatchId, bgColor: ColorSwatchId): number
export function isLowContrast(textColor: ColorSwatchId, bgColor: ColorSwatchId): boolean
export const MIN_CONTRAST: 3.0
```

### Hook Exports
```typescript
// useCheer.ts
export interface UseCheerReturn {
  settings: CheerSettings
  updateSettings: (updates: Partial<CheerSettings>) => void
  recents: string[]
  clearMessage: () => void
  loadRecent: (msg: string) => void
  applyPreset: (presetId: string) => void
  isFullscreenSupported: boolean
  isFullscreenActive: boolean
  enterFullscreen: (element: HTMLElement) => Promise<void>
  exitFullscreen: () => Promise<void>
  isWakeLockSupported: boolean
  isWakeLocked: boolean
  toggleWakeLock: () => Promise<void>
  commitMessage: () => void
}
export function useCheer(): UseCheerReturn

// useFullscreen.ts
export interface UseFullscreenReturn {
  isSupported: boolean
  isActive: boolean
  enter: (element: HTMLElement) => Promise<void>
  exit: () => Promise<void>
  isWakeLockSupported: boolean
  isWakeLocked: boolean
  acquire: () => Promise<void>
  release: () => Promise<void>
}
export function useFullscreen(): UseFullscreenReturn
```

---

## 3. Registry Entry

**File:** `src/tools/registry.ts`

```typescript
{
  id: 'cheer',
  slug: 'cheer',
  category: 'fun',
  icon: 'Megaphone',
  accent: 'coral',
  status: 'coming_soon',  // → 'live' on deploy approval
  addedAt: '2026-07-20',
  order: 185,  // Demand-based slot (inserted between 180=bookmarks and 190=next)
  keywords: [
    '응원',
    '응원문구',
    '전광판',
    'LED',
    '콘서트',
    '경기장',
    '응원',
    '라이브',
    '배너',
    'cheer',
    'banner',
    'marquee',
    'LED sign',
    'concert',
    'stadium',
    'fan',
    'chant'
  ]
}
```

---

## 4. i18n Key Contract

**Top-level keys (consumed by home card / footer / search):**

| key | ko | en |
|-----|----|----|
| `tools.cheer.title` | 모두의 응원 | Everyone's Cheer |
| `tools.cheer.description` | 응원 문구를 크게 띄워 콘서트·경기장에서 눈에 띄게 응원하세요. | Show your cheer message big — wave it like an LED banner at concerts and games. |
| `tools.cheer.meta.title` | 모두의 응원 · 실시간 응원 배너 | Everyone's Cheer - Live Cheer Display |
| `tools.cheer.meta.description` | 응원 문구를 크게 띄우는 무료 온라인 도구. 콘서트·경기장에서 보기 좋은 효과까지. | Free online cheer message display. Scrolling, flashing, neon glow effects for concerts and events. |
| `tools.cheer.intro.eyebrow` | 재미 도구 | FUN TOOL |
| `tools.cheer.intro.title` | 모두의 응원 | Everyone's Cheer |
| `tools.cheer.intro.lead` | 응원 문구를 크게 띄워 콘서트·경기장에서 눈에 띄게 응원하세요. | Show your cheer message big — wave it like an LED banner at concerts and games. |

**CheerInput keys:**

| key | ko | en |
|-----|----|----|
| `tools.cheer.input.label` | 응원 문구 | Cheer message |
| `tools.cheer.input.placeholder` | 예: 우리 팀 우승! | e.g., Go team! |
| `tools.cheer.input.clear` | 지우기 | Clear |
| `tools.cheer.input.recentsLabel` | 최근 응원 | Recent messages |
| `tools.cheer.input.noRecents` | 최근 응원이 없어요 | No recent messages |

**CheerPresets keys:**

| key | ko | en |
|-----|----|----|
| `tools.cheer.presets.concert` | 콘서트 | Concert |
| `tools.cheer.presets.sports` | 스포츠 | Sports |
| `tools.cheer.presets.birthday` | 생일 | Birthday |
| `tools.cheer.presets.event` | 이벤트 | Event |
| `tools.cheer.presets.concert.cheer` | 응원! | Cheer! |
| `tools.cheer.presets.concert.encore` | 앵콜! | Encore! |
| `tools.cheer.presets.sports.win` | 우승! | Win! |
| `tools.cheer.presets.sports.one-more-goal` | 한 골 더! | One more goal! |
| `tools.cheer.presets.birthday.happy-birthday` | 생일 축하합니다! | Happy birthday! |
| `tools.cheer.presets.birthday.many-happy-returns` | 해마다 행운이 가득하길! | Many happy returns! |
| `tools.cheer.presets.event.let-go` | 화이팅! | Let's go! |
| `tools.cheer.presets.event.lets-do-it` | 해보자! | Let's do it! |
| (Extend to ~6 per situation) | ... | ... |

**CheerControls keys:**

| key | ko | en |
|-----|----|----|
| `tools.cheer.controls.effectLabel` | 효과 | Effect |
| `tools.cheer.controls.effect.static` | 정적 | Static |
| `tools.cheer.controls.effect.scroll` | 스크롤 | Scroll |
| `tools.cheer.controls.effect.flash` | 점멸 | Flash |
| `tools.cheer.controls.effect.neon` | 네온 | Neon |
| `tools.cheer.controls.speedLabel` | 속도 | Speed |
| `tools.cheer.controls.speed.slow` | 느림 | Slow |
| `tools.cheer.controls.speed.medium` | 보통 | Medium |
| `tools.cheer.controls.speed.fast` | 빠름 | Fast |
| `tools.cheer.controls.textColorLabel` | 글자색 | Text color |
| `tools.cheer.controls.bgColorLabel` | 배경색 | Background |
| `tools.cheer.controls.sizeLabel` | 크기 | Size |
| `tools.cheer.controls.landscapeLabel` | 가로 회전 | Landscape |
| `tools.cheer.controls.landscapeAria` | 배너를 가로로 회전 | Rotate banner to landscape |
| `tools.cheer.controls.fullscreenLabel` | 전체화면 | Fullscreen |
| `tools.cheer.controls.fullscreenUnsupported` | 전체화면 지원 안 함 | Fullscreen not supported |
| `tools.cheer.controls.keepAwakeLabel` | 화면 켜짐 유지 | Keep screen on |
| `tools.cheer.controls.keepAwakeUnsupported` | 지원 안 함 | Not supported |
| `tools.cheer.controls.lowContrastWarning` | 대비가 낮아요 | Low contrast |

**CheerDisplay keys:**

| key | ko | en |
|-----|----|----|
| `tools.cheer.display.placeholder` | 여기에 응원 문구가 표시돼요 | Your cheer message will appear here |
| `tools.cheer.display.ariaLabel` | 응원 배너: {text} | Cheer banner: {text} |

**CheerHowTo keys (gate-outside SSR):**

| key | ko | en |
|-----|----|----|
| `tools.cheer.howTo.heading` | 모두의 응원 사용 방법 | How to use Everyone's Cheer |
| `tools.cheer.howTo.whatTitle` | 모두의 응원이란? | What is Everyone's Cheer? |
| `tools.cheer.howTo.whatBody` | 응원 문구를... [refined paragraph ~200 words] | Everyone's Cheer turns... [refined paragraph] |
| `tools.cheer.howTo.howTitle` | 어떻게 사용하나요? | How to use it? |
| `tools.cheer.howTo.howBody` | 응원 문구를 입력... [refined paragraph] | Enter your cheer message... [refined paragraph] |
| `tools.cheer.howTo.useCasesTitle` | 언제 쓰나요? | When to use it? |
| `tools.cheer.howTo.useCasesBody` | 콘서트... [refined paragraph] | At a concert... [refined paragraph] |
| `tools.cheer.howTo.tipsTitle` | 팁 | Tips |
| `tools.cheer.howTo.tipsBody` | 긴장도를... [refined paragraph] | Adjust the tension... [refined paragraph] |

**CheerFaq keys:**

| key | ko | en |
|-----|----|----|
| `tools.cheer.faq.heading` | 자주 묻는 질문 | Frequently asked questions |
| `tools.cheer.faq.items[0].q` | 모두의 응원에서 내 응원이 저장되나요? | Is my cheer saved anywhere? |
| `tools.cheer.faq.items[0].a` | 아니요. 모든 데이터는... [short answer] | No. All data stays... [short answer] |
| (Expand to ~5–7 Q&A pairs) | ... | ... |

---

## 5. Wiring Checklist

Five platform touch points to integrate the tool:

- [ ] **Registry:** Add `cheer` entry to `src/tools/registry.ts` (as above)
- [ ] **Icon:** Import `Megaphone` in `src/components/home/toolStyle.tsx` and add to `TOOL_ICONS` map
- [ ] **i18n:** Add full `tools.cheer.*` namespace to `src/i18n/messages/ko.json` and `en.json`
- [ ] **Route:** Add slug branch in `src/app/[locale]/tools/[slug]/page.tsx` + dynamic import + `generateMetadata` for cheer
- [ ] **llms.txt:** Add one line entry in `public/llms.txt` with tool description
- **Sitemap:** Automatic (platform derives from registry `status: 'live'` and LiveTools)

---

## 6. Build Order & Parallelization

### Phase 1: Domain (Sequential, TDD Red→Green)

**domain-engineer owner**, 0 dependencies on UI/platform:

1. **schema.ts** → zod schemas + types (RED: test invalid inputs, GREEN: parse valid store)
2. **presets.ts** → constants + getPresetsByCategory() (RED: category grouping, GREEN: filter correct)
3. **recents.ts** → addRecent, pruneRecents (RED: MRU order, dedup, cap, GREEN: correct behavior)
4. **sanitize.ts** → normalizeMessage, isValidMessage (RED: trim/collapse/cap, GREEN: validation)
5. **contrast.ts** → luminance, contrastRatio, isLowContrast (RED: WCAG math, GREEN: correct ratios)

**Test coverage target:** ≥90% domain.

### Phase 2: Hooks (Parallel with UI prep)

**domain-engineer** + **platform-engineer**:

1. **useCheer.ts** → React state (settings + recents), localStorage read/write, preset apply, fullscreen/wake-lock wiring
   - Requires domain layer complete (depends on CheerSettings, PRESET_PHRASES, addRecent, etc.)
2. **useFullscreen.ts** → Fullscreen API + Wake Lock feature detection, lifecycle
   - Pure hook, no domain dependency

**Test coverage:** ≥80% hooks (unit tests with mocking of Fullscreen/WakeLock APIs).

### Phase 3: UI Components (Parallel with Phase 2)

**ui-engineer** owner, 2–3 collaborators split work:

Parallel tracks:
- **CheerDisplay.tsx** — Effect rendering (scroll/flash/neon/static), landscape, reduced-motion
- **CheerInput.tsx** + **CheerPresets.tsx** + **CheerControls.tsx** — Input field, preset tabs, control segments
- **Cheer.tsx** (orchestrator) — Wires hooks + components; mounted gate for localStorage

**Constraints:**
- All text from i18n; no hardcoding (en 누수 test on both locales)
- No phantom tokens; only DESIGN.md swatches
- Motion compositor-friendly only (transform, opacity, text-shadow)
- No new npm deps

**Test coverage:** ≥80% UI (snapshot, interaction, a11y, reduced-motion).

### Phase 4: SEO + Registry (Parallel with Phase 3 midway)

**seo-geo-engineer** + **platform-engineer**:

1. **CheerHowTo.tsx** + **CheerFaq.tsx** → Long-form content (gate-outside SSR)
2. **CheerStructuredData.tsx** → SoftwareApplication + FAQPage JSON-LD
3. **i18n** merge: tools.cheer.* ko/en (from ui + seo branches)
4. **Registry** + **toolStyle icon** + **route page.tsx branch** — platform wiring

**Constraints:**
- Meta + JSON-LD + HowTo/FAQ rendered **outside mounted gate** (SSR for crawlers)
- url == canonical in JSON-LD (use `seo.absoluteToolUrl`)
- FAQPage single owner (CheerFaq)

### Phase 5: E2E Testing (Parallel with Phase 4)

**qa-integration**:

**Scenarios to cover:**
1. Type message → live preview updates
2. Select preset → input + display update
3. Cycle effects (scroll/flash/neon/static) → correct animation/static rendering
4. Toggle landscape → rotate 90°
5. Enter fullscreen → panel fills screen; Esc exits
6. Keep-awake toggle (if supported)
7. Reload → settings + recents restored from localStorage
8. Reduced-motion emulation → scroll/flash render static
9. /ko + /en → no Korean leakage in English page, ko no English
10. 320px viewport → no overflow, tap targets ≥44px
11. Browser console 0 errors (pageerror hard gate)

**E2E file:** `tests/e2e/cheer.spec.ts`

---

## 7. Invariants & Design Constraints

1. **100% client-side, no backend.** No API calls, no database, no network (except AdSense from platform).
2. **Immutable state.** Domain layer never mutates; useCheer returns new CheerSettings objects on update.
3. **Compositor-only motion.** Transform, opacity, text-shadow only. Never animate width/height/top/left.
4. **Reduced-motion static.** Scroll/flash → static banner; neon/static unaffected.
5. **Feature-detection.** Fullscreen + Wake Lock are gracefully degraded if unsupported.
6. **localStorage no-throw.** Corrupt blob → start fresh; private mode unavailable → in-memory only.
7. **Palette strictly DESIGN.md.** No phantom tokens (e.g., brand-dark, surface-hover, etc.). Safe list: white, black, coral, sun, sky, grape, rose.
8. **Focus visible not focus.** All interactive elements use `focus-visible:ring-focus-ring`.
9. **i18n complete.** All UI chrome from t(); no hardcoding (test both ko/en locales).
10. **No new npm deps.** Use native Fullscreen API, Wake Lock API, CSS, zod (already in repo).

---

## 8. Success Criteria

- [ ] tsc 0 (no TypeScript errors)
- [ ] Domain ≥90% test coverage
- [ ] Overall tool ≥80% test coverage
- [ ] Static export builds ko/en without errors
- [ ] All 4 effects render correctly; reduced-motion static fallback works
- [ ] Fullscreen + wake-lock feature-detect; degrade gracefully if unsupported
- [ ] localStorage persist: settings + recents restored on reload
- [ ] No phantom tokens; all colors from DESIGN.md palette
- [ ] E2E cheer.spec passes all 11 scenarios (ko/en/320/reduced-motion/pageerror hard gate)
- [ ] Prerendered HTML includes unique meta, SoftwareApplication + FAQPage JSON-LD (url == canonical), HowTo/FAQ content (SSR outside mounted gate)
- [ ] Home card renders; footer category link works; search finds tool by keywords
- [ ] Zero console errors or warnings (time zone offset, hydration, mismatched text)
- [ ] Mobile usable one-handed (44px+ tap targets, no 320px overflow)

---

## 9. Risk Mitigation

**Potential gotchas:**

1. **Fullscreen on iOS Safari:** API not available on older versions. Fallback to fixed-position overlay.
2. **Wake Lock auto-release on hidden:** Re-acquire on visibilitychange when toggle ON.
3. **localStorage quota:** Silently fall back to in-memory if quota exceeded or private mode.
4. **Reduced-motion + scroll:** Ensure CSS respects `prefers-reduced-motion` (no transform animation).
5. **i18n key drift:** New keys in UI but missing from catalog → MISSING_MESSAGE at runtime. Test ko/en locales in component tests.
6. **Contrast pair low:** Warn but allow (not blocked); user can override.
7. **Message persistence timing:** Commit on show (Enter key or button click), not on every keystroke (draft-bound, no persist).

---

## 10. Implementation Checklist

- **domain-engineer:**
  - [ ] schema.ts (zod + interfaces + defaults)
  - [ ] presets.ts (PRESET_PHRASES constants)
  - [ ] recents.ts (addRecent, pruneRecents)
  - [ ] sanitize.ts (normalizeMessage, isValidMessage)
  - [ ] contrast.ts (contrastRatio, isLowContrast) — check if reusable from lib/qr-code
  - [ ] vitest 90%+ coverage
  - [ ] Ship with PR

- **ui-engineer (3 split):**
  - [ ] CheerDisplay.tsx (effect rendering, landscape, reduced-motion)
  - [ ] CheerInput.tsx + CheerPresets.tsx (input field, preset tabs)
  - [ ] CheerControls.tsx (segments, toggles, feature-detect UI)
  - [ ] Cheer.tsx (orchestrator, useCheer, mounted gate)
  - [ ] Component tests (ko/en locales, interaction, a11y, no phantom tokens)

- **platform-engineer:**
  - [ ] useCheer.ts hook
  - [ ] useFullscreen.ts hook
  - [ ] i18n merge (tools.cheer.* ko/en)
  - [ ] registry + icon + route + generateMetadata
  - [ ] llms.txt line

- **seo-geo-engineer:**
  - [ ] CheerHowTo.tsx (gate-outside SSR, 400 words, 4 sections)
  - [ ] CheerFaq.tsx (5–7 Q&A, FAQPage JSON-LD single owner)
  - [ ] CheerStructuredData.tsx (SoftwareApplication, url == canonical)

- **qa-integration:**
  - [ ] cheer.spec.ts (11 scenarios + pageerror gate)
  - [ ] Full E2E suite regression (44+ tests)
  - [ ] 320/1440px responsive, ko/en, reduced-motion, console 0

---

## Summary

**Everyone's Cheer** is a **client-side single-page SPA** for live cheer message display. The architecture cleanly separates **domain** (pure, testable, framework-free) from **React hooks** (state, lifecycle, feature-detect) from **UI components** (visual, interactive) from **SEO** (gate-outside SSR). Parallel development is enabled by explicit **contracts**: domain APIs, hook returns, component props are fixed before implementation begins. **Invariants** (immutability, compositor-only motion, no new deps, i18n complete, DESIGN.md palette only) are enforced at every layer.

---

**Blueprint created:** 2026-07-20  
**Status:** Ready for domain-engineer to begin Phase 1 (RED)  
**Next step:** Domain-engineer claims schema.ts and begins TDD.
