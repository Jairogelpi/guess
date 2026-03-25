export interface GetFanCardPoseInput {
  index: number
  total: number
  focusedIndex: number | null
  selectedIndex: number | null
}

export interface FanCardPose {
  translateX: number
  translateY: number
  angleDeg: number
  scale: number
}

export interface GetFanCardZIndexInput {
  index: number
  focusedIndex: number | null
  selectedIndex: number | null
}

export function getFanCardPose(input: GetFanCardPoseInput): FanCardPose {
  const mid = (input.total - 1) / 2
  const offset = input.index - mid
  const selected = input.selectedIndex === input.index
  const focused = input.focusedIndex === input.index
  const spreadMultiplier = focused ? 1.18 : 1

  return {
    translateX: offset * 54 * spreadMultiplier,
    translateY: offset * offset * 8 - (selected ? 34 : focused ? 24 : 0),
    angleDeg: offset * 12 * spreadMultiplier,
    scale: selected ? 1.14 : focused ? 1.08 : 1,
  }
}

export function getFanCardZIndex(input: GetFanCardZIndexInput): number {
  if (input.focusedIndex === input.index) {
    return 40
  }

  if (input.selectedIndex === input.index) {
    return 30
  }

  return 10 + input.index
}
