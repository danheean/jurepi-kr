# 크론 표현식 해석기 — 크론 일정 해독 & 다음 실행 시간 계산 — 서비스 SPEC

> 이 문서는 **정본(한국어 번역)**입니다. AI 코딩 에이전트가 소비하는 정본은 [`SPEC.md`](SPEC.md)(영문)입니다. 양쪽을 동기 상태로 유지하세요.
>
> **크론 표현식 해석기** 빌드 명세 — 표준 Unix/Linux 크론 표현식(5필드: 분 시 일 월 요일)을 인간이 읽을 수 있는 설명, 필드별 분석, 그리고 다음 10회 예정된 실행 시간 목록으로 해독하는 브라우저 기반 도구입니다. 사용자가 크론 표현식을 붙여넣거나 사전 설정에서 선택하면, 도구가 일정의 의미를 평문으로 즉시 표시합니다("매주 월요일부터 금요일 오전 9시", "매달 첫째 날 자정"), 정확한 에러 메시지로 각 필드를 검증하고, 사용자의 로컬 타임존을 고려하여 다음 실행 시간을 계산하고(DST 포함), 일반적인 엣지 케이스(윤년, 월 경계)를 설명합니다.
>
> 내부 서비스 코드명: `cron-parser`. 레지스트리 id: `cron-parser`. 공개 URL 슬러그: `/[locale]/tools/cron-parser`.
>
> 이 SPEC은 **도구 자체**를 다룹니다. 공유 셸(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO 인프라, 디자인 토큰은 플랫폼에서 제공됩니다:
> - 플랫폼 SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - 디자인 시스템(시각 정본): [`docs/DESIGN.md`](../../../DESIGN.md)
> - 참고 형제 도구 SPEC(같은 패턴): [`docs/services/dev/json-formatter/SPEC.md`](../json-formatter/SPEC.md)

```xml
<project_specification>

<project_name>크론 표현식 해석기 — 크론 일정 해독 & 다음 실행 시간 계산 (Jurepi 도구, 코드명 cron-parser, 레지스트리 id cron-parser)</project_name>

<overview>
크론 표현식 해석기는 암호 같은 크론 표현식(예: `0 9 * * MON-FRI`)을 읽기 쉽고 실행 가능한 설명("매주 근무일 오전 9시")과 사용자가 선택한 타임존에서의 다음 10회 실행 시간으로 변환합니다. DevOps 엔지니어, 시스템 관리자, 개발자는 크론 작업을 자주 작성하지만 실행 없이 올바른지 확인하기 어려워합니다. 이 도구는 인스턴트하고 오프라인 피드백을 제공합니다: 표현식을 붙여넣으면 인간이 읽을 수 있는 설명, 필드별 분석 테이블(분, 시, 일, 월, 요일, 각각 파싱된 값과 의미 표시), 그리고 타임존 및 일광절약시간을 고려한 다음 실행 시간 목록이 표시됩니다.

이 도구는 표준 5필드 POSIX 크론 구문(분 시 일 월 요일), 값 목록(1,2,3), 범위(1-5), 단계(*/15, 1-30/5), 일반적인 이름(월의 JAN-DEC, 요일의 SUN-SAT), `*` 와일드카드, 그리고 편의 매크로(@yearly, @monthly, @weekly, @daily, @hourly)를 지원합니다. 비표준 Quartz 구문(L, W, #, ?)을 명시적으로 거부하며 친화적 에러 메시지를 표시합니다("Quartz 구문은 지원되지 않음; 표준 POSIX 크론 사용").

CRITICAL(클라이언트 전용, SSG): 100% 클라이언트 측입니다. 백엔드 없음, 데이터베이스 없음. 순수 날짜-시간 계산 및 파싱입니다. 유일한 지속성은 localStorage입니다(사용자 선호도: 타임존, 마지막 표현식, 최근). 크론 표현식과 일정은 기기를 절대 떠나지 않습니다.

CRITICAL(SPA, 사용성 우선): 플랫폼 규칙에 따라, 모든 Jurepi 도구는 SSG 셸에 마운트된 클라이언트 측 Single-Page Application입니다. 모든 상호작용 — 크론 표현식 입력, 타임존 선택, 다음 실행 시간 계산 — 로컬 React 상태로 발생하며 라우트 네비게이션 없음, 전체 페이지 새로고침 없음입니다. 사용자가 타이핑할 때 결과가 인스턴트하게 업데이트됩니다(디바운스 200ms).

CRITICAL(설명의 지역화): 도메인 레이어는 **구조화된 설명 모델**(영문 문장 템플릿 하드코딩 금지)을 반환합니다. UI 레이어는 그 모델을 지역화 i18n 메시지(ko/en)로 맵핑합니다. 예: 도메인은 { frequencyKind: 'everyDay', atTimes: [{ hour: 9, minute: 0 }] }를 반환; UI는 "매일 오전 9시"(ko) 또는 "Every day at 9:00 AM"(en)을 렌더링합니다. 이는 설명이 양쪽 언어에서 항상 정확함을 보장합니다.

CRITICAL(DST-aware 다음 실행 시간 계산): 다음 실행 목록은 일광절약시간 전환(봄날 앞당기기, 가을날 미루기)을 고려해야 합니다. 네이티브 `Intl.DateTimeFormat` 또는 소형 날짜 라이브러리(date-fns, day.js)를 사용하여 타임존 변환을 올바르게 처리합니다. DST 전환이 시간을 건너뛰면(예: 봄날 앞당기기 시 오전 2:30이 존재하지 않음), 도구는 그 실행을 건너뛰거나 결과에 설명해야 합니다.

CRITICAL(정직한 에러 메시지): 유효하지 않은 크론 표현식은 크래시하면 안 됩니다. 유효하지 않은 필드 값(예: 분 61), 지원되지 않는 구문(L, W, #, ?), 그리고 형식이 잘못된 범위 모두 친화적하고 정확한 에러 메시지를 생성합니다(예: "Day-of-month 필드: 유효하지 않은 값 32 (범위: 1–31)").
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/cron-parser (SSG; 레지스트리 슬러그 "cron-parser", id "cron-parser", 상태 "live", 악센트 "rose", 카테고리 "dev").
  - 플랫폼이 제공(재구현 금지): 앱 셸(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈 주변 Error Boundary, lib/seo.ts 메타데이터 빌더, 브래드크럼 + 인콘텐츠 광고 래퍼, ShareButtons.
  - 소비: i18n 네임스페이스 `tools.cron-parser.*` (UI 크롬 문자열: 필드 라벨, 에러 메시지, 타임존 목록, 설명 부분, 방법, FAQ — 크론 표현식 아님(사용자 입력이므로), 설명은 UI 레이어에서 i18n 부분에서 구성, 도메인에서 생성 안 함).
  - 참고 (2026-07-10 업데이트): `'dev'` 카테고리는 이미 플랫폼에 live 상태로 완전히 배선됨. 플랫폼 선행조건은 남지 않음; 이 도구는 자신의 레지스트리 항목만 추가.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - 크론 표현식 입력(단일 텍스트 필드 또는 다중 행 textarea로 붙여넣기).
    - 지원: 5필드 POSIX 크론(분 시 일 월 요일).
    - 필드 값 구문: 리터럴(분 0–59, 시 0–23, 일 1–31, 월 1–12, 요일 0–6 또는 SUN–SAT), 값 목록(1,3,5), 범위(1-5), 단계(*/15, 1-30/5), 와일드카드(*), 이름(월의 JAN-DEC, 요일의 SUN–SAT).
    - 매크로: @yearly (0 0 1 1 *), @monthly (0 0 1 * *), @weekly (0 0 ? * 0 — 비표준, 또는 동등하게 0 0 * * 0), @daily (0 0 * * *), @hourly (0 * * * *). 참고: @yearly부터 @hourly까지는 표준; @weekly는 때때로 `0 0 * * 0`으로 작성됨.
    - 표현식 검증: 각 필드는 독립적으로 파싱; 유효하지 않은 값(예: 분 61, 월 13)은 정확한 에러 메시지 반환.
    - 인간 친화적 설명: 도메인은 구조화 모델 반환; UI는 지역화(ko/en) 설명 렌더(예: "매주 월요일부터 금요일 오전 9시" / "Every weekday at 9:00 AM").
    - 필드별 분석 테이블: 분, 시, 일, 월, 요일, 각각 파싱된 값 표시(예: 분 [0, 15, 30, 45], 요일 [MON, TUE, WED, THU, FRI]).
    - 다음 실행 시간: 사용자가 선택한 타임존에서 일정의 다음 10개 발생 계산, DST 고려. 인간 형식의 타임스탐프로 표시(예: "월요일, 2026년 7월 15일 오전 9:00 EDT").
    - 타임존 셀렉터: 주요 IANA 타임존 나열 드롭다운(America/New_York, Europe/London, Asia/Tokyo, 등) + "Local"(브라우저 로컬 타임존). 기본값은 Local.
    - 다음 실행 없음 상태: 표현식이 유효하지만 다음 실행이 없는 경우(예: 2월 30일), "4년 내 다음 실행 없음" 표시.
    - 사전 설정 표현식: 일반적인 일정의 큐레이션 갤러리(5분마다, 근무일 오전 9시, 월 1일 자정, 등). 한 클릭으로 표현식 필드에 로드.
    - localStorage 지속성: 마지막 표현식, 마지막 타임존, 최근(최대 20개).
    - 정직한 범위 외 메시지: Quartz 특정 구문(L, W, #, ?)은 명시적으로 지원 안 함; 에러 메시지가 표준 POSIX로 사용자를 안내.
    - 도구별 SEO 장문형("크론 작업 기초", "필드 의미 설명", "일반적인 스케줄링 패턴", "타임존 고려사항") + FAQ (FAQPage JSON-LD), 지역화 ko/en.
    - 키보드 지원: Tab, Enter로 파싱, Ctrl+A 전체 선택.
    - Reduced-motion 폴백; WCAG 2.1 AA 접근성.
  </in_scope>
  <out_of_scope>
    - 6필드(초) 크론 또는 7필드 변형 — 범위 외; 향후 검토 Phase 2.
    - Quartz 구문(L, W, #, ?) 또는 기타 크론 방언 — 범위 외; 에러 메시지가 표준 POSIX로 안내.
    - 비 IANA 타임존 형식(예: EST, PST) — 모호성으로 인해 지원 안 함; IANA 이름 제안.
    - 인터랙티브 크론 빌더(필드별 드롭다운으로 표현식 구성) — Phase 2 후보.
    - 크론 표현식 구문 강조 또는 IDE 유사 편집기 — Phase 2.
    - 웹 훅 또는 스케줄링 서비스 통합(예: "이 크론 작업을 지금 실행") — 범위 외(도구는 읽기 전용, 부작용 없음).
  </out_of_scope>
  <future_considerations>
    - 인터랙티브 크론 빌더 UI(필드별 드롭다운) — Phase 2.
    - 초를 포함한 6필드 크론 — Phase 2.
    - 크론 일정을 JSON으로 import/export — Phase 2.
    - Diff 모드(두 크론 표현식 비교, 스케줄 차이 표시) — Phase 3.
    - 크론 표현식 시각화기(다음 30일의 캘린더/타임라인 뷰) — Phase 3.
    - 비 영어 언어 팩(ko/en 초과) — Phase 2+ (i18n 전략에 따라).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl (ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <parser>손 작성 파서(외부 크론 라이브러리 없음) 또는 경량 파서(cron-parser v3, 가능하면 MIT/Apache 라이선스 및 소형). 파서는 5필드 표현식을 토큰화, 각 필드 검증(범위 확인, 이름 매핑 JAN-DEC/SUN-SAT), 구조화 표현 구축: { minute: number[], hour: number[], dom: number[], month: number[], dow: number[] } 또는 유사. 특수 처리: `*`은 전체 범위로 확장, `/`은 단계, `,`는 목록, `-`는 범위. 상호배타 dom/dow 규칙(양쪽 비 * 경우, 크론 의미론 "dom 또는 dow 일치, 그리고 아님"); FAQ에 문서화.</parser>
    <description_model>도메인 레이어는 TYPED 모델 반환: { frequencyKind: 'everyMinute' | 'everyNMinutes' | 'everyHour' | 'everyDay' | 'everyWeekday' | 'monthly' | 'yearly' | 'custom', atTimes?: [{hour, minute}], onDays?: [...], onMonths?: [...], ... } (구조화, 영문 산문 아님). UI 레이어는 모델을 i18n 키로 맵핑하여 지역화 설명 렌더.</description_model>
    <next_run_computation>반복 알고리즘(외부 날짜 수학 라이브러리 불필요, 하지만 day.js 또는 date-fns는 수용): 현재 시간부터 시작(또는 오늘 모든 실행이 과거면 내일), 분 단위로 반복(또는 최적화를 위해 시간 단위), 각 후보 날짜/시간을 크론 표현식에 대해 테스트, N=10 실행까지 일치 수집. 최적화: 큰 점프로 전진(예: 월이 일치하지 않으면 다음 월 1일로 점프). 4년 룩어헤드에서 반복 제한으로 불가능한 날짜에서 무한 루프 방지(2월 30일). DST 전환 처리: 시간 진행이 DST 경계를 넘으면, 브라우저의 로컬 타임존(Intl.DateTimeFormat 또는 Date/Intl API 경유)을 사용하여 올바른 로컬 시간 계산.</next_run_computation>
    <timezone_handling>Intl.DateTimeFormat with timeZone 옵션, 또는 date-fns `utcToZonedTime` + `format`으로 다음 실행 시간을 사용자의 선택 타임존으로 현지화. Intl은 표준; date-fns는 선택(반복 상한 알고리즘이 너무 느리면 추가). 다음 실행 표시를 로케일 인식 날짜/시간 문자열로 포맷(예: "월요일, 2026년 7월 15일 오전 9:00 EDT").</timezone_handling>
    <validation>zod v3.x for 크론 표현식 스키마 및 설정 저장소(타임존, 최근).</validation>
    <localStorage>jurepi-cron-parser 키; zod 검증 저장소(표현식, 타임존, 최근); 로드 시 유효하지 않은 항목 자동 정리.</localStorage>
    <presets>큐레이션 크론 상수 모듈(`lib/cron-parser/presets.ts`)로 명명된 표현식(5분마다, 근무일 오전 9시, 월 1일, 등). i18n으로 지역화 표시명.</presets>
    <testing_strategy>황금 벡터: 알려진 크론 표현식과 예상 다음 실행 결과에 대해 테스트(예: `0 9 * * MON-FRI`는 근무일을 계산해야 함). 엣지 케이스 검증(윤년, 월 경계, DST 전환, 불가능한 날짜(2월 30)). 참고 크론 라이브러리(배포되지 않음, 테스트 오라클로만)에 대해 계산 시간 검증.</testing_strategy>
  </module_specific>
  <libraries>
    <parser_option_1>손 작성 파서: ~300 LOC, 외부 의존성 없음, 완전한 제어, 성능이 중요하면 적합.</parser_option_1>
    <parser_option_2>cron-parser v3.1+ (MIT) 또는 cron-schedule(소형, 순수 JS, MIT). 구현 시간에 크기 + API 적합성 평가.</parser_option_2>
    <date_handling>Intl.DateTimeFormat(표준, 기본 내장) 타임존 변환용. 선택: date-fns v2/3 (ESM 트리 쉐이커블, 소형) DST 인식 날짜 산술용(손 작성 반복이 너무 느리면).</date_handling>
    <zod>zod v3.x — 이미 저장소에 있음; 표현식 + 설정 스키마 검증을 위해 재사용.</zod>
  </libraries>
  <note>CRITICAL: 백엔드 없음, API 호출 없음, 네트워크 없음. 모든 계산은 클라이언트 측, 결정론적.</note>
</technology_stack>

<file_structure>
src/
├── lib/cron-parser/                       # 순수 도메인 레이어 — React/Next 없음, 완전히 단위 테스트됨
│   ├── schema.ts                          # zod: CronExpression, ParsedFields, DescriptionModel, Settings
│   ├── tokenizer.ts                       # tokenizeCron(expr: string): tokens | { error: SyntaxError }
│   ├── parser.ts                          # parseCron(expr): ParsedFields | { error: ParseError } (필드별 검증)
│   ├── validator.ts                       # validateFields(fields): { isValid, errors: FieldError[] }
│   ├── description.ts                     # toDescriptionModel(fields): DescriptionModel (구조화, 영문 아님)
│   ├── next-runs.ts                       # computeNextRuns(fields, {now, timezone, limit, maxYears}): DateTime[]
│   ├── macros.ts                          # expandMacro(macro): ParsedFields (예: @daily → 0 0 * * *)
│   ├── presets.ts                         # PRESET_EXPRESSIONS: typed constant
│   ├── timezone-list.ts                   # TIMEZONE_NAMES: IANA timezone 문자열
│   └── constants.ts                       # 필드 범위, 필드 이름, 일반 상수
├── components/tools/cron-parser/
│   ├── CronParser.tsx                     # 오케스트레이터(Client Component) — state 소유자
│   ├── useCronParser.ts                   # 훅: 표현식/타임존/최근 상태, localStorage 지속성
│   ├── ExpressionInput.tsx                # 크론 표현식 텍스트 필드; onChange → 디바운스 → 파싱
│   ├── TimezoneSelector.tsx               # 드롭다운: "Local" + IANA 타임존
│   ├── ParseResultDisplay.tsx             # 조건부: 파싱 필드 테이블, 설명, 또는 에러 표시
│   ├── FieldBreakdownTable.tsx            # 테이블: 분, 시, 일, 월, 요일 열; 파싱 값 각 셀
│   ├── DescriptionText.tsx                # 인간 친화적 설명(DescriptionModel에서, i18n으로 렌더)
│   ├── NextRunsList.tsx                   # 테이블 또는 목록: 10개 다음 실행 시간(형식화, 타임존 현지화)
│   ├── ErrorMessage.tsx                   # 유효하지 않은 표현식 또는 다음 실행 없음 상태에 대한 친화적 에러 표시
│   ├── PresetExpressions.tsx              # 드롭다운 또는 버튼 그리드: 표현식 필드에 사전 설정 로드
│   ├── RecentsList.tsx                    # 최근 표현식 목록(최대 20개); 로드/삭제 버튼
│   ├── CronCheatsheet.tsx                 # 축소 가능 참조: 구문 범례(*, 범위, 단계, 이름, 매크로)
│   ├── CronParserIntro.tsx                # H1 + lead (SEO 장문형)
│   ├── CronParserHowTo.tsx                # "크론 기초", "필드 의미", "일반적인 패턴", "타임존 팁" (SEO)
│   ├── CronParserFaq.tsx                  # FAQ + FAQPage JSON-LD (예: "dom/dow 상호배타란?", "요일이 0–6인 이유?")
│   └── CopyButton.tsx                     # 표현식을 클립보드로 복사(토스트 피드백)
└── i18n/messages/{ko,en}.json             # tools.cron-parser.* UI 크롬
</file_structure>

<core_data_entities>
  <parsed_fields>
    - minute: number[] (0–59).
    - hour: number[] (0–23).
    - dom: number[] (1–31, 월의 날).
    - month: number[] (1–12).
    - dow: number[] (0–6, 여기서 0 = 일요일; 또는 SUN–SAT 이름에서 0–6으로 매핑).
    - isValid: boolean.
    - error?: { field: string; message: string } — 필드가 유효하지 않으면.
  </parsed_fields>
  <description_model>
    - frequencyKind: enum (everyMinute, everyNMinutes, everyHour, everyDay, everyWeekday, everyWeekend, monthly, yearly, custom).
    - atTimes?: { hour: number; minute: number }[] — 매일 작업이 실행되는 시간.
    - onDays?: string[] — "MON", "TUE" 같은 이름(dow 지정된 경우).
    - onMonths?: string[] — "JAN", "FEB" 같은 이름(월 지정된 경우).
    - onDatesOfMonth?: number[] — 날 숫자(dom 지정된 경우).
    - explanation?: string — 폴백 영어(배포 안 함; i18n 부분 사용).
  </description_model>
  <next_run>
    - datetime: Date 객체(사용자 선택 타임존에서, 로케일 인식 문자열로 형식화).
    - formatted: string — 예: "월요일, 2026년 7월 15일 오전 9:00 EDT".
    - utc: string — ISO 8601 UTC 기술 참고(선택).
  </next_run>
  <settings>
    - timezone: string — IANA 타임존 이름(예: "America/New_York") 또는 "Local".
    - lastExpression?: string — 지속됨.
    - recents?: string[] — 최근 표현식 배열(최대 20개).
  </settings>
  <constants>
    - DEBOUNCE_MS = 200ms (키스트로크 지연 시 파싱).
    - NEXT_RUNS_LIMIT = 10.
    - MAX_LOOKAHEAD_YEARS = 4 (무한 루프 방지를 위한 반복 한계).
    - FIELD_RANGES = { minute: [0, 59], hour: [0, 23], dom: [1, 31], month: [1, 12], dow: [0, 6] }.
  </constants>
</core_data_entities>

<route_definitions>
/[locale]/tools/cron-parser
  - SSG 페이지.
  - 브레드크럼: 홈 > 도구 > 크론 파서.
  - 메타데이터: `generateMetadata(locale)`에서 `seo.absoluteToolUrl('cron-parser', locale)`을 정본으로 사용.
  - Error Boundary가 CronParser 컴포넌트를 래핑.
  - Intro/HowTo/Faq 섹션이 `mounted` 게이트 밖에서 렌더(SSR).
  - ShareButtons가 라우트 템플릿으로 자동 배선.
</route_definitions>

<component_hierarchy>
CronParser (Client Component, 루트)
├── ExpressionInput (텍스트 필드, onChange → 디바운스 → 파싱)
├── TimezoneSelector (드롭다운, onChange → 다음 실행 재계산)
├── ParseResultDisplay (조건부: 파싱 필드 또는 에러 표시)
│   ├── FieldBreakdownTable (유효하면)
│   ├── DescriptionText (인간 친화적, i18n에서)
│   ├── NextRunsList (10개 다음 발생)
│   └── ErrorMessage (유효하지 않으면)
├── PresetExpressions (버튼 그리드 또는 드롭다운)
├── RecentsList (저장된 표현식 목록, 로드/삭제)
├── CronCheatsheet (축소 가능 아코디언)
├── CopyButton (표현식을 클립보드로 복사)
└── [ErrorMessage component] (조건부, 최상위 에러 또는 다음 실행 없음 상태)

서버 컴포넌트 (SEO):
├── CronParserIntro (H1 + lead 단락)
├── CronParserHowTo (다중 섹션 가이드)
├── CronParserFaq (Q/A 쌍, FAQPage JSON-LD Faq 컴포넌트로 방출)
└── StructuredData (SoftwareApplication JSON-LD, url == 정본)
</component_hierarchy>

<pages_and_interfaces>
인터랙티브 도구(클라이언트 SPA):
  - ExpressionInput: 한 줄 또는 다중 행 텍스트 필드(모노스페이스 폰트), aria-label "크론 표현식", onChange → 디바운스 200ms → 재파싱 + 재계산.
  - TimezoneSelector: "Local" + IANA 존(America/New_York, Europe/London, Asia/Tokyo, 등)을 나열하는 드롭다운, onChange → 새 타임존에서 다음 실행 재계산, 시간 형식화 그에 따라.
  - FieldBreakdownTable: 깔끔한 테이블(또는 모바일에서 div 그리드) 열: 필드명(분, 시, 일, 월, 요일), 파싱 값(예: [0, 15, 30, 45] 또는 [MON, TUE, WED]). 필드가 와일드카드(*)면, 툴팁 "와일드카드가 모든 값 일치"와 함께 "All" 표시.
  - DescriptionText: 단일 단락 또는 짧은 다중 행, 로케일 인식(ko/en), 예: "매주 월요일–금요일 오전 9시".
  - NextRunsList: 테이블 유사 목록(또는 모바일에서 카드 그리드) 열: 발생 #(1–10), 날짜, 시간, 타임존 약자(EDT, JST, 등). 행 클릭 → 클립보드로 복사?(선택 인터랙션). 4년 내 다음 실행 없으면, "다음 실행 없음" 표시.
  - PresetExpressions: 드롭다운("사전 설정 로드…") 또는 "5분마다", "근무일 오전 9시", "월 1일 자정" 등을 나열하는 버튼 그리드. 클릭 → 표현식 필드 채우기 + 파싱.
  - RecentsList: 축소 가능 섹션로 최근 표현식(텍스트 미리보기, 로드/삭제 버튼) 나열. 최대 20개.
  - CronCheatsheet: 섹션(구문 개요, 필드 의미, 일반적 값, 범위 & 단계, 이름(월/날), 매크로, 함정(dom/dow 상호배타, 요일 0–6, 윤년))을 가진 축소 가능 아코디언.
  - ErrorMessage: 인라인 콜아웃(role=alert) 표현식이 유효하지 않거나 다음 실행 없으면. 친화적 메시지 + 제안 표시.
  - CopyButton: 표현식을 클립보드로 복사; 성공 시 토스트 "복사됨!".

SEO/장문형 (SSR):
  - CronParserIntro: H1 "크론 표현식 해석기" + 도구를 설명하는 짧은 lead.
  - CronParserHowTo: 섹션(각 다중 단락): "크론 필드 이해", "일반적인 스케줄링 패턴", "타임존 고려사항", "일광절약시간 엣지 케이스".
  - CronParserFaq: 6–8개 Q/A 쌍(지역화, 예: "dom과 dow의 차이?", "요일이 0–6인 이유?", "매달 15일에 뭔가를 스케줄하려면?", "일광절약시간 중 무슨 일이?"). Faq 컴포넌트가 방출하는 FAQPage JSON-LD.
</pages_and_interfaces>

<core_functionality>
1. **파싱 & 검증**: 사용자가 5필드 크론 표현식을 입력. 키스트로크 시(디바운스 200ms), 토큰화 및 각 필드 파싱. 범위 검증(분 0–59, 시 0–23, 등); 이름 매핑(JAN-DEC, SUN-SAT); 와일드카드와 단계 확장. 필드가 유효하지 않으면, 친화적 에러 표시("Day-of-month: 유효하지 않은 값 32"). 그렇지 않으면, ParsedFields 객체 구축.

2. **설명 생성**: ParsedFields에서, DescriptionModel(구조화, 영문 산문 아님) 생성. 예: { frequencyKind: 'everyWeekday', atTimes: [{ hour: 9, minute: 0 }] }. UI 레이어는 이 모델을 i18n 키 사용해 지역화 텍스트 렌더.

3. **다음 실행 계산**: 현재 시간(또는 다음 적용 발생)에서 시작, 후보 통과, 각각을 크론 표현식에 대해 테스트. 앞으로 스킵으로 최적화(예: 월이 일치하지 않으면 다음 월로 스킵). 10개 일치 수집, 4년 룩어헤드에서 제한. 로케일 인식 날짜/시간 + 타임존 약자로 각 형식화.

4. **타임존 처리**: 사용자가 타임존 선택(또는 "Local"). 다음 실행 계산은 UTC에서 내부 수행; 결과는 Intl.DateTimeFormat 경유 사용자 타임존으로 변환. DST 전환은 브라우저의 타임존 데이터베이스로 자동 처리.

5. **사전 설정 로드**: 사용자가 드롭다운/그리드에서 사전 설정 표현식 선택 → 표현식 필드 채워짐 → 재파싱 + 재계산 + 결과 업데이트.

6. **복사 작업**: 사용자가 표현식 복사 → navigator.clipboard (textarea 폴백 포함). 성공 시 토스트 피드백.

7. **치트시트 & 도움**: 축소 가능 치트시트로 구문 참조, 필드 의미, 일반적 패턴, 함정(dom/dow 상호배타, 요일 0–6 의미론, 불가능한 날짜).
</core_functionality>

<error_handling>
- **유효하지 않은 필드 값**(예: 분 61): 파싱 중 캐치, 친화적 에러 표시: "분 필드: 유효하지 않은 값 61 (범위: 0–59)".
- **지원되지 않는 구문**(L, W, #, ?): "Quartz 구문은 지원되지 않습니다. 표준 POSIX 크론 사용: *, 범위(1-5), 단계(*/15), 목록(1,3,5), 이름(JAN-DEC, SUN-SAT)." 표시.
- **형식이 잘못된 범위 또는 단계**(예: "1-5-9"): "유효하지 않은 범위 구문. 'start-end' 또는 'start-end/step' 사용." 표시.
- **빈 또는 누락된 필드**: 사용자가 "0 9 * *"(4개 필드)를 입력하면, "크론 표현식은 5개 필드(분 시 일 월 요일)를 가져야 함." 표시.
- **다음 실행 없음**: 표현식이 유효하나 4년 내 일치 없음(예: 2월 30일), "다음 4년 내 실행 시간 없음" 표시.
- **localStorage 불가능**: 인메모리 폴백(최근은 리로드 시 유실). 사용자에게 에러 표시 안 함.
- **타임존 인식 안 됨**: 저장된 타임존을 더 이상 사용 불가(IANA 이름에 대해 가능성 낮음), Local로 폴백.
- **유효하지 않은 매크로**(예: @hourlyy): "알 수 없는 매크로. 유효한 매크로: @yearly, @monthly, @weekly, @daily, @hourly." 표시.
</error_handling>

<aesthetic_guidelines>
- 악센트 색(rose — `#fb7185` / var(--accent-rose)) 사용: 다음 실행 중요 날짜 강조, 드롭다운에서 활성 타임존, 버튼 호버 상태.
- 모노스페이스 폰트(Monaco, Courier New): 표현식 입력, 분석 테이블의 필드 값, 다음 타임스탐프.
- 필드 분석 테이블 미묘한 행 구분자로 스타일; 호버 상태가 행을 약간 올림(그림자).
- 축소 가능 아코디언 치트시트; 섹션 헤더는 헤드라인 타이포그래피, 코드 예제는 모노스페이스, 구문 규칙은 악센트 색 강조.
- 다음 실행 목록 데스크톱 테이블, 모바일(≤600px)에서 쌓인 카드. 각 실행은 날짜(큼), 시간(큼), 타임존(작음, 보조 색) 표시.
- 다크 테마 색: 악센트 로즈가 다크 모드에서 var(--dark-accent-rose) 또는 유사로 밝힘.
- Reduced motion: 행 호버 올림 비활성화, 치트시트 아코디언 즉시 열기, 슬라이드 애니메이션 없음.
- Focus visible: 모든 버튼 및 인터랙티브 요소에 `focus-visible` 링(--focus-ring 색 사용).
</aesthetic_guidelines>

<security_considerations>
- **입력 검증**: 크론 표현식은 사용자 제공 문자열(textarea, eval 아님). 안전한 토큰화기/파서로 파싱(동적 코드 실행 없음). 사용자 제공 일정에서 보안 위험 없음.
- **localStorage 주입**: 로드된 설정을 zod로 검증 후 사용. 스키마가 유효하지 않으면 우아하게 실패(최근 버림, 신규 시작).
- **네트워크 누수 없음**: 타임존 이름은 정적(IANA 목록). 사용자 일정이나 표현식이 네트워크로 전송 안 됨.
- **XSS 방지**: 설명 텍스트와 에러 메시지는 React로 렌더(기본 안전). dangerouslySetInnerHTML 없음.
</security_considerations>

<advanced_functionality>
- **Dom/Dow 상호배타**: 표준 크론에서, dom과 dow 둘 다 지정(와일드카드 아님)되면, 표현식은 **두 조건 중 하나**가 참이면 일치(AND 아닌 OR 로직). 예: `0 9 15 * MON`는 "매달 15일 오전 9시 **또는** 임의 월의 임의 월요일" 의미. 치트시트 + FAQ 예시로 설명.
- **요일 의미론**: 요일 0 = 일요일, 1 = 월요일, …, 6 = 토요일. 일부 시스템은 7 = 일요일 허용(대안). 이 도구는 0–6 표준 POSIX 사용; 사용자가 7 입력하면, 0(일요일)로 해석.
- **윤년 & 2월**: 2월 29는 윤년에만 존재. 표현식 `0 0 29 2 *`는 매 윤년 2월 29일 실행. 다음 실행 계산은 비윤년 2월 29 후보 건너뜀.
- **월 경계**: 4월 31은 존재하지 않음; 표현식이 31일 지정하면, 4월 발생 건너뜀.
- **DST 전환**: 현지 시간이 봄에 앞당겨질 때(예: 오전 2시 → 오전 3시), 오전 2:30 같은 시간은 건너뜀. 현지 시간이 가을에 미뤄질 때(예: 오전 2시 → 오전 1시, 반복), 오전 1:30 같은 시간은 두 번 발생. 도구는 브라우저의 Intl.DateTimeFormat 사용(DST 올바르게 처리); FAQ에서 동작 문서화.
</advanced_functionality>

<final_integration_test>
시나리오 1: **근무일 오전 9시** — 사용자가 `0 9 * * MON-FRI` 입력 또는 "근무일 오전 9시" 사전 설정 로드. 파싱 필드 표시: minute=[0], hour=[9], dom=[1-31], month=[1-12], dow=[1,2,3,4,5]. 설명: "매주 월요일–금요일 오전 9시". 다음 실행이 다음 10개 월-금 오전 9시를 나열. 타임존 셀렉터 스왑 허용(EST → JST, 시간 올바르게 업데이트).

시나리오 2: **유효하지 않은 필드 — 32일** — 사용자가 `0 0 32 1 *` 입력. 파서가 유효하지 않은 dom 값 32 캐치, "Day-of-month 필드: 유효하지 않은 값 32 (범위: 1–31)." 표시. 크래시 없음; 앱 사용 가능.

시나리오 3: **윤년 2월 29** — 사용자가 `0 0 29 2 *` 입력. 파서 성공. 설명: "자정 2월 29(매 윤년)". 다음 실행이 다음 윤년(2028, 2032, 등)의 2월 29 나열, 비윤년 건너뜀.

시나리오 4: **사전 설정 매크로 @daily** — 사용자가 사전 설정에서 @daily 선택. `0 0 * * *`로 확장. 다음 실행이 "내일 자정, 모레 자정" 등을 표시, 선택 타임존에서 매일 오전 12:00.

시나리오 5: **타임존 DST 전환** — 사용자가 "America/New_York" 선택. 크론 실행이 봄 앞당기기(건너뛴 시간 오전 2–3시) 중 떨어짐. 툴팁 또는 FAQ가 건너뛴 실행 시간 중 설명.

시나리오 6: **다음 실행 없음 (2월 30)** — 사용자가 수동으로 `0 0 30 2 *` 입력(2월 30(절대 존재 안 함)). 파서 수용(dom=30은 범위 1–31에), 하지만 다음 실행 계산이 4년 내 일치 없음 찾음. 결과: "다음 4년 내 실행 시간 없음."

시나리오 7: **Quartz 구문 에러** — 사용자가 `0 0 L * *` 입력(Quartz "L"은 "월 마지막 날"). 파서 표시: "Quartz 구문은 지원되지 않습니다. 표준 POSIX 크론 사용." 적용 가능하면 올바른 POSIX 해결책 제안.

시나리오 8: **복사 & 최근** — 사용자가 유효한 표현식 입력, "클립보드로 복사" 클릭. 토스트 "복사됨!" 나타남. 다음 새로고침 또는 새 세션, RecentsList가 저장된 표현식 표시. 클릭 → 입력으로 재로드.

시나리오 9: **로케일 전환 (ko/en)** — 사용자가 헤더로 언어 전환. 모든 UI 문자열(필드 라벨, 에러 메시지, 설명 텍스트)이 next-intl로 업데이트. 크론 표현식 자체는 언어 무관(숫자 + MON, JAN 같은 이름은 영문 관례). FAQ/HowTo 섹션도 선택 언어로 재렌더.

시나리오 10: **모바일 반응형** — 320px 너비에서, 필드 분석 테이블은 단일 열 카드. 다음 실행 목록은 쌓인 카드(날짜 큼, 시간 큼). 치트시트 축소 가능. 수평 스크롤 없음. 터치 대상 ≥44×44px. 타임존 드롭다운 작동(길면 드롭다운 스크롤).
</final_integration_test>

<success_criteria>
- **정확성**: 크론 파싱이 표준 POSIX 의미론 일치(5필드, 와일드카드, 범위, 단계, 이름). 다음 실행 계산이 월 경계, 윤년, DST 고려. dom/dow 상호배타 올바름(OR 로직).
- **안전성**: 포착 안 된 에러 없음; 유효하지 않은 표현식이 친화적 메시지 표시; 무한 루프 없음(4년 한계 반복).
- **사용성**: 파싱/설명/계산 모두 <200ms 내 완료(전형 표현식). 에러 메시지 실행 가능(필드, 범위, 제안 지정).
- **접근성**: WCAG 2.1 AA; 키보드 네비게이션; 스크린 리더가 결과 및 에러 공지; prefers-reduced-motion 존경.
- **지역화**: 모든 사용자 대면 문자열(설명, 에러 메시지, 필드명, 도움 텍스트)이 i18n 네임스페이스 `tools.cron-parser.*`(ko/en). 설명 생성이 i18n 부분 사용, 영문 템플릿 아님.
- **타임존**: 다음 실행 목록이 사용자 선택 타임존에서 DST 인식 형식의 시간 표시. 타임존 셀렉터 "Local" + 주요 IANA 존 포함. 시간 문자열이 타임존 약자 포함(EDT, JST, 등).
- **모바일**: 반응형 레이아웃(320px+); 수평 스크롤 없음; 터치 인터랙션 작동.
- **SEO**: 제목, 설명, Intro/HowTo/FAQ 인덱싱; SoftwareApplication + FAQPage JSON-LD 방출; 정본 URL 올바름.
- **플랫폼 통합**: 레지스트리 항목 추가(id, slug, 악센트, 카테고리, 상태, addedAt); 적절한 generateMetadata 및 Error Boundary로 라우트; ShareButtons 자동 배선.
</success_criteria>

<build_output>
src/ 아래 파일 구조:
- lib/cron-parser/ (9개 모듈, ~600 줄 합계, ≥95% 단위 테스트 커버리지)
- components/tools/cron-parser/ (13개 컴포넌트 파일, ~700 줄 합계, ≥85% 커버리지)
- i18n/messages/{ko,en}.json (tools.cron-parser.* 키 추가; ~100 문자열)

레지스트리 항목 (tools/registry.ts):
```ts
{
  id: 'cron-parser',
  slug: 'cron-parser',
  category: 'dev',
  icon: 'Clock', // 또는 유사 lucide 아이콘
  accent: 'rose',
  status: 'live',
  order: 125,
  addedAt: '2026-07-10',
  keywords: ['cron', 'schedule', 'job', 'timezone', 'next-run', 'crontab']
}
```

i18n 키 (tools.cron-parser.*):
- title, description (최상위, 대시보드 카드)
- expressionLabel, timezoneLabel, parseLabel, presetLabel
- fieldNames: minute, hour, dom, month, dow
- fieldRanges: (범위 표시)
- noUpcomingRuns, invalidField, unsupportedSyntax
- descriptionTemplates: (설명 구축 부분: "everyDay", "weekdayAt", "monthlyOn", 등)
- cheatsheet.title, cheatsheet.sections[…]
- howTo.title, howTo.sections[…]
- faq.items[{q, a}]

Sitemap: 단일 /[locale]/tools/cron-parser 항목(스포크 라우트 없음; 단일 페이지 인터랙티브 도구).

SEO 메타데이터:
- 정본: seo.absoluteToolUrl('cron-parser', locale)
- og:title, og:description (i18n 제목/설명에서)
- JSON-LD: SoftwareApplication (url == 정본), Faq 컴포넌트로 방출 FAQPage

빌드 시간: ~8–12초(vitest + tsc + next build).
</build_output>

<key_implementation_notes>
1. **레지스트리 항목**: id/slug `cron-parser`, 카테고리 `dev`, 악센트 `rose`, 상태 `live`, `addedAt: '2026-07-10'`(필수). 순서 = 125(url-encoder 120과 rankings 130 사이 빈 슬롯).

2. **i18n 네임스페이스**: 모든 사용자 대면 문자열이 `tools.cron-parser.*`에. 최상위 `title`과 `description` 필수. 설명이 i18n **부분**(예: `descriptionTemplates.everyWeekday`, `atTime`)에서 구성, 도메인의 영문 산문 템플릿 아님.

3. **중요 경로**:
   - 표현식 입력 → 파싱(필드별) → 유효하면, 설명 모델 생성 + 다음 실행 계산.
   - 타임존 변경 → 새 타임존에서 다음 실행 재계산, 시간 재형식화.
   - 모든 시간이 네이티브 Date + Intl.DateTimeFormat 사용(DST 인식).

4. **테스트 전략 (TDD)**:
   - 도메인(`lib/cron-parser/`): 파서, 검증기, 설명 모델, 다음 실행 계산 단위 테스트. 황금 벡터(알려진 표현식과 예상 다음 실행 날짜). 커버리지 ≥95%.
   - 컴포넌트: ExpressionInput, FieldBreakdownTable, NextRunsList 스냅샷 + RTL 테스트. computeNextRuns를 UI 테스트에 모의.
   - E2E (Playwright): 표현식 입력 → 파싱 필드 표시 → 설명 렌더 → 다음 실행 계산되고 선택 타임존으로 형식화.

5. **권장 빌드 순서**:
   - Phase 1a: 도메인(토큰화기, 파서, 검증기, 설명 모델). TDD red→green.
   - Phase 1b: 다음 실행 계산 알고리즘(황금 테스트 벡터 포함).
   - Phase 1c: 상수, 사전 설정, 타임존 목록, localStorage 스키마(zod).
   - Phase 2a: 훅(useCronParser) + 루트 CronParser 오케스트레이터.
   - Phase 2b: 입력 컴포넌트(ExpressionInput, TimezoneSelector).
   - Phase 2c: 표시 컴포넌트(FieldBreakdownTable, DescriptionText, NextRunsList, ErrorMessage).
   - Phase 3: 사전 설정/RecentsList, CronCheatsheet, CopyButton.
   - Phase 4: SEO (Intro, HowTo, Faq), 레지스트리 항목, i18n 키.
   - Phase 5: E2E 테스트, 디자인 연마, 접근성 감시.

6. **파서: 구축 vs. 구매**: cron-parser (npm) v3가 가능하고 소형이고 MIT 라이선스면, 고려. 그렇지 않으면, 손 작성 파서가 간단(~300 LOC)이고 완전한 제어 제공. 결정 전 번들 크기 + 테스트 패스 검증.

7. **다음 실행 계산 최적화**: 4년 위 분 단위 반복 = ~200만 반복; 느림. 최적화:
   - 월이 일치하지 않으면 월 단위로 앞 스킵.
   - 시/일/요일이 일치하지 않으면 시/일 단위로 앞 스킵.
   - Intl.DateTimeFormat 사용해 Date 객체 소진 회피.
   - 손 작성이 느리면, date-fns `nextDate` 도우미 또는 유사 고려.

8. **Dom/Dow 함정**: FAQ + HowTo에서 명확하게 설명. "0 0 15 * MON" 같은 황금 벡터로 테스트(15일 또는 월요일).

9. **DST 설명**: FAQ에 문서화: "일광절약시간 전환 중, 일부 시간이 건너뛰어짐(봄 앞당기기) 또는 반복(가을 미루기). 이 도구는 브라우저의 타임존 데이터베이스를 사용해 DST 자동 처리. 스케줄된 시간이 건너뛰어지면, 다음 유효한 발생 사용."

10. **복사 버튼 UX**: 표현식 복사(설명 또는 다음 실행 아님). 성공 시 토스트 "복사됨! 표현식: [미리보기]".
</key_implementation_notes>

</project_specification>
```
