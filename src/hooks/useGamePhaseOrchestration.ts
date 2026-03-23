import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/useGameStore'
import type { RoomPlayer, RoundStatus } from '@/types/game'

interface Params {
  userId: string
  players: RoomPlayer[]
  hostId: string
  maxRounds: number
}

interface GamePhaseOrchestration {
  isNarrator: boolean
  isHost: boolean
  isLastRound: boolean
  status: RoundStatus
  narratorName: string
  narratorAvatar: string | undefined
  nonNarratorPlayers: RoomPlayer[]
  submittedPlayerIds: string[]
  phaseLabels: Record<RoundStatus, string>
  stepCurrent: number | undefined
  stepTotal: number | undefined
}

/**
 * Derives all phase-level state needed by GameScreen from room + round data.
 * Reads round, cards, and narratorStep from the store; takes room/user data as params.
 */
export function useGamePhaseOrchestration({
  userId,
  players,
  hostId,
  maxRounds,
}: Params): GamePhaseOrchestration {
  const { t } = useTranslation()
  const round = useGameStore((s) => s.round)
  const cards = useGameStore((s) => s.cards)
  const narratorStep = useGameStore((s) => s.narratorStep)

  const narratorId = round?.narrator_id ?? ''
  const isNarrator = narratorId === userId
  const isHost = hostId === userId
  const isLastRound = (round?.round_number ?? 0) === maxRounds
  // Cast to RoundStatus — the DB schema types status as string but we control its values
  const status = (round?.status ?? 'narrator_turn') as RoundStatus

  const narratorPlayer = useMemo(
    () => players.find((p) => p.player_id === narratorId),
    [players, narratorId],
  )
  const narratorName = narratorPlayer?.display_name ?? t('game.narrator')
  // RoomPlayer has no avatar_url — pass undefined; WaitingCard/phases show initials fallback
  const narratorAvatar: string | undefined = undefined

  const nonNarratorPlayers = useMemo(
    () => players.filter((p) => p.player_id !== narratorId),
    [players, narratorId],
  )

  // Phase labels for ContextStrip — Record<RoundStatus> ensures all statuses are covered
  const phaseLabels: Record<RoundStatus, string> = {
    narrator_turn: t('game.phaseNarrator'),
    players_turn: t('game.phaseChoose'),
    voting: t('game.phaseVote'),
    results: t('game.phaseResults'),
  }

  // Submitted player IDs (derived from cards store — live via Realtime)
  const submittedPlayerIds = useMemo(
    () => cards
      .filter((c) => c.player_id !== null && c.player_id !== narratorId)
      .map((c) => c.player_id as string),
    [cards, narratorId],
  )

  // ContextStrip step pill: shown only for narrator during narrator_turn
  const showStep = status === 'narrator_turn' && isNarrator
  const stepCurrent = showStep ? narratorStep : undefined
  const stepTotal = showStep ? 2 : undefined

  return {
    isNarrator,
    isHost,
    isLastRound,
    status,
    narratorName,
    narratorAvatar,
    nonNarratorPlayers,
    submittedPlayerIds,
    phaseLabels,
    stepCurrent,
    stepTotal,
  }
}
