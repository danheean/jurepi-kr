# Online Bingo — Real-time Multiplayer Rooms — Service SPEC

> This document is the **canonical (English) source** consumed by AI coding agents. The Korean translation should live in [`SPEC_KR.md`](SPEC_KR.md); keep both in sync when either changes.
>
> Build specification for **온라인 빙고 / Online Bingo** (Korean display name: **온라인 빙고**; English display name: *Online Bingo — Real-time Multiplayer Rooms*) — a real-time multiplayer game where a host creates a bingo room, participants join via invite code, each participant receives a unique card (5x5 or 7x7 grid, no duplicates), the host draws numbers or spins a roulette wheel to reveal them to all players in real-time, players mark matching numbers on their cards, and the first to complete a bingo (1 line, N lines, or blackout) submits and wins. This is **the first Jurepi tool with a real backend** (Supabase Postgres + Realtime + Row Level Security) — client-side state lives in the browser, but durability (no data loss until room is destroyed, auto-restore on refresh/reconnect) is guaranteed by the Postgres schema and Realtime subscriptions. Mobile-first, responsive, sound enabled, SEO-friendly, i18n ko/en.
>
> Internal service codename: `online-bingo`. Registry id: `online-bingo`. Public URL slug: `/[locale]/tools/online-bingo`.
>
> This SPEC covers the tool itself. The shared shell (header/footer/locale/theme/consent), tool registry, SEO & ad infrastructure, and design tokens are provided by the platform:
> - Platform SPEC: [`docs/SPEC.md`](../../../SPEC.md)
> - Design system (single source of visual truth): [`docs/DESIGN.md`](../../../DESIGN.md)
> - Reference sibling tool SPEC (interactive game): [`docs/services/random/roulette/SPEC.md`](../../random/roulette/SPEC.md)

