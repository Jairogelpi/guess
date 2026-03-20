import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts } from '@/constants/theme'

export function GameLoadingScreen() {
  const { t } = useTranslation()
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.gold} />
      <Text style={styles.text}>{t('game.loading')}</Text>
      <Text style={styles.sub}>{t('game.loadingSub')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0602',
    gap: 14,
  },
  text: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.title,
  },
  sub: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 12,
    fontFamily: fonts.title,
  },
})
