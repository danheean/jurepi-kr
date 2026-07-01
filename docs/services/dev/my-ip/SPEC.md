# My IP Address — Find Your Public IP (IPv4 + IPv6) — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **My IP Address** (내 아이피 찾기) — a developer utility that fetches and displays the visitor's public IP address (IPv4 and, if available, IPv6) and optional geolocation/ISP info sourced from a third-party IP API. The tool is the **ONLY Jurepi tool with an external network dependency** — handled securely with a multi-provider fallback chain, rate-limit resilience, and transparent privacy disclosure.
> Internal service codename: `my-ip`. Registry id: `my-ip`. Public URL slug: `/[locale]/tools/my-ip`.
>
> This SPEC covers the **tool itself**. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (same pattern): [`docs/services/random/ghost-leg/SPEC.md`](../../random/ghost-leg/SPEC.md)

```xml
<project_specification>

<project_name>My IP Address — Show Public IP (IPv4 + IPv6) (Jurepi tool, codename my-ip, registry id my-ip)</project_name>

<overview>
My IP Address solves a quick question: "What is my IP address?" The visitor mounts the tool, and within a second, a large, copyable display shows their public IPv4 address (and IPv6 if available) plus optional approximate geolocation + ISP information. A refresh button re-fetches; error states guide retry; offline and rate-limit scenarios are handled gracefully. The IP and optional metadata come from a third-party IP provider; the origin is disclosed in-UI.

CRITICAL (external network dependency — UNIQUE in Jurepi): This is the first and only Jurepi tool that makes a client-side fetch to an external API. The IP address cannot be obtained without a network call; no first-party backend exists. To mitigate risk, the tool implements (1) a **multi-provider fallback chain** (primary + secondary providers, both free, no-auth) (2) a **timeout and graceful degradation** (if fetch hangs, show error + retry button) (3) **transparent privacy disclosure** (show the provider name; explain that the provider sees the user's IP) (4) **no logging or persistence** (IP never stored to localStorage or sent to Jurepi server). Platform-level CSP must allowlist the provider origins in `connect-src`.

CRITICAL (platform prerequisite: CSP + dev category): Adding this tool requires TWO platform changes that are NOT part of the tool module itself:
  1. Content Security Policy: the public/_headers file currently has NO CSP. This tool requires a scoped CSP that includes the IP API origins in `connect-src`. Example: `connect-src 'self' https://api.ipify.org https://ipwho.is`. This is a one-time platform infrastructure change documented below in <platform_integration>.
  2. Developer category activation: the `dev` category exists in the ToolCategory type union but is NOT wired (no i18n label ko "개발"/en "Developer", not in CATEGORY_ORDER, not in FOOTER_CATEGORIES). Activating it is a one-time platform prerequisite; see <platform_integration>.

CRITICAL (SPA, usability-first, SSG shell): Per platform rule, this tool is a client-side Single-Page Application (SPA) mounted on the SSG shell. The route is statically generated (SSG) for SEO; the IP fetch and display happen on the client after mount. The tool's SEO long-form ("What is my IP?", "IPv4 vs IPv6") and FAQ JSON-LD are server-rendered outside the mount gate (so AI crawlers see the content even though the live IP is not prerendered).

CRITICAL (no localStorage IP storage): The IP address is sensitive user data. It is NOT persisted to localStorage, NOT sent to any Jurepi server, and NOT used for analytics without explicit consent. The tool is stateless within a session.
</overview>

