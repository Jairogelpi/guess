# Quick Matchmaking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public quick-match flow with flexible player-count preference, efficient Supabase-backed matchmaking, a matched countdown screen, and direct handoff into the existing game flow.

**Architecture:** Add a dedicated `matchmaking_queue` subsystem in Supabase and keep it separate from the existing `rooms` gameplay model. Match formation happens in a short transactional edge-function path that creates a normal room and room players, while the client subscribes only to the current user's queue ticket and then reuses the existing room/game subscriptions once matched.

**Tech Stack:** Expo Router, React Native, Zustand, Supabase Realtime, Supabase Edge Functions, Postgres migrations, Jest, ts-jest, TypeScript

---

### Task 1: Add Matchmaking Schema And Cleanup

**Files:**
- Create: `supabase/migrations/20260405100000_quick_matchmaking_schema.sql`
- Modify: `src/types/game.ts`
- Test: `__tests__/matchmakingSchemaContracts.test.ts`

- [ ] **Step 1: Write the failing schema contract test**

```ts
import fs from 'fs'
import path from 'path'

const migrationPath = path.join(
  process.cwd(),
  'supabase',
  'migrations',
  '20260405100000_quick_matchmaking_schema.sql',
)

describe('quick matchmaking schema migration', () => {
  const migration = fs.readFileSync(migrationPath, 'utf8')

  test('creates matchmaking_queue with guarded active-ticket uniqueness', () => {
    expect(migration).toContain('create table if not exists public.matchmaking_queue')
    expect(migration).toContain('preferred_player_count')
    expect(migration).toContain('min_player_count')
    expect(migration).toContain('max_player_count')
    expect(migration).toContain("status text not null default 'searching'")
    expect(migration).toContain('create unique index if not exists matchmaking_queue_one_active_ticket_per_player')
  })

  test('adds queue cleanup indexes and expiry support', () => {
    expect(migration).toContain('expires_at')
    expect(migration).toContain('matchmaking_queue_search_idx')
    expect(migration).toContain('matchmaking_queue_expires_idx')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/matchmakingSchemaContracts.test.ts`
Expected: FAIL because the migration file does not exist yet.

- [ ] **Step 3: Add the migration**

Add a migration that:

- creates `public.matchmaking_queue`
- enforces valid player-count checks
- adds a partial unique index for one active searching ticket per player
- adds `updated_at` trigger support if the project already uses a reusable pattern, otherwise updates it directly in function flows
- adds selective indexes for matching and expiration
- adds RLS and policies so users can only read their own queue ticket if direct reads are needed
- adds cleanup statements or helper function hooks consistent with the existing cleanup approach

- [ ] **Step 4: Extend generated database types manually**

Update `src/types/game.ts` with:

- `matchmaking_queue` table row, insert, update, and relationships
- convenience row type such as `export type MatchmakingQueueTicket = ...`
- queue status union type such as `export type MatchmakingQueueStatus = 'searching' | 'matched' | 'cancelled' | 'expired'`

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- __tests__/matchmakingSchemaContracts.test.ts`
Expected: PASS

- [ ] **Step 6: Run supabase typecheck**

Run: `npm run typecheck:supabase`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260405100000_quick_matchmaking_schema.sql src/types/game.ts __tests__/matchmakingSchemaContracts.test.ts
git commit -m "feat: add quick matchmaking schema"
```

### Task 2: Build Shared Matchmaking Domain Helpers

**Files:**
- Create: `supabase/functions/_shared/matchmaking.ts`
- Create: `__tests__/matchmakingHelpers.test.ts`
- Modify: `src/types/game.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import {
  derivePlayerCountRange,
  getTargetPlayerCounts,
  isTicketCompatibleWithTargetSize,
  pickHostPlayerId,
} from '../supabase/functions/_shared/matchmaking'

describe('matchmaking helpers', () => {
  test('derives expected compatibility range from preference', () => {
    expect(derivePlayerCountRange(3)).toEqual({ min: 3, max: 4 })
    expect(derivePlayerCountRange(4)).toEqual({ min: 3, max: 5 })
    expect(derivePlayerCountRange(5)).toEqual({ min: 4, max: 6 })
    expect(derivePlayerCountRange(6)).toEqual({ min: 5, max: 6 })
  })

  test('prioritizes exact player count before flexible alternatives', () => {
    expect(getTargetPlayerCounts(4, { min: 3, max: 5 })).toEqual([4, 3, 5])
  })

  test('checks ticket compatibility against a target size', () => {
    expect(isTicketCompatibleWithTargetSize({ min_player_count: 3, max_player_count: 5 }, 4)).toBe(true)
    expect(isTicketCompatibleWithTargetSize({ min_player_count: 5, max_player_count: 6 }, 4)).toBe(false)
  })

  test('assigns host to the oldest matched ticket', () => {
    expect(
      pickHostPlayerId([
        { player_id: 'b', created_at: '2026-04-05T10:01:00.000Z' },
        { player_id: 'a', created_at: '2026-04-05T10:00:00.000Z' },
      ]),
    ).toBe('a')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/matchmakingHelpers.test.ts`
