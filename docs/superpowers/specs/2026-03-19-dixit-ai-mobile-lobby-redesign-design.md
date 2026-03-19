# Dixit AI Mobile - Lobby Redesign Design Spec
**Date:** 2026-03-19
**Project:** `dixit_ai_mobile`
**Status:** Approved

---

## Overview

Redesign the room lobby so it matches the polished visual language of the rest of the app and removes ambiguity during room creation and waiting.

The lobby must make three things obvious from the first second:

- the host is already inside the room
- the room is waiting for more players before it can start
- the room supports `3-8` players

This redesign covers the visual structure of the lobby, the initial room/player loading behavior, and the host/guest waiting states. It does not redesign the in-game phases.

---

## Goals

- Match the current card-driven visual style used across the app
- Show the host in the player list from the first meaningful render
- Replace the current generic layout with a clearer room-centered composition
- Make `minimum 3` and `maximum 8` players explicit
- Keep chat available, but visually secondary to room code, players, and room status
- Make the host start flow and guest waiting flow obvious without reading long instructions

---

## Out of Scope

- Reworking the game phase UI after the match starts
- Adding ready-checks, team logic, or role selection
- Changing the basic room lifecycle (`lobby -> playing -> ended`)
- Replacing chat with voice, reactions, or richer social features

---

## Current Problems

### Visual

- [lobby.tsx](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/app/room/[code]/lobby.tsx) is functional but visually flatter than the rest of the app
- Chat competes too much with the actual purpose of the screen
- The room code and waiting state do not feel like the primary focus

### State / data flow

- [useRoom.ts](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/src/hooks/useRoom.ts) loads room and players through separate calls with weak coordination
- The first render can briefly look like the room has no players, which makes the host-created room feel broken
- Player ordering is not defined for UX purposes, so the host is not guaranteed to appear first

### UX clarity

- The host does not get a strong "you are already in the room" confirmation
- The minimum player requirement is not integrated into the main room state
- Guests are told they are waiting, but not with a strong shared room-status presentation

---

## Recommended Approach

Use a room-centered "ritual card" layout:

- a primary room card for code, room state, and player rules
- a dedicated roster card that always shows the host first
- a focused action area for host start / guest waiting
- a compact secondary chat section

On the data side, tighten the initial fetch path so the lobby hydrates in a stable sequence:

1. resolve the room by `code`
2. fetch the matching `room_players`
3. sort host first, then by `joined_at`
4. render the hero room card as soon as the room itself is known
5. keep the roster and role-dependent action area in a short preparation state until the first player hydration completes

This keeps the UI aligned with the backend intent already present in [room-create/index.ts](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/supabase/functions/room-create/index.ts), which already inserts the host into `room_players`.

---

## Screen Structure

### 1. Header

Keep the same shared app header used elsewhere in the product. The lobby should not invent a different chrome.

### 2. Hero room card

Primary content block:

- small eyebrow label such as `Sala`
- large room code
- tap/share affordance
- dynamic room status copy
- visible rule line: `3-8 jugadores`

State copy must be concise and role-aware:

- host alone: `Estas dentro. Invita a 2 jugadores mas para empezar.`
- host with 2 players: `Falta 1 jugador para empezar.`
- host ready: `Ya podeis empezar.`
- guest: `Esperando a que el anfitrion inicie la partida.`

### 3. Roster card

Secondary but still prominent card:

- only active players are shown in the main visible roster
- host appears first when active
- then remaining active players ordered by `joined_at`
- host marked clearly
- active player count shown near the section heading

Inactive or disconnected rows are not part of the primary roster presentation. The list should never feel empty without explanation. If hydration is still happening, show a short preparation state instead of a blank roster.

### 4. Action card

For the host:

- clear primary CTA: `Empezar partida`
- disabled until at least `3` active players
- supporting copy tied to player count

For guests:

- no start button
- a compact waiting state card with clear explanation

### 5. Chat card

Chat remains available from the start, but it moves lower in the hierarchy:

- compact section
- visually consistent with the rest of the lobby
- clearly secondary to the room state and roster

### 6. Exit action

`Salir de la sala` remains visible and easy to find, but separated from the main start/wait flow so it does not compete with the primary actions.

---

## Data Flow Changes

### `useRoom`

[useRoom.ts](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/src/hooks/useRoom.ts) should move from a loosely coupled fetch pattern to an explicit hydration flow:

1. fetch room by `code`
2. store `room.id`
3. fetch players for that room
4. derive `activePlayers` from `room_players` where `is_active = true`
5. sort the visible roster with:
   - host first
   - then `joined_at` ascending
6. expose a short `hydratingPlayers` or equivalent state to the screen

The screen-state contract is explicit:

- room unresolved: full-screen loading / not-found handling
- room resolved, players hydrating: render hero room card immediately, but keep roster and role-dependent action area in preparation state
- players hydrated: render full lobby

Realtime stays in place for updates, but it is not trusted as the primary source for the first render.

### Host visibility guarantee

The backend intent already exists in [room-create/index.ts](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/supabase/functions/room-create/index.ts): the host is inserted into `room_players` immediately after room creation.

The redesign assumes no new room-creation behavior is needed unless a real persistence bug is later proven. The immediate fix is to present the initial state more robustly on the client.

### Capacity rules

The lobby must visually reinforce the same rule already enforced by [room-join/index.ts](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/supabase/functions/room-join/index.ts):

- minimum to start: `3`
- maximum capacity: `8`

This should be shown as room guidance, not only as an error after someone tries something invalid.

### Copy treatment

The sample Spanish strings in this spec define the intended meaning and hierarchy, not immutable final copy. Implementation should move them through i18n keys while preserving the same user-facing intent.

---

## Error Handling

- If the room code does not resolve, show a room-not-found state instead of a partially rendered lobby
- If the room exists but the initial player hydration is still running, render the hero room card and show a short preparation state for roster and role-dependent actions instead of an empty list
- If realtime lags, the initial hydrated roster remains the trusted baseline
- If the host has fewer than `3` active players, the start CTA remains disabled with explanatory copy
- If the room is already full, [room-join/index.ts](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/supabase/functions/room-join/index.ts) continues to enforce the backend rule, while the lobby makes the `3-8` limit visible up front
- If room loading fails for reasons other than a missing code, show a generic load-failure state rather than incorrectly reusing room-not-found

---

## Testing and Verification

### UI verification

- host-created room shows the host in the roster on the first meaningful render
- host sees `Empezar partida` disabled at `1/3` and `2/3`
- host sees ready state when `3+` active players are present
- guest sees a waiting state instead of a start CTA
- chat remains available but visually secondary

### Hook / state verification

- `useRoom` returns players ordered host first, then `joined_at`
- first-load state does not flash an empty roster once a valid room exists
- room status transition to `playing` still redirects correctly

### Manual product verification

- create room as host
- confirm host appears immediately in lobby
- join with additional players until `3`
- confirm start state unlocks
- confirm a room never accepts more than `8`

---

## Implementation Notes

- Follow the existing visual language already used by the current polished entry screens and shared header
- Avoid introducing a new lobby-specific design system
- Prefer small focused changes in [lobby.tsx](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/app/room/[code]/lobby.tsx) and [useRoom.ts](/c:/Users/jairo/Desktop/PROYECTO%20GUESSTHEPRONT/dixit_ai_mobile/src/hooks/useRoom.ts) over unrelated refactors
- If shared presentation primitives are needed, keep them reusable and narrow in scope
