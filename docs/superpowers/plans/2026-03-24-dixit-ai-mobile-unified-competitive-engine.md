# Unified Competitive Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current phase-1 tactical layer on `master` with the unified competitive engine: soft round economy, the final four tactics, canonical round resolution, and contextual UI that always tells players what they can and cannot do.

**Architecture:** Keep the existing match shell and existing storage owners (`cards`, `votes`, `room_players`, `round_resolution_summaries`), but replace the old tactic semantics with a new backend split into payload parsing, economy math, scoring math, and round orchestration. On the client, reuse the existing tactical picker/sheet and phase screens, but refactor them to support the new tactic set, blocked-state explanations, token HUD, and round-summary feedback without inventing a parallel gameplay UI.

**Tech Stack:** Expo Router, React Native, Zustand, TypeScript, Supabase Postgres migrations, Supabase Edge Functions, Jest

**Scope note:** This first implementation ships the playable engine and explanatory UI. Spec Stage 4 telemetry/tuning is intentionally deferred until the new rules are stable in real matches.

---

## File map

- Create: `supabase/migrations/20260324193000_unified_competitive_engine.sql`
  - Extend current storage tables for unified competitive state without introducing parallel tables.
- Create: `supabase/functions/game-action/competitiveEconomy.ts`
  - Pure helpers for position bands, shared-rank tie handling, interest, per-round income, and clamping.
- Create: `supabase/functions/game-action/competitiveScoring.ts`
  - Pure helpers for narrator baseline, market payouts, clue-risk scoring, corrupted-card scoring, bet-pot distribution, and challenge evaluation inputs.
- Modify: `supabase/functions/game-action/tacticalPayloads.ts`
  - Replace old `subtle_bet / trap_card / firm_read` parsing with the new `risk_clue_profile / is_corrupted / bet_tokens / challenge_leader` contract.
- Modify: `supabase/functions/game-action/scoring.ts`
  - Reduce to a thin compatibility wrapper or re-export so existing imports keep working while the new pure engine lives in focused modules.
- Modify: `supabase/functions/game-action/competitiveResolution.ts`
  - Orchestrate the canonical round order, participant snapshot, submit-time token reservation semantics, and score/token application.
- Modify: `supabase/functions/game-action/roundSummary.ts`
  - Emit the richer round explanation payload required by the spec.
- Modify: `supabase/functions/game-action/index.ts`
  - Reset competitive match state at `start_game`, validate per-phase submissions, reserve costs immediately, and route round resolution through the new engine.
- Modify: `src/types/game.ts`
  - Add the new DB fields, tactic unions, UI view models, and typed round-summary payload.
- Modify: `src/stores/useGameStore.ts`
  - Persist latest round summary alongside round/cards state so results UI can render it.
- Modify: `src/hooks/useRound.ts`
  - Fetch and live-refresh `round_resolution_summaries` for the active round.
- Modify: `src/hooks/useGamePhaseOrchestration.ts`
  - Surface economy and tactic availability inputs cleanly to `game.tsx`.
- Modify: `app/room/[code]/game.tsx`
  - Pass unified competitive state and round summary into phase components.
- Modify: `src/lib/tacticalActions.ts`
  - Replace old phase-1 tactics with the final tactic catalog, blocked reasons, cost accumulation, and bet-upside helpers.
- Modify: `src/components/game/TacticalActionPicker.tsx`
  - Render all relevant tactics for the current phase, including blocked chips, multi-select where legal, total cost, and challenge-leader modifier.
- Modify: `src/components/game/TacticalActionSheet.tsx`
  - Show exact cost, reward, and risk copy for the new tactics.
- Modify: `src/components/game/GameStatusHUD.tsx`
  - Show current tokens, next-round base income preview, and current interest bracket.
- Modify: `src/components/game-phases/NarratorPhase.tsx`
  - Integrate `Clue de Riesgo` and `Challenge the Leader`.
- Modify: `src/components/game-phases/PlayersPhase.tsx`
  - Integrate `Carta Corrupta` and `Challenge the Leader`.
- Modify: `src/components/game-phases/VotingPhase.tsx`
  - Integrate `Voto Apostado` and `Challenge the Leader`.
- Modify: `src/components/game-phases/ResultsPhase.tsx`
  - Compose narrator reveal with the richer competitive summary.
