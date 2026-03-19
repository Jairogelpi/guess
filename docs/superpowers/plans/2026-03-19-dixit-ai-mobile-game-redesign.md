# Game Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all in-game phases to have consistent layout (ContextStrip → Action Zone → Footer), a 3-card hand mechanic, contextual WaitingCard states, big narrator reveal in results, and a synchronized 10-second auto-advance countdown.

**Architecture:** New shared components (`ContextStrip`, `WaitingCard`, `HandGrid`, `PromptArea`, `ClueHero`, `ResultsReveal`, `CountdownButton`, `GameLoadingScreen`) replace the current `RoundStatus` component and empty spinner states. All 4 phase components are rewritten to use these building blocks. A `results_started_at` server timestamp enables the synchronized countdown.

**Tech Stack:** React Native (Expo Router), TypeScript strict, Supabase Realtime, i18next, Zustand, `assets/carta.png` for card backs.

**Spec:** `docs/superpowers/specs/2026-03-19-dixit-ai-mobile-game-redesign-design.md`

---

## File Map

### New files
| File | Purpose |
|---|---|
| `src/components/game/ContextStrip.tsx` | Thin header: round N/M, phase label, optional step pill |
| `src/components/game/WaitingCard.tsx` | Contextual waiting state — narrator, clue, progress dots |
| `src/components/game/HandGrid.tsx` | 3-slot card hand with generation flow and selection |
| `src/components/game/PromptArea.tsx` | Prompt input + ✦ IA suggest + Generar — owns text state |
| `src/components/game/ClueHero.tsx` | Gold-bordered clue display block |
| `src/components/game/CountdownButton.tsx` | Timer + draining progress bar, host/guest variant |
| `src/components/game/GameLoadingScreen.tsx` | Themed loading screen (replaces black View) |
| `src/components/game/ResultsReveal.tsx` | Big narrator card block for results top |
| `supabase/migrations/20260319220000_add_results_started_at.sql` | Add `results_started_at` column to rounds |

### Modified files
| File | What changes |
|---|---|
| `src/components/ui/DixitCard.tsx` | Use `assets/carta.png` as placeholder instead of "?" |
| `src/stores/useGameStore.ts` | Add `myVotedCardId`, `resultsServerOffset` |
| `src/hooks/useRound.ts` | Extract `commit_timestamp` from Realtime payload for countdown |
| `supabase/functions/game-action/index.ts` | Set `results_started_at = now()` on results transition (line ~281) |
| `src/components/game-phases/NarratorPhase.tsx` | Full rewrite — 2-step flow with HandGrid |
| `src/components/game-phases/PlayersPhase.tsx` | Full rewrite — ClueHero + HandGrid / WaitingCard |
| `src/components/game-phases/VotingPhase.tsx` | Full rewrite — ClueHero + VoteGrid / WaitingCard |
| `src/components/game-phases/ResultsPhase.tsx` | Full rewrite — ResultsReveal + grid + ScoreBoard + CountdownButton |
| `app/room/[code]/game.tsx` | Replace RoundStatus, add GameLoadingScreen, resolve narrator player |
| `src/i18n/locales/es.json` | Add new game keys |
| `src/i18n/locales/en.json` | Add new game keys |
| `src/types/game.ts` | Add `results_started_at` to Round type |

### Pre-existing files (used but not modified)
| File | Purpose |
|---|---|
| `src/components/game/ScoreBoard.tsx` | Renders per-round scores — already exists, used by ResultsPhase |
| `src/components/game/CardGrid.tsx` | Card grid — modified in Task 17 to add `narratorPlayerId` support |

### Deleted files
| File | Reason |
|---|---|
| `src/components/game/RoundStatus.tsx` | Replaced by ContextStrip |

---

## Task 1: DB Migration — `results_started_at`

**Files:**
- Create: `supabase/migrations/20260319220000_add_results_started_at.sql`
- Modify: `src/types/game.ts`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migrations/20260319220000_add_results_started_at.sql`:

```sql
ALTER TABLE rounds
  ADD COLUMN IF NOT EXISTS results_started_at timestamptz;

COMMENT ON COLUMN rounds.results_started_at IS
  'Set by server when round enters results phase. Used by all clients for synchronized 10s countdown.';
```

- [ ] **Step 2: Add field to Round type**

In `src/types/game.ts`, find the `rounds` Row type (around line 323) and add the field:

```typescript
results_started_at: string | null  // add after narrator_id
```

Do this for all 3 variants of the rounds row type (Row, Insert, Update — search for `narrator_id` to find them all).

- [ ] **Step 3: Apply migration**

```bash
npx supabase db push
```

Expected: migration applied without errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260319220000_add_results_started_at.sql src/types/game.ts
git commit -m "feat: add results_started_at to rounds for synchronized countdown"
```

---

## Task 2: i18n Keys

**Files:**
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Add Spanish keys**

In `src/i18n/locales/es.json`, inside the `"game"` object, add after the last existing key:

```json
"loading": "Conectando a la partida",
"loadingSub": "Cargando sala y turno...",
"step": "Paso {{current}}/{{total}}",
"yourHand": "Tu mano — elige una",
"cardSlot": "Carta {{n}}",
"describeCard": "Describe la carta...",
"suggestIA": "✦ IA",
"generate": "Generar",
"nextWriteClue": "Siguiente: escribir pista →",
"writeYourClue": "Escribe tu pista",
"chosenCard": "Carta elegida",
"clueHint": "Una palabra, frase o sonido. Ni muy obvia ni muy difícil.",
"sendClueAndCard": "Enviar pista y carta →",
"yourClue": "Tu pista",
"playThisCard": "Jugar esta carta →",
"narratorsCard": "¿Cuál es la del narrador?",
"narratorCardReveal": "✦ Carta del narrador ✦",
"narratorBadge": "NARRADOR",
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
"waitingMore_other": "Esperando a {{count}} jugadores más...",
"round": "Ronda {{current}} / {{total}}",
"narrator": "Narrador",
"score": "Puntuación",
"waiting": "Esperando...",
"changeCard": "Cambiar carta",
"cluePlaceholder": "Una palabra, frase o sonido..."
```

Note: `"chooseCard"`, `"vote"`, `"nextRound"`, and `"cluePlaceholder"` (already exists) — do not duplicate them. Check before adding.

- [ ] **Step 2: Add English keys**

In `src/i18n/locales/en.json`, inside the `"game"` object, add the same keys with English values:

```json
"loading": "Connecting to game",
"loadingSub": "Loading room and round...",
"step": "Step {{current}}/{{total}}",
"yourHand": "Your hand — pick one",
"cardSlot": "Card {{n}}",
"describeCard": "Describe the card...",
"suggestIA": "✦ AI",
"generate": "Generate",
"nextWriteClue": "Next: write your clue →",
"writeYourClue": "Write your clue",
"chosenCard": "Chosen card",
"clueHint": "A word, phrase, or sound. Not too obvious, not too cryptic.",
"sendClueAndCard": "Send clue and card →",
"yourClue": "Your clue",
"playThisCard": "Play this card →",
"narratorsCard": "Which is the narrator's?",
"narratorCardReveal": "✦ Narrator's Card ✦",
"narratorBadge": "NARRATOR",
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
"waitingMore_other": "Waiting for {{count}} more players...",
"round": "Round {{current}} / {{total}}",
"narrator": "Narrator",
"score": "Score",
"waiting": "Waiting...",
"changeCard": "Change card",
"cluePlaceholder": "A word, phrase, or sound..."
```

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/es.json src/i18n/locales/en.json
git commit -m "feat: add game redesign i18n keys"
```

---

## Task 3: DixitCard — Card Back Image

**Files:**
- Modify: `src/components/ui/DixitCard.tsx`

- [ ] **Step 1: Replace "?" placeholder with card back image**

Find the placeholder block in `DixitCard.tsx` and replace it:

```typescript
// At top of file, add import:
import cardBackImage from '@/../../assets/carta.png'

