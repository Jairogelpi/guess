import { calculateScores, type ScoreEntry } from '../../supabase/functions/game-action/scoring'
import {
  buildRoundResolutionSummary,
  type RoundResolutionSummary,
} from '../../supabase/functions/game-action/roundSummary'

function applyScoreEntries(
  scoresBefore: Record<string, number>,
  scoreEntries: ScoreEntry[],
) {
  return scoreEntries.reduce<Record<string, number>>((scores, entry) => {
    return {
      ...scores,
      [entry.player_id]: (scores[entry.player_id] ?? 0) + entry.points,
    }
  }, { ...scoresBefore })
}

describe('buildRoundResolutionSummary', () => {
  test('tracks card and vote tactical results from scoped scorer output', () => {
    const playedCards = [
      { id: 'card-n', player_id: 'narrator', tactical_action: 'subtle_bet' as const },
      { id: 'card-a', player_id: 'p1', tactical_action: null },
      { id: 'card-b', player_id: 'p2', tactical_action: null },
      { id: 'card-c', player_id: 'p3', tactical_action: 'trap_card' as const },
      { id: 'card-d', player_id: 'p4', tactical_action: null },
    ]
    const votes = [
      { voter_id: 'p1', card_id: 'card-c', tactical_action: null },
      { voter_id: 'p2', card_id: 'card-n', tactical_action: 'firm_read' as const },
      { voter_id: 'p3', card_id: 'card-d', tactical_action: null },
      { voter_id: 'p4', card_id: 'card-c', tactical_action: null },
    ]
    const scoreEntries = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'p4'],
      votes,
      playedCards,
    })
    const scoresBefore = { narrator: 6, p1: 5, p2: 2, p3: 4, p4: 1 }
    const scoresAfter = applyScoreEntries(scoresBefore, scoreEntries)

    const summary = buildRoundResolutionSummary({
      roundId: 'round-1',
      narratorId: 'narrator',
      narratorCardId: 'card-n',
      clue: 'moonlight',
      votes,
      playedCards,
      scoreEntries,
      scoresBefore,
      scoresAfter,
    })

    expect(summary.correctVoterIds).toEqual(['p2'])
    expect(summary.deceptionEvents).toHaveLength(3)
    expect(summary.deceptionEvents).toContainEqual(
      expect.objectContaining({
        sourcePlayerId: 'p3',
        fooledPlayerId: 'p1',
        cardId: 'card-c',
        trapCard: true,
      }),
    )
    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'p3',
        type: 'trap_card',
        success: true,
        pointsDelta: 1,
      }),
    )
    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'p2',
        type: 'firm_read',
        success: true,
        pointsDelta: 1,
      }),
    )
    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'narrator',
        type: 'subtle_bet',
        success: false,
        pointsDelta: 0,
      }),
    )
    expect(summary.leaderboardDeltas).toContainEqual(
      expect.objectContaining({
        playerId: 'p3',
        scoreBefore: 4,
        scoreAfter: 7,
        positionBefore: 3,
        positionAfter: 2,
      }),
    )
  })

  test('supports challenge leader in the summary payload shape', () => {
    const supportedType: RoundResolutionSummary['tacticalEvents'][number]['type'] =
      'challenge_leader'

    const summary = buildRoundResolutionSummary({
      roundId: 'round-2',
      narratorId: 'narrator',
      narratorCardId: 'card-n',
      clue: null,
      votes: [
        {
          voter_id: 'p1',
          card_id: 'card-n',
          tactical_action: null,
          challenge_leader: true,
        },
      ],
      playedCards: [{ id: 'card-n', player_id: 'narrator', tactical_action: null }],
      scoreEntries: [],
      scoresBefore: { narrator: 0, p1: 0 },
      scoresAfter: { narrator: 0, p1: 0 },
    })

    expect(supportedType).toBe('challenge_leader')
    expect(summary.tacticalEvents).toEqual([])
  })
})
