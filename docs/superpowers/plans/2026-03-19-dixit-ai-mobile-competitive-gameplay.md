# Dixit AI Mobile Competitive Gameplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a readable competitive layer to match play with intuition tokens, tactical actions, richer round summaries, controlled leader challenges, and ranked progression while keeping the base Dixit flow understandable from the first match.

**Architecture:** Implement this in three shippable phases. Phase 1 adds deterministic in-match tactics, persisted round summaries, and guided UI. Phase 2 adds direct interaction (`Challenge the Leader`) on top of the same summary/scoring pipeline. Phase 3 adds competitive progression (`CP`, divisions, provisional matches, stats) and post-match surfacing. Keep the client thin: authoritative state and scoring stay in Supabase, while Expo screens read hydrated round state and submit one-shot actions with explicit tactical flags.

**Tech Stack:** Expo SDK 55, TypeScript, Zustand, Jest + ts-jest, Supabase Postgres/Realtime/Edge Functions, Supabase MCP, i18next

**Spec:** `docs/superpowers/specs/2026-03-19-dixit-ai-mobile-competitive-gameplay-design.md`

---

## Scope Strategy

This spec spans three tightly related but still separable subsystems:

1. in-match tactical layer
2. controlled interaction layer
3. ranked progression/meta layer

This plan keeps them in one document because each later phase depends on the persisted round summary and action contract introduced in Phase 1. Each phase remains independently testable and shippable.

---

## File Map

```text
dixit_ai_mobile/
├── __tests__/
│   └── competitive/
│       ├── roundSummary.test.ts              # Round summary builder and result explanations
│       ├── tacticalScoring.test.ts           # Intuition/tactical bonus rules
│       ├── challengeLeader.test.ts           # Leader challenge rule coverage
│       ├── competitiveProgress.test.ts       # CP/division/provisional calculations
│       └── useRoundHydration.test.ts         # Client store hydration contract
├── app/
│   ├── room/[code]/game.tsx                  # Passes new round summary and tactical state to phases
│   └── (tabs)/profile.tsx                    # Later surfaces ranked stats/division
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── RoundStatus.tsx               # Token counter + phase guidance
│   │   │   ├── ScoreBoard.tsx                # Round delta + leaderboard movement
│   │   │   ├── RoundResolutionFeed.tsx       # Results explanation feed
│   │   │   ├── TacticalActionCard.tsx        # Shared UI for optional tactical choices
│   │   │   └── CompetitiveSummaryCard.tsx    # Post-match CP/division summary
│   │   └── game-phases/
│   │       ├── NarratorPhase.tsx             # Subtle Bet + guided copy
│   │       ├── PlayersPhase.tsx              # Trap Card + guided copy
│   │       ├── VotingPhase.tsx               # Firm Read + valid votable set
│   │       └── ResultsPhase.tsx              # Consumes persisted round summary
│   ├── hooks/
│   │   ├── useRound.ts                       # Hydrates round summary + myPlayedCardId
│   │   ├── useGameActions.ts                 # Typed tactical payload helpers
│   │   └── useProfile.ts                     # Later loads competitive profile
│   ├── lib/
│   │   ├── api.ts                            # Typed tactical action/result payloads
│   │   └── competitive/
│   │       ├── roundSummary.ts               # Client-safe summary helpers
│   │       └── competitiveProgress.ts        # CP/division derivation helpers
│   ├── stores/
│   │   └── useGameStore.ts                   # Stores round summary + played card id
│   ├── i18n/locales/
│   │   ├── es.json                           # Tactical labels, guidance, competitive summaries
│   │   └── en.json
│   └── types/
│       └── game.ts                           # Generated DB types + client summary types
└── supabase/
    ├── migrations/
    │   ├── 20260319193000_competitive_phase_1.sql
    │   ├── 20260319194000_competitive_phase_2.sql
    │   └── 20260319195000_competitive_phase_3.sql
    └── functions/
        └── game-action/
            ├── index.ts                      # Action parsing + orchestration
            ├── scoring.ts                    # Base + tactical round scoring
            ├── tacticalRules.ts              # Subtle Bet / Trap Card / Firm Read helpers
            ├── challengeLeader.ts            # Challenge resolution
            ├── roundSummary.ts               # Persisted summary builder
            └── ranked.ts                     # CP/division/provisional helpers
```

