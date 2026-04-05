import {
  derivePlayerCountRange,
  getTargetPlayerCounts,
  isTicketCompatibleWithTargetSize,
  pickHostPlayerId,
} from '../supabase/functions/_shared/matchmaking'

describe('matchmaking helpers', () => {
  it('derives the expected player count ranges from the preferred size', () => {
    expect(derivePlayerCountRange(3)).toEqual({ min: 3, max: 4 })
    expect(derivePlayerCountRange(4)).toEqual({ min: 3, max: 5 })
    expect(derivePlayerCountRange(5)).toEqual({ min: 4, max: 6 })
    expect(derivePlayerCountRange(6)).toEqual({ min: 5, max: 6 })
    expect(() => derivePlayerCountRange(2)).toThrow('Unsupported preferred player count: 2')
  })

  it('orders target counts by exact match and nearest alternatives with lower counts first on ties', () => {
    expect(getTargetPlayerCounts(4, { min: 3, max: 5 })).toEqual([4, 3, 5])
    expect(getTargetPlayerCounts(5, { min: 4, max: 6 })).toEqual([5, 4, 6])
  })

  it('checks ticket compatibility against a target room size', () => {
    expect(
      isTicketCompatibleWithTargetSize(
        { min_player_count: 3, max_player_count: 5 },
        3,
      ),
    ).toBe(true)
    expect(
      isTicketCompatibleWithTargetSize(
        { min_player_count: 3, max_player_count: 5 },
        4,
      ),
    ).toBe(true)
    expect(
      isTicketCompatibleWithTargetSize(
        { min_player_count: 3, max_player_count: 5 },
        5,
      ),
    ).toBe(true)
    expect(
      isTicketCompatibleWithTargetSize(
        { min_player_count: 3, max_player_count: 5 },
        6,
      ),
    ).toBe(false)
  })

  it('returns null when there are no matchmaking tickets to host', () => {
    expect(pickHostPlayerId([])).toBeNull()
  })

  it('rejects malformed created_at timestamps when picking a host', () => {
    expect(() =>
      pickHostPlayerId([
        { player_id: 'bad', created_at: 'not-a-timestamp' },
        { player_id: 'good', created_at: '2026-04-05T10:00:00Z' },
      ]),
    ).toThrow('Invalid matchmaking ticket created_at timestamp: not-a-timestamp')
  })

  it('rejects a malformed created_at timestamp even for a single ticket', () => {
    expect(() => pickHostPlayerId([{ player_id: 'solo-bad', created_at: 'still-not-a-date' }])).toThrow(
      'Invalid matchmaking ticket created_at timestamp: still-not-a-date',
    )
  })

  it('picks the oldest matchmaking ticket as the host', () => {
    expect(
      pickHostPlayerId([
        { player_id: 'later', created_at: '2026-04-05T10:00:01Z' },
        { player_id: 'earlier', created_at: '2026-04-05T09:59:59Z' },
        { player_id: 'middle', created_at: '2026-04-05T10:00:00Z' },
      ]),
    ).toBe('earlier')
  })

  it('breaks created_at ties by player id in ascending order', () => {
    expect(
      pickHostPlayerId([
        { player_id: 'player-b', created_at: '2026-04-05T10:00:00Z' },
        { player_id: 'player-a', created_at: '2026-04-05T10:00:00Z' },
        { player_id: 'player-c', created_at: '2026-04-05T10:00:00Z' },
      ]),
    ).toBe('player-a')
  })
})
