---
name: jurepi-restaurant-map-update
description: >-
  Sync, verify, and deploy the Jurepi.kr 맛집 리스트 (Restaurant List) tool after its markdown
  content has been hand-edited. Use this whenever the user has already changed a file under
  content/restaurant-map/ (or says they have) and wants it reflected — "맛집 리스트 마크다운
  수정했어, 반영해줘", "restaurant-map 업데이트", "맛집 콘텐츠 갱신", "이 파일 고쳤으니 다시
  빌드해줘", "맛집 리스트 배포". Detects which list(s) changed, re-runs the build-time generator,
  runs the full verification gate (tsc + test + build + live visual + SEO/GEO prerender), and
  deploys (commit → merge main → push → Cloudflare auto build+deploy → verify the live domain).
  Does NOT author new places or new theme content — for that, use jurepi-restaurant-map-add.
---

# Jurepi 맛집 리스트 — 마크다운 변경 반영 + 배포

맛집 리스트(Restaurant List, registry id `restaurant-map`, `/[locale]/tools/restaurant-map`)는 **코드가 아니라 마크다운 쌍**으로 콘텐츠를 관리한다. 사용자가 `content/restaurant-map/`의 `.md`/`_en.md` 파일을 직접 고친 뒤 "반영해줘"라고 할 때 이 스킬을 쓴다. 요구사항 정본은 `docs/services/fun/restaurant-map/SPEC.md`.

작업 디렉터리는 항상 절대경로로: `cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr && …` (도구가 별도 워크트리에 있다면 그 워크트리 절대경로로).

## 콘텐츠 모델 (핵심 — 다른 마크다운 도구와의 차이)

- 리스트 하나 = **국문/영문 마크다운 쌍**: `content/restaurant-map/<slug>.md` + `content/restaurant-map/<slug>_en.md`.
- 템플릿: `content/restaurant-map/_TEMPLATE.md`, `_TEMPLATE_en.md`, `content/restaurant-map/README.md`.
- 생성기 `scripts/generate-restaurant-map.mjs`가 폴더를 스캔·검증해 `src/components/tools/restaurant-map/data/restaurant-map.generated.json`으로 굽는다. `predev`/`prebuild`에 배선돼 있어 dev/build 시 자동 실행된다.
- **테마는 동네 기반(예: "성수동 감성 카페")뿐 아니라 음식이름 기반(예: "서울지역 족발", "전국 참치 맛집")일 수 있다.** `region` enum에 `nationwide`(전국)가 있다 — 여러 지역에 걸친 음식이름 테마만 `nationwide`를, 지역 한정 테마는 그 지역을 쓴다.
- **`personalNote`("개인적인 견해")는 장소마다 필수, 빈 문자열 금지.** `description`(사실 요약)과 분리된, 큐레이터의 1인칭 의견 문구다. 이게 이 도구의 핵심 신뢰 신호(AI 스크랩이 아니라 사람이 직접 쓴 리스트라는 증거)라서 생성기가 빈 값이면 빌드를 실패시킨다.
- `favorites`/`recents`는 **장소(place) 단위**다(리스트 단위 아님) — `place.id`는 `${listSlug}#${index}`로 merge 시 자동 파생되며, 마크다운에 직접 쓰지 않는다.

### frontmatter 필드 (한 파일 기준)
```yaml
title: "…"              # 필수, 로케일별(KO 파일=한글, EN 파일=영문)
slug: "<kebab-case>"    # KO canonical. 없으면 파일명에서 파생
region: seoul            # KO canonical. enum: seoul/busan/daegu/.../jeju/nationwide. EN 생략(KO 상속)
city: "…"                # 선택, 더 세분화된 위치(예: "강남구")
asOfDate: "2026-07-04"   # KO canonical, ISO 날짜
sourceNote: "…"          # 로케일별! KO=한글 출처, EN=영문 출처(≤200자). EN 생략 시 KO 상속
sourceUrl: "https://…"   # 선택, KO canonical, 클릭 가능한 출처 링크
places:                   # 필수, ≥3개
  - name: "…"             # 필수
    lat: 37.5             # 필수, 한국 범위 [33–39]
    lng: 127.0            # 필수, 한국 범위 [124–132]
    category: 한식         # 필수, enum: 카페/한식/일식/중식/브런치/바/디저트/기타
    address: "…"           # 필수
    description: "…"       # 필수, 사실 요약(≤300자)
    personalNote: "…"      # 필수, 비어있으면 안 됨, 큐레이터 1인칭 의견(≤200자)
    link: "https://…"     # 선택, 외부 링크(Naver Place/Google Maps 등)
    priceRange: "…"        # 선택
    imageUrl: "…"          # 선택. 있으면 imageWidth/imageHeight(px)도 필수
```

