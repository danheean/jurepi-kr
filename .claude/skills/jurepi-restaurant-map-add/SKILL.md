---
name: jurepi-restaurant-map-add
description: >-
  Author a brand-new themed list (and its places) for the Jurepi.kr 맛집 리스트 (Restaurant
  List) tool from just a theme and a place count, then verify and deploy. Use this whenever
  the user wants new restaurant/café content created from scratch — "맛집 리스트에 성수동 카페
  5곳 추가해줘", "전국 파스타 맛집 6곳 만들어줘", "새 테마 추가", "이 동네/음식 맛집 리스트
  만들어줘", "restaurant-map 콘텐츠 추가", "맛집 N곳 리서치해서 넣어줘". Given a theme (a
  neighborhood/region OR a dish/cuisine, optionally scoped to a region) and a desired place
  count, this researches real places (name, address, approximate coordinates) via web search,
  writes a curator personalNote for each, authors the ko/en markdown pair, then runs the same
  generate + verify + deploy pipeline as jurepi-restaurant-map-update. If the user has already
  hand-edited markdown themselves, use jurepi-restaurant-map-update instead.
---

# Jurepi 맛집 리스트 — 주제+개수로 신규 테마 저작 + 배포

맛집 리스트(Restaurant List, registry id `restaurant-map`, `/[locale]/tools/restaurant-map`)에 **주제(테마)와 장소 개수만** 입력받아 새 리스트를 처음부터 저작하는 스킬. 콘텐츠는 코드가 아니라 마크다운 쌍이다. 요구사항 정본은 `docs/services/fun/restaurant-map/SPEC.md`(특히 `<content_authoring_template>` 절 — 실제 예시가 있다).

작업 디렉터리는 항상 절대경로로: `cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr && …`.

## 0. 입력 확정 — 주제와 개수

사용자가 아래를 명시하지 않았으면 `AskUserQuestion`으로 확인한다(추측해서 진행하지 않는다):
1. **테마 형태와 내용**: 동네/지역 기반(예: "성수동 감성 카페") 인지, 음식이름 기반(예: "서울지역 족발", "전국 참치 맛집")인지. 음식이름 기반이면 **지역 한정**(하나의 region)인지 **전국**(`region: nationwide`)인지도 확정한다.
2. **장소 개수**: 최소 3곳(생성기 하드 게이트). 사용자가 "N곳"이라고 했으면 그 값, 안 정했으면 5곳을 기본 제안.
3. (선택) 이미 아는 특정 식당이 있으면 그것부터 포함.

테마가 이미 있는 리스트(같은 지역+같은 음식 카테고리)와 겹치면 사용자에게 확인한다(기존 슬러그 목록: `ls content/restaurant-map/*.md`로 확인, `_TEMPLATE*`/`README.md` 제외).

## 1. 리서치 — 실제 장소를 찾는다 (임의 생성 절대 금지)

- `WebSearch`/`WebFetch`로 테마에 맞는 **실존 장소**를 조사한다. 각 장소마다 필요한 것: 정확한 상호명, 정확한 주소, **위도/경도**(대략치 허용 — 이 빌드는 서버사이드 geocoding을 쓰지 않으므로 검색 결과의 지도 링크·주소에 표기된 좌표, 또는 해당 동네의 잘 알려진 랜드마크 좌표를 기준으로 근사한다), 카테고리(카페/한식/일식/중식/브런치/바/디저트/기타 중 하나), 왜 방문할 만한지(사실 요약).
- **좌표는 한국 범위**([위도 33–39], [경도 124–132])여야 한다 — 생성기가 하드 게이트로 막는다. 전국(`nationwide`) 테마는 장소마다 실제 소재 도시의 좌표를 쓴다(전부 같은 좌표로 뭉치지 않게).
- 링크(`link`)를 알 수 있으면 Naver Place/Google Maps/공식 웹사이트 URL을 넣는다(선택 필드지만 신뢰도를 높인다).
- **가격대(`priceRange`)는 확인 가능한 경우에만** 채운다(추측 금지, 없으면 생략).

## 2. `personalNote` 작성 — 이 도구의 핵심, 절대 건너뛰지 않는다

`personalNote`("개인적인 견해")는 `description`(사실 요약)과 **다른 목소리**로 쓴다:
- **1인칭, 짧고 구체적, 의견이 담긴 문장** (≤200자). "맛있어요" 같은 밋밋한 문장 금지 — 구체적 경험처럼 쓴다(예: "웨이팅은 각오하세요, 대신 대뱃살 한 점이면 다 용서됩니다", "느끼한 거 싫어하는 사람한테 강추").
- `description`과 내용이 겹치면 안 된다(description=사실, personalNote=태도/추천 포인트/주의사항).
- **빈 값·공백만 있는 값은 생성기가 빌드를 실패시킨다** — 장소마다 반드시 채운다.
- 이 필드가 이 도구를 "AI 스크랩이 아니라 사람이 큐레이션한 리스트"로 만드는 신뢰 신호임을 잊지 않는다(SPEC `<overview>`의 CRITICAL 항목).

