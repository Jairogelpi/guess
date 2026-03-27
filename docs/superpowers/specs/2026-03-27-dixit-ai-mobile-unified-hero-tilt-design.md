# Dixit AI Mobile - Unified Hero Tilt Design

**Date:** 2026-03-27
**Project:** `dixit_ai_mobile`
**Status:** Ready for Planning

---

## Overview

This spec unifies the interactive card physics used across the gallery and gameplay so they match the current welcome card exactly.

The welcome screen already defines the desired behavior through `InteractiveCardTilt profileName="hero"`. The requested change is to make all non-preview interactive cards in gallery and gameplay use that same profile instead of lighter variants.

This is intentionally a scope-limited behavior change:

- no new tilt math
- no new card tilt profile
- no preview card conversion
- no layout redesign

---

## Goal

Make every interactive non-preview card in gallery and gameplay use the exact same drag, tilt, pressure, and release behavior as the welcome hero card.

---

## Confirmed Decisions

### Scope included

Apply the welcome hero tilt behavior to every existing interactive card surface that currently uses `InteractiveCardTilt` in gallery or gameplay.

This includes:

- gallery carousel cards
- gallery wildcard picker cards
- hand cards
- fan hand cards
- board/grid cards
- vote field cards
- any other gameplay card already wrapped by `InteractiveCardTilt` and intended for direct manipulation

### Scope excluded

Do **not** change static or preview-only cards.

This excludes:

- large generated/selected card previews
- static `DixitCard` renders not wrapped for direct interaction
- loading art or decorative card treatments

### Exactness requirement

The change must use the same profile as welcome, not an approximation.

That means:

- reuse `profileName="hero"`
- do not tune `lite` toward `hero`
- do not create a near-duplicate profile unless implementation reveals a hard blocker

---

## Existing State

Current tilt usage is split:

- welcome already uses `hero`
- gallery carousel already uses `hero`
- results reveal already uses `hero`
- several gameplay surfaces still use `lite`

The observed `lite` call sites relevant to this change are:

- `src/components/game/HandGrid.tsx`
- `src/components/game/FanHand.tsx`
- `src/components/game/CardGrid.tsx`
- `src/components/game/VoteCardField.tsx`
- `src/components/game/GalleryWildcardPicker.tsx`

All other existing `InteractiveCardTilt` usages remain unchanged.

This split is what causes gallery/game cards to feel lighter and less attached to the finger than the welcome card.

---

## Recommended Approach

Use a direct profile unification approach:

1. keep `InteractiveCardTilt` unchanged
2. keep `cardTiltMath.ts` and `cardTiltProfiles.ts` unchanged
3. update the target call sites from `profileName="lite"` to `profileName="hero"`
4. leave preview surfaces untouched

This is the smallest change that satisfies the requirement exactly.

---

## Behavior Notes

Because `hero` currently sets `preventScrollRelease: true`, scrollable card surfaces may feel more committed to the drag than they do under `lite`.

This is acceptable for this change because the user explicitly asked for the same physics and effects as welcome. If this later causes usability issues, that should be handled as a separate follow-up with a new approved design.

---

## Files To Modify

Expected implementation targets:

- `src/components/game/HandGrid.tsx`
- `src/components/game/FanHand.tsx`
- `src/components/game/CardGrid.tsx`
- `src/components/game/VoteCardField.tsx`
- `src/components/game/GalleryWildcardPicker.tsx`

Expected no-change references:

- `app/(auth)/welcome.tsx`
- `app/(tabs)/gallery.tsx`
- `src/components/game/ResultsReveal.tsx`

---

## Testing Strategy

Implementation planning should include:

- a regression test that asserts the target interactive card surfaces use `profileName="hero"`
- verification that preview-only surfaces were not changed as part of this task
- focused manual verification in gallery and active gameplay screens to confirm the feel now matches welcome

The test should be narrow and structural. It does not need to simulate gestures if an existing source-based regression test is sufficient for this scope.

---

## Non-Goals

The following are out of scope:

- changing tilt constants in `cardTiltProfiles.ts`
- modifying `InteractiveCardTilt` gesture math
- adding new visual polish layers
- resizing cards to better fit the stronger tilt
- changing preview cards to become interactive

---

## Implementation Readiness

This spec covers one focused behavior change and is ready for implementation planning.
