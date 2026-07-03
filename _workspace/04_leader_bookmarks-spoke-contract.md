# 즐겨찾기(bookmarks) 허브+스포크 리팩터링 — 계약 (단일 소스)

리더 확정. 작업 트리: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr` (메인). **방금 완료된 rankings 스포크와 동일 패턴** — rankings 산출물(`src/app/[locale]/tools/rankings/[ranking]/page.tsx`, `src/components/tools/rankings/RankingsSpoke.tsx`)을 레퍼런스로.

## 목표
bookmarks를 허브+스포크로. 허브(`/tools/bookmarks`, SPA) 유지 + 각 토픽을 정적 스포크 `/{locale}/tools/bookmarks/{slug}`로 분리(**8토픽×ko/en=16 스포크**). 스포크=고유 메타/canonical/hreflang + **게이트 밖 SSR**(설명+섹션별 링크) + ItemList+BreadcrumbList JSON-LD + 허브↔스포크 링크.

- 카탈로그: `src/components/tools/bookmarks/data/bookmarks.generated.json` (8토픽).
- 엔티티: `MergedTopic{slug, ko/en:{title, description, sections[{heading, links[{label,url,description?,image?}]}]}}`.
- **⚠️ `src/lib/bookmarks/catalog.ts`는 상태보관 모듈**(`let _catalog`+`initCatalog`+`byId`). 스포크 라우트에서 `byId`를 쓰면 `initCatalog` 미호출 시 항상 null(CLAUDE.md 실제 결함). **라우트는 무상태 `CATALOG.find(t=>t.slug===topic)`로 조회하라**(initCatalog 의존 금지).
- 라우트 우선순위: 정적 `bookmarks/` 폴더가 `[slug]`보다 우선. `/tools/bookmarks`(허브)는 `[slug]`로, `/tools/bookmarks/egovframe-standard`는 새 `bookmarks/[topic]`로. 충돌 없음.
- **seo 헬퍼 전부 존재**: `absoluteEntityUrl`·`buildToolEntityMetadata`·`itemListJsonLd`·`breadcrumbListJsonLd`·`absoluteToolUrl`. 신규 만들지 말 것.

## 계약 A — 스포크 라우트 (owner: platform-engineer)
새 `src/app/[locale]/tools/bookmarks/[topic]/page.tsx` — 서버 컴포넌트. rankings `[ranking]/page.tsx` 미러.
```
import CATALOG from bookmarks.generated.json
const findTopic = (slug) => (CATALOG as MergedTopic[]).find(t=>t.slug===slug) ?? null   // 무상태
generateStaticParams(): [ko,en] × 8 slug = 16
generateMetadata({params}): {locale,topic}=await params; const tp=findTopic(topic); if(!tp) return {};
   const t=await getTranslations({locale,namespace:'tools.bookmarks'});
   title=`${tp[locale].title} ${t('spoke.metaTitleSuffix')}`;
   description=tp[locale].description.slice(0,155);
   return buildToolEntityMetadata({locale, toolSlug:'bookmarks', entitySlug:topic, title, description});
default({params}): setRequestLocale; tp=findTopic(topic); if(!tp) notFound();
   동일 컨테이너 셸.
   서버 JSON-LD 2종: itemListJsonLd({ name:tp[locale].title, url:absoluteEntityUrl(locale,'bookmarks',topic),
       items: tp[locale].sections.flatMap(s=>s.links).map((l,i)=>({position:i+1, name:l.label, description:l.description??l.label, url:l.url})) })
     + breadcrumbListJsonLd([{name:t('spoke.breadcrumbHome'),url:`${siteUrl}/${locale}`},
       {name:t('intro.title'),url:absoluteToolUrl(locale,'bookmarks')},
       {name:tp[locale].title,url:absoluteEntityUrl(locale,'bookmarks',topic)}])  → <script type=application/ld+json> ×2
   본문: <BookmarksSpoke topic={tp} locale={locale} />
