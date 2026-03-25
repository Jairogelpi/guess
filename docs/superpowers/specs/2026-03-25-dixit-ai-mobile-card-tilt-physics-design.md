# Card Tilt Physics Polish - Design Spec

**Date:** 2026-03-25
**Project:** dixit-ai-mobile
**Scope:** Upgrade the shared `InteractiveCardTilt` system used across the app so card drag, press, tilt, and release feel smoother, more physical, more three-dimensional, and more performant.

---

## 1. Problem Statement

The current card tilt interaction is functional but still reads as a UI effect rather than a tactile object.

The current behavior has five specific shortcomings:

1. A press without drag does not create a meaningful directional sink, so the card feels flat until the finger moves.
2. Drag follow is mostly linear translation plus pointer tilt, which makes the card feel mechanically attached to the finger rather than weighted.
3. Crossing the card center can still feel visually abrupt even though rotation is blended.
4. Visual depth is under-expressed: the interaction rotates and translates, but the card does not noticeably compress, sink, or shift highlight/shadow in a way that suggests thickness and weight.
5. The effect must work everywhere `InteractiveCardTilt` is used, so the system needs to become richer without introducing fragile per-screen logic or hurting performance in scroll-heavy views.

---

## 2. Confirmed Design Decisions

All decisions below were explicitly confirmed during brainstorming.

### 2.1 Scope

The new interaction model applies to every `InteractiveCardTilt` instance in the project, not just the gallery or playable hand. This includes:

- welcome hero card
- gallery cards
- hand/grid cards used during gameplay
- any other card surface already wrapped by `InteractiveCardTilt`

There will still be profile-based intensity differences (`hero`, `standard`, `lite`), but all profiles adopt the same richer physical model.

### 2.2 Recommended Approach

The system will evolve by refining the existing tilt engine rather than replacing it with a full physics simulation.

Chosen approach:

- keep `InteractiveCardTilt` as the single shared interaction wrapper
- keep `cardTiltMath` as the source of truth for gesture-to-pose math
- expand the state model so the card can express press depth, drag torque, directional sink, and release inertia
- preserve the current public API so existing call sites do not need to be rewritten

Rejected alternative:

- a full velocity/inertia physics engine per card was considered, but rejected for this phase because it adds substantial complexity and a higher risk of jank on mobile/web relative to the benefit

### 2.3 Interaction Thesis

The card should feel like a stiff but slightly compliant object with mass. It should not behave like rubber, nor like a static transform.

The interaction goals are:

- **Press sink:** if the user presses and holds without dragging, the card should already respond by dipping toward the contact quadrant as if weight were added there
- **Weighted drag:** once the user drags, the card should not simply match finger position; it should lean into the movement with mild lag and continuity
- **Calm release:** on release, the card should recover cleanly with a subtle sense of inertia, not a brittle snap-back

### 2.4 Visual Thesis

The card should read as a premium illustrated object with thickness, pressure, and cinematic light. The 3D effect must remain elegant and controlled rather than exaggerated.

### 2.5 Performance Rule

The richer feel must come from better math and better use of Reanimated state, not from expensive rendering patterns or per-screen special cases.

Hard constraints:

- no continuous layout measurement during gesture updates
- no extra global listeners per card
- no duplicate implementations for different screens
- reduced motion must continue to disable tilt while preserving press behavior
- scroll handoff must continue to work in scrollable views

---

## 3. Visual Companion Summary

The user approved use of the visual companion for this brainstorming track. No browser mockup was required for the approved design because the remaining decisions were about interaction semantics and system architecture rather than layout comparison.

---

## 4. Existing System Assessment

The current implementation is already centralized and testable:

- `src/components/ui/InteractiveCardTilt.tsx` owns gesture orchestration and animation application
- `src/components/ui/cardTiltMath.ts` computes tilt state and blending
- `src/components/ui/cardTiltProfiles.ts` defines intensity per usage tier

This architecture is worth preserving. The weakness is not structural duplication; it is that the current tilt state is too small:

```ts
interface CardTiltState {
  rotateX: number
  rotateY: number
  translateX: number
  translateY: number
  scale: number
}
```

That model supports a clean premium tilt, but it does not encode pressure, sink, or gesture energy strongly enough to create the requested realism.

---

## 5. Target Interaction Model

### 5.1 Pose Model

The interaction system will move from a simple transform state to a richer pose model. The pose still drives transforms, but it also exposes visual depth cues.

Target shape:

```ts
interface CardTiltPose {
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

Notes:

- `scale` remains the baseline profile lift
- `pressScale` is the compression introduced by active contact
- `lift` is a simulated Z offset used to deepen the 3D read during active press/drag
- shadow/highlight fields are derived visual channels, not gesture inputs

Implementation detail: naming may change in code, but the system must support all of these expressive dimensions.

### 5.2 Press Without Drag

When a gesture begins, the card should immediately adopt a directional pressed state before any meaningful translation occurs.

Behavior:

- use initial pointer position within the card bounds
- compute a quadrant-sensitive sink toward the touch point
- slightly compress the card
- apply a small downward/lift-reduction effect so the card feels pushed in
- bias highlight and shadow according to the tilt direction

This is the key requirement from the user: a simple press must already feel weighted and three-dimensional.

### 5.3 Weighted Drag

During drag, the target pose comes from a blend of four signals:

1. pointer position inside the card
2. cumulative drag delta
3. recent gesture velocity
4. prior pose state for hysteresis/smoothing

The resulting behavior should feel like:

- drag direction influences torque more strongly than before
- translation follows the gesture, but with softer weighting than direct mapping
- crossing the center reduces and reverses energy progressively instead of snapping
- short, fast drags feel more alive than short, slow drags

### 5.4 Release and Return

On finalize:

- the active gesture pose resolves to rest through a spring tuned for controlled inertia
- the card may overshoot slightly, but only within a premium restrained range
- all channels return together: rotation, translation, compression, shadow, and highlight

The release should read as "the object settles back into place", not "the transform reset".

---

## 6. Architecture Changes

### 6.1 `cardTiltMath.ts`

This file remains the source of truth for all gesture math.

It will gain:

- a richer pose type
- a function that computes directional press pose from pointer + layout
- a function that computes weighted drag pose from pointer + drag + velocity + prior pose
- a blend function that interpolates all pose channels consistently
- helpers for clamping, easing, and center-cross hysteresis

Representative API direction:

```ts
export interface CardTiltGestureInput {
  layout: CardTiltLayout
  pointer: CardTiltPointer
  drag: CardTiltDrag
  velocity?: { vx: number; vy: number }
  phase: 'press' | 'drag' | 'release'
}

export interface CardTiltPose { ... }

