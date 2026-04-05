import { useEffect, useRef } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppHeader } from '@/components/layout/AppHeader'
import { useUIStore } from '@/stores/useUIStore'
import { colors, fonts, radii } from '@/constants/theme'

export default function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const revealValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current
  const privateBreathValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const revealAnimation = Animated.stagger(
      90,
      revealValues.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 430,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    )

    const privateBreathAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(privateBreathValue, {
          toValue: 1,
          duration: 1550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(privateBreathValue, {
          toValue: 0,
          duration: 1550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )

    revealAnimation.start()
    privateBreathAnimation.start()

    return () => {
      revealAnimation.stop()
      privateBreathAnimation.stop()
    }
  }, [privateBreathValue, revealValues])

  const cardEntryStyles = revealValues.map((value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  }))

  const privateBreathScaleStyle = {
    transform: [
      {
        scale: privateBreathValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.028],
        }),
      },
    ],
  }

  const privateBreathGlowStyle = {
    opacity: privateBreathValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.22, 0.5],
    }),
    transform: [
      {
        scale: privateBreathValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1.06],
        }),
      },
    ],
  }

  function handleUnavailableMode() {
    // Ranked remains unavailable for now.
    router.push('/(tabs)/quick-match')
  }

  return (
    <>
      <AppHeader title={t('home.playTitle', { defaultValue: 'JUGAR' })} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>
              {t('home.modeSelectHint', {
                defaultValue: 'Elige un modo para empezar a jugar.',
              })}
            </Text>
          </View>

          <View style={styles.playModesWrap}>
            <Animated.View style={cardEntryStyles[0]}>
              <Pressable
                onPress={handleUnavailableMode}
                style={styles.modeCardTouch}
                accessibilityRole="button"
                testID="home-play-quick-button"
              >
                {({ pressed }) => (
                  <View style={[styles.modeCard, pressed && styles.modeCardPressed]}>
                    <View style={styles.modeCardHeader}>
                      <View style={styles.modeCardTitleRow}>
                        <MaterialCommunityIcons name="flash" size={16} color={colors.gold} />
                        <Text style={styles.modeCardTitle}>
                          {t('home.quickMatch', { defaultValue: 'Partida rapida' })}
                        </Text>
                      </View>
                      <View style={styles.modeLiveChip}>
                        <Text style={styles.modeLiveChipText}>{t('home.availableNow', { defaultValue: 'DISPONIBLE' })}</Text>
                      </View>
                    </View>
                    <Text style={styles.modeCardHint}>
                      {t('home.quickMatchHint', {
                        defaultValue: 'Entra en cola con tu preferencia de jugadores y te emparejamos automaticamente.',
                      })}
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            <Animated.View style={cardEntryStyles[1]}>
              <Pressable
                onPress={() =>
                  showToast(
                    t('home.rankedModeSoon', { defaultValue: 'Partida clasificatoria estara disponible pronto.' }),
                    'info',
                  )}
                style={styles.modeCardTouch}
                accessibilityRole="button"
                testID="home-play-ranked-button"
              >
                {({ pressed }) => (
                  <View style={[styles.modeCard, pressed && styles.modeCardPressed]}>
                    <View style={styles.modeCardHeader}>
                      <View style={styles.modeCardTitleRow}>
                        <MaterialCommunityIcons name="trophy-outline" size={16} color={colors.gold} />
                        <Text style={styles.modeCardTitle}>
                          {t('home.rankedMatch', { defaultValue: 'Partida clasificatoria' })}
                        </Text>
                      </View>
                      <View style={styles.modeSoonChip}>
                        <Text style={styles.modeSoonChipText}>{t('common.soon', { defaultValue: 'PROX.' })}</Text>
                      </View>
                    </View>
                    <Text style={styles.modeCardHint}>
                      {t('home.rankedMatchHint', {
                        defaultValue: 'Compite por posicion y progreso competitivo.',
                      })}
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            <Animated.View style={cardEntryStyles[2]}>
              <Pressable
                onPress={() => router.push('/(tabs)/private')}
                style={styles.modeCardTouch}
                accessibilityRole="button"
                testID="home-play-private-button"
              >
                {({ pressed }) => (
                  <View style={styles.privateCardWrap}>
                    <Animated.View style={[styles.privateBreathGlow, privateBreathGlowStyle]} />
                    <Animated.View
                      style={[
                        styles.modeCard,
                        styles.modeCardPrivate,
                        privateBreathScaleStyle,
                        pressed && styles.modeCardPressed,
                      ]}
                    >
                      <View style={styles.modeCardHeader}>
                        <View style={styles.modeCardTitleRow}>
                          <MaterialCommunityIcons name="lock-outline" size={16} color={colors.gold} />
                          <Text style={styles.modeCardTitle}>
                            {t('home.privateMatch', { defaultValue: 'Partida privada' })}
                          </Text>
                        </View>
                        <View style={styles.modeLiveChip}>
                          <Text style={styles.modeLiveChipText}>{t('home.availableNow', { defaultValue: 'DISPONIBLE' })}</Text>
                        </View>
                      </View>
                      <Text style={styles.modeCardHint}>
                        {t('home.privateMatchHint', {
                          defaultValue: 'Crea o unete con codigo en la pantalla de partida privada.',
                        })}
                      </Text>
                    </Animated.View>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 120,
  },
  introCard: {
    backgroundColor: 'rgba(18, 8, 4, 0.78)',
    borderRadius: radii.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.45)',
  },
  introTitle: {
    color: '#ffe3be',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: fonts.title,
    textShadowColor: 'rgba(32, 18, 9, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  playModesWrap: {
    gap: 14,
  },
  modeCardTouch: {
    borderRadius: radii.md,
  },
  privateCardWrap: {
    position: 'relative',
  },
  privateBreathGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: radii.md,
    backgroundColor: 'rgba(248, 197, 116, 0.2)',
  },
  modeCard: {
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.25)',
    backgroundColor: 'rgba(25, 12, 5, 0.72)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 110,
    justifyContent: 'center',
  },
  modeCardPressed: {
    opacity: 0.95,
  },
  modeCardPrivate: {
    borderColor: 'rgba(248, 197, 116, 0.52)',
    backgroundColor: 'rgba(30, 15, 6, 0.82)',
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  modeCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  modeCardTitle: {
    color: '#fff7ea',
    fontSize: 18,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: fonts.titleHeavy,
    flexShrink: 1,
    textShadowColor: 'rgba(16, 8, 4, 0.78)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  modeCardHint: {
    color: '#f6c76f',
    fontSize: 14,
    lineHeight: 19,
  },
  modeSoonChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 210, 125, 0.45)',
    backgroundColor: 'rgba(255, 210, 125, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  modeSoonChipText: {
    color: '#f8c574',
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
  },
  modeLiveChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.55)',
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  modeLiveChipText: {
    color: '#86efac',
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
  },
})
