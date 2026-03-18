import { View, Image, StyleSheet, useWindowDimensions } from 'react-native'
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { brandColors, entryShell } from '@/constants/brand'

interface EntryCardShellProps {
  children: ReactNode
  utilityLeft?: ReactNode
  utilityRight?: ReactNode
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  cardStyle?: StyleProp<ViewStyle>
  frameStyle?: StyleProp<ViewStyle>
  imageSource?: ImageSourcePropType
}

const defaultCardImage = require('../../../assets/carta.png')

export function EntryCardShell({
  children,
  utilityLeft,
  utilityRight,
  style,
  contentStyle,
  cardStyle,
  frameStyle,
  imageSource = defaultCardImage,
}: EntryCardShellProps) {
  const { width, height } = useWindowDimensions()
  const maxCardWidth = Math.min(width - entryShell.viewportPadding * 2, entryShell.card.maxWidth)
  const maxCardHeight = Math.max(520, height - 176)
  const cardWidth = Math.min(maxCardWidth, maxCardHeight / 1.54)
  const cardHeight = cardWidth * 1.54

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.utilityRow}>
        <View style={styles.utilitySlot}>{utilityLeft}</View>
        <View style={[styles.utilitySlot, styles.utilitySlotEnd]}>{utilityRight}</View>
      </View>

      <View
        style={[
          styles.cardFrame,
          {
            width: cardWidth,
            height: cardHeight,
            borderRadius: entryShell.card.radius,
          },
          cardStyle,
        ]}
      >
        <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
        <LinearGradient
          colors={[
            'rgba(30, 14, 7, 0.16)',
            'rgba(16, 8, 4, 0.52)',
            'rgba(7, 4, 2, 0.94)',
          ]}
          style={styles.overlay}
        >
          <View style={[styles.contentFrame, frameStyle]}>
            <View style={[styles.content, contentStyle]}>{children}</View>
          </View>
        </LinearGradient>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: entryShell.viewportPadding,
  },
  utilityRow: {
    width: '100%',
    maxWidth: entryShell.card.maxWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: entryShell.utilityRow.gap,
  },
  utilitySlot: {
    flex: 1,
    minHeight: entryShell.utilityPill.height,
    justifyContent: 'center',
  },
  utilitySlotEnd: {
    alignItems: 'flex-end',
  },
  cardFrame: {
    overflow: 'hidden',
    borderWidth: entryShell.card.borderWidth,
    borderColor: brandColors.goldStrongBorder,
    backgroundColor: brandColors.surfaceDeep,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.38,
    shadowRadius: 30,
    elevation: 24,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  contentFrame: {
    flex: 1,
    borderRadius: entryShell.card.innerRadius,
    borderWidth: 2,
    borderColor: brandColors.goldStrongBorder,
    backgroundColor: 'rgba(12, 5, 2, 0.56)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
})
