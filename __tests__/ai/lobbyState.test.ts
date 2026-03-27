import {
  getVisibleLobbyPlayers,
  getLobbyStartState,
  getPlayersNeededToStart,
  getLobbyHydrationPhase,
} from '../../src/lib/lobbyState'
import type { RoomPlayer } from '../../src/types/game'

const players: RoomPlayer[] = [
  {
    id: '2',
    player_id: 'p2',
    display_name: 'Invitado',
    is_host: false,
    is_active: true,
    is_ready: false,
    joined_at: '2026-03-19T10:02:00Z',
    room_id: 'r1',
    score: 0,
    challenge_leader_used: false,
    intuition_tokens: 0,
    wildcards_remaining: 3,
    generation_tokens: 0,
    corrupted_cards_remaining: 0,
  },
  {
    id: '1',
    player_id: 'p1',
    display_name: 'Host',
    is_host: true,
    is_active: true,
    is_ready: false,
    joined_at: '2026-03-19T10:01:00Z',
    room_id: 'r1',
    score: 0,
    challenge_leader_used: false,
    intuition_tokens: 0,
    wildcards_remaining: 3,
    generation_tokens: 0,
    corrupted_cards_remaining: 0,
  },
  {
    id: '3',
    player_id: 'p3',
    display_name: 'Ausente',
    is_host: false,
    is_active: false,
    is_ready: false,
    joined_at: '2026-03-19T10:03:00Z',
    room_id: 'r1',
    score: 0,
    challenge_leader_used: false,
    intuition_tokens: 0,
    wildcards_remaining: 3,
    generation_tokens: 0,
    corrupted_cards_remaining: 0,
  },
]

describe('getVisibleLobbyPlayers', () => {
  it('returns only active players', () => {
    const result = getVisibleLobbyPlayers(players)
    expect(result.every((p) => p.is_active)).toBe(true)
    expect(result).toHaveLength(2)
  })

  it('sorts host first, then by joined_at', () => {
    const result = getVisibleLobbyPlayers(players)
    expect(result[0]!.is_host).toBe(true)
    expect(result[0]!.display_name).toBe('Host')
    expect(result[1]!.display_name).toBe('Invitado')
  })
})

describe('getLobbyStartState', () => {
  it('returns host-preparation when players are hydrating', () => {
    const state = getLobbyStartState({ isHost: true, activeCount: 1, hydratingPlayers: true, allGuestsReady: false })
    expect(state).toBe('host_preparation')
  })

  it('returns host-waiting when host is alone (needs more players)', () => {
    const state = getLobbyStartState({ isHost: true, activeCount: 1, hydratingPlayers: false, allGuestsReady: false })
    expect(state).toBe('host_waiting_for_more_players')
  })

  it('returns host-waiting when host has 2 players (needs 1 more)', () => {
    const state = getLobbyStartState({ isHost: true, activeCount: 2, hydratingPlayers: false, allGuestsReady: false })
    expect(state).toBe('host_waiting_for_more_players')
  })

  it('returns host-ready when host has 3+ active players', () => {
    const state = getLobbyStartState({ isHost: true, activeCount: 3, hydratingPlayers: false, allGuestsReady: true })
    expect(state).toBe('host_ready')
  })

  it('returns host-ready when host has more than 3 active players', () => {
    const state = getLobbyStartState({ isHost: true, activeCount: 5, hydratingPlayers: false, allGuestsReady: true })
    expect(state).toBe('host_ready')
  })

  it('returns guest-waiting for non-host players', () => {
    const state = getLobbyStartState({ isHost: false, activeCount: 3, hydratingPlayers: false, allGuestsReady: true })
    expect(state).toBe('guest_waiting')
  })
})

describe('getLobbyHydrationPhase', () => {
  it('returns room-unresolved when room is null', () => {
    expect(getLobbyHydrationPhase({ roomResolved: false, hydratingPlayers: false, roomNotFound: false, roomLoadFailed: false })).toBe('room-unresolved')
  })

  it('returns room-not-found when room not found', () => {
    expect(getLobbyHydrationPhase({ roomResolved: false, hydratingPlayers: false, roomNotFound: true, roomLoadFailed: false })).toBe('room-not-found')
  })

  it('returns room-load-failed on generic failure', () => {
    expect(getLobbyHydrationPhase({ roomResolved: false, hydratingPlayers: false, roomNotFound: false, roomLoadFailed: true })).toBe('room-load-failed')
  })

  it('returns players-hydrating when room is resolved but players are loading', () => {
    expect(getLobbyHydrationPhase({ roomResolved: true, hydratingPlayers: true, roomNotFound: false, roomLoadFailed: false })).toBe('players-hydrating')
  })

  it('returns players-hydrated when room is resolved and players are loaded', () => {
    expect(getLobbyHydrationPhase({ roomResolved: true, hydratingPlayers: false, roomNotFound: false, roomLoadFailed: false })).toBe('ready')
  })
})

describe('getPlayersNeededToStart', () => {
  it('returns 2 when only 1 player', () => {
    expect(getPlayersNeededToStart(1)).toBe(2)
  })

  it('returns 1 when 2 players', () => {
    expect(getPlayersNeededToStart(2)).toBe(1)
  })

  it('returns 0 when 3+ players', () => {
    expect(getPlayersNeededToStart(3)).toBe(0)
    expect(getPlayersNeededToStart(8)).toBe(0)
  })
})