```
- getTranslations(비동기 서버). mounted 게이트 금지.
- 사이트맵 `src/app/sitemap.ts`: bookmarks 16 스포크(`absoluteEntityUrl`, ko+en) 추가. 기존 유지.

## 계약 B — 스포크 본문 (owner: ui-engineer)
새 `src/components/tools/bookmarks/BookmarksSpoke.tsx` — 서버 컴포넌트('use client' 없음). **동기 `useTranslations('tools.bookmarks')`**(비동기 getTranslations 금지 — vitest 렌더 불가, rankings에서 교훈). props `{ topic: MergedTopic; locale: 'ko'|'en' }`. 렌더:
1. Breadcrumb `<nav aria-label>` `data-testid="bookmarks-spoke-breadcrumb"`: 홈(`/{locale}`)›즐겨찾기(`/{locale}/tools/bookmarks`, `t('intro.title')`)›`{topic[locale].title}`.
2. `<h1>{topic[locale].title}</h1>`.
3. `<p>{topic[locale].description}</p>`.
4. **`<TopicSections sections={topic[locale].sections} locale={locale} />`** (기존 재사용 — 섹션별 외부 링크, 게이트 밖 SSR로 프리렌더에 링크 실림).
5. back 링크 `<a href="/{locale}/tools/bookmarks" data-testid="bookmarks-spoke-back-to-hub">{t('spoke.backToHub')}</a>`.
- mounted 게이트 없음. TopicSections/LinkRow는 클라 자식이어도 서버 자식으로 SSR됨 — 그대로.
- 테스트 `BookmarksSpoke.test.tsx`: 실 카탈로그 + 실 메시지(NextIntlClientProvider, `messages={... as never}`). breadcrumb·H1·description·섹션 링크 label/href·back href 단언. (rankings `RankingsSpoke.test.tsx` 미러.)

## 계약 C — 허브 카드 앵커화 (owner: ui-engineer) — TermCard/RankingCard 미러
`src/components/tools/bookmarks/TopicCard.tsx`: 카드 루트를 **가시 `<a href="/{locale}/tools/bookmarks/{topic.slug}">`** 로. onClick 평범한 클릭이면 `preventDefault()`→기존 `onSelect()`(수식/보조 클릭 통과). 즐겨찾기 버튼=앵커 밖 형제(button-in-anchor 무효). **가시 콘텐츠 hidden 래핑 금지.** 기존 `data-testid`·선택 하이라이트 유지. TopicCard.test 갱신(있으면): 앵커 href·`not.toHaveClass('hidden')`·plain click preventDefault→onSelect·즐겨찾기 앵커 밖.

## 계약 D — 허브 게이트 제거 (owner: ui-engineer)
`src/components/tools/bookmarks/Bookmarks.tsx`: **로컬 `mounted` 게이트 제거**(`const [mounted,setMounted]=useState(false)` + 그 useEffect + `{mounted && (...)}` 언랩) → 카드 그리드(+스포크 앵커)가 프리렌더 HTML에 SSR. `useBookmarksCatalog`는 favorites/recents 빈 초기값 + useEffect 로드라 SSR-safe(rankings와 동일 검증됨). **훅 내부의 reducer `state.mounted`(persist 게이트)는 건드리지 말 것** — Bookmarks.tsx 로컬 게이트만.

## 계약 E — i18n (owner: ui-engineer, ko.json·en.json 동시)
`tools.bookmarks`에 신규만(기존 `intro.title`·`detail.*` 재사용):
| 키 | ko | en |
|----|----|----|
| `spoke.metaTitleSuffix` | `— 큐레이션 링크 모음 \| Jurepi` | `— curated links \| Jurepi` |
| `spoke.breadcrumbHome` | `홈` | `Home` |
| `spoke.backToHub` | `← 전체 토픽 보기` | `← Browse all topics` |

## 게이트 (리더 재실행)
- `pnpm tsc`(0) · `pnpm test`(전체 0 failed, BookmarksSpoke 포함) · `pnpm build`(16 신규+허브 유지) · **전체 E2E**(기존 bookmarks E2E 회귀 0 — 카드 앵커·게이트 제거로 기존 스펙 깨지면 갱신 + 신규 스포크 스펙) · 프리렌더 HTML(`out/ko/tools/bookmarks/egovframe-standard.html`: H1·섹션 링크·ItemList+BreadcrumbList url==canonical·hreflang; 허브에 8 스포크 앵커) · 라이브 a11y 후 배포.
- 비타협: 게이트 밖 SSR·무상태 조회·url 단일 소스·**카드 hidden 금지**·동기 useTranslations.