- Modify: `src/components/game/ResultsReveal.tsx`
  - Keep the reveal card small and delegate tactical/economy explanation to a focused summary component.
- Create: `src/components/game/CompetitiveRoundSummary.tsx`
  - Render the readable breakdown of clue-risk outcome, market tier, bet pot, corruption triggers, challenge results, and point/token deltas.
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`
  - Add names, descriptions, blocked reasons, HUD labels, and summary copy for the new system.
- Create: `__tests__/competitive/competitiveEconomy.test.ts`
  - Lock the economy math.
- Modify: `__tests__/competitive/tacticalScoring.test.ts`
- Modify: `__tests__/scoring.test.ts`
  - Rewrite scoring expectations around the new engine while keeping file paths stable.
- Modify: `__tests__/game-action-tactical-payloads.test.ts`
  - Lock payload parsing, invalid combinations, token reservation, and `start_game` initialization.
- Modify: `__tests__/competitiveResolution.test.ts`
  - Lock canonical round ordering and challenge/bet snapshot behavior.
- Modify: `__tests__/competitive/roundSummary.test.ts`
  - Lock the new explanation payload.
- Modify: `__tests__/tacticalActions.test.ts`
  - Lock the client-side tactic catalog, blocked reasons, and economy HUD helpers.

## Task 1: Lock schema and public type contract

**Files:**
- Create: `supabase/migrations/20260324193000_unified_competitive_engine.sql`
- Modify: `src/types/game.ts`
- Test: `__tests__/game-action-tactical-payloads.test.ts`
- Test: `__tests__/competitive/roundSummary.test.ts`

- [ ] **Step 1: Extend failing tests to expect the new persisted fields**

Cover:
- `cards` support `risk_clue_profile` and `is_corrupted`
- `votes` support `bet_tokens`
- `room_players` support `corrupted_cards_remaining`
- round summary payload expects clue-risk, bet-pot, corruption, challenge, and income breakdown sections

Run:
```powershell
npx jest --runInBand __tests__/game-action-tactical-payloads.test.ts __tests__/competitive/roundSummary.test.ts
```
Expected: FAIL because the old type surface and fixtures still describe the phase-1 tactical model

- [ ] **Step 2: Write the migration against existing tables**

Add a migration that:
- adds `risk_clue_profile text null` to `cards`
- adds `is_corrupted boolean not null default false` to `cards`
- reuses existing `cards.challenge_leader` and `votes.challenge_leader` columns instead of inventing new challenge tables
- adds `bet_tokens integer not null default 0 check (bet_tokens between 0 and 2)` to `votes`
- adds `corrupted_cards_remaining integer not null default 2` to `room_players`
- keeps `challenge_leader_used` and `intuition_tokens`
- does not create parallel `round_players` or `round_votes` tables

Keep optional analytics columns out of this first implementation. YAGNI.

- [ ] **Step 3: Update `src/types/game.ts` to match the migration and summary payload**

Add:
- DB row/update/insert fields for the new columns
- new tactic unions and payload helper types
- typed round-summary payload interfaces used by the results UI
- any compatibility aliases needed so existing imports do not explode mid-refactor

- [ ] **Step 4: Re-run the focused tests**

Run:
```powershell
npx jest --runInBand __tests__/game-action-tactical-payloads.test.ts __tests__/competitive/roundSummary.test.ts
```
Expected: still FAIL, but now for missing backend behavior rather than missing fields

- [ ] **Step 5: Commit the schema/type skeleton**

```powershell
git add supabase/migrations/20260324193000_unified_competitive_engine.sql src/types/game.ts __tests__/game-action-tactical-payloads.test.ts __tests__/competitive/roundSummary.test.ts
git commit -m "feat: add unified competitive engine schema contract"
```

## Task 2: Replace payload parsing and submit-time cost reservation

**Files:**
- Modify: `supabase/functions/game-action/tacticalPayloads.ts`
- Modify: `supabase/functions/game-action/index.ts`
- Test: `__tests__/game-action-tactical-payloads.test.ts`

- [ ] **Step 1: Rewrite the failing payload tests around the final tactic set**

Cover:
- `submit_clue` accepts `risk_clue_profile` and optional `challenge_leader`
- `submit_card` accepts `is_corrupted` and optional `challenge_leader`
- `submit_vote` accepts `bet_tokens` and optional `challenge_leader`
- `ambush`, corruption, bets, and challenge spend their tokens immediately
- invalid combinations are rejected by phase/role/availability rules
- `start_game` rejects competitive rooms outside `3..8` active players
- `start_game` resets active players to `intuition_tokens = 2`, `challenge_leader_used = false`, `corrupted_cards_remaining = 2`

Run:
```powershell
npx jest --runInBand __tests__/game-action-tactical-payloads.test.ts
```
Expected: FAIL

- [ ] **Step 2: Replace the old parser with the unified payload contract**

In `tacticalPayloads.ts`:
- remove old `subtle_bet / trap_card / firm_read` parsing
- parse the new narrator/card/vote payloads
- centralize cost calculation per payload
- enforce one authoritative shape per action

- [ ] **Step 3: Update `game-action/index.ts` for immediate cost reservation**

Implement:
- `start_game` hard-gate for `3..8` active players
- `start_game` state reset for active players
- token affordability checks at submit time
- immediate token deduction/reservation on submit
- `challenge_leader_used` marking when the player commits to challenge
- `corrupted_cards_remaining` decrement on corruption submit
- no double-spending across phases in the same round

- [ ] **Step 4: Re-run payload tests**

Run:
```powershell
npx jest --runInBand __tests__/game-action-tactical-payloads.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit the payload/reservation layer**

