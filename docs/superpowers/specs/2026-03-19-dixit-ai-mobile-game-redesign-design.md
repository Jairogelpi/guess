# Game Screen Redesign — Design Spec

**Date:** 2026-03-19
**Project:** dixit-ai-mobile
**Scope:** Full redesign of the in-game ("partida") screens — all 4 phases, shared components, and game loading state.

---

## 1. Problem Statement

The current game screen has ten identified UX failures:

1. Black `View` while room/round/userId loads — no feedback.
2. Waiting states are empty spinners — no context (who is narrator, what is the clue, how many have submitted).
3. NarratorPhase duplicates info cards — phase-level card + CardGenerator's own card.
4. The 2-step narrator flow (pick card → write clue) is not announced upfront.
5. Wildcards shown in RoundStatus on phases where they are irrelevant.
6. Narrator card is not visually distinguished in the results grid.
7. "Siguiente ronda" button is active for all players but only the host's press matters.
8. No synchronized countdown — players advance the round at different times.
9. CardGenerator shows a placeholder "?" instead of the card-back image.
10. No hand mechanic — players have no notion of generating multiple options before committing.

---

## 2. Confirmed Design Decisions

All decisions below were explicitly confirmed by the user during brainstorming.

### 2.1 Universal Layout Pattern

Every phase uses the same three-zone structure:

```
┌─────────────────────────────┐
│  Context Strip (always)     │  Round N/M · Phase name · Step pill
├─────────────────────────────┤
│  Action Zone (varies)       │  Phase-specific content
│                             │
│                             │
├─────────────────────────────┤
│  Footer (always)            │  Primary action button
└─────────────────────────────┘
```

The context strip replaces the current `RoundStatus` component. It is a thin bar, not a full card. Wildcards are removed from it entirely — they appear only in the phases where they are relevant (narrator and player card-selection phases).

### 2.2 Card Hand Mechanic

Each round, every player (including the narrator) generates a fresh hand of up to 3 cards. They play exactly 1. Cards not played are discarded at the end of the round — hands do not persist across rounds.

The hand UI:
- 3 card slots are visible from the start of each turn.
- Empty slots show a "+" icon labelled "Carta N".
- Tapping an empty slot activates a prompt area below the grid: a text input + **✦ IA** button (auto-suggest prompt) + **Generar** button.
- `PromptArea` owns the prompt text state internally and calls `onGenerate(index, prompt)` when the user presses Generar. `HandGrid` renders `PromptArea` below the active slot and passes the `onGenerate` callback down.
- Once generated, the card fills the slot with the AI image.
- Tapping a generated card selects it (gold border + ✓ badge).
- Only one card can be selected at a time. Selection can be changed.
- The footer "Jugar esta carta" button is disabled until one card is selected.
- Generating all 3 is optional — the player can play after generating just 1.

### 2.3 Narrator Flow — 2 Explicit Steps

The narrator sees a step pill in the context strip: **Paso 1/2** and **Paso 2/2**.

- **Step 1:** Generate hand, select a card. Footer button: "Siguiente: escribir pista →".
- **Step 2:** Card preview (small, locked) + clue text input. Footer button: "Enviar pista y carta →".

### 2.4 Waiting States — WaitingCard Component

Any player who has already submitted (card or vote) sees a `WaitingCard` instead of a spinner. The `WaitingCard` contains:
- The narrator's avatar and name (always visible once the narrator has submitted).
- The narrator's clue (once submitted — not shown during `narrator_turn` wait).
- A progress row: one dot per non-narrator player (`expectedCount` dots total), filled gold when that player submitted, orange for the current user's dot. When the current user is the narrator, they are never a dot — the orange dot rule does not apply.
- A contextual text message: "Esperando a X jugador(es) más..."

The `WaitingCard` is a shared component used by PlayersPhase (post-submit wait), VotingPhase (post-vote wait), and the narrator's wait screens in both phases.

The narrator's name and avatar are resolved from the `players` array using `round.narrator_id`. The parent component (`game.tsx` or the phase component) is responsible for looking up the narrator player object and passing `narratorName` / `narratorAvatar` as props.

### 2.5 Clue as Hero Element

In `players_turn` and `voting` phases (both active and waiting states), the narrator's clue is displayed in a prominent hero block at the top of the action zone — largest text, gold border, full width. It is the first thing the eye reaches.

### 2.6 Results Phase — Big Reveal + Synchronized Countdown

