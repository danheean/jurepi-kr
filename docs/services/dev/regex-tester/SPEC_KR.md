# 정규식 테스터 — 실시간 JavaScript 정규식 테스팅 및 학습 도구 — 서비스 SPEC

> 이 문서는 **정본(한국어 번역)**입니다. AI 코딩 에이전트가 소비하는 정본은 [`SPEC.md`](SPEC.md)(영문)입니다. 양쪽을 동기 상태로 유지하세요.
>
> **정규식 테스터** 빌드 명세 — 브라우저 기반 대화형 도구로, JavaScript 정규식을 작성, 테스트, 학습하기 위한 도구입니다. 매칭을 실시간 강조표시하고, 캡처 그룹을 필드별로 분석하고, 치환 미리보기를 제공하며, 축소 가능한 정규식 치트시트를 제공합니다. 100% 클라이언트 측: 패턴을 입력하고, 테스트 문자열을 입력하고, 플래그를 선택하면 매치가 실시간으로 강조되고, 캡처 그룹, 위치, 그리고 `$1`/`$<name>` 문법을 사용한 치환 미리보기를 상세하게 분석할 수 있는 테이블이 표시됩니다. 정규식을 배우거나 복잡한 패턴을 디버깅하려는 개발자에게 완벽합니다.
> 내부 서비스 코드명: `regex-tester`. 레지스트리 id: `regex-tester`. 공개 URL 슬러그: `/[locale]/tools/regex-tester`.
>
> 이 SPEC은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO & 광고 인프라, 디자인 토큰은 플랫폼에서 제공됩니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 정본): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 SPEC(같은 패턴): [`docs/services/dev/json-formatter/SPEC.md`](../json-formatter/SPEC.md)

