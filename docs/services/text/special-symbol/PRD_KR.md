# Special Symbols — 클릭 한 번으로 복사하는 특수문자 선택기 — 서비스 PRD (한국어판)

> 이 문서는 [`PRD.md`](PRD.md)의 한국어 번역본입니다. 원본(영문)이 AI 코딩 에이전트가 소비하는 정본이며, 내용 변경 시 두 문서를 함께 갱신하세요.
>
> **Special Symbols** (특수문자 / 특수기호 모음) — 키보드에 없는 특수기호를 담은 작은 타일들의 그리드. 한 번 클릭하면 즉시 복사되고, 옆 패널이 그 기호가 무엇이고 언제 쓰는지 실제 예시와 함께 설명합니다.
> 내부 서비스 코드네임: `special-symbol`. 레지스트리 id: `special-symbol`. 공개 URL 슬러그: `/[locale]/tools/special-symbol`.
>
> 이 PRD는 **도구 자체**에 집중합니다. 공통 쉘(헤더/푸터/로케일/테마/동의), 도구 레지스트리, SEO·광고 인프라, 디자인 토큰은 플랫폼이 제공합니다:
> - 플랫폼 PRD: [`docs/PRD_KR.md`](../../../PRD_KR.md) (영문 정본: [`PRD.md`](../../../PRD.md))
> - 디자인 시스템(시각 기준, 단일 소스): [`docs/DESIGN.md`](../../../DESIGN.md)

