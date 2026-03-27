import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { buildLiveStandingsEntries } from '../../lib/liveStandings'
import { colors, fonts, radii } from '../../constants/theme'
import type { RoomPlayer } from '../../types/game'

export function LiveStandingsStrip({
  players,
  currentUserId,
}: {
  players: RoomPlayer[]
  currentUserId: string | null
}) {
  const entries = buildLiveStandingsEntries(players, currentUserId)

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {entries.map((entry) => (
        <View
          key={entry.playerId}
          testID={`standings-pill-${entry.playerId}`}
          accessibilityState={{ selected: entry.isCurrentUser }}
          style={[
            styles.pill,
            entry.isLeader && styles.pillLeader,
            entry.isCurrentUser && styles.pillCurrentUser,
          ]}
        >
          <Text style={styles.rank}>{`#${entry.position}`}</Text>
          <Avatar uri={entry.avatarUrl ?? undefined} name={entry.displayName} size={28} />
          <Text numberOfLines={1} style={styles.name}>{entry.displayName}</Text>
          <Text style={styles.score}>{entry.score}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 142,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.goldBorderSubtle,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceCard,
  },
  pillLeader: {
    borderColor: colors.goldBorder,
    backgroundColor: colors.surfaceTop,
  },
  pillCurrentUser: {
    borderColor: colors.goldLight,
  },
  rank: {
    minWidth: 24,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  score: {
    minWidth: 22,
    color: colors.gold,
    fontFamily: fonts.title,
    fontSize: 18,
    textAlign: 'right',
  },
})
