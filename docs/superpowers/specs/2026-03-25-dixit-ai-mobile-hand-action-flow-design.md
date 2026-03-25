# Hand Action Flow And Round Economy - Design Spec

**Date:** 2026-03-25
**Project:** dixit-ai-mobile
**Scope:** Redesign the in-round hand interaction so card selection is clearer, the fan hand has more presence, the primary action lives in a fixed CTA dock, timers are removed entirely, and every player gets one free card generation per round.

---

## 1. Problem Statement

The current in-round interaction has six UX and gameplay clarity failures:

1. The fan hand feels too tight and too visually weak, so the selected card does not read as the clear focus.
2. Empty active slots and filled selected cards do not share the same visual authority, which makes the hand feel inconsistent.
3. The main action is split across selection state, prompt area, and submit buttons, so players do not always understand what clicking next will do.
4. The round timer adds pressure and UI noise, and the game still contains timer-driven auto-advance behavior the user explicitly wants removed.
5. The current generation-token UX does not clearly communicate when generating is free versus paid.
6. The rule "first generation of the round is free" does not exist yet as a real, player-wide per-round mechanic.

---

## 2. Confirmed Design Decisions

All decisions below were explicitly confirmed during brainstorming.

### 2.1 Hand Interaction Thesis

The hand is the dominant control surface of the round. It should feel like a real playable spread, not a small utility strip.

The approved direction is:

- open the fan wider
- increase card presence
- let the active/selected card always come above the others
- keep that dominance whether the card is empty or filled

### 2.2 Primary Action Thesis

The user wants a fixed action button, not an inline or floating card action.

The approved behavior is:

- one fixed CTA dock below the hand
- the button label changes based on the front-most card state
- empty focused card -> generation action
- filled selected card -> play/commit action

This CTA must make the next valid action unmistakable.

### 2.3 Timer Removal

The user explicitly requested full timer removal, not only a hidden timer.

This means:

- remove the visible round/phase countdown from the HUD
- remove results countdown UI
- remove timer-driven auto-advance behavior
- phase progression happens only through explicit valid user or host actions

### 2.4 Free Generation Rule

Each player receives exactly one free image generation per round.

This rule applies to:

- narrator
- all non-narrator players
- every new round independently

The free generation applies only to card generation. It does not discount gallery wildcard usage or any other token system.

### 2.5 Visual Companion Summary

The user approved use of the visual companion for this brainstorming track. No browser mockup was needed to validate the design because the approved decisions were about interaction behavior, CTA structure, and gameplay flow rather than choosing between competing layouts.

---

## 3. Existing System Assessment

The current round flow is already split cleanly enough to support a focused redesign:

- `src/components/game/FanHand.tsx` controls the visual spread and selection affordance of the round hand
- `src/components/game/PromptArea.tsx` owns the generation prompt UI
- `src/components/game-phases/NarratorPhase.tsx` and `src/components/game-phases/PlayersPhase.tsx` orchestrate card generation and submission
- `src/components/game/GameStatusHUD.tsx`, `src/components/game/CountdownButton.tsx`, and `src/hooks/useCountdownPhase.ts` contain the time-driven UI and auto-advance behavior
- `src/hooks/useCardSelection.ts` owns slot state and image-generation flow

This is the right foundation. The issue is not lack of structure. The issue is that the interaction model is currently split across too many small decisions:

- card focus is weaker than it should be
- generation is shown in one area while submission is shown in another
- timers compete with the actual player intent

The redesign should keep the current phase/component architecture but centralize player intent around the hand and one action dock.

---

## 4. Target Player Experience

### 4.1 Fan Hand

The hand should read as a theatrical spread with clear center-of-attention behavior.

Target behavior:

- the spread opens wider than today
- cards overlap less
- the arc is more pronounced
- the focused card lifts higher and scales up more clearly
- the focused card always wins stacking order

Focused means:

