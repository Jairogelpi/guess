import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Background } from '@/components/layout/Background'
import { useUIStore } from '@/stores/useUIStore'
import { colors } from '@/constants/theme'

type Tab = 'profile' | 'email' | 'password'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
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
      .then(({ data }) => { if (data) setDisplayName(data.display_name) })
  }, [])

  async function saveDisplayName() {
    if (!userId) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { display_name: displayName } })
    if (!error) {
      await supabase.from('profiles').update({ display_name: displayName })
        .eq('id', userId)
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
        text: t('profile.deleteAccount'), style: 'destructive',
        onPress: async () => {
          try {
            // Call edge function that deletes the user via Admin SDK
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
              <Text style={styles.anonTitle}>{t('profile.upgradeAccount')}</Text>
              <Text style={styles.anonSub}>{t('profile.upgradeSubtitle')}</Text>
            </View>
          )}

          {/* Tab bar */}
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

          {/* Tab content */}
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

          {/* Danger zone */}
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
    gap: 4,
  },
  anonTitle: {
    color: colors.orange,
    fontWeight: '700',
    fontSize: 15,
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
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.gold,
  },
  tabContent: { gap: 14 },
  dangerZone: { gap: 10, marginTop: 8 },
})
