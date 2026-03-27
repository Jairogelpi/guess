# Dixit AI Mobile - Gameplay Tactical UI and Live Standings Design

**Date:** 2026-03-27
**Project:** `dixit_ai_mobile`
**Status:** Ready for Planning

---

## Overview

This spec redesigns the active match interface so the tactical controls read as a clean action system instead of a rules wall.

The current gameplay screen has two problems:

- the tactical area repeats disabled explanations as full sentences, which makes the screen look broken and heavy
- players cannot see live match standing, current points, or position from the main gameplay UI without relying on later summary views

The approved direction is a focused interface redesign inside the gameplay screen only. It keeps the existing tactical rules and data model, but changes the hierarchy and presentation so the screen feels more readable, premium, and competitive.

---

## Goal

Make the in-match screen visually clearer and more competitive by:

- removing the repeated tactical explanation block
- reorganizing tactical controls into a more intentional action tray
- showing live standings with points and positions during gameplay
- keeping the interface compact enough that the board remains the main focus

---

## Confirmed Decisions

### Scope included

Apply the redesign to the active game experience:

- add a live standings strip to the shared gameplay shell so it is visible in narrator, player, voting, and waiting states
- redesign the tactical tray anywhere `TacticalActionPicker` is already mounted in gameplay
- keep the top gameplay stack around `GameStatusHUD` visually consistent across phases

For the current repo state, that means:

- narrator waiting view in `app/room/[code]/game.tsx`
- voting action bar in `src/components/game-phases/VotingPhase.tsx`
- shared shell layout in `app/room/[code]/game.tsx`

It does **not** require inventing a brand-new tactical tray inside `NarratorPhase.tsx` or `PlayersPhase.tsx` for this task.

### Scope excluded

Do **not** change:

- lobby UI
- gallery preview cards
- large card preview surfaces
- tactical rules or scoring formulas
- backend payload shapes for this task

### UX intent

The screen should look more curated and less text-dense:

- standings should always be visible
- tactics should look like actions, not documentation
- blocked states should explain themselves once, not five times
- the user should immediately understand who is leading and how many points everyone has

---

## Existing State

Current gameplay hierarchy in `app/room/[code]/game.tsx` is:

1. `GameStatusHUD`
2. `EconomyBadges`
3. current phase content

Within `TacticalActionPicker.tsx`, the current tactical UI:

- renders phase chips
- renders `Challenge the Leader` separately
- renders a repeated notes block for every blocked action
- renders a lightweight selected-state summary below

This creates a visual problem:

- the notes area dominates the card when the user is not allowed to use several actions
- blocked information is repeated per action even when the underlying reason is shared
- there is no live ranking strip near the HUD, so competitive context is hidden

---

## Recommended Approach

Use a focused gameplay-shell redesign:

1. keep the existing gameplay flow and tactical rules
2. add a compact live standings strip directly under the main HUD
3. refactor `TacticalActionPicker` into a denser action tray with stronger visual grouping
4. replace the repeated notes block with one contextual helper line
5. preserve the board and card areas as the primary visual focus

This is the best fit because it solves the actual readability problem without reopening the game architecture or requiring backend changes.

---

## Information Hierarchy

The gameplay shell should always read top to bottom in this order:

1. match state and timer
2. live standings
3. economy counters
4. phase content

Inside phase content, the layout depends on whether the current user can act:

- active tactical surfaces:
  - tactical tray first
  - primary interaction surface second
- waiting surfaces:
  - waiting context first
  - disabled tactical tray second, only when that tray already exists in the current flow

This keeps the shell consistent without forcing new tactical mounts into phases that do not currently use them.

---

## Live Standings Strip

Introduce a compact gameplay-only standings component mounted under `GameStatusHUD`.

### Content

Each player pill must show:

- position marker such as `#1`, `#2`, `#3`
- avatar from `profiles.avatar_url`, or an initial fallback if absent
- shortened display name
- current total score

### Sorting

Use the same live score basis already available in the room player list:

- sort by `score` descending
- use the incoming `players` array order from the current room payload as the fallback tiebreak for presentation
- tied players still display sequential visible positions unless an existing shared-rank helper is already present and easy to reuse

The goal is visual clarity, not tournament-grade ranking semantics.

### Emphasis

- first place should receive the strongest accent
- the current user should have a persistent personal highlight even when not first
- the strip must stay visually compact and horizontally scannable

### Responsive behavior

- on narrow widths, allow horizontal scrolling rather than wrapping into a tall block
- keep the height low enough that the board does not get pushed excessively downward

---

## Tactical Action Tray

Refactor `TacticalActionPicker` so it reads as a premium action tray instead of a rules panel.

### Structural changes