- an empty slot the user has just chosen to work on
- or a filled card the user has selected to commit

This prevents empty slots from feeling like "background placeholders" once the player taps them.

### 4.2 Fixed Action Dock

The hand and the dock work as a single interaction system.

The dock has three jobs:

1. explain the current state
2. show the cost rule clearly
3. expose the single primary action

Approved CTA behavior by state:

- focused empty slot with free generation available -> `Generar carta gratis`
- focused empty slot after free generation has been spent this round -> `Generar carta (-1)`
- selected filled card in `players_turn` -> `Jugar esta carta`
- selected filled card in narrator step 1 -> `Siguiente: escribir pista`

Secondary dock copy should reinforce the rule, not compete with it. Examples:

- `Tu primera generacion de esta ronda es gratis`
- `Esta generacion consumira 1 ficha`
- `Carta lista para jugar`
- `Carta elegida. Falta escribir la pista`

### 4.3 Narrator Flow

The narrator keeps the existing two-step structure, but the step 1 interaction becomes hand-first and dock-driven.

Step 1:

- choose an empty slot or generated card from the wider fan
- use the fixed dock to generate or proceed with the chosen card

Step 2:

- preview the chosen narrator card
- write the clue
- submit via the existing clue action area

The important point is that narrator card choice becomes as clear and physical as player card choice.

### 4.4 Players Flow

For non-narrator players, the hand and dock become the entire decision surface:

- focus an empty slot to generate
- select a filled card to play
- press the fixed CTA to submit that choice

The current ambiguity between "slot focus", "generated card", and "final action button" must disappear.

---

## 5. Timerless Game Flow

### 5.1 HUD Simplification

`GameStatusHUD` must stop showing countdown state.

The HUD should keep only durable context:

- round number
- max rounds
- current phase label
- optional step label where useful

The timer pill is removed entirely.

### 5.2 Results Phase Progression

The current results countdown and auto-advance flow are removed.

New results progression:

- no countdown
- no progress bar tied to time
- no auto-advance hook
- no server-offset countdown synchronization in the UI

Results screen action area becomes:

- host: explicit button `Siguiente ronda` or `Fin del juego`
- guests: read-only waiting state such as `Esperando al anfitrion`

This keeps results readable and removes any pressure to rush through scoring.

### 5.3 General Rule

No phase in the game should advance because time expired.

Advancement should happen only because:

- a player submitted a valid move
- the narrator submitted a valid clue
- the host explicitly continued from results
- another existing gameplay action explicitly completed the phase

---

## 6. Free Generation Economy

### 6.1 Rule Definition

Every player has one free card generation per round.

Semantics:

- the first AI-generated round card for that player in that round costs 0 generation tokens
- the second and third generated round cards in that same round cost 1 token each
- gallery wildcard use still costs its normal amount and does not consume or grant the free generation

### 6.2 Source Of Truth

This must be enforced as a gameplay rule, not just presented in UI copy.

Preferred authoritative rule:

- free generation remains available while the player has generated zero normal round cards in the current round
- once the player generates their first normal round card, the free generation is considered spent for that round

This can be derived from round-scoped generated cards already created for that player, which is preferable to inventing a separate client-only flag.

### 6.3 UI Requirements

The player must understand the free generation rule without guessing.

Required signals:

- the dock explicitly says when the first generation is free
- the primary button label reflects free vs paid state
- the generation cost badge style changes accordingly
- "no generation tokens" messaging must not appear when the user still has a free generation available

---

## 7. Component And Flow Changes

### 7.1 `FanHand.tsx`

This component becomes more expressive.

Required changes:

- wider card spread
- larger effective hand footprint
- stronger lift/scale for focused card
- selected or active card always renders on top
- empty focused slot gets the same visual priority treatment as a filled selected card

### 7.2 `PromptArea.tsx`

`PromptArea` should stop behaving like an isolated tool card and instead behave like the content body for the docked generation state.

Required changes:

