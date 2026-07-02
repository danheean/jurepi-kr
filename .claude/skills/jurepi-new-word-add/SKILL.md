---
name: jurepi-new-word-add
description: >-
  Add, edit, or refresh a term in the Jurepi.kr 신조어 용어사전 (New Word Glossary) tool and
  deploy it. Use this whenever the user wants to add or update dictionary content — "신조어 추가",
  "신조어 등록", "용어 추가/수정", "새 단어 넣어줘", "용어사전 업데이트", "이 유행어 사전에 추가해줘",
  "MZ 용어 추가", "기술 용어 추가", "new-word 업데이트", "용어 배포" — or asks to put a new
  neologism / slang / trend / tech term (갓생, 바이브 코딩, AI 에이전트 등) with its meaning and
  examples into the site. Covers the full path: author the ko/en markdown pair, register a new
  topic if needed, run the build-time generator, verify (tsc + test + build + live visual), and
  DEPLOY (commit → merge main → push → Cloudflare auto build+deploy → verify the live domain).
  Trigger even if the user only says "이 단어 추가해줘" without naming the tool.
---

# Jurepi 신조어 용어사전 추가 + 배포

신조어 용어사전(New Word Glossary, registry id `new-word`, `/[locale]/tools/new-word`)의 용어를 추가·수정하고 배포하는 운영 스킬. 용어는 **코드가 아니라 마크다운 쌍**이다 — 파일을 넣고 생성기를 돌리면 반영된다. 요구사항 정본은 `docs/services/text/new-word/SPEC.md`(+ 국문 `SPEC_KR.md`).

작업 디렉터리는 항상 절대경로로: `cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr && …`.

## 콘텐츠 모델 (핵심)

- 용어 하나 = **국문/영문 마크다운 쌍**: `content/new-word/terms/<slug>.md` + `content/new-word/terms/<slug>_en.md`. 둘 다 필수 — 한쪽만 있으면 빌드 실패.
- 템플릿·작성 규칙: `content/new-word/_TEMPLATE.md`, `_TEMPLATE_en.md`, `content/new-word/README.md`를 먼저 읽고 그 형식을 따른다. 기존 용어(예: `terms/vibe-coding.md`)를 실례로 참고.
- 생성기 `scripts/generate-glossary.mjs`가 `terms/` 폴더를 스캔·검증해 `src/components/tools/new-word/data/terms.generated.json`으로 굽는다. `predev`/`prebuild`에 배선돼 있어 dev/build 시 자동 실행된다. `_`로 시작하는 파일(템플릿)은 제외된다.

### frontmatter 필드 (한 파일 기준)
```yaml
# ── 필수 (로케일별로 각 언어로 작성) ──
term: "…"               # 표시 이름 (KO=한글, EN=영문)
definition: |           # 뜻 1~3문장, 명확·간결
  …
examples:               # ≥1개, 실제 용례
  - "…"
# ── 구조 메타 (KO canonical; EN 생략 시 상속, 명시하면 KO와 일치해야 함) ──
slug: "<kebab-case>"    # KO 파일에만(선택; 없으면 파일명에서 파생). /^[a-z0-9-]+$/, 카탈로그 내 유일. EN은 생략
topic: mz               # enum: mz | tech. EN 생략(KO 상속)
tags: [AI, 개발, 트렌드]  # 선택, 검색·표시용
coinedYear: 2024        # 선택, 등장 연도(정렬 키)
related: [slug1, slug2] # 선택, 관련 용어 slug — 카탈로그에 실재해야 함
tone: positive          # 선택 enum: positive | negative | neutral
# ── 로케일별 독립 (KO/EN 각각 자유) ──
reading: "바이브 코딩"    # 선택, 발음/읽기 보조 (EN은 IPA 등)
aliases: [바이브코딩, 바코] # 선택, 검색 별칭
origin: "2024년 개발자 커뮤니티에서 확산"  # 선택, 어원/유래
```

