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
    expect(state.pressScale).toBeGreaterThanOrEqual(hero.pressScaleMin)
    expect(state.lift).toBeGreaterThanOrEqual(-hero.maxLiftDepth)
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
    expect(blended.lift).toBeGreaterThan(-4)
    expect(blended.lift).toBeLessThan(0)
    expect(blended.shadowShiftX).toBeGreaterThan(0)
    expect(blended.shadowShiftX).toBeLessThan(6)
    expect(blended.shadowShiftY).toBeLessThan(0)
    expect(blended.shadowShiftY).toBeGreaterThan(-3)
    expect(blended.shadowOpacity).toBeGreaterThan(0)
    expect(blended.shadowOpacity).toBeLessThan(0.22)
    expect(blended.highlightOpacity).toBeGreaterThan(0)
    expect(blended.highlightOpacity).toBeLessThan(0.16)
  })
})