<platform_integration>
  - Route: /[locale]/tools/my-ip (SSG; registry slug "my-ip", id "my-ip", status "live", accent "rose", category "dev").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.my-ip.*` (UI chrome strings: labels, button text, error messages, privacy disclosure, FAQ — NOT IP data itself).
  - Platform dependency — CSP (REQUIRED): `public/_headers` currently ships no CSP. To enable this tool, add a scoped Content-Security-Policy header with IP API origins in `connect-src`:
    ```
    Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM}' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ipify.org https://ipwho.is; frame-src 'none'; object-src 'none'; base-uri 'self';
    ```
    OR, if a broader CSP already exists in the codebase, ensure `connect-src` includes the IP API origins. Commit as a separate "infra" change; document the new third-party dependency in a code comment or SECURITY.md note.
  - Platform dependency — dev category (REQUIRED ONE-TIME): The tool uses category "dev", which requires wiring:
    1. Add ko "개발" / en "Developer" label to the i18n messages (tools/categories).
    2. Add 'dev' to CATEGORY_ORDER (near the end; suggested position: after 'game'/'text' utilities).
    3. Add 'dev' to FOOTER_CATEGORIES (if footer shows categories).
    4. Define a category accent for 'dev' — suggested: use "rose" (accent accent-rose: #fb7185) per this tool's suggestion, or another accent if 'dev' is shared by future tools.
    After wiring, the category appears in the tool registry filter and footer. No code in this tool module changes; it is pure registry + i18n + platform constant edits.
  - ONE registry entry only. No new route slug→component or generateMetadata branch needed beyond the standard tool-route pattern (which already branches on slug).
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Client-side IP fetch: primary provider (api.ipify.org, IPv4 + IPv6 JSON) + secondary fallback (ipwho.is).
    - Display: large, copyable IP address (monospace, accent rose highlight) + optional ISP/geolocation labels ("approximate, from <provider>").
    - Refresh button: re-fetch IP with same provider chain.
    - Loading state: skeleton or spinner (respect prefers-reduced-motion).
    - Error handling: fetch fail / all providers down / rate-limited / blockers (ad/tracker blocking API) → clear error message + manual retry button.
    - Offline state: graceful; if service worker cached the response, show it; else show offline notice + offline retry button.
    - IPv6 detection: if available, display alongside IPv4 (or in a toggle); explain the difference.
    - Privacy disclosure: "Your IP is fetched from [Provider]. [Provider] sees your IP address. We do not log it." (inline or FAQ section).
    - SEO long-form: "What is my IP address?" / "IPv4 vs IPv6" / "public IP vs private IP" / "dynamic vs static IP" (server-rendered outside mount gate).
    - FAQ JSON-LD (FAQPage schema.org type).
    - Reduced-motion fallback; WCAG 2.1 AA accessibility.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry mechanism (all platform).
    - IP geolocation map or detailed location data (only approximate city/ISP label, marked "from <provider>").
    - IP history / session IP tracking (no persistence).
    - Custom IP lookup (tool always shows user's own IP, not query-able for arbitrary IPs).
    - VPN/proxy detection (display only what the API returns; no inference).
    - First-party server IP logs or analytics (zero first-party tracking of IPs).
  </out_of_scope>
  <future_considerations>
    - IPv6 native full address display (Phase 2).
    - Detailed GeoIP data (city, timezone, ASN) if provider's free tier permits (Phase 2).
    - Share IP as QR code (Phase 2).
    - IP comparison (my IP vs other device's IP clipboard) (Phase 3).
    - Historical IP list (opt-in localStorage) (Phase 3).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <module_specific>
    <api_providers>
      <provider name="api.ipify.org" priority="primary">
        - URL: `https://api.ipify.org?format=json` (IPv4) and `https://api6.ipify.org?format=json` (IPv6, optional).
        - Response shape: `{ ip: "203.0.113.45" }`.
        - Free tier: no auth required, ~1k requests/hour.
        - Timeout: 5s.
        - No geolocation in free tier.
      </provider>
      <provider name="ipwho.is" priority="secondary_fallback">
        - URL: `https://ipwho.is/?lang=en` (returns both IPv4 + IPv6 + geo).
        - Response shape: `{ ip: "203.0.113.45", country_code: "US", city: "New York", isp: "Example ISP", success: true }`.
        - Free tier: no auth, ~450 requests/day.
        - Timeout: 5s.
        - Includes ISP + approximate geolocation.
      </provider>
      <fallback_chain>
        1. Try api.ipify.org (IPv4 + IPv6 requests in parallel).
        2. If both timeout/fail, try ipwho.is.
        3. If both fail, show error + manual retry button.
        4. If ad/tracker blocker is blocking the API, catch network error and show friendly message: "IP service blocked by your ad blocker. Please disable for this site."
      </fallback_chain>
      <timeout_strategy>5s per provider. If hanging, abort and move to next provider. Total max time: ~10s before showing error.</timeout_strategy>
    </api_providers>
    <network_request>JavaScript Fetch API (no polyfills needed for modern browsers). AbortController for timeout. Error handling: fetch fail (CORS, timeout, network error) → gracefully degrade and show user-friendly error.</network_request>
    <animation>CSS fade-in for result, skeleton pulse-fade (respect prefers-reduced-motion). No complex animation library.</animation>
  </module_specific>
  <libraries>
    <no_external_npm_deps>Pure fetch + DOM, no IP parsing libraries.</no_external_npm_deps>
  </libraries>
