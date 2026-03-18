# Dixit AI Mobile — Design Spec
**Date:** 2026-03-18
**Project:** `dixit_ai_mobile`
**Status:** Approved

---

## Overview

A mobile-first v2.0 of Guess The Pront — a Dixit-inspired multiplayer game where players generate AI images from prompts, mix them together, and vote to identify the narrator's card. Built from scratch with clean architecture, strict TypeScript, and a server-side game arbiter.

---

## Scope (v1 of v2)

**In scope:** Private room mode only — room with shareable code, real-time multiplayer, full Dixit game loop, personal card gallery, user profiles, lobby chat (pre-game only).

**Out of scope:** Open matchmaking, AI bot opponents, spectator mode, in-game chat during game phases (can be added later).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 55 + Expo Router v4 |
| Language | TypeScript (strict mode) |
| Styling | NativeWind v4 (Tailwind in React Native) |
| UI State | Zustand |
| Database | Supabase (Postgres + Realtime + Auth + Storage) |
| Backend logic | Supabase Edge Functions (Deno/TypeScript) |
| AI image gen | OpenAI GPT-4o-mini (prompt refinement) + Pollinations.ai (image gen) |
| Validation | Zod (client + Edge Functions) |
| i18n | expo-localization + i18next |
| Testing | Jest (pure functions), Supabase local (integration) |

---

## Architecture

### Principle: Dumb Client, Smart Server

The client never writes directly to game-critical tables (`rounds`, `votes`, `round_scores`). All game state transitions go through Edge Functions that validate, execute in a transaction, and let Supabase Realtime notify all clients.

```
Expo App (React Native)
  Zustand (UI state only: modals, toasts, countdowns)
  useRoom / useRound hooks (Supabase Realtime subscriptions)
  useGameActions (calls Edge Functions)
        │
        │ HTTPS + WebSocket
        ▼
Supabase
  Postgres (game state, authoritative)
  Realtime (channels per room, broadcasts state changes)
  Auth (anonymous + email/password)
  Storage (gallery images, avatars)
  Edge Functions (game arbiter + image generation)
```

### Data Flow

```
User action → useGameActions → Edge Function → Postgres transaction
                                                      │
                                               Realtime broadcast
                                                      │
                                           useRoom/useRound hooks
                                                      │
                                              UI re-renders
```

---

## Database Schema (Supabase Postgres)

```sql
-- User profiles (extends auth.users)
profiles
  id          uuid PK  -- = auth.users.id
  username    text
  avatar_url  text
  is_anon     boolean default true
  created_at  timestamptz

-- Game rooms
rooms
  id            uuid PK
  code          text UNIQUE   -- 6-char code e.g. "XK4R2M"
  host_id       uuid FK profiles.id
  status        text          -- 'lobby' | 'playing' | 'ended'
  max_players   int default 6
  max_rounds    int default 8
  points_to_win int default 30
  current_round int default 0   -- 0 = not started; 1-based when playing
  narrator_order uuid[]          -- ordered player_ids for narrator rotation, set at start_game
  created_at    timestamptz
  ended_at      timestamptz      -- set when status transitions to 'ended'

-- Players in a room (with accumulated score)
room_players
  id           uuid PK
  room_id      uuid FK rooms.id
  player_id    uuid FK profiles.id
  display_name text
  avatar_url   text
  score        int default 0
  is_host      boolean
  is_active    boolean default true  -- false when disconnected; inactive players skipped in game logic
  joined_at    timestamptz

-- Game rounds
rounds
  id            uuid PK
  room_id       uuid FK rooms.id
  round_number  int   -- 1-indexed (first round = 1)
  narrator_id   uuid FK profiles.id
  status        text  -- 'narrator_turn' | 'players_turn' | 'voting' | 'results'
  clue          text  -- nullable until narrator submits
  created_at    timestamptz

-- Generated cards
-- Players INSERT their own cards directly (RLS validates ownership + correct round)
-- Edge Function sets is_played=true when player submits card
cards
  id          uuid PK
  round_id    uuid FK rounds.id
  player_id   uuid FK profiles.id  -- hidden from clients during voting phase (see view below)
  image_url   text
  prompt      text
  is_played   boolean default false  -- the card chosen to play
  created_at  timestamptz

-- Partial unique index: prevents race condition where two concurrent submit_card/submit_clue
-- calls mark two cards as played for the same player in the same round
-- CREATE UNIQUE INDEX cards_one_played_per_player ON cards (round_id, player_id) WHERE is_played = true;

-- Votes (narrator exclusion enforced in game-action Edge Function only — no DB constraint needed
--        because RLS already blocks direct client writes to this table)
votes
  id        uuid PK
  round_id  uuid FK rounds.id
  voter_id  uuid FK profiles.id
  card_id   uuid FK cards.id
  UNIQUE(round_id, voter_id)   -- one vote per player per round

-- Per-round score breakdown (written exclusively by game-action Edge Function)
round_scores
  id           uuid PK
  round_id     uuid FK rounds.id
  player_id    uuid FK profiles.id
  points       int
  reason       text
  -- Reason codes:
  --   'narrator_success'  → narrator gets 3pts (some but not all/none guessed correctly)
  --   'narrator_fail'     → narrator gets 0pts (all or none guessed correctly)
  --   'correct_vote'      → non-narrator guessed narrator's card (3pts)
  --   'received_vote'     → non-narrator card received votes from others (1pt per vote)
  --   'consolation_bonus' → non-narrator gets 2pts when narrator fails (all or none correct)

-- Personal card gallery (outside of games)
gallery_cards
  id          uuid PK
  player_id   uuid FK profiles.id
  image_url   text       -- Supabase Storage URL (permanent)
  prompt      text
  title       text
  created_at  timestamptz

-- Lobby chat messages (pre-game only)
lobby_messages
  id          uuid PK
  room_id     uuid FK rooms.id
  player_id   uuid FK profiles.id
  sender_name text
  text        text
  created_at  timestamptz
```

