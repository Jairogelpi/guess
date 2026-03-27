import type { RoomPlayer } from '@/types/game'

export interface LiveStandingsEntry {
  playerId: string
  displayName: string
  avatarUrl: string | null
  score: number
  position: number
  isLeader: boolean
  isCurrentUser: boolean
}

export function buildLiveStandingsEntries(
  players: RoomPlayer[],
  currentUserId: string | null,
): LiveStandingsEntry[] {
  return players
    .map((player, originalIndex) => ({ player, originalIndex }))
    .sort((left, right) =>
      right.player.score - left.player.score || left.originalIndex - right.originalIndex,
    )
    .map(({ player }, index) => ({
      playerId: player.player_id,
      displayName: player.display_name,
      avatarUrl: player.profiles?.avatar_url ?? null,
      score: player.score,
      position: index + 1,
      isLeader: index === 0,
      isCurrentUser: player.player_id === currentUserId,
    }))
}
