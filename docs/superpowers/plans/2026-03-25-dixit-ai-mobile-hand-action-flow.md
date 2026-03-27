# Hand Action Flow And Round Economy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the active-round hand flow so every player gets a wider, clearer fan hand, a fixed action dock that explains the next move, no countdown-driven round UX, and one authoritative free AI generation per round that still works after refresh or reconnect.

**Architecture:** Add pure hand-flow helpers first so focus fallback, dock copy, and fan geometry are deterministic and testable before touching phase components. Then wire a new fixed `HandActionDock` through narrator and player turns, and make the free-generation rule authoritative in Postgres by tagging card origin, hydrating the current player's unplayed round cards into the client store, and keeping wildcard costs on their existing path. Finally, remove countdown UI and auto-advance from HUD/results so progression is driven only by explicit actions.

**Tech Stack:** Expo React Native, TypeScript, Zustand, Supabase Edge Functions, Postgres SQL migrations, Jest (`ts-jest`), Expo web export

---

## File map

- Create: `src/components/game/handActionState.ts`
  Pure helpers for slot hydration, focus fallback, CTA state, and free-vs-paid dock messaging.
- Create: `src/components/game/fanHandLayout.ts`
  Pure geometry helpers for card spread, lift, scale, and z-order so `FanHand.tsx` stops owning layout math inline.
- Create: `src/components/game/HandActionDock.tsx`
  Fixed dock surface that combines state copy, prompt controls, cost messaging, and the primary CTA.
- Create: `__tests__/handActionState.test.ts`
  Unit tests for focus fallback, dock labels, disabled states, and reconnect-safe slot mapping.
- Create: `__tests__/fanHandLayout.test.ts`
  Unit tests for wider spread math and focused-card z-order.
- Create: `__tests__/roundUiContracts.test.ts`
  Source-contract tests for phase wiring to `HandActionDock`, wider `FanHand`, and CTA labels.
- Create: `__tests__/roundGenerationEconomy.test.ts`
  Contract tests for `cards.origin_kind`, free-first-generation SQL behavior, and hand hydration.
- Create: `__tests__/timerlessResultsFlow.test.ts`
  Source-contract tests for timer removal, manual results actions, and HUD simplification.
- Create: `supabase/migrations/20260325130000_round_card_origin_and_free_generation.sql`
  Schema change that distinguishes generated cards from gallery wildcard inserts, persists hand slot identity, and makes the first generated card per round free.
- Modify: `src/components/game/FanHand.tsx`
  Consume pure layout helpers, widen the spread, and make the focused card always render above the rest.
- Modify: `src/components/game/HandGrid.tsx`
  Keep the legacy grid path compiling while `PromptArea` becomes dock-oriented, or decouple it from the shared prompt contract if it is truly obsolete.
- Modify: `src/components/game/PromptArea.tsx`
  Become dock content instead of a standalone action card, and expose free/paid generation state cleanly.
- Modify: `src/components/game-phases/NarratorPhase.tsx`
  Replace the loose step-1 action bar with the fixed dock flow.
- Modify: `src/components/game-phases/PlayersPhase.tsx`
  Replace the standalone submit button with the dock-driven flow.
- Modify: `src/components/game/GameBoard.tsx`
  Ensure the action zone and bottom zone comfortably fit the new fixed dock + wider hand composition.
- Modify: `src/stores/useGameStore.ts`
  Add a dedicated store slice for the current player's round hand cards so reconnects can rebuild the hand.
- Modify: `src/hooks/useRound.ts`
  Hydrate both played cards for the board and the current player's unplayed/played round cards for the hand during active phases.
- Modify: `src/hooks/useCardSelection.ts`
  Drive slots from hydrated round cards plus deterministic focus fallback instead of purely local ephemeral state.
- Modify: `src/hooks/useGameActions.ts`
  Insert generated cards with the new authoritative `origin_kind`.
- Modify: `src/components/game/GameStatusHUD.tsx`
  Remove timer state and show only durable phase/round context.
- Modify: `src/components/game-phases/ResultsPhase.tsx`
  Replace countdown confirmation with host-controlled continue/end actions and guest waiting copy.
- Modify: `app/room/[code]/game.tsx`
  Stop passing timer props into `GameStatusHUD` and pass current user context into `useRound` if needed for hand hydration.
