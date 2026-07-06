# How-To Guides — Rendered Markdown Guide Collection — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation lives in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **How-To Guides** (하우투 가이드) — a curated collection of step-by-step guides ("How to install Claude Code", "How to issue an API token", …) authored as **markdown files** and rendered with full support for **images, Mermaid diagrams, and syntax-highlighted code blocks**. Content is managed as markdown file pairs (`<slug>.md` + `<slug>_en.md`); at build time a generator scans the folder, validates, and emits a static catalog. The tool mounts as a **hub + spoke** collection: a client-side SPA hub (`/tools/howto`) for browse/search, plus one statically-generated spoke page per guide (`/tools/howto/<slug>`) that renders the full guide body.
> Internal service codename: `howto`. Registry id: `howto`. Public URL slug: `/[locale]/tools/howto`.
>
> **CRITICAL — REUSE, DO NOT DUPLICATE.** This tool introduces almost no net-new architecture. It reuses (a) the existing markdown-collection pipeline (generator + gray-matter + zod), mirroring `scripts/generate-glossary.mjs` / `generate-dev-people.mjs`; (b) the existing hub+spoke SEO helpers in `src/lib/seo.ts`; (c) the existing shared `<Markdown>` component (`src/components/markdown/Markdown.tsx`) — **EXTENDED backward-compatibly**, never replaced; (d) existing favorites/recents, search, `ShareButtons`, and i18n patterns. The ONLY genuinely new code is three markdown-rendering capabilities (code highlighting, Mermaid, richer images) added **inside the shared Markdown module** so that every tool benefits, plus the usual one-tool wiring (one registry entry, route branches, sitemap block).
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling SPEC (same content-collection + hub/spoke pattern): [`docs/services/text/new-word/SPEC.md`](../../text/new-word/SPEC.md), [`docs/services/dev/dev-people/SPEC.md`](../dev-people/SPEC.md)
> - Shared renderer being extended: [`src/components/markdown/Markdown.tsx`](../../../../src/components/markdown/Markdown.tsx)

```xml
<project_specification>

<project_name>How-To Guides — Rendered Markdown Guide Collection (Jurepi tool, codename howto, registry id howto)</project_name>

<overview>
How-To Guides is a curated library of practical, step-by-step guides — "How to install Claude Code", "How to issue an API token", "How to set up a git worktree", and so on. Each guide is a **markdown document**: the operator writes prose, embeds screenshots, draws a Mermaid flow diagram, and drops in fenced code blocks, and the tool renders it as a clean, readable, indexable page. A user opens the hub, searches or scans the guide list, taps a guide, and reads a fully-rendered walkthrough with copyable code and rendered diagrams.

The content model is fundamental and identical to the platform's other collection tools: guides are NOT code — they are **markdown files**. Create a pair of files in the content folder (`<slug>.md` for Korean + `<slug>_en.md` for English), and at **build time** a generator scans the folder, parses frontmatter, validates, and bakes everything (frontmatter + raw markdown body) into a static, code-split catalog (guides.generated.json). "Drop a file in the folder and it appears" is REAL — no backend, no database, no CMS.

Unlike New Word (where the markdown body was ignored and only structured frontmatter fields mattered), here the **markdown body IS the product**. The body must render three things the platform has never rendered before: (1) **images** (screenshots, with lazy loading and captions), (2) **Mermaid diagrams** (```mermaid fenced blocks → rendered SVG flowcharts/sequence diagrams), and (3) **syntax-highlighted code blocks** (```bash, ```ts, … → colorized, with a copy button). These three capabilities are added to the SHARED `<Markdown>` component so the whole platform gains them.

CRITICAL (client + SSG, hub+spoke): 100% client/static. No backend, no database, no runtime file system access. The guide catalog is built into static JSON at build time from markdown. The hub (`/tools/howto`) is a client SPA (browse/search/favorites) mounted on the SSG shell. Each guide additionally gets a statically-generated spoke page (`/tools/howto/<slug>`) via `generateStaticParams`, whose full guide body is server-rendered (outside any `mounted` gate) so search engines and AI answer engines can index and cite the guide content. The only first-party persistence is `localStorage` (favorites + recent views), and nothing is ever sent over the network.

CRITICAL (content model, invariants): every guide MUST have a Korean file and an English file as a matching pair (one file only = build failure). Each file must carry a non-empty `title`, `summary`, and a non-empty markdown body. Structural metadata (`slug`, `topic`, `tags`, `order`, `related`, `updated`, `difficulty`) is **canonical in the Korean file**; the English file inherits if absent. The build generator validates pair integrity, required fields per locale, slug uniqueness, `related` referential integrity, and internal asset references, and **fails the build with a clear message** if ANY rule is broken (no silent omission).

CRITICAL (SPA hub, usability-first): the hub is a client-side Single-Page Application mounted on the SSG shell. Browse, search, topic filtering, and favoriting all happen via local React state with NO route navigation. Opening a guide navigates to its **spoke** page (a real URL, for shareability + SEO), where the guide is read. Both hub and spokes are statically generated for indexing.
</overview>

