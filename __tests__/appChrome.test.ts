import { APP_HEADER_LOGO_SCALE, APP_HEADER_THEME, APP_TAB_BAR_THEME, APP_VERSION, APP_TAB_ITEMS } from '../src/constants/appChrome'

describe('app chrome config', () => {
  test('exposes the mobile footer navigation in the expected order', () => {
    expect(APP_TAB_ITEMS).toEqual([
      { route: 'index', titleKey: 'home.createRoom', icon: 'creation' },
      { route: 'gallery', titleKey: 'gallery.title', icon: 'image-multiple-outline' },
      { route: 'profile', titleKey: 'profile.title', icon: 'account-circle-outline' },
    ])
  })

  test('uses a dark solid tab bar theme to avoid white footer artifacts', () => {
    expect(APP_TAB_BAR_THEME).toEqual({
      backgroundColor: '#120a06',
      borderColor: 'rgba(244, 192, 119, 0.22)',
    })
  })

  test('uses a lighter bordered header capsule instead of a flat black slab', () => {
    expect(APP_HEADER_THEME).toEqual({
      backgroundColor: 'rgba(18, 10, 6, 0.58)',
      borderColor: 'rgba(255, 228, 186, 0.28)',
    })
  })

  test('keeps the current public app version badge text', () => {
    expect(APP_VERSION).toBe('v1.0.0')
  })

  test('crops the header logo art so the baked white canvas does not show', () => {
    expect(APP_HEADER_LOGO_SCALE).toBeGreaterThan(1)
  })
})
