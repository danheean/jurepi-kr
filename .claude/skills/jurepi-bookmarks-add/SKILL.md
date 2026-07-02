---
name: jurepi-bookmarks-add
description: >-
  Add, edit, or refresh a topic in the Jurepi.kr 즐겨찾기 (Curated Bookmarks) tool and deploy it.
  Use this whenever the user wants to update bookmarks content — "즐겨찾기 추가", "북마크 추가",
  "주제 추가/수정", "링크 모음 추가", "이 사이트/영상/깃허브 즐겨찾기에 넣어줘", "즐겨찾기 업데이트",
  "bookmarks 업데이트", "즐겨찾기 배포" — or asks to put a curated link collection (a topic with
  YouTube/GitHub/webpage links, resources for X, etc.) into the site. Covers the full path: author
  the ko/en markdown pair, run the build-time generator, verify (tsc + test + build + live visual),
  and DEPLOY (commit → merge main → push → Cloudflare auto build+deploy → verify the live domain).
  Trigger even if the user only says "이 링크들 모아줘" or "add a bookmark topic" without naming the tool.
---

# Jurepi 즐겨찾기 토픽 추가 + 배포

즐겨찾기(Curated Bookmarks, registry id `bookmarks`, `/[locale]/tools/bookmarks`)의 콘텐츠를 추가·수정하고 배포하는 운영 스킬. 토픽은 **코드가 아니라 마크다운 쌍**이다 — 파일을 넣고 생성기를 돌리면 반영된다(코드 변경 0). 요구사항 정본은 `docs/services/dev/bookmarks/SPEC.md`(+ 국문 `SPEC_KR.md`).

작업 디렉터리는 항상 절대경로로: `cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr && …`.

## 콘텐츠 모델 (핵심)

- 토픽 하나 = **국문/영문 마크다운 쌍**: `content/bookmarks/topics/<slug>.md` + `content/bookmarks/topics/<slug>_en.md`.
- 템플릿·작성 규칙: `content/bookmarks/_TEMPLATE.md`, `_TEMPLATE_en.md`, `content/bookmarks/README.md`를 먼저 읽고 그 형식을 따른다.
- 생성기 `scripts/generate-bookmarks.mjs`가 폴더를 스캔·검증해 `src/components/tools/bookmarks/data/bookmarks.generated.json`으로 굽는다. `predev`/`prebuild`에 배선돼 있어 dev/build 시 자동 실행된다.
- 토픽 탭·검색·상세는 **카탈로그에서 자동 파생**된다 — 쌍만 넣으면 리스트·검색·상세에 나타난다. 레지스트리/라우트/i18n 변경 불필요(그건 새 *도구*를 만들 때만 — `jurepi-build`).
- **링크 리치 렌더는 자동(빌드타임 베이킹, 마크다운에 안 씀)**: 생성기가 각 링크에 `youtubeId`(임베드 가능 영상 URL)와 `image`(og:image)를 구워 넣는다. 임베드 가능 YouTube 영상(watch/youtu.be/embed/shorts) → 상세에서 클릭-투-로드 라이트 임베드(`youtube-nocookie` iframe). 그 외(채널·GitHub·웹페이지) → og:image가 있으면 64px 썸네일, 없으면 평범한 행. **OG는 cache-first**: `content/bookmarks/.og-cache.json`(URL→{image})에 있으면 네트워크 없이 재사용, 없으면 5s 타임아웃 fetch 후 캐시(실패는 null 캐시=폴백, 빌드 실패 안 함). **새 링크를 추가하면 로컬에서 생성기를 한 번 돌려 OG를 fetch·캐시한 뒤 `.og-cache.json`을 반드시 함께 커밋**한다(그래야 CF 빌드가 오프라인·결정적). YouTube 영상 썸네일은 id에서 유도하므로 fetch 안 함.

### frontmatter 필드 (한 파일 기준)
```yaml
title: "…"                 # 필수, 로케일별(KO 파일=한글 제목, EN 파일=영문 제목)
slug: "<kebab-case>"       # KO canonical. 없으면 파일명에서 파생. EN 파일도 같은 slug 명시 권장
description: "…"           # 필수, 로케일별, 큐레이터 의도, 플레인 텍스트 ≤200자
sections:                  # 필수, ≥1개 섹션. 토픽 전체 링크 합 ≥3개
  - heading: "…"           # 필수, 섹션 제목(예: "공식 포털·문서", "GitHub", "YouTube 영상")
    links:                 # 섹션당 ≥1개
      - label: "…"         # 필수, 링크 표시 이름
        url: "https://…"   # 필수, 유효한 http(s) URL (rel=noopener target=_blank로 렌더)
        description: "…"   # 선택, 플레인 텍스트 ≤100자
```

