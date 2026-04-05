import { useEffect, useRef } from 'react'
import { Animated, View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { DixitCard } from '@/components/ui/DixitCard'

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
      ]).start()
    })
  }, [cardScale, cardOpacity, cardRotateY, glowOpacity])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.revealLabel}>{t('game.narratorCardReveal')}</Text>
        <Text style={styles.clueText}>"{clue}"</Text>
      </View>

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
            <DixitCard uri={cardUri} interactive={false} glowing />
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(25, 13, 10, 0.76)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 192, 119, 0.35)',
    borderRadius: radii.xl,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  revealLabel: {
    color: colors.goldLight,
    fontSize: 11,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardWrap: {
    width: '62%',
  },
  cardTilt: {
    width: '100%',
    zIndex: 2,
  },
  cardFrame: {
    borderRadius: radii.lg,
  },
  glowOverlay: {
    borderRadius: radii.lg,
    backgroundColor: 'rgba(230, 184, 0, 0.35)',
  },
  clueText: {
    color: '#fff7ea',
    fontSize: 28,
    fontFamily: fonts.title,
    textAlign: 'center',
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.72)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
})
