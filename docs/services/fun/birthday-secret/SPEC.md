# 나의 탄생 비밀 / Birthday Secrets — Service SPEC

> Canonical (English) source consumed by AI coding agents. Korean translation lives in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync.
>
> Build spec for **나의 탄생 비밀 / Birthday Secrets** — enter a birthday (month·day) and instantly get a personalized "birth profile": your **birth flower (탄생화)**, **birthstone (탄생석)**, and **birth color (탄생색)** with their meanings, on a shareable card. Hub is a client-side SPA; each **month** has a static SEO spoke page (`/[locale]/tools/birthday-secret/<month>`). Content is dataset-driven (not markdown-per-entity).
>
> Codename / registry id / slug: `birthday-secret`. First tool of the user's **"나의 X" series** (→ 나의 MBTI #46, 나의 별자리 #50). Category `fun`, accent `rose`.
>
> Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md) · Design tokens: [`docs/DESIGN.md`](../../../DESIGN.md) · Reference hub+spoke SPEC: [`docs/services/dev/dev-people/SPEC.md`](../../dev/dev-people/SPEC.md)

```xml
<project_specification>
<project_name>나의 탄생 비밀 / Birthday Secrets (Jurepi tool, id birthday-secret)</project_name>

<overview>
A visitor enters their solar-calendar birthday (month + day). The tool instantly builds a "birth profile" card showing that day's **birth flower** (+ flower meaning 꽃말), that month's **birthstone** (+ stone meaning 보석말, color, hardness, origin), and that day's **birth color** (name + HEX + personality keyword). The card can be downloaded as a PNG and shared to SNS; a permalink (`?date=MM-DD`) reopens the exact profile. The hub also shows "오늘의 탄생" (today's flower/stone/color, auto-updating) and a Couple mode (two birthdays side by side + a combined color palette). Users who only know their lunar birthday get a new-window link to the lunar/solar converter tool.

This answers the highest-volume Korean searches — "N월 탄생석", "N월 탄생화", "탄생석 의미/색깔", "생일 꽃/색" — while being a fun, shareable "생일 프로필" generator rather than a dry article.

CRITICAL (client hub, SSG month spokes): The hub is 100% client-side SPA — daily results (365/366 days) are computed in the browser from a code-split catalog. There are NO per-day static pages (thin-content risk under static export). Instead, **12 monthly spoke pages** (`/[locale]/tools/birthday-secret/<month>`) are statically generated with rich, gate-outside SSR content (that month's stone + representative flowers/colors + long-form) so crawlers and AI overviews index authoritative "N월 탄생석" pages. No backend, no database. Only persistence is localStorage (recent lookups), never sent over the network.

CRITICAL (content sourcing honesty): The **birthstone** (12, monthly) is the authoritative, citable SEO core (established tradition). The daily **birth flower** (366) follows the traditional Korean "366일 탄생화(꽃말)" list. The daily **birth color** (366) is a **Jurepi-designed "생일색" spectrum** (deterministic hue rotation → HEX + curated name + personality keyword), presented plainly as a designed system, not a claimed tradition. Daily flower/color are framed "재미로 보는" (for fun) with a disclaimer and a source link to otanjoubi.jp; the monthly stone carries the authoritative weight.

CRITICAL (external links, no image hosting): Stone/flower photos are NOT hosted. Each stone/flower shows a "🔍 구글 이미지" link that opens Google Images search in a new tab (`rel="noopener"`). Extended birth attributes we do NOT author (탄생주/과일/조/목/공룡/별) are covered by a "더 많은 탄생 정보 →" link to `https://otanjoubi.jp/ko/select.php?month=MM&day=DD` (user's date auto-filled, new tab).
</overview>

