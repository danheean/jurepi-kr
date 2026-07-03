# Developer People Dictionary — Notable Figures in Software History — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **개발 인물 사전 / Developer People Dictionary** — a curated biographical directory of influential software engineers, computer scientists, and technology pioneers (Dennis Ritchie, Grace Hopper, Ada Lovelace, Linus Torvalds, Guido van Rossum, Anders Hejlsberg, Margaret Hamilton, John Carmack, etc.), stored as markdown pairs and auto-compiled into a searchable, interactive directory with individual person profiles. Content is managed as markdown file pairs (`<person>.md` + `<person>_en.md`), and at build time a generator reads the folder, validates, and emits a static catalog. The tool mounts as a client-side SPA offering search by name/field/achievement, field/era tabs, favorites/recents, and **per-person static detail pages** (`/[locale]/tools/dev-people/<person>`).
>
> Internal service codename: `dev-people`. Registry id: `dev-people`. Public URL slug: `/[locale]/tools/dev-people` (hub) and `/[locale]/tools/dev-people/<person>` (spoke pages).
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same content pattern): [`docs/services/dev/bookmarks/SPEC.md`](./bookmarks/SPEC.md)
> - Reference sibling tool SPEC (hub+spoke architecture): [`docs/services/text/new-word/SPEC.md`](../../text/new-word/SPEC.md)