**꼭 기억할 규칙 (생성기 불변식 + 도구 일관성):**
- **쌍 필수**: KO(`<slug>.md`)와 EN(`<slug>_en.md`) 둘 다 있어야 한다. 하나만 있으면 orphan → 빌드 실패.
- **제목·설명·섹션·링크는 로케일별로 지역화**한다(다른 도구가 모든 콘텐츠를 ko/en 지역화하는 것과 일관). EN 파일에 한글이 새지 않게. 섹션/링크는 로케일 간 달라도 된다(다만 대개 같은 구조로 번역).
- **≥1 섹션, 토픽 전체 링크 ≥3개**, 모든 `url`은 유효한 http(s)여야 한다. `label`은 비어 있으면 안 된다.
- 파일명(slug)은 **ASCII kebab-case**로 짓는다(예: `egovframe-standard.md`, 한글 파일명 금지 — slug 파생이 꼬인다).
- 생성기는 다음 위반 시 **빌드를 실패**(exit 1)시킨다: 쌍 누락, 섹션 0개, 링크 <3, 잘못된/빈 URL, 빈 label, slug 중복, description >200자·link description >100자. 실패 메시지의 파일·필드·사유를 그대로 고친다.
- 링크가 실제 존재하는 **진짜 URL**인지 확인한다(웹 리소스면 `WebSearch`/`WebFetch`로 실 URL 확보). 생성기는 형식만 검사하니 죽은 링크는 사람이 막아야 한다.

## 워크플로우

### 1. 계획 — 무엇을, 어떤 링크
- 어떤 토픽인지, 어떤 섹션으로 나눌지(예: 공식 문서 / GitHub / YouTube 영상), 각 링크의 실제 URL을 확정한다.
- 웹 리소스면 `WebSearch`/`WebFetch`로 **정확한 URL**을 가져와 인용한다(공식 사이트·공식 저장소·채널 우선). 임의 URL·추정 URL 금지.
- 기존 토픽 수정이면 해당 `content/bookmarks/topics/<slug>{,_en}.md`를 편집. 새 토픽이면 새 쌍을 만든다.

### 2. 마크다운 쌍 작성/수정
- `_TEMPLATE.md`/`_TEMPLATE_en.md` 형식을 그대로 따른다. KO/EN 두 파일 모두 만든다(쌍 필수). 두 파일에 같은 `slug`를 명시.
- 제목·설명·섹션 heading·링크 label/description은 각 로케일 언어로.

### 3. 생성 + 확인
```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
node scripts/generate-bookmarks.mjs
node -e "const d=require('./src/components/tools/bookmarks/data/bookmarks.generated.json'); console.log('topics:',d.length); d.forEach(t=>console.log(' -',t.slug,'| sections:',t.ko.sections.length,'| ko links:',t.ko.sections.reduce((a,s)=>a+s.links.length,0),'| en links:',t.en.sections.reduce((a,s)=>a+s.links.length,0)))"
```
토픽 수·섹션 수·ko/en 링크 수(≥3)를 눈으로 확인한다. 생성기가 exit 1이면 사유대로 콘텐츠를 고치고 재실행.

### 4. 검증 게이트 (전부 리더가 직접 재실행 — "주장 ≠ 증명")
순서대로, 각 단계 그린을 확인한 뒤 다음으로:
```bash
pnpm exec tsc --noEmit        # 콘텐츠만 바꿨으면 대개 무영향, 스키마를 건드렸으면 필수
pnpm -s test                  # 유닛 전부 통과(도메인 lib/bookmarks 포함)
pnpm build                    # 정적 export(out/) 그린. /ko·/en tools/bookmarks 생성 확인
```
- **시각 게이트 (필수, 녹색 테스트가 못 잡는 것)**: 빌드 후 정적 서버를 띄우고 양 로케일에서 **카드를 클릭해 상세를 실제로 연다**.
  ```bash
  pkill -f "serve.*out" 2>/dev/null; (npx --yes serve@latest out -l 3100 >/tmp/serve.log 2>&1 &); sleep 3
  curl -sI localhost:3100/ko/tools/bookmarks | head -1   # 200
  ```
  Playwright MCP로 `/ko/tools/bookmarks`·`/en/tools/bookmarks`에서 새 토픽 카드를 클릭해 확인한다:
  - **선택 링(sky 링)만 보고 통과 금지 — 상세 패널이 실제로 열려 섹션 heading + 링크 행이 렌더**되는지 스냅샷/스크린샷으로 본다. (과거 실제 결함: 훅이 카탈로그를 `initCatalog` 초기화 안 해 `byId`가 null → 카드 선택 링은 켜지는데 상세가 전혀 안 떴고 tsc·전체 유닛은 그린이었다. 상세 콘텐츠 렌더까지 눈으로 확인해야 잡힌다.)
  - **콘솔 에러 0** — 특히 `MISSING_MESSAGE`(ui가 카탈로그에 없는 i18n 키를 쓰면 런타임에만 터진다). 카드 클릭 시나리오에서 재확인.
  - 각 링크 행에 **외부링크 아이콘**·`target=_blank rel=noopener`, KO는 한글 label/설명, EN은 영문.
  - **YouTube 영상 링크는 클릭-투-로드 임베드**로 보이는지(썸네일+▶ 파사드 → 클릭 시 `youtube-nocookie` iframe 전환), **og:image 있는 링크는 64px 썸네일**이 뜨는지 확인. og 없는 링크는 평범한 행으로 폴백돼야 한다(깨진 이미지 금지).
  - 320px에서 링크 행이 가로 오버플로 없이 스택되는지.
