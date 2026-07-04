# Roulette — Decision Wheel | Clean Architecture Blueprint

## 1. Layer Decomposition & Ownership

### Layer 0: Domain (Pure, <800 lines/file, ≥80% coverage)

**Directory:** `src/lib/roulette/`

Pure functions, no React/Next/DOM imports, injectable RNG, zod schemas, immutable data.

#### **schema.ts**
- **Responsibility:** Data contracts (zod) for validation & type safety
- **Public API:**
  ```typescript
  // Data entities
  export const OptionSchema = z.object({ 
    label: z.string().min(1).max(50),
    weight: z.number().int().min(1).max(1000)
  });
  export const OptionSetSchema = z.object({
    name: z.string().min(1).max(50),
    options: z.array(OptionSchema),
    createdAt: z.number() // timestamp
  });
  export const RouletteStoreSchema = z.object({
    version: z.literal(1),
    sets: z.record(z.string(), OptionSetSchema),
    lastSetName: z.string().nullable()
  });
  
  export type Option = z.infer<typeof OptionSchema>;
  export type OptionSet = z.infer<typeof OptionSetSchema>;
  export type RouletteStore = z.infer<typeof RouletteStoreSchema>;
  ```
- **Invariants:** 
  - `label` non-empty, `weight` ≥ 1
  - `name` unique within sets; createdAt is immutable
  - `version` = 1; upgrade path → future version

#### **random.ts**
- **Responsibility:** Cryptographically fair random selection via weighted pick
- **Public API:**
  ```typescript
  export type Rng = () => number; // returns [0, 1) uniformly
  
  export const cryptoRng: Rng = () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / (2 ** 32);
  };
  
  export function seededRng(seed: number): Rng {
    // Mulberry32 PRNG for reproducible testing / Phase 2 share links
  }
  
  export function fairWeightedPick(options: Option[], rng: Rng = cryptoRng): number {
    // 1. Compute total weight
    const totalWeight = options.reduce((s, o) => s + o.weight, 0);
    // 2. Random float [0, totalWeight)
    const pick = rng() * totalWeight;
    // 3. Binary search → slice index (fair, unbiased by visual angle)
    let cumulative = 0;
    for (let i = 0; i < options.length; i++) {
      cumulative += options[i].weight;
      if (pick < cumulative) return i;
    }
    return options.length - 1; // edge case (numerical precision)
  }
  ```
- **Invariants:**
  - `cryptoRng` is the ONLY place crypto.getRandomValues is called
  - Fairness guarantee: each option picked with probability = weight / totalWeight (provable by chi-square test over N spins)
  - RNG is injectable; domain never couples to browser context

#### **geometry.ts**
- **Responsibility:** SVG slice angles, label positions, final spin angle calculation
- **Public API:**
  ```typescript
  export function sliceAngle(weight: number, totalWeight: number): number {
    return (weight / totalWeight) * 360;
  }
  
  export interface SliceInfo {
    angle: number;       // start angle in degrees, [0, 360)
    span: number;        // arc width in degrees
    midAngle: number;    // rotation for radial label, [0, 360)
  }
  
  export function buildSliceGeometry(options: Option[]): SliceInfo[] {
    const totalWeight = options.reduce((s, o) => s + o.weight, 0);
    let startAngle = 0;
    return options.map(opt => {
      const span = sliceAngle(opt.weight, totalWeight);
      const midAngle = startAngle + span / 2;
      const slice = { angle: startAngle, span, midAngle };
      startAngle = (startAngle + span) % 360;
      return slice;
    });
  }
  
  export function finalSpinAngle(selectedIndex: number, slices: SliceInfo[]): number {
    // Rotate so winner's midAngle points to top (0°)
    // finalAngle = -slices[selectedIndex].midAngle, normalized to [0, 360)
  }
  ```
- **Invariants:**
  - All angles computed from weight ratios, never visual position
  - `midAngle` is the rotation axis for radial text, ensuring name centers on slice visually