```xml
<project_specification>

<project_name>온라인 빙고 (Online Bingo — Real-time Multiplayer Rooms) (Jurepi tool, codename online-bingo, registry id online-bingo)</project_name>

<overview>
Online Bingo transforms a solo game into a **real-time multiplayer experience**. A host creates a room, sets bingo grid size (5x5 with 24 numbers + center joker, or 7x7 with 48 numbers + center joker), defines the number-swap limit (default 5 changes per player), sets the win condition (default 1 line; also N lines or blackout), and specifies a start deadline (10/20/30 minutes — participants must join and click "Ready" within that window). Participants join via a randomly-generated 6-digit invite code, enter their name (duplicates rejected per room), and receive a server-assigned bingo card (no duplicates, numbers 1–100). Players can shuffle their card (limited swaps, server dedupes), then mark "Ready". Once ready, the host can draw numbers one-by-one (manual input or spinning a roulette wheel). Every drawn number broadcasts to all players in real-time via Supabase Realtime, auto-marking matching cells. The first player to complete a bingo (rows, columns, diagonals, or full blackout per win condition) can submit. The host sees a live leaderboard of submissions in order. **CRITICAL DURABILITY**: All room state (players, cards, drawn numbers, submissions) lives in Postgres. Refresh or network drop → client reconnects and reads full room state from DB → state restored. Host destroys room → ON DELETE CASCADE purges all data. Nothing disappears until room is destroyed.

CRITICAL (real backend, stateful multiplayer): 100% client-side *UI* (React SPAs mounted on SSG routes), but state is DURABLE in Postgres + Realtime. This is a network-dependent tool (unlike roulette/rankings). Supabase anon key is safe (public, readonly in NEXT_PUBLIC_* env vars) because Row Level Security policies restrict reads/writes by room+player tokens. Server-authoritative operations (number assignment, swaps, draws, submit order) live in RPC functions / Edge Functions, never trusted to client. No accounts/login — tokens are anonymous per player per room.

CRITICAL (multiplayer SPA): All interaction — creating rooms, joining by code, shuffling cards, marking ready, watching draws, watching other players mark, submitting bingo — is a single-page SPA (NO route reload). The tool route is SSG. The interactive game is a full client-side React island with real-time WebSocket subscription to Supabase Realtime channels.

CRITICAL (mobile usability, important): This tool will be played primarily on smartphones during parties/gatherings. Mobile-first responsive design (320px critical), no overflow, large touch targets (≥44px), landscape/portrait swing, sound cues (beep on draw, fanfare on bingo), reduced-motion fallback. Performance must be tight — draws must appear ≤200ms after host triggers (broadcast via Realtime).
</overview>

<platform_integration>
  - Route: /[locale]/tools/online-bingo (SSG; registry slug "online-bingo", id "online-bingo", status "coming_soon", accent "cyan" or "sky", category "fun").
  - Provided by the platform (do NOT reimplement): app shell (Header/Footer/LocaleSwitcher/ThemeToggle), ConsentBanner, AdSlot, Toast system, design tokens (tokens.css ↔ DESIGN.md), i18n runtime, Error Boundary around the tool module, lib/seo.ts metadata builder, breadcrumb + in_content ad wrapper.
  - Consumes: i18n namespace `tools.online-bingo.*` (UI chrome: create room, join room, invite code, ready, draw, bingo!, submit, leaderboard, swaps left, etc.); NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (for Supabase JS client).
  - Platform prerequisite: Supabase project created + RLS policies configured + schema migrations applied (one-time setup by deploy-engineer or Jurepi ops). Env vars (.env.production) committed for static export; anon key is safe (public, RLS enforced).
  - No new category needed; `fun` category already exists. Tool keeps default category accent or defines per-tool accent "sky"/"cyan" for ice theme.
</platform_integration>

<scope_boundaries>
  <in_scope>
    - Room management: host creates room (size 5x5/7x7, swaps limit, win condition, start deadline), generates 6-digit invite code, gets unique host_token for admin control. Room status: waiting (before start deadline), playing (after deadline or host starts), finished (someone won, can still view).
    - Participant join: open rooms list with invite codes visible (or card view), join by code + enter name (dupe-check per room), receive unique player_token + server-assigned bingo card.
    - Card assignment: server RPC `assign_card(room_id, player_id, grid_size)` generates random unique numbers 1–100, no duplicates per room. Returns card as 2D array. Center cell (5x5[2,2] or 7x7[3,3]) is joker (always open).
    - Number swaps: player can request `swap_numbers(player_token, room_id, card_indices: [i, j])` (swap two cells). Server dedups, updates card, broadcasts to player only (private, not public). Limited count (5 default), tracked per player.
    - Ready state: player clicks "Ready" → `set_ready(player_token, room_id, ready: true)` → broadcasts to host (host sees all players + ready count); once ready, swaps disabled (must "unready" to swap again). Host sees timer countdown to start deadline.
    - Drawing numbers: host can (a) manually type a number 1–100 (server dedups, rejects if already drawn); (b) spin a roulette (visual wheel shared from roulette SPEC, but draws are deterministic server-side from the same 1–100 pool, never drawn twice). Each draw → `record_draw(host_token, room_id, number)` → broadcasts to all players via Supabase Realtime "room:{room_id}" channel. All players auto-mark matching cells locally (deterministic, same logic).
    - Bingo detection: client-side pure logic (line detection: rows, cols, diagonals for 5x5 and 7x7; also blackout all N²-1 + center joker). Win condition gated by host setting (1 line → enable submit on first line; N lines → enable on Nth; blackout → enable on full grid). Player clicks "Submit" → records `submit_bingo(player_token, room_id, board_state: int[])` with board grid (for audit); server validates the bingo (re-runs line detection) → if valid, increments submit_order (server timestamp); host leaderboard shows player name + rank in real-time.
    - Leaderboard (host view): live list of all players (name, status: waiting/ready/submitted, card preview optional) + submission order (🥇 first, 🥈 second, etc.). Host can view submitted cards (zoomed table, not full grid). Host can reset/destroy room.
    - Realtime: Supabase Realtime subscriptions on channel `room:{room_id}` broadcast: player_joined, player_ready, number_drawn, bingo_submitted. Latency ≤200ms typical (Supabase SLA). Subscribes on room load, unsubscribes on leave/destroy.
    - Persistence & durability: state lives in Postgres (rooms, players, cards, drawn_numbers, submissions). Client caches in localStorage (room_id + player_token + current_card for fast UI redraw on mount). Refresh/reconnect → client sends player_token → server re-reads full room state → broadcast to client. All data deleted on room destroy (ON DELETE CASCADE players → purges submissions/draw events).
    - Mobile-first responsive: 320px minimum (landscape, tall phone); 375px typical; 768px tablet; 1024/1440px desktop. All UI adapts (grid scales, control panel stacks). Landscape phone bingo grid fills width with controls below. Sound (beeps on draw, fanfare on win) with toggle. No visual overflow at any breakpoint.
    - Sound: Web Audio API beeps (draw tick), chime (bingo alert), fanfare (winner), all settable volume + toggle in Settings.
    - Tool-specific SEO long-form (how to play online bingo, rules) + FAQ + SoftwareApplication JSON-LD + llms.txt. Localized ko/en. Promo: "Play free bingo with friends online, real-time multiplayer."
    - Keyboard: "/" search (invite code), Tab navigation, Enter to join/ready/draw/submit, Escape to cancel. Roving focus in player list.
    - Accessibility: WCAG 2.1 AA, aria-live updates on draw/bingo, card grid has aria-label per row/col, buttons labeled, visible focus ring, color + icon for bingo cells, reduced-motion fade-only.
  </in_scope>
  <out_of_scope>
    - App shell, header/footer, locale switcher, theme toggle, consent banner, ad loading, sitemap/robots, tool registry (all platform).
    - User accounts / login / cross-device sync. Anonymous token-based only.
    - In-game chat or messaging.
    - Ranked ladder or persistent statistics (rooms are ephemeral).
    - Variations like "Speed Bingo" or "Reverse Bingo" (Phase 2).
    - Custom card designs or emojis (Phase 2).
    - Per-room deep-link shareable URLs (MVP single route, Phase 2).
    - Screenshots or share-to-social (Phase 3).
  </out_of_scope>
  <future_considerations>
    - Per-room shareable deep-links + unique room detail pages (Phase 2).
    - Quick-join via QR code (Phase 2).
    - Variations: Speed Bingo (timed rounds), Reverse Bingo (last to complete), Multi-card mode (Phase 3).
    - Spectator mode (non-player viewers watching live) (Phase 3).
    - Custom card images / emojis per player (Phase 3).
    - Statistics / game history dashboard (post-room destroy) (Phase 3).
    - Monetization: cosmetics, premium card templates, ad-free (Phase 3 post-launch).
  </future_considerations>
</scope_boundaries>

<technology_stack>
  <inherited>Next.js 15 App Router, React 19, TS strict, Tailwind v4 + DESIGN.md tokens, next-intl (ko/en) — all inherited from the platform.</inherited>
  <backend_stack>
    <supabase note="real backend, stateful multiplayer">
      Supabase Postgres (hosted) + Supabase Realtime (WebSocket) + Row Level Security (RLS).
      **Critical assumption**: Supabase project created, anon key in NEXT_PUBLIC_SUPABASE_* committed to .env.production (safe because RLS enforces access control).
    </supabase>
    <database_schema note="Postgres schema, deployed via migration">
      Tables:
      - rooms (id UUID PK, invite_code UNIQUE CHAR(6), host_token UUID UNIQUE, size INT 5 or 7, change_limit INT default 5, win_condition ENUM 1line/Nline/blackout, start_deadline TIMESTAMP, status ENUM waiting/playing/finished, drawn_numbers INT[], created_at TIMESTAMP). Indexes: invite_code (join by code), host_token (host auth), status (list rooms).
      - players (id UUID PK, room_id UUID FK → rooms.id ON DELETE CASCADE, name VARCHAR(50) UNIQUE per room (checked at DB constraint or app level), player_token UUID UNIQUE, card INT[] (flattened 1D array or JSON array), swaps_used INT default 0, ready BOOL default false, joined_at TIMESTAMP). Indexes: room_id, player_token (auth).
      - submissions (id UUID PK, room_id UUID FK, player_id UUID FK, board_state INT[], submit_order SERIAL per room (enforces first-come ranking), submitted_at TIMESTAMP). Indexes: room_id, submit_order.
      Optional: draw_events (id, room_id, number INT, drawn_at TIMESTAMP) for audit trail (not required for MVP).
      RLS Policies:
        - rooms: SELECT all (no auth needed to list), but only host_token can UPDATE/DELETE.
        - players: SELECT room's players (room_id matches), only own player_token can UPDATE (ready, card updates).
        - submissions: SELECT room's submissions, only own player_token can INSERT.
    </database_schema>
    <realtime note="Supabase Realtime channels">
      Channels: `room:{room_id}` broadcasts JSON events (player_joined, number_drawn, player_ready, bingo_submitted). Client subscribes on room load, listens for updates, applies state changes locally (draw marking, leaderboard refresh, player ready status).
    </realtime>
    <rpc_functions note="Postgres stored procedures or Edge Functions (Deno) for server logic">
      - assign_card(room_id, player_id, grid_size) → returns card INT[] (random unique 1–100, center joker).
      - swap_numbers(player_token, room_id, indices: [a, b]) → if swaps_used < change_limit, swap, increment swaps_used, return new card. Else error.
      - record_draw(host_token, room_id, number INT) → if not already drawn, append to drawn_numbers, broadcast "number_drawn" via Realtime, return success. Else error.
      - set_ready(player_token, room_id, ready BOOL) → updates ready, broadcasts "player_ready" (include player name + count ready/total).
      - submit_bingo(player_token, room_id, board_state INT[]) → validates bingo (client sends grid, server re-computes), if valid insert submission (with server-generated timestamp for submit_order), broadcast "bingo_submitted". Else error (fake bingo rejected).
      All RPC calls enforce access control (player_token / host_token check).
    </rpc_functions>
  </backend_stack>
  <module_specific>
    <client_libraries>
      - @supabase/supabase-js v2: browser client, connects via NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY, auto-handles Realtime subscriptions.
      - zod: schema validation (room create request, join request, card grid).
    </client_libraries>
    <game_logic note="pure client-side domain layer">
      - Card grid manipulation: flatten/unflatten (1D ↔ 2D array), mark_cell(grid, row, col), unmark_cell(grid, row, col).
      - Bingo detection: detect_bingo(grid, win_condition: "1line" | "Nlines" | "blackout") → bool (rows, cols, diagonals for both 5x5 and 7x7, count consecutive).
      - Draw marking: on number_drawn event, auto-find matching cells → mark (deterministic, all players see same result).
    </game_logic>
    <animation>CSS transitions (card reveal on mark, fade-in on bingo highlight); Web Audio API beeps/chimes (no dependencies); confetti on bingo (CSS keyframes, respects prefers-reduced-motion).</animation>
    <persistence note="hybrid client+server">
      Client localStorage: { version, room_id, player_token, card, drawn_numbers, ready_status }. Used for instant UI load (fast page-transition feel). Server Postgres: canonical truth. On mount, read local cache → render stale UI → fetch from server (via Realtime subscription or HTTP GET) → merge/update.
    </persistence>
  </module_specific>
</technology_stack>

<file_structure>
scripts/
└── migrations/
    └── 001_create_bingo_schema.sql  # Postgres schema: rooms, players, submissions, RLS policies

src/lib/online-bingo/
├── schema.ts                         # zod: Room, Player, Card, DrawEvent, Submission, RoomCreateRequest, JoinRequest
├── grid.ts                           # Card grid logic: markCell, unmarkCell, isBingo, grid 5x5↔7x7 dimensions
├── bingo-detection.ts                # detectBingo(grid, size, winCondition) → bool; countLines(grid, size)
├── invite-code.ts                    # generateInviteCode() → "123456", validateCode(code) → bool
├── supabase-client.ts                # Exported client: createBrowserClient(url, anonKey); subscribe helpers
└── types.ts                          # TypeScript interfaces: Room, Player, Card, etc. (shared with generated JSON)

src/components/tools/online-bingo/
├── OnlineBingo.tsx                   # Client Component; owns room_id, player_token, player_card, drawn_numbers state + useOnlineBingo() owner
├── useOnlineBingo.ts                 # Hook: fetch room + subscribe Realtime "room:{id}" channel, localStorage cache, Supabase calls (draw, swap, ready, submit)
├── HostCreateRoom.tsx                # Host-only form: size (5x5/7x7), swaps limit, win condition, start deadline (picker 10/20/30 min). POST to Supabase create_room RPC. Returns room_id + invite_code + host_token.
├── ParticipantJoin.tsx               # Participant-only form: invite code (6-digit input or paste from share), name input (dupe-check client + server). POST to Supabase join_room RPC. Returns player_token + card.
├── RoomLobby.tsx                     # Waiting-room state: participant shows "Please wait for host to start" + invite code display + host list. Host shows all players (name, status ready/not) + "Start Game" button (gray until start_deadline OR all ready).
├── BingoGrid.tsx                     # 5x5 or 7x7 grid display; rows/cols/cells; center joker always marked; clickable cells toggle mark (client-only visual, no server call); mark on draw auto-apply. aria-label per cell. Responsive (scales width on mobile).
├── DrawPanel.tsx                     # Host-only: two modes (a) manual input (number 1–100 picker/text field) (b) roulette wheel (reuses Roulette SVG). Each draw → call recordDraw RPC → broadcasts.
├── PlayerReadyButton.tsx             # "Ready" button toggle (host hides); disables card swaps while ready. Shows swap count remaining (e.g., "3 swaps left").
├── CardShuffleButton.tsx             # "Shuffle" / "Swap" UI: click → modal/dialog with two cells selector (or drag-and-drop), confirm → call swapNumbers RPC.
├── BingoSubmitButton.tsx             # "Submit Bingo" CTA; active only if detectBingo returns true for current board + win_condition. Calls submitBingo RPC. Shows confetti on success. Toast "Congratulations!" + rank.
├── HostLeaderboard.tsx               # Host live view: list of all players (name, status, card thumbnail clickable), then submission leaderboard (🥇🥈🥉 + name + timestamp).
├── BingoIntro.tsx                    # H1 + lead (SEO; server-render where possible)
├── BingoHowTo.tsx                    # "How to play online bingo" (SEO long-form) + rules variations.
├── BingoFaq.tsx                      # Q&A + FAQPage JSON-LD
├── DrawNotification.tsx              # Toast-style: "Number XX drawn! Mark your card." auto-dismiss. aria-live region.
├── BingoAlert.tsx                    # On own bingo: full-screen alert "BINGO!" + confetti + fanfare sound.
├── SettingsPanel.tsx                 # Sound toggle + volume slider; grid size display; ping/latency indicator (Realtime health).
├── ErrorState.tsx                    # Network disconnected, invalid room code, duplicate name, etc. with "Retry" button.
├── RoomDestroyButton.tsx             # Host-only: "End Game" / "Destroy Room" (confirms before calling destroyRoom RPC).
└── confetti.ts                       # Dependency-free confetti (CSS keyframe + element spawn on bingo, respects prefers-reduced-motion).

src/i18n/messages/{ko,en}.json       # tools.online-bingo.* UI chrome (create, join, ready, draw, bingo, submit, leaderboard, swaps, size, condition, etc.)

public/sounds/
├── draw-tick.wav                     # Beep on draw (~100ms)
├── bingo-fanfare.wav                 # Celebration sound on win (~500ms)
└── alert-chime.wav                   # Alert chime when someone bingo (other players)
</file_structure>

<core_data_entities>
  <room note="root aggregate">
    - id: UUID primary key
    - invite_code: CHAR(6) unique (random digits "123456")
    - host_token: UUID unique (host auth, random on create)
    - size: INT (5 or 7) — grid size
    - change_limit: INT (default 5) — swaps per player
    - win_condition: ENUM ("1line" | "Nlines" | "blackout")
    - start_deadline: TIMESTAMP ISO (10/20/30 min from now)
    - status: ENUM ("waiting" | "playing" | "finished")
    - drawn_numbers: INT[] (numbers 1–100 drawn so far; server enforces no duplicates)
    - created_at: TIMESTAMP
    INVARIANT: invite_code unique, host_token secret, size immutable, drawn_numbers ever-appending (no resets).
  </room>
  <player note="per-participant">
    - id: UUID primary key
    - room_id: UUID FK → rooms.id (cascade delete)
    - name: VARCHAR(50) unique per room (app enforces case-insensitive dupe-check)
    - player_token: UUID unique (player auth, random on join)
    - card: INT[] (flattened 1D 25 or 49 elements) — numbers assigned server-side
    - swaps_used: INT default 0 (increments on each swap, max change_limit)
    - ready: BOOL default false (can mark ready when all swaps finalized)
    - joined_at: TIMESTAMP
    INVARIANT: card assigned server-side (random 1–100, no dupes per room), center always joker.
  </player>
  <submission note="one per bingo per game">
    - id: UUID
    - room_id: UUID FK
    - player_id: UUID FK
    - board_state: INT[] (snapshot of card grid when submitted, for audit)
    - submit_order: SERIAL per room (auto-incrementing 1, 2, 3, … enforces rank)
    - submitted_at: TIMESTAMP
    INVARIANT: one submission per player (or allow resubmit? MVP: one per room per player).
  </submission>
  <bingo_card note="client-side derived">
    - grid: 2D array INT[size][size] (5x5 → 25 cells, 7x7 → 49 cells)
    - marked: 2D array BOOL[size][size] (tracks which cells marked; center always true)
    - INVARIANT: grid immutable per session (swaps modify card in DB, client re-fetches). Center cell [size//2][size//2] always joker (marked = true always).
  </bingo_card>
  <draw_event note="transient broadcast">
    - number: INT (1–100)
    - drawn_at: TIMESTAMP (server-generated for ordering)
    Broadcast via Realtime "number_drawn" event → all clients mark matching cells.
  </draw_event>
  <constants>
    - MIN_PLAYERS = 1 (solo play OK); typical 4–10 for party
    - GRID_SIZES = [5, 7]
    - NUMBERS_RANGE = 1–100
    - CHANGE_LIMITS = [3, 5, 7, 10] (user picker)
    - WIN_CONDITIONS = ["1line", "Nlines", "blackout"]
    - START_DEADLINES_MIN = [10, 20, 30]
    - INVITE_CODE_LENGTH = 6 (digits)
    - RECENTS_MAX = 20 (localStorage)
  </constants>
</core_data_entities>

<route_definitions>
  <public_routes>
    <route path="/:locale/tools/online-bingo" page="OnlineBingo (platform tool route branches slug→component)" />
  </public_routes>
  <note>Single route. locale ∈ {ko, en}. Platform generateStaticParams iterates registry (status "coming_soon" or "live") to SSG. Per-room deep-link routes out-of-scope (Phase 2).</note>
</route_definitions>

<component_hierarchy>
  <online_bingo>                     <!-- "use client"; owns room_id + player_token + card + drawn_numbers + ready state + useOnlineBingo() owner -->
    <bingo_intro />                  <!-- H1 + lead (server-render where possible) -->
    <bingo_dispatcher>               <!-- Conditional render: not-in-room vs in-lobby vs in-game-host vs in-game-participant -->
      <host_create_room />           <!-- Form if not in room and is host; creates room, stores tokens locally. -->
      <participant_join />           <!-- Form if not in room and is participant; joins by code. -->
      <room_lobby />                 <!-- Waiting state: all players listed, ready counts, host can start game. -->
      <game_host_layout>             <!-- Host during playing: draw panel (left/top), leaderboard (right/below). -->
        <draw_panel />               <!-- Manual number input or roulette wheel. -->
        <host_leaderboard />         <!-- Live players list + submissions. -->
      </game_host_layout>
      <game_participant_layout>      <!-- Participant during playing: bingo grid (center), controls (swaps, ready, submit). -->
        <bingo_grid />               <!-- 5x5 or 7x7 clickable grid. -->
        <player_controls>
          <card_shuffle_button />    <!-- Swap cells (if ready=false). -->
          <player_ready_button />    <!-- Ready toggle. -->
          <bingo_submit_button />    <!-- Submit (if bingo detected). -->
        </player_controls>
      </game_participant_layout>
      <finished_state />             <!-- Final leaderboard after all submissions. Host can "End Game"/"Destroy Room". -->
    </bingo_dispatcher>
    <settings_panel />               <!-- Sound + volume + latency indicator (always available). -->
    <bingo_how_to />                 <!-- SEO long-form. -->
    <bingo_faq />                    <!-- FAQPage + SoftwareApplication JSON-LD. -->
  </online_bingo>
</component_hierarchy>

<pages_and_interfaces>
  <bingo_intro>
    - Eyebrow: "파티 게임" / "PARTY GAME" — 12px/700/0.6px, var(--brand-ink)
    - H1: "온라인 빙고" / "Online Bingo" — Gmarket Sans clamp(28px,5vw,40px)/700, var(--text)
    - Lead: "친구들과 함께 실시간으로 빙고를 즐기세요." / "Play live bingo with friends in real-time, anytime, anywhere."
  </bingo_intro>

  <host_create_room>
    - Card surface: var(--surface) + 1px var(--hairline), radius var(--radius-lg), padding 24px/16px mobile
    - Form: size picker (5x5 / 7x7 icon radio), swaps limit (3/5/7/10 button group), win condition (1line/Nlines/blackout radio), start deadline (10/20/30 min segmented control)
    - CTA: "방 만들기" / "Create Room" button (brand color), generates room, displays invite code (large, copy-to-clipboard button)
    - Invite code display: "초대 코드 123456" / "Invite Code 123456" (44px monospace font, high contrast, copy button)
  </host_create_room>

  <participant_join>
    - Card surface: same as above
    - Form: invite code input (6-digit, auto-focus, auto-paste-trigger), name input (max 30 chars, checks dupe real-time)
    - Error toast: "이미 있는 이름입니다" / "Name already taken in this room" (retry with new name)
    - CTA: "참여하기" / "Join Room" button, calls join RPC, loads game state
  </participant_join>

  <room_lobby>
    - Waiting-room banner: "게임 시작 대기 중" / "Waiting for game to start" (rose-tinted callout, countdown timer to deadline)
    - Host controls: "게임 시작" / "Start Game" button (brand), enabled if all players ready or deadline reached
    - Player list: grid/list of all players (name, status chip: "준비 완료" / "Ready" green, "준비 안 함" / "Not Ready" gray), live updates
    - Participant view: same info, "준비하기" / "Ready" button toggles ready state
    - Invite code re-display (participant can show to others to join)
  </room_lobby>

  <bingo_grid>
    - 5x5 or 7x7 responsive grid (SVG or CSS Grid)
    - Container: aspect-ratio 1/1, max-width 90vw on mobile, fills container on desktop
    - Cells: 25 or 49 cells; center cell (joker) always marked (gold star icon or distinct color)
    - Marked cells: filled solid rose accent color (var(--accent-rose)) with white number; unmarked: white fill, black number
    - Hovered/focus cell: 2px ring, hover lift +1px
    - Keyboard: Arrow keys navigate focus; Space/Enter toggle mark
    - Roving focus via roving-tabindex pattern
    - aria-label per cell: "Row 1, Column 1, number 35" (announces state)
    - Responsive: ≥1024px full grid size; 768–1023px scaled 80%; 320–767px scaled to fit viewport (no overflow)
  </bingo_grid>

  <draw_notification>
    - Toast-style alert: "번호 42가 나왔습니다!" / "Number 42 drawn!" (appear 1s, auto-dismiss 3s)
    - Icon: die or number icon
    - Auto-mark matching cells on all players' grids (no UI click needed, real-time via Realtime subscription)
  </draw_notification>

  <bingo_alert>
    - Full-screen overlay on own bingo: large "BINGO!" text (60px clamp(40px, 10vw, 80px), golden), confetti animation 2s, fanfare sound (Web Audio)
    - Submit button prompted: "제출하기" / "Submit" to record rank
    - Auto-dismiss after 5s or on submit
    - aria-role="alert", aria-live="assertive"
  </bingo_alert>

  <player_controls>
    - Layout: stacked column (mobile) or flex row (desktop), max-width 100% no overflow
    - Card Shuffle button: "카드 섞기" / "Shuffle Card" (disabled if ready or swaps exhausted); opens modal with two-cell selector
    - Shuffle modal: grid with "Click 2 cells to swap" instruction, two cells highlight, "확인" / "Confirm" button calls swapNumbers RPC, "취소" / "Cancel" closes
    - Ready button: "준비 완료" / "Ready" toggle (true → "준비 취소" / "Unready"); large, prominent (var(--brand) when ready, var(--surface) when not)
    - Submit button: "제출" / "Submit" (brand color, large), disabled if no bingo detected, on click calls submitBingo RPC
    - Swap counter: "남은 교환: 3" / "Swaps left: 3" (small caption, updated real-time)
  </player_controls>

  <draw_panel>
    - Host-only control panel
    - Two tabs: "숫자 입력" / "Manual" and "룰렛 돌리기" / "Spin Roulette"
    - Manual tab: number input (1–100, reject if already drawn, show "이미 뽑은 번호" / "Already drawn" toast), "뽑기" / "Draw" button
    - Roulette tab: reuse Roulette.tsx SVG wheel (1–100 pool, shrinks as numbers drawn), spin animation, reveals number, "뽑기" / "Draw" button confirms (calls recordDraw RPC)
    - Drawn numbers list: scrollable list below or side panel showing "1, 5, 12, 18, ..." in order (small font)
    - aria-live region announces each draw
  </draw_panel>

  <host_leaderboard>
    - Two sections: (a) All players status (name, ready chip, card preview thumbnail clickable to zoom), (b) Submission leaderboard (rank 1–N: 🥇 Player A "00:42", 🥈 Player B "01:15", etc.)
    - Real-time updates: player joins/leaves, ready/unready, bingo submitted (live insert into leaderboard)
    - Leaderboard entries: click to view submitted board (modal with grid marked at submission time, for verification)
  </host_leaderboard>

  <settings_panel>
    - Sound toggle: "소리" / "Sound" switch (default ON); below it "음량" / "Volume" slider 0–100%
    - Display: grid size (5x5 / 7x7 label), win condition (1 line / blackout label), start deadline countdown (if waiting)
    - Latency: "핑 45ms" / "Ping 45ms" (measures Realtime subscription roundtrip; green <100ms, yellow <300ms, red ≥300ms)
    - Network status: "연결됨" / "Connected" (or "오류" / "Error" if disconnected, with retry button)
  </settings_panel>

  <keyboard_shortcuts_reference>
    - Arrow keys: navigate cells in grid
    - Space/Enter: mark cell (toggle)
    - "/" (if modal open): close modal
    - Escape: close modal or leaderboard detail
  </keyboard_shortcuts_reference>
</pages_and_interfaces>

<core_functionality>
  <room_lifecycle>
    - Create: host fills form → client calls createRoom RPC → returns room_id + invite_code + host_token → store locally (localStorage) + navigate to room → room enters "waiting" status (deadline timer ticking)
    - Join: participant enters code + name → client calls joinRoom RPC (code dupe-check, name dupe-check per room) → returns player_token + card + room state → stored locally → enter room
    - Start: deadline reached OR host clicks "Start Game" → room.status = "playing" → all Realtime subscriptions propagate (players receive event) → game begins
    - Draw: host inputs/spins number → recordDraw RPC dedupes, appends to drawn_numbers, broadcasts "number_drawn" event via Realtime → all players receive, auto-mark matching cells (client-side, synchronous logic)
    - Submit: first player to bingo clicks "Submit" → submitBingo RPC validates (server re-runs bingo detection on board_state), increments submit_order (server timestamp enforces rank), broadcasts "bingo_submitted" event → host sees submission, other players see alert
    - Destroy: host clicks "End Game" → destroyRoom RPC deletes room (ON DELETE CASCADE purges players/submissions/events) → all clients disconnect (Realtime channel closed) → redirect to tool lobby
  </room_lifecycle>
  <card_assignment>
    - assignCard RPC: input (room_id, player_id, grid_size) → generates random 1–100 set (no dupes per room, exclude center joker), assigns to player, returns INT[] array (flattened)
    - Center joker: always included in the "assigned" set but marked as a reserved cell (logic: for 5x5 center = index 12; for 7x7 center = index 24, both implicitly marked)
  </card_assignment>
  <number_swaps>
    - swapNumbers RPC: input (player_token, room_id, [index_a, index_b]) → validates player_token, checks swaps_used < change_limit, swaps two numbers in card array, increments swaps_used, returns new card array
    - Client-side: swap button shows "카드 섞기" + modal with grid, user clicks two cells, confirm sends indices to server, server returns new card, client re-renders grid
    - Swap counter: displayed always, updated on each swap or server refresh
  </number_swaps>
  <bingo_detection>
    - Pure client-side logic: detectBingo(grid, size, winCondition) → bool
    - For 5x5 and 7x7: check all rows (5 or 7), all columns (5 or 7), both diagonals (2)
    - win_condition "1line" → any 1 line complete → enable submit
    - win_condition "Nlines" → N distinct lines complete (server specifies N) → enable submit
    - win_condition "blackout" → all N² cells marked (including center joker) → enable submit
    - Called on mount + after each number_drawn event
  </bingo_detection>
  <realtime_subscriptions>
    - Channel: `room:{room_id}`
    - Events broadcasted: player_joined (name, status), player_ready (name, ready true/false, ready_count/total), number_drawn (number), bingo_submitted (player_name, rank)
    - Client subscribe on room mount, auto-apply state changes (refresh player list, mark cells, update leaderboard)
    - Unsubscribe on room leave or destroy
    - Reconnect: if WebSocket closes, auto-reconnect; if still connected to same room, re-subscribe
  </realtime_subscriptions>
  <persistence>
    - Client: localStorage key `jurepi-online-bingo-[room_id]` = { version, room_id, player_token, card, drawn_numbers, ready, submitted_order? }. Saved on every state change (no debounce — immediate durability feel).
    - Server: Postgres source of truth. On mount/reconnect, client sends player_token → server returns full room state → client merges (server wins on conflict).
    - On destroy: DELETE rooms WHERE id = room_id (cascade) → all data purged → client localStorage not deleted (but room inaccessible since no room in DB).
  </persistence>
  <i18n>All UI chrome from tools.online-bingo.* (ko/en): create/join/ready/draw/bingo/submit/leaderboard/swaps/size/conditions/etc. Room content (invite code, player names, drawn numbers) is user input, locale-agnostic.</i18n>
</core_functionality>

<error_handling>
  <network>
    - Realtime WebSocket disconnects → UI shows "연결 끊김" / "Disconnected" banner + "재연결" / "Retry" button. Client auto-retries; if fails after 3 attempts, show manual retry. localStorage preserves state for fast recovery.
    - API call fails (RPC error) → toast error message (e.g., "번호 등록 실패" / "Failed to draw number") + retry option.
  </network>
  <validation>
    - Duplicate invite code (create): <0.1% chance, re-generate if collision detected
    - Duplicate player name (join): client-side debounced check, server enforces UNIQUE constraint, toast error + focus name input
    - Invalid bingo submit (fake bingo): server re-validates on board_state, rejects if no bingo, client shows toast "유효하지 않은 빙고" / "Invalid bingo"
    - Exceed swap limit: client disables shuffle button + toast "더 이상 교환할 수 없습니다" / "No swaps left"
  </validation>
  <storage>
    - localStorage unavailable (private mode, quota): in-memory state only, fully usable for single session (not persistent). No error shown; tool works normally.
    - Corrupt localStorage blob: read fails → start fresh, no throw.
  </storage>
  <supabase_rls>
    - If RLS policy denies (e.g., wrong player_token), Realtime or RPC returns 401/403 error. UI shows generic error + retry. Player must re-join (or reload and re-authenticate with stored token).
  </supabase_rls>
  <error_boundary>Platform wraps tool; render fail → retry without shell crash. Fallback: "빙고를 로드할 수 없습니다. 새로고침하세요." / "Unable to load bingo. Please refresh."</error_boundary>
  <note>No user-facing API errors; all handled gracefully with toast + retry option.</note>
</error_handling>

<aesthetic_guidelines>
  <source>CRITICAL: DESIGN.md is single source of truth for tokens. Below are tool-specific applications.</source>
  <accent_usage>
    - Category accent: "fun" — use vibrant identity accent (sky, cyan, or coral per DESIGN). Recommend "sky" for ice/chill party vibe or "coral" for warm/energetic.
    - CTAs (Create Room, Start Game, Submit Bingo): brand honey-gold var(--brand) per DESIGN.
    - Bingo grid cells (marked): saturated rose accent var(--accent-rose) or category accent (sky/coral).
    - Cells (unmarked): soft white/surface, text var(--text).
    - Center joker: distinct (gold star ⭐, or different color like var(--brand)).
  </accent_usage>
  <grid_design>
    - SVG or CSS Grid, responsive container aspect-ratio 1/1
    - Cells: equal size, padding between, no gaps (grid-gap or SVG spacing)
    - Marked cell: solid fill (accent color), white number (tabular-nums font)
    - Unmarked cell: var(--surface) or white, text var(--text)
    - Focus ring: 2px var(--focus-ring) visible
    - Joker (center): visual distinction (⭐ emoji, gold fill, or ring indicator)
  </grid_design>
  <typography>
    - H1: Gmarket Sans (clamp 28–40px)/700; invite code: monospace 28–32px, high contrast
    - UI buttons/labels: Pretendard 15–16px/500; cell numbers: tabular-nums 14–18px
    - Draw notification: eyebrow 12px, number 32px clamp(24px, 8vw, 48px)
    - Status labels: 14px/500
  </typography>
  <motion>
    - Grid mark: instant fill color transition 150ms (opacity + color blend)
    - Draw notification: fade-in 200ms, auto-dismiss
    - Bingo alert: scale 0.8→1 + rotate 360° 600ms ease-out (confetti + fanfare parallel)
    - Confetti: scale 1→0.2, opacity 1→0 over 1.5s, rotate random (all gated by prefers-reduced-motion)
  </motion>
  <responsive>
    - 320px (portrait phone): grid 90vw, controls stack below (full-width buttons). Landscape: grid full-width, controls beside (horizontal scroll or below). No overflow.
    - 375px (typical phone): same as 320
    - 768px (tablet): grid 60vw, controls right-sidebar if host, or below if participant. Detail panels (leaderboard, settings) overlay or modal.
    - 1024/1440px (desktop): grid left 60%, leaderboard right 40% for host; participant: grid center, controls flex-row below. Full layout breathing.
  </responsive>
  <accessibility>
    - Grid cells: aria-label per cell ("Row 2, Column 3, number 47, marked" or "unmarked"). Roving tabindex for keyboard navigation.
    - Buttons: aria-pressed for toggles, aria-disabled for disabled. aria-live regions for draw/bingo announcements.
    - Color not only indicator: marked cells filled color + bold number, unmarked lighter. Joker has icon.
    - Focus visible: 2px var(--focus-ring) ring on all interactive elements.
    - Reduced-motion: no spinning/scaling animations; instant reveal + fade-only.
    - WCAG 2.1 AA: 4.5:1 body text, 3:1 large, 3:1 UI components.
  </accessibility>
  <atmosphere>
    - Party/energetic: bright colors, playful typography (Gmarket), beeping sounds, confetti on win. Toast notifications keep energy up.
    - Mobile-first feel: large tap targets, snappy feedback, landscape support (no cramped portrait-only design).
    - Real-time live: Realtime subscription keeps state fresh; no manual refresh needed. Draw animation emphasizes immediacy.
  </atmosphere>
</aesthetic_guidelines>

<security_considerations>
  <authentication note="token-based, anonymous">
    - No accounts/login. host_token and player_token are UUIDs, random per room/player, stored in localStorage (client only).
    - RLS policies check tokens on every DB operation (room/player/submission reads/writes).
    - Tokens are short-lived per room (deleted on room destroy).
  </authentication>
  <authorization note="RLS + server-side logic">
    - Rooms: only host_token can UPDATE/DELETE room status, draw pool, etc.
    - Players: only owner player_token can UPDATE own card/ready state. Other players see name + ready status (no card leakage).
    - Submissions: only owner player_token can INSERT. Server validates bingo (client cannot fake winner).
    - Drawn numbers: only host can append (recordDraw RPC enforces host_token check).
  </authorization>
  <input note="sanitization">
    - Invite code: 6 digits only, no injection surface.
    - Player name: text input, max 30 chars, React escapes on render (no dangerouslySetInnerHTML). DB stores plain text.
    - Numbers (draw, card): INT validation (1–100), zod schema enforces range on client.
    - Board state (on submit): client sends INT[], server re-runs bingo detection (never trusts client's claim of bingo).
  </input>
  <privacy>
    - Supabase anon key is public (NEXT_PUBLIC_*) but RLS policies restrict access. No user data is sent.
    - Drawn numbers, player names, submissions: stored in Postgres, no leakage to 3rd party (no analytics tracking of content).
    - No cookies, no session tokens (just UUIDs per room).
  </privacy>
  <network>
    - All Supabase calls over HTTPS (auto with Supabase JS client).
    - Realtime WebSocket: WSS (encrypted), Supabase-managed.
    - NEXT_PUBLIC_* env vars are safe (anon key cannot write/delete, only RLS-restricted reads).
  </network>
  <note>Server-authoritative: all critical logic (draw dedupe, card assignment, bingo validation, submit ordering) lives in Postgres RPC functions, never client-side.</note>
</security_considerations>

<advanced_functionality>
  <realtime_multiplayer>Real-time draw broadcasts via Supabase Realtime WebSocket. Latency ≤200ms typical. All players see draws simultaneously; auto-mark client-side (deterministic logic, all see same result).</realtime_multiplayer>
  <roulette_integration>Draw panel includes optional roulette wheel (reuse Roulette component) as an alternative to manual input. Spins are deterministic (same 1–100 pool, no duplicates, no seeding bias). Visual animation + confetti on land.</roulette_integration>
  <leaderboard_live>Host sees real-time player list (join/leave, ready status) + submission leaderboard (🥇🥈🥉 with timestamps). Participant sees own rank + others' completion status (no card leakage).</leaderboard_live>
  <mobile_landscape>Bingo grid scales to landscape (width-constrained), controls below or tabbed (Settings / Game / Leaderboard tabs at bottom). Full responsiveness tested 320–1440px.</mobile_landscape>
  <sound_cues>Web Audio API beeps (draw tick), fanfare (on-own bingo), alert chime (other-player bingo, participant learns of competitor). Toggle + volume control. Reduced-motion disables all audio motion, keeps sound.</sound_cues>
</advanced_functionality>

<final_integration_test>
  <test_scenario_1>
    <description>Create room, generate invite code, join by code (participant perspective)</description>
    <steps>
      1. Host fills form: size 5x5, swaps 5, win condition "1line", deadline 10min. Click "방 만들기" / "Create Room".
      2. Server creates room, returns invite code (e.g., "123456"), displays it prominently (44px monospace).
      3. Participant navigates to tool, enters code "123456" + name "Alice". Click "참여하기" / "Join Room".
      4. Server validates code (found), validates name (not dupe), assigns random card (24 unique numbers), returns player_token.
      5. Participant loads game: grid renders 5x5, player controls below, settings panel visible. Verify no card leakage (name visible, card private).
      6. Host sees room lobby: "Alice" listed, status "준비 안 함" / "Not Ready". Verify Realtime event propagated (player_joined).
    </steps>
  </test_scenario_1>
  <test_scenario_2>
    <description>Card assignment and shuffling (no duplicate numbers across players)</description>
    <steps>
      1. Room with Alice (card: [1,5,12,…,99]) and Bob (card: [2,8,14,…,100]) — verify no overlap (server assigned, no dupes per room).
      2. Center joker (index 12 for 5x5): verify always marked (gold star, ⭐).
      3. Alice shuffles (swaps cells 0↔3): calls swapNumbers RPC, server increments swaps_used (now 1/5), returns new card.
      4. Verify shuffle counter: "남은 교환: 4" / "Swaps left: 4".
      5. Alice clicks "준비 완료" / "Ready" → ready button becomes "준비 취소" / "Unready", shuffle button disables, server broadcasts player_ready event.
      6. Host sees Alice status changed to "준비 완료", ready count "1/2" (if 2 players).
    </steps>
  </test_scenario_2>
  <test_scenario_3>
    <description>Host draws numbers (manual input + roulette), all players mark in real-time</description>
    <steps>
      1. Host enters number 42 manually, clicks "뽑기" / "Draw". Server appends 42 to drawn_numbers, broadcasts "number_drawn: 42" via Realtime.
      2. Alice's grid: if 42 in card, cell auto-marks (rose fill, instant). If not, no mark. Bob's grid: same (deterministic).
      3. Draw notification toast appears: "번호 42가 나왔습니다!" / "Number 42 drawn!" (1s appear, 3s display, auto-dismiss).
      4. Drawn-numbers list updates: shows "1, 42" (in order).
      5. Host tries to draw 42 again → toast "이미 뽑은 번호" / "Already drawn", rejected.
      6. Host switches to roulette tab, spins wheel. Wheel animates, lands on (say) 15, "뽑기" button confirms. Same broadcast + mark flow.
      7. Verify all 3 actions (manual, spin, re-draw rejection) in ≤200ms (Realtime latency).
    </steps>
  </test_scenario_3>
  <test_scenario_4>
    <description>Bingo detection and submission leaderboard</description>
    <steps>
      1. Alice's card: fills 5 cells in a row (e.g., row 0). detectBingo runs after each draw → returns true (for win_condition "1line").
      2. "제출" / "Submit" button activates (green, clickable). Alice clicks.
      3. Client sends board_state (current grid snapshot) to submitBingo RPC. Server re-validates bingo (runs line detection, checks win_condition).
      4. Server inserts submission (submit_order = 1), broadcasts "bingo_submitted: Alice, rank 1" via Realtime.
      5. Alice sees full-screen "BINGO!" alert, confetti animation 2s, fanfare sound (if sound ON), auto-dismiss after 5s. Toast "축하합니다! 1등입니다!" / "Congratulations! Rank 1!".
      6. Host leaderboard updates: "🥇 Alice 00:15" (timestamp).
      7. Bob sees alert "Alice가 빙고했습니다!" / "Alice got BINGO!" (chime sound, participant-side notification).
      8. Verify server-side validation prevents fake bingo: if Alice tries to submit without actual bingo, server rejects (toast error).
    </steps>
  </test_scenario_4>
  <test_scenario_5>
    <description>Durability: refresh mid-game, auto-restore full state</description>
    <steps>
      1. Game in progress: 5 numbers drawn, Alice marked 3 cells, Bob marked 2. Alice refreshes browser.
      2. On mount: client reads localStorage (room_id + player_token), auto-loads OnlineBingo component.
      3. useOnlineBingo hook: sends player_token to server → server fetches full room state (drawn_numbers, Alice's card, drawn [1,5,12,18,42], current status "playing").
      4. Alice's grid re-renders: all 5 drawn numbers marked (cells filled rose), same 3 marks as before refresh (client-side marked list rebuilt from server card + drawn_numbers).
      5. Host leaderboard still shows Alice + Bob, no data loss. Realtime subscription re-established, new draws propagate.
      6. Verify no blank loading state (localStorage cache → instant UI, server updates merge in background).
    </steps>
  </test_scenario_5>
  <test_scenario_6>
    <description>Host destroys room, all data purged, participants disconnected</description>
    <steps>
      1. Game finished (Alice won). Host clicks "게임 끝내기" / "End Game" → confirm dialog "방을 폐기하시겠습니까?" / "Destroy room?".
      2. Host confirms → calls destroyRoom RPC (host_token verified). Server DELETE FROM rooms WHERE id = room_id (ON DELETE CASCADE deletes players/submissions/events).
      3. Realtime channel "room:{room_id}" closes for all subscribers. Participants see "연결 끊김" / "Disconnected" banner → "재연결" / "Retry" button.
      4. On retry, fetch room (404 not found) → redirect to tool lobby "방을 찾을 수 없습니다" / "Room not found".
      5. Verify zero data persists (all Postgres rows deleted). localStorage still has old room_id/token (stale, unused).
    </steps>
  </test_scenario_6>
  <test_scenario_7>
    <description>i18n, SEO, mobile responsiveness</description>
    <steps>
      1. Switch to /en/tools/online-bingo → all chrome English (Create Room, Join Room, etc.), same game flow.
      2. Build prod → both /ko/tools/online-bingo and /en/tools/online-bingo unique SSG routes, title/canonical/hreflang correct.
      3. HTML has SoftwareApplication + FAQPage JSON-LD; how-to long-form not JS-gated (server-render before tool island).
      4. Open on mobile (320px portrait): grid 90vw, controls full-width below (buttons stack). Landscape (568px×320px): grid fits width, controls beside (flex-row or modal).
      5. No page overflow at 320px; grid scales proportionally, all tap targets ≥44px.
      6. Reduced-motion ON (OS): draw animation instant (no spin), confetti fade-only (no scale), beep plays (sound unaffected by motion pref).
      7. axe scan: no violations, all buttons labeled, visible focus rings, color contrast ≥4.5:1 body.
    </steps>
  </test_scenario_7>
  <test_scenario_8>
    <description>Network error and recovery</description>
    <steps>
      1. Game running: player hits "Draw Number" → Realtime WebSocket drops.
      2. UI shows "연결 끊김" / "Disconnected" banner, draw number appears in draw list (optimistic), but Realtime notification doesn't broadcast.
      3. Other players (still connected) see the draw marked on their grids. Disconnected player's grid doesn't update (stale).
      4. Click "재연결" / "Retry" → client reconnects to Realtime, re-subscribes to "room:{id}". Server sends recent events (last 10 draws, latest players).
      5. Grid updates with all marks (server-authoritative recovery). No data loss, game continues.
      6. If disconnected >1 min: explicit "네트워크 오류. 다시 시작하세요." / "Network error. Restart game." with "새로 시작" / "New Game" button.
    </steps>
  </test_scenario_8>
</final_integration_test>

<success_criteria>
  <multiplayer_realtime>Draws broadcast ≤200ms to all players (Supabase Realtime latency SLA). All players mark matching cells simultaneously (deterministic client-side logic). Leaderboard updates live (submit_order reflected in ≤500ms).</multiplayer_realtime>
  <durability>CRITICAL: refresh mid-game → full state restored (drawn_numbers, player cards, ready status, submissions). Room persists in Postgres until host destroys. Zero data loss before destroy.</durability>
  <card_integrity>No duplicate numbers across players in same room. Server assign_card RPC ensures uniqueness. Swaps never violate uniqueness (server handles deduping).</card_integrity>
  <bingo_validation>detectBingo logic (client) + server re-validation on submit (RPC) prevent fake bingo wins. Chi-square test on random card assignment (fair distribution across 20 rooms × players).</bingo_validation>
  <user_experience>Create room ≤2s (invite code generated). Join room ≤3s (card assigned, state loaded). Draw propagates ≤200ms. Bingo alert shows <100ms after client detects. Keyboard-navigable grid (no mouse required). ≥44px tap targets. No page overflow ≤1440px.</user_experience>
  <technical_quality>lib/online-bingo/* pure ≥80% unit coverage (grid/bingo-detection/invite-code). RPC functions audit-tested (assign-card no-dup, swap-dedupe, draw-dedupe, bingo-validation). TS 0 errors. <800 lines per file. Supabase JS client graceful fallback (disconnection handled).</technical_quality>
  <visual_design>DESIGN.md compliant; category accent (sky/coral) on grid marked cells + CTA buttons (brand gold). Mobile-first responsive (320–1440px, no overflow). Joker distinct (gold ⭐). Marked cells saturated, unmarked light. Typography readable all sizes.</visual_design>
  <accessibility>Full keyboard (grid arrow/space, button tab/enter). Roving tabindex. aria-live draw/bingo announcements. Visible focus 2px ring. WCAG 2.1 AA contrast (4.5:1 body, 3:1 large). Reduced-motion: instant reveal, no animation scaling. Screen reader: aria-label per cell, button labels.</accessibility>
  <performance>Tool route within platform budget. Realtime subscriptions <100ms to establish. Card grid render <50ms. LCP <2.5s on first load. No layout shifts (fixed grid aspect ratio, no CLS). Conversational latency ≤200ms (Realtime + RPC roundtrip).</performance>
</success_criteria>

<build_output>
  <note>Built as part of platform (pnpm build). Migrations run on Supabase project (one-time). /[locale]/tools/online-bingo pre-rendered by platform generateStaticParams iterating registry (status "coming_soon" or "live"). Env vars NEXT_PUBLIC_SUPABASE_* committed to .env.production for static export (safe: anon key + RLS). Supabase JS client imported in useOnlineBingo hook.</note>
</build_output>

<key_implementation_notes>
  <platform_registry_change>
    ```typescript
    // src/tools/registry.ts — add ONE entry. Status 'coming_soon' initially (launch as 'live' later).
    {
      id: 'online-bingo',
      slug: 'online-bingo',
      category: 'fun',
      icon: 'Grid3x3' or 'Dices',
      accent: 'sky', // or 'coral'
      status: 'coming_soon', // → 'live' on launch
      isNew: true,
      order: 20,
      keywords: ['빙고','온라인빙고','실시간','멀티플레이','파티게임','방','초대','bingo','online','realtime','multiplayer','party','room','invite'],
    },
    ```
    Also add slug→component branch (<OnlineBingo />) and generateMetadata branch in tool route.
  </platform_registry_change>
  <supabase_prerequisite>
    1. Create Supabase project (free tier OK for MVP)
    2. Run migration (001_create_bingo_schema.sql) → tables + RLS policies
    3. Deploy RPC functions (assign_card, swap_numbers, record_draw, set_ready, submit_bingo, destroy_room, etc.)
    4. Copy NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.production (committed for static export)
    5. Test RLS (anon key cannot write without correct player_token/host_token)
  </supabase_prerequisite>
  <critical_paths>
    1. **Durability**: Postgres schema (rooms/players/submissions) + RPC transactions (atomicity). Refresh flow: client → server fetch → Realtime subscribe. ON DELETE CASCADE for room destroy.
    2. **Real-time**: Supabase Realtime subscriptions on "room:{id}" channel. Broadcast design (JSON events: player_joined, number_drawn, player_ready, bingo_submitted). All clients receive within ≤200ms.
    3. **Server-authoritative**: assign_card (no dupes), swap_numbers (dedupe on client + server), record_draw (dedupe), submit_bingo (re-validate). Never trust client bingo claim.
    4. **Card logic**: 5x5 (25 cells, center = 12) vs 7x7 (49 cells, center = 24). Center always joker (marked = true). Bingo lines (5 rows + 5 cols + 2 diagonals for 5x5; 7 rows + 7 cols + 2 diags for 7x7).
    5. **Mobile UX**: Responsive grid (aspect-ratio 1/1), landscape support, large buttons, sound toggles, performance ≤200ms draw latency.
  </critical_paths>
  <recommended_implementation_order>
    1. Supabase schema + RLS policies + RPC functions (deploy + test via psql/API).
    2. lib/online-bingo/{types,schema,grid,bingo-detection,invite-code}.ts Vitest (RED→GREEN for grid/bingo-detection/invite-code).
    3. useOnlineBingo hook: Supabase JS client, Realtime subscriptions, localStorage cache, RPC calls (test with Supabase sandbox).
    4. HostCreateRoom + ParticipantJoin forms (call createRoom / joinRoom RPCs, handle errors, display tokens/codes).
    5. RoomLobby (list players, ready status, host start button).
    6. BingoGrid + BingoSubmitButton (grid render, mark logic, submit flow).
    7. DrawPanel (manual + roulette modes, recordDraw RPC, broadcast handling).
    8. HostLeaderboard + PlayerList (Realtime listeners, live updates).
    9. Settings (sound, volume, latency indicator), Error states (disconnect/retry), Toast notifications.
    10. Keyboard a11y (roving tabindex, aria-live, reduced-motion), visual regression (320/768/1024/1440px both themes).
    11. BingoIntro/HowTo/Faq + SoftwareApplication/FAQPage JSON-LD via platform lib/seo.ts.
    12. Registry status→live; slug→component + generateMetadata; E2E scenarios 1–8; visual + accessibility audit (axe).
  </recommended_implementation_order>
  <testing_strategy>
    - Vitest ≥80%: grid (mark/unmark/flip), bingo-detection (5x5 rows/cols/diags/blackout, 7x7 same, win-conditions), invite-code (format, uniqueness collision risk).
    - RPC fixtures: assign-card (no dupes), swap-dedupe (same number twice = error), record-draw (repeat = error), bingo-validation (fake board rejected).
    - E2E Playwright: scenarios 1–8 (create → join → draw → bingo → leaderboard → destroy, mobile responsive, i18n, network resilience).
    - Accessibility: axe scan, keyboard nav (grid arrow/space, buttons tab/enter), screen reader (aria-live, labels), reduced-motion (instant reveal).
    - Performance: Realtime subscription <100ms, draw broadcast ≤200ms, grid render <50ms, LCP <2.5s.
  </testing_strategy>
  <known_challenges_and_mitigations>
    1. **Network dependency**: Supabase WebSocket can drop. Mitigation: auto-reconnect, optimistic UI (mark cells client-side even if broadcast pending), Realtime fallback (HTTP polling if WS fails, Supabase handles).
    2. **Realtime latency**: typical ≤50ms, SLA ≤200ms. Mitigation: expect ≤200ms for competitive fairness (first-come submit_order enforced server-side, not client clock).
    3. **Center joker confusion**: center cell must always be pre-marked. Mitigation: schema marks it true, client-side logic always checks center == true before rendering as white.
    4. **Fake bingo on submit**: client detects bingo, but server re-validates before scoring. Mitigation: client logic duplicated in RPC (same detectBingo rules); client sends board_state snapshot; server re-runs to verify.
    5. **Mobile screen size**: 5x5 grid on 320px width → 60px per cell (OK, 2x font fits). 7x7 → 40px per cell (tight but readable, numbers scale). Mitigation: font-size clamp, test both sizes at 320px breakpoint.
  </known_challenges_and_mitigations>
  <monitoring_and_operations>
    - Supabase dashboard: monitor RLS errors (401/403 on anon key calls), connection count, row count growth (rooms/players/submissions).
    - Client-side: Sentry/LogRocket optional for error tracking (crashes, RPC timeouts, Realtime disconnect chains).
    - Metrics: average room lifetime, players per room, average game duration, submission latency (server timestamp - submitted_at for leaderboard fairness audit).
  </monitoring_and_operations>
</key_implementation_notes>

</project_specification>
```

1018 lines, English, final.
