type MatchmakingRangeLike = {
  min_player_count: number
  max_player_count: number
}

type MatchmakingTicketLike = MatchmakingRangeLike & {
  created_at: string
  player_id: string
}

function parseCreatedAt(createdAt: string): number {
  const parsed = Date.parse(createdAt)

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid matchmaking ticket created_at timestamp: ${createdAt}`)
  }

  return parsed
}

export function derivePlayerCountRange(preferred: number): { min: number; max: number } {
  switch (preferred) {
    case 3:
      return { min: 3, max: 4 }
    case 4:
      return { min: 3, max: 5 }
    case 5:
      return { min: 4, max: 6 }
    case 6:
      return { min: 5, max: 6 }
    default:
      throw new Error(`Unsupported preferred player count: ${preferred}`)
  }
}

export function getTargetPlayerCounts(
  preferred: number,
  range: { min: number; max: number },
): number[] {
  const candidates: number[] = []

  for (let count = range.min; count <= range.max; count += 1) {
    candidates.push(count)
  }

  return candidates.sort((left, right) => {
    const leftDistance = Math.abs(left - preferred)
    const rightDistance = Math.abs(right - preferred)

    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance
    }

    return left - right
  })
}

export function isTicketCompatibleWithTargetSize(
  ticket: MatchmakingRangeLike,
  targetSize: number,
): boolean {
  return targetSize >= ticket.min_player_count && targetSize <= ticket.max_player_count
}

export function pickHostPlayerId(
  tickets: Pick<MatchmakingTicketLike, 'created_at' | 'player_id'>[],
): string | null {
  for (const ticket of tickets) {
    parseCreatedAt(ticket.created_at)
  }

  return [...tickets]
    .sort((left, right) => {
      const createdAtDelta = parseCreatedAt(left.created_at) - parseCreatedAt(right.created_at)

      if (createdAtDelta !== 0) {
        return createdAtDelta
      }

      return left.player_id.localeCompare(right.player_id)
    })[0]?.player_id ?? null
}
