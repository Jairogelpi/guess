import React from 'react'
import { TouchableOpacity, Image, View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import { colors, radii, shadows } from '@/constants/theme'

interface DixitCardProps {
  uri?: string | null
  loading?: boolean
  selected?: boolean
  label?: string
  onPress?: () => void
  onLongPress?: () => void
  disabled?: boolean
  aspectRatio?: number
  interactive?: boolean
  /** Compact size for vote field (slightly thinner frame) */
  compact?: boolean
  /** Animated gold outer glow for selected state */
  glowing?: boolean
  testID?: string
}

export function DixitCard({
  uri,
  loading,
  selected,
  label,
  onPress,
  onLongPress,
  disabled,
  aspectRatio = 2 / 3,
  interactive = false,
  compact = false,
  glowing = false,
  testID,
}: DixitCardProps) {
  const imageNode = loading
    ? React.createElement(
        View,
        { style: styles.placeholder },
        React.createElement(ActivityIndicator, { size: 'large', color: colors.gold }),
      )
    : React.createElement(Image, {
        source: uri ? { uri } : require('../../../assets/carta.png'),
        style: styles.image,
        resizeMode: 'cover',
      })

  const isWeb = Platform.OS === 'web'

  // On web, aspectRatio inside flex containers is unreliable.
  // Use paddingBottom hack to enforce aspect ratio instead.
  const cardStyles = [
    styles.card,
    (glowing || selected) && styles.cardSelected,
    compact && styles.cardCompact,
    isWeb
      ? ({ width: '100%', paddingBottom: `${(1 / aspectRatio) * 100}%` } as any)
      : { aspectRatio, width: '100%' },
  ]

  const content = React.createElement(
    React.Fragment,
    null,
    React.createElement(
      View,
      { style: cardStyles },
      /* On web, image is absolute-fill inside the padding-based container */
      React.createElement(
        View,
        { style: isWeb ? styles.webImageFill : styles.nativeImageFill },
        imageNode,
      ),
      /* TCG inner frame overlay — purely decorative */
      React.createElement(View, { style: styles.innerFrameOverlay }),
      /* Corner ornaments */
      React.createElement(View, { style: styles.cornerOrnamentTL }),
      React.createElement(View, { style: styles.cornerOrnamentBR }),
      /* Selected overlay */
      (glowing || selected) ? React.createElement(View, { style: styles.selectedOverlay }) : null,
    ),
    label
      ? React.createElement(
          Text,
          { style: styles.label, numberOfLines: 1 },
          label,
        )
      : null,
  )

  const wrapperStyles = [
    styles.wrapper,
    selected && styles.wrapperSelected,
    (glowing || selected) && styles.wrapperGlowing,
  ]

  if (!interactive) {
    return React.createElement(
      View,
      { style: wrapperStyles, testID },
      content,
    )
  }

  return React.createElement(
    TouchableOpacity,
    {
      onLongPress,
      onPress,
      disabled: disabled ?? (!onPress && !onLongPress),
      activeOpacity: 0.88,
      style: wrapperStyles,
      testID,
    },
    content,
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.md + 2,
    ...shadows.card,
  },
  wrapperSelected: {
    transform: [{ scale: 1.03 }],
  },
  wrapperGlowing: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
  card: {
    borderRadius: radii.md + 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#b8860b',
    backgroundColor: colors.surfaceDeep,
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.goldLight,
    borderWidth: 3.5,
  },
  cardCompact: {
    borderWidth: 2,
    borderRadius: radii.md,
  },
  /* Native: image fills parent via flex */
  nativeImageFill: {
    flex: 1,
  },
  /* Web: image fills padding-based container via absolute positioning */
  webImageFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMid,
  },
  /* TCG decorative inner border */
  innerFrameOverlay: {
    ...StyleSheet.absoluteFillObject,
    margin: 3,
    borderRadius: radii.md - 3,
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.25)',
    pointerEvents: 'none',
  },
  cornerOrnamentTL: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 12,
    height: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(244, 192, 119, 0.35)',
    borderTopLeftRadius: 3,
    pointerEvents: 'none',
  },
  cornerOrnamentBR: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 12,
    height: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(244, 192, 119, 0.35)',
    borderBottomRightRadius: 3,
    pointerEvents: 'none',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'rgba(251,176,36,0.4)',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
})
