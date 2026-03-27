# Gameplay Tactical UI And Live Standings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the gameplay HUD stack so live standings are always visible and the tactical tray becomes a cleaner, single-helper action surface.

**Architecture:** Add one new pure standings helper plus one new `LiveStandingsStrip` component mounted in the shared game shell, so narrator, player, voting, and waiting states all inherit the same compact ranking band. Keep tactical rules in `src/lib/tacticalActions.ts`, add one prioritized helper selector there, and refactor `TacticalActionPicker` to consume that single reason instead of rendering a repeated disabled-notes list.

**Tech Stack:** React Native, Expo Router, TypeScript, Jest, `react-i18next`, existing `Avatar` and gameplay UI components

---

## File Map

- Create: `__tests__/liveStandings.test.ts`
- Create: `__tests__/liveStandingsStrip.test.tsx`
- Create: `__tests__/gameplayShellStructure.test.ts`
- Create: `__tests__/tacticalActionUi.test.ts`
- Create: `__tests__/tacticalActionPickerStructure.test.ts`
- Create: `src/lib/liveStandings.ts`
- Create: `src/components/game/LiveStandingsStrip.tsx`
- Modify: `app/room/[code]/game.tsx`
- Modify: `src/lib/tacticalActions.ts`
- Modify: `src/components/game/TacticalActionPicker.tsx`
- Modify: `src/components/game-phases/VotingPhase.tsx`
- Reference only: `src/components/ui/Avatar.tsx`
- Reference only: `src/components/game/ScoreBoard.tsx`
- Reference only: `src/components/game/GameStatusHUD.tsx`
- Reference only: `src/components/game/EconomyBadges.tsx`
- Reference only: `src/components/game-phases/NarratorPhase.tsx`
- Reference only: `src/components/game-phases/PlayersPhase.tsx`
- Reference spec: `docs/superpowers/specs/2026-03-27-dixit-ai-mobile-gameplay-tactical-ui-ranking-design.md`

### Task 0: Isolate The Work Before Touching Gameplay UI

**Files:**
- Reference: `.git/`
- Reference: `docs/superpowers/specs/2026-03-27-dixit-ai-mobile-gameplay-tactical-ui-ranking-design.md`
- Reference: `docs/superpowers/plans/2026-03-27-dixit-ai-mobile-gameplay-tactical-ui-ranking.md`

- [ ] **Step 1: Create a dedicated worktree or otherwise isolate the implementation**

Preferred: use `@superpowers:using-git-worktrees` for a fresh worktree rooted at `dixit_ai_mobile`.

Fallback if a worktree is skipped:
- only stage files listed in this plan
- use file-scoped diffs only
- do not rely on repository-wide clean status

- [ ] **Step 2: Verify commands run from the repository root**

Run: `git rev-parse --show-toplevel`

Expected: the command resolves to the `dixit_ai_mobile` repository root.

### Task 1: Lock Live Standings Data Rules With Failing Tests

**Files:**
- Create: `__tests__/liveStandings.test.ts`
- Reference: `src/types/game.ts`
- Create later in task: `src/lib/liveStandings.ts`

- [ ] **Step 1: Write the failing data-shaping test for standings order and flags**

```ts
import { buildLiveStandingsEntries } from '../src/lib/liveStandings'
import type { RoomPlayer } from '../src/types/game'

function makePlayer(
  player_id: string,
  display_name: string,
  score: number,
): RoomPlayer {
  return {
    id: `${player_id}-row`,
    room_id: 'room-1',
    player_id,
    display_name,
    score,
    is_active: true,
    is_host: false,
    is_ready: true,
    joined_at: '2026-03-27T00:00:00.000Z',
    intuition_tokens: 2,
    wildcards_remaining: 0,
    generation_tokens: 0,
    challenge_leader_used: false,
    corrupted_cards_remaining: 2,
    profiles: null,
  }
}

describe('buildLiveStandingsEntries', () => {
  test('sorts by score descending, keeps incoming order for ties, and tags leader/current user', () => {
    const players = [
      makePlayer('p2', 'Bea', 14),
      makePlayer('p1', 'Ana', 18),
      makePlayer('p3', 'Ciro', 14),
    ]

    expect(buildLiveStandingsEntries(players, 'p3')).toEqual([
      expect.objectContaining({ playerId: 'p1', position: 1, score: 18, isLeader: true, isCurrentUser: false }),
      expect.objectContaining({ playerId: 'p2', position: 2, score: 14, isLeader: false, isCurrentUser: false }),
      expect.objectContaining({ playerId: 'p3', position: 3, score: 14, isLeader: false, isCurrentUser: true }),
    ])
  })
})
```

