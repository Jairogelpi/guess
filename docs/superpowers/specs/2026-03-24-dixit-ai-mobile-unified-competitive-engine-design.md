# Dixit AI Mobile - Unified Competitive Engine Design
**Date:** 2026-03-24
**Project:** `dixit_ai_mobile`
**Status:** Draft

---

## Overview

This spec replaces the current phase-1 tactical layer with a unified competitive engine built around a soft TFT-style economy.

The match shell stays the same:

- narrator chooses card + clue
- non-narrators submit cards
- players vote
- the round resolves

What changes is the competitive layer above that shell. The game stops feeling like "base Dixit plus a few perks" and starts behaving like one coherent strategic system built around:

- a single economy: `intuition_tokens`
- round income
- position bonus
- saving interest
- a small set of strong but readable tactical decisions

The final tactical set is:

- `Clue de Riesgo`
- `Voto Apostado`
- `Carta Corrupta`
- `Challenge the Leader`

Removed from the unified design:

- `Firm Read`
- `Peek Fragment`

This design is for competitive matches with `3..8` players. It is not intended for `2` players.

If a live match drops below `3` active players:

- the current in-flight round may finish using the participant snapshot locked at the start of round resolution
- no further competitive round may start
- the room ends with `too_few_players_in_game`

Authoritative rule:

- all scoring, banding, bet-pot sizing, and economy formulas use the same participant snapshot
- that snapshot is locked at the start of round resolution
- no live disconnect or reconnect changes the participant set for that round after the lock point

---

## Goals

### Primary goals

- make the economy easy to understand but deep to optimize
- create real decisions around saving vs spending
- reward good reads, good bluffing, and good timing
- keep the system mathematically bounded so it feels competitive, not unfair
- make it obvious in UI what the player can use now and why

### Secondary goals

- let match position matter without creating strong rubber-band or snowball
- give narrators a higher-skill decision without overcomplicating clue writing
- make the voting phase more strategic without turning it into a rules wall
- preserve the core Dixit feel

### Non-goals

- supporting competitive mode for `2` players
- adding multiple currencies
- adding sabotage that degrades other players' UI
- creating a giant tactical menu in every phase
- replacing the core round loop

---

## Problems With The Current Competitive Layer

The current tactical layer in `master` is a good base, but it has four problems:

1. `subtle_bet`, `trap_card`, and `firm_read` do not feel like parts of one economy.
2. `intuition_tokens` exist, but the economy is too thin to support real saving/spending strategy.
3. the current bonuses are readable, but not strong enough to create a clear competitive metagame.
4. the UI reads like optional extras rather than a real strategic layer.

This design solves that by replacing the current tactical interpretation with one consistent system.

---

## Design Principles

1. **One economy**
   - `intuition_tokens` are the only tactical currency.

2. **Simple inputs, deep outputs**
   - income, position, and interest must be easy to understand.
   - the depth comes from timing and probability, not hidden formulas.

3. **Bounded variance**
   - one action must not decide a match by itself.

4. **No hidden unfairness**
   - the round summary must explain why points and tokens moved.

5. **Contextual visibility**
   - tactics appear only in the phase where they matter.
   - within that phase, all relevant tactics are visible, even if blocked.
   - if a tactic belongs to the current phase but to another role, it should still be shown disabled with an explicit reason.

6. **Backend authority**
   - the backend validates tokens, legality, and scoring.

---

## Competitive Mode Scope

This engine is valid only for rooms with `3..8` active players.

Rules:

- competitive start is allowed only when `active_players between 3 and 8`
- rooms with fewer than `3` players are not valid competitive matches
- `2` player balancing is explicitly out of scope

This keeps the economy and scoring model mathematically stable.

---

## Core Economy

## Resource

Use the existing `room_players.intuition_tokens` as the single tactical currency.

## Capacity

- minimum: `0`
- maximum: `10`

## Match start

- every player starts the match with `2` intuition tokens

## Round income

At the end of every round, after round points are resolved, each player gains:

- `base income`
- `position bonus`
- `interest`

Then token totals are clamped to `0..10`.

This order is intentional:

