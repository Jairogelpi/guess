import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors } from '@/constants/theme'

export default function RoomLayout() {
  const { t } = useTranslation()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgDeep },
        headerTintColor: colors.gold,
        headerTitleStyle: { fontWeight: '700', color: colors.textPrimary },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="lobby" options={{ title: t('lobby.title') }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="ended" options={{ title: t('ended.title'), headerBackVisible: false }} />
    </Stack>
  )
}
