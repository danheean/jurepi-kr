---
name: dev-people-author
description: 개발 인물 사전(dev-people)에 새 인물을 추가하거나 기존 인물을 수정할 때 사용. "인물 추가", "OO을 인물 사전에 넣어줘", "dev-people 콘텐츠", "인물 마크다운" 같은 요청에 트리거. 마크다운 쌍 작성 → 사진 수집(라이선스) → 검증 → 빌드까지의 전 절차와 함정을 캡슐화한다.
---

# 개발 인물 사전 — 인물 추가/수정 절차

새 인물 1명 = `content/dev-people/people/<slug>.md`(한국어) + `<slug>_en.md`(영어) 쌍 + (선택) `public/images/dev-people/<slug>.jpg`. 빌드 타임에 `scripts/generate-dev-people.mjs`가 검증 후 카탈로그로 굽고, 허브 카드·스포크 페이지(`/[locale]/tools/dev-people/<slug>`)·sitemap이 **자동으로** 따라온다(코드 변경 0).

템플릿 정본: `content/dev-people/_TEMPLATE.md` · `_TEMPLATE_en.md` · `README.md`. 요구사항 정본: `docs/services/dev/dev-people/SPEC.md`(content_authoring_model).

## 절차 (순서대로)

### 1. 사실 조사 — 쓰기 전에 검증한다
- 생년·업적 연도·저서·수상은 **위키피디아/공식 소스로 확인한 것만** 쓴다. 확인 못 한 항목은 **뺀다**(지어내기 절대 금지).
- 출생연도가 공개되지 않은 인물(예: 조코딩)은 `birthYear` 자체를 **생략**한다 — 나이는 자동으로 표시 생략된다. 추정치 기입 금지.
- **직접 인용 조작 금지(비타협)**: 따옴표로 감싼 발언은 실제로 널리 알려진 인용만(예: 토발즈 "Just for fun"). 인물의 철학·동기는 간접 서술로. 특히 **생존 인물**(한국인 크리에이터 등)은 공개적으로 확인 가능한 사실만, 사생활 서술 금지.
- 주의: 작업 컨텍스트의 다른 문구(예: 운영자 모토 "배워서 남주자")가 인물 서술에 새어들지 않는지 확인 — 실제 발생했던 오염이다.

### 2. 사진 수집 (선택 — 없으면 이니셜 아바타 폴백)
- **Wikimedia Commons에서 Public Domain 또는 CC BY/BY-SA만** 사용. 라이선스 불명확 → 사진 없이 진행(유튜브 프로필 등 무단 사용 금지).
- 라이선스·저작자는 Commons API로 확인: `https://commons.wikimedia.org/w/api.php?action=query&titles=File:<파일명>&prop=imageinfo&iiprop=url|extmetadata&format=json` (`extmetadata.Artist`, `LicenseShortName`)
- 다운로드 후 리사이즈: `sips -Z 480 -s format jpeg -s formatOptions 80 <원본> --out public/images/dev-people/<slug>.jpg`
- frontmatter: `photo: <slug>.jpg` + `photoCredit: "Wikimedia Commons © <저작자>, <라이선스>"` — **CC는 저작자 표기가 법적 의무**(photo 있는데 photoCredit 없으면 빌드 실패). PD는 `"Wikimedia Commons, Public Domain"`.

### 3. 마크다운 쌍 작성
`_TEMPLATE.md`/`_TEMPLATE_en.md`를 복사해 시작한다. 구조 규칙:

| 필드 | 정본 | 규칙 |
|------|------|------|
| name/knownFor/aliases/본문 | 로케일별 | knownFor **각 로케일 50자 이상** |
| slug/tags/era/nationality/photo/photoCredit/related/links | **ko 파일** | en은 생략(상속). ko에 tags(≥1)·era·nationality **필수** |
| achievements/books | 양쪽 | **개수·year가 ko↔en 정확히 일치**(title만 번역). url은 ko만 |
| birthYear/deathYear | 양쪽 동일 | 선택. birth ≤ death |

- tags는 통제 어휘 20종만: `java python javascript c cpp linux git ai deep-learning clean-code architecture tdd agile refactoring design-patterns free-software web game education youtube` (어휘 밖 태그 = 빌드 실패)
- era: `1940-1960 | 1960-1980 | 1980-2000 | 2000-present` (주 활동기)
- nationality: ISO 3166-1 alpha-2 권장(예: US, KR) — UI가 `Intl.DisplayNames`로 로케일 국가명 렌더. 비ISO는 원문 폴백 표시됨.
- related: **카탈로그에 실존하는 slug만**(dangling = 빌드 실패)
- links: http(s)만, 실존 URL 2~4개(Wikipedia ko/en·공식·GitHub). label은 정확하게(회사 홈을 "프로필"이라 하지 말 것).
- 본문: ko `## 소개`(2~4단락) + `## 일화`, en `## About` + `## Anecdotes`. 헤딩 필수·본문 100자 이상(thin-content 빌드 실패). 마크다운 서식 가능, HTML 금지.

### 4. YAML 함정 (이번 빌드에서 12곳 실패한 패턴)
- **값에 `: `(콜론+공백)이 들어가면 값 전체를 큰따옴표로 감싼다.** 특히 부제 있는 책 제목:
  - ❌ `title: "Design Patterns: Elements" 출판` (따옴표 뒤 텍스트 = 파스 에러)
  - ❌ `title: Neural Networks: Zero To Hero 공개`
  - ✅ `title: "『Design Patterns: Elements』 출판"`
- 값 안의 큰따옴표는 `\"` 이스케이프 또는 『』/'' 로 대체.

### 5. 검증 (필수 — 주장 말고 실행)
```bash
node scripts/generate-dev-people.mjs   # "✓ Generated catalog: N people" 확인 (실패 시 파일·필드·사유 출력)
pnpm vitest run src/lib/dev-people src/__test__/generate-dev-people.test.ts src/app/sitemap.test.ts
pnpm build                             # 스포크 페이지 자동 생성 (13인 기준 120p → +2p/인물)
```
- 새 인물 스포크 프리렌더 확인: `out/ko/tools/dev-people/<slug>.html`에 H1·전기 본문·`"@type":"Person"` 1개·`"@type":"BreadcrumbList"` 1개가 있는지 grep.
- sitemap·generateStaticParams·허브 카드는 generated.json에서 파생되므로 별도 배선 불필요. **sitemap.test.ts 기대값도 카탈로그 파생이라 자동 통과**해야 정상 — 실패하면 하드코딩 회귀다.

### 6. 커밋
- 범위: `content/dev-people/people/<slug>*.md` + `public/images/dev-people/<slug>.jpg`(있으면). 커밋 전 `git status --short`로 스테이징 누락 확인.
- 배포 = main에 push (CF 자동 빌드+배포).

## 기존 인물 수정
- 사실 정정: 해당 필드만 수정하되 achievements/books는 **ko/en 양쪽 동시에**(개수·연도 일치 유지).
- slug는 절대 변경 금지(스포크 URL·즐겨찾기·related가 참조).
