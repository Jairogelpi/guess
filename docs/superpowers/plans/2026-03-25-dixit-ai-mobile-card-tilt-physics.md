# Card Tilt Physics Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every shared card tilt interaction so press, drag, release, and 3D depth feel heavier, smoother, and more realistic without changing the `InteractiveCardTilt` public API.

**Architecture:** Keep the existing centralized tilt pipeline: `cardTiltMath.ts` remains the deterministic gesture-to-pose engine, `cardTiltProfiles.ts` remains the profile tuning layer, and `InteractiveCardTilt.tsx` remains the only runtime wrapper that applies animation and visual polish. Extend the current tilt state into a richer pose, preserve scroll-release and reduced-motion guardrails, and avoid call-site churn by keeping all usage sites on the same component contract.

**Tech Stack:** Expo, React Native, React Native Gesture Handler, React Native Reanimated, TypeScript, Jest

---

## File map

- Modify: `jest.config.js`
- Modify: `tsconfig.jest.json`
- Modify: `__tests__/ui/cardTiltMath.test.ts`
- Modify: `__tests__/ui/InteractiveCardTilt.test.tsx`
- Modify: `src/components/ui/cardTiltMath.ts`
- Modify: `src/components/ui/cardTiltProfiles.ts`
- Modify: `src/components/ui/InteractiveCardTilt.tsx`

## Task 0: Stabilize the Jest harness before behavior TDD

**Files:**
- Modify: `jest.config.js`
- Modify: `tsconfig.jest.json`
- Test: `__tests__/ui/InteractiveCardTilt.test.tsx`

- [ ] **Step 1: Reproduce the current non-behavior failure**

Run:

```powershell
npx jest --runInBand __tests__/ui/InteractiveCardTilt.test.tsx
```

Expected today: FAIL before any assertions with a JSX parse error from `src/components/ui/InteractiveCardTilt.tsx`. Do not start behavior TDD until this harness issue is resolved, or RED/GREEN results will be meaningless.

- [ ] **Step 2: Point Jest at an explicit TSX-capable test config**

Update `jest.config.js` so `ts-jest` uses `tsconfig.jest.json` instead of an inline minimal config, for example:

```js
transform: {
  '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
}
```

Then make sure `tsconfig.jest.json` includes JSX-capable settings if they are not already inherited cleanly:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "types": ["jest", "node"],
    "jsx": "react-jsx"
  }
}
```

- [ ] **Step 3: Re-run the suite until it reaches assertion-level failures**

Run:

```powershell
npx jest --runInBand __tests__/ui/InteractiveCardTilt.test.tsx
```

Expected: FAIL on real controller assertions or type mismatches, not on an `Unexpected token '<'` parse error.

- [ ] **Step 4: Commit the harness fix**

```powershell
git add jest.config.js tsconfig.jest.json
git commit -m "test: fix tsx transform for tilt interaction tests"
```

## Task 1: Lock the richer math contract with failing tests

**Files:**
- Modify: `__tests__/ui/cardTiltMath.test.ts`
- Test: `__tests__/ui/cardTiltMath.test.ts`

- [ ] **Step 1: Update the existing baseline expectations that currently hard-code the old shape**

Before adding new behavior tests, rewrite the current brittle expectations so the file targets the richer contract instead of the old 5-field shape.

Update the profile assertions to include the new tuning fields instead of comparing against the old minimal object:

```ts
expect(getCardTiltProfile('hero')).toMatchObject({
  maxRotateX: 8,
  maxRotateY: 8,
  maxParallax: 10,
  scale: 1.02,
  pressScaleMin: expect.any(Number),
  maxLiftDepth: expect.any(Number),
  maxShadowOpacity: expect.any(Number),
  maxHighlightOpacity: expect.any(Number),
  velocityRotateBoost: expect.any(Number),
  velocityTranslateBoost: expect.any(Number),
})
```

Also update the older drag tests so they pass explicit `pointer` input and no longer rely on the outdated "drag-only" call pattern.

- [ ] **Step 2: Expand the neutral-pose expectations**

Update `__tests__/ui/cardTiltMath.test.ts` so the neutral state now expects the full richer shape:

```ts
expect(getNeutralTiltState()).toEqual({
  rotateX: 0,
  rotateY: 0,
  translateX: 0,
  translateY: 0,
  scale: 1,
  pressScale: 1,
  lift: 0,
  shadowShiftX: 0,
  shadowShiftY: 0,
  shadowOpacity: 0,
  highlightOpacity: 0,
})
```

- [ ] **Step 3: Add failing press/drag/velocity/blend tests**

Add tests that prove the requested behavior before touching implementation:

```ts
test('press without drag produces directional sink and compression', () => {
  const hero = getCardTiltProfile('hero')
  const state = computeCardTiltState({
    profile: hero,
    layout: { width: 200, height: 300 },
    pointer: { x: 180, y: 40 },
  })

  expect(state.rotateX).toBeGreaterThan(0)
  expect(state.rotateY).toBeGreaterThan(0)
  expect(state.pressScale).toBeLessThan(1)
  expect(state.lift).toBeLessThan(0)
})

