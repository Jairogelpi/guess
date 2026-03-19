import { useCallback } from 'react'
import { FlatList, View, Text, StyleSheet } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { colors } from '@/constants/theme'
import type { RoomPlayer } from '@/types/game'

interface PlayerListProps {
  /** Already-filtered and already-sorted players from the parent. */
  players: RoomPlayer[]
}

export function PlayerList({ players }: PlayerListProps) {
  const renderItem = useCallback(({ item, index }: { item: RoomPlayer; index: number }) => (
    <View style={[styles.row, index === players.length - 1 && styles.rowLast]}>
      <Avatar name={item.display_name} size={36} />
      <Text style={styles.name} numberOfLines={1}>{item.display_name}</Text>
      {item.is_host && (
        <Text style={styles.hostBadge}>HOST</Text>
      )}
      <View style={styles.dot} />
    </View>
  ), [players.length])

  return (
    <FlatList
      data={players}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.goldBorder,
  },
  rowLast: { borderBottomWidth: 0 },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  hostBadge: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
})