- [ ] **Step 2: Run the standings helper test to verify it fails**

Run: `npm test -- --runTestsByPath __tests__/liveStandings.test.ts`

Expected: FAIL because `src/lib/liveStandings.ts` and `buildLiveStandingsEntries` do not exist yet.

- [ ] **Step 3: Commit the failing standings helper test**

```bash
git add __tests__/liveStandings.test.ts
git commit -m "test: cover live standings ordering"
```

### Task 2: Add A Pure Live Standings Helper

**Files:**
- Create: `src/lib/liveStandings.ts`
- Test: `__tests__/liveStandings.test.ts`
- Reference: `src/types/game.ts`

- [ ] **Step 1: Create the pure standings helper with stable sorting and flags**

```ts
import type { RoomPlayer } from '@/types/game'

export interface LiveStandingsEntry {
  playerId: string
  displayName: string
  avatarUrl: string | null
  score: number
  position: number
  isLeader: boolean
  isCurrentUser: boolean
}

export function buildLiveStandingsEntries(
  players: RoomPlayer[],
  currentUserId: string | null,
): LiveStandingsEntry[] {
  return players
    .map((player, originalIndex) => ({ player, originalIndex }))
    .sort((left, right) =>
      right.player.score - left.player.score || left.originalIndex - right.originalIndex,
    )
    .map(({ player }, index) => ({
      playerId: player.player_id,
      displayName: player.display_name,
      avatarUrl: player.profiles?.avatar_url ?? null,
      score: player.score,
      position: index + 1,
      isLeader: index === 0,
      isCurrentUser: player.player_id === currentUserId,
    }))
}
```

- [ ] **Step 2: Run the standings helper test to verify it passes**

Run: `npm test -- --runTestsByPath __tests__/liveStandings.test.ts`

Expected: PASS

- [ ] **Step 3: Inspect the scoped diff before committing**

Run: `git diff -- __tests__/liveStandings.test.ts src/lib/liveStandings.ts`

Expected: only the new pure helper and its focused test appear.

- [ ] **Step 4: Commit the helper**

```bash
git add __tests__/liveStandings.test.ts src/lib/liveStandings.ts
git commit -m "feat: add gameplay live standings helper"
```

### Task 3: Lock The Standings Component And Shell Mount With Failing Tests

**Files:**
- Create: `__tests__/liveStandingsStrip.test.tsx`
- Create: `__tests__/gameplayShellStructure.test.ts`
- Reference: `src/components/ui/Avatar.tsx`
- Reference: `app/room/[code]/game.tsx`
- Create later in task: `src/components/game/LiveStandingsStrip.tsx`

- [ ] **Step 1: Write the failing component test for score and position rendering**