#### **sound.ts**
- **Responsibility:** Web Audio spec builder (no side effects); sound context lifecycle in hook/component
- **Public API:**
  ```typescript
  export const SOUND_TICK_HZ = 800;
  export const SOUND_CHIME_HZ = 1200;
  
  export interface ToneSpec {
    freqHz: number;
    durationMs: number;
    type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  }
  
  export function toneSpec(kind: 'tick' | 'chime'): ToneSpec {
    switch (kind) {
      case 'tick': return { freqHz: SOUND_TICK_HZ, durationMs: 100, type: 'sine' };
      case 'chime': return { freqHz: SOUND_CHIME_HZ, durationMs: 200, type: 'sine' };
    }
  }
  
  // Helper to play a single tone (called from hook/component)
  export async function playTone(audioContext: AudioContext, spec: ToneSpec): Promise<void> {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.frequency.value = spec.freqHz;
    osc.type = spec.type;
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + spec.durationMs / 1000);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + spec.durationMs / 1000);
  }
  ```
- **Invariants:**
  - Sound is purely optional; never blocks spin or result reveal
  - Fallback: if `AudioContext` unavailable, animation continues silently
  - Volume controlled by `gain` node (0–1), settable from hook

#### **sets.ts**
- **Responsibility:** Immutable operations on option sets; localStorage serialization contract
- **Public API:**
  ```typescript
  export function addSet(store: RouletteStore, set: OptionSet): RouletteStore {
    return {
      ...store,
      sets: { ...store.sets, [set.name]: set }
    };
  }
  
  export function deleteSet(store: RouletteStore, name: string): RouletteStore {
    const { [name]: _, ...rest } = store.sets;
    return {
      ...store,
      sets: rest,
      lastSetName: store.lastSetName === name ? null : store.lastSetName
    };
  }
  
  export function renameSet(store: RouletteStore, oldName: string, newName: string): RouletteStore {
    const set = store.sets[oldName];
    if (!set) return store;
    const { [oldName]: _, ...rest } = store.sets;
    return {
      ...store,
      sets: { ...rest, [newName]: set },
      lastSetName: store.lastSetName === oldName ? newName : store.lastSetName
    };
  }
  
  export function updateOptions(set: OptionSet, newOptions: Option[]): OptionSet {
    return { ...set, options: newOptions };
  }
  
  export function loadLastSet(store: RouletteStore): Option[] | null {
    const name = store.lastSetName;
    return name && store.sets[name] ? store.sets[name].options : null;
  }
  
  // localStorage sync
  export function serializeStore(store: RouletteStore): string {
    return JSON.stringify(store);
  }
  
  export function deserializeStore(json: string): RouletteStore {
    const parsed = JSON.parse(json);
    return RouletteStoreSchema.parse(parsed); // throws on invalid; let hook catch
  }
  ```
- **Invariants:**
  - **CRITICAL: All ops return new objects, never mutate in-place**
  - `lastSetName` is cleared if the named set is deleted
  - Set names are unique; rename swaps the keys

---

### Layer 1: Use Case / Hook Layer

**File:** `src/components/tools/roulette/useRoulette.ts`

React hook that glues domain + React state + localStorage.

**Public API:**
```typescript
export interface UseRouletteReturn {
  // State
  options: Option[];
  savedSets: OptionSet[];
  lastSetName: string | null;
  spinning: boolean;
  selectedIndex: number | null;
  soundOn: boolean;
  removingWinner: boolean;
  prefers_reduced_motion: boolean;

  // Geometry derived from options
  sliceGeometry: SliceInfo[];
  finalAngle: number | null; // computed when spin finishes

  // Stable callbacks (safe to use in dependency arrays)
  addOption: (label: string, weight: number) => void;
  updateOption: (index: number, label: string, weight: number) => void;
  removeOption: (index: number) => void;
  
  spin: () => void; // triggers random pick, animation, sound
  revealWinner: () => void; // finalize result, play chime
  removeWinnerAndSpin: () => void; // sequential draw mode
  
  saveSet: (setName: string) => void;
  loadSet: (setName: string) => void;
  deleteSet: (setName: string) => void;
  
  toggleSound: () => void;
  toggleRemoveWinner: () => void;
  
  reset: () => void;
}

export function useRoulette(initialCount: number = 3): UseRouletteReturn {
  // 1. Load from localStorage on mount (try/catch zod parse → fresh start on fail)
  // 2. useReducer or useState for: options, savedSets, lastSetName, spinning, selectedIndex, soundOn, removingWinner
  // 3. useEffect to detect prefers-reduced-motion (MediaQuery)
  // 4. useEffect to persist every change to localStorage (NO debounce — instant sync)
  // 5. Derive sliceGeometry from options (geometry.buildSliceGeometry)
  // 6. Derive finalAngle from selectedIndex (geometry.finalSpinAngle)
  // 7. useCallback for all event handlers (stable references across renders)
  // 8. CRITICAL: Return stable object (useMemo) to avoid child re-renders on every call
}
```

