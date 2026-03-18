import { useMemo, useCallback } from 'react'
import { FlatList, View, Text, StyleSheet } from 'react-native'
import type { RoomPlayer, RoundScore } from '@/types/game'
import { colors } from '@/constants/theme'

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
      <View style={[styles.row, index === sorted.length - 1 && styles.rowLast]}>
        <Text style={styles.rank}>
          {isTop ? (MEDALS[index] ?? '') : `${index + 1}`}
        </Text>
        <Text style={[styles.name, isTop && styles.nameTop]} numberOfLines={1}>
          {item.display_name}
        </Text>
        {delta !== undefined && (
          <Text style={styles.delta}>+{delta}</Text>
        )}
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
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldBorder,
  },
  rowLast: { borderBottomWidth: 0 },
  rank: {
    fontSize: 16,
    width: 28,
    textAlign: 'center',
    color: colors.textMuted,
  },
  name: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  nameTop: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  delta: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
  },
  score: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'right',
  },
  scoreFirst: {
    color: colors.goldLight,
    fontSize: 22,
  },
})
