# Dixit AI Mobile Lobby Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the room lobby so it matches the rest of the app, shows the host immediately after room creation, and makes the `3-8` player rules and wait/start states obvious.

**Architecture:** Keep the backend room lifecycle unchanged and fix the lobby through a tighter client hydration flow plus a room-centered visual layout. Move host-first sorting and role/status derivation into a small pure helper that can be tested in isolation, then use that helper from `useRoom` and the `lobby` screen.

**Tech Stack:** Expo Router, React Native `StyleSheet`, Supabase Realtime client, i18next, Jest (`ts-jest`) for pure helper tests, TypeScript strict mode.

**Spec:** [2026-03-19-dixit-ai-mobile-lobby-redesign-design.md](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\docs\superpowers\specs\2026-03-19-dixit-ai-mobile-lobby-redesign-design.md)

---

## File Map

**Create**
- `__tests__/lobbyState.test.ts`
- `src/lib/lobbyState.ts`

**Modify**
- `src/hooks/useRoom.ts`
- `src/components/game/PlayerList.tsx`
- `app/room/[code]/lobby.tsx`
- `src/i18n/locales/es.json`
- `src/i18n/locales/en.json`

**Do Not Modify For This Plan**
- `supabase/functions/room-create/index.ts`
- `supabase/functions/room-join/index.ts`
- `app/room/[code]/game.tsx`
- DB schema or migrations

The plan assumes the backend behavior is already correct enough for host insertion and room capacity. If implementation proves otherwise, stop and open a separate bugfix cycle instead of silently expanding scope.

---

## Guardrails

- Keep chat available from the start, but visually secondary.
- Do not add ready-checks, role drafts, or new social mechanics.
- Show only active players in the main visible roster.
- Host must appear first in the visible roster.
- The hero room card may render as soon as the room is known; the roster and role-dependent action block should stay in preparation state until players hydrate.
- Keep `minimum 3` and `maximum 8` visible as room rules, not only as error messages.
- Preserve the current `lobby -> playing -> ended` transition behavior and redirect on `playing`.

---

### Task 1: Add Pure Lobby State Helpers

