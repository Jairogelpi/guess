import { calculateScores, type ScoreEntry } from '../../supabase/functions/game-action/scoring'
import { buildRoundResolutionSummary } from '../../supabase/functions/game-action/roundSummary'

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
  test('tracks phase 1 tactical results with intuition deltas and readable descriptions', () => {
    const playedCards = [
      { id: 'card-n', player_id: 'narrator', tactical_action: 'subtle_bet' as const },
      { id: 'card-a', player_id: 'p1', tactical_action: null },
      { id: 'card-b', player_id: 'p2', tactical_action: null },
      { id: 'card-c', player_id: 'p3', tactical_action: 'trap_card' as const },
      { id: 'card-d', player_id: 'p4', tactical_action: null },
      { id: 'card-e', player_id: 'p5', tactical_action: null },
    ]
    const votes = [
      { voter_id: 'p1', card_id: 'card-c', tactical_action: null },
      { voter_id: 'p2', card_id: 'card-n', tactical_action: 'firm_read' as const },
      { voter_id: 'p3', card_id: 'card-d', tactical_action: null },
      { voter_id: 'p4', card_id: 'card-c', tactical_action: null },
      { voter_id: 'p5', card_id: 'card-n', tactical_action: null },
    ]
    const scoreEntries = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'p4', 'p5'],
      votes,
      playedCards,
    })
    const scoresBefore = { narrator: 6, p1: 5, p2: 2, p3: 4, p4: 1, p5: 3 }
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

    expect(summary.correctVoterIds).toEqual(['p2', 'p5'])
    expect(summary.deceptionEvents).toHaveLength(3)
    expect(summary.deceptionEvents).toContainEqual(
      expect.objectContaining({
        sourcePlayerId: 'p3',
        fooledPlayerId: 'p1',
        cardId: 'card-c',
        trapCard: true,
      }),
    )
    expect(summary.deceptionEvents).toContainEqual(
      expect.objectContaining({
        sourcePlayerId: 'p4',
        fooledPlayerId: 'p3',
        cardId: 'card-d',
        trapCard: false,
      }),
    )
    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'narrator',
        type: 'subtle_bet',
        success: true,
        pointsDelta: 1,
        intuitionDelta: 1,
        description: 'Subtle Bet hit the balanced clue sweet spot',
      }),
    )
    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'p3',
        type: 'trap_card',
        success: true,
        pointsDelta: 1,
        intuitionDelta: 1,
        description: 'Trap card fooled 2 players',
      }),
    )
    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'p2',
        type: 'firm_read',
        success: true,
        pointsDelta: 1,
        intuitionDelta: 1,
        description: 'Firm Read found the narrator in a hard round',
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

  test('ignores out-of-roster votes when deriving summary events and hard-round reads', () => {
    const playedCards = [
      { id: 'card-n', player_id: 'narrator', tactical_action: null },
      { id: 'card-a', player_id: 'p1', tactical_action: null },
      { id: 'card-b', player_id: 'p2', tactical_action: null },
      { id: 'card-c', player_id: 'p3', tactical_action: 'trap_card' as const },
    ]
    const votes = [
      { voter_id: 'p1', card_id: 'card-n', tactical_action: 'firm_read' as const },
      { voter_id: 'p2', card_id: 'card-c', tactical_action: null },
      { voter_id: 'p3', card_id: 'card-b', tactical_action: null },
      { voter_id: 'spectator', card_id: 'card-n', tactical_action: null },
      { voter_id: 'outsider', card_id: 'card-c', tactical_action: null },
    ]
    const scoreEntries = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3', 'bench-1'],
      votes,
      playedCards,
    })
    const scoresBefore = { narrator: 4, p1: 2, p2: 1, p3: 3, 'bench-1': 0 }
    const scoresAfter = applyScoreEntries(scoresBefore, scoreEntries)

    const summary = buildRoundResolutionSummary({
      roundId: 'round-1b',
      narratorId: 'narrator',
      narratorCardId: 'card-n',
      clue: 'fog',
      votes,
      playedCards,
      scoreEntries,
      scoresBefore,
      scoresAfter,
    })

    expect(summary.correctVoterIds).toEqual(['p1'])
    expect(summary.deceptionEvents).toEqual([
      expect.objectContaining({
        sourcePlayerId: 'p3',
        fooledPlayerId: 'p2',
        cardId: 'card-c',
        trapCard: true,
      }),
      expect.objectContaining({
        sourcePlayerId: 'p2',
        fooledPlayerId: 'p3',
        cardId: 'card-b',
        trapCard: false,
      }),
    ])
    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'p1',
        type: 'firm_read',
        success: true,
        pointsDelta: 1,
        intuitionDelta: 1,
        description: 'Firm Read found the narrator in a hard round',
      }),
    )
  })

  test('records failed subtle bet with zero intuition gain and a readable failure reason', () => {
    const playedCards = [
      { id: 'card-n', player_id: 'narrator', tactical_action: 'subtle_bet' as const },
      { id: 'card-a', player_id: 'p1', tactical_action: null },
      { id: 'card-b', player_id: 'p2', tactical_action: null },
      { id: 'card-c', player_id: 'p3', tactical_action: null },
    ]
    const votes = [
      { voter_id: 'p1', card_id: 'card-n', tactical_action: null },
      { voter_id: 'p2', card_id: 'card-n', tactical_action: null },
      { voter_id: 'p3', card_id: 'card-n', tactical_action: null },
    ]
    const scoreEntries = calculateScores({
      narratorId: 'narrator',
      players: ['narrator', 'p1', 'p2', 'p3'],
      votes,
      playedCards,
    })

    const summary = buildRoundResolutionSummary({
      roundId: 'round-2',
      narratorId: 'narrator',
      narratorCardId: 'card-n',
      clue: 'sunrise',
      votes,
      playedCards,
      scoreEntries,
      scoresBefore: { narrator: 0, p1: 0, p2: 0, p3: 0 },
      scoresAfter: applyScoreEntries({ narrator: 0, p1: 0, p2: 0, p3: 0 }, scoreEntries),
    })

    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'narrator',
        type: 'subtle_bet',
        success: false,
        pointsDelta: 0,
        intuitionDelta: 0,
        description: 'Subtle Bet missed the balanced clue sweet spot',
      }),
    )
  })

  test('emits challenge leader events from inline flags using score entries', () => {
    const summary = buildRoundResolutionSummary({
      roundId: 'round-3',
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
      scoreEntries: [{ player_id: 'p1', reason: 'leader_challenge_bonus', points: 1 }],
      scoresBefore: { narrator: 0, p1: 0 },
      scoresAfter: { narrator: 0, p1: 1 },
    })

    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'p1',
        type: 'challenge_leader',
        success: true,
        pointsDelta: 1,
      }),
    )
  })
})