</technology_stack>

<file_structure>
src/
├── lib/my-ip/                          # Pure domain layer — no React/Next
│   ├── schema.ts                       # zod: IpResult (ipv4, ipv6, isp, city), FetchError enum
│   ├── fetch.ts                        # fetchIp(): Promise&lt;IpResult&gt; — multi-provider chain, timeout, error handling
│   ├── normalize.ts                    # normalizeIpwho(raw): IpResult — coerce ipwho.is response shape
│   └── privacy.ts                      # privacyDisclosure(provider): string — i18n'd explanation
├── components/tools/my-ip/
│   ├── MyIp.tsx                        # Orchestrator (Client Component) — fetch state + UI owner
│   ├── useIpFetch.ts                   # Hook: fetch on mount, refresh, error/loading state, timeout tracking
│   ├── IpDisplay.tsx                   # Large monospace IP, copyable (rose accent), optional ISO+ISP below
│   ├── IpLoader.tsx                    # Skeleton or spinner (respect motion)
│   ├── IpError.tsx                     # Error message + manual retry button
│   ├── OfflineNotice.tsx               # Offline state + retry-when-online listener
│   ├── PrivacyDisclosure.tsx           # "From [Provider]" + link to FAQ
│   ├── MyIpIntro.tsx                   # H1 + lead (SEO; server-render where possible)
│   ├── MyIpHowTo.tsx                   # "What is an IP address?" / "IPv4 vs IPv6" / "public vs private" (SEO long-form)
│   ├── MyIpFaq.tsx                     # Q&A + FAQPage JSON-LD
│   └── copy-button.ts                  # copyText utility, silent fail if clipboard unavailable
└── i18n/messages/{ko,en}.json          # tools.my-ip.* UI chrome (buttons, error, privacy, FAQ)
</file_structure>

<core_data_entities>
  <ip_result note="domain model; shape returned by fetchIp()">
    - ipv4: string (e.g., "203.0.113.45"); required if fetch succeeds.
    - ipv6?: string (optional, may be null/undefined if unavailable).
    - isp?: string (e.g., "Example ISP Inc.") — from ipwho.is only; optional.
    - city?: string (e.g., "New York") — from ipwho.is; optional, marked "approximate".
    - provider: string (name of the API that returned this result).
    - fetchedAt: number (timestamp for UI "refreshed just now").
    INVARIANT: ipv4 always present on success; ipv6/isp/city are optional metadata.
  </ip_result>
  <fetch_error note="error states">
    - ALL_PROVIDERS_FAILED: both ipify + ipwho exhausted, timeouts/CORS.
    - BLOCKED_BY_AD_BLOCKER: fetch CORS fail with specific patterns (common pattern).
    - NETWORK_ERROR: no internet.
    - TIMEOUT: took >10s total.
    - RATE_LIMITED: 429 from provider (rare on free tier).
  </fetch_error>
  <app_state note="useState in MyIp">
    - data?: IpResult (null if loading/error).
    - error?: FetchError enum.
    - loading: boolean.
    - isOnline: boolean (from navigator.onLine + 'online'/'offline' events).
  </app_state>
  <constants>
    - TIMEOUT_PER_PROVIDER = 5000ms.
    - TOTAL_TIMEOUT = 10000ms.
    - IPIFY_TIMEOUT_JITTER = random 0–500ms (avoid thundering herd if many requests concurrent).
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/my-ip" page="MyIp (platform tool route, SSG)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "live") to SSG.</note>
</route_definitions>

