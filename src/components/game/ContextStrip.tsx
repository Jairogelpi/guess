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
    backgroundColor: 'rgba(10, 6, 2, 0.98)',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(230, 184, 0, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    shadowColor: '#e6b800',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  left: { flex: 1, gap: 2 },
  round: {
    color: 'rgba(255, 241, 222, 0.45)',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  phase: {
    color: colors.gold,
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pill: {
    backgroundColor: 'rgba(230, 184, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 9,
    fontFamily: fonts.title,
  },
})
