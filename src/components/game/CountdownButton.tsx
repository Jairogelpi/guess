import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'

interface Props {
  secondsRemaining: number
  totalSeconds: number
  isHost: boolean
  confirmed: boolean
  confirmedCount: number  // for display (how many confirmed)
  totalCount: number      // total players including narrator
  isLastRound: boolean
  onConfirm: () => void
  onAutoAdvance: () => void
}

export function CountdownButton({
  secondsRemaining,
  totalSeconds,
  isHost,
  confirmed,
  confirmedCount,
  totalCount,
  isLastRound,
  onConfirm,
  onAutoAdvance,
}: Props) {
  const { t } = useTranslation()
  const advancedRef = useRef(false)
  const progress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds))

  // Auto-advance when timer hits zero (host only)
  useEffect(() => {
    if (secondsRemaining <= 0 && isHost && !advancedRef.current) {
      advancedRef.current = true
      onAutoAdvance()
    }
  }, [secondsRemaining, isHost, onAutoAdvance])

  const buttonLabel = confirmed
    ? t('game.waitingConfirm')
    : isLastRound
    ? t('game.endGame')
    : t('game.nextRound')

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Timer text */}
      <Text style={styles.timer}>
        {Math.ceil(secondsRemaining)}s
      </Text>

      {/* Button — host interactive, guest read-only */}
      {isHost ? (
        <TouchableOpacity
          style={[styles.btn, confirmed && styles.btnConfirmed]}
          onPress={() => {
            if (!confirmed) onConfirm()
          }}
          disabled={confirmed}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, confirmed && styles.btnTextConfirmed]}>
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.btn, confirmed ? styles.btnConfirmed : styles.btnGuest]}>
          <Text style={[styles.btnText, confirmed && styles.btnTextConfirmed]}>
            {buttonLabel}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(244, 192, 119, 0.12)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 99,
  },
  timer: {
    color: 'rgba(255, 241, 222, 0.3)',
    fontSize: 11,
    fontFamily: fonts.title,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: colors.orange,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnConfirmed: {
    backgroundColor: 'rgba(67, 34, 21, 0.4)',
  },
  btnGuest: {
    backgroundColor: 'rgba(67, 34, 21, 0.3)',
  },
  btnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.title,
  },
  btnTextConfirmed: {
    color: 'rgba(255, 241, 222, 0.3)',
  },
})
