# Lotto Number Generator — Clean-Architecture Blueprint

**Architect:** Architecture & Domain Contracts  
**Date:** 2026-07-20  
**Status:** Ready for build team (domain-engineer → ui-engineer ∥ platform-engineer → qa-integration)

---

## 1. Layer Decomposition (Clean Architecture)

### Domain Layer (Pure, No React/DOM)
**Dependency:** ← Platform (CLI params) ← UI (state dispatch)  
**Exports:** Pure functions + types for random generation, schema validation, color mapping, history ops.

**Files to CREATE:**
```
src/lib/lotto-generator/
├── schema.ts                     # Zod: Draw, Settings, HistoryEntry, LottoStore
├── random.ts                     # fairDraw(), Fisher–Yates partial shuffle, chi-square test
├── colors.ts                     # ballColor(number) → (bgClass, textClass)
├── validate.ts                   # isDrawFeasible(), conflicts()
├── history.ts                    # addHistory(), pruneUnknown(), clearHistory()
├── schema.test.ts                # Schema validation, parsing
├── random.test.ts                # CHI-SQUARE fairness test (RED first), edge cases
├── validate.test.ts              # Feasibility constraints
└── history.test.ts               # Immutable history operations
```

### UI Layer (React Client Components)
**Dependency:** → Domain contracts only  
**Exports:** React hooks + presentational components.

**Files to CREATE:**
```
src/components/tools/lotto-generator/
├── LottoGenerator.tsx                    # "use client"; orchestrator, owns state
├── useLottoGenerator.ts                  # Hook: draw logic, localStorage persist
├── BallDisplay.tsx                       # Single 44px ball, pop animation, ARIA
├── GameList.tsx                          # Grid of games, copy-all, empty state
├── SettingsPanel.tsx                     # Game count, fixed/excluded, generate button
├── HistoryPanel.tsx                      # Past draws, timestamps, clear button
├── ResponsibilityDisclaimer.tsx          # Prominent warning (always visible, not optional)
├── LottoIntro.tsx                        # H1 + lead (can SSR outside mounted gate)
├── LottoHowTo.tsx                        # SEO long-form (4 items: 사용법+공정성보장)
├── LottoFaq.tsx                          # FAQPage JSON-LD (owns sole FAQPage)
├── LottoStructuredData.tsx               # SoftwareApplication + BreadcrumbList (co-owned)
├── LottoGenerator.test.tsx               # Interaction tests (render, click, state)
├── BallDisplay.test.tsx                  # Animation + ARIA + color mapping
├── GameList.test.tsx                     # Render games, copy, empty state
├── SettingsPanel.test.tsx                # Feasibility validation, input range
├── HistoryPanel.test.tsx                 # History render, clear, localStorage persist
├── useLottoGenerator.test.ts             # Hook logic, localStorage sync, draw calls
├── LottoHowTo.test.tsx                   # i18n keys (real catalog, not mock)
└── LottoFaq.test.tsx                     # FAQPage JSON structure validation
```

### Platform Layer (Framework Wiring)
**Dependency:** → Domain contracts, UI exports  
**Manages:** Registry, routing, i18n, SEO metadata, component branching.

**Files to WIRE/MODIFY:**
```
src/tools/
├── registry.ts                   # ADD lotto-generator ToolMeta entry
├── types.ts                      # (already defines ToolMeta, no change)

src/components/home/
└── toolStyle.tsx                 # ADD `Dices` import → TOOL_ICONS['lotto-generator']

src/app/[locale]/tools/
└── [slug]/page.tsx               # ADD slug branch for 'lotto-generator' → <LottoGenerator />

src/i18n/messages/
├── ko.json                       # ADD tools.lotto-generator.* namespace (see §5 table)
└── en.json                       # ADD tools.lotto-generator.* namespace (see §5 table)

public/
└── llms.txt                      # ADD 1 line: /tools/lotto-generator

(No change needed to app shell, consent banner, ad loading, middleware, tokens.css)
```

---

## 2. Domain Public API Contract

### Type Definitions