<platform_integration>
  - Hub route: /[locale]/tools/howto (SSG; registry slug "howto", id "howto", status "live", accent "sky", category "dev").
  - Spoke routes: /[locale]/tools/howto/[guide] (SSG; one static page per guide × locale, via generateStaticParams over guides.generated.json — mirrors new-word/[term], dev-people/[person], bookmarks/[topic]).
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata + JSON-LD builders (buildToolMetadata, buildToolEntityMetadata, absoluteEntityUrl, breadcrumbListJsonLd, itemListJsonLd, softwareApplicationJsonLd, faqPageJsonLd), breadcrumb + in_content ad wrapper, ShareButtons (src/components/share/ShareButtons.tsx).
  - Consumes: i18n namespace `tools.howto.*` (UI chrome: search, topic labels, empty states, how-to, FAQ, share, breadcrumb labels — NOT guide content; that comes from markdown in guides.generated.json). Also requires top-level `tools.howto.title` / `tools.howto.description` (consumed by searchable-tools, footer, home card) per platform i18n key contract.
  - Platform dependency (SMALL — NO new category needed): the `'dev'` category already exists in `ToolCategory`. `'sky'` is already a valid `AccentColor`. Changes are: (1) add ONE `ToolMeta` registry entry; (2) add slug→component branch + generateMetadata branch in the tool route; (3) add the spoke route folder `tools/howto/[guide]/`; (4) add a `content/howto/**` import + traversal block to `src/app/sitemap.ts` (new spoke collections are NOT auto-registered in sitemap — must be wired explicitly, per platform rule).
  - Shared-component change (benefits ALL tools): extend `src/components/markdown/Markdown.tsx` (+ new `CodeBlock.tsx`, `MermaidDiagram.tsx`, `MarkdownImage.tsx` siblings) with opt-in code-highlight / Mermaid / rich-image support. Default behavior unchanged → new-word, bookmarks, dev-people, restaurant-map renders are byte-for-byte unaffected.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Markdown-managed guide catalog (pairs: `<slug>.md` + `<slug>_en.md`) in `content/howto/guides/`.
    - Build-time generator (scripts/generate-howto.mjs): folder scan → gray-matter frontmatter parse → zod validation → merge (canonical rule) → emit code-split static catalog (guides.generated.json) capturing BOTH frontmatter AND raw markdown body. Wired to prebuild/predev.
    - **Extend the shared `<Markdown>` renderer** (opt-in, backward compatible) with:
        (a) Syntax-highlighted fenced code blocks (highlight.js, code-split) with language label + copy-to-clipboard button.
        (b) Mermaid diagram rendering (```mermaid fences → SVG, dynamic import, theme-aware, reduced-motion; source-fence fallback when JS is off / render fails).
        (c) Richer images (lazy load, max-width:100%, explicit intrinsic sizing where known, caption from alt text, rounded + hairline border).
    - Hub SPA (`/tools/howto`): guide list/grid (cards: title, summary, topic badge, difficulty, updated date, tags, favorite star), search, topic filter tabs, favorites/recents, empty states, keyboard nav.
    - Spoke page per guide (`/tools/howto/<slug>`): breadcrumb, title/summary header, updated date + difficulty + reading time, cover image (optional), fully-rendered markdown body (images/Mermaid/code), "on this page" heading anchors (optional), related-guide chips, ShareButtons (entity absolute URL), back-to-hub link, in_content ad slot.
    - Seed guides (≥6, bilingual): install-claude-code (클로드 코드 설치하는 법), issue-api-token (API 토큰 발급하는 법), plus git-worktree, mcp-server-setup, and 2+ more — at least one guide MUST exercise images, at least one MUST exercise a Mermaid diagram, and every guide MUST exercise a code block (to prove all three render).
    - **Guide authoring templates**: annotated markdown templates (`content/howto/_TEMPLATE.md`, `_TEMPLATE_en.md`) + authoring README (frontmatter fields, how to embed images/Mermaid/code, asset placement).
    - Search: title, summary, tags, topic across BOTH locales, real-time filter (debounced). Case/diacritic insensitive.
    - Favorites (pinned) + recent views — localStorage persistence, auto-prune of unknown slugs.
    - Full keyboard support on hub ("/" search focus, arrow nav, Enter open, Esc clear).
    - SEO/GEO: hub SoftwareApplication + FAQPage + ItemList JSON-LD; each spoke TechArticle (schema.org, Article subtype) + BreadcrumbList JSON-LD; unique per-guide/per-locale metadata (title/description/canonical/hreflang/OG); tool-specific long-form intro + FAQ (localized ko/en). Guide body server-rendered outside the mounted gate.
    - Reduced-motion fallbacks; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots mechanism, tool registry mechanism (all platform).
    - **A live paste-your-markdown playground** (user types markdown → preview). This tool renders a curated, operator-authored collection, not arbitrary user input. (Considered and explicitly rejected in favor of the collection model.) A live sandbox could be a separate future tool.
    - User browser-based guide add/edit UI (runtime CMS). Editing happens ONLY via repository markdown files — no backend/database.
    - Login / accounts / cross-device sync / comments / view counters.
    - Arbitrary raw HTML or `<script>` inside markdown bodies (rich HTML injection forbidden; markdown-to-jsx `disableParsingRawHTML: true` preserved). Content is trusted 1st-party markdown but still rendered defensively.
    - Full-text search across guide BODIES (search matches title/summary/tags/topic only at MVP; body-index is a Phase 2 candidate).
    - Versioning / changelog per guide beyond a single `updated` date.
  </out_of_scope>
  <future_considerations>
    - Body full-text search + in-page heading jump / TOC sidebar — Phase 2.
    - "Copy whole guide as markdown" / print-friendly view — Phase 2.
    - Guide categories/sections (grouped hub) as the catalog grows — Phase 2 (catalog only, schema unchanged).
    - Live markdown-preview sandbox as a distinct sibling tool — Phase 3.
    - Video embeds (YouTube) via a safe embed override — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router (static export, output:'export'), React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <content_source>Guides live as markdown pairs in `content/howto/guides/`. File system access is build-time only (generator script). Runtime has NO file system access. Guide images live under `public/images/howto/` (served statically) and are referenced from markdown by absolute site path (e.g., `/images/howto/install-claude-code/step-1.png`).</content_source>
    <frontmatter_parsing>gray-matter v4.x (already a devDependency from new-word/dev-people) to split YAML frontmatter from the markdown body in the generator. The RAW body string is preserved verbatim into the catalog for runtime rendering.</frontmatter_parsing>
    <validation>zod (already in repo) for (1) per-file frontmatter schema (2) merged guide-record invariants. Pure, reusable in generator and runtime loader.</validation>
    <markdown_render>Reuse the shared `<Markdown>` component (markdown-to-jsx v9.8.2, already installed). markdown-to-jsx renders to real React JSX — it works in server components, so the guide body appears in the static prerendered HTML (indexable). Interactivity (code copy, Mermaid SVG) is layered as client islands via element overrides; it does NOT gate the prose behind `mounted`.</markdown_render>
    <code_highlighting>highlight.js v11.11.x (NEW dependency). Used only inside the extended Markdown `code`/`pre` override. Registered languages limited to a curated subset (bash, shell, ts, tsx, js, json, python, yaml, diff, plaintext, http, sql) to bound bundle size; import the core build + explicit language registration, dynamically imported (code-split) so ONLY the howto route pays for it. Highlight can run at render time (server) producing static token spans; the copy button is a small client island.</code_highlighting>
    <mermaid>mermaid v11.x (NEW dependency). Client-only, DYNAMICALLY imported (`await import('mermaid')`) inside a `MermaidDiagram` client island, and ONLY when a ```mermaid fence is present on the page. Mermaid is heavy (~500KB) so it MUST NOT enter the global bundle or any other route — it is imported lazily on mount of the diagram island on the howto spoke only. Theme initialized from the current app theme (light/dark via `data-theme`); `startOnLoad:false`, manual `render()`. `prefers-reduced-motion` respected (mermaid `securityLevel:'strict'`, no animation). On render failure or JS-off, the original ```mermaid source stays visible as a fenced code block (honest fallback, and the source is in the prerendered HTML for GEO).</mermaid>
    <clipboard>Code-block "Copy" uses navigator.clipboard.writeText → hidden-textarea execCommand fallback → silent fail if neither works. Success toast/checkmark only on real success (platform clipboard lesson: never show false success).</clipboard>
    <animation>Native CSS transitions only (card hover lift, spoke fade-in). No animation library beyond mermaid's static output.</animation>
  </module_specific>
  <libraries>
    <highlight_js>highlight.js v11.11.1 — NEW dependency, code-split into the howto route. Curated language registration only.</highlight_js>
    <mermaid>mermaid v11.x — NEW dependency, dynamically imported client-only on the spoke, present only when a diagram exists.</mermaid>
    <gray_matter>gray-matter v4.0.3 — existing devDependency; frontmatter parsing in generator.</gray_matter>
    <markdown_to_jsx>markdown-to-jsx v9.8.2 — EXISTING; the shared renderer, extended not replaced.</markdown_to_jsx>
    <zod>zod — existing; frontmatter/catalog validation.</zod>
    <bundle_budget>CRITICAL: highlight.js and mermaid must be code-split so global JS budget and all non-howto routes are unaffected (verify with build output: no growth in shared chunks; mermaid chunk loads only on a spoke that contains a diagram). Same discipline as the new-word terms catalog code-split.</bundle_budget>
  </libraries>
</technology_stack>

<content_authoring_model>
  <directory>
    content/howto/
    ├── _TEMPLATE.md            # New-guide Korean template (annotated; generator excludes "_" prefix)
    ├── _TEMPLATE_en.md         # New-guide English template
    ├── README.md               # Authoring guide (frontmatter, images, Mermaid, code, asset placement)
    └── guides/
        ├── install-claude-code.md        # Korean canonical (structural metadata canonical)
        ├── install-claude-code_en.md      # English
        ├── issue-api-token.md
        ├── issue-api-token_en.md
        └── …
    public/images/howto/
        ├── install-claude-code/step-1.png …   # Guide screenshots (referenced by /images/howto/... path)
        └── …
  </directory>
  <pairing note="pair rule">
    - File name base (minus `_en` suffix) is the pair key. `install-claude-code.md` (ko) ↔ `install-claude-code_en.md` (en).
    - Files starting with `_` are ignored (_TEMPLATE, etc.).
    - Missing pair (English-only or Korean-only) → generator ERROR + build failure (canonical-pair policy is CRITICAL — no silent exclusion). ASCII file-name bases required (URL/slug stability).
  </pairing>
  <shared_metadata note="canonical rule">
    - Structural metadata (`slug`, `topic`, `tags`, `order`, `related`, `updated`, `difficulty`, `coverImage`) is **canonical in the Korean file**. English file inherits if omitted; if present, must match (validation enforces).
    - Locale-specific content (`title`, `summary`, and the markdown BODY) is independent per file.
  </shared_metadata>
  <template_ko>
    ```markdown
    ---
    # ── required ──
    title: 클로드 코드 설치하는 법           # Guide title (Korean)
    slug: install-claude-code               # ASCII stable identifier (Korean file canonical)
    summary: |                              # 1–2 sentence card/meta summary (plain text)
      macOS·Windows·Linux에서 Claude Code CLI를 설치하고 첫 실행까지 마치는 단계별 안내.
    topic: setup                            # Topic: setup | ai-tools | git | api | cli | deploy
    # ── optional (structural meta) ──
    tags: [claude-code, cli, 설치]
    order: 1                                # Sort order within topic (asc)
    updated: 2026-07-06                     # ISO date (last reviewed). Drives sitemap lastmod + "updated" label.
    difficulty: beginner                    # beginner | intermediate | advanced
    coverImage: /images/howto/install-claude-code/cover.png   # Optional hero image (absolute site path)
    related: [issue-api-token, mcp-server-setup]              # Related guide slugs
    ---

    ## 준비물

    - Node.js 20 이상
    - 터미널(zsh / bash / PowerShell)

    ## 설치 흐름

    ```mermaid
    flowchart TD
      A[Node 설치 확인] --> B[npm 전역 설치]
      B --> C[claude 로그인]
      C --> D[첫 실행]
    ```

    ## 설치 명령

    ```bash
    npm install -g @anthropic-ai/claude-code
    claude --version
    ```

    설치가 끝나면 아래처럼 버전이 표시됩니다.

    ![설치 완료 화면](/images/howto/install-claude-code/step-1.png)
    ```
  </template_ko>
  <template_en>
    ```markdown
    ---
    # ── required ──
    title: How to Install Claude Code
    summary: |
      A step-by-step guide to installing the Claude Code CLI on macOS, Windows, and Linux, through first run.
    # ── optional (structural meta inherits from Korean file if omitted) ──
    ---

    ## Prerequisites
    - Node.js 20+
    - A terminal (zsh / bash / PowerShell)

    ## Install flow
    ```mermaid
    flowchart TD
      A[Verify Node] --> B[Global npm install]
      B --> C[claude login]
      C --> D[First run]
    ```

    ## Install command
    ```bash
    npm install -g @anthropic-ai/claude-code
    claude --version
    ```

    ![Install complete](/images/howto/install-claude-code/step-1.png)
    ```
  </template_en>
</content_authoring_model>

<file_structure>
scripts/
└── generate-howto.mjs                       # Build time: scan content/howto/guides/* → gray-matter → zod → merge → emit guides.generated.json (frontmatter + raw body). Wired to prebuild/predev. Mirrors generate-glossary/generate-dev-people.
content/howto/                                # Human-authored content (repository)
├── _TEMPLATE.md  _TEMPLATE_en.md            # Templates (excluded by generator)
├── README.md                                # Authoring guide
└── guides/*.md  *_en.md                     # Guide pairs
public/images/howto/**                        # Guide screenshots / cover images (static)
src/
├── lib/howto/                                # Pure domain layer — no React/Next, fully unit-tested
│   ├── schema.ts                            # zod: GuideFileFront(ko/en), MergedGuide, StoreSchema + STORE_VERSION; safeparse helpers
│   ├── merge.ts                             # mergePair(koFront+koBody, enFront+enBody): canonical rule → MergedGuide; validatePair (warn/error collect)
│   ├── slug.ts                              # slugify(name), resolveSlug(front, filename)
│   ├── catalog.ts                           # Stateless typed access: allGuides(catalog), byId(catalog, slug), byTopic, topics(); related integrity; readingTime(body)
│   ├── search.ts                            # filterGuides(guides, query, locale): title+summary+tags+topic, both locales; normalize (case/diacritics)
│   └── favorites.ts                         # Immutable ops: toggleFavorite, pushRecent(max), pruneUnknown(slugs, catalog)
├── components/markdown/                      # SHARED renderer — EXTENDED (benefits every tool)
│   ├── Markdown.tsx                         # Existing; add opt-in props: enableCodeHighlight?, enableMermaid?, enableRichImages? (all default false → existing callers unchanged)
│   ├── CodeBlock.tsx                        # NEW: fenced code → highlight.js tokens + language label + copy button (client island for copy)
│   ├── MermaidDiagram.tsx                   # NEW: ```mermaid fence → dynamic-import mermaid → SVG; theme-aware; reduced-motion; source-fence fallback
│   ├── MarkdownImage.tsx                    # NEW: <img> override → lazy, max-w-full, caption from alt, rounded + hairline
│   └── (existing tests + new tests per component)
├── components/tools/howto/                   # Tool presentation
│   ├── Howto.tsx                            # HUB orchestrator (Client Component) — topic/query/selected state + useHowto() owner
│   ├── useHowto.ts                          # Hook: dynamic catalog import + localStorage favorites/recents + derived filter
│   ├── GuideSearch.tsx                      # Search input ("/" focus, clear, result count, aria)
│   ├── TopicTabs.tsx                        # All / setup / ai-tools / git / api / … / (Favorites) / (Recent) pills
│   ├── GuideList.tsx                        # Responsive card grid; roving tabindex; crawlable <a> to spoke
│   ├── GuideCard.tsx                        # One guide: title, summary, topic badge, difficulty, updated, tags, star. Card root = visible <a href> to spoke (progressive enhancement).
│   ├── HowtoSpoke.tsx                       # SPOKE body (Server Component): breadcrumb, header, cover, <Markdown enableCodeHighlight enableMermaid enableRichImages>{body}</Markdown>, related chips, ShareButtons, back link
│   ├── HowtoIntro.tsx                       # Hub H1 + lead (SEO; server-render)
│   ├── HowtoHowTo.tsx                       # Hub "How this works" long-form (SEO)
│   ├── HowtoFaq.tsx                         # Q&A + FAQPage JSON-LD (single owner of FAQPage)
│   ├── HowtoStructuredData.tsx              # SoftwareApplication + ItemList JSON-LD (hub); TechArticle + BreadcrumbList (spoke, via lib/seo helper)
│   └── data/
│       └── guides.generated.json           # Generated artifact — [MergedGuide...] (frontmatter + raw body). Commit for reproducibility.
├── app/[locale]/tools/howto/[guide]/page.tsx # Spoke route: generateStaticParams (all slugs × locale) + generateMetadata (buildToolEntityMetadata) + TechArticle/BreadcrumbList JSON-LD + <HowtoSpoke>. Wires ShareButtons with absoluteEntityUrl.
├── app/sitemap.ts                            # ADD: import guides.generated.json, iterate slugs → absoluteEntityUrl entries with hreflang + updated lastmod.
├── lib/seo.ts                                # ADD: techArticleJsonLd(guide, locale) helper (reuses breadcrumbListJsonLd/itemListJsonLd/absoluteEntityUrl).
└── i18n/messages/{ko,en}.json                # tools.howto.* UI chrome (top-level title/description + search/tabs/empty/howto/faq/share/breadcrumb) — NOT guide content
</file_structure>

<core_data_entities>
  <guide_file_front note="individual markdown file frontmatter (parse unit)">
    - title: string (required, non-empty) — guide title (that locale)
    - summary: string (required, non-empty, plain text, recommend ≤ 200 chars)
    - slug?: string — ASCII stable identifier (Korean file canonical; absent = derive from filename)
    - topic?: enum (setup, ai-tools, git, api, cli, deploy) — Korean file canonical; extensible
    - tags?: string[]
    - order?: number — sort within topic (default 999)
    - updated?: string (ISO date) — last reviewed
    - difficulty?: enum (beginner, intermediate, advanced)
    - coverImage?: string — absolute site path under /images/howto/…
    - related?: string[] — other guide slugs
    INVARIANT: title/summary non-empty; body non-empty. zod parse failure → collect as error (build failure).
  </guide_file_front>
  <merged_guide note="ko+en merge result; catalog record; guides.generated.json item">
    - slug: string — unique identifier in catalog
    - topic: enum — Korean file canonical
    - tags: string[] — Korean canonical ([] if absent)
    - order: number; updated?: string; difficulty?: enum; coverImage?: string
    - related: string[] — only real slugs in catalog (build validates, missing → error)
    - ko: { title, summary, body }   # body = raw markdown string (verbatim)
    - en: { title, summary, body }
    INVARIANT — PAIR/FIELDS/UNIQUENESS/REFERENCE/ASSETS: every record has ko+en; each locale's title/summary/body non-empty; slug unique; related points to real slugs; referenced local images (coverImage + `/images/howto/…` in body) exist on disk. Violation → generator build failure (explicit error + file/field report, no silent omission).
  </merged_guide>
  <topic note="grouping by theme; localized label from i18n">
    - id: enum (setup, ai-tools, git, api, cli, deploy). Display order fixed; Label: tools.howto.topics.<id>.
    - Virtual tabs (not real topics): "all", "favorites" (pinned), "recent" (MRU) — shown when applicable.
  </topic>
  <howto_store note="single localStorage blob">
    - version: number (STORE_VERSION, starts at 1)
    - favorites: string[] — guide slugs, insertion order
    - recents: string[] — guide slugs, MRU-first, RECENTS_MAX = 20, de-duplicated
    - meta: { lastTopic?: string; createdAt: number }
    localStorage key: `jurepi-howto`
    INVARIANT: read is zod-parsed; fail → start fresh (no throw). Unknown slugs pruned on load.
  </howto_store>
  <constants>
    - RECENTS_MAX = 20; SEARCH_DEBOUNCE = 120ms; CARD_SUMMARY_CLAMP = 2 lines; TOAST_MS = 1600ms; READING_WPM = 200 (reading-time estimate from body word count).
  </constants>
  <defaults>
    - New user: favorites/recents empty; active tab "all"; hub list sorted by topic order → `order` asc → `updated` desc.
  </defaults>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/howto" page="Howto hub (platform tool route branches slug→component)" />
    <route path="/:locale/tools/howto/:guide" page="HowtoSpoke (dedicated spoke route + generateStaticParams)" />
  </public_routes>
  <note>locale ∈ {ko, en}. Hub SSG via platform generateStaticParams over registry (status "live"). Spokes SSG via the spoke route's generateStaticParams over guides.generated.json (all slugs × both locales). Opening a guide from the hub = navigation to its spoke URL (shareable, indexable) — hub cards are real crawlable &lt;a&gt; anchors, click is progressive enhancement.</note>
</route_definitions>

<component_hierarchy>
  <howto>                          <!-- HUB; "use client"; owns topic + query + favorites via useHowto() -->
    <howto_intro />               <!-- H1 + lead (server-render; outside mounted gate) -->
    <guide_search />              <!-- "/" focus, clear, result count -->
    <topic_tabs />                <!-- All / setup / ai-tools / … / Favorites / Recent -->
    <guide_list>                  <!-- card grid outside mounted gate (crawlable anchors) -->
      <guide_card />              <!-- × N: root = <a href="/…/tools/howto/{slug}">; star = favorite (sibling, not nested in anchor) -->
      <empty_state />             <!-- no results / empty favorites / empty recents -->
    </guide_list>
    <howto_how_to />              <!-- SEO long-form -->
    <howto_faq />                 <!-- FAQPage JSON-LD -->
    <howto_structured_data />     <!-- SoftwareApplication + ItemList JSON-LD -->
  </howto>

  <howto_spoke>                    <!-- SPOKE; Server Component; NOT behind mounted gate -->
    <breadcrumb />                <!-- Home ▸ How-To Guides ▸ {title} (BreadcrumbList JSON-LD) -->
    <guide_header />              <!-- title, summary, updated + difficulty + reading time, cover image -->
    <markdown enableCodeHighlight enableMermaid enableRichImages>  <!-- guide body → images/Mermaid/code -->
      <code_block />              <!-- client-island copy button layered on SSR-highlighted tokens -->
      <mermaid_diagram />         <!-- client island; SVG or source-fence fallback -->
      <markdown_image />          <!-- lazy, caption, bordered -->
    </markdown>
    <related_chips />             <!-- related slug → link to that spoke -->
    <share_buttons url={entityAbsoluteUrl} title={title} />
    <back_to_hub />
  </howto_spoke>
</component_hierarchy>

<pages_and_interfaces>
  <howto_intro>
    - Eyebrow: "개발 도구" / "DEV TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "하우투 가이드" / "How-To Guides" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: "클로드 코드 설치, 토큰 발급 같은 실전 가이드를 이미지·다이어그램·코드와 함께 단계별로 읽어보세요." / English equivalent.
  </howto_intro>

  <guide_search>
    - DESIGN text-input, full width, leading Search icon (lucide 20px var(--text-muted)), placeholder "제목·주제·태그로 검색 (예: 클로드 코드, 토큰, git)".
    - Focus on "/" keypress (when not already typing). Trailing clear (×) when non-empty.
    - Live filter debounced 120ms. Result count "결과 N개" var(--text-muted), aria-live="polite". role="searchbox".
  </guide_search>

  <topic_tabs>
    - Horizontal pill row (category-pill / category-pill-active). Order: "전체"(all) → topic labels in fixed order → "즐겨찾기"(favorites, when pinned) → "최근"(recent, when viewed).
    - Active = brand honey-gold fill / on-brand text; inactive = surface-muted / text-secondary. role="tablist"; ArrowLeft/Right; aria-selected. Narrow screens scroll + snap.
    - Compose with search (topic narrows set, search filters within).
  </topic_tabs>

  <guide_list>
    - Responsive grid: <768px 1-col; 768–1023px 2-col; ≥1024px 3-col.
    - Each guide_card (crawlable):
      - Card ROOT is a visible &lt;a href="/{locale}/tools/howto/{slug}"&gt; (NOT display:none; whole card is the link; onClick uses default navigation). The favorite star is a sibling &lt;button&gt; OUTSIDE the anchor (button-in-anchor is invalid) positioned top-right.
      - Top: title (headline 18–20px var(--text)/700). Top-right: star (aria-pressed).
      - Meta row: topic badge (topic-tinted pill) + difficulty chip + updated date (caption var(--text-muted)).
      - Body: summary 2-line clamp (var(--text-secondary) 14–15px).
      - Bottom: tags (≤3, surface-muted chips).
      - Card: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 16px.
    - States: hover translateY(-2px) + shadow-card-hover; focus-visible 2px var(--focus-ring); star toggle pop.
    - Roving tabindex across cards; Enter/Space follows the card link (navigate to spoke); "f" toggles favorite.
    - empty_state: no results → "'{query}'에 해당하는 가이드가 없어요" + clear; empty favorites → "별을 눌러 자주 보는 가이드를 저장하세요"; empty recent → "최근 본 가이드가 여기에 모여요".
  </guide_list>

  <howto_spoke_page>
    - Layout: single readable column, max-width ~ 760px (prose measure), centered, generous vertical rhythm.
    - Breadcrumb: Home ▸ How-To Guides ▸ {title} (last = current, not a link). Emits BreadcrumbList JSON-LD.
    - Header: title (H1 clamp 26–36px/700 var(--text)); summary (body-lg var(--text-secondary)); meta row = "업데이트 {updated}" + difficulty chip + "{n}분 읽기"/"{n} min read" (from READING_WPM). ShareButtons right-aligned (entity absolute URL + guide title).
    - Cover image (if coverImage): full-width, rounded, hairline border, lazy? No — cover is above the fold → loading="eager" fetchpriority="high"; explicit aspect box to avoid CLS.
    - BODY (the core): rendered by shared &lt;Markdown enableCodeHighlight enableMermaid enableRichImages&gt;. Renders unconditionally (SSR, prerendered HTML — GEO/SEO critical), NOT behind a mounted gate.
        • Headings h2/h3/h4 (DESIGN prose tokens, existing) with anchor ids (slugified) for deep links.
        • Paragraphs, lists, blockquotes, inline code/emphasis/links (existing overrides).
        • Fenced code blocks → code_block (see below).
        • ```mermaid fences → mermaid_diagram (see below).
        • Images → markdown_image (see below).
    - Related chips: related guide slugs → links to those spokes (unknown slugs hidden).
    - Back link: "← 모든 가이드" / "← All guides" to hub.
    - in_content AdSlot below body (platform wrapper).
  </howto_spoke_page>

  <code_block note="NEW shared capability">
    - Fenced ``` block with an optional language (```bash, ```ts, …). Language read from markdown-to-jsx `code` className (`lang-xxx`).
    - Rendering: highlight.js tokenizes at render time → static token spans (in prerendered HTML). Container: var(--surface-sunken), radius var(--radius-md), 1px var(--hairline), overflow-x:auto, mono, padding 12–16px.
    - Header strip: language label (uppercase caption, var(--text-muted)) left; "Copy" button right (client island). Copy → navigator.clipboard → checkmark + "복사됨"/"Copied" for 1.6s; failure silent (no false success). aria-label localized.
    - Unknown/unspecified language → plaintext container (no crash), copy still works.
    - Long lines scroll horizontally within the block (page body never scrolls horizontally).
  </code_block>

  <mermaid_diagram note="NEW shared capability">
    - Trigger: fenced ```mermaid block. SSR emits the raw diagram source inside a &lt;pre&gt;&lt;code&gt; (visible fallback + indexable text). A `MermaidDiagram` client island (dynamic `import('mermaid')` on mount, ONLY if a mermaid block exists) initializes mermaid with theme from `data-theme` (light: 'default', dark: 'dark'), `startOnLoad:false`, `securityLevel:'strict'`, then `render()` the source and swaps in the SVG.
    - Success: centered SVG, max-w-full, horizontal scroll wrapper if wide, subtle var(--surface) card. Re-render on theme change.
    - Failure / JS-off / reduced-motion: keep the source code fence visible (labeled "다이어그램 소스"/"Diagram source"); never crash the page. Errors caught, not thrown to the Error Boundary.
    - CRITICAL: mermaid must be code-split — verify the mermaid chunk loads ONLY on a spoke containing a diagram, and never on the hub or any other tool.
  </mermaid_diagram>

  <markdown_image note="NEW shared capability">
    - &lt;img&gt; override: className max-w-full h-auto, rounded var(--radius-md), 1px var(--hairline). loading="lazy" decoding="async" for in-body images.
    - Caption: if alt text present, render a &lt;figure&gt; with &lt;figcaption&gt; (caption var(--text-muted), centered) below the image.
    - Only allow local (`/images/howto/…`) and https image sources; other schemes dropped (defensive). No layout shift: wrap in an aspect-ratio box where intrinsic size is known via frontmatter; else reserve min-height.
  </markdown_image>

  <keyboard_shortcuts_reference>
    - "/" → hub search focus (when not typing).
    - Arrow keys → card focus move (roving tabindex); Home/End → first/last.
    - Enter / Space → open focused guide (navigate to spoke).
    - "f" (card focused) → toggle favorite (aria-pressed flip + toast).
    - Esc → clear search if non-empty.
    - On spoke: standard browser scroll/anchor nav; code "Copy" is pointer/Enter on button.
    - Disabled on touch; all actions reachable via tap.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <generation note="build time, scripts/generate-howto.mjs — mirror generate-glossary/generate-dev-people">
    - Scan content/howto/guides/, exclude `_` prefix. Group by base filename into ko/en pairs.
    - gray-matter parse each file → { data: frontmatter, content: rawBody }. zod GuideFileFront.validate(data); assert content non-empty.
    - mergePair: canonical rule (ko structural meta + en inherit; title/summary/body independent). resolveSlug.
    - Validate (fail → process.exit(1) with file/field/reason): pair integrity, locale required fields + non-empty body, slug uniqueness, related references exist, referenced local images (coverImage + body `/images/howto/…`) exist on disk.
    - Sort (topic order → order asc → updated desc → title). Emit guides.generated.json (frontmatter + raw ko/en body). Deterministic (no Date/random).
    - package.json wire: predev + prebuild run node scripts/generate-howto.mjs.
  </generation>
  <catalog_access note="runtime pure layer — STATELESS (avoid init-catalog bug class)">
    - allGuides(catalog): MergedGuide[]; byId(catalog, slug); byTopic(catalog, topic); topics(catalog). readingTime(body): minutes from word count / READING_WPM.
    - Spoke route uses catalog directly (import guides.generated.json → find by slug) — NO stateful module init (bookmarks lesson: stateful catalog that a route forgets to init returns null).
    - Tests assert uniqueness, related integrity, locale completeness.
  </catalog_access>
  <search>
    - filterGuides(guides, query, locale): blank query → as-is. Else normalize (trim, NFC, lowercase, strip diacritics). Match if ANY of: ko.title, en.title, ko.summary, en.summary, tags, topic. Stable order. (Body not searched at MVP.)
    - Compose with topic tab: list = filterGuides(active-tab subset, query).
  </search>
  <favorites_and_recents note="immutable">
    - toggleFavorite(list, slug); pushRecent(list, slug, max=20) (move/insert front, de-dupe, truncate); pruneUnknown(slugs, catalog).
    - Recent push: on spoke mount (a guide was opened/read). Hub search/hover don't trigger. (Hub reads recents from the store the spoke wrote.)
  </favorites_and_recents>
  <persistence_adapter useHowto>
    - Mount: dynamic catalog import; read `jurepi-howto` → zod → pruneUnknown → state; fail → fresh (no throw). Absent localStorage → in-memory session.
    - Change: debounced JSON.stringify → setItem; catch quota/security → keep in-memory. Discrete favorite toggles persist immediately (platform lesson: discrete user state persists immediately, only continuous typing is debounced).
    - Expose: filtered list, favorites, recents, toggleFavorite, lastTopic.
  </persistence_adapter>
  <i18n>All UI chrome from tools.howto.* (ko/en): top-level title/description, search, topic labels, empty states, difficulty labels, reading-time template, share, breadcrumb, how-to, FAQ, code copy labels, mermaid fallback label. Guide title/summary/body come from markdown (guides.generated.json), NOT i18n messages. Reading-time uses `useLocale()`→Intl for number formatting; NEVER pass an i18n key into Intl.</i18n>
</core_functionality>

<error_handling>
  <build_time>
    - CRITICAL: bad content doesn't silently pass. Generator reports each violation (file path + field + reason) to stderr and exits non-zero → CI/build fails. Missing pair, empty body, dup slug, dangling related, or a referenced image file that doesn't exist → hard failure.
  </build_time>
  <search_no_results>Friendly empty state echoing query + "clear search"; list restores on clear.</search_no_results>
  <mermaid_render_fail>Caught locally in MermaidDiagram; original source fence stays visible; no throw to Error Boundary; console.error suppressed in production.</mermaid_render_fail>
  <code_copy_failure>Copy is secondary. clipboard → execCommand fail → silent (no false success). Success indicator only on real success.</code_copy_failure>
  <missing_image>Build-time validation prevents shipping a broken image reference. At runtime, an &lt;img&gt; onError hides the figure gracefully (no broken-image icon).</missing_image>
  <storage>
    <unavailable>Private mode/disabled → recents/favorites in-memory; hub/search/spokes fully work.</unavailable>
    <corrupt_blob>JSON/zod fail → start fresh.</corrupt_blob>
    <quota>setItem throw → keep in-memory; no user error.</quota>
  </storage>
  <error_boundary>Platform wraps tool; a render fault retries without shell crash.</error_boundary>
  <note>No first-party network calls; images are same-origin static assets.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent is SKY (var(--accent-sky) / var(--accent-sky-soft)) — this tool's identity within "dev". Intro icon tile, card focus/selected bar, topic badge default tint, favorite star (filled), related chips, spoke heading anchor markers.
    - CTAs (primary buttons: e.g., tab active, "Copy") stay brand honey-gold var(--brand). Accent = identity, not action.
    - Topic badges may use per-topic tints (within the sky-led identity) for visual scanning; maintain AA contrast.
  </accent_usage>
  <surfaces>Cards/spoke = var(--surface) + 1px var(--hairline). Code blocks var(--surface-sunken). Radii per DESIGN (card --radius-lg, code --radius-md). Soft brand-tinted shadows.</surfaces>
  <typography>H1 Gmarket Sans (clamp 28–40px). Spoke prose Pretendard 16px/1.7 for reading comfort (var(--text-secondary) body, var(--text) headings — reuse existing Markdown h2/h3/h4/p tokens). Code mono. Long-form prose measure ≤ ~72ch.</typography>
  <code_and_diagram>Code: dark-neutral surface-sunken with highlight.js token colors mapped to DESIGN-safe hues (AA on the sunken surface, both themes). Mermaid: theme 'default'(light)/'dark'(dark), fit within surface card, horizontal scroll if wide.</code_and_diagram>
  <motion>transform/opacity only: card hover translateY(-2px) 150ms, spoke content fade-in 150ms, star pop 200ms. --ease-out. All gated by prefers-reduced-motion. Mermaid output is static (no animation).</motion>
  <accessibility>Card link + star = labeled real elements; roving tabindex; copy/favorite status aria-live="polite"; ≥44px tap targets; focus-visible ring var(--focus-ring). Code blocks: language announced; copy button labeled. Images: meaningful alt (caption) or empty alt if decorative. Mermaid SVG has an accessible title/desc; source fence is the text alternative. AA contrast for code tokens both themes.</accessibility>
  <responsive>
    - Hub: 1/2/3-col grid at 320–767 / 768–1023 / ≥1024. Tabs scroll + snap narrow. No overflow (320 test).
    - Spoke: single centered column; code/mermaid/tables scroll within their own overflow-x container; page body never scrolls horizontally at 320px.
  </responsive>
  <atmosphere>Clean technical-docs feel: calm reading column, crisp code, clear diagrams. Inviting cards on the hub, focused reading on the spoke. Warm/clear Jurepi tone, not a sterile wiki.</atmosphere>
  <icons>lucide-react: BookOpen (registry card icon + intro), Search, Star/StarOff (favorite), Copy/Check (code copy), ArrowLeft (back), ArrowUpRight (related/external), Hash (heading anchor). Default 20px, stroke 1.75, currentColor.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input note="content is 1st-party markdown but defensive">
    - markdown-to-jsx `disableParsingRawHTML: true` PRESERVED — no raw HTML/script from markdown bodies ever renders. Text nodes are React-escaped.
    - Image sources restricted to same-origin `/images/howto/…` and https; other schemes dropped.
    - Link overrides keep external links target=_blank rel="noopener noreferrer" (existing).
    - Generator validates frontmatter with zod (type/required/length) and asset existence; unknown fields ignored.
    - highlight.js operates on plain text tokens only (no HTML eval). Mermaid `securityLevel:'strict'` (no click handlers / raw HTML in diagrams).
  </input>
  <clipboard>Code copy = user-initiated writeText of the block's own text; never reads clipboard; user-gesture handler only.</clipboard>
  <privacy>Favorites/recents localStorage-only, never sent. No analytics event includes guide body. No CSP change required (highlight.js/mermaid are bundled first-party, not remote scripts).</privacy>
  <content_integrity>Catalog is a build-time static asset (no remote fetch). Unit tests validate derivation, uniqueness, locale completeness, asset existence so no malformed guide ships.</content_integrity>
  <note>No secrets, no network, no 3rd-party storage.</note>
</security_considerations>

<advanced_functionality>
  <shared_renderer_extension>The three new capabilities (code highlight, Mermaid, rich images) live in the SHARED markdown module as opt-in props. Every existing tool that uses &lt;Markdown&gt; keeps its exact current output; only howto opts in. This is the "reuse, don't duplicate" mandate made concrete — one renderer, richer, for the whole platform.</shared_renderer_extension>
  <hub_spoke_discoverability>Each guide is a static, individually-indexable URL with TechArticle + BreadcrumbList JSON-LD and the full body in prerendered HTML — so "how to install claude code" is citable by search engines AND AI answer engines (GEO). The mermaid source and code text are in the prerender even before client hydration.</hub_spoke_discoverability>
  <reading_time>Estimated from body word count (READING_WPM=200); localized number via Intl. Purely derived; no stored value.</reading_time>
  <favorites_recents>Star pin + recent view (localStorage), unknown slugs auto-pruned — reduce repeat-search friction across visits.</favorites_recents>
  <keyboard_first>Hub "/" search, arrow navigate, Enter open, "f" favorite — mouse-free browse.</keyboard_first>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Markdown folder → hub + spoke auto-compose</description>
    <steps>
      1. install-claude-code.md + _en.md exist in content/howto/guides/.
      2. pnpm dev/build → generator runs → guides.generated.json has the merged record (ko/en title·summary·body).
      3. Visit /ko/tools/howto → hub renders "클로드 코드 설치하는 법" card (crawlable &lt;a&gt; to /ko/tools/howto/install-claude-code).
      4. Visit the spoke → full body renders (headings, prose).
      5. Add a new pair (issue-api-token) + rebuild → hub + a new spoke appear (no code edit; sitemap includes it).
      6. English-only or Korean-only file, empty body, dup slug, dangling related, or missing referenced image → generator reports file/field/reason and exits non-zero (build fails).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>The three renderers: image, Mermaid, code</description>
    <steps>
      1. A guide body with `![alt](/images/howto/…/step-1.png)` → spoke shows a bordered figure with the alt as caption, lazy-loaded.
      2. A ```mermaid flowchart block → renders as an SVG diagram; toggling theme re-renders in dark/light; with JS disabled the diagram SOURCE is visible in the prerendered HTML (view-source check).
      3. A ```bash and a ```ts block → syntax-highlighted with a language label; "Copy" copies the exact block text (success indicator); unknown language degrades to plaintext without crashing.
      4. Verify mermaid + highlight.js are code-split: the mermaid chunk loads only on this spoke, and NOT on /tools/howto (hub) or any other tool route; global shared JS unchanged.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Hub search, topic filter, favorites, recents, keyboard</description>
    <steps>
      1. Type "토큰" → hub narrows; result count aria-live announces.
      2. Click a topic tab (e.g., "setup") → only that topic; compose with search.
      3. Star a card ("f" or click) → "즐겨찾기" tab shows it; reload → persists (localStorage); unknown slugs pruned.
      4. Open two guides → "최근" tab lists them MRU.
      5. "/" focuses search; arrows move card focus; Enter navigates to spoke; axe pass, cards labeled, focus ring visible.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>i18n, share, SEO/GEO (prerender + JSON-LD)</description>
    <steps>
      1. /en hub + spokes → all chrome English; card shows English title; guide body English.
      2. Build prod → /ko|/en tools/howto (hub) and each /…/tools/howto/&lt;slug&gt; (spoke) have unique title/description/canonical/hreflang/OG, statically generated.
      3. Prerendered spoke HTML contains: H1, full prose, code text, mermaid source, exactly ONE TechArticle JSON-LD + ONE BreadcrumbList (url==canonical). Hub HTML: exactly ONE SoftwareApplication + ONE FAQPage + ONE ItemList (of guides).
      4. Spoke ShareButtons copy = the spoke's absolute entity URL (not the hub URL); X share includes the guide title.
      5. /en spoke shows no Korean leakage; reading-time number localized.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Robustness: reduced-motion, storage off, no regressions</description>
    <steps>
      1. prefers-reduced-motion → no card lift/pop; mermaid static (no animation).
      2. localStorage disabled → favorites/recents in-memory; hub/spoke fully usable, no error.
      3. Existing tools that use &lt;Markdown&gt; (new-word, bookmarks, dev-people, restaurant-map) render identically — visual regression + their unit/E2E suites unchanged (backward-compat proof).
      4. 320px: hub no horizontal overflow; spoke code/mermaid/tables scroll within their own container, page body does not.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <content_model>CRITICAL: drop `<slug>.md` + `<slug>_en.md` pair (+ any referenced images) in the content folder, rebuild, auto-reflect as a hub card + a static spoke with zero code change; generator validates pair/field/body/uniqueness/reference/asset and fails the build with a clear message on violation.</content_model>
  <renderers>CRITICAL: guide bodies render images (lazy, captioned), Mermaid diagrams (SVG, theme-aware, source fallback), and syntax-highlighted copyable code blocks — implemented as backward-compatible extensions to the SHARED &lt;Markdown&gt; component, with highlight.js + mermaid code-split (no global/other-route bundle growth).</renderers>
  <hub_spoke>Searchable/topic-filterable hub of crawlable guide cards + one statically-generated, individually-indexable spoke per guide × locale (generateStaticParams), body server-rendered outside any mounted gate; sitemap includes all spokes with hreflang + updated lastmod.</hub_spoke>
  <reuse>No duplicate renderer, no duplicate collection pipeline: reuses generate-* generator pattern, lib/seo hub/spoke helpers, favorites/recents pattern, ShareButtons, i18n contract; the ONLY net-new code is the three markdown capabilities + one-tool wiring.</reuse>
  <functionality>Seed ≥6 bilingual guides incl. install-claude-code + issue-api-token; localStorage favorites + recents (prune unknown, work when absent).</functionality>
  <user_experience>Hub search/filter instant; readable spoke reading column; ≥44px targets; visible focus; SPA hub (no route reload on browse), spoke = shareable URL.</user_experience>
  <technical_quality>lib/howto/* pure ≥ 80% unit coverage (schema/merge/slug/catalog/search/favorites); generator validation tests (pair-missing, dup-slug, dangling-related, empty-body, missing-image → fail); new markdown component tests (code highlight, mermaid fallback, image caption); TS 0 errors; &lt;800 lines/file; catalog + highlight.js + mermaid code-split.</technical_quality>
  <visual_design>DESIGN.md compliant; sky identity + brand honey-gold CTA; real tokens only (no phantom tokens); text-node render only (raw HTML disabled).</visual_design>
  <accessibility>Full keyboard hub (roving, "/", Enter, "f", Esc); aria-live state; labeled buttons/links; code/diagram accessible names; motion-respect; WCAG 2.1 AA.</accessibility>
  <performance>Hub within platform JS budget (highlight.js/mermaid NOT in hub or shared chunk); spoke mermaid chunk lazy; CLS unaffected (cover image aspect-reserved, ad height platform-reserved); LCP < 2.5s.</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). `prebuild`/`predev` run generate-howto.mjs to freshen guides.generated.json. Hub /[locale]/tools/howto pre-rendered by platform generateStaticParams (registry status "live"); spokes /[locale]/tools/howto/[guide] pre-rendered by the spoke route's own generateStaticParams over the catalog. highlight.js + mermaid ship as code-split chunks loaded only where needed.</note>
  <generated_artifact>guides.generated.json: commit for reproducibility (deterministic generator; diff shows content review), regenerated by predev/prebuild. It carries raw markdown bodies (larger than new-word's structured catalog) — keep it code-split to this tool's routes so it never enters the global i18n/JS bundle.</generated_artifact>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'dev' category + 'sky' accent already exist; no ToolCategory/AccentColor change.
    {
      id: 'howto',
      slug: 'howto',
      category: 'dev',
      icon: 'BookOpen',          // lucide-react
      accent: 'sky',
      status: 'live',            // 'coming_soon' until module complete
      isNew: true,
      order: 30,                 // tune within dev order sequence
      keywords: ['하우투','가이드','설치','설정','how to','howto','guide','tutorial','클로드 코드','claude code','토큰 발급','api token','mermaid','다이어그램','코드블록','markdown','문서','매뉴얼','walkthrough','setup'],
    },
    ```
    Also add: slug→component branch (&lt;Howto/&gt;) + generateMetadata branch in the hub tool route; the spoke route folder tools/howto/[guide]/page.tsx (generateStaticParams + generateMetadata via buildToolEntityMetadata + TechArticle/BreadcrumbList JSON-LD); a content/howto import + traversal block in src/app/sitemap.ts; and top-level tools.howto.title/description in i18n.
  </platform_registry_change>
  <shared_markdown_extension note="backward-compatible — this is the crux">
    - Add opt-in props to &lt;Markdown&gt;: `enableCodeHighlight`, `enableMermaid`, `enableRichImages` (all default false).
    - When false (all existing callers), the override map is EXACTLY today's (verified by keeping current tests green + a visual-regression diff of new-word/bookmarks/dev-people).
    - When true, swap the `code`/`pre` override to &lt;CodeBlock&gt; (detect ```mermaid → &lt;MermaidDiagram&gt; instead), and `img` override to &lt;MarkdownImage&gt;.
    - highlight.js and mermaid imported via dynamic import inside those child components so tree-shaking/code-splitting keeps them off other routes.
  </shared_markdown_extension>
  <critical_paths>
    1. Content pipeline: markdown scan → gray-matter (frontmatter + RAW body) → zod → mergePair → validate (incl. asset existence) → guides.generated.json. Build fails on violation.
    2. Shared-renderer extension: code highlight + mermaid + images as opt-in, backward compatible, code-split. Prove no regression on existing tools + no bundle bloat on other routes.
    3. Spoke SSR: body rendered outside mounted gate (GEO); TechArticle + BreadcrumbList JSON-LD single-owner; sitemap wired.
    4. Hub crawlable cards (visible &lt;a&gt;, not display:none) + spoke navigation + favorites/recents shared store.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/howto/{schema,slug,merge,catalog,search,favorites}.ts Vitest (RED→GREEN): frontmatter schema (incl. body non-empty), slug derivation/uniqueness, canonical merge, related integrity, reading time, search, favorites/recents immutables, pruneUnknown.
    2. scripts/generate-howto.mjs + content/howto/{_TEMPLATE,_TEMPLATE_en,README} + guides/ seed (install-claude-code, issue-api-token, git-worktree, mcp-server-setup, +2) with images under public/images/howto/. Generator validation tests (pair-missing, dup-slug, dangling, empty-body, missing-image → fail). predev/prebuild wire.
    3. Shared markdown extension: CodeBlock + MermaidDiagram + MarkdownImage + opt-in props on Markdown. Component tests (highlight tokens present, copy label, mermaid source fallback, image caption). Keep existing Markdown tests green; add code-split assertion.
    4. tools.howto.* messages (ko/en): top-level title/description + search/tabs/topics/empty/difficulty/reading-time/share/breadcrumb/howto/faq/code-copy/mermaid-fallback.
    5. useHowto hook (dynamic catalog import + localStorage favorites/recents + in-memory fallback).
    6. Hub: GuideSearch + TopicTabs + GuideList/GuideCard (crawlable anchors, roving tabindex, states) + empty states + HowtoIntro/HowTo/Faq/StructuredData.
    7. Spoke route + HowtoSpoke (breadcrumb, header, cover, Markdown body with all three enabled, related, ShareButtons, back) + lib/seo techArticleJsonLd + sitemap wiring.
    8. Registry status→live; hub slug→component + generateMetadata; spoke generateStaticParams/generateMetadata; E2E scenarios 1–5 (esp. #1 folder→hub+spoke, #2 three renderers + code-split, #4 prerender JSON-LD); visual regression 320/768/1024 both themes; backward-compat check on existing Markdown consumers.
  </recommended_implementation_order>
  <seed_guides note="initial content — author fine-tunes but start with these slug/topic; each must exercise a code block; ≥1 uses images; ≥1 uses a mermaid diagram">
    - setup: install-claude-code (클로드 코드 설치하는 법 — code + mermaid flow + screenshot), mcp-server-setup (MCP 서버 설정하는 법).
    - api: issue-api-token (API 토큰 발급하는 법 — steps + screenshots).
    - git: git-worktree (git worktree 사용하는 법 — code + mermaid).
    - cli/deploy: 2 more of the operator's choosing.
  </seed_guides>
  <generator_sketch>
    ```javascript
    // scripts/generate-howto.mjs (outline) — deterministic, no Date/random
    import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
    import matter from 'gray-matter';
    // 1) guides/ scan, exclude '_' prefix, group by base filename (ko/en pairs)
    // 2) const { data, content } = matter(file) → zod GuideFileFront.parse(data); assert content.trim()
    // 3) mergePair(ko{front,body}, en{front,body}): canonical rule, resolveSlug
    // 4) validate: pair-integrity / required-fields+body / slug-unique / related-exist / asset-exists (coverImage + body /images/howto/… via existsSync in public) → errors[]
    // 5) errors.length ? (stderr + process.exit(1)) : sorted-write(guides.generated.json)  // record.ko.body = raw markdown
    ```
  </generator_sketch>
  <testing_strategy>Pure Vitest ≥80% (schema/merge/slug/catalog/search/favorites); generator validation fixtures (pair-missing/dup/dangling/empty-body/missing-image → fail); new markdown component tests (CodeBlock highlight + copy label, MermaidDiagram source fallback + no-throw on bad diagram, MarkdownImage caption/lazy); existing Markdown tests unchanged; component catalog-injected mocks; E2E 1–5 (esp. #1 folder→hub+spoke, #2 three renderers + code-split verification, #4 prerender JSON-LD single-owner); clipboard/localStorage jsdom-isolated.</testing_strategy>
  <tool_usage>Reader visual-gate: 320/768/1024 screenshots both themes; hub no overflow; spoke code/mermaid render + horizontal-scroll containment; mermaid dark/light re-render; prerendered HTML JSON-LD (TechArticle/BreadcrumbList on spoke, SoftwareApplication/FAQPage/ItemList on hub, url==canonical); code-split verification (mermaid/highlight.js chunk absent from hub + other routes); backward-compat visual diff on new-word/bookmarks/dev-people.</tool_usage>
</key_implementation_notes>

</project_specification>
```
