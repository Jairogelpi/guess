import React from 'react'
import { TouchableOpacity, Image, View, Text, StyleSheet, ActivityIndicator } from 'react-native'
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

  const content = React.createElement(
    React.Fragment,
    null,
    React.createElement(
      View,
      { style: [styles.card, selected && styles.cardSelected, { aspectRatio }] },
      imageNode,
      selected ? React.createElement(View, { style: styles.selectedOverlay }) : null,
    ),
    label
      ? React.createElement(
          Text,
          { style: styles.label, numberOfLines: 1 },
          label,
        )
      : null,
  )

  if (!interactive) {
    return React.createElement(
      View,
      { style: [styles.wrapper, selected && styles.wrapperSelected], testID },
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
      style: [styles.wrapper, selected && styles.wrapperSelected],
      testID,
    },
    content,
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.md,
  },
  wrapperSelected: {
    transform: [{ scale: 1.03 }],
  },
  card: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceDeep,
    ...shadows.card,
  },
  cardSelected: {
    borderColor: colors.goldLight,
    borderWidth: 3,
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
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md - 2,
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