### Narrator Card Anonymity During Voting

Supabase Realtime only broadcasts changes on base tables — views are not supported. Therefore, `useRound.ts` subscribes to the base `cards` table directly. Narrator card anonymity is enforced **in the hook**, not in the DB:

```typescript
// useRound.ts masking logic
const maskedCards = cards.map(card => ({
  ...card,
  player_id: round.status === 'voting' ? null : card.player_id,
}))
```

During `voting` phase, the hook sets `player_id = null` on all cards before passing them to UI state. When `round.status` transitions to `results` (received via Realtime), the hook re-emits the same cards with real `player_id` values. No query change required — same subscription throughout.

This is enforced purely in the client hook. It is not a security boundary (a malicious client could read the table directly), but since this is a casual game and not a competitive/money game, client-side masking is an accepted tradeoff for v1.

### Row Level Security Rules

- `profiles`: users read/write own row only
- `rooms`: anyone can read; only Edge Functions write `status`, `current_round`, `narrator_order`, `ended_at`, `host_id`
- `room_players`: players read all rows in their room; write own row for `is_active` only
- `rounds`, `votes`, `round_scores`: Edge Functions only (no direct client writes)
- `cards`: players INSERT their own cards; RLS enforces `player_id = auth.uid()` and `round_id` must belong to a round in the player's active room. Edge Functions UPDATE `is_played`
- `gallery_cards`: players read/write own rows only
- `lobby_messages`: players in the room read all messages; players INSERT own messages. Enforcement that no messages are sent during `playing` status is a **client-side guard only** (client checks `room.status` before allowing send). The RLS INSERT policy does not join on `rooms.status` to avoid cross-table RLS complexity. This is an accepted simplification for v1.

---

## Round State Machine

```
narrator_turn  →  players_turn  →  voting  →  results
     │                │               │            │
Narrator generates  Others       All active    Edge Fn
cards, picks one,  generate and  non-narrator  calculates
writes clue        pick cards    players vote  points, advances
                                             to next round or ended
```

**"All" definition for phase transitions:**
- `submit_card` waits for all **active** (`is_active = true`) non-narrator players to submit a played card. Inactive players are excluded to prevent deadlock on disconnection.
- `submit_vote` applies the same rule: waits for all **active** non-narrator players to vote.

### Dixit Scoring Rules

- If **all** or **none** of the active non-narrator players guess the narrator's card:
  - Narrator gets 0 points (`narrator_fail`)
  - All active non-narrators get 2 points each (`consolation_bonus`)
- If **some** (but not all) non-narrators guess correctly:
  - Narrator gets 3 points (`narrator_success`)
  - Correct guessers get 3 points each (`correct_vote`)
- Each non-narrator whose played card received ≥1 vote: +1 point per vote received (`received_vote`)

Game ends when any player reaches `points_to_win` OR after `max_rounds` rounds.

### Narrator Rotation

Narrator order is determined once at `start_game` and stored in `rooms.narrator_order` (array of `player_id`s sorted by `joined_at` ascending, **including only active players at game start**).

**Formula (1-indexed rounds):**
```
narrator_id = narrator_order[(round_number - 1) % narrator_order.length]
```
Round 1 → index 0 (first joined player). Round 2 → index 1. And so on, cycling.

Players who disconnect after game starts remain in `narrator_order`. If the narrator is inactive when their round begins, they still hold the narrator role — the game waits for `submit_clue` indefinitely (no auto-skip in v1; can be added later).

