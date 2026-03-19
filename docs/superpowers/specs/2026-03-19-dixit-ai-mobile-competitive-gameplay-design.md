# Dixit AI Mobile - Competitive Gameplay Layer Design Spec
**Date:** 2026-03-19
**Project:** `dixit_ai_mobile`
**Status:** Approved

---

## Overview

This spec defines the next gameplay evolution for `dixit_ai_mobile`: a competitive layer that makes matches more strategic, more replayable, and more readable without making the core game hard to learn.

The current loop already works:

- narrator chooses a card
- narrator writes a clue
- players choose their responses
- everyone votes
- round scores are shown

That base is solid, but it is still too flat for long-term competitive play. The new design adds:

- a simple tactical resource used across the match
- one clear tactical decision in each phase where it matters
- controlled player interaction and comeback pressure
- competitive progression outside the match
- round-by-round explanation so the game teaches itself during play

The design goal is:

**easy to understand in the first match, hard to master after many matches**

This design assumes the current round loop remains intact. The new mechanics are additive and must fit the existing phase actions instead of replacing them.

---

## Product Goals

### Primary goals

- Make matches feel more competitive and strategic
- Reward reading opponents, bluffing well, and timing decisions correctly
- Increase replay value without turning the rules into a wall of text
- Explain each turn clearly enough that a first-time player understands what to do and why
- Create a real skill loop that can support ranked progression

### Secondary goals

- Add comeback pressure without making the game random
- Create more memorable round results
- Make results screens more informative and satisfying
- Prepare the game for future ranked seasons and player stats

### Non-goals

- Replacing the Dixit-style core loop
- Turning the game into a deckbuilder, battler, or heavy strategy game
- Adding multiple overlapping resource systems
- Requiring an external tutorial before a player can enjoy the game

---

## Design Principles

1. **One concept at a time**
   - Each phase should introduce only one important decision.

2. **Skill expression over chaos**
   - Players should win more often because they read people well, not because the game injected random swings.

3. **Counterplay must exist**
   - If a mechanic creates an advantage, another player must have a meaningful way to answer it.

4. **Results must be legible**
   - After every round, players should understand why points changed.

5. **The game teaches itself**
   - Each phase should tell the player:
     - what to do now
     - what a good decision looks like
     - what risk they are taking

---

## Scope

### In scope

- Add one new competitive match resource
- Add one tactical choice in narrator, player-card, and voting phases
- Add a controlled direct-interaction mechanic
- Expand round result explanations
- Add competitive points, divisions, and per-player competitive stats
- Add guided first-match UX and phase education
- Update scoring and results logic to include tactical bonuses

### Out of scope

- Full matchmaking system
- Real-time spectating
- Seasonal rewards economy
- Cosmetic battle pass or monetization systems
- Complex draft phases, bans, or perk loadouts
- Multi-currency progression
- Replacing or rebalancing the existing gallery wildcard feature in the same phase

---

## Current Gameplay Problems

The current game has five competitive weaknesses:

1. The best decision in most turns is too obvious once the player understands basic Dixit logic.
2. Players have limited control over tempo or momentum across rounds.
3. Results mostly show points, not the quality of decisions.
4. Comebacks depend too much on normal round variance.
5. First-time players are told what phase they are in, but not always what good play looks like.

This creates a game that is fun for casual novelty but not yet strong as a repeatable competitive loop.

---

## Core Competitive Layer

### 1. Match Resource: Intuition Tokens

Each player has a simple tactical resource:

- name: `Intuition Tokens`
- maximum held at one time: `3`

Players earn tokens by playing well:

- deceiving at least one opponent with their card
- correctly identifying the narrator card in a hard round
- as narrator, landing a balanced clue where some players guess correctly and some do not

Players spend tokens for tactical actions during the round.

This is the only new competitive resource system in the design.

### Relationship with existing gallery wildcards

The game already contains `3` gallery wildcards per player per match. Those are an existing utility mechanic, not part of the new competitive economy.

For this design:

- gallery wildcards remain as they are
- intuition tokens are introduced as a separate competitive layer
- the two systems must not be merged in the same implementation phase
- wildcard balance is not retuned by this spec unless later work proves it necessary

This removes planning ambiguity and keeps the competitive design incremental.

### Why this resource exists

- it makes rounds connected to each other
- it creates timing decisions
- it rewards strong play without forcing complexity

---

## Tactical Decisions By Phase

The game should expose one optional tactical action in each major phase.

These actions must be:

- optional
- clearly explained
- visually separated from the mandatory action
- readable in one sentence

### Action contract principle

The current game loop finalizes decisions through the existing actions:

- `submit_clue`
- `submit_card`
- `submit_vote`

The tactical layer must fit into those actions as additional payload fields, not as separate pre-submit RPCs.

Recommended shape:

- `submit_clue`
  - existing:
    - `clue`
    - `card_id | gallery_card_id`
  - new:
    - `tactical_action?: 'subtle_bet' | null`
    - `challenge_leader?: boolean`

- `submit_card`
  - existing:
    - `card_id | gallery_card_id`
  - new:
    - `tactical_action?: 'trap_card' | null`
    - `challenge_leader?: boolean`

- `submit_vote`
  - existing:
    - `card_id`
  - new:
    - `tactical_action?: 'firm_read' | null`
    - `spend_intuition_token?: boolean`
    - `challenge_leader?: boolean`

Only one tactical action can be attached to the phase action. `challenge_leader` is a match-level modifier, not a second phase action.

### Narrator Phase: `Subtle Bet`

The narrator may activate `Subtle Bet` before submitting the clue.

Effect:

- if the clue lands in the ideal balance window, the narrator gains a bonus
- if the clue is too obvious or too impossible, no bonus is granted

Purpose:

- rewards high-skill clue writing
- makes narrator turns more competitive
- creates a meaningful risk/reward choice

Success rule:

- let `eligible_voters = active non-narrator players in the round at resolution time`
- let `correct_votes = number of players who voted for the narrator card`
- `Subtle Bet` succeeds only if:
  - `correct_votes >= ceil(eligible_voters / 3)`
  - `correct_votes <= floor((eligible_voters * 2) / 3)`
  - and `correct_votes` is neither `0` nor `eligible_voters`

Examples:

- `3` eligible voters -> success on `1` or `2` correct votes
- `4` eligible voters -> success on exactly `2`
- `5` eligible voters -> success on `2` or `3`

### Player Card Phase: `Trap Card`

When a non-narrator chooses a card, they may mark it as a `Trap Card`.

Effect:

- if the card attracts votes from opponents, it earns a stronger deception bonus
- if nobody falls for it, the extra opportunity is wasted

Purpose:

- sharpens bluffing
- makes "good fake cards" more visible as a skill expression
- creates a reason to think about opponent psychology, not just visual fit

Success rule:

- `Trap Card` succeeds if the chosen non-narrator card receives at least `2` wrong votes from opponents
- on success, the player gains a flat tactical bonus
- on failure, they still keep any normal `received_vote` base points already defined by the core rules, but they gain no extra trap bonus

### Voting Phase: `Firm Read`

A player may spend `1 Intuition Token` when locking their vote to activate `Firm Read`.

Effect:

- if the vote is correct in a hard round, the player earns an extra bonus
- if incorrect, the player loses the token and gets no tactical reward

Purpose:

- adds tension to voting
- rewards confidence when confidence is earned
- gives smart players a place to press an edge

Success rule:

- player spends `1` intuition token when submitting the vote
- `Firm Read` only succeeds if:
  - the selected card is the narrator card
  - and fewer than half of eligible voters found the narrator card that round

This defines a deterministic `hard round`:

- `hard round = correct_votes < ceil(eligible_voters / 2)`

For all tactical scoring, `eligible_voters` must be calculated from active round participants only, not raw room size.

---

## Direct Interaction

The game should include one controlled interaction mechanic that matters competitively but does not create grief-heavy play.

### `Challenge the Leader`

Each player may use `Challenge the Leader` once per match.

Rules:

- can only target the player currently leading the match
- must be declared before the round action is finalized
- if the challenger outperforms the leader in that round's relevant metric, the challenger gains a competitive bonus

Implementation rule:

- the target is always the current solo match leader at the time of action submission
- if there is no solo leader, the action is unavailable
- the action is declared inline in the current phase submission payload
- the challenge succeeds only if the challenger ends the round with strictly more total round points than the targeted leader

This intentionally uses total round points instead of a role-specific comparison so it works across narrator and non-narrator turns.

Recommended reward:

- gain `1 Intuition Token`, or
- gain a small end-of-round competitive bonus

Recommended restrictions:

- cannot be used if there is no clear leader
- cannot directly delete points already earned

Conflict rule:

- multiple players may challenge the same leader in the same round
- each challenge resolves independently against that leader's round score
- a player can still use `Challenge the Leader` only once per match
- this removes race conditions from the one-shot submit flow