test('drag pose responds to velocity without snapping through center', () => {
  const hero = getCardTiltProfile('hero')
  const current = computeCardTiltStateFromDrag({
    profile: hero,
    layout: { width: 200, height: 300 },
    drag: { dx: 54, dy: -12 },
    pointer: { x: 165, y: 120 },
    velocity: { vx: 620, vy: -140 },
    previousState: getNeutralTiltState(),
  })
  const crossed = computeCardTiltStateFromDrag({
    profile: hero,
    layout: { width: 200, height: 300 },
    drag: { dx: 20, dy: -10 },
    pointer: { x: 92, y: 122 },
    velocity: { vx: -280, vy: 40 },
    previousState: current,
  })

  expect(current.pressScale).toBeLessThan(1)
  expect(current.highlightOpacity).toBeGreaterThan(0)
  expect(crossed.rotateY).toBeGreaterThan(-hero.maxRotateY)
  expect(crossed.rotateY).toBeLessThan(current.rotateY)
})

test('velocity boost stays clamped inside profile bounds', () => {
  const hero = getCardTiltProfile('hero')
  const state = computeCardTiltStateFromDrag({
    profile: hero,
    layout: { width: 200, height: 300 },
    drag: { dx: 180, dy: -120 },
    pointer: { x: 190, y: 24 },
    velocity: { vx: 2600, vy: -1900 },
    previousState: getNeutralTiltState(),
  })

  expect(Math.abs(state.rotateX)).toBeLessThanOrEqual(hero.maxRotateX)
  expect(Math.abs(state.rotateY)).toBeLessThanOrEqual(hero.maxRotateY)
  expect(Math.abs(state.translateX)).toBeGreaterThan(0)
  expect(Math.abs(state.translateY)).toBeGreaterThan(0)
})

