import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Background } from '@/components/layout/Background'
import { DecorativeTitle } from '@/components/branding/DecorativeTitle'
import { EntryCardShell } from '@/components/layout/EntryCardShell'
import { EntryUtilityPill } from '@/components/layout/EntryUtilityPill'
import { Button } from '@/components/ui/Button'
import { brandColors, decorativeFontFamilyRegular } from '@/constants/brand'
import { radii } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/stores/useUIStore'

const APP_VERSION = 'v1.0.0'

export default function Welcome() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const [loading, setLoading] = useState(false)
  const currentLang = i18n.language.split('-')[0]?.toUpperCase() || 'ES'

  async function enterAsGuest() {
    if (loading) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        if (error.message.includes('Database error')) {
          showToast('Database Error: Check Supabase dashboard SQL editor (Trigger handle_new_user failing).', 'error')
        } else {
          showToast(error.message, 'error')
        }
      }
    } catch (error) {
      console.error('Guest login exception:', error)
      showToast(t('errors.generic'), 'error')
    } finally {
      setLoading(false)
    }
  }

  function toggleLanguage() {
    void i18n.changeLanguage(currentLang === 'ES' ? 'en' : 'es')
  }

  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
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
                  variant="hero"
                  tone="hero"
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  numberOfLines={1}
                  style={styles.heroLine}
                >
                  GUESS THE
                </DecorativeTitle>
                <DecorativeTitle
                  variant="hero"
                  tone="hero"
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
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
              <Button
                onPress={enterAsGuest}
                loading={loading}
                style={styles.primaryButton}
                textStyle={styles.primaryButtonText}
              >
                {t('welcome.enterAsGuest')}
              </Button>

              <View style={styles.secondaryRow}>
                <Button
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/(auth)/login', params: { mode: 'login' } })}
                  style={styles.secondaryButton}
                >
                  {t('welcome.signIn')}
                </Button>
                <Button
                  variant="secondary"
                  onPress={() => router.push({ pathname: '/(auth)/login', params: { mode: 'register' } })}
                  style={styles.secondaryButton}
                >
                  {t('profile.upgradeAccount')}
                </Button>
              </View>
            </View>
          </EntryCardShell>
        </ScrollView>
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  cardContent: {
    justifyContent: 'space-between',
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 6,
  },
  eyebrow: {
    marginBottom: 16,
  },
  heroTitleGroup: {
    width: '100%',
    gap: 2,
  },
  heroLine: {
    width: '100%',
    fontSize: 52,
    lineHeight: 50,
  },
  heroLineOffset: {
    marginTop: -2,
  },
  divider: {
    width: 88,
    height: 3,
    borderRadius: radii.full,
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: brandColors.goldSoft,
  },
  subtitle: {
    maxWidth: '88%',
    color: 'rgba(255, 245, 231, 0.92)',
    fontFamily: decorativeFontFamilyRegular,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  actions: {
    marginTop: 'auto',
    gap: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(12, 6, 4, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 138, 0.12)',
  },
  primaryButton: {
    width: '100%',
  },
  primaryButtonText: {
    color: '#f6fcff',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 1.2,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
  },
})