<component_hierarchy>
  <my_ip>                       <!-- "use client"; owns fetch state + useIpFetch() -->
    <my_ip_intro />             <!-- H1 + lead (server-render where possible) -->
    <main_display>              <!-- Flex column, centered -->
      <ip_loader_or_display />  <!-- Conditional: if loading → IpLoader; else if data → IpDisplay; else if error → IpError -->
      <privacy_disclosure />    <!-- Small text below: "From [Provider]. Learn more in FAQ." -->
      <refresh_button />        <!-- Re-fetch button (below IP or in error state) -->
    </main_display>
    <my_ip_how_to />            <!-- SEO long-form -->
    <my_ip_faq />               <!-- FAQPage JSON-LD -->
  </my_ip>
  <note>SPA within tool: refresh = local state update (new fetch), NOT route navigation. No modals; all content on single page.</note>
</component_hierarchy>

<pages_and_interfaces>
  <my_ip_intro>
    - Eyebrow: "개발자 도구" / "DEVELOPER TOOL" — 12px/700/0.6px, var(--brand).
    - H1: "내 아이피 찾기" / "My IP Address" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text).
    - Lead: 1–2 sentences, body-lg 18px var(--text-secondary): "내 공개 IP를 한눈에 확인하세요." / English equivalent.
  </my_ip_intro>

  <ip_display>
    - Container: var(--surface) card, radius var(--radius-xl), padding 32px, centered flex column.
    - IP address: monospace (Courier New), 32–48px, var(--text), letter-spacing 0.1em, slightly breathy. Highlight background var(--accent-rose-soft), radius var(--radius-md), padding 8px 12px (rose accent per category).
    - IPv6 (if present): below IPv4, smaller font 18px, var(--text-secondary), or toggle "Show IPv6" (optional Phase 2).
    - Copy button: "복사" / "Copy" small button, aria-label, success toast on copy (silent fail if clipboard unavailable).
    - Below copy button: optional ISP/city line (14px var(--text-muted)): "ISP: Example Inc. · City: New York (approximate, from ipwho.is)". Marked as "approximate" + provider name.
    - Refresh button: "새로고침" / "Refresh" secondary button, below data (or top-right). Disabled during fetch.
    - Fetched-at timestamp: caption var(--text-muted) "방금" / "Just now" or "3초 전" / "3s ago" (optional).
  </ip_display>

  <ip_loader>
    - Skeleton: Pulse gray skeleton box (width 200px, height 48px) in the IP display container. OR spinner (rotateZ, --ease-out, 1.5s, respect prefers-reduced-motion → static loading text).
    - Subtext: "아이피를 조회 중입니다…" / "Fetching your IP…"
  </ip_loader>

  <ip_error>
    - Error icon: lucide icon (Network, WiFiOff, or AlertCircle), 32px var(--semantic-danger).
    - Error message: friendly text per error enum. Examples:
      - ALL_PROVIDERS_FAILED: "IP 서비스에 일시적 문제가 발생했습니다. 잠시 후 다시 시도하세요." / "IP service temporarily unavailable. Please try again in a moment."
      - BLOCKED_BY_AD_BLOCKER: "IP 서비스가 광고 차단기에 의해 차단되었습니다. 이 사이트에서 광고 차단기를 비활성화하고 다시 시도하세요." / "IP service blocked by ad blocker…"
      - NETWORK_ERROR: "인터넷 연결을 확인하세요." / "Check your internet connection."
    - Retry button: "다시 시도" / "Try Again", primary action.
  </ip_error>

  <privacy_disclosure>
    - Small text below IP (or in FAQ): "당신의 아이피는 [Provider명]에서 조회됩니다. [Provider]는 당신의 IP를 볼 수 있습니다. 주레피는 이를 저장하거나 기록하지 않습니다." / English equivalent.
    - Link to FAQ for deeper privacy Q&A.
  </privacy_disclosure>

  <keyboard_and_a11y>
    - Refresh button: Tab-able, clear aria-label.
    - Copy button: Tab-able, aria-label "IP 주소 복사" / "Copy IP address", success announced via aria-live.
    - IP text: no tabindex (not interactive), but copyable via button.
    - Loading state: aria-live="polite" announces "Fetching your IP…".
    - Error state: aria-live="assertive" announces error message (user attention).
  </keyboard_and_a11y>

  <responsive>
    - ≥1024px: centered card (max-width 600px).
    - 768–1023px: card full width minus padding.
    - <768px: full viewport, single column, padding 16px. Large IP text scales down gracefully (clamp).
    - Touch: ≥44px tap targets (buttons).
  </responsive>
