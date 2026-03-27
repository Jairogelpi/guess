interface Vote {
  voter_id: string
  card_id: string
  bet_tokens?: number | null
  challenge_leader?: boolean | null
}

interface PlayedCard {
  id: string
  player_id: string
  risk_clue_profile?: 'normal' | 'sniper' | 'narrow' | 'ambush' | null
  is_corrupted?: boolean | null
  challenge_leader?: boolean | null
}

export interface ScoreEntry {
  player_id: string
  points: number
  reason: string
}

interface ScoreInput {
  narratorId: string
  players: string[]
  activePlayers?: string[]
  votes: Vote[]
  playedCards: PlayedCard[]
}

const CLUE_RISK_TARGETS: Record<'sniper' | 'narrow' | 'ambush', number> = {
  sniper: 1,
  narrow: 2,
  ambush: 0,
}

function getMarketCorrectVotePoints(correctVoteCount: number) {
  if (correctVoteCount <= 0) return 0
  if (correctVoteCount === 1) return 4
  if (correctVoteCount === 2) return 3
  return 2
}

function getBetPotSize(playerCount: number) {
  if (playerCount >= 7) return 3
  if (playerCount >= 5) return 2
  return 1
}

function getRoundPlayers({
  players,
  activePlayers,
  narratorId,
  playedCards,
  votes,
}: {
  players: string[]
  activePlayers?: string[]
  narratorId: string
  playedCards: PlayedCard[]
  votes: Vote[]
}) {
  if (activePlayers && activePlayers.length > 0) {
    const playerSet = new Set(players)
    const deduped = Array.from(
      new Set(activePlayers.filter((playerId) => playerId === narratorId || playerSet.has(playerId))),
    )
    return deduped.includes(narratorId) ? deduped : [narratorId, ...deduped]
  }

  const derived = new Set<string>([narratorId, ...players])
  for (const card of playedCards) derived.add(card.player_id)
  for (const vote of votes) derived.add(vote.voter_id)
  return Array.from(derived)
}

function splitIntegerPot(totalPot: number, weights: Array<{ player_id: string; weight: number }>) {
  if (totalPot <= 0 || weights.length === 0) return [] as Array<{ player_id: string; payout: number }>

  const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0)
  if (totalWeight <= 0) return [] as Array<{ player_id: string; payout: number }>

  const provisional = weights.map((entry) => {
    const exact = (totalPot * entry.weight) / totalWeight
    const floor = Math.floor(exact)
    return {
      player_id: entry.player_id,
      payout: floor,
      remainder: exact - floor,
      weight: entry.weight,
    }
  })

  let distributed = provisional.reduce((sum, entry) => sum + entry.payout, 0)
  let remaining = totalPot - distributed

  const byPriority = [...provisional].sort((left, right) => {
    if (right.remainder !== left.remainder) return right.remainder - left.remainder
    if (right.weight !== left.weight) return right.weight - left.weight
    return left.player_id.localeCompare(right.player_id)
  })

  for (const entry of byPriority) {
    if (remaining <= 0) break
    entry.payout += 1
    remaining -= 1
  }

  return provisional
    .filter((entry) => entry.payout > 0)
    .map((entry) => ({ player_id: entry.player_id, payout: entry.payout }))
}

export function calculateScores({
  narratorId,
  players,
  activePlayers,
  votes,
  playedCards,
}: ScoreInput): ScoreEntry[] {
  const roundPlayers = getRoundPlayers({
    players,
    activePlayers,
    narratorId,
    playedCards,
    votes,
  })
  const roundPlayerSet = new Set(roundPlayers)
  const roundVotes = votes.filter((vote) => roundPlayerSet.has(vote.voter_id))
  const roundPlayedCards = playedCards.filter((card) => roundPlayerSet.has(card.player_id))
  const nonNarrators = roundPlayers.filter((playerId) => playerId !== narratorId)
  const narratorCard = roundPlayedCards.find((card) => card.player_id === narratorId)
  if (!narratorCard) return []

  const correctVoters = roundVotes
    .filter((vote) => vote.card_id === narratorCard.id)
    .map((vote) => vote.voter_id)

  const allCorrect = nonNarrators.length > 0 && correctVoters.length === nonNarrators.length
  const noneCorrect = correctVoters.length === 0
  const narratorFails = allCorrect || noneCorrect
  const entries: ScoreEntry[] = [
    {
      player_id: narratorId,
      points: narratorFails ? -2 : 3,
      reason: narratorFails ? 'narrator_fail' : 'narrator_success',
    },
  ]

  if (allCorrect) {
    for (const playerId of nonNarrators) {
      entries.push({ player_id: playerId, points: 1, reason: 'consolation_bonus' })
    }
  } else if (noneCorrect) {
    for (const playerId of nonNarrators) {
      entries.push({ player_id: playerId, points: 2, reason: 'consolation_bonus' })
    }
  } else {
    const marketPoints = getMarketCorrectVotePoints(correctVoters.length)
    for (const playerId of correctVoters) {
      entries.push({ player_id: playerId, points: marketPoints, reason: 'market_correct_vote' })
    }
  }

  const nonNarratorCards = roundPlayedCards.filter((card) => card.player_id !== narratorId)
  const cardById = new Map(nonNarratorCards.map((card) => [card.id, card]))

  for (const card of nonNarratorCards) {
    const incomingVotes = roundVotes.filter(
      (vote) => vote.card_id === card.id && vote.voter_id !== card.player_id,
    )

    if (incomingVotes.length === 0) continue

    if (card.is_corrupted) {
      entries.push({
        player_id: card.player_id,
        points: 2,
        reason: 'corrupted_card_bonus',
      })
      for (const vote of incomingVotes) {
        entries.push({
          player_id: vote.voter_id,
          points: -1,
          reason: 'corrupted_vote_penalty',
        })
      }
      continue
    }

    for (const vote of incomingVotes) {
      entries.push({
        player_id: card.player_id,
        points: 1,
        reason: 'received_vote',
      })
    }
  }

  const riskProfile = narratorCard.risk_clue_profile
  if (riskProfile && riskProfile !== 'normal') {
    const targetCorrectGuessers = CLUE_RISK_TARGETS[riskProfile]
    const delta = Math.abs(correctVoters.length - targetCorrectGuessers)

    if (delta === 0) {
      entries.push({
        player_id: narratorId,
        points: 2,
        reason: 'clue_risk_bonus',
      })
    } else if (delta > 1) {
      entries.push({
        player_id: narratorId,
        points: -1,
        reason: 'clue_risk_penalty',
      })
    }
  }

  const winningBets = roundVotes
    .filter((vote) => vote.card_id === narratorCard.id && (vote.bet_tokens ?? 0) > 0)
    .map((vote) => ({
      player_id: vote.voter_id,
      weight: vote.bet_tokens ?? 0,
    }))

  const betPayouts = splitIntegerPot(getBetPotSize(roundPlayers.length), winningBets)
  for (const payout of betPayouts) {
    entries.push({
      player_id: payout.player_id,
      points: payout.payout,
      reason: 'bet_pot_payout',
    })
  }

  return entries
}
