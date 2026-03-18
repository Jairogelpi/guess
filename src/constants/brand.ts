export const decorativeFontFamily = 'CinzelDecorative_700Bold'
export const decorativeFontFamilyHeavy = 'CinzelDecorative_900Black'
export const decorativeFontFamilyRegular = 'CinzelDecorative_400Regular'

export const brandColors = {
  backdropTop: 'rgba(18, 10, 6, 0.68)',
  backdropMiddle: 'rgba(10, 6, 2, 0.84)',
  backdropBottom: 'rgba(7, 4, 2, 0.96)',
  gold: '#e6b800',
  goldSoft: '#f4c077',
  goldDim: 'rgba(251, 191, 36, 0.42)',
  goldBorder: 'rgba(244, 192, 119, 0.42)',
  goldStrongBorder: 'rgba(230, 184, 0, 0.82)',
  orangeStart: '#f9a825',
  orangeMid: '#f97316',
  orangeEnd: '#ea580c',
  textPrimary: '#fff7ea',
  textSecondary: 'rgba(255, 241, 222, 0.76)',
  textMuted: 'rgba(255, 241, 222, 0.42)',
  surfaceDeep: 'rgba(25, 13, 10, 0.92)',
  surfaceMid: 'rgba(67, 34, 21, 0.82)',
  surfaceGlass: 'rgba(20, 10, 6, 0.46)',
  icyText: ['#ffffff', '#dff1ff', '#ffffff'] as const,
  heroText: ['#ffd68a', '#fffbe7', '#ffe084', '#d7f0ff', '#ffd68a'] as const,
}

export const brandTypography = {
  titleHero: {
    fontFamily: decorativeFontFamilyHeavy,
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: 1.6,
  },
  titleScreen: {
    fontFamily: decorativeFontFamilyHeavy,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 1,
  },
  titleSection: {
    fontFamily: decorativeFontFamily,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: 0.9,
  },
  eyebrow: {
    fontFamily: decorativeFontFamily,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 3.4,
  },
  buttonLabel: {
    fontFamily: decorativeFontFamily,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 1.1,
  },
} as const

export const brandButtons = {
  primary: {
    gradient: [brandColors.orangeStart, brandColors.orangeMid, brandColors.orangeEnd] as const,
    borderColor: 'rgba(255, 230, 180, 0.46)',
    shadowColor: brandColors.orangeEnd,
  },
  secondary: {
    backgroundColor: 'rgba(15, 9, 6, 0.5)',
    borderColor: 'rgba(244, 192, 119, 0.34)',
    textColor: '#ffd680',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(244, 192, 119, 0.34)',
    textColor: brandColors.goldSoft,
  },
  danger: {
    backgroundColor: 'rgba(185, 28, 28, 0.85)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
    textColor: brandColors.textPrimary,
  },
} as const

export const entryShell = {
  viewportPadding: 20,
  utilityRow: {
    marginTop: 8,
    gap: 12,
  },
  utilityPill: {
    height: 36,
    horizontalPadding: 16,
    radius: 18,
  },
  card: {
    outerPadding: 4,
    radius: 30,
    borderWidth: 2.5,
    innerRadius: 26,
    maxWidth: 420,
  },
  hero: {
    topPadding: 22,
    gap: 14,
  },
  actions: {
    gap: 12,
    paddingTop: 18,
  },
} as const

export const decorativeTitleTones = {
  hero: brandColors.heroText,
  icy: brandColors.icyText,
} as const
