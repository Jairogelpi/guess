import type { ScoreEntry } from './scoring'

const MAX_INTUITION_TOKENS = 10
const BASE_INCOME = 1

interface ScoreBefore {
  player_id: string
  score: number
}

interface VoteForResolution {
  voter_id: string
  card_id: string
  challenge_leader?: boolean | null
}

interface CardForResolution {
  id: string
  player_id: string
  challenge_leader?: boolean | null
}

interface PlayerTokenState {
  player_id: string
  intuition_tokens: number
}

function sumPointsByPlayer(scoreEntries: ScoreEntry[]) {
  return scoreEntries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.player_id] = (acc[entry.player_id] ?? 0) + entry.points
    return acc
  }, {})
}

function getInterest(bank: number) {
  if (bank >= 8) return 2
  if (bank >= 5) return 1
  return 0
}

function getPositionBonuses(scoresAfter: Record<string, number>, playerIds: string[]) {
  const sortedPlayerIds = [...playerIds].sort((left, right) => {
    const scoreDelta = (scoresAfter[right] ?? 0) - (scoresAfter[left] ?? 0)
    if (scoreDelta !== 0) return scoreDelta
    return left.localeCompare(right)
  })

  const maxRankIndex = Math.max(sortedPlayerIds.length - 1, 1)
  const bonuses: Record<string, number> = {}

  for (let index = 0; index < sortedPlayerIds.length; ) {
    const groupScore = scoresAfter[sortedPlayerIds[index]!] ?? 0
    let groupEnd = index + 1
    while (
      groupEnd < sortedPlayerIds.length &&
      (scoresAfter[sortedPlayerIds[groupEnd]!] ?? 0) === groupScore
    ) {
      groupEnd += 1
    }

    const percentile = sortedPlayerIds.length === 1 ? 0 : index / maxRankIndex
    const bonus = percentile <= 0.25 ? 1 : 0

    for (let cursor = index; cursor < groupEnd; cursor += 1) {
      bonuses[sortedPlayerIds[cursor]!] = bonus
    }

    index = groupEnd
  }

  return bonuses
}

export function getSoloLeaderId(scoresBefore: ScoreBefore[]) {
  const sorted = [...scoresBefore].sort((left, right) => right.score - left.score)
  if (sorted.length === 0) return null
  const leader = sorted[0]!
  if (sorted.length > 1 && leader.score === sorted[1]!.score) return null
  return leader.player_id
}

export function applyChallengeLeaderBonuses({
  scoresBefore,
  scoreEntries,
  playedCards,
  votes,
}: {
  scoresBefore: ScoreBefore[]
  scoreEntries: ScoreEntry[]
  playedCards: CardForResolution[]
  votes: VoteForResolution[]
}) {
  const leaderId = getSoloLeaderId(scoresBefore)
  if (!leaderId) return [] as ScoreEntry[]

  const roundTotals = sumPointsByPlayer(scoreEntries)
  const leaderRoundScore = roundTotals[leaderId] ?? 0
  const challengeBonus = scoresBefore.length <= 3 ? 1 : 2
  const challengerIds = new Set<string>([
    ...playedCards
      .filter((card) => card.challenge_leader && card.player_id !== leaderId)
      .map((card) => card.player_id),
    ...votes
      .filter((vote) => vote.challenge_leader && vote.voter_id !== leaderId)
      .map((vote) => vote.voter_id),
  ])

  return Array.from(challengerIds)
    .filter((playerId) => (roundTotals[playerId] ?? 0) >= leaderRoundScore + 2)
    .map<ScoreEntry>((playerId) => ({
      player_id: playerId,
      points: challengeBonus,
      reason: 'challenge_leader_bonus',
    }))
}

export function applyIntuitionChanges({
  playersBefore,
  scoresAfter,
}: {
  playersBefore: PlayerTokenState[]
  scoresAfter: Record<string, number>
}) {
  const playerIds = playersBefore.map((player) => player.player_id)
  const positionBonuses = getPositionBonuses(scoresAfter, playerIds)

  return Object.fromEntries(
    playersBefore.map((player) => {
      const interest = getInterest(player.intuition_tokens)
      const positionBonus = positionBonuses[player.player_id] ?? 1
      const nextValue = Math.max(
        0,
        Math.min(
          MAX_INTUITION_TOKENS,
          player.intuition_tokens + BASE_INCOME + positionBonus + interest,
        ),
      )

      return [player.player_id, nextValue]
    }),
  )
}