```powershell
git add supabase/functions/game-action/tacticalPayloads.ts supabase/functions/game-action/index.ts __tests__/game-action-tactical-payloads.test.ts
git commit -m "feat: add unified competitive action payloads"
```

## Task 3: Build the economy math module

**Files:**
- Create: `supabase/functions/game-action/competitiveEconomy.ts`
- Test: `__tests__/competitive/competitiveEconomy.test.ts`

- [ ] **Step 1: Write failing tests for economy math**

Cover:
- top/middle/bottom band assignment for `3, 4, 5, 6, 7, 8` active players
- shared-rank tie handling for tied cumulative scores
- interest tranches `0..3`, `4..5`, `6..7`, `8..10`
- base income `+2`
- position bonus `+2 / +1 / +0`
- final clamp to `0..10`

Run:
```powershell
npx jest --runInBand __tests__/competitive/competitiveEconomy.test.ts
```
Expected: FAIL because the helper does not exist

- [ ] **Step 2: Implement the pure economy helper**

Add functions for:
- sorting and shared-rank tie grouping
- percentile-to-band mapping
- interest calculation
- round-income breakdown
- bank clamping

Keep this file pure and detached from Supabase client code.

- [ ] **Step 3: Run the economy tests**

Run:
```powershell
npx jest --runInBand __tests__/competitive/competitiveEconomy.test.ts
```
Expected: PASS

- [ ] **Step 4: Commit the economy math**

```powershell
git add supabase/functions/game-action/competitiveEconomy.ts __tests__/competitive/competitiveEconomy.test.ts
git commit -m "feat: add unified competitive economy math"
```

## Task 4: Build the scoring math module

**Files:**
- Create: `supabase/functions/game-action/competitiveScoring.ts`
- Modify: `supabase/functions/game-action/scoring.ts`
- Modify: `__tests__/competitive/tacticalScoring.test.ts`
- Modify: `__tests__/scoring.test.ts`

- [ ] **Step 1: Rewrite the scoring tests around the new rules**

Cover:
- narrator success/fail baseline
- narrator fail consolation overrides
- market payout tiers for `1`, `2`, `3+` correct guessers
- clue-risk exact/near/hard miss scoring
- corrupted-card scoring replacing normal decoy reward
- bet-pot size by player count
- largest-remainder bet-pot distribution with deterministic tiebreak

Run:
```powershell
npx jest --runInBand __tests__/scoring.test.ts __tests__/competitive/tacticalScoring.test.ts
```
Expected: FAIL

- [ ] **Step 2: Implement pure scoring helpers**

In `competitiveScoring.ts`, add focused functions for:
- narrator baseline and consolation paths
- normal decoy rewards
- clue-risk scoring
- corrupted-card scoring
- bet-pot sizing and weighted payout
- challenge-leader success input calculation

- [ ] **Step 3: Keep `scoring.ts` as a thin compatibility entrypoint**

Move the old logic out of `scoring.ts` and turn it into:
- type exports used elsewhere
- a small wrapper around the new pure scoring helpers

This keeps existing imports stable while the engine is replaced under the hood.

- [ ] **Step 4: Re-run the scoring tests**

