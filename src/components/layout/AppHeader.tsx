import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { APP_HEADER_LOGO_SCALE, APP_HEADER_THEME, APP_VERSION } from '@/constants/appChrome'
import { colors, fonts, radii } from '@/constants/theme'
import { useProfile } from '@/hooks/useProfile'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

interface AppHeaderProps {
  title?: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const { i18n, t } = useTranslation()
  const router = useRouter()
  const { userId, avatarUrl, avatarFallback } = useProfile()

  const currentLang = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'es'

  function goToProfile() {
    router.push(userId ? '/(tabs)/profile' : '/(auth)/login')
  }

  function changeLanguage(lang: 'es' | 'en') {
    void i18n.changeLanguage(lang)
  }

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
          <View style={styles.langGroup} accessibilityRole="radiogroup">
            {(['es', 'en'] as const).map((lang) => {
              const active = currentLang === lang

              return (
                <Pressable
                  key={lang}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  onPress={() => changeLanguage(lang)}
                  style={[styles.langButton, active && styles.langButtonActive]}
                >
                  <Text style={[styles.langText, active && styles.langTextActive]}>
                    {lang.toUpperCase()}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Pressable
            accessibilityLabel={userId ? t('profile.title') : t('welcome.signIn')}
            onPress={goToProfile}
            style={styles.profileButton}
          >
            {userId ? (
              <ProfileAvatar avatarUrl={avatarUrl} fallback={avatarFallback} size={34} />
            ) : (
              <View style={styles.profileIconShell}>
                <MaterialCommunityIcons name="account-circle-outline" size={22} color={colors.goldLight} />
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
  },
  shell: {
    minHeight: 52,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: APP_HEADER_THEME.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    backgroundColor: 'rgba(12, 7, 3, 0.72)',
  },
  leftRail: {
    width: 64,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
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
  versionText: {
    color: colors.gold,
    fontFamily: fonts.title,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  titleRail: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 4,
  },
  title: {
    color: '#fff4d6',
    fontFamily: fonts.titleHeavy,
    fontSize: 14,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  actions: {
    width: 132,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  langGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 6, 2, 0.36)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 228, 186, 0.18)',
    padding: 3,
  },
  langButton: {
    minWidth: 32,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  langButtonActive: {
    backgroundColor: 'rgba(255, 228, 186, 0.16)',
  },
  langText: {
    color: colors.textMuted,
    fontFamily: fonts.title,
    fontSize: 11,
    letterSpacing: 0.9,
  },
  langTextActive: {
    color: colors.textPrimary,
  },
  profileButton: {
    borderRadius: radii.full,
  },
  profileIconShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 6, 2, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 228, 186, 0.2)',
  },
})