```xml
<project_specification>

<project_name>정규식 테스터 — 실시간 JavaScript 정규식 테스팅 도구 (Jurepi 도구, 코드명 regex-tester, 레지스트리 id regex-tester)</project_name>

<overview>
정규식 테스터는 JavaScript 정규식을 즉석에서 구축하고 검증하는 대화형 샌드박스입니다. 개발자는 정규식 패턴(선택적 플래그: g, i, m, s, u, y)과 테스트 문자열을 입력하면 모든 매치가 테스트 문자열에서 실시간으로 강조되며, 상세 분석 테이블에서 다음을 보여줍니다: 매치 인덱스, 전체 매치 텍스트, 매치 위치(시작–종료), 그리고 각 매치마다의 캡처 그룹(번호 $1/$2/… 그리고 명명된 그룹 $<name>). 별도의 치환 미리보기 섹션은 사용자가 제공한 치환 템플릿을 적용할 때 테스트 문자열이 어떻게 되는지 보여줍니다(`$1`, `$<name>`, `$&`, `$$` 지원), 개발자가 프로덕션 코드에서 시행착오 없이 전방 탐색/후방 탐색 및 그룹 의미론을 이해하도록 돕습니다.

도구는 JavaScript RegExp 제한사항과 일반적인 함정(재앙적 백트래킹, 영-폭 매칭 무한 루프, 플래그 의미론)을 친화적인 소개/FAQ에서 표시하고, 유효하지 않은 패턴에서 절대 크래시하지 않으며, 빠른 문법 참조용 축소 가능한 치트시트를 제공합니다(앵커, 수량자, 클래스, 그룹, 전방/후방 탐색, Unicode, 플래그).

CRITICAL(클라이언트 전용, SSG): 100% 클라이언트 측, 백엔드 없음, 데이터베이스 없음. 유일한 1차 지속성은 localStorage의 사용자 선호도(마지막 패턴/플래그/테스트 문자열) 및 저장된 패턴 라이브러리(명명된 패턴)입니다. 붙여넣은/테스트한 패턴은 절대 디바이스를 떠나지 않습니다.

CRITICAL(SPA, 사용성 우선): 플랫폼 규칙에 따라 모든 Jurepi 도구는 클라이언트 측 SPA입니다. 모든 상호작용 — 패턴 입력, 테스트 문자열, 플래그, 치환 미리보기 — 은 로컬 React 상태에서 발생하며 라우트 네비게이션 없음, 전체 페이지 새로고침 없음. 파싱과 강조는 실시간(디바운스 150ms)으로 사용자가 입력할 때 발생합니다.

CRITICAL(에러 처리): 유효하지 않은 정규식 패턴은 앱을 크래시시키거나 미포착 에러를 던져서는 안 됩니다. `new RegExp(pattern, flags)`에서 `SyntaxError`를 캐치하고 친화적인 인라인 에러 메시지를 표시합니다(예: "Invalid regular expression: unterminated character class"). 빈 패턴 또는 테스트 문자열은 유효한 노-옵(에러 없음, 매치 없음)입니다. Unicode(이모지, 조합 마크)의 테스트 문자열은 정확하게 처리됩니다.

CRITICAL(안전, 재앙적 백트래킹 위험 — 정직하게): 메인 스레드의 JavaScript RegExp는 재앙적 백트래킹을 보이는 패턴(예: `(a+)+$`)이 긴 비매칭 문자열을 대상으로 할 때 무한정 행을 멈출 수 있습니다. 완화 조치로: 패턴당 및 테스트 문자열당 길이 한도(패턴 최대 1000자, 테스트 문자열 최대 100KB) 및 월-클록 실행 가드와 타임아웃(예: 500ms)을 포함합니다. 초과된 경우, "Pattern execution timed out — consider simplifying or adding anchors"를 표시합니다. CRITICAL 제한사항(FAQ에 문서화): 이 폴백 가드는 베스트 에포트입니다. **단일 원자 `regex.exec()` 호출이 그 자체로 백트래킹 중이면 호출 중간에 중단될 수 없습니다.** Web Worker와 `terminate()`는 하드 보장을 제공할 수 있지만 이 코드베이스에서는 검증되지 않았습니다. 인프라가 무거우면, 동기 가드 + 한도는 MVP로 배포되며 얼직한 방법 섹션이 위험과 해결책을 기록합니다.

CRITICAL(XSS-안전 렌더링): 매치 강조 및 치환 미리보기는 사용자 제공 패턴 출력을 렌더합니다. `dangerouslySetInnerHTML`을 절대 사용하지 않습니다. 강조는 CSS 클래스 + 텍스트 노드를 통해 적용됩니다. 복사 버튼은 순수 텍스트만 복사합니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/regex-tester (SSG; 레지스트리 슬러그 "regex-tester", id "regex-tester", 상태 "coming_soon", 악센트 "sun", 카테고리 "dev").
  - 플랫폼이 제공(재구현 금지): 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주변 Error Boundary, lib/seo.ts 메타데이터 빌더, 빵 조각 + 인-콘텐츠 광고 래퍼, ShareButtons.
  - 소비: i18n 네임스페이스 `tools.regex-tester.*` (UI 크롬 문자열: 플래그 라벨, 에러 메시지, 복사 토스트, 치환 미리보기 라벨, 치트시트 섹션, 방법, FAQ — 사용자 패턴/테스트 문자열 데이터 아님, 사용자 입력에서 옵니다).
  - 참고(2026-07-10 업데이트): `'dev'` 카테고리는 이미 플랫폼에서 생성 중입니다(json-formatter, base64-encoder, url-encoder, dev-people, my-ip 모두 배포됨). 남은 플랫폼 전제조건 없음. 이 도구는 자신의 레지스트리 항목만 추가합니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - 정규식 패턴 입력(모노스페이스 폰트의 텍스트 필드).
    - 플래그 토글(5개 pill: g, i, m, s, u, y) `new RegExp(pattern, flags)` 동작 제어.
    - 테스트 문자열 입력(큰 textarea) 매칭할 대상.
    - 실시간 매치 강조: 패턴의 모든 발생이 강조 span(mark 요소 또는 악센트 컬러 span)으로 래핑됩니다. 키스트로크에 업데이트(디바운스 150ms).
    - 매치 리스트 테이블: 각 매치 행은 인덱스(0, 1, 2…), 전체 매치 텍스트, 매치 위치(시작–끝 문자 인덱스), 길이, 그리고 "그룹 표시" 확장 토글을 보여줍니다.
    - 캡처 그룹 분석(매치당): 테이블 또는 상세 패널로 각 매치에 대한 캡처 그룹 인덱스/이름 → 캡처 값을 보여줍니다. 명명되지 않은 그룹은 $1, $2 등으로 표시. 명명된 그룹은 $<name>으로 표시. 빈/비참여 그룹은 "(not captured)"로 표시.
    - 치환 미리보기 섹션: 사용자는 치환 템플릿을 입력합니다(`$1`, `$2`, `$<name>`, `$&`, `$$` 지원). 도구는 해당 템플릿을 각 매치에 적용한 결과를 표시하고, 최종 텍스트(모든 치환 적용, 글로벌 플래그 가정)를 표시합니다. 전/후 나란히 보기.
    - 유효하지 않은 패턴 에러: `SyntaxError` 캐치, 친화적 메시지 표시(예: "Invalid regular expression: incomplete quantifier"). 전체 스택 추적을 표시하지 않습니다.
    - 실행 타임아웃 가드: 패턴 매칭이 >500ms를 걸리면 "Pattern execution timed out"을 표시하고 사용자가 취소하거나 단순화하도록 허용합니다. 길이 한도(패턴 1KB, 테스트 문자열 100KB) 사용자 친화적 오버플로우 메시지 포함.
    - 정규식 치트시트: 축소 가능한 아코디언 섹션: 앵커(^, $, \b), 수량자(*, +, ?, {n,m}), 문자 클래스([abc], \d, \s, \w, 부정), 그룹 & 선택((…), |), 전방/후방 탐색((?=…), (?!…), (?<=…), (?<!…)), 플래그(g, i, m, s, u, y), Unicode 이스케이프(\uXXXX, \p{…}), 그리고 일반적인 함정(영-폭 매칭, greedy vs lazy).
    - 프리셋 패턴: 엄선된 정규식 라이브러리(이메일, URL, 전화, 날짜, IPv4/v6, UUID, 한국 전화번호 등) — 클릭 한 번으로 패턴 필드에 로드.
    - 저장된 패턴 라이브러리(localStorage): 현재 패턴 + 플래그 + 테스트 문자열을 이름으로 저장. 로드, 삭제, 편집.
    - 복사 버튼: 전체 매치, 캡처 그룹 값 또는 전체 결과 텍스트를 복사. navigator.clipboard와 textarea 폴백 사용. 사용 불가능하면 조용히 실패.
    - localStorage 지속성: 마지막 패턴/플래그/테스트 문자열, 저장된 패턴(최대 50), 선호도.
    - 도구별 SEO 장문형("JavaScript RegExp 기초", "캡처 그룹 설명", "일반적인 함정") + FAQ(FAQPage JSON-LD), 한국어/영어.
    - 키보드 지원: 필드 사이 Tab, Ctrl+Enter 실행/업데이트 매치, 복사 단축키.
    - Reduced-motion 폴백. WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - JavaScript 이외의 엔진으로부터의 RegExp(PCRE, Python re, Perl) — 도구는 JS 전용. 관련이 있으면 방법서에서 방언 차이를 기록합니다.
    - 실시간 백트래킹 시각화 또는 단계별 디버거 — Phase 2 후보.
    - 정규식-대-영어 설명 생성기(AI 기반) — 범위 밖(LLM 없음).
    - 미리 채워진 패턴/테스트 문자열과 함께 공유 가능한 깊은 링크 — Phase 2(개인정보 균형).
    - 복잡한 테스트 케이스 파일 업로드(단일 textarea 입력만).
    - 성능 벤치마크 또는 RegExp.exec 루프 타이밍 — Phase 2.
  </out_of_scope>
  <future_considerations>
    - 공유 가능한 정규식 깊은 링크(`?pattern=…&flags=…&test=…`, URL 인코딩) — Phase 2.
    - 패턴 라이브러리를 JSON 파일로 가져오기/내보내기 — Phase 2.
    - 실시간 백트래킹 시각화 또는 전방/후방 탐색 단계별 진행 — Phase 3.
    - RegExp 객체 직렬화 프로그램(코드 스니펫 생성: `const re = /…/…`) — Phase 2.
    - 정규식 토너먼트 모드(대화형 과제: X와 일치하는 패턴 작성하되 Y는 아님) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl(ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <pattern_compilation>try/catch에서 `new RegExp(pattern, flags)`로 컴파일(SyntaxError → 친화적 타입화 InvalidPatternError). 플래그는 사용자 토글에서 연결됩니다(예: g + i 토글에서 'gi').
    </pattern_compilation>
    <matching>루프에서 `regex.exec()` 사용(g 플래그인 경우) 또는 단일 호출(g 플래그 없음)로 모든 매치를 찾습니다. `match.index` 및 캡처 그룹 `match[0…N]`을 통해 매치 위치를 추적합니다. 반복 카운터 + 월-클록 타임아웃(500ms)으로 보호합니다.
    </matching>
    <highlight_spans>매치 인덱스를 배열 { start, end, type: 'match' | 'group' }로 구축합니다. 테스트 문자열 슬라이스를 강조에 대한 span 요소가 있는 React 텍스트 노드로 렌더합니다 — 절대 dangerouslySetInnerHTML 사용 금지.
    </highlight_spans>
    <replace_preview>사용자 제공 치환 템플릿을 `String.prototype.replace(regex, replacementTemplate)`를 사용해 패턴에 적용합니다(`$1`, `$<name>`, `$&`, `$$` 의미론 포함). 2열 보기에서 전/후 표시합니다. 매칭과 동일한 타임아웃으로 보호합니다.
    </replace_preview>
    <presets>엄선된 정규식 상수 모듈(`lib/regex-tester/presets.ts`) 명명된 패턴 포함(이메일, URL, 전화, 날짜, IPv4, UUID, 한국 패턴). i18n를 통해 표시명 지역화.
    </presets>
    <validation>zod v3.x(레포에 있음) localStorage 저장소 스키마(패턴 라이브러리, 선호도, 마지막 사용 상태)에 대해.
    </validation>
    <localStorage>jurepi-regex-tester 키. zod-검증됨. 로드할 때 자동으로 유효하지 않은 데이터 제거. 사용 불가능하면 우아하게 실패.
    </localStorage>
    <clipboard>navigator.clipboard.writeText() → textarea 폴백 → 조용히 실패(복사는 보조).
    </clipboard>
    <timeout_guard note="하드 요구사항">동기 타임아웃 체크: 매칭/치환 연산 시작 시 마감선 설정. 월-클록 시간을 매 N 반복마다 체크합니다. 초과되면 중단하고 친화적인 "Pattern execution timed out" 표시합니다. 입력 길이 한도(패턴 1KB, 테스트 문자열 100KB)가 1차 완화 수단. 타임아웃은 2차 안전망입니다. 배포되면, 극단적인 정규식이 **탭을 잠깐 행을 멈울 수 있으며** 패턴 분할 또는 앵커 사용으로 백트래킹을 회피하도록 권장하는 FAQ를 문서화합니다.
    </timeout_guard>
  </module_specific>
  <libraries>
    <zod>zod v3.x — 이미 레포에 있음. 저장소/패턴 스키마 검증에 재사용됨.
    </zod>
  </libraries>
  <note>CRITICAL: 백엔드 없음, 제3자 API 없음, 네트워크 호출 없음.
  </note>
</technology_stack>

<file_structure>
src/
├── lib/regex-tester/                      # 순수 도메인 계층 — React/Next 없음, 완전히 단위 테스트됨
│   ├── schema.ts                          # zod: PresetPattern, SavedPattern, Settings, PatternResult
│   ├── compiler.ts                        # compilePattern(pattern, flags): RegExp | { error: InvalidPatternError }
│   ├── matcher.ts                         # findMatches(text, regex, {timeoutMs, capsCap}): {matches: Match[], timedOut}
│   ├── capture-groups.ts                  # extractGroups(match, regex): {named: Record<string, string>, indexed: string[]}
│   ├── replace-preview.ts                 # applyReplaceTemplate(text, regex, template, {timeoutMs}): {result, timedOut}
│   ├── highlight-ranges.ts                # textToHighlightRanges(text, matches): HighlightRange[] (렌더용)
│   ├── presets.ts                         # PRESET_PATTERNS: 이름, 패턴, 플래그, 예제가 있는 타입화 상수
│   └── constants.ts                       # PATTERN_MAX_CHARS, TEST_STRING_MAX_CHARS, TIMEOUT_MS
├── components/tools/regex-tester/
│   ├── RegexTester.tsx                    # 오케스트레이터(Client Component) — 상태 소유자
│   ├── useRegexTester.ts                  # 훅: 패턴/플래그/테스트 문자열 상태, localStorage, 지속성
│   ├── PatternInput.tsx                   # 패턴 텍스트 필드 + 인라인 에러 메시지
│   ├── FlagToggles.tsx                    # 5개 pill 버튼: g, i, m, s, u, y
│   ├── TestStringInput.tsx                # 테스트 문자열용 큰 여러 줄 textarea
│   ├── MatchList.tsx                      # 테이블: 인덱스, 전체 매치, 위치, 액션
│   ├── MatchDetails.tsx                   # 확장/축소: 매치당 캡처 그룹 분석
│   ├── ReplacePreview.tsx                 # 템플릿 입력 + 전/후 2열 보기
│   ├── TestStringHighlighted.tsx          # 강조가 있는 테스트 문자열. highlight-ranges를 사용해 span 렌더
│   ├── RegexCheatsheet.tsx                # 축소 가능한 아코디언: 섹션(앵커, 수량자, 클래스, 그룹, 전방/후방 탐색, 플래그, Unicode, 함정)
│   ├── PresetPatterns.tsx                 # 드롭다운 또는 버튼 그리드: 프리셋을 패턴 필드로 로드
│   ├── SavedPatternLibrary.tsx            # 저장된 패턴 리스트. 로드/삭제/편집 버튼
│   ├── ErrorMessage.tsx                   # SyntaxError, 타임아웃 등에 대한 친화적 에러 표시
│   ├── RegexTesterIntro.tsx               # H1 + lead(SEO 장문형)
│   ├── RegexTesterHowTo.tsx               # "정규식 사용 방법", "캡처 그룹", "플래그 설명"(SEO)
│   ├── RegexTesterFaq.tsx                 # FAQ + FAQPage JSON-LD
│   └── CopyButton.tsx                     # 클립보드로 복사(토스트 피드백 포함)
└── i18n/messages/{ko,en}.json             # tools.regex-tester.* UI 크롬
</file_structure>

<core_data_entities>
  <pattern_state>
    - pattern: string — 사용자가 입력한 정규식 패턴.
    - flags: string — 연결된 플래그(예: 'gi').
    - isValid: boolean — 패턴이 에러 없이 컴파일되는지 여부.
    - error?: string — 유효하지 않은 경우 SyntaxError 메시지.
    PERSISTENT: localStorage 키 `jurepi-regex-tester`는 { pattern, flags, testString, savedPatterns, presets }을 저장합니다.
  </pattern_state>
  <match>
    - index: number — 0 인덱싱된 매치 서수.
    - fullMatch: string — 패턴으로 매치된 부분 문자열.
    - position: { start: number; end: number } — 테스트 문자열의 문자 인덱스(0 인덱싱).
    - captureGroups: { numbered: string[]; named: Record<string, string> } — $1/$2/… 및 $<name> 값.
  </match>
  <highlight_range>
    - start: number — 테스트 문자열의 문자 인덱스.
    - end: number — 테스트 문자열의 문자 인덱스.
    - type: 'match' | 'capture-group' — 스타일링용(매치는 악센트 색, 중첩 그룹은 더 밝은 색).
  </highlight_range>
  <preset_pattern>
    - id: string — 고유 식별자(예: 'email', 'url', 'korean-phone').
    - name: string — 표시명(i18n 키 경로).
    - pattern: string — 정규식.
    - flags: string — 기본 플래그.
    - example: string — 샘플 테스트 문자열.
    - description: string — 간단한 설명(i18n 키 경로).
  </preset_pattern>
  <saved_pattern>
    - id: string — UUID 또는 타임스탐프.
    - name: string — 사용자 주어진 라벨.
    - pattern: string — 정규식.
    - flags: string — 플래그.
    - testString: string — 이 패턴으로 마지막으로 사용된 테스트 문자열.
    - createdAt: number — 타임스탐프.
  </saved_pattern>
  <constants>
    - DEBOUNCE_MS = 150ms(키스트로크 지연에 매치 계산).
    - PATTERN_MAX_CHARS = 1000.
    - TEST_STRING_MAX_CHARS = 100_000(100KB).
    - TIMEOUT_MS = 500ms(패턴 실행 가드).
    - SAVED_PATTERNS_MAX = 50.
  </constants>
</core_data_entities>

<route_definitions>
/[locale]/tools/regex-tester
  - SSG 페이지.
  - 빵 조각: Home > Tools > Regex Tester.
  - 메타데이터: `seo.absoluteToolUrl('regex-tester', locale)`를 canonical로 사용해 `generateMetadata(locale)`에서.
  - Error Boundary가 RegexTester 컴포넌트를 감싸줍니다.
  - Intro/HowTo/Faq 섹션은 `mounted` 게이트 외부에서 렌더됩니다(SSR).
  - ShareButtons는 라우트 템플릿에서 자동 배선됩니다.
</route_definitions>

<component_hierarchy>
RegexTester (Client Component, 루트)
├── PatternInput + FlagToggles(제어 입력)
├── TestStringInput(큰 textarea)
├── MatchList(테이블, 정규식/텍스트 변경 시 업데이트)
├── MatchDetails(매치당 캡처 그룹 확장)
├── ReplacePreview(템플릿 입력 + 전/후)
├── TestStringHighlighted(매치에서의 강조)
├── PresetPatterns(버튼 그리드 또는 드롭다운)
├── SavedPatternLibrary(리스트 + CRUD 버튼)
├── RegexCheatsheet(축소 가능 섹션)
├── ErrorMessage(조건부 인라인 에러)
└── CopyButton(클립보드로 복사)

Server Components(SEO):
├── RegexTesterIntro(H1 + lead 문단)
├── RegexTesterHowTo(다중 섹션 가이드, 게임 같은 스타일)
├── RegexTesterFaq(질문 + 답변, FAQPage JSON-LD Faq 컴포넌트로 방출)
└── StructuredData(SoftwareApplication JSON-LD, url == canonical)
</component_hierarchy>

<pages_and_interfaces>
대화형 도구(Client SPA):
  - PatternInput: 한 줄 텍스트 필드, 모노스페이스 폰트, aria-label "Regular expression pattern", 유효하지 않으면 아래 인라인 에러 표시, onChange → 디바운스 → 재컴파일 + 재강조.
  - FlagToggles: 5개 토글 pill(g, i, m, s, u, y), 각각 aria-pressed, onChange → 플래그 문자열 재구축 + 재컴파일.
  - TestStringInput: 큰 다중 줄 textarea, aria-label "Test string", onChange → 디바운스 → 재강조.
  - MatchList: 테이블 같은 보기(div 그리드 또는 실제 테이블) 열: 인덱스 #, 매치된 텍스트(모노스페이스), 위치(시작–끝), 길이, 액션(복사, 상세 확장). 매치가 없으면, "No matches found"를 표시합니다.
  - MatchDetails: 매치당 확장 가능 행. 캡처 그룹 테이블(인덱스/이름 → 값)을 표시합니다. 명명되지 않은 그룹은 $1, $2 등으로 라벨링됩니다. 명명된 그룹은 $<name>으로 라벨링됩니다. 빈 캡처 → "(not captured)".
  - ReplacePreview: 2열 섹션: 좌측 = 치환 템플릿 입력(텍스트 필드, 설명 "예: $1-$2, $<month>-$<day>"), 우측 = 결과(모노스페이스, 읽기 전용). 모든 매치에 적용되었을 경우 최종 텍스트를 표시합니다.
  - TestStringHighlighted: 강조가 있는 테스트 문자열. 텍스트 노드 + span 요소로 렌더됩니다(매치는 악센트 색, 그룹은 미묘한 배경). 매치 클릭 → MatchDetails로 스크롤?(선택적 상호작용).
  - PresetPatterns: 버튼 그리드 또는 드롭다운("Load preset…") 이메일, URL, 전화, 날짜, UUID, 한국 패턴을 나열합니다. 클릭 → 패턴 필드를 채우고 예제 테스트 문자열을 로드합니다.
  - SavedPatternLibrary: 저장된 패턴을 나열하는 축소 가능 섹션(이름, 부분 패턴 미리보기, 생성 날짜). 패턴당: Load / Delete / Rename 버튼. 최대 50개 저장.
  - RegexCheatsheet: 축소 가능한 아코디언과 섹션: Anchors, Quantifiers, Character Classes, Groups & Alternation, Lookahead/Lookbehind, Flags, Unicode, Common Gotchas. 각 섹션은 하위 섹션과 문법 + 예제(예: "\d → any digit, same as [0-9]")를 가집니다.
  - ErrorMessage: 인라인 콜아웃(role=alert) 패턴이 유효하지 않거나 실행이 타임아웃된 경우. 친화적 메시지 + 제안을 표시합니다.
  - CopyButton: 복사 가능한 항목당(매치된 텍스트, 그룹 값, 결과). navigator.clipboard를 사용. 성공 시 "Copied!" 토스트를 표시합니다. 그 외에는 조용히 실패.

SEO/장문형(SSR):
  - RegexTesterIntro: H1 "정규식 테스터" + 도구를 설명하는 brief lead.
  - RegexTesterHowTo: 섹션(다중 문단 각각): "Getting Started", "Understanding Flags", "Capture Groups Explained", "Replace Preview & Templates", "Common Mistakes & How to Fix Them".
  - RegexTesterFaq: 5–8 Q/A 쌍(지역화된 i18n, 예: "What's the difference between g and m flags?", "Can I use lookahead in JavaScript?", "Why does my pattern hang?", "How do I match Unicode characters?"). FAQPage JSON-LD는 Faq 컴포넌트로 방출됩니다.
</pages_and_interfaces>

<core_functionality>
1. **패턴 컴파일 & 검증**: 사용자가 패턴을 입력하거나 플래그를 토글합니다. 디바운스됨(150ms) `new RegExp(pattern, flags)` try/catch에서. SyntaxError인 경우 친화적 에러를 인라인 표시합니다. 그렇지 않으면 에러 상태를 지웁니다.

2. **실시간 매칭**: 패턴이 유효하면 테스트 문자열에서 모든 매치를 스캔합니다(g 플래그인 경우 루프에서 `regex.exec()`, 아니면 단일 호출). 반복 카운터 + 500ms 타임아웃으로 보호합니다. index, fullMatch, position, 캡처 그룹(명명 및 번호)이 있는 Match 객체를 구축합니다.

3. **강조 렌더링**: Match 배열을 HighlightRange 배열로 변환(시작/종료 인덱스). 테스트 문자열을 React 텍스트 노드 + span 요소로 렌더합니다(매치는 악센트 색, 참여하는 그룹은 더 밝은 색). 강조를 올바르게 인터리빙합니다(렌더링에서 겹침 없음).

4. **캡처 그룹 추출**: 매치당 `match[0…N]`(번호) 및 `match.groups`(명명, 정규식에 명명된 그룹이 있으면)을 추출합니다. MatchDetails 테이블 또는 패널에서 표시합니다.

5. **치환 미리보기**: 사용자는 치환 템플릿을 입력합니다(`$1`, `$<name>`, `$&`, `$$` 지원). `String.replace(regex, template)`를 통해 적용하고 전/후 보기에서 결과를 표시합니다. 각 `$X`가 무엇으로 확장되는지 설명합니다.

6. **프리셋 로드**: 사용자가 프리셋을 클릭 → 패턴 필드가 채워지고, 플래그가 설정되고, 예제 테스트 문자열이 테스트 문자열 textarea로 로드됩니다.

7. **패턴 저장/로드**: 사용자가 현재 상태를 이름으로 저장 → localStorage. 저장된 패턴 라이브러리 패널에서 로드, 삭제, 편집합니다.

8. **복사 작업**: 사용자가 매치된 텍스트, 그룹 값 또는 전체 결과를 복사 → navigator.clipboard(textarea 폴백 포함). 성공 시 토스트 피드백.

9. **치트시트 & 도움**: 문법 참조를 포함한 축소 가능한 치트시트. FAQ와 HowTo 섹션으로 학습합니다.
</core_functionality>

<error_handling>
- **SyntaxError(유효하지 않은 패턴)**: 캐치, 메시지 추출, 친화적 인라인 에러 표시(예: "Invalid regular expression: unterminated group"). 크래시하거나 미포착 에러를 던지지 않습니다.
- **매칭/치환에서의 타임아웃**: 월-클록 시간이 500ms를 초과하면 연산을 중단하고 "Pattern execution timed out — the pattern may be too complex for this test string. Try adding anchors or simplifying"를 표시합니다. 사용자는 패턴 또는 테스트 문자열을 편집할 수 있습니다.
- **빈 패턴 또는 테스트 문자열**: 유효한 노-옵으로 처리됩니다. 패턴 = ""는 ""와 일치하고(또는 테스트의 빈 문자열), 테스트 문자열 = ""는 매치가 없습니다. 에러 상태 없음.
- **localStorage 사용 불가능**: 인메모리 폴백(페이지 새로고침 시 저장된 패턴 손실). 사용자는 에러가 표시되지 않습니다. 도구는 계속 작동합니다.
- **클립보드 API 사용 불가능**: 조용히 실패(복사 버튼은 노-옵이 되거나 "Copy not supported"를 표시). 도구는 계속 작동합니다.
- **큰 입력**: 테스트 문자열 > 100KB 또는 패턴 > 1KB인 경우, 친화적 "Input too large. Max 100KB test string, 1KB pattern"을 표시합니다. 사용자는 단축할 수 있습니다.
- **Unicode 엣지 케이스**: 이모지, 조합 마크, 서로게이트 — `[Symbol.iterator]` 또는 `.codePointAt()`로 정확하게 올바르게 계산합니다. 플래그 `u`는 Unicode 인식 동작을 활성화합니다.
</error_handling>

<aesthetic_guidelines>
- 악센트 색(sun — `#fbbf24` / var(--accent-sun))은 다음에 사용됩니다: 테스트 문자열의 매치 강조, 활성 플래그 pill, 버튼 호버 상태.
- 모노스페이스 폰트(Monaco, Courier New)는 다음에 사용됩니다: 패턴 입력, 테스트 문자열, 매치된 텍스트, 치환 템플릿, 치트시트 코드 예제.
- 플래그는 pill 버튼으로 스타일 지정됨(작은 둥근 모서리, aria-pressed로 토글됨). 활성 상태는 악센트 배경 + text-on-accent를 사용합니다.
- 매치 리스트는 깨끗한 테이블(또는 모바일의 카드 그리드) 미묘한 행 구분선이 있습니다. 호버 상태는 행을 약간 올립니다(섀도우).
- 치트시트는 축소 가능한 아코디언에 있습니다. 섹션 헤더는 제목 타이포그래피를 사용하고, 코드 예제는 모노스페이스를 사용합니다.
- 다크 테마 색: 다크 모드에서 accent-sun은 밝은 노란색으로 변경됩니다(--dark-accent-sun 또는 동등한 것).
- Reduced motion: 강조 fade-in 비활성화. 치트시트 아코디언이 순시 열림, 슬라이드 애니메이션 없음.
- Focus visible: 모든 버튼 및 대화형 요소에 `focus-visible` 링이 있습니다.
</aesthetic_guidelines>

