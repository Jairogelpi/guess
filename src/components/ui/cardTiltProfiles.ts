export type CardTiltProfileName = 'hero' | 'standard' | 'lite'

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

export const CARD_TILT_PROFILES: Record<CardTiltProfileName, CardTiltProfile> = {
  hero: {
    maxRotateX: 8,
    maxRotateY: 8,
    maxParallax: 10,
    scale: 1.02,
    damping: 18,
    stiffness: 180,
    pressScaleMin: 0.94,
    maxLiftDepth: 7,
    maxShadowOpacity: 0.28,
    maxHighlightOpacity: 0.2,
    velocityRotateBoost: 1.75,
    velocityTranslateBoost: 8,
    dragMultiplierX: 0.72,
    dragMultiplierY: 0.42,
    maxDragX: 28,
    maxDragY: 20,
    preventScrollRelease: true,
  },
  standard: {
    maxRotateX: 5,
    maxRotateY: 5,
    maxParallax: 6,
    scale: 1.012,
    damping: 20,
    stiffness: 200,
    pressScaleMin: 0.965,
    maxLiftDepth: 4.5,
    maxShadowOpacity: 0.2,
    maxHighlightOpacity: 0.14,
    velocityRotateBoost: 1.1,
    velocityTranslateBoost: 4.5,
  },
  lite: {
    maxRotateX: 2.5,
    maxRotateY: 2.5,
    maxParallax: 2,
    scale: 1.006,
    damping: 22,
    stiffness: 220,
    pressScaleMin: 0.982,
    maxLiftDepth: 2.5,
    maxShadowOpacity: 0.11,
    maxHighlightOpacity: 0.08,
    velocityRotateBoost: 0.55,
    velocityTranslateBoost: 2.2,
  },
}