```xml
<project_specification>

<project_name>Special Symbols — 클릭 한 번으로 복사하는 특수문자 선택기 (Jurepi 도구, 코드네임 special-symbol, 레지스트리 id special-symbol)</project_name>

<overview>
Special Symbols는 작지만 끊임없는 불편을 해결합니다: 사람들은 키보드에 없는 문자 — 가운뎃점(·), 엠 대시(—), 거꾸로 된 물음표(¿), 화살표(→), 통화 기호(€ £ ¥), 단위(℃ ㎡) 등 — 가 자주 필요한데, 매번 새로 찾아야 합니다(검색엔진, 아무 웹페이지에서 복사, OS 문자표와 씨름). 이 도구는 그런 문자들을 큐레이션된 검색 가능한 그리드 한곳에 모읍니다. 각 문자는 자기만의 작은 사각 타일에 들어가 있고, 타일을 클릭하면 **즉시 클립보드에 복사**되며 토스트가 뜨고, 동시에 **상세 패널**(데스크톱은 우측, 모바일은 바텀시트)이 그 기호가 무엇이고 언제 쓰는지 구체적인 예시와 함께 설명합니다. "최근 복사" 줄과 핀 고정 즐겨찾기로 반복 사용이 매끄럽습니다.

이 도구는 Jurepi 플랫폼 쉘 안에서 `/[locale]/tools/special-symbol`에 마운트됩니다. 플랫폼의 헤더/푸터, 로케일(ko/en), 테마, 동의 게이팅된 광고 슬롯, DESIGN.md 토큰 시스템을 사용합니다. 본 PRD는 도구만 명세합니다: 기호 카탈로그/데이터 모델, 그리드 + 상세 패널 인터페이스, 클릭-복사 및 검색 인터랙션, 최근/즐겨찾기 영속화, 도구 전용 SEO 콘텐츠, 테스트.

CRITICAL (핵심 인터랙션): 기호 타일을 한 번 클릭/탭하면 두 가지가 동시에 일어납니다 — (1) 그 문자를 즉시 클립보드에 복사하고(1순위 요구), (2) 그 기호를 선택해 상세 패널이 이름 + 사용법 + 예시를 표시합니다. 복사 없이 둘러보기는 호버(마우스)와 키보드 포커스/방향키 탐색으로 지원하며, 이는 클립보드에 쓰지 않고 상세 패널만 미리보기합니다. 복사는 절대 조용히 실패하면 안 됩니다: Clipboard API를 쓸 수 없으면 레거시 복사로 폴백하고, 그것도 실패하면 문자를 미리 선택된 상태로 보여 수동 복사하게 합니다.

CRITICAL (클라이언트 전용): 100% 클라이언트 사이드. 백엔드 없음, DB 없음. 기호 카탈로그는 빌드 시 번들되는 정적·코드 분할 데이터 모듈입니다. 유일한 1st-party 영속화는 `localStorage`(최근 복사 목록 + 즐겨찾기 + 마지막 카테고리)이며, 어떤 것도 어딘가로 전송하는 네트워크 호출은 없습니다.

CRITICAL (SPA·사용성 우선): 플랫폼 원칙에 따라 모든 Jurepi 도구는 SSG 셸 위에 마운트되는 클라이언트 사이드 단일 페이지 애플리케이션(SPA)이다. 모든 상호작용 — 카테고리 전환, 검색, 선택, 복사, 핀 고정 — 은 라우트 이동이나 전체 페이지 리로드 없이 로컬 React 상태로 일어난다. 사용성이 최우선이다: 그리드는 한눈에 닿고, 검색은 한 키("/")로, 복사는 한 번의 클릭으로. 라우트는 SEO/인덱싱을 위해 정적 생성(SSG)되고, 인터랙티브 도구는 그 정적 셸 위의 단일 클라이언트 컴포넌트 아일랜드다.

CRITICAL (콘텐츠 무결성): 모든 기호 항목은 자신의 유니코드 코드포인트 시퀀스를 키로 가지며, ko와 en 양쪽에 비어 있지 않은 로케일 이름·사용법·최소 1개의 예시를 반드시 가져야 합니다. 표시되는 코드포인트(예: "U+00B7")와 HTML 엔티티(예: "&amp;middot;" / "&amp;#183;")는 실제 문자에서 **도출**되어야 합니다 — 단위 테스트가 도출 일치와 중복 기호 없음을 검증합니다. 문자는 NFC 정규화하여 저장합니다.
</overview>

<platform_integration>
  - 라우트: /[locale]/tools/special-symbol (SSG; 레지스트리 slug "special-symbol", id "special-symbol", status "live", accent "mint", category "text").
  - 플랫폼이 제공(재구현 금지): 앱 쉘(Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast 시스템, 디자인 토큰(tokens.css ↔ DESIGN.md), i18n 런타임, 도구 모듈을 감싸는 Error Boundary, lib/seo.ts의 SEO 메타데이터 빌더.
  - 소비(consume): i18n 네임스페이스 `tools.special-symbol.*`(UI 크롬 문자열·카테고리 라벨·how-to·FAQ — 기호 이름/사용법/예시는 아님); 도구 하단의 in_content AdSlot.
  - 플랫폼 의존성(작음 — 새 카테고리 불필요): `'text'` 카테고리는 이미 `ToolCategory`에 `mint` 액센트와 "텍스트"/"Text" 라벨로 존재합니다. 유일한 플랫폼 변경은 `ToolMeta` 레지스트리 항목 1개 추가, 도구 라우트의 slug→컴포넌트 분기, `generateMetadata` 분기뿐입니다. 새 카테고리를 도입해야 했던 qna-a-day와 대비됩니다.
  - 페이지 쉘(breadcrumb + in_content 광고)은 플랫폼 도구 라우트가 렌더링하고, 이 모듈은 breadcrumb과 광고 사이의 모든 것을 렌더링합니다.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - 큐레이션된 기호 카탈로그(~180–260개)를 카테고리로 구성(문장부호, 따옴표/괄호, 통화, 수학/과학, 화살표, 단위, 별/기호, 검은 원 숫자, 기타/법률, 선택적 그리스). 한국어 우선 선정: 한국 작성자가 실제로 찾는 기호(가운뎃점 ·, 엠/엔 대시 — –, 당구장 표시 ※, 《》「」, ℃, ㎡, → ★ ©, 검은 원 숫자 ❶❷❸, 이메일 골뱅이 @)와 흔한 라틴/스페인어 표기(¿ ¡, 엠 대시, 곱슬 따옴표).
    - 타일 클릭/탭 → 문자 즉시 복사 + 성공 토스트 + 선택.
    - 상세 패널: 큰 글리프, 로케일 이름, 코드포인트(U+XXXX), HTML 엔티티(있으면 명명, 없으면 십진수), 1–2문장 사용법, 2–3개 로케일 사용 예시. "다른 형식으로 복사" 칩으로 원문자·HTML 엔티티·U+ 코드포인트를 복사.
    - 검색창: 로케일 이름, 키워드, 문자 자체, 코드포인트(예: "00b7", "u+00b7")로 그리드를 실시간 필터. 대소문자·발음부호 무시.
    - 카테고리 탭/필("전체"/"All", "최근"/"Recent", "즐겨찾기"/"Favorites" 포함).
    - "최근 복사" 줄(localStorage, MRU, 상한)과 핀 고정 즐겨찾기(localStorage) — "매번 찾는다"는 불편을 직접 해결.
    - 완전한 키보드 지원: "/" 검색 포커스, 방향키 로빙 그리드 탐색(상세 미리보기), Enter/Space 복사, Esc 지우기/닫기.
    - 도구 전용 SEO 롱폼("특수문자란?" / "어떻게 복사하나요?") + FAQ(FAQPage JSON-LD), ko/en 로케일화.
    - 모션 감소 대체; WCAG 2.1 AA 접근성(라벨 타일, aria-live 복사 상태, 포커스 관리).
  </in_scope>
  <out_of_scope>
    - 앱 쉘, 헤더/푸터, 로케일 스위처, 테마 토글, 동의 배너, 광고 로딩, sitemap/robots, 도구 레지스트리 메커니즘 (모두 플랫폼 담당).
    - 이모지 선택기(😀🎉…). 이모지는 OS 선택기로 쉽게 닿고 별도 전용 도구가 합당합니다; 이 도구는 입력이 어려운 활자/기술 기호를 위한 것입니다. 카탈로그 집중을 위해 이모지는 명시적으로 제외합니다.
    - 한글 2벌식 자판으로 직접 입력되는 기호: ASCII 세트(! ? . , : ; ' " - + = * / \ ( ) [ ] { } &lt; &gt; $ # % &amp; ^ _ | ~ 및 백틱). 이 도구는 키보드에 없는 문자를 위한 것이므로 이들은 설계상 제외됩니다. IME 한자 팔레트로만 닿는 기호(※, ○, △, 「」 …)는 "자판에 있다"로 보지 않으며 범위에 남습니다. 사용자 명시 요청으로 유지되는 예외: @ 와 ₩(원).
    - 전체 유니코드 브라우저 / 모든 코드포인트, 블록 탐색기, 폰트/글리프 렌더링 도구.
    - 계정, 서버 영속화, 기기 간 동기화(백엔드 없음).
    - 출시 시점의 사용자 정의 커스텀 기호 / 편집 가능한 카탈로그.
    - 최근/즐겨찾기의 내보내기/가져오기(이는 소중한 데이터가 아니라 편의 기능 — qna-a-day의 일기 같은 보존 장치 없음).
  </out_of_scope>
  <future_considerations>
    - 한글 초성 검색("ㄱㅇㄷㅈ" → "가운뎃점") — Phase 2 검색 개선.
    - 사용자 정의 커스텀 기호 핀 / "내 세트" 그룹 — Phase 2.
    - 별도 형제 도구로서의 이모지(레지스트리 id `emoji`) — Phase 2.
    - 기호별 "N회 삽입" 또는 문자열 조립 스크래치패드 — Phase 3.
    - 변형 선택자 / 결합 부호 도우미(예: 글자 위 악센트) — Phase 3.
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md 토큰, next-intl(ko/en) — 모두 플랫폼에서 상속.</inherited>
  <module_specific>
    <persistence>localStorage만 사용, 단일 버전 키 `jurepi-special-symbol`에 `{ version, recents: string[], favorites: string[], meta }` 보관(recents/favorites는 기호 id 배열). 마운트 시 1회 읽고, 변경 시 디바운스 쓰기. localStorage를 못 써도 도구는 완전히 동작(최근/즐겨찾기만 비영속).</persistence>
    <validation>읽기 시 zod v3.x로 저장 blob 검증(손상 시 새로 시작, 사용자에게 throw 금지). 저장된 배열의 기호 id는 로드 시 현재 카탈로그와 대조해 알 수 없는 id는 제거.</validation>
    <catalog>기호 카탈로그는 코드 분할 데이터 모듈(src/components/tools/special-symbol/data/symbols.json)로, 이 도구 페이지에서만 동적 import되어 ko+en 콘텐츠가 전역 i18n 메시지 번들에 절대 들어가지 않습니다(플랫폼 JS 예산 보호 — qna-a-day 질문 뱅크와 동일 패턴). 각 레코드는 문자 + ko/en 이름·사용법·예시·키워드를 담고, 코드포인트와 HTML 엔티티는 순수 계층에서 도출.</catalog>
    <clipboard>보안 컨텍스트에서 navigator.clipboard.writeText, 레거시 hidden-textarea + document.execCommand('copy') 폴백, 최종 수동 복사 모달 폴백.(플랫폼에 기록된 클립보드 교훈 — 3단계 모두 처리.)</clipboard>
    <animation>네이티브 CSS 트랜지션만(타일 호버 리프트, 복사 플래시/체크 펄스, 패널 크로스페이드, 바텀시트 슬라이드). 애니메이션 라이브러리 없음.</animation>
  </module_specific>
</technology_stack>

<file_structure>
src/
├── lib/special-symbol/                  # 순수 도메인 계층 — React/Next import 없음, 완전 단위 테스트
│   ├── codepoint.ts                      # toCodepoints(char) → ["U+00B7"]; toHtmlEntity(char) (명명→십진); idForChar(char) → "u00b7"; NFC 정규화
│   ├── catalog.ts                        # 타입드 카탈로그 접근: allSymbols, byId, byCategory, categories[]; 커버리지/도출 검증
│   ├── search.ts                         # filterSymbols(symbols, query, locale): 이름 + 키워드 + 문자 + 코드포인트 매칭; 대소문자/발음부호 무시
│   ├── recents.ts                        # 불변 ops: pushRecent(list, id, max), clearRecents; toggleFavorite(list, id); pruneUnknown(ids, catalog)
│   └── schema.ts                         # zod Store 스키마 + STORE_VERSION + safeParseStore()
├── components/tools/special-symbol/
│   ├── SpecialSymbol.tsx                  # 오케스트레이터(Client Component) — category/search/selection 상태 + useSymbolPicker() 소유
│   ├── useSymbolPicker.ts                 # 훅: localStorage recents/favorites + 클립보드 어댑터 + 파생 선택/필터 목록
│   ├── CategoryTabs.tsx                   # All / Recent / Favorites / <category…> 필 (tablist)
│   ├── SymbolSearch.tsx                   # 검색 입력("/" 포커스, 지우기, 결과 수, aria)
│   ├── SymbolGrid.tsx                     # 반응형 타일 그리드; 로빙 tabindex 키보드 탐색
│   ├── SymbolTile.tsx                     # 한 개의 사각 타일: 글리프 + aria-label + 복사 플래시; 클릭 = 복사 + 선택
│   ├── DetailPanel.tsx                    # 선택된 기호: 큰 글리프, 이름, 코드포인트/엔티티 복사 칩, 사용법, 예시, 큰 복사 버튼
│   ├── RecentRow.tsx                      # 컴팩트 최근 복사 스트립(최근 항목 있을 때 그리드 위에 표시)
│   ├── CopyFallbackModal.tsx              # 프로그램 복사 실패 시 수동 복사 모달(미리 선택된 텍스트)
│   ├── SymbolIntro.tsx                    # H1 + 리드(SEO; 가능한 한 서버 렌더)
│   ├── SymbolHowTo.tsx                    # "특수문자란?" / "어떻게 복사하나요?" (SEO 롱폼)
│   ├── SymbolFaq.tsx                      # Q&A + FAQPage JSON-LD
│   └── data/
│       └── symbols.json                  # 카탈로그: [{ id, char, category, keywords, name{ko,en}, usage{ko,en}, examples{ko,en} }]
└── i18n/messages/{ko,en}.json             # tools.special-symbol.* UI 크롬(탭, 검색, 토스트, how-to, FAQ) — 기호 콘텐츠 아님
</file_structure>

<core_data_entities>
  <symbol note="카탈로그 레코드; 텍스트/키워드는 symbols.json에서, 코드포인트/엔티티는 도출">
    - id: string — 안정 키 = 소문자 코드포인트 시퀀스를 "-"로 연결(예: "u00b7", "u2014"); recents/favorites가 사용
    - char: string — 실제 문자(들), NFC 정규화(보통 1 코드포인트; 합성은 짧은 시퀀스 허용)
    - category: enum (punctuation, quotes, currency, math, arrows, units, stars, circled, legal, greek)
    - codepoints: string[] — char에서 도출, 예 ["U+00B7"] (테스트가 id === 코드포인트를 "u+" 없이 연결+소문자한 것과 일치함을 검증)
    - htmlEntity: string — 도출: 명명 엔티티가 있으면 사용(예 "&amp;middot;"), 없으면 십진 숫자(예 "&amp;#183;")
    - name: { ko: string; en: string } — 예 { ko: "가운뎃점", en: "Middle Dot (Interpunct)" } (양쪽 비어있지 않음)
    - keywords: string[] — ko+en 검색 별칭(예 ["가운데점","중점","interpunct","middot"])
    - usage: { ko: string; en: string } — 1–2문장: 언제/왜 쓰는지(양쪽 비어있지 않음)
    - examples: { ko: string[]; en: string[] } — 맥락 속 기호를 보여주는 짧은 예시 문자열 2–3개(로케일별 ≥1)
    INVARIANT — 도출 & 유일성: 단위 테스트가 모든 항목의 id와 codepoints가 char에서 올바로 도출되고, id가 유일하며, char가 NFC이고, name/usage/examples가 양쪽 로케일에서 비어있지 않음(로케일별 예시 ≥1)을 검증.
  </symbol>
  <category note="표시 그룹핑; 로케일 라벨은 i18n에서">
    - id: 위의 enum 값; labelKey는 tools.special-symbol.categories.&lt;id&gt;(ko/en)로 해석
    - 표시 순서: punctuation → quotes → currency → math → arrows → units → stars → circled → legal → greek
    - 가상 탭(실제 카테고리 아님): "all"(전체), "recent"(localStorage MRU), "favorites"(핀 고정). 해당될 때 탭 줄 맨 앞에 표시.
  </category>
  <picker_store note="단일 localStorage blob">
    - version: number (STORE_VERSION, 1부터 시작)
    - recents: string[] — 기호 id, 최근순, RECENTS_MAX = 16 상한, 중복 제거
    - favorites: string[] — 기호 id, 삽입 순서, 하드 상한 없음(실용적)
    - meta: { lastCategory?: string; createdAt: number }
    localStorage 키: `jurepi-special-symbol`
    INVARIANT — 검증 & 정리: 읽기는 zod 파싱; 실패 시 새로 시작(throw 없음). 현재 카탈로그에 없는 id는 로드 시 제거되어 카탈로그 변경이 댕글링 id를 남기지 않음.
  </picker_store>
  <constants>
    - RECENTS_MAX = 16; SEARCH_DEBOUNCE = 120ms; COPY_FLASH_MS = 600ms; TOAST_MS = 1800ms.
  </constants>
  <defaults>
    - 신규 사용자: recents/favorites 비어 있음; 활성 탭 "all"; 선택 기호 없음(상세 패널은 빈 힌트 표시, 아래 참조).
  </defaults>
</core_data_entities>

<component_hierarchy>
  <special_symbol>             <!-- "use client"; category + query + selectedId 상태 + useSymbolPicker() 소유 -->
    <symbol_intro />          <!-- H1 + 리드(가능한 한 서버 렌더) -->
    <picker_layout>           <!-- 데스크톱 2분할, 모바일 적층 + 바텀시트 -->
      <picker_main>           <!-- 좌측/상단 컬럼 -->
        <symbol_search />     <!-- "/" 포커스, 지우기, 결과 수 -->
        <category_tabs />     <!-- All / Recent / Favorites / 카테고리… -->
        <recent_row />        <!-- 최근 항목 있고 Recent 탭이 아닐 때 그리드 위에 표시 -->
        <symbol_grid>         <!-- 로빙 tabindex 타일 -->
          <symbol_tile />     <!-- × N: 클릭 = 복사 + 선택; 호버/포커스 = 미리보기 -->
          <empty_state />     <!-- 검색 결과 없음 / 빈 즐겨찾기 / 빈 최근 -->
        </symbol_grid>
      </picker_main>
      <detail_panel />        <!-- 데스크톱: sticky 우측 컬럼; 모바일: 바텀시트 -->
    </picker_layout>
    <symbol_how_to />         <!-- SEO 롱폼 -->
    <symbol_faq />            <!-- FAQPage JSON-LD -->
    <copy_fallback_modal />   <!-- 프로그램 복사 실패 시에만 마운트 -->
  </special_symbol>
  <note>도구 내 SPA: 탭/검색/선택은 로컬 상태로 전환, 라우트 이동 아님. 상세 패널은 도킹(데스크톱)이든 바텀시트(모바일)든 동일 컴포넌트.</note>
</component_hierarchy>

<pages_and_interfaces>
  <symbol_intro>
    - 아이브로: "텍스트 도구" / "TEXT TOOL" — eyebrow 12px/700/0.6px, var(--brand).
    - H1: "특수문자" / "Special Symbols" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - 리드: 1–2문장, body-lg 18px var(--text-secondary): "키보드에 없는 특수기호를 클릭 한 번으로 복사하세요. 오른쪽에서 언제 쓰는지 예시도 볼 수 있어요." / 영어 동등 문구.
  </symbol_intro>

  <symbol_search>
    - text-input 스타일(DESIGN text-input), 메인 컬럼 전폭, 선두 검색 아이콘(lucide Search, 20px var(--text-muted)), 플레이스홀더 "기호 이름·키워드·문자로 검색 (예: 가운데점, →, ₩)".
    - 다른 필드에 입력 중이 아닐 때 "/" 키로 포커스. 비어있지 않으면 후미 지우기(×) 버튼.
    - 실시간 필터, 디바운스 120ms. 입력 아래(또는 인라인)에 조용한 결과 수 "결과 N개" caption var(--text-muted).
    - aria: role="searchbox", aria-controls는 그리드; 결과 수는 aria-live="polite" 영역.
  </symbol_search>

  <category_tabs>
    - 가로 필 줄(category-pill / category-pill-active). 순서: "전체"(all), 다음 "최근"(recent, 최근 항목 있을 때만), "즐겨찾기"(favorites, 있을 때만), 다음 9개 카테고리.
    - 활성 = 브랜드 허니골드 채움 / on-brand 텍스트; 비활성 = surface-muted / text-secondary; 호버 시 bg 리프트.
    - role="tablist"; ArrowLeft/Right로 필 간 이동; 활성에 aria-selected. 좁은 화면에서 스냅과 함께 가로 스크롤.
    - 카테고리 선택 시 검색을 지우나? 아니오 — 검색과 카테고리는 결합(카테고리가 집합을 좁히고, 검색이 그 안에서 필터). "전체" + 빈 검색 = 전체 카탈로그.
  </category_tabs>

  <recent_row>
    - 최근 항목이 있고 활성 탭이 "recent"가 아닐 때만 그리드 바로 위에 표시. 같은 SymbolTile(컴팩트)의 가로 스트립 하나, eyebrow로 "최근 복사" / "Recently copied" 라벨.
    - 넘치면 가로 스크롤; 작은 "전체 보기" 링크로 Recent 탭 전환.
  </recent_row>

  <symbol_grid>
    - CSS 그리드, `grid-template-columns: repeat(auto-fill, minmax(56px, 1fr))`, gap var(--space-xs) 8px. 메인 컬럼 폭을 채움.
    - 각 타일: 56px 정사각(≥44px 터치), radius var(--radius-md) 12px, var(--surface) + 1px var(--hairline), 글리프 중앙 26px var(--text)(Pretendard — 글리프는 시스템/기호 폰트로 자연스럽게 렌더).
    - 상태:
      - 호버(마우스): var(--accent-mint-soft) bg + translateY(-2px) + var(--shadow-card); 복사 없이 상세 패널에 미리보기.
      - 포커스(키보드): 2px var(--focus-ring) 링 offset 2px; 상세 패널에 미리보기.
      - 선택됨: 2px var(--accent-mint) 링 + var(--accent-mint-soft) bg(복사 후에도 유지).
      - 복사 플래시: 클릭 시 짧은 민트 펄스 + ✓ 체크 오버레이 600ms(모션 감소: 스케일 없이 ✓ 표시).
    - 로빙 tabindex: 활성 타일만 tabbable; ArrowUp/Down/Left/Right로 시각적 그리드 전반 포커스 이동(레이아웃에서 열 수 계산); Home/End로 첫/끝; Enter/Space로 포커스 타일 복사.
    - aria: 그리드는 role="grid"(또는 라벨 리스트); 각 타일은 aria-label = "{name}, {char}, {U+codepoint}"인 버튼이라 스크린리더가 글리프에 의존하지 않고 읽음.
    - empty_state: 검색 결과 없음 → 친절한 "‘{query}’에 해당하는 기호가 없어요" + 검색 지우기 버튼; 빈 즐겨찾기 → "별 아이콘을 눌러 자주 쓰는 기호를 저장하세요"; 빈 최근 → "최근 복사한 기호가 여기에 모여요".
  </symbol_grid>

  <symbol_tile_interaction>
    - 클릭 / 탭: 문자를 클립보드에 복사 → 성공 시: 토스트 "복사됨: {char}"(semantic-success 선두 점), 복사 플래시, 최근에 push, 선택으로 설정(상세 패널 갱신). 실패 시: CopyFallbackModal 열기.
    - 호버(포인터) / 포커스(키보드): 복사 없이 선택/미리보기 — 사용자가 결정 전에 사용법을 읽도록 상세 패널 갱신.(터치엔 호버 없음 — 탭이 복사 + 선택.)
    - 타일 우상단 작은 별 버튼(호버/포커스 시 나타나고 터치엔 항상 보임)이 즐겨찾기 토글; 복사하지 않음. aria-pressed가 상태 반영.
  </symbol_tile_interaction>

  <detail_panel>
    - 데스크톱(≥1024px): sticky 우측 컬럼, 폭 340px, var(--surface), radius var(--radius-xxl) 28px, padding 24px, shadow --shadow-card. 그리드 스크롤 시 breadcrumb 아래에 고정.
    - 태블릿(768–1023px): 더 좁은 그리드 우측에 도킹된 같은 패널, 폭 ~300px(그리드 열 수 감소).
    - 모바일(&lt;768px): 타일 선택 후 슬라이드업하는 바텀시트; 동일 콘텐츠; 그랩 핸들 + 닫기; 백드롭 dim rgba(30,27,58,0.4). 탭이 이미 복사했으므로 시트는 "방금 복사한 것 + 사용법".
    - 콘텐츠(위→아래):
      1. 큰 글리프: 문자 64px, var(--accent-mint-soft) 타일(radius var(--radius-lg)) 중앙.
      2. 이름: headline 24px var(--text)(로케일화).
      3. 메타 "다른 형식으로 복사" 칩(줄): "기호 {char}" · "HTML {entity}" · "유니코드 {U+XXXX}" — 각 작은 필(player-chip 스타일, mint-soft); 칩 클릭 시 그 표현을 복사(토스트 "HTML 엔티티 복사됨" 등). 키보드 접근 가능.
      4. 사용법: body 16px var(--text-secondary), 로케일화된 1–2문장 노트.
      5. 예시: 작은 적층 목록(2–3), 각 var(--surface-muted) 칩(radius var(--radius-md)); 예시 안의 기호는 강조(var(--accent-mint) / 700). 라벨 "예시" / "Examples" eyebrow.
      6. 1순위 "복사" 버튼(button-primary, 브랜드 허니골드, 전폭) — 문자 복사(타일 클릭과 중복이나 선택 후 명확한 어포던스).
    - 빈/초기 상태(미선택): 친절한 힌트 카드 — "기호를 선택하면 사용법과 예시가 여기에 표시됩니다." 그리고 최근 항목 있으면 다시 복사하라는 넛지.
  </detail_panel>

  <copy_fallback_modal>
    - navigator.clipboard와 execCommand 모두 실패할 때만 마운트. 모달(DESIGN modal)에 문자를 크게, 미리 선택된 read-only 입력에 + 안내 "Ctrl/Cmd+C 로 복사하세요". 닫기 버튼. 나머지 UI를 막지 않음.
  </copy_fallback_modal>

  <symbol_how_to>
    - SEO 롱폼(로케일별): "특수문자란?", "어떻게 복사하나요?", "자주 쓰는 특수문자" — 600–900자; 클릭-복사, 검색, 즐겨찾기 설명; 모두 무료이며 브라우저에 남음을 언급.
  </symbol_how_to>
  <symbol_faq>
    - 5–7개 Q&A; 렌더 + FAQPage JSON-LD로 방출. 반드시 포함: "어떻게 복사하나요?"(기호를 클릭하면 바로 복사됩니다); "복사가 안 돼요"(보안 컨텍스트/권한 안내 + 수동 복사 폴백); "이모지도 있나요?"(이모지는 별도 — 이 도구는 키보드에 없는 특수기호 모음); "엠 대시(—)와 엔 대시(–) 차이는?"(간단 설명); "가운뎃점(·)은 어떻게 입력하나요?"(검색 후 클릭); "내 즐겨찾기는 어디 저장되나요?"(이 브라우저 localStorage, 업로드되지 않음).
  </symbol_faq>

  <keyboard_shortcuts_reference>
    - "/" → 검색 입력 포커스(필드에 입력 중이 아닐 때).
    - 방향키 → 그리드 전반 포커스 이동(로빙 tabindex); Home/End → 첫/끝 타일.
    - Enter / Space → 포커스 타일 복사.
    - "f"(타일 포커스 중) → 그 타일 즐겨찾기 토글.
    - Esc → 비어있지 않으면 검색 지우기, 아니면 모바일 상세 시트 닫기.
    - 터치(물리 키보드 없음)에선 비활성; 모든 동작은 탭으로 닿음.
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <codepoint_engine note="순수·결정적">
    - idForChar(char): NFC 정규화, 각 코드포인트를 "u{hex}"로, "-"로 연결 → 안정 id.
    - toCodepoints(char): 각 코드포인트의 "U+XXXX" 배열(대문자, ≥4 hex).
    - toHtmlEntity(char): 단일 코드포인트가 잘 알려진 명명 엔티티(작은 내장 맵: middot, mdash, ndash, hellip, copy, reg, trade, deg, times, divide, larr, rarr, harr, hearts, euro, pound, yen, cent, sect, para, …)를 가지면 "&amp;name;" 반환; 아니면 십진 "&amp;#NNN;". 다중 코드포인트 → 십진 엔티티 연결.
  </codepoint_engine>
  <catalog_access>
    - allSymbols(): Symbol[] (카테고리 순서, 다음 카탈로그 순서). byId(id), byCategory(cat). categories(): 카탈로그에 존재하는 순서대로의 카테고리 id.
    - import 시 순수 계층이 (테스트에서) 전체 데이터셋의 도출 + 유일성 + 로케일 완전성을 검증 가능.
  </catalog_access>
  <search>
    - filterSymbols(symbols, query, locale): query가 비면 입력 그대로 반환. 아니면 query 정규화(trim, NFC, 소문자, 발음부호 제거, 코드포인트 매칭 위해 선두 "u+"/"u"도 제거). 다음 중 하나라도 정규화된 query를 부분문자열로 포함하면 매칭: 로케일 이름, 임의 키워드, 원문자, 임의 코드포인트 hex. 안정 순서 유지. 대소문자·발음부호 무시.
    - 활성 카테고리와 결합: 그리드는 filterSymbols(활성 탭 기호, query)를 표시.(Recent/Favorites 탭은 자신의 순서 부분집합을 필터.)
  </search>
  <recents_and_favorites note="모두 불변 — 새 배열/스토어 반환">
    - pushRecent(list, id, max=16): id를 맨 앞으로 이동/삽입, 중복 제거, max로 자름.
    - toggleFavorite(list, id): 없으면 추가, 있으면 제거(순서 유지).
    - pruneUnknown(ids, catalog): 현재 카탈로그에 없는 id 제거(로드 시 실행).
  </recents_and_favorites>
  <clipboard_adapter useSymbolPicker>
    - copy(text): 보안 컨텍스트에서 navigator.clipboard.writeText 시도; throw/부재 시 hidden-textarea + execCommand('copy') 폴백 시도; 그것도 실패하면 CopyFallbackModal을 여는 "manual" 결과로 resolve. UI가 토스트 또는 모달을 띄우도록 결과 반환. 문자(엔티티/코드포인트 칩 아님)를 대상으로 한 복사는 그 기호를 최근에도 push.
  </clipboard_adapter>
  <persistence_adapter useSymbolPicker>
    - 마운트 시: `jurepi-special-symbol` 읽기 → zod 파싱 → pruneUnknown(recents/favorites) → 상태; 실패 시 새로 시작(사용자에게 오류 없음). localStorage가 아예 없으면 세션 동안 인메모리로 동작(도구는 완전히 사용 가능; 비영속).
    - 변경 시: 디바운스 JSON.stringify → setItem; quota/security 오류 catch → 인메모리 상태 유지(최근/즐겨찾기는 비핵심).
    - 노출: 활성 탭+query의 필터 목록, selectedId + select(id, {copy?}), copy(text), toggleFavorite(id), recents, favorites, lastCategory.
  </persistence_adapter>
  <i18n>모든 UI 크롬은 tools.special-symbol.*(ko/en): 탭, 카테고리 라벨, 검색 플레이스홀더, 결과 수, 토스트("복사됨", "HTML 엔티티 복사됨", "즐겨찾기 추가/해제"), 빈 상태, how-to, FAQ. 기호 이름/사용법/예시는 코드 분할 symbols.json(ko/en 필드)에서, i18n 메시지가 아님.</i18n>
</core_functionality>

<error_handling>
  <copy_failure>
    - CRITICAL: 복사는 우아하게 저하되어야 함. Tier 1 navigator.clipboard → Tier 2 execCommand → Tier 3 CopyFallbackModal(수동 Ctrl/Cmd+C용 미리 선택 문자). 사용자는 항상 문자로 가는 경로가 있고; 복사가 실제로 안 됐는데 성공한 것처럼 조용히 보이지 않음(성공 토스트는 확인된 tier-1/2 성공에만).
  </copy_failure>
  <search_no_results>질의 텍스트를 되울리는 친절한 빈 상태 + "검색 지우기" 버튼; 상세 패널은 마지막 선택 또는 빈 힌트 유지.</search_no_results>
  <storage>
    <unavailable>시크릿 모드 / 비활성 저장소 → 최근/즐겨찾기는 세션 동안 인메모리; 무서운 오류 없음(편의 기능). 그리드, 검색, 복사, 상세 패널 모두 정상 동작.</unavailable>
    <corrupt_blob>읽기 시 JSON/zod 실패 → 무시하고 빈 스토어로 시작(최근/즐겨찾기는 소중하지 않으므로 격리 불필요). UI에 throw 금지.</corrupt_blob>
    <quota>setItem throw → 인메모리 상태 유지; 선택적으로 최근 자름; 사용자 대면 오류 없음.</quota>
  </storage>
  <error_boundary>플랫폼이 도구를 Error Boundary로 감쌈; 렌더 실패 시 셸을 망가뜨리지 않고 재시도 표시.</error_boundary>
  <note>이 모듈은 1st-party 네트워크 요청을 하지 않음; API 오류 표면 없음.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md가 모든 토큰의 단일 소스. 아래는 도구별 적용.</source>
  <accent_usage>
    - 카테고리 액센트는 MINT(var(--accent-mint) #2dd4bf / var(--accent-mint-soft) #d7f7f2) — DESIGN의 "text" 카테고리 정체성.
    - 민트는 정체성 표시: 인트로 아이콘 타일, 타일 호버/선택 상태, 상세 패널 글리프 타일, "다른 형식으로 복사" 칩, 예시 안 강조 기호, 즐겨찾기 별(채움).
    - CTA(상세 "복사" 버튼, 1순위 동작)는 브랜드 허니골드 var(--brand) 유지. 액센트는 정체성, 동작 색이 아님(DESIGN do/don't). 성공 토스트는 선두 점에 민트가 아닌 var(--semantic-success).
  </accent_usage>
  <surfaces>그리드 타일은 기본 var(--surface) + 1px var(--hairline), radius var(--radius-md) 12px; 상세 패널 radius var(--radius-xxl) 28px on var(--surface); 예시 칩 var(--surface-muted) radius var(--radius-md). 부드러운 브랜드 틴트 그림자(--shadow-card / --shadow-card-hover), 하드 보더를 엘리베이션으로 쓰지 않음.</surfaces>
  <typography>H1 Gmarket Sans(clamp 28–40px); 상세 이름 headline 24px; 글리프 자체가 초점 오브젝트(크고 중앙). Body/사용법 Pretendard 16px/1.55; 메타 칩/라벨 caption/eyebrow. 코드포인트/엔티티는 가독성을 위해 mono 계열 처리(U+XXXX와 &amp;#NNN; 문자열에만 mono fallback 스택).</typography>
  <motion>transform / opacity만: 타일 호버 translateY(-2px) 150ms, 복사 플래시 + ✓ 펄스(scale 1→1.15→1, 600ms), 상세 크로스페이드 150ms, 모바일 시트 슬라이드업(translateY) 250ms. --ease-out cubic-bezier(0.16,1,0.3,1). 모두 prefers-reduced-motion으로 게이팅(translate/scale 없음; 즉시 페이드; ✓는 펄스 없이 표시).</motion>
  <accessibility>각 타일은 라벨 버튼(aria-label에 이름 + 문자 + 코드포인트 포함, 글리프 렌더에 의존하지 않고 안내); 방향키 로빙 tabindex 그리드; 복사 상태는 aria-live="polite" 영역("복사됨: 가운뎃점"); ≥44px 유효 탭 타깃(56px 타일); 가시 focus-visible 링 var(--focus-ring); "다른 형식으로 복사" 칩과 즐겨찾기 별은 상태가 있는 실제 버튼. WCAG 2.1 AA 대비: 기호 글리프는 밝은 타일 위 var(--text) 사용(흰 위 민트 글리프 아님); 민트는 타일 배경/정체성용, 흰 위 본문 텍스트용 아님.</accessibility>
  <responsive>
    - ≥1024px: 2분할 — 메인 컬럼(검색 + 탭 + 그리드) flex:1, 상세 패널 sticky 340px 우측.
    - 768–1023px: 더 좁은 그리드(auto-fill 열 수 감소) + ~300px 상세 패널의 2분할; 폭이 빠듯하면 상세 패널이 아래에 전폭 카드로 도킹될 수 있음.
    - &lt;768px: 단일 컬럼; 상세는 선택 시 트리거되는 바텀시트. 카테고리 필은 스냅과 함께 가로 스크롤. 그리드는 ≥56px 타일 유지(가장 좁은 화면에선 4–5열까지 줄어듦). 브레이크포인트는 DESIGN(480/768/1024) 준수.
  </responsive>
  <atmosphere>밝고 친근하며 실용적-그러나-따뜻함: 민트 정체성의 끌리는 탭 가능한 타일들의 차분한 그리드, 우측에 큰 글리프 하나가 스포트라이트. 빽빽한 "문자표" 느낌을 피하고, 넉넉한 간격과 둥근 타일로 시스템 다이얼로그가 아닌 Jurepi처럼 느껴지게.</atmosphere>
  <icons>lucide-react: Search(검색 필드), Star/StarOff(즐겨찾기), Copy(칩/버튼), X(지우기/닫기). 기본 20px, stroke 1.75, currentColor. 레지스트리 카드 아이콘은 `Asterisk`.</icons>
</aesthetic_guidelines>

<security_considerations>
  <input>기호 이름, 사용법, 예시, 검색 결과는 텍스트 노드로 렌더(React 이스케이프); 이 모듈 어디서도 dangerouslySetInnerHTML 금지 — "HTML 엔티티" 문자열(예 "&amp;middot;")조차 마크업으로 주입하지 않고 리터럴 텍스트로만 표시.</input>
  <clipboard>사용자가 시작한 문자/엔티티/코드포인트 문자열만 씀; 클립보드를 읽지 않음. 복사는 브라우저 요구대로 사용자 제스처 핸들러(클릭/키프레스) 안에서 발생.</clipboard>
  <privacy>최근/즐겨찾기는 오직 localStorage에 저장되고 절대 전송되지 않음. 복사된 콘텐츠를 포함하는 분석 이벤트 없음(있어도 거친 "copy" 카운트 정도). how-to/FAQ에 명확히 기술.</privacy>
  <catalog_integrity>카탈로그는 빌드 시 정적 자산(원격 fetch 없음); 단위 테스트가 코드포인트/엔티티 도출과 로케일 완전성을 검증해 잘못/중복 항목이 출하되지 않음.</catalog_integrity>
  <note>비밀값 없음, 네트워크 호출 없음, 3rd-party 저장소 없음.</note>
</security_considerations>

<advanced_functionality>
  <recently_copied>MRU 스트립 + Recent 탭(localStorage, 16 상한) — 반복 사용의 핵심 마찰 제거.</recently_copied>
  <favorites>임의 기호 핀 고정(별); Favorites 탭 + 영속 집합 — 특정 사용자가 계속 쓰는 소수를 위해.</favorites>
  <copy_as_representations>원문자 외에 한 번 클릭으로 HTML 엔티티 또는 U+ 코드포인트 복사 — 코드/마크업에 기호를 넣는 개발자·작성자에게 유용.</copy_as_representations>
  <keyboard_first>"/"로 검색, 방향키 로빙 그리드, Enter로 복사, "f"로 즐겨찾기 — 파워 유저는 마우스를 안 씀.</keyboard_first>
  <reduced_motion>타일 호버, 복사 플래시/펄스, 상세 크로스페이드, 모바일 시트 슬라이드에 적용.</reduced_motion>
  <initial_consonant_search optional="true">Phase 2: 한글 초성 검색(예 "ㄱㅇㄷ" → 가운뎃점)을 filterSymbols 시그니처 변경 없이 레이어링.</initial_consonant_search>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>클릭하여 복사 + 상세 패널 갱신</description>
    <steps>
      1. /ko/tools/special-symbol 방문 → 카테고리와 함께 그리드 렌더; 상세 패널은 빈 힌트; 선택 없음.
      2. "·"(가운뎃점) 타일 클릭 → 클립보드에 "·" 들어감; 토스트 "복사됨: ·" 표시; 타일 짧은 ✓ 플래시 후 선택됨.
      3. 상세 패널이 이제 표시: 큰 "·", 이름 "가운뎃점", 칩 "기호 ·" / "HTML &amp;middot;" / "유니코드 U+00B7", 사용법, 예시 2–3개(예 "사과·배·감").
      4. 아무 필드에 붙여넣기 → "·" 붙여짐.
      5. "HTML" 칩 클릭 → 클립보드에 "&amp;middot;" 들어감; 토스트 "HTML 엔티티 복사됨".
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>검색, 카테고리 필터, 빈 상태</description>
    <steps>
      1. 검색에 "대시"(또는 "dash") 입력 → 그리드가 엠 대시(—)와 엔 대시(–)로 좁혀짐; 결과 수 갱신; aria-live 안내.
      2. 검색 지우기; "화살표"(arrows) 카테고리 클릭 → 화살표만 표시(→ ← ↑ ↓ …).
      3. "00b7" 입력 → 가운뎃점 표시(코드포인트 매칭).
      4. "asdfqwer" 입력 → 빈 상태 "‘asdfqwer’에 해당하는 기호가 없어요" + 지우기 버튼; 지우기 클릭 시 그리드 복원.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>최근 + 즐겨찾기 영속화</description>
    <steps>
      1. 서로 다른 기호 3개 복사 → 그리드 위에 "최근 복사" 스트립이 최근순으로 표시; Recent 탭에도 목록.
      2. 타일 호버 후 별 클릭 → Favorites 탭에 나타남; 별 채워짐(aria-pressed=true).
      3. 페이지 리로드 → 최근과 즐겨찾기가 여전히 존재(localStorage), 알 수 없는 id는 정리됨.
      4. localStorage 비활성(시크릿 모드) → 복사는 여전히 동작하고 세션 중 스트립 갱신, 그러나 리로드 후엔 비어 있음; 오류 표시 없음.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>키보드 전용 동작 + a11y</description>
    <steps>
      1. "/" 누름 → 검색창으로 포커스 점프.
      2. 그리드로 Tab; 방향키로 포커스 타일 이동(상세 패널이 복사 없이 각 포커스 기호 미리보기).
      3. 타일에서 Enter → 복사됨(토스트 + aria-live "복사됨: {name}").
      4. 포커스 타일에서 "f" → 즐겨찾기 토글(aria-pressed 전환; 토스트).
      5. axe 실행 → 위반 없음; 모든 타일 버튼에 이름 + 문자 + 코드포인트 포함 aria-label; 전반에 가시 포커스 링.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, 복사 폴백, SEO</description>
    <steps>
      1. /en 전환 → 모든 크롬 + 모든 기호의 이름/사용법/예시가 영어로 렌더; "·" 이름은 "Middle Dot (Interpunct)".
      2. navigator.clipboard 부재 + execCommand 실패 시뮬레이션 → 타일 클릭 시 문자가 미리 선택된 안내와 함께 CopyFallbackModal 열림; 거짓 "복사됨" 토스트는 표시되지 않았음.
      3. 프로덕션 빌드 → /ko/tools/special-symbol과 /en/tools/special-symbol이 고유 title, meta description, canonical, hreflang, OG, SoftwareApplication + FAQPage JSON-LD로 정적 생성; how-to + FAQ 로케일화; 기호 데이터셋은 전역 i18n 번들이 아닌 코드 분할 청크로 출하.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <core_interaction>CRITICAL: 한 번 클릭이 문자 복사 AND 선택(상세 패널 갱신); 호버/포커스는 복사 없이 미리보기; 복사는 clipboard API → execCommand → 수동 모달로 저하되며 거짓 성공을 보고하지 않음.</core_interaction>
  <content_integrity>CRITICAL: 단위 테스트가 모든 카탈로그 항목의 id + codepoints + HTML 엔티티가 char에서 올바로 도출되고, id가 유일하며, char가 NFC이고, name/usage/examples가 ko와 en 양쪽에서 비어있지 않음(로케일별 예시 ≥1)을 검증.</content_integrity>
  <functionality>검색·카테고리 필터 가능한 그리드; localStorage에 영속화되고 알 수 없는 id가 정리되는 최근(상한 MRU) + 즐겨찾기; "다른 형식으로 복사" 문자/엔티티/코드포인트; 키보드 우선 동작; localStorage 없이도 완전히 동작.</functionality>
  <user_experience>복사가 즉각적으로 느껴짐(체감 &lt; 50ms); 명확하고 거슬리지 않는 성공 토스트 + ✓ 플래시; 글리프 하나가 스포트라이트; ≥44px 타깃; 가시 포커스; SPA — 어떤 상호작용도 라우트 리로드 없음.</user_experience>
  <technical_quality>lib/special-symbol/* 순수 함수 단위 커버리지 ≥ 80%(코드포인트/엔티티 도출, 코드포인트+발음부호 포함 검색 매칭, 최근/즐겨찾기 불변 ops, zod 거부 + 정리); TS 오류 0; 800줄 초과 파일 없음; 카탈로그는 코드 분할되어 전역 i18n 번들을 부풀리지 않음.</technical_quality>
  <visual_design>DESIGN.md 준수; 민트 액센트로 정체성(타일, 글리프 타일, 칩, 즐겨찾기), 복사 CTA엔 브랜드 허니골드; 밝고 친근한 그리드 — 시스템 문자표 다이얼로그 아님; HTML 엔티티 문자열은 리터럴 텍스트로만 렌더.</visual_design>
  <accessibility>완전한 키보드 동작(로빙 그리드, "/", Enter, "f", Esc); aria-live 복사 상태; 글리프 렌더에 의존하지 않고 기호를 안내하는 라벨 타일 버튼; 모션 감소 존중; WCAG 2.1 AA 대비.</accessibility>
  <performance>도구 라우트는 플랫폼 예산 내; 카탈로그 동적 import(전역 i18n 번들 아님); 200+ 타일이 부드럽게 렌더; CLS 영향 없음(광고 높이는 플랫폼이 예약).</performance>
</success_criteria>

<build_output>
  <note>플랫폼의 일부로 빌드(pnpm build). /[locale]/tools/special-symbol은 플랫폼의 generateStaticParams가 레지스트리(status "live")를 순회하며 사전 렌더. 기호 카탈로그는 이 라우트에서만 로드되는 코드 분할 청크로 출하.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — 항목 1개 추가. 'text' 카테고리 + 'mint' 액센트는 이미 존재하므로 ToolCategory 변경 불필요.
    {
      id: 'special-symbol',
      slug: 'special-symbol',
      category: 'text',
      icon: 'Asterisk',          // lucide-react
      accent: 'mint',
      status: 'live',            // 모듈 빌드 전까지 'coming_soon'
      isNew: true,
      order: 9,                  // qna-a-day(8) 다음; 원하는 대로 조정
      keywords: ['특수문자','특수기호','기호','가운뎃점','가운데점','중점','엠대시','엔대시','대시','물음표','거꾸로물음표','화살표','별표','통화기호','단위기호','문장부호','괄호','따옴표','copy','special characters','special symbols','glyphs','punctuation','em dash','interpunct','arrows','currency'],
    },
    ```
    또한 도구 라우트에 slug→컴포넌트 분기(slug 'special-symbol'에 대해 &lt;SpecialSymbol/&gt; 렌더)와 generateMetadata 분기(title/description/JSON-LD)를 기존 ladder/qna-a-day 분기와 함께 추가. 새 카테고리 라벨 불필요("텍스트"/"Text" 필이 이미 존재).
  </platform_registry_change>
  <critical_paths>
    1. lib/special-symbol/codepoint.ts — id/코드포인트/엔티티 도출 정확성(NFC, 다중 코드포인트, 명명-대-십진 엔티티). 모든 것이 여기에 의존.
    2. 클립보드 어댑터 — 확인된-성공 계약(실제 성공에만 토스트)의 3단 폴백; API 부재로 모킹한 컴포넌트/E2E 테스트로 커버.
    3. 클릭 = 복사 + 선택 인터랙션(그리고 호버/포커스 = 복사 없는 미리보기) — 도구의 핵심; 제스처/복사 타이밍을 정확히.
    4. 카탈로그 콘텐츠 + 도출/로케일 완전성 테스트 — 데이터셋 게이트.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/special-symbol/codepoint.ts + catalog.ts + search.ts + recents.ts + schema.ts를 Vitest로(RED→GREEN): 도출, 명명/십진 엔티티, 검색(이름/키워드/문자/코드포인트, 발음부호), MRU push/dedupe/cap, toggleFavorite, zod 파싱 + pruneUnknown.
    2. data/symbols.json을 카테고리 세트 + 대표 ~40개(사용자의 세 기호 · — ¿ 포함)로 시드, 다음 도출 + ko/en 완전성 + 유일성 검증하는 데이터셋 테스트; ~180–260개로 확장.
    3. tools.special-symbol.* 메시지(ko/en): 탭, 카테고리 라벨, 검색, 토스트, 빈 상태, how-to, FAQ.
    4. useSymbolPicker 훅(localStorage 읽기/정리/인메모리 폴백 + 디바운스 쓰기 + 클립보드 어댑터 + 파생 필터 목록/선택).
    5. SymbolTile + SymbolGrid(로빙 tabindex, 상태, 복사 플래시) + SymbolSearch + CategoryTabs + RecentRow + 빈 상태.
    6. DetailPanel(글리프 타일, 이름, 복사 칩, 사용법, 예시, 복사 버튼) — 데스크톱 도킹, 모바일 바텀시트.
    7. CopyFallbackModal; 키보드 단축키; 모션 감소; a11y 패스(axe, aria-live, 로빙 포커스).
    8. SymbolIntro/HowTo/Faq + SoftwareApplication + FAQPage JSON-LD를 플랫폼 lib/seo.ts로.
    9. 레지스트리 status → live; slug→컴포넌트 + generateMetadata 분기; E2E 시나리오 1–5; 비주얼 회귀 320/768/1024 양 테마.
  </recommended_implementation_order>
  <codepoint_sketch>
    ```typescript
    // src/lib/special-symbol/codepoint.ts — 문자에서의 결정적 도출.
    const NAMED: Record<number, string> = {
      0x00b7: 'middot', 0x2014: 'mdash', 0x2013: 'ndash', 0x2026: 'hellip',
      0x00a9: 'copy', 0x00ae: 'reg', 0x2122: 'trade', 0x00b0: 'deg',
      0x00d7: 'times', 0x00f7: 'divide', 0x2190: 'larr', 0x2192: 'rarr', 0x2194: 'harr',
      0x20a9: 'won' /* 표준 명명 엔티티 아님 — 불확실하면 십진으로 폴백 */,
      0x20ac: 'euro', 0x00a3: 'pound', 0x00a5: 'yen', 0x00a2: 'cent', 0x00a7: 'sect', 0x00b6: 'para',
    };
    const cps = (s: string) => Array.from(s.normalize('NFC')).map(c => c.codePointAt(0)!);

    export const idForChar = (s: string) =>
      cps(s).map(cp => 'u' + cp.toString(16).padStart(4, '0')).join('-');

    export const toCodepoints = (s: string) =>
      cps(s).map(cp => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'));

    export const toHtmlEntity = (s: string) =>
      cps(s).map(cp => (NAMED[cp] ? `&${NAMED[cp]};` : `&#${cp};`)).join('');
    ```
  </codepoint_sketch>
  <clipboard_sketch>
    ```typescript
    // 'ok'(프로그램 성공) | 'manual'(호출자가 폴백 모달을 열어야 함) 반환
    export async function copyText(text: string): Promise<'ok' | 'manual'> {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          return 'ok';
        }
      } catch { /* 폴스루 */ }
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.readOnly = true;
        ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok ? 'ok' : 'manual';
      } catch { return 'manual'; }
    }
    // CRITICAL: "복사됨" 토스트는 이것이 'ok'로 resolve될 때만 표시. 'manual'이면 CopyFallbackModal 열기.
    ```
  </clipboard_sketch>
  <store_schema_sketch>
    ```typescript
    // src/lib/special-symbol/schema.ts
    import { z } from 'zod';
    export const STORE_VERSION = 1;
    export const StoreSchema = z.object({
      version: z.number().int(),
      recents: z.array(z.string()).max(64),       // 로드 시 알려진 id로 정리 + RECENTS_MAX로 상한
      favorites: z.array(z.string()).max(512),
      meta: z.object({
        createdAt: z.number().int().nonnegative(),
        lastCategory: z.string().optional(),
      }),
    });
    export type Store = z.infer<typeof StoreSchema>;
    ```
  </store_schema_sketch>
  <catalog_categories>
    - punctuation (문장부호): · ㆍ — – ‒ … ‥ • ‧ ※ ¶ § † ‡ ‖ ′ ″ ‴ ‐ ⁇ ⁈ ⁉ ¿ ¡
    - quotes (따옴표·괄호): “ ” ‘ ’ 「 」 『 』 《 》 〈 〉 【 】 〔 〕 〖 〗 ‹ › « » ⟨ ⟩
    - currency (통화): ₩ € £ ¥ ¢ ₿ ₽ ₹ ฿ ₫ ₴ ₦ ₱ ₪   (제외: $ — 한글 자판에 있음. ₩은 백슬래시 키에 있으나 사용자 요청으로 예외 포함)
    - math (수학·과학): × ÷ ± ∓ ∞ ≈ ≠ ≤ ≥ √ ∛ ∑ ∏ ∫ ∂ ∆ ∇ π µ Ω ° ‰ ‱ ∈ ∉ ⊂ ⊃ ∀ ∃ ¬ ∧ ∨ ∝ ∴ ∵
    - arrows (화살표): ← → ↑ ↓ ↔ ↕ ⇐ ⇒ ⇑ ⇓ ⇔ ↵ ↩ ↪ ⤴ ⤵ ⟶ ⟵ ➡ ⬅ ⬆ ⬇ ⇄ ⇆
    - units (단위): ℃ ℉ ㎡ ㎥ ㎏ ㎎ ㎞ ㎝ ㎜ ㎖ ㎘ ㏈ № ℡ µ ㎐ ㎓ ㏊
    - stars (별·도형): ★ ☆ ✦ ✧ ✩ ✪ ✯ ❤ ♥ ♡ ✓ ✔ ✗ ✘ ☑ ☒ ○ ● ◇ ◆ □ ■ △ ▲ ▽ ▼ ◈ ◐ ◑
    - circled (원 숫자): ❶ ❷ ❸ ❹ ❺ ❻ ❼ ❽ ❾ ❿ ⓫ ⓬ ⓭ ⓮ ⓯ ⓰ ⓱ ⓲ ⓳ ⓴ ⓿  — CRITICAL: 검은 원+흰 숫자(negative circled numbers, U+2776–U+277F / U+24EB–U+24F4 / U+24FF)만; 윤곽선형 ① ② ③ 는 포함하지 않음.
    - legal (기타·법률): @ © ® ™ ℗ ¶ § ª º ¦ ° ☎ ✉ ⌘ ⌥ ⇧ ⏎ ⌫ ␣ ☜ ☞ ☝ ✂   (제외: # % & — 자판에 있음. @는 자판에 있으나 사용자 요청으로 예외 포함 — 이메일 앳/골뱅이)
    - greek (그리스 문자, optional): α β γ δ ε ζ η θ λ μ π ρ σ φ ω Α Β Γ Δ Θ Λ Π Σ Φ Ω
    NOTE: 이 목록은 시드/커버리지 가이드; 빌더가 ko/en 이름+사용법+예시를 붙여 최종 ~180–260개로 큐레이션. 다음은 반드시 포함: · (U+00B7, punctuation), — (U+2014, punctuation), ¿ (U+00BF, punctuation/inverted), ※ (U+203B, punctuation — "당구장 표시"로 검색됨), @ (U+0040, legal — "앳"/"골뱅이"/"email"로 검색됨), ₩ (U+20A9, currency — 자판에 있으나 유지), 그리고 검은 원 숫자 ❶…❿ (circled).
    EXCLUDE (CRITICAL): 한글 2벌식 자판으로 직접 입력되는 기호 — ASCII 세트 ! ? . , : ; ' " - + = * / \ ( ) [ ] { } &lt; &gt; $ # % &amp; ^ _ | ~ (및 백틱). 이 도구는 키보드에 없는 문자 전용. 제외 아님: IME 한자 팔레트로만 닿는 기호(예 ㅁ+한자 → ※ ○ △, ㄴ+한자 → 「 」) — 그 다단계 찾기가 이 도구가 없애려는 불편이므로 유지. 예외(자판에 있으나 사용자 명시 요청으로 유지): @ (Shift+2) 와 ₩ (원, 백슬래시 키). (목록의 곱슬 따옴표 “ ” ‘ ’ 는 활자용이며 직선 ASCII ' " 가 아니므로 유지.)
  </catalog_categories>
  <symbol_record_samples>
    ```json
    [
      {
        "id": "u00b7", "char": "·", "category": "punctuation",
        "keywords": ["가운뎃점","가운데점","중점","interpunct","middot","middle dot"],
        "name": { "ko": "가운뎃점", "en": "Middle Dot (Interpunct)" },
        "usage": { "ko": "단어를 나란히 나열하거나 날짜·비율을 구분할 때 씁니다.", "en": "Separates listed items, dates, or ratios." },
        "examples": { "ko": ["사과·배·감", "9·11", "남녀·노소"], "en": ["A·B·C", "ratio 3·2"] }
      },
      {
        "id": "u2014", "char": "—", "category": "punctuation",
        "keywords": ["엠대시","대시","긴줄표","줄표","em dash","mdash"],
        "name": { "ko": "엠 대시(줄표)", "en": "Em Dash" },
        "usage": { "ko": "문장 중간에 보충 설명이나 강한 끊김을 넣을 때 씁니다.", "en": "Marks a strong break or parenthetical aside in a sentence." },
        "examples": { "ko": ["그는 떠났다 — 영원히.", "정답은 하나 — 바로 너야."], "en": ["He left — for good.", "One answer — you."] }
      },
      {
        "id": "u00bf", "char": "¿", "category": "punctuation",
        "keywords": ["거꾸로물음표","역물음표","스페인어","inverted question mark","spanish"],
        "name": { "ko": "거꾸로 된 물음표", "en": "Inverted Question Mark" },
        "usage": { "ko": "스페인어에서 의문문의 시작을 표시합니다.", "en": "Opens a question in Spanish (paired with ?)." },
        "examples": { "ko": ["¿Cómo estás?", "¿Qué hora es?"], "en": ["¿Cómo estás?", "¿Dónde?"] }
      },
      {
        "id": "u203b", "char": "※", "category": "punctuation",
        "keywords": ["당구장표시","당구장 표시","참고표","참조표","주석","reference mark","komejirushi"],
        "name": { "ko": "참고표 (당구장 표시)", "en": "Reference Mark" },
        "usage": { "ko": "주석이나 참고·주의 사항을 강조해 표시할 때 씁니다. 흔히 ‘당구장 표시’라고 불립니다.", "en": "Flags a note or caveat preceding a supplementary remark." },
        "examples": { "ko": ["※ 우천 시 행사는 취소됩니다.", "※ 주의: 반품 불가"], "en": ["※ Subject to change.", "※ Note: non-refundable"] }
      },
      {
        "id": "u0040", "char": "@", "category": "legal",
        "keywords": ["앳","골뱅이","at","email","이메일","멘션","앳사인","commercial at"],
        "name": { "ko": "앳 (골뱅이)", "en": "At Sign" },
        "usage": { "ko": "이메일 주소에서 아이디와 도메인을 구분하거나 SNS에서 사용자를 멘션할 때 씁니다.", "en": "Separates the user from the domain in an email address; mentions a user on social media." },
        "examples": { "ko": ["jurepi@example.com", "@사용자이름"], "en": ["name@example.com", "@username"] }
      },
      {
        "id": "u2776", "char": "❶", "category": "circled",
        "keywords": ["검은원숫자","원숫자","번호","순서","circled number","negative circled one"],
        "name": { "ko": "검은 원 숫자 1", "en": "Black Circled Number 1" },
        "usage": { "ko": "단계·순위·목록 번호를 눈에 띄게 표시할 때 씁니다. 검은 원에 흰 숫자 형태입니다.", "en": "Marks ordered steps, ranks, or list numbers with emphasis (white digit on a black disc)." },
        "examples": { "ko": ["❶ 준비 ❷ 실행 ❸ 점검", "추천 순위 ❶"], "en": ["❶ Prep ❷ Run ❸ Check", "Rank ❶"] }
      }
    ]
    ```
  </symbol_record_samples>
  <performance>카탈로그는 이 도구 라우트에서만 동적 import되어 ko+en 문자열이 사이트 전역에 출하되는 전역 i18n 번들에 절대 들어가지 않음. 인트로/how-to/FAQ는 가능한 한 서버 렌더; 그리드 + 상세 패널만 클라이언트 인터랙티브 표면으로 유지. 200+ 타일을 가상화 없이(가벼운 버튼) 렌더하되, 필터 목록과 타일별 렌더를 메모이즈해 타이핑을 빠르게; 검색 디바운스 120ms.</performance>
  <testing_strategy>
    - 단위(Vitest, lib/special-symbol ≥80%): 코드포인트/id/엔티티 도출(단일 + 다중 코드포인트, NFC, 명명-대-십진); 검색 매칭(이름, 키워드, 원문자, 코드포인트 hex, 발음부호/대소문자 무시, 빈 query 통과); 최근 push/dedupe/cap; toggleFavorite 추가/제거; zod 파싱 + pruneUnknown; 데이터셋 커버리지(도출 일치, 유일 id, ko/en 이름+사용법+예시 ≥1).
    - 컴포넌트: SymbolTile 클릭=복사+선택 vs 호버/포커스=미리보기; 복사 플래시; 즐겨찾기 토글; CategoryTabs와 검색 결합; 빈 상태; 클립보드 부재 모킹의 복사 폴백 경로; localStorage 비활성 인메모리 동작.
    - E2E(Playwright): 시나리오 1–5; 최근/즐겨찾기 리로드 영속화; 로케일 ko/en 기호 콘텐츠 교체; 키보드 전용 동작(/, 방향키, Enter, f, Esc); 복사 폴백 모달; 비주얼 회귀 320/768/1024 양 테마; HTML 엔티티 문자열이 (주입 마크업이 아닌) 리터럴 텍스트로 렌더되는지 검증.
    - A11y: axe + 키보드 로빙 그리드 + aria-live 복사 상태 + 모션 감소.
  </testing_strategy>
</key_implementation_notes>

</project_specification>
```
