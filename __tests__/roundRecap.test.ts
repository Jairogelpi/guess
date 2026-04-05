import { buildRoundRecapHeadline, getTopRoundMovers } from '../src/lib/roundRecap'
import type { CompetitiveRoundSummary, RoomPlayer } from '../src/types/game'

const players: RoomPlayer[] = [
  {
    id: '1',
    room_id: 'room',
    player_id: 'narrator',
    display_name: 'Narrador',
    is_host: true,
    is_ready: true,
    is_active: true,
    joined_at: '',
    score: 12,
    intuition_tokens: 0,
    corrupted_cards_remaining: 0,
    challenge_leader_used: false,
    wildcards_remaining: 0,
    generation_tokens: 0,
  },
  {
    id: '2',
    room_id: 'room',
    player_id: 'p2',
    display_name: 'Lucia',
    is_host: false,
    is_ready: true,
    is_active: true,
    joined_at: '',
    score: 10,
    intuition_tokens: 0,
    corrupted_cards_remaining: 0,
    challenge_leader_used: false,
    wildcards_remaining: 0,
    generation_tokens: 0,
  },
  {
    id: '3',
    room_id: 'room',
    player_id: 'p3',
    display_name: 'Mario',
    is_host: false,
    is_ready: true,
    is_active: true,
    joined_at: '',
    score: 4,
    intuition_tokens: 0,
    corrupted_cards_remaining: 0,
    challenge_leader_used: false,
    wildcards_remaining: 0,
    generation_tokens: 0,
  },
]

const summary: CompetitiveRoundSummary = {
  roundId: 'round-1',
  narratorId: 'narrator',
  narratorCardId: 'card-1',
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
    tokenCost: 1,
  },
  betPot: { size: 2, totalWinningWeight: 2, winners: [] },
  corruptionEvents: [],
  challengeLeaderAttempts: [],
  playerPointDeltas: [
    { playerId: 'narrator', total: 5, breakdown: [] },
    { playerId: 'p2', total: 8, breakdown: [] },
    { playerId: 'p3', total: -1, breakdown: [] },
  ],
  playerTokenDeltas: [],
}

test('buildRoundRecapHeadline highlights the top mover of the round', () => {
  expect(buildRoundRecapHeadline(summary, players)).toContain('Lucia')
  expect(buildRoundRecapHeadline(summary, players)).toContain('+8')
})

test('getTopRoundMovers sorts deltas descending and resolves display names', () => {
  expect(getTopRoundMovers(summary, players)).toEqual([
    { playerId: 'p2', displayName: 'Lucia', delta: 8 },
    { playerId: 'narrator', displayName: 'Narrador', delta: 5 },
    { playerId: 'p3', displayName: 'Mario', delta: -1 },
  ])
})