```typescript
// src/lib/lotto-generator/schema.ts

/** Single lottery draw: 6 unique sorted numbers from 1–45 */
export type Draw = number[];

/** User input for generating draws */
export interface Settings {
  gameCount: number;           // 1–10
  fixedNumbers: number[];      // 0–5, always included
  excludedNumbers: number[];   // 0–39, never picked
}

/** Result of one generation session */
export interface DrawResult {
  games: Draw[];               // Array of N draws (gameCount = games.length)
  settings: Settings;          // The settings used
}

/** Persisted history entry */
export interface HistoryEntry {
  timestamp: string;           // ISO 8601
  gameCount: number;
  fixedNumbers: number[];
  excludedNumbers: number[];
  games: Draw[];
}

/** Client localStorage schema */
export interface LottoStore {
  version: number;
  history: HistoryEntry[];     // Max 20 entries (oldest first)
  lastSettings: Settings | null;
}

// Zod schemas (validation at boundaries)
export const SettingsSchema: z.ZodSchema<Settings>;
export const DrawSchema: z.ZodSchema<Draw>;
export const HistoryEntrySchema: z.ZodSchema<HistoryEntry>;
export const LottoStoreSchema: z.ZodSchema<LottoStore>;

// Constants
export const GAME_COUNT_MIN = 1;
export const GAME_COUNT_MAX = 10;
export const FIXED_MAX = 5;
export const EXCLUDED_MAX = 39;
export const LOTTO_MIN = 1;
export const LOTTO_MAX = 45;
export const NUMBERS_PER_GAME = 6;
export const HISTORY_MAX = 20;
export const BALL_POP_DURATION_MS = 150;
export const BALL_STAGGER_MS = 100;
export const BEEP_FREQ_HZ = 900;
```

### Random Generation (Core Fairness)

```typescript
// src/lib/lotto-generator/random.ts

/** RNG type: returns uniform [0, 1) */
export type Rng = () => number;

/**
 * Default unbiased RNG: crypto.getRandomValues → [0, 1)
 * This is the ONLY place that directly calls crypto.
 */
export const cryptoRng: Rng;

/**
 * CRITICAL FAIRNESS: Draw N unique numbers from valid set.
 * 
 * Invariant: All eligible numbers (1–45 minus excluded, minus fixed) have equal probability
 * of being selected. Uses rejection sampling (no modulo bias).
 * 
 * Algorithm: Fisher–Yates partial shuffle on candidates.
 * 
 * @param fixedNumbers - Always included (0–5)
 * @param excludedNumbers - Never picked (0–39)
 * @param rng - Injectable RNG function (default: cryptoRng)
 * @returns Array of exactly 6 unique sorted numbers from 1–45
 * @throws Error if constraints are infeasible
 */
export function fairDraw(
  fixedNumbers: number[],
  excludedNumbers: number[],
  rng?: Rng
): Draw;

/**
 * Generate multiple draws in one call.
 * 
 * @param gameCount - 1–10
 * @param fixedNumbers - 0–5
 * @param excludedNumbers - 0–39
 * @param rng - Optional injectable RNG
 * @returns DrawResult with games array
 */
export function fairDrawGames(
  gameCount: number,
  fixedNumbers: number[],
  excludedNumbers: number[],
  rng?: Rng
): DrawResult;

/**
 * Chi-square uniformity test (used in vitest only).
 * Asserts that each number 1–45 has equal probability across many draws.
 * 
 * RED first: this test FAILS until fairDraw is implemented correctly.
 * 
 * @param iterations - Suggested ≥ 10000
 * @param rng - Optional RNG (default: cryptoRng)
 * @returns chi2 statistic (for introspection; test asserts chi2 < criticalValue)
 */
export function chiSquareUniformityTest(
  iterations: number,
  rng?: Rng
): number;
```

### Validation

```typescript
// src/lib/lotto-generator/validate.ts

/**
 * Check if draw constraints are feasible.
 * 
 * @param fixedCount - 0–5
 * @param excludedCount - 0–39
 * @returns true if (45 - excludedCount) ≥ (6 - fixedCount)
 */
export function isDrawFeasible(fixedCount: number, excludedCount: number): boolean;

/**
 * Describe conflict if infeasible.
 * 
 * @returns null if feasible; error message string otherwise (i18n key)
 */
export function feasibilityError(
  fixedCount: number,
  excludedCount: number
): string | null;
```

### Color Mapping

```typescript
// src/lib/lotto-generator/colors.ts

export interface BallColor {
  bgClass: string;   // Tailwind class: bg-accent-sun | bg-accent-sky | etc.
  textClass: string; // text-white (default) | text-text (for gray)
}

/**
 * Map lotto number 1–45 to official Korean ball band color.
 * 
 * 1–10: yellow (bg-accent-sun)
 * 11–20: blue (bg-accent-sky)
 * 21–30: red (bg-accent-coral)
 * 31–40: gray (bg-surface-sunken, text-text)
 * 41–45: green (bg-accent-mint)
 * 
 * @param number - 1–45
 * @returns BallColor with Tailwind classes
 */
export function ballColor(number: number): BallColor;
```

### History (Immutable Operations)