**꼭 기억할 규칙 (생성기 불변식):**
- **쌍 필수**: KO(`<slug>.md`)와 EN(`<slug>_en.md`) 둘 다 있어야 한다. 하나만 있으면 orphan → 빌드 실패.
- **ko/en `places` 배열은 길이가 같아야 한다**(인덱스 정렬 — 같은 인덱스가 같은 실존 장소를 나타냄, `place.id` 파생의 전제).
- 생성기는 다음 위반 시 **빌드를 실패**(exit 1)시킨다: 쌍 누락, places <3, 좌표 범위 초과, category enum 밖, personalNote 빈 값, slug 중복(region 내), 필수 필드 누락. 실패 메시지의 파일·필드·사유를 그대로 고친다.

## 워크플로우

### 1. 무엇이 바뀌었는지 확인
```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
git status --short content/restaurant-map/
git diff content/restaurant-map/
```
사용자가 직접 고친 파일을 확인하고, 위 frontmatter 필드 규칙에 맞는지(특히 **모든 장소에 `personalNote`가 비어있지 않은지**) 먼저 눈으로 훑는다. 어긋나면 생성기가 잡아주지만, 사람이 먼저 보면 왕복이 준다.

### 2. 생성 + 확인
```bash
node scripts/generate-restaurant-map.mjs
node -e "
const d = require('./src/components/tools/restaurant-map/data/restaurant-map.generated.json');
console.log('lists:', d.length);
d.forEach(l => {
  const allPlaces = [...l.ko.places, ...l.en.places];
  const missingNote = allPlaces.filter(p => !p.personalNote || !p.personalNote.trim()).length;
  console.log(' -', l.slug, '| region:', l.region, '| ko/en places:', l.ko.places.length + '/' + l.en.places.length, '| personalNote missing:', missingNote);
});
"
```
리스트 수·region·ko/en 장소 수 일치·**personalNote missing이 0**인지 눈으로 확인한다. 생성기가 exit 1이면 사유대로 콘텐츠를 고치고 재실행.

### 3. 검증 게이트 (전부 리더가 직접 재실행 — "주장 ≠ 증명")
순서대로, 각 단계 그린을 확인한 뒤 다음으로:
```bash
pnpm exec tsc --noEmit        # 콘텐츠만 바꿨으면 대개 무영향, 스키마를 건드렸으면 필수
pnpm -s test                  # 유닛 전부 통과(도메인 lib/restaurant-map 포함)
pnpm build                    # 정적 export(out/) 그린
```
- **시각 게이트 (필수, 녹색 테스트가 못 잡는 것)**: 빌드 후 정적 서버를 띄우고 실제로 열어 본다.
  ```bash
  pkill -f "serve.*out" 2>/dev/null; (npx --yes serve@latest out -l 3100 >/tmp/serve.log 2>&1 &); sleep 3
  curl -sI localhost:3100/ko/tools/restaurant-map | head -1   # 상태 코드 확인 (status가 coming_soon이면 404가 정상)
  ```
  status가 `live`인 경우에만 실제 페이지가 생성된다 — Playwright MCP로 `/ko/tools/restaurant-map`·`/en/tools/restaurant-map`을 열어:
  - **콘솔 에러 0**(특히 `MISSING_MESSAGE`, 지도 SDK 에러).
  - 변경된 리스트의 카드가 지도 마커 + 리스트 카드 양쪽에 실제로 나타나는지(양방향 동기화: 마커 클릭→카드 하이라이트, 카드 클릭→지도 팬).
  - **`personalNote`가 `description`과 시각적으로 분리된 인용구 블록**으로 렌더되는지.
  - region이 `nationwide`인 리스트는 "전국" 탭에서 보이는지, 지역 한정 테마는 해당 지역 탭에서 보이는지.
  - KO는 한글 콘텐츠, EN은 영문 콘텐츠(로케일 지역화 확인 — 마크다운 콘텐츠는 로케일별 파일에서 오므로 특히 새 콘텐츠에서 누수 확인).
  - 320px에서 지도+리스트가 오버플로 없이 스택되는지.
