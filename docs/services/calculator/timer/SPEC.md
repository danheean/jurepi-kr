# Timer & Stopwatch — Countdown and lap tracking — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Timer & Stopwatch** (타이머) — a dual-mode focus/cooking/workout timer with drift-free timing using absolute timestamps, presets (Pomodoro 25/5, custom), stopwatch with laps, alarm sound, visual alerts, browser notifications (optional), and document.title countdown display. The tool is a **client-only React SPA** persisting a running countdown across browser reloads via localStorage.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>Timer & Stopwatch — Dual-mode timer + stopwatch (Jurepi tool, codename timer, registry id timer)</project_name>

<overview>
Timer & Stopwatch is a focus and productivity tool for two tasks: **countdown timing** (set a duration, press start, alarm rings when done) and **lap-aware stopwatch** (press start/pause, record laps). The countdown timer includes presets (Pomodoro 25/5, custom H:M:S input) and full keyboard/mouse control. Both modes display remaining/elapsed time in document.title for glanceable desktop feedback. Persistence is key: a running countdown survives a browser reload (stored endTimestamp + localStorage recovery).

CRITICAL (drift-free timing): timing is driven by **absolute timestamps (Date.now())** and **requestAnimationFrame**, NOT by accumulating setInterval ticks. Remaining time is calculated as endTimestamp − Date.now() every frame, so even if the tab is backgrounded/throttled, accuracy is preserved the instant it returns. Stopwatch uses the same RAF-driven pattern to avoid tick accumulation.

CRITICAL (audio + gesture): alarm sound (Web Audio API, sine tone or loaded audio file) is toggled on/off by the user. The first user interaction (click/tap) "arms" the audio context (autoplay policy workaround). On completion, play sound (if armed) + a gentle visual flash (opacity pulse, respect prefers-reduced-motion) + optional browser Notification if permission granted. Degrade gracefully: no notification permission = silent, no audio context = visual only.

CRITICAL (SPA, usability-first): all interaction — tab switching, mode toggle, preset selection, start/pause/reset, lap record — is local state with NO route navigation. The tool is a single client component island on the SSG shell, fully usable offline (no server calls).

The tool solves focus-block timing (Pomodoro), kitchen/workout intervals, and general task timing. A user picks a preset or enters custom H:M:S, taps Start, and gets a visible countdown + audio alarm + optional notification on completion.
</overview>

<platform_integration>
  - Route: /[locale]/tools/timer (SSG; registry slug "timer", id "timer", status "live", accent "coral", category "calculator").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder.
  - Consumes: i18n namespace `tools.timer.*` (UI chrome: mode tabs, preset labels, input labels, buttons, document.title format, how-to, FAQ — NOT time values; those are computed).
  - Platform dependency (SMALL — NO new category needed): the `'calculator'` category already exists. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - **Countdown mode**: set H:M:S via input or preset (Pomodoro 25:00 / 5:00, 1:00, 3:00, custom), start/pause/reset, visual countdown (MM:SS), document.title updates with remaining time.
    - **Stopwatch mode**: start/pause, lap record with per-lap elapsed time, lap list (cumulative + split), reset all.
    - **Drift-free timing**: endTimestamp-based calculation (remaining = endTimestamp − Date.now()); RAF-driven refresh; survives tab backgrounded.
    - **Alarm + notification**: Web Audio API (sine wave or .webm file) toggled on/off, armed on first user interaction; browser Notification API if permission granted (graceful degrade if not, or if notification blocked).
    - **Persistence**: localStorage key `jurepi-timer` (running countdown state: mode, endTimestamp, isPaused, laps) — survives reload. Auto-prune if tool state schema changes.
    - **Keyboard + mouse**: Enter to start/pause, R to reset, L to lap (stopwatch), Tab navigation, Esc to clear focus.
    - **Tool-specific SEO long-form** ("Why a timer?" / "Pomodoro explained") **+ FAQ (FAQPage JSON-LD)** + SoftwareApplication JSON-LD, localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - HIIT interval programs / templated workout routines (Phase 2).
    - Multiple simultaneous timers (single timer per session).
    - Cross-device sync / accounts (no backend).
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading (platform).
    - Custom alarm file upload UI (preset .webm file only, no multipart).
  </out_of_scope>
  <future_considerations>
    - HIIT builder: craft multi-interval routines, store in localStorage — Phase 2.
    - Alarm library: user selects from preset sounds — Phase 2.
    - Vibration API for haptic feedback on completion (mobile) — Phase 2.
    - "Timer of the Day" random preset / motivational message — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <timing>requestAnimationFrame-driven: useTimer hook polls Date.now() every frame; no setTimeout/setInterval accumulation. Alarm completion detected when remaining ≤ 0.</timing>
    <audio>Web Audio API (AudioContext, OscillatorNode sine wave 880Hz 200ms) OR static .webm file (assets/alarm.webm) preloaded; armed on first user click (autoplay policy workaround); played on completion if toggle enabled.</audio>
    <notification>navigator.Notification API (if permission granted); Notification title = "Timer done" / locale, body = preset name or "Stopwatch paused"; catch NotificationError silently.</notification>
    <persistence>localStorage blob (key `jurepi-timer`, zod-parsed): { version, mode, endTimestamp, isPaused, lapsSec[], createdAt }. Recovery on mount: if endTimestamp in future, resume countdown; if past, show completion (no ring unless user reopens within grace period). Prune unknown keys on load.</persistence>
  </module_specific>
  <libraries>
    <zod>zod v3.x — timer state schema, localStorage validation.</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/timer/