```ts
import React from 'react'

jest.mock('react-native', () => ({
  ScrollView: 'ScrollView',
  View: 'View',
  Text: 'Text',
  StyleSheet: { create: <T,>(styles: T) => styles },
}))

jest.mock('../src/components/ui/Avatar', () => ({
  Avatar: ({ name }: { name: string }) => React.createElement('Avatar', { name }),
}))

const { LiveStandingsStrip } = require('../src/components/game/LiveStandingsStrip') as typeof import('../src/components/game/LiveStandingsStrip')

function collectText(node: unknown): string[] {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(collectText)
  if (!node || typeof node !== 'object') return []
  const props = (node as { props?: { children?: unknown } }).props
  const children = props?.children
  return Array.isArray(children)
    ? children.flatMap(collectText)
    : collectText(children)
}

function findByTestId(node: unknown, testID: string): { props?: Record<string, unknown> } | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findByTestId(child, testID)
      if (match) return match
    }
    return null
  }

  if (!node || typeof node !== 'object') return null

  const element = node as { props?: Record<string, unknown> }
  if (element.props?.testID === testID) {
    return element
  }

  return findByTestId(element.props?.children, testID)
}

test('renders score and visible position for each player', () => {
  const tree = LiveStandingsStrip({
    players: [
      { player_id: 'p1', display_name: 'Ana', score: 18, profiles: null } as any,
      { player_id: 'p2', display_name: 'Bea', score: 14, profiles: null } as any,
    ],
    currentUserId: 'p2',
  })

  const text = collectText(tree)

  expect(text).toEqual(expect.arrayContaining(['#1', '18', '#2', '14']))
})

test('marks the current user pill as selected for UI highlighting', () => {
  const tree = LiveStandingsStrip({
    players: [
      { player_id: 'p1', display_name: 'Ana', score: 18, profiles: null } as any,
      { player_id: 'p2', display_name: 'Bea', score: 14, profiles: null } as any,
    ],
    currentUserId: 'p2',
  })

  const currentUserPill = findByTestId(tree, 'standings-pill-p2')

  expect(currentUserPill?.props?.accessibilityState).toEqual({ selected: true })
})
```

- [ ] **Step 2: Write the failing shell-structure regression test**

```ts
import fs from 'node:fs'
import path from 'node:path'

test('game shell mounts live standings between status HUD and economy badges', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'app', 'room', '[code]', 'game.tsx'),
    'utf8',
  )

  const hudIndex = source.indexOf('<GameStatusHUD')
  const standingsIndex = source.indexOf('<LiveStandingsStrip')
  const economyIndex = source.indexOf('<EconomyBadges')

  expect(hudIndex).toBeGreaterThan(-1)
  expect(standingsIndex).toBeGreaterThan(hudIndex)
  expect(economyIndex).toBeGreaterThan(standingsIndex)
})
```

- [ ] **Step 3: Run the component and shell tests to verify they fail**

Run: `npm test -- --runTestsByPath __tests__/liveStandingsStrip.test.tsx __tests__/gameplayShellStructure.test.ts`

Expected:
- component test FAIL because `LiveStandingsStrip` does not exist yet
- shell structure test FAIL because `game.tsx` does not mount the new strip yet

- [ ] **Step 4: Commit the failing standings UI tests**

```bash
git add __tests__/liveStandingsStrip.test.tsx __tests__/gameplayShellStructure.test.ts
git commit -m "test: lock gameplay standings UI structure"
```

### Task 4: Build And Mount The Live Standings Strip

**Files:**
- Create: `src/components/game/LiveStandingsStrip.tsx`
- Modify: `app/room/[code]/game.tsx`
- Test: `__tests__/liveStandings.test.ts`
- Test: `__tests__/liveStandingsStrip.test.tsx`
- Test: `__tests__/gameplayShellStructure.test.ts`
- Reference: `src/components/ui/Avatar.tsx`
- Reference: `src/components/game/ScoreBoard.tsx`

- [ ] **Step 1: Create the compact standings component**

```tsx
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { buildLiveStandingsEntries } from '@/lib/liveStandings'
import { colors, fonts, radii } from '@/constants/theme'
import type { RoomPlayer } from '@/types/game'

export function LiveStandingsStrip({
  players,
  currentUserId,
}: {
  players: RoomPlayer[]
  currentUserId: string | null
}) {
  const entries = buildLiveStandingsEntries(players, currentUserId)

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {entries.map((entry) => (
        <View
          key={entry.playerId}
          testID={`standings-pill-${entry.playerId}`}
          accessibilityState={{ selected: entry.isCurrentUser }}
          style={[
            styles.pill,
            entry.isLeader && styles.pillLeader,
            entry.isCurrentUser && styles.pillCurrentUser,
          ]}
        >
          <Text style={styles.rank}>#{entry.position}</Text>
          <Avatar uri={entry.avatarUrl ?? undefined} name={entry.displayName} size={28} />
          <Text numberOfLines={1} style={styles.name}>{entry.displayName}</Text>
          <Text style={styles.score}>{entry.score}</Text>
        </View>
      ))}
    </ScrollView>
  )
}
```

