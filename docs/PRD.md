# Jurepi — Platform & Main Dashboard PRD

> 무료 온라인 도구 모음 사이트(jurepi.kr)의 **플랫폼 + 메인 화면** 빌드 사양입니다.
> 메인 화면은 유용한 프로그램을 카드 형태로 보여주고 선택하는 대시보드(도구 디렉터리)입니다.
> 개별 도구의 상세 사양은 각 서비스 PRD에 분리되어 있습니다:
> - 사다리타기(Ghost Leg): [`services/game/ghost-leg/PRD.md`](services/game/ghost-leg/PRD.md)
>
> 시각 기준(디자인 시스템)은 [`DESIGN.md`](DESIGN.md)를 단일 소스로 참조합니다. 본 PRD의 토큰 값은 DESIGN.md와 1:1로 일치합니다.

```xml
<project_specification>

<project_name>Jurepi Platform - 무료 온라인 도구 허브 (main dashboard + shared shell)</project_name>

<overview>
Jurepi (jurepi.kr) is a free online tools hub. This PRD covers the **platform**: the main dashboard screen (a card-grid directory of useful programs) plus the shared application shell, tool registry, SEO infrastructure, internationalization, monetization, and legal pages. Individual tools are specified in their own service PRDs and mount into this shell.

The main screen is a dashboard: a hero with a prominent search, a category filter, and a responsive grid of tool cards. Each card is a tappable object showing an accent-tinted icon, name, and short description; selecting a live card navigates to that tool's page. The card grid is generated entirely from a typed tool registry, so adding a new tool means adding one registry entry (+ its own service PRD/module) — the hub scales without re-architecting the main screen.

The launch tool is the **Ladder Game (사다리타기 / Ghost Leg)**, specified separately in services/game/ghost-leg/PRD.md (relative to this docs/ folder). At launch the grid shows the ladder card as "live" and may show other tools as non-clickable "coming soon" cards.

CRITICAL: Next.js App Router rendered as **static pages (SSG)** with **NO application backend and NO database**. The tool registry is a compile-time module; preferences/consent live in localStorage. Only third-party network deps are Google AdSense, a consent CMP, optional Google Analytics, and self-hosted fonts. Deployable to any static/edge host.

CRITICAL: Search traffic is the growth engine — every tool is a separate indexable URL (specified per-tool), and the main screen + shell must not regress Core Web Vitals (CLS < 0.1; reserve ad-slot heights).
</overview>

<scope_boundaries>
  <in_scope>
    - Main dashboard screen: hero, search, category filter, responsive tool-card grid, empty state
    - Typed tool registry (single source of truth for the grid, sitemap, static params, search)
    - Shared application shell: header (wordmark, search, locale switch, theme toggle), footer
    - Dynamic tool route /[locale]/tools/[slug] that mounts the matching tool module (tool internals per their own PRD)
    - Internationalization: Korean (default) + English via next-intl, locale-prefixed routes, language switcher
    - Theming: light (default) + optional dark toggle, flash-free SSR
    - Monetization: Google AdSense slots (header/footer) + consent flow + cookie banner
    - SEO infrastructure: sitemap.xml, robots.txt, manifest, canonical/hreflang, WebSite JSON-LD, OG defaults
    - Static legal/info pages: About, Privacy, Terms, Contact
    - 404 / error boundaries / toast system
  </in_scope>
  <out_of_scope>
    - Internals of any individual tool (each tool has its own service PRD — e.g., the ladder game)
    - Backend server, database, authentication, accounts
    - Payments / premium tiers (site is fully free)
    - Native mobile apps (responsive web only)
    - A CMS or admin UI (tools are added in code via the registry)
  </out_of_scope>
  <future_considerations>
    - More tools via the registry + per-tool PRDs: random picker, dice/coin, timer, unit converter, counter, QR, color picker (Phase 2+)
    - "Recently used / favorites" in localStorage (Phase 2)
    - Coming-soon interest capture (Phase 2)
    - First-class dark theme (Phase 2); additional locales ja/zh (Phase 3)
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <frontend_application>
    <framework>Next.js 15 (App Router, React 19), TypeScript 5.7 strict</framework>
    <rendering>SSG via generateStaticParams; Server Components by default, interactive tool UIs are Client Components</rendering>
    <styling>Tailwind CSS v4.0 driven by CSS custom-property tokens (src/styles/tokens.css ↔ DESIGN.md)</styling>
    <i18n>next-intl v3.x — locales ["ko","en"], defaultLocale "ko", localePrefix "always"</i18n>
    <state_management>React state + Context (theme, consent, toast). No global store at platform level.</state_management>
  </frontend_application>
  <data_layer>
    <tool_registry>Compile-time TS module src/tools/registry.ts — ToolMeta[]. NOT a database.</tool_registry>
    <persistence>localStorage only (theme, consent). No server, no DB.</persistence>
    <note>CRITICAL: NO backend, NO first-party API, NO DB.</note>
  </data_layer>
  <libraries>
    <icons>lucide-react v0.468 (stroke 1.75)</icons>
    <search>zero-dep token/substring matcher first; fuse.js v7.x only if needed</search>
    <fonts>Pretendard Variable (UI/body) + Gmarket Sans (display/wordmark) via next/font/local, font-display: swap</fonts>
    <ids>nanoid v5.1 (used by tools that need ephemeral IDs)</ids>
  </libraries>
  <monetization>
    <ads>Google AdSense manual ad units (&lt;ins class="adsbygoogle"&gt;), loaded after consent + on idle</ads>
    <consent>Google-certified CMP ("Privacy & messaging") for EEA/UK; lightweight first-party banner otherwise</consent>
  </monetization>
  <analytics>Google Analytics 4 (gtag), OPTIONAL, consent-gated</analytics>
</technology_stack>

<prerequisites>
  <environment_setup>
    - Node.js v20+, pnpm v9 (preferred) or npm v10
    - Modern browser (Chrome 100+, Firefox 100+, Safari 15+)
    - Google AdSense account + approved publisher ID for production ads
  </environment_setup>
  <build_configuration>
    - TS strict; Tailwind v4 with @tailwindcss/postcss; design tokens as CSS variables consumed by Tailwind theme
    - Path alias @/* → src/*; next-intl plugin in next.config.ts; localePrefix "always"
    - ESLint (next/core-web-vitals) + Prettier
  </build_configuration>
</prerequisites>

<environment_variables>
  <variable>
    <name>NEXT_PUBLIC_SITE_URL</name>
    <description>Canonical absolute base URL (canonical tags, sitemap, OG). Public.</description>
    <required>true</required>
    <example>https://jurepi.kr</example>
  </variable>
  <variable>
    <name>NEXT_PUBLIC_ADSENSE_CLIENT</name>
    <description>AdSense publisher client ID. Public.</description>
    <required>false</required>
    <example>ca-pub-0000000000000000</example>
    <note>Ads render only when set AND user consented. Slot height always reserved.</note>
  </variable>
  <variable>
    <name>NEXT_PUBLIC_GA_ID</name>
    <description>GA4 measurement ID. Public. Loaded only after consent.</description>
    <required>false</required>
    <example>G-XXXXXXXXXX</example>
  </variable>
  <variable>
    <name>NEXT_PUBLIC_DEFAULT_LOCALE</name>
    <description>Default locale for redirect from /.</description>
    <required>false</required>
    <example>ko</example>
  </variable>
  <note>CRITICAL: no server secrets exist; all NEXT_PUBLIC_* are intentionally client-safe.</note>
</environment_variables>

<file_structure>
src/
├── app/
│   ├── layout.tsx                  # Root <html lang>, font vars, base metadata, theme bootstrap
│   ├── globals.css                 # Tailwind import + token bridge
│   ├── sitemap.ts                  # Entries for every live tool × locale + static pages
│   ├── robots.ts
│   ├── manifest.ts
│   └── [locale]/
│       ├── layout.tsx              # Providers, Header, Footer, ConsentBanner
│       ├── page.tsx                # ★ MAIN DASHBOARD (Hero + ToolGrid)
│       ├── not-found.tsx
│       ├── tools/[slug]/page.tsx   # SSG; mounts tool module by slug (tool internals per its own PRD)
│       ├── about/page.tsx
│       ├── privacy/page.tsx
│       ├── terms/page.tsx
│       └── contact/page.tsx
├── components/
│   ├── ui/                         # Button, IconButton, TextInput, Toggle, Badge, Card, Modal, Toast, EmptyState
│   ├── layout/                     # Header, Footer, LocaleSwitcher, ThemeToggle, ConsentBanner
│   ├── home/                       # Hero, SearchBar, CategoryFilter, ToolGrid, ToolCard
│   └── ads/                        # AdSlot
│   └── tools/                      # one folder per tool (see each tool's PRD) — e.g. ladder/
├── tools/
│   ├── registry.ts                 # ToolMeta[] — single source of truth
│   └── types.ts
├── i18n/
│   ├── routing.ts                  # locales, defaultLocale, localePrefix
│   ├── request.ts
│   └── messages/{ko,en}.json       # platform keys + per-tool namespaces (tools.<id>.*)
├── lib/
│   ├── seo.ts                      # buildMetadata, websiteJsonLd
│   ├── consent.ts
│   ├── analytics.ts
│   └── utils.ts                    # cn(), search matcher, clamp
├── hooks/
│   ├── useReducedMotion.ts
│   ├── useLocalStorage.ts
│   └── useConsent.ts
└── styles/
    └── tokens.css                  # design tokens (mirror of DESIGN.md)
</file_structure>

<core_data_entities>
  <tool_meta>
    Compile-time registry entry (src/tools/types.ts). Human copy lives in i18n messages keyed by id.
    - id: string (stable key, e.g. "ladder")
    - slug: string (URL segment, e.g. "ladder")
    - category: enum (random, calculator, text, converter, fun, dev)
    - icon: string (lucide icon name)
    - accent: enum (coral, mint, sky, sun, grape, rose) — drives card identity color
    - status: enum (live, coming_soon)
    - isNew: boolean (default false) — "NEW" badge
    - isPopular: boolean (default false) — "인기" badge, may pin to top
    - order: number (manual sort weight)
    - keywords: string[] (search + SEO; localized variants resolved from messages)
    Note: name/description resolved at render from messages[`tools.${id}.*`].
  </tool_meta>
  <user_preferences>
    localStorage only.
    - jurepi-theme: enum (light, dark, system) — default "light"
    - jurepi-consent: { ads: boolean; analytics: boolean; ts: number } | null
  </user_preferences>
  <note>Per-tool runtime state (e.g., ladder game state) is defined in that tool's own PRD, not here.</note>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/" redirect="/ko" status="307" />
    <route path="/:locale" page="HomePage (main dashboard)" />
    <route path="/:locale/tools/:slug" page="ToolPage (mounts tool module)" />
    <route path="/:locale/about" page="AboutPage" />
    <route path="/:locale/privacy" page="PrivacyPage" />
    <route path="/:locale/terms" page="TermsPage" />
    <route path="/:locale/contact" page="ContactPage" />
  </public_routes>
  <generated>
    <route path="/sitemap.xml" handler="app/sitemap.ts" />
    <route path="/robots.txt" handler="app/robots.ts" />
    <route path="/manifest.webmanifest" handler="app/manifest.ts" />
  </generated>
  <rules>
    - generateStaticParams for /:locale/tools/:slug iterates registry.filter(status==='live') × locales
    - coming_soon tools have NO route; cards are non-navigable
    - Unknown slug → localized not-found (404)
    - Public slug for the ladder game is "ladder" (internal service codename: ghost-leg)
  </rules>
</route_definitions>

<component_hierarchy>
  <app_root>
    <html lang={locale}>
      <locale_layout>   <!-- NextIntlClientProvider → ThemeProvider → ConsentProvider → ToastProvider -->
        <header>        <!-- sticky 64px -->
          <wordmark /> <search_trigger /> <locale_switcher /> <theme_toggle />
        </header>
        <main>
          <home_page>            <!-- ★ MAIN DASHBOARD -->
            <hero> <eyebrow /> <h1 /> <subhead /> <search_bar /> </hero>
            <ad_slot variant="leaderboard" />
            <category_filter />  <!-- pill row -->
            <tool_grid> <tool_card /> ... </tool_grid>
          </home_page>
          <tool_page>            <!-- mounts a tool module; layout/breadcrumb provided here, internals per tool PRD -->
            <breadcrumb />
            <tool_module />       <!-- e.g. <LadderGame/> (see ghost-leg PRD) -->
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
      - 64px, sticky, background var(--surface), 1px bottom border var(--hairline); on scroll background alpha 0.8 + backdrop-filter blur(8px)
      - Left: "Jurepi" wordmark, Gmarket Sans 22px/700, var(--brand), links /[locale]
      - Right (gap 8px): search icon button, LocaleSwitcher (KO/EN), ThemeToggle (sun/moon)
      - Tap targets ≥ 44px; focus-visible 2px var(--brand) offset 2px
    </header>
    <footer>
      - Background var(--surface-muted), padding 48px 24px
      - Wordmark + tagline; links 소개/Privacy/Terms/Contact; locale switch; re-open consent link
      - "© 2026 Jurepi · 모든 도구는 무료입니다." 13px var(--text-muted)
    </footer>
    <container>Max width 1120px centered; gutter 24px desktop → 16px mobile</container>
  </global_layout>

  <home_page note="THE MAIN SCREEN — card-grid dashboard">
    <hero>
      - Centered; padding 64px/40px desktop (40/24 mobile)
      - Eyebrow: "무료 온라인 도구" / "Free online tools" — 12px/700 uppercase, 0.6px tracking, var(--brand)
      - H1: "필요한 도구, 전부 무료로." / "Handy tools, all free." — Gmarket Sans clamp(32px,6vw,56px)/700, line-height 1.1
      - Subhead: one line, 16–18px var(--text-secondary), max-width 540px
      - SearchBar: 56px tall, rounded var(--radius-xl) 20px, leading search icon, placeholder "도구 검색…" / "Search tools…"
      - Decorative accent blobs behind hero (low-opacity, pointer-events none); static under prefers-reduced-motion
    </hero>
    <category_filter>
      - Horizontal pill row, scroll-snap on mobile (no scrollbar)
      - Pills derived from categories present in registry: "전체", "랜덤/추첨", "계산기", "텍스트", "변환", "재미"
      - Active: background var(--brand), text #FFF; inactive: var(--surface-muted)/var(--text-secondary); hover lifts bg
      - Selecting filters grid client-side; reflected in URL ?cat=
    </category_filter>
    <tool_grid>
      - Grid: 1-col <480px, 2-col 480–767, 3-col 768–1023, 4-col ≥1024; gap 20px
      - Sort: isPopular first → order asc → coming_soon last
      - Empty (no match): EmptyState illustration + "검색 결과가 없어요" + reset button
    </tool_grid>
    <tool_card>
      - Surface var(--surface), 1px border var(--hairline), radius var(--radius-xl) 20px, padding 20px, min-height 150px, shadow --shadow-card
      - Icon tile 48px, rounded var(--radius-lg) 16px, background = accent *-soft, glyph = saturated accent; lucide 24px
      - Title 17px/700 var(--text); description 14px/500 var(--text-secondary), 2-line clamp
      - Badges top-right: NEW (mint), 인기 (sun), 준비중 (muted outline)
      - Hover (live): translateY(-4px), --shadow-card-hover, border var(--brand-soft), 200ms --ease-out; press translateY(-1px) scale(0.99); focus-visible ring 2px var(--brand)
      - coming_soon: opacity 0.7, no hover lift, cursor default, 준비중 badge
      - Whole card is the Next Link target for live tools
    </tool_card>
    <not_found>Localized 404 — friendly illustration + "페이지를 찾을 수 없어요" + home button</not_found>
    <legal_pages>About / Privacy / Terms / Contact — simple prose layout, max-width 720px, headings in Gmarket Sans; Privacy + Terms disclose AdSense/GA cookies + consent change</legal_pages>
  </home_page>

  <keyboard_shortcuts_reference>
    - "/" → focus home search
    - Esc → close search overlay / consent details / modal
    - Tab order: header controls → category pills → grid cards (DOM order)
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <tool_hub>
    - Registry-driven grid: ToolGrid maps registry; adding a tool = ToolMeta entry + messages + (if live) a module + its own PRD
    - Category filter + client-side search over localized name/description/keywords (debounced 120ms)
    - Filter/search state mirrored to URL query (shareable, back-button friendly)
    - Selecting a live card → navigate to /[locale]/tools/[slug]
  </tool_hub>
  <i18n>All visible strings from messages/{ko,en}.json; locale switch preserves path + query; sets &lt;html lang&gt;</i18n>
  <theming>Light default; toggle light/dark/system; persisted; flash-free (inline bootstrap before paint)</theming>
  <consent>First visit → banner; choice persisted; ads/analytics gated; re-openable from footer</consent>
</core_functionality>

<error_handling>
  <user_facing>
    <toast_notifications>Success var(--success) 2.5s; Error var(--danger) persistent; max 3 stacked; bottom-center mobile / bottom-right desktop; reduced-motion fade only</toast_notifications>
    <error_pages>404 localized; tool render failure caught by Error Boundary around the mounted tool module → friendly retry, never crashes shell</error_pages>
  </user_facing>
  <runtime>
    <localstorage>Private-mode/quota errors caught; theme + consent degrade to in-memory defaults</localstorage>
  </runtime>
  <ads>AdSense load failure/blocker → AdSlot renders nothing (collapses in prod), never blocks content</ads>
  <note>No first-party network requests → no API error states at platform level.</note>
</error_handling>

<third_party_integrations>
  <integration name="Google AdSense">
    <purpose>Display advertising (monetization)</purpose>
    <sdk>next/script strategy="lazyOnload", only after ad consent</sdk>
    <ad_slots>leaderboard (home, below hero): reserve 90px mobile / up to 250px desktop · footer (all pages): reserve 90px · in_content (tool pages): reserve ≥250px (placed by tool per its PRD)</ad_slots>
    <rules>CRITICAL: reserve fixed height (CLS &lt; 0.1); never above H1; ads off until consent.ads === true</rules>
  </integration>
  <integration name="Consent CMP">
    <purpose>Lawful basis for ad/analytics cookies (GDPR/ePrivacy)</purpose>
    <flow>First visit → ConsentBanner ("수락"/"거부"/"설정"); choice → localStorage; gate scripts; re-open from footer</flow>
  </integration>
  <integration name="Google Analytics 4" optional="true">
    <events>tool_open (slug), locale_switch, search_query (no PII); consent.analytics gated</events>
  </integration>
  <integration name="Web Fonts">Self-hosted Pretendard + Gmarket Sans via next/font/local, subset, font-display: swap, preload primary weight only</integration>
</third_party_integrations>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is the single source of truth for tokens and component styling. src/styles/tokens.css mirrors it exactly. Below is the platform-relevant summary.</source>
  <direction>Bright, friendly, playful, light-first. White cards on white ground lifted by soft brand-tinted shadows; six category accents as identity; rounded corners (16–28px); brand honey-gold (#f5a623) for all actions.</direction>
  <main_screen_usage>
    - Hero H1 in Gmarket Sans; everything else Pretendard
    - Each tool card's icon tile + badge tint use the tool's category accent (coral/mint/sky/sun/grape/rose); CTAs/links stay brand honey-gold
    - Cards lift on hover (--shadow-card → --shadow-card-hover), press scale 0.99, focus-visible brand ring
    - Section rhythm 48–64px; grid gap 20px; container 1120px
  </main_screen_usage>
  <responsive>Breakpoints 0–479 (1-col) / 480–767 (2-col) / 768–1023 (3-col) / 1024+ (4-col, 1120px). Header stays compact icon bar (no hamburger). Touch targets ≥44px.</responsive>
  <accessibility>WCAG 2.1 AA contrast; full keyboard; visible focus-visible rings; prefers-reduced-motion honored; semantic header/main/footer/nav; one H1 per page; correct html lang + hreflang.</accessibility>
</aesthetic_guidelines>

<security_considerations>
  <client_security>
    - CRITICAL: no secrets in code or NEXT_PUBLIC_* (only public site URL / AdSense client / GA ID)
    - CSP allowing self + Google ad/analytics origins (script-src pagead2.googlesyndication.com, www.googletagmanager.com; frame-src ad iframes; object-src 'none'; base-uri 'self')
    - Headers: HSTS; X-Content-Type-Options nosniff; Referrer-Policy strict-origin-when-cross-origin; Permissions-Policy disabling camera/mic/geolocation
  </client_security>
  <privacy>No tracking before consent; AdSense + GA strictly consent-gated; Privacy/Terms disclose cookies + consent change</privacy>
  <input>User-entered tool inputs are rendered as text (React escapes); NEVER dangerouslySetInnerHTML for user content</input>
</security_considerations>

<advanced_functionality>
  <extensible_tool_registry>Registry is the backbone: hub UI, sitemap, static params, search all derive from it. New tool = ToolMeta + messages.tools.&lt;id&gt; + components/tools/&lt;id&gt;/ + a slug→component branch + its own service PRD. coming_soon needs only the ToolMeta entry.</extensible_tool_registry>
  <theme_switching>light/dark/system, persisted, SSR flash-free</theme_switching>
  <pwa>manifest.webmanifest + maskable icons + theme-color; installable (offline SW optional Phase 2)</pwa>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Main dashboard: browse, filter, search, select</description>
    <steps>
      1. Visit / → 307 redirect to /ko; home renders hero + tool grid
      2. Verify the "사다리 타기" card shows with coral icon tile and is clickable
      3. Verify coming-soon cards show "준비중" and are NOT clickable
      4. Click category pill "랜덤/추첨" → grid filters; URL gains ?cat=random
      5. Type "사다리" in search → grid narrows to ladder card (debounced)
      6. Type a non-matching term → EmptyState with reset; click reset → full grid returns
      7. Click the ladder card → navigate to /ko/tools/ladder (tool behavior per ghost-leg PRD)
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>i18n and theme</description>
    <steps>
      1. From /ko, switch locale → navigate to /en preserving page + query
      2. Verify all shell/home copy switches to English; &lt;html lang="en"&gt;; hreflang alternates present
      3. Toggle dark → tokens switch, no flash on reload; reload → theme + locale persist
      4. OS reduced-motion → card hover/blobs render without transforms
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Consent and ads</description>
    <steps>
      1. First visit (cleared storage) → ConsentBanner appears; NO AdSense/GA in DOM
      2. "거부" → no ad scripts; AdSlots reserve height, render empty
      3. Re-open from footer → "수락" → AdSense loads lazily; units fill reserved slots
      4. Lighthouse CLS &lt; 0.1 on home; no ad above H1
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>SEO and build</description>
    <steps>
      1. Production build → /ko and /en home + every live tool page statically generated
      2. /sitemap.xml lists live tools × locales + static pages with absolute URLs; /robots.txt allows + references sitemap
      3. Home has WebSite JSON-LD + OG defaults; unknown slug → localized 404 (not server error)
    </steps>
  </test_scenario_4>
</final_integration_test>

<success_criteria>
  <functionality>Home grid renders all registry tools; filter + search work and mirror to URL; live cards navigate; coming_soon non-clickable; i18n/theme/consent correct; every live tool is a separately indexable SSG page</functionality>
  <user_experience>LCP &lt; 2.5s, FCP &lt; 1.5s, INP &lt; 200ms, CLS &lt; 0.1, TBT &lt; 200ms (Lighthouse mobile); search keystroke→filter &lt; 50ms; visible focus + ≥44px targets</user_experience>
  <technical_quality>Zero TS errors (strict); zero console errors in prod; no file &gt; 800 lines; feature-based organization</technical_quality>
  <visual_design>Matches DESIGN.md tokens; not a default Tailwind/template grid (accent identity, rounded display, designed hover/press); light (and optional dark) feel intentional</visual_design>
  <build>Landing JS &lt; 150kb gz, CSS &lt; 30kb gz (ads/fonts async); deployable to Vercel/Netlify/Cloudflare; Chrome 100+/FF 100+/Safari 15+</build>
</success_criteria>

<build_output>
  <build_command>pnpm build (or npm run build)</build_command>
  <output>Statically generated Next.js app; per-tool, per-locale HTML prerendered</output>
  <deployment>Any static/edge host. Set NEXT_PUBLIC_SITE_URL + NEXT_PUBLIC_ADSENSE_CLIENT (+ optional NEXT_PUBLIC_GA_ID). Configure CSP + security headers at host or via next.config headers().</deployment>
</build_output>

<key_implementation_notes>
  <critical_paths>
    1. Tool registry + types + dynamic SSG route (the hub backbone)
    2. Design tokens (tokens.css ↔ DESIGN.md) + UI primitives
    3. Main dashboard (Hero + SearchBar + CategoryFilter + ToolGrid + ToolCard)
    4. i18n routing + message catalogs (wire before building pages)
    5. AdSlot with reserved height + consent gating (CLS + policy)
  </critical_paths>
  <recommended_implementation_order>
    1. Scaffold Next.js 15 + TS strict + Tailwind v4 + tokens.css + next-intl (ko/en)
    2. UI primitives + layout shell (Header/Footer/ThemeProvider flash-free/LocaleSwitcher)
    3. Tool registry + types + ko/en messages
    4. Main dashboard: Hero, SearchBar, CategoryFilter, ToolGrid, ToolCard (all states + empty)
    5. Dynamic tool route + slug→component mount + Error Boundary (then build the ladder tool per ghost-leg PRD)
    6. Consent + AdSlot + AdSense wiring (consent-gated, lazy)
    7. SEO: buildMetadata, WebSite JSON-LD, sitemap.ts, robots.ts, manifest.ts, hreflang/canonical
    8. Legal pages (About/Privacy/Terms/Contact); GA optional (consent-gated)
    9. Responsive + a11y pass; Lighthouse/visual regression at 320/375/768/1024/1440
    10. Polish: empty states, 404, toast, edge cases
  </recommended_implementation_order>
  <tool_registry_pattern>
    ```typescript
    // src/tools/types.ts
    export type ToolCategory = 'random' | 'calculator' | 'text' | 'converter' | 'fun' | 'dev';
    export type AccentColor = 'coral' | 'mint' | 'sky' | 'sun' | 'grape' | 'rose';
    export interface ToolMeta {
      id: string; slug: string; category: ToolCategory; icon: string;
      accent: AccentColor; status: 'live' | 'coming_soon';
      isNew?: boolean; isPopular?: boolean; order: number; keywords: string[];
    }
    // src/tools/registry.ts
    export const tools: ToolMeta[] = [
      { id: 'ladder', slug: 'ladder', category: 'random', icon: 'ListTree',
        accent: 'coral', status: 'live', isNew: true, isPopular: true, order: 1,
        keywords: ['사다리', '사다리타기', 'ladder', 'ghost leg', '추첨', '제비뽑기', '아미다쿠지', 'Amidakuji'] },
      // coming-soon example: { id:'picker', slug:'picker', category:'random', icon:'Shuffle', accent:'rose', status:'coming_soon', order:2, keywords:[] },
    ];
    ```
  </tool_registry_pattern>
  <performance>Tool pages are Server Components, only the tool subtree is "use client"; defer AdSense/GA via lazyOnload post-consent; self-host + subset fonts; reserve ad heights</performance>
  <testing_strategy>Unit (Vitest): search matcher, consent gating. Component: ToolCard states, ConsentBanner. E2E (Playwright): the four platform scenarios; visual regression home at 320/768/1024/1440 both themes. A11y: axe + keyboard + reduced-motion.</testing_strategy>
</key_implementation_notes>

</project_specification>
```