1. resolve the round
2. inspect the bank the player finished the round with
3. apply economic income for the next round

That makes saving and spending in the current round matter immediately.

### Base income

- every player gains `+2` tokens every round

### Position bonus

Position bonus depends on the player's **total match standing** after the round, not on round-only performance.

All positions receive a bonus, but the spread stays soft:

- `top band`: `+2`
- `middle band`: `+1`
- `bottom band`: `+0`

Use ranking by total score descending. Resolve ties by shared standing for band assignment.

### Tie handling

Tie handling must be deterministic and shared, not arbitrarily split.

Algorithm:

1. sort players by total match score descending
2. group adjacent players with the same total score into tie groups
3. for each tie group, compute `shared_rank_index` as the index of the **first** player in that tie group
4. compute `percentile = shared_rank_index / (n - 1)`
5. assign the same band to every player in that tie group

This guarantees tied players always receive the same position bonus.

#### Band calculation

Let:

- `n = active players in the match`
- `rank_index = 0-based standing index after sorting by total score descending`
- `percentile = rank_index / (n - 1)`

Band assignment:

- `top band` if `percentile <= 0.20`
- `bottom band` if `percentile >= 0.80`
- otherwise `middle band`

This gives stable behavior across `3..8` players:

- `3 players`: top 1 / middle 1 / bottom 1
- `4 players`: top 1 / middle 2 / bottom 1
- `5 players`: top 1 / middle 3 / bottom 1
- `6 players`: top 2 / middle 2 / bottom 2
- `7 players`: top 2 / middle 3 / bottom 2
- `8 players`: top 2 / middle 4 / bottom 2

This is deliberately soft:

- leaders are rewarded
- middle players are not starved
- bottom players are not artificially overcompensated

Worked example:

- `5` active players
- total scores after the round: `12, 9, 9, 6, 4`
- sorted index positions: `0, 1, 2, 3, 4`
- the tie group `9, 9` uses `shared_rank_index = 1`
- percentile for both tied players = `1 / 4 = 0.25`
- both tied players land in `middle band`

### Interest

Interest is based on the bank the player has **when the round ends**, before round income is added.

Interest tranches:

- `0..3`: `+0`
- `4..5`: `+1`
- `6..7`: `+2`
- `8..10`: `+3`

This creates a saving game without making the economy too easy to hoard.

### Economic intent

The economy should feel like TFT in spirit:

- everyone gets predictable income
- position matters
- saving matters
- the best player is not the one who spends every round, but the one who times spending best

### Tactical token generation

Tactics do **not** print economy in the normal case.

The economy comes primarily from:

- base income
- position bonus
- interest

Tactics mostly convert tokens into **points**, not into more tokens.

This is intentional. It avoids snowball and keeps the economy readable.

---

## Round Scoring Foundation

The unified engine keeps a recognizable shell and layers competitive rules on top.

## Narrator baseline

- if nobody guesses correctly:
  - narrator `-2`
- if everybody guesses correctly:
  - narrator `-2`
- otherwise:
  - narrator `+3`

## Market payout for correct votes

For active non-narrator players:

- exactly `1` correct guesser:
  - each correct guesser gets `+4`
- exactly `2` correct guessers:
  - each correct guesser gets `+3`
- `3+` correct guessers:
  - each correct guesser gets `+2`

## Narrator fail consolation

Narrator fail states override the normal market payout table:

- if nobody guesses correctly:
  - correct-vote market payout does not apply
  - each non-narrator gets `+2`
- if everybody guesses correctly:
  - correct-vote market payout does not apply
  - each non-narrator gets `+1`

## Base decoy reward

For non-narrator cards that are **not** corrupted:

- each opponent vote received on that card grants the owner `+1`

This remains the default bluff reward.

---

## Tactics

## 1. Clue de Riesgo

This replaces the current `subtle_bet`.

The narrator chooses one clue profile when submitting clue + card:

- `normal`
- `sniper`
- `narrow`
- `ambush`
  - UI meaning: `haz que nadie adivine tu carta`

### Profiles

- `normal`
  - no cost
  - no extra reward

