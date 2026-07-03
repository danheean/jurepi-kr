# 별별 랭킹(rankings) 허브+스포크 리팩터링 — 계약 (단일 소스)

리더 확정. 작업 트리: `/Users/jurepi/Work/Jurepi-Company/Jurepi.kr` (메인). new-word 스포크와 **완전히 같은 패턴** — new-word 산출물을 레퍼런스로 삼아라.

## 목표
rankings를 허브+스포크로. 허브(`/tools/rankings`, SPA) 유지 + 각 랭킹을 정적 스포크 `/{locale}/tools/rankings/{slug}`로 분리(**2랭킹×ko/en=4 스포크**). 스포크=고유 메타/canonical/hreflang + **게이트 밖 SSR**(전체 순위표·출처 배너) + ItemList+BreadcrumbList JSON-LD + 허브↔스포크 링크. 원칙: `.claude/skills/seo-geo-optimization/SKILL.md`의 "허브+스포크" 절.

- 카탈로그: `src/components/tools/rankings/data/rankings.generated.json` (2개: `llm-agent-leaderboard`, `tiobe-programming-languages`).
- 엔티티: `MergedRanking{slug, field, asOfDate, sourceUrl?, ko/en:{title, sourceNote, items[{rank,name,description,link?,imageUrl?}]}}`.
- 조회: `byId(catalog, slug)` 무상태 (`src/lib/rankings/catalog.ts`).
- 라우트 우선순위: 정적 `rankings/` 폴더는 `[slug]`보다 우선. `/tools/rankings`(허브)는 그대로 `[slug]`로, `/tools/rankings/tiobe-programming-languages`는 새 `rankings/[ranking]`로 해석. 충돌 없음(new-word와 동일).
- **seo 헬퍼는 전부 이미 존재**: `absoluteEntityUrl`·`buildToolEntityMetadata`·`breadcrumbListJsonLd`·`itemListJsonLd`. 신규 seo 헬퍼 만들지 말 것.

## 계약 A — 스포크 라우트 (owner: platform-engineer)
새 파일 `src/app/[locale]/tools/rankings/[ranking]/page.tsx` — **서버 컴포넌트**. new-word `[term]/page.tsx`를 레퍼런스로.
```
import CATALOG from rankings.generated.json; byId from '@/lib/rankings/catalog'
generateStaticParams(): [ko,en] × CATALOG.slug → [{locale, ranking: slug}]   // 4개
generateMetadata({params}): const {locale, ranking}=await params; const r=byId(CATALOG,ranking); if(!r) return {};
   const t=await getTranslations({locale,namespace:'tools.rankings'});
   const title=`${r[locale].title} ${t('spoke.metaTitleSuffix')}`;
   const description=`${r[locale].title} 전체 순위. 출처: ${r[locale].sourceNote} (${t('spoke.asOfPrefix')} ${r.asOfDate}).`.slice(0,155);
   return buildToolEntityMetadata({locale, toolSlug:'rankings', entitySlug:ranking, title, description});
default export({params}): setRequestLocale(locale); const r=byId(CATALOG,ranking); if(!r) notFound();
   [slug]/page.tsx와 동일 컨테이너 셸.
   서버 JSON-LD 2종: itemListJsonLd({ name:r[locale].title, url:absoluteEntityUrl(locale,'rankings',ranking),
       items: r[locale].items.map(i=>({position:i.rank, name:i.name, description:i.description, url:i.link})) })
     + breadcrumbListJsonLd([{name:t('spoke.breadcrumbHome'),url:`${siteUrl}/${locale}`},
       {name:t('intro.title'),url:absoluteToolUrl(locale,'rankings')},
       {name:r[locale].title,url:absoluteEntityUrl(locale,'rankings',ranking)}])
     → 각각 <script type="application/ld+json">.
   본문: <RankingsSpoke ranking={r} locale={locale} />   // 계약 B
```
- `getTranslations`(비동기 서버). **mounted 게이트 금지.**
- 사이트맵 `src/app/sitemap.ts`: rankings 4 스포크 URL(`absoluteEntityUrl`, ko+en) 추가. 기존 항목 유지.

