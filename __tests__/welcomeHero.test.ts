import {
  WELCOME_HERO_CARD_BACKGROUND,
  WELCOME_HERO_CARD_MAX_WIDTH,
  WELCOME_HERO_CARD_SHADOW_OPACITY,
  WELCOME_HERO_CARD_SHADOW_RADIUS,
  WELCOME_HERO_CTA_HEIGHT,
  WELCOME_HERO_CTA_SHADOW_OPACITY,
  WELCOME_HERO_CTA_WIDTH_FACTOR,
  WELCOME_HERO_FOOTER_GAP,
  WELCOME_HERO_SECONDARY_ACTION_GAP,
  WELCOME_HERO_SECONDARY_CTA_HEIGHT,
  WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP,
  WELCOME_HERO_FOOTER_MARGIN_TOP,
  WELCOME_HERO_OVERLAY_JUSTIFY_CONTENT,
  WELCOME_HERO_SHOW_LOGO,
  WELCOME_HERO_STACK_GAP,
  CREATE_ROOM_CODE_FONT_SIZE,
  CREATE_ROOM_CODE_LETTER_SPACING,
  WELCOME_GUEST_CTA_FONT_SIZE,
  WELCOME_HERO_CARD_RATIO,
  WELCOME_HERO_CARD_WIDTH_FACTOR,
  WELCOME_HERO_IMAGE_BLUR_RADIUS,
  WELCOME_HERO_IMAGE_SCALE,
  WELCOME_HERO_OVERLAY_COLORS,
} from '../src/constants/welcomeHero'

describe('welcome hero treatment', () => {
  test('slightly overscales the card art to avoid empty dark gaps', () => {
    expect(WELCOME_HERO_IMAGE_SCALE).toBeGreaterThan(1)
  })

  test('keeps the card sharper and darker on mobile', () => {
    expect(WELCOME_HERO_IMAGE_BLUR_RADIUS).toBe(0)
    expect(WELCOME_HERO_OVERLAY_COLORS).toEqual([
      'rgba(0, 0, 0, 0)',
      'rgba(8, 4, 1, 0.1)',
      'rgba(4, 2, 1, 0.22)',
    ])
  })

  test('keeps the guest CTA typography smaller than before', () => {
    expect(WELCOME_GUEST_CTA_FONT_SIZE).toBe(16)
  })

  test('uses a slightly more compact card ratio to keep content grouped', () => {
    expect(WELCOME_HERO_CARD_RATIO).toBe(1.42)
  })

  test('makes the hero card a touch larger without scaling the inner content', () => {
    expect(WELCOME_HERO_CARD_WIDTH_FACTOR).toBe(0.97)
    expect(WELCOME_HERO_CARD_MAX_WIDTH).toBe(448)
  })

  test('does not place the card art over a solid black backing panel', () => {
    expect(WELCOME_HERO_CARD_BACKGROUND).toBe('transparent')
    expect(WELCOME_HERO_CARD_SHADOW_OPACITY).toBe(0)
    expect(WELCOME_HERO_CARD_SHADOW_RADIUS).toBe(0)
  })

  test('removes the extra icon from the hero card composition', () => {
    expect(WELCOME_HERO_SHOW_LOGO).toBe(false)
  })

  test('keeps the hero content as one centered stack instead of splitting top and bottom', () => {
    expect(WELCOME_HERO_OVERLAY_JUSTIFY_CONTENT).toBe('center')
    expect(WELCOME_HERO_STACK_GAP).toBe(18)
    expect(WELCOME_HERO_FOOTER_MARGIN_TOP).toBe(4)
  })

  test('keeps the guest CTA inside the frame instead of touching the card edges', () => {
    expect(WELCOME_HERO_CTA_WIDTH_FACTOR).toBe(0.88)
    expect(WELCOME_HERO_CTA_HEIGHT).toBe(42)
    expect(WELCOME_HERO_CTA_SHADOW_OPACITY).toBe(0)
  })

  test('keeps the secondary actions lighter and with more breathing room', () => {
    expect(WELCOME_HERO_FOOTER_GAP).toBe(12)
    expect(WELCOME_HERO_SECONDARY_CTA_HEIGHT).toBe(36)
    expect(WELCOME_HERO_SECONDARY_ACTION_GAP).toBe(12)
    expect(WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP).toBe(8)
  })

  test('reduces room code emphasis on the create room screen', () => {
    expect(CREATE_ROOM_CODE_FONT_SIZE).toBe(18)
    expect(CREATE_ROOM_CODE_LETTER_SPACING).toBe(4)
  })
})