- **SEO/GEO 프리렌더 확인**: 새 토픽이 구조화 데이터(ItemList)와 프리렌더 HTML에 반영됐는지(AI 크롤러는 JS 미실행 → 게이트 밖 SSR이어야 노출).
  ```bash
  curl -s localhost:3100/ko/tools/bookmarks | grep -o '"@type":"ItemList"' | wc -l   # 토픽 수와 일치
  curl -s localhost:3100/ko/tools/bookmarks | grep -o '<title>[^<]*</title>' | head -1   # 고유 제목
  ```

### 5. 배포 (커밋 → main → push → CF 자동 배포 → 라이브 검증)
배포 = **`main`에 push**. Cloudflare Workers Builds(Git 연동)가 push를 감지해 `pnpm build`+`wrangler deploy`를 자동 실행한다. 로컬 `wrangler deploy`가 아니다.
```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
# 즐겨찾기 범위만 스테이징(무관한 파일·스크래치는 남긴다)
git add content/bookmarks/ src/components/tools/bookmarks/data/bookmarks.generated.json
git status --short   # 의도치 않은 파일(_workspace/*.png/.playwright-mcp)이 섞이지 않았는지 확인
git commit -m "feat(bookmarks): <무엇을 추가/수정했는지>"
```
- 기능 브랜치/worktree에서 작업했다면 먼저 `main`에 병합해야 배포에 포함된다. `bookmarks.generated.json`은 `prebuild` 훅이 CF 빌드에서 재생성하지만, 커밋에도 포함해 두면 리뷰·재현이 쉽다.
- 커밋을 `main`에 올린 뒤 **사용자에게 배포 여부를 확인**하고(승인되면):
```bash
git push origin main
```
- **라이브 검증 (배포판 "주장 ≠ 증명")**: push 후 CF 빌드는 대략 1~2분. 라이브가 뜰 때까지 폴링한다.
```bash
for i in $(seq 1 18); do c=$(curl -s -o /dev/null -w "%{http_code}" https://apps.jurepi.kr/ko/tools/bookmarks); [ "$c" = 200 ] && { echo "live after ~$((i*20))s"; break; }; echo "attempt $i: $c"; sleep 20; done
curl -sI https://apps.jurepi.kr/ko/tools/bookmarks | head -1     # 200
curl -sI https://apps.jurepi.kr/en/tools/bookmarks | head -1     # 200
curl -s https://apps.jurepi.kr/ko/tools/bookmarks | grep -o '"@type":"ItemList"' | wc -l   # 토픽 수와 일치
```
라이브 도메인에서 200 + 새 토픽 반영(JSON-LD/제목/링크)을 확인해야 배포 완료로 인정한다.

## 정리
검증에 쓴 임시 스크린샷/서버는 정리한다: `pkill -f "serve.*out"; rm -rf .playwright-mcp *.png`. 임시 진단 E2E 스펙은 커밋하지 않는다.

## 참고
- SPEC(정본): `docs/services/dev/bookmarks/SPEC.md` (국문 번역 `SPEC_KR.md`는 아직 없음 — 필요 시 영문 정본 기준으로 작성)
- 도메인 계약·컴포넌트 청사진: `_workspace/01_architect_bookmarks-blueprint.md`
- 큰 신규 도구·카테고리·리팩터는 `jurepi-build`(오케스트레이터), 배포 트러블슈팅은 `cloudflare-pages-deploy`.