<security_considerations>
- **XSS 방지**: 매치 강조 및 치환 미리보기는 사용자 패턴 출력을 렌더합니다. React 텍스트 노드 + CSS 클래스를 사용하고, 절대 `dangerouslySetInnerHTML` 사용하지 않습니다. 복사 버튼은 순수 텍스트만 복사합니다.
- **입력 검증**: 패턴 및 테스트 문자열은 사용자 입력(textarea, 정상 DOM, eval 아님)에서 옵니다. 정규식은 `new RegExp()` 생성자(표준, 안전)를 통해 컴파일됩니다. 사용자 코드 실행 없음.
- **클립보드 안전**: `navigator.clipboard.writeText()`는 안전합니다(코드 실행 없음). 폴백 textarea 트릭은 표준입니다.
- **localStorage 주입**: 사용 전에 zod로 로드된 데이터를 검증합니다. 스키마가 유효하지 않으면 우아하게 실패(저장된 패턴을 버리고 신규 시작).
</security_considerations>

<advanced_functionality>
- **플래그 의미론**: 각 플래그(g, i, m, s, u, y)는 매칭 동작을 변경합니다. 치트시트 + FAQ에서 설명합니다. 예: `m`은 ^와 $ 가 줄 경계와 일치하게 만들고, 문자열 시작/끝만이 아님. `u`는 Unicode 속성 이스케이프(\p{…})를 활성화합니다. `y`는 exec()를 sticky로 만듭니다(lastIndex에서 시작).
- **명명된 캡처 그룹**: `(?<month>\d{1,2})-(?<day>\d{1,2})` 같은 정규식이 `match.groups`를 채웁니다. MatchDetails에서 번호 및 명명된 것을 모두 표시합니다.
- **전방/후방 탐색**: `(?=…)`, `(?!…)`, `(?<=…)`, `(?<!…)` 지원됨(ES2018+). 치트시트가 비캡처 문법과 엣지 케이스를 설명합니다.
- **Unicode 속성 이스케이프**: `\p{Letter}`, `\p{Number}` 등(`u` 플래그 포함). 치트시트는 일반적인 속성을 다룹니다.
- **영-폭 매칭**: `(?=)` 같은 패턴이 빈 문자열 일치 → exec()에서 무한 루프 위험. match.index가 고급되지 않으면 확인해서 가드합니다. 그렇지 않으면 다음 위치로 스킵합니다.
</advanced_functionality>