</pages_and_interfaces>

<core_functionality>
  <fetch_ip_on_mount note="useIpFetch hook">
    - Mount: useEffect → call fetchIp() (domain layer).
    - State: loading = true, error = null, data = null.
    - Success: data = IpResult, error = null, loading = false. Show data + refresh button.
    - Failure: data = null, error = FetchError enum, loading = false. Show error + retry.
    - Refresh button click: re-run fetchIp() (same flow).
  </fetch_ip_on_mount>
  <fetch_chain note="lib/my-ip/fetch.ts">
    - Parallel IPv4 + IPv6 from ipify.org (5s timeout each, AbortController).
    - If both timeout/fail: try ipwho.is (5s timeout).
    - If ipwho.is returns but missing IPv4, fail (ipv4 required).
    - Return IpResult on first success; throw FetchError on all fail.
    - Catch CORS/network → check if ad blocker pattern → map to BLOCKED_BY_AD_BLOCKER error.
  </fetch_chain>
  <privacy_and_disclosure>
    - Tool discloses provider name in UI ("from api.ipify.org" / "from ipwho.is").
    - No first-party IP storage (localStorage remains empty).
    - No analytics event includes IP.
    - No Jurepi server sees IP.
    - User may optionally share IP via copy-to-clipboard.
  </privacy_and_disclosure>
  <offline_and_errors>
    - navigator.onLine + 'online'/'offline' events.
    - Offline: show OfflineNotice (may still show last-known IP if fetched earlier in session, or empty state).
    - Retry on reconnect: listen for 'online' event, auto-retry fetch.
    - Ad blocker: detect CORS-like errors + common hostname blocks, show friendly message + instructions.
  </offline_and_errors>
  <copy_to_clipboard>
    - copyText() utility: try navigator.clipboard.writeText, fallback execCommand, silent fail.
    - Success: show toast "복사되었습니다" / "Copied!" (1.5s).
    - Fail (clipboard unavailable): silent (do not show false success).
  </copy_to_clipboard>
  <i18n>All UI chrome from tools.my-ip.* (ko/en): button labels, error messages, privacy disclosure, FAQ. IP data itself is locale-agnostic.</i18n>
</core_functionality>