**Reveal layout:**
1. **Big narrator card block** (top, gold border, "✦ Carta del narrador ✦" label + clue text).
2. **Cards grid** — all cards shown, narrator's card highlighted with gold border + "NARRADOR" badge (`game.narratorBadge`), others show the player's name.
3. **Score card** — ranking with signed delta for this round (e.g. `+3`), using `game.pointsDelta` key.

**Auto-advance:** The round advances automatically after 10 seconds. The countdown is synchronized from a server timestamp (`results_started_at` field on the `rounds` table, set by the Edge Function when it transitions the round to `results` status). All clients compute remaining time as `results_started_at_ms + 10000 - serverNow`. `serverNow` is derived from the Supabase Realtime event timestamp (not `Date.now()`) to avoid client clock drift.

**Last round:** When `round.round_number === room.max_rounds`, the countdown button label changes to `game.endGame` ("Fin del juego") and pressing it (or auto-advance) navigates to the end-of-game screen rather than calling `next_round`.

**Countdown button states:**
- *Before pressing:* Orange button with embedded countdown timer (7, 6, 5…) and a draining progress bar below. Ready-dot row shows who has confirmed.
- *After pressing:* Button turns green "✓ ¡Listo! Esperando..." + small text "La ronda empieza en Xs...". Dots update live.
- If all players confirm before 10 s, the round advances immediately.

### 2.7 Results — Host/Guest Button Visibility

Only the host sees the active `CountdownButton`. Guests see a read-only `CountdownDisplay` (same timer + progress bar, non-interactive) — they know the round will advance automatically. This eliminates the confusion of a pressable button that does nothing for guests. Both are prop variants of the same component: `CountdownButton` with `isHost: boolean`.

### 2.8 Card Back Image

When a card has no image (face-down during voting, empty slot before generation), it displays `assets/carta.png` as the card back — the same image used on the welcome screen.

### 2.9 Game Loading Screen

The current black `View` is replaced with a themed loading screen:
- `assets/carta.png` card icon (opacity 0.4, large).
- Text: "Conectando a la partida" (gold) + "Cargando sala y turno..." (muted).
- Three pulsing dots.
- Shown while `room` or `round` or `userId` is null.

---

## 3. Component Architecture

### 3.1 New / Modified Components

| Component | Status | Description |
|---|---|---|
| `ContextStrip` | **New** | Replaces RoundStatus. Shows round N/M, phase name, optional step pill. |
| `WaitingCard` | **New** | Contextual waiting state — narrator, clue, progress dots. Used by 4 states. |
| `HandGrid` | **New** | 3-slot card hand — empty slots, generation flow, selection. |
| `PromptArea` | **New** | Text input + ✦ IA suggest + Generar button. Owns prompt text state. |
| `ClueHero` | **New** | Gold-bordered clue display block. Used in Players and Voting phases. |
| `ResultsReveal` | **New** | Big narrator card block at top of results. |
| `CountdownButton` | **New** | Timer + progress bar; `isHost` prop controls interactive vs read-only. |
| `GameLoadingScreen` | **New** | Themed loading screen replacing black View. |
| `NarratorPhase` | **Rewrite** | 2-step flow: HandGrid (step 1) → clue input (step 2). |
| `PlayersPhase` | **Rewrite** | ClueHero + HandGrid (active) or ClueHero + WaitingCard (submitted). |
| `VotingPhase` | **Rewrite** | ClueHero + vote grid (active) or ClueHero + WaitingCard (voted). |
| `ResultsPhase` | **Rewrite** | ResultsReveal + cards grid + ScoreCard + CountdownButton. |
| `DixitCard` | **Modify** | Placeholder replaced with `assets/carta.png` card back. |
| `CardGenerator` | **Modify** | Remove internal infoCard. Logic absorbed into HandGrid/PromptArea. |
| `RoundStatus` | **Delete** | Fully replaced by ContextStrip. |
| `game.tsx` | **Modify** | Add GameLoadingScreen; resolve narrator player; pass props to phases. |

### 3.2 Phase Component Props

