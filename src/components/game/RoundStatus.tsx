import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors } from '@/constants/theme'

interface Props {
  roundNumber: number
  maxRounds: number
  phase: string
}

export function RoundStatus({ roundNumber, maxRounds, phase }: Props) {
  const { t } = useTranslation()

  const phaseLabels: Record<string, string> = {
    narrator_turn: t('game.phaseNarrator'),
    players_turn: t('game.phaseChoose'),
    voting: t('game.phaseVote'),
    results: t('game.phaseResults'),
  }

  return (
    <View style={styles.bar}>
      <Text style={styles.round}>
        {roundNumber} / {maxRounds}
      </Text>
      <View style={styles.divider} />
      <Text style={styles.phase}>{phaseLabels[phase] ?? phase}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.bgDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldBorder,
  },
  round: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: colors.goldBorder,
  },
  phase: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
})
