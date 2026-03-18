import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
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
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/stores/useUIStore'

const APP_VERSION = 'v1.0.0'

export default function Login() {
  const { t, i18n } = useTranslation()
  const params = useLocalSearchParams<{ mode?: string | string[] }>()
  const showToast = useUIStore((s) => s.showToast)
  const currentLang = i18n.language.split('-')[0]?.toUpperCase() || 'ES'
  const requestedMode = Array.isArray(params.mode) ? params.mode[0] : params.mode

  const [isRegister, setIsRegister] = useState(requestedMode === 'register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsRegister(requestedMode === 'register')
  }, [requestedMode])

  async function submit() {
    if (!email || !password) return
    setLoading(true)
    const { error } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) showToast(error.message, 'error')
    setLoading(false)
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
                <DecorativeTitle variant="screen" tone="hero" style={styles.title}>
                  {isRegister ? t('profile.upgradeAccount') : t('welcome.signIn')}
                </DecorativeTitle>
                <View style={styles.divider} />
                <Text style={styles.subtitle}>
                  {isRegister ? t('profile.upgradeSubtitle') : t('welcome.subtitle')}
                </Text>
              </View>

              <View style={styles.formCard}>
                <Input
                  label={t('profile.email')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Input
                  label={t('profile.password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
                <Button onPress={submit} loading={loading}>
                  {isRegister ? t('profile.upgradeAccount') : t('welcome.signIn')}
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => setIsRegister((value) => !value)}
                >
                  {isRegister ? t('welcome.signIn') : t('profile.upgradeAccount')}
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
    paddingTop: 4,
  },
  eyebrow: {
    marginBottom: 14,
  },
  title: {
    width: '100%',
  },
  divider: {
    width: 74,
    height: 3,
    borderRadius: radii.full,
    marginTop: 18,
    marginBottom: 16,
    backgroundColor: brandColors.goldSoft,
  },
  subtitle: {
    maxWidth: '88%',
    color: 'rgba(255, 245, 231, 0.84)',
    fontFamily: decorativeFontFamilyRegular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  formCard: {
    marginTop: 'auto',
    gap: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(12, 6, 4, 0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 138, 0.12)',
  },
})
