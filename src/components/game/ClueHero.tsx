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
    backgroundColor: 'rgba(25, 13, 10, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 192, 119, 0.42)',
    borderRadius: radii.md,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: colors.gold,
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  clue: {
    color: '#fff7ea',
    fontSize: 16,
    fontFamily: fonts.title,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
})