- Modify: `src/types/game.ts`
  Extend `cards` row contracts with the new origin metadata used by both client and SQL.
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`
  Add dock copy and timerless results strings.
- Modify: `supabase/functions/game-action/index.ts`
  Mark gallery wildcard inserts as non-generated round cards and keep host `next_round` progression explicit.
- Delete: `src/components/game/CountdownButton.tsx`
- Delete: `src/hooks/useCountdownPhase.ts`
  Remove timer-specific round/results UI helpers once their responsibilities move inline.

## Task 1: Lock the deterministic hand-flow model before touching UI

**Files:**
- Create: `src/components/game/handActionState.ts`
- Create: `src/components/game/fanHandLayout.ts`
- Create: `__tests__/handActionState.test.ts`
- Create: `__tests__/fanHandLayout.test.ts`

- [ ] **Step 1: Write failing tests for slot hydration, fallback focus, dock state, and fan geometry**

Add pure tests that describe the exact behavior the UI will depend on:

```ts
import {
  buildHandSlotsFromRoundCards,
  deriveHandActionDockState,
  resolveFocusedSlotIndex,
} from '../src/components/game/handActionState'
import { getFanCardPose, getFanCardZIndex } from '../src/components/game/fanHandLayout'

test('falls back to the selected filled card before any empty slot', () => {
  const slots = buildHandSlotsFromRoundCards({
    maxSlots: 3,
    cards: [
      { id: 'card-1', image_url: 'https://img/1', prompt: 'moon', created_at: '2026-03-25T10:00:00Z' },
    ],
    selectedCardId: 'card-1',
  })

  expect(resolveFocusedSlotIndex({
    slots,
    selectedCardId: 'card-1',
    lastInsertedCardId: null,
  })).toBe(0)
})

test('disables paid generation when the free turn is spent and tokens are zero', () => {
  expect(deriveHandActionDockState({
    phase: 'players_turn',
    narratorStep: 1,
    focusedSlot: { kind: 'empty', slotIndex: 1 },
    hasFreeGeneration: false,
    generationTokens: 0,
    generating: false,
  })).toMatchObject({
    ctaLabel: 'Generar carta (-1)',
    disabled: true,
  })
})

test('focused empty slots get the highest z-order and a wider spread pose', () => {
  expect(getFanCardPose({ index: 0, total: 3, focusedIndex: 2, selectedIndex: null }).translateX).toBeLessThan(-40)
  expect(getFanCardZIndex({ index: 2, focusedIndex: 2, selectedIndex: null })).toBeGreaterThan(
    getFanCardZIndex({ index: 1, focusedIndex: 2, selectedIndex: null }),
  )
})
```

- [ ] **Step 2: Run the new pure tests and confirm they fail**

Run:

```powershell
npx jest --runInBand __tests__/handActionState.test.ts __tests__/fanHandLayout.test.ts
```

Expected: FAIL because `handActionState.ts` and `fanHandLayout.ts` do not exist yet.

- [ ] **Step 3: Implement the minimal pure helpers**

Create `src/components/game/handActionState.ts` with explicit view-model types instead of burying these rules inside the phase components:

```ts
export interface HydratedHandSlot {
  slotIndex: number
  kind: 'empty' | 'filled'
  cardId: string | null
  imageUri: string | null
  galleryCardId: string | null
}

export function buildHandSlotsFromRoundCards(input: BuildHandSlotsInput): HydratedHandSlot[] {
  const sortedCards = Array.from(input.cards).sort((left, right) => left.created_at.localeCompare(right.created_at))
  return Array.from({ length: input.maxSlots }, (_, slotIndex) => {
    const card = sortedCards[slotIndex] ?? null
    return card
      ? {
          slotIndex,
          kind: 'filled',
          cardId: card.id,
          imageUri: card.image_url,
          galleryCardId: card.origin_kind === 'gallery' ? card.source_gallery_card_id ?? null : null,
        }
      : { slotIndex, kind: 'empty', cardId: null, imageUri: null, galleryCardId: null }
  })
}

