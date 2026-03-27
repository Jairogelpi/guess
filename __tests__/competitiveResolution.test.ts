import {
  applyChallengeLeaderBonuses,
  applyIntuitionChanges,
  getSoloLeaderId,
} from '../supabase/functions/game-action/competitiveResolution'
import type { ScoreEntry } from '../supabase/functions/game-action/scoring'

function sortEntries(entries: ScoreEntry[]) {
  return [...entries].sort((left, right) =>
    `${left.player_id}:${left.reason}`.localeCompare(`${right.player_id}:${right.reason}`),
  )
}

describe('competitiveResolution unified economy', () => {
  test('detects a solo leader only when first place is unique', () => {
    expect(
      getSoloLeaderId([
        { player_id: 'p1', score: 7 },
        { player_id: 'p2', score: 5 },
      ]),
    ).toBe('p1')

    expect(
      getSoloLeaderId([
        { player_id: 'p1', score: 7 },
        { player_id: 'p2', score: 7 },
      ]),
    ).toBeNull()
  })

  test('challenge the leader awards +2 only when challenger beats the solo leader by 2+ round points', () => {
    const baseEntries: ScoreEntry[] = [
      { player_id: 'leader', points: 1, reason: 'received_vote' },
      { player_id: 'challenger', points: 3, reason: 'market_correct_vote' },
    ]

    expect(
      sortEntries(
        applyChallengeLeaderBonuses({
          scoresBefore: [
            { player_id: 'leader', score: 10 },
            { player_id: 'challenger', score: 8 },
            { player_id: 'other', score: 6 },
          ],
          scoreEntries: baseEntries,
          playedCards: [
            { id: 'challenger-card', player_id: 'challenger', challenge_leader: true },
          ],
          votes: [],
        }),
      ),
    ).toContainEqual({
      player_id: 'challenger',
      points: 2,
      reason: 'challenge_leader_bonus',
    })
  })

  test('challenge the leader gives nothing on ties, +1 leads, or when first place is tied', () => {
    expect(
      applyChallengeLeaderBonuses({
        scoresBefore: [
          { player_id: 'leader', score: 10 },
          { player_id: 'challenger', score: 8 },
        ],
        scoreEntries: [
          { player_id: 'leader', points: 2, reason: 'received_vote' },
          { player_id: 'challenger', points: 3, reason: 'market_correct_vote' },
        ],
        playedCards: [{ id: 'challenger-card', player_id: 'challenger', challenge_leader: true }],
        votes: [],
      }),
    ).toEqual([])

    expect(
      applyChallengeLeaderBonuses({
        scoresBefore: [
          { player_id: 'leader', score: 10 },
          { player_id: 'challenger', score: 10 },
        ],
        scoreEntries: [
          { player_id: 'challenger', points: 4, reason: 'market_correct_vote' },
        ],
        playedCards: [{ id: 'challenger-card', player_id: 'challenger', challenge_leader: true }],
        votes: [],
      }),
    ).toEqual([])
  })

  test('applies base income, percentile band bonus, interest, and clamps at 10', () => {
    expect(
      applyIntuitionChanges({
        playersBefore: [
          { player_id: 'p1', intuition_tokens: 8 },
          { player_id: 'p2', intuition_tokens: 6 },
          { player_id: 'p3', intuition_tokens: 4 },
          { player_id: 'p4', intuition_tokens: 3 },
          { player_id: 'p5', intuition_tokens: 1 },
        ],
        scoresAfter: {
          p1: 12,
          p2: 9,
          p3: 9,
          p4: 6,
          p5: 4,
        },
      }),
    ).toEqual({
      p1: 10,
      p2: 10,
      p3: 8,
      p4: 6,
      p5: 3,
    })
  })
})