- `sniper`
  - target: exactly `1` correct guesser
  - cost: `0`

- `narrow`
  - target: exactly `2` correct guessers
  - cost: `0`

- `ambush`
  - target: exactly `0` correct guessers
  - cost: `1` token
  - player-facing explanation: this is the explicit high-risk clue profile for trying to make the whole table miss

### Resolution

Let:

- `correct_votes = number of votes on the narrator card`
- `target = 1` for `sniper`, `2` for `narrow`, `0` for `ambush`
- `distance = abs(correct_votes - target)`

Resolution:

- exact hit:
  - `+2` points
- miss by exactly `1`:
  - `0`
- hard miss:
  - `-1`

For `normal`, no profile scoring applies.

### Why this is balanced

- exact execution matters
- near-miss is not punished
- penalty is bounded at `-1`
- only `ambush` has token cost because it is the sharpest risk profile

---

## 2. Voto Apostado

This is the central vote tactic.

The player votes normally, then may place a bet:

- `bet_1`
- `bet_2`

### Cost

- `bet_1`: spend `1` token
- `bet_2`: spend `2` tokens

### No direct multiplier rule

The bet does **not** multiply score directly.

Direct score multipliers are excluded because they become too volatile and too hard to balance.

### Bet pot

Each round creates a small fixed `bet pot` based on active players:

- `3-4 players`: pot `1`
- `5-6 players`: pot `2`
- `7-8 players`: pot `3`

### Who can win the pot

Only players who:

- placed a bet
- voted correctly

participate in the bet-pot payout.

### Weighting

Winning bettors share the pot weighted by stake:

- `bet_1` contributes weight `1`
- `bet_2` contributes weight `2`

### Distribution

Use deterministic largest-remainder allocation:

1. compute each winner's exact share:
   - `exact_share = pot * weight / total_winning_weight`
2. award the floor of each share
3. distribute remaining points one by one by largest remainder
4. tie-break leftovers by:
   - lower **pre-bet-payout total match score** first
   - then stable `player_id` ascending

This ensures:

- fixed total payout
- no score explosion
- stake size matters
- outcome remains deterministic

`pre-bet-payout total match score` means:

- the player's cumulative match score
- after all non-bet round scoring has been applied
- but before any bet-pot points are awarded

Worked example with equal shares:

- pot = `2`
- winners:
  - player A with weight `1`
  - player B with weight `1`
- each exact share = `1.0`
- both get `1`

Worked example with remainder:

- pot = `2`
- winners:
  - player A with weight `2`
  - player B with weight `1`
- exact shares:
  - A = `1.333...`
  - B = `0.666...`
- floor allocation:
  - A = `1`
  - B = `0`
- one leftover remains
- leftover goes to B because remainder `0.666...` is greater than A's `0.333...`

### Failure

If a bettor votes incorrectly:

- they lose the staked tokens
- they get no share of the pot

### Why this is balanced

- upside is capped by player-count band
- failure costs tokens, not huge score punishment
- the pot is controlled and predictable

### Leader snapshot interaction

The bet-pot tie-break uses the cumulative match score snapshot taken:

- after all non-bet round scoring
- before bet-pot payout
- before `Challenge the Leader` bonus resolution

---

## 3. Carta Corrupta

This replaces the current `trap_card`.

The player may mark a submitted non-narrator card as corrupted.

### Cost

- spend `1` token

### Success

If at least one opponent votes for the corrupted card:

- corrupted card owner: `+2` points
- each fooled voter who selected that corrupted card: `-1` point

### Failure

If nobody votes for the corrupted card:

- no extra points
- spent token is lost

### Match limit

- maximum `2` corrupted cards per player per match

### Round limit

- maximum `1` corruption declaration by a player in a round

### Precedence rule

`Carta Corrupta` replaces the normal reward for votes received on that card.

Meaning:

- votes on a corrupted card do **not** generate the normal `+1 per opponent vote` bluff reward
- only the corruption outcome applies

This prevents double-dipping and keeps the mechanic fair.

### Why this is balanced

- strong upside
- real token cost
- hard per-match limit
- no stacking with base vote income