export function resolveFocusedSlotIndex(input: ResolveFocusedSlotIndexInput): number {
  const selectedIndex = findSlotIndexByCardId(input.slots, input.selectedCardId)
  if (selectedIndex !== null) return selectedIndex
  const insertedIndex = findSlotIndexByCardId(input.slots, input.lastInsertedCardId)
  if (insertedIndex !== null) return insertedIndex
  return input.slots.find((slot) => slot.kind === 'empty')?.slotIndex ?? 0
}

export function deriveHandActionDockState(input: DeriveHandActionDockStateInput): HandActionDockState {
  if (input.focusedSlot.kind === 'filled' && input.phase === 'players_turn') {
    return { ctaLabel: 'Jugar esta carta', disabled: false, mode: 'play' }
  }

  if (input.focusedSlot.kind === 'filled') {
    return { ctaLabel: 'Siguiente: escribir pista', disabled: false, mode: 'next' }
  }

  const paid = input.hasFreeGeneration === false
  return {
    ctaLabel: paid ? 'Generar carta (-1)' : 'Generar carta gratis',
    disabled: input.generating || (paid && input.generationTokens < 1),
    mode: 'generate',
  }
}
```

Create `src/components/game/fanHandLayout.ts` with only layout math:

```ts
export function getFanCardPose(input: GetFanCardPoseInput) {
  const mid = (input.total - 1) / 2
  const offset = input.index - mid
  const focused = input.focusedIndex === input.index
  const selected = input.selectedIndex === input.index
  const translateX = offset * 54
  const translateY = (offset * offset * 8) - (selected ? 34 : focused ? 24 : 0)
  const angleDeg = offset * 12
  const scale = selected ? 1.14 : focused ? 1.08 : 1
  return { translateX, translateY, angleDeg, scale }
}

export function getFanCardZIndex(input: GetFanCardZIndexInput) {
  if (input.selectedIndex === input.index) return 40
  if (input.focusedIndex === input.index) return 30
  return 10 + input.index
}
```

Keep these files framework-free so they stay cheap to test and reusable from both narrator and player phases.

- [ ] **Step 4: Re-run the pure tests until they pass**

Run:

```powershell
npx jest --runInBand __tests__/handActionState.test.ts __tests__/fanHandLayout.test.ts
```

Expected: PASS with green coverage for fallback order, disabled dock state, and focused-card z-order.

- [ ] **Step 5: Commit the pure contract layer**

```powershell
git add __tests__/handActionState.test.ts __tests__/fanHandLayout.test.ts src/components/game/handActionState.ts src/components/game/fanHandLayout.ts
git commit -m "feat: add deterministic hand action state helpers"
```

## Task 2: Replace the loose round action flow with a fixed hand action dock

**Files:**
- Create: `src/components/game/HandActionDock.tsx`
- Modify: `src/components/game/FanHand.tsx`
- Modify: `src/components/game/HandGrid.tsx`
- Modify: `src/components/game/PromptArea.tsx`
- Modify: `src/components/game-phases/NarratorPhase.tsx`
- Modify: `src/components/game-phases/PlayersPhase.tsx`
- Modify: `src/components/game/GameBoard.tsx`
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/es.json`
- Test: `__tests__/roundUiContracts.test.ts`

- [ ] **Step 1: Write failing source-contract tests for the new dock wiring**

Use source-level tests because the current Jest environment is `node`, not a React Native renderer:

```ts
import fs from 'node:fs'
import path from 'node:path'

const playersPhaseSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'PlayersPhase.tsx'), 'utf8')
const narratorPhaseSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'NarratorPhase.tsx'), 'utf8')
const fanHandSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'FanHand.tsx'), 'utf8')
const handGridSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'HandGrid.tsx'), 'utf8')

test('players and narrator phases both use the fixed HandActionDock', () => {
  expect(playersPhaseSource).toContain('<HandActionDock')
  expect(narratorPhaseSource).toContain('<HandActionDock')
})

test('the old standalone submit button copy is gone from players turn', () => {
  expect(playersPhaseSource).not.toContain("t('game.playThisCard')")
})

test('FanHand delegates layout math to the pure helper layer', () => {
  expect(fanHandSource).toContain("from '@/components/game/fanHandLayout'")
})

test('legacy HandGrid does not keep the old PromptArea-only contract alive', () => {
  expect(handGridSource).not.toContain('<PromptArea')
})
```

- [ ] **Step 2: Run the contract test and confirm RED**

Run:

