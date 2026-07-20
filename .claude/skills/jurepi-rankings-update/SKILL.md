---
name: jurepi-rankings-update
description: >-
  Add, edit, or refresh a ranking in the Jurepi.kr 별별 랭킹 (Various Rankings) tool and
  deploy it. Use this whenever the user wants to update rankings content — "별별 랭킹 업데이트",
  "랭킹 추가/수정", "순위 추가", "새 순위 넣어줘", "TIOBE/리더보드 갱신", "rankings 업데이트",
  "이 순위 최신화", "랭킹 배포" — or asks to put a new Top-N list (movies, games, AI models,
  programming languages, etc.) into the site. Covers the full path: author the markdown pair
  (sourceNote states methodology, item descriptions carry rank/score deltas vs the prior
  snapshot by default), register a new field if needed, run the build-time generator, verify
  (tsc + test + build + live visual), and DEPLOY (commit → merge main → push → Cloudflare auto
  build+deploy → verify the live domain). Trigger even if the user only says "add a ranking"
  without naming the tool.
---

# Jurepi 별별 랭킹 업데이트 + 배포

별별 랭킹(Various Rankings, registry id `rankings`, `/[locale]/tools/rankings`)의 콘텐츠를 추가·수정하고 배포하는 운영 스킬. 랭킹은 **코드가 아니라 마크다운 쌍**이다 — 파일을 넣고 생성기를 돌리면 반영된다. 요구사항 정본은 `docs/services/news/rankings/SPEC.md`(+ 국문 `SPEC_KR.md`).

작업 디렉터리는 항상 절대경로로: `cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr && …`.

## 콘텐츠 모델 (핵심)

- 랭킹 하나 = **국문/영문 마크다운 쌍**: `content/rankings/items/<slug>.md` + `content/rankings/items/<slug>_en.md`.
- 템플릿·작성 규칙: `content/rankings/_TEMPLATE.md`, `_TEMPLATE_en.md`, `content/rankings/README.md`를 먼저 읽고 그 형식을 따른다.
- 생성기 `scripts/generate-rankings.mjs`가 폴더를 스캔·검증해 `src/components/tools/rankings/data/rankings.generated.json`으로 굽는다. `predev`/`prebuild`에 배선돼 있어 dev/build 시 자동 실행된다.

### frontmatter 필드 (한 파일 기준)
```yaml
title: "…"              # 필수, 로케일별(KO 파일=한글 제목, EN 파일=영문 제목)
slug: "<kebab-case>"    # KO 파일에만(선택; 없으면 파일명에서 파생). EN은 생략
field: ai               # KO canonical. enum 중 하나. EN은 생략(KO 상속)
asOfDate: "2026-06"     # KO canonical. ISO(YYYY-MM 또는 YYYY-MM-DD). EN 생략(KO 상속)
sourceNote: "…"         # 로케일별! KO 파일=한글 출처, EN 파일=영문 출처(≤200자). EN 생략 시 KO 상속
sourceUrl: "https://…"  # 선택, KO canonical. 있으면 배너에서 클릭 가능한 출처 링크(↗)
items:                  # 필수, ≥3개, rank는 1..N 연속
  - rank: 1
    name: "…"           # 필수
    description: "…"     # 필수, 플레인 텍스트 ≤200자 (마크다운 렌더 아님)
    link: "https://…"   # 선택, 항목별 외부 링크
    imageUrl: "…"       # 선택. 있으면 imageWidth/imageHeight(px)도 필수
```