---

## 4. Challenge the Leader

`Challenge the Leader` stays in the system as a contained competitive modifier.

### Availability

- only if there is a unique leader
- not available to the leader
- `1` use per player per match

### Cost

- spend `1` token

### Declaration

The player declares it as a modifier in the current phase action.

The challenged leader is the unique leader snapshot captured at the moment the modifier is submitted.

That target does not change later in the round, even if provisional round scoring would have moved another player ahead before challenge resolution.

### Resolution timing

It resolves:

- after all other round points are calculated
- but before its own bonus is added

### Success condition

The challenge succeeds only if the challenger exceeds the leader by at least `2` round points.

### Reward

- `+2` points

### Failure

- token is lost
- no bonus

### Why this is balanced

- scoreboard pressure exists
- reward is real but bounded
- no economy printing
- requires a meaningful round overperformance, not a micro-edge

---

## Canonical Round Resolution Order

The backend must use this exact resolution order:

1. lock the round participant snapshot
   - this snapshot defines `active_players` for the full round resolution
2. resolve base round scoring
   - narrator baseline
   - narrator fail consolation if applicable
   - normal market payout if applicable
   - normal non-corrupted decoy rewards
3. resolve clue-risk scoring
4. resolve corrupted-card scoring
   - overriding normal decoy reward on corrupted cards
5. compute provisional cumulative match scores
   - this produces the `pre-bet-payout total match score` snapshot
6. resolve `Voto Apostado`
   - including largest-remainder payout and deterministic tiebreak
7. resolve `Challenge the Leader`
   - using the leader snapshot captured at declaration time
   - using round-point totals after steps 2-6
   - but before adding its own challenge bonus
8. finalize cumulative match scores for the round
9. apply round economy income
   - base income
   - position bonus
   - interest
10. clamp tokens to `0..10`

This order is the source of truth for both backend logic and round-summary explanation.

---

## Combination Rules

Players may combine tactics inside a phase if:

- they can afford the total token cost
- the combination is logically valid
- per-round limits are respected
- per-match limits are respected

Examples:

- narrator:
  - `Clue de Riesgo + Challenge the Leader`
- player card:
  - `Carta Corrupta + Challenge the Leader`
- voting:
  - `Voto Apostado + Challenge the Leader`

The backend must reject invalid combinations even if the client tries to send them.

Removed combinations:

- no `Firm Read`
- no `Peek Fragment`

### Token timing rule

Tactical costs become authoritative **when the phase action is submitted**, not at end-of-round resolution.

Meaning:

- the backend validates affordability on submit
- the backend deducts or reserves the token cost immediately on submit
- those spent/reserved tokens are no longer available in later phases of the same round
- round resolution only decides points and any tactical success/failure outcomes
- round income is still applied only after round resolution

This rule is required so:

- the token HUD stays truthful across phases
- players cannot overspend by arming card tactics and then betting the same tokens later
- the round summary can cleanly distinguish:
  - tactical costs paid on submit
  - round income awarded after resolution

### Action payload contract

The unified engine must continue to fit into the existing phase-submit flow.

Recommended contract:

- `submit_clue`
  - required:
    - `clue`
    - `card_id | gallery_card_id`
  - competitive:
    - `risk_clue_profile?: 'normal' | 'sniper' | 'narrow' | 'ambush'`
    - `challenge_leader?: boolean`

- `submit_card`
  - required:
    - `card_id | gallery_card_id`
  - competitive:
    - `is_corrupted?: boolean`
    - `challenge_leader?: boolean`

- `submit_vote`
  - required:
    - `card_id`
  - competitive:
    - `bet_tokens?: 0 | 1 | 2`
    - `challenge_leader?: boolean`

Persistence rule:

- narrator/card round-scoped flags should continue to reuse the existing submission-side storage already used in the repo
- if the repo already stores round-scoped modifiers on the card submission row, `challenge_leader` should continue to persist there for narrator and card phases
- for voting, `challenge_leader` should persist on the vote submission row

This keeps the existing source-of-truth pattern instead of inventing a parallel tactical declaration table.