```powershell
npx jest --runInBand __tests__/roundUiContracts.test.ts
```

Expected: FAIL because `HandActionDock.tsx` does not exist and the phases still use `PromptArea` plus standalone action buttons.

- [ ] **Step 3: Implement `HandActionDock` and rewire narrator/player phases**

Create a dock component that owns the fixed CTA surface and accepts pure state from Task 1:

```tsx
export function HandActionDock({
  state,
  promptValue,
  onPromptChange,
  onSuggestPrompt,
  onUseWildcard,
  onPrimaryAction,
  onGenerate,
  wildcardsLeft,
}: Props) {
  return (
    <View>
      <Text>{state.eyebrow}</Text>
      <PromptArea
        prompt={promptValue}
        onPromptChange={onPromptChange}
        onGenerate={onGenerate}
        onSuggestPrompt={onSuggestPrompt}
        onUseWildcard={onUseWildcard}
        wildcardsLeft={wildcardsLeft}
        generationTokens={state.generationTokens}
        generating={state.generating}
      />
      <Button disabled={state.disabled} onPress={onPrimaryAction}>
        {state.ctaLabel}
      </Button>
    </View>
  )
}
```

Rework the surrounding components with these concrete rules:

- `PlayersPhase.tsx`: the dock becomes the only primary action surface; empty focused slots route to generation state, filled selected cards route to `Jugar esta carta`.
- `NarratorPhase.tsx`: step 1 uses the same dock, but filled selected cards route to `Siguiente: escribir pista`; step 2 keeps the clue composer.
- `HandGrid.tsx`: either update it to the new controlled `PromptArea` contract or remove its prompt rendering path entirely if the component is now legacy-only. Do not leave it importing the old props shape.
- `PromptArea.tsx`: keep input, suggest, wildcard picker, and supporting copy, but remove responsibility for owning the main generate CTA.
- `useCardSelection.ts` + `HandActionDock.tsx`: if generation fails, keep the same empty slot front-most, surface retryable error feedback, and do not snap focus back to another card.
- `FanHand.tsx`: consume `getFanCardPose`/`getFanCardZIndex`, open the spread wider, and let focused empty slots win the same visual priority as filled selections.
- `GameBoard.tsx`: keep the dock fixed above the hand without clipping or collapsing the widened fan.

- [ ] **Step 4: Add the new dock strings to both locale files**

Introduce explicit UI copy instead of building it ad hoc in components:

```json
{
  "game": {
    "generateCardFree": "Generar carta gratis",
    "generateCardPaid": "Generar carta (-1)",
    "playSelectedCard": "Jugar esta carta",
    "nextWriteClue": "Siguiente: escribir pista",
    "firstGenerationFree": "Tu primera generacion de esta ronda es gratis",
    "generationCostsOne": "Esta generacion consumira 1 ficha",
    "generationUnavailableNoTokens": "Ya gastaste la gratis y no te quedan fichas de generacion"
  }
}
```

- [ ] **Step 5: Re-run the pure + wiring suite**

Run:

```powershell
npx jest --runInBand __tests__/handActionState.test.ts __tests__/fanHandLayout.test.ts __tests__/roundUiContracts.test.ts
```

Expected: PASS with the phases importing `HandActionDock`, `FanHand` delegating to pure layout helpers, and no old standalone action CTA on players turn.

- [ ] **Step 6: Smoke-check the web bundle before moving on**

Run:

```powershell
npx expo export --platform web
```

Expected: PASS with a fresh web export and no new bundle errors from the dock/fan refactor.

- [ ] **Step 7: Commit the hand + dock UI shift**

```powershell
git add __tests__/roundUiContracts.test.ts src/components/game/HandActionDock.tsx src/components/game/FanHand.tsx src/components/game/GameBoard.tsx src/components/game/HandGrid.tsx src/components/game/PromptArea.tsx src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx src/i18n/locales/en.json src/i18n/locales/es.json
git commit -m "feat: add fixed hand action dock"
```

## Task 3: Make the first generated round card free and reconnect-safe