**Invariants:**
- **Early hook calls:** All hooks called unconditionally at top of function (not in conditionals/loops)
- **Stable return object:** Memoize the return value so components can safely put it in dependency arrays
- **localStorage sync:** Every change (add/edit/delete/save/load) calls `localStorage.setItem` immediately (no debounce)
- **Parse on mount:** `deserializeStore` is wrapped in try/catch; on failure → fresh start (empty options)
- **Immutable state:** Never mutate options/sets directly; rebuild via domain ops

---

### Layer 2: Adapter / Component Layer

**Directory:** `src/components/tools/roulette/`

React components; consume domain + hook; manage DOM/animation/focus.

#### **Roulette.tsx** (Client Component)
- **Responsibility:** Orchestrator; owns hook state; renders layout
- **Structure:**
  ```typescript
  'use client';
  
  export function Roulette() {
    const roulette = useRoulette(3);
    
    // Render:
    // - RouletteIntro (H1 + lead)
    // - 2-column layout (desktop) / stacked (mobile)
    //   - WheelSVG + ResultPanel
    //   - OptionList + SpinButton + SaveLoadPanel + SettingsPanel
    // - RouletteHowTo (SEO section)
    // - RouletteFaq (FAQPage JSON-LD)
  }
  ```

#### **WheelSVG.tsx**
- **Responsibility:** Pure SVG render of wheel (slices, labels, ticks, highlight, animation trigger)
- **Props:** `{ options, sliceGeometry, selectedIndex, spinning, finalAngle, prefers_reduced_motion }`
- **Details:**
  - SVG viewBox scales responsively (320px mobile → 400px dense wheels)
  - Outer radius 140px, center 40px, tick marks 24 around edge
  - Slice path: arc from angle[i] to angle[i+1], wedge to center
  - Label: radial text (rotated to midAngle, reading inward→outward)
    - ≤ 16 options: full names on slices
    - > 16 options: index numbers on slices + numbered legend (1→name) beside/below
  - Center label: always full winner name (non-spinning, above slices)
  - Animation: `transform: rotate(finalAngle)` 4s cubic-bezier(0.16, 1, 0.3, 1); instant on reduced-motion
  - Winner highlight: 2px rose outline + glow on selected slice

#### **OptionList.tsx**
- **Responsibility:** Add input + option rows (label, weight, delete, drag)
- **Props:** `{ options, onAdd, onUpdate, onRemove, onReorder, maxReached }`
- **Details:**
  - Input row: text field (max 50 chars) + weight spinner (1–1000) + delete btn
  - Min 2, max 30 options
  - Drag handle (six dots) for reorder
  - Keyboard: Enter on add-input → add; Backspace (empty) → clear input; Tab → navigate
  - Focus ring: 2px rose on input

#### **SpinButton.tsx**
- **Responsibility:** Main CTA; trigger spin & sound; state: enabled/disabled/spinning
- **Props:** `{ disabled, spinning, onClick }`
- **Details:**
  - 56px tall, brand gold, rounded lg
  - Disabled: opacity 0.5, cursor not-allowed
  - Hover (enabled): scale(1.05) 150ms
  - Press: scale(0.98)
  - On click: `roulette.spin()` → triggers fairWeightedPick + animation + optional sound

#### **ResultPanel.tsx**
- **Responsibility:** Winner reveal (name, confetti, re-spin buttons)
- **Props:** `{ selectedIndex, options, onSpin, onRemoveAndSpin, showRemoveOption, spinning }`
- **Details:**
  - Large winner name (28px Gmarket Sans 700)
  - "축하합니다!" eyebrow
  - Confetti: 50 particles, scale 1→0.2, opacity 1→0, 1.5s, staggered 50ms; respects prefers-reduced-motion (fade only)
  - Buttons: "다시 돌리기" (primary), "제거 후 돌리기" (secondary, if toggle on)

#### **SaveLoadPanel.tsx**
- **Responsibility:** Save current options; load from localStorage sets
- **Props:** `{ options, savedSets, onSave, onLoad, onDelete }`
- **Details:**
  - Save section: input (max 50 chars, default "Untitled 1") + save button
  - Load section: grid of set buttons (name + count + × delete)
  - Empty state: "조합을 저장하면 여기에 보여요"
  - On load: options replaced; lastSetName updated

