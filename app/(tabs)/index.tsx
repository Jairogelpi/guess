import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { Background } from '@/components/layout/Background'
import { EntryCardShell } from '@/components/layout/EntryCardShell'
import { EntryUtilityPill } from '@/components/layout/EntryUtilityPill'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { brandColors, decorativeFontFamilyRegular } from '@/constants/brand'
import { radii } from '@/constants/theme'
import { useGameActions } from '@/hooks/useGameActions'

const APP_VERSION = 'v1.0.0'

export default function HomeScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { createRoom, joinRoom } = useGameActions()
  const currentLang = i18n.language.split('-')[0]?.toUpperCase() || 'ES'

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

  function toggleLanguage() {
    void i18n.changeLanguage(currentLang === 'ES' ? 'en' : 'es')
  }

  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <EntryCardShell
              utilityLeft={<EntryUtilityPill label={APP_VERSION} />}
              utilityRight={<EntryUtilityPill label={currentLang} onPress={toggleLanguage} />}
              contentStyle={styles.cardContent}
            >
              <View style={styles.hero}>
                <DecorativeTitle variant="eyebrow" tone="gold" style={styles.eyebrow}>
                  {t('welcome.title')}
                </DecorativeTitle>
                <View style={styles.heroTitleGroup}>
                  <DecorativeTitle
                    variant="screen"
                    tone="hero"
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    style={styles.heroLine}
                  >
                    GUESS THE
                  </DecorativeTitle>
                  <DecorativeTitle
                    variant="screen"
                    tone="hero"
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    style={[styles.heroLine, styles.heroLineOffset]}
                  >
                    PRONT
                  </DecorativeTitle>
                </View>
                <View style={styles.divider} />
                <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
              </View>

              <View style={styles.actions}>
                <Input
                  label={t('home.yourName')}
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={30}
                  autoCapitalize="words"
                />

                <Button onPress={handleCreate} loading={creating} disabled={!displayName.trim()}>
                  {t('home.createRoom')}
                </Button>

                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <DecorativeTitle variant="eyebrow" tone="muted" style={styles.separatorText}>
                    {t('home.or')}
                  </DecorativeTitle>
                  <View style={styles.separatorLine} />
                </View>

                <Input
                  label={t('home.codePlaceholder')}
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
            </EntryCardShell>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  cardContent: {
    justifyContent: 'space-between',
    gap: 18,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 2,
  },
  eyebrow: {
    marginBottom: 12,
  },
  heroTitleGroup: {
    width: '100%',
    gap: 2,
  },
  heroLine: {
    width: '100%',
    fontSize: 40,
    lineHeight: 40,
  },
  heroLineOffset: {
    marginTop: -2,
  },
  divider: {
    width: 82,
    height: 3,
    borderRadius: radii.full,
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: brandColors.goldSoft,
  },
  subtitle: {
    maxWidth: '86%',
    color: 'rgba(255, 245, 231, 0.84)',
    fontFamily: decorativeFontFamilyRegular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    marginTop: 'auto',
    gap: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(12, 6, 4, 0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 138, 0.12)',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 214, 138, 0.16)',
  },
  separatorText: {
    letterSpacing: 2.4,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 6,
  },
})