**Files:**
- Create: `supabase/migrations/20260325130000_round_card_origin_and_free_generation.sql`
- Modify: `src/components/game/handActionState.ts`
- Modify: `src/types/game.ts`
- Modify: `src/hooks/useGameActions.ts`
- Modify: `supabase/functions/game-action/index.ts`
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/hooks/useRound.ts`
- Modify: `app/room/[code]/game.tsx`
- Modify: `src/hooks/useCardSelection.ts`
- Modify: `src/components/game/PromptArea.tsx`
- Modify: `src/components/game/HandActionDock.tsx`
- Test: `__tests__/roundGenerationEconomy.test.ts`
- Test: `__tests__/game-action-tactical-payloads.test.ts`

- [ ] **Step 1: Write failing tests for the new card-origin contract and hydration path**

Cover both the database contract and the reconnect behavior without requiring a live database. Keep the round-economy helper in `src/components/game/handActionState.ts` so both the dock and the tests use the same pure interpretation of free vs paid generation:

```ts
import fs from 'node:fs'
import path from 'node:path'
import type { Database } from '../src/types/game'

test('cards row contract exposes origin_kind for generation accounting', () => {
  const insert = {
    image_url: 'https://example.com/card.png',
    origin_kind: 'generated',
    player_id: 'player-1',
    prompt: 'mist',
    round_id: 'round-1',
  } satisfies Database['public']['Tables']['cards']['Insert']

  expect(insert.origin_kind).toBe('generated')
})

test('free-generation migration skips gallery cards and makes the first generated card free', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20260325130000_round_card_origin_and_free_generation.sql'), 'utf8')
  expect(sql).toContain('origin_kind')
  expect(sql).toContain('hand_slot_index')
  expect(sql).toContain("NEW.origin_kind = 'gallery'")
  expect(sql).toContain("count(*)")
  expect(sql).toContain('FOR UPDATE')
  expect(sql).toContain('DROP TRIGGER IF EXISTS on_card_generate ON cards')
  expect(sql).toContain('CREATE TRIGGER on_card_generate')
  expect(sql).toContain('DROP FUNCTION IF EXISTS handle_card_generation_token()')
})

test('useRound hydrates the current player hand cards instead of only played cards', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'hooks', 'useRound.ts'), 'utf8')
  expect(source).toContain('setHandCards')
  expect(source).toContain(".eq('player_id', userId)")
  expect(source).toContain('hand_slot_index')
})

test('economy helper cases cover reset and paid generations after the free one', () => {
  expect(describeRoundGenerationEconomy({
    generatedCardsThisRound: 0,
    generationTokens: 0,
    wildcardPicked: false,
  })).toMatchObject({ costTokens: 0, hasFreeGeneration: true })

  expect(describeRoundGenerationEconomy({
    generatedCardsThisRound: 1,
    generationTokens: 2,
    wildcardPicked: false,
  })).toMatchObject({ costTokens: 1, hasFreeGeneration: false })

  expect(describeRoundGenerationEconomy({
    generatedCardsThisRound: 2,
    generationTokens: 1,
    wildcardPicked: false,
  })).toMatchObject({ costTokens: 1, hasFreeGeneration: false })

  expect(describeRoundGenerationEconomy({
    generatedCardsThisRound: 0,
    generationTokens: 1,
    wildcardPicked: true,
  })).toMatchObject({ hasFreeGeneration: true })
})

test('a new round id resets free-generation availability', () => {
  expect(describeRoundGenerationEconomy({
    roundId: 'round-2',
    previousRoundId: 'round-1',
    generatedCardsThisRound: 0,
    generationTokens: 0,
    wildcardPicked: false,
  })).toMatchObject({ hasFreeGeneration: true, costTokens: 0 })
})

test('hydrated slots preserve the original chosen slot after reconnect', () => {
  const slots = buildHandSlotsFromRoundCards({
    maxSlots: 3,
    cards: [
      {
        id: 'card-2',
        image_url: 'https://img/2',
        prompt: 'mist',
        created_at: '2026-03-25T10:00:00Z',
        hand_slot_index: 2,
      },
    ],
    selectedCardId: null,
  })

  expect(slots[2]).toMatchObject({ kind: 'filled', cardId: 'card-2' })
  expect(slots[0]).toMatchObject({ kind: 'empty' })
})
```

- [ ] **Step 2: Run the economy contract tests and confirm they fail**

Run:

```powershell
npx jest --runInBand __tests__/roundGenerationEconomy.test.ts __tests__/game-action-tactical-payloads.test.ts
```

Expected: FAIL because the `cards` type has no `origin_kind`, the migration file does not exist, and `useRound.ts` still only hydrates played board cards.

- [ ] **Step 3: Add authoritative card-origin metadata and free-first-generation SQL**

Create a migration that makes the rule durable in Postgres instead of inventing a client-only flag:

```sql
ALTER TABLE cards
ADD COLUMN IF NOT EXISTS origin_kind text NOT NULL DEFAULT 'generated'
CHECK (origin_kind IN ('generated', 'gallery'));