- align copy and cost messaging with the fixed CTA dock
- expose whether the next generation is free or paid
- keep wildcard cost separate and explicit
- ensure disabled states depend on actual free/paid availability rather than only current token count

### 7.3 `NarratorPhase.tsx`

Required changes:

- keep the 2-step narrator flow
- in step 1, hand + dock drive the interaction
- the primary button for a filled selected card becomes a narrator-specific next-step CTA, not a "play now" CTA
- visual focus remains on the chosen card before clue writing

### 7.4 `PlayersPhase.tsx`

Required changes:

- fixed CTA dock becomes the primary action area
- selected filled card maps directly to `Jugar esta carta`
- empty focused slot maps directly to generation CTA
- no timer language or urgency cues

### 7.5 `GameStatusHUD.tsx`

Required changes:

- remove countdown state and timer visuals
- retain only phase and round context

### 7.6 `CountdownButton.tsx` And `useCountdownPhase.ts`

These timer-specific results-flow pieces should be removed from the round UX.

The replacement behavior is simpler:

- manual host-controlled continue button on results
- read-only guest waiting copy

### 7.7 `useCardSelection.ts`

This hook remains the shared owner of hand state, but it must gain round-economy awareness.

Required responsibilities:

- know whether the current player still has a free generation available this round
- expose that state to phase components and prompt UI
- keep empty-slot focus and filled-card selection coherent
- ensure visual focus and primary CTA always refer to the same slot/card

---

## 8. Data And Backend Expectations

### 8.1 No Timer Authority Required For UX

Once timers are removed from gameplay UX, client countdown synchronization for results is no longer needed.

`results_started_at` may remain in the schema if it is useful elsewhere, but it is not part of the redesigned player experience.

### 8.2 Free Generation Must Be Authoritative

The free-generation rule must not exist only in React state.

Implementation planning should ensure that:

- a player cannot bypass the rule by reconnecting or refreshing
- token charging for second/third generation is consistent with the rule
- the UI can fetch or derive the correct free-generation status after reload

### 8.3 No New Economy Scope

This redesign does not alter:

- wildcard costs
- intuition token systems
- tactical action costs
- end-of-round score economy

Only the per-round image-generation rule changes.

---

## 9. Non-Goals

The redesign explicitly does not include:

- a full rewrite of `GameBoard`
- changes to tactical-action design outside the places where the new dock must coexist with them
- changes to gallery capacity or gallery wildcard rules
- new animation systems unrelated to hand focus and clarity

---

## 10. Testing Requirements

Implementation planning must include tests for both interaction and rule behavior.

Minimum required coverage:

- fan hand focus ordering for empty and filled slots
- dock CTA label changes for free generation, paid generation, and play/next-step states
- HUD no longer rendering timer state
- results phase no longer depending on countdown hook behavior
- first generation free per player per round
- second and third generations consuming tokens correctly
- free generation resetting on new round
- wildcard usage not consuming the free-generation allowance

---

## 11. Acceptance Criteria

The redesign is complete only when all of the following are true:

- the fan hand is visibly more open and the focused card clearly dominates the spread
- an empty chosen slot can visually come to the front just like a filled selected card
- the player can understand the next valid action by looking only at the focused card and the fixed CTA dock
- the timer is absent from gameplay UI
- no gameplay phase auto-advances due to time expiration
- results progression is manual and host-controlled
- every player gets one free generation per round
- the free generation is clearly communicated in the UI
- the free-generation rule still works correctly after refresh or reconnect

---

## 12. Recommended Implementation Direction

This work should be implemented as a focused refinement of the current phase architecture, not as a full game-screen rewrite.

Recommended path:

1. redesign the fan and dock interaction model first
2. remove timer UI and countdown-driven results flow
3. add authoritative free-generation rule and wire it into the dock messaging
4. update tests around both interaction flow and economy semantics

This preserves current architecture while delivering the UX shift the user asked for.
