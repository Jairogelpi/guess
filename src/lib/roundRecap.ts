import type { CompetitiveRoundSummary, RoomPlayer } from '@/types/game'

interface RoundMover {
  playerId: string
  displayName: string
  delta: number
}

export function getTopRoundMovers(
  summary: CompetitiveRoundSummary,
  players: RoomPlayer[],
): RoundMover[] {
  const nameByPlayer = Object.fromEntries(players.map((player) => [player.player_id, player.display_name]))

  return [...summary.playerPointDeltas]
    .map((entry) => ({
      playerId: entry.playerId,
      displayName: nameByPlayer[entry.playerId] ?? 'Jugador',
      delta: entry.total,
    }))
    .sort((a, b) => b.delta - a.delta)
}

export function buildRoundRecapHeadline(
  summary: CompetitiveRoundSummary,
  players: RoomPlayer[],
): string {
  const [topMover] = getTopRoundMovers(summary, players)
  if (!topMover) return 'La ronda ha terminado.'
  return `${topMover.displayName} lidera la ronda con ${topMover.delta > 0 ? '+' : ''}${topMover.delta} puntos`
}
