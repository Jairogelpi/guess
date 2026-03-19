import { buildRoundResolutionSummary } from '../../supabase/functions/game-action/roundSummary'

describe('buildRoundResolutionSummary', () => {
  test('tracks deception events, tactical results, and leaderboard movement', () => {
    const summary = buildRoundResolutionSummary({
      roundId: 'round-1',
      narratorId: 'narrator',
      narratorCardId: 'card-n',
      clue: 'moonlight',
      votes: [
        { voter_id: 'p1', card_id: 'card-x' },
        { voter_id: 'p2', card_id: 'card-n' },
        { voter_id: 'p3', card_id: 'card-x' },
      ],
      playedCards: [
        { id: 'card-n', player_id: 'narrator', tactical_action: 'subtle_bet' },
        { id: 'card-x', player_id: 'p4', tactical_action: 'trap_card' },
      ],
      scoreEntries: [{ player_id: 'p4', reason: 'trap_card_bonus', points: 1 }],
      scoresBefore: { narrator: 6, p1: 5, p2: 2, p3: 1, p4: 4 },
      scoresAfter: { narrator: 9, p1: 5, p2: 2, p3: 1, p4: 6 },
    })

    expect(summary.correctVoterIds).toEqual(['p2'])
    expect(summary.deceptionEvents).toHaveLength(2)
    expect(summary.deceptionEvents).toContainEqual(
      expect.objectContaining({
        sourcePlayerId: 'p4',
        fooledPlayerId: 'p1',
        cardId: 'card-x',
        trapCard: true,
      }),
    )
    expect(summary.tacticalEvents).toContainEqual(
      expect.objectContaining({
        playerId: 'p4',
        type: 'trap_card',
        success: true,
        pointsDelta: 1,
      }),
    )
    expect(summary.leaderboardDeltas).toContainEqual(
      expect.objectContaining({
        playerId: 'p4',
        scoreBefore: 4,
        scoreAfter: 6,
        positionBefore: 3,
        positionAfter: 2,
      }),
    )
  })
})