│   ├── schema.ts                      # zod: TimerState, PresetDef, PRESETS, safeparse helpers
│   ├── timing.ts                      # Pure: remaining(end, now), isComplete(rem), formatMMSS, docTitleText (no React)
│   ├── audio.ts                       # Web Audio API helper: createOscillator / playAlarm (pure, context armable)
│   └── storage.ts                     # Immutable: saveState, loadState, pruneState
├── components/tools/timer/
│   ├── Timer.tsx                      # Orchestrator (Client Component) — mode + state + useTimer
│   ├── useTimer.ts                    # Hook: RAF loop + localStorage save + notification dispatch + document.title sync
│   ├── ModeTabs.tsx                   # "Countdown" / "Stopwatch" radio (or tab-like)
│   ├── CountdownSetup.tsx             # Presets (Pomodoro/1m/3m/custom) + H:M:S input + arm-alarm toggle
│   ├── CountdownDisplay.tsx           # Large MM:SS + remaining label, start/pause/reset buttons
│   ├── StopwatchDisplay.tsx           # Elapsed time MM:SS:CS + lap list, start/pause/lap/reset buttons
│   ├── LapList.tsx                    # Lap table (cumulative, split, delete?)
│   ├── AudioToggle.tsx                # "🔔 Alarm on/off" toggle + armed indicator (aria-pressed)
│   ├── TimerIntro.tsx                 # H1 + lead (SEO; server-render where possible)
│   ├── TimerHowTo.tsx                 # "What is Pomodoro?" / "Focus techniques" (SEO long-form)
│   ├── TimerFaq.tsx                   # Q&A + FAQPage JSON-LD
│   └── assets/
│       └── alarm.webm                 # Preset alarm sound (or generate via Web Audio)
└── i18n/messages/{ko,en}.json         # tools.timer.* UI chrome (tabs, labels, buttons, title format, how-to, FAQ)
</file_structure>