ALTER TABLE cards
ADD COLUMN IF NOT EXISTS hand_slot_index integer;

UPDATE cards
SET hand_slot_index = ranked.slot_index
FROM (
  SELECT id, row_number() OVER (PARTITION BY round_id, player_id ORDER BY created_at) - 1 AS slot_index
  FROM cards
) AS ranked
WHERE cards.id = ranked.id
  AND cards.hand_slot_index IS NULL;

ALTER TABLE cards
ADD CONSTRAINT cards_hand_slot_index_range
CHECK (hand_slot_index BETWEEN 0 AND 2);

CREATE UNIQUE INDEX IF NOT EXISTS cards_round_player_slot_idx
ON cards (round_id, player_id, hand_slot_index);

CREATE OR REPLACE FUNCTION handle_round_card_generation_token()
RETURNS TRIGGER AS $$
DECLARE
  v_room_id uuid;
  v_previous_generated_count integer;
  v_player_row_id uuid;
BEGIN
  IF NEW.origin_kind = 'gallery' THEN
    RETURN NEW;
  END IF;

  SELECT room_id INTO v_room_id FROM rounds WHERE id = NEW.round_id;

  SELECT id INTO v_player_row_id
  FROM room_players
  WHERE room_id = v_room_id
    AND player_id = NEW.player_id
  FOR UPDATE;

  SELECT count(*) INTO v_previous_generated_count
  FROM cards
  WHERE round_id = NEW.round_id
    AND player_id = NEW.player_id
    AND origin_kind = 'generated';

  IF v_previous_generated_count = 0 THEN
    RETURN NEW;
  END IF;

  UPDATE room_players
  SET generation_tokens = generation_tokens - 1
  WHERE room_id = v_room_id AND player_id = NEW.player_id AND generation_tokens >= 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_TOKENS_LEFT';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_card_generate ON cards;
CREATE TRIGGER on_card_generate
BEFORE INSERT ON cards
FOR EACH ROW
WHEN (NEW.image_url IS NOT NULL)
EXECUTE FUNCTION handle_round_card_generation_token();

