# Quartz 형식 확장 — 청사진 (cron-parser 기능 추가)

## 목표
cron-parser에 **Java Quartz cron 형식**(6~7 필드 + `L/W/#/?`·초·년) 해석을 추가.
Unix crontab(5필드)과 **명시적 모드 토글**로 전환. 완전 패리티(설명·필드분석·다음 실행).

## 결정 (사용자)
- 모드 = **명시적 토글** (Unix crontab | Quartz). 모드별 프리셋 분리.
- 범위 = **완전 패리티**: L(마지막)·W(가까운 평일)·#(N번째 요일)·? · 초 · 년 전부, 다음 실행 시각 포함.

## 계층 (클린 아키텍처, Unix 경로 무손상)
- 도메인(신규, 리더 TDD): `quartz-schema.ts` · `quartz-parser.ts` · `quartz-description.ts` · `quartz-next-runs.ts` · `quartz-presets.ts`
- 어댑터(ui-engineer, 계약 고정 후): 모드 토글 · useCronParser 모드 라우팅 · 필드분석표 가변 컬럼 · 설명 렌더 · 프리셋
- 프레임워크: i18n(ko/en) 추가. 라우트/SEO 불변.

## Quartz 형식 규격 (구현 근거)
- 필드: `초 분 시 일 월 요일 [년]` (6 또는 7). 초 0-59, 분 0-59, 시 0-23, 일 1-31, 월 1-12(또는 JAN-DEC), 요일 **1-7(1=SUN..7=SAT)** 또는 SUN-SAT, 년 1970-2099(선택).
- 특수문자:
  - `?` — dom 또는 dow 중 **정확히 하나**에만. "지정 안 함". (Unix의 OR과 다름)
  - `*` `,` `-` `/` — 공통.
  - `L` — dom: 그 달 마지막 날. `L-3` = 마지막-3일. dow: `6L` = 그 달 마지막 금요일(Quartz 6=FRI). 단독 `L`(dow)=토요일(7)로도 쓰이나 우리는 dom `L`·`<dow>L`만 지원.
  - `W` — dom: `15W` = 15일에 가장 가까운 평일(토→금, 일→월, 달 경계 안). `LW` = 그 달 마지막 평일.
  - `#` — dow: `6#3` = 그 달 세 번째 금요일. n=1..5.
- **정규화**: Quartz dow(1=SUN..7=SAT, 이름) → 내부 0-6(0=SUN)로 변환해 매칭 재사용. 즉 quartzNum-1, 또는 이름 DAY_MAP.

## QuartzFields 모델 (quartz-schema.ts)
```ts
type QuartzNumbers = number[];              // 후보값 집합(정렬)
type DomSpec = {
  values: number[];        // 1-31 명시값 (?/L/W면 빈 배열 가능)
  noSpecific: boolean;     // '?'
  lastDay: boolean;        // 'L'
  lastOffset?: number;     // 'L-3' → 3
  lastWeekday: boolean;    // 'LW'
  nearestWeekday?: number; // '15W' → 15
};
type DowSpec = {
  values: number[];        // 0-6 정규화 명시값
  noSpecific: boolean;     // '?'
  last?: number;           // '6L' → 5(FRI, 0-6)
  nth?: { dow: number; n: number }; // '6#3' → {dow:5, n:3}
};
type QuartzFields = {
  second: number[]; minute: number[]; hour: number[];
  dom: DomSpec; month: number[]; dow: DowSpec; year?: number[];
  hasYear: boolean;
  isValid: boolean;
  error?: { field: string; message: string };
};
```

## 공개 API 계약 (도메인 → UI)
- `parseQuartz(expr: string): QuartzFields`
- `describeQuartz(fields: QuartzFields): QuartzDescriptionModel`  // 구조화 모델(영문 산문 금지)
- `computeNextRunsQuartz(fields, { now, timezone, limit, maxYears }): NextRun[]`  // TZ-aware(기존 오프셋 방식 재사용), 초 확장, L/W/#/? 매칭, dom/dow ? 배타
- `QUARTZ_PRESETS: Preset[]`
- `QUARTZ_FIELD_NAMES = ['second','minute','hour','dom','month','dow','year']`

