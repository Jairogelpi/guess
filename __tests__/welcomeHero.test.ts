import fs from 'node:fs'
import path from 'node:path'
import * as welcomeHero from '../src/constants/welcomeHero'
import {
  WELCOME_HERO_CARD_BACKGROUND,
  WELCOME_HERO_CARD_MAX_WIDTH,
  WELCOME_HERO_CARD_RATIO,
  WELCOME_HERO_CARD_SHADOW_OPACITY,
  WELCOME_HERO_CARD_SHADOW_RADIUS,
  WELCOME_HERO_CARD_WIDTH_FACTOR,
  WELCOME_HERO_CTA_HEIGHT,
  WELCOME_HERO_CTA_SHADOW_OPACITY,
  WELCOME_HERO_CTA_WIDTH_FACTOR,
  WELCOME_HERO_FOOTER_GAP,
  WELCOME_GUEST_CTA_FONT_SIZE,
  WELCOME_HERO_IMAGE_BLUR_RADIUS,
  WELCOME_HERO_IMAGE_SCALE,
  WELCOME_HERO_OVERLAY_COLORS,
  WELCOME_HERO_OVERLAY_JUSTIFY_CONTENT,
  WELCOME_HERO_PROMPT_GLOW_COLOR,
  WELCOME_HERO_PROMPT_GLOW_RADIUS,
  WELCOME_HERO_SECONDARY_ACTION_GAP,
  WELCOME_HERO_SECONDARY_CTA_HEIGHT,
  WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP,
  WELCOME_HERO_SHOW_LOGO,
  WELCOME_HERO_STACK_GAP,
} from '../src/constants/welcomeHero'

