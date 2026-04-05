import type { RoomPlayer } from '../src/types/game'
import { getPlayerDepartureNotice } from '../src/lib/playerDepartureNotice'

function makePlayer(player_id: string, display_name: string): RoomPlayer {
  return {
    id: `${player_id}-row`,
    room_id: 'room-1',
    player_id,
    display_name,
    is_active: true,
    is_host: false,
    is_ready: true,
    joined_at: '2026-04-02T00:00:00.000Z',
    score: 0,
    wildcards_remaining: 3,
    generation_tokens: 3,
    intuition_tokens: 0,
    challenge_leader_used: false,
    corrupted_cards_remaining: 0,
  }
}

describe('getPlayerDepartureNotice', () => {
  const t = (key: string, params?: Record<string, unknown>) => {
    if (key === 'game.playerLeftNotice') {
      return `${params?.name} left the match`
    }
    if (key === 'game.playersLeftNotice') {
      return `${params?.names} left the match`
    }
    return key
  }

  test('returns a notice when one other player disappears', () => {
    const previous = [makePlayer('me', 'Jairo'), makePlayer('p2', 'Luna'), makePlayer('p3', 'Nico')]
    const current = [makePlayer('me', 'Jairo'), makePlayer('p3', 'Nico')]

    expect(getPlayerDepartureNotice(previous, current, 'me', t)).toBe('Luna left the match')
  })

  test('returns a grouped notice when multiple other players disappear at once', () => {
    const previous = [makePlayer('me', 'Jairo'), makePlayer('p2', 'Luna'), makePlayer('p3', 'Nico')]
    const current = [makePlayer('me', 'Jairo')]

    expect(getPlayerDepartureNotice(previous, current, 'me', t)).toBe('Luna, Nico left the match')
  })

  test('ignores the local player leaving and no-op refreshes', () => {
    const previous = [makePlayer('me', 'Jairo'), makePlayer('p2', 'Luna')]
    const current = [makePlayer('p2', 'Luna')]

    expect(getPlayerDepartureNotice(previous, current, 'me', t)).toBeNull()
    expect(getPlayerDepartureNotice(previous, previous, 'me', t)).toBeNull()
  })
})
