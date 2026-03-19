import type { RoomPlayer } from '@/types/game'

export type LobbyStartState =
  | 'host-preparation'
  | 'host-waiting'
  | 'host-ready'
  | 'guest-waiting'

export interface LobbyStartStateParams {
  isHost: boolean
  activeCount: number
  hydratingPlayers: boolean
}

const MIN_PLAYERS = 3

/** Returns only active players, sorted host-first then by joined_at ascending. */
export function getVisibleLobbyPlayers(players: RoomPlayer[]): RoomPlayer[] {
  return players
    .filter((p) => p.is_active)
    .sort((a, b) => {
      if (a.is_host !== b.is_host) return a.is_host ? -1 : 1
      return a.joined_at < b.joined_at ? -1 : a.joined_at > b.joined_at ? 1 : 0
    })
}

/** Returns the host/guest action state for the lobby screen. */
export function getLobbyStartState({ isHost, activeCount, hydratingPlayers }: LobbyStartStateParams): LobbyStartState {
  if (!isHost) return 'guest-waiting'
  if (hydratingPlayers) return 'host-preparation'
  if (activeCount >= MIN_PLAYERS) return 'host-ready'
  return 'host-waiting'
}

/** Returns how many more players are needed before the host can start. */
export function getPlayersNeededToStart(activeCount: number): number {
  return Math.max(0, MIN_PLAYERS - activeCount)
}

export type LobbyHydrationPhase =
  | 'room-unresolved'
  | 'room-not-found'
  | 'room-load-failed'
  | 'players-hydrating'
  | 'players-hydrated'

export interface LobbyHydrationPhaseParams {
  roomResolved: boolean
  hydratingPlayers: boolean
  roomNotFound: boolean
  roomLoadFailed: boolean
}

/** Returns the current hydration phase for the lobby screen. */
export function getLobbyHydrationPhase({ roomResolved, hydratingPlayers, roomNotFound, roomLoadFailed }: LobbyHydrationPhaseParams): LobbyHydrationPhase {
  if (roomNotFound) return 'room-not-found'
  if (roomLoadFailed) return 'room-load-failed'
  if (!roomResolved) return 'room-unresolved'
  if (hydratingPlayers) return 'players-hydrating'
  return 'players-hydrated'
}