<final_integration_test>
시나리오 1: **이메일 검증 패턴** — 사용자가 이메일 프리셋을 로드합니다. 패턴 = `/^[\w.-]+@[\w.-]+\.\w+$/gi`. 테스트 문자열에 "john@example.com alice@test.co.uk invalid@@email"이 있습니다. 매칭 강조됨. 2 매치가 MatchList에 표시됩니다. 그룹 캡처 없음(패턴에 없음). 치트시트는 접근 가능합니다.

시나리오 2: **명명된 그룹 & 치환** — 사용자가 패턴 `/(?<year>\d{4})-(?<month>\d{1,2})-(?<day>\d{1,2})/g`를 입력하고 테스트 문자열 "2024-7-15 2024-12-25"를 입력합니다. 2 발생을 일치시킵니다. MatchDetails는 year/month/day 캡처 그룹을 보여줍니다. 치환 템플릿 = `$<month>/$<day>/$<year>` → 결과는 "7/15/2024 12/25/2024"를 표시합니다. 모든 부분이 함께 작동합니다.

시나리오 3: **유효하지 않은 패턴 에러 복구** — 사용자가 패턴 `(unclosed`를 입력합니다. SyntaxError 캐치됨. 친화적 에러 "Invalid regular expression: unterminated group"이 인라인 표시됩니다. 사용자가 `(unclosed)`로 고치면 에러가 지워지고 매치가 재계산됩니다. 크래시 없음.