```typescript
// game.tsx resolves narrator player before passing to phases:
// const narratorPlayer = players.find(p => p.user_id === round.narrator_id)

interface NarratorPhaseProps {
  round: Round;
  userId: string;
  narratorName: string;         // own name (narrator is always the current user here)
  narratorAvatar?: string;
  wildcardCount: number;
  onSubmit: (cardUri: string, clue: string) => Promise<void>;
}

interface PlayersPhaseProps {
  round: Round;
  userId: string;
  isNarrator: boolean;
  narratorName: string;
  narratorAvatar?: string;
  players: RoomPlayer[];        // all non-narrator players (for progress dots)
  wildcardCount: number;
  hasSubmittedCard: boolean;
  onSubmit: (cardUri: string) => Promise<void>;
}

interface VotingPhaseProps {
  round: Round;
  userId: string;
  isNarrator: boolean;
  narratorName: string;
  narratorAvatar?: string;
  players: RoomPlayer[];        // all non-narrator players (for progress dots)
  hasVoted: boolean;
  cards: RoundCard[];           // shuffled, anonymized during voting
  onVote: (cardId: string) => Promise<void>;
}

interface ResultsPhaseProps {
  round: Round;
  room: Room;
  userId: string;
  isHost: boolean;
  players: RoomPlayer[];
  cards: RoundCard[];           // with player attribution revealed
  scores: PlayerScore[];
  onNextRound: () => Promise<void>;
}
```

### 3.3 Shared Component Props

```typescript
interface WaitingCardProps {
  narratorName: string;
  narratorAvatar?: string;
  clue?: string;                // undefined = narrator hasn't submitted yet
  submittedCount: number;
  expectedCount: number;        // always excludes narrator across all phases
  isCurrentUserNarrator: boolean;
  currentUserId: string;
  submittedPlayerIds: string[]; // to color the current user's dot orange
}

interface HandGridProps {
  slots: HandSlot[];            // always length 3
  activeSlotIndex: number | null;
  onSlotPress: (index: number) => void;
  onSelect: (index: number) => void;
  onGenerate: (index: number, prompt: string) => Promise<void>;
  onSuggestPrompt: (index: number) => Promise<string>;
  generating: boolean;
}

interface HandSlot {
  id: string;
  imageUri?: string;            // undefined = not yet generated
  isSelected: boolean;
}

interface PromptAreaProps {
  slotIndex: number;
  onGenerate: (index: number, prompt: string) => Promise<void>;
  onSuggest: (index: number) => Promise<string>;
  generating: boolean;
}
// PromptArea owns the prompt text state internally.
// HandGrid renders PromptArea below the active slot.

interface CountdownButtonProps {
  secondsRemaining: number;     // computed from results_started_at
  totalSeconds: number;         // 10
  isHost: boolean;              // true = interactive, false = read-only display
  confirmed: boolean;           // current user has pressed
  confirmedCount: number;
  totalCount: number;           // all players including narrator (narrator confirms in results too)
  isLastRound: boolean;
  onConfirm: () => void;
  onAutoAdvance: () => void;    // called when timer reaches 0
}
```

---

## 4. Database Changes

### 4.1 Add `results_started_at` to `rounds`

```sql
ALTER TABLE rounds ADD COLUMN results_started_at timestamptz;
```

**Who sets it:** The `next_round` / `advance_phase` Edge Function sets `results_started_at = now()` when it transitions `round.status` to `'results'`. It is never set client-side.

**Who reads it:** All clients receive the value via Supabase Realtime when the round row updates. The countdown formula is:

```typescript
const elapsed = realtimeEventTimestamp - results_started_at;
const remaining = Math.max(0, 10000 - elapsed);
```

`realtimeEventTimestamp` comes from the Realtime payload (server time), not `Date.now()`, to avoid client clock drift.

**Reset:** The Edge Function sets `results_started_at = NULL` when transitioning the round out of `results` status (i.e., when starting the next round or ending the game).

### 4.2 Migration File

`supabase/migrations/YYYYMMDDHHMMSS_add_results_started_at.sql`

```sql
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS results_started_at timestamptz;
COMMENT ON COLUMN rounds.results_started_at IS
  'Set by server when round enters results phase. Used by all clients for synchronized 10s countdown.';
```

---

## 5. Phase State Machine

Uses the existing `RoundStatus` type: `'narrator_turn' | 'players_turn' | 'voting' | 'results'`.

```
game.tsx:
  null room/round/userId        → GameLoadingScreen
  round.status === 'narrator_turn'  → NarratorPhase
  round.status === 'players_turn'   → PlayersPhase
  round.status === 'voting'         → VotingPhase
  round.status === 'results'        → ResultsPhase

NarratorPhase (current user is narrator):
  step === 1 → HandGrid + footer "Siguiente: escribir pista →"
  step === 2 → card preview (locked) + ClueInput + footer "Enviar pista y carta →"

PlayersPhase:
  isNarrator === true              → WaitingCard (clue = "Tu pista", no dot for narrator)
  hasSubmittedCard === false        → ClueHero + HandGrid + footer "Jugar esta carta →"
  hasSubmittedCard === true         → ClueHero + WaitingCard

VotingPhase:
  isNarrator === true              → WaitingCard
  hasVoted === false               → ClueHero + VoteGrid + footer "Votar esta carta →"
  hasVoted === true                → ClueHero + WaitingCard

ResultsPhase:
  isLastRound === false            → ResultsReveal + CardsGrid + ScoreCard
                                     + CountdownButton(isHost=true) or CountdownButton(isHost=false)
  isLastRound === true             → same layout, button label = "Fin del juego",
                                     auto-advance navigates to end-of-game screen
```

