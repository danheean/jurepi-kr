# Jurepi — 플랫폼 및 메인 대시보드 SPEC (SPEC_KR)

> 이 문서는 [`SPEC.md`](SPEC.md)의 한국어 번역본입니다. 원본(영문)이 정본이며, 내용 변경 시 두 문서를 함께 갱신하세요.
>
> 무료 온라인 도구 모음 사이트(jurepi.kr)의 **플랫폼 + 메인 화면** 빌드 사양입니다.
> 메인 화면은 유용한 프로그램을 카드 형태로 보여주고 선택하는 대시보드(도구 디렉터리)입니다.
> 개별 도구의 상세 사양은 각 서비스 SPEC에 분리되어 있습니다:
> - 사다리타기(Ghost Leg): [`services/game/ghost-leg/SPEC_KR.md`](services/game/ghost-leg/SPEC_KR.md) (영문 정본: [`SPEC.md`](services/game/ghost-leg/SPEC.md))
>
> 시각 기준(디자인 시스템)은 [`DESIGN.md`](DESIGN.md)를 단일 소스로 참조합니다. 본 SPEC의 토큰 값은 DESIGN.md와 1:1로 일치합니다.

```xml
<project_specification>

<project_name>Jurepi 플랫폼 - 무료 온라인 도구 허브 (메인 대시보드 + 공유 쉘)</project_name>

<overview>
Jurepi (jurepi.kr)는 무료 온라인 도구 허브입니다. 본 명세서(Specification, SPEC)는 **플랫폼** 영역을 다룹니다. 플랫폼은 메인 대시보드 화면(유용한 프로그램들을 카드 그리드 형태로 보여주는 디렉터리)과 공유 애플리케이션 쉘(Shared Application Shell), 도구 레지스트리(Tool Registry), 검색엔진 최적화(Search Engine Optimization, SEO) 인프라, 다국어 지원(Internationalization, i18n), 수익화, 그리고 약관/개인정보 처리방침 등의 정적 페이지를 포함합니다. 개별 도구는 고유한 서비스 SPEC에 상세히 기술되어 있으며 이 쉘에 마운트(Mount)됩니다.

메인 화면은 대시보드 구조입니다. 눈에 잘 띄는 검색 바와 카테고리 필터가 포함된 히어로(Hero) 영역, 그리고 반응형 도구 카드 그리드로 구성됩니다. 각 카드는 강조색이 적용된 아이콘, 이름, 짧은 설명을 보여주는 탭 가능한 객체입니다. 활성화된(Live) 카드를 선택하면 해당 도구 페이지로 이동합니다. 카드 그리드는 타입 정의가 완료된 도구 레지스트리로부터 100% 생성되므로, 새 도구를 추가하는 것은 레지스트리에 항목 하나를 추가하는 것(+ 개별 서비스 SPEC 및 모듈 추가)을 의미합니다. 즉, 메인 화면을 재설계하지 않고도 허브를 쉽게 확장할 수 있습니다.

런칭 시 탑재될 첫 도구는 **사다리타기(Ghost Leg)**이며, docs/services/game/ghost-leg/SPEC.md에 별도로 규정되어 있습니다. 런칭 시점의 그리드는 사다리타기 카드를 활성("Live") 상태로 보여주고, 다른 도구들은 클릭할 수 없는 준비중("Coming soon") 카드로 보여줄 수 있습니다.

**핵심 제약 사항:** **애플리케이션 백엔드 및 데이터베이스가 없는** 완전한 **정적 페이지(Static Site Generation, SSG)** 형태의 Next.js 앱 라우터(App Router)로 렌더링되어야 합니다. 도구 레지스트리는 컴파일 타임(Compile-time) 모듈이며, 사용자 설정 및 동의 정보는 `localStorage`에 저장됩니다. 외부 네트워크 의존성은 Google AdSense, 동의 관리 플랫폼(Consent Management Platform, CMP), 선택적인 Google Analytics, 자체 호스팅 폰트뿐입니다. 어떠한 정적/에지 호스팅 서비스에도 배포할 수 있어야 합니다.

**핵심 지표:** 검색 트래픽이 성장의 원동력입니다. 모든 도구는 인덱싱 가능한 고유 URL을 가지며(도구별로 규정), 메인 화면과 쉘은 코어 웹 바이탈(Core Web Vitals) 성능을 저해해서는 안 됩니다 (CLS < 0.1 준수, 광고 영역 높이 미리 확보).
</overview>

<scope_boundaries>
  <in_scope>
    - 메인 대시보드 화면: 히어로, 검색, 카테고리 필터, 반응형 도구 카드 그리드, 결과 없음(Empty) 상태
    - 타입 안전한 도구 레지스트리 (그리드, 사이트맵, 정적 파라미터, 검색을 위한 단일 진실 공급원)
    - 공유 애플리케이션 쉘: 헤더(워드마크, 검색, 언어 변경, 테마 토글), 푸터
    - 동적 도구 경로 `/[locale]/tools/[slug]`: 일치하는 도구 모듈을 마운트 (도구 내부 로직은 개별 SPEC 참고)
    - 다국어 지원(i18n): next-intl을 통한 한국어(기본값) + 영어 지원, 언어 코드가 포함된 URL 경로, 언어 전환기
    - 테마 기능: 라이트 테마(기본값) + 어두운 테마(다크 모드) 토글, 깜빡임 없는(Flash-free) SSR 지원
    - 수익화: Google AdSense 광고 슬롯 (헤더/푸터) + 동의 플로우(Consent Flow) + 쿠키 배너
    - SEO 인프라: sitemap.xml, robots.txt, manifest, canonical/hreflang 링크, WebSite JSON-LD, 기본 오픈 그래프(OG) 메타데이터
    - 정적 정보 및 안내 페이지: 소개(About), 개인정보 처리방침(Privacy), 이용약관(Terms), 문의하기(Contact)
    - 404 페이지 / 에러 바운더리(Error Boundaries) / 토스트(Toast) 알림 시스템
  </in_scope>
  <out_of_scope>
    - 개별 도구의 내부 로직 (각 도구는 자체 서비스 SPEC를 가짐 — 예: 사다리타기 게임)
    - 백엔드 서버, 데이터베이스, 사용자 인증 및 계정 기능
    - 결제 기능 및 프리미엄 등급 (완전 무료 사이트)
    - 네이티브 모바일 앱 (반응형 웹으로만 지원)
    - 관리자 웹 화면 및 CMS (도구 추가는 코드 상의 레지스트리 수정을 통해 수행됨)
  </out_of_scope>
  <future_considerations>
    - 레지스트리를 통한 추가 도구 도입: 랜덤 추첨, 주사위/동전 던지기, 타이머, 단위 변환기, 카운터, QR 코드 생성기, 색상 추출기 (2단계 이상)
    - `localStorage`를 활용한 "최근 사용 / 즐겨찾기" 기능 (2단계)
    - 준비중(Coming-soon) 카드에서 사용자 관심도 수집 기능 (2단계)
    - 다크 모드 최적화 및 고도화 (2단계), 일본어/중국어 등 추가 언어 확장 (3단계)
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <frontend_application>
    <framework>Next.js 15 (App Router, React 19), TypeScript 5.7 strict</framework>
    <rendering>generateStaticParams를 사용한 정적 사이트 생성(SSG). 기본적으로 서버 컴포넌트(Server Components)로 렌더링하며, 인터랙티브한 도구 UI는 클라이언트 컴포넌트(Client Components)로 처리</rendering>
    <styling>CSS 커스텀 속성 토큰에 기반한 Tailwind CSS v4.0 (src/styles/tokens.css ↔ DESIGN.md)</styling>
    <i18n>next-intl v3.x — 지원 언어 ["ko", "en"], 기본 언어 "ko", localePrefix "always"</i18n>
    <state_management>React 상태(State) 및 컨텍스트(Context) 활용 (테마, 동의 여부, 토스트 알림). 플랫폼 레벨의 전역 상태 관리 도구는 사용하지 않음</state_management>
  </frontend_application>
  <data_layer>
    <tool_registry>컴파일 타임 TS 모듈 src/tools/registry.ts (ToolMeta[] 배열 형태). 데이터베이스 사용 안 함</tool_registry>
    <persistence>localStorage만 사용 (테마 설정, 동의 여부). 백엔드 서버 및 데이터베이스 없음</persistence>
    <note>핵심 제약: 백엔드 API 및 DB는 일절 사용하지 않음.</note>
  </data_layer>
  <libraries>
    <icons>lucide-react v0.468 (선 두께 stroke 1.75)</icons>
    <search>의존성 없는 자체 토큰/부분 문자열 매칭 알고리즘을 우선 적용하고, 필요 시에만 fuse.js v7.x 도입</search>
    <fonts>Pretendard Variable (UI/본문용) + Gmarket Sans (헤드라인/워드마크용) 로컬 웹폰트, font-display: swap 설정 적용</fonts>
    <ids>nanoid v5.1 (일시적인 고유 ID가 필요한 도구에서 사용)</ids>
  </libraries>
  <monetization>
    <ads>수동 Google AdSense 광고 단위 (&lt;ins class="adsbygoogle"&gt;), 사용자 동의 획득 후 브라우저 유휴 시간(Idle)에 로드</ads>
    <consent>EEA/UK 지역에는 구글 인증 동의 관리 플랫폼(CMP) 제공, 그 외 지역에는 가벼운 자체 쿠키 배너 제공</consent>
  </monetization>
  <analytics>Google Analytics 4 (gtag) — 선택 사항이며, 사용자 동의 시에만 활성화</analytics>
</technology_stack>

<prerequisites>
  <environment_setup>
    - Node.js v20 이상, pnpm v9 (권장) 또는 npm v10
    - 최신 브라우저 (Chrome 100+, Firefox 100+, Safari 15+ 이상)
    - Google AdSense 계정 및 프로덕션 광고 송출을 위한 승인된 게시자 ID(Publisher ID)
  </environment_setup>
  <build_configuration>
    - TS strict 모드, @tailwindcss/postcss가 적용된 Tailwind v4, CSS 변수로 정의되어 Tailwind 테마가 참조하는 디자인 토큰
    - 경로 별칭(Path Alias) 설정: `@/*` → `src/*`, next.config.ts의 next-intl 플러그인 연동, localePrefix "always" 설정
    - ESLint (next/core-web-vitals) 및 Prettier 포맷터 적용
  </build_configuration>
</prerequisites>

<environment_variables>
  <variable>
    <name>NEXT_PUBLIC_SITE_URL</name>
    <description>표준(Canonical) 절대 경로 베이스 URL (캐노니컬 태그, 사이트맵, 오픈 그래프 등에 사용). 공개 변수.</description>
    <required>true</required>
    <example>https://jurepi.kr</example>
  </variable>
  <variable>
    <name>NEXT_PUBLIC_ADSENSE_CLIENT</name>
    <description>AdSense 게시자 클라이언트 ID (Publisher ID). 공개 변수.</description>
    <required>false</required>
    <example>ca-pub-0000000000000000</example>
    <note>해당 환경 변수가 설정되고 사용자가 동의한 경우에만 광고가 렌더링됩니다. 단, 광고 슬롯의 높이는 항상 확보해 둡니다.</note>
  </variable>
  <variable>
    <name>NEXT_PUBLIC_GA_ID</name>
    <description>GA4 측정 ID. 공개 변수. 동의 획득 후에만 스크립트 로드.</description>
    <required>false</required>
    <example>G-XXXXXXXXXX</example>
  </variable>
  <variable>
    <name>NEXT_PUBLIC_DEFAULT_LOCALE</name>
    <description>/ 경로 접속 시 리다이렉트할 기본 언어 설정.</description>
    <required>false</required>
    <example>ko</example>
  </variable>
  <note>핵심 제약: 서버 비밀 키(Secrets)는 존재하지 않으며, 모든 NEXT_PUBLIC_* 변수는 안전하게 클라이언트에 노출 가능한 값입니다.</note>
</environment_variables>

<file_structure>
src/
├── app/
│   ├── layout.tsx                  # 루트 <html lang> 설정, 폰트 변수, 기본 메타데이터, 테마 부트스트랩
│   ├── globals.css                 # Tailwind 임포트 및 디자인 토큰 브릿지
│   ├── sitemap.ts                  # 모든 활성 도구 × 언어 및 정적 페이지의 사이트맵 항목 생성
│   ├── robots.ts
│   ├── manifest.ts
│   └── [locale]/
│       ├── layout.tsx              # 다국어 프로바이더, 헤더, 푸터, 동의 쿠키 배너
│       ├── page.tsx                # ★ 메인 대시보드 화면 (히어로 + 도구 카드 그리드)
│       ├── not-found.tsx
│       ├── tools/[slug]/page.tsx   # SSG 페이지; 슬러그에 매칭되는 도구 모듈 마운트 (도구 내부 사양은 개별 SPEC 참고)
│       ├── about/page.tsx
│       ├── privacy/page.tsx
│       ├── terms/page.tsx
│       └── contact/page.tsx
├── components/
│   ├── ui/                         # 공통 컴포넌트: 버튼, 아이콘 버튼, 텍스트 입력창, 토글, 배지, 카드, 모달, 토스트, 빈 화면
│   ├── layout/                     # 레이아웃: 헤더, 푸터, 언어 선택기, 테마 토글, 동의 배너
│   ├── home/                       # 메인 화면용: 히어로, 검색창, 카테고리 필터, 도구 그리드, 도구 카드
│   └── ads/                        # 광고 슬롯 컴포넌트
│   └── tools/                      # 도구별 폴더 (각 도구 SPEC 참조) — 예: ladder/
├── tools/
│   ├── registry.ts                 # ToolMeta[] 레지스트리 — 플랫폼의 단일 진실 공급원
│   └── types.ts
├── i18n/
│   ├── routing.ts                  # 다국어 설정 (locales, defaultLocale, localePrefix)
│   ├── request.ts
│   └── messages/{ko,en}.json       # 플랫폼 다국어 번역 키 + 도구별 네임스페이스 (tools.<id>.*)
├── lib/
│   ├── seo.ts                      # SEO 헬퍼: buildMetadata, websiteJsonLd
│   ├── consent.ts
│   ├── analytics.ts
│   └── utils.ts                    # 유틸리티: cn(), 검색 매칭 함수, clamp
├── hooks/
│   ├── useReducedMotion.ts
│   ├── useLocalStorage.ts
│   └── useConsent.ts
└── styles/
    └── tokens.css                  # 디자인 토큰 파일 (DESIGN.md 사양 반영)
</file_structure>

<core_data_entities>
  <tool_meta>
    컴파일 타임 레지스트리 항목 정의 (src/tools/types.ts). 텍스트 번역 데이터는 i18n messages의 id 키 하위에 위치합니다.
    - id: string (고유 식별 키, 예: "ladder")
    - slug: string (URL 경로 세그먼트, 예: "ladder")
    - category: enum ('random', 'calculator', 'text', 'converter', 'fun', 'dev')
    - icon: string (Lucide 아이콘 이름)
    - accent: enum ('coral', 'mint', 'sky', 'sun', 'grape', 'rose') — 카드의 아이덴티티 강조색 결정
    - status: enum ('live', 'coming_soon')
    - isNew: boolean (기본값 false) — "NEW" 배지 활성화 여부
    - isPopular: boolean (기본값 false) — "인기" 배지 활성화 여부, 최상단 고정 가능
    - order: number (수동 정렬 가중치)
    - keywords: string[] (검색 및 SEO용 키워드 배열, 로컬라이즈된 키워드는 번역 메시지 파일에서 분석하여 처리)
    참고: 카드의 이름 및 설명(name/description)은 렌더링 시점에 messages[`tools.${id}.*`] 파일에서 불러와 다국어로 매핑됩니다.
  </tool_meta>
  <user_preferences>
    localStorage 전용 데이터입니다.
    - jurepi-theme: enum ('light', 'dark', 'system') — 기본값 "light"
    - jurepi-consent: { ads: boolean; analytics: boolean; ts: number } | null
  </user_preferences>
  <note>개별 도구의 런타임 상태(예: 사다리타기 게임 진행 상태)는 본 플랫폼 SPEC가 아닌 개별 도구의 SPEC에 정의됩니다.</note>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/" redirect="/ko" status="307" />
    <route path="/:locale" page="HomePage (메인 대시보드)" />
    <route path="/:locale/tools/:slug" page="ToolPage (도구 모듈 마운트 페이지)" />
    <route path="/:locale/about" page="AboutPage (소개)" />
    <route path="/:locale/privacy" page="PrivacyPage (개인정보 처리방침)" />
    <route path="/:locale/terms" page="TermsPage (이용약관)" />
    <route path="/:locale/contact" page="ContactPage (문의하기)" />
  </public_routes>
  <generated>
    <route path="/sitemap.xml" handler="app/sitemap.ts" />
    <route path="/robots.txt" handler="app/robots.ts" />
    <route path="/manifest.webmanifest" handler="app/manifest.ts" />
  </generated>
  <rules>
    - `/:locale/tools/:slug` 경로 생성을 위한 `generateStaticParams`는 레지스트리 내 `status === 'live'`인 도구들과 지원 언어들의 곱집합을 순회하여 빌드합니다.
    - 준비중(`coming_soon`) 상태인 도구는 라우트가 생성되지 않으며, 카드는 클릭 불가능하게 처리됩니다.
    - 레지스트리에 없는 슬러그(slug)로 접근하면 다국어가 적용된 404 안내 페이지를 보여줍니다.
    - 사다리타기 게임의 공식 URL 슬러그는 "ladder" 입니다 (내부 소스코드 상의 모듈명은 ghost-leg).
  </rules>
</route_definitions>

<component_hierarchy>
  <app_root>
    <html lang={locale}>
      <locale_layout>   <!-- NextIntlClientProvider → ThemeProvider → ConsentProvider → ToastProvider -->
        <header>        <!-- sticky 64px 높이 고정 -->
          <wordmark /> <search_trigger /> <locale_switcher /> <theme_toggle />
        </header>
        <main>
          <home_page>            <!-- ★ 메인 대시보드 화면 -->
            <hero> <eyebrow /> <h1 /> <subhead /> <search_bar /> </hero>
            <ad_slot variant="leaderboard" />
            <category_filter />  <!-- 필터 알약 버튼 행 -->
            <tool_grid> <tool_card /> ... </tool_grid>
          </home_page>
          <tool_page>            <!-- 도구 모듈을 감싸는 레이아웃, 브레드크럼 제공, 내부 세부 로직은 도구별 SPEC에 따름 -->
            <breadcrumb />
            <tool_module />       <!-- 예: <LadderGame/> (ghost-leg SPEC 참고) -->
            <ad_slot variant="in_content" />
          </tool_page>
        </main>
        <ad_slot variant="footer" />
        <footer />
        <consent_banner />
      </locale_layout>
    </html>
  </app_root>
  <shared>
    <button /> <text_input /> <toggle /> <badge /> <card /> <modal /> <toast /> <empty_state /> <ad_slot />
  </shared>
  <provider_order>NextIntlClientProvider → ThemeProvider → ConsentProvider → ToastProvider</provider_order>
</component_hierarchy>

<pages_and_interfaces>
  <global_layout>
    <header>
      - 높이 64px, 고정 위치(sticky), 배경색 `var(--surface)`, 하단 테두리 1px `var(--hairline)`. 스크롤이 발생하면 배경의 투명도를 0.8로 지정하고 백드롭 블러(backdrop-filter blur 8px) 효과 적용
      - 좌측 영역: "Jurepi" 워드마크, Gmarket Sans 22px/700, 색상 `var(--brand)`, 클릭 시 `/[locale]` 경로로 이동
      - 우측 영역 (간격 8px): 검색 아이콘 버튼, 언어 선택기(LocaleSwitcher, KO/EN), 테마 토글(해/달 아이콘)
      - 탭/터치 영역은 최소 44px 이상 확보, 키보드 포커스 스타일은 2px 굵기의 `var(--brand)` 및 offset 2px 외곽선 적용
    </header>
    <footer>
      - 배경색 `var(--surface-muted)`, 여백(padding) 상하 48px, 좌우 24px
      - 워드마크 및 태그라인 제공, 관련 링크(소개/개인정보 처리방침/이용약관/문의) 제공, 언어 선택 기능 제공, 동의 모달을 다시 열 수 있는 링크 배치
      - 하단 카피라이트 문구: "© 2026 Jurepi · 모든 도구는 무료입니다." font-size 13px, 색상 `var(--text-muted)`
    </footer>
    <container>최대 너비 1120px 가운데 정렬, 가로 패딩은 데스크톱 24px → 모바일 16px로 반응형 조절</container>
  </global_layout>

  <home_page note="메인 대시보드 화면 — 카드 그리드 대시보드">
    <hero>
      - 가운데 정렬, 패딩 데스크톱 상하 64px/좌우 40px (모바일 상하 40px/좌우 24px)
      - 눈썹문구(Eyebrow): "무료 온라인 도구" / "Free online tools" — 12px/700 대문자 스타일, 자간 0.6px, 색상 `var(--brand)`
      - 메인 타이틀 H1: "필요한 도구, 전부 무료로." / "Handy tools, all free." — Gmarket Sans 글꼴, 글자 크기 유동형 clamp(32px, 6vw, 56px)/두께 700, 줄높이 1.1
      - 서브헤드(Subhead): 한 줄로 표현, 16–18px 크기, 색상 `var(--text-secondary)`, 최대 너비 540px 제한
      - 검색창(SearchBar): 높이 56px, 둥근 모서리 반지름 `var(--radius-xl)` (20px), 앞부분 검색 돋보기 아이콘 배치, 플레이스홀더 "도구 검색…" / "Search tools…"
      - 데코레이션: 히어로 배경에 불투명도가 낮고 마우스 이벤트가 무시되는(pointer-events: none) 장식용 색상 그라데이션 블롭 배치, 동작 줄이기(prefers-reduced-motion) 활성화 시 애니메이션을 끄고 정적으로 렌더링
    </hero>
    <category_filter>
      - 가로 스크롤 형태의 알약 모양 버튼 바, 모바일에서는 스크롤 스냅(Scroll-snap) 기능 적용 (스크롤바는 숨김)
      - 레지스트리에 실제로 존재하는 카테고리만 동적으로 추출하여 구성: "전체", "랜덤/추첨", "계산기", "텍스트", "변환", "재미"
      - 선택(Active)된 버튼: 배경 `var(--brand)`, 텍스트 색상 `#FFF`. 비선택 버튼: 배경 `var(--surface-muted)`, 텍스트 `var(--text-secondary)`. 마우스 호버 시 배경색이 미세하게 밝아짐
      - 필터를 클릭하면 클라이언트 단에서 그리드가 실시간 필터링되며, URL 쿼리 파라미터 `?cat=`에 즉시 반영됨
    </category_filter>
    <tool_grid>
      - 그리드 열 구조: 모바일(너비 480px 미만) 1열, 480–767px 2열, 768–1023px 3열, 데스크톱(1024px 이상) 4열 구성, 카드 간 간격(gap) 20px
      - 정렬 순서: 인기 도구(`isPopular === true`)가 우선 배치 → 정렬 순서 가중치(`order`) 오름차순 → 준비중(`coming_soon`)인 카드가 가장 마지막에 위치
      - 결과 없음(Empty): 검색 결과가 없을 경우 EmptyState 일러스트 + "검색 결과가 없어요" 문구 + 필터 및 검색어 초기화 버튼 표시
    </tool_grid>
    <tool_card>
      - 카드 배경 `var(--surface)`, 1px 두께 테두리 `var(--hairline)`, 둥근 모서리 `var(--radius-xl)` (20px), 안쪽 여백(padding) 20px, 최소 높이 150px, 그림자 `--shadow-card` 적용
      - 아이콘 타일 영역: 크기 48px, 둥근 모서리 `var(--radius-lg)` (16px), 배경색은 카테고리별 강조색에 `*-soft` 투명도가 가미된 톤 사용, 아이콘 그래픽은 채도가 높은 강조색 적용, Lucide 아이콘 24px 크기로 렌더링
      - 제목 17px/두께 700 `var(--text)`, 설명글 14px/두께 500 `var(--text-secondary)`, 최대 2줄을 넘어가면 말줄임표(...) 처리
      - 카드 우상단 배지: NEW(민트색), 인기(노란색/sun), 준비중(차분한 회색 아웃라인 배지)
      - 마우스 호버 피드백(활성 카드): 위로 4px 이동(`translateY(-4px)`), 그림자 효과 전환 `--shadow-card-hover`, 테두리 색상 `var(--brand-soft)`로 부드럽게 변경 (전환 시간 200ms 및 `--ease-out` 감속 적용). 꾹 누를 때(Press) `translateY(-1px)` 및 99% 스케일로 축소. 키보드 포커스 접근 시 2px 두께의 브랜드 색상 테두리 링 노출
      - 준비중(`coming_soon`) 카드 피드백: 불투명도 0.7 적용, 마우스 호버 시 들림(Lift) 효과 없음, 마우스 커서 기본 포인터 상태 유지, "준비중" 배지 고정 노출
      - 활성화된 도구 카드는 카드 전체가 Next.js Link 컴포넌트로 동작하여 클릭 시 즉시 도구 상세 화면으로 이동
    </tool_card>
    <not_found>다국어화된 404 화면 — 친근한 일러스트 이미지 + "페이지를 찾을 수 없어요" 문구 + 메인 대시보드로 이동하는 버튼 제공</not_found>
    <legal_pages>소개 / 개인정보 처리방침 / 이용약관 / 문의하기 페이지 — 최대 너비 720px의 심플하고 가독성 높은 레이아웃, 헤드라인은 Gmarket Sans 폰트 사용. 개인정보 처리방침과 이용약관 문서에는 AdSense 및 GA 쿠키 수집 안내와 쿠키 동의 재설정 방법이 반드시 고지되어야 함</legal_pages>
  </home_page>

  <keyboard_shortcuts_reference>
    - "/" 입력 키 → 메인 화면 검색창으로 즉시 포커스 이동
    - Esc 키 → 검색 오버레이 레이어 닫기 / 개인정보 수집 동의 디테일 팝업 닫기 / 모달 팝업 닫기
    - Tab 이동 포커스 순서: 헤더 컨트롤 버튼들 → 카테고리 필터 알약 버튼들 → 도구 그리드 카드들 (DOM 문서 구조 정렬 순서 준수)
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <tool_hub>
    - 레지스트리 기반 그리드: ToolGrid 컴포넌트가 레지스트리를 맵핑하여 렌더링. 새 도구를 배포할 때는 ToolMeta 정의를 기입하고, i18n 번역 파일을 채운 후, (활성 도구인 경우) 컴포넌트 모듈을 등록하고 전용 SPEC를 연동하는 것으로 완료. 준비중(coming_soon) 도구는 ToolMeta만 채워 넣으면 자동으로 그리드에 노출됨
    - 카테고리 필터 + 로컬라이즈된 이름/설명/키워드를 대상으로 클라이언트단에서 검색 기능 수행 (120ms 디바운스 적용)
    - 필터와 검색 상태는 브라우저 URL 쿼리 스트링에 실시간 동기화되어 공유 및 뒤로 가기 동작이 매끄럽게 호환됨
    - 활성화된(Live) 카드를 클릭하면 즉시 `/[locale]/tools/[slug]` 상세 경로로 라우팅됨
  </tool_hub>
  <i18n>화면에 표시되는 모든 텍스트 문자열은 `messages/{ko,en}.json` 리소스를 파싱하여 바인딩함. 언어 전환 시 경로와 URL 쿼리 파라미터가 유실 없이 보존되며, DOM `<html>` 요소의 `lang` 속성이 동적으로 갱신됨</i18n>
  <theming>라이트 테마 기본 제공. 라이트/다크/시스템 설정 전환 및 브라우저 영구 저장. 최초 사이트 진입 시 화면이 깜빡이지 않도록 렌더링 전에 인라인 스크립트로 상태를 주입하는 부트스트랩 코드 탑재</theming>
  <consent>최초 방문자에게 동의 배너 팝업 자동 노출. 선택 사항은 localStorage에 보관되며 동의하지 않은 광고/분석 스크립트는 원천 차단됨. 푸터 영역의 재설정 링크를 통해 언제든지 동의 여부를 수정할 수 있음</consent>
</core_functionality>

<error_handling>
  <user_facing>
    <toast_notifications>성공 알림: `var(--success)` 테마색으로 2.5초간 노출 후 소멸. 에러 알림: `var(--danger)` 테마색으로 화면에 고정 표시되며 수동 닫기 가능. 화면에는 최대 3개까지 스택형으로 쌓이며, 모바일에서는 하단 중앙, 데스크톱에서는 하단 우측에 렌더링. 화면 연출 최적화(prefers-reduced-motion) 활성화 시 이동 모션 없이 부드러운 페이드인/아웃으로만 전환</toast_notifications>
    <error_pages>다국어가 처리된 404 에러 화면 제공. 특정 도구의 렌더링 에러가 발생하더라도 도구 마운트 지점을 감싸는 에러 바운더리(Error Boundary)가 에러를 캡처하여 개별 도구 영역 내에 친근한 복구/재시도 버튼을 띄우며, 전체 쉘이나 다른 영역의 오작동 및 완전 다운 현상을 원천 방지함</error_pages>
  </user_facing>
  <runtime>
    <localstorage>시크릿 모드 브라우징이나 브라우저 용량 초과로 인한 `localStorage` 접근 에러 발생 시, 예외 처리를 거쳐 테마 설정 및 개인정보 동의 정책이 메모리 임시 변수로 안전하게 폴백(Fallback)되어 정상 가동 상태를 유지하도록 설계</localstorage>
  </runtime>
  <ads>AdSense 라이브러리 로드 실패 혹은 광고 차단 프로그램(AdBlock) 감지 시, AdSlot 컴포넌트는 레이아웃을 깨뜨리지 않고 빈 영역으로 축소(Collapse)되며 본문 콘텐츠 소비 흐름을 방해하지 않음</ads>
  <note>백엔드 API 호출이 없으므로 플랫폼 전체 수준에서의 서버 API 연동 에러 처리는 고려하지 않음.</note>
</error_handling>

<third_party_integrations>
  <integration name="Google AdSense">
    <purpose>광고 노출을 통한 수익 창출 (수익화)</purpose>
    <sdk>Next.js Script 컴포넌트 (`strategy="lazyOnload"` 적용), 사용자가 광고 쿠키 활용에 동의한 이후에만 동적으로 로드함</sdk>
    <ad_slots>리더보드 슬롯 (메인 화면, 히어로 영역 아래): 모바일 90px, 데스크톱 최대 250px 높이 사전 예약. 푸터 슬롯 (모든 페이지의 하단): 90px 높이 예약. 본문 슬롯 (도구 상세 페이지 내부): 최소 250px 이상 높이 예약 (도구의 SPEC 설계에 맞춰 콘텐츠 중간에 삽입)</ad_slots>
    <rules>핵심 규정: 누적 레이아웃 이동(CLS) 지표 향상을 위해 광고가 로드되기 전에 레이아웃 높이를 고정값으로 강제 확보해야 함. 광고가 메인 H1 타이틀보다 위쪽에 렌더링되어서는 안 됨. 쿠키 활용 동의 여부가 참(`consent.ads === true`)이 되기 전까지는 광고 스크립트를 로드하거나 구동할 수 없음</rules>
  </integration>
  <integration name="Consent CMP">
    <purpose>유럽 경제 지역(EEA) 및 영국(UK)의 GDPR/ePrivacy 규정 준수를 위한 개인정보 수집 및 동의 정보의 법적 근거 마련</purpose>
    <flow>사용자가 사이트에 처음 방문하면 ConsentBanner("수락"/"거부"/"설정")를 띄우고, 선택값은 localStorage에 즉시 기록하며 동의 여부에 따라 서드파티 스크립트 실행을 통제함. 푸터에 재오픈 버튼을 제공하여 사후 변경이 언제든 가능하도록 설정</flow>
  </integration>
  <integration name="Google Analytics 4" optional="true">
    <events>도구 오픈 시점(`tool_open`, 파라미터: slug), 언어 전환(`locale_switch`), 검색 질의어(`search_query`, 개인 식별 정보는 제외함). 단, `consent.analytics === true` 상태인 경우에만 트래킹 작동</events>
  </integration>
  <integration name="Web Fonts">자체 호스팅 방식으로 Pretendard 및 Gmarket Sans 글꼴을 `next/font/local` 로 처리하여 로컬 서브셋 글꼴 파일로 보관. `font-display: swap` 옵션을 활성화하고 첫 화면에 반드시 필요한 메인 글꼴 굵기(Weight) 파일 위주로 프리로드(Preload) 처리하여 로딩 속도 최적화</integration>
</third_party_integrations>

<aesthetic_guidelines>
  <source>핵심 가이드: DESIGN.md는 플랫폼의 디자인 토큰과 개별 컴포넌트의 스타일 사양을 규정하는 유일한 단일 소스 원칙을 가집니다. `src/styles/tokens.css` 파일은 DESIGN.md의 사양을 1:1로 정확하게 미러링하여 반영합니다. 아래 사항은 플랫폼 레이아웃의 필수 미학 요약본입니다.</source>
  <direction>밝고, 친근하며, 경쾌하고 활력 있는 라이트 테마를 메인으로 지향합니다. 깨끗한 흰색 바탕에 은은하게 퍼지는 브랜드 톤의 소프트 그림자(Shadow)를 가미한 카드 레이아웃을 사용합니다. 6개의 카테고리별 개성 넘치는 포인트 컬러를 각 카드의 아이덴티티 강조색으로 부여하며, 기본 버튼 및 링크 등의 클릭 요소는 브랜드 허니골드(#f5a623) 컬러로 고정 통일합니다.</direction>
  <main_screen_usage>
    - 히어로 타이틀(H1) 영역은 Gmarket Sans 폰트를 활용하여 개성 있고 뚜렷하게 연출하며, 본문과 인터페이스 요소에는 Pretendard 글꼴을 공통 적용합니다.
    - 도구 카드의 아이콘 타일 배경과 배지 영역은 해당 도구가 속한 카테고리의 지정 강조색(coral/mint/sky/sun/grape/rose) 소프트 컬러를 영리하게 녹여내어 개성을 살리고, CTA 및 실행 버튼은 통일된 브랜드 허니골드 계열을 일관되게 사용합니다.
    - 활성 카드는 호버 시 부드러운 들림 피드백(`--shadow-card` → `--shadow-card-hover`) 효과와 함께 4px만큼 위로 올라가는 트랜지션 모션을 주며, 클릭하는 순간 99% 비율 스케일 감소 처리와 테두리에 브랜드 테마 아웃라인 포커스 링을 노출하여 확실한 햅틱 감성을 부여합니다.
    - 레이아웃 섹션 간의 여백 리듬은 48–64px 규격을 엄수하며, 그리드 카드 간의 간격은 20px로 정렬하고 전체 콘텐츠 최대 감싸기 너비는 1120px 규격으로 중심에 배치합니다.
  </main_screen_usage>
  <responsive>브레이크포인트 규격: ~479px(1열) / 480–767px(2열) / 768–1023px(3열) / 1024px 이상(4열 구성, 최대 1120px 너비 제한). 헤더 영역은 모바일에서도 햄버거 메뉴 버튼을 도입하지 않고, 아이콘들을 콤팩트하게 나열하는 툴바 형태를 유지합니다. 클릭 가능한 최소 타깃 영역은 44px 이상을 상시 보장합니다.</responsive>
  <accessibility>WCAG 2.1 AA 기준 이상의 색상 대비 만족, 키보드를 통한 전체 화면 탐색 및 포커스 링 시각화, 모션 줄이기(prefers-reduced-motion) 적용 사용자 대상 불필요한 트랜스폼 모션 제거, semantic 마크업 구조(header/main/footer/nav) 활용, 페이지당 단 하나의 H1 타이틀만 렌더링, 알맞은 html lang 속성 정보 및 hreflang 검색 노출 정보 제공.</accessibility>
</aesthetic_guidelines>

<security_considerations>
  <client_security>
    - 핵심 제약: 소스코드 파일 및 `NEXT_PUBLIC_*` 환경 변수에 민감한 비밀값이나 API 키를 보관하지 않습니다 (공개되어도 무방한 서비스 URL, AdSense 게시자 ID, GA 분석 ID만 포함).
    - 자체 도메인 및 Google 광고/통계 API 도메인만을 명시한 강력한 콘텐츠 보안 정책(Content Security Policy, CSP) 수립 (예: `script-src` 설정에 pagead2.googlesyndication.com, www.googletagmanager.com 등 필요 최소한만 허용, 광고 iframe 연동을 위한 `frame-src` 조절, `object-src 'none'`, `base-uri 'self'` 명시).
    - 보안 응답 헤더 탑재: HSTS 강제 적용, 브라우저 마임 타입 스니핑 방지(`X-Content-Type-Options nosniff`), 리퍼러 정책(`Referrer-Policy strict-origin-when-cross-origin`), 카메라/마이크/위치 접근 권한을 선제 차단하는 권한 정책(`Permissions-Policy`) 설정.
  </client_security>
  <privacy>쿠키 수집 동의 획득 이전에 사용자 정보를 기록하거나 분석 스크립트를 작동시키지 않음. AdSense 및 GA는 동의 획득 후에만 작동함. 개인정보 처리방침과 이용약관 정적 페이지를 통해 투명하게 공개하며 손쉽게 재설정할 수 있는 창구 마련</privacy>
  <input>도구 사용 중 입력된 사용자 데이터는 React가 텍스트 노드로 안전하게 이스케이프(Escape)하여 화면에 바인딩하며, 사용자 입력값을 직접 삽입하는 위험한 내부 바인딩(`dangerouslySetInnerHTML`) 코드는 플랫폼 코드 및 도구 모듈 어디에서도 사용하지 않음</input>
</security_considerations>

<advanced_functionality>
  <extensible_tool_registry>도구 레지스트리는 플랫폼 뼈대 그 자체입니다. 메인 대시보드 화면 렌더링, sitemap.xml, 정적 배포 경로 생성, 도구 검색 알고리즘이 모두 이 단 하나의 레지스트리 파일을 원천 데이터로 삼아 동작합니다. 새로운 도구를 추가할 경우: ToolMeta 엔티티 기입 → i18n messages 다국어 리소스 매핑 → components/tools/ 하위에 도구 소스 구현 → 도구 슬러그 라우터 매핑 → 서비스 SPEC 추가 과정으로 완료됩니다. 준비중인 도구는 ToolMeta에 메타정보만 정의하면 별도의 컴포넌트 없이 자동으로 대시보드 그리드에 회색 준비중 카드로 노출됩니다.</extensible_tool_registry>
  <theme_switching>라이트 테마 / 다크 테마 / 브라우저 시스템 테마와 연동되어 동작하며 쿠키나 localStorage에 영구 설정 보관. SSR 렌더링 시 다크 모드로 설정되어 있을 때 화면이 밝게 나타났다가 깜빡이며 어두워지는 현상(Flash)이 없도록 로딩 직전 즉시 테마 속성을 DOM에 바인딩하는 인라인 로더 포함</theme_switching>
  <pwa>manifest.webmanifest 및 라운드 처리와 시스템 마스크 처리가 가능한 다용도 PWA 앱 아이콘 제공, 기기별 테마 컬러 지원. 모바일 홈 화면 설치를 완벽 지원 (오프라인 캐싱용 서비스 워커는 차기 2단계 검토)</pwa>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>메인 대시보드 기능: 도구 리스트 둘러보기, 카테고리 필터링, 검색, 이동</description>
    <steps>
      1. 브라우저로 사이트 첫 경로 `/` 주소 진입 → HTTP 307 임시 리다이렉트 처리를 거쳐 `/ko` 다국어 메인 경로로 이동. 히어로 문구 및 도구 카드 그리드 노출 상태 확인
      2. "사다리 타기" 카드가 목록에 정상 표시되는지 검증하고, 산뜻한 산호색(coral) 배경 테마의 아이콘 영역과 함께 정상 클릭이 가능하여 이동할 수 있는지 체크
      3. 출시 예정인 준비중 도구 카드는 회색 테마의 차분한 "준비중" 아웃라인 배지가 잘 표시되는지 확인하고 마우스 클릭 이벤트 및 포커스가 막혀 있는지 검증
      4. 상단 카테고리 필터 중 "랜덤/추첨" 알약 버튼을 클릭 → 그리드의 리스트가 해당 카테고리 도구만으로 즉시 동적 갱신되고 브라우저 주소창 주소가 `?cat=random`으로 갱신되는지 확인
      5. 검색창에 "사다리" 검색어 타이핑 입력 → 약간의 디바운스 대기시간 후 다른 카드가 사라지고 오직 사다리타기 카드 1개만 화면에 표시되는지 검증
      6. 레지스트리에 전혀 없는 엉뚱한 검색어 입력 → 결과 없음을 안내하는 전용 화면(EmptyState) 일러스트와 안내가 출력되는지 확인하고 아래 "검색 초기화" 버튼 클릭 시 다시 전체 도구 카드가 원복되어 나타나는지 검증
      7. 사다리타기 카드를 클릭 → 즉시 `/ko/tools/ladder` 상세 경로로 페이지가 부드럽게 넘어가며, 사다리타기 게임 화면(ghost-leg SPEC 참고)이 온전하게 나타나는지 테스트
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>다국어 i18n 서비스 및 테마 전환성</description>
    <steps>
      1. 한국어 메인 대시보드 화면(`/ko`)에서 헤더 내 언어 선택 메뉴 클릭 → 현재 머물고 있는 상세 페이지의 기능 상태와 쿼리 파라미터 유실 없이 고스란히 영문 경로인 `/en` 주소로 스위칭되는지 테스트
      2. 전체 레이아웃 텍스트와 메인 카피 문구들이 영어로 완벽 전환되는지 확인, DOM 최상단 태그가 `<html lang="en">` 속성값으로 변경되었는지 확인하고 다국어 대응 대체 헤더 정보인 hreflang 메타 정보가 매칭되어 박혀 있는지 검증
      3. 테마 스위치 토글 버튼 클릭하여 다크 모드로 강제 변경 → 화면 토큰 CSS 변수들이 즉시 어두운 배색 셋으로 가동되는지 확인하고 새로고침을 수차례 진행해도 깜빡임(Flash) 현상 없이 다크 배색이 유지되는지 체크
      4. OS 환경 설정에서 "동작 줄이기(prefers-reduced-motion)" 옵션을 활성화한 뒤, 카드 마우스 오버 시 위로 떠오르는 4px 모션이나 히어로 배경 그라데이션의 부유 모션이 꺼지고 즉각적인 상태 피드백만 렌더링되는지 확인
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>쿠키 수집 동의 배너 및 AdSense 광고 노출 유무 테스트</description>
    <steps>
      1. 브라우저 캐시 및 저장소를 완전히 소거한 후 비회원 첫 진입 시도 → 화면 하단에 다국어 적용된 ConsentBanner(개인정보 쿠키 수집 동의 요약 모달) 배너가 무조건 노출되는지 확인하고, 이 동의가 완료되기 전까지는 DOM 소스 및 네트워크 로드 탭에서 AdSense 스크립트나 GA 분석 트래커가 일절 동작하지 않는지 검증
      2. 동의 배너에서 "거부" 버튼을 선택하여 창 닫기 수행 → 어떠한 트래킹 스크립트도 다운로드되지 않아야 하며, 메인 및 푸터에 마련된 광고 배치용 AdSlot 영역은 빈 레이아웃 상태로 고정 높이를 유지하며 축소되어 렌더링 영역만 조용히 자리 잡고 있는지 확인 (CLS 방지용 사전 예약 높이 보장 유무 검증)
      3. 푸터 맨 밑단에 고정된 "쿠키/동의 재설정" 텍스트 링크 버튼 클릭 → 화면에 쿠키 설정 팝업 창이 재차 발생하고, 이번에는 "수락" 혹은 "동의" 버튼을 클릭하여 승인 처리 진행 → 그 즉시 유휴 스레드 상황에서 AdSense 광고 라이브러리 스크립트와 GA 스크립트가 로컬 브라우저에 다운로드되어 실행되는지 확인하고 광고 지면에 실제 광고 리소스 이미지가 잘 맵핑되어 나타나는지 검증
      4. 구글 라이트하우스(Lighthouse) 도구의 모바일 모드 성능 측정 탭에서 사이트 레이아웃 이동(CLS) 수치가 0.1 미만으로 안전하게 유지되는지 확인하고, H1 메인 타이틀 헤더 텍스트보다 높은 천장 상단 영역에는 어떠한 광고 슬롯도 렌더링되지 않도록 규칙이 준수되고 있는지 테스트
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>SEO 메타태그 정보 및 최종 빌드 출력 결과 무결성 테스트</description>
    <steps>
      1. 로컬 개발 서버 종료 후 프로덕션 빌드 명령어 실행 → 오류 경고 없이 정상 완료되고 `/ko`, `/en` 메인 대시보드 화면 및 레지스트리에 live로 등록된 모든 개별 도구 페이지의 정적 HTML 프리렌더링 파일들이 온전하게 사전 빌드되어 생성되는지 검증
      2. 최종 빌드 산출물 폴더 내 `/sitemap.xml` 파일이 동적으로 작성되어 모든 live 도구 페이지 주소와 메인 다국어 주소들을 절대경로로 올바르게 수록하고 있는지 확인, `/robots.txt` 파일 역시 구글/네이버 크롤러의 수집을 허용하며 sitemap.xml 파일의 최종 링크 주소를 끝단에 레퍼런스로 고지하고 있는지 검증
      3. 메인 대시보드 및 도구 상세 페이지의 헤더 태그에 WebSite 구조화 스키마 데이터(JSON-LD)가 올바른 구조로 주입되어 있는지 확인하고 오픈 그래프(OG) 메타태그 기본 정보들이 유실 없이 셋업되는지 테스트. 엉뚱한 임의의 주소를 쳐서 접근 시 시스템 에러가 아닌 지정한 다국어 404 페이지로 올바르게 이동하는지 검증
    </steps>
  </test_scenario_4>
</final_integration_test>

<success_criteria>
  <functionality>메인 대시보드 그리드 영역에 레지스트리에 정의된 모든 도구가 올바르게 출력되고, 카테고리 필터 선택 및 키워드 검색 시 URL 쿼리에 실시간 연동되며 클라이언트 사이드에서 즉각 필터링이 수행됨. 활성화된(Live) 도구 클릭 시 해당 도구의 상세 서브 경로로 페이지 이동이 정상 작동하며, 준비중(coming_soon) 상태의 카드는 클릭을 원천 차단함. 다국어 전환 기능, 테마 변경 옵션, 쿠키 수집 배너 정보 연동이 물 흐르듯 유기적으로 맞물려야 하고, 모든 개별 라이브 도구들은 독립적으로 검색 크롤링이 가능한 정적 SSG HTML 페이지로 자동 빌드되어 작동해야 함</functionality>
  <user_experience>구글 라이트하우스 모바일 기준 LCP < 2.5초, FCP < 1.5초, INP < 200ms, CLS < 0.1, TBT < 200ms 성능 지표를 반드시 유지해야 함. 검색 인풋 창에 글자를 타이핑할 때마다 목록이 갱신되는 화면 필터링 렌더링 갱신 시간은 50ms 미만이어야 하며, 웹 접근성 검사를 모두 통과하여 키보드 탭 키를 통한 완전 탐색 접근 시 명확한 브랜드 포커스 링이 시각화되어야 하고 탭 영역 크기는 44px 이상이어야 함</user_experience>
  <technical_quality>빌드 시 타입스크립트 엄격(Strict) 타입 체커 통과(에러 0개), 최종 배포 프로덕션 환경의 브라우저 개발자 도구 콘솔 탭 내 적색 런타임 에러 메세지 0개 유지, 클린 코드 원칙에 근거하여 단일 소스코드 파일의 물리적 라인 수는 최대 800라인을 절대 초과하지 않아야 하며, 기능 단위 폴더 모듈 구조로 컴포넌트를 설계해야 함</technical_quality>
  <visual_design>본 플랫폼 사양서 및 DESIGN.md에서 합의한 디자인 규격 토큰 및 테마 변수를 빈틈없이 활용함. 브라우저나 Tailwind의 기본 테두리 그리드 형태를 그대로 방치한 허술한 느낌이 나지 않도록, 세심하게 튜닝한 카테고리별 유니크한 포인트 액센트 브랜딩을 아이콘 및 배지에 영리하게 부여함. 호버 및 꾹 누를 때의 정교한 눌림 피드백, 세련된 반투명 블러 디자인이 가미된 테마 토글 버튼 등 전반적으로 세련되고 디테일이 완성도 높은 고급 대시보드 감성을 온전하게 전달해야 함</visual_design>
  <build>초기 진입 시의 웹 성능 저하를 방지하기 위해 첫 로딩에 주입되는 JavaScript 파일 크기 합산은 gzip 압축 기준 150kb 미만, 스타일 CSS 파일은 gzip 압축 기준 30kb 미만을 엄수해야 함 (무거운 외부 웹폰트나 광고용 분석 도구 라이브러리 스크립트는 초기 로딩 이후 비동기 지연 로딩 처리 필수). Vercel, Netlify, Cloudflare Pages 등 무상태 호스팅 정적 에지 서버에 매끄럽게 빌드 및 업로드가 가능해야 하며 Chrome 100+, Firefox 100+, Safari 15+ 이상 브라우저를 지원함</build>
</success_criteria>

<build_output>
  <build_command>pnpm build (또는 npm run build)</build_command>
  <output>빌드 후 Statically generated Next.js app 정적 배포 파일 생성. 개별 도구 및 언어별 HTML/CSS 프리렌더링 파일들로 산출됨</output>
  <deployment>무상태 정적 호스팅(Static/Edge Host)에 제약 없이 배포 가능. 배포 플랫폼 환경변수 탭에 `NEXT_PUBLIC_SITE_URL` 및 `NEXT_PUBLIC_ADSENSE_CLIENT` (필요 시 `NEXT_PUBLIC_GA_ID` 추가) 변수를 필수로 지정해야 함. 웹 콘텐츠 보안 정책(CSP) 및 보안 헤더 정보는 배포 호스팅 서버 관리자의 헤더 커스텀 탭에 설정하거나 소스 내 `next.config.js`의 `headers()` 메소드 정의를 이용해 배포 시점에 일괄 주입되도록 구성함</deployment>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. 도구 레지스트리 정의 및 관련 TS 타입 선언 + 동적 정적 경로 생성(SSG 라우팅) 설계 (플랫폼 백본 프레임워크 구축)
    2. 디자인 기준 토큰 정의 연동 (`tokens.css` ↔ `DESIGN.md`) 및 기본 UI 공통 프리미티브 컴포넌트 개발
    3. 메인 대시보드 페이지 퍼블리싱 (히어로 헤더 + 검색 필터 + 카테고리 알약 + 도구 카드 그리드 및 정렬 처리)
    4. 다국어(i18n) 통합 라우팅 모듈 셋업 및 한국어/영어 메시지 번역 JSON 데이터베이스 정의 (페이지 구현 전 선행 권장)
    5. CLS 방지용 높이 예약형 광고 슬롯 컴포넌트(`AdSlot`) 구현 및 사용자 쿠키 수집 정보 동의 연동 로직 구현
  </critical_paths>
  <recommended_implementation_order>
    1. Next.js 15 + TS Strict 모드 + Tailwind v4 + tokens.css 디자인 토큰 연동 + next-intl 다국어 지원 기반 프로젝트 구조 스캐폴딩
    2. 공통 UI 프리미티브 컴포넌트 작성 및 레이아웃 쉘 (헤더/푸터/깜빡임 방지용 ThemeProvider/LocaleSwitcher) 조립
    3. 핵심 도구 레지스트리(`registry.ts`) + TS 인터페이스 선언 및 번역 메시지(`ko.json`, `en.json`) 초기 데이터 삽입
    4. 메인 화면 퍼블리싱: Hero 영역, 검색 바, 카테고리 필터 바, 카드 그리드 및 도구 카드 작성 (마우스 오버 등 인터랙션 상태 피드백 및 Empty 결과 없음 상태 포함)
    5. 동적 도구 연동 라우트(`/[locale]/tools/[slug]`) 구현 및 모듈 동적 로더 + 에러 바운더리 컴포넌트 작성 (이후 ghost-leg SPEC 문서를 참조해 실제 사다리타기 상세 도구 기능 개발 및 연동)
    6. 사용자 쿠키 수집 설정 배너 작성 + 광고 슬롯 컴포넌트 연동 + 구글 AdSense 연동 래퍼 스크립트 비동기 작성
    7. SEO 고도화: `buildMetadata` 헬퍼 함수 정의, JSON-LD 스키마 구성, robots.txt, sitemap.ts, manifest.ts 설정 적용 및 hreflang 크로스 링크 연동
    8. 사이트 정적 정보 전달 페이지 작성 (소개/개인정보 처리방침/이용약관/문의); GA 웹 분석 트래커 조건부 연동
    9. 반응형 브레이크포인트 최적화 및 웹 접근성(a11y) 검사 수행; 다양한 디바이스 가로 크기(320px/375px/768px/1024px/1440px)별 라이트/다크 테마 테스트 및 화면 깨짐 검증
    10. 최종 디테일 보완: 빈 검색 화면 연출 고도화, 404 페이지 디자인 가다듬기, 토스트 알림 작동성, 다양한 엣지 케이스 점검
  </recommended_implementation_order>
  <tool_registry_pattern>
    ```typescript
    // src/tools/types.ts
    export type ToolCategory = 'random' | 'calculator' | 'text' | 'converter' | 'fun' | 'dev';
    export type AccentColor = 'coral' | 'mint' | 'sky' | 'sun' | 'grape' | 'rose';
    export interface ToolMeta {
      id: string; 
      slug: string; 
      category: ToolCategory; 
      icon: string;
      accent: AccentColor; 
      status: 'live' | 'coming_soon';
      isNew?: boolean; 
      isPopular?: boolean; 
      order: number; 
      keywords: string[];
    }
    
    // src/tools/registry.ts
    export const tools: ToolMeta[] = [
      { 
        id: 'ladder', 
        slug: 'ladder', 
        category: 'random', 
        icon: 'ListTree',
        accent: 'coral', 
        status: 'live', 
        isNew: true, 
        isPopular: true, 
        order: 1,
        keywords: ['사다리', '사다리타기', 'ladder', 'ghost leg', '추첨', '제비뽑기', '아미다쿠지', 'Amidakuji'] 
      },
      // 출시 예정(coming_soon) 도구 작성 예시:
      // { id: 'picker', slug: 'picker', category: 'random', icon: 'Shuffle', accent: 'rose', status: 'coming_soon', order: 2, keywords: [] },
    ];
    ```
  </tool_registry_pattern>
  <performance>모든 개별 도구 페이지는 Next.js 서버 컴포넌트(Server Components) 기반으로 기본 작성하고, 사용자 입력이 오가는 인터랙티브한 영역만 말단에서 클라이언트 컴포넌트("use client")로 격리 설계합니다. AdSense 광고 및 GA 분석 스크립트는 동의 완료 후 `lazyOnload` 옵션으로 느리게 받아오며, 폰트는 서브셋 경량화 파일만 자체 호스팅하고, 누적 레이아웃 이동 방지를 위해 모든 광고 프레임 높이를 정적으로 강제 선점합니다.</performance>
  <testing_strategy>유닛 테스트(Vitest 활용): 검색 문자열 매칭 정합성, 쿠키 동의 스크립트 차단 유무 검증. 컴포넌트 단위 테스트: 도구 카드의 활성/비활성 UI 피드백 검증, 동의 모달 배너 팝업 동작 체크. 종단 간(E2E) 통합 테스트(Playwright 활용): 명시된 4가지 핵심 사용자 여정 시나리오 자동 수행 검증 및 브라우저 세로/가로 규격별(320px/768px/1024px/1440px) 라이트/다크 테마 스크린샷 픽셀 회귀 테스트. 웹 접근성(a11y) 검사: axe-core 접근성 진단기 활용, 키보드 Tab 키 탐색 유연성 및 동작 줄이기 미학 검증.</testing_strategy>
</key_implementation_notes>

</project_specification>
```