### QuartzDescriptionModel (UI가 i18n으로 렌더)
```ts
type QuartzDescriptionModel = {
  frequencyKind: 'everySecond'|'everyNSeconds'|'everyMinute'|'everyHour'|'everyDay'|'custom';
  atTimes?: { hour:number; minute:number; second:number }[];
  domKind?: 'specific'|'lastDay'|'lastOffset'|'lastWeekday'|'nearestWeekday'|'noSpecific';
  domDetail?: { dates?: number[]; offset?: number; nearest?: number };
  dowKind?: 'specific'|'last'|'nth'|'noSpecific';
  dowDetail?: { days?: string[]; last?: string; nth?: {day:string; n:number} };
  onMonths?: string[]; years?: number[];
};
```

## next-runs 알고리즘 (quartz-next-runs.ts)
- 기존 Unix `zoneOffsetMinutes` 재사용(시간 경계 오프셋 갱신 = DST 안전).
- **분 단위 순회**(초는 매칭 분에서 second 집합으로 확장 → 초 단위 순회 불필요·성능). limit 도달까지.
- 매칭: second(매칭 분 내 확장)·minute·hour·month·year 집합 포함.
- dom/dow **? 배타**: dom.noSpecific → dow로만 매칭; dow.noSpecific → dom으로만 매칭. (둘 다 값이면 Quartz는 원래 금지지만, 관대 처리: dom AND dow 교집합 대신 dom OR dow? — Quartz 규격은 하나가 ? 필수. 파서가 "둘 다 지정" 시 에러.)
- L: 그 달 마지막 날(daysInMonth). `L-k`: 마지막-k. `<dow>L`: 그 달 그 요일의 마지막 발생.
- W: `dW` 그 달 d일에 가장 가까운 평일(같은 달 내). `LW` 마지막 평일.
- #: `dow#n` 그 달 dow의 n번째 발생.
- 불가능(예: `31W` 30일 달, `#6`) → 그 달 스킵.

## i18n 키 계약 (ko/en 분리 — 파이프 조인 금지)
네임스페이스 `tools.cron-parser`에 추가:
| key | ko | en |
|---|---|---|
| mode.label | 형식 | Format |
| mode.unix | Unix crontab | Unix crontab |
| mode.quartz | Quartz | Quartz |
| mode.unixHint | 5필드: 분 시 일 월 요일 | 5 fields: min hour dom mon dow |
| mode.quartzHint | 6~7필드: 초 분 시 일 월 요일 [년] | 6–7 fields: sec min hour dom mon dow [year] |
| fields.second | 초 | Second |
| fields.year | 년 | Year |
| quartzDescriptions.everySecond | 매초 | Every second |
| quartzDescriptions.everyNSeconds | {n}초마다 | Every {n} seconds |
| quartzDescriptions.lastDay | 그 달 마지막 날 | on the last day of the month |
| quartzDescriptions.lastOffset | 그 달 마지막에서 {n}일 전 | {n} day(s) before the end of the month |
| quartzDescriptions.lastWeekday | 그 달 마지막 평일 | on the last weekday of the month |
| quartzDescriptions.nearestWeekday | {n}일에 가장 가까운 평일 | on the weekday nearest the {n}th |
| quartzDescriptions.lastDow | 그 달 마지막 {day} | on the last {day} of the month |
| quartzDescriptions.nthDow | 그 달 {n}번째 {day} | on the {n}‑th {day} of the month |
| quartzErrors.needsQuestion | 일·요일 중 하나는 ?여야 합니다 | Day-of-month or day-of-week must be '?' |
| quartzErrors.bothSpecified | 일과 요일을 동시에 지정할 수 없습니다(하나는 ?) | Cannot specify both day-of-month and day-of-week (use '?') |
| quartzErrors.fieldCount | Quartz는 6~7개 필드가 필요합니다 | Quartz needs 6–7 fields |
| presets.quartz.* | (프리셋 라벨 ko/en) | |

## 프리셋 (Quartz)
매초 `* * * * * ?` · 30초마다 `0/30 * * * * ?` · 매분 `0 * * * * ?` · 평일 9시 `0 0 9 ? * MON-FRI` ·
매월 마지막날 자정 `0 0 0 L * ?` · 매월 3번째 금요일 `0 0 9 ? * 6#3` · 매월 15일 가까운 평일 `0 0 9 15W * ?`.

## 검증 게이트
- 도메인 ≥90% 커버리지, Quartz L/W/#/? 각 케이스 next-run 골든 테스트.
- 전체 유닛/tsc/SSG 빌드/E2E(Quartz 시나리오 추가)/라이브 시각(ko·en·320·콘솔0).
- Unix 경로 회귀 0(기존 테스트 전부 유지).