---

## Phase 1 - Tactical Match Layer
*Testable milestone: intuition tokens, Subtle Bet, Trap Card, Firm Read, valid voting constraints, and persisted round summaries work end-to-end without ranked progression yet.*

### Task 1: Lock down pure tactical scoring and summary rules with failing tests

**Files:**
- Create: `__tests__/competitive/tacticalScoring.test.ts`
- Create: `__tests__/competitive/roundSummary.test.ts`
- Create: `supabase/functions/game-action/tacticalRules.ts`
- Create: `supabase/functions/game-action/roundSummary.ts`
- Modify: `supabase/functions/game-action/scoring.ts`

- [ ] **Step 1: Write the failing tactical scoring tests**

```typescript
import { calculateScores } from '../supabase/functions/game-action/scoring'

test('subtle bet succeeds when some but not all active voters find the narrator', () => {
  const scores = calculateScores({
    narratorId: 'narrator',
    players: ['narrator', 'p1', 'p2', 'p3'],
    activePlayers: ['narrator', 'p1', 'p2', 'p3'],
    votes: [
      { voter_id: 'p1', card_id: 'narrator-card', tactical_action: null },
      { voter_id: 'p2', card_id: 'p3-card', tactical_action: null },
      { voter_id: 'p3', card_id: 'narrator-card', tactical_action: null },
    ],
    playedCards: [
      { id: 'narrator-card', player_id: 'narrator', tactical_action: 'subtle_bet' },
      { id: 'p1-card', player_id: 'p1', tactical_action: null },
      { id: 'p2-card', player_id: 'p2', tactical_action: null },
      { id: 'p3-card', player_id: 'p3', tactical_action: 'trap_card' },
    ],
  })

  expect(scores).toContainEqual(
    expect.objectContaining({ player_id: 'narrator', reason: 'balanced_clue_bonus', points: 1 }),
  )
})
```

- [ ] **Step 2: Write the failing round summary tests**

```typescript
import { buildRoundResolutionSummary } from '../supabase/functions/game-action/roundSummary'

test('buildRoundResolutionSummary tracks deception events and leaderboard movement', () => {
  const summary = buildRoundResolutionSummary({
    roundId: 'round-1',
    narratorId: 'narrator',
    narratorCardId: 'card-n',
    clue: 'moonlight',
    votes: [
      { voter_id: 'p1', card_id: 'card-x' },
      { voter_id: 'p2', card_id: 'card-n' },
      { voter_id: 'p3', card_id: 'card-x' },
    ],
    playedCards: [
      { id: 'card-n', player_id: 'narrator', tactical_action: 'subtle_bet' },
      { id: 'card-x', player_id: 'p4', tactical_action: 'trap_card' },
    ],
    scoreEntries: [
      { player_id: 'p4', reason: 'trap_card_bonus', points: 1 },
    ],
    scoresBefore: { narrator: 6, p4: 4 },
    scoresAfter: { narrator: 9, p4: 6 },
  })

  expect(summary.deceptionEvents).toHaveLength(2)
  expect(summary.tacticalEvents).toContainEqual(
    expect.objectContaining({ playerId: 'p4', type: 'trap_card', success: true }),
  )
})
```

- [ ] **Step 3: Run the targeted tests to verify they fail**

Run: `npx jest --runInBand __tests__/competitive/tacticalScoring.test.ts __tests__/competitive/roundSummary.test.ts`

Expected: FAIL with missing modules or signature mismatches.

- [ ] **Step 4: Implement the pure tactical rule helpers**

```typescript
export function getEligibleVoterCount(activePlayers: string[], narratorId: string) {
  return activePlayers.filter((playerId) => playerId !== narratorId).length
}

export function subtleBetSucceeded(correctVotes: number, eligibleVoters: number) {
  if (eligibleVoters <= 0) return false
  if (correctVotes === 0 || correctVotes === eligibleVoters) return false
  return (
    correctVotes >= Math.ceil(eligibleVoters / 3) &&
    correctVotes <= Math.floor((eligibleVoters * 2) / 3)
  )
}
```

- [ ] **Step 5: Extend `calculateScores` minimally to emit tactical reasons**

