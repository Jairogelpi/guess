import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { Background } from '@/components/layout/Background'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/stores/useUIStore'
import { brandTypography } from '@/constants/brand'
import { colors } from '@/constants/theme'

type Tab = 'profile' | 'email' | 'password'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((state) => state.showToast)
  const { userId, isAnon: initialIsAnon, email: authEmail } = useAuth()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hasEmail, setHasEmail] = useState(false)
  const [isAnon, setIsAnon] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setIsAnon(initialIsAnon)
    setHasEmail(!!authEmail)
    setEmail(authEmail ?? '')
  }, [initialIsAnon, authEmail])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('display_name')
      .single()
      .then(({ data }) => {
        if (data) setDisplayName(data.display_name)
      })
  }, [])

  async function saveDisplayName() {
    if (!userId) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } })
    if (!error) {
      await supabase.from('profiles').update({ display_name: displayName }).eq('id', userId)
      showToast(t('profile.save'), 'success')
    } else {
      showToast(t('errors.generic'), 'error')
    }
    setSaving(false)
  }

  async function saveEmail() {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ email })
    if (!error) {
      showToast(t('profile.emailVerify'), 'info')
      setHasEmail(true)
      setIsAnon(false)
    } else {
      showToast(error.message, 'error')
    }
    setSaving(false)
  }

  async function savePassword() {
    if (password.length < 6) {
      showToast(t('profile.passwordTooShort'), 'error')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) {
      showToast(t('profile.passwordUpdated'), 'success')
      setPassword('')
    } else {
      showToast(error.message, 'error')
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/(auth)/welcome')
  }

  async function handleDeleteAccount() {
    Alert.alert(t('profile.deleteAccount'), t('profile.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.deleteAccount'),
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.functions.invoke('delete-account')
            await supabase.auth.signOut()
            router.replace('/(auth)/welcome')
          } catch {
            showToast(t('errors.generic'), 'error')
          }
        },
      },
    ])
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: t('profile.displayName') },
    { key: 'email', label: t('profile.email') },
    ...(hasEmail ? [{ key: 'password' as Tab, label: t('profile.password') }] : []),
  ]

  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {isAnon && (
            <View style={styles.anonBanner}>
              <DecorativeTitle variant="section" tone="gold" align="left" style={styles.anonTitle}>
                {t('profile.upgradeAccount')}
              </DecorativeTitle>
              <Text style={styles.anonSub}>{t('profile.upgradeSubtitle')}</Text>
            </View>
          )}

          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === 'profile' && (
              <>
                <Input
                  label={t('profile.displayName')}
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={30}
                  autoCapitalize="words"
                />
                <Button onPress={saveDisplayName} loading={saving} disabled={!displayName.trim()}>
                  {t('profile.save')}
                </Button>
              </>
            )}
            {activeTab === 'email' && (
              <>
                <Input
                  label={t('profile.email')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                <Button onPress={saveEmail} loading={saving} disabled={!email.trim()}>
                  {t('profile.save')}
                </Button>
              </>
            )}
            {activeTab === 'password' && (
              <>
                <Input
                  label={t('profile.password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
                <Button onPress={savePassword} loading={saving} disabled={!password}>
                  {t('profile.save')}
                </Button>
              </>
            )}
          </View>

          <View style={styles.dangerZone}>
            <Button onPress={handleLogout} variant="ghost">
              {t('profile.logout')}
            </Button>
            <Button onPress={handleDeleteAccount} variant="danger">
              {t('profile.deleteAccount')}
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
  content: { gap: 18, padding: 16, paddingBottom: 40 },
  anonBanner: {
    backgroundColor: 'rgba(249,115,22,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  anonTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  anonSub: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceDeep,
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  tabText: {
    color: colors.textMuted,
    fontFamily: brandTypography.eyebrow.fontFamily,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: colors.gold,
  },
  tabContent: { gap: 14 },
  dangerZone: { gap: 10, marginTop: 8 },
})
