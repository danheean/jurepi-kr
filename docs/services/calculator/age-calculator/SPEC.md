# Age Calculator — Calculate age in Korean and international conventions plus date facts — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **Age Calculator** (나이 계산기) — compute age from a birthdate using three conventions (만 나이 / 연 나이 / 세는 나이), show day-of-week and Korean zodiac (띠), calculate days lived, and offer copy-paste and localStorage people/birthday saving. Input is a local birthdate; calculations are pure domain logic; rendering is locale-aware (ko/en) via `useLocale()` BCP-47. Internal service codename: `age-calculator`. Registry id: `age-calculator`. Public URL slug: `/[locale]/tools/age-calculator`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>Age Calculator — Age & Date Facts (Jurepi tool, codename age-calculator, registry id age-calculator)</project_name>

<overview>
Age Calculator answers the question "How old am I?" with three age conventions and a collection of date facts. Users input a birthdate and optionally an "as-of" reference date (default: today in local time). The tool computes: (1) **만 나이** (international / Korea's legal standard since June 2023 age-unification law) = exact years since birth; (2) **연 나이** (calendar-year based) = current year − birth year; (3) **세는 나이** (traditional Korean counting age) = birth year + 1, increments on every Lunar New Year (note: tool warns that Korea unified to 만 나이 in 2023). Plus: exact days lived, years/months/days breakdown, next birthday countdown, day of week born, Korean zodiac (띠; map via lunar calendar heuristic), Western star sign. All calculations are pure domain logic, immutable and fully unit-tested.

Two localStorage-backed conveniences reduce friction on repeat visits: (a) **recent lookups** — every valid calculation auto-saves its birthdate (no name required) to a most-recent-first list, so a returning user re-checks with one click instead of re-typing; (b) **favorite people** — explicit, named saves. Recent is low-friction/automatic; favorites are deliberate/named. Both are client-only.

CRITICAL (client-only, SSG): 100% client-side. No backend, no database. The only first-party persistence is `localStorage` (recent lookups + favorite people/birthdays), and nothing is ever sent over the network.

CRITICAL (local-time dates, never UTC): All date math uses LOCAL midnight (Date constructor via year/month/day, never UTC). Parsing a birthdate string "2000-03-15" creates `new Date(2000, 2, 15)` (local midnight), not a UTC Date. This ensures day-of-week and age calculations respect the user's local time zone. Reference qna-a-day/date.ts for the pattern.

CRITICAL (Intl locale = BCP-47, never i18n key): When calling `Intl.DateTimeFormat`, `toLocaleString()`, etc., always pass the locale from `useLocale()` (e.g., "ko", "en"). NEVER pass an i18n translation key string to Intl APIs — it throws RangeError. Keep locale and i18n messages separate.

CRITICAL (SPA, usability-first): Per platform rule, every Jurepi tool is a client-side SPA. Input birthdate, toggle "as-of" date, browse age/facts, save people to favorites — all local state, NO route navigation, NO full page reload. The route is statically generated (SSG) for SEO; the interactive tool is a client-component island on that static shell.
</overview>

<platform_integration>
  - Route: /[locale]/tools/age-calculator (SSG; registry slug "age-calculator", id "age-calculator", status "live", accent "mint", category "calculator").
  - Provided by platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.age-calculator.*` (UI chrome: labels, help text, zodiac names, error messages — NOT birthdate strings; those come from user input and Intl formatting).
  - Platform dependency (SMALL — NO new category needed): the `'calculator'` category already exists with the `mint` accent and the "계산기"/"Calculator" label. The only platform change is adding ONE `ToolMeta` registry entry, a slug→component branch in the tool route, and a `generateMetadata` branch.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Birthdate input (datepicker or text input YYYY-MM-DD); optional "as-of" date input (default today, local time).
    - Pure domain layer: age calculations (만/연/세는), day-of-week, Korean zodiac (띠) lookup, Western star sign, days lived, years/months/days breakdown, next-birthday countdown.
    - localStorage persistence (recent lookups): auto-save each valid birthdate to a most-recent-first, de-duplicated list (max 10); one-click re-check; clear-all; fail gracefully.
    - localStorage persistence (favorite people): save/load/delete favorite people (name + birthdate); auto-prune unknown keys; max 20 saved people.
    - Result display: age summary card (three conventions side-by-side with explanation), date facts panel (zodiac, star sign, DoW, days lived, breakdown, countdown, Korean-to-international age note).
    - Copy result to clipboard (age summary + details); copy birthdate string.
    - Tool-specific SEO long-form ("How old am I?" / "Age calculation conventions in Korea") + FAQ (FAQPage JSON-LD) + HowTo JSON-LD (birthdate input → age display).
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - Real lunar calendar data (Korean zodiac and star sign use solar month heuristics; Phase 2 candidate for lunar-calendar precision).
    - Pregnancy / gestational age (separate future tool).
    - Login / accounts / cross-device sync.
    - Per-person deep-link URLs (e.g., /tools/age-calculator/jane) — MVP is single route + client state.
  </out_of_scope>
  <future_considerations>
    - Lunar calendar integration for Korean zodiac (Phase 2).
    - Generate shareable "age certificate" image (Phase 2).
    - Batch age lookup (multiple people, export CSV) — Phase 3.
    - Age timeline / "you've lived X days = Y years" narrative — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <date_handling>Local-time dates only via `new Date(year, month-1, day)` (never UTC constructor or Date.parse). Reference src/lib/qna-a-day/date.ts pattern: toDateKey, parseDateKey, addDays, isLeapYear, daysInMonth. Avoid Date.prototype.toISOString() / UTC getters.</date_handling>
    <locale_for_intl>Extract locale via `useLocale()` hook (returns BCP-47 "ko"/"en"). Pass to `Intl.DateTimeFormat`, `toLocaleDateString()`. NEVER pass i18n message keys to Intl.</locale_for_intl>
    <validation>zod v3.x for birthdate schema (valid local date, not future, not >150 years old). Reuse repo's zod.
    <storage>Two localStorage keys: `jurepi-age-calculator-people` (JSON array of {id, name, birthdate}, max 20) and `jurepi-age-calculator-recents` (JSON array of DateKey strings, max 10). Auto-prune unknown/malformed entries. Fail gracefully if localStorage unavailable (session-only, no throw).</storage>
    <clipboard>navigator.clipboard.writeText → execCommand fallback → silent fail (copy is nice-to-have). Success toast only on real success.</clipboard>
    <animation>Native CSS transitions only (input focus, card hover lift, result cross-fade). No animation library.</animation>
  </module_specific>
  <libraries>
    <zod>zod v3.x — already in repo; birthdate validation schema.</zod>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/age-calculator/                    # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: BirthdateInput, Person, PeopleStore + safeparse helpers
│   ├── date.ts                            # toLocalDateKey, parseDateKey, isLeapYear, daysInMonth (similar to qna-a-day pattern)
│   ├── age.ts                             # 만나이(manNai), 연나이(yeonNai), 세는나이(seeneunNai), dayOfWeek, daysLived, breakdown
│   ├── zodiac.ts                          # Korean zodiac (띠) lookup by year; Western star sign by month/day
│   ├── people.ts                          # Immutable ops: addPerson, removePerson, updatePerson, pruneUnknown
│   ├── recents.ts                         # Immutable ops: pushRecent (dedupe+prepend+truncate), pruneUnknown, (de)serialize (mirror url-encoder/recents.ts)
│   └── age.test.ts, zodiac.test.ts, etc.  # Vitest ≥80% coverage
├── components/tools/age-calculator/
│   ├── AgeCalculator.tsx                  # Orchestrator (Client Component) — owns birthdate + asOf state + useAgeLookup()
│   ├── useAgeLookup.ts                    # Hook: birthdate parsing + age calculations + localStorage people + copy adapter
│   ├── BirthdateInput.tsx                 # Date input (datepicker or text) + validation feedback; "as-of" toggle
│   ├── AgeSummary.tsx                     # Three-column age cards (만/연/세는) with icons + brief explanation
│   ├── DateFacts.tsx                      # Zodiac, star sign, DoW, days lived, breakdown, countdown, Korean age note
│   ├── PeopleList.tsx                     # Favorites: saved people cards, add/remove, select to prefill birthdate
│   ├── RecentLookups.tsx                  # Recent birthdates (auto-saved), one-click re-check, clear-all
│   ├── AgeCalculatorIntro.tsx             # H1 + lead (SEO; server-render where possible)
│   ├── AgeCalculatorHowTo.tsx             # "How to calculate age" + Korean age conventions explained
│   ├── AgeCalculatorFaq.tsx               # Q&A + FAQPage JSON-LD
│   └── AgeCalculatorEmptyState.tsx        # Hint when no birthdate entered
└── i18n/messages/{ko,en}.json             # tools.age-calculator.* UI chrome (labels, zodiac names, error messages)
</file_structure>

<core_data_entities>
  <birthdate_input>
    - string (YYYY-MM-DD format) or Date object
    - Constraints: valid local date, not future, not >150 years old
    - zod validated; parse failure → clear toast, input reset
  </birthdate_input>
  <age_result>
    - manNai: number (international / Korea's legal standard since 2023)
    - yeonNai: number (calendar-year based)
    - seeneunNai: number (traditional Korean counting)
    - dayOfWeek: 0-6 (0=Sun) — formatted locale-aware via Intl.DateTimeFormat (BCP-47 from useLocale())
    - daysLived: number
    - breakdown: { years, months, days } (exact time since birth)
    - nextBirthdayCountdown: number (days until next birthday)
    - zodiac: string (띠 name, e.g., "쥐띠"/"Rat"; displayed in current locale)
    - starSign: string (Zodiac sign, e.g., "♈ Aries"; displayed in current locale)
    INVARIANT: all ages ≥ 0; breakdown years ≤ age; countdown > 0
  </age_result>
  <person_record>
    - id: string (nanoid)
    - name: string (non-empty)
    - birthdate: DateKey (YYYY-MM-DD, local midnight)
  </person_record>
  <people_store>
    - version: number (STORE_VERSION = 1)
    - people: Person[] (max 20, insertion order)
    - meta: { createdAt: number, updatedAt: number }
    localStorage key: `jurepi-age-calculator-people`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown keys ignored.
  </people_store>
  <recent_lookup>
    - Stored as a plain birthdate DateKey string (YYYY-MM-DD). No id, no name (distinct from person_record).
    - List is most-recent-first, de-duplicated by birthdate, capped at MAX_RECENTS (10).
    - localStorage key: `jurepi-age-calculator-recents` (JSON array of DateKey strings).
    - Auto-captured on every VALID calculation (not on invalid/rejected input). Selecting a recent prefills the birthdate input and recalculates.
    INVARIANT: read is pruned (drop non-string / empty / malformed-DateKey entries); fail → start fresh (no throw).
  </recent_lookup>
  <constants>
    - MAX_PEOPLE = 20; MAX_RECENTS = 10; AGE_MAX_YEARS = 150; COPY_TOAST_MS = 1600ms.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/age-calculator" page="AgeCalculator (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG. Per-person deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <age_calculator>                <!-- "use client"; owns birthdate + asOf + selectedPersonId state + useAgeLookup() owner -->
    <age_calculator_intro />      <!-- H1 + lead (server-render where possible) -->
    <main_layout>                 <!-- Desktop 2-split (input | result), mobile stacked -->
      <input_panel>
        <birthdate_input />       <!-- Date input + as-of toggle + validation -->
      </input_panel>
      <result_panel>              <!-- Desktop: sticky right; mobile: below input -->
        <age_summary />           <!-- 만/연/세는 cards; Korean-to-international note -->
        <date_facts />            <!-- Zodiac, star sign, DoW, days lived, breakdown, countdown -->
        <copy_button />           <!-- Copy all results to clipboard -->
      </result_panel>
      <recent_panel>              <!-- Recent lookups: auto-saved birthdates, one-click re-check -->
        <recent_lookups />
      </recent_panel>
      <people_panel>              <!-- Favorites: browse saved people, select to prefill -->
        <people_list />
      </people_panel>
    </main_layout>
    <age_calculator_how_to />     <!-- SEO long-form -->
    <age_calculator_faq />        <!-- FAQPage JSON-LD -->
  </age_calculator>
  <note>SPA within tool: birthdate change = immediate recalculation (local state switch), NOT route navigation. All panels update in sync.</note>
</component_hierarchy>

<pages_and_interfaces>
  <age_calculator_intro>
    - Eyebrow: "계산 도구" / "CALCULATOR TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "나이 계산기" / "Age Calculator" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "생년월일을 입력하면 만 나이, 연 나이, 세는 나이와 생년월일 정보(띠, 별자리, 요일)를 확인할 수 있습니다."
  </age_calculator_intro>

  <birthdate_input>
    - DESIGN text-input style (or native date picker). Full width on mobile, flex:1 on desktop. Label "생년월일"/"Birthdate", placeholder "YYYY-MM-DD" or date picker UI.
    - Validation: show error (invalid date, future, >150 years) in real time.
    - Toggle "기준일"/"As-of date" (default: today, local midnight). When enabled, show secondary date input.
    - Error states render clear messages without throwing; focus returns to input.
  </birthdate_input>

  <age_summary>
    - Three cards side-by-side (desktop) or stacked (mobile), each 100% width ÷ 3 on desktop.
    - Card: var(--surface) + full 1px var(--hairline) border, radius var(--radius-lg), padding 16px. Category identity is carried by the large mint-ink age number (var(--accent-mint-ink)), NOT a colored side-stripe (anti-slop: no border-left accent > 1px).
    - Each card: large age number (headline 28px var(--text)/700), label (caption var(--text-secondary), 12px), brief explanation (body-sm 14px var(--text-secondary), 2 lines max).
    - Top card (만 나이): "Legal age (Korea 2023–)"; middle (연 나이): "Calendar year based"; bottom (세는 나이): "Traditional Korean" + small note "(Korea historically used this; unified to 만 나이 in 2023)".
  </age_summary>

  <date_facts>
    - Layout: grid of 2×2 facts (desktop) or 1-col (mobile).
    - Each fact: small card var(--surface-muted), radius var(--radius-md), padding 12px. Label (eyebrow var(--text-muted)), value (body var(--text)).
    - Zodiac: "띠" label + icon tile (var(--accent-mint-soft) bg) + zodiac name (ko/en per locale).
    - Star sign: "별자리" + icon (Unicode ♈ etc.) + sign name.
    - Day of week: "요일" + localized day name via Intl.DateTimeFormat(locale, {weekday:'long'}) applied to birthdate.
    - Days lived: "살아온 날" + number.
    - Breakdown: "정확한 나이" + "X년 Y개월 Z일".
    - Countdown: "다음 생일까지" + "X일".
  </date_facts>

  <recent_lookups>
    - Section "최근 계산"/"Recent" — shown only when the list is non-empty.
    - Horizontal chips (or compact row) of recent birthdates, most-recent-first, each formatted locale-aware (Intl); tap a chip to re-check (prefills birthdate input + recalculates). Optional per-chip resulting 만 나이 hint.
    - "지우기"/"Clear" button clears the whole recent list (localStorage + state).
    - Distinct from Favorites: recents are automatic + nameless; favorites are deliberate + named. A recent birthdate can be promoted to a favorite via the add-person flow.
    - Empty: section hidden (no empty-state text needed; recents appear after first calculation).
  </recent_lookups>

  <people_list>
    - Collapsible section "자주 계산하는 사람들"/"Favorite People" (if any saved).
    - Each person: name + birthdate (formatted locale-aware), tap to select (prefills birthdate input), remove button (×).
    - Add new: button + modal input (name + birthdate) → save to localStorage.
    - Empty state: "생일을 저장해두고 클릭하면 바로 계산해요."
  </people_list>

  <keyboard_and_copy>
    - Enter in birthdate field → recalculate immediately.
    - Copy button → copies age summary + facts (formatted text) to clipboard; success toast (1.6s).
    - If no birthdate entered, copy is disabled.
  </keyboard_and_copy>
</pages_and_interfaces>

<core_functionality>
  <age_calculations>
    - manNai(birthDate, asOfDate): floor((asOfDate - birthDate) / years) using exact date arithmetic, not calendar.
    - yeonNai(birthYear, asOfYear): asOfYear - birthYear.
    - seeneunNai(birthYear, asOfYear): (asOfYear - birthYear) + 1 (birth year counts as age 1).
    - daysLived(birthDate, asOfDate): floor((asOfDate - birthDate) / 86400000).
    - breakdown(birthDate, asOfDate): { years: number, months: number, days: number } via date subtraction.
    - dayOfWeek(birthDate): 0-6 (Sun=0), use getDay() on local date.
    - nextBirthdayCountdown(birthDate, asOfDate): days until next (month/day) anniversary in year of asOfDate.
  </age_calculations>
  <zodiac>
    - Zodiac (띠): 12-year cycle (rat, ox, tiger, …). Lookup by (birthYear % 12), map to localized name from i18n tools.age-calculator.zodiac.*.
    - Star sign: lookup by (month, day), e.g., (3,15)=Aries. Map to localized name + Unicode symbol.
  </zodiac>
  <recents_persistence>
    - localStorage read on mount: parse `jurepi-age-calculator-recents` → prune to valid DateKey strings → in-memory state; fail → start fresh (no throw).
    - On every valid calculation: pushRecent(list, birthdate, MAX_RECENTS) (dedupe by birthdate, prepend, cap 10) → JSON.stringify → setItem. Invalid/rejected input does NOT record a recent.
    - Clear: reset to [] → removeItem/setItem. Quota/private-mode → keep in-memory, fully usable.
    - Pure ops live in recents.ts (mirror src/lib/url-encoder/recents.ts); the hook owns localStorage I/O.
  </recents_persistence>
  <people_persistence>
    - localStorage read on mount: zod parse `jurepi-age-calculator-people` → in-memory state; fail → start fresh.
    - Add person: nanoid id, zod validate {name, birthdate} → immutable append → setItem.
    - Remove person: filter by id → setItem.
    - Prune unknown: on load, filter to only known ids (catalog consistency).
    - Change: immediate JSON.stringify → setItem; catch quota → keep in-memory (fully usable, non-persistent).
  </people_persistence>
  <i18n>All UI chrome from tools.age-calculator.* (ko/en): labels, zodiac/star-sign names, help text, error messages. Birthdate formatting via Intl.DateTimeFormat(useLocale(), …) — no i18n keys passed to Intl.</i18n>
</core_functionality>

<error_handling>
  <invalid_date>User enters unparseable date → toast "유효한 날짜를 입력해주세요" / "Please enter a valid date" + input clears.
  <future_date>Birthdate > asOfDate → toast "미래 날짜는 입력할 수 없습니다" + input refocuses.
  <age_too_old>Birthdate > 150 years ago → toast "150년 이상 전 날짜는 입력할 수 없습니다" + input refocuses.
  <storage_unavailable>Private mode or quota exceeded → recalculations fully work; saved people kept in-memory (no scary error).
  <copy_failure>clipboard unavailable → silent (no false toast). Success toast only on real copy.
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is MINT — "calculator" category identity per DESIGN. Carried by the mint-ink age number (var(--accent-mint-ink), text-safe) and zodiac tile bg (var(--accent-mint-soft)). NOT used as a side-stripe. Focus/action = brand honey-gold (var(--focus-ring)/var(--brand)), never accent (principle: accent=identity, brand=action).
    - Primary CTA (Copy) stays brand honey-gold var(--brand). Accent = identity, not action.
  </accent_usage>
  <surfaces>Age cards = var(--surface) + 1px var(--hairline); radius var(--radius-lg); fact chips var(--surface-muted). Soft brand-tinted shadows, hard borders avoided.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); age numbers headline (28px)/700; labels body-sm (14px). Zodiac/star names body (16px)/500.</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, input focus soft glow (shadow), result cross-fade 200ms. --ease-out cubic-bezier(0.16,1,0.3,1). All gated by prefers-reduced-motion (instant fade, no lift).</motion>
  <accessibility>Input labeled; age cards labeled; copy button stated; focus ring var(--focus-ring) visible; ≥44px tap targets; zooming/text resize supported; WCAG 2.1 AA contrast (body text var(--text-secondary) on light surface passes).</accessibility>
  <responsive>≥1024px: 2-split (input left, results right). 768–1023px: single column, results below input. <768px: single column, full-width inputs. No overflow (320 test).</responsive>
  <atmosphere>Bright, friendly "age fact explorer": generous card spacing, large age numbers feel like a celebration, date facts feel like a discovery. Not a dense table; inviting cards feel like Jurepi (warm, clear).</atmosphere>
  <icons>lucide-react: Calendar (input), Copy (copy), Trash2 (remove person), Plus (add person), Heart (favorite toggle). Default 20px, stroke 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>Birthdate strings (user input) are parsed to local Date, then formatted via Intl (never rendered raw HTML). No dangerouslySetInnerHTML.
  <clipboard>User-initiated copy only (age summary text); never read clipboard. User-gesture handler only.
  <privacy>People list localStorage-only, never sent. No analytics events include personal data. Birthdate stored is client-only (no backend).
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<final_integration_test>
  <test_scenario_1>
    <description>Birthdate input → age calculations (만/연/세는)</description>
    <steps>
      1. Input birthdate "2000-03-15" → tool recalculates.
      2. Check three age cards: expect 만=24, 연=24, 세는=25 (as of 2024).
      3. Verify explanation text for each age type.
      4. Check date facts: zodiac (Dragon/용띠), star (Pisces/물병자리), DoW (Monday/월요일 via Intl), days lived (~8800).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Leap-day birthdate (Feb 29)</description>
    <steps>
      1. Input "1996-02-29" (leap year) → tool accepts.
      2. Switch to non-leap year "as-of" date (e.g., "2025-03-01") → age correct (29 years old, next birthday = 2025-03-01 or March 1st if no leap day).
      3. Next-birthday countdown shows ≤1 day.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Recent lookups, save/load people, ko/en locale swap</description>
    <steps>
      1. Calculate "2000-03-15" then "1990-12-01" → both appear in "최근 계산" (most-recent-first: 1990-12-01, 2000-03-15). Re-calculating "2000-03-15" moves it to front (deduped, no duplicate).
      2. Tap a recent chip → birthdate input fills that date, ages recalculate. Reload page → recents persist (list restored from localStorage). "지우기"/Clear → recents section hidden + localStorage cleared.
      3. Save person: name "Jane", birthdate "1995-06-20" → appears in favorites list.
      4. Tap Jane → birthdate input fills "1995-06-20", ages recalculate.
      5. Remove Jane (×) → favorites list empty.
      6. Switch locale /ko → /en → chrome English, recents/age cards/facts labels English; zodiac/star signs English; recent chip dates re-formatted for en locale; next-birthday countdown unchanged (numeric).
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Copy, keyboard, a11y</description>
    <steps>
      1. Enter birthdate "2000-03-15" → Copy button enabled.
      2. Click Copy → clipboard has formatted text (all ages + facts); success toast "복사됨" / "Copied!" (1.6s).
      3. Press Tab → focus ring visible on all inputs; screen reader announces labels.
      4. axe pass → no violations (color contrast, labeled inputs, landmark).
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Error cases, edge dates, i18n</description>
    <steps>
      1. Input future date (tomorrow) → error toast, input refocuses.
      2. Input "1850-01-01" (>150 years) → error toast.
      3. Input invalid "2024-02-30" → error toast.
      4. Build prod → /ko/tools/age-calculator and /en/tools/age-calculator unique title/description/canonical/hreflang/OG, statically generated.
      5. HTML has SoftwareApplication + FAQPage + HowTo JSON-LD; how-to/FAQ localized (not in mounted gate).
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>Birthdate input → three-age display (만/연/세는) + date facts (zodiac/star/DoW/days/breakdown/countdown) + explain Korean age unification 2023. Recent lookups auto-saved (localStorage, max 10, dedupe, clear-all) for one-click re-check. Save/load people (localStorage, max 20). Copy result. No future/invalid dates allowed.</functionality>
  <user_experience>Instant recalculation on birthdate change; card layout feels clear; ≥44px targets; visible focus; SPA — no route reload on any interaction. Locale swap (ko/en) fully reflected.</user_experience>
  <technical_quality>lib/age-calculator/* pure ≥80% unit coverage (date/age/zodiac/people); TS 0 errors; <800 lines per file. Local-time dates (no UTC); Intl locale from useLocale() (no i18n keys to Intl); localStorage graceful fail.</technical_quality>
  <visual_design>DESIGN.md compliant; mint identity; bright, friendly age-fact explorer. Date facts feel like discovery. No dense tables.</visual_design>
  <accessibility>Full keyboard (Tab/Enter/Shift+Tab); aria-live for validation feedback; labeled inputs; motion-respect (prefers-reduced-motion); WCAG 2.1 AA.</accessibility>
  <seo_and_json_ld>Intro/HowTo/FAQ render outside mounted gate (SSR); SoftwareApplication + FAQPage + HowTo JSON-LD; ko/en localized titles/descriptions/canonical/hreflang; sitemap includes /ko/tools/age-calculator and /en/tools/age-calculator.</seo_and_json_ld>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). /[locale]/tools/age-calculator pre-rendered by platform generateStaticParams iterating registry (status "live"). No generated artifacts — all data is compile-time constant.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'calculator' category + 'mint' accent already exist.
    {
      id: 'age-calculator',
      slug: 'age-calculator',
      category: 'calculator',
      icon: 'Cake',                 // lucide-react
      accent: 'mint',
      status: 'live',
      isNew: true,
      order: 2,                     // after ladder(1) etc.
      keywords: ['나이','나이 계산','만 나이','연 나이','세는 나이','생년월일','생일','띠','별자리','age','how old','birthday','zodiac','star sign'],
    },
    ```
    Also add slug→component branch (<AgeCalculator/>) and generateMetadata branch in tool route.
  </platform_registry_change>
  <critical_paths>
    1. Date math: local-time only (never UTC). Reference qna-a-day/date.ts.
    2. Locale for Intl: useLocale() BCP-47 only, never i18n keys.
    3. Age calculations (만/연/세는) + date facts (zodiac/star/breakdown).
    4. People persistence: localStorage save/load/prune with zod schema.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/age-calculator/{date,schema,age,zodiac,people,recents}.ts Vitest (RED→GREEN): local-date conversion, age calculations (all three), zodiac/star lookup, person immutable ops, recents immutable ops (pushRecent dedupe/cap, prune, (de)serialize), localStorage schema.
    2. tools.age-calculator.* messages (ko/en): age labels, zodiac names, star names, error messages.
    3. useAgeLookup hook (birthdate parsing + age calculations + localStorage people + copy adapter).
    4. BirthdateInput (date input or datepicker + as-of toggle + validation feedback).
    5. AgeSummary + DateFacts (cards, Intl-formatted day-of-week, zodiac display).
    6. RecentLookups (auto-saved chips, re-check, clear) + PeopleList (favorites browser, add/remove).
    7. Keyboard shortcuts, motion-reduce, a11y (axe, focus-visible, aria-live).
    8. AgeCalculatorIntro/HowTo/Faq + SoftwareApplication + FAQPage + HowTo JSON-LD via platform lib/seo.ts.
    9. Registry status→live; slug→component + generateMetadata branches; E2E 1–5; visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <testing_strategy>Pure Vitest ≥80% (date/age/zodiac/people); E2E scenarios 1–5 (esp. #2 leap-day, #3 locale-swap, #5 JSON-LD); localStorage jsdom-isolated; Intl locale isolation (no i18n key leakage).</testing_strategy>
</key_implementation_notes>

</project_specification>
```