**꼭 기억할 규칙 (다른 도구와의 일관성 + 생성기 불변식):**
- `sourceNote`는 **로케일별로 지역화**한다 — 다른 도구가 모든 콘텐츠를 ko/en 지역화하는 것과 일관. 영문 페이지에 한글이 새지 않게 EN 파일엔 영문 출처를 쓴다(생략하면 KO 상속). 라벨("출처"/"Source", "기준일"/"As of")은 i18n가 자동 처리하므로 값만 지역화하면 된다.
- `field`/`asOfDate`/`sourceUrl`은 KO canonical(EN 생략 시 상속, 명시하면 KO와 일치해야 함).
- 생성기는 다음 위반 시 **빌드를 실패**(exit 1)시킨다: 쌍 누락, items <3, rank 비연속, field별 slug 중복, enum 밖 field, sourceNote >200자, 잘못된 URL. 실패 메시지의 파일·사유를 그대로 고친다.
- 필드 탭은 **카탈로그에 실재하는 field에서만** 생성된다(빈 enum 값은 탭이 안 생김).

## 워크플로우

### 1. 계획 — 무엇을, 어디서
- 어떤 순위인지, 데이터 출처(URL)와 기준일(asOfDate)을 확정한다.
- 웹 데이터를 넣는 경우 `WebFetch`/`WebSearch`로 실제 수치를 가져오고, `sourceNote`(출처명+날짜)와 `sourceUrl`에 **정확히 인용**한다. 임의 수치 금지.
- 기존 순위 수정이면 해당 `content/rankings/items/<slug>{,_en}.md`를 편집. 새 순위면 새 쌍을 만든다.

### 2. 새 field가 필요한가?
현재 enum: `['ai', 'programming', 'tech', 'games', 'movies', 'music']` (`src/lib/rankings/schema.ts`의 `FIELD_ORDER` + 두 zod enum). 이 목록에 없는 분야면 **세 곳을 함께** 고쳐야 한다(안 그러면 생성기 검증 실패 또는 런타임 MISSING_MESSAGE):
1. `src/lib/rankings/schema.ts` — `FIELD_ORDER`와 두 `z.enum([...])`에 새 id 추가.
2. `scripts/generate-rankings.mjs` — 인라인 zod enum에도 동일하게 추가(생성기는 독립 복제본).
3. `src/i18n/messages/ko.json` + `en.json` — `tools.rankings.fields.<id>` 라벨(ko/en) 추가.
새 카테고리(예: `news` 외 새 대분류)까지 필요하면 별개 작업 — `jurepi-build`/`nextjs-ssg-platform` 참고.

### 3. 마크다운 쌍 작성/수정
- `_TEMPLATE.md`/`_TEMPLATE_en.md` 형식을 그대로 따른다. KO/EN 두 파일 모두 만든다(쌍 필수).
- 제목·항목명·설명은 각 로케일 언어로. `sourceNote`도 각 언어로.

### 4. `sourceNote`에 방법론, 항목 설명에 변경 분석 (기본값으로 항상 포함)
사용자가 별도로 요청하지 않아도 모든 랭킹 콘텐츠는 "어떻게 이 순위를 산정했는지"와 "지난 버전 대비 뭐가 달라졌는지"를 담는다. `sourceNote`는 출처명+날짜만 적는 라벨이 아니라 **방법론 요약**이다.

- **방법론(`sourceNote`)**: 순위를 산정하는 소스·근거를 한 줄로 담는다. 리더보드/지수라면 `sourceUrl`의 방법론 페이지(예: `/blog/*-methodology`, About 섹션)를 `WebFetch`로 찾아 "무엇을 측정하는지 + 어떻게 계산하는지"를 요약. 정적 사실 기반 랭킹(수상 내역 등)이라면 정렬 규칙(동률 처리 등)을 명시. ≤200자 제한 안에서 괄호로 압축.
  - 예(LLM 리더보드): `"Agent Arena 에이전트 리더보드 기준(누적 105만+ 세션·35개 모델, 성공률·툴환각 등 5개 신호 종합 산정) · 2026년 7월 17일"`
  - 예(TIOBE): `"TIOBE 인덱스 기준(구글·빙·위키피디아 등 20여 검색엔진의 검색량으로 언어 '인기도' 측정, 기술적 우수성과 무관) · 2026년 7월"`
  - 예(정적 사실 랭킹): `"FIFA 공식 자료 기준(우승 횟수 내림차순 정렬, 동률은 국가명 가나다순) · 2026년 7월"`