```typescript
// src/lib/lotto-generator/history.ts

/**
 * Add a new entry to history (immutable).
 * 
 * @param history - Existing history array
 * @param entry - New entry to prepend
 * @returns New array with entry at index 0, max 20 total
 */
export function addHistory(
  history: HistoryEntry[],
  entry: HistoryEntry
): HistoryEntry[];

/**
 * Prune invalid entries after localStorage load.
 * Removes entries with infeasible or corrupt settings.
 * 
 * @param history - Loaded from localStorage
 * @returns New array with only valid entries
 */
export function pruneUnknown(history: HistoryEntry[]): HistoryEntry[];

/**
 * Clear all history (immutable).
 * 
 * @param history - Existing history
 * @returns Empty array
 */
export function clearHistory(history: HistoryEntry[]): HistoryEntry[];

/**
 * Parse localStorage JSON string.
 * On any error, returns fresh empty store (never throws).
 * 
 * @param raw - Raw localStorage value or null
 * @returns LottoStore (valid or fresh)
 */
export function parseStore(raw: string | null): LottoStore;
```

---

## 3. Fairness Invariant & Chi-Square Test Design

### Invariant Statement

**CRITICAL:** The `fairDraw()` function guarantees that every number in the valid set {1, 2, ..., 45} ∖ (excluded ∪ fixed) has **exactly equal probability** of being selected in the output array. Fixed numbers bypass the draw and are always included. Excluded numbers are filtered out before drawing.

### Algorithm (Fisher–Yates Partial Shuffle)

```
fairDraw(fixed[], excluded[], rng):
  1. Build validNumbers = [1..45].filter(n => !excluded.has(n))
  2. fixedSet = Set(fixed)
  3. candidates = validNumbers.filter(n => !fixedSet.has(n))
  4. remaining = 6 - fixed.length  # numbers still need to pick
  5. For i = 0 to remaining - 1:
       j = i + randomInt(0, candidates.length - i, rng)  // NO modulo bias
       swap(candidates[i], candidates[j])
  6. selected = candidates.slice(0, remaining)
  7. allNumbers = sorted(fixed ∪ selected)
  8. return allNumbers
```

**Key:** `randomInt(0, max, rng)` uses rejection sampling to avoid modulo bias:
```
  Do:
    r = rng() * max  // [0, max)
  While r ≥ floor(max) or r is out of valid range
  Return floor(r)
```

### Chi-Square Test (vitest, RED → GREEN)

**Setup:** Run `fairDraw([], [], crypto)` K times (K ≥ 10,000). Collect frequency count[n] for each n ∈ 1..45.

**Computation:**
```
Expected[n] = K × 6 / 45  (each number appears in ~6/45 of all draws)
Observed[n] = count[n]
χ² = Σ(Observed[n] - Expected[n])² / Expected[n]  for n ∈ 1..45
DoF = 44  (45 categories, 1 constraint on total)
```

**Test Assertion:**
```typescript
const chiSquared = computeChiSquare(draws);
const criticalValue = 59.30;  // DoF=44, α=0.05
expect(chiSquared).toBeLessThan(criticalValue);
```

**Vitest Structure:**
```typescript
describe('src/lib/lotto-generator/random', () => {
  describe('fairDraw', () => {
    it('RED: fairness — chi-square test passes (10k iterations)', () => {
      // This FAILS until fairDraw() is correct.
      // TDD: write this test FIRST, watch it fail, then implement fairDraw.
    });

    it('returns exactly 6 unique sorted numbers in [1, 45]', () => { /* ... */ });
    it('includes all fixed numbers', () => { /* ... */ });
    it('excludes all excluded numbers', () => { /* ... */ });
    it('rejects infeasible constraints', () => { /* ... */ });
  });
});
```

**Domain Test Coverage Target:** ≥90% (fairness test is 1 file, ~100 lines; chi-square is 10–15 lines).

---

## 4. Ball Animation & Immersion Design (User Requirement)

### State Machine (in Hook)

`useLottoGenerator` hook owns an internal animation state:

```typescript
type AnimationPhase = 'idle' | 'rolling' | 'locking' | 'done';

interface AnimationState {
  phase: AnimationPhase;
  ballIndices: number[];  // Which balls are currently animating [0..5]
  activeBallIndex: number; // Current ball being locked (during 'locking' phase)
}
```

### Animation Choreography

1. **User clicks "Generate"** → `phase = 'idle'`, draw games
2. **Transition to 'rolling'** (immediate) → each ball rapidly cycles candidate numbers (slot-machine tumble)
   - Roll duration: ~500ms per ball, staggered by 100ms
   - Roll starts at staggerIndex × 100ms
   - During roll: ball shows rapidly changing numbers (50ms per candidate)
3. **Transition to 'locking'** (when all rolls complete) → balls lock one by one with pop sound
   - Lock duration: 150ms per ball
   - Pop sound plays at lock time
   - Pop scale: 0 → 1 (150ms), opacity: 0 → 1 (150ms)
   - Pop stagger: 100ms between balls
4. **Transition to 'done'** (when all locks complete)
   - Confetti fires (reuse `roulette` confetti.ts)
   - Results remain visible in GameList

### Timing Constants

