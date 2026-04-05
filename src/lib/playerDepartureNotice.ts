import type { RoomPlayer } from '@/types/game'

export function getPlayerDepartureNotice(
  previousPlayers: RoomPlayer[],
  currentPlayers: RoomPlayer[],
  currentUserId: string,
  t: (key: string, params?: Record<string, unknown>) => string,
): string | null {
  const currentIds = new Set(currentPlayers.map((player) => player.player_id))
  const departed = previousPlayers.filter(
    (player) => player.player_id !== currentUserId && !currentIds.has(player.player_id),
  )

  if (departed.length === 0) return null

  if (departed.length === 1) {
    return t('game.playerLeftNotice', { name: departed[0]?.display_name ?? '' })
  }

  return t('game.playersLeftNotice', {
    names: departed.map((player) => player.display_name).join(', '),
  })
}
