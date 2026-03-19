import {
  firmReadSucceeded,
  getEligibleVoterCount,
  normalizeRoundPlayers,
  subtleBetSucceeded,
  trapCardSucceeded,
} from './tacticalRules.ts'

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
  const rosterSet = new Set(players)
  const roundPlayers =
    activePlayers && activePlayers.length > 0
      ? Array.from(
          new Set(
            activePlayers.filter((playerId) => playerId === narratorId || rosterSet.has(playerId)),
          ),
        )
      : normalizeRoundPlayers(players, narratorId, playedCards, votes)
  const roundPlayerSet = new Set(
    roundPlayers.includes(narratorId) ? roundPlayers : [narratorId, ...roundPlayers],
  )
  const roundVotes = votes.filter((vote) => roundPlayerSet.has(vote.voter_id))
  const roundPlayedCards = playedCards.filter((card) => roundPlayerSet.has(card.player_id))
  const nonNarrators = roundPlayers.filter((p) => p !== narratorId)
  const narratorCard = roundPlayedCards.find((c) => c.player_id === narratorId)
  if (!narratorCard) return []

  const correctVoters = roundVotes
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
    roundPlayedCards
      .filter((c) => c.player_id !== narratorId)
      .map((c) => [c.id, c.player_id]),
  )
  for (const vote of roundVotes) {
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

  for (const playedCard of roundPlayedCards) {
    if (playedCard.player_id === narratorId || playedCard.tactical_action !== 'trap_card') {
      continue
    }

    const wrongVotes = roundVotes.filter(
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

  for (const vote of roundVotes) {
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
