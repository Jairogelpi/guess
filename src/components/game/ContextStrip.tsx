import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts } from '@/constants/theme'

interface Props {
  roundNumber: number
  maxRounds: number
  phaseLabel: string    // already-translated phase label
  stepCurrent?: number  // show "Paso N/M" pill when provided
  stepTotal?: number
}

export function ContextStrip({ roundNumber, maxRounds, phaseLabel, stepCurrent, stepTotal }: Props) {
  const { t } = useTranslation()
  const showStep = stepCurrent !== undefined && stepTotal !== undefined

  return (
    <View style={styles.strip}>
      <View style={styles.left}>
        <Text style={styles.round}>
          {t('game.round', { current: roundNumber, total: maxRounds })}
        </Text>
        <Text style={styles.phase}>{phaseLabel}</Text>
      </View>
      {showStep && (
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {t('game.step', { current: stepCurrent, total: stepTotal })}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 9, 5, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 192, 119, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 8,
  },
  left: { flex: 1, gap: 1 },
  round: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 9,
    fontFamily: fonts.title,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  phase: {
    color: colors.gold,
    fontSize: 11,
    fontFamily: fonts.title,
    fontWeight: '700',
  },
  pill: {
    backgroundColor: 'rgba(244, 192, 119, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 192, 119, 0.2)',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 9,
    fontFamily: fonts.title,
  },
})
