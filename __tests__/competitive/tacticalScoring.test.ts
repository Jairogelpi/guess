import { calculateScores } from '../../supabase/functions/game-action/scoring'
import {
  firmReadSucceeded,
  getEligibleVoterCount,
  subtleBetSucceeded,
  trapCardSucceeded,
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

  test('trapCardSucceeded only passes with at least two wrong votes', () => {
    expect(trapCardSucceeded(1)).toBe(false)
    expect(trapCardSucceeded(2)).toBe(true)
  })

  test('firmReadSucceeded only passes on a correct vote in a hard round', () => {
    expect(firmReadSucceeded(true, 1, 3)).toBe(true)
    expect(firmReadSucceeded(false, 1, 3)).toBe(false)
    expect(firmReadSucceeded(true, 2, 4)).toBe(false)
  })
})

describe('calculateScores tactical scoring', () => {
  test('subtle bet succeeds when omitted activePlayers must be inferred from round data', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'bench-1', 'bench-2'],
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

  test('omitted activePlayers does not let bench players block narrator fail detection', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'bench-1', 'bench-2'],
      votes: [
        { voter_id: 'p1', card_id: 'narrator-card', tactical_action: null },
        { voter_id: 'p2', card_id: 'narrator-card', tactical_action: null },
        { voter_id: 'p3', card_id: 'narrator-card', tactical_action: null },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', tactical_action: 'subtle_bet' },
        { id: 'p1-card', player_id: 'p1', tactical_action: null },
        { id: 'p2-card', player_id: 'p2', tactical_action: null },
        { id: 'p3-card', player_id: 'p3', tactical_action: null },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'narrator',
        reason: 'narrator_fail',
        points: 0,
      }),
    )
    expect(scores).not.toContainEqual(
      expect.objectContaining({
        player_id: 'narrator',
        reason: 'balanced_clue_bonus',
      }),
    )
  })

  test('omitted activePlayers still anchors round inference to the room roster', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3'],
      votes: [
        { voter_id: 'p1', card_id: 'narrator-card', tactical_action: 'firm_read' },
        { voter_id: 'p2', card_id: 'p3-card', tactical_action: null },
        { voter_id: 'p3', card_id: 'p2-card', tactical_action: null },
        { voter_id: 'spectator', card_id: 'narrator-card', tactical_action: null },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', tactical_action: null },
        { id: 'p1-card', player_id: 'p1', tactical_action: null },
        { id: 'p2-card', player_id: 'p2', tactical_action: null },
        { id: 'p3-card', player_id: 'p3', tactical_action: null },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'p1',
        reason: 'firm_read_bonus',
        points: 1,
      }),
    )
    expect(scores).not.toContainEqual(
      expect.objectContaining({
        player_id: 'spectator',
      }),
    )
  })

  test('trap card awards a bonus when the marked card receives two wrong votes', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'p4'],
      votes: [
        { voter_id: 'p1', card_id: 'p3-card', tactical_action: null },
        { voter_id: 'p2', card_id: 'narrator-card', tactical_action: null },
        { voter_id: 'p3', card_id: 'p1-card', tactical_action: null },
        { voter_id: 'p4', card_id: 'p3-card', tactical_action: null },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', tactical_action: null },
        { id: 'p1-card', player_id: 'p1', tactical_action: null },
        { id: 'p2-card', player_id: 'p2', tactical_action: null },
        { id: 'p3-card', player_id: 'p3', tactical_action: 'trap_card' },
        { id: 'p4-card', player_id: 'p4', tactical_action: null },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'p3',
        reason: 'trap_card_bonus',
        points: 1,
      }),
    )
  })

  test('firm read awards a bonus for a correct vote in a hard round', () => {
    const scores = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'p4'],
      votes: [
        { voter_id: 'p1', card_id: 'p3-card', tactical_action: null },
        { voter_id: 'p2', card_id: 'narrator-card', tactical_action: 'firm_read' },
        { voter_id: 'p3', card_id: 'p1-card', tactical_action: null },
        { voter_id: 'p4', card_id: 'p3-card', tactical_action: null },
      ],
      playedCards: [
        { id: 'narrator-card', player_id: 'narrator', tactical_action: null },
        { id: 'p1-card', player_id: 'p1', tactical_action: null },
        { id: 'p2-card', player_id: 'p2', tactical_action: null },
        { id: 'p3-card', player_id: 'p3', tactical_action: null },
        { id: 'p4-card', player_id: 'p4', tactical_action: null },
      ],
    })

    expect(scores).toContainEqual(
      expect.objectContaining({
        player_id: 'p2',
        reason: 'firm_read_bonus',
        points: 1,
      }),
    )
  })
})
