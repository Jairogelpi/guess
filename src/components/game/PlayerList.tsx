import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/ui/Avatar'
import { colors, fonts } from '@/constants/theme'
import type { RoomPlayer } from '@/types/game'

interface PlayerListProps {
  players: RoomPlayer[]
  onPlayerPress?: (player: RoomPlayer) => void
}

export function PlayerList({ players, onPlayerPress }: PlayerListProps) {
  const { t } = useTranslation()

  return (
    <View>
      {players.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.7}
          onPress={() => onPlayerPress?.(item)}
          style={[styles.row, index === players.length - 1 && styles.rowLast]}
        >
          <Avatar uri={item.profiles?.avatar_url} name={item.display_name} size={36} />
          <Text style={styles.name} numberOfLines={1}>
            {item.display_name}
          </Text>
          {item.is_host && <Text style={styles.hostBadge}>HOST</Text>}
          {!item.is_host && (
            <Text style={[styles.statusBadge, item.is_ready ? styles.readyBadge : styles.waitingBadge]}>
              {item.is_ready ? t('lobby.ready') : t('lobby.notReady')}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
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
    fontFamily: fonts.titleHeavy,
  },
  hostBadge: {
    color: colors.gold,
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadge: {
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 1.2,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  readyBadge: {
    color: '#86efac',
    borderColor: 'rgba(74, 222, 128, 0.45)',
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
  },
  waitingBadge: {
    color: '#fde68a',
    borderColor: 'rgba(245, 196, 104, 0.35)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
})