#### **SettingsPanel.tsx**
- **Responsibility:** Sound toggle + volume slider; remove-winner mode toggle
- **Props:** `{ soundOn, removingWinner, onToggleSound, onToggleRemoveWinner }`
- **Details:**
  - Toggles: keyboard Space to flip
  - Volume slider: 0–100%, real-time `gain` control
  - Aria-labels on all controls

#### **RouletteIntro.tsx** (Server-render where possible)
- **Responsibility:** H1 + lead; SEO
- **Output:**
  - Eyebrow: "랜덤·추첨 도구" / "RANDOM TOOL"
  - H1: "결정의 룰렛" / "Decision Roulette"
  - Lead: "선택지를 적어서 돌리면 공정하게 결정해줍니다."

#### **RouletteHowTo.tsx** (SEO section, game gate outside)
- **Responsibility:** Long-form how-to, tips, locked to SEO narrative, not game-aware state

#### **RouletteFaq.tsx** (SEO section + JSON-LD owner)
- **Responsibility:** Q/A pairs + FAQPage JSON-LD (Faq component owns JSON-LD)
- **Contract:** Q/A from i18n `tools.roulette.faq.items`, renders as `<Faq />` with `faqPageJsonLd()` helper

#### **confetti.ts**
- **Responsibility:** Pure JS, zero deps, spawn confetti DOM elements + animate
- **API:**
  ```typescript
  export function spawnConfetti(containerElement: HTMLElement, options?: { count?: number, duration?: number }): void {
    // 1. Check prefers-reduced-motion (skip particles if true)
    // 2. Create N div.confetti-particle elements with CSS transforms
    // 3. Append to container
    // 4. Animate: scale 1→0.2, opacity 1→0, rotate random, stagger 50ms, remove after duration
    // 5. Use requestAnimationFrame or CSS @keyframes (compositor-friendly)
  }
  ```

---

### Layer 3: Framework Integration

**Files:**
- `src/tools/registry.ts` — add ToolMeta entry
- `src/tools/types.ts` — ToolCategory 'random' (exists), AccentColor 'rose' (exists)
- `src/app/[locale]/tools/[slug]/page.tsx` — slug branch
- `src/i18n/messages/{ko,en}.json` — tools.roulette.* keys
- `src/components/tools/roulette/RouletteStructuredData.tsx` — SoftwareApplication + FAQPage JSON-LD helper

#### **registry entry (tools/registry.ts)**
```typescript
{
  id: 'roulette',
  slug: 'roulette',
  category: 'random',
  icon: 'RotateCcw', // lucide-react
  accent: 'rose',
  status: 'live',
  order: [number], // fit after existing tools
  keywords: ['룰렛', '랜덤', '추첨', '선택', 'roulette', 'random', 'spin', 'decision']
}
```

#### **route branch (app/[locale]/tools/[slug]/page.tsx)**
```typescript
if (slug === 'roulette') {
  return <Roulette />;
}

export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale, slug } = params;
  if (slug === 'roulette') {
    const { buildToolEntityMetadata } = await import('@/lib/seo');
    return buildToolEntityMetadata(
      'roulette',
      locale,
      {
        title: locale === 'ko' ? '결정의 룰렛' : 'Decision Roulette',
        description: locale === 'ko'
          ? '선택지를 적어서 돌리면 공정하게 결정해줍니다.'
          : 'Spin to decide fairly from your options.',
        canonical: `/[locale]/tools/roulette`
      }
    );
  }
  // ... other slugs
}
```