### Why this mechanic exists

- adds comeback pressure
- makes the scoreboard matter during the match
- creates player-versus-player tension without hard-removal mechanics

This mechanic should feel like a skill challenge, not sabotage.

---

## Scoring and Round Rewards

The base Dixit-style scoring remains the foundation. The new layer adds small tactical rewards around it.

### Scoring philosophy

- finishing first still matters most
- tactical play adds separation between similarly placed players
- tactical bonuses should not outweigh winning the round or winning the match

### Recommended tactical reward categories

- `balanced_clue_bonus`
- `trap_card_bonus`
- `firm_read_bonus`
- `leader_challenge_bonus`
- `deception_bonus`

### Deterministic scoring definitions

The following rules should be treated as the canonical first implementation:

- `balanced_clue_bonus`
  - granted when `Subtle Bet` succeeds
  - suggested value: `+1`

- `trap_card_bonus`
  - granted when a marked trap card receives at least `2` wrong votes
  - suggested value: `+1`

- `firm_read_bonus`
  - granted when `Firm Read` succeeds
  - suggested value: `+1`

- `leader_challenge_bonus`
  - granted when `Challenge the Leader` succeeds
  - suggested value: `+1`

- `deception_bonus`
  - granted when a player card fools at least `1` opponent
  - suggested value: leave the existing `received_vote` base rule intact and do not duplicate it with another bonus unless telemetry later proves the need

### Constraints

- total tactical bonus per round should stay low
- bonuses should be explainable in one line each
- players must see who triggered which bonus and why

---

## Competitive Meta Outside the Match

### Competitive score

Use a visible ladder score:

- name: `CP` (`Competitive Points`)

After each match, players gain or lose CP based on:

- final placement in the match
- quality of round-level decisions

### Weighting

Final placement should have higher weight than tactical performance.

Suggested logic:

- placement defines the main CP change
- round performance adjusts the result within a limited band

Example:

- 1st place with weak tactical play still climbs
- 2nd place with excellent tactical play can soften the loss or gain more than expected
- 4th place with good round play still usually loses CP, just less harshly

### Divisions

Suggested visible divisions:

- Bronze
- Silver
- Gold
- Crystal
- Astral

Each division should have short sub-tiers so progress feels tangible.

### Placement/provisional phase

First `5` ranked matches should be provisional:

- faster movement
- lower punishment
- easier calibration

### Demotion protection

Use light protection:

- no instant full division drop from one bad match

This keeps ranked from feeling unfair early on.

---

## Competitive Stats

The game should track a small set of meaningful stats, not vanity noise.

Recommended stats:

- narrator clue balance rate
- correct vote rate
- average players deceived per round
- trap card success rate
- firm read success rate
- challenge the leader success rate
- intuition tokens earned per match
- intuition tokens spent efficiently

These stats should be used in:

- profile
- post-match results
- ranked progression surfaces

They should help players understand where their edge actually comes from.

---

## Teaching the Game During Play

This is a critical part of the design, not a polish layer.

### Principle

The game should explain itself in context instead of forcing a long tutorial before the first match.

### Every phase must communicate three things

1. `What to do now`
2. `What good play looks like`
3. `What risk this optional tactical choice introduces`

### Example phase guidance

#### Narrator

- `Now:` choose a secret card and write a clue
- `Goal:` make some players guess correctly, but not everyone
- `Risk:` if your clue is too obvious or too vague, your bonus fails

#### Player card choice

- `Now:` choose a card that could pass as the narrator's
- `Goal:` look believable without being too obvious
- `Risk:` if your trap card fools nobody, the extra play is wasted

#### Voting

- `Now:` vote for the narrator's real card
- `Goal:` read the table, not just the clue
- `Risk:` if you spend a token on Firm Read and miss, you get nothing extra

### First-match guidance

The first match should use lighter helper text:

- stronger instructional copy
- clearer labels on tactical actions
- a short explanation the first time each mechanic appears

This should be dismissible or automatically softened in later matches.

---

## Results Screen Evolution

The current results phase needs to become more explanatory and more satisfying.

### Required upgrades

- explain round points with reasons
- show tactical bonuses line by line
- show who deceived whom
- show leaderboard movement
- show CP gain/loss after the match

### Example result lines

- `Balanced clue: +1`
- `Trap card fooled 2 players: +1`
- `Firm Read succeeded: +1`
- `Challenge the Leader succeeded: +1`
- `Finished 2nd: +18 CP`

### Required round summary payload

