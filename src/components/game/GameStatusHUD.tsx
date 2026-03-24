import { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  roundNumber: number
  maxRounds: number
  phaseLabel: string
  stepCurrent?: number
  stepTotal?: number
  phaseStartedAt?: string | null
  phaseDurationSeconds?: number
}

export function GameStatusHUD({ 
  roundNumber, 
  maxRounds, 
  phaseLabel, 
  stepCurrent, 
  stepTotal,
  phaseStartedAt,
  phaseDurationSeconds = 60
}: Props) {
  const { t } = useTranslation()
  const showStep = stepCurrent !== undefined && stepTotal !== undefined
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!phaseStartedAt) {
      setSecondsLeft(null)
      return
    }

    const updateTimer = () => {
      const start = new Date(phaseStartedAt).getTime()
      const now = new Date().getTime()
      const elapsed = Math.floor((now - start) / 1000)
      const remaining = Math.max(0, phaseDurationSeconds - elapsed)
      setSecondsLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [phaseStartedAt, phaseDurationSeconds])

  const isCritical = secondsLeft !== null && secondsLeft < 10

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Text style={styles.label}>{t('game.roundLabel', { defaultValue: 'RONDA' })}</Text>
        <Text style={styles.value}>{roundNumber} / {maxRounds}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={[styles.item, { flex: 1, alignItems: 'center' }]}>
        <Text style={styles.label}>{t('game.phaseLabel', { defaultValue: 'FASE' })}</Text>
        <Text style={[styles.value, { color: colors.gold }]} numberOfLines={1}>
          {phaseLabel}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={[styles.item, { alignItems: 'flex-end', minWidth: 40 }]}>
        <Text style={styles.label}>{t('game.timerLabel', { defaultValue: 'TIEMPO' })}</Text>
        <Text style={[styles.value, isCritical && { color: '#ff4444' }]}>
          {secondsLeft !== null ? `${secondsLeft}s` : '--'}
        </Text>
      </View>

      {showStep && (
        <>
          <View style={styles.divider} />
          <View style={styles.item}>
            <Text style={styles.label}>{t('game.stepLabel', { defaultValue: 'PASO' })}</Text>
            <Text style={styles.value}>{stepCurrent} / {stepTotal}</Text>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 12, 5, 0.65)',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.15)',
    gap: 12,
  },
  item: {
    gap: 2,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(230, 184, 0, 0.15)',
  },
  label: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 8,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  value: {
    color: '#fff7ea',
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.5,
  },
})
