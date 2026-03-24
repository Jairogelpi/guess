export type CardTiltProfileName = 'hero' | 'standard' | 'lite'

export interface CardTiltProfile {
  maxRotateX: number
  maxRotateY: number
  maxParallax: number
  scale: number
  damping: number
  stiffness: number
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
    dragMultiplierX: 1.0,
    dragMultiplierY: 1.0,
    maxDragX: 3000,
    maxDragY: 3000,
    preventScrollRelease: true,
  },
  standard: {
    maxRotateX: 5,
    maxRotateY: 5,
    maxParallax: 6,
    scale: 1.012,
    damping: 20,
    stiffness: 200,
  },
  lite: {
    maxRotateX: 2.5,
    maxRotateY: 2.5,
    maxParallax: 2,
    scale: 1.006,
    damping: 22,
    stiffness: 220,
  },
}
