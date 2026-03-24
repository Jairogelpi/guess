# Competitive Tactical UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fully playable tactical-action UI for match decisions so players can understand, select, and submit competitive actions contextually during narrator, players, and voting phases.

**Architecture:** Keep tactics phase-scoped and context-only: render no global arsenal, only a small tactical picker inside the active phase once a card/vote target is selected. Extend the existing `game-action` edge function to accept tactical payloads, and centralize client-side tactic metadata/availability rules in a shared UI module used by `NarratorPhase`, `PlayersPhase`, and `VotingPhase`.

**Tech Stack:** Expo Router, React Native, Supabase Edge Functions, TypeScript, Jest

---

## File map

- Modify: `supabase/functions/game-action/index.ts`
- Modify: `supabase/functions/game-action/scoring.ts`
- Modify: `supabase/functions/game-action/roundSummary.ts`
- Modify: `src/types/game.ts`
- Create: `src/lib/tacticalActions.ts`
- Create: `src/components/game/TacticalActionPicker.tsx`
- Create: `src/components/game/TacticalActionSheet.tsx`
- Modify: `src/components/game-phases/NarratorPhase.tsx`
- Modify: `src/components/game-phases/PlayersPhase.tsx`
- Modify: `src/components/game-phases/VotingPhase.tsx`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`
- Create: `__tests__/tacticalActions.test.ts`
- Create: `__tests__/game-action-tactical-payloads.test.ts`

## Task 1: Define tactical model on client

**Files:**
- Create: `src/lib/tacticalActions.ts`
- Modify: `src/types/game.ts`
- Test: `__tests__/tacticalActions.test.ts`

- [ ] **Step 1: Write failing tests for tactical availability/model**

Add tests covering:
- narrator only sees `subtle_bet`
- player card submission only sees `trap_card`
- voting only sees `firm_read`
- only one tactic can be selected per decision
- hidden when no tactic available

Run:
```powershell
npx jest --runInBand __tests__/tacticalActions.test.ts
```
Expected: FAIL because helper/module does not exist

- [ ] **Step 2: Implement minimal tactical metadata helper**

Create `src/lib/tacticalActions.ts` with:
- phase-scoped tactic definitions
- labels/icons/description keys
- helper like `getAvailableTacticalActions(context)`
- helper like `allowsChallengeLeader(context)` only if actually supported in current decision model

Modify `src/types/game.ts` to add explicit client-side unions for:
- narrator card tactical action
- player card tactical action
- vote tactical action
- selected tactical payload shape

- [ ] **Step 3: Run test and make it pass**

Run:
```powershell
npx jest --runInBand __tests__/tacticalActions.test.ts
```
Expected: PASS

## Task 2: Make edge function accept tactical payloads

**Files:**
- Modify: `supabase/functions/game-action/index.ts`
- Test: `__tests__/game-action-tactical-payloads.test.ts`

- [ ] **Step 1: Write failing payload-contract tests**

Cover:
- `submit_clue` accepts narrator tactical action payload
- `submit_card` accepts player tactical action payload
- `submit_vote` accepts vote tactical action payload
- invalid combinations are rejected
- at most one tactical action per decision

Run:
```powershell
npx jest --runInBand __tests__/game-action-tactical-payloads.test.ts
```
Expected: FAIL

- [ ] **Step 2: Implement minimal backend payload parsing and persistence**

In `game-action/index.ts`:
- extend payload parsing for `submit_clue`, `submit_card`, `submit_vote`
- persist `tactical_action` on `cards`/`votes`
- reject tactics in wrong phase/role
- keep existing normal flow intact when no tactic chosen

Do not invent extra actions beyond what schema already supports.

- [ ] **Step 3: Run payload tests**

Run:
```powershell
npx jest --runInBand __tests__/game-action-tactical-payloads.test.ts
```
Expected: PASS

## Task 3: Build shared tactical picker UI

**Files:**
- Create: `src/components/game/TacticalActionPicker.tsx`
- Create: `src/components/game/TacticalActionSheet.tsx`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`
- Test: `__tests__/tacticalActions.test.ts`

- [ ] **Step 1: Add i18n copy for tactics**

Add keys for:
- names
- short descriptions
- longer detail copy
- CTA labels like `Use this tactic`, `No tactic`, `Selected tactic`

