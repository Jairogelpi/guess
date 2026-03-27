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
    maxRotateX: 14,
    maxRotateY: 16,
    maxParallax: 12,
    scale: 1.02,
    damping: 16,
    stiffness: 160,
    pressScaleMin: 0.94,
    maxLiftDepth: 10,
    maxShadowOpacity: 0.38,
    maxHighlightOpacity: 0.24,
    velocityRotateBoost: 2.5,
    velocityTranslateBoost: 18,
    dragMultiplierX: 0.90,
    dragMultiplierY: 0.84,
    maxDragX: 190,
    maxDragY: 160,
    preventScrollRelease: true,
  },
  standard: {
    maxRotateX: 10,
    maxRotateY: 12,
    maxParallax: 8,
    scale: 1.012,
    damping: 18,
    stiffness: 180,
    pressScaleMin: 0.965,
    maxLiftDepth: 6,
    maxShadowOpacity: 0.26,
    maxHighlightOpacity: 0.18,
    velocityRotateBoost: 1.8,
    velocityTranslateBoost: 12,
    dragMultiplierX: 0.86,
    dragMultiplierY: 0.76,
    maxDragX: 140,
    maxDragY: 120,
  },
  lite: {
    maxRotateX: 5,
    maxRotateY: 6,
    maxParallax: 3,
    scale: 1.006,
    damping: 22,
    stiffness: 220,
    pressScaleMin: 0.982,
    maxLiftDepth: 3,
    maxShadowOpacity: 0.14,
    maxHighlightOpacity: 0.10,
    velocityRotateBoost: 0.9,
    velocityTranslateBoost: 6,
    dragMultiplierX: 0.78,
    dragMultiplierY: 0.68,
    maxDragX: 80,
    maxDragY: 70,
  },
}
