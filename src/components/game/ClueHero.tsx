import { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  clue: string
}

export function ClueHero({ clue }: Props) {
  const { t } = useTranslation()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(10)).current
  const scale = useRef(new Animated.Value(0.96)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 16, stiffness: 150, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 14, stiffness: 130, useNativeDriver: true }),
    ]).start()
  }, [clue, opacity, translateY, scale])

  return (
    <Animated.View
      style={[styles.card, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      <Text style={styles.label}>{t('game.narratorClue')}</Text>
      <Text style={styles.clue}>"{clue}"</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20, 12, 5, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.4)',
    borderRadius: radii.xl,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  label: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  clue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: fonts.titleHeavy,
    textAlign: 'center',
    lineHeight: 32,
    textShadowColor: 'rgba(230, 184, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
})
