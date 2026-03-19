export const MAX_GALLERY_CARDS = 8
export const MAX_ROOM_WILDCARDS = 3

export function hasGalleryCapacity(cardCount: number) {
  return cardCount < MAX_GALLERY_CARDS
}

export function remainingGallerySlots(cardCount: number) {
  return Math.max(0, MAX_GALLERY_CARDS - cardCount)
}

export function hasAvailableWildcards(remaining: number | null | undefined) {
  return (remaining ?? 0) > 0
}
