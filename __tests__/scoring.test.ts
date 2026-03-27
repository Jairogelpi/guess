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
  { id: narratorCard, player_id: narrator, risk_clue_profile: null, is_corrupted: false },
  { id: p1Card, player_id: p1, is_corrupted: false },
  { id: p2Card, player_id: p2, is_corrupted: false },
  { id: p3Card, player_id: p3, is_corrupted: false },
]

describe('calculateScores unified baseline scoring', () => {
  test('everybody guesses correctly: narrator gets -2 and each non-narrator gets +1 consolation', () => {
    const votes = [
      { voter_id: p1, card_id: narratorCard, bet_tokens: 0 },
      { voter_id: p2, card_id: narratorCard, bet_tokens: 0 },
      { voter_id: p3, card_id: narratorCard, bet_tokens: 0 },
    ]

    const scores = calculateScores({
      narratorId: narrator,
      players: basePlayers,
      votes,
      playedCards: basePlayedCards,
    })

    expect(scores).toContainEqual({ player_id: narrator, points: -2, reason: 'narrator_fail' })
    expect(scores).toContainEqual({ player_id: p1, points: 1, reason: 'consolation_bonus' })
    expect(scores).toContainEqual({ player_id: p2, points: 1, reason: 'consolation_bonus' })
    expect(scores).toContainEqual({ player_id: p3, points: 1, reason: 'consolation_bonus' })
    expect(scores).not.toContainEqual(
      expect.objectContaining({ player_id: p1, reason: 'market_correct_vote' }),
    )
  })

  test('nobody guesses correctly: narrator gets -2 and each non-narrator gets +2 consolation', () => {
    const votes = [
      { voter_id: p1, card_id: p2Card, bet_tokens: 0 },
      { voter_id: p2, card_id: p1Card, bet_tokens: 0 },
      { voter_id: p3, card_id: p1Card, bet_tokens: 0 },
    ]

    const scores = calculateScores({
      narratorId: narrator,
      players: basePlayers,
      votes,
      playedCards: basePlayedCards,
    })

    expect(scores).toContainEqual({ player_id: narrator, points: -2, reason: 'narrator_fail' })
    expect(scores).toContainEqual({ player_id: p1, points: 2, reason: 'consolation_bonus' })
    expect(scores).toContainEqual({ player_id: p2, points: 2, reason: 'consolation_bonus' })
    expect(scores).toContainEqual({ player_id: p3, points: 2, reason: 'consolation_bonus' })
  })

  test('single correct guesser: narrator gets +3 and that guesser gets +4 market payout', () => {
    const votes = [
      { voter_id: p1, card_id: narratorCard, bet_tokens: 0 },
      { voter_id: p2, card_id: p1Card, bet_tokens: 0 },
      { voter_id: p3, card_id: p2Card, bet_tokens: 0 },
    ]

    const scores = calculateScores({
      narratorId: narrator,
      players: basePlayers,
      votes,
      playedCards: basePlayedCards,
    })

    expect(scores).toContainEqual({ player_id: narrator, points: 3, reason: 'narrator_success' })
    expect(scores).toContainEqual({ player_id: p1, points: 4, reason: 'market_correct_vote' })
  })

  test('non-corrupted decoy cards earn +1 per opponent vote', () => {
    const votes = [
      { voter_id: p1, card_id: p3Card, bet_tokens: 0 },
      { voter_id: p2, card_id: narratorCard, bet_tokens: 0 },
      { voter_id: p3, card_id: p1Card, bet_tokens: 0 },
    ]

    const scores = calculateScores({
      narratorId: narrator,
      players: basePlayers,
      votes,
      playedCards: basePlayedCards,
    })

    expect(scores).toContainEqual({ player_id: p3, points: 1, reason: 'received_vote' })
    expect(scores).toContainEqual({ player_id: p1, points: 1, reason: 'received_vote' })
  })
})
