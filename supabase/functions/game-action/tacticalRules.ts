interface VoteParticipant {
  voter_id: string
}

interface PlayedCardParticipant {
  player_id: string
}

export function inferRoundPlayers(
  narratorId: string,
  playedCards: PlayedCardParticipant[],
  votes: VoteParticipant[],
) {
  return Array.from(
    new Set([
      narratorId,
      ...playedCards.map((playedCard) => playedCard.player_id),
      ...votes.map((vote) => vote.voter_id),
    ]),
  )
}

export function getEligibleVoterCount(activePlayers: string[], narratorId: string) {
  return activePlayers.filter((playerId) => playerId !== narratorId).length
}

export function normalizeRoundPlayers(
  players: string[],
  narratorId: string,
  playedCards: PlayedCardParticipant[],
  votes: VoteParticipant[],
) {
  const inferredPlayers = new Set(inferRoundPlayers(narratorId, playedCards, votes))
  const normalizedPlayers = players.filter(
    (playerId) => playerId === narratorId || inferredPlayers.has(playerId),
  )

  return normalizedPlayers.includes(narratorId)
    ? normalizedPlayers
    : [narratorId, ...normalizedPlayers]
}

export function subtleBetSucceeded(correctVotes: number, eligibleVoters: number) {
  if (eligibleVoters <= 0) return false
  if (correctVotes === 0 || correctVotes === eligibleVoters) return false

  return (
    correctVotes >= Math.ceil(eligibleVoters / 3) &&
    correctVotes <= Math.floor((eligibleVoters * 2) / 3)
  )
}

export function trapCardSucceeded(wrongVotes: number) {
  return wrongVotes >= 2
}

export function firmReadSucceeded(
  isCorrectVote: boolean,
  correctVotes: number,
  eligibleVoters: number,
) {
  if (!isCorrectVote || eligibleVoters <= 0) return false
  return correctVotes < Math.ceil(eligibleVoters / 2)
}
