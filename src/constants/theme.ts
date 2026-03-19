import { brandColors, brandTypography } from './brand'

export const colors = {
  // Backgrounds
  bgBase: '#120a06',
  bgDeep: '#0a0602',
  surfaceDeep: brandColors.surfaceDeep,
  surfaceMid: brandColors.surfaceMid,
  surfaceTop: 'rgba(124, 66, 39, 0.72)',

  // Gold / Amber
  gold: brandColors.gold,
  goldLight: '#fbb024',
  goldDim: brandColors.goldDim,
  goldBorder: brandColors.goldBorder,

  // Orange (CTAs)
  orange: '#f97316',
  orangeGrad1: 'rgba(249, 168, 37, 0.88)',
  orangeGrad2: 'rgba(234, 88, 12, 0.78)',

  // Text
  textPrimary: brandColors.textPrimary,
  textSecondary: 'rgba(255, 241, 222, 0.60)',
  textMuted: brandColors.textMuted,

  // Card
  cardBg: '#fefefe',
  cardBorder: '#e6b800',

  // Danger
  danger: 'rgba(185, 28, 28, 0.85)',
}

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 28,
  full: 999,
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 20,
  },
  surface: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: '#e6b800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
}

/** Reusable typography/layout tokens — import and spread in StyleSheet.create */
export const typography = {
  eyebrow: {
    color: colors.gold,
    fontFamily: brandTypography.eyebrow.fontFamily,
    fontSize: brandTypography.eyebrow.fontSize,
    lineHeight: brandTypography.eyebrow.lineHeight,
    letterSpacing: brandTypography.eyebrow.letterSpacing,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1.5,
    backgroundColor: colors.gold,
    opacity: 0.65,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  titleScreen: {
    color: colors.textPrimary,
    fontFamily: brandTypography.titleScreen.fontFamily,
    fontSize: brandTypography.titleScreen.fontSize,
    lineHeight: brandTypography.titleScreen.lineHeight,
    letterSpacing: brandTypography.titleScreen.letterSpacing,
  },
  titleSection: {
    color: colors.textPrimary,
    fontFamily: brandTypography.titleSection.fontFamily,
    fontSize: brandTypography.titleSection.fontSize,
    lineHeight: brandTypography.titleSection.lineHeight,
    letterSpacing: brandTypography.titleSection.letterSpacing,
    textTransform: 'uppercase' as const,
  },
}