---

## Data Model

Use the existing tables. Do not create a parallel competitive subsystem.

### Current repo mapping

This spec uses `round_players` and `round_votes` as conceptual owners of round state.

In the current repo, the implementation still works through the existing persisted submission/storage models commonly referred to as:

- `cards`
- `votes`

For the first rollout, planners should prefer extending the **existing** submission/storage tables already used by `game-action` unless a migration explicitly renames and rewires the whole flow.

Meaning:

- `round_players` in this spec means "the round-scoped player submission state owner"
- `round_votes` in this spec means "the persisted vote state owner in the current flow"

The implementation plan must not assume a blind table rename unless it is explicitly included as migration work.

## `room_players`

Keep:

- `intuition_tokens`
- `challenge_leader_used`

Add:

- `corrupted_cards_remaining integer not null default 2`

Optional but recommended for analytics:

- `bet_tokens_spent_total integer not null default 0`
- `economy_interest_earned_total integer not null default 0`

## `round_players`

Extend with:

- `risk_clue_profile text null`
- `is_corrupted boolean not null default false`

Constraints:

- `risk_clue_profile in ('normal', 'sniper', 'narrow', 'ambush')`

Only narrator rows meaningfully use `risk_clue_profile`.

If the current implementation already stores narrator/card-scoped tactical flags on the card submission table instead of a dedicated `round_players` row, the first rollout should extend that existing storage rather than creating a parallel owner just for this spec.

## `round_votes`

Persist vote-economy fields:

- `bet_tokens integer not null default 0`

Constraints:

- `bet_tokens between 0 and 2`

The existing vote-scoped modifier persistence should also carry `challenge_leader` for vote-phase declarations if that is where the current flow already stores round vote modifiers.

## `round_resolution_summaries`

Expand the summary payload to include:

- clue-risk profile and outcome
- correct-guesser count
- market payout tier
- bet pot size
- bet winners and payout shares
- corrupted-card triggers
- challenge-leader attempts
- point delta per player
- token delta per player
- round income breakdown:
  - base
  - position
  - interest

---

## Backend Architecture

Refactor the backend into clearer units:

- `tacticalPayloads.ts`
  - parse and validate combined payloads

- `competitiveEconomy.ts`
  - base income, position bonus, interest, caps

- `competitiveScoring.ts`
  - market scoring, clue-risk scoring, corrupted-card scoring, bet-pot distribution

- `competitiveResolution.ts`
  - full round orchestration

- `roundSummary.ts`
  - readable explanation payload

### Required backend validation

The backend must enforce:

- competitive mode only for `3..8` active players
- enough tokens for all selected tactics
- corrupted-card usage remaining
- challenge-leader usage remaining
- valid clue-risk profile only for narrator
- valid bet size only during voting
- deterministic band and interest calculation

---

## UI/UX

## Visibility rule

For each phase:

- show all tactics relevant to that phase
- show usable tactics as active
- show unavailable tactics as visible but blocked
- show exact reasons when blocked
- if a tactic belongs to another role inside the same phase, show it disabled instead of hiding it

Examples:

- `Necesitas 1 token`
- `Ya usaste Carta Corrupta 2 veces`
- `Requiere seleccionar una carta`
- `Solo disponible si hay lider unico`
- `Solo el narrador puede elegir el riesgo de la pista`

Tactics from other phases are not shown.

## Persistent economy display

Every phase must show:

- current tokens
- base income preview for next round
- current interest bracket

The player should always understand:

- how much they have
- what they gain if they save
- what they lose if they spend now

## Narrator phase

After selecting clue + card:

- show `Riesgo de Pista`
- options:
  - `Normal`
  - `Sniper`
  - `Narrow`
  - `Ambush`

Even when the current user is **not** the narrator during `narrator_turn`:

- still show the `Riesgo de Pista` block
- keep every option disabled
- show a clear explanation that only the narrator can choose the clue risk

`Ambush` should read in the UI as the direct fantasy:

- `Haz que nadie adivine tu carta`

If available, show `Challenge the Leader` in the same tactical block as a separate modifier chip.