시나리오 4: **재앙적 백트래킹에서의 타임아웃** — 사용자가 패턴 `(a+)+b$`(백트래킹 폭탄)와 테스트 문자열 100KB의 'a' 문자(끝에 'b' 없음)를 입력합니다. 매칭이 시작되고 타임아웃 타이머가 실행되고 월-클록 500ms 초과 → 연산이 중단되고 "Pattern execution timed out" 표시됩니다. 탭은 반응성을 유지합니다. 사용자는 패턴을 단순화하거나 테스트 문자열을 단축할 수 있습니다.

시나리오 5: **저장 & 공유 패턴** — 사용자가 현재 이메일 패턴을 "email-strict"라는 이름으로 저장합니다. 나중에 새 세션에서 SavedPatternLibrary에서 저장된 패턴을 로드합니다. 프리셋과 저장된 패턴은 명확하게 상호작용합니다(한 클릭 로드 vs 수동 이름 입력). localStorage는 페이지 새로고침 간에 지속됩니다.

시나리오 6: **키보드 접근성** — 사용자가 PatternInput → FlagToggles(각 pill) → TestStringInput → CopyButton을 통해 Tab합니다. 모두 포커스 가능하고 aria-라벨이 명확합니다. 치트시트 확장/축소는 Space/Enter(버튼 의미론 사용 시)를 통해. 시각적 포커스 손실 없음.

