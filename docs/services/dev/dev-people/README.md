# 개발 인물 사전 (Developer People Dictionary)

> 소프트웨어 역사를 만든 인물들의 전기·업적·저서를 담은 큐레이션 인물 디렉토리
> **라이브**: [apps.jurepi.kr/ko/tools/dev-people](https://apps.jurepi.kr/ko/tools/dev-people)

앨런 튜링부터 조코딩까지, 편집자가 직접 작성·검증한 인물 프로필을 제공합니다.
허브에서 이름·태그(자바/파이썬/AI/아키텍처 등 20종)·시대로 탐색하고,
인물별 정적 상세 페이지(스포크)에서 전기·업적 연표·저서·일화를 읽습니다.

## 동작 원리 — 인물은 코드가 아니라 마크다운이다

```
content/dev-people/people/<slug>.md + <slug>_en.md   ← 인물 1명 = 마크다운 쌍
        │  (빌드 타임)
        ▼
scripts/generate-dev-people.mjs                       ← 검증: 쌍 무결성·태그 어휘·연도 정합·
        │                                                업적/저서 ko↔en 일치·사진+크레딧·본문 두께
        ▼                                                (위반 시 빌드 실패 — 조용한 누락 없음)
dev-people.generated.json                             ← 정적 카탈로그
        │
        ├─ 허브 /[locale]/tools/dev-people             (검색·필터·즐겨찾기 SPA)
        ├─ 스포크 /[locale]/tools/dev-people/<slug>    (인물별 SSG 페이지 + Person JSON-LD)
        └─ sitemap.xml                                 (자동 등재)
```

**파일 쌍을 넣고 빌드하면 허브 카드·스포크 페이지·sitemap이 코드 변경 0으로 따라옵니다.**

## 인물 추가하기

### 방법 1 — Claude Code 스킬 (권장)

이 저장소에는 인물 추가의 전 절차(사실 검증 → 사진 라이선스 → 작성 → 검증 → 배포)를
캡슐화한 **`dev-people-author` 스킬**(`.claude/skills/dev-people-author/`)이 포함되어 있습니다.
Claude Code에서 자연어로 요청하면 스킬이 자동 트리거됩니다.

**요청 예시:**

```text
앨런 튜링을 인물 사전에 추가해줘
마거릿 해밀턴 추가해줘 — 아폴로 11호 소프트웨어
존 카맥을 dev-people에 넣어줘
귀도 반 로섬의 업적 연도가 틀렸어, 확인해서 고쳐줘   ← 기존 인물 수정도 동일 스킬
```

**실제 실행 흐름** (앨런 튜링 추가 세션 예):

1. **사실 조사** — 생몰연도·업적 연도·수상을 위키피디아/공식 소스로 검증. 확인 안 되는 것은 뺀다
   (출처 없는 직접 인용 조작 금지, 미공개 생년은 필드 생략 → 나이 자동 비표시)
2. **사진 수집** — Wikimedia Commons API로 라이선스 확인, **PD 또는 CC BY/BY-SA만** 사용,
   480px 리사이즈 후 `public/images/dev-people/alan-turing.jpg` 저장 + `photoCredit` 기록
3. **마크다운 쌍 작성** — `alan-turing.md`(ko, 구조 메타 정본) + `alan-turing_en.md`(en)
4. **검증** — 생성기 실행("✓ Generated catalog: 14 people") → 대상 테스트 → `pnpm build` →
   스포크 프리렌더 HTML에서 H1·전기·Person/BreadcrumbList JSON-LD grep 확인
5. **배포** — 커밋 → `main` push → Cloudflare 자동 빌드+배포 → 라이브 도메인 curl 검증

### 방법 2 — 수동 작성

템플릿(`content/dev-people/_TEMPLATE.md` · `_TEMPLATE_en.md`)을 복사해 직접 작성합니다.
필드 규칙·검증 항목·YAML 함정은 **[작성 가이드 → `content/dev-people/README.md`](../../../../content/dev-people/README.md)** 참고.

```bash
# 작성 후 검증 3종
node scripts/generate-dev-people.mjs    # 카탈로그 생성 (실패 시 파일·필드·사유 출력)
pnpm vitest run src/lib/dev-people src/__test__/generate-dev-people.test.ts
pnpm build                              # 스포크 페이지 자동 생성 확인
```

## 콘텐츠 원칙 (비타협)

- **사실만**: 위키피디아/공식 소스로 확인된 연도·업적·저서만. 불확실하면 뺀다.
- **인용 조작 금지**: 따옴표 발언은 실제로 알려진 인용만. 특히 생존 인물은 공개 확인 가능한 사실만.
- **사진 라이선스**: Commons PD/CC만, CC는 저작자 표기(`photoCredit`) 법적 의무 — 빌드가 강제한다.
- **부정확성 고지**: 모든 인물 페이지 하단에 디스클레이머 고정 노출("정확한 정보는 원문 링크를 확인해 주세요").

## 관련 문서

| 문서 | 내용 |
|------|------|
| [SPEC.md](./SPEC.md) | 서비스 명세 (영문 정본 — AI 에이전트 소비용) |
| [SPEC_KR.md](./SPEC_KR.md) | 명세 국문 번역 |
| [작성 가이드](../../../../content/dev-people/README.md) | 필드 규칙·태그 어휘 20종·검증 항목·YAML 함정 |
| [`dev-people-author` 스킬](../../../../.claude/skills/dev-people-author/SKILL.md) | Claude Code 인물 추가 절차 |