<core_data_entities>
  <timer_state note="single localStorage blob">
    - version: number (STORE_VERSION = 1)
    - mode: "countdown" | "stopwatch"
    - endTimestamp?: number (countdown only; when alarm should ring, milliseconds)
    - isPaused: boolean
    - lapsSec: number[] (stopwatch only; milliseconds per lap)
    - createdAt: number (session start time)
  </timer_state>
  <preset note="countdown preset">
    - id: "pomodoro-work" | "pomodoro-break" | "1min" | "3min" | "custom"
    - labelKey: i18n key under tools.timer.presets
    - durationSec: number (pomodoro-work=1500, pomodoro-break=300, 1min=60, 3min=180, custom=user-input)
  </preset>
  <constants>
    - PRESETS: { id, labelKey, durationSec }[] = [pomodoro-work 1500, pomodoro-break 300, 1min 60, 3min 180, custom input]
    - ALARM_HZ = 880 (sine wave frequency for Web Audio)
    - ALARM_DURATION_MS = 200 (ring duration)
    - NOTIFICATION_GRACE_MS = 5000 (within this window of completion, ring is allowed even on return-from-hide)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/timer" page="Timer (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. No deep-link routes per countdown value.</note>
</route_definitions>

<core_functionality>
  <countdown_timing note="drift-free, absolute-time driven">
    - User picks preset or enters H:M:S. Start button sets endTimestamp = Date.now() + (input × 1000).
    - useTimer hook runs RAF loop: requestAnimationFrame → remaining = max(0, endTimestamp − Date.now()).
    - Display updates remaining in MM:SS. document.title = `${MM}:${SS} — Timer` (or locale format).
    - When remaining ≤ 0: playAlarm (if armed) + tryNotify + mark complete. User can reset (clear endTimestamp) or start new countdown.
  </countdown_timing>
  <stopwatch_timing>
    - Start button sets t0 = Date.now(). RAF loop: elapsed = Date.now() − t0. Display MM:SS:CS.
    - Lap button: lapsSec.push(elapsed), display cumulative + split (delta from last lap).
    - Pause: freeze t0; Resume: shift t0 forward by paused duration (preserve elapsed).
    - Reset: clear t0, lapsSec, elapsed.
  </stopwatch_timing>
  <audio_and_notification>
    - First click/tap anywhere: arm audio context (Web Audio API or load .webm). Audio toggle (aria-pressed) controls if alarm plays.
    - Completion: if armed, playAlarm (sine 880Hz 200ms OR .webm); if Notification.permission === "granted", show Notification.
    - Fail gracefully: no context permission / no notification permission / audio blocked = visual only (no throw).
  </audio_and_notification>
  <persistence>
    - Mount: loadState from localStorage → zod parse → if endTimestamp in future, resume countdown; if past and within grace window, show completion; else show idle.
    - Change: debounced saveState (mode/endTimestamp/isPaused/lapsSec).
    - Reload mid-run: endTimestamp + isPaused persisted, so user returns to running countdown (time advanced correctly).
  </persistence>
  <keyboard_shortcuts>
    - Enter / Space → start/pause.
    - R → reset (if countdown; stopwatch reset is separate button).
    - L → lap (stopwatch only; debounced to prevent hammer-tap).
    - Esc → blur (no auto-close behavior).
  </keyboard_shortcuts>
</core_functionality>

<error_handling>
  <audio_context>Web Audio API failure (no mic permission, no speaker) → silent fail, visual-only alarm (flash). User sees countdown complete, hears nothing, sees toast "alarm would ring if available".</audio_context>
  <notification>Notification.permission !== "granted" → skip. If permission explicitly "denied", never ask again (respect user choice).</notification>
  <storage>localStorage unavailable (private mode / quota) → in-memory state, fully usable, non-persistent. No scary error.</storage>
  <negative_time>If endTimestamp is corrupted or in past, treat as completed; show completion UI + offer reset.</negative_time>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is CORAL (var(--accent-coral) / var(--accent-coral-soft)) — "calculator" category identity per DESIGN. Icon tile, active tab, progress bar, alarm toggle highlight.
    - Primary CTA (Start button) = brand honey-gold var(--brand).
  </accent_usage>
  <display>
    - Countdown/stopwatch large time display: Gmarket Sans clamp(48px, 10vw, 72px) / 700 var(--text), monospace fallback for digits. MM:SS centered, no flicker.
    - Presets + lap list: body-sm 14px, Pretendard, var(--text-secondary).
  </display>
  <motion>
    - Countdown tick: no per-digit animation (drift risk). Whole MM:SS updates every 50–100ms (minimalist).
    - Completion flash: 2× opacity pulse (1 → 0.5 → 1) 500ms easing var(--ease-out), gated by prefers-reduced-motion (instant opacity if reduced).
    - Button hover: translateY(-2px) 150ms; press: scale 0.98.
  </motion>
  <responsive>320 / 375 / 768 / 1024 / 1440 — stack vertically on mobile, 2-column setup+display on ≥768px. No overflow.</responsive>
</aesthetic_guidelines>

<final_integration_test>
  <test_scenario_1>
    <description>Countdown to completion with sound + notification</description>
    <steps>
      1. Select Pomodoro preset (25:00). Click "🔔 Alarm on" toggle (armed). Tap Start.
      2. Timer counts down in MM:SS. document.title shows "25:00 — Timer".
      3. After 25 minutes, timer reaches 00:00. Alarm plays (sine 880Hz 200ms if armed). Browser notification pops if permission granted.
      4. Toast shows "Time's up!" Pause/Reset buttons visible.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Reload mid-countdown</description>
    <steps>
      1. Start 3:00 countdown. After 1 minute, reload page (Cmd+R).
      2. Timer resumes with ~2:00 remaining (calculated fresh from endTimestamp).
      3. Countdown continues uninterrupted (drift-free).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Stopwatch + laps</description>
    <steps>
      1. Switch to Stopwatch mode. Tap Start. Timer begins 00:00:00.
      2. After 10 seconds, tap "Lap" → lap[0] = 10s recorded. Timer continues.
      3. After 5 more seconds (total 15s), tap Lap → lap[1] = 5s (split), cumulative 15s displayed.
      4. Pause/reset work as expected. Lap list persists across pause.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Custom time input + keyboard control</description>
    <steps>
      1. Select Custom preset. Input "00:02:30" (2 min 30 sec). Tap or press Enter to start.
      2. Countdown from 02:30. Press Space/Enter to pause. Press R to reset.
      3. Esc blurs input (no auto-action).
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO, locale swap</description>
    <steps>
      1. Switch to /en → chrome (tabs/labels/FAQ) English; presets say "Pomodoro (Focus)" / "Pomodoro (Break)".
      2. Build prod → /ko/tools/timer and /en/tools/timer unique title/description/canonical/hreflang/OG, statically generated.
      3. HTML has SoftwareApplication + FAQPage JSON-LD; how-to/FAQ localized. document.title format locale-aware.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Two modes (countdown + stopwatch) both usable; countdown presets work; custom input accepted; start/pause/reset functional; laps record + display (stopwatch); keyboard shortcuts work.</functionality>
  <timing>Drift-free over 5+ min (absolute timestamp comparison, not tick accumulation). Reload mid-countdown, time advances correctly. Tab backgrounded, time still accurate on return.</timing>
  <audio_and_notification>Alarm plays (Web Audio or .webm) when armed on completion. Browser Notification sent if permission granted. Both degrade gracefully if unavailable (visual-only fallback).</audio_and_notification>
  <persistence>Running countdown survives reload. Stopwatch laps persist across pause. localStorage key `jurepi-timer` recovers state on mount.</persistence>
  <ux>Display glanceable (large MM:SS). Keyboard-usable (Enter/Space start-pause, R reset). Responsive (≥44px tap targets). ≥44 lux contrast. prefers-reduced-motion respected (no flashing, instant fade).</ux>
  <technical>lib/timer/* pure ≥85% unit coverage (timing, audio, storage); vitest snapshot for document.title format; E2E drift test (5 min real-world wait, or mocked Date.now()); TS 0 errors; <800 lines per file.</technical>
  <visual>DESIGN.md compliant; coral identity + brand CTA; large countdown display (monospace digits, no jitter); button states (hover lift, press scale); 320/768/1024 responsive, no overflow.</visual>
  <performance>Tool route within platform budget; LCP < 2.5s; CLS unaffected (no ad-driven shift).</performance>
</success_criteria>

<key_implementation_notes>
  <critical_paths>
    1. useTimer hook (RAF loop + absolute-time remaining calculation + document.title sync + localStorage save debounced). This is the heartbeat.
    2. Audio context arm on first click + playAlarm on completion (Web Audio or .webm fallback).
    3. Notification permission check + safe dispatch on completion.
    4. localStorage recovery on mount: endTimestamp + isPaused → resume or show completion.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/timer/{schema,timing,audio,storage}.ts Vitest (RED→GREEN): format time, remaining calc, audio play, state serialization.
    2. useTimer hook (RAF + doc.title sync + localStorage save + Notification dispatch).
    3. UI: ModeTabs, CountdownSetup (presets + input), CountdownDisplay/StopwatchDisplay (large time + buttons).
    4. LapList, AudioToggle, keyboard shortcuts.
    5. TimerIntro/HowTo/FAQ + SoftwareApplication + FAQPage JSON-LD.
    6. Registry entry, slug→component + generateMetadata branches.
    7. E2E: countdown to completion, reload mid-run, stopwatch laps, keyboard control.
    8. Visual regression 320/768/1024, prefers-reduced-motion, dark mode.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥85% (timing/format/audio/storage); hook jest-mock RAF + Date.now(); E2E countdown 5min (mocked or fast-forward Date), reload mid-run, notification mock; jsdom localStorage; keyboard E2E (Enter/Space/R).</testing_strategy>
  <drift_prevention_checklist>
    - [ ] remaining = endTimestamp − Date.now(), NEVER accumulating tick counters
    - [ ] RAF loop frequency (50–100ms) not critical; only endTimestamp matters
    - [ ] Pause: snapshot elapsed; Resume: adjust t0 forward (don't lose paused time)
    - [ ] Reload: endTimestamp already set; Date.now() will auto-correct for elapsed
  </drift_prevention_checklist>
</key_implementation_notes>

</project_specification>
```

Final line count: 338