```typescript
const ROLL_DURATION_MS = 500;          // Per-ball roll duration
const LOCK_DURATION_MS = 150;          // Per-ball lock/pop duration
const STAGGER_MS = 100;                // Between balls
const CANDIDATE_FLIP_MS = 50;          // Each candidate number shown during roll
const BEEP_FREQ_HZ = 900;              // Pop sound frequency
const TOTAL_ANIMATION_MS = (6 - 1) * STAGGER_MS + ROLL_DURATION_MS + LOCK_DURATION_MS;
// For 6 balls: ~1050ms
```

### Accessibility & Motion

- **`prefers-reduced-motion: reduce`** (media query):
  - Skip rolling phase entirely
  - Skip lock animation (show balls instantly with 1 opacity)
  - Skip sound (respect `Howler.js` mute, or skip Web Audio)
  - Skip confetti
- **Focus & ARIA:**
  - BallDisplay each has `role="img"`, `aria-label="공 {number}"` (ko) or `"Ball {number}"` (en)
  - During animation, update aria-live="polite" status: "공들이 나타나고 있습니다" / "Balls are revealing"

### Component Ownership

- **Hook (`useLottoGenerator`)** owns `animationState`, dispatches phase changes via callbacks
- **GameResults component** (presentational, in GameList) receives:
  - `games: Draw[]`
  - `animationPhase: AnimationPhase`
  - `animationBallIndices: number[]`
  - `onAnimationComplete: () => void`
- **BallDisplay** (leaf) receives:
  - `number: number`
  - `index: number` (0–5)
  - `isAnimating: boolean`
  - `animationPhase: AnimationPhase`
  - Renders CSS `data-phase={phase}` for tailwind animations
- **No global listeners in leaf components.** Animation timing is deterministic (constant delays, no `setTimeout` in Balls).

### Testability

- Inject timing constants via context or props for E2E:
  ```typescript
  // vitest: mock timing
  vi.useFakeTimers();
  // E2E: real Web API but measure via Playwright waitForTimeout
  ```
- Animation is CSS + state-driven, no RAF loops in leaf components (unless rrdom-backed, which is not needed here).

---

## 5. i18n Key Contract (Separate-Column Table)

**CRITICAL:** Architect provides this table. Platform engineer PASTES these exact ko/en strings into `src/i18n/messages/{ko,en}.json` under `tools.lotto-generator.*` namespace. **NO** `"KO | EN"` pipe strings — that pollutes ko.json.

