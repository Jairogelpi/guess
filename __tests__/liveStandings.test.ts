import { buildLiveStandingsEntries } from '../src/lib/liveStandings'
import type { RoomPlayer } from '../src/types/game'

function makePlayer(
  player_id: string,
  display_name: string,
  score: number,
): RoomPlayer {
  return {
    id: `${player_id}-row`,
    room_id: 'room-1',
    player_id,
    display_name,
    score,
    is_active: true,
    is_host: false,
    is_ready: true,
    joined_at: '2026-03-27T00:00:00.000Z',
    intuition_tokens: 2,
    wildcards_remaining: 0,
    generation_tokens: 0,
    challenge_leader_used: false,
    corrupted_cards_remaining: 2,
    profiles: null,
  }
}

describe('buildLiveStandingsEntries', () => {
  test('sorts by score descending, keeps incoming order for ties, and tags leader/current user', () => {
    const players = [
      makePlayer('p2', 'Bea', 14),
      makePlayer('p1', 'Ana', 18),
      makePlayer('p3', 'Ciro', 14),
    ]

    expect(buildLiveStandingsEntries(players, 'p3')).toEqual([
      expect.objectContaining({ playerId: 'p1', position: 1, score: 18, isLeader: true, isCurrentUser: false }),
      expect.objectContaining({ playerId: 'p2', position: 2, score: 14, isLeader: false, isCurrentUser: false }),
      expect.objectContaining({ playerId: 'p3', position: 3, score: 14, isLeader: false, isCurrentUser: true }),
    ])
  })
})
