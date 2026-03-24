# Dixit AI Mobile Lobby Readiness and Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lobby ready-checks, closure reasons, and upgraded lobby chat while keeping `start_game` reliable end-to-end.

**Architecture:** Extend `room_players` with readiness and `rooms` with closure reason, enforce the lobby rules in `game-action`/`room-leave`, and update the lobby UI to render readiness state plus a dedicated chat message component that resolves profile avatars and subtle per-player accents.

**Tech Stack:** Expo Router, React Native, Supabase Edge Functions, Postgres migrations, Jest

---

### Task 1: Schema and shared types

**Files:**
- Create: `supabase/migrations/20260324020000_lobby_readiness_and_end_reasons.sql`
- Modify: `src/types/game.ts`
- Test: `__tests__/lobbyState.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests asserting:
- lobby start state can represent blocked-by-unready-guests
- readiness filtering/counting helpers behave correctly

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand __tests__/lobbyState.test.ts`
Expected: FAIL because readiness-aware helpers and states do not exist yet

- [ ] **Step 3: Write minimal implementation**

Implement:
- `room_players.is_ready boolean not null default false`
- `rooms.ended_reason text null`
- TypeScript type updates in `src/types/game.ts`
- readiness-aware helpers in `src/lib/lobbyState.ts`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand __tests__/lobbyState.test.ts`
Expected: PASS

### Task 2: Backend lobby readiness contract

**Files:**
- Modify: `supabase/functions/game-action/index.ts`
- Modify: `supabase/functions/room-join/index.ts`
- Modify: `supabase/functions/room-leave/index.ts`
- Test: `__tests__/lobbyState.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests for pure readiness rules:
- host cannot start if any active guest is not ready
- guests rejoin as not ready
- room-end reason resolution picks the expected reason

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand __tests__/lobbyState.test.ts`
Expected: FAIL on readiness and end-reason expectations

- [ ] **Step 3: Write minimal implementation**

Implement:
- `set_ready` action in `game-action`
- `start_game` validation for all active non-host players ready
- `room-join` resets `is_ready` to `false`
- `room-leave` sets `ended_reason` when host cancels lobby or a game drops below minimum

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand __tests__/lobbyState.test.ts`
Expected: PASS

### Task 3: Lobby UI readiness states

**Files:**
- Modify: `app/room/[code]/lobby.tsx`
- Modify: `src/components/game/PlayerList.tsx`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`
- Test: `__tests__/lobbyState.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests for lobby state copy selection:
- guest waiting-ready state
- host blocked by unready players
- host start-ready state only when every guest is ready

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand __tests__/lobbyState.test.ts`
Expected: FAIL because lobby UI state logic does not account for readiness

- [ ] **Step 3: Write minimal implementation**

Implement:
- `Estoy listo` CTA for guests
- readiness badges in player rows
- host copy showing who is still waiting
- `PLAYERS_NOT_READY` error messaging

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand __tests__/lobbyState.test.ts`
Expected: PASS

### Task 4: Lobby chat message component

**Files:**
- Create: `src/components/game/LobbyChatMessage.tsx`
- Create: `src/lib/chatPlayerAccent.ts`
- Modify: `app/room/[code]/lobby.tsx`
- Test: `__tests__/chatPlayerAccent.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests for:
- deterministic accent color per player id
- different player ids can resolve to different accents

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand __tests__/chatPlayerAccent.test.ts`
Expected: FAIL because helper/component do not exist

- [ ] **Step 3: Write minimal implementation**

Implement:
- profile avatar lookup for chat participants
- own messages right aligned
- other messages left aligned with avatar or initials
- subtle accent on avatar ring, sender name, and bubble edge

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand __tests__/chatPlayerAccent.test.ts`
Expected: PASS

### Task 5: Ended screen closure reasons

**Files:**
- Modify: `app/room/[code]/ended.tsx`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Write the failing test**

Add a small pure mapping helper test or component-level test for ended reason copy if extracted.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand __tests__/leaveRoomConfirm.test.ts __tests__/lobbyState.test.ts`
Expected: FAIL if copy mapping helper is newly introduced

- [ ] **Step 3: Write minimal implementation**

Implement:
- user-facing ended reason mapping
- personal vs neutral copy where the current user caused the closure

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand __tests__/leaveRoomConfirm.test.ts __tests__/lobbyState.test.ts`
Expected: PASS

### Task 6: Start flow verification

**Files:**
- Modify: `scripts/create-three-player-room.mjs` (only if useful)
- Modify: `scripts/open-three-player-room.mjs` (only if needed after behavior changes)

- [ ] **Step 1: Verify backend path directly**

Run a direct script or one-off node command to:
- create room
- join 3 players
- mark guests ready
- start game

Expected: `start_game` returns `{ ok: true }`

- [ ] **Step 2: Verify lobby UI manually**

Check:
- guests can mark ready
- host cannot start early
- host can start when all guests are ready
- chat layout matches the new design

- [ ] **Step 3: Run focused tests**

Run:
- `npx jest --runInBand __tests__/lobbyState.test.ts`
- `npx jest --runInBand __tests__/chatPlayerAccent.test.ts`
- `npx jest --runInBand __tests__/leaveRoomConfirm.test.ts`

Expected: PASS
