import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii, shadows } from '@/constants/theme'

interface Props {
  roundNumber: number
  maxRounds: number
  phase: string
  wildcardsRemaining: number
}

export function RoundStatus({ roundNumber, maxRounds, phase, wildcardsRemaining }: Props) {
  const { t } = useTranslation()

  const phaseLabels: Record<string, string> = {
    narrator_turn: t('game.phaseNarrator'),
    players_turn: t('game.phaseChoose'),
    voting: t('game.phaseVote'),
    results: t('game.phaseResults'),
  }

  return (
    <View style={styles.shell}>
      <Text style={styles.round}>{t('game.round', { current: roundNumber, total: maxRounds })}</Text>
      <Text style={styles.phase}>{phaseLabels[phase] ?? phase}</Text>
      <Text style={styles.wildcards}>{t('game.wildcardsRemaining', { count: wildcardsRemaining })}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    backgroundColor: 'rgba(16, 9, 5, 0.72)',
    alignItems: 'center',
    gap: 6,
    ...shadows.surface,
  },
  round: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: fonts.title,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  phase: {
    color: colors.gold,
    fontSize: 18,
    fontFamily: fonts.title,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  wildcards: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.title,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
})
