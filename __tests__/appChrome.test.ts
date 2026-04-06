import fs from 'node:fs'
import path from 'node:path'
import { APP_HEADER_LOGO_SCALE, APP_HEADER_THEME, APP_TAB_BAR_THEME, APP_VERSION, APP_TAB_ITEMS } from '../src/constants/appChrome'

describe('app chrome config', () => {
  const appHeaderSource = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'components', 'layout', 'AppHeader.tsx'),
    'utf8',
  )

  test('exposes the mobile footer navigation in the expected order', () => {
    expect(APP_TAB_ITEMS).toEqual([
      { route: 'index', titleKey: 'home.playTitle', icon: 'creation' },
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

  test('keeps the welcome header responsive instead of using a fixed capsule layout', () => {
    expect(appHeaderSource).toContain('useWindowDimensions')
    expect(appHeaderSource).toContain('const headerScale = Math.max(0.96, Math.min(shellMaxWidth / 344, 1.04))')
    expect(appHeaderSource).toContain('const shellMaxWidth = Math.min(')
    expect(appHeaderSource).toContain('const profileButtonSize = Math.round(36 * headerScale)')
    expect(appHeaderSource).toContain('scale={headerScale}')
    expect(appHeaderSource).toContain('size={profileButtonSize}')
    expect(appHeaderSource).toContain('style={[')
  })
})