Each option shows:

- icon
- name
- token cost
- short reward/risk line

## Player card phase

After selecting a card:

- show `Carta Corrupta`
- show `Challenge the Leader` if available

Above the CTA, show:

- selected tactics
- total token cost
- compact consequence summary

## Voting phase

After selecting a vote target:

- show `Voto Apostado`
  - `Apostar 1`
  - `Apostar 2`
- show `Challenge the Leader` if available

Above the CTA, show:

- selected tactics
- total token cost
- current bet pot for this player count
- possible upside

---

## Round Summary

The resolution screen must explain:

- clue-risk profile and whether it hit
- number of correct guessers
- market payout tier
- who placed bets and who won the bet pot
- who armed a corrupted card and who got trapped
- who challenged the leader and whether it succeeded
- token changes from:
  - base income
  - position bonus
  - interest
  - tactical costs
- point changes from each rule

The player must be able to answer:

- why did I gain or lose points?
- why did I gain or lose tokens?
- what economy decision was good or bad?

---

## Mathematical Safety Rails

This system should feel competitive, not unfair.

### Required limits

- no single tactic should create more than `2` direct bonus points for the acting player unless it is part of a controlled shared pot
- no single tactic should remove more than `1` point from another player
- economy growth must stay bounded by `cap = 10`
- tactics should mostly convert tokens into points, not into more tokens

### Why the numbers are safe

- leaders get more income, but only softly
- middle band stays large, so economy is not only for the top
- interest matters, but requires real saving
- `Clue de Riesgo` is bounded
- `Voto Apostado` uses a fixed pot instead of multipliers
- `Carta Corrupta` replaces normal vote reward instead of stacking with it
- `Challenge the Leader` needs a real margin to trigger

---

## Compatibility With Existing Competitive Layer

This spec intentionally supersedes the current phase-1 tactical interpretation.

Meaning:

- `subtle_bet` must be migrated into `Clue de Riesgo`
- `trap_card` must be migrated into `Carta Corrupta`
- `firm_read` must be removed from the tactical UI and backend resolution path
- `Peek Fragment` must not be introduced
- current intuition gain rules must be rewritten around round income, position bonus, and interest

This is not an additive patch. It is a controlled replacement of the current competitive layer while keeping the same match shell.

---

## Rollout

Ship this in staged internal steps on `master`.

### Stage 1

- schema changes
- type changes
- payload changes
- backend validation

### Stage 2

- economy engine
- scoring engine
- round summary upgrades
- balance tests

### Stage 3

- narrator, player-card, and voting UI
- blocked/active tactic visibility
- economy HUD and summaries

### Stage 4

- telemetry
- tuning pass

---

## Verification Requirements

### Backend

- income base is always `+2`
- position band calculation is correct for `3..8` players
- interest bracket calculation is correct
- token totals never go below `0` or above `10`
- `Clue de Riesgo` resolves correctly in exact, near, and hard-miss cases
- bet pot size is correct for `3-4`, `5-6`, and `7-8`
- bet-pot payout is deterministic and sums exactly to the pot
- corrupted-card scoring replaces normal vote reward
- challenge success checks the `+2 round point margin` before adding challenge reward

### Frontend

- each phase shows all relevant tactics for that phase
- blocked tactics explain why they are blocked
- total token cost updates live
- economy HUD shows current bank and interest bracket clearly
- impossible combinations cannot be confirmed

### Match-level

- `3`, `4`, `5`, `6`, `7`, and `8` player matches all resolve correctly
- narrator fail states stay legible
- economy never feels disconnected from visible match standing

---

## Success Criteria

This design is successful if:

- players feel they are managing a real economy
- saving vs spending is a real strategic question
- tactics feel powerful but bounded
- the system is easier to understand than the previous tactical pile-up
- the game feels more competitive without feeling unfair

---

## Summary

The recommended direction is a unified competitive engine built around:

- one currency
- TFT-style soft income
- soft position bonus
- three positive interest tiers plus a zero-interest floor
- four clear tactics
- full round explanation

It preserves the current match structure while making the game strategically deeper, more economic, and more competitive.