<platform_integration>
  - Routes:
    - `/[locale]/tools/birthday-secret` — hub (SSG shell + SPA; registry id/slug "birthday-secret", status "live", category "fun", accent "rose", icon "Cake").
    - `/[locale]/tools/birthday-secret/<month>` — monthly spoke (SSG via generateStaticParams; 12 months × ko/en = 24 pages). Month slugs: january…december (ASCII).
  - Provided by platform (do NOT reimplement): app shell, ConsentBanner, AdSlot, Toast, design tokens, i18n runtime, Error Boundary, lib/seo.ts metadata/JSON-LD builders, ShareButtons (auto on tool routes), breadcrumb.
  - Consumes i18n namespace `tools.birthday-secret.*` (UI chrome + howTo/FAQ + disclaimer). MUST include top-level `tools.birthday-secret.title` = "나의 탄생 비밀" / "Birthday Secrets" and `.description` (consumed by registry/footer/home-card/search via searchable-tools).
  - Platform changes: ONE `ToolMeta` registry entry (category 'fun', existing — no new category); slug→component + generateMetadata branches in `[slug]/page.tsx` (hub); new spoke route `birthday-secret/[month]/page.tsx`; sitemap block (24 spoke URLs); searchable-spokes block (12 month spokes); toolStyle icon (`Cake`); llms.txt entry.
</platform_integration>

