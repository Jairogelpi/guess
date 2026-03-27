import type {
  CompetitiveRoundSummary,
  RoundResolutionSummaryRecord,
} from '../../src/types/game'
import { buildRoundResolutionSummary } from '../../supabase/functions/game-action/roundSummary'

describe('buildRoundResolutionSummary', () => {
  test('public summary contract exposes unified competitive explanation sections', () => {
    const summary: CompetitiveRoundSummary = {
      roundId: 'round-1',
      narratorId: 'narrator',
      narratorCardId: 'card-n',
      clue: 'moonlight',
      correctGuesserCount: 1,
      correctGuesserIds: ['p2'],
      marketPayoutTier: 'single_correct',
      clueRisk: {
        profile: 'sniper',
        targetCorrectGuessers: 1,
        actualCorrectGuessers: 1,
        outcome: 'exact',
        pointsDelta: 2,
        tokenCost: 0,
      },
      betPot: {
        size: 2,
        totalWinningWeight: 2,
        winners: [
          {
            playerId: 'p2',
            stake: 2,
            weight: 2,
            pointsAwarded: 2,
          },
        ],
      },
      corruptionEvents: [
        {
          playerId: 'p4',
          cardId: 'card-x',
          fooledPlayerIds: ['p1', 'p3'],
          success: true,
          pointsDelta: 2,
          fooledPenaltyTotal: -2,
        },
      ],
      challengeLeaderAttempts: [
        {
          playerId: 'p2',
          targetLeaderId: 'narrator',
          success: true,
          pointsDelta: 2,
          tokenCost: 1,
        },
      ],
      playerPointDeltas: [
        {
          playerId: 'narrator',
          total: 5,
          breakdown: [
            { reason: 'narrator_success', points: 3 },
            { reason: 'clue_risk_bonus', points: 2 },
          ],
        },
        {
          playerId: 'p1',
          total: -1,
          breakdown: [{ reason: 'corrupted_vote_penalty', points: -1 }],
        },
        {
          playerId: 'p2',
          total: 8,
          breakdown: [
            { reason: 'market_correct_vote', points: 4 },
            { reason: 'bet_pot_payout', points: 2 },
            { reason: 'challenge_leader_bonus', points: 2 },
          ],
        },
        {
          playerId: 'p3',
          total: -1,
          breakdown: [{ reason: 'corrupted_vote_penalty', points: -1 }],
        },
        {
          playerId: 'p4',
          total: 2,
          breakdown: [{ reason: 'corrupted_card_bonus', points: 2 }],
        },
      ],
      playerTokenDeltas: [
        {
          playerId: 'narrator',
          tacticalCostPaid: 0,
          income: { base: 2, position: 2, interest: 1 },
          total: 5,
        },
        {
          playerId: 'p2',
          tacticalCostPaid: 3,
          income: { base: 2, position: 1, interest: 0 },
          total: 0,
        },
        {
          playerId: 'p4',
          tacticalCostPaid: 1,
          income: { base: 2, position: 0, interest: 0 },
          total: 1,
        },
      ],
    }

    const record: RoundResolutionSummaryRecord = {
      created_at: '2026-03-24T19:30:00.000Z',
      round_id: 'round-1',
      summary,
    }

    expect(record.summary.clueRisk?.profile).toBe('sniper')
    expect(record.summary.betPot.size).toBe(2)
    expect(record.summary.playerTokenDeltas[1]?.income.position).toBe(1)
  })

  test('emits clue risk, bet pot, corruption, challenge, and income breakdown sections', () => {
    const summary = buildRoundResolutionSummary({
      roundId: 'round-1',
      narratorId: 'narrator',
      narratorCardId: 'card-n',
      clue: 'moonlight',
      votes: [
        { voter_id: 'p1', card_id: 'card-x', bet_tokens: 0 },
        { voter_id: 'p2', card_id: 'card-n', bet_tokens: 2, challenge_leader: true },
        { voter_id: 'p3', card_id: 'card-x', bet_tokens: 0 },
      ],
      playedCards: [
        {
          id: 'card-n',
          player_id: 'narrator',
          risk_clue_profile: 'sniper',
          challenge_leader: false,
        },
        {
          id: 'card-x',
          player_id: 'p4',
          is_corrupted: true,
          challenge_leader: false,
        },
      ],
      scoreEntries: [
        { player_id: 'narrator', reason: 'narrator_success', points: 3 },
        { player_id: 'narrator', reason: 'clue_risk_bonus', points: 2 },
        { player_id: 'p1', reason: 'corrupted_vote_penalty', points: -1 },
        { player_id: 'p2', reason: 'market_correct_vote', points: 4 },
        { player_id: 'p2', reason: 'bet_pot_payout', points: 2 },
        { player_id: 'p2', reason: 'challenge_leader_bonus', points: 2 },
        { player_id: 'p3', reason: 'corrupted_vote_penalty', points: -1 },
        { player_id: 'p4', reason: 'corrupted_card_bonus', points: 2 },
      ],
      scoresBefore: { narrator: 6, p1: 5, p2: 2, p3: 4, p4: 1 },
      scoresAfter: { narrator: 11, p1: 4, p2: 10, p3: 3, p4: 3 },
      tokenSnapshots: {
        narrator: { spent: 0, base: 2, position: 2, interest: 1, total: 5 },
        p1: { spent: 0, base: 2, position: 1, interest: 0, total: 3 },
        p2: { spent: 3, base: 2, position: 1, interest: 0, total: 0 },
        p3: { spent: 0, base: 2, position: 1, interest: 0, total: 3 },
        p4: { spent: 1, base: 2, position: 0, interest: 0, total: 1 },
      },
    } as never)

    expect(summary).toEqual(
      expect.objectContaining({
        correctGuesserCount: 1,
        marketPayoutTier: 'single_correct',
        clueRisk: expect.objectContaining({
          profile: 'sniper',
          outcome: 'exact',
        }),
        betPot: expect.objectContaining({
          size: 2,
          winners: [expect.objectContaining({ playerId: 'p2', stake: 2, pointsAwarded: 2 })],
        }),
        corruptionEvents: [
          expect.objectContaining({
            playerId: 'p4',
            cardId: 'card-x',
            fooledPlayerIds: ['p1', 'p3'],
            success: true,
          }),
        ],
        challengeLeaderAttempts: [
          expect.objectContaining({
            playerId: 'p2',
            targetLeaderId: 'narrator',
            success: true,
            pointsDelta: 2,
          }),
        ],
        playerPointDeltas: expect.arrayContaining([
          expect.objectContaining({ playerId: 'narrator', total: 5 }),
          expect.objectContaining({ playerId: 'p2', total: 8 }),
          expect.objectContaining({ playerId: 'p4', total: 2 }),
        ]),
        playerTokenDeltas: expect.arrayContaining([
          expect.objectContaining({
            playerId: 'p2',
            tacticalCostPaid: 3,
            income: expect.objectContaining({ base: 2, position: 1, interest: 0 }),
            total: 0,
          }),
        ]),
      }),
    )
  })
})
