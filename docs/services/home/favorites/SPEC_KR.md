# 홈 즐겨찾기 — 개인 큐레이션 기능 SPEC

> 이 문서는 AI 코딩 에이전트가 소비하는 **정본 영문 SPEC**([`SPEC.md`](SPEC.md))의 **국문 번역본**입니다. 어느 한쪽이 변경되면 양쪽을 동기화하세요.
>
> **홈 즐겨찾기**(홈 즐겨찾기) 빌드 명세 — 대시보드 기능(독립 도구가 아님)으로, 사용자가 좋아하는 도구에 별을 표시하고 홈 그리드를 필터링해 즐겨찾기만 보이도록 한다. 전체 상호작용은 클라이언트 사이드: UI 상태는 React에서 관리되고 localStorage 지속성을 가지며, URL 파라미터는 선택적이고, SSR된 도구 그리드는 변경되지 않는다(크롤 안전, SEO 무결).
> 내부 기능 코드네임: `home-favorites`. 이 기능은 플랫폼 홈(`/[locale]/` 라우트, 분리된 레지스트리 항목 없음)의 일부다.
>
> 이 SPEC은 기능 자체를 다룬다. 플랫폼 셸과 디자인 시스템은 상속된다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템: [`docs/DESIGN.md`](../../../DESIGN.md)

## 개요