- [ ] **Step 2: Implement `TacticalActionSheet`**

Build a small detail sheet using existing modal patterns:
- title
- icon/name
- detail copy
- risk/reward copy
- confirm selection button

- [ ] **Step 3: Implement `TacticalActionPicker`**

Render only available actions:
- icon + name chips
- selected state
- tap opens detail sheet
- no unavailable tactics shown
- no more than one selected action at once
- summary row for selected action

- [ ] **Step 4: Verify tests/build**

Run:
```powershell
npx jest --runInBand __tests__/tacticalActions.test.ts
```
Expected: PASS

## Task 4: Integrate into NarratorPhase

**Files:**
- Modify: `src/components/game-phases/NarratorPhase.tsx`
- Modify: `src/lib/tacticalActions.ts`

- [ ] **Step 1: Add failing/guard test if phase tests exist; otherwise document manual verification target**

If no existing phase tests, skip adding brittle render tests and rely on targeted helper tests + manual verification.

- [ ] **Step 2: Integrate contextual picker in narrator flow**

Rules:
- picker appears only once narrator has a valid card selection context
- only narrator tactic options shown
- selected tactic included in `submit_clue` payload
- UI stays clean if no tactic selected

- [ ] **Step 3: Verify narrator flow still builds**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

## Task 5: Integrate into PlayersPhase

**Files:**
- Modify: `src/components/game-phases/PlayersPhase.tsx`

- [ ] **Step 1: Integrate contextual picker in player card submission flow**

Rules:
- picker appears only after player has a selectable card context
- only card tactics shown for non-narrator players
- selected tactic included in `submit_card` payload
- no tactic UI if current role/phase cannot use one

- [ ] **Step 2: Verify phase build**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

## Task 6: Integrate into VotingPhase

**Files:**
- Modify: `src/components/game-phases/VotingPhase.tsx`

- [ ] **Step 1: Integrate contextual picker in voting flow**

Rules:
- picker appears only after a valid vote target is selected
- only vote tactics shown
- selected tactic included in `submit_vote` payload
- narrator still cannot vote or see voting tactics

- [ ] **Step 2: Verify phase build**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

## Task 7: Hook tactical effects into summaries/scoring where already supported

**Files:**
- Modify: `supabase/functions/game-action/scoring.ts`
- Modify: `supabase/functions/game-action/roundSummary.ts`

- [ ] **Step 1: Verify persisted tactics flow through existing scoring paths**

Keep this task minimal:
- ensure stored `tactical_action` from new payloads reaches scoring helpers already present
- ensure round summary reflects those actions if summary generation is already called
- do not expand product scope to new scoring systems unless already wired

- [ ] **Step 2: Verify focused tests**

Run:
```powershell
npx jest --runInBand __tests__/game-action-tactical-payloads.test.ts __tests__/tacticalActions.test.ts
```
Expected: PASS

## Task 8: End-to-end manual verification

**Files:**
- No code by default

- [ ] **Step 1: Run targeted tests**

Run:
```powershell
npx jest --runInBand __tests__/tacticalActions.test.ts __tests__/game-action-tactical-payloads.test.ts __tests__/lobbyState.test.ts __tests__/chatPlayerAccent.test.ts __tests__/roomEndReason.test.ts __tests__/ai/lobbyState.test.ts
```
Expected: PASS

- [ ] **Step 2: Run web export**

Run:
```powershell
npx expo export --platform web
```
Expected: OK

- [ ] **Step 3: Manual lobby/game verification**

Verify with 3 players:
- guests can ready up
- host can start
- narrator can see narrator tactic contextually
- players can see player tactic contextually
- voters can see vote tactic contextually
- no tactic UI appears when not allowed
- selected tactic is reflected in request payload and no phase crashes

- [ ] **Step 4: Commit**

```powershell
git add src/components/game/TacticalActionPicker.tsx src/components/game/TacticalActionSheet.tsx src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx src/components/game-phases/VotingPhase.tsx src/lib/tacticalActions.ts src/types/game.ts src/i18n/locales/es.json src/i18n/locales/en.json supabase/functions/game-action/index.ts supabase/functions/game-action/scoring.ts supabase/functions/game-action/roundSummary.ts __tests__/tacticalActions.test.ts __tests__/game-action-tactical-payloads.test.ts
git commit -m "feat: add tactical action gameplay UI"
```