DROP FUNCTION IF EXISTS handle_card_generation_token();
```

Update the runtime paths to use that contract:

- `src/types/game.ts`: add both `origin_kind` and `hand_slot_index` to `cards` row/insert/update types.
- `src/hooks/useGameActions.ts`: insert generated round cards with `origin_kind: 'generated'` and the chosen `hand_slot_index`.
- `supabase/functions/game-action/index.ts`: every gallery wildcard round-card insert must set `origin_kind: 'gallery'` and the selected `hand_slot_index`.
- `src/components/game/HandActionDock.tsx` and `src/components/game/PromptArea.tsx`: add a visible free-vs-paid cost badge state, not just different copy, so the player can distinguish `gratis`, `-1`, and disabled paid generation at a glance.
- `src/components/game/handActionState.ts`: extend `buildHandSlotsFromRoundCards(input: BuildHandSlotsInput)` so it maps cards by persisted `hand_slot_index`, not by `created_at` order.

- [ ] **Step 4: Hydrate the current player's active-round hand into the store and rebuild slots from it**

Extend the client state so reconnects no longer lose the hand or the free-generation state:

```ts
interface GameState {
  cards: MaskedCard[]
  handCards: Card[]
  setCards: (cards: MaskedCard[]) => void
  setHandCards: (cards: Card[]) => void
}
```

Then implement the supporting flow:

- `useRound.ts`: keep fetching played `cards` for the board, but also fetch the current player's round cards during `narrator_turn` and `players_turn`.
- `app/room/[code]/game.tsx`: pass `userId` into `useRound(room?.id, userId)` if that is the cleanest way to let the hook hydrate the hand.
- `handActionState.ts`: add `describeRoundGenerationEconomy(input: RoundGenerationEconomyInput)` so the free-vs-paid rule, paid-cost badge, and disabled state all come from one pure helper.
- `useCardSelection.ts`: stop treating slots as purely local. Rebuild them from `handCards`, keep deterministic fallback focus from Task 1, derive `hasFreeGeneration` from `describeRoundGenerationEconomy(input: RoundGenerationEconomyInput)`, and derive the reconnect fallback target from the newest persisted filled card when there is no current selection.
- `HandActionDock.tsx` and `PromptArea.tsx`: show free vs paid copy from the authoritative derived state, and keep the paid CTA disabled only when `hasFreeGeneration === false && generationTokens < 1`.

- [ ] **Step 5: Re-run the economy and hand-hydration suite**

Run:

```powershell
npx jest --runInBand __tests__/roundGenerationEconomy.test.ts __tests__/game-action-tactical-payloads.test.ts __tests__/handActionState.test.ts
```

Expected: PASS with `origin_kind` present, migration contract written, and hand hydration/fallback logic aligned with the new rule.

- [ ] **Step 6: Run typecheck and only accept new diagnostics in touched files**

Run:

```powershell
npx tsc --noEmit
```

Expected: ideally PASS. If the repository baseline is already red, record that baseline first and treat any new errors in `src/types/game.ts`, `src/hooks/useRound.ts`, `src/hooks/useCardSelection.ts`, `src/components/game/HandActionDock.tsx`, or the touched Supabase function files as blockers.

- [ ] **Step 7: Commit the authoritative round-economy change**

```powershell
git add __tests__/roundGenerationEconomy.test.ts __tests__/game-action-tactical-payloads.test.ts app/room/[code]/game.tsx src/components/game/HandActionDock.tsx src/components/game/PromptArea.tsx src/components/game/handActionState.ts src/hooks/useCardSelection.ts src/hooks/useGameActions.ts src/hooks/useRound.ts src/stores/useGameStore.ts src/types/game.ts supabase/functions/game-action/index.ts supabase/migrations/20260325130000_round_card_origin_and_free_generation.sql
git commit -m "feat: make first round generation free"
```

## Task 4: Remove countdown UX and make results progression manual

**Files:**
- Modify: `src/components/game/GameStatusHUD.tsx`
- Modify: `app/room/[code]/game.tsx`
- Modify: `src/components/game-phases/ResultsPhase.tsx`
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/hooks/useRound.ts`
- Delete: `src/components/game/CountdownButton.tsx`
- Delete: `src/hooks/useCountdownPhase.ts`
- Test: `__tests__/timerlessResultsFlow.test.ts`

- [ ] **Step 1: Write failing source-contract tests for timer removal**

Add tests that pin the removal of countdown UI and auto-advance wiring:

```ts
import fs from 'node:fs'
import path from 'node:path'

test('GameStatusHUD no longer owns timer state', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game', 'GameStatusHUD.tsx'), 'utf8')
  expect(source).not.toContain('secondsLeft')
  expect(source).not.toContain('timerPill')
})

test('ResultsPhase no longer imports countdown helpers and shows manual host actions', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'game-phases', 'ResultsPhase.tsx'), 'utf8')
  expect(source).not.toContain('useCountdownPhase')
  expect(source).not.toContain('CountdownButton')
  expect(source).toContain('Siguiente ronda')
})
```

- [ ] **Step 2: Run the timerless contract tests and confirm RED**

Run:

```powershell
npx jest --runInBand __tests__/timerlessResultsFlow.test.ts
```

Expected: FAIL because `GameStatusHUD.tsx` still owns timer state and `ResultsPhase.tsx` still imports the countdown hook/button.

- [ ] **Step 3: Implement the manual results flow and simplify the HUD**

Make the smallest coherent runtime change:

- `GameStatusHUD.tsx`: remove `useEffect`, `secondsLeft`, `phaseStartedAt`, `phaseDurationSeconds`, and the timer pill; keep round, phase, and optional step only.
- `app/room/[code]/game.tsx`: stop passing timer props into the HUD.
- `ResultsPhase.tsx`: inline a simple host-only continue action and a guest waiting state. Keep game-end progression authoritative by using the existing `next_round` action even on the last round, because the backend already turns the room into `ended` when appropriate:

```tsx
async function handleContinue() {
  await gameAction(roomCode, 'next_round')
}
```

Render:

- host: `Button` with `Siguiente ronda` or `Fin del juego`
- guests: read-only text such as `Esperando al anfitrion`

- `src/stores/useGameStore.ts` and `src/hooks/useRound.ts`: remove `resultsServerOffset` if nothing else reads it after countdown removal.
- Delete `src/components/game/CountdownButton.tsx` and `src/hooks/useCountdownPhase.ts` once no references remain.
- Add a short `rg -n "countdown|phaseDurationSeconds|resultsServerOffset|auto-advance|autoAdvance"` audit across `src/` after the refactor to catch any remaining timer-driven phase progression outside the three files already identified.

- [ ] **Step 4: Re-run the timerless suite**

Run:

```powershell
npx jest --runInBand __tests__/timerlessResultsFlow.test.ts
```

Expected: PASS with no countdown imports, no timer state in the HUD, and manual host progression in results.

- [ ] **Step 5: Re-run the focused integration suite and web export**

Run:

```powershell
npx jest --runInBand __tests__/handActionState.test.ts __tests__/fanHandLayout.test.ts __tests__/roundUiContracts.test.ts __tests__/roundGenerationEconomy.test.ts __tests__/game-action-tactical-payloads.test.ts __tests__/timerlessResultsFlow.test.ts
npx expo export --platform web
```

Expected: all listed Jest files PASS, and the web export completes without new build errors.

- [ ] **Step 6: Commit the timerless round flow**

```powershell
git add __tests__/timerlessResultsFlow.test.ts app/room/[code]/game.tsx src/components/game/GameStatusHUD.tsx src/components/game-phases/ResultsPhase.tsx src/hooks/useRound.ts src/stores/useGameStore.ts
git rm src/components/game/CountdownButton.tsx src/hooks/useCountdownPhase.ts
git commit -m "feat: remove countdown-driven round flow"
```

## Task 5: Final regression sweep and manual QA

**Files:**
- Modify: any touched file only if a regression is found during verification

- [ ] **Step 1: Run the full targeted regression suite from a clean staging point**

Run:

```powershell
npx jest --runInBand __tests__/handActionState.test.ts __tests__/fanHandLayout.test.ts __tests__/roundUiContracts.test.ts __tests__/roundGenerationEconomy.test.ts __tests__/game-action-tactical-payloads.test.ts __tests__/timerlessResultsFlow.test.ts __tests__/ui/cardTiltMath.test.ts __tests__/ui/InteractiveCardTilt.test.tsx
```

Expected: PASS. This catches regressions between the new hand flow and the already-landed tilt work.

- [ ] **Step 2: Re-export web and verify there are no new bundle/runtime crashes**

Run:

```powershell
npx expo export --platform web
```

Expected: PASS.

- [ ] **Step 3: Perform a manual multiplayer smoke check**

Use the existing room helper scripts to verify the full product behavior, not just unit contracts:

```powershell
npm run room:3p
npm run room:3p:open
```

Verify manually:

- the fan is visibly wider
- tapping an empty slot brings it to the front
- a filled selected card always sits above the rest
- the dock CTA changes across free generation, paid generation, and play/next-step states
- the first normal generation for each player in a new round does not spend a token
- the second and third normal generations in the same round each spend exactly 1 token
- a wildcard still costs its normal amount
- using a wildcard does not consume the free-generation allowance
- after a refresh or reconnect during an active round, the hand still rebuilds correctly and the free-vs-paid dock state remains correct
- after the host advances to the next round, the dock returns to the free-generation state for every player
- results wait for an explicit host click and never auto-advance

- [ ] **Step 4: Fix any regression uncovered by the verification pass**

If manual or automated verification reveals a defect, write the smallest failing test first in the relevant test file, fix only the touched area, and re-run the focused suite before finalizing.

- [ ] **Step 5: Commit the verification fixes or record a no-op finish**

If verification required code changes, run:

```powershell
git status --short
git commit -m "fix: close hand flow regression gaps"
```

Expected: `git status --short` lists only the regression-fix files you just touched. Stage those exact files before the commit, then commit them with the message above. If verification was green without extra edits, record that explicitly in the execution log and do not create a no-op commit.