<content_model>
  Dataset-driven (NOT markdown-per-entity — 366 days × attrs would be thousands of files). Human-authored/compiled data files in `content/birthday-secret/`; a build-time generator validates + emits a single code-split catalog.

  <files>
    content/birthday-secret/
    ├── stones.json      # 12 monthly stones. Each: { month:1..12, ko:{name,meaning,color,hardness,origin}, en:{...}, googleQuery:{ko,en} }
    ├── flowers.json     # 366 daily flowers. Each: { key:"MM-DD", ko:{name,meaning}, en:{name,meaning}, googleQuery:{ko,en} }
    ├── colors.json      # 366 daily colors (Jurepi 생일색). Each: { key:"MM-DD", hex:"#RRGGBB", ko:{name,keyword}, en:{name,keyword} }
    └── months/
        ├── january.md   ├── january_en.md   … └── december_en.md   # 12 spoke long-form bodies (ko/en pairs), markdown
  </files>

  <colors_generation note="colors.json is generated, not hand-authored">
    `colors.json` is produced by a deterministic sub-step (part of the generator or a seed script): for day index d (0..365), hue = (d × 137.508°) mod 360 (golden-angle even spread), fixed pleasant S/L, → HEX. Name = "<hue-family> <shade>" from a curated hue→name map; keyword = curated from hue→keyword pool (both ko/en). Fully reproducible; no external data. Committed to the repo as data (so runtime just reads it).
  </colors_generation>

  <generator note="scripts/generate-birthday-secret.mjs, wired to prebuild/predev">
    - Parse stones.json / flowers.json / colors.json (JSON) + months/*.md pairs (gray-matter).
    - VALIDATE (fail build with clear message on violation):
      1. stones: all months 1..12 present exactly once; each has ko+en name/meaning; meaning ≥ 20 chars; hardness/color/origin non-empty.
      2. flowers: exactly 366 keys covering 01-01…12-31 including 02-29; each has ko+en name+meaning (meaning non-empty); no duplicate/missing day.
      3. colors: exactly 366 keys covering all days; each hex matches /^#[0-9a-fA-F]{6}$/; ko+en name+keyword non-empty.
      4. months: 12 ko/en pairs (january…december); each body non-thin (≥ N chars); missing pair FAILS build.
    - Emit `src/components/tools/birthday-secret/data/birthday-secret.generated.json`:
      `{ stones: MergedStone[12], flowers: Record<"MM-DD",MergedFlower>, colors: Record<"MM-DD",MergedColor>, months: MergedMonth[12] }`.
    - Deterministic. package.json: predev/prebuild run this generator (chain with existing generators).
  </generator>
</content_model>

<file_structure>
scripts/generate-birthday-secret.mjs
content/birthday-secret/{stones,flowers,colors}.json · months/*.md
src/lib/birthday-secret/                     # Pure domain (no React/Next), TDD
├── schema.ts        # zod: Stone/Flower/Color/Profile; MM-DD key; hex regex; MonthSlug enum
├── date.ts          # parseMonthDay, isValidMonthDay (leap-safe: 02-29 ok, 02-30 not), todayKey(now), monthSlug(1..12)↔name
├── catalog.ts       # STATELESS lookups over generated.json: flowerByDay(cat,key), colorByDay(cat,key), stoneByMonth(cat,m), monthBySlug
├── profile.ts       # buildProfile(cat, "MM-DD") -> { date, flower, stone, color } (day→month mapping for stone)
├── couple.ts        # buildCoupleView(profileA, profileB) -> two profiles + combined palette + one-line note
└── external-links.ts# googleImageUrl(query), otanjoubiUrl(m,d), converterUrl(locale) (points to lunar-converter tool)
src/components/tools/birthday-secret/
├── BirthdaySecret.tsx      # "use client" orchestrator; owns useBirthdaySecret()
├── useBirthdaySecret.ts    # hook: dynamic catalog import + URL(?date) hydration-safe read + localStorage recents + today
├── BirthdayInput.tsx       # month + day selectors (or single date field) + "음력만 아세요?" converter link
├── ProfileCard.tsx         # flower/stone/color blocks + meanings + google/otanjoubi links + PNG download + ShareButtons
├── TodayBirth.tsx          # "오늘의 탄생" (today's profile; new Date() in effect → #418 safe)
├── CoupleMode.tsx          # two BirthdayInput → two ProfileCards + ColorPalette combined
├── ColorPalette.tsx        # swatch(es) via inline style hex (not phantom tokens)
├── MonthGrid.tsx           # 12 crawlable month cards (anchors → spoke)
├── BirthdaySecretIntro.tsx / HowTo.tsx / Faq.tsx / StructuredData.tsx  # SEO (gate-outside SSR; Faq owns FAQPage; StructuredData owns SoftwareApplication)
├── MonthSpoke.tsx          # server component for spoke: SSR body + Article/DefinedTerm + BreadcrumbList JSON-LD + disclaimer
└── data/birthday-secret.generated.json
src/app/[locale]/tools/birthday-secret/[month]/page.tsx  # spoke route (generateStaticParams 12×2 + generateMetadata + MonthSpoke)
src/i18n/messages/{ko,en}.json  # tools.birthday-secret.* (chrome/howTo/faq/disclaimer; top-level title/description)
</file_structure>

<pages_and_interfaces>
  <hub>
    - Intro (H1 "나의 탄생 비밀" / eyebrow "재미 · FUN" / lead) — SSR, gate-outside.
    - BirthdayInput: month (1–12) + day (1–31, clamped to month) selects. On submit/change → ProfileCard. Below: "음력 생일만 아세요? → 음력/양력 변환기" (new tab, converterUrl).
    - ProfileCard: three blocks — 🌸 탄생화(name·꽃말·구글이미지 link), 💎 탄생석(name·보석말·color·hardness·origin·구글이미지 link), 🎨 탄생색(name·HEX swatch·keyword). Footer: "더 많은 탄생 정보 → otanjoubi"(new tab), PNG 다운로드, ShareButtons(url = hub + ?date=MM-DD). Disclaimer: "탄생화·탄생색은 재미로 즐겨보세요."
    - TodayBirth: compact "오늘의 탄생" card (auto today).
    - CoupleMode: toggle → two inputs → two cards + combined ColorPalette + one-line 궁합 note.
    - MonthGrid: 12 month cards (anchors to spokes; crawlable, visible).
    - HowTo + Faq (SSR, gate-outside).
  </hub>
  <spoke month>
    - Breadcrumb: Home > Tools > 나의 탄생 비밀 > N월.
    - H1 "N월 탄생석·탄생화·탄생색" (localized). SSR long-form body (that month's stone deep-dive: 보석말·색·경도·유래; representative flowers of the month; the month's color theme).
    - "N월 대표 탄생화" small list (a few days). Stone google-image link. Disclaimer.
    - ShareButtons (spoke absolute url). Related: prev/next month links.
    - JSON-LD: Article (or DefinedTerm) + BreadcrumbList (url == canonical).
  </spoke>
  <keyboard_a11y>≥44px targets; focus-visible rings; labeled selects; reduced-motion respected; 320px no overflow; en no Korean leakage.</keyboard_a11y>
</pages_and_interfaces>

<core_functionality>
  <profile>buildProfile("MM-DD"): flower = flowers["MM-DD"]; color = colors["MM-DD"]; stone = stones[month of MM]. Feb-29 valid.</profile>
  <permalink>?date=MM-DD serialized/parsed; hydration-safe (read in mount effect, not initial state → #418 safe). Invalid/absent → no preselection.</permalink>
  <today>todayKey(new Date()) in effect; SSR renders neutral placeholder, effect fills → no hydration mismatch.</today>
  <recents>localStorage recent lookups (≤ 10), immutable ops, prune invalid; private mode → in-memory.</recents>
  <download>Card → canvas → PNG (reuse ladder/lotto result-image pattern). Button enabled by reactive state, not ref.</download>
  <external>googleImageUrl(q) = https://www.google.com/search?tbm=isch&q=<enc>; otanjoubiUrl(m,d) = https://otanjoubi.jp/ko/select.php?month=M&day=D; converterUrl(locale) = /<locale>/tools/lunar-converter. All target=_blank rel=noopener.</external>
  <i18n>All chrome from tools.birthday-secret.*; content (flower/stone/color names+meanings) from generated.json per locale.</i18n>
</core_functionality>

<seo_geo>
  - Hub: SoftwareApplication + FAQPage JSON-LD (Faq single-owner), Intro/HowTo/FAQ gate-outside SSR, unique meta (title/description/canonical/hreflang/OG via seo.ts).
  - Spokes (12×2): Article/DefinedTerm + BreadcrumbList JSON-LD (url == canonical via absoluteEntityUrl), SSR body gate-outside, hreflang. These are the authoritative "N월 탄생석" pages.
  - sitemap: hub 1 + 24 spoke URLs (hreflang alternates). searchable-spokes: 12 month spokes searchable via header. llms.txt: collection entry.
  - AdSense-safe: no thin per-day pages; monthly spokes are rich long-form; daily fun is client-computed.
</seo_geo>

<technology_stack>
  Inherited: Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN tokens, next-intl (ko/en).
  Module: gray-matter (devDep, month bodies), zod (schema), markdown-to-jsx via shared <Markdown> (spoke bodies). Native canvas→PNG. No new runtime deps.
</technology_stack>

<mascot>New tool requires `public/characters/birthday-secret.webp` (else live 404). Produced from a 덕테이프-optimized prompt (delivered to user); stone/flower photos are Google-image links (no hosting).</mascot>

<success_criteria>
  - Enter birthday → correct flower/stone/color profile; Feb-29 works; day→month stone mapping correct.
  - ?date=MM-DD permalink restores profile (hydration-safe, no #418). Today auto. Couple mode. PNG download fires.
  - 12 month spokes SSG'd; SSR body + JSON-LD (url==canonical) in prerendered HTML; sitemap 25 birthday-secret URLs; searchable via header.
  - Generator fails build on: missing day (≠366), bad hex, ko/en gap, missing month pair.
  - Domain pure ≥90% (profile/catalog/date/couple/external-links); overall ≥80% not regressed.
  - en locale: no Korean leakage (except named refs); 320px no overflow; console 0; focus-visible; real design tokens (no phantom); hex inline styles only for color swatches.
</success_criteria>
</project_specification>
```