| Key Path | Ko | En |
|---|---|---|
| **Top-level (searchable-tools, footer, home card)** |
| `tools.lotto-generator.title` | 로또 번호 생성기 | Lotto Number Generator |
| `tools.lotto-generator.description` | 공정하게 로또 번호를 생성하세요. 당첨을 보장하지는 않습니다. | Generate fair lottery numbers with cryptographic randomness. No odds guarantee — for entertainment only. |
| **Intro (eyebrow, H1, lead)** |
| `intro.eyebrow` | 랜덤·추첨 | RANDOM |
| `intro.heading` | 로또 번호 생성기 | Lotto Number Generator |
| `intro.lead` | 공정하게 로또 번호를 만들어드립니다. 당첨을 보장하지는 않습니다. | Generate fair lottery numbers with cryptographic randomness. No guarantee of winning — for entertainment only. |
| **Settings Panel** |
| `settings.gameCount.label` | 생성할 게임 수 | Number of Games |
| `settings.gameCount.help` | 1개에서 10개까지 선택할 수 있습니다. | Choose between 1 and 10 games. |
| `settings.fixedNumbers.label` | 매번 포함할 번호 (최대 5개) | Always Include (up to 5) |
| `settings.fixedNumbers.help` | 선택한 번호는 모든 게임에 포함됩니다. | These numbers will appear in every game. |
| `settings.fixedNumbers.add` | 번호 추가 | Add Number |
| `settings.fixedNumbers.remove` | 제거 | Remove |
| `settings.excludedNumbers.label` | 제외할 번호 (최대 39개) | Never Include (up to 39) |
| `settings.excludedNumbers.help` | 선택한 번호는 절대 나올 수 없습니다. | These numbers will never be picked. |
| `settings.excludedNumbers.add` | 번호 추가 | Add Number |
| `settings.excludedNumbers.remove` | 제거 | Remove |
| `settings.infeasible` | 충분한 번호를 선택할 수 없습니다. 포함 번호를 줄이거나 제외 번호를 줄여주세요. | Not enough numbers available. Reduce fixed or excluded numbers. |
| `buttons.generate` | 번호 생성하기 | GENERATE |
| **Results & GameList** |
| `results.title` | 생성된 번호 | Generated Numbers |
| `results.gameLabel` | 게임 {count} | Game {count} |
| `results.empty` | 번호를 생성해보세요. | Generate numbers to get started. |
| `buttons.copyAll` | 복사 | COPY |
| `buttons.copied` | 복사되었습니다! | Copied! |
| **History Panel** |
| `history.title` | 지난 생성 기록 | Generation History |
| `history.empty` | 생성 기록이 없습니다. | No history yet. |
| `history.timestamp.justNow` | 방금 전 | Just now |
| `history.timestamp.minutesAgo` | {n}분 전 | {n} minutes ago |
| `history.timestamp.hoursAgo` | {n}시간 전 | {n} hours ago |
| `history.timestamp.daysAgo` | {n}일 전 | {n} days ago |
| `history.gameCountLabel` | {n}게임 | {n} games |
| `history.expandLabel` | 보기 | Show |
| `history.collapseLabel` | 숨기기 | Hide |
| `buttons.clearHistory` | 기록 지우기 | Clear History |
| **Responsibility Disclaimer** |
| `disclaimer.heading` | ⚠️ 중요 안내 | ⚠️ Important Notice |
| `disclaimer.text` | 이 도구가 만든 번호는 완전히 무작위로 생성되며, 당첨 확률을 높이지 않습니다. 로또는 도박이며 도박에는 위험이 따릅니다. 본인의 판단과 책임 하에 참여하세요. | These numbers are randomly generated and do NOT improve your odds. Lottery play carries financial risk. Play responsibly and only with money you can afford to lose. |
| **HowTo (Long-form SEO)** |
| `howTo.title` | 사용 방법 | How to Use |
| `howTo.items[0].title` | 3단계로 로또 번호를 생성하세요 | Generate in 3 Steps |
| `howTo.items[0].description` | **1단계:** 생성할 게임 수를 선택합니다 (1–10개). **2단계:** 선택적으로 매번 포함할 번호와 제외할 번호를 지정합니다. **3단계:** '번호 생성하기'를 누르면 공정한 랜덤 추첨으로 번호를 만듭니다. | **Step 1:** Choose how many games to generate (1–10). **Step 2:** Optionally specify numbers to always include (up to 5) and numbers to exclude (up to 39). **Step 3:** Click "Generate" to create fair random draws using cryptographic randomness. |
| `howTo.title` (2nd item) | 공정성 보장 | Fairness Guarantee |
| `howTo.items[1].title` | 암호학적 난수로 완전히 공정한 추첨 | Cryptographically Secure Randomness |
| `howTo.items[1].description` | 이 도구는 `crypto.getRandomValues`를 사용하여 모든 번호가 동등한 확률로 선택되도록 보장합니다. 시각적 편향이나 예측 가능한 패턴은 없습니다. 통계적 검증(카이제곱 검정)으로 공정성을 확인했습니다. | This tool uses `crypto.getRandomValues` with Fisher–Yates shuffle to ensure every eligible number has equal probability. No visual bias, no predictable patterns. Statistical validation (chi-square test) confirms fairness. |
| **FAQ (FAQPage JSON-LD)** |
| `faq.items[0].q` | 이 번호로 당첨될 수 있나요? | Can I win with these numbers? |
| `faq.items[0].a` | 네, 하지만 이 도구는 당첨 확률을 높이지 않습니다. 모든 로또 번호 조합은 동등한 확률을 가집니다. | Yes, but this tool doesn't improve your odds. All lottery combinations have equal probability. The generator produces truly random numbers only. |
| `faq.items[1].q` | 고정 번호와 제외 번호의 차이는 무엇인가요? | What's the difference between fixed and excluded? |
| `faq.items[1].a` | **고정 번호:** 매번 포함될 번호입니다. 예를 들어 고정 번호로 [7, 13]을 선택하면, 생성되는 모든 게임에 7과 13이 포함됩니다. **제외 번호:** 절대 나올 수 없는 번호입니다. 제외 번호로 [1, 2, 3]을 선택하면, 생성되는 어떤 게임에도 1, 2, 3이 나타나지 않습니다. | **Fixed:** Numbers that will always appear in every game. For example, if you fix [7, 13], all generated games will include both numbers. **Excluded:** Numbers that will never be picked. For example, if you exclude [1, 2, 3], these numbers will never appear in any game. |
| `faq.items[2].q` | 이것이 불법인가요? | Is this legal? |
| `faq.items[2].a` | 아니요. 이 도구는 난수 생성만 할 뿐 도박을 유도하지 않습니다. 로또 구매와 참여는 본인의 판단과 책임입니다. | Yes, it's legal. This tool only generates random numbers and does not encourage gambling. Lottery play is your personal choice and responsibility. |
| `faq.items[3].q` | 이 도구가 실제로 당첨 번호를 예측할 수 있나요? | Can this tool predict winning numbers? |
| `faq.items[3].a` | 절대 아닙니다. 이 도구는 순수 난수를 생성할 뿐입니다. 과거 당첨 번호를 분석하거나 미래를 예측하는 기능은 없습니다. 로또 번호는 매주 완전히 독립적으로 추첨되므로 이전 번호는 미래에 영향을 주지 않습니다. | No, absolutely not. This tool only generates truly random numbers. It does not analyze past winning numbers or predict future draws. Lottery drawings are completely independent each week; previous results have no influence on future ones. |
| `faq.items[4].q` | 로또 번호를 여러 번 생성하면 당첨 확률이 올라가나요? | Do my odds improve if I generate more numbers? |
| `faq.items[4].a` | 아니요. 1게임을 생성하든 10게임을 생성하든, 각 게임의 당첨 확률은 동일하게 약 1/8,145,060입니다. 더 많은 번호를 생성한다고 해서 당첨 확률이 높아지지 않습니다. 로또는 완전히 운의 게임입니다. | No. Whether you generate 1 game or 10 games, each game has the same odds of winning: approximately 1 in 8,145,060. Generating more numbers does not increase your chances. Lottery is entirely a game of chance. |
| `faq.items[5].q` | 내 생성 기록은 어디에 저장되나요? | Where are my generation records stored? |
| `faq.items[5].a` | 모든 생성 기록은 브라우저의 로컬 저장소(localStorage)에만 저장됩니다. 서버에 전송되거나 저장되지 않습니다. 다른 기기나 브라우저에서는 기록이 보이지 않습니다. 브라우저 캐시를 비우면 기록이 삭제됩니다. | All generation records are stored only in your browser's localStorage. They are never sent to a server or stored remotely. Records will not appear on other devices or browsers. Clearing your browser cache will delete the history. |
| **Error Messages & Toasts** |
| `errors.infeasible` | 충분한 번호를 선택할 수 없습니다. | Not enough numbers available to generate. |
| `errors.invalidInput` | 입력값이 올바르지 않습니다. | Invalid input. |
| `toasts.copied` | 복사되었습니다! | Copied! |
| `toasts.error` | 오류가 발생했습니다. | An error occurred. |

