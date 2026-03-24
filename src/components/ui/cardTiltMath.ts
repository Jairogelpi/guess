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

export interface CardTiltState {
  rotateX: number
  rotateY: number
  translateX: number
  translateY: number
  scale: number
}

const SCROLL_RELEASE_DY = 18

export function getNeutralTiltState(): CardTiltState {
  return {
    rotateX: 0,
    rotateY: 0,
    translateX: 0,
    translateY: 0,
    scale: 1,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeZero(value: number) {
  return Object.is(value, -0) ? 0 : value
}

function computeTiltStateFromNormalizedInput({
  profile,
  normalizedX,
  normalizedY,
}: {
  profile: CardTiltProfile
  normalizedX: number
  normalizedY: number
}): CardTiltState {
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
    scale: profile.scale,
  }
}

function computeDragFollowTranslation({
  profile,
  drag,
}: {
  profile: CardTiltProfile
  drag: CardTiltDrag
}) {
  const multX = profile.dragMultiplierX ?? 0.45;
  const multY = profile.dragMultiplierY ?? 0.28;
  const maxX = profile.maxDragX ?? (profile.maxParallax * 5);
  const maxY = profile.maxDragY ?? (profile.maxParallax * 4.5);

  return {
    translateX: normalizeZero(
      clamp(drag.dx * multX, -maxX, maxX),
    ),
    translateY: normalizeZero(
      clamp(drag.dy * multY, -maxY, maxY),
    ),
  }
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

  const normalizedX = clamp((pointer.x - layout.width / 2) / (layout.width / 2), -1, 1)
  const normalizedY = clamp((pointer.y - layout.height / 2) / (layout.height / 2), -1, 1)

  return computeTiltStateFromNormalizedInput({
    profile,
    normalizedX,
    normalizedY,
  })
}

export function computeCardTiltStateFromDrag({
  profile,
  layout,
  drag,
  pointer,
}: {
  profile: CardTiltProfile
  layout?: CardTiltLayout
  drag?: CardTiltDrag
  pointer?: CardTiltPointer
}): CardTiltState {
  if (!layout || !drag || !pointer || layout.width <= 0 || layout.height <= 0) {
    return getNeutralTiltState()
  }

  const tiltState = computeCardTiltState({ profile, layout, pointer })
  const dragFollow = computeDragFollowTranslation({ profile, drag })

  return {
    ...tiltState,
    translateX: dragFollow.translateX,
    translateY: dragFollow.translateY,
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
    translateX: target.translateX,
    translateY: target.translateY,
    scale: target.scale,
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