- [ ] **Step 2: Mount the standings strip in the shared game shell**

```tsx
<GameStatusHUD
  roundNumber={round.round_number}
  maxRounds={room.max_rounds}
  phaseLabel={phaseLabels[status] ?? t(status)}
  stepCurrent={stepCurrent}
  stepTotal={stepTotal}
  phaseStartedAt={round.phase_started_at}
  phaseDurationSeconds={room.phase_duration_seconds ?? undefined}
/>

<LiveStandingsStrip
  players={players}
  currentUserId={userId}
/>

<EconomyBadges
  intuitionTokens={intuitionTokens}
  wildcardsLeft={wildcardsLeft}
  generationTokens={generationTokens}
  corruptedCardsRemaining={corruptedCardsRemaining}
/>
```

- [ ] **Step 3: Keep the change shell-only**

Confirm:
- `NarratorPhase.tsx` remains unchanged
- `PlayersPhase.tsx` remains unchanged
- narrator waiting in `game.tsx` still renders `WaitingCard` before the disabled tactical tray

- [ ] **Step 4: Run the standings-focused tests**

Run: `npm test -- --runTestsByPath __tests__/liveStandings.test.ts __tests__/liveStandingsStrip.test.tsx __tests__/gameplayShellStructure.test.ts`

Expected: PASS

- [ ] **Step 5: Run typecheck after the new component mount**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 6: Inspect the scoped diff before committing**

Run: `git diff -- __tests__/liveStandings.test.ts __tests__/liveStandingsStrip.test.tsx __tests__/gameplayShellStructure.test.ts src/lib/liveStandings.ts src/components/game/LiveStandingsStrip.tsx app/room/[code]/game.tsx`

Expected: only standings helper, component, shell mount, and the three standings tests appear.

- [ ] **Step 7: Commit the standings work**

```bash
git add __tests__/liveStandings.test.ts __tests__/liveStandingsStrip.test.tsx __tests__/gameplayShellStructure.test.ts src/lib/liveStandings.ts src/components/game/LiveStandingsStrip.tsx app/room/[code]/game.tsx
git commit -m "feat: add live standings strip to gameplay shell"
```

### Task 5: Lock Tactical Helper Prioritization And Single-Helper Rendering With Failing Tests

**Files:**
- Create: `__tests__/tacticalActionUi.test.ts`
- Create: `__tests__/tacticalActionPickerStructure.test.ts`
- Reference: `src/lib/tacticalActions.ts`
- Reference: `src/components/game/TacticalActionPicker.tsx`

- [ ] **Step 1: Write the failing tactical helper priority test**

```ts
import {
  getChallengeLeaderState,
  getPhaseTacticalActions,
  getPrimaryTacticalHelperReason,
} from '../src/lib/tacticalActions'

describe('getPrimaryTacticalHelperReason', () => {
  test('prefers selection-required over other blocked reasons', () => {
    const actions = getPhaseTacticalActions({
      phase: 'narrator_turn',
      selectionActive: false,
      intuitionTokens: 0,
      isPhaseOwner: false,
      corruptedCardsRemaining: 2,
    })
    const challenge = getChallengeLeaderState({
      selectionActive: false,
      intuitionTokens: 0,
      playerId: 'p2',
      soloLeaderId: 'p1',
      challengeLeaderUsed: false,
    })

    expect(getPrimaryTacticalHelperReason(actions, challenge)).toBe(
      'game.tactics.notes.selectionRequired',
    )
  })

  test('falls back to insufficient-tokens before exhausted-usage reasons', () => {
    const actions = getPhaseTacticalActions({
      phase: 'voting',
      selectionActive: true,
      intuitionTokens: 0,
      isPhaseOwner: true,
      corruptedCardsRemaining: 2,
    })
    const challenge = getChallengeLeaderState({
      selectionActive: true,
      intuitionTokens: 0,
      playerId: 'p2',
      soloLeaderId: 'p1',
      challengeLeaderUsed: true,
    })

    expect(getPrimaryTacticalHelperReason(actions, challenge)).toBe(
      'game.tactics.notes.needTwoIntuition',
    )
  })
})
```