```typescript
if (playedNarratorCard.tactical_action === 'subtle_bet' && subtleBetSucceeded(correctVoters.length, eligibleVoters)) {
  entries.push({ player_id: narratorId, points: 1, reason: 'balanced_clue_bonus' })
}
```

- [ ] **Step 6: Implement the summary builder**

```typescript
export function buildRoundResolutionSummary(input: RoundResolutionSummaryInput): RoundResolutionSummary {
  return {
    roundId: input.roundId,
    narratorId: input.narratorId,
    narratorCardId: input.narratorCardId,
    clue: input.clue,
    correctVoterIds: input.votes.filter((vote) => vote.card_id === input.narratorCardId).map((vote) => vote.voter_id),
    deceptionEvents: buildDeceptionEvents(input),
    tacticalEvents: buildTacticalEvents(input),
    leaderboardDeltas: buildLeaderboardDeltas(input.scoresBefore, input.scoresAfter),
  }
}
```

- [ ] **Step 7: Run the targeted tests until they pass**

Run: `npx jest --runInBand __tests__/competitive/tacticalScoring.test.ts __tests__/competitive/roundSummary.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add __tests__/competitive/tacticalScoring.test.ts __tests__/competitive/roundSummary.test.ts supabase/functions/game-action/tacticalRules.ts supabase/functions/game-action/scoring.ts supabase/functions/game-action/roundSummary.ts
git commit -m "test: lock tactical scoring and round summary rules"
```

---

### Task 2: Add phase-1 schema for intuition tokens and persisted round summaries

**Files:**
- Create: `supabase/migrations/20260319193000_competitive_phase_1.sql`
- Modify: `src/types/game.ts`

- [ ] **Step 1: Write the migration file**

```sql
alter table public.room_players
  add column if not exists intuition_tokens integer not null default 0,
  add column if not exists challenge_leader_used boolean not null default false;

create table if not exists public.round_resolution_summaries (
  round_id uuid primary key references public.rounds(id) on delete cascade,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.cards
  add column if not exists tactical_action text check (tactical_action in ('subtle_bet', 'trap_card')),
  add column if not exists challenge_leader boolean not null default false;

alter table public.votes
  add column if not exists tactical_action text check (tactical_action in ('firm_read')),
  add column if not exists spent_intuition_token boolean not null default false,
  add column if not exists challenge_leader boolean not null default false;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use project `ctjelsuchvzvdjvqdzub`.

Expected: migration succeeds and new columns/tables exist remotely.

- [ ] **Step 3: Regenerate local TypeScript types**

Expected: `src/types/game.ts` contains `intuition_tokens`, `challenge_leader_used`, `round_resolution_summaries`, and tactical columns.

- [ ] **Step 4: Verify the generated types**

Run: `rg -n "intuition_tokens|round_resolution_summaries|challenge_leader_used|tactical_action" src/types/game.ts`

Expected: all new fields are present.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260319193000_competitive_phase_1.sql src/types/game.ts
git commit -m "feat: add competitive phase 1 schema and types"
```

---

### Task 3: Thread tactical fields through `game-action` and persist round summaries

**Files:**
- Modify: `supabase/functions/game-action/index.ts`
- Modify: `supabase/functions/game-action/scoring.ts`
- Modify: `supabase/functions/game-action/roundSummary.ts`
- Modify: `src/lib/api.ts`
- Modify: `src/hooks/useGameActions.ts`
- Test: `__tests__/competitive/tacticalScoring.test.ts`

- [ ] **Step 1: Add failing tests for inline tactical payload parsing**

```typescript
test('submit_vote rejects firm read without available intuition token', async () => {
  // extracted helper or harness should return NO_INTUITION_TOKENS
})

test('submit_clue stores subtle_bet on narrator card and later includes it in the summary', async () => {
  // extracted mapper should preserve tactical_action
})

test('successful tactical play awards intuition tokens back to room_players', async () => {
  // extracted resolution helper should return positive intuition deltas for winners
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest --runInBand __tests__/competitive/tacticalScoring.test.ts`

Expected: FAIL because payload parsing and token spending logic do not exist.

- [ ] **Step 3: Extend action payload types in the client API**

