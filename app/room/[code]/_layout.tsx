import { Stack } from 'expo-router'
import { StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import { colors } from '@/constants/theme'

export default function RoomLayout() {
  const { t } = useTranslation()

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerBackground: () => (
          <LinearGradient
            colors={['rgba(18, 10, 6, 0.16)', 'rgba(18, 10, 6, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerFill}
          />
        ),
        headerShadowVisible: false,
        headerTintColor: colors.gold,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontFamily: 'CinzelDecorative_700Bold',
          fontSize: 17,
          color: colors.textPrimary,
        } as object,
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="lobby" options={{ title: t('lobby.title') }} />
      <Stack.Screen name="game" options={{ headerShown: false }} />
      <Stack.Screen name="ended" options={{ title: t('ended.title'), headerBackVisible: false }} />
    </Stack>
  )
}

const styles = StyleSheet.create({
  headerFill: {
    ...StyleSheet.absoluteFillObject,
  },
})