**꼭 기억할 규칙 (다른 도구와의 일관성 + 생성기 불변식):**
- `term`/`definition`/`examples`/`reading`/`aliases`/`origin`은 **로케일별로 각 언어로** 작성한다 — 다른 도구가 모든 콘텐츠를 ko/en 지역화하는 것과 일관. 영문 페이지에 한글이 새지 않게 EN 파일엔 영문으로 쓴다.
- `slug`/`topic`/`tags`/`coinedYear`/`related`/`tone`은 KO canonical(EN 생략 시 상속, 명시하면 KO와 일치해야 함).
- **slug는 불변 식별자** — `related`/즐겨찾기/최근본이 이걸로 참조한다. 기존 용어의 slug를 바꾸면 링크가 깨진다. 파일명=slug로 두는 게 안전(예: `god-saeng.md` → slug `god-saeng`).
- 생성기는 다음 위반 시 **빌드를 실패**(exit 1)시킨다: 쌍 누락(ko-only/en-only), 빈 `term`/`definition`/`examples`, slug 정규식 위반, slug 중복, `related`가 없는 slug 참조, 구조 메타 불일치(예: EN topic≠KO topic). 실패 메시지의 파일·필드·사유를 그대로 고친다.
- 정렬은 topic → coinedYear 내림차순 → term. `coinedYear`를 주면 최신 용어가 위로 온다.

## 워크플로우

### 1. 계획 — 무엇을, 어떤 topic으로
- 추가할 용어, 뜻, 예문 2개 이상, topic(mz/tech), 등장 연도를 확정한다.
- 어원·유래·출처가 애매하면 `WebFetch`/`WebSearch`로 확인하고 `origin`에 사실만 적는다. 임의로 지어내지 않는다.
- 기존 용어 수정이면 해당 `content/new-word/terms/<slug>{,_en}.md`를 편집. 새 용어면 새 쌍을 만든다.

### 2. 새 topic이 필요한가?
현재 enum: `['mz', 'tech']`. 이 둘로 안 되는 분야면 **세 곳을 함께** 고쳐야 한다(안 그러면 생성기 검증 실패 또는 런타임 MISSING_MESSAGE):
1. `src/lib/new-word/schema.ts` — 두 `z.enum(['mz', 'tech'])`에 새 id 추가.
2. `scripts/generate-glossary.mjs` — 인라인 zod enum 두 곳(라인 ~24, ~36)에도 동일하게 추가. 생성기는 독립 복제본이라 반드시 함께 고친다. 정렬 맵 `topicOrder`(라인 ~298)에도 새 id를 추가.
3. `src/i18n/messages/ko.json` + `en.json` — `tools.new-word.topics.<id>` 라벨(ko/en) 추가.
대부분의 신조어는 `mz`(유행어·인터넷·트렌드) 또는 `tech`(소프트웨어·AI·엔지니어링)로 충분하다. topic 추가는 정말 필요할 때만.

### 3. 마크다운 쌍 작성/수정
- `_TEMPLATE.md`/`_TEMPLATE_en.md` 형식을 그대로 따른다. KO/EN 두 파일 모두 만든다(쌍 필수).
- 필수 필드(term/definition/examples)를 각 언어로 채운다. 뜻은 1~3문장, 예문은 추상 정의 말고 실제 용례로 2개 이상.
- 구조 메타(topic 등)는 KO 파일에만 두고 EN은 상속받게 한다(중복·불일치 방지).

### 4. 생성 + 확인
```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
node scripts/generate-glossary.mjs
node -e "const d=require('./src/components/tools/new-word/data/terms.generated.json'); console.log('total:', d.length); d.slice(-5).forEach(t=>console.log(t.slug,'| topic:',t.topic,'| ko.term:',t.ko.term,'| en.term:',t.en.term,'| ex:',t.ko.examples.length))"
```
용어 수·topic·**ko/en term이 각 언어로 구분**되는지·예문 수를 눈으로 확인한다. 생성기가 exit 1이면 사유대로 콘텐츠를 고치고 재실행.

### 5. 검증 게이트 (전부 리더가 직접 재실행 — "주장 ≠ 증명")
순서대로, 각 단계 그린을 확인한 뒤 다음으로:
```bash
pnpm exec tsc --noEmit        # vitest 그린 ≠ tsc 그린! 스키마/타입을 건드렸으면 mock 픽스처가 tsc만 깨질 수 있다
pnpm -s test                  # 유닛 전부 통과
pnpm build                    # 정적 export(out/) 그린
```
- **tsc는 반드시 별도 실행**한다. vitest(esbuild)는 타입체크를 안 해, 스키마(`GlossaryTerm` 등) 형태를 바꾸면 테스트 mock이 vitest는 통과하고 tsc만 실패한다. 실패하면 해당 `*.test.ts(x)` mock에 누락 필드를 보강.
- topic enum을 추가했다면 `pnpm -s test`가 i18n 키 대조·enum 테스트에서 누락을 잡아준다. MISSING_MESSAGE가 나면 `topics.<id>` 라벨 누락이다.
- **시각 게이트 (필수, 녹색 테스트가 못 잡는 것)**: 빌드 후 정적 서버를 띄우고 양 로케일에서 실제로 열어 본다.
  ```bash
  pkill -f "serve.*out" 2>/dev/null; (npx --yes serve@latest out -l 3000 >/tmp/serve.log 2>&1 &); sleep 3
  curl -sI localhost:3000/ko/tools/new-word | head -1   # 200
  ```
  그 다음 Playwright MCP로 `/ko/tools/new-word`·`/en/tools/new-word`에서 확인한다:
  - **콘솔 에러 0** (클라이언트 섬이 크래시하면 ErrorBoundary가 삼켜 여기서만 드러난다 — 반드시 열어서 콘솔을 본다).
  - 새 용어가 목록/검색에 나오고, topic 탭·즐겨찾기가 동작하며, 뜻·예문이 렌더된다.
  - KO는 한글 term/definition, EN은 영문 term/definition(로케일 지역화 확인). 새 용어를 검색창에 넣어 매칭도 본다.