describe('welcome hero treatment', () => {
  const welcomeScreenSource = fs.readFileSync(
    path.join(__dirname, '..', 'app', '(auth)', 'welcome.tsx'),
    'utf8',
  )

  test('slightly overscales the card art to avoid empty dark gaps', () => {
    expect(WELCOME_HERO_IMAGE_SCALE).toBeGreaterThan(1)
  })

  test('keeps the card sharp with a lighter overlay closer to the original composition', () => {
    expect(WELCOME_HERO_IMAGE_BLUR_RADIUS).toBe(0)
    expect(WELCOME_HERO_OVERLAY_COLORS).toEqual([
      'rgba(0, 0, 0, 0)',
      'rgba(12, 7, 2, 0.14)',
      'rgba(5, 2, 1, 0.28)',
    ])
  })

  test('makes PROMPT match GUESS THE in white while keeping stronger 3d edging', () => {
    expect(WELCOME_HERO_PROMPT_GLOW_COLOR).toBe('rgba(255, 158, 44, 0.28)')
    expect(WELCOME_HERO_PROMPT_GLOW_RADIUS).toBe(6)
    expect(welcomeScreenSource).not.toContain("@react-native-masked-view/masked-view")
    expect(welcomeScreenSource).toContain("style={[styles.brandTitle, styles.brandTitleHighlight, styles.promptTitleFill, { fontSize: highlightSize }]}")
    expect(welcomeScreenSource).not.toContain('styles.promptLetter')
    expect(welcomeScreenSource).toContain("color: '#fff7ea'")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(10, 4, 1, 0.95)'")
    expect(welcomeScreenSource).toContain("textShadowOffset: { width: 0, height: 3 }")
    expect(welcomeScreenSource).toContain('textShadowRadius: 0')
  })

  test('keeps the guest CTA typography smaller than before', () => {
    expect(WELCOME_GUEST_CTA_FONT_SIZE).toBe(16)
  })

  test('uses a slightly more compact card ratio to keep content grouped', () => {
    expect(WELCOME_HERO_CARD_RATIO).toBe(1.42)
  })

  test('keeps the hero card modestly sized in the overall composition', () => {
    expect(WELCOME_HERO_CARD_WIDTH_FACTOR).toBe(0.95)
    expect(WELCOME_HERO_CARD_MAX_WIDTH).toBe(442)
  })

  test('does not place the card art over a solid black backing panel', () => {
    expect(WELCOME_HERO_CARD_BACKGROUND).toBe('transparent')
    expect(WELCOME_HERO_CARD_SHADOW_OPACITY).toBe(0)
    expect(WELCOME_HERO_CARD_SHADOW_RADIUS).toBe(0)
  })

  test('keeps the logo disabled so the title owns the hierarchy', () => {
    expect(WELCOME_HERO_SHOW_LOGO).toBe(false)
  })

  test('returns to a centered single-stack layout but uses more vertical spacing to open the elements up', () => {
    expect(WELCOME_HERO_OVERLAY_JUSTIFY_CONTENT).toBe('center')
    expect(WELCOME_HERO_STACK_GAP).toBe(24)
    expect('getWelcomeHeroPanelMetrics' in welcomeHero).toBe(false)
    expect('WELCOME_HERO_FOOTER_MARGIN_TOP' in welcomeHero).toBe(false)
  })

  test('keeps the guest CTA inside the frame with a brighter cleaner button treatment', () => {
    expect(WELCOME_HERO_CTA_WIDTH_FACTOR).toBe(0.92)
    expect(WELCOME_HERO_CTA_HEIGHT).toBe(48)
    expect(WELCOME_HERO_CTA_SHADOW_OPACITY).toBe(0)
  })

  test('keeps the secondary actions lighter and more visually separated', () => {
    expect(WELCOME_HERO_FOOTER_GAP).toBe(16)
    expect(WELCOME_HERO_SECONDARY_CTA_HEIGHT).toBe(40)
    expect(WELCOME_HERO_SECONDARY_ACTION_GAP).toBe(16)
    expect(WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP).toBe(12)
  })

  test('keeps the welcome screen wired to tilt wrapper and direct CTA sizing constants', () => {
    expect(welcomeScreenSource).toContain('<InteractiveCardTilt')
    expect(welcomeScreenSource).toContain('WELCOME_HERO_CTA_WIDTH_FACTOR')
    expect(welcomeScreenSource).toContain('WELCOME_HERO_CTA_HEIGHT')
    expect(welcomeScreenSource).toContain('WELCOME_HERO_SHOW_LOGO &&')
    expect(welcomeScreenSource).not.toContain('getWelcomeHeroPanelMetrics(compactHero)')
    expect(welcomeScreenSource).not.toContain('getWelcomeHeroCtaMetrics(compactHero)')
  })

  test('cleans up long-running animations on unmount instead of leaving them active', () => {
    expect(welcomeScreenSource).toContain('const breatheLoop = Animated.loop(')
    expect(welcomeScreenSource).toContain('const riseIn = Animated.spring(')
    expect(welcomeScreenSource).toContain('return () => {')
    expect(welcomeScreenSource).toContain('breatheLoop.stop()')
    expect(welcomeScreenSource).toContain('riseIn.stop()')
  })

  test('removes the filler value block and extra ambient bridge treatments', () => {
    expect('WELCOME_HERO_VALUE_EYEBROW' in welcomeHero).toBe(false)
    expect('WELCOME_HERO_VALUE_ROWS' in welcomeHero).toBe(false)
    expect(welcomeScreenSource).not.toContain('styles.valuePanel')
    expect(welcomeScreenSource).not.toContain('styles.middleAmbientGlow')
    expect(welcomeScreenSource).not.toContain('styles.middleAmbientDust')
  })

  test('uses lighter button surfaces instead of the darker premium-card treatment', () => {
    expect(welcomeScreenSource).not.toContain("colors={['rgba(255, 239, 222, 0.96)', 'rgba(255, 176, 82, 0.97)', 'rgba(234, 88, 12, 0.96)']}")
    expect(welcomeScreenSource).toContain("backgroundColor: '#e68a2e'")
    expect(welcomeScreenSource).not.toContain('styles.guestBtnHighlight')
    expect(welcomeScreenSource).toContain("backgroundColor: 'rgba(255, 239, 221, 0.44)'")
    expect(welcomeScreenSource).toContain("backgroundColor: 'rgba(255, 204, 122, 0.5)'")
    expect(welcomeScreenSource).toContain("borderColor: 'rgba(255, 244, 220, 0.5)'")
    expect(welcomeScreenSource).toContain("borderColor: 'rgba(255, 218, 145, 0.62)'")
    expect(welcomeScreenSource).not.toContain('styles.secondaryBtnFace')
    expect(welcomeScreenSource).not.toContain('styles.registerBtnFace')
  })

  test('adds subtle 3d relief to button surfaces and a darker outline to button text', () => {
    expect(welcomeScreenSource).toContain("shadowOffset: { width: 0, height: 4 }")
    expect(welcomeScreenSource).toContain('shadowRadius: 8')
    expect(welcomeScreenSource).toContain("shadowColor: 'rgba(26, 10, 2, 0.92)'")
    expect(welcomeScreenSource).toContain('shadowOpacity: 0.22')
    expect(welcomeScreenSource).toContain('elevation: 4')
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(0,0,0,0.58)'")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(0,0,0,0.64)'")
    expect(welcomeScreenSource).toContain('textShadowRadius: 2')
  })

  test('raises title presence and text legibility relative to the calmer base version', () => {
    expect(welcomeScreenSource).toContain('const titleSize = compactHero ? 42 : 50')
    expect(welcomeScreenSource).toContain('const highlightSize = compactHero ? 62 : 74')
    expect(welcomeScreenSource).toContain('const subtitleSize = compactHero ? 14 : 16')
    expect(welcomeScreenSource).toContain('paddingTop: 4')
    expect(welcomeScreenSource).toContain('gap: 12')
    expect(welcomeScreenSource).toContain('marginVertical: 6')
    expect(welcomeScreenSource).toContain('marginTop: 10')
    expect(welcomeScreenSource).toContain("color: '#fff7ea'")
    expect(welcomeScreenSource).toContain("color: 'rgba(255, 241, 222, 0.96)'")
    expect(welcomeScreenSource).toContain("color: 'rgba(255, 241, 222, 0.9)'")
    expect(welcomeScreenSource).toContain("textShadowOffset: { width: 0, height: 0 }")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(24, 10, 4, 0.88)'")
    expect(welcomeScreenSource).toContain('textShadowRadius: 2')
    expect(welcomeScreenSource).toContain("textShadowOffset: { width: 0, height: 2 }")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(0,0,0,0.58)'")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(0,0,0,0.64)'")
    expect(welcomeScreenSource).toContain("color: '#fffaf1'")
  })

  test('keeps guest and auth navigation flows explicitly referenced in source', () => {
    expect(welcomeScreenSource).toContain('supabase.auth.signInAnonymously()')
    expect(welcomeScreenSource).toContain("pathname: '/(auth)/login', params: { mode: 'signin' }")
    expect(welcomeScreenSource).toContain("pathname: '/(auth)/login', params: { mode: 'register' }")
  })

  test('renders the footer year dynamically instead of hard-coding a release year', () => {
    expect(welcomeScreenSource).toContain('const footerYear = new Date().getFullYear()')
    expect(welcomeScreenSource).toContain('{`GUESS THE PROMPT ${footerYear}`}')
    expect(welcomeScreenSource).not.toContain('GUESS THE PROMPT 2026')
  })
})