test('blendCardTiltState interpolates the richer visual channels', () => {
  const blended = blendCardTiltState(
    {
      ...getNeutralTiltState(),
      pressScale: 0.96,
      lift: -4,
      shadowShiftX: 6,
      shadowShiftY: -3,
      shadowOpacity: 0.22,
      highlightOpacity: 0.16,
    },
    getNeutralTiltState(),
    0.5,
  )

  expect(blended.pressScale).toBeGreaterThan(0.96)
  expect(blended.pressScale).toBeLessThan(1)
  expect(blended.lift).toBeLessThan(0)
  expect(blended.shadowOpacity).toBeGreaterThan(0)
  expect(blended.highlightOpacity).toBeGreaterThan(0)
})
```

- [ ] **Step 4: Run the math test to verify RED**

Run:

```powershell
npx jest --runInBand __tests__/ui/cardTiltMath.test.ts
```

Expected: FAIL because the current tilt state does not expose the new pose fields and `computeCardTiltStateFromDrag` does not yet accept `velocity` or `previousState`.

- [ ] **Step 5: Commit the red test contract**

```powershell
git add __tests__/ui/cardTiltMath.test.ts
git commit -m "test: define richer card tilt math contract"
```

## Task 2: Implement the richer pose in math and profile tuning

**Files:**
- Modify: `src/components/ui/cardTiltMath.ts`
- Modify: `src/components/ui/cardTiltProfiles.ts`
- Test: `__tests__/ui/cardTiltMath.test.ts`

- [ ] **Step 1: Extend the profile model with press/depth tuning**

Update `src/components/ui/cardTiltProfiles.ts` so each profile includes the channels needed by the new pose:

```ts
export interface CardTiltProfile {
  maxRotateX: number
  maxRotateY: number
  maxParallax: number
  scale: number
  damping: number
  stiffness: number
  pressScaleMin: number
  maxLiftDepth: number
  maxShadowOpacity: number
  maxHighlightOpacity: number
  velocityRotateBoost: number
  velocityTranslateBoost: number
  dragMultiplierX?: number
  dragMultiplierY?: number
  maxDragX?: number
  maxDragY?: number
  preventScrollRelease?: boolean
}
```

Tune the profiles in this direction:
- `hero`: deepest press sink, highest highlight/shadow amplitude, slowest recovery
- `standard`: strong but tighter
- `lite`: clearly physical but restrained

Make sure the updated profile fields line up with the rewritten `toMatchObject(...)` expectations from Task 1 so the green checkpoint is reachable without ad-hoc test edits.

- [ ] **Step 2: Expand `CardTiltState` into the richer pose shape**

In `src/components/ui/cardTiltMath.ts`, keep the exported name `CardTiltState` for compatibility, but add the new fields:

```ts
export interface CardTiltState {
  rotateX: number
  rotateY: number
  translateX: number
  translateY: number
  scale: number
  pressScale: number
  lift: number
  shadowShiftX: number
  shadowShiftY: number
  shadowOpacity: number
  highlightOpacity: number
}
```

Update `getNeutralTiltState()` so all new fields return neutral values.

- [ ] **Step 3: Implement weighted press and drag helpers**

Add helpers that keep math deterministic and testable:

```ts
function computePressChannels(...) {
  return {
    pressScale: ...,
    lift: ...,
    shadowShiftX: ...,
    shadowShiftY: ...,
    shadowOpacity: ...,
    highlightOpacity: ...,
  }
}

export function computeCardTiltStateFromDrag({
  profile,
  layout,
  drag,
  pointer,
  velocity,
  previousState,
}: {
  profile: CardTiltProfile
  layout?: CardTiltLayout
  drag?: CardTiltDrag
  pointer?: CardTiltPointer
  velocity?: { vx: number; vy: number }
  previousState?: CardTiltState
}): CardTiltState {
  // Blend pointer tilt + drag follow + velocity boost + prior-state hysteresis.
}
```

Implementation rules:
- `computeCardTiltState()` must already create a non-neutral press pose from pointer location alone
- `computeCardTiltStateFromDrag()` must combine pointer, drag, optional velocity, and optional prior state
- all channels must be clamped
- center crossing must reduce and reverse energy progressively rather than flipping abruptly

- [ ] **Step 4: Update blend logic to interpolate every pose channel**

Keep `blendCardTiltState(current, target, alpha)` but make it interpolate all richer fields instead of only rotation:

```ts
return {
  rotateX: lerp(current.rotateX, target.rotateX, alpha),
  rotateY: lerp(current.rotateY, target.rotateY, alpha),
  translateX: lerp(current.translateX, target.translateX, alpha),
  translateY: lerp(current.translateY, target.translateY, alpha),
  scale: lerp(current.scale, target.scale, alpha),
  pressScale: lerp(current.pressScale, target.pressScale, alpha),
  lift: lerp(current.lift, target.lift, alpha),
  shadowShiftX: lerp(current.shadowShiftX, target.shadowShiftX, alpha),
  shadowShiftY: lerp(current.shadowShiftY, target.shadowShiftY, alpha),
  shadowOpacity: lerp(current.shadowOpacity, target.shadowOpacity, alpha),
  highlightOpacity: lerp(current.highlightOpacity, target.highlightOpacity, alpha),
}
```

- [ ] **Step 5: Run the math test to verify GREEN**

Run:

```powershell
npx jest --runInBand __tests__/ui/cardTiltMath.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit the math layer**

