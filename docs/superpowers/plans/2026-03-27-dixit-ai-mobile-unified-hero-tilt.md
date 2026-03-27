# Unified Hero Tilt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every interactive non-preview gallery/game card use the exact same `InteractiveCardTilt` profile as the welcome hero card.

**Architecture:** Keep the existing shared tilt system unchanged and only swap the scoped gameplay/gallery call sites from `profileName="lite"` to `profileName="hero"`. Guard the change with a source-level regression test so the targeted interactive surfaces stay aligned with welcome while previews and unrelated tilt call sites remain untouched.

**Tech Stack:** React Native, Expo Router, TypeScript, Jest, `InteractiveCardTilt`

---

## File Map

- Create: `__tests__/heroTiltBindings.test.ts`
- Modify: `src/components/game/HandGrid.tsx`
- Modify: `src/components/game/FanHand.tsx`
- Modify: `src/components/game/CardGrid.tsx`
- Modify: `src/components/game/VoteCardField.tsx`
- Modify: `src/components/game/GalleryWildcardPicker.tsx`
- Reference only: `app/(auth)/welcome.tsx`
- Reference only: `app/(tabs)/gallery.tsx`
- Reference only: `src/components/game/ResultsReveal.tsx`
- Reference only: `src/components/game-phases/NarratorPhase.tsx`
- Reference only: `src/components/game-phases/PlayersPhase.tsx`
- Reference only: `src/components/game/CardGenerator.tsx`
- Reference spec: `docs/superpowers/specs/2026-03-27-dixit-ai-mobile-unified-hero-tilt-design.md`

### Task 0: Isolate The Work Before Changing Tilt Bindings

**Files:**
- Reference: `.git/`
- Reference: `docs/superpowers/specs/2026-03-27-dixit-ai-mobile-unified-hero-tilt-design.md`
- Reference: `docs/superpowers/plans/2026-03-27-dixit-ai-mobile-unified-hero-tilt.md`

- [ ] **Step 1: Create a dedicated worktree or otherwise isolate the implementation**

Preferred: use `@superpowers:using-git-worktrees` to create a fresh worktree for this task.

Fallback if a worktree is not used:
- do not rely on repository-wide clean status
- only stage the exact files listed in this plan
- use file-scoped `git diff -- <paths>` commands only

- [ ] **Step 2: Verify commands run from `dixit_ai_mobile`**

Run: `git rev-parse --show-toplevel`

Expected: path resolves to the `dixit_ai_mobile` repository root before any test or commit step.

### Task 1: Lock The Desired Bindings With A Failing Test

**Files:**
- Create: `__tests__/heroTiltBindings.test.ts`
- Reference: `app/(auth)/welcome.tsx`
- Reference: `app/(tabs)/gallery.tsx`
- Reference: `src/components/game/HandGrid.tsx`
- Reference: `src/components/game/FanHand.tsx`
- Reference: `src/components/game/CardGrid.tsx`
- Reference: `src/components/game/VoteCardField.tsx`
- Reference: `src/components/game/GalleryWildcardPicker.tsx`
- Reference: `src/components/game/ResultsReveal.tsx`

- [ ] **Step 1: Write the failing test**

```ts
import fs from 'node:fs'
import path from 'node:path'

function readSource(...segments: string[]) {
  return fs.readFileSync(path.join(__dirname, '..', ...segments), 'utf8')
}

describe('hero tilt bindings', () => {
  test('keeps welcome and gallery on hero while gameplay interactive cards also use hero', () => {
    expect(readSource('app', '(auth)', 'welcome.tsx')).toContain('profileName="hero"')
    expect(readSource('app', '(tabs)', 'gallery.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'HandGrid.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'FanHand.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'CardGrid.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'VoteCardField.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game', 'GalleryWildcardPicker.tsx')).toContain('profileName="hero"')
  })

  test('keeps preview-only surfaces out of the hero tilt binding swap', () => {
    expect(readSource('src', 'components', 'game', 'ResultsReveal.tsx')).toContain('profileName="hero"')
    expect(readSource('src', 'components', 'game-phases', 'NarratorPhase.tsx')).not.toContain('<InteractiveCardTilt')
    expect(readSource('src', 'components', 'game-phases', 'PlayersPhase.tsx')).not.toContain('<InteractiveCardTilt')
    expect(readSource('src', 'components', 'game', 'CardGenerator.tsx')).not.toContain('<InteractiveCardTilt')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run from `dixit_ai_mobile`: `npm test -- --runTestsByPath __tests__/heroTiltBindings.test.ts`

Expected: FAIL because the five scoped gameplay/gallery files still contain `profileName="lite"`.

- [ ] **Step 3: Commit the failing test checkpoint**

```bash
git add __tests__/heroTiltBindings.test.ts
git commit -m "test: cover hero tilt bindings"
```

### Task 2: Swap The Scoped Gameplay Cards To The Hero Profile

**Files:**
- Modify: `src/components/game/HandGrid.tsx`
- Modify: `src/components/game/FanHand.tsx`
- Modify: `src/components/game/CardGrid.tsx`
- Modify: `src/components/game/VoteCardField.tsx`
- Modify: `src/components/game/GalleryWildcardPicker.tsx`

- [ ] **Step 1: Update hand grid to use the hero tilt profile**

```tsx
<InteractiveCardTilt
  key={slot.id}
  profileName="hero"
  regionKey="hand-grid"
  onPress={...}
