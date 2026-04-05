import { useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from '@/components/ui/Button'
import { colors, fonts, radii, shadows } from '@/constants/theme'

type Props = {
  preferredPlayerCount: number
  onCancel: () => void
  submitting: boolean
}

export function QuickMatchSearchingState({ preferredPlayerCount, onCancel, submitting }: Props) {
  const pulse = useRef(new Animated.Value(0)).current
  const shimmer = useRef(new Animated.Value(0)).current
  const orbValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    )

    const orbLoop = Animated.loop(
      Animated.stagger(
        220,
        orbValues.map((value) => Animated.sequence([
          Animated.timing(value, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ])),
      ),
    )

    pulseLoop.start()
    shimmerLoop.start()
    orbLoop.start()

    return () => {
      pulseLoop.stop()
      shimmerLoop.stop()
      orbLoop.stop()
    }
  }, [orbValues, pulse, shimmer])

  const pulseStyle = useMemo(() => ({
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.04],
        }),
      },
    ],
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.72, 1],
    }),
  }), [pulse])

  const shimmerStyle = useMemo(() => ({
    transform: [
      {
        translateX: shimmer.interpolate({
          inputRange: [0, 1],
          outputRange: [-180, 180],
        }),
      },
    ],
    opacity: shimmer.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.16, 0],
    }),
  }), [shimmer])

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>buscando jugadores</Text>
      <Text style={styles.title}>Estamos armando una mesa para ti</Text>
      <Text style={styles.copy}>
        Buscamos primero tu preferencia exacta y, si hace falta, abrimos la busqueda un poco para encontrarte partida antes.
      </Text>

      <Animated.View style={[styles.orbitWrap, pulseStyle]}>
        <View style={styles.orbitOuter} />
        <View style={styles.orbitMiddle} />
        <View style={styles.orbitInner} />
        <Animated.View style={[styles.shimmerBeam, shimmerStyle]} />
        <LinearGradient colors={['rgba(251, 176, 36, 0.28)', 'rgba(249, 115, 22, 0.08)']} style={styles.coreGlow}>
          <Text style={styles.coreNumber}>{preferredPlayerCount}</Text>
          <Text style={styles.coreLabel}>jugadores</Text>
        </LinearGradient>
      </Animated.View>

      <View style={styles.orbRow}>
        {orbValues.map((value, index) => (
          <Animated.View
            key={index}
            style={[
              styles.orb,
              {
                transform: [
                  {
                    translateY: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8],
                    }),
                  },
                  {
                    scale: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.14],
                    }),
                  },
                ],
                opacity: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>Preferencia actual: {preferredPlayerCount} jugadores</Text>
      </View>

      <Button onPress={onCancel} variant="ghost" loading={submitting} testID="quick-match-cancel-search-button">
        Salir de la busqueda
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    backgroundColor: 'rgba(18, 8, 4, 0.82)',
    borderRadius: radii.xl,
    padding: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 112, 0.4)',
    alignItems: 'center',
    ...shadows.surface,
  },
  eyebrow: {
    color: colors.goldLight,
    fontFamily: fonts.title,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    color: '#fff1d9',
    fontFamily: fonts.titleHeavy,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  copy: {
    color: '#e7d5c1',
    fontFamily: fonts.title,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  orbitWrap: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitOuter: {
    position: 'absolute',
    width: 248,
    height: 248,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 112, 0.16)',
  },
  orbitMiddle: {
    position: 'absolute',
    width: 194,
    height: 194,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 112, 0.22)',
  },
  orbitInner: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 112, 0.28)',
  },
  shimmerBeam: {
    position: 'absolute',
    width: 84,
    height: 220,
    borderRadius: radii.full,
    backgroundColor: '#fff1d9',
  },
  coreGlow: {
    width: 120,
    height: 120,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 176, 36, 0.44)',
    shadowColor: colors.goldLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 10,
  },
  coreNumber: {
    color: '#fff1d9',
    fontFamily: fonts.titleHeavy,
    fontSize: 38,
    lineHeight: 42,
  },
  coreLabel: {
    color: colors.goldLight,
    fontFamily: fonts.title,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  orbRow: {
    flexDirection: 'row',
    gap: 14,
  },
  orb: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 112, 0.36)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 241, 217, 0.04)',
  },
  badgeText: {
    color: '#f3dfc2',
    fontFamily: fonts.title,
    fontSize: 12,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
})
