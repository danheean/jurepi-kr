# 몸으로 말해요 (Charades) — 몸짓 전용 파티 제시어 게임 — 서비스 SPEC (국문 번역)

> 이 문서는 [`SPEC.md`](SPEC.md)(영문 정본)의 국문 번역입니다. 정본이 변경되면 이 문서도 함께 갱신합니다.

## 개요

"몸으로 말해요"는 이미 배포된 자매 도구 **스피드퀴즈 제시어**(`docs/services/fun/speed-quiz/SPEC.md`)와 게임 골격이
거의 동일한 파티/교실용 게임입니다. 연기자가 자신의 화면에만 제시어를 띄운 뒤 **말·입모양·효과음 없이 몸짓·표정만으로**
그 단어를 표현하고, 팀원들이 큰 소리로 답을 외칩니다. 진행자(대개 연기자 본인의 기기)가 "정답"/"패스"를 눌러 라운드를
진행하며, 카운트다운 타이머(기본 30~90초, 조정 가능)가 함께 흐릅니다. 모든 단어가 끝나거나 시간이 다 되면 요약 화면에
"맞힘 7 / 패스 2 / 시간초과 1"과 전체 단어 목록이 표시됩니다.

**스피드퀴즈 제시어와의 유일한 본질적 차이는 메커니즘이 아니라 콘텐츠입니다.** 스피드퀴즈의 제시어는 말/지식으로
설명해서 맞히는 방식(속담, 브랜드명, K-pop 그룹 등 — 진행자가 "말해야" 하는 단어)인 반면, 몸으로 말해요의 제시어는
**침묵 속에서 몸으로만 시연 가능한 것**이어야 합니다: 구체적 동작/행동, 동물(소리가 아닌 움직임/자세로 구별), 직업
(특징적 행동으로), 원형적 역할/캐릭터(저작권 있는 특정 캐릭터가 아닌 아이콘적 포즈로), 스포츠(동작으로), 단순한
감정(표정+몸짓으로). 아래 큐레이션 체크리스트로 모든 시드 단어를 검증했습니다 — **추상적 개념·속담·브랜드명 등
말이나 문자 지식으로만 식별 가능한 것은 이 도구의 범위 밖**(그건 스피드퀴즈의 영역이며 여기서 중복하지 않습니다).

## 코드 공유 결정 (비타협 — 구현 전 필독)

콘텐츠와 무관한 게임 엔진(`fairShuffle` 시드 셔플, 진행 상태 리듀서, Web Audio 톤 합성, 즐겨찾기/최근 배열 연산,
slug 유틸)은 이미 `src/lib/speed-quiz/{shuffle,game-reducer,sound,favorites,slug}.ts`에 순수하고 테스트된 형태로
존재하며 **speed-quiz의 카테고리 어휘와 전혀 결합돼 있지 않습니다.** 이 도구는 그 엔진을 재구현하지 않습니다:

1. 위 5개 파일을 새 공유 모듈 `src/lib/party-word-game/{shuffle,game-reducer,sound,favorites,slug}.ts`(+테스트)로
   그대로 이관.
2. speed-quiz의 5개 파일은 **기존 경로 그대로** 얇은 재export(`export * from '@/lib/party-word-game/shuffle'`)로
   전환 — 공개 API·임포트·기존 테스트가 무변경으로 통과해야 함. 이 리팩터 후 **speed-quiz 전체 회귀(유닛+E2E)가
   그린임을 확인한 뒤에만** charades 전용 작업을 진행합니다.
3. `src/lib/charades/{shuffle,game-reducer,sound,favorites,slug}.ts`도 `party-word-game`에서 재export(charades는
   동일 엔진을 그대로 소비, 별도 사본 없음).
4. `schema.ts`/`merge.ts`/`catalog.ts`와 generator 스크립트는 **도구별로 유지**(카테고리 enum·기본값이 실제로
   다름) — speed-quiz 패턴을 미러링하되 charades 고유 카테고리 목록으로 별도 파일 작성.