```xml
<project_specification>

<project_name>Developer People Dictionary — Curated Bios of Influential Software Engineers & Tech Pioneers (Jurepi tool, codename dev-people, registry id dev-people)</project_name>

<overview>
Developer People Dictionary brings together the stories of influential figures who shaped software and computing. A visitor searches for a person ("Grace Hopper", "Guido van Rossum", "women in CS") or browses by field (language-creator, os, game, ai, web) and era (1940–1990, 1990–2000, 2000–present), discovers key figures, and opens a person's profile to read biography, achievements, key works/projects, era context, and related figures. Each person is **editor-authored markdown** — not auto-scraped, not user-generated — with transparent sourcing and scholarly intent. This solves "Who pioneered X?" and "What era did Y work in?"

The tool's content model is fundamental: people are NOT code — they are **markdown files**. Create pairs in the content folder (`<person>.md` for Korean + `<person>_en.md` for English), with structured frontmatter (name, roles/knownFor, birthYear, deathYear, nationality, era, fields, related, links), and at **build time** a generator scans the folder, parses the frontmatter, validates it, and bakes it into a static catalog (dev-people.generated.json). The tool then dynamically imports that catalog to power the hub (search, filter, list, favorites/recents) and **also emits individual static person pages** at `/[locale]/tools/dev-people/<person>` with per-person metadata, SSR biography, Person JSON-LD, and BreadcrumbList. This means "drop a file in the folder and it appears in hub + gets a unique static page" is REAL — all without a backend or database, via static generation.

CRITICAL (client-only hub, SSG spoke pages): The hub is 100% client-side SPA. The spoke pages are statically generated (SSG) during build with mounted-gate-outside SSR content (biography, achievements, fields) so search engines and AI crawlers index rich person profiles without JavaScript. No backend, no database, no runtime file system access. The only first-party persistence is `localStorage` (hub favorites + recents), and nothing is ever sent over the network.

CRITICAL (content model, invariants): every person MUST have a Korean file and an English file as a matching pair (a missing counterpart file FAILS the build — same rule as sibling collections; no warning-and-exclude). Each file must carry a non-empty name (localized), knownFor (string, ≥ 50 chars describing key achievements), and birthYear. The person's fields, era, nationality, and related-figure references are **canonical in the Korean file**; the English file inherits these if absent. The build generator validates (1) pair integrity (2) required fields per locale (3) slug uniqueness (4) related references point to real slugs (5) birth/death year sanity, and **fails the build with a clear message** if ANY rule is broken (no silent omission).

CRITICAL (hub SPA + spoke SSG, usability-first): The hub is a client-side Single-Page Application (SPA) mounted on the platform's SSG shell. ALL interaction — field filtering, search, favoriting, opening detail — happens via local React state with NO route navigation within the hub and NO full page reload. Usability comes first: the person list is visible at a glance, search is one keystroke away ("/"), and every person is reachable in under a second. Spoke pages (individual person profiles) are statically generated for SEO/indexing; each spoke is its own SSG route with canonical metadata, hreflang, breadcrumb, and Person JSON-LD ready for search engines and AI overviews.

CRITICAL (hub usability vs. spoke SEO discovery): The hub serves exploratory/power-user needs (rapid search, field filter, recents tab). The spoke pages serve SEO/GEO discovery (Person schema for AI answers, `hreflang` alternates for both locales, individual canonical URL per person, rich biography text for indexing). Hub cards are clickable anchors to spoke pages; hub search/filter is pure client-side. Spoke pages include breadcrumb back to hub and related-person links (both within tool and back to spoke).
</overview>

<platform_integration>
  - Routes: 
    - `/[locale]/tools/dev-people` — hub (SSG shell housing SPA; registry slug "dev-people", id "dev-people", status "coming_soon" until implementation ships (flip to "live" at launch), accent "sky", category "dev").
    - `/[locale]/tools/dev-people/<person>` — individual person spoke page (SSG via generateStaticParams, unique metadata per person).
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper, ShareButtons (auto-included on tool routes).
  - Consumes: i18n namespace `tools.dev-people.*` (UI chrome strings: fields, eras, search, how-to, FAQ — NOT person content; that comes from markdown in dev-people.generated.json).
  - Platform dependency (category note): this tool lives in the existing `'dev'` category (개발, accent sky) — same as bookmarks. The only platform change is adding ONE `ToolMeta` registry entry, slug→component branches in the tool route (hub + spoke), and generateMetadata branches (hub + spoke, spoke uses Person + BreadcrumbList JSON-LD). No new category needed.
  - **Sitemap enhancement**: `app/sitemap.ts` must import dev-people.generated.json and iterate spoke persons to add individual person URLs (locale alternates) to the site map. This is CRITICAL for GEO/bot discovery. See scope_boundaries "in_scope" and key_implementation_notes "sitemap" for detail.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed person catalog (pairs: `<person>.md` + `<person>_en.md`) in `content/dev-people/`.
    - Build-time generator: folder scan → frontmatter parse → validation → code-split static catalog (dev-people.generated.json). Wired to `prebuild`/`predev`.
    - **Spoke page generation**: Platform route `/[locale]/tools/dev-people/<person>` uses generateStaticParams (derived from dev-people.generated.json) to SSG per-person pages (≥8 people × ko/en = 16+ pages). Each spoke page: high-quality biography SSR text (biography, achievements, key works), Person JSON-LD (schema.org Person: name/description/birthDate/deathDate/nationality/knowsAbout/sameAs), BreadcrumbList, breadcrumb nav back to hub, related-person links, permalink + canonical/hreflang.
    - Eight seed people (ko/en pairs minimum) — selected from software history to illustrate diversity of era, field, nationality, gender. Example: Ada Lovelace (founder), Dennis Ritchie (C/Unix), Grace Hopper (COBOL/compiler), Guido van Rossum (Python), Linus Torvalds (Linux), Margaret Hamilton (Apollo), Anders Hejlsberg (C#/TypeScript), John Carmack (games/graphics). Expand as needed (content-only).
    - **Person markdown templates**: annotated markdown templates (`content/dev-people/_TEMPLATE.md`, `content/dev-people/_TEMPLATE_en.md`) and authoring README to guide curator in writing bios and validating frontmatter.
    - Hub UI: search by name/aliases, field tabs (language-creator, os, compiler, web, ai, game, graphics, science, other), era tabs (1940–1960, 1960–1980, 1980–2000, 2000–present), favorites/recents (localStorage). Hub card: person name (headline), brief knownFor, field+era badges, photo/avatar (optional), star favorite. Hub list respects search/filter state and renders as cards or a grid.
    - Search: person name, aliases, knownFor across BOTH locales, real-time filter (debounced). Case and diacritic insensitive.
    - Spoke pages: person name (H1), photo (if available), birth/death years + nationality, field+era badges, **biography/knownFor text (SSR outside mounted gate)**, key works/projects (if any), era context, related-person chips (clickable navigate within tool or link to related spoke). Full biography is 2–4 paragraphs minimum (thin-content guard: substantial biographical text, not stub). Breadcrumb: Home > Tools > Dev-People Hub > Person Name. Social share buttons auto-included (platform template).
    - Favorites (pinned people) + recent views — localStorage persistence, auto-prune of unknown slugs.
    - Full keyboard support: "/" search focus, arrow keys hub list navigation, Enter to open person detail, Esc to clear/close.
    - Tool-specific SEO long-form (dev-people intro, "Who shaped software?" FAQ) + **Person JSON-LD (schema.org Person: name, description, birthDate, deathDate, nationality, jobTitle/knowsAbout, sameAs=[Wikipedia, GitHub if applicable])** per spoke, **BreadcrumbList** per spoke, localized ko/en.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - User browser-based person add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database. No in-app editing at launch.
    - Login / accounts / cross-device sync.
    - User submissions of people or bios (NO crowdsourced / social features).
    - Auto-biography scraping from Wikipedia or other sources. Content is author-curated markdown only.
    - Rich HTML/script in markdown body. Bios are structured fields (plain text / limited inline emphasis), rendered safely.
    - Photo/avatar upload UI. Photos are linked via URL (optional `photo:` frontmatter field, http(s) only, rel=noopener). Build-time OG cache (if applicable) is platform-level concern.
  </out_of_scope>
  <future_considerations>
    - Photo/avatar gallery per person with alt-text (Phase 2).
    - "Timeline" visualization of multiple people across eras (Phase 2).
    - Related-field clustering ("languages created by X person") — Phase 2.
    - Achievements/awards taxonomy per person — Phase 2.
    - Podcast/video links curated per person — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>People live as markdown pairs in `content/dev-people/`. File system access is build-time only (generator script). Runtime has NO file system access. Spoke pages use Next.js generateStaticParams to SSG per-person routes.</content_source>
    <frontmatter_parsing>gray-matter v4.x to parse YAML frontmatter (generator script only, devDependency). Biography/achievements are structured frontmatter fields (knownFor, birthYear, deathYear, etc.) plus optional body markdown (future phase), rendered as plain text/basic emphasis.</frontmatter_parsing>
    <validation>zod v3.x (already used in repo) for (1) individual file frontmatter schema (2) merged person-record invariants. URL validation (valid http(s) for links/photo, no malformed refs). Schemas are pure and reusable in both generator and runtime loader.</validation>
    <catalog>Generated artifact is a code-split data module (src/components/tools/dev-people/data/dev-people.generated.json), dynamically imported only on this tool's hub route. Spoke pages use the same catalog to look up person metadata at build time (generateStaticParams + getStaticProps pattern).</catalog>
    <spoke_generation>Spoke pages are generated via Next.js `generateStaticParams` iterating dev-people.generated.json slugs (both locales). Each spoke route page file (`src/app/[locale]/tools/dev-people/[person]/page.tsx`) accepts `locale` + `person` params and uses lib/seo.ts helpers (buildToolEntityMetadata, personJsonLd, breadcrumbListJsonLd) to construct per-person metadata, canonical/hreflang, and JSON-LD. Biography/achievements text is SSR'd OUTSIDE the mounted gate so static HTML includes it for crawlers.</spoke_generation>
    <animation>Native CSS transitions only (card hover lift, spoke fade-in). No animation library.</animation>
  </module_specific>
  <libraries>
    <gray-matter>gray-matter v4.0.3 — devDependency, frontmatter parsing in generator script.</gray-matter>
    <zod>zod v3.x — already in repo; reused for frontmatter/catalog validation.</zod>
  </libraries>
</technology_stack>

<content_authoring_model>
  <directory>
    content/dev-people/
    ├── _TEMPLATE.md            # New-person Korean template (annotated; generator excludes "_" prefix)
    ├── _TEMPLATE_en.md         # New-person English template
    ├── README.md               # Authoring guide (naming, fields, era/nationality list, how to write bios)
    └── people/
        ├── ada-lovelace.md          # Korean canonical (structural metadata canonical)
        ├── ada-lovelace_en.md       # English
        ├── grace-hopper.md
        ├── grace-hopper_en.md
        ├── dennis-ritchie.md
        ├── dennis-ritchie_en.md
        └── …
  </directory>
  <pairing note="pair rule">
    - File name base (minus `_en` suffix) is the **pair key**. `ada-lovelace.md` (ko) ↔ `ada-lovelace_en.md` (en).
    - Files starting with `_` are ignored by the generator (_TEMPLATE, etc.).
    - Missing pair (English-only or Korean-only) → build warning + person excluded (canonical-pair policy is CRITICAL). ASCII file names strongly preferred (URL/slug stability); validate slug is ASCII-safe.
  </pairing>
  <slug note="identifier">
    - `slug` = value from Korean file frontmatter `slug` (if present), else base file name (must be ASCII, URL-safe). Used by related, favorites, recents, spoke URL. Must be unique in the catalog (test/generator validated).
  </slug>
  <shared_metadata note="canonical rule">
    - Structural metadata (`fields`, `era`, `nationality`, `related`, `links`, `photoUrl`) is **canonical in the Korean file**. English file inherits if omitted, must match if present (validation enforces).
    - Locale-specific content (`name`, `aliases`, `knownFor`, `biography`) is independent per file. Name is localized (한국식 표기 vs English name order). knownFor is a curated achievement summary per locale (may differ slightly in phrasing/emphasis).
  </shared_metadata>
  <template_ko>
    ```markdown
    ---
    # ── required ──
    name: 그레이스 호퍼          # Localized display name
    slug: grace-hopper          # ASCII stable identifier (Korean file canonical). Related/favorites/recents/URL reference this.
    knownFor: |                 # 50+ chars, core achievements/contribution
      COBOL 프로그래밍 언어 발명, 컴파일러 개념 선구자,
      여성 컴퓨터 과학자로 해군에서 프로그래밍 체계 구축.
    birthYear: 1906
    fields:                     # Array of field tags (e.g. language-creator, compiler, science)
      - language-creator
      - compiler
      - science
    era: 1960-1980              # Era tag (1940-1960 | 1960-1980 | 1980-2000 | 2000-present)
    nationality: US             # ISO country code or friendly name
    deathYear: 1992             # Optional
    # ── optional ──
    biography: |                # 2–4 paragraphs of detailed bio (plain text, safe for SSR)
      그레이스 블레디 머리는 ...
      (substantial biographical narrative)
    aliases:                    # Search aliases (optional)
      - Grace Murray Hopper
      - "Admiral Hopper"
    related:                    # Related person slugs (optional)
      - alan-turing
      - ada-lovelace
    links:                      # External references (optional), validated http(s)
      - label: "Wikipedia"
        url: "https://en.wikipedia.org/wiki/Grace_Hopper"
      - label: "IEEE Computer Society"
        url: "https://www.computer.org/…"
    photoUrl: "https://…/grace-hopper.jpg"  # Optional, verified http(s) at build time
    ---
    ```
  </template_ko>
  <template_en>
    ```markdown
    ---
    # ── required ──
    name: Grace Hopper
    knownFor: |
      Inventor of COBOL programming language, pioneer of compiler concepts,
      groundbreaking female computer scientist who established programming systems in the US Navy.
    birthYear: 1906
    # ── optional (structural meta inherits from Korean file if omitted) ──
    biography: |
      Grace Brewster Murray Hopper was born on December 9, 1906, in New York City.
      (English biographical narrative, same structure as Korean version)
    aliases:
      - Grace Murray Hopper
      - Admiral Hopper
    deathYear: 1992
    ---
    ```
  </template_en>
</content_authoring_model>

<file_structure>
scripts/
└── generate-dev-people.mjs               # Build time: scan content/dev-people/people/* → parse → validate → emit dev-people.generated.json. Wired to prebuild/predev.
content/dev-people/                        # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md          # Templates (excluded by generator)
├── README.md                              # Authoring guide
└── people/*.md  *_en.md                   # Person pairs
src/
├── lib/dev-people/                        # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                          # zod: PersonFileFront(ko/en), MergedPerson, StoreSchema + STORE_VERSION; safeparse helpers
│   ├── merge.ts                           # mergePair(koFront, enFront): apply canonical rule → MergedPerson; validatePair(warn/error collect)
│   ├── slug.ts                            # slugify(name), resolveSlug(front, filename)
│   ├── catalog.ts                         # Typed access: allPeople, byId, byField, byEra, peoples(); related referential integrity check
│   ├── search.ts                          # filterPeople(people, query, locale): name+aliases+knownFor, both locales; normalize (case/diacritics)
│   └── favorites.ts                       # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(slugs, catalog)
├── components/tools/dev-people/
│   ├── DevPeople.tsx                      # Orchestrator (Client Component) — field/era/query/selected state + useDevPeopleCatalog() owner; hub SPA only
│   ├── useDevPeopleCatalog.ts             # Hook: dynamic catalog import + localStorage favorites/recents + derived filter/select
│   ├── FieldTabs.tsx                      # language-creator / os / compiler / web / ai / game / graphics / science / other (tablist)
│   ├── EraTabs.tsx                        # 1940–1960 / 1960–1980 / 1980–2000 / 2000–present (tablist)
│   ├── PeopleSearch.tsx                   # Search input ("/" focus, clear, result count, aria)
│   ├── PeopleList.tsx                     # Responsive card list/grid; roving tabindex keyboard nav
│   ├── PersonCard.tsx                     # One-person card: name (headline), knownFor, field+era badges, photo (opt), star favorite, link to spoke
│   ├── DevPeopleIntro.tsx                 # H1 + lead (SEO; server-render where possible)
│   ├── DevPeopleHowTo.tsx                 # "Who shaped software history?" / long-form (SEO)
│   ├── DevPeopleFaq.tsx                   # Q&A + FAQPage JSON-LD (hub only)
│   ├── data/
│   │   └── dev-people.generated.json      # Generated artifact — [MergedPerson...]
│   └── (Spoke components live in route handler; see key_implementation_notes)
└── i18n/messages/{ko,en}.json             # tools.dev-people.* UI chrome (fields, eras, search, toasts, how-to, FAQ) — NOT person content
└── app/[locale]/tools/dev-people/
    ├── page.tsx                           # Hub route (wraps DevPeople SPA)
    └── [person]/page.tsx                  # Spoke route (generateStaticParams + SSG person page with bio, JSON-LD, breadcrumb, related chips)
</file_structure>

<core_data_entities>
  <person_file_front note="individual markdown file frontmatter (parse unit)">
    - name: string (required, non-empty) — display person name (that locale)
    - knownFor: string (required, ≥ 50 chars, plain text) — summary of key achievements/contributions
    - birthYear: number (required, ≥ 1800, ≤ current year) — birth year
    - deathYear?: number (optional, > birthYear if present, ≤ current year)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - fields?: string[] — field tags (canonical in Korean file; examples: language-creator, os, compiler, web, ai, game, graphics, science, other)
    - era?: string — era tag (canonical in Korean file; examples: 1940-1960, 1960-1980, 1980-2000, 2000-present)
    - nationality?: string — country (canonical in Korean file; ISO code or friendly name)
    - biography?: string (plain text, 2–4 paragraphs recommended for spoke pages)
    - aliases?: string[] (search aliases)
    - related?: string[] — other person slugs
    - links?: array of { label, url } — external references (http(s) validated)
    - photoUrl?: string (optional, http(s) only, rel=noopener)
    INVARIANT: name/knownFor non-empty, birthYear present, knownFor ≥ 50 chars. zod parse failure → collect as error (build failure candidate).
  </person_file_front>
  <merged_person note="ko+en merge result; catalog record; dev-people.generated.json item">
    - slug: string — unique identifier in catalog (unique; favorites/recents/related/spoke-URL reference)
    - fields: string[] — Korean file canonical ([] if absent)
    - era: string — era tag, Korean file canonical
    - nationality: string — country, Korean file canonical
    - related: string[] — canonical; only real slugs in catalog (build validates, missing → error)
    - links: array of { label, url } — canonical; URLs validated http(s)
    - photoUrl?: string — canonical; validated http(s) at build time
    - ko: { name, knownFor, biography?, aliases?, … }
    - en: { name, knownFor, biography?, aliases?, … }
    - birthYear, deathYear — in root (not per-locale)
    INVARIANT — PAIR/FIELDS/UNIQUENESS/REFERENCE: every record has both ko+en; each locale's name/knownFor filled; birthYear present; slug unique; related/links point to real targets; photo/links validated. Violation → generator build failure (not silent omission, explicit error + file/field report).
  </merged_person>
  <field note="grouping by domain; localized label from i18n">
    - id: string (language-creator, os, compiler, web, ai, game, graphics, science, other). Label: tools.dev-people.fields.<id> (ko/en i18n).
  </field>
  <era note="grouping by historical period; localized label from i18n">
    - id: string (1940-1960, 1960-1980, 1980-2000, 2000-present). Label: tools.dev-people.eras.<id> (ko/en i18n).
  </era>
  <dev_people_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — person slugs, insertion order
    - recents: string[] — person slugs, most-recent-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastQuery?: string; lastField?: string; lastEra?: string; createdAt: number }
    localStorage key: `jurepi-dev-people`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown slugs pruned on load.
  </dev_people_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; BIO_MIN_LENGTH = 50 (knownFor); BIRTH_YEAR_MIN = 1800.
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/dev-people" page="DevPeople hub (platform tool route, branches slug→component)" />
    <route path="/:locale/tools/dev-people/:person" page="PersonSpoke (generateStaticParams + SSG)" />
  </public_routes>
  <note>Hub route is single, SPA-based. Spoke routes are generated via generateStaticParams iterating dev-people.generated.json slugs (≥8 people × ko/en = 16+ routes). locale ∈ {ko, en}. Platform generateStaticParams (hub) + tool-specific generateStaticParams (spoke) iterate registry + catalog respectively to SSG.</note>
</route_definitions>

<component_hierarchy>
  <!-- Hub SPA -->
  <dev_people>                      <!-- "use client"; owns field + era + query + selectedSlug + useDevPeopleCatalog() state -->
    <dev_people_intro />            <!-- H1 + lead (SSR where possible) -->
    <people_hub_layout>             <!-- Selector (list) + optional detail (future phase within hub; for now, cards link to spoke). If an in-hub detail panel is added later, it MUST wire <ShareButtons url={absoluteEntityUrl(locale,'dev-people',slug)} title={person name}/> (harness convention: hub panels share the entity spoke URL, not the hub URL) -->
      <people_main>                 <!-- Left/top column -->
        <people_search />           <!-- "/" focus, clear, result count -->
        <field_tabs />              <!-- language-creator / os / … (virtual tabs "all/favorites/recent" if applicable) -->
        <era_tabs />                <!-- 1940–1960 / 1960–1980 / … (optional tier filter or combined view) -->
        <people_list>               <!-- Roving tabindex cards -->
          <person_card />           <!-- × N: name, knownFor, badges, photo, star, link to spoke -->
          <empty_state />           <!-- No results / empty favorites -->
        </people_list>
      </people_main>
    </people_hub_layout>
    <dev_people_how_to />           <!-- SEO long-form -->
    <dev_people_faq />              <!-- FAQPage JSON-LD -->
  </dev_people>

  <!-- Spoke SSG Page (separate route component) -->
  <person_spoke>                    <!-- Server Component at /[locale]/tools/dev-people/[person] -->
    <breadcrumb />                  <!-- Home > Tools > Dev-People > Person Name -->
    <person_header>                 <!-- Name, birth/death, nationality, fields/era badges, photo -->
    </person_header>
    <person_biography />            <!-- SSR'd biography text (outside mounted gate for crawlers) -->
    <person_achievements />         <!-- knownFor expansion, key works/projects -->
    <related_people_section />      <!-- Related-person links (clickable or hub carousel) -->
    <share_buttons />               <!-- SNS share buttons (auto-included by platform route template) -->
  </person_spoke>

  <note>Hub: SPA within tool (search/filter = local state switch, NOT route navigation; cards are anchors to spoke). Spoke: static page per person with server components, canonical metadata, and JSON-LD ready for crawlers.</note>
</component_hierarchy>

<pages_and_interfaces>
  <!-- Hub UI -->
  <dev_people_intro>
    - Eyebrow: "개발 도구" / "DEV TOOL" — 12px/700/0.6px, var(--brand-ink).
    - H1: "개발 인물 사전" / "Developer People Dictionary" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg: "소프트웨어를 만든 위대한 인물들의 이야기를 찾아보세요. Dennis Ritchie부터 Margaret Hamilton까지, 각 분야의 선구자들을 알아보세요." / English equivalent.
  </dev_people_intro>

  <people_search>
    - DESIGN text-input style, main column full width, leading Search icon (20px), placeholder "인물 이름·분야·기간으로 검색…" / "Search by name, field, era…".
    - Focus on "/" keypress. Trailing clear (×) when non-empty.
    - Live filter, debounced 120ms. Result count "결과 N명" caption.
    - aria: role="searchbox", aria-controls the list.
  </people_search>

  <field_tabs>
    - Horizontal pill row. Order: "전체"(all) → language-creator → os → compiler → web → ai → game → graphics → science → other → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary.
    - role="tablist"; ArrowLeft/Right move; aria-selected on active. Narrow screens scroll horizontally.
  </field_tabs>

  <era_tabs>
    - Secondary filter row (or combined with field tabs depending on space). Order: "전체"(all) → "1940–1960" → "1960–1980" → "1980–2000" → "2000–현재"(2000-present).
    - Same style as field tabs. Compose with field: `filterPeople(allPeople, query, field, era)`.
  </era_tabs>

  <people_list>
    - Responsive grid: 1-column <768px; 2-column 768–1023px; 3-column ≥1024px (tune as design requires). Full container width.
    - Each card (person_card):
      - Top: person name (headline 18–20px var(--text)/700) + birth/death years (caption var(--text-secondary)).
      - Top-right: field badge + era badge (small pills, neutral tint).
      - Body: knownFor clamp-2-lines (var(--text-secondary) 14–15px).
      - Bottom: photo placeholder or thumbnail (optional, if photoUrl present; aspect 4:5, lazy load).
      - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px, shadow --shadow-card. Cards are `<a href={spokeUrl}>` anchors (progressive enhancement to spoke pages).
      - Top-right corner: star button (favorite toggle, aria-pressed).
    - States:
      - hover (pointer): translateY(-2px) + var(--shadow-card-hover); cursor pointer.
      - focus (keyboard): 2px var(--focus-ring) ring offset 2px.
      - selected (if future hub-detail phase): 2px var(--accent-sky) ring.
    - Roving tabindex: active card tabbable; ArrowUp/Down/Left/Right move; Home/End first/last; Enter/Space open spoke (navigate or trigger card href); "f" toggle favorite.
    - aria: list role="list"(or grid); card aria-label = "{name} ({birthYear}-{deathYear})"; star is a real stateful button.
    - empty_state: no results → "'{query}'에 해당하는 인물이 없어요" + clear; empty favorites → "별을 눌러 자주 보는 인물을 저장하세요"; empty recent → "최근 본 인물이 여기에 모여요".
  </people_list>

  <!-- Spoke Page UI -->
  <person_spoke_header>
    - Breadcrumb navigation (platform component).
    - Large person name (H1, 32–36px var(--text)/700).
    - Birth/death years + nationality (24px var(--text-secondary)).
    - Field badges + era badge (small pills, field-tinted).
    - Photo (if available, aspect 3:4 or 1:1, ~300–400px, lazy-load, alt-text for a11y).
  </person_spoke_header>

  <person_biography>
    - "About" section (heading "소개" / "About", eyebrow 12px/700 var(--brand-ink)).
    - Biography text: 2–4 paragraphs (body 16px var(--text-secondary) line-height 1.6). SSR'd OUTSIDE mounted gate so static HTML includes it.
    - knownFor summary (highlighted or separate callout).
    - Key achievements or projects (if detailed, render as bullet list or prose).
  </person_biography>

  <person_achievements>
    - "Key Works" / "Contributions" section (if applicable).
    - Examples: "Inventor of C language" / "Author of 'Structure and Interpretation of Computer Programs'" / "Designed Unix philosophy".
    - Render as prose or structured list per curator preference.
  </person_achievements>

  <related_people_section>
    - "Related Figures" section (if related slugs exist).
    - Related-person chips or link list: each person's name → click to open their spoke page.
    - Dangling refs (missing slugs) filtered at build time.
  </related_people_section>

  <keyboard_shortcuts_reference>
    - (Hub)
      - "/" → search input focus (when not typing).
      - Arrow keys → field/era/person card focus move.
      - Enter / Space → open focused person spoke (navigate href).
      - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
      - Esc → clear search or deselect tab filter.
    - (Spoke) — standard web navigation (back button, related links).
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-dev-people.mjs">
    - Scan content/dev-people/people/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file → zod PersonFileFront validate.
    - mergePair: apply canonical rule (ko fields/era/nationality canonical + en inherit if absent; biography/name PER-LOCALE). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, locale required fields (name/knownFor/birthYear), slug uniqueness, related references exist, year sanity (birth ≤ death), photoUrl + links validated (http(s)).
    - Sort (era → field → birthYear, stable), emit dev-people.generated.json. Deterministic.
    - package.json wire: "predev": "node scripts/generate-dev-people.mjs", "prebuild": "node scripts/generate-dev-people.mjs".
  </generation>
  <spoke_generation note="build time, platform route + tool-specific generateStaticParams">
    - Platform hub route (`/[locale]/tools/dev-people`) uses registry to SSG shell.
    - Tool-specific route handler (`/[locale]/tools/dev-people/[person]`) exports `generateStaticParams()` iterating dev-people.generated.json to SSG per-person routes (locale × slug Cartesian product).
    - Each spoke route: dynamic `[person]` param → lookup person in catalog → render biography SSR (outside mounted gate) + Person JSON-LD + BreadcrumbList + canonical/hreflang.
    - Spoke route must import and use lib/seo.ts helpers: `buildToolEntityMetadata(locale, person)`, `personJsonLd(person, locale)`, `breadcrumbListJsonLd([Home, Tools, DevPeople, PersonName])`.
  </spoke_generation>
  <catalog_access note="runtime pure layer">
    - allPeople(): MergedPerson[] (generation order). byId(slug), byField(field), byEra(era). peoples(): live person slugs in catalog.
    - Tests assert catalog uniqueness, related integrity, locale completeness.
  </catalog_access>
  <search>
    - filterPeople(people, query, field?, era?, locale?): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.name, en.name, aliases(both), ko.knownFor, en.knownFor, fields, era. Stable order.
    - Compose with tabs: list = filterPeople(all, query, field, era) or filterPeople(favorites subset, query, field, era), etc.
  </search>
  <favorites_and_recents note="immutable — return new arrays/store">
    - toggleFavorite(list, slug): add if absent, remove if present (preserve order).
    - pushRecent(list, slug, max=20): move/insert to front, de-dupe, truncate.
    - pruneUnknown(slugs, catalog): drop slugs not in current catalog (run on load).
    - Recent push: when person card is clicked (navigate to spoke) or from spoke's back-to-hub action. Search/hover don't trigger.
  </favorites_and_recents>
  <persistence_adapter useDevPeopleCatalog>
    - Mount: dynamic catalog import; read `jurepi-dev-people` → zod → pruneUnknown → state; fail → start fresh (no throw). Absent localStorage → in-memory for session (fully usable, non-persistent).
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory.
    - Expose: filtered list, favorites, recents, lastField, lastEra, lastQuery.
  </persistence_adapter>
  <i18n>All UI chrome from tools.dev-people.* (ko/en): fields, eras, search, toasts, empty states, how-to, FAQ, breadcrumb. Person name/knownFor/biography come from markdown (dev-people.generated.json), NOT i18n messages.</i18n>
  <sitemap_integration note="CRITICAL: platform app/sitemap.ts must be updated">
    - `app/sitemap.ts` must import dev-people.generated.json (via getDevPeopleCatalog utility or direct require).
    - Iterate allPeople + locales to append person spoke URLs:
      ```typescript
      const peopleUrls = allPeople.flatMap(person =>
        LOCALES.map(locale => ({
          url: `${siteUrl}/${locale}/tools/dev-people/${person.slug}`,
          lastModified: new Date(),
          alternates: {
            languages: {
              ko: `${siteUrl}/ko/tools/dev-people/${person.slug}`,
              en: `${siteUrl}/en/tools/dev-people/${person.slug}`,
            },
          },
        }))
      );
      ```
    - Add peopleUrls to main sitemap array (do NOT duplicate hub route).
    - **Test**: `out/sitemap.xml` must contain ≥8×2=16 person URLs + hub URL (17 total dev-people URLs).
    - Verify XML validity + urlset count via `xmllint out/sitemap.xml`.
  </sitemap_integration>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. Orphan files are warned; minimum 1 violation triggers strict failure.
  </build_time>
  <search_no_results>Friendly empty state echoing query + "clear search" button; list retains last filter or shows empty hint.</search_no_results>
  <missing_person_on_spoke>Person not found in catalog (URL manually entered or catalog change) → 404 (Next.js default). Spoke route generateStaticParams must include ALL slugs from latest catalog, so old spoke URLs remain valid even after catalog changes (slug never changes, only content updates).
  </missing_person_on_spoke>
  <storage>
    <unavailable>Private mode/disabled → recents/favorites in-memory, no scary error. Hub/search/list fully work.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh (favorites/recents not precious, no throw).</corrupt_blob>
  </storage>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
  <note>No first-party network calls; spoke pages are pure SSG; no API error surface.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Per-tool identity accent is SKY (var(--accent-sky) / var(--accent-sky-soft)), same as bookmarks (both dev category, different themes). Intro icon tile, favorite star (filled), spoke header accent.
    - CTAs (primary buttons, active tabs) stay brand honey-gold var(--brand).
    - Field badges: subtle tint (accent-sky soft) to differentiate fields. Era badge: monochrome (text-muted) to avoid clutter.
  </accent_usage>
  <surfaces>Card/spoke = var(--surface) + 1px var(--hairline); spoke header radius --radius-xxl; card radius --radius-lg; fields/era badge pill var(--surface-muted). Soft brand-tinted shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px); person name headline (card 18–20px / spoke 32–36px)/700; knownFor 15–16px var(--text-secondary); biography 16px/1.6; era/birth-year caption 13px var(--text-muted).</typography>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, spoke fade-in 150ms on load. All gated by prefers-reduced-motion.</motion>
  <accessibility>Card/star = labeled real buttons; roving-tabindex list; favorite status aria-live="polite"; ≥44px tap targets; visible focus-visible ring var(--focus-ring); photo alt-text; photo+links rel=noopener if applicable. Spoke breadcrumb + related-person links semantic.</accessibility>
  <responsive>
    - Hub: single column — search + tabs + card grid (1-col <768px, 2-col 768–1023px, 3-col ≥1024px). Cards never overflow at 320px.
    - Spoke: single column — breadcrumb, header (name, photo, badges), biography, achievements, related, share. Photo scales responsively (clamp width). No horizontal scroll at 320px.
  </responsive>
  <atmosphere>Scholarly, inspiring "people who shaped computing": generous card spacing, clear bios that celebrate achievement. Spoke pages feel like a museum exhibit — rich biography, clear dates, related context. Not a dense table; each person gets respect.</atmosphere>
  <icons>lucide-react: Search, Star/StarOff (favorite), Calendar/Clock (era/year), MapPin (nationality), Users (related), ExternalLink (links), X (clear). Default 20px (16–18px in spoke), stroke 1.75, currentColor. Registry card icon: `Users`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - Name/knownFor/biography render as text nodes (React escape). dangerouslySetInnerHTML forbidden.
    - Links rendered as `<a href={url} rel="noopener target="_blank" />` (external, safe). Generator validates photoUrl + links (http(s) only, no javascript: or data:).
    - Generator validates frontmatter with zod (type/required/length/URL format).
  </input>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes person/field data beyond view count.</privacy>
  <content_integrity>Catalog is build-time static asset (no remote fetch); unit tests validate derivation, uniqueness, locale completeness.</content_integrity>
  <note>No secrets, no network access, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <favorites_recents>Star pin + recent view (localStorage) — reduce repeat-search friction. Unknown slugs auto-pruned.</favorites_recents>
  <keyboard_first>"/" search, arrow navigate, Enter open, "f" favorite — mouse-free power (hub).</keyboard_first>
  <structured_data>Person + BreadcrumbList JSON-LD per spoke (schema.org Person: name, description, birthDate, deathDate, jobTitle, knowsAbout, sameAs=[Wikipedia, GitHub if applicable]; BreadcrumbList for SEO breadcrumb trails) — AI crawlers recognize person profiles (GEO discoverability = DESIGN principle ③).</structured_data>
  <hub_and_spoke_seo>Hub (SPA) is SEO shell (static Intro/HowTo/FAQ + FAQPage JSON-LD). Spokes are per-person discovery pages (Person schema, rich biography, BreadcrumbList, canonical/hreflang) — collective SEO value across person profiles. Sitemap and llms.txt list both hub and spoke routes.</hub_and_spoke_seo>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → hub list + spoke pages auto-generate</description>
    <steps>
      1. grace-hopper.md + grace-hopper_en.md exist in content/dev-people/people/ with name, knownFor (≥50 chars), birthYear, fields, era, nationality.
      2. pnpm dev → predev generator runs → dev-people.generated.json has grace-hopper merged record (ko/en name, knownFor, biography).
      3. Visit /ko/tools/dev-people → hub list renders "그레이스 호퍼" card (era badge "1960–1980", field "compiler").
      4. Click card or visit /ko/tools/dev-people/grace-hopper → spoke SSG page loads: H1 "그레이스 호퍼", biography SSR'd, Person+BreadcrumbList JSON-LD in `<head>`.
      5. Add new pair (e.g., ada-lovelace), rebuild → hub auto-updates, new spoke page auto-generated.
      6. Missing pair or knownFor <50 chars or invalid year → generator reports file path/reason, exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Hub search, field/era filter, empty states</description>
    <steps>
      1. Type "Hopper" in search → narrows to matching people; result count updates; aria-live announces.
      2. Click "compiler" field tab → compiler-field people only (Hopper, Ritchie, etc.).
      3. Click "1960–1980" era tab → compound filter (compiler AND 1960–1980).
      4. Type "asdfqwer" → empty "'asdfqwer'에 해당하는 인물이 없어요" + clear; clear restores full list.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Spoke page — biography, JSON-LD, related navigation</description>
    <steps>
      1. Visit /ko/tools/dev-people/grace-hopper → page loads: name, birth (1906) / death (1992), "US", badges (compiler, language-creator, 1960–1980).
      2. Biography section: 2–4 paragraph SSR'd text about Hopper's life and contributions.
      3. Related section: links to alan-turing, ada-lovelace (related slugs) → click to navigate to their spoke pages.
      4. Browser DevTools: `<meta name="description" … />` + `<link rel="canonical" href="…/grace-hopper" />` + `<link rel="alternate" hreflang="en" href="…/en/tools/dev-people/grace-hopper" />` present.
      5. JSON-LD in `<script type="application/ld+json">`: Person (name, description, birthDate "1906-12-09", deathDate "1992-01-01", nationality "US", jobTitle/knowsAbout, sameAs URLs) + BreadcrumbList.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Favorites, recents, hub persistence, keyboard, a11y</description>
    <steps>
      1. Click 2 different person cards in hub → "최근" tab lists them MRU.
      2. Star a card → "즐겨찾기" tab shows it; star filled (aria-pressed=true).
      3. Reload hub → favorites/recents persist (localStorage); unknown slugs pruned (if catalog changed).
      4. "/" → search focus; arrow navigate cards; Enter open spoke (navigate); axe pass → no a11y violations.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO (JSON-LD, sitemap, GEO), locale swap</description>
    <steps>
      1. Switch to /en → hub chrome (tabs/search/how-to/FAQ) English; card 1st label person name English, subtitle Korean (if applicable).
      2. Build prod → /ko/tools/dev-people and /en/tools/dev-people unique title/description/canonical/hreflang; spoke pages mirror (16+ spoke URLs per locale).
      3. HTML `out/sitemap.xml` includes hub route + ≥8 person spokes × 2 locales (17 dev-people URLs minimum).
      4. Each spoke HTML has SoftwareApplication + FAQPage (hub) + Person JSON-LD (spoke) with url==canonical; FAQ items align with visible content.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<person>.md` + `<person>_en.md` pair in content folder, rebuild, auto-reflect in hub list + new spoke page with zero code change; generator validates pair/structure/references, fails build with clear message on violation.</content_model>
  <hub_functionality>Searchable person list (both locales, search-first); field/era tab filters (composable); localStorage favorites + recent; seed 8+ people × ko/en pairs. Hub is pure SPA (no route navigation).</hub_functionality>
  <spoke_functionality>Individual person spoke pages SSG'd via generateStaticParams. Biography SSR'd outside mounted gate (crawlers see rich text). Person JSON-LD + BreadcrumbList + canonical/hreflang per spoke. Related-person navigation (links within tool).</spoke_functionality>
  <user_experience>Search/filter instant in hub; cards readable at 320px; ≥44px targets; visible focus; spoke pages load fast (SSG, no JS hydration delay); spoke breadcrumb + related links clear.</user_experience>
  <technical_quality>lib/dev-people/* pure ≥ 80% unit coverage (schema/merge/slug/search/favorites); generator validation tests (pair-missing, dupe-slug, dangling-related, year-sanity → fail); TS 0 errors; &lt;800 lines per file; catalog code-split, no i18n bundle bloat. Spoke route generateStaticParams tested (≥16 params generated per locale).</technical_quality>
  <visual_design>DESIGN.md compliant; sky identity + brand honey-gold CTA; clean person cards (readable, focused states, avatar), scholarly spoke pages (generous bio whitespace, clear dates, related context). Text-node render only.</visual_design>
  <accessibility>Hub: full keyboard (roving list, "/", Enter, "f", Esc); aria-live state; labeled buttons; motion-respect; WCAG 2.1 AA. Spoke: semantic HTML (breadcrumb, headings, lists), photo alt-text, link affordances.</accessibility>
  <performance>Hub route within platform budget; spoke pages within budget (static HTML + Person JSON-LD, minimal CSS); CLS unaffected; LCP < 2.5s; catalog dynamic import (code-split).</performance>
  <seo_geo>Hub + spoke routes both in sitemap with hreflang alternates. Person JSON-LD + BreadcrumbList per spoke. FAQ/Intro in hub. All biography text in static HTML (no mounted gate). llms.txt includes dev-people collection. Sitemap test confirms ≥17 URLs (hub + spokes).</seo_geo>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild` hook runs generate-dev-people.mjs to freshen dev-people.generated.json. Hub `/[locale]/tools/dev-people` pre-rendered by platform generateStaticParams iterating registry (status "live"). Spoke routes `/[locale]/tools/dev-people/[person]` pre-rendered by tool-specific generateStaticParams iterating dev-people.generated.json (≥8 people × 2 locales = 16+ spokes).</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'dev' category already exists with 'sky' accent; no category change needed.
    {
      id: 'dev-people',
      slug: 'dev-people',
      category: 'dev',
      icon: 'Users',
      accent: 'sky',
      status: 'live',
      isNew: true,
      order: 19,  // After bookmarks (18), tune as desired
      keywords: ['개발자','인물사전','소프트웨어','역사','프로그래머','여성과학자','Dennis Ritchie','Grace Hopper','Ada Lovelace','개발 역사','선구자','developer','biography','history','computer','pioneers','history','figures'],
    },
    ```
    Also add slug→component branches (hub: `<DevPeople/>`, spoke: server component at `/[person]`) and generateMetadata branches (hub + spoke, spoke includes Person JSON-LD + BreadcrumbList) in tool route.
  </platform_registry_change>
  <route_structure>
    ```typescript
    // src/app/[locale]/tools/dev-people/
    ├── page.tsx                 # Hub route; imports DevPeople client component
    ├── [person]/
    │   └── page.tsx             # Spoke route; server component
    │                             #   - exports generateStaticParams() → { person, locale }[]
    │                             #   - exports generateMetadata(props) → Metadata with Person JSON-LD
    │                             #   - getStaticProps or direct fetch from dev-people.generated.json
    │                             #   - renders <PersonSpoke person={person} locale={locale} />
    │                             #   - biography SSR'd outside mounted gate
    ```
  </route_structure>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter → zod → mergePair → validate → dev-people.generated.json. Hub + spoke depend on this.
    2. Pair/canonical-merge rule (ko fields/era/nationality canonical, en inherit) + slug uniqueness + related referential integrity + year sanity.
    3. Search (both locales, diacritic/case-ignore) + field+era filter composition.
    4. Hub favorites/recents → spoke navigation (card click updates recents, stores slug).
    5. **Sitemap integration**: app/sitemap.ts must import dev-people catalog and append spoke URLs (platform concern, but tool provides allPeople export).
  </critical_paths>
  <recommended_implementation_order>
    1. lib/dev-people/{schema,slug,merge,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema, slug derivation/uniqueness, canonical merge, year validation, search match, MRU/favorite immutable ops, pruneUnknown.
    2. scripts/generate-dev-people.mjs + content/dev-people/{_TEMPLATE,_TEMPLATE_en,README} + people/ seed (8 people: Ada Lovelace, Grace Hopper, Dennis Ritchie, Guido van Rossum, Linus Torvalds, Margaret Hamilton, Anders Hejlsberg, John Carmack — ko/en pairs, full biographies 2–4 para each). Validation tests (pair-missing, dupe-slug, dangling, year-sanity → fail). predev/prebuild wire.
    3. tools.dev-people.* messages (ko/en): field/era labels, search, toasts, empty states, how-to, FAQ.
    4. useDevPeopleCatalog hook (dynamic import + localStorage favorites/recents + in-memory fallback).
    5. PeopleSearch + FieldTabs + EraTabs + PeopleList/PersonCard (roving tabindex, states) + empty states. Cards are `<a>` anchors to spoke routes.
    6. DevPeopleIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD (hub).
    7. Hub registry status→live; hub slug→component + generateMetadata branches.
    8. **Spoke route** `/[person]/page.tsx`: generateStaticParams, generateMetadata (Person + BreadcrumbList JSON-LD), server component rendering PersonSpoke (breadcrumb, header, biography SSR, achievements, related, share). Test biography is in static HTML (no mounted gate).
    9. **Sitemap integration**: update app/sitemap.ts to import dev-people.generated.json and append spoke URLs (16+ URLs). Test sitemap.xml has ≥17 dev-people URLs.
    10. Keyboard shortcuts, motion-reduce, a11y (axe, aria-live, roving focus, photo alt-text).
    11. E2E scenarios 1–5 (esp. #1 folder→hub→spoke, #3 biography/JSON-LD, #5 sitemap); visual regression 320/768/1024 both themes.
  </recommended_implementation_order>
  <seed_people note="initial content — author fine-tunes but start with these">
    - Ada Lovelace (1815–1852, founder, science, 1840–1860 era, UK): first computer programmer, Analytical Engine.
    - Grace Hopper (1906–1992, language-creator/compiler, 1960–1980 era, US): COBOL, compiler theory.
    - Dennis Ritchie (1941–2011, language-creator/os, 1980–2000 era, US): C language, Unix.
    - Guido van Rossum (1956–, language-creator, 2000–present era, NL): Python.
    - Linus Torvalds (1969–, os, 2000–present era, FI): Linux.
    - Margaret Hamilton (1936–, science, 1980–2000 era, US): Apollo 11 software, systems thinking.
    - Anders Hejlsberg (1960–, language-creator, 2000–present era, DK): C#, TypeScript.
    - John Carmack (1970–, game/graphics, 2000–present era, US): Doom, Quake, graphics algorithms.
  </seed_people>
  <generator_sketch>
    ```javascript
    // scripts/generate-dev-people.mjs (outline)
    import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) people/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) matter(file).data → zod PersonFileFront.parse (collect errors)
    // 3) mergePair(ko, en): canonical rule (ko fields/era/nationality), resolveSlug
    // 4) validate: pair-integrity / required-fields / slug-unique / related-exist / year-sanity / URL-valid → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(dev-people.generated.json)
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/search/favorites); generator validation fixtures (pair-missing/<50-chars/year-invalid cases); component catalog-injected mocks; E2E scenarios 1–5 (esp. #1 folder→hub→spoke, #3 biography/JSON-LD, #5 sitemap); localStorage jsdom-isolated. Spoke route test: generateStaticParams returns ≥16 params (8 people × 2 locales); Person JSON-LD present in rendered HTML.</testing_strategy>
  <lms_txt_update>Add `dev-people` tool slug to `public/llms.txt` collections section (tool discovery for AI crawlers).</lms_txt_update>
</key_implementation_notes>

</project_specification>
```