Run:
```powershell
npx jest --runInBand __tests__/scoring.test.ts __tests__/competitive/tacticalScoring.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit the scoring layer**

```powershell
git add supabase/functions/game-action/competitiveScoring.ts supabase/functions/game-action/scoring.ts __tests__/scoring.test.ts __tests__/competitive/tacticalScoring.test.ts
git commit -m "feat: replace tactical scoring with unified scoring engine"
```

## Task 5: Rewrite round resolution and round summary

**Files:**
- Modify: `supabase/functions/game-action/competitiveResolution.ts`
- Modify: `supabase/functions/game-action/roundSummary.ts`
- Modify: `__tests__/competitiveResolution.test.ts`
- Modify: `__tests__/competitive/roundSummary.test.ts`

- [ ] **Step 1: Write failing orchestration tests for the canonical order**

Cover:
- participant snapshot is locked before resolution
- base scoring happens before clue risk, corruption, bet pot, challenge, then economy
- challenge leader uses the leader snapshot captured at declaration time
- bet-pot tiebreak uses cumulative score after non-bet round scoring
- token costs paid on submit are not re-deducted during resolution
- if live active players drop below `3`, the in-flight round still resolves using the locked snapshot and the room ends with `too_few_players_in_game`
- one integration scenario for `5-6` players and one for `7-8` players exercise banding and bet-pot tiers together

Run:
```powershell
npx jest --runInBand __tests__/competitiveResolution.test.ts __tests__/competitive/roundSummary.test.ts
```
Expected: FAIL

- [ ] **Step 2: Implement the new orchestrator**

In `competitiveResolution.ts`:
- remove the old `firm_read / subtle_bet / trap_card` logic
- use the new pure scoring/economy modules
- compute `pre-bet-payout total match score`
- resolve challenge success before adding challenge bonus
- clamp tokens only after full round economy application

- [ ] **Step 3: Upgrade `roundSummary.ts` to explain the new system**

Emit:
- clue-risk profile and outcome
- correct guesser count and market tier
- bet pot size, weighted winners, and payout shares
- corruption triggers and fooled voters
- challenge attempts, targets, and results
- per-player point delta and token delta
- tactical-cost attribution captured at submit time, separated from end-of-round income
- income breakdown: base, position, interest

- [ ] **Step 4: Re-run orchestration and summary tests**

Run:
```powershell
npx jest --runInBand __tests__/competitiveResolution.test.ts __tests__/competitive/roundSummary.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit the round engine**

```powershell
git add supabase/functions/game-action/competitiveResolution.ts supabase/functions/game-action/roundSummary.ts __tests__/competitiveResolution.test.ts __tests__/competitive/roundSummary.test.ts
git commit -m "feat: add unified round resolution and summary"
```

## Task 6: Refactor the client tactic model and copy

**Files:**
- Modify: `src/lib/tacticalActions.ts`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`
- Modify: `__tests__/tacticalActions.test.ts`

- [ ] **Step 1: Rewrite the client tactic tests**

Cover:
- narrator phase shows `normal`, `sniper`, `narrow`, `ambush`, and `challenge_leader`
- non-narrators in `narrator_turn` still see the narrator block disabled with the reason `Solo el narrador puede elegir el riesgo de la pista`
- player-card phase shows `carta corrupta` and `challenge_leader`
- voting phase shows `bet_1`, `bet_2`, and `challenge_leader`
- blocked reasons are explicit and phase-correct
- total token cost accumulates correctly
- bet-pot and upside copy adapt to active-player count
- interest bracket labels can be derived from the current bank

Run:
```powershell
npx jest --runInBand __tests__/tacticalActions.test.ts
```
Expected: FAIL

- [ ] **Step 2: Replace `src/lib/tacticalActions.ts` with the final catalog**

Implement:
- final tactic IDs and phase mapping
- blocked-reason helpers
- narrator-role blocked helper for users who are in `narrator_turn` but are not the narrator
- total-cost calculator
- interest-bracket display helpers
- bet-pot and possible-upside helpers for the voting phase

- [ ] **Step 3: Add the new copy to both locale files**

Include:
- tactic names and details
- blocked-state explanations
- HUD labels
- round-summary labels
- economy copy for position/interest/base income

- [ ] **Step 4: Re-run client tactic tests**

Run:
```powershell
npx jest --runInBand __tests__/tacticalActions.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit the client tactic model**