5. UI 컴포넌트(GameBoard·GameSetup·GameSummary·DeckBrowser·DeckCard·SoundToggle)는 **공유하지 않습니다** —
   charades는 speed-quiz 구조를 미러링한 신규 파일을 갖습니다. 이유: speed-quiz UI는 이미 여러 차례 impeccable
   폴리시를 거쳐 배포됐고, 공유 컴포넌트로 리트로핏하면 이미 검증된 배포 화면에 시각/동작 회귀 위험이 생깁니다.
   UI의 구조적 중복(같은 패턴, 별도 파일)은 감수하되, **알고리즘 중복은 허용하지 않습니다.**

이 SPEC은 **도구 자체**만 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO/광고 인프라, 디자인
토큰은 플랫폼이 제공합니다 — `docs/SPEC.md`, `docs/DESIGN.md`, 참고 자매 도구 `docs/services/fun/speed-quiz/SPEC.md`.

## 제시어 큐레이션 기준 (핵심 차별점 — 모든 시드 단어에 다회 검토 적용)

**체크리스트:**
- 말/브랜드명/문자 지식 없이 몸짓·자세·표정만으로 특정 가능한가?
- 소리가 아니라 움직임/자세로 구별되는가(매미 울음, 전화벨 소리처럼 소리로만 구별되는 것은 제외)?
- 저작권 있는 특정 캐릭터가 아닌 일반 명사/역할/행동인가(스파이더맨 대신 "닌자"/"해적"/"마법사" 같은 원형)?
- 추상적 개념·속담·사자성어가 아닌 구체적 동작/사물/역할/감정인가(그런 것은 스피드퀴즈의 `proverbs` 데크 몫)?
- 데크 내 중복/유사 단어가 없는가?
- **단어 자체가 명사인가, "-하기/타기/만들기/찍기/쓰기" 어미가 붙은 동사구가 아닌가?** 참가자는 정답이라고 생각하는
  단어를 정확히 외치므로, 동사구 제시어("눈사람 만들기")는 전체 문구를 말해야 할지 사물명만 말해야 할지 모호하지만
  명사("눈사람")는 정답이 하나로 명확하다(사용자 정정, 2026-07-22). 몸짓의 대상 사물명("자전거", "기타", "우산")이나
  그 행위 자체를 가리키는 기존 명사("낚시", "저글링", "다림질", "세수")를 쓰고, 절대 "명사+하기" 지시문을 쓰지 않는다.
  깔끔한 명사가 없으면 억지로 줄이지 말고 다른 단어로 교체한다.

**카테고리 6종, 각 정확히 2데크(A팀/B팀 — A/B 팀 대결 형식), 데크당 정확히 10단어(120단어 총계)**:

| id | 난이도 | A팀 | B팀 |
|---|---|---|---|
| `actions`(동작) | easy | 자전거, 낚시, 양치질, 설거지, 줄넘기, 눈사람, 기타, 저글링, 사진, 우산 | 계단, 신발끈, 그네, 훌라후프, 물구나무서기, 빗자루, 세수, 머리 감기, 다림질, 요가 |
| `animals`(동물) | easy | 캥거루, 코끼리, 원숭이, 뱀, 펭귄, 문어, 고릴라, 토끼, 곰, 거북이 | 사자, 기린, 사슴, 다람쥐, 닭, 말, 돼지, 낙타, 코알라, 박쥐 |
| `occupations`(직업) | normal | 의사, 소방관, 경찰관, 요리사, 미용사, 화가, 택배기사, 마술사, 지휘자, 개그맨 | 선생님, 농부, 제빵사, 종업원, 가수, 우주비행사, 목수, 판사, 비행기 조종사, 승무원 |
| `characters`(캐릭터·역할) | normal | 좀비, 로봇, 유령, 발레리나, 카우보이, 닌자, 해적, 인어, 마법사, 슈퍼히어로 | 왕, 기사, 마녀, 요정, 거인, 난쟁이, 엘프, 트롤, 늑대인간, 뱀파이어 |
| `sports`(스포츠) | normal | 야구, 축구, 농구, 볼링, 스키, 씨름, 태권도, 수영, 복싱, 양궁 | 배구, 탁구, 골프, 배드민턴, 승마, 펜싱, 다이빙, 스케이트보드, 하키, 체조 |
| `emotions`(감정) | hard | 화남, 슬픔, 놀람, 부끄러움, 신남, 졸림, 무서움, 사랑, 아픔, 헷갈림 | 행복, 걱정, 실망, 자신감, 질투, 안도, 후회, 피곤함, 자랑스러움, 감동 |

