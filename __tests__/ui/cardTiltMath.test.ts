import { getCardTiltProfile } from '../../src/components/ui/cardTiltRegistry'
import {
  blendCardTiltState,
  computeCardTiltState,
  computeCardTiltStateFromDrag,
  getNeutralTiltState,
  shouldReleaseToScroll,
} from '../../src/components/ui/cardTiltMath'

describe('card tilt math', () => {
  test('tilt profiles match the approved spec constants exactly', () => {
    expect(getCardTiltProfile('hero')).toEqual({
      maxRotateX: 8,
      maxRotateY: 8,
      maxParallax: 10,
      scale: 1.02,
      damping: 18,
      stiffness: 180,
    })

    expect(getCardTiltProfile('standard')).toEqual({
      maxRotateX: 5,
      maxRotateY: 5,
      maxParallax: 6,
      scale: 1.012,
      damping: 20,
      stiffness: 200,
    })

    expect(getCardTiltProfile('lite')).toEqual({
      maxRotateX: 2.5,
      maxRotateY: 2.5,
      maxParallax: 2,
      scale: 1.006,
      damping: 22,
      stiffness: 220,
    })
  })

  test('registry returns a safe copy so callers cannot mutate shared profile state', () => {
    const first = getCardTiltProfile('hero')
    first.maxRotateX = 999

    const second = getCardTiltProfile('hero')

    expect(second).not.toBe(first)
    expect(second.maxRotateX).toBe(8)
  })

  test('hero profile clamp behavior limits tilt and parallax to profile bounds', () => {
    const hero = getCardTiltProfile('hero')
    const state = computeCardTiltState({
      profile: hero,
      layout: { width: 200, height: 300 },
      pointer: { x: 500, y: -200 },
    })

    expect(state.rotateX).toBe(hero.maxRotateX)
    expect(state.rotateY).toBe(hero.maxRotateY)
    expect(state.translateX).toBe(hero.maxParallax)
    expect(state.translateY).toBe(-hero.maxParallax)
    expect(state.scale).toBe(hero.scale)
  })

  test('center-point input stays neutral except for profile scale lift', () => {
    const standard = getCardTiltProfile('standard')
    const state = computeCardTiltState({
      profile: standard,
      layout: { width: 240, height: 360 },
      pointer: { x: 120, y: 180 },
    })

    expect(state).toEqual({
      rotateX: 0,
      rotateY: 0,
      translateX: 0,
      translateY: 0,
      scale: standard.scale,
    })
  })

  test('drag-relative tilt follows accumulated delta and adds stronger drag-follow translation', () => {
    const standard = getCardTiltProfile('standard')
    const state = computeCardTiltStateFromDrag({
      profile: standard,
      layout: { width: 240, height: 360 },
      drag: { dx: 60, dy: -90 },
    })

    expect(state.rotateX).toBe(2.5)
    expect(state.rotateY).toBe(2.5)
    expect(state.translateX).toBe(27)
    expect(state.translateY).toBeCloseTo(-25.2, 5)
    expect(state.scale).toBe(standard.scale)
  })

  test('drag-relative tilt stays engaged when the finger crosses the card center', () => {
    const standard = getCardTiltProfile('standard')
    const draggedAcrossCenter = computeCardTiltStateFromDrag({
      profile: standard,
      layout: { width: 240, height: 360 },
      drag: { dx: -24, dy: 0 },
    })

    expect(draggedAcrossCenter.rotateY).toBeLessThan(0)
    expect(draggedAcrossCenter.translateX).toBeLessThan(-4)
    expect(draggedAcrossCenter.scale).toBe(standard.scale)
  })

  test('drag-follow keeps fractional movement for small center drags instead of snapping in whole-pixel steps', () => {
    const standard = getCardTiltProfile('standard')
    const state = computeCardTiltStateFromDrag({
      profile: standard,
      layout: { width: 240, height: 360 },
      drag: { dx: 5, dy: 3 },
    })

    expect(state.translateX).toBeCloseTo(2.25, 5)
    expect(state.translateY).toBeCloseTo(0.84, 5)
  })

  test('tilt math keeps axis mapping and signs consistent with card orientation', () => {
    const hero = getCardTiltProfile('hero')
    const topRight = computeCardTiltState({
      profile: hero,
      layout: { width: 200, height: 300 },
      pointer: { x: 200, y: 0 },
    })
    const bottomLeft = computeCardTiltState({
      profile: hero,
      layout: { width: 200, height: 300 },
      pointer: { x: 0, y: 300 },
    })

    expect(topRight.rotateX).toBeGreaterThan(0)
    expect(topRight.rotateY).toBeGreaterThan(0)
    expect(topRight.translateX).toBeGreaterThan(0)
    expect(topRight.translateY).toBeLessThan(0)

    expect(bottomLeft.rotateX).toBeLessThan(0)
    expect(bottomLeft.rotateY).toBeLessThan(0)
    expect(bottomLeft.translateX).toBeLessThan(0)
    expect(bottomLeft.translateY).toBeGreaterThan(0)
  })

  test('neutral fallback returns rest state when layout or pointer input is missing', () => {
    const hero = getCardTiltProfile('hero')
    const neutral = getNeutralTiltState()

    expect(computeCardTiltState({ profile: hero })).toEqual(neutral)
    expect(
      computeCardTiltState({
        profile: hero,
        layout: { width: 200, height: 300 },
      }),
    ).toEqual(neutral)
    expect(
      computeCardTiltState({
        profile: hero,
        pointer: { x: 50, y: 50 },
      }),
    ).toEqual(neutral)
  })

  test('shouldReleaseToScroll returns true when vertical movement exceeds threshold and dominates dx', () => {
    expect(shouldReleaseToScroll({ dx: 7, dy: 19 })).toBe(true)
    expect(shouldReleaseToScroll({ dx: 20, dy: 19 })).toBe(false)
    expect(shouldReleaseToScroll({ dx: 4, dy: 18 })).toBe(false)
  })

  test('blends drag state across center instead of snapping directly to the neutral target', () => {
    const current = {
      rotateX: 0,
      rotateY: 4,
      translateX: 5,
      translateY: 0,
      scale: 1.02,
    }
    const target = {
      rotateX: 0,
      rotateY: -0.4,
      translateX: -0.5,
      translateY: 0,
      scale: 1.02,
    }

    const blended = blendCardTiltState(current, target, 0.3)

    expect(blended.rotateY).toBeGreaterThan(0)
    expect(blended.rotateY).toBeLessThan(current.rotateY)
    expect(blended.translateX).toBeGreaterThan(0)
    expect(blended.translateX).toBeLessThan(current.translateX)
    expect(blended.scale).toBe(target.scale)
  })
})
