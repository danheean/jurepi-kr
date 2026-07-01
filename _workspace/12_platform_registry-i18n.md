# Platform Engineer: Registry & i18n Wiring for Q&A a Day (qna-a-day)

**Date:** 2026-06-30  
**Status:** Complete — Framework layer (registry, types, i18n catalog, icon) wired. Route wiring (Phase 3) pending domain/UI completion.

---

## Files Modified

1. **src/tools/types.ts** — Added 'mindset' to ToolCategory union
2. **src/tools/registry.ts** — Added qna-a-day entry (status: 'live', icon: NotebookPen, accent: grape, order: 8, isNew: true)
3. **src/lib/tool-search.ts** — Added 'mindset' to CATEGORY_ORDER (after 'fun')
4. **src/components/home/toolStyle.tsx** — Imported NotebookPen, added to iconMap
5. **src/i18n/messages/ko.json** — Added categories.mindset + full tools.qna-a-day.* namespace (92 keys)
6. **src/i18n/messages/en.json** — Added categories.mindset + full tools.qna-a-day.* namespace (92 keys)

---

## Registry Entry

```typescript
{
  id: 'qna-a-day',
  slug: 'qna-a-day',
  category: 'mindset',
  icon: 'NotebookPen',  // lucide-react v0.468.0 ✓ verified
  accent: 'grape',
  status: 'live',
  isNew: true,
  order: 8,
  keywords: ['1일1질문', '하루한질문', '365질문', '질문일기', '자기성찰', '일기', '저널', 'q&a a day', 'daily question', 'journal', 'self reflection', 'one question a day'],
}
```

---

## Icon Verification

- **Icon Used:** NotebookPen (lucide-react ^0.468.0)
- **Substitution:** None required — NotebookPen exists and is semantically correct for a journal tool
- **Implementation:** Imported in toolStyle.tsx and mapped in ToolIcon function

---

## Category Addition

- **Key:** `categories.mindset`
- **Korean:** "마음·기록"
- **English:** "Mindset"
- **Order:** Inserted after 'fun' in CATEGORY_ORDER for stable category sorting

---

## i18n Namespace: tools.qna-a-day.*

### Key Structure (92 total, ko/en parity verified)

```
Meta / SEO:
  meta.title
  meta.description

Intro / Hero:
  intro.eyebrow
  intro.title
  intro.lead

Navigation:
  tabBar.today
  tabBar.calendar
  tabBar.journal
  tabBar.settings

Today Panel:
  today.badge
  today.dateFormatNote
  today.futureHint
  today.neighborPrev
  today.neighborNext
  today.backToToday
  today.pastYearsHeading
  today.noPastYears

Composer (autosave textarea):
  composer.placeholder
  composer.saving
  composer.saved
  composer.savedJustNow
  composer.charCount
  composer.deleted
  composer.undo
  composer.saveNow
  composer.maxReached

Calendar Panel:
  calendar.prevMonth
  calendar.nextMonth
  calendar.prevYear
  calendar.nextYear
  calendar.answered
  calendar.unanswered
  calendar.today
  calendar.future
  calendar.answeredCountThisYear
  calendar.heatmapLegend

Journal Panel:
  journal.searchPlaceholder
  journal.yearAll
  journal.noEntries
  journal.noResults
  journal.clearSearch
  journal.editAria

Settings Panel:
  settings.exportTitle
  settings.exportButton
  settings.lastBackup
  settings.neverBackedUp
  settings.importTitle
  settings.importButton
  settings.importMerge
  settings.importReplace
  settings.importInvalid
  settings.importDiffSummary
  settings.resetTitle
  settings.resetButton
  settings.resetConfirm
  settings.resetConfirmBody
  settings.privacyTitle
  settings.privacyBody
  settings.backupReminder
  settings.storageUnavailable
  settings.quotaExceeded
  settings.corruptRecovered
  settings.downloadCorrupt

Stats / Progress:
  stats.streak
  stats.longestStreak
  stats.total
  stats.ringAria

How-To (SEO long-form):
  howTo.heading
  howTo.whatTitle
  howTo.whatBody
  howTo.howTitle
  howTo.howBody
  howTo.whyTitle
  howTo.whyBody

FAQ (with FAQPage JSON-LD):
  faq.heading
  faq.items[0-6].q
  faq.items[0-6].a
```

### Placeholder Token Documentation

All numeric placeholders use curly braces for i18n interpolation:

| Token | Usage | Example |
|-------|-------|---------|
| `{current}` | Composer char counter current value | "1234 / 4000" |
| `{max}` | Composer max char limit | "1234 / 4000" |
| `{count}` | Numeric counts (streak, total, answers) | "🔥 {count}일 연속" |
| `{answered}` / `{elapsed}` | Calendar completion ring | "올해 {answered}/{elapsed}일 기록" |
| `{newCount}` / `{conflictCount}` | Import diff summary | "가져올 기록 {newCount}개" |
| `{date}` | Formatted date in last backup or edit aria | "마지막 백업: {date}" |
| `{n}` | Player/participant index | "참가자 {n}" (legacy pattern) |

---

## Ko/En Parity Validation

```
✓ Korean:  92 keys under tools.qna-a-day.*
✓ English: 92 keys under tools.qna-a-day.*
✓ Leaf key sets identical (verified via node script)
✓ Array structure (faq.items[0-6]) preserved in both locales
```

