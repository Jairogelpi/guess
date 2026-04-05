import { useMemo, useCallback } from 'react'
import { FlatList, View, Text, StyleSheet } from 'react-native'
import type { RoomPlayer, RoundScore } from '@/types/game'
import { colors, fonts, radii } from '@/constants/theme'

interface ScoreBoardProps {
  players: RoomPlayer[]
  roundScores?: RoundScore[]
}

const MEDALS = ['🥇', '🥈', '🥉']

export function ScoreBoard({ players, roundScores = [] }: ScoreBoardProps) {
  const sorted = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players],
  )

  const deltaByPlayer = useMemo(
    () =>
      roundScores.reduce<Record<string, number>>((acc, s) => {
        acc[s.player_id] = (acc[s.player_id] ?? 0) + s.points
        return acc
      }, {}),
    [roundScores],
  )

  const renderItem = useCallback(({ item, index }: { item: RoomPlayer; index: number }) => {
    const delta = deltaByPlayer[item.player_id]
    const isTop = index < 3
    return (
      <View style={[styles.row, isTop && styles.rowTop, index === sorted.length - 1 && styles.rowLast]}>
        <View style={styles.rankBadge}>
          <Text style={styles.rank}>
            {isTop ? (MEDALS[index] ?? '') : `${index + 1}`}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.name, isTop && styles.nameTop]} numberOfLines={1}>
            {item.display_name}
          </Text>
          {delta !== undefined ? (
            <Text style={styles.delta}>{delta > 0 ? `+${delta}` : `${delta}`}</Text>
          ) : (
            <Text style={styles.deltaMuted}>+0</Text>
          )}
        </View>
        <Text style={[styles.score, index === 0 && styles.scoreFirst]}>
          {item.score}
        </Text>
      </View>
    )
  }, [deltaByPlayer, sorted.length])

  return (
    <FlatList
      data={sorted}
      keyExtractor={(p) => p.id}
      scrollEnabled={false}
      renderItem={renderItem}
    />
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(18, 10, 6, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.1)',
    marginBottom: 8,
  },
  rowTop: {
    backgroundColor: 'rgba(28, 16, 8, 0.82)',
    borderColor: 'rgba(230, 184, 0, 0.2)',
  },
  rowLast: { marginBottom: 0 },
  rankBadge: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textMuted,
  },
  meta: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 15,
    fontFamily: fonts.title,
  },
  nameTop: {
    color: colors.textPrimary,
    fontFamily: fonts.titleHeavy,
  },
  delta: {
    color: '#4ade80',
    fontSize: 12,
    fontFamily: fonts.titleHeavy,
  },
  deltaMuted: {
    color: 'rgba(255, 241, 222, 0.4)',
    fontSize: 12,
    fontFamily: fonts.title,
  },
  score: {
    color: colors.gold,
    fontSize: 18,
    fontFamily: fonts.titleHeavy,
    minWidth: 32,
    textAlign: 'right',
  },
  scoreFirst: {
    color: colors.goldLight,
    fontSize: 22,
  },
})