시나리오 7: **Reduced motion 준수** — 사용자가 OS reduced-motion 선호도를 활성화합니다. 강조가 순시 나타나고 사라집니다(fade 없음), 치트시트 아코디언은 순시 열립니다(slide 없음), 애니메이션 라이브러리는 사용되지 않습니다. 도구는 완전히 기능적이고 순시 피드백입니다.

시나리오 8: **복사 폴백** — 클립보드 API가 비활성화된 브라우저(이전 또는 개인정보 모드)에서 사용자가 매치된 텍스트에서 "복사"를 클릭합니다. 폴백 textarea가 사용됩니다. 성공하면 "Copied!" 토스트가 표시됩니다. 그렇지 않으면 조용히 실패. 에러 메시지 없음. 도구는 계속 사용 가능합니다.

시나리오 9: **en/ko 언어 전환** — 사용자가 헤더 테마 토글을 통해 로케일을 전환합니다. 모든 UI 문자열(라벨, 버튼 텍스트, 에러 메시지, 치트시트 섹션)이 next-intl를 통해 업데이트됩니다. 패턴과 테스트 문자열은 보존됩니다(지역화되지 않음). FAQ/HowTo 섹션도 ko 또는 en 텍스트로 재렌더됩니다.

시나리오 10: **모바일 반응형** — 320px 너비에서 MatchList는 단일 열 카드 레이아웃(테이블 그리드 아님)이 됩니다. 프리셋 버튼은 스택됩니다. 테스트 문자열 textarea는 전체 폭입니다. 치트시트는 여전히 축소 가능하고 읽을 수 있습니다. 오버플로우 없음, 수평 스크롤 없음. 터치 대상 ≥44×44px.
</final_integration_test>