- **변경 분석(항목 `description`)**: **기존 순위를 갱신**(신규 추가가 아니라 수치·순위가 바뀌는 리더보드/지수 재수집)할 때는, 편집 전 파일을 먼저 읽어 이전 스냅샷(순위·수치)을 확보한 다음, 새 값과 대조해 각 항목 설명 끝에 변동을 괄호로 덧붙인다:
  - 순위 유지: `"…(전월 대비 +0.09%p, 2위 유지)"`
  - 순위 이동: `"…(전월 대비 -0.79%p, 8위→12위)"`
  - 신규 진입(리더보드에 새로 추가된 항목이라고 소스가 명시): `"…(신규 모델, 7월 13일 추가)"`
  - 이전 스냅샷에 없던 항목(예: Top 10→Top 20 확장으로 처음 노출되는 하위권): `"…(20위 확장으로 신규 표시)"` — "신규 모델"이라고 과장하지 않는다(모델 자체가 새것인지 우리가 이제야 보여주는 것인지 확인 안 된 정보를 구분).
  - 정적 사실 랭킹(월드컵 우승국 등 이벤트 발생 시에만 바뀜)은 매번 인위적 델타를 지어내지 말고, 실제로 새 이벤트가 반영됐을 때만 해당 항목에 자연스러운 서술로 반영(예: `"2026년 결승에서 아르헨티나를 꺾고 두 번째 우승 달성"`).
- 이 작업은 **항목별 설명(200자 제한 내)**과 `sourceNote`만으로 처리한다 — 스키마에 프리즈/마크다운 본문(`body`) 필드는 없고(`generate-rankings.mjs`가 frontmatter만 파싱, 마크다운 본문은 미사용) 새로 추가하는 것은 이 스킬의 범위를 넘는 스키마 변경(`jurepi-build` 참고).

### 5. 생성 + 확인
```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
node scripts/generate-rankings.mjs
node -e "const d=require('./src/components/tools/rankings/data/rankings.generated.json'); d.forEach(r=>console.log(r.slug,'| field:',r.field,'| ko.sourceNote:',JSON.stringify(r.ko.sourceNote),'| en.sourceNote:',JSON.stringify(r.en.sourceNote),'| items:',r.ko.items.length))"
```
레코드 수·field·**ko/en sourceNote가 각 언어로 구분**되는지·항목 수를 눈으로 확인한다. 생성기가 exit 1이면 사유대로 콘텐츠를 고치고 재실행.

### 6. 검증 게이트 (전부 리더가 직접 재실행 — "주장 ≠ 증명")
순서대로, 각 단계 그린을 확인한 뒤 다음으로:
```bash
pnpm exec tsc --noEmit        # vitest 그린 ≠ tsc 그린! 스키마/타입을 건드렸으면 mock 픽스처가 tsc만 깨질 수 있다
pnpm -s test                  # 유닛 전부 통과
pnpm build                    # 정적 export(out/) 그린
```
- **tsc는 반드시 별도 실행**한다. vitest(esbuild)는 타입체크를 하지 않아, `MergedRanking` 형태를 바꾸면 테스트 mock이 vitest는 통과하고 tsc만 실패한다(과거 실제 발생). 실패하면 해당 `*.test.ts(x)`의 mock에 누락 필드를 보강.
- **시각 게이트 (필수, 녹색 테스트가 못 잡는 것)**: 빌드 후 정적 서버를 띄우고 양 로케일에서 상세를 실제로 열어 본다.
  ```bash
  pkill -f "serve.*out" 2>/dev/null; (npx --yes serve@latest out -l 3000 >/tmp/serve.log 2>&1 &); sleep 3
  curl -sI localhost:3000/ko/tools/rankings | head -1   # 200
  ```
  그 다음 Playwright MCP로 `/ko/tools/rankings`·`/en/tools/rankings`에서 카드를 클릭해 확인한다:
  - **콘솔 에러 0** (상세를 열면 ErrorBoundary가 삼키는 크래시가 자주 여기서만 드러난다 — 반드시 열어서 콘솔을 본다).
  - **ProvenanceBanner**(출처+기준일, rose 콜아웃, sourceUrl 있으면 클릭 링크)가 표 위에 강조돼 보임 — 방법론 문구가 잘리지 않고 온전히 렌더되는지 확인.
  - **시맨틱 `<table>`** + top-3 메달 🥇🥈🥉 렌더.
  - **변경 분석을 넣었다면 각 행 설명에 순위/수치 변동 문구가 실제로 보이는지** 육안 확인(생성기·zod는 텍스트 내용을 검증하지 않는다 — 오타·계산 실수는 시각 게이트로만 잡힘).
  - KO는 한글 출처/설명, EN은 영문 출처/설명(로케일 지역화 확인).
