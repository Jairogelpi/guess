import {
  firmReadSucceeded,
  getEligibleVoterCount,
  inferRoundPlayers,
  subtleBetSucceeded,
  trapCardSucceeded,
} from './tacticalRules'

interface Vote {
  voter_id: string
  card_id: string
  tactical_action?: 'firm_read' | null
}

interface PlayedCard {
  id: string
  player_id: string
  tactical_action?: 'subtle_bet' | 'trap_card' | null
}

export interface ScoreEntry {
  player_id: string
  points: number
  reason: string
}

interface ScoreInput {
  narratorId: string
  players: string[] // room player_ids including narrator
  activePlayers?: string[]
  votes: Vote[]
  playedCards: PlayedCard[]
}

export function calculateScores({
  narratorId,
  players,
  activePlayers,
  votes,
  playedCards,
}: ScoreInput): ScoreEntry[] {
  const roundPlayers =
    activePlayers && activePlayers.length > 0
      ? activePlayers
      : inferRoundPlayers(narratorId, playedCards, votes)
  const nonNarrators = roundPlayers.filter((p) => p !== narratorId)
  const narratorCard = playedCards.find((c) => c.player_id === narratorId)
  if (!narratorCard) return []

  const correctVoters = votes
    .filter((v) => v.card_id === narratorCard.id)
    .map((v) => v.voter_id)

  const allCorrect = correctVoters.length === nonNarrators.length
  const noneCorrect = correctVoters.length === 0
  const narratorFails = allCorrect || noneCorrect

  const entries: ScoreEntry[] = []

  // Narrator
  entries.push({
    player_id: narratorId,
    points: narratorFails ? 0 : 3,
    reason: narratorFails ? 'narrator_fail' : 'narrator_success',
  })

  // Non-narrators: correct vote or consolation
  for (const pid of nonNarrators) {
    if (narratorFails) {
      entries.push({ player_id: pid, points: 2, reason: 'consolation_bonus' })
    } else if (correctVoters.includes(pid)) {
      entries.push({ player_id: pid, points: 3, reason: 'correct_vote' })
    }
  }

  // Received votes (non-narrator cards only, cannot vote for your own card)
  const cardToPlayer = new Map(
    playedCards
      .filter((c) => c.player_id !== narratorId)
      .map((c) => [c.id, c.player_id]),
  )
  for (const vote of votes) {
    const owner = cardToPlayer.get(vote.card_id)
    if (owner && owner !== vote.voter_id) {
      entries.push({ player_id: owner, points: 1, reason: 'received_vote' })
    }
  }

  const eligibleVoters = getEligibleVoterCount(roundPlayers, narratorId)

  if (
    narratorCard.tactical_action === 'subtle_bet' &&
    subtleBetSucceeded(correctVoters.length, eligibleVoters)
  ) {
    entries.push({
      player_id: narratorId,
      points: 1,
      reason: 'balanced_clue_bonus',
    })
  }

  for (const playedCard of playedCards) {
    if (playedCard.player_id === narratorId || playedCard.tactical_action !== 'trap_card') {
      continue
    }

    const wrongVotes = votes.filter(
      (vote) => vote.card_id === playedCard.id && vote.voter_id !== playedCard.player_id,
    ).length
    if (trapCardSucceeded(wrongVotes)) {
      entries.push({
        player_id: playedCard.player_id,
        points: 1,
        reason: 'trap_card_bonus',
      })
    }
  }

  for (const vote of votes) {
    if (
      vote.tactical_action === 'firm_read' &&
      firmReadSucceeded(vote.card_id === narratorCard.id, correctVoters.length, eligibleVoters)
    ) {
      entries.push({
        player_id: vote.voter_id,
        points: 1,
        reason: 'firm_read_bonus',
      })
    }
  }

  return entries
}