<success_criteria>
- **정확성**: 패턴 매칭, 캡처 그룹, 치환 미리보기가 모두 네이티브 JavaScript RegExp 동작과 일치합니다.
- **안전성**: 미포착 에러 없음. 타임아웃 가드는 탭 프리징을 방지합니다(동기의 경우 베스트 에포트, Worker로 구현된 경우 하드 보장). XSS 안전 렌더링.
- **사용성**: 모든 사용자 상호작용(패턴 입력, 플래그 토글, 매칭, 복사, 저장)이 150–300ms 내에 완료됩니다(디바운스, 토글 클릭은 순시). 에러 메시지는 친화적이고 실행 가능합니다.
- **접근성**: WCAG 2.1 AA. 키보드 네비게이션. prefers-reduced-motion 존중. 스크린 리더는 에러 및 결과를 발표합니다.
- **성능**: 100KB 테스트 문자열에서 전체 매칭/강조가 <500ms 내에 완료됩니다(가드 타임아웃).
- **SEO**: 제목, 설명, Intro/HowTo/FAQ 섹션이 인덱싱됩니다. SoftwareApplication + FAQPage JSON-LD 방출. canonical URL 정확.
- **지역화**: 모든 사용자 대면 문자열이 i18n 네임스페이스 `tools.regex-tester.*`(ko/en)에 있습니다. 하드코딩된 영어 없음.
- **모바일**: 반응형 레이아웃(320px+). 터치 상호작용 작동. 수평 스크롤 없음.
- **플랫폼 통합**: 레지스트리 항목 추가(id, slug, 악센트, 카테고리, 상태, addedAt). 적절한 generateMetadata 및 Error Boundary가 있는 라우트. ShareButtons 자동 배선.
</success_criteria>

<build_output>
src/ 아래의 파일 구조:
- lib/regex-tester/(7 모듈, ~400줄 총계, 95%+ 단위 테스트 커버리지)
- components/tools/regex-tester/(14 컴포넌트 파일, ~800줄 총계, 85%+ 커버리지)
- i18n/messages/{ko,en}.json(tools.regex-tester.* 키 추가됨. ~80 문자열)