---

## 6. Platform Wiring Delta

### Registry Entry (src/tools/registry.ts)

Add to the `tools` array:
```typescript
{
  id: 'lotto-generator',
  slug: 'lotto-generator',
  category: 'random',
  icon: 'Dices',
  accent: 'sun',
  status: 'coming_soon',  // Change to 'live' on launch
  addedAt: '2026-07-20',
  order: 75,              // Sun accent precedent: roulette=80; lotto=75 (earlier in random category)
  keywords: ['로또', '로또번호', '로또생성기', '번호생성', '추첨', '공정', '난수', 'lotto', 'lottery', 'number generator', 'random', 'fair draw'],
}
```

### Icon (src/components/home/toolStyle.tsx)

```typescript
// At top of file:
import { Dices } from 'lucide-react';  // Already in lucide-react

// In TOOL_ICONS:
'lotto-generator': Dices,
```

### Route (src/app/[locale]/tools/[slug]/page.tsx)

Add a slug branch in the component:
```typescript
// Inside ToolBody or the main tool switch:
case 'lotto-generator':
  return <LottoGenerator />;
```

Also in `generateMetadata`:
```typescript
if (slug === 'lotto-generator') {
  return buildToolMetadata({
    tool: registry.find(t => t.slug === 'lotto-generator'),
    locale,
    absoluteUrl: absoluteToolUrl(locale, 'lotto-generator'),
  });
}
```

### i18n Messages (src/i18n/messages/{ko,en}.json)

**Platform engineer:** Use the table in §5 to add the `tools.lotto-generator` namespace under `tools` key in both ko.json and en.json. Ensure:
- Top-level `title` and `description` exist (for home card, footer, search)
- All section keys are present (settings, results, history, disclaimer, howTo, faq)
- Ko ↔ En strings are exactly as specified (no machine translation drift)
- No dangling `{…}` placeholders (all mustache-filled by i18n runtime)

### SEO & LLMs (public/llms.txt)

Add one line in the appropriate category:
```
/tools/lotto-generator
```

### No App-Level Changes

- **No new middleware (middleware.ts):** Locale routing already works
- **No new tokens (src/app/globals.css):** Use only DESIGN.md tokens (accent-sun, surface-sunken, etc.)
- **No new consent policies:** Existing banner covers this (no external API calls)
- **No AdSense ad slots:** Platform template already includes ad wrapper in route

---

## 7. Build Order & Dependency Graph

