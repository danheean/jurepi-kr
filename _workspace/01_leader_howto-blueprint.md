# Howto (하우투 가이드) — Build Blueprint & Contracts

WORKTREE (absolute, all agents operate ONLY here): `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr-howto`
Branch: `dev/howto`. SPEC: `docs/services/dev/howto/SPEC.md`. Deps already installed incl. `highlight.js@11.11.1`, `mermaid@11.16.0`.

Tool identity: id/slug `howto`, category `dev`, accent `sky`, icon `BookOpen`, order `31`, status `live` (set `coming_soon` until module done, flip at end).
Pattern: content-collection **hub + spoke** — mirror `new-word` (lib + generator + spoke route) and `dev-people`. Reuse everything; the ONLY net-new is the shared-Markdown extension + one-tool wiring.

Reference files to read before implementing:
- Generator: `scripts/generate-glossary.mjs`
- Lib: `src/lib/new-word/{schema,merge,slug,catalog,search,favorites}.ts`
- Spoke route: `src/app/[locale]/tools/new-word/[term]/page.tsx`
- Hub route branch: `src/app/[locale]/tools/[slug]/page.tsx` (see new-word / url-encoder branches)
- SEO helpers: `src/lib/seo.ts` (`absoluteEntityUrl`, `buildToolEntityMetadata`, `breadcrumbListJsonLd`, `absoluteToolUrl`, `softwareApplicationJsonLd`, `faqPageJsonLd`, `itemListJsonLd`, `buildToolMetadata`)
- Sitemap: `src/app/sitemap.ts` (per-collection block)
- Shared markdown (to extend): `src/components/markdown/{Markdown.tsx,index.ts,Markdown.test.tsx}`

---

## LAYER DECOMPOSITION (clean architecture)

- **Domain/usecase (pure, no react/next):** `src/lib/howto/*` + `scripts/generate-howto.mjs` + `content/howto/**`.
- **Shared adapter (renderer):** `src/components/markdown/*` — extend, backward-compatible.
- **Tool adapter (UI):** `src/components/tools/howto/*` (hub SPA + spoke body + SEO sections).
- **Framework:** `src/app/[locale]/tools/howto/[guide]/page.tsx` (spoke route) + `[slug]/page.tsx` hub branch + `sitemap.ts` + `lib/seo.ts` helper + i18n + `public/llms.txt`.

---

## CONTRACT 1 — Data shapes (CANONICAL; do not rename)

`GuideFileFront` (per-file frontmatter, zod):
```
title: string (min 1)         # locale content
summary: string (min 1)       # locale content, plain text
slug?: string /^[a-z0-9-]+$/  # KO-file canonical
topic?: 'setup'|'ai-tools'|'git'|'api'|'cli'|'deploy'   # KO-file canonical
tags?: string[]               # KO-file canonical
order?: number (int)          # KO-file canonical, default 999
updated?: string              # ISO date 'YYYY-MM-DD', KO-file canonical
difficulty?: 'beginner'|'intermediate'|'advanced'  # KO-file canonical
coverImage?: string           # '/images/howto/...'  KO-file canonical
related?: string[]            # KO-file canonical (slugs)
```
Body (markdown after frontmatter) is REQUIRED non-empty per locale.

`MergedGuide` (catalog record → `guides.generated.json` item):
```
slug: string
topic: 'setup'|'ai-tools'|'git'|'api'|'cli'|'deploy'
tags: string[]
order: number
updated?: string
difficulty?: 'beginner'|'intermediate'|'advanced'
coverImage?: string
related: string[]
ko: { title: string; summary: string; body: string }
en: { title: string; summary: string; body: string }
```
`guides.generated.json` = `MergedGuide[]` (a top-level array, like terms.generated.json — NOT wrapped in an object). Output path: `src/components/tools/howto/data/guides.generated.json`.

`HowtoStore` (localStorage `jurepi-howto`): `{ version:1, favorites:string[], recents:string[], meta:{ lastTopic?:string; createdAt:number } }`. RECENTS_MAX=20.

Catalog access = STATELESS: `allGuides(catalog)`, `byId(catalog, slug)`, `byTopic(catalog, topic)`, `topics(catalog)`, `readingTime(body): number` (words / 200, ceil, min 1). Spoke route imports the JSON and calls `byId(catalog, slug)` — NO stateful module init.

Search: `filterGuides(guides, query, locale)` — matches ko.title/en.title/ko.summary/en.summary/tags/topic; normalize trim+NFC+lowercase+strip diacritics. Body NOT searched.