**검토 후 제외한 단어(재추가 방지용 기록)**: 카멜레온(동물 — 일반 도마뱀 흉내와 구별 모호), 스파이더맨·슈퍼맨 등
특정 저작권 캐릭터(→ 범용 "슈퍼히어로" 원형으로 대체), 속담·사자성어·브랜드·K-pop류(말/문자 지식 필요 — 스피드퀴즈
영역, 여기서 중복하지 않음).

## 아키텍처 요약 (영문 정본 `file_structure` 절 참고)

- `src/lib/party-word-game/` — 신규 공유 엔진(shuffle/game-reducer/sound/favorites/slug), speed-quiz·charades
  양쪽이 재export로 소비.
- `src/lib/speed-quiz/` — 5개 엔진 파일만 재export로 전환, schema/merge/catalog는 무변경.
- `src/lib/charades/` — schema/merge/catalog(고유 카테고리 enum) + 엔진 재export 5종.
- `scripts/generate-charades.mjs` + `content/charades/**` — speed-quiz 생성기 패턴 미러링.
- `src/components/tools/charades/**` — Charades/useCharades/DeckBrowser/DeckCard/GameSetup/GameBoard/GameSummary/
  SoundToggle/Intro/HowTo/Faq/StructuredData(신규 파일, 공유 안 함).
- 플랫폼 배선: `registry.ts`(id/slug `charades`, category `fun`, icon `PersonStanding`, accent `mint`) +
  `toolStyle.tsx` TOOL_ICONS 등록 + `[slug]/page.tsx` 라우트 분기 + `tools.charades.*` i18n + `llms.txt`.

## 검증 게이트

1. 엔진 추출 후 **speed-quiz 전체 유닛+E2E 회귀 0**(assertion 개수 불변) — 이후에만 charades 착수.
2. charades 신규 도메인(스키마/merge/catalog/generator) TDD ≥90% 커버리지.
3. 게임 플로우 E2E(데크선택→설정→플레이→정답/패스/undo→요약), 즐겨찾기 persist, 키보드, 사운드.
4. i18n ko/en 대칭 + 반대언어 누수 grep, 실 카탈로그 렌더 테스트(인라인 mock 금지).
5. 팬텀 토큰 가드, tsc 0, 정적 빌드 그린, 리더 라이브 시각(ko·en·320·1440·콘솔0).
6. 고유 메타·SoftwareApplication+FAQPage JSON-LD(게이트 밖 SSR)·llms.txt 등재.

## 성공 기준

- 엔진(`party-word-game`)은 구현이 정확히 하나씩만 존재하고 speed-quiz·charades 둘 다 재export로 소비.
- 모든 시드 단어가 큐레이션 체크리스트를 통과(말/브랜드/추상개념 의존 단어 0개).
- speed-quiz의 공개 API·동작은 변경 없음(내부 구현 위치만 변경).
- DESIGN.md 준수(mint 아이덴티티 액센트), WCAG 2.1 AA, 발견성(고유 메타/JSON-LD/llms.txt) 충족.