Expected: FAIL because the shared helper module does not exist yet.

- [ ] **Step 3: Implement the helper module**

In `supabase/functions/_shared/matchmaking.ts`, add:

- validated preferred-count type helpers
- `derivePlayerCountRange`
- `getTargetPlayerCounts`
- `isTicketCompatibleWithTargetSize`
- `pickHostPlayerId`
- optional small helpers for countdown start timestamp generation

Keep this module pure and side-effect free so both tests and edge functions can depend on it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/matchmakingHelpers.test.ts`
Expected: PASS

- [ ] **Step 5: Run supabase typecheck**

Run: `npm run typecheck:supabase`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/matchmaking.ts __tests__/matchmakingHelpers.test.ts
git commit -m "feat: add matchmaking helper utilities"
```

### Task 3: Add Client API Surface For Quick Match

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/hooks/useGameActions.ts`
- Modify: `src/types/game.ts`
- Create: `__tests__/quickMatchApiContracts.test.ts`

- [ ] **Step 1: Write the failing API contract test**

```ts
import fs from 'fs'
import path from 'path'

const apiSource = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'api.ts'), 'utf8')
const gameActionsSource = fs.readFileSync(path.join(process.cwd(), 'src', 'hooks', 'useGameActions.ts'), 'utf8')

describe('quick match api contracts', () => {
  test('api exposes enqueue, cancel, and status helpers', () => {
    expect(apiSource).toContain("callFunction<")
    expect(apiSource).toContain("('matchmaking-enqueue'")
    expect(apiSource).toContain("('matchmaking-cancel'")
    expect(apiSource).toContain("('matchmaking-status'")
  })

  test('useGameActions exposes quick match helpers', () => {
    expect(gameActionsSource).toContain('enqueueQuickMatch')
    expect(gameActionsSource).toContain('cancelQuickMatch')
    expect(gameActionsSource).toContain('getQuickMatchStatus')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/quickMatchApiContracts.test.ts`
Expected: FAIL because the quick-match API helpers are not present.

- [ ] **Step 3: Extend `src/lib/api.ts`**

Add typed helpers for:

- `matchmakingEnqueue(payload: { displayName: string; preferredPlayerCount: number })`
- `matchmakingCancel()`
- `matchmakingStatus()`

Return explicit payload types so the UI can strongly type queue state.

- [ ] **Step 4: Extend `src/hooks/useGameActions.ts`**

Add wrapped actions:

- `enqueueQuickMatch`
- `cancelQuickMatch`
- `getQuickMatchStatus`

Use the existing toast-based error handling pattern.

- [ ] **Step 5: Add/extend client-facing queue ticket types**

In `src/types/game.ts`, add lightweight transport interfaces for the edge functions if the database table row alone is not ergonomic enough for UI use.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- __tests__/quickMatchApiContracts.test.ts`
Expected: PASS

- [ ] **Step 7: Run app typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/lib/api.ts src/hooks/useGameActions.ts src/types/game.ts __tests__/quickMatchApiContracts.test.ts
git commit -m "feat: add quick match api actions"
```

### Task 4: Implement Matchmaking Edge Functions

**Files:**
- Create: `supabase/functions/matchmaking-enqueue/index.ts`
- Create: `supabase/functions/matchmaking-cancel/index.ts`
- Create: `supabase/functions/matchmaking-status/index.ts`
- Modify: `supabase/config.toml`
- Test: `__tests__/matchmakingEdgeContracts.test.ts`

- [ ] **Step 1: Write the failing edge contract test**

```ts
import fs from 'fs'
import path from 'path'

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

describe('matchmaking edge functions', () => {
  test('enqueue function exists and attempts a match', () => {
    const source = read('supabase/functions/matchmaking-enqueue/index.ts')
    expect(source).toContain('derivePlayerCountRange')
    expect(source).toContain('FOR UPDATE SKIP LOCKED')
    expect(source).toContain("from('rooms').insert")
    expect(source).toContain("from('room_players').insert")
  })

  test('cancel and status functions exist', () => {
    expect(read('supabase/functions/matchmaking-cancel/index.ts')).toContain("from('matchmaking_queue')")
    expect(read('supabase/functions/matchmaking-status/index.ts')).toContain("from('matchmaking_queue')")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/matchmakingEdgeContracts.test.ts`
Expected: FAIL because the edge functions do not exist yet.

- [ ] **Step 3: Implement `matchmaking-enqueue`**

Build the function so it:

- authenticates the user from bearer token
- validates `displayName` and `preferredPlayerCount`
- derives queue range from preference
- upserts or refreshes one active searching ticket
- attempts exact-size then flexible matching
- uses a transaction and row locking for match formation
- creates a normal room
- bulk inserts `room_players`
- marks matched tickets with room metadata and countdown start time
- returns either searching or matched state

Use the existing edge-function structure and `_shared` utilities for CORS and consistent responses.

- [ ] **Step 4: Implement `matchmaking-cancel`**

Make cancellation idempotent:

- if searching ticket exists, mark it `cancelled`
- if no searching ticket exists, still return `{ ok: true }`

- [ ] **Step 5: Implement `matchmaking-status`**

Return the current user's latest searching or recently matched ticket to support reconnect and app foreground recovery.

- [ ] **Step 6: Register the functions in `supabase/config.toml`**

Add function sections consistent with the existing file.

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- __tests__/matchmakingEdgeContracts.test.ts`
Expected: PASS

- [ ] **Step 8: Run supabase typecheck**

Run: `npm run typecheck:supabase`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/matchmaking-enqueue/index.ts supabase/functions/matchmaking-cancel/index.ts supabase/functions/matchmaking-status/index.ts supabase/config.toml __tests__/matchmakingEdgeContracts.test.ts
git commit -m "feat: add quick match edge functions"
```

### Task 5: Add Queue State Hook And Realtime Subscription

**Files:**
- Create: `src/hooks/useQuickMatch.ts`
- Modify: `src/lib/supabase.ts`
- Modify: `src/types/game.ts`
- Test: `__tests__/useQuickMatchContracts.test.ts`

- [ ] **Step 1: Write the failing hook contract test**

```ts
import fs from 'fs'
import path from 'path'

const source = fs.readFileSync(path.join(process.cwd(), 'src', 'hooks', 'useQuickMatch.ts'), 'utf8')

describe('useQuickMatch contracts', () => {
  test('subscribes to the current users queue ticket and exposes queue actions', () => {
    expect(source).toContain('supabase.channel(')
    expect(source).toContain("table: 'matchmaking_queue'")
    expect(source).toContain('enqueueQuickMatch')
    expect(source).toContain('cancelQuickMatch')
    expect(source).toContain('countdownRemainingMs')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/useQuickMatchContracts.test.ts`
Expected: FAIL because the hook does not exist yet.

- [ ] **Step 3: Implement `useQuickMatch.ts`**

The hook should:

- bootstrap from `getQuickMatchStatus`
- expose `enqueue`, `cancel`, `refresh`
- subscribe only to the current user's ticket updates
- derive countdown remaining time locally from `countdown_starts_at`
- expose view-friendly state such as:
  - `phase: 'idle' | 'searching' | 'matched'`
  - `ticket`
  - `matchedRoomCode`
  - `countdownRemainingMs`
  - `isHost`

Avoid a second-by-second DB write loop.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/useQuickMatchContracts.test.ts`
Expected: PASS

- [ ] **Step 5: Run app typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useQuickMatch.ts __tests__/useQuickMatchContracts.test.ts
git commit -m "feat: add quick match queue hook"
```

### Task 6: Add Quick Match Entry Screen And Queue UI

**Files:**
- Modify: `app/(tabs)/private.tsx`
- Create: `app/(tabs)/quick-match.tsx`
- Create: `__tests__/quickMatchScreenContracts.test.ts`
- Optionally Create: `src/components/matchmaking/PlayerCountPreferencePicker.tsx`

- [ ] **Step 1: Write the failing screen contract test**

```ts
import fs from 'fs'
import path from 'path'

const quickMatchSource = fs.readFileSync(path.join(process.cwd(), 'app', '(tabs)', 'quick-match.tsx'), 'utf8')
const privateSource = fs.readFileSync(path.join(process.cwd(), 'app', '(tabs)', 'private.tsx'), 'utf8')

describe('quick match screen contracts', () => {
  test('quick match screen includes preference selection and queue actions', () => {
    expect(quickMatchSource).toContain('preferredPlayerCount')
    expect(quickMatchSource).toContain('enqueue(')
    expect(quickMatchSource).toContain('cancel(')
    expect(quickMatchSource).toContain('partida encontrada')
  })

  test('private screen links to quick match entry point', () => {
    expect(privateSource).toContain('quick-match')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/quickMatchScreenContracts.test.ts`
Expected: FAIL because the new screen does not exist and the private screen does not link to it yet.

- [ ] **Step 3: Add the new quick-match screen**

Implement a dedicated screen that:

- captures display name
- lets the user choose preference from `3` to `6`
- explains flexible matching briefly
- shows searching state
- shows cancel while searching
- hands off to matched state when a room is found

Use the current visual system and keep it aligned with the auth/home style.

- [ ] **Step 4: Add the quick-match entry point from the existing home/private flow**

Update `app/(tabs)/private.tsx` so users can discover the new quick-match path without disrupting create/join-by-code.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- __tests__/quickMatchScreenContracts.test.ts`
Expected: PASS

- [ ] **Step 6: Run app typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/private.tsx app/(tabs)/quick-match.tsx __tests__/quickMatchScreenContracts.test.ts src/components/matchmaking/PlayerCountPreferencePicker.tsx
git commit -m "feat: add quick match entry ui"
```

### Task 7: Add Match Found Countdown And Direct Room Handoff

**Files:**
- Modify: `app/(tabs)/quick-match.tsx`
- Modify: `app/room/[code]/lobby.tsx`
- Modify: `src/hooks/useQuickMatch.ts`
- Create: `src/components/matchmaking/MatchFoundCountdown.tsx`
- Create: `__tests__/quickMatchCountdownContracts.test.ts`

- [ ] **Step 1: Write the failing countdown contract test**

```ts
import fs from 'fs'
import path from 'path'

const countdownSource = fs.readFileSync(
  path.join(process.cwd(), 'src', 'components', 'matchmaking', 'MatchFoundCountdown.tsx'),
  'utf8',
)

describe('quick match countdown contracts', () => {
  test('countdown component renders avatars, names, and progress state', () => {
    expect(countdownSource).toContain('avatar')
    expect(countdownSource).toContain('displayName')
    expect(countdownSource).toContain('progress')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/quickMatchCountdownContracts.test.ts`
Expected: FAIL because the countdown component does not exist yet.

- [ ] **Step 3: Implement the matched countdown component**

Render:

- player avatars or initials fallback
- player names
- visible progress bar
- brief copy announcing the match

- [ ] **Step 4: Wire the quick-match screen into the countdown flow**

When the ticket becomes `matched`:

- fetch matched room roster or derive enough info to render the matched group
- show countdown
- navigate to `/room/${code}/lobby` at countdown end

- [ ] **Step 5: Make lobby auto-start for quick-match rooms**

Update `app/room/[code]/lobby.tsx` so that:

- matched quick-match entrants do not need manual ready interaction
- host automatically triggers `start_game` after the countdown or immediately on room load if the countdown already elapsed
- non-hosts wait for normal room state transition to `playing`

Keep the path idempotent and preserve existing private-lobby behavior.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- __tests__/quickMatchCountdownContracts.test.ts`
Expected: PASS

- [ ] **Step 7: Run targeted app test suite**

Run: `npm test -- __tests__/quickMatchScreenContracts.test.ts __tests__/quickMatchCountdownContracts.test.ts`
Expected: PASS

- [ ] **Step 8: Run app typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add app/(tabs)/quick-match.tsx app/room/[code]/lobby.tsx src/hooks/useQuickMatch.ts src/components/matchmaking/MatchFoundCountdown.tsx __tests__/quickMatchCountdownContracts.test.ts
git commit -m "feat: add quick match countdown and room handoff"
```

### Task 8: Harden Room Start Path For Quick Match

**Files:**
- Modify: `supabase/functions/game-action/index.ts`
- Create: `__tests__/quickMatchStartContracts.test.ts`
- Modify: `src/types/game.ts`

- [ ] **Step 1: Write the failing start-path contract test**

```ts
import fs from 'fs'
import path from 'path'

const source = fs.readFileSync(
  path.join(process.cwd(), 'supabase', 'functions', 'game-action', 'index.ts'),
  'utf8',
)

describe('quick match start-game resilience', () => {
  test('start_game remains idempotent and allows resilient handoff for quick match rooms', () => {
    expect(source).toContain("case 'start_game'")
    expect(source).toContain('INVALID_STATE')
  })
})
```

- [ ] **Step 2: Run test to verify it fails for the intended gap**

Run: `npm test -- __tests__/quickMatchStartContracts.test.ts`
Expected: FAIL once the assertion is updated to the exact new guard or quick-match-specific contract you intend to add.

- [ ] **Step 3: Add the minimal start-game hardening**

Update `supabase/functions/game-action/index.ts` only as far as needed so quick-match start handoff is resilient:

- keep start behavior idempotent
- do not break private-room expectations
- if necessary, permit a matched room member fallback start after host failure
- if no backend change is needed after integration review, tighten the test to the existing safe behavior and document why

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/quickMatchStartContracts.test.ts`
Expected: PASS

- [ ] **Step 5: Run supabase typecheck**

Run: `npm run typecheck:supabase`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/game-action/index.ts __tests__/quickMatchStartContracts.test.ts
git commit -m "feat: harden quick match start handoff"
```

### Task 9: Add Regression Coverage For Existing Room Flows

**Files:**
- Create: `__tests__/privateRoomRegressionContracts.test.ts`
- Modify: existing tests only if they need to absorb new public-match behavior without weakening private-room assertions

- [ ] **Step 1: Write the regression test**

```ts
import fs from 'fs'
import path from 'path'

describe('private room regressions', () => {
  test('existing room actions remain exposed', () => {
    const apiSource = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'api.ts'), 'utf8')
    expect(apiSource).toContain("('room-create'")
    expect(apiSource).toContain("('room-join'")
    expect(apiSource).toContain("('room-leave'")
    expect(apiSource).toContain("('game-action'")
  })
})
```

- [ ] **Step 2: Run test to verify current behavior**

Run: `npm test -- __tests__/privateRoomRegressionContracts.test.ts`
Expected: PASS

- [ ] **Step 3: Add any additional regression assertions needed**

Ensure quick-match integration has not removed or weakened:

- private room create
- join by code
- manual lobby path
- existing room start path

- [ ] **Step 4: Run targeted Jest suite**

Run: `npm test -- __tests__/matchmakingSchemaContracts.test.ts __tests__/matchmakingHelpers.test.ts __tests__/quickMatchApiContracts.test.ts __tests__/matchmakingEdgeContracts.test.ts __tests__/useQuickMatchContracts.test.ts __tests__/quickMatchScreenContracts.test.ts __tests__/quickMatchCountdownContracts.test.ts __tests__/quickMatchStartContracts.test.ts __tests__/privateRoomRegressionContracts.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add __tests__/privateRoomRegressionContracts.test.ts
git commit -m "test: add quick match regression coverage"
```

### Task 10: Verify End-To-End And Prepare Deployment

**Files:**
- Modify: `docs/superpowers/specs/2026-04-05-dixit-ai-mobile-quick-matchmaking-design.md`
- Optionally Create: `docs/quick-match-rollout-notes.md`

- [ ] **Step 1: Apply the migration to the linked Supabase project**

Run: `npx supabase db push`
Expected: remote migration applies successfully to project `ctjelsuchvzvdjvqdzub`

- [ ] **Step 2: Deploy the new edge functions**

Run: `npx supabase functions deploy matchmaking-enqueue`
Expected: deploy succeeds

Run: `npx supabase functions deploy matchmaking-cancel`
Expected: deploy succeeds

Run: `npx supabase functions deploy matchmaking-status`
Expected: deploy succeeds

- [ ] **Step 3: Run full verification**

Run: `npm test`
Expected: PASS

Run: `npm run typecheck:all`
Expected: PASS

- [ ] **Step 4: Perform manual smoke checks**

Verify:

- one user can enter queue and cancel cleanly
- multiple users with same preference match into one room
- nearby preferences can match flexibly
- matched users see countdown
- room starts automatically
- private room flows still work

- [ ] **Step 5: Update rollout notes if implementation diverged from design**

Document final choices such as:

- countdown duration
- whether `matchmaking-status` was kept
- whether quick-match rooms needed any room metadata flag

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-04-05-dixit-ai-mobile-quick-matchmaking-design.md docs/quick-match-rollout-notes.md
git commit -m "docs: finalize quick match rollout notes"
```
