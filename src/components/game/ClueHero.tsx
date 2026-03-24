import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  clue: string
}

export function ClueHero({ clue }: Props) {
  const { t } = useTranslation()
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('game.narratorClue')}</Text>
      <Text style={styles.clue}>"{clue}"</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20, 12, 5, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(230, 184, 0, 0.4)',
    borderRadius: radii.xl,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  label: {
    color: colors.gold,
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  clue: {
    color: colors.textPrimary,
    fontSize: 26,
    fontFamily: fonts.titleHeavy,
    textAlign: 'center',
    lineHeight: 34,
    textShadowColor: 'rgba(230, 184, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
})