- **SEO 프리렌더 확인**: 새 용어가 구조화 데이터(`DefinedTermSet` 안의 `DefinedTerm`)에 반영됐는지. AI 크롤러는 JS 미실행이므로 프리렌더 HTML에 있어야 한다.
  ```bash
  curl -s localhost:3000/ko/tools/new-word | grep -oE '"@type":"DefinedTerm"' | wc -l   # 용어 수와 비례(프리렌더 JSON-LD)
  curl -s localhost:3000/ko/tools/new-word | grep -q "<새 용어 term>" && echo "term in prerender HTML"
  ```

### 6. 배포 (커밋 → main → push → CF 자동 배포 → 라이브 검증)
배포 = **`main`에 push**. Cloudflare Workers Builds(Git 연동)가 push를 감지해 `pnpm build`+`wrangler deploy`를 자동 실행한다. 로컬 `wrangler deploy`가 아니다.
```bash
cd /Users/jurepi/Work/Jurepi-Company/Jurepi.kr
# new-word 범위만 스테이징(무관한 파일은 남긴다)
git add content/new-word/ src/components/tools/new-word/data/terms.generated.json
# topic/i18n을 건드렸으면 함께: src/lib/new-word/schema.ts scripts/generate-glossary.mjs src/i18n/messages/{ko,en}.json
git status --short   # 의도치 않은 파일이 섞이지 않았는지 확인
git commit -m "feat(new-word): <추가/수정한 용어>"
```
- 기능 브랜치/worktree에서 작업했다면 먼저 `main`에 병합해야 배포에 포함된다. 생성물(`terms.generated.json`)은 `prebuild` 훅이 CF 빌드에서 재생성하지만, 커밋에도 포함해 두면 리뷰·재현이 쉽다.
- 커밋을 `main`에 올린 뒤 사용자에게 배포 여부를 확인하고(승인되면):
```bash
git push origin main
```
- **라이브 검증 (배포판 "주장 ≠ 증명")**: push 후 CF 빌드는 대략 1~2분. 라이브가 뜰 때까지 폴링한다.
```bash
for i in $(seq 1 18); do c=$(curl -s -o /dev/null -w "%{http_code}" https://apps.jurepi.kr/ko/tools/new-word); [ "$c" = 200 ] && { echo "live after ~$((i*20))s"; break; }; echo "attempt $i: $c"; sleep 20; done
curl -sI https://apps.jurepi.kr/ko/tools/new-word | head -1     # 200
curl -sI https://apps.jurepi.kr/en/tools/new-word | head -1     # 200
curl -s https://apps.jurepi.kr/ko/tools/new-word | grep -q "<새 용어 term>" && echo "deployed"
```
라이브 도메인에서 200 + 새 용어 반영(프리렌더 HTML/JSON-LD)을 확인해야 배포 완료로 인정한다.

## 정리
검증에 쓴 임시 스크린샷/서버는 정리한다: `pkill -f "serve.*out"; rm -rf .playwright-mcp *.png`. 임시 진단 E2E 스펙은 커밋하지 않는다.

## 참고
- SPEC(정본): `docs/services/text/new-word/SPEC.md`, `SPEC_KR.md`
- 콘텐츠 작성 가이드: `content/new-word/README.md`, 템플릿 `_TEMPLATE.md`/`_TEMPLATE_en.md`
- 자매 운영 스킬(같은 마크다운-쌍 모델): `jurepi-rankings-update`(별별 랭킹)
- 큰 신규 도구·카테고리·리팩터는 `jurepi-build`(오케스트레이터), 배포 트러블슈팅은 `cloudflare-pages-deploy`.
