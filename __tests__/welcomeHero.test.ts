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
      'rgba(0, 0, 0, 0)',
      'rgba(0, 0, 0, 0)',
    ])
  })

  test('makes PROMPT match GUESS THE in white while keeping stronger 3d edging', () => {
    expect(WELCOME_HERO_PROMPT_GLOW_COLOR).toBe('rgba(255, 158, 44, 0.28)')
    expect(WELCOME_HERO_PROMPT_GLOW_RADIUS).toBe(6)
    expect(welcomeScreenSource).not.toContain("@react-native-masked-view/masked-view")
    expect(welcomeScreenSource).toContain('styles.promptTitleFill')
    expect(welcomeScreenSource).toContain('fontSize: highlightSize')
    expect(welcomeScreenSource).not.toContain('styles.promptLetter')
    expect(welcomeScreenSource).toContain("color: '#fff7ea'")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(4, 1, 0, 0.46)'")
    expect(welcomeScreenSource).toContain("textShadowOffset: { width: 1, height: 2 }")
    expect(welcomeScreenSource).toContain('textShadowRadius: 0')
  })

  test('keeps the guest CTA typography smaller than before', () => {
    expect(WELCOME_GUEST_CTA_FONT_SIZE).toBe(16)
  })

  test('uses a slightly more compact card ratio to keep content grouped', () => {
    expect(WELCOME_HERO_CARD_RATIO).toBe(1.45)
  })

  test('keeps the hero card modestly sized in the overall composition', () => {
    expect(WELCOME_HERO_CARD_WIDTH_FACTOR).toBe(0.95)
    expect(WELCOME_HERO_CARD_MAX_WIDTH).toBe(442)
    expect(welcomeScreenSource).toContain('screenWidth - 12')
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
    expect(WELCOME_HERO_STACK_GAP).toBe(18)
    expect('getWelcomeHeroPanelMetrics' in welcomeHero).toBe(false)
    expect('WELCOME_HERO_FOOTER_MARGIN_TOP' in welcomeHero).toBe(false)
  })

  test('keeps the guest CTA inside the frame with a brighter cleaner button treatment', () => {
    expect(WELCOME_HERO_CTA_WIDTH_FACTOR).toBe(0.80)
    expect(WELCOME_HERO_CTA_HEIGHT).toBe(38)
    expect(WELCOME_HERO_CTA_SHADOW_OPACITY).toBe(0)
  })

  test('keeps the secondary actions lighter and more visually separated', () => {
    expect(WELCOME_HERO_FOOTER_GAP).toBe(18)
    expect(WELCOME_HERO_SECONDARY_CTA_HEIGHT).toBe(32)
    expect(WELCOME_HERO_SECONDARY_ACTION_GAP).toBe(18)
    expect(WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP).toBe(6)
  })

  test('keeps the welcome screen wired to tilt wrapper and direct CTA sizing constants', () => {
    expect(welcomeScreenSource).toContain('<InteractiveCardTilt')
    expect(welcomeScreenSource).toContain('WELCOME_HERO_CTA_WIDTH_FACTOR')
    expect(welcomeScreenSource).toContain('WELCOME_HERO_CTA_HEIGHT')
    expect(welcomeScreenSource).toContain('WELCOME_HERO_SHOW_LOGO &&')
    expect(welcomeScreenSource).toContain("style={{ width: cardWidth, height: cardHeight }}")
    expect(welcomeScreenSource).toContain('<View style={[styles.mainCard, { borderRadius: cardRadius }]}>')
    expect(welcomeScreenSource).toContain('<Animated.View style={[styles.cardImageLayer, animatedStyle]}>')
    expect(welcomeScreenSource).not.toContain('getWelcomeHeroPanelMetrics(compactHero)')
    expect(welcomeScreenSource).not.toContain('getWelcomeHeroCtaMetrics(compactHero)')
  })

  test('centers the hero inside the free space between header and footer and adapts size by available height', () => {
    expect(welcomeScreenSource).toContain('const [headerHeight, setHeaderHeight] = useState(0)')
    expect(welcomeScreenSource).toContain('const [footerHeight, setFooterHeight] = useState(0)')
    expect(welcomeScreenSource).toContain('const availableHeroHeight = Math.max(')
    expect(welcomeScreenSource).toContain('availableHeroHeight / WELCOME_HERO_CARD_RATIO')
    expect(welcomeScreenSource).toContain('paddingTop: headerHeight +')
    expect(welcomeScreenSource).toContain('paddingBottom: footerHeight +')
    expect(welcomeScreenSource).toContain('onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}')
    expect(welcomeScreenSource).toContain('onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}')
  })

  test('scales inner hero typography spacing and footer copy from the current card size', () => {
    expect(welcomeScreenSource).toContain('const heroLayoutScale = Math.max(')
    expect(welcomeScreenSource).toContain('const heroTextScale = Math.max(')
    expect(welcomeScreenSource).toContain('const scaleHeroLayoutValue = (value: number, min: number)')
    expect(welcomeScreenSource).toContain('const scaleHeroTextValue = (value: number, min: number)')
    expect(welcomeScreenSource).toContain('const cardRadius = scaleHeroLayoutValue(28, 22)')
    expect(welcomeScreenSource).toContain('const footerFontSize = scaleHeroTextValue(14, 13)')
    expect(welcomeScreenSource).toContain('paddingHorizontal: overlayHorizontalPadding')
    expect(welcomeScreenSource).toContain('paddingBottom: overlayBottomPadding')
    expect(welcomeScreenSource).toContain('gap: cardStackGap')
    expect(welcomeScreenSource).toContain('fontSize: footerFontSize')
    expect(welcomeScreenSource).toContain('letterSpacing: footerLetterSpacing')
  })

  test('keeps mobile typography readable instead of shrinking text with the full card scale', () => {
    expect(welcomeScreenSource).toContain('const heroLayoutScale = Math.max(0.88, Math.min(cardWidth / 390, 1.02))')
    expect(welcomeScreenSource).toContain('const heroTextScale = Math.max(0.98, Math.min(cardWidth / 390, 1.06))')
    expect(welcomeScreenSource).toContain('const titleSize = scaleHeroTextValue(compactHero ? 42 : 50, 38)')
    expect(welcomeScreenSource).toContain('const highlightSize = scaleHeroTextValue(compactHero ? 66 : 78, 62)')
    expect(welcomeScreenSource).toContain('const subtitleSize = scaleHeroTextValue(compactHero ? 15 : 17, 15)')
    expect(welcomeScreenSource).toContain('const guestFontSize = scaleHeroTextValue(compactHero ? 16 : 17, 15)')
    expect(welcomeScreenSource).toContain('const secondaryFontSize = scaleHeroTextValue(compactHero ? 12 : 13, 11)')
    expect(welcomeScreenSource).toContain('const accountHintFontSize = scaleHeroTextValue(12, 11)')
  })

  test('raises tap targets and functional copy so the hero feels native on phones', () => {
    expect(welcomeScreenSource).toContain('const guestButtonHeight = scaleHeroLayoutValue(compactHero ? 44 : 48, 42)')
    expect(welcomeScreenSource).toContain('const guestButtonPaddingHorizontal = scaleHeroLayoutValue(24, 18)')
    expect(welcomeScreenSource).toContain('const hintFontSize = scaleHeroTextValue(14, 13)')
    expect(welcomeScreenSource).toContain('const secondaryButtonHeight = scaleHeroLayoutValue(compactHero ? 38 : 40, 36)')
    expect(welcomeScreenSource).toContain('const accountHintLineHeight = accountHintFontSize + scaleHeroLayoutValue(6, 4)')
    expect(welcomeScreenSource).toContain("fontFamily: fonts.title")
    expect(welcomeScreenSource).toContain("fontFamily: fonts.titleHeavy")
  })

  test('gives the guest CTA a wider compact mobile width so the label stays on one line', () => {
    expect(welcomeScreenSource).toContain("width: compactHero ? '90%' : `${WELCOME_HERO_CTA_WIDTH_FACTOR * 100}%`")
  })

  test('keeps welcome component typography on the shared app font tokens instead of native font weights', () => {
    expect(welcomeScreenSource).toContain("import { fonts } from '@/constants/theme'")
    expect(welcomeScreenSource).toContain("fontFamily: fonts.titleHeavy")
    expect(welcomeScreenSource).toContain("fontFamily: fonts.title")
    expect(welcomeScreenSource).not.toContain("fontWeight: '800'")
    expect(welcomeScreenSource).not.toContain("fontWeight: '700'")
    expect(welcomeScreenSource).not.toContain("fontWeight: '600'")
    expect(welcomeScreenSource).not.toContain("fontWeight: '500'")
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
    expect(welcomeScreenSource).toContain("colors={['#FF8C00', '#E65100']}")
    expect(welcomeScreenSource).not.toContain("backgroundColor: '#e68a2e'")
    expect(welcomeScreenSource).not.toContain('styles.guestBtnHighlight')
    expect(welcomeScreenSource).toContain("backgroundColor: 'rgba(255, 180, 50, 0.12)'")
    expect(welcomeScreenSource).toContain("backgroundColor: 'rgba(220, 140, 20, 0.82)'")
    expect(welcomeScreenSource).toContain("borderColor: 'rgba(255, 210, 100, 0.55)'")
    expect(welcomeScreenSource).toContain("borderColor: 'rgba(255, 220, 110, 0.90)'")
    expect(welcomeScreenSource).not.toContain('styles.secondaryBtnFace')
    expect(welcomeScreenSource).not.toContain('styles.registerBtnFace')
  })

  test('adds subtle 3d relief to button surfaces and a darker outline to button text', () => {
    expect(welcomeScreenSource).not.toContain("shadowOffset: { width: 0, height: 4 }")
    expect(welcomeScreenSource).not.toContain('shadowRadius: 8')
    expect(welcomeScreenSource).not.toContain("shadowColor: 'rgba(26, 10, 2, 0.92)'")
    expect(welcomeScreenSource).not.toContain('shadowOpacity: 0.22')
    expect(welcomeScreenSource).not.toContain('elevation: 4')
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(3, 1, 0, 0.38)'")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(3, 1, 0, 0.50)'")
    expect(welcomeScreenSource).toContain('textShadowRadius: 1')
  })

  test('raises title presence and text legibility relative to the calmer base version', () => {
    expect(welcomeScreenSource).toContain('const titleSize = scaleHeroTextValue(compactHero ? 42 : 50, 38)')
    expect(welcomeScreenSource).toContain('const highlightSize = scaleHeroTextValue(compactHero ? 66 : 78, 62)')
    expect(welcomeScreenSource).toContain('const subtitleSize = scaleHeroTextValue(compactHero ? 15 : 17, 15)')
    expect(welcomeScreenSource).toContain('const overlayTopPadding = scaleHeroLayoutValue(12, 8)')
    expect(welcomeScreenSource).toContain('const overlayBottomPadding = scaleHeroLayoutValue(28, 18)')
    expect(welcomeScreenSource).toContain('const cardContentGap = scaleHeroLayoutValue(16, 12)')
    expect(welcomeScreenSource).toContain('const titleGroupGap = scaleHeroLayoutValue(16, 12)')
    expect(welcomeScreenSource).toContain('const dividerMarginVertical = scaleHeroLayoutValue(10, 7)')
    expect(welcomeScreenSource).toContain('const promptMarginTop = -scaleHeroLayoutValue(4, 3)')
    expect(welcomeScreenSource).toContain('const footerMarginTop = scaleHeroLayoutValue(8, 4)')
    expect(welcomeScreenSource).toContain('const actionGroupGap = scaleHeroLayoutValue(10, 8)')
    expect(welcomeScreenSource).toContain("color: '#fff7ea'")
    expect(welcomeScreenSource).toContain("color: 'rgba(255, 241, 222, 0.96)'")
    expect(welcomeScreenSource).toContain("color: 'rgba(255, 241, 222, 0.65)'")
    expect(welcomeScreenSource).toContain("textShadowOffset: { width: 1, height: 2 }")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(5, 1, 0, 0.42)'")
    expect(welcomeScreenSource).toContain("textShadowOffset: { width: 1, height: 1 }")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(3, 1, 0, 0.38)'")
    expect(welcomeScreenSource).toContain("textShadowColor: 'rgba(3, 1, 0, 0.50)'")
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
