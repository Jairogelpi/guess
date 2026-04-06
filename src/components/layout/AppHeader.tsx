import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
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
  const { width: screenWidth } = useWindowDimensions()

  const currentLang = (i18n.resolvedLanguage ?? i18n.language).startsWith('en') ? 'en' : 'es'
  const shellMaxWidth = Math.min(Math.max(screenWidth - 12, 304), 344)
  const headerScale = Math.max(0.96, Math.min(shellMaxWidth / 344, 1.04))
  const safePaddingHorizontal = Math.max(12, Math.round(18 * headerScale))
  const safePaddingTop = Math.max(5, Math.round(7 * headerScale))
  const safePaddingBottom = Math.max(3, Math.round(5 * headerScale))
  const shellMinHeight = Math.max(48, Math.round(56 * headerScale))
  const shellPaddingHorizontal = Math.max(10, Math.round(12 * headerScale))
  const shellGap = Math.max(8, Math.round(10 * headerScale))
  const railSize = Math.max(34, Math.round(40 * headerScale))
  const railRadius = Math.max(8, Math.round(10 * headerScale))
  const titleMinHeight = Math.max(26, Math.round(30 * headerScale))
  const titleMaxWidth = Math.max(108, Math.round(144 * headerScale))
  const titleFontSize = Math.max(12, Math.round(13 * headerScale))
  const titleLetterSpacing = Math.max(0.55, 0.9 * headerScale)
  const actionsGap = Math.max(6, Math.round(8 * headerScale))
  const profileButtonSize = Math.round(36 * headerScale)

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safe,
        {
          paddingHorizontal: safePaddingHorizontal,
          paddingTop: safePaddingTop,
          paddingBottom: safePaddingBottom,
        },
      ]}
    >
      <View
        style={[
          styles.shell,
          {
            minHeight: shellMinHeight,
            maxWidth: shellMaxWidth,
            paddingHorizontal: shellPaddingHorizontal,
            gap: shellGap,
          },
        ]}
      >
        <View style={[styles.leftRail, { minWidth: railSize, height: railSize }]}>
          <View style={[styles.logoMask, { width: railSize, height: railSize, borderRadius: railRadius }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </View>

        <View style={[styles.titleRail, { minHeight: titleMinHeight, maxWidth: titleMaxWidth }]}>
          {!!title && (
            <Text
              style={[styles.title, { fontSize: titleFontSize, letterSpacing: titleLetterSpacing }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {title}
            </Text>
          )}
        </View>

        <View style={[styles.actions, { gap: actionsGap }]}>
          <LanguageToggle
            currentLang={currentLang}
            onChange={(lang) => void i18n.changeLanguage(lang)}
            scale={headerScale}
          />
          <ProfileButton
            userId={userId}
            avatarUrl={avatarUrl}
            avatarFallback={avatarFallback}
            accessibilityLabel={userId ? t('profile.title') : t('welcome.signIn')}
            onPress={() => router.push(userId ? '/(tabs)/profile' : '/(auth)/login')}
            size={profileButtonSize}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    alignItems: 'center',
  },
  shell: {
    width: '100%',
    alignSelf: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: APP_HEADER_THEME.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(12, 7, 3, 0.72)',
  },
  leftRail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    transform: [{ scale: APP_HEADER_LOGO_SCALE }],
  },
  logoMask: {
    overflow: 'hidden',
  },
  titleRail: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  title: {
    color: 'rgba(245, 232, 211, 0.88)',
    fontFamily: fonts.titleHeavy,
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
  },
})
