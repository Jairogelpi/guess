import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Background } from '@/components/layout/Background'
import { useUIStore } from '@/stores/useUIStore'
import { colors } from '@/constants/theme'

export default function Login() {
  const { t } = useTranslation()
  const showToast = useUIStore((s) => s.showToast)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>✦ GUESS THE PRONT ✦</Text>
            <Text style={styles.title}>
              {isRegister ? t('profile.upgradeAccount') : t('welcome.signIn')}
            </Text>
            <View style={styles.divider} />
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
            <Button onPress={submit} loading={loading}>
              {isRegister ? t('profile.upgradeAccount') : t('welcome.signIn')}
            </Button>
          </View>

          <TouchableOpacity onPress={() => setIsRegister((v) => !v)} style={styles.toggle}>
            <Text style={styles.toggleText}>
              {isRegister ? t('welcome.signIn') : t('profile.upgradeAccount')}
            </Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  header: { alignItems: 'center', gap: 8, width: '100%' },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  divider: {
    width: 50,
    height: 1.5,
    backgroundColor: colors.gold,
    opacity: 0.65,
    marginTop: 4,
  },
  form: { width: '100%', gap: 16 },
  toggle: { paddingVertical: 8 },
  toggleText: {
    color: colors.goldLight,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
})
