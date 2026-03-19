import { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AppHeader } from '@/components/layout/AppHeader'
import { useGameActions } from '@/hooks/useGameActions'
import { CREATE_ROOM_CODE_FONT_SIZE, CREATE_ROOM_CODE_LETTER_SPACING } from '@/constants/welcomeHero'
import { colors, fonts, radii } from '@/constants/theme'

export default function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { createRoom, joinRoom } = useGameActions()

  const [displayName, setDisplayName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  async function handleCreate() {
    if (!displayName.trim()) return
    setCreating(true)
    const result = await createRoom(displayName.trim())
    setCreating(false)
    if (result) router.push(`/room/${result.code}/lobby`)
  }

  async function handleJoin() {
    if (!displayName.trim() || !joinCode.trim()) return
    const normalizedCode = joinCode.trim().toUpperCase()
    setJoining(true)
    const ok = await joinRoom(normalizedCode, displayName.trim())
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
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>{t('home.stepsHint')}</Text>
            </View>

            <Input
              label={t('home.yourName')}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={30}
              autoCapitalize="words"
            />
            <Text style={styles.fieldHint}>{t('home.nameHint')}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('home.createRoom')}</Text>
              <Text style={styles.sectionHint}>{t('home.createHint')}</Text>
              <Button onPress={handleCreate} loading={creating} disabled={!displayName.trim()}>
                {t('home.createRoom')}
              </Button>
            </View>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>{t('home.or')}</Text>
              <View style={styles.separatorLine} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('home.joinRoom')}</Text>
              <Text style={styles.sectionHint}>{t('home.joinHint')}</Text>
              <Input
                value={joinCode}
                onChangeText={(value) => setJoinCode(value.toUpperCase())}
                placeholder={t('home.codePlaceholder')}
                maxLength={6}
                autoCapitalize="characters"
                style={styles.codeInput}
              />
              <Button
                onPress={handleJoin}
                loading={joining}
                disabled={!displayName.trim() || joinCode.trim().length !== 6}
                variant="secondary"
              >
                {t('home.joinRoom')}
              </Button>
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
  sectionLabel: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 2.5,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
  },
  sectionHint: {
    color: 'rgba(255, 228, 180, 0.65)',
    fontSize: 12,
    lineHeight: 18,
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
