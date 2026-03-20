import { View, Text, Image, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  cardUri: string | null | undefined
  clue: string
}

export function ResultsReveal({ cardUri, clue }: Props) {
  const { t } = useTranslation()
  return (
    <View style={styles.container}>
      <Text style={styles.revealLabel}>{t('game.narratorCardReveal')}</Text>
      <View style={styles.cardWrap}>
        {cardUri ? (
          <Image source={{ uri: cardUri }} style={styles.card} resizeMode="cover" />
        ) : (
          <Image
            source={require('../../../assets/carta.png')}
            style={styles.card}
            resizeMode="cover"
          />
        )}
      </View>
      <View style={styles.clueBlock}>
        <Text style={styles.clueLabel}>{t('game.narratorClue')}</Text>
        <Text style={styles.clueText}>"{clue}"</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(25, 13, 10, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(244, 192, 119, 0.35)',
    borderRadius: radii.md,
    padding: 16,
  },
  revealLabel: {
    color: colors.gold,
    fontSize: 9,
    fontFamily: fonts.title,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  cardWrap: {
    width: '55%',
    aspectRatio: 2 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  card: { width: '100%', height: '100%' },
  clueBlock: { alignItems: 'center', gap: 4 },
  clueLabel: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 8,
    fontFamily: fonts.title,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  clueText: {
    color: '#fff7ea',
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    fontFamily: fonts.title,
    textAlign: 'center',
    lineHeight: 22,
  },
})
