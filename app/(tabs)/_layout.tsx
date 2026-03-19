import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { brandColors, brandTypography } from '@/constants/brand'
import { colors } from '@/constants/theme'

export default function TabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bgDeep,
          borderTopColor: colors.goldBorder,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
        headerStyle: { backgroundColor: colors.bgDeep },
        headerTintColor: colors.gold,
        headerTitleStyle: {
          color: brandColors.textPrimary,
          fontFamily: brandTypography.titleSection.fontFamily,
          fontSize: brandTypography.titleSection.fontSize,
          letterSpacing: brandTypography.titleSection.letterSpacing,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('home.createRoom') }} />
      <Tabs.Screen name="gallery" options={{ title: t('gallery.title') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile.title') }} />
    </Tabs>
  )
}
