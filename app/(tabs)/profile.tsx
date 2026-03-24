import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AppHeader } from '@/components/layout/AppHeader'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'
import { useUIStore } from '@/stores/useUIStore'
import { colors, fonts, radii } from '@/constants/theme'

type Tab = 'profile' | 'email' | 'password'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const {
    userId,
    isAnon: initialIsAnon,
    email: authEmail,
    displayName: storedDisplayName,
    avatarUrl,
    avatarFallback,
    setProfile,
  } = useProfile()

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
    setDisplayName(storedDisplayName)
  }, [storedDisplayName])

  async function saveDisplayName() {
    if (!userId || !displayName.trim()) return

    const nextName = displayName.trim()

    setSaving(true)
    const { error: authError } = await supabase.auth.updateUser({ data: { display_name: nextName } })
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: nextName, avatar_url: avatarUrl, updated_at: new Date().toISOString() })

    if (!authError && !profileError) {
      setProfile({ displayName: nextName, avatarUrl })
      showToast(t('profile.save'), 'success')
    } else {
      console.error('Save display name error:', authError ?? profileError)
      showToast((authError ?? profileError)?.message ?? t('errors.generic'), 'error')
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
    <>
      <AppHeader title={t('profile.title')} />
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <ProfileAvatar avatarUrl={avatarUrl} fallback={avatarFallback} size={112} />

            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{t('profile.avatarTitle')}</Text>
              <Text style={styles.heroName}>
                {displayName.trim() || email.split('@')[0] || t('profile.title')}
              </Text>
              <Text style={styles.heroHint}>{t('profile.avatarHint')}</Text>
            </View>

            <Button
              variant="secondary"
              onPress={() => router.push('/(tabs)/gallery')}
              style={styles.heroButton}
            >
              {t('profile.openGallery')}
            </Button>
          </View>

          {isAnon && (
            <View style={styles.anonBanner}>
              <Text style={styles.anonTitle}>{t('profile.upgradeAccount')}</Text>
              <Text style={styles.anonSub}>{t('profile.upgradeExplain')}</Text>
              <Button
                variant="primary"
                onPress={() => router.push('/(auth)/login?mode=register')}
                style={styles.anonCta}
              >
                {t('profile.goToAccount')}
              </Button>
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
    </>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { gap: 18, padding: 16, paddingBottom: 124 },
  heroCard: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.45)',
    backgroundColor: 'rgba(18, 8, 4, 0.78)',
  },
  heroCopy: {
    alignItems: 'center',
    gap: 6,
  },
  heroEyebrow: {
    color: colors.gold,
    fontFamily: fonts.title,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroName: {
    color: '#fff4d6',
    fontFamily: fonts.titleHeavy,
    fontSize: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 4,
  },
  heroHint: {
    color: 'rgba(255, 228, 180, 0.65)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  heroButton: {
    width: '100%',
  },
  anonBanner: {
    backgroundColor: 'rgba(18, 8, 4, 0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(249,115,22,0.55)',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  anonTitle: {
    color: '#ff8c3a',
    fontFamily: fonts.title,
    fontSize: 15,
  },
  anonSub: {
    color: 'rgba(255, 228, 180, 0.65)',
    fontSize: 13,
    lineHeight: 19,
  },
  anonCta: {
    alignSelf: 'center',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 8, 4, 0.78)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.38)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(74, 38, 18, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.5)',
  },
  tabText: {
    color: 'rgba(255, 228, 180, 0.45)',
    fontSize: 12,
    fontFamily: fonts.title,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: colors.gold,
  },
  tabContent: {
    gap: 14,
    backgroundColor: 'rgba(18, 8, 4, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.35)',
    borderRadius: radii.lg,
    padding: 16,
  },
  dangerZone: { gap: 10, marginTop: 8 },
})