- [ ] **Step 2: Write the failing tactical picker structure regression test**

```ts
import fs from 'node:fs'
import path from 'node:path'

test('tactical picker uses one primary helper instead of mapping every disabled note', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'game', 'TacticalActionPicker.tsx'),
    'utf8',
  )

  expect(source).toContain('getPrimaryTacticalHelperReason')
  expect(source).not.toContain('.filter((action) => action.disabledReasonKey)')
  expect(source).not.toContain('key={`${action.id}-note`}')
})
```

- [ ] **Step 3: Run the tactical helper tests to verify they fail**

Run: `npm test -- --runTestsByPath __tests__/tacticalActionUi.test.ts __tests__/tacticalActionPickerStructure.test.ts`

Expected:
- helper test FAIL because `getPrimaryTacticalHelperReason` does not exist yet
- structure test FAIL because the picker still maps all disabled notes

- [ ] **Step 4: Commit the failing tactical UI tests**

```bash
git add __tests__/tacticalActionUi.test.ts __tests__/tacticalActionPickerStructure.test.ts
git commit -m "test: cover tactical helper priority"
```

### Task 6: Refactor TacticalActionPicker Into A Single-Helper Action Tray

**Files:**
- Modify: `src/lib/tacticalActions.ts`
- Modify: `src/components/game/TacticalActionPicker.tsx`
- Modify: `src/components/game-phases/VotingPhase.tsx`
- Test: `__tests__/tacticalActionUi.test.ts`
- Test: `__tests__/tacticalActionPickerStructure.test.ts`

- [ ] **Step 1: Add a prioritized helper selector to `tacticalActions.ts`**

```ts
const HELPER_REASON_PRIORITY = [
  'game.tactics.notes.selectionRequired',
  'game.tactics.notes.onlyNarratorRisk',
  'game.tactics.notes.needTwoIntuition',
  'game.tactics.notes.needOneIntuition',
  'game.tactics.notes.challengeNeedIntuition',
  'game.tactics.notes.noCorruptedCardsLeft',
  'game.tactics.notes.challengeSpent',
  'game.tactics.notes.challengeNoLeader',
  'game.tactics.notes.challengeSelfLeader',
] as const

export function getPrimaryTacticalHelperReason(
  phaseActions: TacticalActionState[],
  challengeLeaderState: ChallengeLeaderState,
) {
  const blockedReasons = [
    ...phaseActions.map((action) => action.disabledReasonKey).filter(Boolean),
    challengeLeaderState.disabledReasonKey,
  ].filter(Boolean) as string[]

  return HELPER_REASON_PRIORITY.find((reason) => blockedReasons.includes(reason)) ?? null
}
```

- [ ] **Step 2: Refactor `TacticalActionPicker` to consume one helper line**

```tsx
const primaryHelperReasonKey = getPrimaryTacticalHelperReason(
  phaseActions,
  challengeLeaderState,
)

{primaryHelperReasonKey ? (
  <View style={styles.helperRow}>
    <MaterialCommunityIcons name="information-outline" size={14} color="rgba(255, 241, 222, 0.56)" />
    <Text style={styles.helperText}>{t(primaryHelperReasonKey)}</Text>
  </View>
) : null}
```

Remove the old plural notes block entirely:

```tsx
{phaseActions.some((action) => action.disabledReasonKey) || challengeLeaderState.disabledReasonKey ? (
  <View style={styles.notes}>
    ...
  </View>
) : null}
```

- [ ] **Step 3: Merge challenge styling into the same tray language**