```typescript
type SubmitVotePayload = {
  card_id: string
  tactical_action?: 'firm_read' | null
  spend_intuition_token?: boolean
  challenge_leader?: boolean
}
```

- [ ] **Step 4: Persist tactical intent in `handleSubmitClue`, `handleSubmitCard`, and `handleSubmitVote`**

```typescript
await sb.from('cards').update({
  is_played: true,
  tactical_action: p.tactical_action ?? null,
  challenge_leader: !!p.challenge_leader,
}).eq('id', p.card_id)
```

- [ ] **Step 5: Spend intuition tokens only when required**

```typescript
if (p.tactical_action === 'firm_read') {
  const roomPlayer = await getRoomPlayer(sb, room.id, userId)
  if ((roomPlayer?.intuition_tokens ?? 0) <= 0) {
    return errorResponse('NO_INTUITION_TOKENS', 'No intuition tokens left')
  }
  await sb.from('room_players')
    .update({ intuition_tokens: roomPlayer.intuition_tokens - 1 })
    .eq('room_id', room.id)
    .eq('player_id', userId)
}
```

- [ ] **Step 6: Award intuition tokens from successful tactical outcomes during round resolution**

```typescript
for (const event of summary.tacticalEvents) {
  if (event.intuitionDelta !== 0) {
    await incrementIntuitionTokens(sb, room.id, event.playerId, event.intuitionDelta)
  }
}
```

- [ ] **Step 7: Persist `round_resolution_summaries` when the last vote arrives**

```typescript
await sb.from('round_resolution_summaries').upsert({
  round_id: round.id,
  summary,
})
```

- [ ] **Step 8: Run tactical tests again**

Run: `npx jest --runInBand __tests__/competitive/tacticalScoring.test.ts __tests__/competitive/roundSummary.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/game-action/index.ts supabase/functions/game-action/scoring.ts supabase/functions/game-action/roundSummary.ts src/lib/api.ts src/hooks/useGameActions.ts __tests__/competitive/tacticalScoring.test.ts
git commit -m "feat: wire tactical actions through game-action"
```

---

### Task 4: Hydrate `myPlayedCardId` and `roundResolutionSummary` into the client store

**Files:**
- Create: `__tests__/competitive/useRoundHydration.test.ts`
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/hooks/useRound.ts`
- Modify: `app/room/[code]/game.tsx`
- Modify: `src/types/game.ts`

- [ ] **Step 1: Write the failing hydration test**

```typescript
import { applyRoundHydration } from '../../src/hooks/useRound'

test('applyRoundHydration stores myPlayedCardId and roundResolutionSummary', () => {
  const state = applyRoundHydration({
    round: { id: 'round-1', status: 'results' },
    cards: [],
    myPlayedCardId: 'card-self',
    roundResolutionSummary: {
      roundId: 'round-1',
      narratorId: 'n',
      narratorCardId: 'c',
      clue: null,
      correctVoterIds: [],
      deceptionEvents: [],
      tacticalEvents: [],
      leaderboardDeltas: [],
    },
  })

  expect(state.myPlayedCardId).toBe('card-self')
  expect(state.roundResolutionSummary?.roundId).toBe('round-1')
})
```

- [ ] **Step 2: Run the hydration test to verify it fails**

Run: `npx jest --runInBand __tests__/competitive/useRoundHydration.test.ts`

Expected: FAIL because the store and hook do not expose the new fields.

- [ ] **Step 3: Add the missing store fields**

```typescript
interface GameState {
  roundResolutionSummary: RoundResolutionSummary | null
  setRoundResolutionSummary: (summary: RoundResolutionSummary | null) => void
}
```

- [ ] **Step 4: Teach `useRound` to fetch and subscribe to `round_resolution_summaries` plus the caller's played card**

```typescript
const { data: summaryRow } = await supabase
  .from('round_resolution_summaries')
  .select('summary')
  .eq('round_id', round.id)
  .maybeSingle()