**Files:**
- Create: `__tests__/lobbyState.test.ts`
- Create: `src/lib/lobbyState.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `__tests__/lobbyState.test.ts` with pure tests for:
- `getVisibleLobbyPlayers(players)` returns only active players
- `getVisibleLobbyPlayers(players)` sorts `is_host = true` first, then `joined_at`
- `getLobbyStartState({ isHost, activeCount, hydratingPlayers })` returns:
  - host preparation
  - host waiting for more players
  - host ready
  - guest waiting
- `getLobbyRuleSummary(activeCount)` or equivalent returns a stable `3-8` summary for the UI

Suggested data fixture:

```ts
const players = [
  { id: '2', player_id: 'p2', display_name: 'Invitado', is_host: false, is_active: true, joined_at: '2026-03-19T10:02:00Z', room_id: 'r1', score: 0, challenge_leader_used: false, intuition_tokens: 0, wildcards_remaining: 3 },
  { id: '1', player_id: 'p1', display_name: 'Host', is_host: true, is_active: true, joined_at: '2026-03-19T10:01:00Z', room_id: 'r1', score: 0, challenge_leader_used: false, intuition_tokens: 0, wildcards_remaining: 3 },
  { id: '3', player_id: 'p3', display_name: 'Ausente', is_host: false, is_active: false, joined_at: '2026-03-19T10:03:00Z', room_id: 'r1', score: 0, challenge_leader_used: false, intuition_tokens: 0, wildcards_remaining: 3 },
]
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npx jest --runInBand __tests__/lobbyState.test.ts
```

Expected: FAIL because `src/lib/lobbyState.ts` does not exist yet.

- [ ] **Step 3: Implement the minimal helper module**

Create `src/lib/lobbyState.ts` with focused pure functions only:
- `getVisibleLobbyPlayers`
- `getLobbyStartState`
- `getPlayersNeededToStart`
- optional tiny helpers for room status keys if they keep `lobby.tsx` simpler

Do not put React hooks, translations, or styles in this file.

- [ ] **Step 4: Run the helper tests again**

Run:

```bash
npx jest --runInBand __tests__/lobbyState.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add __tests__/lobbyState.test.ts src/lib/lobbyState.ts
git commit -m "feat: add lobby state helpers"
```

---

### Task 2: Refactor `useRoom` for Deterministic Hydration

**Files:**
- Modify: `src/hooks/useRoom.ts`
- Modify: `src/lib/lobbyState.ts`
- Test: `__tests__/lobbyState.test.ts`

- [ ] **Step 1: Extend the helper tests for hydration-specific state if needed**

If `useRoom` needs a pure status helper like `getLobbyHydrationPhase`, add failing tests for:
- room unresolved
- room resolved but players hydrating
- players hydrated

Keep this test coverage in `__tests__/lobbyState.test.ts`.

- [ ] **Step 2: Run the tests before changing the hook**

Run:

```bash
npx jest --runInBand __tests__/lobbyState.test.ts
```

Expected: FAIL only for any new helper contract added in Step 1.

- [ ] **Step 3: Rewrite the initial `useRoom` load path**

Update `src/hooks/useRoom.ts` so it:
- fetches the room by `code`
- stores the resolved room once
- fetches `room_players` for `room.id`
- derives visible active players through `getVisibleLobbyPlayers`
- exposes a `hydratingPlayers` boolean
- exposes a room-load failure signal distinct from room-not-found
- exposes enough state for the screen to distinguish:
  - room unresolved/loading
  - room not found
  - generic room load failure
  - room resolved / players hydrating
  - room resolved / players hydrated

Important:
- keep the existing redirect to `/room/${code}/ended` or `/room/${code}/game` behavior intact
- keep realtime subscriptions, but make the initial room + player hydration deterministic instead of loosely duplicated

- [ ] **Step 4: Preserve realtime refresh without reintroducing empty-flash**

Make sure the `room_players` subscription re-fetches players for the current `room.id`, but does not reset the list to empty before the refresh completes.

- [ ] **Step 5: Run verification**

Run:

```bash
npx jest --runInBand __tests__/lobbyState.test.ts
npm run typecheck
```

Expected:
- Jest PASS
- `typecheck` PASS, or if unrelated pre-existing baseline errors remain elsewhere, no new TypeScript errors should originate from `src/hooks/useRoom.ts` or `src/lib/lobbyState.ts`

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useRoom.ts src/lib/lobbyState.ts __tests__/lobbyState.test.ts
git commit -m "feat: tighten lobby room hydration flow"
```

---

### Task 3: Rebuild the Lobby Screen Hierarchy

**Files:**
- Modify: `app/room/[code]/lobby.tsx`
- Modify: `src/components/game/PlayerList.tsx`
- Modify: `src/lib/lobbyState.ts`
- Test: `__tests__/lobbyState.test.ts`

- [ ] **Step 1: Add any missing pure state tests for host/guest action states**

If the screen uses a helper for role/status presentation, add coverage for:
- host alone -> waiting for 2 more players
- host with 2 active players -> waiting for 1 more
- host with 3+ active players -> ready to start
- guest -> waiting for host

- [ ] **Step 2: Run the helper tests to verify the new contract fails**

Run:

```bash
npx jest --runInBand __tests__/lobbyState.test.ts
```

Expected: FAIL only if new helper expectations were added.

- [ ] **Step 3: Make `PlayerList` a presentation component**

Update `src/components/game/PlayerList.tsx` so it:
- trusts the already-filtered, already-sorted input it receives
- keeps the host badge visible
- remains scroll-free for lobby usage
- stays visually consistent with the app

Do not keep a second hidden filter inside `PlayerList`, or the roster ordering logic will be duplicated.

- [ ] **Step 4: Redesign `lobby.tsx` around the approved hierarchy**

Restructure the screen into:
- shared app header remains visible exactly as the room stack already defines it
- hero room card
  - room label
  - large code
  - share affordance
  - `3-8` rule line
  - role-aware room status copy
- roster card
  - active count
  - host-first player list
- action area
  - host: `Empezar partida`, disabled until `3`
  - guest: waiting block instead of CTA
- chat card
  - still functional
  - visually secondary
- exit action

Keep:
- `Share.share(...)`
- lobby chat insertion logic
- leave room behavior
- game start behavior through `gameAction(code, 'start_game')`

- [ ] **Step 5: Add preparation and failure states**

In `lobby.tsx`, implement:
- full-screen loading or neutral wait while room itself is unresolved
- hero-visible preparation state while players hydrate
- generic load failure distinct from room-not-found

