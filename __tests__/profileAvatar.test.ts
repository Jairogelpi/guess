import { getProfileAvatarFrame, resolveProfileAvatarFallback } from '../src/lib/profileAvatar'

describe('profile avatar helpers', () => {
  test('falls back to the display name initial when there is no avatar', () => {
    expect(resolveProfileAvatarFallback('', 'Jairo')).toBe('J')
  })

  test('falls back to a generic initial when there is no usable name', () => {
    expect(resolveProfileAvatarFallback(null, '')).toBe('U')
  })

  test('builds a centered inner frame for small header avatars', () => {
    expect(getProfileAvatarFrame(34)).toEqual({
      borderWidth: 2,
      innerSize: 30,
      outerRadius: 17,
      innerRadius: 15,
    })
  })

  test('builds a proportional inner frame for larger profile avatars', () => {
    expect(getProfileAvatarFrame(112)).toEqual({
      borderWidth: 6,
      innerSize: 100,
      outerRadius: 56,
      innerRadius: 50,
    })
  })
})