// Replace the placeholder View (the one with styles.placeholder and placeholderText "?"):
) : (
  <Image
    source={cardBackImage}
    style={styles.image}
    resizeMode="cover"
  />
)}
```

The resulting JSX for the card body:
```typescript
{loading ? (
  <View style={styles.placeholder}>
    <ActivityIndicator size="large" color={colors.gold} />
  </View>
) : uri ? (
  <Image source={{ uri }} style={styles.image} resizeMode="cover" />
) : (
  <Image source={cardBackImage} style={styles.image} resizeMode="cover" />
)}
```

- [ ] **Step 2: Verify the asset path resolves**

Check that `assets/carta.png` exists:
```bash
ls "/c/Users/jairo/Desktop/PROYECTO GUESSTHEPRONT/dixit_ai_mobile/assets/carta.png"
```

If the path alias `@/../../assets/carta.png` doesn't resolve (it goes up two levels from `src/`), use the direct relative path from the component file instead: `../../../assets/carta.png`. Or use Expo's `require`:

```typescript
const cardBackImage = require('../../../assets/carta.png')
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/DixitCard.tsx
git commit -m "feat: use carta.png as card back placeholder in DixitCard"
```

---

## Task 4: ContextStrip Component

**Files:**
- Create: `src/components/game/ContextStrip.tsx`

- [ ] **Step 1: Create ContextStrip**

```typescript
// src/components/game/ContextStrip.tsx
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts } from '@/constants/theme'

interface Props {
  roundNumber: number
  maxRounds: number
  phaseLabel: string    // already-translated phase label
  stepCurrent?: number  // show "Paso N/M" pill when provided
  stepTotal?: number
}

export function ContextStrip({ roundNumber, maxRounds, phaseLabel, stepCurrent, stepTotal }: Props) {
  const { t } = useTranslation()
  const showStep = stepCurrent !== undefined && stepTotal !== undefined

  return (
    <View style={styles.strip}>
      <View style={styles.left}>
        <Text style={styles.round}>
          {t('game.round', { current: roundNumber, total: maxRounds })}
        </Text>
        <Text style={styles.phase}>{phaseLabel}</Text>
      </View>
      {showStep && (
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {t('game.step', { current: stepCurrent, total: stepTotal })}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 9, 5, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 192, 119, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 8,
  },
  left: { flex: 1, gap: 1 },
  round: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 9,
    fontFamily: fonts.title,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  phase: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.title,
    fontWeight: '700',
  },
  pill: {
    backgroundColor: 'rgba(244, 192, 119, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.2)',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 9,
    fontFamily: fonts.title,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/ContextStrip.tsx
git commit -m "feat: add ContextStrip component (replaces RoundStatus)"
```

---

## Task 5: ClueHero Component

**Files:**
- Create: `src/components/game/ClueHero.tsx`

- [ ] **Step 1: Create ClueHero**

```typescript
// src/components/game/ClueHero.tsx
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii, shadows } from '@/constants/theme'

interface Props {
  clue: string
  labelKey?: string   // i18n key, defaults to 'game.narratorClue'
}

export function ClueHero({ clue, labelKey = 'game.narratorClue' }: Props) {
  const { t } = useTranslation()
  return (
    <View style={styles.hero}>
      <Text style={styles.label}>{t(labelKey)}</Text>
      <Text style={styles.clue}>"{clue}"</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    ...shadows.surface,
  },
  label: {
    color: colors.gold,
    fontSize: 9,
    fontFamily: fonts.title,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  clue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontFamily: fonts.title,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/ClueHero.tsx
git commit -m "feat: add ClueHero component"
```

---

## Task 6: WaitingCard Component

**Files:**
- Create: `src/components/game/WaitingCard.tsx`

- [ ] **Step 1: Create WaitingCard**

```typescript
// src/components/game/WaitingCard.tsx
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

interface Props {
  narratorName: string
  narratorAvatar?: string
  clue?: string               // undefined = narrator hasn't submitted yet
  submittedCount: number
  expectedCount: number       // always excludes narrator
  isCurrentUserNarrator: boolean
  currentUserId: string
  submittedPlayerIds: string[]
  contextMessage: string      // already-translated message e.g. "Los jugadores están eligiendo..."
}

export function WaitingCard({
  narratorName,
  narratorAvatar,
  clue,
  submittedCount,
  expectedCount,
  isCurrentUserNarrator,
  currentUserId,
  submittedPlayerIds,
  contextMessage,
}: Props) {
  const { t } = useTranslation()

  const remaining = expectedCount - submittedCount
  const waitingText = remaining > 0
    ? t('game.waitingMore', { count: remaining })
    : t('game.waiting')

  return (
    <View style={styles.card}>
      {/* Narrator row */}
      <View style={styles.narratorRow}>
        <ProfileAvatar uri={narratorAvatar} displayName={narratorName} size={36} />
        <View style={styles.narratorInfo}>
          <Text style={styles.narratorName}>{narratorName}</Text>
          <Text style={styles.narratorRole}>{t('game.narrator')}</Text>
        </View>
      </View>

      {/* Clue (if available) */}
      {clue !== undefined && (
        <View style={styles.clueRow}>
          <Text style={styles.clueLabel}>{t('game.narratorClue')}</Text>
          <Text style={styles.clueText}>"{clue}"</Text>
        </View>
      )}

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: expectedCount }).map((_, i) => {
          const playerId = submittedPlayerIds[i]
          const isSubmitted = i < submittedCount
          const isMe = !isCurrentUserNarrator && playerId === currentUserId
          return (
            <View
              key={i}
              style={[
                styles.dot,
                isSubmitted && styles.dotDone,
                isMe && styles.dotMe,
              ]}
            />
          )
        })}
        <Text style={styles.dotsLabel}>
          {submittedCount}/{expectedCount}
        </Text>
      </View>

      <Text style={styles.contextMsg}>{contextMessage}</Text>
      <Text style={styles.waitingText}>{waitingText}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.18)',
    borderRadius: radii.md,
    padding: 14,
    gap: 10,
    ...shadows.surface,
  },
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  narratorInfo: { gap: 1 },
  narratorName: {
    color: colors.goldLight,
    fontSize: 13,
    fontFamily: fonts.title,
    fontWeight: '700',
  },
  narratorRole: {
    color: 'rgba(255, 241, 222, 0.35)',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  clueRow: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: radii.sm,
    padding: 10,
    gap: 3,
  },
  clueLabel: {
    color: colors.gold,
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  clueText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.title,
    fontStyle: 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(244, 192, 119, 0.3)',
    backgroundColor: 'transparent',
  },
  dotDone: {
    backgroundColor: 'rgba(230, 184, 0, 0.2)',
    borderColor: colors.gold,
  },
  dotMe: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: '#f97316',
  },
  dotsLabel: {
    color: 'rgba(255, 241, 222, 0.25)',
    fontSize: 9,
    marginLeft: 4,
  },
  contextMsg: {
    color: 'rgba(255, 241, 222, 0.35)',
    fontSize: 12,
    lineHeight: 17,
  },
  waitingText: {
    color: 'rgba(255, 241, 222, 0.5)',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/WaitingCard.tsx
git commit -m "feat: add WaitingCard component"
```

---

## Task 7: PromptArea Component

**Files:**
- Create: `src/components/game/PromptArea.tsx`

- [ ] **Step 1: Create PromptArea**

```typescript
// src/components/game/PromptArea.tsx
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  slotIndex: number
  onGenerate: (index: number, prompt: string) => Promise<void>
  onSuggest: (index: number) => Promise<string>
  generating: boolean
}