- **SEO 프리렌더 확인**: 새/수정 순위가 구조화 데이터에 반영됐는지.
  ```bash
  curl -s localhost:3000/ko/tools/rankings | grep -oE '"@type":"ItemList"' | wc -l   # 순위 수와 일치(프리렌더 HTML에 JSON-LD)
  ```

### 7. 배포 (커밋 → main → push → CF 자동 배포 → 라이브 검증)
배포 = **`main`에 push**. Cloudflare Workers Builds(Git 연동)가 push를 감지해 `pnpm build`+`wrangler deploy`를 자동 실행한다. 로컬 `wrangler deploy`가 아니다.
```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
# 랭킹 범위만 스테이징(무관한 파일은 남긴다)
git add content/rankings/ src/components/tools/rankings/data/rankings.generated.json
# field/i18n을 건드렸으면 함께: src/lib/rankings/ scripts/generate-rankings.mjs src/i18n/messages/{ko,en}.json
git status --short   # 의도치 않은 파일이 섞이지 않았는지 확인
git commit -m "feat(rankings): <무엇을 추가/수정했는지>"
```
- 기능 브랜치/worktree에서 작업했다면 먼저 `main`에 병합해야 배포에 포함된다. 정적 문서(`rankings.generated.json`)는 `prebuild` 훅이 CF 빌드에서 재생성하지만, 커밋에도 포함해 두면 리뷰·재현이 쉽다.
- 커밋을 `main`에 올린 뒤 사용자에게 배포 여부를 확인하고(승인되면):
```bash
git push origin main
```
- **라이브 검증 (배포판 "주장 ≠ 증명")**: push 후 CF 빌드는 대략 1~2분. 라이브가 뜰 때까지 폴링한다.
```bash
for i in $(seq 1 18); do c=$(curl -s -o /dev/null -w "%{http_code}" https://apps.jurepi.kr/ko/tools/rankings); [ "$c" = 200 ] && { echo "live after ~$((i*20))s"; break; }; echo "attempt $i: $c"; sleep 20; done
curl -sI https://apps.jurepi.kr/ko/tools/rankings | head -1     # 200
curl -sI https://apps.jurepi.kr/en/tools/rankings | head -1     # 200
curl -s https://apps.jurepi.kr/ko/tools/rankings | grep -oE '"@type":"ItemList"' | wc -l   # 순위 수와 일치
```
라이브 도메인에서 200 + 새 순위 반영(JSON-LD/제목)을 확인해야 배포 완료로 인정한다.

## 정리
검증에 쓴 임시 스크린샷/서버는 정리한다: `pkill -f "serve.*out"; rm -rf .playwright-mcp *.png`. 임시 진단 E2E 스펙은 커밋하지 않는다.

## 참고
- SPEC(정본): `docs/services/news/rankings/SPEC.md`, `SPEC_KR.md`
- 도메인 계약·컴포넌트: `_workspace/15_architect_rankings-blueprint.md`
- 큰 신규 도구·카테고리·리팩터는 `jurepi-build`(오케스트레이터), 배포 트러블슈팅은 `cloudflare-pages-deploy`.
