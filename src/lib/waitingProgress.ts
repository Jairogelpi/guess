import type { RoomPlayer } from '@/types/game'

export interface WaitingProgressPlayer {
  playerId: string
  displayName: string
  avatarUrl?: string
  submitted: boolean
  isCurrentTarget: boolean
}

export interface WaitingProgressSummary {
  orderedPlayers: WaitingProgressPlayer[]
  displayPlayers: WaitingProgressPlayer[]
  currentTargetName: string | null
}

export function buildWaitingProgress(
  players: RoomPlayer[],
  submittedPlayerIds: string[],
): WaitingProgressSummary {
  const submittedSet = new Set(submittedPlayerIds)
  let currentTargetName: string | null = null

  const orderedPlayers = players.map((player) => {
    const submitted = submittedSet.has(player.player_id)
    const isCurrentTarget = !submitted && currentTargetName === null

    if (isCurrentTarget) {
      currentTargetName = player.display_name
    }

    return {
      playerId: player.player_id,
      displayName: player.display_name,
      avatarUrl: player.profiles?.avatar_url ?? undefined,
      submitted,
      isCurrentTarget,
    }
  })

  return {
    orderedPlayers,
    displayPlayers: [...orderedPlayers].sort((left, right) => {
      const leftRank = left.submitted ? 0 : left.isCurrentTarget ? 1 : 2
      const rightRank = right.submitted ? 0 : right.isCurrentTarget ? 1 : 2
      return leftRank - rightRank
    }),
    currentTargetName,
  }
}
