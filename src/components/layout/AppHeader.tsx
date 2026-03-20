import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { APP_HEADER_LOGO_SCALE, APP_HEADER_THEME } from '@/constants/appChrome'
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
              <ProfileAvatar avatarUrl={avatarUrl} fallback={avatarFallback} size={32} />
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
  },
  title: {
    color: '#fff4d6',
    fontFamily: fonts.titleHeavy,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
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
    minWidth: 30,
    height: 26,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  langButtonActive: {
    backgroundColor: 'rgba(255, 228, 186, 0.16)',
  },
  langText: {
    color: colors.textMuted,
    fontFamily: fonts.title,
    fontSize: 10,
    letterSpacing: 0.7,
  },
  langTextActive: {
    color: colors.textPrimary,
  },
  profileButton: {
    borderRadius: radii.full,
  },
  profileIconShell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 6, 2, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 228, 186, 0.2)',
  },
})