---

## Screen Structure (Expo Router)

```
app/
├── (auth)/
│   ├── welcome.tsx            → splash + enter as guest or sign in
│   └── login.tsx              → email + password / register
│
├── (tabs)/                    → main tab bar (home, gallery, profile)
│   ├── index.tsx              → home: create room / join with code
│   ├── gallery.tsx            → personal card gallery (generate, title, lightbox, delete)
│   └── profile.tsx            → display name | email | password tabs
│                                  + upgrade anon→real account + delete account
│
└── room/[code]/
    ├── lobby.tsx              → waiting room + player list + lobby chat + ready toggle + share code
    ├── game.tsx               → single game screen rendering phase component by round.status:
    │                              · NarratorPhase   (narrator_turn)
    │                              · PlayersPhase    (players_turn)
    │                              · VotingPhase     (voting)  — player_id masked in useRound hook
    │                              · ResultsPhase    (results) — player_id revealed in useRound hook
    └── ended.tsx              → final scoreboard (fetched by room code) + return to home
```

**Key navigation rules:**
- Back button disabled during active game (`game.tsx`)
- `game.tsx` does NOT use `router.push()` between phases — renders the correct phase component based on `round.status` from Realtime
- **Navigation trigger to `ended.tsx`:** `useRoom` watches `rooms.status`. When it transitions to `'ended'`, the hook calls `router.replace('/room/[code]/ended')`. This is the only place this navigation happens.
- `ended.tsx` fetches final scores using the `[code]` route param (room code always available in URL)
- Deep link: `dixit://room/XK4R2M` → lobby of that room

---

## Component & State Structure

```
src/
├── components/
│   ├── ui/               → Button, Input, Avatar, Card, Toast, Modal (primitives)
│   ├── game/
│   │   ├── CardGrid.tsx        → mixed cards grid for voting/results (player_id masked by useRound hook)
│   │   ├── CardGenerator.tsx   → prompt input + image preview + regenerate
│   │   ├── PlayerList.tsx      → players with avatar, score, ready state
│   │   ├── ScoreBoard.tsx      → round/final score table
│   │   └── RoundStatus.tsx     → round X/Y + current phase indicator
│   └── layout/
│       ├── GameLayout.tsx      → header + safe area wrapper for game screens
│       └── ScreenLayout.tsx    → generic screen wrapper
│
├── stores/
│   ├── useUIStore.ts     → modals, toasts, loading (UI only, never game state)
│   └── useGameStore.ts   → local cache of game state derived from Supabase
│
├── hooks/
│   ├── useRoom.ts        → Realtime subscription to rooms + room_players;
│   │                         watches rooms.status → navigates to ended.tsx when 'ended'
│   ├── useRound.ts       → Realtime subscription to active round + cards_voting_view + votes
│   ├── useGameActions.ts → calls Edge Functions, handles loading + errors
│   └── useImageGen.ts    → generates image via Edge Function, retry x3
│
├── lib/
│   ├── supabase.ts       → Supabase client singleton
│   └── api.ts            → typed wrappers for Edge Function calls
│
└── types/
    └── game.ts           → TypeScript types generated from Supabase schema
```

**State principle:** Supabase Realtime → hooks → components. Zustand handles only ephemeral UI state (toasts, modals, local countdowns). Zero prop drilling.

**Note on scoring logic:** Scoring lives exclusively in the `game-action` Edge Function (Deno). The client does NOT have a `scoring.ts` — it receives authoritative scores from Realtime after the Edge Function writes `round_scores`. No shared scoring code between client and server; no drift risk.

---

## Edge Functions

### `room-create` (POST)
Creates room + adds host as first player. Generates unique 6-char alphanumeric code (excludes O/0/I/1 to avoid visual ambiguity) with collision retry up to 5 attempts.

### `room-join` (POST)
Validates room exists, is in `lobby` status, and `room_players count < max_players`. Adds player.

### `room-leave` (POST)
Sets player `is_active = false`. Host transfer: if leaving player is host, transfer to active player with earliest `joined_at`. If no active players remain → `rooms.status = 'ended'`, set `ended_at`. If game in progress and active player count drops below **3** → end game (consistent with minimum start requirement).

### `game-action` (POST)
Central arbiter. Receives `{ roomCode, action, payload }`.

