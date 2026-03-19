import { calculateScores } from '../../supabase/functions/game-action/scoring'
import {
  getEligibleVoterCount,
  subtleBetSucceeded,
} from '../../supabase/functions/game-action/tacticalRules'

describe('tacticalRules', () => {
  test('getEligibleVoterCount excludes the narrator from active voters', () => {
    expect(getEligibleVoterCount(['narrator', 'p1', 'p2', 'p3'], 'narrator')).toBe(3)
  })

  test('subtleBetSucceeded only passes inside the balanced clue window', () => {
    expect(subtleBetSucceeded(1, 3)).toBe(true)
    expect(subtleBetSucceeded(2, 3)).toBe(true)
    expect(subtleBetSucceeded(0, 3)).toBe(false)
    expect(subtleBetSucceeded(3, 3)).toBe(false)
    expect(subtleBetSucceeded(1, 5)).toBe(false)
    expect(subtleBetSucceeded(2, 5)).toBe(true)
  })
})

describe('calculateScores tactical scoring', () => {
  test('subtle bet succeeds when some but not all active voters find the narrator', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'bench-1', 'bench-2'],
      activePlayers: ['narrator', 'p1', 'p2', 'p3'],
      votes: [
        { voter_id: 'p1', card_id: 'narrator-card', tactical_action: null },
        { voter_id: 'p2', card_id: 'p3-card', tactical_action: null },
        { voter_id: 'p3', card_id: 'p2-card', tactical_action: null },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', tactical_action: 'subtle_bet' },
        { id: 'p1-card', player_id: 'p1', tactical_action: null },
        { id: 'p2-card', player_id: 'p2', tactical_action: null },
        { id: 'p3-card', player_id: 'p3', tactical_action: 'trap_card' },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'narrator',
        reason: 'balanced_clue_bonus',
        points: 1,
      }),
    )
  })
})