#### **i18n keys (tools.roulette.* structure)**
```json
{
  "tools": {
    "roulette": {
      "title": "결정의 룰렛",
      "description": "선택지를 적어서 돌리면 공정하게 결정해줍니다.",
      
      "intro": {
        "eyebrow": "랜덤·추첨 도구",
        "headline": "결정의 룰렛",
        "lead": "선택지를 적어서 돌리면 공정하게 결정해줍니다."
      },
      
      "options": {
        "label": "옵션 추가",
        "add": "추가",
        "placeholder": "예: 점심 추천",
        "weight": "무게",
        "delete": "삭제",
        "empty": "옵션을 추가해주세요.",
        "tooMany": "최대 30개까지 추가 가능합니다."
      },
      
      "spin": {
        "button": "지금 돌리기!",
        "disabled": "옵션이 2개 이상 필요해요",
        "spinning": "돌리는 중…"
      },
      
      "result": {
        "eyebrow": "축하합니다!",
        "spinAgain": "다시 돌리기",
        "removeAndSpin": "제거 후 돌리기"
      },
      
      "save": {
        "label": "이 조합 저장",
        "button": "저장",
        "input": "조합 이름 (최대 50자)",
        "default": "Untitled 1"
      },
      
      "load": {
        "label": "저장된 조합",
        "empty": "조합을 저장하면 여기에 보여요",
        "itemCount": "{count}개 옵션"
      },
      
      "settings": {
        "sound": "소리",
        "volume": "음량",
        "removeWinner": "결과 제거 후 재시작"
      },
      
      "howTo": [
        "q_1_text",
        "a_1_text",
        // ... 5–6 Q/A pairs
      ],
      
      "faq": {
        "items": [
          { "q": "q_1", "a": "a_1" },
          // ...
        ]
      }
    }
  }
}
```

---

## 2. Core Contracts (Parallel Team Handoff)

### **Domain Contract**
- **fairWeightedPick(options, rng?): number** — returns winning index; chi-square test proves fairness
- **buildSliceGeometry(options): SliceInfo[]** — returns angle/span/midAngle for each slice
- **finalSpinAngle(selectedIndex, slices): number** — rotate winner to top
- **playTone(audioContext, spec): Promise** — play single tone via Web Audio

### **Hook Contract (useRoulette)**
Returns stable `{ options, savedSets, spinning, selectedIndex, sliceGeometry, finalAngle, add/update/remove/spin/save/load/toggleSound, … }` object.
- **Guarantee:** Return object is memoized; safe for dependency arrays
- **Guarantee:** All callbacks are useCallback (stable across renders)
- **Guarantee:** localStorage write on EVERY change (no debounce)

### **i18n Contract (tools.roulette.*)**
- **Required:** `title`, `description` (home card + SEO meta)
- **Required:** `intro.{eyebrow,headline,lead}` (H1 section)
- **Required:** `faq.items[].{q,a}` (FAQPage JSON-LD, Faq component structure)
- **Required:** All UI chrome: `options.label`, `spin.button`, `save.label`, `load.label`, `settings.sound`, etc.
- **Localization:** All user-facing strings via `t()` hook; option names are user input (locale-agnostic)

### **Registry Contract**
```typescript
{
  id: 'roulette',
  slug: 'roulette',
  category: 'random',           // exists; uses 'rose' accent
  accent: 'rose',
  status: 'live',
  order: X,                     // coordinate to avoid collisions
  icon: 'RotateCcw',
  keywords: [...korean + english]
}
```

---

## 3. Critical Invariants (Non-Negotiable)

### **Fairness**
1. **RNG:** `crypto.getRandomValues` only; no seeded PRNG in production (Phase 2 future)
2. **Weighted Pick:** Binary search after cumulative sum; independent of visual angle
3. **Test:** 100-spin chi-square test; p > 0.05 proves uniform distribution (not just "looks fair")
4. **finalAngle:** Winner's midAngle → top (0°); NOT based on spin animation end angle

### **Immutability**
- All domain ops (sets.ts, geometry calcs) return new objects; never mutate options/sets in-place
- useRoulette rebuilds state via immutable patterns (spread, concat, filter)

### **localStorage Sync**
- Mount: read, zod-parse, fresh start on fail (no throw)
- Every mutation: immediate localStorage.setItem (no debounce; instant persist)
- selectedIndex, slices are derived (never stored); options, savedSets, lastSetName are persisted

### **Accessibility & Motion**
- prefers-reduced-motion: instant spin reveal (no rotate), confetti fade-only (no scale/stagger), all motion instant
- ARIA: spin button labeled; result panel `aria-live="polite"` for announce
- Keyboard: Tab through, Space on toggles, Enter on buttons; focus ring 2px rose

### **SEO / Mounted Gate**
- RouletteIntro, RouletteHowTo, RouletteFaq, JSON-LD(SoftwareApplication + FAQPage) rendered OUTSIDE `mounted` gate
- Game state (spinning, selectedIndex, options) is client-only; SEO sections are SSR
- No JavaScript-gated h1, h2, description, FAQ content

