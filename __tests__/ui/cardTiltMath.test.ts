import { getCardTiltProfile } from '../../src/components/ui/cardTiltRegistry'
import {
  blendCardTiltState,
  computeCardTiltState,
  computeCardTiltStateFromDrag,
  getNeutralTiltState,
  shouldReleaseToScroll,
} from '../../src/components/ui/cardTiltMath'

describe('card tilt math', () => {
  test('tilt profiles match the approved spec constants and richer tuning channels', () => {
    expect(getCardTiltProfile('hero')).toMatchObject({
      maxRotateX: 8,
      maxRotateY: 8,
      maxParallax: 10,
      scale: 1.02,
      damping: 18,
      stiffness: 180,
      pressScaleMin: expect.any(Number),
      maxLiftDepth: expect.any(Number),
      maxShadowOpacity: expect.any(Number),
      maxHighlightOpacity: expect.any(Number),
      velocityRotateBoost: expect.any(Number),
      velocityTranslateBoost: expect.any(Number),
    })

    expect(getCardTiltProfile('standard')).toMatchObject({
      maxRotateX: 5,
      maxRotateY: 5,
      maxParallax: 6,
      scale: 1.012,
      damping: 20,
      stiffness: 200,
      pressScaleMin: expect.any(Number),
      maxLiftDepth: expect.any(Number),
      maxShadowOpacity: expect.any(Number),
      maxHighlightOpacity: expect.any(Number),
      velocityRotateBoost: expect.any(Number),
      velocityTranslateBoost: expect.any(Number),
    })

    expect(getCardTiltProfile('lite')).toMatchObject({
      maxRotateX: 2.5,
      maxRotateY: 2.5,
      maxParallax: 2,
      scale: 1.006,
      damping: 22,
      stiffness: 220,
      pressScaleMin: expect.any(Number),
      maxLiftDepth: expect.any(Number),
      maxShadowOpacity: expect.any(Number),
      maxHighlightOpacity: expect.any(Number),
      velocityRotateBoost: expect.any(Number),
      velocityTranslateBoost: expect.any(Number),
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

  test('center-point input keeps directional axes centered before drag', () => {
    const standard = getCardTiltProfile('standard')
    const state = computeCardTiltState({
      profile: standard,
      layout: { width: 240, height: 360 },
      pointer: { x: 120, y: 180 },
    })

    expect(state.rotateX).toBe(0)
    expect(state.rotateY).toBe(0)
    expect(state.translateX).toBe(0)
    expect(state.translateY).toBe(0)
    expect(state.scale).toBe(standard.scale)
  })

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

  test('drag-relative tilt follows accumulated delta and adds stronger drag-follow translation', () => {
    const standard = getCardTiltProfile('standard')
    const state = computeCardTiltStateFromDrag({
      profile: standard,
      layout: { width: 240, height: 360 },
      drag: { dx: 60, dy: -90 },
      pointer: { x: 180, y: 90 },
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
      pointer: { x: 108, y: 180 },
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
      pointer: { x: 120, y: 180 },
    })

    expect(state.translateX).toBeCloseTo(2.25, 5)
    expect(state.translateY).toBeCloseTo(0.84, 5)
  })

  test('high velocity amplifies the same drag response while staying clamped', () => {
    const hero = getCardTiltProfile('hero')
    const calm = computeCardTiltStateFromDrag({
      profile: hero,
      layout: { width: 200, height: 300 },
      drag: { dx: 24, dy: -16 },
      pointer: { x: 148, y: 108 },
      velocity: { vx: 0, vy: 0 },
      previousState: getNeutralTiltState(),
    })
    const fast = computeCardTiltStateFromDrag({
      profile: hero,
      layout: { width: 200, height: 300 },
      drag: { dx: 24, dy: -16 },
      pointer: { x: 148, y: 108 },
      velocity: { vx: 920, vy: -640 },
      previousState: getNeutralTiltState(),
    })

    expect(Math.abs(fast.rotateX)).toBeGreaterThan(Math.abs(calm.rotateX))
    expect(Math.abs(fast.rotateY)).toBeGreaterThan(Math.abs(calm.rotateY))
    expect(Math.abs(fast.translateX)).toBeGreaterThan(Math.abs(calm.translateX))
    expect(Math.abs(fast.translateY)).toBeGreaterThan(Math.abs(calm.translateY))
    expect(Math.abs(fast.rotateX)).toBeLessThanOrEqual(hero.maxRotateX)
    expect(Math.abs(fast.rotateY)).toBeLessThanOrEqual(hero.maxRotateY)
    expect(Math.abs(fast.rotateX) - Math.abs(calm.rotateX)).toBeLessThanOrEqual(
      hero.velocityRotateBoost,
    )
    expect(Math.abs(fast.rotateY) - Math.abs(calm.rotateY)).toBeLessThanOrEqual(
      hero.velocityRotateBoost,
    )
    expect(Math.abs(fast.translateX) - Math.abs(calm.translateX)).toBeLessThanOrEqual(
      hero.velocityTranslateBoost,
    )
    expect(Math.abs(fast.translateY) - Math.abs(calm.translateY)).toBeLessThanOrEqual(
      hero.velocityTranslateBoost,
    )
  })

  test('previousState preserves prior drag energy when crossing back through center', () => {
    const hero = getCardTiltProfile('hero')
    const current = computeCardTiltStateFromDrag({
      profile: hero,
      layout: { width: 200, height: 300 },
      drag: { dx: 54, dy: -12 },
      pointer: { x: 165, y: 120 },
      velocity: { vx: 620, vy: -140 },
      previousState: getNeutralTiltState(),
    })
    const crossedWithoutHistory = computeCardTiltStateFromDrag({
      profile: hero,
      layout: { width: 200, height: 300 },
      drag: { dx: 20, dy: -10 },
      pointer: { x: 92, y: 122 },
      velocity: { vx: -280, vy: 40 },
    })
    const crossedWithHistory = computeCardTiltStateFromDrag({
      profile: hero,
      layout: { width: 200, height: 300 },
      drag: { dx: 20, dy: -10 },
      pointer: { x: 92, y: 122 },
      velocity: { vx: -280, vy: 40 },
      previousState: current,
    })
    const rotateGapWithoutHistory = Math.abs(current.rotateY - crossedWithoutHistory.rotateY)
    const rotateGapWithHistory = Math.abs(current.rotateY - crossedWithHistory.rotateY)
    const translateGapWithoutHistory = Math.abs(current.translateX - crossedWithoutHistory.translateX)
    const translateGapWithHistory = Math.abs(current.translateX - crossedWithHistory.translateX)

    expect(current.rotateY).toBeGreaterThan(0)
    expect(current.translateX).toBeGreaterThan(0)
    expect(crossedWithHistory.rotateY).toBeGreaterThan(0)
    expect(crossedWithHistory.translateX).toBeGreaterThan(0)
    expect(crossedWithHistory.rotateY).toBeGreaterThan(current.rotateY * 0.25)
    expect(crossedWithHistory.translateX).toBeGreaterThan(current.translateX * 0.25)
    expect(crossedWithHistory.rotateY).toBeGreaterThan(crossedWithoutHistory.rotateY)
    expect(crossedWithHistory.translateX).toBeGreaterThan(crossedWithoutHistory.translateX)
    expect(rotateGapWithHistory).toBeLessThan(rotateGapWithoutHistory * 0.6)
    expect(translateGapWithHistory).toBeLessThan(translateGapWithoutHistory * 0.6)
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

    expect(neutral).toEqual({
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

  test('blendCardTiltState interpolates legacy transform channels and richer visual channels', () => {
    const blended = blendCardTiltState(
      {
        rotateX: 4,
        rotateY: -6,
        translateX: 10,
        translateY: -8,
        scale: 1.02,
        pressScale: 0.94,
        lift: -4,
        shadowShiftX: 6,
        shadowShiftY: -3,
        shadowOpacity: 0.22,
        highlightOpacity: 0.16,
      },
      getNeutralTiltState(),
      0.5,
    )

    expect(blended.rotateX).toBeCloseTo(2, 5)
    expect(blended.rotateY).toBeCloseTo(-3, 5)
    expect(blended.translateX).toBeCloseTo(5, 5)
    expect(blended.translateY).toBeCloseTo(-4, 5)
    expect(blended.scale).toBeCloseTo(1.01, 5)
    expect(blended.pressScale).toBeCloseTo(0.97, 5)
    expect(blended.lift).toBeCloseTo(-2, 5)
    expect(blended.shadowShiftX).toBeCloseTo(3, 5)
    expect(blended.shadowShiftY).toBeCloseTo(-1.5, 5)
    expect(blended.shadowOpacity).toBeCloseTo(0.11, 5)
    expect(blended.highlightOpacity).toBeCloseTo(0.08, 5)
  })
})
