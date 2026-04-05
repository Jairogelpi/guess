import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { APP_HEADER_LOGO_SCALE, APP_HEADER_THEME } from '@/constants/appChrome'
import { fonts, radii } from '@/constants/theme'
import { useProfile } from '@/hooks/useProfile'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { ProfileButton } from '@/components/ui/ProfileButton'

interface AppHeaderProps {
  title?: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const { i18n, t } = useTranslation()
  const router = useRouter()
  const { userId, avatarUrl, avatarFallback } = useProfile()

  const currentLang = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'es'

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.leftRail}>
          <View style={styles.logoMask}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </View>

        <View style={styles.titleRail}>
          {!!title && (
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              {title}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <LanguageToggle
            currentLang={currentLang}
            onChange={(lang) => void i18n.changeLanguage(lang)}
          />
          <ProfileButton
            userId={userId}
            avatarUrl={avatarUrl}
            avatarFallback={avatarFallback}
            accessibilityLabel={userId ? t('profile.title') : t('welcome.signIn')}
            onPress={() => router.push(userId ? '/(tabs)/profile' : '/(auth)/login')}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    alignItems: 'center',
  },
  shell: {
    minHeight: 52,
    width: '100%',
    maxWidth: 336,
    alignSelf: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: APP_HEADER_THEME.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    gap: 8,
    backgroundColor: 'rgba(12, 7, 3, 0.72)',
  },
  leftRail: {
    minWidth: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    transform: [{ scale: APP_HEADER_LOGO_SCALE }],
  },
  logoMask: {
    width: 38,
    height: 38,
    borderRadius: 8,
    overflow: 'hidden',
  },
  titleRail: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 0,
    maxWidth: 132,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  title: {
    color: 'rgba(245, 232, 211, 0.88)',
    fontFamily: fonts.titleHeavy,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
  },
})
