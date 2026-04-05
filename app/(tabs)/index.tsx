import { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
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

export default function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { createRoom, joinRoom } = useGameActions()
  const showToast = useUIStore((s) => s.showToast)

  const [displayName, setDisplayName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

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
      <AppHeader title={t('home.createRoom')} />
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
                <MaterialCommunityIcons name="target" size={14} color="#f8c574" />
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
              <Button
                onPress={handleCreate}
                loading={creating}
                disabled={!canCreate}
                testID="home-create-room-button"
              >
                {t('home.createRoom')}
              </Button>
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
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>{t('home.joinRoom')}</Text>
                {hasJoinCode ? (
                  <View style={styles.activeChip}>
                    <Text style={styles.activeChipText}>
                      {t('home.active', { defaultValue: 'ACTIVO' })}
                    </Text>
                  </View>
                ) : null}
              </View>
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
              <Button
                onPress={handleJoin}
                loading={joining}
                disabled={!canJoin}
                variant="secondary"
                testID="home-join-room-button"
              >
                {t('home.joinRoom')}
              </Button>
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
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 120,
  },
  intentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(248, 197, 116, 0.62)',
    backgroundColor: 'rgba(48, 26, 8, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  intentBannerText: {
    flex: 1,
    color: '#f8c574',
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
    borderColor: 'rgba(230, 184, 0, 0.45)',
  },
  introTitle: {
    color: '#fff4d6',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: fonts.title,
  },
  fieldHint: {
    color: 'rgba(255, 228, 180, 0.65)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -8,
  },
  section: {
    gap: 10,
    backgroundColor: 'rgba(18, 8, 4, 0.75)',
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.38)',
  },
  sectionMuted: {
    opacity: 0.72,
  },
  sectionActive: {
    borderColor: 'rgba(244, 192, 119, 0.82)',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 2.5,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
  },
  activeChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(248, 197, 116, 0.62)',
    backgroundColor: 'rgba(248, 197, 116, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeChipText: {
    color: '#f8c574',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: fonts.title,
  },
  sectionHint: {
    color: 'rgba(255, 228, 180, 0.65)',
    fontSize: 12,
    lineHeight: 18,
  },
  codeInputWrap: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.15)',
    padding: 2,
  },
  codeInputWrapActive: {
    borderColor: 'rgba(248, 197, 116, 0.62)',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  codeInputWrapperReset: {
    gap: 0,
  },
  intentWarning: {
    color: '#f8c574',
    fontSize: 11,
    lineHeight: 16,
  },
  joinHelperText: {
    color: '#f8c574',
    fontSize: 11,
    lineHeight: 16,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.goldBorder,
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
