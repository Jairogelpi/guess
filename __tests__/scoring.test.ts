import { calculateScores } from '../supabase/functions/game-action/scoring'

const narrator = 'narrator'
const p1 = 'player-1'
const p2 = 'player-2'
const p3 = 'player-3'
const narratorCard = 'card-narrator'
const p1Card = 'card-p1'
const p2Card = 'card-p2'
const p3Card = 'card-p3'

const basePlayers = [narrator, p1, p2, p3]
const basePlayedCards = [
  { id: narratorCard, player_id: narrator },
  { id: p1Card, player_id: p1 },
  { id: p2Card, player_id: p2 },
  { id: p3Card, player_id: p3 },
]

describe('calculateScores', () => {
  test('narrator_fail: all guess correctly → narrator 0, others consolation 2', () => {
    const votes = [
      { voter_id: p1, card_id: narratorCard },
      { voter_id: p2, card_id: narratorCard },
      { voter_id: p3, card_id: narratorCard },
    ]
    const scores = calculateScores({
      narratorId: narrator,
      players: basePlayers,
      votes,
      playedCards: basePlayedCards,
    })
    expect(scores.find((s) => s.player_id === narrator)?.points).toBe(0)
    expect(scores.find((s) => s.player_id === narrator)?.reason).toBe('narrator_fail')
    expect(scores.find((s) => s.player_id === p1)?.points).toBe(2)
    expect(scores.find((s) => s.player_id === p1)?.reason).toBe('consolation_bonus')
  })

  test('narrator_fail: none guess correctly → narrator 0, others consolation 2', () => {
    const votes = [
      { voter_id: p1, card_id: p2Card },
      { voter_id: p2, card_id: p1Card },
      { voter_id: p3, card_id: p1Card },
    ]
    const scores = calculateScores({
      narratorId: narrator,
      players: basePlayers,
      votes,
      playedCards: basePlayedCards,
    })
    expect(scores.find((s) => s.player_id === narrator)?.points).toBe(0)
    expect(scores.find((s) => s.player_id === p1)?.reason).toBe('consolation_bonus')
    expect(scores.find((s) => s.player_id === p2)?.reason).toBe('consolation_bonus')
    expect(scores.find((s) => s.player_id === p3)?.reason).toBe('consolation_bonus')
  })

  test('narrator_success: some guess correctly → narrator 3, correct voters 3', () => {
    const votes = [
      { voter_id: p1, card_id: narratorCard },
      { voter_id: p2, card_id: p1Card },
      { voter_id: p3, card_id: narratorCard },
    ]
    const scores = calculateScores({
      narratorId: narrator,
      players: basePlayers,
      votes,
      playedCards: basePlayedCards,
    })
    expect(scores.find((s) => s.player_id === narrator)?.points).toBe(3)
    expect(scores.find((s) => s.player_id === narrator)?.reason).toBe('narrator_success')
    expect(scores.find((s) => s.player_id === p1)?.points).toBe(3)
    expect(scores.find((s) => s.player_id === p1)?.reason).toBe('correct_vote')
    expect(scores.find((s) => s.player_id === p3)?.points).toBe(3)
  })

  test('received_vote: non-narrator cards that got votes earn 1pt per vote', () => {
    const votes = [
      { voter_id: p1, card_id: narratorCard },
      { voter_id: p2, card_id: p3Card },
      { voter_id: p3, card_id: narratorCard },
    ]
    const scores = calculateScores({
      narratorId: narrator,
      players: basePlayers,
      votes,
      playedCards: basePlayedCards,
    })
    // p3 received 1 vote from p2 → 1pt received_vote
    const p3Scores = scores.filter((s) => s.player_id === p3)
    const receivedVote = p3Scores.find((s) => s.reason === 'received_vote')
    expect(receivedVote?.points).toBe(1)
  })
})