---

## 4. Work Distribution & Build Order

**Assumption:** domain-engineer, ui-engineer, platform-engineer work in parallel after architect completes blueprint.

### **Phase 1: Domain TDD (domain-engineer)**
1. `schema.ts` — zod types, tests (valid/invalid cases)
2. `random.ts` — fairWeightedPick + chi-square test (100 spins, p > 0.05)
3. `geometry.ts` — slice angles, final angle, SVG path generation
4. `sound.ts` — tone specs (no Web Audio instantiation)
5. `sets.ts` — immutable ops (addSet, deleteSet, updateOptions, serialize)
- **Deliverable:** All exports typed, ≥80% coverage, no React imports

### **Phase 2: Hook (ui-engineer A)**
1. `useRoulette.ts` — domain + React state + localStorage persistence
2. Ensure return object is memoized (useMemo)
3. All callbacks useCallback
- **Deliverable:** Hook fully typed, works in isolation (no Roulette.tsx needed)

### **Phase 3: Components (ui-engineer B) + Platform (platform-engineer)**
- **ui-engineer B (parallel):**
  1. WheelSVG (SVG render, animation via CSS)
  2. OptionList, SpinButton
  3. ResultPanel, SaveLoadPanel, SettingsPanel
  4. RouletteIntro, RouletteHowTo, RouletteFaq
  5. confetti.ts
  6. Roulette.tsx (orchestrator)
  
- **platform-engineer (parallel):**
  1. Update registry.ts (add roulette entry)
  2. Route branch in [slug]/page.tsx
  3. generateMetadata branch
  4. i18n messages (ko/en) — coordinate with ui-engineer on key names
  5. SEO helper imports (lib/seo.ts existing)
  6. RouletteStructuredData.tsx wrapper (if needed)

### **Phase 4: QA (qa-engineer)**
1. Vitest: domain ≥80%, hook, component render + interaction
2. E2E Playwright: 6 test scenarios (SPEC final_integration_test §1–6)
3. Visual regression: 320/768/1024/1440, light + dark (if dark exists Phase 2)
4. Accessibility: axe scan, keyboard nav, focus ring, color contrast

---

## 5. Risk Zones & Mitigation

### **Wheel Geometry at Density**
- **Risk:** ≤ 16 options: full labels on slices; > 16: index numbers + legend
- **Mitigation:** Geometry tests validate slice angles; SVG layout tests at 16, 20, 30 options
- **Fallback:** UI legend rendered beside/below wheel on overflow; responsiveness tested 320/1024

### **Web Audio Context Lifecycle**
- **Risk:** AudioContext unavailable (private mode, quota exceeded, browser block)
- **Mitigation:** Try/catch in hook; silent fallback (animation continues)
- **Testing:** Mock AudioContext success + failure in unit tests

### **localStorage Quota / Privacy Mode**
- **Risk:** localStorage.setItem fails (quota, private mode); state in-memory only
- **Mitigation:** Try/catch on write; non-persistent session is fully functional
- **UX:** Silent fallback; no "your saves were lost" toast (saves are secondary to play)

### **E2E Flakiness: Server Availability**
- **Risk:** Playwright webServer dies mid-test; all tests fail uniformly
- **Mitigation:** `reuseExistingServer: true`; serve `out/` (same as deploy); curl health-check before E2E runs
- **Verification:** `http://localhost:3000/[locale]/tools/roulette` 200, SSR HTML present

### **i18n Drift: Missing Keys**
- **Risk:** UI calls `t('tools.roulette.options.typo')` but key is `t('tools.roulette.options.label')`
- **Mitigation:** Vitest renders component with full messages catalog; MISSING_MESSAGE breaks test
- **Verification:** `npx tsc` + vitest both pass before E2E; grep all `t('tools.roulette.*')` against messages.{ko,en}.json

---

## 6. Testing Strategy (TDD Inside-Out)

### **Domain (Vitest, ≥80%)**
1. **random.ts:** fairWeightedPick → 100 spins, chi-square test (p > 0.05 passes)
2. **geometry.ts:** sliceAngle sums to 360; finalSpinAngle places winner at 0°
3. **schema.ts:** valid/invalid zod cases (label length, weight range)
4. **sets.ts:** immutability (old object unchanged after op); unique names; renaming preserves lastSetName