## 계약 B — 스포크 본문 컴포넌트 (owner: ui-engineer)
새 파일 `src/components/tools/rankings/RankingsSpoke.tsx` — **서버 컴포넌트('use client' 없음)**. `RankingDetail.tsx`를 레퍼런스(단, 닫기 버튼 없음·헤더=h1). `useTranslations('tools.rankings')`.
props `{ ranking: MergedRanking; locale: 'ko'|'en' }`. 렌더:
1. **Breadcrumb `<nav aria-label>` `data-testid="rankings-spoke-breadcrumb"`**: 홈(`/{locale}`) › 별별 랭킹(`/{locale}/tools/rankings`, 라벨 `t('intro.title')`) › `{ranking[locale].title}`.
2. **H1** `{ranking[locale].title}`.
3. **`<ProvenanceBanner asOfDate={ranking.asOfDate} sourceNote={ranking[locale].sourceNote} sourceUrl={ranking.sourceUrl} />`** (기존 재사용).
4. **`<RankingTable ranking={ranking} />`** (기존 재사용 — 전체 순위표, 게이트 밖 SSR로 프리렌더에 표 실림).
5. **허브 back 링크** `<a href="/{locale}/tools/rankings" data-testid="rankings-spoke-back-to-hub">{t('spoke.backToHub')}</a>`.
- **게이트 없음.** RankingTable/ProvenanceBanner는 클라이언트여도 서버 컴포넌트 자식으로 SSR됨(프리렌더 표 포함) — 그대로 사용.
- 컴포넌트 테스트 `RankingsSpoke.test.tsx`: **실 카탈로그 + 실 메시지**(NextIntlClientProvider). breadcrumb·H1·표의 항목명·출처·back 링크 href 단언. **provider messages 타입은 sibling 테스트 관례(`messages={messagesKo as any}` 또는 전체 카탈로그 캐스트)**를 따라 tsc 유니온 에러 회피(new-word에서 겪음).

## 계약 C — 허브 카드 크롤 앵커화 (owner: ui-engineer)
`src/components/tools/rankings/RankingCard.tsx` 수정. **⚠️ new-word에서 카드 콘텐츠를 `hidden` 앵커로 감싸 화면이 비는 결함 재발 방지 — 지금 고쳐진 `TermCard.tsx`를 정확히 미러하라.**
- 카드 루트를 **가시 `<a href="/{locale}/tools/rankings/{ranking.slug}">`** 로. `className`에 `block relative ... no-underline` + 기존 카드 스타일. **가시 콘텐츠를 `hidden`/`display:none`으로 감싸지 말 것.**
- `onClick`: 수식/보조 클릭(`metaKey||ctrlKey||shiftKey||altKey||button!==0`)이면 통과(새 탭), 아니면 `e.preventDefault()`→기존 `onSelect()`(SPA 상세 패널 유지).
- 즐겨찾기 버튼은 **앵커 밖 형제**(button-in-anchor 무효): `relative` 래퍼에 앵커+버튼 형제, 버튼 `absolute`, `onClick`에 `preventDefault`+`stopPropagation`. 기존 `onToggleFavorite`·`data-testid`·선택 하이라이트 유지.
- 카드 `data-testid`는 앵커에 유지(기존 이름). RankingCard.test 갱신: 앵커 href·가시(`not.toHaveClass('hidden')`)·plain click preventDefault→onSelect·즐겨찾기 버튼 앵커 밖.

## 계약 D — i18n 키 (owner: ui-engineer, **ko.json·en.json 동시**)
`tools.rankings`에 신규만 추가(기존 `intro.title`·`detail.provenance.*`·`detail.table.*` 재사용):
| 키 | ko | en |
|----|----|----|
| `spoke.metaTitleSuffix` | `— 전체 순위표 \| Jurepi` | `— full ranking \| Jurepi` |
| `spoke.breadcrumbHome` | `홈` | `Home` |
| `spoke.backToHub` | `← 전체 순위 보기` | `← Browse all rankings` |
| `spoke.asOfPrefix` | `기준일` | `as of` |

## 테스트·게이트 (리더 재실행)
- platform: 라우트 `generateStaticParams`=4. ui: 컴포넌트 테스트 실 카탈로그/메시지.
- 리더: `pnpm tsc`(0) · `pnpm test`(전체 0 failed) · `pnpm build`(4 신규+허브 유지) · **전체 E2E**(기존 rankings E2E 회귀 0 — 카드 구조 변경 시 기존 스펙 갱신 + 신규 스포크 스펙) · 프리렌더 HTML(`out/ko/tools/rankings/tiobe-programming-languages.html`: H1·표 항목·ItemList+BreadcrumbList JSON-LD url==canonical·hreflang; 허브에 스포크 앵커) · 라이브 검증 후 배포.
- 비타협: 게이트 밖 SSR·url 단일 소스(`absoluteEntityUrl`)·i18n 드리프트 0·**카드 콘텐츠 hidden 래핑 금지**.
