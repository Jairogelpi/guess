import type { RoomPlayer } from '../src/types/game'
import {
  getBlockingLobbyPlayers,
  getLobbyHydrationPhase,
  getLobbyStartState,
  getReadyGuestCount,
  getPlayersNeededToStart,
  getVisibleLobbyPlayers,
} from '../src/lib/lobbyState'

function createPlayer(overrides: Partial<RoomPlayer> = {}): RoomPlayer {
  return {
    challenge_leader_used: false,
    display_name: 'Player',
    id: 'row-1',
    intuition_tokens: 0,
    is_active: true,
    is_host: false,
    is_ready: false,
    joined_at: '2026-03-19T10:00:00.000Z',
    player_id: 'player-1',
    room_id: 'room-1',
    score: 0,
    wildcards_remaining: 0,
    ...overrides,
  }
}

describe('getVisibleLobbyPlayers', () => {
  test('returns only active players', () => {
    const players = [
      createPlayer({ id: 'host', player_id: 'host', display_name: 'Host', is_host: true }),
      createPlayer({
        id: 'inactive',
        player_id: 'inactive',
        display_name: 'Inactive',
        is_active: false,
        joined_at: '2026-03-19T10:01:00.000Z',
      }),
      createPlayer({
        id: 'guest',
        player_id: 'guest',
        display_name: 'Guest',
        joined_at: '2026-03-19T10:02:00.000Z',
      }),
    ]

    expect(getVisibleLobbyPlayers(players).map((player) => player.id)).toEqual(['host', 'guest'])
  })

  test('sorts the host first, then remaining active players by joined_at', () => {
    const players = [
      createPlayer({
        id: 'late-guest',
        player_id: 'late-guest',
        display_name: 'Late Guest',
        joined_at: '2026-03-19T10:03:00.000Z',
      }),
      createPlayer({
        id: 'host',
        player_id: 'host',
        display_name: 'Host',
        is_host: true,
        joined_at: '2026-03-19T10:05:00.000Z',
      }),
      createPlayer({
        id: 'early-guest',
        player_id: 'early-guest',
        display_name: 'Early Guest',
        joined_at: '2026-03-19T10:01:00.000Z',
      }),
      createPlayer({
        id: 'middle-guest',
        player_id: 'middle-guest',
        display_name: 'Middle Guest',
        joined_at: '2026-03-19T10:02:00.000Z',
      }),
    ]

    expect(getVisibleLobbyPlayers(players).map((player) => player.id)).toEqual([
      'host',
      'early-guest',
      'middle-guest',
      'late-guest',
    ])
  })
})

describe('getPlayersNeededToStart', () => {
  test('returns how many active players are still needed to reach the minimum', () => {
    expect(getPlayersNeededToStart(1)).toBe(2)
    expect(getPlayersNeededToStart(2)).toBe(1)
    expect(getPlayersNeededToStart(3)).toBe(0)
    expect(getPlayersNeededToStart(5)).toBe(0)
  })
})

describe('getLobbyStartState', () => {
  test('returns host preparation while the host player list is still hydrating', () => {
    expect(
      getLobbyStartState({
        isHost: true,
        activeCount: 1,
        hydratingPlayers: true,
        allGuestsReady: false,
      }),
    ).toBe('host_preparation')
  })

  test('returns host waiting for more players when the lobby is hydrated but not ready', () => {
    expect(
      getLobbyStartState({
        isHost: true,
        activeCount: 2,
        hydratingPlayers: false,
        allGuestsReady: false,
      }),
    ).toBe('host_waiting_for_more_players')
  })

  test('returns host ready once the minimum active player count is reached', () => {
    expect(
      getLobbyStartState({
        isHost: true,
        activeCount: 3,
        hydratingPlayers: false,
        allGuestsReady: true,
      }),
    ).toBe('host_ready')
  })

  test('returns host waiting for ready players when guests are still not ready', () => {
    expect(
      getLobbyStartState({
        isHost: true,
        activeCount: 3,
        hydratingPlayers: false,
        allGuestsReady: false,
      }),
    ).toBe('host_waiting_for_ready_players')
  })

  test('returns guest waiting for guests regardless of readiness', () => {
    expect(
      getLobbyStartState({
        isHost: false,
        activeCount: 4,
        hydratingPlayers: false,
        allGuestsReady: false,
      }),
    ).toBe('guest_waiting')
  })
})

describe('readiness helpers', () => {
  test('counts only active ready guests', () => {
    const players = [
      createPlayer({ id: 'host', player_id: 'host', is_host: true, is_ready: false }),
      createPlayer({ id: 'ready-guest', player_id: 'ready-guest', is_ready: true }),
      createPlayer({ id: 'waiting-guest', player_id: 'waiting-guest', is_ready: false }),
      createPlayer({
        id: 'inactive-ready',
        player_id: 'inactive-ready',
        is_ready: true,
        is_active: false,
      }),
    ]

    expect(getReadyGuestCount(players)).toBe(1)
  })

  test('returns active non-host players that still block the start condition', () => {
    const players = [
      createPlayer({ id: 'host', player_id: 'host', display_name: 'Host', is_host: true }),
      createPlayer({
        id: 'guest-1',
        player_id: 'guest-1',
        display_name: 'Jairo 2',
        is_ready: false,
      }),
      createPlayer({
        id: 'guest-2',
        player_id: 'guest-2',
        display_name: 'Jairo 3',
        is_ready: true,
      }),
      createPlayer({
        id: 'inactive-guest',
        player_id: 'inactive-guest',
        display_name: 'Offline',
        is_active: false,
        is_ready: false,
      }),
    ]

    expect(getBlockingLobbyPlayers(players).map((player) => player.display_name)).toEqual(['Jairo 2'])
  })
})

describe('getLobbyHydrationPhase', () => {
  test('returns room-unresolved before the room is known', () => {
    expect(
      getLobbyHydrationPhase({
        roomResolved: false,
        hydratingPlayers: true,
        roomNotFound: false,
        roomLoadFailed: false,
      }),
    ).toBe('room-unresolved')
  })

  test('returns room-not-found before generic failures', () => {
    expect(
      getLobbyHydrationPhase({
        roomResolved: false,
        hydratingPlayers: true,
        roomNotFound: true,
        roomLoadFailed: false,
      }),
    ).toBe('room-not-found')
  })

  test('returns room-load-failed for non-not-found room errors', () => {
    expect(
      getLobbyHydrationPhase({
        roomResolved: false,
        hydratingPlayers: true,
        roomNotFound: false,
        roomLoadFailed: true,
      }),
    ).toBe('room-load-failed')
  })

  test('returns players-hydrating once the room exists but players are still loading', () => {
    expect(
      getLobbyHydrationPhase({
        roomResolved: true,
        hydratingPlayers: true,
        roomNotFound: false,
        roomLoadFailed: false,
      }),
    ).toBe('players-hydrating')
  })

  test('returns ready once the room and roster are available', () => {
    expect(
      getLobbyHydrationPhase({
        roomResolved: true,
        hydratingPlayers: false,
        roomNotFound: false,
        roomLoadFailed: false,
      }),
    ).toBe('ready')
  })
})