- **SEO/GEO 프리렌더 확인**: 변경된 장소가 구조화 데이터에 반영됐는지(status가 live일 때만 의미 있음).
  ```bash
  curl -s localhost:3100/ko/tools/restaurant-map | grep -o '"@type":"FoodEstablishment"' | wc -l   # 전체 장소 수와 일치
  curl -s localhost:3100/ko/tools/restaurant-map | grep -o '"@type":"FAQPage"' | wc -l              # 정확히 1 (Faq 컴포넌트 단독 소유)
  ```

### 4. 배포 (커밋 → main → push → CF 자동 배포 → 라이브 검증)
배포 = **`main`에 push**. Cloudflare Workers Builds(Git 연동)가 push를 감지해 `pnpm build`+`wrangler deploy`를 자동 실행한다. 로컬 `wrangler deploy`가 아니다.
```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
# 맛집 리스트 콘텐츠 범위만 스테이징(무관한 파일·스크래치는 남긴다)
git add content/restaurant-map/ src/components/tools/restaurant-map/data/restaurant-map.generated.json
git status --short   # 의도치 않은 파일이 섞이지 않았는지 확인
git commit -m "feat(restaurant-map): <무엇을 수정했는지>"
```
- 기능 브랜치/워크트리에서 작업했다면 먼저 `main`에 병합해야 배포에 포함된다.
- **`status: 'coming_soon'` → `'live'` 전환은 이 스킬의 범위가 아니다.** registry 상태 변경(`src/tools/registry.ts`)은 별도의, 사용자가 명시적으로 지시한 경우에만 한다 — 콘텐츠 업데이트가 자동으로 도구를 공개 상태로 바꾸면 안 된다.
- 커밋을 `main`에 올린 뒤 **사용자에게 배포(push) 여부를 확인**하고(승인되면):
```bash
git push origin main
```
- **라이브 검증 (배포판 "주장 ≠ 증명", status가 live인 경우만 해당)**: push 후 CF 빌드는 대략 1~2분.
```bash
for i in $(seq 1 18); do c=$(curl -s -o /dev/null -w "%{http_code}" https://apps.jurepi.kr/ko/tools/restaurant-map); [ "$c" = 200 ] && { echo "live after ~$((i*20))s"; break; }; echo "attempt $i: $c"; sleep 20; done
curl -sI https://apps.jurepi.kr/ko/tools/restaurant-map | head -1     # 200
curl -sI https://apps.jurepi.kr/en/tools/restaurant-map | head -1     # 200
curl -s https://apps.jurepi.kr/ko/tools/restaurant-map | grep -o '"@type":"FoodEstablishment"' | wc -l   # 전체 장소 수와 일치
```

## 정리
검증에 쓴 임시 스크린샷/서버는 정리한다: `pkill -f "serve.*out"; rm -rf .playwright-mcp *.png`.

## 참고
- SPEC(정본): `docs/services/fun/restaurant-map/SPEC.md`
- 도메인 계약: `_workspace/02_domain_restaurant-map-contract.md`
- 새 테마를 처음부터 저작(리서치+마크다운 작성)해야 하면 `jurepi-restaurant-map-add`.
- 큰 신규 도구·카테고리·리팩터는 `jurepi-build`(오케스트레이터), 배포 트러블슈팅은 `cloudflare-pages-deploy`.