## 3. 마크다운 쌍 작성

`content/restaurant-map/_TEMPLATE.md`·`_TEMPLATE_en.md`·`docs/services/fun/restaurant-map/SPEC.md`의 `<content_authoring_template>` 예시를 그대로 따른다. 파일명(slug)은 ASCII kebab-case(예: `seongsu-cafes.md`, 한글 파일명 금지).

```yaml
# content/restaurant-map/<slug>.md (KO, canonical)
title: "…"                # 한글 제목
region: seoul              # 또는 nationwide 등 — canonical
city: "…"                  # 선택
asOfDate: "2026-07-04"     # 오늘 날짜
sourceNote: "…"            # 한글 출처/근거(예: "직접 다녀온 곳 위주, 2026년 하반기 기준")
sourceUrl: "https://…"    # 선택
places:
  - name: "…"
    lat: 37.5
    lng: 127.0
    category: 한식
    address: "…"
    description: "…"       # 사실 요약, ≤300자
    personalNote: "…"      # 큐레이터 1인칭 의견, ≤200자, 비어있으면 안 됨
    link: "https://…"      # 선택
```
```yaml
# content/restaurant-map/<slug>_en.md (EN — places may differ in wording from KO, same real-world places, same order/count)
title: "…"                 # 영문 제목
sourceNote: "…"            # 영문 출처(생략 시 KO 상속 — 되도록 명시)
places:
  - name: "…"              # 영문 상호명(또는 로마자 표기)
    lat: 37.5               # KO와 같은 좌표(같은 장소)
    lng: 127.0
    category: korean
    address: "…"            # 영문 주소
    description: "…"
    personalNote: "…"       # 영문으로 별도 작성(직역 아니어도 됨, 같은 뉘앙스)
    link: "https://…"
```
- **KO/EN `places` 배열은 개수·순서가 같아야 한다**(인덱스가 같은 실존 장소를 가리킨다 — `place.id`가 `${slug}#${index}`로 파생되는 전제).
- `region`/`asOfDate`/`sourceUrl`은 KO canonical(EN 파일엔 안 써도 됨, 다르면 안 됨).

## 4. 생성 + 확인

```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
node scripts/generate-restaurant-map.mjs
node -e "
const d = require('./src/components/tools/restaurant-map/data/restaurant-map.generated.json');
const list = d.find(l => l.slug === '<새 슬러그>');
console.log(list ? 'found: ' + list.slug + ' | region: ' + list.region + ' | places: ' + list.ko.places.length : 'NOT FOUND');
if (list) {
  const missingNote = [...list.ko.places, ...list.en.places].filter(p => !p.personalNote || !p.personalNote.trim()).length;
  console.log('personalNote missing:', missingNote, '(must be 0)');
}
"
```
새 리스트가 카탈로그에 들어갔는지, 장소 수가 요청한 개수와 일치하는지, personalNote 누락이 0인지 확인한다. 생성기가 exit 1이면 사유대로 콘텐츠를 고치고 재실행(좌표 범위, 필수 필드, 쌍 길이 불일치가 흔한 원인).

## 5. 검증 + 배포

이후 절차(tsc/test/build 검증 게이트, 시각 게이트, SEO/GEO 프리렌더 확인, 커밋·배포·라이브 검증)는 `jurepi-restaurant-map-update` 스킬의 3~4절과 동일하다 — 그대로 따른다. 요점만 재정리:
```bash
pnpm exec tsc --noEmit && pnpm -s test && pnpm build
```
빌드 후 정적 서버로 새 리스트가 지도 마커+카드 양쪽에 실제로 나타나는지, `personalNote`가 시각적으로 분리된 인용구로 렌더되는지 눈으로 확인한 뒤에만 완료로 인정한다.

**`status: 'coming_soon'` → `'live'` 전환과 `git push`(배포)는 반드시 사용자에게 먼저 확인한다** — 새 테마를 추가했다고 자동으로 공개·배포하지 않는다.

## 정리
검증에 쓴 임시 스크린샷/서버는 정리한다: `pkill -f "serve.*out"; rm -rf .playwright-mcp *.png`.

## 참고
- SPEC(정본, 콘텐츠 템플릿 실 예시 포함): `docs/services/fun/restaurant-map/SPEC.md`의 `<content_authoring_template>` 절
- 도메인 계약: `_workspace/02_domain_restaurant-map-contract.md`
- 이미 손으로 고친 마크다운을 반영만 하면 되는 경우는 `jurepi-restaurant-map-update`(리서치·저작 절 불필요, 더 빠름).
- 큰 신규 도구·카테고리·리팩터는 `jurepi-build`(오케스트레이터), 배포 트러블슈팅은 `cloudflare-pages-deploy`.