레지스트리 항목(tools/registry.ts):
```ts
{
  id: 'regex-tester',
  slug: 'regex-tester',
  category: 'dev',
  icon: 'RegEx', // 또는 유사한 lucide 아이콘
  accent: 'sun',
  status: 'coming_soon',
  order: 21,
  addedAt: '2026-07-10',
  keywords: ['regex', 'regexp', 'test', 'pattern', 'capture', 'javascript']
}
```

i18n 키(tools.regex-tester.*):
- title, description(최상위, 대시보드 카드)
- patternLabel, flagLabel, testStringLabel, replaceLabel
- noMatches, timeoutError, invalidPattern
- matchCount, captureGroups, replace, copy, save, load
- cheatsheet.title, cheatsheet.{anchors,quantifiers,classes,groups,lookaround,flags,unicode,gotchas}
- howTo.title, howTo.sections[…]
- faq.items[{q, a}]

Sitemap: 단일 /[locale]/tools/regex-tester 항목(spoke 라우트 없음. character-counter 같은 단일 페이지 대화형 도구).

SEO 메타데이터:
- canonical: seo.absoluteToolUrl('regex-tester', locale)
- og:title, og:description은 i18n title/description에서
- JSON-LD: SoftwareApplication(url == canonical), Faq 컴포넌트로 방출되는 FAQPage

빌드 시간: ~8–12초(vitest + tsc + 사소한 도구 모듈 오버헤드가 있는 next build).
</build_output>

<key_implementation_notes>
1. **레지스트리 항목**: id/slug `regex-tester`, 카테고리 `dev`(이미 실시간), 악센트 `sun`(자유), 상태 `coming_soon`, `addedAt: '2026-07-10'`(필수). Order = 21(충돌 회피. 필요하면 조정).

2. **i18n 네임스페이스**: 모든 사용자 대면 문자열이 `tools.regex-tester.*`에 있습니다. 최상위 `title` 및 `description`은 필수(대시보드 카드 소비). 도메인 계층에 하드코딩된 영어 없음(에러 메시지, 도움말 텍스트 모두 i18n).

3. **중요 경로**:
   - 패턴 입력 → 컴파일(try/catch) → 유효하면 매칭 + 강조 수행.
   - 매칭 → 타임아웃 가드(500ms), 반복 카운터 상한 → 초과되면 중단 + 친화적 에러 표시.
   - 치환 미리보기 → 템플릿 적용(가드 타임아웃도 함).
   - 모든 타이밍은 월-클록(Date.now()) 사용 — setTimeout 없음.

4. **테스트 전략(TDD)**:
   - 도메인(`lib/regex-tester/`): 컴파일러, 매처, 캡처 그룹, 치환 미리보기, 프리셋에 대한 단위 테스트. 커버리지 ≥95%.
   - 컴포넌트: PatternInput, FlagToggles, ErrorMessage에 대한 스냅샷 테스트 + RTL 렌더 테스트. MockRegExp 통합.
   - E2E(Playwright): 패턴 입력 → 매치 표시 → 복사 작동 → 치환 미리보기 업데이트. 유효 및 유효하지 않은 패턴, 타임아웃 가드, 플래그 토글, ko/en UI 문자열 테스트.

5. **권장 빌드 순서**:
   - Phase 1a: 도메인(컴파일러, 매처, 캡처 그룹, 치환 미리보기). TDD red→green.
   - Phase 1b: 상수, 프리셋, localStorage 스키마(zod).
   - Phase 2a: 훅(useRegexTester) + 루트 RegexTester 오케스트레이터.
   - Phase 2b: 입력 컴포넌트(PatternInput, FlagToggles, TestStringInput, MatchList).
   - Phase 2c: 표시 컴포넌트(MatchDetails, ReplacePreview, TestStringHighlighted, RegexCheatsheet).
   - Phase 3: 프리셋/SavedPatternLibrary, CopyButton.
   - Phase 4: SEO(Intro, HowTo, Faq), 레지스트리 항목, i18n 키.
   - Phase 5: E2E 테스트, 디자인 폴리시, 접근성 감사.

6. **타임아웃 가드 MVP**: 동기 마감선 체크(베스트 에포트). 무거우면 Web Worker를 Phase 2로 연기하고 FAQ에서 극단적인 정규식이 탭을 잠깐 행을 멈울 수 있음을 명확하게 문서화합니다.

7. **플래그 의미론 How-To**: 각 플래그(g, i, m, s, u, y)는 순 영어 설명 + 예제가 있어야 합니다. 함정(m이 `^`/`$` 의미를 변경, u가 Unicode 이스케이프를 활성화, y가 sticky)이 두드러지게 특징입니다.

8. **복사 버튼 UX**: 매치당 "복사" 버튼이 매치된 텍스트를 복사합니다. 치환 결과 섹션에 "복사 결과" 버튼이 전체 최종 텍스트를 복사합니다. 시각적 피드백: 토스트 "Copied!"(또는 유사, 플랫폼 Toast 시스템에서).

9. **반응형 디자인**: 모바일(320px)에서 매치 리스트는 단일 열 카드가 됩니다. Textarea 전체 폭. 치트시트 축소 가능. 수평 스크롤 없음. `page.setViewportSize({ width: 320, height: 800 })`로 Playwright로 테스트합니다.

10. **영-폭 매칭 위험**: `(?=)` 같은 패턴이 빈 문자열과 일치하면 `regex.exec()`가 무한 루프할 수 있습니다(lastIndex가 고급하지 않음). 가드: 각 매치 후 `match.index === prevMatch.index`인지 확인. 참이면 lastIndex를 수동으로 고급시켜 무한 루프를 회피합니다.
</key_implementation_notes>

</project_specification>
```
