export function getEligibleVoterCount(activePlayers: string[], narratorId: string) {
  return activePlayers.filter((playerId) => playerId !== narratorId).length
}

export function subtleBetSucceeded(correctVotes: number, eligibleVoters: number) {
  if (eligibleVoters <= 0) return false
  if (correctVotes === 0 || correctVotes === eligibleVoters) return false

  return (
    correctVotes >= Math.ceil(eligibleVoters / 3) &&
    correctVotes <= Math.floor((eligibleVoters * 2) / 3)
  )
}
