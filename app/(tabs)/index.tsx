import { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Background } from '@/components/layout/Background'
import { useGameActions } from '@/hooks/useGameActions'
import { colors } from '@/constants/theme'

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
    setJoining(true)
    const ok = await joinRoom(joinCode.trim().toUpperCase(), displayName.trim())
    setJoining(false)
    if (ok) router.push(`/room/${joinCode.trim().toUpperCase()}/lobby`)
  }

  return (
    <Background>
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
            <View style={styles.header}>
              <Text style={styles.eyebrow}>✦ GUESS THE PRONT ✦</Text>
              <View style={styles.divider} />
            </View>

            <Input
              label={t('home.yourName')}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={30}
              autoCapitalize="words"
            />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('home.createRoom')}</Text>
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
              <Input
                value={joinCode}
                onChangeText={(v) => setJoinCode(v.toUpperCase())}
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
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: { alignItems: 'center', gap: 8, marginBottom: 8 },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: '600',
  },
  divider: {
    width: 50,
    height: 1.5,
    backgroundColor: colors.gold,
    opacity: 0.6,
  },
  section: { gap: 10 },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    fontWeight: '600',
    letterSpacing: 1,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 22,
    fontWeight: '700',
  },
})