export function computeCardPressPose(...)
export function computeCardDragPose(...)
export function blendCardTiltPose(...)
export function getNeutralTiltPose(...)
```

The exact function names may differ, but the module must continue to be deterministic and easy to test without rendering.

### 6.2 `InteractiveCardTilt.tsx`

This component remains responsible for:

- creating the gesture controller
- storing shared values
- translating pose output into animated styles
- restoring neutral state on finalize/dispose

Changes:

- controller state expands from a simple tilt snapshot to the richer pose
- gesture updates start with a meaningful press pose on `onBegin`
- velocity from gesture handler events is fed into math when available
- spring-back animates all relevant shared values, not just rotation/translation/scale
- the component renders internal visual layers needed for moving highlight/shadow without changing its public API

The wrapper must still support both passive surfaces and pressable surfaces, and still work on web.

### 6.3 `cardTiltProfiles.ts`

Profiles will be recalibrated rather than redesigned.

Each profile still defines overall intensity, but now across more channels:

- max rotation
- drag torque
- press compression
- lift depth
- shadow/highlight amplitude
- damping/stiffness

Expected direction:

- `hero`: strongest depth and longest recovery
- `standard`: clearly premium but tighter
- `lite`: lighter motion with reduced depth, still noticeably physical

### 6.4 Call Sites

No call site should need new props for this phase.

Files already using `InteractiveCardTilt` keep their current contract:

- `app/(auth)/welcome.tsx`
- `app/(tabs)/gallery.tsx`
- `src/components/game/FanHand.tsx`
- `src/components/game/HandGrid.tsx`
- any other current usages

This keeps the rollout safe and global.

---

## 7. Visual Polish Rules

### 7.1 Light and Shadow

The card interaction must express depth through light, not only geometry.

Rules:

- shadow shifts slightly opposite the perceived light direction
- shadow opacity increases modestly during active press/drag
- a subtle highlight/gloss layer moves with the tilt to reinforce surface curvature
- visual polish must stay tasteful; no arcade sheen or exaggerated fake-metal look

### 7.2 Compression and Thickness

The card should feel pressed, not inflated.

Rules:

- active contact introduces slight compression rather than enlargement
- any scale-up from profile lift must be balanced against pressure compression
- the card should never look squashed or elastic

### 7.3 Motion Character

Rules:

- movement should look smoother than the current implementation in quick drags and tiny drags
- no sudden sign flips when passing through center
- no exaggerated wobble on release
- the result should feel more physical, not more noisy

---

## 8. Performance Strategy

The project requirement includes better perceived fluidity and better runtime behavior.

Performance strategy:

- keep layout capture to `onLayout` only
- keep gesture math pure and numeric
- update only shared values already required for the active card
- avoid creating expensive JS objects inside hot loops where practical
- prefer stable animated style composition over conditional subtree swapping
- preserve the existing region ownership system so only one card in a region is active at once

Expected outcome:

- smoother feel from better state transitions and less abrupt math
- no regression in scroll performance
- no need for per-screen optimization hacks

---

## 9. Testing Strategy

This work will follow TDD and extend the existing dedicated tilt test suite.

### 9.1 `__tests__/ui/cardTiltMath.test.ts`

Add failing tests first for:

- press-without-drag produces directional sink and compression
- drag pose combines pointer and drag influence without direct snapping
- center crossing preserves continuity
- velocity increases torque/translation within clamped bounds
- blend function interpolates new pose channels correctly
- neutral fallback still returns the full neutral pose

### 9.2 `__tests__/ui/InteractiveCardTilt.test.tsx`

Add failing tests first for:

- `beginGesture` plus zero drag already produces a non-neutral pressed pose
- drag updates keep continuity as pointer crosses center
- finalize returns the richer neutral pose
- reduced motion still suppresses active tilt behavior
- scroll release still cancels local tilt in vertical scroll scenarios

### 9.3 Verification

Required verification before implementation is considered complete:

- targeted Jest runs for the tilt math/controller tests
- full relevant Jest suite if touched behavior extends into shared UI
- TypeScript typecheck

---

## 10. Risks and Guardrails

### 10.1 Main Risks

- over-tuning the interaction into something noisy or toy-like
- introducing visual layers that complicate web sizing behavior
- making profile behavior diverge too much across screens
- accidentally regressing reduced-motion or scroll-release behavior

### 10.2 Guardrails

- keep one shared engine
- keep the public API stable
- clamp all derived motion channels
- preserve reduced-motion early exit
- preserve existing region ownership semantics
- verify web wrapper sizing after changes

---

## 11. Out of Scope

- replacing `InteractiveCardTilt` with a general-purpose physics engine
- adding haptics or audio
- redesigning unrelated game layouts
- changing non-card components to use the effect
- introducing screen-specific props just to tune one isolated surface

---

## 12. Implementation Outline

The implementation plan created after this spec should break the work into these steps:

1. extend tilt math tests for press sink, weighted drag, continuity, and richer neutral pose
2. implement the richer pose model and updated profile constants in `cardTiltMath.ts` and `cardTiltProfiles.ts`
3. extend controller/component tests for begin/update/finalize behavior
4. update `InteractiveCardTilt.tsx` to animate the richer pose and internal visual layers
5. run targeted tests, then typecheck, then do a quick manual pass on the main card surfaces

This order preserves the existing architecture while upgrading feel globally.
