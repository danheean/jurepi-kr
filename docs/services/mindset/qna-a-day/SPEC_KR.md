# Q&A a Day — 1일 1질문 (질문 일기) — 서비스 SPEC (한국어판)

> 이 문서는 [`SPEC.md`](SPEC.md)의 한국어 번역본입니다. 원본(영문)이 AI 코딩 에이전트가 소비하는 정본이며, 내용 변경 시 두 문서를 함께 갱신하세요.
>
> **Q&A a Day** (1일 1질문 / Daily Question Journal) — 1년 동안 하루에 하나의 질문에 답하는 자기성찰 도구의 빌드 사양입니다.
> 내부 서비스 코드네임: `qna-a-day`. 레지스트리 id: `qna-a-day`. 공개 URL 슬러그: `/[locale]/tools/qna-a-day`.
> 질문 콘텐츠 소스: 이 서비스 디렉토리의 제공 데이터셋 **`1mnc-questions.json`** (365개 항목, ko + en).
>
> 이 SPEC는 **도구 자체**에 집중합니다. 공통 쉘(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공합니다:
> - 플랫폼 SPEC: [`docs/SPEC_KR.md`](../../../SPEC_KR.md) (영문 정본: [`SPEC.md`](../../../SPEC.md))
> - 디자인 시스템(시각 기준, 단일 소스): [`docs/DESIGN.md`](../../../DESIGN.md)

```xml
<project_specification>

<project_name>Q&A a Day — 1일 1질문 / 질문 일기 (Jurepi 도구, 코드네임 qna-a-day, 레지스트리 id qna-a-day)</project_name>

<overview>
Q&A a Day는 1년짜리 자기성찰 도구입니다. 모든 날짜에는 엄선된, 열린 형식의 질문이 하나씩 고정 배정되어 있고, 사용자는 그 질문에 짧게 답을 적습니다. "오늘"은 오늘의 질문을 가장 크게 보여주고 작성 영역을 제공하며, 답변은 브라우저에 비공개로 저장됩니다. 질문은 날짜(월-일)에 고정되어 있으므로 매년 같은 날짜에 같은 질문이 돌아오고, 여러 해에 걸쳐 개인 기록이 쌓이며 "1년 전 오늘 나는 무엇을 썼는지"를 다시 읽을 수 있습니다. 고전적인 "하루 한 질문(Q&A a Day)" 일기를 무료·비공개·브라우저 전용 웹 도구로 재해석한 것입니다.

이 도구는 Jurepi 플랫폼 쉘 안에서 `/[locale]/tools/qna-a-day`에 마운트됩니다. 플랫폼의 헤더/푸터, 로케일(ko/en), 테마, 동의 게이팅된 광고 슬롯, DESIGN.md 토큰 시스템을 사용합니다. 본 SPEC는 도구만 명세합니다: 데이터 모델, 화면, 달력/질문 엔진, 인터랙션/애니메이션, 도구 전용 SEO 콘텐츠, 테스트.

CRITICAL (질문 소스): 365개 질문은 여기서 창작하지 않습니다 — 제공된 데이터셋 `1mnc-questions.json`에서 가져옵니다(365개 레코드: `date` "MM-DD", `month`, `day`, 한국어 `question`, 영어 `questionEn`, 01-01부터 12-31까지). 빌드는 이 파일을 도구의 코드 분할 뱅크 모듈로 복사/변환합니다. 이 데이터셋을 정본 콘텐츠로 취급하고, 질문을 다른 날짜로 재배정하거나 의역하지 마세요.

CRITICAL (클라이언트 전용): 100% 클라이언트 사이드. 백엔드 없음, DB 없음. 모든 답변은 단일·버전 관리·스키마 검증된 키 아래 `localStorage`로 브라우저에 저장됩니다. 유일한 1st-party 영속화는 `localStorage`이며, 사용자의 답을 어딘가로 전송하는 네트워크 호출은 절대 없습니다.

CRITICAL (SPA·사용성 우선): 플랫폼 원칙에 따라 모든 Jurepi 도구는 SSG 셸 위에 마운트되는 클라이언트 사이드 단일 페이지 애플리케이션(SPA)이다. 이 도구의 모든 화면 — 오늘 / 달력 / 모아보기 / 설정, 그리고 임의 날짜 열기/편집 — 은 라우트 이동이나 전체 페이지 리로드 없이 로컬 React 상태로 전환되며, 답을 적거나 둘러보는 어떤 동작도 서버 왕복을 일으키지 않는다. 사용성이 최우선이다: 오늘의 답은 한눈에 닿고, 도움말/사용법은 기본 접힘이며, 모든 상호작용은 즉각적이어야 한다. 라우트는 SEO/인덱싱을 위해 정적 생성(SSG)되고, 인터랙티브 도구 자체는 그 정적 셸 위의 단일 클라이언트 컴포넌트 아일랜드다.

CRITICAL (데이터 보존): `localStorage`가 유일한 저장소이고 쉽게 지워지므로(방문 기록 삭제, 시크릿 모드, 용량 초과로 인한 제거, 기기/브라우저 변경) 1년의 기록은 취약합니다. 따라서 JSON **내보내기(백업)와 가져오기(복원)**는 부가 기능이 아니라 **핵심·1급 기능**이며, 부드러운 주기적 백업 권유와 함께 제공됩니다. 사용자의 글을 잃는 것이 최악의 실패이므로, 설계는 이를 명시적으로 방어합니다.

CRITICAL (날짜 정확성): "오늘의 질문"은 사용자의 **로컬 벽시계 날짜**에서 도출되며, UTC가 아닙니다. 순진한 `Date.prototype.toISOString()`은 UTC 날짜를 반환해, UTC보다 앞/뒤인 사용자에게 자정 무렵 잘못된 날짜의 질문을 보여줍니다. 모든 날짜 키 도출은 로컬 날짜 구성요소를 사용합니다. 이는 사다리 도구가 공정성에 부여한 것과 동일한 엄격함으로 다룹니다.

CRITICAL (질문 안정성): 한 날짜의 질문 텍스트가 공개되면 그것은 안정적 계약입니다. 사용자는 "3월 15일의 질문"을 기준으로 다년 기록을 쌓으므로, 질문을 날짜에 몰래 재배정하거나 재정렬하면 "작년과 비교" 약속이 깨집니다. 문구 교정은 허용되지만, 어떤 질문이 어느 날짜에 속하는지를 바꾸는 것은 파괴적 변경입니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/qna-a-day (SSG; 레지스트리 slug "qna-a-day", id "qna-a-day", status "live", accent "grape", category "mindset")
  - 플랫폼이 제공(재구현 금지): 앱 쉘(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈을 감싸는 Error Boundary.
  - 소비(consume): i18n 네임스페이스 `tools.qna-a-day.*`(UI 문자열·how-to·FAQ — 365개 질문은 아님); 도구 하단의 in_content AdSlot; lib/seo.ts의 SEO 메타데이터 빌더.
  - 플랫폼 의존성(작은 레지스트리 변경, key_implementation_notes 참조): src/tools/types.ts의 `ToolCategory` 유니온에 `'mindset'` 추가, 로케일화된 카테고리 라벨, (DESIGN 매핑) `mindset → grape` 액센트. 레지스트리에 항목 1개 추가.
  - 페이지 쉘(breadcrumb + in_content 광고)은 플랫폼 도구 라우트가 렌더링하고, 이 모듈은 breadcrumb과 광고 사이의 모든 것을 렌더링합니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - CRITICAL 날짜 엔진: 순수·로컬타임 날짜 연산 — dateKey "YYYY-MM-DD", questionKey "MM-DD"(365키, 01-01..12-31; 02-29 없음 → 윤일은 02-28 질문 재사용), 윤년 처리, 인접일 탐색, 다년 동일날짜 그룹핑.
    - 제공된 `1mnc-questions.json`에서 로드하는 365개 질문 데이터셋(ko + en), 월-일 키 기반, 도구 페이지에서만 코드 분할·지연 로드(성능 노트 참조).
    - "오늘" 화면: 오늘 날짜 + 질문 + 자동저장 답변 작성기 + 글자 수 + 연속/진행 칩 + "1년 전 오늘" 지난 해 답변 + 어제/내일 인접일 미리보기.
    - "달력" 화면: 작성됨/미작성/오늘 상태가 표시된 월 그리드, 연도 스위처, 연간 스트립 히트맵; 날짜 탭 → 그날의 답 작성/편집.
    - "모아보기" 화면: 전체 답변의 검색 가능한 역연대순 목록, 연도 필터, 클릭하여 편집.
    - "설정" 화면: 데이터 내보내기(JSON 백업 다운로드), 가져오기(파일에서 복원/병합), 전체 초기화(이중 확인), 개인정보 안내, 선택적 백업 알림.
    - 연속·진행 통계(현재 연속, 최장 연속, 총 작성 수, 올해 완료율).
    - 도구 전용 SEO 롱폼("질문 일기란?" / "사용 방법") + FAQ(FAQPage JSON-LD).
    - 키보드 단축키; 모션 감소 대체; 완전한 접근성(aria-live 저장 상태, 포커스 관리).
  </in_scope>
  <out_of_scope>
    - 앱 쉘, 헤더/푸터, 로케일 스위처, 테마 토글 (플랫폼 담당).
    - 도구 레지스트리, sitemap/robots, 동의 배너, 광고 로딩 메커니즘 (플랫폼 담당).
    - 계정, 서버 영속화, 기기 간 동기화(백엔드 없음) — 기기 간 이전은 오직 수동 내보내기/가져오기로만.
    - 푸시 알림 / 예약 리마인더(출시 시 서비스 워커 스케줄링 없음; 인페이지 안내 문구만).
    - 비공개 답변의 소셜 공유, AI 생성 질문, 기분 추적 분석.
  </out_of_scope>
  <future_considerations>
    - 저장된 일기의 선택적 패스프레이즈 기반 클라이언트 측 암호화(Web Crypto) — Phase 2.
    - 선택적 Web Notification 일일 리마인더(권한 + 서비스 워커 필요) — Phase 2.
    - 서식 있는 PDF / 인쇄용 "연간 책자" 내보내기 — Phase 2.
    - 02-29 전용 366번째 질문 추가(현재는 02-28 재사용) — Phase 2 콘텐츠 추가.
    - 테마별 질문 팩(감사, 커리어, 관계) 날짜별 선택 — Phase 3.
    - 로컬 전문 검색 하이라이트 및 태그 — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <persistence>localStorage 전용, 단일 버전 관리 키 `jurepi-qna-a-day`가 `{ version, entries, meta }`를 JSON으로 보관. 마운트 시 1회 읽기, 변경 시 디바운스 쓰기.</persistence>
    <validation>저장된 블롭을 읽을 때와 가져온 파일을 신뢰 경계에서 검증하기 위해 zod v3.x 사용(기존 데이터를 파괴하지 않고 잘못된 데이터를 거부).</validation>
    <question_bank>365개 ko+en 질문은 제공된 `1mnc-questions.json`에서 가져옵니다(한 파일이 두 언어를 모두 보유: `question` = ko, `questionEn` = en, `date` "MM-DD" 키). 이를 코드 분할 데이터 모듈(src/components/tools/qna-a-day/data/questions.json)로 제공하고, 이 도구 페이지에서만 동적 임포트 — 전역 i18n 메시지 파일에는 넣지 않음(플랫폼 JS 예산 보호; 성능 노트 참조). ~75KB; 필요 시 빌드에서 로케일별 분할 가능.</question_bank>
    <ids>엔트리별 대체 id가 필요할 때만 nanoid v5.1; dateKey "YYYY-MM-DD"가 자연 기본키이므로 보통 id는 불필요.</ids>
    <animation>네이티브 CSS 트랜지션만(저장 펄스, 탭 크로스페이드, 달력 셀 채우기, 연속 증가 범프). 애니메이션 라이브러리 없음.</animation>
  </module_specific>
</technology_stack>

<file_structure>
src/
├── lib/qna-a-day/                     # 순수 도메인 계층 — React/Next 임포트 없음, 완전 단위 테스트
│   ├── date.ts                        # 로컬타임 날짜 연산: toDateKey, toQuestionKey, parseDateKey, addDays, isLeapYear, daysInMonth, neighbors
│   ├── questions.ts                   # questionKeyForDate(date) + resolveQuestionKey(02-29 → 02-28) + 뱅크 조회; 365키 커버리지 단언
│   ├── journal.ts                     # Entry/Store 타입 + 불변 연산: upsertEntry, getEntry, deleteEntry, entriesForMonthDay, listEntries, searchEntries
│   ├── stats.ts                       # currentStreak, longestStreak, totalAnswered, yearCompletion, monthCompletion, heatmap
│   ├── schema.ts                      # zod 스키마(Entry, Store) + STORE_VERSION + migrate()
│   └── serialization.ts               # serialize()(내보내기), deserialize()(검증된 가져오기), mergeStores()(충돌 = 더 최신 updatedAt)
├── components/tools/qna-a-day/
│   ├── DailyQuestion.tsx              # 오케스트레이터(Client Component) — 탭 상태 + useDailyJournal() 소유
│   ├── useDailyJournal.ts             # 훅: 순수 스토어를 localStorage 영속화 + 자동저장 + 액션으로 감쌈
│   ├── TodayPanel.tsx                 # 오늘 날짜 + 질문 + 작성기 + 연속 칩 + 인접일 미리보기
│   ├── AnswerComposer.tsx             # 텍스트영역 + 자동저장 표시 + 글자 카운터(Today & Calendar 공용)
│   ├── PastYears.tsx                  # "1년 전 오늘" — 이전 연도들의 동일 MM-DD 엔트리
│   ├── CalendarPanel.tsx             # 월 그리드 + 연도 스위치 + 연간 스트립 히트맵; 선택 날짜의 작성기 오픈
│   ├── JournalPanel.tsx               # 전체 엔트리의 검색 가능한 목록 + 연도 필터
│   ├── SettingsPanel.tsx              # 내보내기 / 가져오기 / 초기화 / 개인정보 / 백업 알림
│   ├── ProgressChip.tsx               # 연속 + 올해 완료 링
│   ├── QnaIntro.tsx                   # H1 + 리드(SEO; 가능하면 서버 렌더링)
│   ├── QnaHowTo.tsx                   # "1일 1질문이란?" / "사용 방법"(SEO 롱폼)
│   ├── QnaFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── data/
│       └── questions.json             # 이 서비스의 1mnc-questions.json에서 가져온 365개 항목: { date "MM-DD", month, day, question(ko), questionEn(en) }
└── i18n/messages/{ko,en}.json         # tools.qna-a-day.* UI 문자열(탭, 라벨, how-to, FAQ) — 365개 질문은 아님
</file_structure>

<core_data_entities>
  <question note="파생됨, 저장 안 함 — 텍스트는 questions.json 데이터셋에서">
    - key: string "MM-DD"(예: "03-15"); 총 365키, 01-01..12-31(02-29 없음)
    - month: number(1–12); day: number(1–31, 월에 유효)
    - question: string(ko) / questionEn: string(en) — questions.json[date]에서 조회; 조회 시 로케일화; 날짜별 안정적 계약
    INVARIANT — 커버리지: 데이터셋은 정확히 365개의 월-일 키(01-01..12-31, 02-29 제외)를 비어있지 않은 `question` AND `questionEn`으로 정의; 단위 테스트가 완전 커버리지·누락·중복 없음을 단언. 02-29(윤년)에는 조회가 02-28 질문으로 폴백하여 질문이 비는 일이 없음.
  </question>
  <entry note="한 실제 날짜에 대한 사용자의 답변">
    - date: string "YYYY-MM-DD" — 기본키(답이 속한 로컬 날짜)
    - questionKey: string "MM-DD" — `date`에서 파생; 편의를 위해 비정규화
    - text: string — 답변; 최대 4000자(3500자부터 소프트 카운터; 하드 캡 4000)
    - createdAt: number(epoch ms); updatedAt: number(epoch ms)
    INVARIANT — 키 일관성: questionKey === questionKeyFromDateKey(date); 공백만 있는 `text`는 "엔트리 없음" → 빈 채로 저장하지 않고 제거. 02-29 엔트리는 02-28 질문을 보여주더라도 자신의 dateKey(예: "2028-02-29")로 저장됨.
  </entry>
  <journal_store note="단일 localStorage 블롭">
    - version: number(STORE_VERSION, 1부터; migrate()가 구버전 블롭을 업그레이드)
    - entries: Record&lt;dateKey, Entry&gt;("YYYY-MM-DD" 키)
    - meta: { lastBackupAt?: number; reminderDismissedAt?: number; createdAt: number }
    localStorage 키: `jurepi-qna-a-day`
    INVARIANT — 검증된 경계: localStorage에서의 모든 읽기와 가져온 모든 파일은 zod Store 스키마로 파싱; 실패는 기존 정상 데이터를 절대 덮어쓰거나 삭제하지 않고 격리(error_handling 참조).
  </journal_store>
  <defaults>
    - 신규 사용자: 빈 entries, meta.createdAt = now, 작성 ≥7개 전까지 백업 알림 없음.
    - 기본 활성 탭: "오늘".
  </defaults>
</core_data_entities>

<component_hierarchy>
  <daily_question>            <!-- "use client"; 탭 상태 + useDailyJournal() 소유 -->
    <qna_intro />            <!-- H1 + 리드(가능하면 서버 렌더링) -->
    <progress_chip />        <!-- 현재 연속 + 올해 완료 링 -->
    <tab_bar />              <!-- 오늘 / 달력 / 모아보기 / 설정 -->
    <today_panel>            <!-- 탭: 오늘(기본) -->
      <answer_composer />    <!-- 텍스트영역 + 자동저장 표시 + 카운터 -->
      <past_years />         <!-- 동일 MM-DD의 "1년 전 오늘" -->
      <neighbor_peek />      <!-- 어제/내일 화살표 -->
    </today_panel>
    <calendar_panel>         <!-- 탭: 달력 -->
      <month_grid />         <!-- 작성됨/미작성/오늘 셀 -->
      <year_switch />
      <heatmap />            <!-- 연간 스트립 셀 -->
      <answer_composer />    <!-- 선택 날짜용으로 오픈 -->
    </calendar_panel>
    <journal_panel>          <!-- 탭: 모아보기 — 검색 목록 -->
    </journal_panel>
    <settings_panel>         <!-- 탭: 설정 — 내보내기/가져오기/초기화/개인정보 -->
    </settings_panel>
    <qna_how_to />           <!-- SEO 롱폼 -->
    <qna_faq />              <!-- FAQPage JSON-LD -->
  </daily_question>
  <note>도구 내 SPA: 화면은 라우트 이동이 아니라 로컬 탭 상태로 전환(플랫폼 UX 원칙: 도구는 SPA; 쉽고 마찰 없는 UX). 도움말/사용법은 기본 접힘이며 필요 시 펼침.</note>
</component_hierarchy>

<pages_and_interfaces>
  <qna_intro>
    - H1: "1일 1질문" / "One Question a Day" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text)
    - 리드: 1–2문장, body-lg 18px var(--text-secondary): 비공개·1년짜리 성찰 의식이며, 답변은 이 브라우저에 머문다는 안내.
    - H1 위 눈썹문구: "매일의 기록" / "DAILY REFLECTION" — eyebrow 12px/700/0.6px, var(--brand)
  </qna_intro>

  <progress_chip>
    - 인트로 아래 콤팩트 행: 원형 완료 링(올해 작성/경과일) + "🔥 N일 연속" 현재 연속 알약 + "총 N개" 합계.
    - 링 stroke = grape var(--accent-grape); 트랙 = var(--surface-sunken). 연속 알약 = grape-soft 배경, var(--text). 숫자는 headline 굵기.
    - aria: 링은 role="img" aria-label "올해 {answered}/{elapsed}일 기록".
  </progress_chip>

  <tab_bar>
    - 4개 알약: "오늘" / "달력" / "모아보기" / "설정"(en: Today / Calendar / Journal / Settings). category-pill 스타일; 활성 = 브랜드 허니골드, 비활성 = surface-muted. role="tablist"; 화살표 키 탐색; aria-selected.
  </tab_bar>

  <today_panel tab="today">
    - 카드: var(--surface), radius var(--radius-xxl) 28px, padding 24px, shadow --shadow-card.
    - 날짜 헤더: 요일 + 전체 로컬 날짜(예: "2026년 6월 30일 화요일"), headline 굵기; 작은 "오늘" 배지(grape-soft).
    - 질문: 크게 표시 — body-lg→headline 스케일, var(--text), 인용 스타일(선두 액센트 바 3px var(--accent-grape), 좌측 패딩 16px). 질문은 하나만.
    - <answer_composer>: 아래 참조. placeholder "오늘의 답을 적어보세요…". 자동저장.
    - <neighbor_peek>: ‹ 어제 / 내일 › 화살표로 오늘을 떠나지 않고 인접 날짜의 질문+답을 봄(패널이 해당 날짜로 갱신; "오늘로" 칩으로 복귀). 미래 날짜는 볼 수 있으나 은은한 "미래" 힌트 표시; 미래 날짜에도 작성 가능(미리 쓰기)하되 약하게 강조.
    - <past_years>: 이전 연도에 동일 MM-DD 엔트리가 있으면 아래에 카드로 누적 표시: "1년 전 오늘 · 2025" + 답변 발췌, 최신순. 없으면 비표시. 다년 보상의 시그니처.
  </today_panel>

  <answer_composer>
    - 자동 확장 &lt;textarea&gt;, min-height 140px, body 16px line-height 1.6, radius var(--radius-lg), 1px var(--hairline), 포커스 → border var(--brand) + 3px var(--brand-soft) 링.
    - 자동저장: 입력 멈춤 후 700ms 디바운스 AND blur 시; useDailyJournal로 쓰기. 저장 상태 줄(aria-live="polite"): "저장 중…" → "저장됨 · 방금"과 짧은 grape 체크 펄스(reduced-motion: 펄스 없이 텍스트만).
    - 글자 카운터 우하단: "1234 / 4000"; 3500부터 var(--semantic-warning); 4000에서 입력 하드 정지.
    - 전체 삭제 시 엔트리 제거(인라인 "삭제됨 · 되돌리기" 5초 undo 토스트).
    - 키보드: Cmd/Ctrl+S → 즉시 저장 + 토스트 "저장됨".
  </answer_composer>

  <calendar_panel tab="calendar">
    - 연도 스위치 행: ‹ {연도} › 기본 현재 연도; 현재 연도 + 합리적 상한 초과 불가; 해당 연도 작성 수 표시.
    - 월 그리드: 12개 소형 월 블록 또는 단일 대형 현재 월 그리드 + 월 페이징(기본: 단일 월, 페이징). 각 날짜 셀 40–44px: 작성됨 = grape 채움/틴트, 미작성-과거 = 옅은 외곽선, 오늘 = 브랜드 링, 미래 = muted. 셀 탭 → 그 날짜용 작성기(동일 AnswerComposer + 그 날짜의 질문)를 인라인 시트/섹션으로 오픈.
    - 히트맵: 연간 스트립(GitHub 스타일), 365셀(윤년 366셀), 작성(이진)에 따른 grape 농도 + 선택적 길이 단계; 호버/포커스 시 날짜 + 질문 + 발췌 툴팁. reduced-motion 안전(셔머 없음).
    - 셀은 aria-label "{날짜}, {작성됨?'기록 있음':'기록 없음'}"인 버튼.
  </calendar_panel>

  <journal_panel tab="journal">
    - 검색 입력(200ms 디바운스) — 답변 텍스트 + 질문 텍스트 대상; 연도 필터 알약(전체 / 2026 / 2025 …).
    - 역연대순 목록: 각 행 = 날짜 + 질문(1줄, 말줄임) + 답변 발췌(2줄, 말줄임) + 편집 어포던스. 클릭 → 그 날짜 작성기 오픈.
    - 빈 상태: 엔트리 없음("첫 기록을 남겨보세요"), 검색 결과 없음("검색 결과가 없어요" + 초기화 버튼).
  </journal_panel>

  <settings_panel tab="settings">
    - 백업(내보내기): "기록 내보내기" 주요 버튼 → `jurepi-qna-a-day-backup-YYYY-MM-DD.json`(검증된 Store 블롭) 다운로드. meta.lastBackupAt 설정; "마지막 백업: …" 표시.
    - 복원(가져오기): "기록 가져오기" → 파일 선택(.json, 용량 캡 5MB). 파싱 + zod 검증. 유효하면 diff 요약("가져올 기록 N개, 겹치는 날짜 M개")과 선택: "병합(merge)"(충돌 → 더 최신 updatedAt 유지) 또는 "덮어쓰기(replace)". 적용 전 확인. 잘못된 파일 → 친근한 오류, 기존 데이터 무변경.
    - 초기화: "모든 기록 삭제" 위험 버튼 → 입력/홀드를 요구하는 이중 확인 모달; 되돌릴 수 없음을 경고하고 먼저 내보내기를 권유.
    - 개인정보 안내: 짧고 안심되는 카피 — 답변은 이 브라우저에만 저장되고 절대 업로드되지 않음; 브라우저 데이터 삭제나 기기 변경 시 내보내지 않았다면 손실.
    - 백업 알림: lastBackupAt로부터 ≥14일 AND 엔트리 ≥7개일 때, 오늘 상단에 닫을 수 있는 인라인 권유 표시.
  </settings_panel>

  <onboarding>
    - 최초 방문(빈 스토어): 오늘 위에 의식을 설명하는 일회성 인트로 카드 + 작성기로 포커스하는 "시작하기". 닫힘 플래그는 meta에 저장.
  </onboarding>

  <qna_how_to>
    - SEO 롱폼(로케일별): "1일 1질문이란?", "어떻게 사용하나요?", "왜 매일 한 가지 질문에 답할까요?" — 600–900자; 비공개/로컬 저장, 다년 비교, 습관의 이점을 강조.
  </qna_how_to>
  <qna_faq>
    - 5–7개 Q&A; 렌더링 + FAQPage JSON-LD로 방출. 반드시 포함: "내 답변은 어디에 저장되나요?"(브라우저 localStorage 전용, 업로드 안 됨 → 정기 백업); "기기를 바꾸면 기록이 옮겨지나요?"(내보내기/가져오기로만); "작년에 쓴 답을 볼 수 있나요?"(네 — 같은 날짜면 지난 해 표시); "질문을 건너뛰어도 되나요?"(네, 언제든 다시); "2월 29일에는 어떤 질문이 나오나요?"(데이터셋은 365일이며 윤일 02-29에는 02-28 질문 표시); "기록이 사라질 수 있나요?"(브라우저 데이터 삭제 시 → 안전하게 내보내기).
  </qna_faq>

  <keyboard_shortcuts_reference>
    - 도구 내 전역: "1/2/3/4" → 탭 전환(오늘/달력/모아보기/설정); "t" → 오늘로 점프.
    - 작성기: Cmd/Ctrl+S → 즉시 저장; Esc → 작성기 blur / 달력 날짜 시트 닫기.
    - 달력: 화살표 키로 포커스된 날짜 이동; Enter로 오픈; PageUp/PageDown로 월 변경.
    - 터치에서는 비활성(물리 키보드 없음).
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <date_engine>
    - toDateKey(d: Date): "YYYY-MM-DD" — 로컬 연/월/일(0패딩) 사용, toISOString() 금지.
    - toQuestionKey(d: Date | dateKey): "MM-DD".
    - parseDateKey("YYYY-MM-DD"): 로컬 자정 Date.
    - addDays / neighbors(dateKey): 이전/다음 dateKey, DST 안전(원시 ms 아닌 날짜 구성요소 연산).
    - isLeapYear(y), daysInMonth(y, m). today(): 테스트용 주입 가능한 Date 제공자(순수 코드 깊은 곳에서 직접 `new Date()` 금지 — `now` 전달).
  </date_engine>
  <question_lookup>
    - questionKeyForDate(date) → "MM-DD"; resolveQuestionKey(mmdd)는 "02-29" → "02-28", 그 외 항등; bank[resolveQuestionKey(key)] → { question, questionEn }; 로케일로 선택. 순수 계층은 데이터셋이 365키 전부를 커버함을 단언.
  </question_lookup>
  <journal_ops note="모두 불변 — 새 Store 반환, 절대 변경 금지">
    - upsertEntry(store, dateKey, text, now): text 트림; 비면 deleteEntry; 아니면 Entry 작성(createdAt 보존, updatedAt 갱신).
    - entriesForMonthDay(store, "MM-DD", excludeYear?): 연도 내림차순 정렬 Entry[] — "1년 전 오늘" 구동.
    - listEntries(store): 날짜 내림차순 정렬 Entry[].
    - searchEntries(store, query, bank): 답변 + 질문 텍스트 대상 대소문자/발음구별 무시 부분 문자열.
  </journal_ops>
  <stats>
    - currentStreak(store, today): `today`에서 끝나는 연속 작성일의 길이, 또는 오늘이 아직 미작성이면 어제에서 끝나는 길이(현재 날짜에 대한 유예); 오늘도 어제도 미작성이면 0.
    - longestStreak(store): 어디서든 가장 긴 연속 작성 구간.
    - totalAnswered(store); yearCompletion(store, year, today) = 연내 작성 / 연내 경과일(과거 연도면 전체 연도); monthCompletion 동일.
    - heatmap(store, year): 연간 스트립용 날짜별 작성 플래그(+ 선택적 길이 단계).
  </stats>
  <persistence_adapter useDailyJournal>
    - 마운트 시: `jurepi-qna-a-day` 읽기 → zod 파싱 → migrate() → 상태; 실패 시 격리 + 새로 시작(error_handling 참조).
    - 변경 시: 디바운스(700ms) JSON.stringify → localStorage.setItem; 용량/보안 오류 캐치 → 인메모리 폴백 + 지속 경고.
    - 노출: 오늘의 questionKey+text(로케일 데이터셋), 오늘의 엔트리, upsert/delete, stats, export(), import(file, strategy), reset().
  </persistence_adapter>
  <i18n>모든 UI 문자열은 tools.qna-a-day.*(ko/en)에서. 365개 질문은 코드 분할 questions.json 데이터셋(ko `question` + en `questionEn`)에서 동적 임포트. 하드코딩 카피 없음.</i18n>
</core_functionality>

<error_handling>
  <form_validation>
    - 답변 하드 캡 4000자(입력 정지); 3500부터 소프트 경고색.
    - 공백만 있는 답변은 빈 것으로 처리(엔트리 제거) — 사용자를 절대 막지 않음.
  </form_validation>
  <runtime>
    <localstorage_unavailable>시크릿 모드 / 저장소 비활성 → 읽기/쓰기 throw → 세션 동안 인메모리 스토어로 폴백 AND 확인 전까지 닫히지 않는 지속 경고: "이 브라우저에서는 기록이 저장되지 않아요 — 내보내기로 백업하세요." 현재 입력은 세션 중 절대 유실 안 됨.</localstorage_unavailable>
    <quota_exceeded>setItem이 QuotaExceededError throw → 인메모리 상태 유지, 토스트: "저장 공간이 가득 찼어요. 오래된 기록을 내보내고 정리해 주세요." 사용자의 최신 텍스트를 버리지 않음.</quota_exceeded>
    <corrupt_blob>읽기 시 JSON 파싱이나 zod 검증 실패 → 삭제 금지. 원시 문자열을 격리 키 `jurepi-qna-a-day-corrupt-{ts}`에 복사하고 "손상된 데이터 내려받기" 원클릭 다운로드 제공 후 새 스토어 시작. 절대 조용히 지우지 않음.</corrupt_blob>
    <import_invalid>가져온 파일이 zod 실패 또는 용량 캡 초과 → 친근한 오류 모달, 기존 데이터 무변경, 부분 적용 없음.</import_invalid>
    <error_boundary>플랫폼이 도구를 Error Boundary로 감쌈; 렌더 실패 시 쉘을 크래시하지 않고 재시도 표시.</error_boundary>
  </runtime>
  <note>이 모듈에는 1st-party 네트워크 요청이 없음; API 오류 표면 없음.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md가 모든 토큰의 단일 소스. 아래는 도구 전용 적용 사항.</source>
  <accent_usage>
    - 카테고리 액센트는 GRAPE(var(--accent-grape) #e0912b / var(--accent-grape-soft) #fbe8cb) — 따뜻한 허니골드(토큰명은 `grape` 유지). 브랜드와 같은 웜 계열이며, 정체성과 액션의 구분은 색상이 아니라 역할로 한다.
    - grape는 정체성 표시: 질문의 선두 바, 완료 링, 연속 알약, 작성된 달력 셀, 히트맵 농도 — 항상 액센트 틴트/텍스트-잉크(var(--accent-grape-ink))로, CTA 채움으로는 쓰지 않음.
    - CTA(내보내기, "시작하기", 주요 저장)는 브랜드 허니골드 var(--brand) 채움+var(--on-brand) 텍스트(링크는 var(--brand-ink)) 유지. 액센트는 정체성이며 결코 액션 색이 아님(DESIGN do/don't).
  </accent_usage>
  <surfaces>질문 카드 radius var(--radius-xxl) 28px; 작성기 radius var(--radius-lg); 지난 해 카드는 var(--surface-muted) 위 var(--radius-lg). 부드러운 브랜드 틴트 그림자(--shadow-card), 엘리베이션으로서의 하드 보더 금지.</surfaces>
  <typography>H1 Gmarket Sans; 질문 자체가 편집 초점(크고 넉넉한 행간, 인용 바) — 스케일 대비로 위계. 본문/답변은 Pretendard 16px/1.6. 날짜/라벨은 caption/body-sm.</typography>
  <motion>transform / opacity만: 탭 크로스페이드 150ms, 저장 체크 펄스(scale 1→1.2→1, 200ms), 달력 셀 채우기 150ms, 연속 증가 시 범프. --ease-out cubic-bezier(0.16,1,0.3,1). 모두 prefers-reduced-motion으로 게이팅(펄스/범프 없음; 즉시 채우기).</motion>
  <accessibility>aria-live 저장 상태; tablist/tab 역할 + 화살표 키; 달력 셀은 라벨된 버튼; ≥44px 주요 탭 타깃(여백 포함 달력 셀 ≥40px); 가시적 focus-visible 링 var(--focus-ring); grape-on-white 텍스트의 WCAG 2.1 AA 대비(본문은 grape-on-white 대신 grape-soft 위 var(--text) 사용).</accessibility>
  <responsive>모바일은 작성기 우선 단일 컬럼; 오늘 카드 전체 폭; 달력 월 그리드 셀 ≥40px 유지(필요 시 스크롤); 탭 바는 좁은 화면에서 스냅 가로 스크롤. 브레이크포인트는 DESIGN(480/768/1024) 준수.</responsive>
  <atmosphere>조용하고 따뜻한 일기 느낌 — 넉넉한 여백, 하나의 질문이 스포트라이트, 저채도 크롬. 대시보드식 밀도 회피; 통계는 작은 칩이지 히어로가 아님.</atmosphere>
</aesthetic_guidelines>

<security_considerations>
  <input>답변과 질문은 텍스트 노드로 렌더(React 이스케이프); 이 모듈 어디에서도 dangerouslySetInnerHTML 절대 금지.</input>
  <import_validation>CRITICAL: 가져온 JSON은 엄격한 zod Store 스키마로 파싱(version 알려짐, dateKey 정규식 `^\d{4}-\d{2}-\d{2}$`, text 길이 ≤4000, 숫자 타임스탬프, 배열/객체 형태), 5MB 용량 캡과 `.json`/application-json 타입 체크 뒤에서. 실패하는 모든 것은 통째로 거부 — 부분 적용 절대 없음, 기존 데이터에 파괴적이지 않음.</import_validation>
  <privacy>사용자의 답변은 비공개 개인 글. localStorage에만 저장되고 절대 전송되지 않음. 어떤 분석 이벤트도 답변/질문 텍스트를 포함하지 않음(있다면 tab_open 같은 거친 카운터만). UI와 FAQ에 명확히 고지.</privacy>
  <note>비밀값 없음, 네트워크 호출 없음, 서드파티 저장소 없음. 내보내기는 사용자가 통제하는 로컬 파일을 생성.</note>
</security_considerations>

<advanced_functionality>
  <multi_year_reflection>시그니처 기능: MM-DD 질문 키잉으로 매년 같은 날짜에 같은 질문이 돌아오므로, PastYears가 내장 "과거 vs 지금"으로 이전 연도 답변을 노출 — 추가 저장 없이 키 설계에서 자연 발생.</multi_year_reflection>
  <backup_restore optional="false">내보내기/가져오기는 핵심(설정 참조). 병합 전략은 더 최신 updatedAt으로 충돌 해결; 덮어쓰기는 확인과 함께 명시적 제공.</backup_restore>
  <heatmap>일기 습관의 연간 스트립 시각화; grape 농도; 키보드/호버 툴팁; reduced-motion 안전.</heatmap>
  <reduced_motion>탭 전환, 저장 펄스, 연속 범프, 달력 채우기에 적용.</reduced_motion>
  <future_encryption optional="true">Phase 2: 저장 블롭의 선택적 패스프레이즈 파생(Web Crypto, PBKDF2 + AES-GCM) 저장 시 암호화와 잠금 해제 게이트 — 공용 기기 보호를 위해 백엔드 없는 모델 유지.</future_encryption>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>오늘 답하고 새로고침 후에도 유지</description>
    <steps>
      1. 빈 저장소로 /ko/tools/qna-a-day 방문 → 온보딩 카드 + 오늘 탭 활성; 오늘 날짜 + 단일 질문(오늘 MM-DD의 questions.json) 표시.
      2. 답을 입력 → 약 700ms 후 상태가 "저장됨"; 글자 카운터 갱신.
      3. 페이지 새로고침 → 오늘에 동일 답 존재; 온보딩 더 이상 표시 안 됨.
      4. Cmd/Ctrl+S → 즉시 "저장됨" 토스트.
      5. 답을 전부 지움 → 엔트리 제거; "삭제됨 · 되돌리기" undo 표시; undo로 복원.
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>달력 탐색, 과거 날짜, 다년 성찰</description>
    <steps>
      1. 달력으로 전환 → 현재 월 그리드; 오늘은 브랜드 링; 날짜들은 미작성 외곽선.
      2. 과거 날짜 탭 → 질문 + 작성기 오픈; 답 작성 → 셀이 grape로 채워짐.
      3. 동일 월-일의 이전 연도 엔트리를 수동 시드(예: 작년) → 그 월-일의 오늘로 돌아감 → PastYears가 이전 연도 답 "1년 전 오늘" 표시.
      4. 히트맵이 작성일 반영; 셀 호버 시 날짜 + 질문 발췌 표시.
      5. 과거 연도로 연도 스위치 시 그 연도의 작성 밀도 표시.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>백업 / 복원 라운드트립 + 보존성</description>
    <steps>
      1. 엔트리 여러 개 상태에서 설정 → 기록 내보내기 → JSON 파일 다운로드; "마지막 백업" 갱신.
      2. 전체 초기화(이중 확인) → 스토어 비움.
      3. 기록 가져오기 → 내보낸 파일 선택 → diff 요약 N개 표시 → 덮어쓰기 → 모든 엔트리 정확 복원(텍스트, 날짜, 타임스탬프).
      4. 잘못된 JSON 가져오기 → 친근한 오류; 기존 데이터 무변경.
      5. 겹치는 날짜로 병합 가져오기 → 충돌이 더 최신 updatedAt으로 해결.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>i18n, 윤일, 로컬타임 정확성</description>
    <steps>
      1. /en으로 전환 → 모든 UI 문자열 + 그날 질문이 영어로 렌더; 동일 날짜 질문이 questions.json[`MM-DD`].questionEn과 일치.
      2. 달력에서 윤년의 2월 29일로 이동 → 02-28 질문 표시(데이터셋에 02-29 없음), 은은한 윤일 안내; 2월 29일은 윤년에만 선택 가능.
      3. OS 시간대를 UTC보다 뒤로 설정한 채 로컬 자정 무렵 → "오늘" 질문이 로컬 달력 날짜(UTC 아님)와 일치 — 날짜 엔진 단위 테스트 + 모킹된 시계 E2E로 검증.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>SEO + 저장 실패 복원력</description>
    <steps>
      1. 프로덕션 빌드 → /ko/tools/qna-a-day, /en/tools/qna-a-day가 고유 title, meta description, canonical, hreflang, OG, SoftwareApplication + FAQPage JSON-LD로 정적 생성; how-to + FAQ 로케일화.
      2. localStorage 비활성(시크릿 모드) 시뮬레이션 → 지속 경고 표시; 세션 중 입력은 여전히 동작; 내보내기는 여전히 파일 생성.
      3. 저장 블롭 손상 → 로드 시 격리(손상 키로 복사 + 다운로드 제공), 새 스토어 시작, 조용히 지워지는 것 없음.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <date_correctness>CRITICAL: 모든 날짜 키가 로컬 구성요소에서 도출; 단위 테스트가 UTC보다 앞/뒤 시간대, DST 전환, 연도 경계, 윤년을 커버 — "오늘"은 항상 사용자의 벽시계 날짜와 동일.</date_correctness>
  <durability>CRITICAL: 어떤 코드 경로도 사용자 엔트리를 조용히 파괴하지 않음; 손상/초과/무효 데이터는 데이터 손실 없이 격리 또는 거부; 내보내기/가져오기가 엔트리를 충실히 라운드트립(텍스트, dateKey, 타임스탬프).</durability>
  <question_integrity>CRITICAL: 데이터셋이 정확히 365개 월-일 키(01-01..12-31, 02-29 없음)를 비어있지 않은 `question` AND `questionEn`으로 커버; 02-29는 02-28로 해석; 같은 날짜가 연도·빌드 간 같은 질문에 매핑; 단위 테스트가 커버리지·고유성·ko/en 필드 존재를 단언.</question_integrity>
  <functionality>오늘 자동저장(디바운스 + blur + Cmd/Ctrl+S); 달력에서 임의 날짜 탐색/편집; 다년 PastYears; 검색 가능한 모아보기; 연속/완료 통계; 병합/덮어쓰기 내보내기/가져오기; 이중 확인 초기화.</functionality>
  <user_experience>작성기가 즉각적(키 입력 지연 &lt; 50ms); 저장 상태가 명확하고 거슬리지 않음; 하나의 질문이 스포트라이트; ≥44px 주요 타깃; 가시적 포커스; 라우트 리로드 없는 SPA 탭 전환.</user_experience>
  <technical_quality>lib/qna-a-day/* 순수 함수 단위 커버리지 ≥80%(날짜 연산, 연속 엣지 케이스, 불변 연산, serialize/merge, zod 거부); TS 에러 0; 800줄 초과 파일 없음; 365 질문 데이터셋이 코드 분할되어 전역 i18n 번들을 부풀리지 않음.</technical_quality>
  <visual_design>DESIGN.md 준수; grape 액센트가 정체성(질문 바, 링, 연속, 달력 채우기)에 사용; 브랜드 허니골드은 CTA 전용; 따뜻하고 저채도인 일기 분위기 — 대시보드 아님.</visual_design>
  <accessibility>완전한 키보드 조작; aria-live 저장 상태; 라벨된 달력 버튼; reduced-motion 존중; WCAG 2.1 AA 대비.</accessibility>
  <performance>도구 라우트가 플랫폼 예산 내 유지; 질문 데이터셋 동적 임포트(전역 i18n 번들에 미포함); 오늘 빠르게 인터랙티브; CLS 무영향(광고 높이는 플랫폼이 예약).</performance>
</success_criteria>

<build_output>
  <note>플랫폼의 일부로 빌드(pnpm build). /[locale]/tools/qna-a-day는 플랫폼의 generateStaticParams가 레지스트리(status "live")를 순회해 사전 렌더링. 질문 데이터셋은 이 라우트에서만 로드되는 코드 분할 청크로 전달.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/types.ts — 카테고리 유니온 확장
    export type ToolCategory = 'random' | 'calculator' | 'text' | 'converter' | 'fun' | 'dev' | 'mindset';

    // src/tools/registry.ts — 항목 추가
    {
      id: 'qna-a-day',
      slug: 'qna-a-day',
      category: 'mindset',
      icon: 'NotebookPen',     // lucide-react
      accent: 'grape',
      status: 'live',          // 모듈 빌드 전까지 'coming_soon'
      isNew: true,
      order: 8,
      keywords: ['1일1질문', '하루한질문', '365질문', '질문일기', '자기성찰', '일기', '저널', 'q&a a day', 'daily question', 'journal', 'self reflection', 'one question a day'],
    },
    ```
    또한 로케일화된 카테고리 라벨 추가(messages.categories.mindset = "마음·기록" / "Mindset"), DESIGN에 따라 mindset의 정체성 액센트를 grape로 취급.
  </platform_registry_change>
  <critical_paths>
    1. lib/qna-a-day/date.ts — 로컬타임 날짜 키 먼저; UI 전에 정확성 증명(시간대/DST/윤년). 모든 것이 의존.
    2. 보존성 경로 — schema.ts + serialization.ts + useDailyJournal 읽기/격리/폴백 로직; 내보내기/가져오기 라운드트립.
    3. 질문 데이터셋 배선 — 1mnc-questions.json(365개 항목)을 questions.json으로 임포트; 커버리지 + 02-29→02-28 폴백 테스트.
    4. 작성기 자동저장 정확성 — 디바운스 + blur + 빈값 제거 + undo, 키 입력 누락 없이.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/qna-a-day/date.ts + schema.ts + journal.ts + stats.ts + serialization.ts를 Vitest로(RED→GREEN): 로컬타임 키, 윤년(02-29→02-28), 연속 엣지, 불변 upsert, serialize/deserialize/merge, zod 거부. `now`/RNG-free 결정성 주입.
    2. 제공된 1mnc-questions.json(365개 항목, ko `question` + en `questionEn`)을 data/questions.json으로 배선 + 커버리지/필드 존재 테스트.
    3. tools.qna-a-day.* 메시지(ko/en): 탭, 라벨, 작성기, 설정, how-to, FAQ.
    4. useDailyJournal 훅(localStorage 읽기/격리/폴백 + 디바운스 쓰기 + 액션 + 데이터셋 동적 임포트).
    5. TodayPanel + AnswerComposer + PastYears + ProgressChip + 온보딩.
    6. CalendarPanel(월 그리드 + 연도 스위치 + 히트맵), AnswerComposer 재사용.
    7. JournalPanel(검색 + 연도 필터) + SettingsPanel(내보내기/가져오기/초기화/개인정보/알림).
    8. 키보드 단축키; reduced-motion; a11y 패스(axe, aria-live, 포커스).
    9. QnaIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD(플랫폼 lib/seo.ts 사용).
    10. 레지스트리 status → live; 플랫폼 카테고리 'mindset' 배선; E2E 시나리오 1–5.
  </recommended_implementation_order>
  <date_engine_sketch>
    ```typescript
    // src/lib/qna-a-day/date.ts — 로컬타임, 결정적, 숨은 new Date() 금지.
    export type DateKey = string;     // "YYYY-MM-DD"
    export type QuestionKey = string; // "MM-DD"

    const pad = (n: number) => String(n).padStart(2, '0');

    // CRITICAL: 로컬 구성요소, toISOString() 아님(UTC라 날짜가 밀림).
    export function toDateKey(d: Date): DateKey {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    export function toQuestionKey(d: Date): QuestionKey {
      return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // "MM-DD" (1mnc-questions.json과 일치)
    }
    export function questionKeyFromDateKey(k: DateKey): QuestionKey {
      return k.slice(5); // "MM-DD"
    }
    // 데이터셋은 365일(02-29 없음); 윤일은 02-28 질문 재사용.
    export function resolveQuestionKey(mmdd: QuestionKey): QuestionKey {
      return mmdd === '02-29' ? '02-28' : mmdd;
    }
    export function parseDateKey(k: DateKey): Date {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d); // 로컬 자정
    }
    export function addDays(k: DateKey, delta: number): DateKey {
      const d = parseDateKey(k);
      d.setDate(d.getDate() + delta); // 날짜 구성요소로 DST 안전
      return toDateKey(d);
    }
    export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    ```
  </date_engine_sketch>
  <streak_sketch>
    ```typescript
    // src/lib/qna-a-day/stats.ts — "오늘 아직 안 함"에 유예 1일을 둔 현재 연속.
    export function currentStreak(entries: Record<DateKey, unknown>, today: DateKey): number {
      let cursor = today;
      if (!(today in entries)) {
        const yesterday = addDays(today, -1);
        if (!(yesterday in entries)) return 0; // 오늘도 어제도 없음 → 끊김
        cursor = yesterday;
      }
      let n = 0;
      while (cursor in entries) { n++; cursor = addDays(cursor, -1); }
      return n;
    }
    ```
  </streak_sketch>
  <question_dataset>
    - 정본: 이 서비스 디렉토리의 제공 파일 `1mnc-questions.json` — 365개 레코드, 달력일 01-01..12-31당 1개(02-29 없음).
    - 레코드 형태: `{ "date": "MM-DD", "month": number, "day": number, "question": "<ko>", "questionEn": "<en>" }`. 최상위: `{ "generated": "<date>", "total": 365, "questions": [...] }`.
    - 로더는 ko에 `question`, en에 `questionEn`을 선택; 02-29는 02-28로 해석.
    - 출시 후 안정적 계약: 문구는 자유롭게 교정하되 질문을 다른 날짜로 옮기지 말 것("작년과 비교"가 깨짐).
    - 데이터셋에서 발췌한 샘플(날짜 · ko · en):
      - 01-01 · "내 삶의 목적은 무엇인가?" · "What is your purpose in life?"
      - 02-14 · "지금 사랑하고 있는가?" · "Are you in love right now?"
      - 02-28 · "마지막으로 아팠던 적은 언제인가?" · "When was the last time you were sick?"  (02-29에도 사용)
      - 03-15 · "아무에게도 하고 싶지 않은 이야기가 있는가?" · "What do you not want to talk about?"
      - 06-30 · "딱 하루만 원하는 직업으로 살 수 있다면 무엇을 선택하겠는가?" · "If you could do any job in the world for one day, what would you choose?"
      - 08-15 · "오늘 내 몸 중에서 가장 마음에 드는 곳은?" · "What do you like best about your body today?"
      - 12-25 · "크리스마스로 오행시를 지어보자" · "Make a five line poem using the letters in the word CHRISTMAS"
      - 12-31 · "올 한해 수고한 내 자신에게 하고 싶은 말은?" · "What would you like to tell yourself, as someone gave it their best this year?"
  </question_dataset>
  <store_schema_sketch>
    ```typescript
    // src/lib/qna-a-day/schema.ts
    import { z } from 'zod';
    export const STORE_VERSION = 1;
    export const EntrySchema = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      questionKey: z.string().regex(/^\d{2}-\d{2}$/),
      text: z.string().max(4000),
      createdAt: z.number().int().nonnegative(),
      updatedAt: z.number().int().nonnegative(),
    });
    export const StoreSchema = z.object({
      version: z.number().int(),
      entries: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), EntrySchema),
      meta: z.object({
        createdAt: z.number().int().nonnegative(),
        lastBackupAt: z.number().int().nonnegative().optional(),
        reminderDismissedAt: z.number().int().nonnegative().optional(),
      }),
    });
    export type Store = z.infer<typeof StoreSchema>;
    ```
  </store_schema_sketch>
  <performance>365 질문 데이터셋은 도구 라우트에서만 동적 임포트되어, 사이트 전역으로 실리는 전역 i18n 메시지 번들에 절대 들어가지 않음. 인트로/how-to/FAQ는 가능하면 서버 렌더링; 작성기 + 달력만 클라이언트 인터랙티브 표면으로 유지. 쓰기를 디바운스해 localStorage 스래시 방지.</performance>
  <testing_strategy>
    - 단위(Vitest, lib/qna-a-day ≥80%): 날짜 로컬타임 정확성(시간대 오프셋 + DST 모킹), 윤년(02-29 → 02-28 폴백), 연도 경계 인접일; 연속(오늘-미완 유예, 공백, 단일일, 최장); 완료 연산; 불변 upsert/delete + 빈값 제거; serialize/deserialize 라운드트립; mergeStores updatedAt 충돌; zod 무효 가져오기 거부; 데이터셋 365 커버리지 + ko/en 필드 존재.
    - 컴포넌트: AnswerComposer 자동저장/디바운스/blur/빈값-undo + 글자 캡; 달력 작성/오늘/미래 상태; 탭 전환; 빈 상태; 저장소 비활성 경고.
    - E2E(Playwright): 시나리오 1–5; 새로고침 유지; 내보내기→초기화→가져오기 복원; 로케일 ko/en 질문 스왑; 로컬 자정 무렵 모킹된 시계; 시각 회귀 320/768/1024 양 테마.
    - A11y: axe + 키보드 탭/달력 탐색 + aria-live 저장 상태 + reduced-motion.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
