import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
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
        headerTitleStyle: { fontWeight: '700', letterSpacing: 1, color: colors.textPrimary },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('home.createRoom') }} />
      <Tabs.Screen name="gallery" options={{ title: t('gallery.title') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile.title') }} />
    </Tabs>
  )
}