```

- [ ] **Step 5: Pass the hydrated summary into `ResultsPhase`**

```tsx
<ResultsPhase roomCode={code} players={players} roundSummary={roundResolutionSummary} />
```

- [ ] **Step 6: Run the hydration test and legacy scoring test**

Run: `npx jest --runInBand __tests__/competitive/useRoundHydration.test.ts __tests__/scoring.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add __tests__/competitive/useRoundHydration.test.ts src/stores/useGameStore.ts src/hooks/useRound.ts app/room/[code]/game.tsx src/types/game.ts
git commit -m "feat: hydrate round summaries and played card ids"
```

---

### Task 5: Add phase-1 tactical UI and self-explaining copy

**Files:**
- Create: `src/lib/competitive/roundSummary.ts`
- Create: `src/components/game/TacticalActionCard.tsx`
- Create: `src/components/game/RoundResolutionFeed.tsx`
- Modify: `src/components/game/RoundStatus.tsx`
- Modify: `src/components/game-phases/NarratorPhase.tsx`
- Modify: `src/components/game-phases/PlayersPhase.tsx`
- Modify: `src/components/game-phases/VotingPhase.tsx`
- Modify: `src/components/game-phases/ResultsPhase.tsx`
- Modify: `src/components/game/ScoreBoard.tsx`
- Modify: `app/room/[code]/game.tsx`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Write the failing pure-presenter test for results explanations**

```typescript
import { getRoundResolutionLines } from '../../src/lib/competitive/roundSummary'

test('getRoundResolutionLines turns tactical events into readable result rows', () => {
  const lines = getRoundResolutionLines({
    tacticalEvents: [
      {
        playerId: 'p1',
        type: 'trap_card',
        success: true,
        pointsDelta: 1,
        intuitionDelta: 1,
        description: 'Trap card fooled 2 players',
      },
    ],
  } as any)

  expect(lines[0]).toContain('Trap card fooled 2 players')
})
```

- [ ] **Step 2: Run the targeted presenter test to verify it fails**

Run: `npx jest --runInBand __tests__/competitive/roundSummary.test.ts`

Expected: FAIL because the presenter helper does not exist yet.

- [ ] **Step 3: Create a shared tactical action UI component**

```tsx
export function TacticalActionCard({ title, body, active, onPress }: TacticalActionCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, active && styles.cardActive]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </Pressable>
  )
}
```

- [ ] **Step 4: Add one tactical toggle per phase**

```tsx
<TacticalActionCard
  title={t('game.subtleBetTitle')}
  body={t('game.subtleBetBody')}
  active={selectedTacticalAction === 'subtle_bet'}
  onPress={() => setSelectedTacticalAction(selectedTacticalAction === 'subtle_bet' ? null : 'subtle_bet')}
/>
```

- [ ] **Step 5: Make the phase guidance explicit**

```tsx
<Text style={styles.infoBody}>{t('game.phaseGoalNarrator')}</Text>
<Text style={styles.riskHint}>{t('game.phaseRiskNarrator')}</Text>
```

- [ ] **Step 6: Update results UI to render the explanation feed**

```tsx
<RoundResolutionFeed summary={roundSummary} players={players} />
```

- [ ] **Step 7: Thread token and guidance props from `game.tsx` into `RoundStatus`**

```tsx
<RoundStatus
  roundNumber={round.round_number}
  maxRounds={room.max_rounds}
  phase={status}
  wildcardsRemaining={wildcardsRemaining}
  intuitionTokens={currentPlayer?.intuition_tokens ?? 0}
/>
```

- [ ] **Step 8: Run focused verification**

Run: `npx jest --runInBand __tests__/competitive/roundSummary.test.ts __tests__/welcomeHero.test.ts __tests__/appChrome.test.ts`

Expected: PASS.

- [ ] **Step 9: Manual screen verification**

Run: `npx expo export --platform android --output-dir .expo-export-check`

Expected: build succeeds after the new tactical UI is wired in.

- [ ] **Step 10: Commit**

```bash
git add src/lib/competitive/roundSummary.ts src/components/game/TacticalActionCard.tsx src/components/game/RoundResolutionFeed.tsx src/components/game/RoundStatus.tsx src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx src/components/game-phases/VotingPhase.tsx src/components/game-phases/ResultsPhase.tsx src/components/game/ScoreBoard.tsx app/room/[code]/game.tsx src/i18n/locales/es.json src/i18n/locales/en.json
git commit -m "feat: add tactical match UI and guided round copy"
```

---

## Phase 2 - Controlled Interaction
*Testable milestone: `Challenge the Leader` works once per match, resolves independently for multiple challengers, and explains its outcome in results.*

### Task 6: Implement `Challenge the Leader` and its once-per-match rules

**Files:**
- Create: `__tests__/competitive/challengeLeader.test.ts`
- Create: `supabase/functions/game-action/challengeLeader.ts`
- Create: `supabase/migrations/20260319194000_competitive_phase_2.sql`
- Modify: `supabase/functions/game-action/index.ts`
- Modify: `supabase/functions/game-action/scoring.ts`
- Modify: `supabase/functions/game-action/roundSummary.ts`
- Modify: `src/components/game-phases/NarratorPhase.tsx`
- Modify: `src/components/game-phases/PlayersPhase.tsx`
- Modify: `src/components/game-phases/VotingPhase.tsx`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Write failing tests for leader challenge conflicts**

```typescript
import { resolveLeaderChallenges } from '../supabase/functions/game-action/challengeLeader'