홈 즐겨찾기는 사용자가 도구 허브의 자신만의 뷰를 큐레이션하게 한다. 홈 그리드의 모든 live 도구 카드에 별 버튼이 표시되고, 클릭하면 도구를 즐겨찾기로 토글한다. "즐겨찾기" 필터 컨트롤(pill 토글 또는 체크박스)이 필터 행에 있어서 사용자가 별 표시한 도구만 볼 수 있다. 즐겨찾기 상태는 localStorage(zod 검증, 손상 안전)에 지속되고 선택적 URL 파라미터(`?favorites=true` 등)로 반영되며, 모든 변경사항이 URL에 반영돼 공유 가능하다. 전체 도구 그리드는 항상 SSR되어 SEO 크롤 앵커와 빠른 LCP를 위해; 즐겨찾기 필터링은 마운트 후 적용(하이드레이션 안전, React #418 없음, CLS 위반 없음).

**CRITICAL (SSR 안전, 레이아웃 변경 없음)**: 도구 그리드는 서버 렌더; 별 버튼이 유일한 인터랙티브 추가. 별 버튼은 크롤 가능한 도구 카드 앵커의 형제(외부)로 위치하므로, 버튼 클릭이 링크 네비게이션을 트리거하지 않는다. 즐겨찾기 상태(도구당 불린)는 마운트 후 적용; SSR된 그리드와 버튼 위치는 상수 유지(CLS <0.1).

**CRITICAL (클라 상태만)**: 즐겨찾기는 순수 클라이언트 사이드 기능. 백엔드·데이터베이스·API 없음. 지속성은 localStorage만. URL 파라미터를 추가하면, 상태에서 파생되고 변경사항을 반영하지만 SSR을 차단하거나 라우트에 복잡성을 더하지 않는다.

**CRITICAL (SPA 패러다임, 라우트 변경 없음)**: 즐겨찾기 토글 또는 필터 표시/숨김이 네비게이트, 리로드, 라우트 슬러그 변경을 하지 않는다. URL searchParams만 변경(history.replaceState)되고 그리드 콘텐츠는 제자리에서 업데이트된다.

## 플랫폼 통합

- 라우트: `/[locale]/` (홈 대시보드; 기존 SSG 라우트, 새 라우트 필요 없음)
- 플랫폼 제공: ToolGrid(모든 도구를 Link 카드로 렌더), SearchBar, CategoryFilter(카테고리 pill), 디자인 토큰, i18n 런타임, 레이아웃 셸
- 소비: i18n 네임스페이스 `home.favorites.*` (UI 크롬: 필터 라벨, 빈 상태 메시지, 버튼 라벨, aria-라벨)
- 컴포넌트 통합: FavoriteButton(신규, 그리드 셀 내 ToolCard와 형제), FavoritesFilterToggle(신규, 기존 필터 행 옆에 CategoryFilter와 함께 추가), HomeEmptyState(기존, 즐겨찾기만 + 0 매치 상태 처리로 확장)
- 플랫폼 의존: 새 라우트, 새 카테고리, 레지스트리 항목 없음. 변경만: FavoriteButton 컴포넌트 추가, 필터 행에 FavoritesFilterToggle 추가, ToolExplorer를 즐겨찾기 상태 + 필터 배선으로 확장.

## 범위 경계

### 범위 내
- 모든 live 도구 카드 위의 별 버튼(coming_soon 제외): 카드 우상단에 보이고, aria-pressed + 도구명 포함 aria-라벨
- 별 버튼은 크롤 가능 카드 앵커의 외부 형제(유효한 HTML, 앵커 내 버튼 없음)
- 토글 즐겨찾기: 클릭 = 부재 시 추가, 존재 시 제거(불변 연산)
- 즐겨찾기 필터: "즐겨찾기" / "Favorites" pill 토글 필터 행에; ON = 즐겨찾기만 표시, OFF = 모두 표시(기본값)
- 즐겨찾기 필터는 검색 + 카테고리 필터와 결합(AND 의미): 쿼리 AND 카테고리 AND 즐겨찾기(ON이면)
- 즐겨찾기 상태 localStorage 지속: 키 `jurepi-home-favorites` `{ version, ids: string[] }`, zod 검증, 손상 → fresh
- 선택적 URL 상태: 즐겨찾기 필터 상태를 searchParams에 반영(?favorites=true 또는 생략 = false), 공유성
- 빈 상태(즐겨찾기 ON + 0 매치): 문맥 메시지("카드의 별을 눌러 즐겨찾기를 추가하세요." / "Star a tool to add it to your favorites") + 탈출 액션(필터 끄기)
- 별 버튼 위치: 카드 컨테이너 내 절대, 우상단, 44px 타깃(a11y), 포커스 링 가시
- 하이드레이션 안전: SSR 그리드 불변; 즐겨찾기 상태 마운트 후 로드; useState 초기값에 브라우저 전용 값 없음
- 반응형(320/375/768/1024/1440): 별 버튼 크기 적응; 필터 pill 텍스트 + 아이콘 읽을 수 있음
- 접근성: aria-pressed(on/off 상태), aria-label(도구명 + "즐겨찾기 추가/해제" / "Add/remove from favorites"), 키보드 도달 가능
- SEO 영향 없음: 사전 렌더된 홈 HTML 도구 앵커는 변경 없어야 함; 크롤 안전
</in_scope>

### 범위 외
- 앱 셸, 헤더, 푸터, 동의 배너, 광고(전부 플랫폼)
- 도구별 커스텀 데이터(노트, 태그, 등급) — 즐겨찾기는 불린만
- 기기 간 즐겨찾기 동기화 또는 백엔드 계정으로(Phase 2)
- 즐겨찾기 세트/컬렉션(Phase 2)
- 즐겨찾기 패턴 분석(Phase 3)
- 즐겨찾기 고정/그리드 상단 섹션(평탄 그리드 유지, 재배열 없음)

### 향후 고려
- 즐겨찾기 세트(여러 저장 뷰, 예: "일", "창작", "재미")(Phase 2)
- 사용자 계정으로 클라우드 동기화(Phase 2)
- 즐겨찾기 목록 내보내기/가져오기(Phase 2)
- 분석 대시보드(도구별 즐겨찾기 빈도)(Phase 3)

## 기술 스택

- **상속**: Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl(ko/en) — 전부 플랫폼에서 상속.
- **즐겨찾기 상태**: 클라 상태만. 훅 `useHomeFavorites` 소유: favoriteIds(문자열[], 도구 slug), toggleFavorite(slug), isFavorited(slug), pruneMissing(레지스트리). localStorage 키 `jurepi-home-favorites`에 지속(`{ version: 숫자, ids: 문자열[] }`) zod 스키마로; 손상 데이터 → 침묵 fresh 시작.
- **필터 통합**: ToolExplorer.tsx 확장: favoritesOnly(불린 상태), setFavoritesOnly. 필터 구성: results = filterBySearch(query) ∩ filterByCategory(category) ∩ (favoritesOnly ? filterByFavorites(favorites) : all). 우선순위: 모든 3개 필터 AND(OR 아님).
- **URL 상태**: 선택적: FavoritesFilterToggle이 URL 파라미터 업데이트를 디스패치할 수 있음. 변경 시: setFavoritesOnly(bool) → window.history.replaceState(null, '', ?favorites=true인 new URL 또는 파라미터 제거). 마운트 시(한 번): URL ?favorites=true 읽기 → setFavoritesOnly(true), ToolExplorer의 기존 하이드레이션 패턴 미러(url → 상태, ONE 시간, useRef 가드).
- **버튼 위치**: 별 버튼: position absolute, ToolCard 컨테이너(relative) 내 top-right, z-10으로 카드 콘텐츠 위에 부양. 크기 44px(원 또는 약간 둥근 사각형) 가시 포커스 링. 아이콘: lucide Heart 또는 Star, 즐겨찾은 경우 var(--accent-rose), 미즐겨찾은 경우 var(--text-muted); 텍스트 라벨 없음(아이콘만, 하지만 aria-라벨 현재).
- **하이드레이션 안전**: ToolExplorer SSR: 즐겨찾기 로직 없이 전체 그리드 렌더. 마운트 시(클라): localStorage에서 즐겨찾기 로드 → 필터 적용. FavoriteButton: aria-pressed = true/false(누름 상태), onClick는 리렌더 없이 토글(부모 ToolExplorer에서 상태 업데이트). useState 초기값이 즐겨찾기를 읽지 않음(하이드레이션 미스매치 원인).
- **빈 상태**: HomeEmptyState 컴포넌트가 isEmptyBecauseFavorites(불린)을 수신. true이고 쿼리 비어있고 카테고리 'all': "카드의 별을 눌러 즐겨찾기를 추가하세요." / "Star a tool to add it to your favorites" + 즐겨찾기 필터 끄기 버튼 렌더. 그 외: 기존 empty-state 로직(쿼리/카테고리에 대한 결과 없음).
- **접근성**: FavoriteButton: role button(또는 button 요소), aria-pressed 불린, aria-label "{도구명} 즐겨찾기 {추가/해제}"(ko) / "{tool-name} — Add to/Remove from favorites"(en), tab 도달 가능, 가시 포커스.

## 파일 구조

```text
src/
├── lib/home-favorites/
│   ├── schema.ts                       # zod: FavoritesStore { version, ids }
│   ├── favorites.ts                    # 순수 도메인: toggleFavorite(ids, slug), pruneMissing(ids, 레지스트리), isInFavorites(ids, slug)
│   └── favorites.test.ts               # 단위 테스트: 토글, 프룬, is-in
├── hooks/
│   ├── useHomeFavorites.ts             # 훅: localStorage 로드 → 상태, 토글, 마운트 시 프룬
│   └── useHomeFavorites.test.ts
├── components/home/
│   ├── FavoriteButton.tsx              # 별 버튼: aria-pressed, onClick 토글, position absolute top-right
│   ├── FavoriteButton.test.tsx
│   ├── FavoritesFilterToggle.tsx       # Pill 토글: "즐겨찾기" / "Favorites", setFavoritesOnly 트리거
│   ├── FavoritesFilterToggle.test.tsx
│   ├── ToolCard.tsx                    # 수정: FavoriteButton import, 링크와 형제로 렌더
│   ├── ToolExplorer.tsx                # 수정: useHomeFavorites 훅, favoritesOnly 상태, 필터 구성, URL 하이드레이션
│   ├── ToolGrid.tsx                    # 수정: favoriteIds + isEmptyBecauseFavorites를 ToolCard + HomeEmptyState에 전달
│   ├── HomeEmptyState.tsx              # 수정: isEmptyBecauseFavorites 경우 처리
│   └── CategoryFilter.tsx              # 변경 없음(FavoritesFilterToggle과 필터 행에서 함께)
└── i18n/messages/{ko,en}.json          # home.favorites.* 네임스페이스
```

## 핵심 데이터 엔티티

- **FavoritesStore**: `version`(숫자, STORE_VERSION = 1 — 향후 스키마 마이그레이션용), `ids`(문자열[] 도구 slug, push/filter 순서 보존, 최대 ~100 도구). localStorage 키: `jurepi-home-favorites`. 불변 연산: 모든 업데이트는 새 배열 반환, 절대 in-place 변경 금지.
- **FavoriteButtonProps**: `slug`(도구 id), `name`(도구 표시명, aria-라벨용), `isFavorited`(불린), `onToggle`((slug: string) => void), `testId?`(문자열).
- **필터 상태**: `favoritesOnly`(불린, true = 즐겨찾기만 표시, false = 모두 표시), `category`(ToolCategory | 'all'), `query`(문자열), `results`(모든 3개 필터 AND 적용으로 계산).
- **상수**: STORE_VERSION = 1, STORAGE_KEY = 'jurepi-home-favorites'.

## 라우트 정의

- 공개 라우트: `/:locale:/` (홈 대시보드, 기존 라우트, 새 라우트 필요 없음)
- URL 파라미터: `q`(문자열, 선택적, 기존 검색 쿼리), `cat`(문자열, 선택적, 기존 카테고리 필터), `favorites`(문자열, 선택적, enum "true", NEW: 설정 시 즐겨찾기만 표시; 생략 = false)

## 컴포넌트 계층

```text
<home>                          ← 기존 SSG 라우트
  <hero />                      ← 변경 없음
  <tool_explorer>               ← "use client"(기존); favoritesOnly 상태 + useHomeFavorites 훅 추가로 수정
    <search_bar />              ← 변경 없음
    <filter_row>
      <category_filter />       ← 변경 없음
      <favorites_filter_toggle/>← NEW: 카테고리 옆에 pill 토글
    </filter_row>
    <result_count />            ← 변경 없음(즐겨찾기 상태 공지로 확장)
    <tool_grid>                 ← favoriteIds를 ToolCard + HomeEmptyState에 전달로 수정
      <tool_card />             ← 수정: FavoriteButton 형제 렌더
        <tool_card_link />      ← 변경 없음
        <favorite_button />     ← NEW: 형제, position absolute
        <badges />              ← 변경 없음
        <content />             ← 변경 없음
      <home_empty_state />      ← 수정: 즐겨찾기만 빈 경우 처리
  </tool_explorer>
```

## 핵심 기능

### 즐겨찾기 토글(불변 도메인 연산)
```
toggleFavorite(ids: 문자열[], slug: 문자열): 문자열[]
  if (ids.includes(slug))
    return ids.filter(id => id !== slug)
  else
    return [...ids, slug]
```

### 미지 프룬(레지스트리 변경 후)
```
pruneMissing(ids: 문자열[], 레지스트리: ToolMeta[]): 문자열[]
  validSlugs = Set(registry.map(t => t.slug))
  return ids.filter(id => validSlugs.has(id))
```

### useHomeFavorites 훅
```
마운트 시(한 번, useRef 가드):
  1. localStorage 키 `jurepi-home-favorites`에서 로드
  2. zod 파싱 → 유효하지 않으면 fresh 시작 { version: 1, ids: [] }
  3. pruneMissing(ids, 레지스트리) → 삭제된 도구 제거
  4. setState(ids)
  5. 선택적으로 URL ?favorites=true 읽기 → setFavoritesOnly

즐겨찾기 토글 시(slug):
  1. newIds = toggleFavorite(favoriteIds, slug)
  2. setState(newIds)
  3. localStorage.setItem(`jurepi-home-favorites`, JSON.stringify({ version: 1, ids: newIds }))
  4. URL 업데이트(선택적): window.history.replaceState(...)
```

### 필터 구성
```
결과 = allTools
  .filter(t => t.status === 'live')  // live 도구만(coming_soon 즐겨찾기 필터에서 숨김)
  .filter(t => matchesSearch(t, 쿼리))
  .filter(t => matchesCategory(t, 카테고리) || 카테고리 === 'all')
  .filter(t => !favoritesOnly || favorites.includes(t.slug))
```

### 빈 상태 로직
```
if (결과.length === 0) {
  if (favoritesOnly && 쿼리 === '' && 카테고리 === 'all') {
    // 즐겨찾기 필터만 ON, 쿼리/카테고리 없음, 0 즐겨찾기
    isEmptyBecauseFavorites = true
  } else {
    // 쿼리/카테고리에 대한 매치 없음
    isEmptyBecauseFavorites = false
  }
}
```

## 에러 처리
- 손상된 localStorage: zod 파싱 에러 → 항목 무시, fresh 시작 `{ version: 1, ids: [] }`(침묵 fail-safe, throw 없음)
- 미지 도구(레지스트리 업데이트 후): 마운트 시 pruneUnknown(삭제된 도구 slug 제거)
- 즐겨찾기 상태는 절대 null/미정의(항상 배열); 기본값 []( 즐겨찾기 없음)
- 모든 에러 상태는 클라에서 포착; 에러 토스트 없음(즐겨찾기는 비중요, UX 계속)

## 미학 지침
- 별/Heart 아이콘: lucide 아이콘 20px, 즐겨찾은 경우 var(--accent-rose), 미즐겨찾은 경우 var(--text-muted)
- 버튼: 44px 원/약간 둥근 사각형, 다른 아이콘 버튼과 일관(포커스 링 2px, 가시)
- 호버: 미묘한 그림자(--shadow-sm), 즐겨찾은 상태에서 약간 bg 틴트(--surface-sunken)
- 필터 pill: 기존 CategoryFilter 스타일을 FavoritesFilterToggle에 적용(테두리, rounded-full, 12px/16px 패딩)
- 빈 상태: 기존 일러스트(있으면) + 새 CTA 버튼 var(--brand) 배경
- 모션: 별 토글은 즉시(애니메이션 없음; 즐겨찾기 상태 즉시 업데이트)
- 접근성: aria-pressed, aria-label 도구명, 44px 타깃 ≥ WCAG AAA

## 보안 고려사항
- 사용자 생성 콘텐츠 없음(도구 slug만 즐겨찾기에 저장)
- localStorage는 사용자 제어(클라 기기만); zod 검증으로 손상 데이터 방지
- 외부 API 호출 없음(즐겨찾기는 로컬만, Phase 1)
- URL 파라미터는 클라 마운트에서 읽기만(XSS 벡터 없음)
- CSRF/XSS: 해당 없음(100% 클라 SPA, 폼 제출 없음)

## 최종 통합 테스트

시나리오 1(정상): 도구 카드에 별 표시 → 버튼 시각 변경(rose 아이콘 + bg) → 리로드 → 별 지속. "즐겨찾기" 필터 클릭 → 그리드가 즐겨찾은 도구만 표시(나머지 숨김, SEO 앵커는 HTML에 남음 CSS로 오프스크린). 필터 클릭 끄기 → 모든 도구 다시 표시. 별 개수 즐겨찾기만 그리드에 반영.

시나리오 2(빈 즐겨찾기): "즐겨찾기" 필터 ON, 0 즐겨찾기 → 빈 상태 "카드의 별을 눌러…" + "모두 보기" 버튼. 버튼 클릭 → 필터 끄기, 그리드 채워짐.

시나리오 3(검색 + 즐겨찾기): 3개 도구 별 표시, "로또" 검색 → 즐겨찾은 로또만 표시; 미즐겨찾은 로또 검색 매치 숨김. 검색 지우기 → 3 즐겨찾기 표시(그들만, 나머지 즐겨찾기 필터로 숨김).

시나리오 4(카테고리 + 즐겨찾기): 다양한 카테고리(random, text, converter) 도구 별 표시. 카테고리 필터 "text" + 즐겨찾기 ON → 즐겨찾은 텍스트 도구만; 미즐겨찬 텍스트 도구 숨김. 우선순위: 카테고리 AND 즐겨찾기(OR 아님).

시나리오 5(URL 공유성): 2개 도구 별 표시, "즐겨찾기" 필터 클릭 → URL `?favorites=true` 됨. URL 복사, 새 탭에서 열기 → 페이지 즐겨찾기 ON으로 로드, 2 도구 표시(정상). ?q=lotto&favorites=true로 쿼리 수정 → 검색 + 즐겨찾기 모두 활성(AND 로직).

시나리오 6(SSR + 크롤 안전): 페이지 소스 보기(pre-render HTML) → 도구 카드 앵커 모두 현재(즐겨찾기 없음 상태와 동일). 검증: `<a href="/ko/tools/…">` 링크는 HTML에(숨김 아님, 검색 가능). 즐겨찾기 토글(JS)은 앵커를 렌더/제거하지 않음(별은 UX만, 그리드는 항상 크롤 가능).

시나리오 7(하이드레이션 안전): 페이지 렌더 → SSR 그리드, 즐겨찾기 아직 로드 안 됨. 페이지 하이드레이션 → localStorage에서 즐겨찾기 로드. 시각 변경 없음(CLS <0.1), React 경고 없음(하이드레이션 매치).

시나리오 8(즐겨찾기 + coming_soon): coming_soon 도구는 별 버튼 없음(별 토글, 즐겨찾기 로직에 미포함). 도구 status가 coming_soon으로 변경 → 마운트 시 프룬이 즐겨찾기에서 제거.

## 성공 기준
- 별 버튼은 모든 live 도구에 보이고, coming_soon에 숨김
- 별 토글은 리로드에 지속
- 즐겨찾기 필터는 검색 + 카테고리와 결합(AND 로직)
- 빈 상태는 각 경우에 정상 메시지 표시
- URL 파라미터는 필터 상태 반영(선택적이나 권장)
- SSR된 도구 앵커 불변(모두 pre-render HTML에 현재)
- 즐겨찾기 토글 또는 필터 변경 시 레이아웃 변경 없음(CLS <0.1)
- 하이드레이션 미스매치 없음(React 19 strict mode 깨끗)
- 접근성: 별 aria-pressed + aria-라벨, 44px 타깃, 키보드 도달 가능
- 모든 UI 텍스트 로컬라이즈(ko/en)
- 손상된 localStorage 침묵 처리(fresh 시작)
- 삭제된 도구 마운트 시 프룬
- 필터 우선순위: 쿼리 AND 카테고리 AND 즐겨찾기(OR 아님)
</success_criteria>

## 빌드 산출물
- src/lib/home-favorites/(순수 도메인: schema.ts, favorites.ts + 테스트)
- src/hooks/useHomeFavorites.ts + 테스트
- src/components/home/FavoriteButton.tsx + 테스트
- src/components/home/FavoritesFilterToggle.tsx + 테스트
- 수정: src/components/home/{ToolCard,ToolExplorer,ToolGrid,HomeEmptyState}.tsx
- src/i18n/messages/ko.json + en.json: home.favorites.* 네임스페이스
- 단위 테스트: src/lib/home-favorites/*.test.ts, src/hooks/useHomeFavorites.test.ts, src/components/home/FavoriteButton.test.tsx, FavoritesFilterToggle.test.tsx
- E2E 테스트: tests/e2e/home-favorites.spec.ts (8 시나리오: 토글, 빈, 검색+즐겨찾기, 카테고리+즐겨찾기, URL, SSR, 하이드레이션, coming_soon)

## 핵심 구현 노트
1. FavoriteButton은 `relative` ToolCard 컨테이너 내 `position absolute top-4 right-4`; 링크는 크롤 가능(버튼 외부, 클릭 차단 안 함).
2. useHomeFavorites 훅: 마운트 시 한 번 로드(useRef 가드), 미지 프룬, 필터 적용. useState 초기값이 localStorage 읽지 않음(하이드레이션 안전).
3. 필터 구성: (검색 AND 카테고리 AND 즐겨찾기) — 모든 3개가 매치해야 함.
4. URL 파라미터(`?favorites=true`)는 선택적; 생략 시 기본 즐겨찾기 필터 = false. 공유 가능 링크에 권장.
5. SSR 그리드 불변; 즐겨찾기 필터링은 마운트 후 클라만. 모든 도구 앵커는 pre-render HTML에 남음(크롤 가능).
6. CLS: 별 버튼 크기 + 위치는 상수(44px absolute, 리플로우 없음). 토글이나 필터 시 레이아웃 변경 없음.
7. coming_soon 도구는 별 버튼을 얻지 않음(필터 & 로직이 스킵). 즐겨찾은 도구가 coming_soon이 되면 마운트 시 프룬이 제거.
8. 빈 상태 경우: (favoritesOnly=true + 0 즐겨찾기) → 특별 메시지 + 탈출 버튼; 그 외: 기존 "결과 없음" 메시지.
9. TDD 순서: 도메인(toggleFavorite, 프룬 테스트 FIRST), 훅(localStorage + 프룬), 그 다음 컴포넌트 상호작용(버튼 클릭 + 필터).
10. 반응형: 별 버튼 44px 모든 breakpoint; 필터 pill 텍스트 + 아이콘 모바일에서 줄바꿈(flex 행, gap-2).