The current results flow is not sufficient. The client needs a richer round-resolution object in addition to cumulative score rows.

Recommended server payload:

```ts
type RoundResolutionSummary = {
  roundId: string
  narratorId: string
  narratorCardId: string
  clue: string | null
  correctVoterIds: string[]
  deceptionEvents: Array<{
    sourcePlayerId: string
    fooledPlayerId: string
    cardId: string
    trapCard: boolean
  }>
  tacticalEvents: Array<{
    playerId: string
    type: 'subtle_bet' | 'trap_card' | 'firm_read' | 'challenge_leader'
    success: boolean
    pointsDelta: number
    intuitionDelta: number
    description: string
  }>
  leaderboardDeltas: Array<{
    playerId: string
    scoreBefore: number
    scoreAfter: number
    positionBefore: number
    positionAfter: number
  }>
}
```

`ResultsPhase` should consume this summary directly instead of trying to infer everything from cards and cumulative player totals.

### Persistence and delivery

This summary should live in a dedicated persisted row keyed by `round_id`, for example:

- table: `round_resolution_summaries`
- primary key: `round_id`

`useRound` should hydrate:

- `round`
- `cards`
- `myPlayedCardId`
- `roundResolutionSummary`

Then `game.tsx` should pass `roundResolutionSummary` directly into `ResultsPhase`.

### Why this matters

A competitive system does not feel fair if players cannot see why results happened.

---

## UX Changes Required

### New UI surfaces

- token counter in round HUD
- tactical action buttons in narrator phase
- tactical action buttons in player card phase
- tactical action control in voting phase
- clearer results explanation panel
- competitive summary after match
- division and CP indicators in profile/home later

### UI rules

- mandatory action and optional tactical action must never look equally important
- bonus descriptions should be short, concrete, and risk-aware
- no phase should show more than one major tactical decision at once

---

## Data and Backend Impact

This design will require new state in the game model.

### Likely new round/match fields

- player intuition tokens
- per-match challenge usage
- tactical action selections by phase
- round performance markers
- competitive points
- division/tier
- stat aggregates

### Likely new score reasons

- `balanced_clue_bonus`
- `trap_card_bonus`
- `firm_read_bonus`
- `leader_challenge_bonus`

### Likely backend changes

- scoring function expansion
- round-resolution logic for tactical actions
- persistent competitive profile fields
- post-match CP calculation
- result payload expansion so the client can explain outcomes clearly

### Explicit client prerequisite

Before `Firm Read` is added, the client must stop deriving votable cards by `player_id !== userId` during the masked voting phase.

The server should provide one of:

- `myPlayedCardId`

`myPlayedCardId` is the chosen contract for this design because the store already understands that concept and it creates less API surface than a per-client `votableCardIds` list.

The client must exclude that card locally during voting even when identities are hidden.

This should be added incrementally, not as one massive migration.

---

## Phased Rollout Recommendation

This feature should ship in layers.

### Phase 1: Tactical match layer

- intuition tokens
- subtle bet
- trap card
- firm read
- clearer phase guidance
- richer round results
- client-side votable card fix

### Phase 2: Controlled interaction

- challenge the leader
- challenge-related result messaging
- extra round detail in results

### Phase 3: Competitive progression

- CP
- divisions
- provisional matches
- post-match competitive summary
- player stats

This sequence keeps the project manageable and allows tuning the in-match gameplay before ranking pressure is added.

---

## Risks

### Risk: too many rules too fast

Mitigation:

- one new competitive resource only
- one tactical choice per phase
- phase-specific helper copy

### Risk: tactical bonuses overpower base game

Mitigation:

- cap bonus values tightly
- keep placement weight higher than tactical bonus weight

### Risk: direct interaction feels toxic

Mitigation:

- use challenge mechanics, not sabotage
- target only the leader
- make it once per match

### Risk: ranked feels unfair

Mitigation:

- provisional matches
- clear CP breakdown
- low demotion harshness

---

## Success Criteria

This design is successful if:

- first-time players understand what to do in every phase without external explanation
- repeat players feel they can improve through skill, not just luck
- results screens explain score changes clearly
- ranked progression reflects both match outcome and quality of play
- new mechanics create tension without overwhelming the core game

---

## Summary

The recommended direction is a hybrid competitive design:

- deeper round decisions
- one simple competitive resource
- controlled direct interaction
- ranked progression with clear stats
- explicit in-context teaching

This preserves the existing Dixit-style identity while making the game far more replayable, more skillful, and more suitable for real competitive retention.