test('multiple challengers may challenge the same solo leader and resolve independently', () => {
  const result = resolveLeaderChallenges({
    leaderId: 'leader',
    roundScores: { leader: 2, p1: 3, p2: 1, p3: 4 },
    challengers: ['p1', 'p3'],
    alreadyUsedByPlayer: { p1: false, p3: false },
  })

  expect(result.successes).toEqual(['p1', 'p3'])
})
```

- [ ] **Step 2: Run the challenge tests to verify they fail**

Run: `npx jest --runInBand __tests__/competitive/challengeLeader.test.ts`

Expected: FAIL with missing helper/module errors.

- [ ] **Step 3: Add the phase-2 migration if extra persistence is needed**

```sql
alter table public.cards
  add column if not exists challenge_leader boolean not null default false;

alter table public.votes
  add column if not exists challenge_leader boolean not null default false;
```

- [ ] **Step 4: Implement the pure challenge resolver**

```typescript
export function resolveLeaderChallenges(input: ResolveLeaderChallengesInput) {
  const successes = input.challengers.filter((playerId) => {
    if (input.alreadyUsedByPlayer[playerId]) return false
    return (input.roundScores[playerId] ?? -Infinity) > (input.roundScores[input.leaderId] ?? Infinity)
  })
  return { successes }
}
```

- [ ] **Step 5: Wire `challenge_leader` through phase submissions and one-time usage flags**

```typescript
if (p.challenge_leader) {
  const roomPlayer = await getRoomPlayer(sb, room.id, userId)
  if (roomPlayer.challenge_leader_used) {
    return errorResponse('CHALLENGE_ALREADY_USED', 'Challenge already used this match')
  }
  await sb.from('room_players')
    .update({ challenge_leader_used: true })
    .eq('room_id', room.id)
    .eq('player_id', userId)
}
```

- [ ] **Step 6: Persist challenge outcomes into round summaries**

```typescript
summary.tacticalEvents.push({
  playerId,
  type: 'challenge_leader',
  success,
  pointsDelta: success ? 1 : 0,
  intuitionDelta: success ? 1 : 0,
  description: success ? 'Challenge the Leader succeeded' : 'Challenge the Leader failed',
})
```

- [ ] **Step 7: Run the focused tests**

Run: `npx jest --runInBand __tests__/competitive/challengeLeader.test.ts __tests__/competitive/roundSummary.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add __tests__/competitive/challengeLeader.test.ts supabase/functions/game-action/challengeLeader.ts supabase/migrations/20260319194000_competitive_phase_2.sql supabase/functions/game-action/index.ts supabase/functions/game-action/scoring.ts supabase/functions/game-action/roundSummary.ts src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx src/components/game-phases/VotingPhase.tsx src/i18n/locales/es.json src/i18n/locales/en.json
git commit -m "feat: add challenge the leader interaction"
```

---

## Phase 3 - Competitive Progression
*Testable milestone: matches produce CP updates, divisions, provisional behavior, and visible post-match competitive summaries.*

### Task 7: Add ranked calculations and persistent progression fields

**Files:**
- Create: `__tests__/competitive/competitiveProgress.test.ts`
- Create: `supabase/functions/game-action/ranked.ts`
- Create: `supabase/migrations/20260319195000_competitive_phase_3.sql`
- Modify: `supabase/functions/game-action/index.ts`
- Modify: `src/types/game.ts`

- [ ] **Step 1: Write failing ranked progression tests**

```typescript
import { applyCompetitiveResult } from '../supabase/functions/game-action/ranked'

