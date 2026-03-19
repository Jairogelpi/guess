import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Background } from '@/components/layout/Background'
import { AppHeader } from '@/components/layout/AppHeader'
import { useUIStore } from '@/stores/useUIStore'
import { colors, radii } from '@/constants/theme'

type Mode = 'signin' | 'register'

export default function Login() {
  const { t } = useTranslation()
  const params = useLocalSearchParams<{ mode?: string | string[] }>()
  const showToast = useUIStore((s) => s.showToast)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const requested = Array.isArray(params.mode) ? params.mode[0] : params.mode
    setMode(requested === 'register' ? 'register' : 'signin')
  }, [params.mode])

  const isRegister = mode === 'register'

  async function submit() {
    if (!email || !password) return
    setLoading(true)
    const { error } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) showToast(error.message, 'error')
    setLoading(false)
  }

  return (
    <Background>
      <AppHeader />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{isRegister ? t('profile.upgradeAccount') : t('welcome.signIn')}</Text>
            <Text style={styles.subtitle}>
              {isRegister ? t('profile.upgradeExplain') : t('welcome.accountHint')}
            </Text>
          </View>

          <View style={styles.modeSwitch}>
            <TouchableOpacity
              onPress={() => setMode('signin')}
              style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
              activeOpacity={0.82}
            >
              <Text style={[styles.modeText, mode === 'signin' && styles.modeTextActive]}>
                {t('welcome.signIn')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('register')}
              style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
              activeOpacity={0.82}
            >
              <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>
                {t('profile.upgradeAccount')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
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
            <Button onPress={submit} loading={loading} disabled={!email || !password}>
              {isRegister ? t('profile.upgradeAccount') : t('welcome.signIn')}
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontFamily: 'CinzelDecorative_700Bold',
    textAlign: 'center',
    letterSpacing: 0.9,
  },
  subtitle: {
    maxWidth: '92%',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  modeSwitch: {
    flexDirection: 'row',
    gap: 8,
    padding: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(10, 6, 2, 0.36)',
  },
  modeTab: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    paddingHorizontal: 12,
  },
  modeTabActive: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  modeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'CinzelDecorative_700Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  modeTextActive: {
    color: colors.gold,
  },
  form: {
    gap: 16,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 138, 0.14)',
    backgroundColor: 'rgba(12, 6, 4, 0.42)',
  },
})