Do not render a blank roster or an apparently empty room without explanation.

- [ ] **Step 6: Run verification**

Run:

```bash
npx jest --runInBand __tests__/lobbyState.test.ts
npx expo export --platform android --no-bytecode --output-dir .expo-export-check
```

Expected:
- Jest PASS
- Expo export PASS

- [ ] **Step 7: Clean export artifacts**

Run:

```bash
if (Test-Path '.expo-export-check') { Remove-Item -Recurse -Force '.expo-export-check' }
```

- [ ] **Step 8: Commit**

```bash
git add app/room/[code]/lobby.tsx src/components/game/PlayerList.tsx src/lib/lobbyState.ts __tests__/lobbyState.test.ts
git commit -m "feat: redesign lobby screen hierarchy"
```

---

### Task 4: Wire Final Copy and Room Rules Through i18n

**Files:**
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `app/room/[code]/lobby.tsx`

- [ ] **Step 1: Add the new i18n keys before wiring them**

Add or revise keys for:
- host-alone waiting copy
- host-needs-one-more copy
- host-ready copy
- guest-waiting copy
- room rule summary `3-8 jugadores`
- preparation state
- room-not-found
- generic room-load failure

Keep the existing `lobby` namespace if possible instead of creating a new one.

- [ ] **Step 2: Run a quick search to verify there are no missing usages**

Run:

```bash
rg -n "\"lobby\"|lobby\\." src/i18n app/room/[code]/lobby.tsx
```

Expected: the new keys are referenced from the lobby screen and exist in both locale files.

- [ ] **Step 3: Replace hardcoded lobby copy with translation lookups**

Update `app/room/[code]/lobby.tsx` so every new state string comes from i18n, preserving the intent approved in the spec.

- [ ] **Step 4: Run verification**

Run:

```bash
npx jest --runInBand __tests__/lobbyState.test.ts
npx expo export --platform android --no-bytecode --output-dir .expo-export-check
```

Expected: PASS.

- [ ] **Step 5: Clean export artifacts**

Run:

```bash
if (Test-Path '.expo-export-check') { Remove-Item -Recurse -Force '.expo-export-check' }
```

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locales/es.json src/i18n/locales/en.json app/room/[code]/lobby.tsx
git commit -m "feat: add lobby waiting state copy"
```

---

### Task 5: Final Product Verification

**Files:**
- Review only: `app/room/[code]/lobby.tsx`
- Review only: `src/hooks/useRoom.ts`
- Review only: `src/components/game/PlayerList.tsx`
- Review only: `src/i18n/locales/es.json`
- Review only: `src/i18n/locales/en.json`

- [ ] **Step 1: Run the targeted automated checks**

Run:

```bash
npx jest --runInBand __tests__/lobbyState.test.ts
npx expo export --platform android --no-bytecode --output-dir .expo-export-check
```

Expected: both PASS.

- [ ] **Step 2: Verify the intended manual flow**

Manual checklist:
- create room as host
- confirm the host appears immediately in the roster
- confirm hero card shows that the room is waiting for more players
- confirm `Empezar partida` is disabled until `3` active players
- join with 2 more players
- confirm host sees ready state
- confirm guests see waiting-for-host state
- attempt to join beyond `8` total active players and confirm the room does not accept the extra player
- confirm an invalid or stale room code shows the room-not-found state
- confirm a non-not-found load failure shows the generic load-failure state

- [ ] **Step 3: Clean export artifacts**

Run:

```bash
if (Test-Path '.expo-export-check') { Remove-Item -Recurse -Force '.expo-export-check' }
```

- [ ] **Step 4: Commit the finished lobby redesign**

```bash
git add app/room/[code]/lobby.tsx src/hooks/useRoom.ts src/components/game/PlayerList.tsx src/i18n/locales/es.json src/i18n/locales/en.json __tests__/lobbyState.test.ts src/lib/lobbyState.ts
git commit -m "feat: polish lobby waiting experience"
```

---

## Notes for Execution

- If the host still fails to appear after the `useRoom` hydration fix, stop and inspect backend persistence before changing more UI.
- If `npm run typecheck` still reports unrelated pre-existing errors outside the touched files, do not expand the scope of this plan to fix them.
- Keep the implementation focused on the lobby experience only; do not roll the same redesign into game phases as part of this plan.
