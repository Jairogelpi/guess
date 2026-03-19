import type { ScoreEntry } from './scoring'

type CardTacticalAction = 'subtle_bet' | 'trap_card' | null | undefined
type VoteTacticalAction = 'firm_read' | null | undefined
type TacticalEventType =
  | 'subtle_bet'
  | 'trap_card'
  | 'firm_read'
  | 'challenge_leader'

interface Vote {
  voter_id: string
  card_id: string
  tactical_action?: VoteTacticalAction
  challenge_leader?: boolean
}

interface PlayedCard {
  id: string
  player_id: string
  tactical_action?: CardTacticalAction
  challenge_leader?: boolean
}

export interface RoundResolutionSummaryInput {
  roundId: string
  narratorId: string
  narratorCardId: string
  clue: string | null
  votes: Vote[]
  playedCards: PlayedCard[]
  scoreEntries: ScoreEntry[]
  scoresBefore: Record<string, number>
  scoresAfter: Record<string, number>
}

export interface RoundResolutionSummary {
  roundId: string
  narratorId: string
  narratorCardId: string
  clue: string | null
  correctVoterIds: string[]
  deceptionEvents: Array<{
    sourcePlayerId: string
    fooledPlayerId: string
    cardId: string
    trapCard: boolean
  }>
  tacticalEvents: Array<{
    playerId: string
    type: TacticalEventType
    success: boolean
    pointsDelta: number
    intuitionDelta: number
    description: string
  }>
  leaderboardDeltas: Array<{
    playerId: string
    scoreBefore: number
    scoreAfter: number
    positionBefore: number
    positionAfter: number
  }>
}

const TACTICAL_REASON_BY_ACTION = {
  subtle_bet: 'balanced_clue_bonus',
  trap_card: 'trap_card_bonus',
  firm_read: 'firm_read_bonus',
  challenge_leader: 'leader_challenge_bonus',
} as const

function buildDeceptionEvents(input: RoundResolutionSummaryInput) {
  const cardsById = new Map(input.playedCards.map((card) => [card.id, card]))

  return input.votes.flatMap((vote) => {
    if (vote.card_id === input.narratorCardId) {
      return []
    }

    const card = cardsById.get(vote.card_id)
    if (!card || card.player_id === input.narratorId || card.player_id === vote.voter_id) {
      return []
    }

    return [
      {
        sourcePlayerId: card.player_id,
        fooledPlayerId: vote.voter_id,
        cardId: vote.card_id,
        trapCard: card.tactical_action === 'trap_card',
      },
    ]
  })
}

function buildTacticalEvents(input: RoundResolutionSummaryInput) {
  const buildEvent = (playerId: string, type: TacticalEventType) => {
    const reason = TACTICAL_REASON_BY_ACTION[type]
    const pointsDelta = input.scoreEntries
      .filter((entry) => entry.player_id === playerId && entry.reason === reason)
      .reduce((total, entry) => total + entry.points, 0)

    return {
      playerId,
      type,
      success: pointsDelta > 0,
      pointsDelta,
      intuitionDelta: 0,
      description: pointsDelta > 0 ? `${type} succeeded` : `${type} failed`,
    }
  }

  const cardEvents = input.playedCards.flatMap((card) => {
    if (!card.tactical_action) {
      return []
    }

    return [buildEvent(card.player_id, card.tactical_action)]
  })

  const voteEvents = input.votes.flatMap((vote) => {
    if (!vote.tactical_action) {
      return []
    }

    return [buildEvent(vote.voter_id, vote.tactical_action)]
  })

  return [...cardEvents, ...voteEvents]
}

function buildPositions(scores: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(scores)
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([playerId], index) => [playerId, index + 1]),
  )
}

function buildLeaderboardDeltas(
  scoresBefore: Record<string, number>,
  scoresAfter: Record<string, number>,
) {
  const positionsBefore = buildPositions(scoresBefore)
  const positionsAfter = buildPositions(scoresAfter)
  const playerIds = new Set([
    ...Object.keys(scoresBefore),
    ...Object.keys(scoresAfter),
  ])

  return Array.from(playerIds)
    .sort((left, right) => left.localeCompare(right))
    .map((playerId) => ({
      playerId,
      scoreBefore: scoresBefore[playerId] ?? 0,
      scoreAfter: scoresAfter[playerId] ?? 0,
      positionBefore: positionsBefore[playerId] ?? Object.keys(scoresBefore).length + 1,
      positionAfter: positionsAfter[playerId] ?? Object.keys(scoresAfter).length + 1,
    }))
}

export function buildRoundResolutionSummary(
  input: RoundResolutionSummaryInput,
): RoundResolutionSummary {
  return {
    roundId: input.roundId,
    narratorId: input.narratorId,
    narratorCardId: input.narratorCardId,
    clue: input.clue,
    correctVoterIds: input.votes
      .filter((vote) => vote.card_id === input.narratorCardId)
      .map((vote) => vote.voter_id),
    deceptionEvents: buildDeceptionEvents(input),
    tacticalEvents: buildTacticalEvents(input),
    leaderboardDeltas: buildLeaderboardDeltas(input.scoresBefore, input.scoresAfter),
  }
}