<error_handling>
  <build_time>Static route SSG; no build-time IP dependency (fetch is runtime-only, on client).</build_time>
  <fetch_failure>
    - Reported as FetchError enum + user-friendly message (per <pages_and_interfaces>).
    - Retry button allows manual re-attempt.
    - No auto-retry loop (respects rate limits, user in control).
  </fetch_failure>
  <clipboard_fail>Silent; do not show false success toast.</clipboard_fail>
  <network_unavailable>Show OfflineNotice. Auto-retry when online (listener). User can manually retry.</network_unavailable>
  <rate_limit>All providers have free tier rate limits (~1k/day for ipify). If 429 returned, map to RATE_LIMITED error + explain "service limit reached, try again later".</rate_limit>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash.</error_boundary>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of all tokens. Below are tool-specific applications.</source>
  <accent_usage>Category accent is ROSE (var(--accent-rose) #fb7185) — "dev" category identity. IP display highlight background, button hover, icon tint all use rose (or rose-soft for background).</accent_usage>
  <surfaces>Card = var(--surface) + 1px var(--hairline), radius var(--radius-xl), padding 32px. Monospace IP on rose-soft background chip. Button states: hover = lifted shadow.</surfaces>
  <typography>H1 Gmarket Sans clamp(28–40px)/700; IP monospace 32–48px; labels 14–16px Pretendard.</typography>
  <motion>fade-in on load (150ms, respect prefers-reduced-motion). Refresh button spin (rotateZ, 1.5s) during fetch (instant on reduce-motion). Copy success toast slide-up 200ms.</motion>
  <accessibility>≥44px buttons; clear aria-labels; aria-live for async state. Focus ring var(--focus-ring). No color-only status (always text + icon).</accessibility>
  <responsive>Clamp IP font size (32–48px). Card max-width 600px. <768px full width, padding 16px.</responsive>
  <atmosphere>Clean, developer-focused utility. Large, prominent IP (main event). Minimal chrome. Privacy-first tone.</atmosphere>
  <icons>lucide-react: Copy (copy), RotateCw (refresh), AlertCircle (error), WiFiOff (offline), Network (generic network). 24–32px, stroke 1.75.</icons>
</aesthetic_guidelines>

<security_considerations>
  <network note="third-party API trust">
    - Both api.ipify.org and ipwho.is are established, reputable free IP services.
    - CSP `connect-src` allowlist in platform/_headers is the gate (mitigates CSRF/subdomain injection).
    - No custom auth; both services are read-only public endpoints.
    - Request is HTTPS only (browser enforces).
  </network>
  <input note="no user input for IP lookup">IP lookup is automatic (user's own IP); no query parameter. No DNS/URL injection risk.</input>
  <response note="untrusted third-party JSON">
    - Response parsed with zod schema (FetchError on invalid).
    - IP address validated as string (no exec/code).
    - ISP/city strings rendered as text nodes (React escape). No dangerouslySetInnerHTML.
  </response>
  <storage note="no persistence">IP NOT stored to localStorage. No session cookies set by this tool. Each mount = fresh fetch.</storage>
  <privacy note="user-facing transparency">
    - Tool discloses provider name in UI.
    - User told that provider sees IP.
    - User told Jurepi does NOT log/store.
    - Copy-to-clipboard is user-initiated (not automatic sharing).
  </privacy>
  <csp_implementation note="platform responsibility">
    - Tool itself does NOT set CSP headers (platform does, in public/_headers).
    - Tool assumes CSP is configured with provider origins in `connect-src`.
    - If CSP is missing/wrong, fetch will fail (CORS error), caught gracefully.
  </csp_implementation>
  <note>No secrets, no first-party server calls, no storage of sensitive data.</note>
</security_considerations>

<advanced_functionality>
  <ipv6_toggle optional="true">Phase 2: if IPv6 available, toggle display (IPv4 only / IPv6 only / both). Default both.</ipv6_toggle>
  <geolocation_enrichment optional="true">Phase 2: if provider returns timezone, timezone badge. ASN enrichment (if available). Always marked "approximate".</geolocation_enrichment>
  <share_qr optional="true">Phase 2: generate QR code of current IP (or IP as text), share via native share API.</share_qr>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Successful IP fetch + display</description>
    <steps>
      1. Visit /ko/tools/my-ip in browser with healthy network.
      2. Mount → useIpFetch fires, loading spinner shown.
      3. api.ipify.org responds with IPv4 + IPv6 within 5s.
      4. Spinner vanishes, large IP displayed in rose-tinted box.
      5. "복사" button visible + clickable; click → toast "복사되었습니다" + IP in clipboard.
      6. Refresh button re-fetches (spinner, new timestamp, same IP if no network change).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Primary provider timeout, fallback to secondary</description>
    <steps>
      1. api.ipify.org hangs (simulate 6s delay).
      2. After 5s timeout, tool moves to ipwho.is.
      3. ipwho.is responds in 2s (IPv4 + ISP + city).
      4. IP + ISP/city displayed (labeled "from ipwho.is").
      5. Within 10s total; user sees result, no error.
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>All providers fail, error state + manual retry</description>
    <steps>
      1. Both api.ipify.org and ipwho.is time out (simulate 6s each).
      2. After ~10s, error displayed: "IP 서비스에 일시적 문제…".
      3. "다시 시도" button visible; click → new fetch attempt (spinner).
      4. If manually re-check network (connect to WiFi), refresh button works.
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Ad blocker blocks API, friendly error + instructions</description>
    <steps>
      1. User has aggressive ad blocker (uBlock, Adblock Plus).
      2. Tool attempts fetch; CORS error caught.
      3. Error message: "IP 서비스가 광고 차단기에 의해 차단되었습니다…".
      4. Instructions: "이 사이트에서 광고 차단기를 비활성화하세요" / "Disable ad blocker for this site".
      5. User disables blocker, clicks "다시 시도" → fetch succeeds.
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>i18n, SEO, offline fallback, accessibility</description>
    <steps>
      1. Switch to /en → all UI chrome English (button labels, error messages, privacy text).
      2. Build prod → prerendered /ko/tools/my-ip and /en/tools/my-ip; HTML includes SoftwareApplication JSON-LD, FAQ JSON-LD, how-to long-form (outside mount gate).
      3. Go offline (devtools); if IP fetched, cached IP shown; else OfflineNotice. "다시 시도" button disabled until online.
      4. axe scan → no violations, buttons labeled, aria-live catches state changes, focus ring visible.
    </steps>
  </test_scenario_5>
</final_integration_test>

<success_criteria>
  <functionality>CRITICAL: IP fetched from multi-provider chain (api.ipify.org primary, ipwho.is fallback), displayed in ≤10s. Refresh re-fetches. IPv6 shown if available. Copy-to-clipboard works (or silently fails if unavailable). Error states clear + retryable.</functionality>
  <network_resilience>Timeout per provider: 5s. Total max: 10s. Graceful fallback on any failure (primary → secondary → error). Ad blocker detection + friendly message.</network_resilience>
  <privacy_transparency>Provider name disclosed in UI. User told provider sees IP. User told Jurepi does not store/log. No localStorage IP persistence.</privacy_transparency>
  <user_experience>Large, copyable IP (main event). Private tooltip/FAQ explains "approximate geolocation from <provider>". One-click refresh. Offline awareness. Mobile touch-friendly (≥44px targets).</user_experience>
  <technical_quality>lib/my-ip/* pure ≥85% unit coverage (fetch chain, error mapping, normalize); component integration tests (useIpFetch); E2E scenarios 1–5; TS 0 errors; <600 lines per file.</technical_quality>
  <seo>Prerendered HTML includes SoftwareApplication + FAQPage JSON-LD + how-to long-form (SSR, outside mount). title/description/canonical per locale via platform lib/seo. Sitemap includes tool URL.</seo>
  <accessibility>Full keyboard (tab → buttons, enter/space → click), aria-labels on buttons, aria-live on async state, no color-only affordances, focus-ring visible, WCAG 2.1 AA.</accessibility>
  <aesthetic>Rose accent identity (not overused), clean utility vibe, large prominent IP, minimal chrome, graceful degradation (motion-respect, offline handling).</aesthetic>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). No prebuild/postbuild hooks needed (IP fetch is runtime-only, no codegen). /[locale]/tools/my-ip pre-rendered by platform generateStaticParams iterating registry (status "live").</note>
  <static_output>Two routes: /ko/tools/my-ip, /en/tools/my-ip. HTML includes SoftwareApplication + FAQPage JSON-LD, how-to long-form, privacy prose. Client JS handles fetch (no prerendered IP data).</static_output>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. 'dev' category must be pre-wired (see platform_integration).
    {
      id: 'my-ip',
      slug: 'my-ip',
      category: 'dev',         // Requires platform category wiring (i18n + CATEGORY_ORDER + accent)
      icon: 'Globe',           // lucide-react
      accent: 'rose',
      status: 'live',
      isNew: true,
      order: 20,
      keywords: ['아이피','IP','공개IP','public IP','IPv4','IPv6','나의IP','내IP','IP찾기','IP주소','네트워크','network address','isp','my ip address','what is my ip'],
    },
    ```
  </platform_registry_change>
  <platform_csp_change>
    ```
    // public/_headers — add OR update Content-Security-Policy to allow IP API origins
    // IF NO CSP exists yet, introduce one with provider origins in connect-src:
    /*
      Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM}' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.ipify.org https://ipwho.is; frame-src 'none'; object-src 'none'; base-uri 'self';
    ```
    This is a one-time platform infrastructure change, separate from the tool module.
  </platform_csp_change>
  <platform_dev_category_wiring>
    ```
    // src/tools/categories.ts (or i18n messages) — add 'dev' label
    categories: {
      dev: { ko: '개발자 도구', en: 'Developer Tools', accent: 'rose' },
      // ... existing categories
    }
    
    // src/tools/CATEGORY_ORDER — add 'dev' (suggested position)
    export const CATEGORY_ORDER: ToolCategory[] = ['game', 'text', 'util', 'dev'];
    
    // src/components/Footer.tsx (or equivalent) — add 'dev' if showing categories
    FOOTER_CATEGORIES: ToolCategory[] = ['game', 'text', 'util', 'dev'];
    ```
    This is a one-time platform constants change.
  </platform_dev_category_wiring>
  <critical_paths>
    1. Fetch chain: ipify → timeout → ipwho → error mapping (ALL_PROVIDERS_FAILED, BLOCKED_BY_AD_BLOCKER, NETWORK_ERROR, TIMEOUT, RATE_LIMITED). Entire UX depends on this.
    2. Privacy-first: no localStorage IP storage, no Jurepi server call, provider name disclosed.
    3. CSP dependency: fetch fails silently (CORS) if CSP not configured; must catch and explain to user.
  </critical_paths>
  <recommended_implementation_order>
    1. lib/my-ip/{schema.ts, fetch.ts, normalize.ts} Vitest (RED→GREEN): FetchError enum, IpResult schema, ipify chain (success/timeout/fail paths), ipwho fallback, error mapping, ad-blocker detection.
    2. useIpFetch hook + offline detection (navigator.onLine events).
    3. IpDisplay + IpLoader + IpError + OfflineNotice components.
    4. MyIp orchestrator + privacy-disclosure wiring.
    5. tools.my-ip.* i18n messages (ko/en).
    6. MyIpIntro + MyIpHowTo + MyIpFaq + JSON-LD via platform lib/seo.ts.
    7. Copy-to-clipboard integration + toast.
    8. Keyboard a11y + axe test.
    9. E2E scenarios 1–5; visual regression 320/768/1024 both themes.
    10. Registry entry + platform CSP + platform dev category wiring.
  </recommended_implementation_order>
  <network_resilience_note>Timeout/CORS/network errors are expected and handled gracefully. No exponential backoff (respects rate limits; user in control via retry button). Ad blocker detection is pattern-based (common blocker URLs + CORS signature).</network_resilience_note>
  <testing_strategy>Pure Vitest ≥85% (fetch chain, error cases, normalize shapes, offline state); component useIpFetch integration; E2E scenarios 1–5 (successful fetch, timeout + fallback, all fail + error + retry, ad blocker, offline); clipboard/navigator mocked; CSP validation (if platform provides CSP, fetch succeeds; if not, fetch fails and error caught).</testing_strategy>
</key_implementation_notes>

</project_specification>
```