>
```

- [ ] **Step 2: Update fan hand to use the hero tilt profile**

```tsx
<InteractiveCardTilt
  profileName="hero"
  regionKey="fan-hand"
  onPress={onPress}
  style={styles.tiltWrap}
>
```

- [ ] **Step 3: Update the shared card grid to use the hero tilt profile**

```tsx
<InteractiveCardTilt
  profileName="hero"
  regionKey="card-grid"
  onPress={readonly ? undefined : () => onSelect?.(item)}
>
```

- [ ] **Step 4: Update the vote field cards to use the hero tilt profile**

```tsx
<InteractiveCardTilt
  profileName="hero"
  regionKey="vote-field"
  onPress={onPress}
  style={styles.tiltWrap}
>
```

- [ ] **Step 5: Update the gallery wildcard picker cards to use the hero tilt profile**

```tsx
<InteractiveCardTilt
  key={card.id}
  profileName="hero"
  regionKey="wildcard-picker"
  onPress={() => onPick(card)}
>
```

- [ ] **Step 6: Confirm no preview-only surfaces were modified**

Check:
- `app/(auth)/welcome.tsx` remains on `hero`
- `app/(tabs)/gallery.tsx` remains on `hero`
- `src/components/game/ResultsReveal.tsx` remains unchanged
- `src/components/game-phases/NarratorPhase.tsx` preview card remains static
- `src/components/game-phases/PlayersPhase.tsx` preview card remains static
- `src/components/game/CardGenerator.tsx` preview card remains static
- no preview `DixitCard` render was wrapped or converted

- [ ] **Step 7: Inspect the scoped diff before committing**

Run from `dixit_ai_mobile`: `git diff -- __tests__/heroTiltBindings.test.ts src/components/game/HandGrid.tsx src/components/game/FanHand.tsx src/components/game/CardGrid.tsx src/components/game/VoteCardField.tsx src/components/game/GalleryWildcardPicker.tsx`

Expected: only the new regression test and the five `profileName` swaps appear

- [ ] **Step 8: Commit the implementation**

```bash
git add src/components/game/HandGrid.tsx src/components/game/FanHand.tsx src/components/game/CardGrid.tsx src/components/game/VoteCardField.tsx src/components/game/GalleryWildcardPicker.tsx
git commit -m "feat: unify gameplay card tilt with welcome hero profile"
```

### Task 3: Verify Regression Coverage And Final Scope

**Files:**
- Test: `__tests__/heroTiltBindings.test.ts`
- Modify if needed: `__tests__/heroTiltBindings.test.ts`

- [ ] **Step 1: Run the focused regression test**

Run from `dixit_ai_mobile`: `npm test -- --runTestsByPath __tests__/heroTiltBindings.test.ts`

Expected: PASS

- [ ] **Step 2: Verify shared tilt math/profile files stayed untouched**

Run from `dixit_ai_mobile`: `git diff -- src/components/ui/InteractiveCardTilt.tsx src/components/ui/cardTiltMath.ts src/components/ui/cardTiltProfiles.ts`

Expected: no diff for shared tilt implementation files because this task only changes bindings

- [ ] **Step 3: Perform manual verification in runtime**

Run from `dixit_ai_mobile`:
- terminal 1: `npm run web`
- terminal 2: `npm run room:3p:open`

Check in runtime:
- gallery carousel cards now drag/tilt like welcome
- wildcard picker cards now drag/tilt like welcome
- hand/grid/vote cards now drag/tilt like welcome
- large preview cards remain static and were not converted

Record any regressions around scroll feel separately; do not expand scope in this task.

- [ ] **Step 4: Commit any final test-only cleanup if needed**

```bash
git add __tests__/heroTiltBindings.test.ts
git commit -m "test: lock gameplay cards to hero tilt profile"
```