```powershell
git add src/components/ui/cardTiltMath.ts src/components/ui/cardTiltProfiles.ts __tests__/ui/cardTiltMath.test.ts
git commit -m "feat: add weighted card tilt math"
```

## Task 3: Lock controller behavior with failing integration tests

**Files:**
- Modify: `__tests__/ui/InteractiveCardTilt.test.tsx`
- Test: `__tests__/ui/InteractiveCardTilt.test.tsx`

- [ ] **Step 1: Add failing controller tests for press sink and richer neutral state**

Extend `__tests__/ui/InteractiveCardTilt.test.tsx` with controller-level expectations:

```ts
test('begin gesture plus zero drag already produces a pressed pose', () => {
  const controller = createInteractiveCardTiltController({
    profileName: 'hero',
    regionKey: 'gallery',
  })

  expect(controller.beginGesture()).toBe(true)

  const pressed = controller.updateGesture({
    dx: 0,
    dy: 0,
    vx: 0,
    vy: 0,
    x: 172,
    y: 54,
    layout: { width: 200, height: 300 },
  })

  expect(pressed.pressScale).toBeLessThan(1)
  expect(pressed.lift).toBeLessThan(0)
})

test('finalize restores the full richer neutral pose', () => {
  const controller = createInteractiveCardTiltController({
    profileName: 'standard',
    regionKey: 'gallery',
  })

  expect(controller.beginGesture()).toBe(true)
  controller.updateGesture({
    dx: 30,
    dy: -18,
    vx: 420,
    vy: -120,
    x: 150,
    y: 110,
    layout: { width: 200, height: 300 },
  })

  expect(controller.finalizeGesture()).toEqual(cardTiltMath.getNeutralTiltState())
})
```

- [ ] **Step 2: Update all existing `updateGesture(...)` calls in the test file to the new input shape**

Before running the RED checkpoint, update every existing controller call site in `__tests__/ui/InteractiveCardTilt.test.tsx` so the file compiles against the expanded signature:

```ts
controller.updateGesture({
  dx: 6,
  dy: 6,
  vx: 0,
  vy: 0,
  x: 180,
  y: 40,
  layout: { width: 200, height: 300 },
})
```

Add `vx: 0` and `vy: 0` to legacy cases unless a test is explicitly about velocity.

- [ ] **Step 3: Run the controller test to verify RED**

Run:

```powershell
npx jest --runInBand __tests__/ui/InteractiveCardTilt.test.tsx
```

Expected: FAIL because the controller input shape and returned state do not yet carry `vx`, `vy`, `pressScale`, `lift`, or the richer neutral pose.

- [ ] **Step 4: Commit the red controller contract**

```powershell
git add __tests__/ui/InteractiveCardTilt.test.tsx
git commit -m "test: define weighted card tilt controller behavior"
```

## Task 4: Implement the richer controller and internal visual layers

**Files:**
- Modify: `src/components/ui/InteractiveCardTilt.tsx`
- Test: `__tests__/ui/InteractiveCardTilt.test.tsx`
- Test: `__tests__/ui/cardTiltMath.test.ts`

- [ ] **Step 1: Extend controller gesture input to accept velocity**

In `src/components/ui/InteractiveCardTilt.tsx`, update the controller input shape:

```ts
interface GestureUpdateInput {
  dx: number
  dy: number
  vx: number
  vy: number
  x: number
  y: number
  layout?: ControllerLayout
}
```

Pass `vx` and `vy` from the gesture handler event into `controller.updateGesture(...)`.

- [ ] **Step 2: Keep the controller state aligned with the richer pose**

