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
  phaseDurationSeconds = 60,
}: Props) {
  const { t } = useTranslation()
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const isUnlimited = !phaseDurationSeconds

  useEffect(() => {
    if (!phaseStartedAt || isUnlimited) {
      setSecondsLeft(null)
      return
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - new Date(phaseStartedAt).getTime()) / 1000)
      setSecondsLeft(Math.max(0, phaseDurationSeconds - elapsed))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [phaseStartedAt, phaseDurationSeconds, isUnlimited])

  const isCritical = secondsLeft !== null && secondsLeft < 10
  const isWarning  = secondsLeft !== null && secondsLeft < 20 && !isCritical

  // Format seconds as M:SS when >= 60, otherwise just "Xs"
  function formatTime(s: number) {
    if (s >= 60) {
      const m = Math.floor(s / 60)
      const sec = s % 60
      return `${m}:${sec.toString().padStart(2, '0')}`
    }
    return `${s}s`
  }

  const timerColor = isCritical ? '#ff4444' : isWarning ? '#f97316' : colors.gold

  return (
    <View style={styles.container}>
      {/* Round pill — left */}
      <View style={styles.roundPill}>
        <Text style={styles.roundLabel}>
          {t('game.roundLabel', { defaultValue: 'R' })}
        </Text>
        <Text style={styles.roundValue}>
          {roundNumber}
          <Text style={styles.roundMax}>/{maxRounds}</Text>
        </Text>
      </View>

      {/* Phase label — center, dominant */}
      <View style={styles.phaseCenter}>
        {stepCurrent !== undefined && stepTotal !== undefined && (
          <Text style={styles.stepLabel}>
            {t('game.stepLabel', { defaultValue: 'PASO' })} {stepCurrent}/{stepTotal}
          </Text>
        )}
        <Text style={styles.phaseLabel} numberOfLines={1}>
          {phaseLabel}
        </Text>
      </View>

      {/* Timer — right */}
      <View style={styles.timerPill}>
        <Text style={styles.timerLabel}>
          {t('game.timerLabel', { defaultValue: 'T' })}
        </Text>
        <Text style={[styles.timerValue, { color: timerColor }, isCritical && styles.timerCritical]}>
          {isUnlimited
            ? '∞'
            : secondsLeft !== null
              ? formatTime(secondsLeft)
              : '--'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 12, 5, 0.70)',
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.12)',
    gap: 8,
  },

  // ── Round: small pill on the left ──
  roundPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    minWidth: 42,
  },
  roundLabel: {
    color: 'rgba(255,241,222,0.35)',
    fontSize: 9,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  roundValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.5,
  },
  roundMax: {
    color: 'rgba(255,241,222,0.40)',
    fontSize: 12,
  },

  // ── Phase: center, most important ──
  phaseCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  stepLabel: {
    color: 'rgba(255,241,222,0.30)',
    fontSize: 8,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  phaseLabel: {
    color: colors.gold,
    fontSize: 13,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Timer: right, changes color when urgent ──
  timerPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    minWidth: 42,
    justifyContent: 'flex-end',
  },
  timerLabel: {
    color: 'rgba(255,241,222,0.35)',
    fontSize: 9,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timerValue: {
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.5,
  },
  timerCritical: {
    fontSize: 16,
  },
})