- keep the title and token count
- unify standard tactics and `Challenge the Leader` into one cohesive visual system
- keep action chips as the primary controls
- keep the selected-state summary, but make it feel tighter and more deliberate

### Visual direction

- active chips should feel selectable and valuable
- blocked chips should remain visible but quieter
- `Challenge the Leader` should remain visually distinct with a stronger accent, but no longer feel detached from the rest of the action system

### Interaction model

- tapping a chip still opens `TacticalActionSheet`
- confirmation still happens through the sheet
- the tray itself should communicate selection state clearly before submit

---

## Blocked-State Simplification

Remove the repeated per-action explanatory paragraph block from `TacticalActionPicker`.

Replace it with one compact helper area that appears only when needed.

### Helper behavior

Show a single contextual line based on the most relevant current reason, for example:

- selection required
- only the narrator can use this in this phase
- not enough intuition tokens
- no unique leader available

### Priority

When multiple blocked reasons exist, prefer the reason that best explains why the user cannot meaningfully act **right now**:

1. missing required selection
2. wrong role for this phase
3. insufficient tokens
4. exhausted usage / no valid target conditions

The helper is an orientation aid, not a full rule dump.

---

## Score and Position Visibility

The gameplay screen must expose competitive context at all times:

- current points for every player
- current visible position for every player
- clear identification of the leader
- clear identification of the current user

This strip is informational only for this task. It does not need to become interactive, open a modal, or replace the fuller `ScoreBoard` used elsewhere.

---

## Component Boundaries

Planning should keep the change isolated with small units.

### Per-phase target layout

- narrator waiting in `game.tsx`
  - shell shows `HUD -> standings -> economy`
  - waiting card remains the primary block
  - disabled tactical tray remains below the waiting card

- narrator active in `NarratorPhase.tsx`
  - shell shows `HUD -> standings -> economy`
  - no new tactical tray is added as part of this task

- player submission active in `PlayersPhase.tsx`
  - shell shows `HUD -> standings -> economy`
  - no new tactical tray is added as part of this task

- player waiting in `PlayersPhase.tsx`
  - shell shows `HUD -> standings -> economy`
  - no tactical tray is introduced here

- voting active in `VotingPhase.tsx`
  - shell shows `HUD -> standings -> economy`
  - tactical tray remains in the action bar and appears above the vote confirm button

- voting waiting in `VotingPhase.tsx`
  - shell shows `HUD -> standings -> economy`
  - no disabled tactical tray is shown after the user has already voted

### Expected component changes

- `app/room/[code]/game.tsx`
  - insert the standings strip into the gameplay shell
  - keep narrator waiting layout as waiting card first, tactical tray second

- `src/components/game/TacticalActionPicker.tsx`
  - redesign layout
  - collapse repeated notes into one helper
  - visually integrate challenge leader with the rest of the action tray

- `src/components/game-phases/VotingPhase.tsx`
  - preserve the action-bar mount point
  - place the redesigned tray above the vote CTA

- new gameplay standings component
  - create a focused component for compact in-match ranking
  - do not overload the existing `ScoreBoard` if doing so would make it harder to reason about

### Expected no-change references

- `src/components/game-phases/NarratorPhase.tsx`
- `src/components/game-phases/PlayersPhase.tsx`

### Data sources

Use already available front-end data:

- `players` from room/game hooks
- `player_id`
- `display_name`
- `score`
- current user id

No new backend dependency is required for this redesign.

---

## Error Handling and Edge Cases

Implementation planning must cover these cases:

- players with long names should truncate cleanly
- missing avatar should fall back gracefully
- very small player counts should still produce a balanced strip
- ties should remain visually stable between renders
- if player data is temporarily incomplete, the standings strip should fail softly instead of crashing the match screen
- the helper line should disappear when there is no meaningful blocked explanation to show

---

## Copy and Translation Expectations

This redesign should reduce visible instructional text, not add more.

Guidelines:

- keep the helper copy short
- avoid repeating the tactic name inside the helper line when the chip is already visible
- prefer compact phrases over full multi-line explanations
- any new visible labels must be added to `i18n` instead of hard-coded

---

## Testing Strategy

Implementation planning should include:

- a structural test that the repeated notes block is removed from `TacticalActionPicker`
- a test for standings ordering by score
- a test that the standings strip renders score and position for each player
- a test that the current user highlight logic is applied
- focused manual verification in narrator waiting, player submission, and voting states

Preview cards and non-gameplay surfaces should remain untouched.

---

## Non-Goals

This task does **not** include:

- redesigning the entire board layout
- changing tactical rules or costs
- rewriting `TacticalActionSheet`
- adding animated score history or charts
- replacing existing results ranking screens
- making the standings strip interactive

---

## Implementation Readiness

This is one focused gameplay UI redesign centered on tactical clarity and live competitive context.

It is ready for implementation planning.