```
┌─────────────────────────────────────────────────────┐
│ Phase 1: Architecture & Specification              │
│ (Architect hands off blueprint to team)            │
└─────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────┐
│ Phase 2: Domain (Parallel to nothing; prerequisite) │
│                                                      │
│ domain-engineer:                                     │
│   1a. [RED] random.test.ts chi-square test          │
│   1b. random.ts implementation (fairDraw, crypto)   │
│   1c. GREEN chi-square test                         │
│   2. schema.ts (zod schemas)                        │
│   3. validate.ts (feasibility check)                │
│   4. colors.ts (ball colors)                        │
│   5. history.ts (immutable ops)                      │
│   All domain tests must PASS (≥90% coverage)        │
└──────────────────────────────────────────────────────┘
                         ↓
         Domain READY for UI consumption
                         ↓
  ┌─────────────────────────────────────────────────┐
  │ Phase 3: UI & Platform (Parallel)               │
  │                                                 │
  │ ui-engineer:                                    │
  │   • useLottoGenerator (hook)                    │
  │   • LottoGenerator (orchestrator)               │
  │   • BallDisplay, GameList, SettingsPanel, etc. │
  │   • All component tests (render, interaction)   │
  │   • i18n key consumption (MUST use real ko/en   │
  │     catalog from next step, not mock)           │
  │                                                 │
  │ platform-engineer:                              │
  │   • registry.ts entry                           │
  │   • toolStyle.tsx icon                          │
  │   • route slug branch                           │
  │   • i18n messages ko.json & en.json             │
  │   • llms.txt entry                              │
  │   • generateMetadata branch                     │
  └─────────────────────────────────────────────────┘
                         ↓
         UI + Platform READY for integration
                         ↓
┌────────────────────────────────────────────────────┐
│ Phase 4: QA & Integration                          │
│                                                    │
│ qa-integration:                                    │
│   • End-to-end tests (Playwright)                 │
│     - Happy path: generate, copy, save history    │
│     - Feasibility: infeasible constraints         │
│     - History: persist across reload              │
│     - Responsibility: disclaimer visible          │
│   • All tests GREEN                               │
│   • Accessibility (a11y): WCAG 2.1 AA            │
│   • Visual regression (ko/en, 320/1440)          │
│   • tsc 0, all linters PASS                       │
│   • Build 1 page SSG verified                     │
│   • Linter-driven review: color-tokens guard      │
└────────────────────────────────────────────────────┘
                         ↓
              All TESTS PASS → READY TO COMMIT
```

### Parallelization Boundary

