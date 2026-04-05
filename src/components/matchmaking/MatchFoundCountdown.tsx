import { StyleSheet, Text, View } from 'react-native'
import { Avatar } from '@/components/ui/Avatar'
import { fonts, radii } from '@/constants/theme'
import type { QuickMatchMatchedPlayer } from '@/types/game'

type Props = {
  players: QuickMatchMatchedPlayer[]
  progress: number
}

export function MatchFoundCountdown({ players, progress }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>partida encontrada</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(progress, 1)) * 100}%` }]} />
      </View>
      <View style={styles.players}>
        {players.map((player) => (
          <View key={player.playerId} style={styles.playerCard}>
            <Avatar uri={player.avatarUrl} name={player.displayName} size={56} />
            <Text style={styles.playerName}>{player.displayName}</Text>
            {player.isHost ? <Text style={styles.playerMeta}>HOST</Text> : null}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    borderRadius: radii.lg,
    padding: 18,
    backgroundColor: 'rgba(18, 8, 4, 0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(205, 167, 125, 0.52)',
  },
  title: {
    color: '#fff1d9',
    fontFamily: fonts.titleHeavy,
    fontSize: 20,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  progressTrack: {
    height: 10,
    borderRadius: radii.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(242, 215, 182, 0.12)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e6b870',
  },
  players: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  playerCard: {
    width: 86,
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    color: '#f8ebd6',
    fontFamily: fonts.title,
    fontSize: 11,
    textAlign: 'center',
  },
  playerMeta: {
    color: '#e6b870',
    fontFamily: fonts.titleHeavy,
    fontSize: 10,
    letterSpacing: 1,
  },
})
