# Dixit AI Mobile - Quick Matchmaking Design
**Date:** 2026-04-05
**Project:** `dixit_ai_mobile`
**Status:** Draft

---

## Overview

Add a public `Partida rapida` flow that lets a player choose a preferred match size from `3` to `6` players, enter a flexible matchmaking queue, and get placed into a normal game room when a compatible group is found.

The system should optimize for low database churn, low duplicate room creation, and minimal client polling. Matchmaking must remain separate from the existing `rooms` gameplay model so the current private-room and in-game flows stay stable.

The match result should feel premium and immediate:

- player enters queue with a preferred player count
- system first tries the exact preferred size
- if wait grows, system expands to a narrow compatible range
- once matched, a normal `rooms` record is created
- players see a short `partida encontrada` screen with names, avatars, and countdown
- after the countdown, they enter the game directly without manual lobby coordination

---

## Goals

- Add a new quick-match entry point alongside private match
- Let users choose a preferred player count from `3` to `6`
- Support flexible matching around that preference to reduce queue times
- Reuse the existing `rooms`, `room_players`, `rounds`, and game subscriptions once the match is formed
- Keep matchmaking writes small and bounded
- Avoid aggressive client polling
- Make the critical match operation idempotent and race-safe
- Keep abandoned queue entries easy to expire and clean up

---

## Out of Scope

- Skill-based ranking or ELO
- Region-based routing
- Multiple public playlists or game modes
- Party queueing with friends
- Mid-match backfill
- Spectator support
- Cross-project analytics pipelines

---

## Product Decisions Confirmed

- Quick match uses a `preferred player count` control, not a strict hard lock
- The queue may expand to nearby counts to reduce wait time
- A matched group should see a short `partida encontrada` screen
- That screen should show:
  - avatars
  - display names
  - a visible countdown bar
- After the countdown, the game should begin directly without stopping in the standard lobby flow

---

## Current Constraints

### Existing room model

The current game already uses:

- `rooms` for the match lifecycle
- `room_players` for membership and player state
- edge functions such as `room-create`, `room-join`, `room-leave`, and `game-action`
- client hooks such as `useRoom` and `useRound`

This is a strong foundation. The new feature should terminate in a normal `room`, not invent a second gameplay system.

### Existing cleanup posture

The project already includes cleanup migrations and room lifecycle hardening. The queue system should extend this posture rather than introducing long-lived temporary rooms or large garbage sets.

---

## Recommended Approach

Introduce a dedicated matchmaking layer with its own queue table and edge functions, then create a normal gameplay room only when a compatible group is confirmed.

### Why this approach

- It keeps queue state separate from gameplay state
- It avoids polluting `rooms` with temporary waiting artifacts
- It minimizes the amount of realtime traffic because clients only watch their own ticket
- It lets the system build the final room in one short critical section
- It preserves nearly all existing room and game logic

### Rejected alternatives

#### Reusing `rooms` as queue state

Rejected because it mixes waiting-state semantics with gameplay-state semantics and would increase branching in `useRoom`, room subscriptions, cleanup, and room lifecycle rules.

#### Pre-creating rooms and filling them over time

Rejected because it creates idle room garbage, increases cleanup work, and raises the chance of orphaned rooms and host-state inconsistencies.

---

## Data Model

### New table: `matchmaking_queue`

Each row represents one active or recently resolved queue ticket.

Suggested fields:

- `id uuid primary key default gen_random_uuid()`
- `player_id uuid not null references profiles(id)`
- `display_name text not null`
- `preferred_player_count int not null`
- `min_player_count int not null`
- `max_player_count int not null`
- `status text not null default 'searching'`
- `search_expanded boolean not null default false`
- `matched_room_id uuid null references rooms(id)`
- `matched_room_code text null`
- `countdown_starts_at timestamptz null`
- `expires_at timestamptz not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `cancelled_at timestamptz null`

Allowed statuses:

- `searching`
- `matched`
- `cancelled`
- `expired`

### Constraints

- One active queue ticket per player:
  - partial unique index on `player_id` where `status = 'searching'`
- Valid preferred sizes:
  - check `preferred_player_count between 3 and 6`
- Valid range:
  - check `min_player_count between 3 and 6`
  - check `max_player_count between 3 and 6`
  - check `min_player_count <= preferred_player_count`
  - check `preferred_player_count <= max_player_count`

### Index strategy

Use narrow indexes that support the matching query without creating unnecessary write amplification.

Recommended indexes:

- `matchmaking_queue_search_idx` on `(status, preferred_player_count, created_at)`
- `matchmaking_queue_range_idx` on `(status, min_player_count, max_player_count, created_at)`
- `matchmaking_queue_expires_idx` on `(status, expires_at)`
- partial unique index on `(player_id)` where `status = 'searching'`

### Rationale

- `status` first because almost every queue lookup filters on `searching`
- `created_at` supports fairness and oldest-first resolution
- explicit range fields keep matching simple and avoid expensive computed logic in every read

---

## Preference Expansion Rules

The UI sells this as `preferencia de jugadores`, not as a strict room size lock.

The server derives a narrow compatibility band from the chosen preferred size.

Initial recommendation:

- preferred `3` -> range `3..4`
- preferred `4` -> range `3..5`
- preferred `5` -> range `4..6`
- preferred `6` -> range `5..6`

Matching priority:

1. exact preferred size
2. same-size compatible oldest group
3. nearest compatible size by absolute distance from preference
4. oldest viable group if several are equivalent

This keeps the system intuitive while reducing long waits at the edges.

---

## Matchmaking Algorithm

### High-level flow

1. Player enters queue through an enqueue edge function
2. The function upserts the player ticket and attempts a match immediately
3. If no match is found, the ticket remains `searching`
4. Additional enqueue events from other users trigger more matching attempts
5. A lightweight retry path may also run from client re-entry or periodic server cleanup if needed
6. When a match is found:
   - selected tickets are locked
   - a normal `rooms` row is created
   - `room_players` rows are inserted for all matched players
   - one player is assigned host
   - queue tickets are updated to `matched`
   - countdown metadata is written

### Critical section strategy

The matching step should be centralized in one server-side path and use row locking to avoid double assignment.

Preferred approach:

- transaction
- select candidate `searching` rows with `FOR UPDATE SKIP LOCKED`
- verify compatibility for a target group size
- create room
- insert players
- mark tickets `matched`
- commit

This is the modern low-contention pattern for queue workers in Postgres when multiple requests may attempt matching at the same time.

### Group assembly strategy

For a given newly enqueued player:

1. Build a list of target sizes to try in priority order
2. For each target size:
   - fetch oldest compatible `searching` tickets
   - include only tickets whose `[min_player_count, max_player_count]` contains that target size
   - prefer tickets closest to the target size
   - if enough players exist, lock and resolve the group
3. Stop after first successful room creation

### Host selection

Use deterministic host assignment to keep the outcome stable.

Recommended rule:

- oldest ticket in the matched group becomes host

This avoids ambiguity and makes race outcomes easier to reason about.

### Countdown metadata

When a room is created from matchmaking, store:

- `matched_room_id`
- `matched_room_code`
- `countdown_starts_at`

on every matched ticket.

The client derives remaining time locally after receiving that update.

---

## Room Creation Strategy

Quick match should create a normal room and then immediately begin the flow toward gameplay.

### Recommended room defaults

Use a dedicated room configuration for public quick matches.

Suggested initial defaults:

- `status = 'lobby'` during the countdown window
- fixed `max_rounds` tuned for public sessions
- finite `phase_duration_seconds` so public games do not stall indefinitely

### Start handoff

At the end of the countdown:

- one designated client should invoke the existing game start action, or
- the matchmaking flow should create whatever minimum start state is required if the current game architecture already expects that from `game-action`

The preferred option is to reuse the existing start path rather than bypassing it. That keeps game initialization logic in one place.

### Recommended start owner

The matched host client should own the start trigger after the countdown.

Why:

- avoids introducing a second backend-only game bootstrap path
- reuses existing room-host assumptions
- keeps server changes smaller

The client must make this idempotent so double submissions do not break the room.

---

## Client UX

### Entry point

Add a `Partida rapida` option beside the existing private match flow.

### Queue form

Inputs:

- display name
- preferred player count selector from `3` to `6`

Copy should frame the selector as preference, not guarantee.

Example intent copy:

- `Preferencia de jugadores`
- `Intentaremos encontrarte una partida de 4. Si tarda demasiado, ampliaremos un poco la busqueda.`

### Searching screen

Show:

- current preference
- short explanation of flexible matching
- elapsed wait time
- cancel button
- compact queue state feedback

Avoid showing exact queue population unless that data becomes reliable and cheap to compute.

### Match found screen

Show:

- matched player avatars
- matched player display names
- countdown bar
- short celebratory copy

The countdown should be brief and deterministic, for example `4` to `6` seconds.

### Transition to gameplay

At countdown end:

- if current user is host, trigger the start action
- all players navigate into the room game flow when room state advances

No manual ready-check or standard join-code lobby interaction is shown in this mode.

---

## Realtime Strategy

### Principle

Use realtime sparingly and subscribe only to data the current player actually needs.

### Recommended subscription pattern

The queued player subscribes only to their own `matchmaking_queue` ticket updates.

They do not subscribe to:

- global queue sizes
- all tickets
- all rooms

Once matched, the client switches to the existing room-based subscriptions.

### Benefits

- low fan-out
- low payload volume
- lower battery and network use on mobile
- simpler privacy model

---

## API Surface

### New edge function: `matchmaking-enqueue`

Responsibilities:

- authenticate user
- validate payload
- derive range from preference
- upsert or refresh searching ticket
- expire stale ticket if needed
- attempt match
- return ticket state

Input:

- `displayName`
- `preferredPlayerCount`

Output:

- `ticketId`
- `status`
- `preferredPlayerCount`
- `minPlayerCount`
- `maxPlayerCount`
- `matchedRoomCode?`
- `countdownStartsAt?`

### New edge function: `matchmaking-cancel`

Responsibilities:

- mark active searching ticket as cancelled
- return idempotent success when no active ticket exists

### Optional new edge function: `matchmaking-status`

Only needed if the app needs recovery after reconnect without relying purely on realtime.

Responsibilities:

- fetch current active or recently matched ticket for the current user

This can be useful on screen re-entry or app foreground resume.

### No dedicated background worker required initially

The first version can match opportunistically during enqueue and status recovery calls.

This avoids always-on workers and keeps infra cost lower.

If traffic grows later, the matching logic can be moved behind a dedicated worker path without changing the client contract.

---

## RLS and Security

### Queue visibility

Players should only read their own queue ticket.

Policies should allow:

- insert own ticket
- read own ticket
- update own ticket only for cancellation flows if direct table writes are ever used

The preferred path remains edge functions with service role for all matchmaking writes.

### Room membership

Once matched, all normal `room_players` and `rooms` protections continue to apply as they do today.

### Abuse controls

Guardrails:

- one active searching ticket per player
- short TTL on tickets
- input validation for display name length and preferred size
- idempotent cancel and enqueue behavior

---

## Cleanup and Expiration

### Ticket expiration

Queue tickets should have a short TTL, for example `2` to `5` minutes, refreshed when the user re-enters or explicitly keeps searching.

### Cleanup strategy

Extend the existing cleanup posture with:

- mark old `searching` tickets as `expired`
- optionally hard-delete old terminal-state tickets after a longer retention window

This should happen in a cheap batched query, not per-request cleanup loops over large datasets.

### Why terminal-state retention is useful

Keeping recent matched or cancelled tickets briefly helps:

- reconnect recovery
- observability during rollout
- debugging race conditions without needing a separate audit table yet

---

## Database Optimization Notes

### Keep writes bounded

A normal successful path should be approximately:

- one upsert to queue ticket
- one short matching transaction
- one `rooms` insert
- one bulk `room_players` insert
- one queue status update

There should be no repeated heartbeat writes every second from the client.

### Favor bulk operations

When a match is formed:

- insert all `room_players` in one bulk statement
- update all matched queue tickets in one bulk statement

### Avoid chatty status updates

The countdown progress bar should be client-derived from `countdown_starts_at`, not written back to the database.

### Keep matching query selective

The queue table should stay small because:

- only active searchers remain in `searching`
- tickets expire fast
- one ticket per player is enforced

This keeps matching queries fast even without complicated partitioning.

---

## Failure Handling

### Enqueue failure

Show a clear retryable toast and keep the user on the queue setup screen.

### Match transaction failure

If room creation fails during the matching transaction, the transaction should roll back so no partial room or partial assignment survives.

### Countdown start failure

If a player receives a matched ticket but fails to load avatars or names, the client should still preserve the countdown and room handoff with safe fallbacks:

- initials if avatar missing
- display name text only if profile join fails

### Host start failure

If the host fails to trigger game start at countdown end:

- allow one or more non-host fallback attempts after a short grace window, or
- let the backend accept idempotent start attempts from any matched room member

The recommended implementation is to make `start_game` idempotent and accept the first valid caller who meets room membership requirements.

This is slightly more permissive but much more resilient on mobile networks.

---

## Observability

Add lightweight logging around:

- enqueue requests
- match attempts
- successful room creation from queue
- countdown handoff
- start-game success or failure for quick-match rooms

Avoid verbose per-second client logs or full queue dumps.

---

## Testing Strategy

### Unit tests

Add tests for:

- preference-to-range derivation
- target-size prioritization
- compatibility checks
- host selection
- countdown metadata derivation

### Edge function tests

Add tests for:

- enqueue idempotency
- cancel idempotency
- exact-size match
- flexible-range match
- duplicate enqueue protection
- rollback on room creation failure

### Client tests

Add tests for:

- quick-match form validation
- queue state rendering
- transition to match-found screen
- countdown screen rendering with avatars and names
- host start trigger handoff

### Regression focus

Ensure private-room flows remain unaffected:

- create private room
- join by code
- leave room
- room subscriptions
- standard room start flow

---

## Rollout Notes

### Safe first release

Ship quick match as a separate entry point without changing private match behavior.

### Fallback posture

If the queue becomes unhealthy, disable only the quick-match CTA and keep private matches working.

This is another reason to keep matchmaking isolated from `rooms`.

---

## Open Implementation Decisions

These should be resolved during implementation planning, not product design:

- exact countdown duration
- whether `matchmaking-status` is required or whether realtime plus local persistence is enough
- whether quick-match rooms need a dedicated room flag such as `is_public_match`
- whether quick-match should use different round/timer defaults than private rooms

---

## Final Recommendation

Build quick match as a dedicated queue subsystem backed by a single `matchmaking_queue` table and a small set of edge functions, then hand matched players into the existing `rooms` system.

This is the cleanest and most modern architecture for the current app because it:

- minimizes new complexity inside existing room logic
- keeps Postgres work short and selective
- avoids wasteful pre-created rooms
- uses realtime in a narrow, player-specific way
- preserves the proven gameplay path after match formation

The implementation should optimize for:

- one active ticket per player
- no heartbeat writes
- transactional group formation with row locking
- bulk inserts and updates
- client-derived countdown visuals
- idempotent start handoff into the normal game flow
