import type { ScoreEntry } from './scoring'
import type {
  CompetitiveMarketPayoutTier,
  CompetitiveRoundSummary,
  RiskClueProfile,
  VoteBetTokens,
} from '../../../src/types/game'

interface VoteForSummary {
  voter_id: string
  card_id: string
  bet_tokens?: VoteBetTokens | number
  challenge_leader?: boolean
}

interface PlayedCardForSummary {
  id: string
  player_id: string
  risk_clue_profile?: RiskClueProfile | null
  is_corrupted?: boolean
  challenge_leader?: boolean
}

interface TokenSnapshot {
  spent: number
  base: number
  position: number
  interest: number
  total: number
}

export interface RoundResolutionSummaryInput {
  roundId: string
  narratorId: string
  narratorCardId: string
  clue: string | null
  votes: VoteForSummary[]
  playedCards: PlayedCardForSummary[]
  scoreEntries: ScoreEntry[]
  scoresBefore: Record<string, number>
  scoresAfter: Record<string, number>
  tokenSnapshots?: Record<string, TokenSnapshot>
}

function sumScoreEntries(
  scoreEntries: ScoreEntry[],
  playerId: string,
  reasons: Array<ScoreEntry['reason'] | string>,
) {
  return scoreEntries
    .filter((entry) => entry.player_id === playerId && reasons.includes(entry.reason))
    .reduce((total, entry) => total + entry.points, 0)
}

function getTargetCorrectGuessers(profile: RiskClueProfile) {
  switch (profile) {
    case 'sniper':
      return 1
    case 'narrow':
      return 2
    case 'ambush':
      return 0
    default:
      return 0
  }
}

function getMarketPayoutTier(
  correctGuesserCount: number,
  activePlayers: number,
): CompetitiveMarketPayoutTier {
  const eligibleVoters = Math.max(activePlayers - 1, 0)
  if (correctGuesserCount === 0) return 'nobody_correct'
  if (eligibleVoters > 0 && correctGuesserCount === eligibleVoters) return 'everybody_correct'
  if (correctGuesserCount === 1) return 'single_correct'
  if (correctGuesserCount === 2) return 'double_correct'
  return 'crowded_correct'
}

function getBetPotSize(activePlayers: number) {
  if (activePlayers >= 7) return 3
  if (activePlayers >= 5) return 2
  return 1
}

function getUniqueLeaderId(scoresBefore: Record<string, number>) {
  const sorted = Object.entries(scoresBefore).sort((left, right) => right[1] - left[1])
  if (sorted.length === 0) return null
  if (sorted.length > 1 && sorted[0]![1] === sorted[1]![1]) return null
  return sorted[0]![0]
}

export function buildRoundResolutionSummary(
  input: RoundResolutionSummaryInput,
): CompetitiveRoundSummary {
  const correctGuesserIds = input.votes
    .filter((vote) => vote.card_id === input.narratorCardId)
    .map((vote) => vote.voter_id)
  const correctGuesserCount = correctGuesserIds.length
  const activePlayers = new Set([
    input.narratorId,
    ...input.playedCards.map((card) => card.player_id),
    ...input.votes.map((vote) => vote.voter_id),
  ]).size
  const narratorCard = input.playedCards.find((card) => card.id === input.narratorCardId)
  const riskProfile = narratorCard?.risk_clue_profile ?? null
  const leaderId = getUniqueLeaderId(input.scoresBefore) ?? input.narratorId

  const playerPointDeltas = Array.from(
    input.scoreEntries.reduce<Map<string, CompetitiveRoundSummary['playerPointDeltas'][number]>>(
      (acc, entry) => {
        const current = acc.get(entry.player_id) ?? {
          playerId: entry.player_id,
          total: 0,
          breakdown: [],
        }
        current.total += entry.points
        current.breakdown.push({ reason: entry.reason, points: entry.points })
        acc.set(entry.player_id, current)
        return acc
      },
      new Map(),
    ).values(),
  )

  return {
    roundId: input.roundId,
    narratorId: input.narratorId,
    narratorCardId: input.narratorCardId,
    clue: input.clue,
    correctGuesserCount,
    correctGuesserIds,
    marketPayoutTier: getMarketPayoutTier(correctGuesserCount, activePlayers),
    clueRisk: riskProfile
      ? {
          profile: riskProfile,
          targetCorrectGuessers: getTargetCorrectGuessers(riskProfile),
          actualCorrectGuessers: correctGuesserCount,
          outcome:
            correctGuesserCount === getTargetCorrectGuessers(riskProfile)
              ? 'exact'
              : Math.abs(correctGuesserCount - getTargetCorrectGuessers(riskProfile)) === 1
                ? 'near'
                : 'miss',
          pointsDelta: sumScoreEntries(input.scoreEntries, input.narratorId, [
            'clue_risk_bonus',
            'clue_risk_penalty',
          ]),
          tokenCost: riskProfile === 'ambush' ? 1 : 0,
        }
      : null,
    betPot: {
      size: getBetPotSize(activePlayers),
      totalWinningWeight: input.votes
        .filter((vote) => vote.card_id === input.narratorCardId && Number(vote.bet_tokens ?? 0) > 0)
        .reduce((total, vote) => total + Number(vote.bet_tokens ?? 0), 0),
      winners: input.votes
        .filter((vote) => vote.card_id === input.narratorCardId && Number(vote.bet_tokens ?? 0) > 0)
        .map((vote) => ({
          playerId: vote.voter_id,
          stake: Number(vote.bet_tokens ?? 0) as Exclude<VoteBetTokens, 0>,
          weight: Number(vote.bet_tokens ?? 0),
          pointsAwarded: sumScoreEntries(input.scoreEntries, vote.voter_id, ['bet_pot_payout']),
        })),
    },
    corruptionEvents: input.playedCards
      .filter((card) => card.is_corrupted)
      .map((card) => {
        const fooledPlayerIds = input.votes
          .filter((vote) => vote.card_id === card.id && vote.voter_id !== card.player_id)
          .map((vote) => vote.voter_id)
        return {
          playerId: card.player_id,
          cardId: card.id,
          fooledPlayerIds,
          success: fooledPlayerIds.length > 0,
          pointsDelta: sumScoreEntries(input.scoreEntries, card.player_id, ['corrupted_card_bonus']),
          fooledPenaltyTotal: fooledPlayerIds.reduce(
            (total, playerId) =>
              total + sumScoreEntries(input.scoreEntries, playerId, ['corrupted_vote_penalty']),
            0,
          ),
        }
      }),
    challengeLeaderAttempts: [
      ...input.playedCards
        .filter((card) => card.challenge_leader)
        .map((card) => card.player_id),
      ...input.votes.filter((vote) => vote.challenge_leader).map((vote) => vote.voter_id),
    ].map((playerId) => ({
      playerId,
      targetLeaderId: leaderId,
      success: sumScoreEntries(input.scoreEntries, playerId, ['challenge_leader_bonus']) > 0,
      pointsDelta: sumScoreEntries(input.scoreEntries, playerId, ['challenge_leader_bonus']),
      tokenCost: 1,
    })),
    playerPointDeltas,
    playerTokenDeltas: Object.entries(input.tokenSnapshots ?? {}).map(([playerId, snapshot]) => ({
      playerId,
      tacticalCostPaid: snapshot.spent,
      income: {
        base: snapshot.base,
        position: snapshot.position,
        interest: snapshot.interest,
      },
      total: snapshot.total,
    })),
  }
}
