import {
  MAX_GALLERY_CARDS,
  MAX_ROOM_WILDCARDS,
  hasAvailableWildcards,
  hasGalleryCapacity,
  remainingGallerySlots,
} from '../src/lib/galleryRules'

describe('galleryRules', () => {
  it('keeps the expected caps', () => {
    expect(MAX_GALLERY_CARDS).toBe(8)
    expect(MAX_ROOM_WILDCARDS).toBe(3)
  })

  it('detects remaining gallery capacity', () => {
    expect(hasGalleryCapacity(7)).toBe(true)
    expect(hasGalleryCapacity(8)).toBe(false)
    expect(remainingGallerySlots(6)).toBe(2)
  })

  it('detects available wildcards', () => {
    expect(hasAvailableWildcards(3)).toBe(true)
    expect(hasAvailableWildcards(1)).toBe(true)
    expect(hasAvailableWildcards(0)).toBe(false)
    expect(hasAvailableWildcards(undefined)).toBe(false)
  })
})
