# 나의 탄생 비밀 / Birthday Secrets — 서비스 스펙 (국문)

> 영문 [`SPEC.md`](SPEC.md)가 AI 소비 정본. 이 문서는 국문 번역이며 변경 시 동기화.

## 개요
생일(양력 월·일)을 입력하면 **탄생화(꽃말)·탄생석(보석말)·탄생색(HEX·키워드)**을 한 장의 "생일 프로필" 카드로 즉시 보여준다. PNG 저장·SNS 공유·`?date=MM-DD` 퍼머링크. "오늘의 탄생"(자동)·커플/궁합 모드. 음력만 아는 사용자는 음력/양력 변환기로 새 창 링크.

- 허브 = 100% 클라이언트 SPA(일별 결과는 브라우저 계산, 날짜별 정적 페이지 없음 = thin-content 회피).
- **월별 12 스포크**(`/tools/birthday-secret/<month>`, 12×ko/en=24)만 SSG로 리치 본문(게이트 밖 SSR) → 정통 "N월 탄생석" SEO 코어.
- 백엔드/DB 없음. localStorage(최근 조회)만, 네트워크 전송 0.

## 확정된 결정
- 표시명 **"나의 탄생 비밀"** / EN "Birthday Secrets" / id·slug `birthday-secret`. "나의 X" 시리즈 첫 도구.
- 카테고리 `fun`, 액센트 `rose`, 아이콘 `Cake`.
- v1 속성: **탄생석 12(월별, 정통·SEO 코어)** · **탄생화 366(일별, 전통 "366일 탄생화" 꽃말)** · **탄생색 366(일별, Jurepi 디자인 스펙트럼 — hue 회전 HEX+이름·키워드, 결정론적 생성)**.
- 이미지 = **실물 사진은 호스팅 안 함**(보석·꽃 사진 무단 저장/서빙 금지). 보석/꽃마다 "🔍 구글 이미지" 새 창 링크는 그대로 유지. 단, **탄생석 12장은 예외** — `jurepi-image-gen` 스킬(로컬 Ollama, 개발 시점 생성)로 만든 **원본 AI 일러스트**(실사진 아님, 저작권 이슈 무관)를 `public/images/birthday-secret/stones/<01-12>.webp`에 정적 자산으로 커밋해 탄생석 이름 옆 장식용 썸네일(`alt=""`)로 표시. 구글 이미지 링크는 병존(실물 사진을 원하는 사용자용).
- 확장 항목(탄생주·과일·조·목·공룡·별) = **otanjoubi.jp 외부 링크**(`?month=MM&day=DD`, 새 창).
- 탄생화·탄생색은 "재미로 보는" 프레이밍 + 디스클레이머 + otanjoubi 출처. 월별 탄생석이 정통 권위.

## 콘텐츠 모델 (데이터셋 주도)
`content/birthday-secret/`:
- `stones.json` — 12 월별 보석 `{month, ko:{name,meaning,color,hardness,origin}, en:{...}, googleQuery}`
- `flowers.json` — 366 일별 꽃 `{key:"MM-DD", ko:{name,meaning}, en:{name,meaning}, googleQuery}`
- `colors.json` — 366 일별 색 `{key, hex, ko:{name,keyword}, en:{name,keyword}}` (생성기가 결정론적으로 생성)
- `months/<month>.md` + `_en.md` — 12 스포크 롱폼 본문(마크다운)

`scripts/generate-birthday-secret.mjs`(prebuild/predev): 366 완전성·hex 유효·ko↔en 패리티·월 12쌍 검증 → 위반 시 빌드 실패 → `birthday-secret.generated.json` 방출.

## 계층
- 도메인 `src/lib/birthday-secret/`: schema·date(윤일 안전)·catalog(무상태 조회)·profile(일→월 매핑)·couple·external-links. 순수 TDD ≥90%.
- UI `src/components/tools/birthday-secret/`: BirthdaySecret(오케스트레이터)·BirthdayInput·ProfileCard·TodayBirth·CoupleMode·ColorPalette·MonthGrid·Intro/HowTo/Faq/StructuredData·MonthSpoke(스포크 서버 컴포넌트).
- 플랫폼: registry 1엔트리(fun/rose/Cake)·`[slug]/page.tsx` 분기·`birthday-secret/[month]/page.tsx` 스포크·sitemap 24·searchable-spokes 12·i18n(최상위 title/description 필수)·llms.txt·toolStyle.

## SEO/GEO · 검증
- 허브 SoftwareApplication+FAQPage, 스포크 Article/DefinedTerm+BreadcrumbList(url==canonical), 전부 게이트 밖 SSR·hreflang.
- 검증: 도메인 ≥90%, 생성기 실패 케이스, E2E(입력→프로필·퍼머링크·오늘·커플·PNG·스포크 SSR·en 누수0·320·pageerror0), sitemap 25 URL, 리더 라이브 시각 게이트.
- 마스코트 `public/characters/birthday-secret.webp` 필수(덕테이프 프롬프트로 사용자 제작).