Update the controller so:
- `beginGesture()` resets to the richer neutral state
- `updateGesture()` uses `computeCardTiltStateFromDrag({ ..., velocity, previousState: lastState })`
- zero-drag begin events still produce a meaningful pressed pose
- `finalizeGesture()` and `dispose()` always return the richer neutral state

Representative implementation:

```ts
const targetState = cardTiltMath.computeCardTiltStateFromDrag({
  profile,
  layout,
  drag: { dx, dy },
  pointer: { x, y },
  velocity: { vx, vy },
  previousState: lastState,
})

lastState = cardTiltMath.blendCardTiltState(lastState, targetState, 0.45)
```

Use a lower alpha than the current `0.75` if needed to make movement feel heavier and less mechanical.

- [ ] **Step 3: Add shared values for the new visual channels**

Inside `InteractiveCardTilt`, add shared values for:

```ts
const pressScale = useSharedValue(1)
const lift = useSharedValue(0)
const shadowShiftX = useSharedValue(0)
const shadowShiftY = useSharedValue(0)
const shadowOpacity = useSharedValue(0)
const highlightOpacity = useSharedValue(0)
```

Update `applyState()` and `springToRest()` so all of them animate together.

- [ ] **Step 4: Render the internal polish layers without changing the API**

Wrap children in a stable internal frame that can host highlight and shadow layers:

```tsx
<View style={containerStyle}>
  <Animated.View pointerEvents="none" style={[styles.shadowLayer, shadowStyle]} />
  <Animated.View style={[animatedCardStyle, style]}>
    {children}
    <Animated.View pointerEvents="none" style={[styles.highlightLayer, highlightStyle]} />
  </Animated.View>
</View>
```

Implementation rules:
- keep `children` ownership unchanged
- do not require call-site props
- validate clipping/masking so overlays do not leak outside card shapes on web
- preserve the current web sizing workaround
- keep `reducedMotion` as an early return with no active press-sink effect

- [ ] **Step 5: Run controller and math tests to verify GREEN**

Run:

```powershell
npx jest --runInBand __tests__/ui/cardTiltMath.test.ts __tests__/ui/InteractiveCardTilt.test.tsx
```

Expected: PASS

- [ ] **Step 6: Commit the runtime layer**

```powershell
git add src/components/ui/InteractiveCardTilt.tsx __tests__/ui/InteractiveCardTilt.test.tsx __tests__/ui/cardTiltMath.test.ts src/components/ui/cardTiltMath.ts src/components/ui/cardTiltProfiles.ts
git commit -m "feat: add 3d card tilt interaction polish"
```

## Task 5: Verify regressions on the real card surfaces

**Files:**
- No code by default

- [ ] **Step 1: Run focused shared-UI verification**

Run:

```powershell
npx jest --runInBand __tests__/ui/cardTiltMath.test.ts __tests__/ui/InteractiveCardTilt.test.tsx __tests__/welcomeHero.test.ts
```

Expected: PASS

- [ ] **Step 2: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS

- [ ] **Step 3: Run a web build verification**

Run:

```powershell
npx expo export --platform web
```

Expected: completes without type/runtime export errors

- [ ] **Step 4: Manual interaction pass on every important card surface**

Run the app and verify:
- `app/(auth)/welcome.tsx`: the hero card sinks toward the press point even before dragging
- `app/(tabs)/gallery.tsx`: the active gallery card feels heavier during short drags and vertical scroll still wins
- `src/components/game/FanHand.tsx`: fan cards remain responsive and do not jitter when crossing center
- `src/components/game/HandGrid.tsx`: grid cards preserve selection/press behavior with the new 3D pose
- reduced-motion mode keeps taps working while disabling active 3D press/drag behavior
- highlight/shadow overlays stay clipped correctly on web and native

- [ ] **Step 5: Final commit**

```powershell
git add src/components/ui/InteractiveCardTilt.tsx src/components/ui/cardTiltMath.ts src/components/ui/cardTiltProfiles.ts __tests__/ui/cardTiltMath.test.ts __tests__/ui/InteractiveCardTilt.test.tsx
git commit -m "chore: verify card tilt physics polish"
```