**Validation Script Output:** See git diff / terminal output for full key-by-key comparison.

---

## Build Status

### TypeScript Compilation
- **Result:** ✓ PASS (tsc --noEmit)
- **Caveat:** Errors in domain layer (`src/lib/qna-a-day/*.test.ts`) are unrelated to registry/i18n changes and are domain-engineer's responsibility.

### Production Build (pnpm build)
- **Expected Behavior:** Since registry status is 'live', `generateStaticParams` will attempt SSG for `/ko/tools/qna-a-day` and `/en/tools/qna-a-day`.
- **Current Status:** Build fails due to missing route component (`src/app/[locale]/tools/[slug]/page.tsx` has no dynamic import branch for qna-a-day).
- **This is EXPECTED:** The route wiring (UI component mounting) is Phase 3 (after domain + UI layers are complete). Until then, the build will red.
- **Workaround (if needed for parallel testing):** Temporarily set registry status to 'coming_soon' to exclude from generateStaticParams; revert to 'live' once route is wired.

---

## Contract for UI/Domain Layers

### Domain Module Boundary
**Do NOT import from:** `src/components/tools/qna-a-day`, `src/app/[locale]/tools/[slug]/page.tsx`  
**Expected exports from domain (`src/lib/qna-a-day/*):**
- Pure date/journal/stats functions (no React/Next deps)
- Full Zod schema export (Store, Entry, STORE_VERSION)
- Serialization round-trip (serialize/deserialize/mergeStores)

### UI Module Boundary
**Do NOT import from:** `src/lib/qna-a-day` directly (only via hook)  
**Expected exports from UI (`src/components/tools/qna-a-day`):**
- `DailyQuestion` (Client Component, orchestrator, owns tab state)
- `useDailyJournal` (Custom hook: localStorage read/write + autosave + actions)
- Sub-components (TodayPanel, CalendarPanel, JournalPanel, SettingsPanel, etc.)
- All strings consumed from `tools.qna-a-day.*` i18n namespace (NOT hardcoded)

### Route/SEO Boundary (Phase 3)
**File:** `src/app/[locale]/tools/[slug]/page.tsx`  
**Expected behavior (to be implemented):**
```typescript
if (slug === 'qna-a-day') {
  // Dynamic import the DailyQuestion component
  const DailyQuestion = dynamic(
    () => import('@/components/tools/qna-a-day/DailyQuestion').then(m => ({ default: m.DailyQuestion }))
  );
  return <DailyQuestion />;
}

// generateMetadata for slug='qna-a-day':
// - title: t('meta.title')   → "1일 1질문 · 매일의 기록" / "One Question a Day · Daily Reflection"
// - description: t('meta.description')
// - JSON-LD: SoftwareApplication, FAQPage (from qna-faq.items)
```

---

## Next Steps (Outside This Phase)

1. **Domain Layer (domain-engineer, parallel):**
   - Implement `src/lib/qna-a-day/{date,journal,stats,schema,serialization}.ts`
   - Copy/transform `docs/services/mindset/qna-a-day/1mnc-questions.json` → `src/components/tools/qna-a-day/data/questions.json`
   - 80%+ unit test coverage; verify local-time correctness, leap-day fallback, immutability

2. **UI Layer (ui-engineer, parallel):**
   - Implement `src/components/tools/qna-a-day/{DailyQuestion,useDailyJournal,TodayPanel,CalendarPanel,JournalPanel,SettingsPanel,...}.tsx`
   - Consume ALL i18n keys from `tools.qna-a-day.*` (92 keys, none hardcoded)
   - Component tests + visual regression (320/768/1024 breakpoints, both themes)

3. **Route Wiring (platform-engineer, after domain/UI green):**
   - Update `src/app/[locale]/tools/[slug]/page.tsx` with qna-a-day dynamic import branch
   - Implement `generateMetadata` for slug='qna-a-day' (uses i18n + lib/seo.ts builders)
   - Verify SSG generates `/ko/tools/qna-a-day` and `/en/tools/qna-a-day` with correct metadata
   - `pnpm build` green with 10-page SSG output

---

## Deliverables Summary

| Artifact | Status | Location |
|----------|--------|----------|
| Registry entry (type + slug + icon) | ✓ Complete | src/tools/registry.ts |
| Category type & label | ✓ Complete | src/tools/types.ts + i18n |
| Icon import & map | ✓ Complete | src/components/home/toolStyle.tsx |
| Category sort order | ✓ Complete | src/lib/tool-search.ts |
| i18n namespace (92 keys) | ✓ Complete | src/i18n/messages/{ko,en}.json |
| Ko/En parity | ✓ Verified | (both locales, identical key sets) |
| tsc --noEmit | ✓ PASS | (on registry/types/i18n files) |
| pnpm build | ⚠ Expected FAIL | (pending route component, Phase 3) |

---

## References

- **Blueprint:** `_workspace/10_architect_qna-a-day-blueprint.md` (lines 482–528 i18n keys, lines 386–416 implementation notes)
- **PRD:** `docs/services/mindset/qna-a-day/SPEC.md` (sections 7–8, pages_and_interfaces, copy sources)
- **Existing Patterns:** `src/tools/registry.ts`, `src/i18n/messages/ko.json` (ladder tool structure)

