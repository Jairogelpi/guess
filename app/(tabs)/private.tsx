import { useEffect, useRef, useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Animated, Easing } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AppHeader } from '@/components/layout/AppHeader'
import { useGameActions } from '@/hooks/useGameActions'
import { useUIStore } from '@/stores/useUIStore'
import { CREATE_ROOM_CODE_FONT_SIZE, CREATE_ROOM_CODE_LETTER_SPACING } from '@/constants/welcomeHero'
import { colors, fonts, radii } from '@/constants/theme'

export default function PrivateMatchScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { createRoom, joinRoom } = useGameActions()
  const showToast = useUIStore((s) => s.showToast)

  const [displayName, setDisplayName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const ctaBreathValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const ctaBreathAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaBreathValue, {
          toValue: 1,
          duration: 1450,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ctaBreathValue, {
          toValue: 0,
          duration: 1450,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )

    ctaBreathAnimation.start()
    return () => ctaBreathAnimation.stop()
  }, [ctaBreathValue])

  const createCtaBreathStyle = {
    transform: [
      {
        scale: ctaBreathValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.022],
        }),
      },
    ],
  }

  const joinCtaBreathStyle = {
    transform: [
      {
        scale: ctaBreathValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.018],
        }),
      },
    ],
  }

  const trimmedName = displayName.trim()
  const trimmedJoinCode = joinCode.trim()
  const hasJoinCode = trimmedJoinCode.length > 0
  const canCreate = !!trimmedName && !hasJoinCode
  const canJoin = !!trimmedName && trimmedJoinCode.length === 6

  async function handleCreate() {
    if (!trimmedName) return
    if (hasJoinCode) {
      showToast(
        t('home.createBlockedByCode', {
          defaultValue: 'Ya escribiste un codigo. Pulsa UNIRSE o borralo para crear una sala nueva.',
        }),
        'info',
      )
      return
    }
    setCreating(true)
    const result = await createRoom(trimmedName)
    setCreating(false)
    if (result) router.push(`/room/${result.code}/lobby`)
  }

  async function handleJoin() {
    if (!trimmedName || !trimmedJoinCode) return
    const normalizedCode = trimmedJoinCode.toUpperCase()
    setJoining(true)
    const ok = await joinRoom(normalizedCode, trimmedName)
    setJoining(false)
    if (ok) router.push(`/room/${normalizedCode}/lobby`)
  }

  return (
    <>
      <AppHeader title={t('home.privateMatch', { defaultValue: 'Partida privada' })} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {hasJoinCode ? (
              <View style={styles.intentBanner}>
                <Text style={styles.intentBannerText}>
                  {t('home.joinIntentActive', {
                    defaultValue: 'Modo UNIRSE activo: detectamos un codigo escrito.',
                  })}
                </Text>
              </View>
            ) : null}

            <View style={styles.introCard}>
              <Text style={styles.introTitle}>{t('home.stepsHint')}</Text>
            </View>

            <Button onPress={() => router.push('/(tabs)/quick-match')} variant="secondary" testID="home-open-quick-match-button">
              {t('home.quickMatch', { defaultValue: 'Partida rapida' })}
            </Button>

            <Input
              label={t('home.yourName')}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={30}
              autoCapitalize="words"
              testID="home-display-name-input"
            />
            <Text style={styles.fieldHint}>{t('home.nameHint')}</Text>

            <View style={[styles.section, hasJoinCode && styles.sectionMuted]}>
              <Text style={styles.sectionLabel}>{t('home.createRoom')}</Text>
              <Text style={styles.sectionHint}>{t('home.createHint')}</Text>
              <Animated.View style={[styles.ctaWrap, createCtaBreathStyle]}>
                <Button
                  onPress={handleCreate}
                  loading={creating}
                  disabled={!canCreate}
                  testID="home-create-room-button"
                  contentStyle={styles.ctaContent}
                  textStyle={styles.ctaText}
                >
                  {t('home.createRoom')}
                </Button>
              </Animated.View>
              {hasJoinCode ? (
                <Text style={styles.intentWarning}>
                  {t('home.joinIntentWarning', {
                    defaultValue: 'Codigo detectado: para evitar errores, CREAR SALA se desactiva mientras haya codigo.',
                  })}
                </Text>
              ) : null}
            </View>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>{t('home.or')}</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={[styles.section, hasJoinCode && styles.sectionActive]}>
              <Text style={styles.sectionLabel}>{t('home.joinRoom')}</Text>
              <Text style={styles.sectionHint}>{t('home.joinHint')}</Text>
              <View style={[styles.codeInputWrap, hasJoinCode && styles.codeInputWrapActive]}>
                <Input
                  value={joinCode}
                  onChangeText={(value) => setJoinCode(value.toUpperCase())}
                  placeholder={t('home.codePlaceholder')}
                  maxLength={6}
                  autoCapitalize="characters"
                  testID="home-join-code-input"
                  style={styles.codeInput}
                  wrapperStyle={styles.codeInputWrapperReset}
                />
              </View>
              <Animated.View style={[styles.ctaWrap, joinCtaBreathStyle]}>
                <Button
                  onPress={handleJoin}
                  loading={joining}
                  disabled={!canJoin}
                  variant="secondary"
                  testID="home-join-room-button"
                  contentStyle={styles.ctaContent}
                  textStyle={styles.ctaText}
                >
                  {t('home.joinRoom')}
                </Button>
              </Animated.View>
              {hasJoinCode && !canJoin ? (
                <Text style={styles.joinHelperText}>
                  {t('home.completeNameToJoin', {
                    defaultValue: 'Completa tu nombre para continuar con UNIRSE.',
                  })}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  intentBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 124, 0.52)',
    backgroundColor: 'rgba(44, 27, 16, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  intentBannerText: {
    color: '#e7d5c1',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.title,
  },
  introCard: {
    backgroundColor: 'rgba(18, 8, 4, 0.78)',
    borderRadius: radii.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(189, 148, 102, 0.45)',
  },
  introTitle: {
    color: '#eee0cd',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: fonts.title,
    textShadowColor: 'rgba(32, 18, 9, 0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  fieldHint: {
    color: 'rgba(228, 207, 181, 0.66)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -8,
  },
  section: {
    gap: 12,
    backgroundColor: 'rgba(18, 8, 4, 0.75)',
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(189, 148, 102, 0.4)',
  },
  sectionMuted: {
    opacity: 0.72,
  },
  sectionActive: {
    borderColor: 'rgba(204, 165, 123, 0.84)',
    shadowColor: '#6f4120',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionLabel: {
    color: '#f4e6d0',
    fontSize: 12,
    letterSpacing: 2.5,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sectionHint: {
    color: 'rgba(231, 208, 182, 0.7)',
    fontSize: 13,
    lineHeight: 19,
  },
  ctaWrap: {
    marginTop: 4,
  },
  ctaContent: {
    minHeight: 34,
  },
  ctaText: {
    color: '#fff7ea',
    fontSize: 17,
    letterSpacing: 1.45,
    fontFamily: fonts.titleHeavy,
    textShadowColor: 'rgba(20, 11, 5, 0.72)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  codeInputWrap: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(190, 150, 109, 0.22)',
    padding: 2,
  },
  codeInputWrapActive: {
    borderColor: 'rgba(205, 167, 125, 0.65)',
    shadowColor: '#6f4120',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  codeInputWrapperReset: {
    gap: 0,
  },
  intentWarning: {
    color: '#d8bca0',
    fontSize: 11,
    lineHeight: 16,
  },
  joinHelperText: {
    color: '#d8bca0',
    fontSize: 11,
    lineHeight: 16,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(192, 151, 109, 0.52)',
  },
  separatorText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.title,
    letterSpacing: 1,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: CREATE_ROOM_CODE_LETTER_SPACING,
    fontSize: CREATE_ROOM_CODE_FONT_SIZE,
    fontFamily: fonts.title,
  },
})
