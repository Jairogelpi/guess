import type { CardTiltProfile } from './cardTiltProfiles'

interface CardTiltLayout {
  width: number
  height: number
}

interface CardTiltPointer {
  x: number
  y: number
}

interface CardTiltDrag {
  dx: number
  dy: number
}

interface CardTiltVelocity {
  vx: number
  vy: number
}

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

const SCROLL_RELEASE_DY = 18
const VELOCITY_REFERENCE = 1200

export function getNeutralTiltState(): CardTiltState {
  return {
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
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function lerp(start: number, end: number, alpha: number) {
  return start + (end - start) * alpha
}

function normalizeZero(value: number) {
  return Object.is(value, -0) ? 0 : value
}

function getNormalizedPointer({
  layout,
  pointer,
}: {
  layout: CardTiltLayout
  pointer: CardTiltPointer
}) {
  return {
    normalizedX: clamp((pointer.x - layout.width / 2) / (layout.width / 2), -1, 1),
    normalizedY: clamp((pointer.y - layout.height / 2) / (layout.height / 2), -1, 1),
  }
}

function computePressChannels({
  profile,
  normalizedX,
  normalizedY,
  drag,
  velocity,
}: {
  profile: CardTiltProfile
  normalizedX: number
  normalizedY: number
  drag?: CardTiltDrag
  velocity?: CardTiltVelocity
}) {
  const pointerEnergy = Math.max(Math.abs(normalizedX), Math.abs(normalizedY))
  const dragEnergy = drag
    ? clamp(
        Math.max(
          Math.abs(drag.dx) / Math.max(profile.maxParallax * 6, 1),
          Math.abs(drag.dy) / Math.max(profile.maxParallax * 6, 1),
        ),
        0,
        1,
      )
    : 0
  const velocityEnergy = velocity
    ? clamp(
        Math.max(Math.abs(velocity.vx), Math.abs(velocity.vy)) / (VELOCITY_REFERENCE * 1.25),
        0,
        1,
      )
    : 0
  const pressEnergy = clamp(0.35 + pointerEnergy * 0.45 + dragEnergy * 0.15 + velocityEnergy * 0.05, 0, 1)
  const directionalX = clamp(normalizedX + (drag?.dx ?? 0) / 160, -1, 1)
  const directionalY = clamp(normalizedY + (drag?.dy ?? 0) / 160, -1, 1)

  return {
    pressScale: normalizeZero(
      clamp(1 - (1 - profile.pressScaleMin) * pressEnergy, profile.pressScaleMin, 1),
    ),
    lift: normalizeZero(clamp(-profile.maxLiftDepth * pressEnergy, -profile.maxLiftDepth, 0)),
    shadowShiftX: normalizeZero(
      clamp(directionalX * profile.maxLiftDepth * 0.6, -profile.maxLiftDepth, profile.maxLiftDepth),
    ),
    shadowShiftY: normalizeZero(
      clamp(directionalY * profile.maxLiftDepth * 0.6, -profile.maxLiftDepth, profile.maxLiftDepth),
    ),
    shadowOpacity: normalizeZero(clamp(profile.maxShadowOpacity * pressEnergy, 0, profile.maxShadowOpacity)),
    highlightOpacity: normalizeZero(
      clamp(profile.maxHighlightOpacity * pressEnergy, 0, profile.maxHighlightOpacity),
    ),
  }
}

function computeTiltTransformFromNormalizedInput({
  profile,
  normalizedX,
  normalizedY,
}: {
  profile: CardTiltProfile
  normalizedX: number
  normalizedY: number
}) {
  return {
    rotateX: normalizeZero(
      clamp(-normalizedY * profile.maxRotateX, -profile.maxRotateX, profile.maxRotateX),
    ),
    rotateY: normalizeZero(
      clamp(normalizedX * profile.maxRotateY, -profile.maxRotateY, profile.maxRotateY),
    ),
    translateX: normalizeZero(
      clamp(normalizedX * profile.maxParallax, -profile.maxParallax, profile.maxParallax),
    ),
    translateY: normalizeZero(
      clamp(normalizedY * profile.maxParallax, -profile.maxParallax, profile.maxParallax),
    ),
  }
}

function computeDragFollowTranslation({
  profile,
  drag,
}: {
  profile: CardTiltProfile
  drag: CardTiltDrag
}) {
  const multX = profile.dragMultiplierX ?? 0.45
  const multY = profile.dragMultiplierY ?? 0.28
  const maxX = profile.maxDragX ?? profile.maxParallax * 5
  const maxY = profile.maxDragY ?? profile.maxParallax * 4.5

  return {
    translateX: normalizeZero(
      clamp(drag.dx * multX, -maxX, maxX),
    ),
    translateY: normalizeZero(
      clamp(drag.dy * multY, -maxY, maxY),
    ),
  }
}

function computeVelocityBoost({
  profile,
  velocity,
}: {
  profile: CardTiltProfile
  velocity?: CardTiltVelocity
}) {
  if (!velocity) {
    return {
      rotateX: 0,
      rotateY: 0,
      translateX: 0,
      translateY: 0,
    }
  }

  return {
    rotateX: normalizeZero(
      clamp(
        (-velocity.vy / VELOCITY_REFERENCE) * profile.velocityRotateBoost,
        -profile.velocityRotateBoost,
        profile.velocityRotateBoost,
      ),
    ),
    rotateY: normalizeZero(
      clamp(
        (velocity.vx / VELOCITY_REFERENCE) * profile.velocityRotateBoost,
        -profile.velocityRotateBoost,
        profile.velocityRotateBoost,
      ),
    ),
    translateX: normalizeZero(
      clamp(
        (velocity.vx / VELOCITY_REFERENCE) * profile.velocityTranslateBoost,
        -profile.velocityTranslateBoost,
        profile.velocityTranslateBoost,
      ),
    ),
    translateY: normalizeZero(
      clamp(
        (velocity.vy / VELOCITY_REFERENCE) * profile.velocityTranslateBoost,
        -profile.velocityTranslateBoost,
        profile.velocityTranslateBoost,
      ),
    ),
  }
}

function retainAxisEnergy({
  nextValue,
  previousValue,
  centerWeight,
}: {
  nextValue: number
  previousValue?: number
  centerWeight: number
}) {
  if (previousValue === undefined || previousValue === 0 || centerWeight <= 0) {
    return nextValue
  }

  const previousSign = Math.sign(previousValue)
  const nextSign = Math.sign(nextValue)
  const crossedCenter =
    previousSign !== 0 &&
    nextSign !== 0 &&
    previousSign !== nextSign
  const lostEnergy = Math.abs(nextValue) < Math.abs(previousValue)

  if (!crossedCenter && !lostEnergy) {
    return nextValue
  }

  const retention = clamp(centerWeight * (crossedCenter ? 0.68 : 0.45), 0, 0.85)
  return normalizeZero(lerp(nextValue, previousValue, retention))
}

function retainCompression({
  nextValue,
  previousValue,
  centerWeight,
}: {
  nextValue: number
  previousValue?: number
  centerWeight: number
}) {
  if (previousValue === undefined || centerWeight <= 0 || nextValue <= previousValue) {
    return nextValue
  }

  return normalizeZero(lerp(nextValue, previousValue, clamp(centerWeight * 0.3, 0, 0.45)))
}

function retainOpacity({
  nextValue,
  previousValue,
  centerWeight,
}: {
  nextValue: number
  previousValue?: number
  centerWeight: number
}) {
  if (previousValue === undefined || centerWeight <= 0 || nextValue >= previousValue) {
    return nextValue
  }

  return normalizeZero(lerp(nextValue, previousValue, clamp(centerWeight * 0.28, 0, 0.4)))
}

export function computeCardTiltState({
  profile,
  layout,
  pointer,
}: {
  profile: CardTiltProfile
  layout?: CardTiltLayout
  pointer?: CardTiltPointer
}): CardTiltState {
  if (!layout || !pointer || layout.width <= 0 || layout.height <= 0) {
    return getNeutralTiltState()
  }

  const { normalizedX, normalizedY } = getNormalizedPointer({ layout, pointer })
  const transform = computeTiltTransformFromNormalizedInput({
    profile,
    normalizedX,
    normalizedY,
  })
  const press = computePressChannels({
    profile,
    normalizedX,
    normalizedY,
  })

  return computeTiltStateFromNormalizedInput({
    profile,
    transform,
    press,
  })
}

function computeTiltStateFromNormalizedInput({
  profile,
  transform,
  press,
}: {
  profile: CardTiltProfile
  transform: ReturnType<typeof computeTiltTransformFromNormalizedInput>
  press: ReturnType<typeof computePressChannels>
}): CardTiltState {
  return {
    ...transform,
    scale: profile.scale,
    ...press,
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
  velocity?: CardTiltVelocity
  previousState?: CardTiltState
}): CardTiltState {
  if (!layout || !drag || !pointer || layout.width <= 0 || layout.height <= 0) {
    return getNeutralTiltState()
  }

  const { normalizedX, normalizedY } = getNormalizedPointer({ layout, pointer })
  const transform = computeTiltTransformFromNormalizedInput({
    profile,
    normalizedX,
    normalizedY,
  })
  const dragFollow = computeDragFollowTranslation({ profile, drag })
  const velocityBoost = computeVelocityBoost({ profile, velocity })
  const press = computePressChannels({
    profile,
    normalizedX,
    normalizedY,
    drag,
    velocity,
  })
  const centerWeightX = clamp(1 - Math.abs(normalizedX), 0, 1)
  const centerWeightY = clamp(1 - Math.abs(normalizedY), 0, 1)
  const retainedRotateX = retainAxisEnergy({
    nextValue: clamp(
      transform.rotateX + velocityBoost.rotateX,
      -profile.maxRotateX,
      profile.maxRotateX,
    ),
    previousValue: previousState?.rotateX,
    centerWeight: centerWeightY,
  })
  const retainedRotateY = retainAxisEnergy({
    nextValue: clamp(
      transform.rotateY + velocityBoost.rotateY,
      -profile.maxRotateY,
      profile.maxRotateY,
    ),
    previousValue: previousState?.rotateY,
    centerWeight: centerWeightX,
  })
  const maxDragX = profile.maxDragX ?? profile.maxParallax * 5
  const maxDragY = profile.maxDragY ?? profile.maxParallax * 4.5
  const retainedTranslateX = retainAxisEnergy({
    nextValue: clamp(
      dragFollow.translateX + velocityBoost.translateX,
      -maxDragX,
      maxDragX,
    ),
    previousValue: previousState?.translateX,
    centerWeight: centerWeightX,
  })
  const retainedTranslateY = retainAxisEnergy({
    nextValue: clamp(
      dragFollow.translateY + velocityBoost.translateY,
      -maxDragY,
      maxDragY,
    ),
    previousValue: previousState?.translateY,
    centerWeight: centerWeightY,
  })

  return {
    rotateX: normalizeZero(clamp(retainedRotateX, -profile.maxRotateX, profile.maxRotateX)),
    rotateY: normalizeZero(clamp(retainedRotateY, -profile.maxRotateY, profile.maxRotateY)),
    translateX: normalizeZero(clamp(retainedTranslateX, -maxDragX, maxDragX)),
    translateY: normalizeZero(clamp(retainedTranslateY, -maxDragY, maxDragY)),
    scale: profile.scale,
    pressScale: normalizeZero(
      clamp(
        retainCompression({
          nextValue: press.pressScale,
          previousValue: previousState?.pressScale,
          centerWeight: Math.max(centerWeightX, centerWeightY),
        }),
        profile.pressScaleMin,
        1,
      ),
    ),
    lift: normalizeZero(
      clamp(
        retainAxisEnergy({
          nextValue: press.lift,
          previousValue: previousState?.lift,
          centerWeight: Math.max(centerWeightX, centerWeightY),
        }),
        -profile.maxLiftDepth,
        0,
      ),
    ),
    shadowShiftX: normalizeZero(
      clamp(
        retainAxisEnergy({
          nextValue: press.shadowShiftX,
          previousValue: previousState?.shadowShiftX,
          centerWeight: centerWeightX,
        }),
        -profile.maxLiftDepth,
        profile.maxLiftDepth,
      ),
    ),
    shadowShiftY: normalizeZero(
      clamp(
        retainAxisEnergy({
          nextValue: press.shadowShiftY,
          previousValue: previousState?.shadowShiftY,
          centerWeight: centerWeightY,
        }),
        -profile.maxLiftDepth,
        profile.maxLiftDepth,
      ),
    ),
    shadowOpacity: normalizeZero(
      clamp(
        retainOpacity({
          nextValue: press.shadowOpacity,
          previousValue: previousState?.shadowOpacity,
          centerWeight: Math.max(centerWeightX, centerWeightY),
        }),
        0,
        profile.maxShadowOpacity,
      ),
    ),
    highlightOpacity: normalizeZero(
      clamp(
        retainOpacity({
          nextValue: press.highlightOpacity,
          previousValue: previousState?.highlightOpacity,
          centerWeight: Math.max(centerWeightX, centerWeightY),
        }),
        0,
        profile.maxHighlightOpacity,
      ),
    ),
  }
}

export function blendCardTiltState(
  current: CardTiltState,
  target: CardTiltState,
  alpha: number,
): CardTiltState {
  const clampedAlpha = clamp(alpha, 0, 1)

  return {
    rotateX: normalizeZero(current.rotateX + (target.rotateX - current.rotateX) * clampedAlpha),
    rotateY: normalizeZero(current.rotateY + (target.rotateY - current.rotateY) * clampedAlpha),
    translateX: normalizeZero(lerp(current.translateX, target.translateX, clampedAlpha)),
    translateY: normalizeZero(lerp(current.translateY, target.translateY, clampedAlpha)),
    scale: normalizeZero(lerp(current.scale, target.scale, clampedAlpha)),
    pressScale: normalizeZero(lerp(current.pressScale, target.pressScale, clampedAlpha)),
    lift: normalizeZero(lerp(current.lift, target.lift, clampedAlpha)),
    shadowShiftX: normalizeZero(lerp(current.shadowShiftX, target.shadowShiftX, clampedAlpha)),
    shadowShiftY: normalizeZero(lerp(current.shadowShiftY, target.shadowShiftY, clampedAlpha)),
    shadowOpacity: normalizeZero(lerp(current.shadowOpacity, target.shadowOpacity, clampedAlpha)),
    highlightOpacity: normalizeZero(
      lerp(current.highlightOpacity, target.highlightOpacity, clampedAlpha),
    ),
  }
}

export function shouldReleaseToScroll({
  dx,
  dy,
}: {
  dx: number
  dy: number
}) {
  return Math.abs(dy) > SCROLL_RELEASE_DY && Math.abs(dy) > Math.abs(dx)
}
