# Dixit AI Mobile - Lobby Readiness and Chat Design
**Date:** 2026-03-24
**Project:** `dixit_ai_mobile`
**Status:** Draft

---

## Overview

Extend the lobby so it supports a proper ready-check before the host can start, communicates room closure causes clearly, and upgrades chat presentation to feel like a real multiplayer room.

This spec also folds in the current `Empezar partida` failure as a first-class requirement: the lobby start flow must be reliable end-to-end, not just visually enabled.

---

## Goals

- Require every active non-host player to mark `Estoy listo` before the host can start
- Keep the host outside the ready-check while still showing host state clearly
- Show clear readiness state for each player in the roster
- Show meaningful room closure reasons, including whether the current user caused the closure
- Improve lobby chat so:
  - own messages are right-aligned
  - other players' messages are left-aligned
  - other players show avatar or initials fallback
  - each player has a subtle stable accent color
- Eliminate the current `start_game` failure path and require direct verification of the edge function flow

---

## Out of Scope

- Adding lobby timers or auto-expiration by time
- Adding moderation, kick/ban, reactions, typing indicators, or voice
- Redesigning in-game chat outside the lobby
- Adding complex grouped-message layouts or Discord-style threading

---

## Current Problems

### Start flow

- The current lobby UI can show `Empezar partida` while the backend path is unhealthy
- The current failure mode is especially bad because the user only sees a generic toast
- The system needs a product-level contract for when start is allowed and how failure is reported

### Lobby coordination

- The current lobby only cares about active player count
- There is no explicit per-player readiness state
- The host cannot see clearly who is blocking the start condition

### Chat presentation

- Lobby chat currently renders all messages with the same visual structure
- Messages do not distinguish the current user from other users strongly enough
- Other players do not surface their profile image in chat
- There is no stable player-specific accent that helps scan a conversation

### Room closure communication

- The room lifecycle has `lobby -> playing -> ended`, but no explicit user-facing closure reason model
- When a room ends unexpectedly, the UX cannot explain whether:
  - the host cancelled before start
  - everyone left
  - the match dropped below the playable minimum
  - the room ended normally

---

## Recommended Approach

Use the existing `rooms` + `room_players` model and extend it instead of introducing a parallel lobby-state system.

### Why this approach

- readiness is a player attribute inside a room, so `room_players` is the right ownership boundary
- closure cause is a room-level fact, so `rooms` should carry it
- chat can enrich itself by reading `profiles.avatar_url` without denormalizing snapshots into `lobby_messages`

This keeps the design small, coherent, and easy to enforce from the edge functions.

---

## Data Model

### `room_players`

Add:

- `is_ready boolean not null default false`

Rules:

- host does not participate in the ready requirement
- guests enter or re-enter with `is_ready = false`
- leaving a room effectively removes the player from readiness by setting `is_active = false`

### `rooms`

Add:

- `ended_reason text null`

Allowed reasons:

- `host_cancelled_lobby`
- `all_players_left`
- `too_few_players_in_game`
- `room_finished`
- `invalid_room_state`

The field is for product-facing state, not arbitrary debug text.

---

## Lobby Rules

### Start condition

The host can start only when all of these are true:

1. room status is `lobby`
2. there are at least `3` active players total
3. every active non-host player has `is_ready = true`

If any condition fails, `start_game` must reject with a specific backend error.

### Guest readiness

Every active non-host player gets a lobby action:

- `Estoy listo`

Once ready:

- the CTA changes to a passive ready state
- the player row shows `Listo`

If the player changes room membership by leaving and rejoining, readiness resets to `false`.

### Host view

The host does not have a ready toggle.

The host sees:

- which players are `Listo`
- which players are still `Esperando`
- whether the room can start now
- if it cannot start, who is still missing

---

## Room Closure Rules

### Before start

If the host leaves while the room is still in `lobby`, the room closes instead of transferring host.

Reason:

- `host_cancelled_lobby`

This is intentional. The host is the organizer before match start, so handing the room to another player without consent is a worse UX than closing it clearly.

### During a match

If everyone leaves:

- room ends with `all_players_left`

If the game falls below the playable minimum:

- room ends with `too_few_players_in_game`

If the match reaches its normal end:

- room ends with `room_finished`

If the system reaches a corrupted or unexpected room state:

- room ends with `invalid_room_state`

### User-facing copy

The ended screen must map `ended_reason` to user-visible text.

It must support two perspectives:

- neutral: what happened
- personal: if the current user caused it

Example intent:

- host cancelled and you are host: `La sala se ha cerrado porque saliste antes de empezar.`
- host cancelled and you are guest: `La sala se ha cerrado porque el anfitrion salio antes de empezar.`
- too few players in game and you caused it by leaving: `La partida se ha cerrado porque al salir dejaste menos de 3 jugadores activos.`

Implementation can localize wording, but the cause mapping must stay explicit.

---

## Chat Design

### Layout

- current user messages:
  - right-aligned
  - no avatar
  - cleaner self bubble
- other players' messages:
  - left-aligned
  - avatar visible
  - name shown above or at the top of the message cluster

### Avatar source

Use:

- `profiles.avatar_url`

Fallback:

- initials from display name

### Player accent color

Each player gets a subtle stable accent color derived from `player_id`.

Usage:

- avatar ring
- sender name
- light border/accent of the message bubble

Not used:

- full bubble fill
- overly bright gradients

The accent must remain subtle so the chat still matches the rest of the app.

### Data flow for chat metadata

Lobby chat should resolve a `playerMetaById` structure from:

- current roster data
- `profiles.avatar_url` for players present in the chat

The message records themselves remain unchanged.

---

## Backend Changes

### New lobby/game actions

Add a ready-toggle action handled by `game-action`, for example:

- `set_ready`

Payload:

- `{ ready: boolean }`

Rules:

- only active non-host players may call it while room status is `lobby`
- host cannot mark ready

### `start_game`

`start_game` must validate:

- room exists
- caller is host
- room status is `lobby`
- active player count >= 3
- every active non-host player is ready

If not, it must return a specific error such as:

- `PLAYERS_NOT_READY`

### `room-leave`

Extend `room-leave` so it sets `ended_reason` when the room is ended by player departures according to the rules above.

---

## UI Changes

### Lobby roster

Each player row shows:

- avatar / initials
- display name
- host badge if host
- readiness badge:
  - `Listo`
  - `Esperando`

Host row:

- no readiness requirement
- visually distinguished as host only

### Lobby action card

Host:

- sees start CTA
- sees explanatory copy when blocked by unready players

Guest:

- sees ready CTA until marked ready
- then sees waiting-ready state

### Ended screen

The ended screen must read `rooms.ended_reason` and render localized copy based on:

- cause
- whether the current user triggered it

---

## Error Handling

- `PLAYERS_NOT_READY` must surface a user-friendly message instead of the generic toast
- if readiness metadata fails to load, the lobby should keep the room usable but show safe fallback labels
- if profile avatars fail to load, fallback to initials without breaking chat layout
- if `ended_reason` is missing for an ended room, use a generic fallback copy rather than leaving the state unexplained

---

## Verification Requirements

### Functional

- host cannot start with fewer than `3` active players
- host cannot start while any active non-host player is not ready
- host can start when all active non-host players are ready
- non-host players can toggle ready in lobby
- leaving and rejoining resets guest readiness
- if host leaves before start, room ends with `host_cancelled_lobby`
- if active players in a live game drop below `3`, room ends with `too_few_players_in_game`

### Chat

- own messages render on the right
- other messages render on the left
- other messages show avatar or initials fallback
- player accent color is deterministic per `player_id`

### Start flow health

This feature is not complete unless the real edge-function path is verified outside the UI:

1. create room
2. join with 3 players
3. mark guests ready
4. call `start_game`
5. confirm success and room transition to `playing`

This requirement exists because the current bug already showed that a visually enabled start CTA is not enough.

---

## Implementation Notes

- prefer extending existing tables and functions over adding new lobby-specific tables
- keep chat rendering in a dedicated component instead of growing `lobby.tsx` further
- keep readiness enforcement in the backend, not only in UI guards
- do not add a timer; the lobby remains persistent until a player-driven state change ends it
