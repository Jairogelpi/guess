import type { ScoreEntry } from './scoring'
import { getEligibleVoterCount, inferRoundPlayers, normalizeRoundPlayers } from './tacticalRules.ts'

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
  players?: string[]
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

interface NormalizedRoundResolutionInput extends RoundResolutionSummaryInput {
  roundPlayers: string[]
}

const TACTICAL_REASON_BY_ACTION = {
  subtle_bet: 'balanced_clue_bonus',
  trap_card: 'trap_card_bonus',
  firm_read: 'firm_read_bonus',
  challenge_leader: 'leader_challenge_bonus',
} as const

function normalizeRoundResolutionInput(
  input: RoundResolutionSummaryInput,
): NormalizedRoundResolutionInput {
  const roundPlayers =
    input.players && input.players.length > 0
      ? normalizeRoundPlayers(input.players, input.narratorId, input.playedCards, input.votes)
      : inferRoundPlayers(input.narratorId, input.playedCards, input.votes)
  const roundPlayerSet = new Set(
    roundPlayers.includes(input.narratorId)
      ? roundPlayers
      : [input.narratorId, ...roundPlayers],
  )

  return {
    ...input,
    roundPlayers,
    votes: input.votes.filter((vote) => roundPlayerSet.has(vote.voter_id)),
    playedCards: input.playedCards.filter((card) => roundPlayerSet.has(card.player_id)),
  }
}

function buildDeceptionEvents(input: NormalizedRoundResolutionInput) {
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

function getScorePoints(
  scoreEntries: ScoreEntry[],
  playerId: string,
  reason: ScoreEntry['reason'],
) {
  return scoreEntries
    .filter((entry) => entry.player_id === playerId && entry.reason === reason)
    .reduce((total, entry) => total + entry.points, 0)
}

function getIntuitionDelta(type: TacticalEventType, success: boolean) {
  if (!success) return 0
  return type === 'challenge_leader' ? 0 : 1
}

function formatTrapCardDescription(fooledCount: number) {
  return `Trap card fooled ${fooledCount} ${fooledCount === 1 ? 'player' : 'players'}`
}

function formatFirmReadDescription(isCorrectVote: boolean, hardRound: boolean) {
  if (isCorrectVote && hardRound) {
    return 'Firm Read found the narrator in a hard round'
  }

  if (isCorrectVote) {
    return 'Firm Read found the narrator, but the round was not hard enough'
  }

  if (hardRound) {
    return 'Firm Read missed the narrator in a hard round'
  }

  return 'Firm Read missed the narrator'
}

function buildTacticalEvents(
  input: NormalizedRoundResolutionInput,
  deceptionEvents: RoundResolutionSummary['deceptionEvents'],
) {
  const eligibleVoters = getEligibleVoterCount(input.roundPlayers, input.narratorId)
  const correctVoteCount = input.votes.filter((vote) => vote.card_id === input.narratorCardId).length
  const hardRound = eligibleVoters > 0 && correctVoteCount < Math.ceil(eligibleVoters / 2)

  const buildEvent = (playerId: string, type: TacticalEventType, description: string) => {
    const reason = TACTICAL_REASON_BY_ACTION[type]
    const pointsDelta = getScorePoints(input.scoreEntries, playerId, reason)
    const success = pointsDelta > 0

    return {
      playerId,
      type,
      success,
      pointsDelta,
      intuitionDelta: getIntuitionDelta(type, success),
      description,
    }
  }

  const cardEvents = input.playedCards.flatMap((card) => {
    if (!card.tactical_action) {
      return []
    }

    if (card.tactical_action === 'subtle_bet') {
      const pointsDelta = getScorePoints(
        input.scoreEntries,
        card.player_id,
        TACTICAL_REASON_BY_ACTION.subtle_bet,
      )

      return [
        buildEvent(
          card.player_id,
          card.tactical_action,
          pointsDelta > 0
            ? 'Subtle Bet hit the balanced clue sweet spot'
            : 'Subtle Bet missed the balanced clue sweet spot',
        ),
      ]
    }

    const fooledCount = deceptionEvents.filter(
      (event) => event.sourcePlayerId === card.player_id && event.cardId === card.id,
    ).length
    return [buildEvent(card.player_id, card.tactical_action, formatTrapCardDescription(fooledCount))]
  })

  const voteEvents = input.votes.flatMap((vote) => {
    if (!vote.tactical_action) {
      return []
    }

    const isCorrectVote = vote.card_id === input.narratorCardId
    return [
      buildEvent(
        vote.voter_id,
        vote.tactical_action,
        formatFirmReadDescription(isCorrectVote, hardRound),
      ),
    ]
  })

  const challengePlayers = new Set([
    ...input.playedCards
      .filter((card) => card.challenge_leader)
      .map((card) => card.player_id),
    ...input.votes
      .filter((vote) => vote.challenge_leader)
      .map((vote) => vote.voter_id),
  ])
  const challengeEvents = Array.from(challengePlayers).map((playerId) =>
    buildEvent(
      playerId,
      'challenge_leader',
      getScorePoints(
        input.scoreEntries,
        playerId,
        TACTICAL_REASON_BY_ACTION.challenge_leader,
      ) > 0
        ? 'Challenge the leader succeeded'
        : 'Challenge the leader failed',
    ),
  )

  return [...cardEvents, ...voteEvents, ...challengeEvents]
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
  const normalizedInput = normalizeRoundResolutionInput(input)
  const deceptionEvents = buildDeceptionEvents(normalizedInput)

  return {
    roundId: normalizedInput.roundId,
    narratorId: normalizedInput.narratorId,
    narratorCardId: normalizedInput.narratorCardId,
    clue: normalizedInput.clue,
    correctVoterIds: normalizedInput.votes
      .filter((vote) => vote.card_id === input.narratorCardId)
      .map((vote) => vote.voter_id),
    deceptionEvents,
    tacticalEvents: buildTacticalEvents(normalizedInput, deceptionEvents),
    leaderboardDeltas: buildLeaderboardDeltas(normalizedInput.scoresBefore, normalizedInput.scoresAfter),
  }
}
