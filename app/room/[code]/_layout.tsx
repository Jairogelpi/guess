import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { brandColors, brandTypography } from '@/constants/brand'
import { colors } from '@/constants/theme'

export default function RoomLayout() {
  const { t } = useTranslation()
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgDeep },
        headerTintColor: colors.gold,
        headerTitleStyle: {
          color: brandColors.textPrimary,
          fontFamily: brandTypography.titleSection.fontFamily,
          fontSize: brandTypography.titleSection.fontSize,
          letterSpacing: brandTypography.titleSection.letterSpacing,
        },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="lobby" options={{ title: t('lobby.title') }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="ended" options={{ title: t('ended.title'), headerBackVisible: false }} />
    </Stack>
  )
}