```powershell
git add src/lib/tacticalActions.ts src/i18n/locales/es.json src/i18n/locales/en.json __tests__/tacticalActions.test.ts
git commit -m "feat: add unified tactical action catalog"
```

## Task 7: Upgrade shared tactical UI and economy HUD

**Files:**
- Modify: `src/components/game/TacticalActionPicker.tsx`
- Modify: `src/components/game/TacticalActionSheet.tsx`
- Modify: `src/components/game/GameStatusHUD.tsx`

- [ ] **Step 1: Refactor `TacticalActionPicker` for the new selection model**

Implement:
- all relevant tactics visible for the current phase
- active vs blocked chips
- exact blocked reason copy
- role-blocked narrator chips visible for non-narrators during `narrator_turn`
- cumulative token cost
- challenge-leader modifier
- compact summary above the CTA
- voting-specific bet-pot and upside preview

- [ ] **Step 2: Refactor `TacticalActionSheet` to match the new tactics**

Show:
- icon
- name
- token cost
- reward
- risk
- exact confirm label for the current tactic or modifier

- [ ] **Step 3: Extend `GameStatusHUD` with economy context**

Show:
- current tokens
- next-round base income preview
- current interest bracket

Keep the existing round/phase/time information intact.

- [ ] **Step 4: Verify the shared UI still builds**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

- [ ] **Step 5: Commit the shared UI**

```powershell
git add src/components/game/TacticalActionPicker.tsx src/components/game/TacticalActionSheet.tsx src/components/game/GameStatusHUD.tsx
git commit -m "feat: upgrade tactical picker and economy hud"
```

## Task 8: Surface round summary and competitive state through the game data layer

