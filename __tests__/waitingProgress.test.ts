import { buildWaitingProgress } from '../src/lib/waitingProgress'
import type { RoomPlayer } from '../src/types/game'

function makePlayer(player_id: string, display_name: string): RoomPlayer {
  return {
    id: `${player_id}-room`,
    room_id: 'room-1',
    player_id,
    display_name,
    joined_at: '2026-04-02T10:00:00.000Z',
    is_active: true,
    is_host: false,
    is_ready: true,
    score: 0,
    intuition_tokens: 0,
    wildcards_remaining: 0,
    generation_tokens: 0,
    challenge_leader_used: false,
    corrupted_cards_remaining: 0,
    profiles: null,
  }
}

describe('buildWaitingProgress', () => {
  test('marks submitted players and points to the next pending player in order', () => {
    const result = buildWaitingProgress(
      [
        makePlayer('p1', 'Ana'),
        makePlayer('p2', 'Luis'),
        makePlayer('p3', 'Marta'),
      ],
      ['p1'],
    )

    expect(result.currentTargetName).toBe('Luis')
    expect(result.orderedPlayers.map((player) => ({
      id: player.playerId,
      submitted: player.submitted,
      current: player.isCurrentTarget,
    }))).toEqual([
      { id: 'p1', submitted: true, current: false },
      { id: 'p2', submitted: false, current: true },
      { id: 'p3', submitted: false, current: false },
    ])
    expect(result.displayPlayers.map((player) => player.playerId)).toEqual(['p1', 'p2', 'p3'])
  })

  test('returns no current target once everyone already submitted', () => {
    const result = buildWaitingProgress(
      [
        makePlayer('p1', 'Ana'),
        makePlayer('p2', 'Luis'),
      ],
      ['p1', 'p2'],
    )

    expect(result.currentTargetName).toBeNull()
    expect(result.orderedPlayers.every((player) => player.submitted)).toBe(true)
  })

  test('moves completed players first, then current target, then pending players for display', () => {
    const result = buildWaitingProgress(
      [
        makePlayer('p1', 'Ana'),
        makePlayer('p2', 'Luis'),
        makePlayer('p3', 'Marta'),
        makePlayer('p4', 'Pablo'),
      ],
      ['p1', 'p4'],
    )

    expect(result.displayPlayers.map((player) => player.playerId)).toEqual(['p1', 'p4', 'p2', 'p3'])
  })
})
