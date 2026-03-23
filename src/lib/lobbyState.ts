import type { RoomPlayer } from '../types/game'

export const MIN_PLAYERS_TO_START = 3

export type LobbyStartState =
  | 'host_preparation'
  | 'host_waiting_for_more_players'
  | 'host_ready'
  | 'guest_waiting'

export type LobbyHydrationPhase =
  | 'room-unresolved'
  | 'room-not-found'
  | 'room-load-failed'
  | 'players-hydrating'
  | 'ready'

interface GetLobbyStartStateOptions {
  isHost: boolean
  activeCount: number
  hydratingPlayers: boolean
}

interface GetLobbyHydrationPhaseOptions {
  roomResolved: boolean
  hydratingPlayers: boolean
  roomNotFound: boolean
  roomLoadFailed: boolean
}

export function getPlayersNeededToStart(activeCount: number): number {
  return Math.max(MIN_PLAYERS_TO_START - activeCount, 0)
}

export function getVisibleLobbyPlayers(players: RoomPlayer[]): RoomPlayer[] {
  return [...players]
    .filter((player) => player.is_active)
    .sort((left, right) => {
      if (left.is_host !== right.is_host) {
        return left.is_host ? -1 : 1
      }

      return left.joined_at.localeCompare(right.joined_at)
    })
}

export function getLobbyStartState({
  isHost,
  activeCount,
  hydratingPlayers,
}: GetLobbyStartStateOptions): LobbyStartState {
  if (!isHost) {
    return 'guest_waiting'
  }

  if (hydratingPlayers) {
    return 'host_preparation'
  }

  if (getPlayersNeededToStart(activeCount) > 0) {
    return 'host_waiting_for_more_players'
  }

  return 'host_ready'
}

export function getLobbyHydrationPhase({
  roomResolved,
  hydratingPlayers,
  roomNotFound,
  roomLoadFailed,
}: GetLobbyHydrationPhaseOptions): LobbyHydrationPhase {
  if (roomNotFound) {
    return 'room-not-found'
  }

  if (roomLoadFailed) {
    return 'room-load-failed'
  }

  if (!roomResolved) {
    return 'room-unresolved'
  }

  if (hydratingPlayers) {
    return 'players-hydrating'
  }

  return 'ready'
}