**Files:**
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/hooks/useRound.ts`
- Modify: `src/hooks/useGamePhaseOrchestration.ts`
- Modify: `app/room/[code]/game.tsx`

- [ ] **Step 1: Add store state for the latest round summary**

Persist:
- latest summary payload for the active round
- reset behavior when the round changes

- [ ] **Step 2: Extend `useRound` to fetch and subscribe to `round_resolution_summaries`**

Implement:
- initial fetch for current round summary
- realtime refresh when the summary row is inserted/updated
- reset on new round start so stale summaries disappear

- [ ] **Step 3: Thread the new state through orchestration and `game.tsx`**

Pass clean props down so phases do not query Supabase directly.

- [ ] **Step 4: Verify the screen still builds**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

- [ ] **Step 5: Commit the data-layer plumbing**

```powershell
git add src/stores/useGameStore.ts src/hooks/useRound.ts src/hooks/useGamePhaseOrchestration.ts app/room/[code]/game.tsx
git commit -m "feat: surface competitive summary data in game flow"
```

## Task 9: Integrate narrator and player-card phase UX

**Files:**
- Modify: `src/components/game-phases/NarratorPhase.tsx`
- Modify: `src/components/game-phases/PlayersPhase.tsx`

- [ ] **Step 1: Integrate `Clue de Riesgo` into narrator submit flow**

Rules:
- for the narrator: show all narrator tactics once clue + card context is valid
- allow `normal`, `sniper`, `narrow`, `ambush`
- show `Challenge the Leader` as a separate modifier when available
- submit the final payload shape expected by the backend
- for non-narrators in `narrator_turn`: still render the `Riesgo de Pista` block in disabled state with a role explanation
- present `ambush` with direct user-facing copy meaning `haz que nadie adivine tu carta`

- [ ] **Step 2: Integrate `Carta Corrupta` into player-card submit flow**

Rules:
- show corruption and challenge only after a valid card selection
- explain blocked states when the player has no tokens or no remaining corruptions
- keep the existing hand/gallery flow intact

- [ ] **Step 3: Verify narrator/player-card flows build**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

- [ ] **Step 4: Commit the narrator/player-card UX**

```powershell
git add src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx
git commit -m "feat: add unified narrator and card tactics ui"
```

## Task 10: Integrate voting UX

**Files:**
- Modify: `src/components/game-phases/VotingPhase.tsx`

- [ ] **Step 1: Integrate `Voto Apostado` and `Challenge the Leader`**

Rules:
- show all vote-phase tactics after a valid vote target is selected
- support `bet_1` and `bet_2`
- show blocked reasons if tokens are insufficient
- show current bet pot and possible upside in the phase summary
- keep narrator voting restrictions intact

- [ ] **Step 2: Verify voting flow builds**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

- [ ] **Step 3: Commit the voting UX**

```powershell
git add src/components/game-phases/VotingPhase.tsx
git commit -m "feat: add unified voting tactics ui"
```

## Task 11: Upgrade results UI to explain the round

**Files:**
- Create: `src/components/game/CompetitiveRoundSummary.tsx`
- Modify: `src/components/game/ResultsReveal.tsx`
- Modify: `src/components/game-phases/ResultsPhase.tsx`

- [ ] **Step 1: Build a focused competitive round summary component**

Render:
- clue-risk result
- number of correct guessers and market tier
- bet winners and shares
- corruption triggers
- challenge-leader outcome
- per-player point/token changes
- tactical-cost line items so players can tell what they spent on submit vs what they earned after resolution
- income breakdown

- [ ] **Step 2: Compose the summary into the results screen**

Keep the narrator card reveal readable; do not cram all explanation inside `ResultsReveal`.

- [ ] **Step 3: Verify the results screen builds**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

- [ ] **Step 4: Commit the results UI**

```powershell
git add src/components/game/CompetitiveRoundSummary.tsx src/components/game/ResultsReveal.tsx src/components/game-phases/ResultsPhase.tsx
git commit -m "feat: explain unified competitive rounds in results ui"
```

## Task 12: Full verification and deploy handoff

**Files:**
- No new code by default

- [ ] **Step 1: Run the focused unified-engine test suite**

Run:
```powershell
npx jest --runInBand __tests__/game-action-tactical-payloads.test.ts __tests__/competitive/competitiveEconomy.test.ts __tests__/scoring.test.ts __tests__/competitive/tacticalScoring.test.ts __tests__/competitiveResolution.test.ts __tests__/competitive/roundSummary.test.ts __tests__/tacticalActions.test.ts
```
Expected: PASS

- [ ] **Step 2: Run the broader regression suite already used in this repo**

Run:
```powershell
npx jest --runInBand __tests__/lobbyState.test.ts __tests__/chatPlayerAccent.test.ts __tests__/roomEndReason.test.ts __tests__/ai/lobbyState.test.ts
```
Expected: PASS

- [ ] **Step 3: Run the app build verification**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

- [ ] **Step 4: Manual gameplay verification**

Verify with `3` players:
- lobby ready-gating still works
- host starts successfully
- narrator can arm clue risk
- non-narrators can see the narrator risk block disabled with the correct message
- players can arm corrupted card
- voters can place bet 1 / bet 2
- blocked reasons are clear when tokens are insufficient
- results screen explains points and tokens

- [ ] **Step 5: Deploy the backend changes once verification passes**

Run:
```powershell
npx supabase db push
npx supabase functions deploy game-action
```
Expected:
- migration applies successfully
- `game-action` deploy finishes without import/runtime errors

- [ ] **Step 6: Commit the completed rollout**

```powershell
git add supabase/migrations/20260324193000_unified_competitive_engine.sql supabase/functions/game-action/competitiveEconomy.ts supabase/functions/game-action/competitiveScoring.ts supabase/functions/game-action/tacticalPayloads.ts supabase/functions/game-action/scoring.ts supabase/functions/game-action/competitiveResolution.ts supabase/functions/game-action/roundSummary.ts supabase/functions/game-action/index.ts src/types/game.ts src/stores/useGameStore.ts src/hooks/useRound.ts src/hooks/useGamePhaseOrchestration.ts app/room/[code]/game.tsx src/lib/tacticalActions.ts src/components/game/TacticalActionPicker.tsx src/components/game/TacticalActionSheet.tsx src/components/game/GameStatusHUD.tsx src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx src/components/game-phases/VotingPhase.tsx src/components/game/CompetitiveRoundSummary.tsx src/components/game/ResultsReveal.tsx src/components/game-phases/ResultsPhase.tsx src/i18n/locales/es.json src/i18n/locales/en.json __tests__/game-action-tactical-payloads.test.ts __tests__/competitive/competitiveEconomy.test.ts __tests__/scoring.test.ts __tests__/competitive/tacticalScoring.test.ts __tests__/competitiveResolution.test.ts __tests__/competitive/roundSummary.test.ts __tests__/tacticalActions.test.ts
git commit -m "feat: ship unified competitive engine"
```