Apply these layout constraints inside `TacticalActionPicker.tsx`:
- keep `Challenge the Leader` visually distinct
- remove the feeling of a detached secondary section
- keep the selected-state summary below the chips
- keep the sheet interaction path unchanged

Representative structure:

```tsx
<View style={styles.chipRow}>
  {phaseActions.map(...)}
  <Pressable style={[styles.chip, styles.challengeChip, ...]}>
    ...
  </Pressable>
</View>
```

- [ ] **Step 4: Adjust the voting action bar only if spacing is needed for the redesigned tray**

If the updated tray needs a little more separation above the CTA, keep it local to `VotingPhase.tsx`:

```tsx
const styles = StyleSheet.create({
  actionContent: {
    gap: 12,
    paddingTop: 2,
  },
})
```

Do not move the vote button above the tactical tray.

- [ ] **Step 5: Run the tactical helper tests**

Run: `npm test -- --runTestsByPath __tests__/tacticalActionUi.test.ts __tests__/tacticalActionPickerStructure.test.ts`

Expected: PASS

- [ ] **Step 6: Run typecheck after the picker refactor**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 7: Inspect the scoped diff before committing**

Run: `git diff -- __tests__/tacticalActionUi.test.ts __tests__/tacticalActionPickerStructure.test.ts src/lib/tacticalActions.ts src/components/game/TacticalActionPicker.tsx src/components/game-phases/VotingPhase.tsx`

Expected: only the new helper selector, tray refactor, optional action-bar spacing, and the two tactical tests appear.

- [ ] **Step 8: Commit the tactical tray refactor**

```bash
git add __tests__/tacticalActionUi.test.ts __tests__/tacticalActionPickerStructure.test.ts src/lib/tacticalActions.ts src/components/game/TacticalActionPicker.tsx src/components/game-phases/VotingPhase.tsx
git commit -m "feat: simplify gameplay tactical action tray"
```

### Task 7: Run Full Verification And Manual Gameplay Checks

**Files:**
- Test: `__tests__/liveStandings.test.ts`
- Test: `__tests__/liveStandingsStrip.test.tsx`
- Test: `__tests__/gameplayShellStructure.test.ts`
- Test: `__tests__/tacticalActionUi.test.ts`
- Test: `__tests__/tacticalActionPickerStructure.test.ts`
- Modify if needed: any file already listed in this plan

- [ ] **Step 1: Run the focused regression suite together**

Run:
`npm test -- --runTestsByPath __tests__/liveStandings.test.ts __tests__/liveStandingsStrip.test.tsx __tests__/gameplayShellStructure.test.ts __tests__/tacticalActionUi.test.ts __tests__/tacticalActionPickerStructure.test.ts`

Expected: PASS

- [ ] **Step 2: Run the global static verification**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 3: Perform manual gameplay verification in the browser**

Run in separate terminals from `dixit_ai_mobile`:
- `npm run web`
- use an existing room flow or create/open one with the room scripts if they are currently healthy

Verify:
- the standings strip is visible under the HUD in narrator, player, voting, and waiting states
- each player pill shows visible position and score
- the current user highlight is distinct from the leader accent
- narrator waiting still shows the waiting card first and the disabled tactical tray below it
- voting active still shows the tactical tray above the vote button
- the repeated tactical notes block is gone
- only one compact helper line appears when blocked

If `npm run room:3p:open` is still failing in this branch, do not expand scope to fix that script here; use a manual room flow instead and note the verification constraint.

- [ ] **Step 4: Commit any final cleanup required by verification**

```bash
git add __tests__/liveStandings.test.ts __tests__/liveStandingsStrip.test.tsx __tests__/gameplayShellStructure.test.ts __tests__/tacticalActionUi.test.ts __tests__/tacticalActionPickerStructure.test.ts src/lib/liveStandings.ts src/components/game/LiveStandingsStrip.tsx app/room/[code]/game.tsx src/lib/tacticalActions.ts src/components/game/TacticalActionPicker.tsx src/components/game-phases/VotingPhase.tsx
git commit -m "test: verify gameplay standings and tactical tray polish"
```