- **Domain must be DONE first** (chi-square test RED→GREEN is the gating signal)
- **UI & Platform can start simultaneously** once domain contracts are finalized
- **QA can start** once any component renders (doesn't need all UI done)
- **Actual integration** happens when platform i18n is committed (ui-engineer must wait for platform-engineer to write ko.json/en.json, then **re-run full vitest suite to verify no MISSING_MESSAGE**)

---

## 8. Acceptance Criteria & Final Checklist

### Domain (domain-engineer ✓)
- [ ] `src/lib/lotto-generator/random.test.ts` chi-square test RED (fails)
- [ ] `fairDraw()` implemented, chi-square test GREEN
- [ ] `fairDrawGames()` works for gameCount 1–10
- [ ] All domain functions tested (≥90% coverage)
- [ ] No React/Next/DOM imports in lib/
- [ ] Zod schemas parse/validate correctly
- [ ] Feasibility validation rejects infeasible combinations
- [ ] Ball color mapping matches official lotto bands (1–10 yellow, etc.)
- [ ] History ops are immutable (spread, not mutate)

### UI (ui-engineer ✓)
- [ ] `useLottoGenerator` hook owns state, persists to localStorage
- [ ] LottoGenerator orchestrator renders all sub-components
- [ ] BallDisplay renders 44px ball, pop animation (150ms), respects reduced-motion
- [ ] GameList displays games in rows, copy-all, empty state
- [ ] SettingsPanel controls game count (1–10), fixed/excluded inputs, feasibility warning
- [ ] HistoryPanel shows past draws with timestamps, clear button
- [ ] ResponsibilityDisclaimer always visible, not optional
- [ ] LottoIntro, LottoHowTo, LottoFaq render with i18n keys
- [ ] All component tests GREEN (render, interaction, localStorage)
- [ ] **Real i18n catalog used in tests** (not mock) → no MISSING_MESSAGE
- [ ] No console.log or debug statements
- [ ] Focus visible (`:focus-visible:`) on all interactive elements

### Platform (platform-engineer ✓)
- [ ] Registry entry added to `tools` array
- [ ] Icon `Dices` imported and mapped in `toolStyle.tsx`
- [ ] Route slug 'lotto-generator' branches to `<LottoGenerator />`
- [ ] generateMetadata includes lotto-generator case
- [ ] i18n messages: ko.json & en.json have all `tools.lotto-generator.*` keys from §5 table
- [ ] Ko ↔ En strings exactly match architect spec (no machine translation)
- [ ] llms.txt includes `/tools/lotto-generator`
- [ ] No trailing commas or JSON parse errors

### QA & Integration (qa-integration ✓)
- [ ] E2E Scenario 1 (Happy path): Generate 3 games, no fixed/excluded → 6 unique sorted numbers per game, color-coded ✓
- [ ] E2E Scenario 2 (Fixed + Excluded): Fix [1,7], exclude [10–20, 30–40] → 6 numbers, includes 1&7, none from excluded ranges ✓
- [ ] E2E Scenario 3 (Infeasible): Fix [1–5], exclude [6–45] → error toast, generate button disabled ✓
- [ ] E2E Scenario 4 (Persistence): Generate 2 games → reload → history shows 1 entry with 2 games, settings restored ✓
- [ ] E2E Scenario 5 (Responsibility): Disclaimer visible on page load, FAQ includes "Does this improve odds? No." ✓
- [ ] `tsc --noEmit` returns 0
- [ ] All vitest suites pass (domain, UI, utils)
- [ ] E2E tests pass (5 scenarios above)
- [ ] Lighthouse Core Web Vitals OK (LCP <2.5s, INP <200ms, CLS <0.1)
- [ ] Accessibility (a11y): `npx axe` on ko & en pages passes WCAG 2.1 AA
- [ ] No phantom tokens (grep `bg-brand-dark`, `surface-hover`, etc.; color-tokens guard pass)
- [ ] Visual regression: ko/en screenshots at 320, 1440 show consistent design system application
- [ ] Build produces 1 SSG page (`out/ko/tools/lotto-generator/index.html` + en equivalent)
- [ ] Hydration safe: no browser-only values in useState initializers

---

## 9. Key Implementation Notes

1. **Fairness is NON-NEGOTIABLE:** `crypto.getRandomValues` + Fisher–Yates rejection sampling + chi-square test RED→GREEN. No approximations.
2. **Ball animation is state-driven, CSS-rendered:** Stagger, pop, sound are triggered by hook state machine; no RAF loops in leaf components.
3. **useLottoGenerator is the single source of truth** for gameCount, fixedNumbers, excludedNumbers, games, history, animationState. UI components are presentational.
4. **localStorage schema (LottoStore)** is zod-parsed on mount; corrupt data silently ignored → fresh start (fail-safe, never throws).
5. **i18n is NOT optional:** All UI chrome (labels, buttons, error messages, disclaimer) must use `useTranslations()` + i18n keys. **Real ko/en catalogs in tests**, not mock — catch MISSING_MESSAGE.
6. **Feasibility validation prevents impossible draws:** 45 − excludedCount ≥ 6 − fixedCount. Checked inline, error toast if infeasible, button disabled.
7. **ResponsibilityDisclaimer is ALWAYS visible** (not behind accordion, not optional). Required by SPEC design intent.
8. **No external data:** All draws are deterministic from user input + secure RNG. No API calls, no backend dependency.
9. **Design tokens only (DESIGN.md, tokens.css):** Ball colors = `--accent-sun/sky/coral`, `--surface-sunken`, `--accent-mint`. No phantom tokens like `--surface-hover`.
10. **Build order is STRICT:** Domain RED→GREEN first; UI consumes domain contracts; platform wires; QA integrates. Parallelization boundary is domain → UI+platform ∥ QA.

---

## Appendix: File Inventory Summary

| Category | Files | Loc Est. | Owner(s) |
|----------|-------|---------|----------|
| **Domain** | random.ts, schema.ts, validate.ts, colors.ts, history.ts | ~250 | domain-engineer |
| **Domain Tests** | random.test.ts, schema.test.ts, validate.test.ts, history.test.ts | ~200 | domain-engineer (TDD) |
| **UI Orchestrator** | LottoGenerator.tsx, useLottoGenerator.ts | ~150 | ui-engineer |
| **UI Components** | BallDisplay, GameList, SettingsPanel, HistoryPanel, ResponsibilityDisclaimer | ~300 | ui-engineer ×2 |
| **UI SEO/Structure** | LottoIntro, LottoHowTo, LottoFaq, LottoStructuredData | ~100 | ui-engineer |
| **UI Tests** | LottoGenerator.test, BallDisplay.test, etc. (8 files) | ~250 | ui-engineer |
| **Platform** | registry.ts (1 entry), toolStyle.tsx (1 map), route [slug]/page.tsx (1 branch), generateMetadata (1 case), i18n ko/en (1 namespace each), llms.txt (1 line) | ~30 | platform-engineer |
| **E2E Tests** | lotto-generator.spec.ts | ~100 | qa-integration |
| **Total** | ~25 files | ~1,380 | team of 4 |

---

**Blueprint Complete.** Domain-engineer can start RED chi-square test immediately. UI & platform teams can parallelize once domain contracts (§2) are confirmed.

