# 별별 랭킹 콘텐츠 작성 가이드

## 새 순위 추가 방법

1. `_TEMPLATE.md` + `_TEMPLATE_en.md` 복사
2. `items/` 디렉토리에 저장 (파일명은 slug와 동일, 예: `best-pizza.md`)
3. Frontmatter 작성:
   - title: 순위의 제목
   - field: 분류 (ai, programming, tech, games, movies, music, sports 중 택 1)
   - asOfDate: 기준일 (ISO 날짜: YYYY-MM 또는 YYYY-MM-DD)
   - sourceNote: 출처 설명 (≤200자)
   - sourceUrl: 링크 (선택사항)
   - items: 3개 이상의 항목 (rank, name, description 필수)
4. `pnpm build` 실행 → 자동 검증 후 rankings.generated.json 생성

## 필수 규칙

- **한국어/영어 쌍 필수** — `.md` + `_en.md` 파일이 모두 있어야 함
- **필드(field)는 KO 파일에서 정의, EN은 일치해야 함** — 한국어 파일의 field를 영어 파일에서 복제
- **asOfDate, sourceNote, sourceUrl은 KO 파일이 정본** — 영어 파일에서 동일하게 설정
- **항목은 ≥3개**, 순위(rank)는 **1부터 N까지 연속** (gaps 금지)
- **설명은 평문(마크다운 없음), ≤200자**
- **출처 URL은 유효한 http(s) URL** (선택사항이지만, 있으면 ProvenanceBanner에 링크로 표시됨)
- **각 이미지는 imageWidth + imageHeight 필수** (width/height 없으면 로드 실패)
- **`sourceNote`는 방법론 요약**(무엇을 어떻게 측정하는지), **항목 `description`은 갱신 시 이전 스냅샷 대비 변동**(순위 이동·수치 델타·신규 진입)을 담는다 — 상세 패턴·예시는 `.claude/skills/jurepi-rankings-update/SKILL.md` §4 참고

## 프론트매터 필드 상세

```yaml
title: "[한국어 제목]"        # Required, 필드별 고유성 미요구
field: "ai"                  # Required, enum: ai/programming/tech/games/movies/music
asOfDate: "2026-06"          # Required, ISO date (YYYY-MM 또는 YYYY-MM-DD)
sourceNote: "..."            # Required, ≤200 chars, "출처명 · 날짜" 형식 권장
sourceUrl: "https://..."     # Optional, 유효한 http(s) URL
slug: "..."                  # Optional, 파일명에서 자동 생성 (생략 권장)

items:                        # Required array, ≥3 items
  - rank: 1                  # Consecutive: 1, 2, 3, ...
    name: "항목 이름"        # Required
    description: "..."       # Required, ≤200 chars, plain text
    link: "https://..."      # Optional, 항목 상세 URL
    imageUrl: "https://..."  # Optional, requires imageWidth+imageHeight
    imageWidth: 100          # Required if imageUrl present
    imageHeight: 100         # Required if imageUrl present
```

## 예시: LLM 에이전트 순위

**파일:** `llm-agent-leaderboard.md` + `llm-agent-leaderboard_en.md`

```yaml
---
title: LLM 에이전트 순위
field: ai
asOfDate: "2026-07-17"
sourceNote: "Agent Arena 에이전트 리더보드 기준(누적 105만+ 세션·35개 모델, 성공률·툴환각 등 5개 신호 종합 산정) · 2026년 7월 17일"
sourceUrl: "https://arena.ai/leaderboard/agent"
items:
  - rank: 1
    name: Claude Fable 5 (High)
    description: "제공: Anthropic · 순개선도 13.94% (전월 대비 +0.60%p, 1위 유지)"
  - rank: 2
    name: GPT 5.6 Sol (xHigh)
    description: "제공: OpenAI · 순개선도 10.94% (신규 모델, 7월 13일 추가 · 2위 진입)"
  # ...
---
```

`sourceNote`는 단순 "출처명 · 날짜"가 아니라 **방법론 요약**(무엇을 어떻게 측정·집계하는지)이고, 각 항목 `description`은 이전 스냅샷 대비 **순위 이동·수치 델타·신규 진입 여부**를 괄호로 덧붙인다. 영어 버전은 동일한 field, asOfDate, sourceUrl을 유지하고(sourceNote는 영문으로 지역화 번역, 동일 내용) title과 items만 영어로 번역합니다.

## 검증 및 빌드

`pnpm build` 또는 `pnpm dev`를 실행하면:

1. `scripts/generate-rankings.mjs`가 content/rankings/items/의 모든 .md 파일을 스캔
2. ko/en 쌍을 찾아 검증
3. 필드 및 asOfDate 표준화 확인
4. 순위 연속성 확인
5. 에러가 없으면 `src/components/tools/rankings/data/rankings.generated.json` 생성
6. 에러가 있으면 빌드 실패 (stderr에 상세 메시지 출력)

## 필드별 권장사항

- **ai**: LLM 모델, 에이전트, AI 도구 순위
- **programming**: 프로그래밍 언어, 프레임워크 순위
- **tech**: 기술 트렌드, 도구, 기술 스택 순위
- **games**: 게임 인기도, 순위
- **movies**: 영화 순위
- **music**: 음악, 앨범, 아티스트 순위
- **sports**: 스포츠 대회·팀·선수 순위

---

**마지막 확인:**
- [ ] .md와 _en.md 쌍이 있는가?
- [ ] field가 enum 범위 내인가? (ai, programming, tech, games, movies, music, sports)
- [ ] items가 3개 이상인가?
- [ ] rank가 1부터 연속인가?
- [ ] description이 200자 이하인가?
- [ ] sourceUrl이 있다면 유효한 http(s) URL인가?
