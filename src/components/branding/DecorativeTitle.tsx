import { Text, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import type { StyleProp, TextStyle } from 'react-native'
import { brandColors, brandTypography, decorativeFontFamilyRegular } from '@/constants/brand'

type Variant = 'hero' | 'screen' | 'section' | 'eyebrow'
type Tone = 'hero' | 'gold' | 'plain' | 'muted' | 'icy'
type Align = 'left' | 'center' | 'right'

interface DecorativeTitleProps {
  children: ReactNode
  variant?: Variant
  tone?: Tone
  align?: Align
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  adjustsFontSizeToFit?: boolean
  minimumFontScale?: number
}

const variantStyles = StyleSheet.create({
  hero: {
    fontFamily: brandTypography.titleHero.fontFamily,
    fontSize: brandTypography.titleHero.fontSize,
    lineHeight: brandTypography.titleHero.lineHeight,
    letterSpacing: brandTypography.titleHero.letterSpacing,
    textTransform: 'uppercase',
  },
  screen: {
    fontFamily: brandTypography.titleScreen.fontFamily,
    fontSize: brandTypography.titleScreen.fontSize,
    lineHeight: brandTypography.titleScreen.lineHeight,
    letterSpacing: brandTypography.titleScreen.letterSpacing,
  },
  section: {
    fontFamily: brandTypography.titleSection.fontFamily,
    fontSize: brandTypography.titleSection.fontSize,
    lineHeight: brandTypography.titleSection.lineHeight,
    letterSpacing: brandTypography.titleSection.letterSpacing,
    textTransform: 'uppercase',
  },
  eyebrow: {
    fontFamily: decorativeFontFamilyRegular,
    fontSize: brandTypography.eyebrow.fontSize,
    lineHeight: brandTypography.eyebrow.lineHeight,
    letterSpacing: brandTypography.eyebrow.letterSpacing,
    textTransform: 'uppercase',
  },
} as const)

const toneStyles = StyleSheet.create({
  hero: {
    color: brandColors.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.72)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  gold: {
    color: brandColors.goldSoft,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  plain: {
    color: brandColors.textPrimary,
  },
  muted: {
    color: brandColors.textSecondary,
  },
  icy: {
    color: '#f3fbff',
    textShadowColor: 'rgba(70, 130, 180, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
} as const)

export function DecorativeTitle({
  children,
  variant = 'screen',
  tone = 'plain',
  align = 'center',
  style,
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale,
}: DecorativeTitleProps) {
  return (
    <Text
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        variantStyles[variant],
        toneStyles[tone],
        { textAlign: align },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
})