### **Hook (Vitest + renderHook)**
1. Mount → read localStorage, load last set (or start fresh)
2. addOption → sliceGeometry updates immediately
3. spin → fairWeightedPick called, selectedIndex set, slices recalc
4. saveSet → localStorage.setItem verified, savedSets updated
5. prefers-reduced-motion detected (MediaQuery mock)

### **Component (Vitest + RTL)**
1. WheelSVG renders slices with correct angles
2. OptionList: add/remove/edit updates parent
3. SpinButton disabled if <2 options, enabled if ≥2
4. ResultPanel shows winner name, confetti spawned (if !reduced-motion)
5. SaveLoadPanel: save creates set, load replaces options

### **E2E (Playwright, 6 scenarios from SPEC)**
1. Add 4 options, spin 20 times, verify distribution fairness
2. Add weights (1, 2, 3), spin 60 times, verify weighted ratio
3. Save/load set, reload page, verify persistence
4. Sound toggle ON/OFF, verify audio (or mock Audio context)
5. Remove winner mode ON, sequential spins remove winners
6. Keyboard nav: Tab through inputs, Space toggles, Enter adds; reduced-motion: instant reveal

### **Accessibility (axe + manual)**
1. axe scan: no violations
2. Keyboard-only: Tab focus-visible 2px rose ring, arrow keys in inputs, Space toggles, Enter submits
3. Color contrast: ≥4.5:1 body text on white, ≥3:1 on large UI
4. ARIA: spin button label, result panel aria-live

---

## 7. Key Decisions & Rationale

### **Why Weighted Binary Search (not random rungs)**
The ladder game's "random rungs" approach is biased toward center columns. Roulette uses fairWeightedPick (crypto RNG + cumulative sum + binary search) to guarantee each option has probability = weight / total, provable by chi-square test.

### **Why crypto.getRandomValues (not Math.random)**
Math.random is insufficient for "fair" randomness (visual/UX context). crypto.getRandomValues is cryptographically uniform; matches SPEC CRITICAL requirement.

### **Why Immutable Sets (not in-place edits)**
Hidden bugs: in-place mutation can cause stale closures in callbacks (e.g., localStorage write captures old set). Immutable ops force explicit state updates.

### **Why Instant localStorage (no debounce)**
Users expect "save" to be instant; debounce introduces latency and risk of data loss on unexpected shutdown. Persist every change.

### **Why Confetti is Dependency-Free**
Web Audio API can fail silently; external animation libraries add bundle size. Pure JS (DOM + CSS keyframe) is simpler, respects prefers-reduced-motion, has zero risk of missing deps.

### **Why Numbered Legend Above 16 Options**
Radial labels scale down (clamp min ~9px); 30 options → labels unreadable. Index numbers (1, 2, 3…) on slices stay visible; legend beside/below maps number → full name for pre-spin scanning.

---

## 8. Deliverables Checklist

**Before merge to main:**

- [ ] Domain: `src/lib/roulette/{schema, random, geometry, sound, sets}.ts` — ≥80% coverage, TS strict
- [ ] Hook: `src/components/tools/roulette/useRoulette.ts` — memoized return, all callbacks useCallback
- [ ] Components: `src/components/tools/roulette/{Roulette, WheelSVG, OptionList, SpinButton, ResultPanel, SaveLoadPanel, SettingsPanel, Roulette{Intro,HowTo,Faq}, confetti}.tsx` — <800 lines each
- [ ] i18n: `src/i18n/messages/{ko,en}.json` tools.roulette.* keys (title, description, faq.items[], all UI chrome)
- [ ] Registry: `src/tools/registry.ts` entry (id, slug, category, accent, status, order, icon, keywords)
- [ ] Route: `src/app/[locale]/tools/[slug]/page.tsx` branch + generateMetadata
- [ ] Tests: `src/lib/roulette/*.test.ts` (domain ≥80%), component tests, E2E 6 scenarios
- [ ] Build: `pnpm build` passes; vitest run passes; tsc --noEmit passes; E2E green; a11y scan zero violations
- [ ] Deployment: Live at `/[locale]/tools/roulette`; sitemap updated; JSON-LD (SoftwareApplication + FAQPage) in HTML

---

**Blueprint author:** Architect  
**Date:** 2026-07-04  
**Status:** Ready for parallel implementation (domain → hook → ui/platform → qa)