Favorites (immutable): `toggleFavorite(list, slug)`, `pushRecent(list, slug, max=20)`, `pruneUnknown(slugs, catalog)`.

---

## CONTRACT 2 — Extended shared `<Markdown>` API (backward-compatible)

Add three OPTIONAL props (all default `false` → existing callers byte-identical):
```tsx
<Markdown
  enableCodeHighlight?  // ```lang fenced blocks → <CodeBlock> (highlight.js tokens + copy button)
  enableMermaid?        // ```mermaid fences → <MermaidDiagram> (dynamic import mermaid, SVG, source fallback)
  enableRichImages?     // <img> → <MarkdownImage> (lazy, max-w-full, caption from alt, figure)
>{markdownString}</Markdown>
```
- When all false: override map is EXACTLY today's. Keep `Markdown.test.tsx` green unchanged.
- New siblings: `CodeBlock.tsx`, `MermaidDiagram.tsx`, `MarkdownImage.tsx`. Export nothing new from `index.ts` that breaks existing (`{ Markdown, MarkdownInline }` stays).
- `disableParsingRawHTML: true` preserved.
- highlight.js: register curated langs only (bash, shell, ts, tsx, js, javascript, typescript, json, python, yaml, diff, http, sql, plaintext). Import via the `highlight.js/lib/core` + explicit `registerLanguage` so bundle is bounded; dynamic import inside CodeBlock so it's code-split off other routes.
- mermaid: `const mermaid = (await import('mermaid')).default` inside MermaidDiagram `useEffect` ONLY when a mermaid block exists. `initialize({ startOnLoad:false, securityLevel:'strict', theme: <from data-theme> })`, then `render()`. On error/JS-off keep the raw source in a `<pre>` (SSR-visible). Re-render on theme change (observe `data-theme` on documentElement).
- Copy button = client; success check only on real clipboard success (no false toast).
- CodeBlock language label localized via a prop or hardcoded uppercase lang token (label text like "BASH"); copy button aria-label passed as prop from the consumer (howto passes t('code.copy')).

Spoke usage: `<Markdown enableCodeHighlight enableMermaid enableRichImages className="...">{item[locale].body}</Markdown>` rendered UNCONDITIONALLY (no mounted gate) so prose/code/mermaid-source are in prerender HTML.

---

## CONTRACT 3 — i18n key contract `tools.howto.*` (ko / en SEPARATE — never pipe-join)

Author BOTH `src/i18n/messages/ko.json` and `en.json` under `tools.howto`. Top-level `title`/`description` REQUIRED (home card/footer/search consume via searchable-tools).

| key | ko | en |
|---|---|---|
| title | 하우투 가이드 | How-To Guides |
| description | 클로드 코드 설치, 토큰 발급 같은 실전 가이드를 이미지·다이어그램·코드와 함께 단계별로 안내합니다. | Step-by-step guides — installing Claude Code, issuing API tokens — with images, diagrams, and code. |
| intro.eyebrow | 개발 도구 | DEV TOOL |
| intro.title | 하우투 가이드 | How-To Guides |
| intro.lead | 클로드 코드 설치, 토큰 발급 같은 실전 가이드를 이미지·다이어그램·코드와 함께 단계별로 읽어보세요. | Read practical guides — installing Claude Code, issuing tokens — step by step, with images, diagrams, and code. |
| search.placeholder | 제목·주제·태그로 검색 (예: 클로드 코드, 토큰, git) | Search by title, topic, or tag (e.g. Claude Code, token, git) |
| search.label | 가이드 검색 | Search guides |
| search.resultCount | 결과 {count}개 | {count} results |
| search.clear | 지우기 | Clear |
| tabs.all | 전체 | All |
| tabs.favorites | 즐겨찾기 | Favorites |
| tabs.recent | 최근 | Recent |
| topics.setup | 설치·설정 | Setup |
| topics.ai-tools | AI 도구 | AI Tools |
| topics.git | Git | Git |
| topics.api | API | API |
| topics.cli | CLI | CLI |
| topics.deploy | 배포 | Deploy |
| difficulty.beginner | 입문 | Beginner |
| difficulty.intermediate | 중급 | Intermediate |
| difficulty.advanced | 고급 | Advanced |
| card.favorite | 즐겨찾기 추가 | Add to favorites |
| card.unfavorite | 즐겨찾기 해제 | Remove from favorites |
| card.updated | 업데이트 {date} | Updated {date} |
| empty.noResults | '{query}'에 해당하는 가이드가 없어요 | No guides match '{query}' |
| empty.noFavorites | 별을 눌러 자주 보는 가이드를 저장하세요 | Tap the star to save guides you use often |
| empty.noRecent | 최근 본 가이드가 여기에 모여요 | Guides you've read appear here |
| spoke.readingTime | {minutes}분 읽기 | {minutes} min read |
| spoke.updated | 업데이트 {date} | Updated {date} |
| spoke.related | 관련 가이드 | Related guides |
| spoke.backToHub | 모든 가이드 | All guides |
| spoke.breadcrumbHome | 홈 | Home |
| spoke.metaTitleSuffix | 하우투 가이드 | How-To Guide |
| code.copy | 코드 복사 | Copy code |
| code.copied | 복사됨 | Copied |
| mermaid.sourceLabel | 다이어그램 소스 | Diagram source |
| howto.title | 하우투 가이드 사용법 | How to use How-To Guides |
| howto.items | (3 answer-first steps, ko) | (3 answer-first steps, en) |
| faq.title | 자주 묻는 질문 | Frequently asked questions |
| faq.items | (≥3 Q/A, ko) — use `{ q, a }` keys | (≥3 Q/A, en) — `{ q, a }` |

`howto.items`: array of `{ title, body }` (3 steps). `faq.items`: array of `{ q, a }` (≥3). Reading-time number formatted via `useLocale()`→plain number; the template `{minutes}` is filled by t(). Never pass an i18n key into Intl.

---

## SEO / GEO (platform + seo-geo)

- Hub (`ToolContent` branch, all SSR outside mounted gate):
  ```
  <HowtoStructuredData />   // SoftwareApplication + ItemList(of guides)
  <HowtoIntro />            // H1 + lead
  <Howto />                 // client SPA (dynamic import)
  <HowtoHowTo />            // answer-first
  <HowtoFaq />              // FAQPage JSON-LD (SINGLE owner of FAQPage)
  ```
- Spoke route emits: `TechArticle` + `BreadcrumbList` JSON-LD (both `<script>` in body, url==canonical). Add `techArticleJsonLd({ headline, description, url, datePublished?, inLanguage })` to `lib/seo.ts` (reuse pattern of definedTermJsonLd). ShareButtons with `url={absoluteEntityUrl(locale,'howto',slug)}` + `title={item[locale].title}`.
- `buildToolEntityMetadata` for spoke generateMetadata; `buildToolMetadata` for hub generateMetadata.
- sitemap: add `howto` collection block using `absoluteEntityUrl(locale,'howto',g.slug)`, `lastModified: g.updated` when present.
- `public/llms.txt`: add a howto line.

---

## SEED CONTENT (domain-engineer authors; ≥6 pairs)

Each guide MUST have a ```lang code block. ≥1 guide MUST embed an image (`/images/howto/<slug>/...`). ≥1 guide MUST embed a ```mermaid diagram. Put placeholder images (simple valid PNGs) under `public/images/howto/<slug>/`.
- setup: `install-claude-code` (code + mermaid flowchart + 1 screenshot), `mcp-server-setup` (code)
- api: `issue-api-token` (steps + 1 screenshot)
- git: `git-worktree` (code + mermaid)
- cli: `claude-code-slash-commands` (code)
- deploy: `deploy-cloudflare-pages` (code)
Frontmatter must be real & valid; bodies real Korean/English prose. `related` only real slugs.

---

## ACCEPTANCE GATES (leader re-runs)
- `pnpm exec tsc --noEmit` → 0 errors.
- `pnpm exec vitest run src/lib/howto src/components/markdown src/components/tools/howto` → domain ≥90%, all pass. Existing `Markdown.test.tsx` still green.
- `node scripts/generate-howto.mjs` → success; deliberate broken fixture (missing pair / empty body / dup slug / dangling related / missing image) → exit 1.
- `pnpm build` (static export) green; hub + all spokes prerendered.
- E2E full suite `npx playwright test` → 0 failed (attribute pre-existing failures if any).
- Leader visual gate: hub 320/768/1024, spoke renders image+mermaid+highlighted code, ko/en no leakage, prerender JSON-LD (TechArticle/BreadcrumbList on spoke; SoftwareApplication/FAQPage/ItemList on hub, url==canonical), mermaid/highlight.js code-split (absent from hub/other routes).
- Backward-compat: new-word/bookmarks/dev-people render unchanged.