export function PromptArea({ slotIndex, onGenerate, onSuggest, generating }: Props) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [suggesting, setSuggesting] = useState(false)

  async function handleSuggest() {
    setSuggesting(true)
    const suggested = await onSuggest(slotIndex)
    if (suggested) setPrompt(suggested)
    setSuggesting(false)
  }

  async function handleGenerate() {
    if (!prompt.trim() || generating) return
    await onGenerate(slotIndex, prompt.trim())
  }

  return (
    <View style={styles.area}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          placeholder={t('game.describeCard')}
          placeholderTextColor="rgba(255,241,222,0.3)"
          maxLength={500}
          multiline
          numberOfLines={2}
        />
        <TouchableOpacity
          onPress={handleSuggest}
          disabled={suggesting || generating}
          style={styles.iaBtn}
          activeOpacity={0.75}
        >
          {suggesting ? (
            <ActivityIndicator size="small" color={colors.goldLight} />
          ) : (
            <Text style={styles.iaBtnText}>{t('game.suggestIA')}</Text>
          )}
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={handleGenerate}
        disabled={!prompt.trim() || generating}
        style={[styles.genBtn, (!prompt.trim() || generating) && styles.genBtnDisabled]}
        activeOpacity={0.8}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#fff7ea" />
        ) : (
          <Text style={styles.genBtnText}>{t('game.generate')}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  area: {
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.2)',
    borderRadius: radii.md,
    padding: 10,
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(67, 34, 21, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.2)',
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  iaBtn: {
    backgroundColor: 'rgba(67, 34, 21, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.3)',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    minWidth: 54,
    alignItems: 'center',
  },
  iaBtnText: {
    color: colors.goldLight,
    fontSize: 11,
    fontFamily: fonts.title,
    fontWeight: '700',
  },
  genBtn: {
    backgroundColor: '#f97316',
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  genBtnDisabled: {
    backgroundColor: 'rgba(67, 34, 21, 0.4)',
  },
  genBtnText: {
    color: '#fff7ea',
    fontSize: 13,
    fontFamily: fonts.title,
    fontWeight: '700',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/PromptArea.tsx
git commit -m "feat: add PromptArea component"
```

---

## Task 8: HandGrid Component

**Files:**
- Create: `src/components/game/HandGrid.tsx`

- [ ] **Step 1: Create HandGrid**

```typescript
// src/components/game/HandGrid.tsx
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'
import { PromptArea } from '@/components/game/PromptArea'

export interface HandSlot {
  id: string
  imageUri?: string   // undefined = not yet generated
  isSelected: boolean
}

interface Props {
  slots: HandSlot[]            // always length 3
  activeSlotIndex: number | null
  onSlotPress: (index: number) => void
  onSelect: (index: number) => void
  onGenerate: (index: number, prompt: string) => Promise<void>
  onSuggestPrompt: (index: number) => Promise<string>
  generating: boolean
}

export function HandGrid({
  slots,
  activeSlotIndex,
  onSlotPress,
  onSelect,
  onGenerate,
  onSuggestPrompt,
  generating,
}: Props) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t('game.yourHand')}</Text>

      <View style={styles.grid}>
        {slots.map((slot, i) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.slot,
              slot.imageUri ? styles.slotGenerated : styles.slotEmpty,
              slot.isSelected && styles.slotSelected,
              activeSlotIndex === i && !slot.imageUri && styles.slotActive,
            ]}
            onPress={() => {
              if (slot.imageUri) {
                onSelect(i)
              } else {
                onSlotPress(i)
              }
            }}
            activeOpacity={0.8}
          >
            {slot.imageUri ? (
              <Image source={{ uri: slot.imageUri }} style={styles.cardImage} resizeMode="cover" />
            ) : generating && activeSlotIndex === i ? (
              <View style={styles.generatingCenter}>
                <ActivityIndicator color={colors.gold} size="small" />
              </View>
            ) : (
              <View style={styles.emptyCenter}>
                <Text style={styles.plusIcon}>+</Text>
                <Text style={styles.emptyLabel}>{t('game.cardSlot', { n: i + 1 })}</Text>
              </View>
            )}

            {slot.isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* PromptArea shows below the active empty slot */}
      {activeSlotIndex !== null && !slots[activeSlotIndex]?.imageUri && (
        <PromptArea
          slotIndex={activeSlotIndex}
          onGenerate={onGenerate}
          onSuggest={onSuggestPrompt}
          generating={generating}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  sectionLabel: {
    color: 'rgba(255, 241, 222, 0.25)',
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  slot: {
    flex: 1,
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  slotEmpty: {
    backgroundColor: 'rgba(25, 13, 10, 0.6)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(244, 192, 119, 0.2)',
  },
  slotActive: {
    borderColor: 'rgba(244, 192, 119, 0.5)',
  },
  slotGenerated: {
    borderWidth: 1.5,
    borderColor: 'rgba(244, 192, 119, 0.35)',
  },
  slotSelected: {
    borderWidth: 2.5,
    borderColor: colors.gold,
    // RN doesn't support box-shadow directly; use elevation on Android
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  plusIcon: {
    color: 'rgba(255, 241, 222, 0.25)',
    fontSize: 22,
  },
  emptyLabel: {
    color: 'rgba(255, 241, 222, 0.2)',
    fontSize: 9,
    textAlign: 'center',
    fontFamily: fonts.title,
    letterSpacing: 0.5,
  },
  generatingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(230, 184, 0, 0.88)',
    paddingVertical: 3,
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#0a0602',
    fontSize: 10,
    fontWeight: '900',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/HandGrid.tsx
git commit -m "feat: add HandGrid component with 3-slot card hand mechanic"
```

---

## Task 9: CountdownButton Component

**Files:**
- Create: `src/components/game/CountdownButton.tsx`

- [ ] **Step 1: Create CountdownButton**

```typescript
// src/components/game/CountdownButton.tsx
import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  secondsRemaining: number   // passed in, computed externally from results_started_at
  totalSeconds?: number      // default 10
  isHost: boolean
  confirmed: boolean
  confirmedCount: number
  totalCount: number         // includes narrator
  isLastRound: boolean
  onConfirm: () => void
  onAutoAdvance: () => void  // called when timer hits 0
}

export function CountdownButton({
  secondsRemaining,
  totalSeconds = 10,
  isHost,
  confirmed,
  confirmedCount,
  totalCount,
  isLastRound,
  onConfirm,
  onAutoAdvance,
}: Props) {
  const { t } = useTranslation()
  const advancedRef = useRef(false)

  useEffect(() => {
    if (secondsRemaining <= 0 && !advancedRef.current) {
      advancedRef.current = true
      onAutoAdvance()
    }
  }, [secondsRemaining])

  const progress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds))
  const label = isLastRound ? t('game.endGame') : t('game.nextRound')

  if (confirmed) {
    return (
      <View style={styles.confirmedWrap}>
        <View style={styles.confirmedBtn}>
          <Text style={styles.tick}>✓</Text>
          <Text style={styles.confirmedText}>{t('game.waitingConfirm')}</Text>
        </View>
        <Text style={styles.countdownText}>
          {t('game.roundStartsIn', { s: Math.ceil(secondsRemaining) })}
        </Text>
      </View>
    )
  }

  if (!isHost) {
    // Guest: read-only countdown display
    return (
      <View style={styles.guestWrap}>
        <View style={styles.timerBar}>
          <View style={styles.timerBarTrack}>
            <View style={[styles.timerBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.timerNum}>{Math.ceil(secondsRemaining)}</Text>
        </View>
        <Text style={styles.guestHint}>{t('game.roundStartsIn', { s: Math.ceil(secondsRemaining) })}</Text>
      </View>
    )
  }

  // Host: interactive button
  return (
    <View style={styles.btnWrap}>
      <TouchableOpacity style={styles.btn} onPress={onConfirm} activeOpacity={0.85}>
        <Text style={styles.btnLabel}>{label}</Text>
        <Text style={styles.btnTimer}>{Math.ceil(secondsRemaining)}</Text>
      </TouchableOpacity>
      <View style={styles.progTrack}>
        <View style={[styles.progFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  confirmedWrap: { gap: 6 },
  confirmedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    borderRadius: radii.md,
    paddingVertical: 12,
  },
  tick: { fontSize: 14, color: '#4ade80' },
  confirmedText: {
    color: '#4ade80',
    fontSize: 14,
    fontFamily: fonts.title,
    fontWeight: '700',
  },
  countdownText: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 11,
    textAlign: 'center',
  },
  guestWrap: { gap: 6 },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(67, 34, 21, 0.4)',
    borderRadius: radii.md,
    padding: 12,
  },
  timerBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  timerNum: {
    color: 'rgba(255, 241, 222, 0.5)',
    fontSize: 16,
    fontFamily: fonts.title,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center',
  },
  guestHint: {
    color: 'rgba(255, 241, 222, 0.25)',
    fontSize: 10,
    textAlign: 'center',
  },
  btnWrap: { borderRadius: radii.md, overflow: 'hidden' },
  btn: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  btnLabel: {
    flex: 1,
    color: '#fff7ea',
    fontSize: 14,
    fontFamily: fonts.title,
    fontWeight: '700',
  },
  btnTimer: {
    color: '#fff7ea',
    fontSize: 20,
    fontFamily: fonts.title,
    fontWeight: '900',
    minWidth: 28,
    textAlign: 'center',
  },
  progTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game/CountdownButton.tsx
git commit -m "feat: add CountdownButton with host/guest variant and auto-advance"
```

---

## Task 10: GameLoadingScreen + ResultsReveal Components

**Files:**
- Create: `src/components/game/GameLoadingScreen.tsx`
- Create: `src/components/game/ResultsReveal.tsx`

- [ ] **Step 1: Create GameLoadingScreen**

```typescript
// src/components/game/GameLoadingScreen.tsx
import { View, Text, Image, StyleSheet, Animated } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts } from '@/constants/theme'

const cardBack = require('../../../assets/carta.png')

export function GameLoadingScreen() {
  const { t } = useTranslation()
  return (
    <View style={styles.screen}>
      <Image source={cardBack} style={styles.cardIcon} resizeMode="contain" />
      <View style={styles.textBlock}>
        <Text style={styles.title}>{t('game.loading')}</Text>
        <Text style={styles.sub}>{t('game.loadingSub')}</Text>
      </View>
      <View style={styles.dots}>
        <View style={[styles.dot, { opacity: 0.6 }]} />
        <View style={[styles.dot, { opacity: 0.4 }]} />
        <View style={[styles.dot, { opacity: 0.2 }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0602',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  cardIcon: {
    width: 80,
    height: 120,
    opacity: 0.4,
  },
  textBlock: { alignItems: 'center', gap: 6 },
  title: {
    color: colors.gold,
    fontSize: 16,
    fontFamily: fonts.title,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sub: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(244, 192, 119, 0.5)',
  },
})
```

- [ ] **Step 2: Create ResultsReveal**

```typescript
// src/components/game/ResultsReveal.tsx
import { View, Text, Image, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii, shadows } from '@/constants/theme'

const cardBack = require('../../../assets/carta.png')

interface Props {
  cardUri?: string
  clue: string
}

export function ResultsReveal({ cardUri, clue }: Props) {
  const { t } = useTranslation()
  return (
    <View style={styles.reveal}>
      <Text style={styles.label}>{t('game.narratorCardReveal')}</Text>
      <Image
        source={cardUri ? { uri: cardUri } : cardBack}
        style={styles.card}
        resizeMode="cover"
      />
      <Text style={styles.clue}>"{clue}"</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  reveal: {
    backgroundColor: colors.surfaceDeep,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: radii.lg,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    ...shadows.surface,
  },
  label: {
    color: colors.gold,
    fontSize: 9,
    fontFamily: fonts.title,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  card: {
    width: 80,
    height: 120,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  clue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: fonts.title,
    fontStyle: 'italic',
    textAlign: 'center',
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game/GameLoadingScreen.tsx src/components/game/ResultsReveal.tsx
git commit -m "feat: add GameLoadingScreen and ResultsReveal components"
```

---

## Task 11: Update useGameStore

**Files:**
- Modify: `src/stores/useGameStore.ts`

- [ ] **Step 1: Add `myVotedCardId` and `resultsServerOffset`**

Replace the entire `useGameStore.ts`:

```typescript
import { create } from 'zustand'
import type { Round, Card } from '@/types/game'

export type MaskedCard = Omit<Card, 'player_id'> & { player_id: string | null }

interface GameState {
  round: Round | null
  cards: MaskedCard[]
  myPlayedCardId: string | null
  myVotedCardId: string | null
  // Server time offset for countdown: resultsServerNow - resultsLocalNow (ms)
  resultsServerOffset: number
  // Narrator's current step (1 = choose card, 2 = write clue) — used by game.tsx ContextStrip
  narratorStep: 1 | 2
  setRound: (r: Round) => void
  setCards: (cards: MaskedCard[]) => void
  setMyPlayedCardId: (id: string | null) => void
  setMyVotedCardId: (id: string | null) => void
  setResultsServerOffset: (offset: number) => void
  setNarratorStep: (step: 1 | 2) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  round: null,
  cards: [],
  myPlayedCardId: null,
  myVotedCardId: null,
  resultsServerOffset: 0,
  narratorStep: 1,
  setRound: (round) => set({ round }),
  setCards: (cards) => set({ cards }),
  setMyPlayedCardId: (myPlayedCardId) => set({ myPlayedCardId }),
  setMyVotedCardId: (myVotedCardId) => set({ myVotedCardId }),
  setResultsServerOffset: (resultsServerOffset) => set({ resultsServerOffset }),
  setNarratorStep: (narratorStep) => set({ narratorStep }),
  reset: () => set({ round: null, cards: [], myPlayedCardId: null, myVotedCardId: null, resultsServerOffset: 0, narratorStep: 1 }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/useGameStore.ts
git commit -m "feat: add myVotedCardId and resultsServerOffset to game store"
```

---

## Task 12: Update useRound — Capture Server Timestamp

**Files:**
- Modify: `src/hooks/useRound.ts`

- [ ] **Step 1: Extract commit_timestamp on results transition**

In `useRound.ts`, modify the Realtime subscription callback. When a round transitions to `results`, store the server timestamp offset:

```typescript
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useGameStore, type MaskedCard } from '@/stores/useGameStore'
import type { Round, Card } from '@/types/game'

export function useRound(roomId: string | undefined) {
  const { setRound, setCards, setResultsServerOffset } = useGameStore()

  async function refreshCards(roundId: string, status: string) {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('round_id', roundId)
      .eq('is_played', true)
    if (!data) return
    const cards = data as Card[]
    const masked: MaskedCard[] = cards.map((c) => ({
      ...c,
      player_id: status === 'voting' ? null : c.player_id,
    }))
    setCards(masked)
  }

  useEffect(() => {
    if (!roomId) return

    supabase
      .from('rounds')
      .select('*')
      .eq('room_id', roomId)
      .order('round_number', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const round = data as Round
          setRound(round)
          refreshCards(round.id, round.status)
        }
      })

    const sub = supabase
      .channel(`rounds:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const round = payload.new as Round
          setRound(round)
          refreshCards(round.id, round.status)

          // Capture server time offset when entering results phase
          if (round.status === 'results' && payload.commit_timestamp) {
            const serverNow = Date.parse(payload.commit_timestamp)
            const localNow = Date.now()
            setResultsServerOffset(serverNow - localNow)
          }
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        supabase
          .from('rounds')
          .select('id, status')
          .eq('room_id', roomId)
          .order('round_number', { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => {
            if (data) refreshCards(data.id, data.status)
          })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [roomId])
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useRound.ts
git commit -m "feat: capture server timestamp offset in useRound for synchronized countdown"
```

---

## Task 13: Edge Function — Set `results_started_at`

**Files:**
- Modify: `supabase/functions/game-action/index.ts`

- [ ] **Step 1: Add `results_started_at` on results transition**

Find line ~281 where the round status changes to `'results'`:

```typescript
await sb.from('rounds').update({ status: 'results' }).eq('id', round.id)
```

Replace with:

```typescript
await sb.from('rounds').update({
  status: 'results',
  results_started_at: new Date().toISOString(),
}).eq('id', round.id)
```

- [ ] **Step 2: Clear `results_started_at` on next_round**

Find in the `handleNextRound` function where the new round row is created (around line ~324). The new round insert already starts with `results_started_at: null` because the column defaults to null — no action needed there.

However, find where the *current* round is updated when the game ends (around line ~311). The `ended` status transition doesn't need the field cleared — it's `null` on new rounds already.

- [ ] **Step 3: Deploy Edge Function**

```bash
npx supabase functions deploy game-action
```

Expected: deployment succeeds.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/game-action/index.ts
git commit -m "feat: set results_started_at when round transitions to results phase"
```

---

## Task 14: Rewrite NarratorPhase

**Files:**
- Modify: `src/components/game-phases/NarratorPhase.tsx`

- [ ] **Step 1: Rewrite NarratorPhase with 2-step flow**

Replace the entire file:

```typescript
// src/components/game-phases/NarratorPhase.tsx
import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { useImageGen } from '@/hooks/useImageGen'
import { usePromptSuggest } from '@/hooks/usePromptSuggest'
import { HandGrid } from '@/components/game/HandGrid'
import { DixitCard } from '@/components/ui/DixitCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { colors, fonts, radii, shadows } from '@/constants/theme'
import type { HandSlot } from '@/components/game/HandGrid'

interface Props {
  roomCode: string
  roundNumber: number
  maxRounds: number
}

const EMPTY_SLOTS: HandSlot[] = [
  { id: 'slot-0', isSelected: false },
  { id: 'slot-1', isSelected: false },
  { id: 'slot-2', isSelected: false },
]

export function NarratorPhase({ roomCode, roundNumber, maxRounds }: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const setNarratorStep = useGameStore((s) => s.setNarratorStep)
  const { gameAction, gameActionResult, insertCard } = useGameActions()
  const { loading: generating, generate } = useImageGen()
  const { suggest } = usePromptSuggest()

  // Keep store in sync so game.tsx ContextStrip shows the correct step pill
  const [step, setStep] = useState<1 | 2>(1)
  function goToStep(s: 1 | 2) { setStep(s); setNarratorStep(s) }
  const [slots, setSlots] = useState<HandSlot[]>(EMPTY_SLOTS)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(0)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null)
  const [clue, setClue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedIndex = slots.findIndex((s) => s.isSelected)
  const hasSelection = selectedIndex !== -1

  async function handleGenerate(index: number, prompt: string) {
    if (!round || !userId) return
    const result = await generate({ prompt, scope: 'round', roomCode, roundId: round.id })
    if (!result?.imageUrl) return
    const cardId = await insertCard(round.id, userId, result.imageUrl, result.brief ?? prompt)
    if (!cardId) return
    setSlots((prev) =>
      prev.map((s, i) => i === index ? { ...s, id: cardId, imageUri: result.imageUrl } : s),
    )
    // Auto-select if nothing selected yet
    if (!hasSelection) {
      setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
      setSelectedCardId(cardId)
      setSelectedImageUri(result.imageUrl)
    }
    setActiveSlotIndex(null)
  }

  async function handleSuggest(_index: number): Promise<string> {
    const suggested = await suggest()
    return suggested ?? ''
  }

  function handleSelect(index: number) {
    const slot = slots[index]
    if (!slot?.imageUri) return
    setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
    setSelectedCardId(slot.id)
    setSelectedImageUri(slot.imageUri)
  }

  async function handleSubmit() {
    if (!selectedCardId || !clue.trim()) return
    setSubmitting(true)
    await gameAction(roomCode, 'submit_clue', { clue: clue.trim(), card_id: selectedCardId })
    setSubmitting(false)
  }

  if (step === 2 && selectedImageUri) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.cardPreview}>
          <Text style={styles.cardPreviewLabel}>{t('game.chosenCard')}</Text>
          <View style={styles.cardPreviewWrap}>
            <DixitCard uri={selectedImageUri} />
          </View>
        </View>

        <View style={styles.clueInputCard}>
          <Text style={styles.clueInputLabel}>{t('game.writeYourClue')}</Text>
          <Input
            value={clue}
            onChangeText={setClue}
            placeholder={t('game.cluePlaceholder')}
            maxLength={100}
          />
          <Text style={styles.clueHint}>{t('game.clueHint')}</Text>
        </View>

        <View style={styles.actions}>
          <Button onPress={handleSubmit} loading={submitting} disabled={!clue.trim()}>
            {t('game.sendClueAndCard')}
          </Button>
          <Button onPress={() => goToStep(1)} variant="ghost">
            {t('game.changeCard')}
          </Button>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <HandGrid
        slots={slots}
        activeSlotIndex={activeSlotIndex}
        onSlotPress={setActiveSlotIndex}
        onSelect={handleSelect}
        onGenerate={handleGenerate}
        onSuggestPrompt={handleSuggest}
        generating={generating}
      />
      <Button
        onPress={() => goToStep(2)}
        disabled={!hasSelection}
      >
        {t('game.nextWriteClue')}
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 16 },
  cardPreview: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.2)',
    borderRadius: radii.md,
    padding: 14,
  },
  cardPreviewLabel: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardPreviewWrap: { width: '45%' },
  clueInputCard: {
    gap: 10,
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.35)',
    borderRadius: radii.md,
    padding: 14,
  },
  clueInputLabel: {
    color: colors.gold,
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  clueHint: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 11,
    lineHeight: 16,
  },
  actions: { gap: 10 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game-phases/NarratorPhase.tsx
git commit -m "feat: rewrite NarratorPhase with 2-step flow and HandGrid"
```

---

## Task 15: Rewrite PlayersPhase

**Files:**
- Modify: `src/components/game-phases/PlayersPhase.tsx`

- [ ] **Step 1: Rewrite PlayersPhase**

Replace the entire file:

```typescript
// src/components/game-phases/PlayersPhase.tsx
import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { useImageGen } from '@/hooks/useImageGen'
import { usePromptSuggest } from '@/hooks/usePromptSuggest'
import { HandGrid } from '@/components/game/HandGrid'
import { ClueHero } from '@/components/game/ClueHero'
import { WaitingCard } from '@/components/game/WaitingCard'
import { Button } from '@/components/ui/Button'
import type { HandSlot } from '@/components/game/HandGrid'
import type { RoomPlayer } from '@/types/game'

interface Props {
  roomCode: string
  narratorName: string
  narratorAvatar?: string
  isNarrator: boolean
  players: RoomPlayer[]          // non-narrator players
  submittedPlayerIds: string[]
  roundNumber: number
  maxRounds: number
}

const EMPTY_SLOTS: HandSlot[] = [
  { id: 'slot-0', isSelected: false },
  { id: 'slot-1', isSelected: false },
  { id: 'slot-2', isSelected: false },
]

export function PlayersPhase({
  roomCode,
  narratorName,
  narratorAvatar,
  isNarrator,
  players,
  submittedPlayerIds,
}: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const round = useGameStore((s) => s.round)
  const myPlayedCardId = useGameStore((s) => s.myPlayedCardId)
  const setMyPlayedCardId = useGameStore((s) => s.setMyPlayedCardId)
  const { gameAction, insertCard } = useGameActions()
  const { loading: generating, generate } = useImageGen()
  const { suggest } = usePromptSuggest()

  const [slots, setSlots] = useState<HandSlot[]>(EMPTY_SLOTS)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(0)
  const [submitting, setSubmitting] = useState(false)

  const selectedSlot = slots.find((s) => s.isSelected)
  const clue = round?.clue ?? undefined

  async function handleGenerate(index: number, prompt: string) {
    if (!round || !userId) return
    const result = await generate({ prompt, scope: 'round', roomCode, roundId: round.id })
    if (!result?.imageUrl) return
    const cardId = await insertCard(round.id, userId, result.imageUrl, result.brief ?? prompt)
    if (!cardId) return
    setSlots((prev) =>
      prev.map((s, i) => i === index ? { ...s, id: cardId, imageUri: result.imageUrl } : s),
    )
    if (!slots.some((s) => s.isSelected)) {
      setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
    }
    setActiveSlotIndex(null)
  }

  async function handleSuggest(_index: number): Promise<string> {
    return (await suggest()) ?? ''
  }

  function handleSelect(index: number) {
    setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
  }

  async function handleSubmit() {
    if (!selectedSlot?.id || !selectedSlot.imageUri) return
    setSubmitting(true)
    const ok = await gameAction(roomCode, 'submit_card', { card_id: selectedSlot.id })
    if (ok) setMyPlayedCardId(selectedSlot.id)
    setSubmitting(false)
  }

  const hasSubmitted = isNarrator || !!myPlayedCardId
  const submittedCount = submittedPlayerIds.length

  if (hasSubmitted) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {clue && <ClueHero clue={clue} />}
        <WaitingCard
          narratorName={narratorName}
          narratorAvatar={narratorAvatar}
          clue={clue}
          submittedCount={submittedCount}
          expectedCount={players.length}
          isCurrentUserNarrator={isNarrator}
          currentUserId={userId ?? ''}
          submittedPlayerIds={submittedPlayerIds}
          contextMessage={t('game.waitingForPlayers')}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {clue && <ClueHero clue={clue} />}
      <HandGrid
        slots={slots}
        activeSlotIndex={activeSlotIndex}
        onSlotPress={setActiveSlotIndex}
        onSelect={handleSelect}
        onGenerate={handleGenerate}
        onSuggestPrompt={handleSuggest}
        generating={generating}
      />
      <Button
        onPress={handleSubmit}
        loading={submitting}
        disabled={!selectedSlot?.imageUri}
      >
        {t('game.playThisCard')}
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game-phases/PlayersPhase.tsx
git commit -m "feat: rewrite PlayersPhase with HandGrid and WaitingCard"
```

---

## Task 16: Rewrite VotingPhase

**Files:**
- Modify: `src/components/game-phases/VotingPhase.tsx`

- [ ] **Step 1: Rewrite VotingPhase**

Replace the entire file:

```typescript
// src/components/game-phases/VotingPhase.tsx
import { useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { CardGrid } from '@/components/game/CardGrid'
import { ClueHero } from '@/components/game/ClueHero'
import { WaitingCard } from '@/components/game/WaitingCard'
import { Button } from '@/components/ui/Button'
import type { RoomPlayer } from '@/types/game'

interface Props {
  roomCode: string
  isNarrator: boolean
  narratorName: string
  narratorAvatar?: string
  players: RoomPlayer[]           // non-narrator players
  votedPlayerIds: string[]
}

export function VotingPhase({
  roomCode,
  isNarrator,
  narratorName,
  narratorAvatar,
  players,
  votedPlayerIds,
}: Props) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const cards = useGameStore((s) => s.cards)
  const myVotedCardId = useGameStore((s) => s.myVotedCardId)
  const setMyVotedCardId = useGameStore((s) => s.setMyVotedCardId)
  const { gameAction } = useGameActions()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const clue = useGameStore((s) => s.round?.clue) ?? undefined
  const hasVoted = isNarrator || !!myVotedCardId
  const votableCards = cards.filter((c) => c.player_id !== userId)

  async function handleVote() {
    if (!selectedId) return
    setSubmitting(true)
    const ok = await gameAction(roomCode, 'submit_vote', { card_id: selectedId })
    if (ok) setMyVotedCardId(selectedId)
    setSubmitting(false)
  }

  if (hasVoted) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {clue && <ClueHero clue={clue} />}
        <WaitingCard
          narratorName={narratorName}
          narratorAvatar={narratorAvatar}
          clue={clue}
          submittedCount={votedPlayerIds.length}
          expectedCount={players.length}
          isCurrentUserNarrator={isNarrator}
          currentUserId={userId ?? ''}
          submittedPlayerIds={votedPlayerIds}
          contextMessage={t('game.waitingForVotes')}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {clue && <ClueHero clue={clue} />}
      <CardGrid
        cards={votableCards}
        selectedId={selectedId}
        onSelect={(c) => setSelectedId(c.id)}
      />
      <Button onPress={handleVote} loading={submitting} disabled={!selectedId}>
        {t('game.vote')}
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/components/game-phases/VotingPhase.tsx
git commit -m "feat: rewrite VotingPhase with ClueHero and WaitingCard"
```

---

## Task 17: Rewrite ResultsPhase

**Files:**
- Modify: `src/components/game-phases/ResultsPhase.tsx`

- [ ] **Step 1: Rewrite ResultsPhase**

Replace the entire file:

```typescript
// src/components/game-phases/ResultsPhase.tsx
import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { useGameStore } from '@/stores/useGameStore'
import { useGameActions } from '@/hooks/useGameActions'
import { ResultsReveal } from '@/components/game/ResultsReveal'
import { CardGrid } from '@/components/game/CardGrid'
import { CountdownButton } from '@/components/game/CountdownButton'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { colors, fonts, radii } from '@/constants/theme'
import type { RoomPlayer, RoundScore } from '@/types/game'

const COUNTDOWN_SECONDS = 10

interface Props {
  roomCode: string
  isHost: boolean
  isLastRound: boolean
  players: RoomPlayer[]
  roundScores?: RoundScore[]
}

export function ResultsPhase({ roomCode, isHost, isLastRound, players, roundScores = [] }: Props) {
  const { t } = useTranslation()
  const router = useRouter()
  const cards = useGameStore((s) => s.cards)
  const round = useGameStore((s) => s.round)
  const resultsServerOffset = useGameStore((s) => s.resultsServerOffset)
  const { gameAction } = useGameActions()
  const [confirmed, setConfirmed] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_SECONDS)
  const hasAdvanced = useRef(false)  // prevents double-advance (manual confirm + auto-advance)

  // Compute countdown from server-relative time
  useEffect(() => {
    if (!round?.results_started_at) return
    const startedAt = Date.parse(round.results_started_at)

    const tick = () => {
      const serverNow = Date.now() + resultsServerOffset
      const elapsed = (serverNow - startedAt) / 1000
      const remaining = Math.max(0, COUNTDOWN_SECONDS - elapsed)
      setSecondsRemaining(remaining)
    }

    tick()
    const interval = setInterval(tick, 250)
    return () => clearInterval(interval)
  }, [round?.results_started_at, resultsServerOffset])

  async function handleAdvance() {
    if (hasAdvanced.current) return  // guard against double-advance
    hasAdvanced.current = true
    setAdvancing(true)
    if (isLastRound) {
      // Navigate to end-of-game screen (no next_round action needed — game is over)
      router.replace(`/room/${roomCode}/ended`)
    } else {
      await gameAction(roomCode, 'next_round')
    }
    setAdvancing(false)
  }

  async function handleConfirm() {
    setConfirmed(true)
    if (isHost) await handleAdvance()
  }

  const narratorCard = round ? cards.find((c) => c.player_id === round.narrator_id) : null
  const playerNames = Object.fromEntries(players.map((p) => [p.player_id, p.display_name]))

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {narratorCard && round?.clue && (
        <ResultsReveal cardUri={narratorCard.image_url} clue={round.clue} />
      )}

      <CardGrid
        cards={cards}
        playerNames={playerNames}
        narratorPlayerId={round?.narrator_id}
        readonly
      />

      <View style={styles.scoreSection}>
        <Text style={styles.scoreLabel}>{t('game.score')}</Text>
        <ScoreBoard players={players} roundScores={roundScores} />
      </View>

      <CountdownButton
        secondsRemaining={secondsRemaining}
        totalSeconds={COUNTDOWN_SECONDS}
        isHost={isHost}
        confirmed={confirmed}
        confirmedCount={confirmed ? 1 : 0}
        totalCount={players.length}
        isLastRound={isLastRound}
        onConfirm={handleConfirm}
        onAutoAdvance={isHost ? handleAdvance : () => {}}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14, gap: 16 },
  scoreSection: { gap: 8 },
  scoreLabel: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 10,
    fontFamily: fonts.title,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
})
```

- [ ] **Step 2: Update CardGrid to support narrator highlight**

Replace the entire `src/components/game/CardGrid.tsx` with:

```typescript
import { useCallback } from 'react'
import { FlatList, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { MaskedCard } from '@/stores/useGameStore'
import { colors, radii, shadows, fonts } from '@/constants/theme'

interface CardGridProps {
  cards: MaskedCard[]
  selectedId?: string | null
  onSelect?: (card: MaskedCard) => void
  playerNames?: Record<string, string>
  narratorPlayerId?: string   // highlights narrator's card with gold border + badge
  readonly?: boolean
}

export function CardGrid({
  cards,
  selectedId,
  onSelect,
  playerNames,
  narratorPlayerId,
  readonly = false,
}: CardGridProps) {
  const { t } = useTranslation()
  return (
    <FlatList
      data={cards}
      keyExtractor={(c) => c.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedId
        const isNarrator = !!narratorPlayerId && item.player_id === narratorPlayerId
        return (
          <TouchableOpacity
            style={[
              styles.cardWrap,
              isSelected && styles.cardWrapSelected,
              isNarrator && styles.cardWrapNarrator,
            ]}
            onPress={() => !readonly && onSelect?.(item)}
            disabled={readonly}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
            {isNarrator && (
              <View style={styles.narratorBadge}>
                <Text style={styles.narratorBadgeText}>{t('game.narratorBadge')}</Text>
              </View>
            )}
            {playerNames && item.player_id && !isNarrator && (
              <View style={styles.nameBadge}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {playerNames[item.player_id] ?? '?'}
                </Text>
              </View>
            )}
            {isSelected && <View style={styles.selectedRing} />}
          </TouchableOpacity>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  row: { gap: 12 },
  content: { gap: 12, padding: 16 },
  cardWrap: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    aspectRatio: 2 / 3,
    backgroundColor: colors.surfaceDeep,
    ...shadows.card,
  },
  cardWrapSelected: {
    borderColor: colors.goldLight,
    borderWidth: 3,
    transform: [{ scale: 1.03 }],
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  cardWrapNarrator: {
    borderColor: colors.gold,
    borderWidth: 3,
    shadowColor: colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  narratorBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(230, 184, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  narratorBadgeText: {
    color: '#0a0602',
    fontSize: 10,
    fontFamily: fonts.title,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  nameBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,6,2,0.82)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.goldBorder,
  },
  nameText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md - 2,
    borderWidth: 2,
    borderColor: 'rgba(251,176,36,0.35)',
  },
})
```

- [ ] **Step 3: Commit**

```bash
git add src/components/game-phases/ResultsPhase.tsx src/components/game/CardGrid.tsx
git commit -m "feat: rewrite ResultsPhase with ResultsReveal, CountdownButton, CardGrid narrator highlight"
```

---

## Task 18: Update game.tsx Orchestrator

**Files:**
- Modify: `app/room/[code]/game.tsx`
- Delete: `src/components/game/RoundStatus.tsx`

- [ ] **Step 1: Rewrite game.tsx**

Replace the entire file:

```typescript
// app/room/[code]/game.tsx
import { useMemo } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { useRoom } from '@/hooks/useRoom'
import { useRound } from '@/hooks/useRound'
import { useGameStore } from '@/stores/useGameStore'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { NarratorPhase } from '@/components/game-phases/NarratorPhase'
import { PlayersPhase } from '@/components/game-phases/PlayersPhase'
import { VotingPhase } from '@/components/game-phases/VotingPhase'
import { ResultsPhase } from '@/components/game-phases/ResultsPhase'
import { ContextStrip } from '@/components/game/ContextStrip'
import { WaitingCard } from '@/components/game/WaitingCard'
import { GameLoadingScreen } from '@/components/game/GameLoadingScreen'
import { GameLayout } from '@/components/layout/GameLayout'

export default function GameScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { t } = useTranslation()
  const { room, players } = useRoom(code ?? null)
  const { userId } = useAuth()

  useRound(room?.id)

  // All store reads MUST be before any early return (React rules of hooks)
  const round = useGameStore((s) => s.round)
  const cards = useGameStore((s) => s.cards)
  const narratorStep = useGameStore((s) => s.narratorStep)

  if (!round || !room || !userId || !code) {
    return <GameLoadingScreen />
  }

  const isNarrator = round.narrator_id === userId
  const isHost = room.host_id === userId
  const isLastRound = round.round_number === room.max_rounds
  const status = round.status

  const narratorPlayer = useMemo(
    () => players.find((p) => p.player_id === round.narrator_id),
    [players, round.narrator_id],
  )
  const narratorName = narratorPlayer?.display_name ?? t('game.narrator')
  // RoomPlayer has no avatar_url — pass undefined; WaitingCard/phases show initials fallback
  const narratorAvatar: string | undefined = undefined

  const nonNarratorPlayers = useMemo(
    () => players.filter((p) => p.player_id !== round.narrator_id),
    [players, round.narrator_id],
  )

  // Phase labels for ContextStrip
  const phaseLabels: Record<string, string> = {
    narrator_turn: t('game.phaseNarrator'),
    players_turn: t('game.phaseChoose'),
    voting: t('game.phaseVote'),
    results: t('game.phaseResults'),
  }

  // Submitted player IDs (derived from cards store — live via Realtime)
  const submittedPlayerIds = cards
    .filter((c) => c.player_id !== null && c.player_id !== round.narrator_id)
    .map((c) => c.player_id as string)

  // ContextStrip step pill: shown only for narrator during narrator_turn
  const showStep = status === 'narrator_turn' && isNarrator
  const stepCurrent = showStep ? narratorStep : undefined
  const stepTotal = showStep ? 2 : undefined

  return (
    <GameLayout>
      <ContextStrip
        roundNumber={round.round_number}
        maxRounds={room.max_rounds}
        phaseLabel={phaseLabels[status] ?? status}
        stepCurrent={stepCurrent}
        stepTotal={stepTotal}
      />

      {status === 'narrator_turn' &&
        (isNarrator ? (
          <NarratorPhase
            roomCode={code}
            roundNumber={round.round_number}
            maxRounds={room.max_rounds}
          />
        ) : (
          // Non-narrator players wait during narrator_turn — show WaitingCard directly
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <WaitingCard
              narratorName={narratorName}
              narratorAvatar={narratorAvatar}
              clue={undefined}
              submittedCount={0}
              expectedCount={nonNarratorPlayers.length}
              isCurrentUserNarrator={false}
              currentUserId={userId}
              submittedPlayerIds={[]}
              contextMessage={t('game.waitingForNarrator')}
            />
          </ScrollView>
        ))}

      {status === 'players_turn' && (
        <PlayersPhase
          roomCode={code}
          narratorName={narratorName}
          narratorAvatar={narratorAvatar}
          isNarrator={isNarrator}
          players={nonNarratorPlayers}
          submittedPlayerIds={submittedPlayerIds}
          roundNumber={round.round_number}
          maxRounds={room.max_rounds}
        />
      )}

      {status === 'voting' && (
        <VotingPhase
          roomCode={code}
          isNarrator={isNarrator}
          narratorName={narratorName}
          narratorAvatar={narratorAvatar}
          players={nonNarratorPlayers}
          // During voting, cards are masked (player_id: null) so we can't derive voted IDs
          // from cards. Pass empty array — WaitingCard dots show 0/N (known v1 limitation).
          // The voting phase transitions server-side when all votes are received.
          votedPlayerIds={[]}
        />
      )}

      {status === 'results' && (
        <ResultsPhase
          roomCode={code}
          isHost={isHost}
          isLastRound={isLastRound}
          players={players}
        />
      )}
    </GameLayout>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 14 },
})
```

- [ ] **Step 2: Delete RoundStatus**

```bash
rm src/components/game/RoundStatus.tsx
```

Check for any remaining imports of `RoundStatus`:
```bash
grep -r "RoundStatus" src/ app/
```

Fix any remaining imports (there should be none after game.tsx update).

- [ ] **Step 3: Commit**

```bash
git add app/room/[code]/game.tsx
git rm src/components/game/RoundStatus.tsx
git commit -m "feat: update game.tsx orchestrator — ContextStrip, GameLoadingScreen, narrator resolved"
```

---

## Task 19: Wire Submitted/Voted Counts via Realtime

**Files:**
- Modify: `src/stores/useGameStore.ts`

The current approach derives `submittedPlayerIds` from cards in game.tsx, but cards are only fetched on phase transitions (via `refreshCards`). For the progress dots to update live without phase transitions, we need to listen to individual card inserts.

- [ ] **Step 1: Verify cards update live**

The current `useRound.ts` already subscribes to `cards` table changes via `postgres_changes`. When a player inserts a card (`submit_card` action calls `insertCard`), the Realtime subscription fires and calls `refreshCards`. This means `cards` in the store will update as players submit, so `submittedPlayerIds` in game.tsx will be derived correctly from the live store.

Test this: during `players_turn`, submit a card from one device and verify the WaitingCard progress dot updates on another device without a phase change.

**If dots don't update:** the issue is that `refreshCards` masks `player_id` during voting, but during `players_turn` the player_id is available. Verify that `refreshCards` is being called with `status === 'players_turn'` (not `'voting'`) and that the store update triggers a re-render. No code change needed if it works.

- [ ] **Step 2: Commit (only if changes made)**

```bash
git add -p
git commit -m "fix: ensure submitted player ids update live in game store"
```

---

## Task 20: Final Smoke Test

- [ ] **Step 1: Start the app**

```bash
npx expo start
```

- [ ] **Step 2: Create a room and run a full round**

Test the following flow:
1. Player A creates room → becomes narrator in round 1
2. Player B joins
3. Narrator sees `GameLoadingScreen` briefly, then `NarratorPhase` with ContextStrip showing "Paso 1/2" area (or the HandGrid directly)
4. Narrator generates at least 1 card from HandGrid, selects it, presses "Siguiente: escribir pista →"
5. Narrator writes a clue, presses "Enviar pista y carta →"
6. Players see `PlayersPhase` with ClueHero showing the clue
7. Players generate a hand and select a card; progress dot updates on other devices
8. After all players submit → `VotingPhase` appears
9. Players vote; WaitingCard shows after voting
10. `ResultsPhase` shows big narrator reveal + countdown
11. After 10s (or host confirms), round advances or game ends

- [ ] **Step 3: Check card backs**

In VotingPhase, before voting, all cards show `carta.png` as the back (cards are masked). Verify the image loads.

- [ ] **Step 4: Commit any fixes found during smoke test**

```bash
git add -p
git commit -m "fix: smoke test fixes"
```