test('winner gains more CP than second place even with weaker tactical play', () => {
  const result = applyCompetitiveResult([
    { playerId: 'p1', placement: 1, tacticalBonus: 1, currentCp: 120, provisionalMatchesPlayed: 7 },
    { playerId: 'p2', placement: 2, tacticalBonus: 3, currentCp: 120, provisionalMatchesPlayed: 7 },
  ])

  expect(result.find((entry) => entry.playerId === 'p1')?.cpDelta).toBeGreaterThan(
    result.find((entry) => entry.playerId === 'p2')?.cpDelta ?? 0,
  )
})
```

- [ ] **Step 2: Run the ranked tests to verify they fail**

Run: `npx jest --runInBand __tests__/competitive/competitiveProgress.test.ts`

Expected: FAIL because ranked calculation does not exist.

- [ ] **Step 3: Write the ranked schema migration**

```sql
create table if not exists public.competitive_profiles (
  player_id uuid primary key references public.profiles(id) on delete cascade,
  cp integer not null default 0,
  division text not null default 'bronze',
  tier integer not null default 1,
  provisional_matches_played integer not null default 0,
  narrator_balance_rate numeric not null default 0,
  correct_vote_rate numeric not null default 0,
  avg_players_deceived numeric not null default 0,
  trap_card_success_rate numeric not null default 0,
  firm_read_success_rate numeric not null default 0,
  challenge_leader_success_rate numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_competitive_results (
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  cp_before integer not null,
  cp_after integer not null,
  cp_delta integer not null,
  division_before text not null,
  division_after text not null,
  tier_before integer not null,
  tier_after integer not null,
  breakdown jsonb not null,
  created_at timestamptz not null default now(),
  primary key (room_id, player_id)
);
```

- [ ] **Step 4: Apply the migration and regenerate types**

Use Supabase MCP migration + type generation for project `ctjelsuchvzvdjvqdzub`.

Expected: `competitive_profiles` is available in `src/types/game.ts`.

- [ ] **Step 5: Implement the ranked helper**

```typescript
export function applyCompetitiveResult(entries: CompetitivePlacementInput[]): CompetitivePlacementResult[] {
  return entries.map((entry) => {
    const placementDelta = [0, 24, 12, -8, -16][entry.placement] ?? -20
    const tacticalDelta = Math.max(-2, Math.min(3, entry.tacticalBonus))
    const provisionalMultiplier = entry.provisionalMatchesPlayed < 5 ? 1.35 : 1

    return {
      playerId: entry.playerId,
      cpDelta: Math.round((placementDelta + tacticalDelta) * provisionalMultiplier),
    }
  })
}
```

- [ ] **Step 6: Call the ranked helper when the match ends**

```typescript
if (gameOver) {
  const competitiveUpdates = applyCompetitiveResult(buildPlacementInputs(players, tacticalTotals, profiles))
  await persistCompetitiveUpdates(sb, competitiveUpdates)
  await persistMatchCompetitiveResults(sb, room.id, competitiveUpdates)
}
```

- [ ] **Step 7: Run the ranked tests**

Run: `npx jest --runInBand __tests__/competitive/competitiveProgress.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add __tests__/competitive/competitiveProgress.test.ts supabase/functions/game-action/ranked.ts supabase/functions/game-action/index.ts supabase/migrations/20260319195000_competitive_phase_3.sql src/types/game.ts
git commit -m "feat: add competitive progression calculations"
```

---

### Task 8: Surface competitive results and stats in the client

**Files:**
- Create: `src/components/game/CompetitiveSummaryCard.tsx`
- Modify: `src/components/game-phases/ResultsPhase.tsx`
- Modify: `app/room/[code]/ended.tsx`
- Modify: `src/components/game/ScoreBoard.tsx`
- Modify: `app/(tabs)/profile.tsx`
- Modify: `src/hooks/useProfile.ts`
- Create: `src/lib/competitive/competitiveProgress.ts`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Write a failing pure-presenter test for the competitive summary**

```typescript
import { formatCompetitiveSummary } from '../../src/lib/competitive/competitiveProgress'

test('formatCompetitiveSummary exposes cp delta and division progress for the ended screen', () => {
  const summary = formatCompetitiveSummary({
    cpDelta: 18,
    division: 'Bronze',
    tier: 2,
    nextThreshold: 12,
  })

  expect(summary.cpLine).toBe('+18 CP')
  expect(summary.rankLine).toContain('Bronze')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest --runInBand __tests__/competitive/competitiveProgress.test.ts`

Expected: FAIL because the formatter helper does not exist yet.

- [ ] **Step 3: Create the post-match summary card**

```tsx
export function CompetitiveSummaryCard({ cpDelta, division, nextThreshold }: Props) {
  return (
    <View>
      <Text>{cpDelta >= 0 ? `+${cpDelta} CP` : `${cpDelta} CP`}</Text>
      <Text>{division}</Text>
      <Text>{nextThreshold}</Text>
    </View>
  )
}
```

- [ ] **Step 4: Fetch the persisted match result in `ended.tsx` and keep `ResultsPhase` focused on round-level feedback**

```tsx
const { data: competitiveResult } = await supabase
  .from('match_competitive_results')
  .select('*')
  .eq('room_id', room.id)
  .eq('player_id', currentUserId)
  .single()

{competitiveResult && <CompetitiveSummaryCard {...formatCompetitiveSummary(competitiveResult)} />}
```

- [ ] **Step 5: Surface division and meaningful competitive stats in profile**

```tsx
<Text style={styles.rankLabel}>{competitiveProfile.division}</Text>
<Text style={styles.statLine}>{t('profile.correctVoteRate')}: {competitiveProfile.correct_vote_rate}%</Text>
```

- [ ] **Step 6: Manual screen verification**

Run: `npx expo export --platform android --output-dir .expo-export-check`

Expected: build succeeds with the new `ended.tsx` summary and profile stats wiring.

- [ ] **Step 7: Commit**

```bash
git add src/lib/competitive/competitiveProgress.ts src/components/game/CompetitiveSummaryCard.tsx src/components/game-phases/ResultsPhase.tsx app/room/[code]/ended.tsx src/components/game/ScoreBoard.tsx app/(tabs)/profile.tsx src/hooks/useProfile.ts src/i18n/locales/es.json src/i18n/locales/en.json
git commit -m "feat: surface competitive results and profile stats"
```

---

## Final Verification

Run these after the last task and before any execution handoff:

- [ ] **Step 1: Run the competitive unit test suite**

Run: `npx jest --runInBand __tests__/competitive/tacticalScoring.test.ts __tests__/competitive/roundSummary.test.ts __tests__/competitive/challengeLeader.test.ts __tests__/competitive/competitiveProgress.test.ts __tests__/competitive/useRoundHydration.test.ts __tests__/scoring.test.ts`

Expected: PASS.

- [ ] **Step 2: Run the existing UI regression tests already in the repo**

Run: `npx jest --runInBand __tests__/welcomeHero.test.ts __tests__/appChrome.test.ts __tests__/profileAvatar.test.ts __tests__/galleryRules.test.ts`

Expected: PASS.

- [ ] **Step 3: Build the mobile bundle**

Run: `npx expo export --platform android --output-dir .expo-export-check`

Expected: export completes successfully.

- [ ] **Step 4: Run TypeScript compile verification**

Run: `npm run typecheck`

Expected: the touched files compile cleanly; any baseline failures are documented separately before merge.

- [ ] **Step 5: Run Supabase advisors after DDL changes**

Use Supabase MCP advisor checks for the project after all migrations are applied.

Expected: no new critical advisor issues introduced by the competitive schema changes.

---

## Notes for Execution

- Keep commits scoped to one task only.
- Do not start with UI before the pure rules and summary contracts are green.
- Reuse the persisted `myPlayedCardId` contract; do not branch into a second `votableCardIds` API.
- Avoid folding gallery wildcards into the intuition token system in this implementation.
- If the tactical layer proves too noisy in playtests, tune values before moving to Phase 3. Do not start CP tuning before Phase 1 and Phase 2 are stable.
