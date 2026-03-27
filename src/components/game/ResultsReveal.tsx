import { useEffect, useRef } from 'react'
import { Animated, View, Text, Image, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'

interface Props {
  cardUri: string | null | undefined
  clue: string
}

export function ResultsReveal({ cardUri, clue }: Props) {
  const { t } = useTranslation()

  // Card flips in from a tiny scale with a gold flash
  const cardScale = useRef(new Animated.Value(0.7)).current
  const cardOpacity = useRef(new Animated.Value(0)).current
  const cardRotateY = useRef(new Animated.Value(-15)).current
  const glowOpacity = useRef(new Animated.Value(0)).current
  const labelOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Stage 1: card snaps in
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, damping: 12, stiffness: 140, useNativeDriver: true }),
      Animated.spring(cardRotateY, { toValue: 0, damping: 14, stiffness: 120, useNativeDriver: true }),
    ]).start(() => {
      // Stage 2: gold glow pulses, then label fades in
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 300, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        Animated.timing(labelOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start()
    })
  }, [cardScale, cardOpacity, cardRotateY, glowOpacity, labelOpacity])

  return (
    <View style={styles.container}>
      <Text style={styles.revealLabel}>{t('game.narratorCardReveal')}</Text>

      <Animated.View
        style={[
          styles.cardWrap,
          {
            opacity: cardOpacity,
            transform: [{ scale: cardScale }],
          },
        ]}
      >
        <InteractiveCardTilt profileName="hero" regionKey="results-reveal" style={styles.cardTilt}>
          <View style={styles.cardFrame}>
            {cardUri ? (
              <Image source={{ uri: cardUri }} style={styles.card} resizeMode="cover" />
            ) : (
              <Image
                source={require('../../../assets/carta.png')}
                style={styles.card}
                resizeMode="cover"
              />
            )}
            {/* Gold flash overlay */}
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                styles.glowOverlay,
                { opacity: glowOpacity },
              ]}
              pointerEvents="none"
            />
          </View>
        </InteractiveCardTilt>
      </Animated.View>

      <Animated.View style={[styles.clueBlock, { opacity: labelOpacity }]}>
        <Text style={styles.clueLabel}>{t('game.narratorClue')}</Text>
        <Text style={styles.clueText}>"{clue}"</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 192, 119, 0.35)',
    borderRadius: radii.md,
    padding: 16,
  },
  revealLabel: {
    color: colors.gold,
    fontSize: 9,
    fontFamily: fonts.title,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  cardWrap: {
    width: '55%',
  },
  cardTilt: {
    width: '100%',
    zIndex: 2,
  },
  cardFrame: {
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  card: { width: '100%', height: '100%' },
  glowOverlay: {
    borderRadius: radii.md,
    backgroundColor: 'rgba(230, 184, 0, 0.35)',
  },
  clueBlock: { alignItems: 'center', gap: 4 },
  clueLabel: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  clueText: {
    color: '#fff7ea',
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: fonts.title,
    textAlign: 'center',
    lineHeight: 22,
  },
})