| Action | Validates | Transitions |
|---|---|---|
| `start_game` | caller is host; **≥3 active players**; status=lobby | Builds `narrator_order` from active players sorted by `joined_at`; sets `current_round=1`; creates first `rounds` row with `narrator_id = narrator_order[0]`; lobby → playing (narrator_turn) |
| `submit_clue` | caller is narrator; status=narrator_turn; `payload.card_id` belongs to current `round_id` AND `cards.player_id = narrator.id` | Writes `rounds.clue`; sets `cards.is_played=true` for `payload.card_id` (narrator's chosen card enters the voting pool); narrator_turn → players_turn |
| `submit_card` | caller is active non-narrator; status=players_turn; `payload.card_id` belongs to current `round_id` AND `cards.player_id = caller.id`; player hasn't played yet | Sets `cards.is_played=true`; when all active non-narrators have played → players_turn → voting |
| `submit_vote` | caller is active non-narrator (`caller.id ≠ round.narrator_id`); status=voting; `payload.card_id` is a played card in this round; caller hasn't voted yet | Records vote; when all active non-narrators have voted → calculates scores → writes `round_scores` → voting → results |
| `next_round` | caller is any active player; status=results | **Idempotent:** if status is already not `results`, return HTTP 200 with no-op (client ignores silently). Otherwise: check game-over condition; if ended → set `rooms.status='ended'`, `ended_at=now()`; if continuing → `current_round++`, create next `rounds` row with correct narrator, → narrator_turn |

### `image-generate` (POST)
1. Receives `{ prompt }`
2. OpenAI GPT-4o-mini refines prompt into Dixit card style brief
3. Returns Pollinations.ai URL + refined brief
4. Client INSERTs a `cards` row with the returned `image_url` and `prompt`, and the current `round_id`
5. Client can call `image-generate` again and INSERT another row to regenerate; only one card per player will have `is_played=true`
6. **Pollinations URL persistence:** URLs are not guaranteed permanent. If a URL breaks mid-round, the UI shows a broken image placeholder. This is an accepted tradeoff for v1 to avoid per-image Storage upload latency. Gallery saves use Supabase Storage (permanent URL).

### Validation Pattern (all functions)
```typescript
1. Verify Supabase JWT (return 401 if missing/invalid)
2. Validate payload with Zod schema (return 400 if invalid)
3. Read current DB state
4. Assert action is legal in current state (return 403 or 409 if not)
5. Execute change in Postgres transaction
6. Return updated state (200)
```

---

## Error Handling

### Edge Functions
- Typed error codes: `ROOM_FULL`, `NOT_YOUR_TURN`, `INVALID_STATE`, `ROOM_NOT_FOUND`, `MIN_PLAYERS_REQUIRED`, `INVALID_CARD`
- Semantic HTTP status: 400 bad request, 401 unauthorized, 403 forbidden, 409 conflict
- No stack traces exposed to client

### Client
- `useGameActions`: translates error codes to i18n messages
- Non-blocking errors → Toast (e.g. "Not your turn")
- Blocking errors → Modal (e.g. "Room closed", "Disconnected")
- `next_round` 200 no-op: silently ignored by client
- `useImageGen`: automatic retry x3 with exponential backoff (Pollinations is unreliable)

### Realtime
- Auto-reconnect with exponential backoff
- Visible `disconnected` banner in UI while reconnecting
- On reconnect: re-fetch current state + re-subscribe to channel

---

## Code Quality Rules

```
TypeScript strict: true
  noUncheckedIndexedAccess: true
  Types generated from Supabase schema (zero `any` in DB types)

ESLint + Prettier
  eslint-plugin-react-hooks
  eslint-plugin-unicorn

File size: max ~200 lines per file
  If a file exceeds 200 lines → it's doing too much, split it
```

### Lessons from v1

| Problem in v1 | Solution in v2 |
|---|---|
| `PartidaPrivada.tsx` at 86KB | Game screen split into 4 phase components ≤200 lines each |
| Client-side host as game arbiter | All transitions go through Edge Function arbiter |
| `any` types in Firestore docs | Types generated with `supabase gen types` |
| Manual i18n duplicated in every page | `i18next` + single translation file |
| Complex custom mobile optimization hooks | React Native + NativeWind = native optimization by default |
| Avatars stored as Data URLs in Firestore | Supabase Storage with public URL |
| Host disconnection breaks the game | Any active player triggers `next_round`; host transferred on disconnect |
| Shared logic drift risk | Scoring lives only in Edge Function; client receives results via Realtime |

---

## Authentication Flow

1. App opens → anonymous Supabase session created automatically
2. User sets display name → stored in `profiles.username`
3. Optional upgrade: add email + password to existing anon session (preserves all data including gallery)
4. Profile screen: change display name, email, password; delete account

---

## Testing Strategy

| What | How |
|---|---|
| `game-action` scoring logic | Jest unit tests on the scoring module inside the Edge Function — covers all Dixit cases: all correct, none correct, some correct, received votes combinations |
| `game-action` Edge Function | Integration tests with `supabase start` (local Docker) — tests full state transitions and RLS enforcement |
| UI components | Not tested in MVP phase |
