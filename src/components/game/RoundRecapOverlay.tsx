import { useEffect, useMemo, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, fonts, radii } from '@/constants/theme'
import { buildRoundRecapHeadline, getTopRoundMovers } from '@/lib/roundRecap'
import type { CompetitiveRoundSummary, RoomPlayer } from '@/types/game'

interface Props {
  visible: boolean
  summary: CompetitiveRoundSummary | null
  players: RoomPlayer[]
}

export function RoundRecapOverlay({ visible, summary, players }: Props) {
  const { t } = useTranslation()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(18)).current

  const movers = useMemo(
    () => (summary ? getTopRoundMovers(summary, players).slice(0, 3) : []),
    [players, summary],
  )
  const leader = useMemo(
    () => [...players].sort((a, b) => b.score - a.score)[0] ?? null,
    [players],
  )

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 260 : 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 18,
        duration: visible ? 260 : 220,
        useNativeDriver: true,
      }),
    ]).start()
  }, [opacity, translateY, visible])

  if (!visible) return null

  const headline = summary
    ? buildRoundRecapHeadline(summary, players)
    : t('game.roundRecapNoSummary')

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.panel, { transform: [{ translateY }] }]}>
        <Text style={styles.eyebrow}>{t('game.roundRecapTitle')}</Text>
        <Text style={styles.headline}>{headline}</Text>

        {movers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('game.roundRecapTopMovers')}</Text>
            <View style={styles.moverList}>
              {movers.map((mover) => (
                <View key={mover.playerId} style={styles.moverRow}>
                  <Text style={styles.moverName}>{mover.displayName}</Text>
                  <Text style={[styles.moverDelta, mover.delta < 0 && styles.moverDeltaNegative]}>
                    {mover.delta > 0 ? `+${mover.delta}` : `${mover.delta}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {leader && (
          <View style={styles.leaderChip}>
            <Text style={styles.leaderLabel}>{t('game.roundRecapCurrentLeader')}</Text>
            <Text style={styles.leaderText}>{leader.display_name}</Text>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 4, 2, 0.54)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    zIndex: 40,
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.24)',
    backgroundColor: 'rgba(18, 10, 6, 0.96)',
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 14,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: fonts.titleHeavy,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  moverList: {
    gap: 8,
  },
  moverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.12)',
    backgroundColor: 'rgba(30, 18, 10, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moverName: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: fonts.title,
  },
  moverDelta: {
    color: '#7ee081',
    fontSize: 15,
    fontFamily: fonts.titleHeavy,
  },
  moverDeltaNegative: {
    color: '#fca5a5',
  },
  leaderChip: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.18)',
    backgroundColor: 'rgba(230, 184, 0, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  leaderLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  leaderText: {
    color: colors.goldLight,
    fontSize: 16,
    fontFamily: fonts.titleHeavy,
  },
})
