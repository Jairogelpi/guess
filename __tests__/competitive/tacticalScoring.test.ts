import { calculateScores } from '../../supabase/functions/game-action/scoring'

describe('calculateScores unified tactical scoring', () => {
  test('clue risk sniper exact hit gives the narrator +2 clue risk bonus', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3'],
      votes: [
        { voter_id: 'p1', card_id: 'narrator-card', bet_tokens: 0 },
        { voter_id: 'p2', card_id: 'p3-card', bet_tokens: 0 },
        { voter_id: 'p3', card_id: 'p2-card', bet_tokens: 0 },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', risk_clue_profile: 'sniper', is_corrupted: false },
        { id: 'p1-card', player_id: 'p1', is_corrupted: false },
        { id: 'p2-card', player_id: 'p2', is_corrupted: false },
        { id: 'p3-card', player_id: 'p3', is_corrupted: false },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'narrator',
        reason: 'clue_risk_bonus',
        points: 2,
      }),
    )
  })

  test('ambush exact hit gives the narrator +2 clue risk bonus when nobody guesses correctly', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3'],
      votes: [
        { voter_id: 'p1', card_id: 'p2-card', bet_tokens: 0 },
        { voter_id: 'p2', card_id: 'p1-card', bet_tokens: 0 },
        { voter_id: 'p3', card_id: 'p1-card', bet_tokens: 0 },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', risk_clue_profile: 'ambush', is_corrupted: false },
        { id: 'p1-card', player_id: 'p1', is_corrupted: false },
        { id: 'p2-card', player_id: 'p2', is_corrupted: false },
        { id: 'p3-card', player_id: 'p3', is_corrupted: false },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'narrator',
        reason: 'clue_risk_bonus',
        points: 2,
      }),
    )
  })

  test('corrupted card replaces normal vote reward, gives owner +2 and each fooled voter -1', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'p4'],
      votes: [
        { voter_id: 'p1', card_id: 'p4-card', bet_tokens: 0 },
        { voter_id: 'p2', card_id: 'narrator-card', bet_tokens: 0 },
        { voter_id: 'p3', card_id: 'p4-card', bet_tokens: 0 },
        { voter_id: 'p4', card_id: 'p1-card', bet_tokens: 0 },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', risk_clue_profile: null, is_corrupted: false },
        { id: 'p1-card', player_id: 'p1', is_corrupted: false },
        { id: 'p2-card', player_id: 'p2', is_corrupted: false },
        { id: 'p3-card', player_id: 'p3', is_corrupted: false },
        { id: 'p4-card', player_id: 'p4', is_corrupted: true },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'p4',
        reason: 'corrupted_card_bonus',
        points: 2,
      }),
    )
    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'p1',
        reason: 'corrupted_vote_penalty',
        points: -1,
      }),
    )
    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'p3',
        reason: 'corrupted_vote_penalty',
        points: -1,
      }),
    )
    expect(scores).not.toContainEqual(
      expect.objectContaining({
        player_id: 'p4',
        reason: 'received_vote',
      }),
    )
  })

  test('bet pot for 5 players is 2 and is split by winning stake weight', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'p4'],
      votes: [
        { voter_id: 'p1', card_id: 'narrator-card', bet_tokens: 1 },
        { voter_id: 'p2', card_id: 'narrator-card', bet_tokens: 2 },
        { voter_id: 'p3', card_id: 'p4-card', bet_tokens: 0 },
        { voter_id: 'p4', card_id: 'p1-card', bet_tokens: 0 },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', risk_clue_profile: null, is_corrupted: false },
        { id: 'p1-card', player_id: 'p1', is_corrupted: false },
        { id: 'p2-card', player_id: 'p2', is_corrupted: false },
        { id: 'p3-card', player_id: 'p3', is_corrupted: false },
        { id: 'p4-card', player_id: 'p4', is_corrupted: false },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'p1',
        reason: 'bet_pot_payout',
        points: 1,
      }),
    )
    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'p2',
        reason: 'bet_pot_payout',
        points: 1,
      }),
    )
  })
})