---

## 6. i18n Keys

New/updated keys needed in `es.json` and `en.json`:

```jsonc
// es.json additions
{
  "game": {
    "loading": "Conectando a la partida",
    "loadingSub": "Cargando sala y turno...",
    "step": "Paso {{current}}/{{total}}",
    "yourHand": "Tu mano — elige una",
    "cardSlot": "Carta {{n}}",
    "describeCard": "Describe la carta...",
    "suggestIA": "✦ IA",
    "generate": "Generar",
    "chooseCard": "Elige tu carta",
    "nextWriteClue": "Siguiente: escribir pista →",
    "writeYourClue": "Escribe tu pista",
    "chosenCard": "Carta elegida",
    "clueHint": "Una palabra, frase o sonido. Ni muy obvia ni muy difícil.",
    "sendClueAndCard": "Enviar pista y carta →",
    "narratorClue": "Pista del narrador",
    "yourClue": "Tu pista",
    "playThisCard": "Jugar esta carta →",
    "narratorsCard": "¿Cuál es la del narrador?",
    "vote": "Votar esta carta →",
    "narratorCardReveal": "✦ Carta del narrador ✦",
    "narratorBadge": "NARRADOR",
    "nextRound": "Siguiente ronda",
    "endGame": "Fin del juego",
    "pointsDelta": "+{{count}}",
    "waitingConfirm": "¡Listo! Esperando...",
    "roundStartsIn": "La ronda empieza en {{s}}s...",
    "cardSent": "✓ Tu carta enviada",
    "voteSent": "✓ Voto registrado",
    "waitingForNarrator": "El narrador está preparando su carta y pista",
    "waitingForPlayers": "Los jugadores están eligiendo su carta",
    "waitingForVotes": "Los jugadores están adivinando tu carta",
    "waitingMore_one": "Esperando a {{count}} jugador más...",
    "waitingMore_other": "Esperando a {{count}} jugadores más..."
  }
}

// en.json additions (same keys)
{
  "game": {
    "loading": "Connecting to game",
    "loadingSub": "Loading room and round...",
    "step": "Step {{current}}/{{total}}",
    "yourHand": "Your hand — pick one",
    "cardSlot": "Card {{n}}",
    "describeCard": "Describe the card...",
    "suggestIA": "✦ AI",
    "generate": "Generate",
    "chooseCard": "Choose your card",
    "nextWriteClue": "Next: write your clue →",
    "writeYourClue": "Write your clue",
    "chosenCard": "Chosen card",
    "clueHint": "A word, phrase, or sound. Not too obvious, not too cryptic.",
    "sendClueAndCard": "Send clue and card →",
    "narratorClue": "Narrator's clue",
    "yourClue": "Your clue",
    "playThisCard": "Play this card →",
    "narratorsCard": "Which is the narrator's?",
    "vote": "Vote this card →",
    "narratorCardReveal": "✦ Narrator's Card ✦",
    "narratorBadge": "NARRATOR",
    "nextRound": "Next round",
    "endGame": "End of game",
    "pointsDelta": "+{{count}}",
    "waitingConfirm": "Ready! Waiting...",
    "roundStartsIn": "Round starts in {{s}}s...",
    "cardSent": "✓ Card submitted",
    "voteSent": "✓ Vote registered",
    "waitingForNarrator": "The narrator is choosing a card and clue",
    "waitingForPlayers": "Players are choosing their cards",
    "waitingForVotes": "Players are guessing your card",
    "waitingMore_one": "Waiting for {{count}} more player...",
    "waitingMore_other": "Waiting for {{count}} more players..."
  }
}
```

---

## 7. Out of Scope

- Narrator disconnect / round timeout — not handled in this spec; tracked separately.
- End-of-game screen (final scores when all rounds are done) — navigation target exists, content not modified.
- Lobby screen — redesigned in a prior spec (`2026-03-19-dixit-ai-mobile-lobby-redesign.md`).
- Chat during game — not modified.
- Sound/haptic feedback.
- Wildcard mechanic redesign — wildcards remain as-is; they are simply removed from the ContextStrip in phases where they are irrelevant.
