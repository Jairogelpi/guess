import type {
  Database,
  SubmitCardActionPayload,
  SubmitClueActionPayload,
  SubmitVoteActionPayload,
} from '../src/types/game'
import {
  parseSubmitCardPayload,
  parseSubmitCluePayload,
  parseSubmitVotePayload,
} from '../supabase/functions/game-action/tacticalPayloads'

describe('game-action tactical payload parsing', () => {
  test('database row contracts expose unified competitive columns', () => {
    const cardInsert = {
      image_url: 'https://example.com/card.png',
      player_id: 'player-1',
      prompt: 'moon',
      round_id: 'round-1',
      risk_clue_profile: 'ambush',
      is_corrupted: false,
      challenge_leader: true,
    } satisfies Database['public']['Tables']['cards']['Insert']

    const voteInsert = {
      card_id: 'card-2',
      round_id: 'round-1',
      voter_id: 'player-2',
      bet_tokens: 2,
      challenge_leader: true,
    } satisfies Database['public']['Tables']['votes']['Insert']

    const roomPlayerRow: Database['public']['Tables']['room_players']['Row'] = {
      challenge_leader_used: false,
      corrupted_cards_remaining: 2,
      display_name: 'Player 1',
      generation_tokens: 0,
      id: 'room-player-1',
      intuition_tokens: 2,
      is_active: true,
      is_host: false,
      is_ready: true,
      joined_at: '2026-03-24T19:30:00.000Z',
      player_id: 'player-1',
      room_id: 'room-1',
      score: 0,
      wildcards_remaining: 3,
    }

    expect(cardInsert.risk_clue_profile).toBe('ambush')
    expect(cardInsert.is_corrupted).toBe(false)
    expect(voteInsert.bet_tokens).toBe(2)
    expect(roomPlayerRow.corrupted_cards_remaining).toBe(2)
  })

  test('accepts unified narrator payloads for submit_clue', () => {
    const expected: SubmitClueActionPayload = {
      clue: 'moon',
      card_id: 'card-1',
      risk_clue_profile: 'ambush',
      challenge_leader: true,
    }

    expect(parseSubmitCluePayload(expected)).toEqual(expected)
  })

  test('accepts unified player-card payloads for submit_card', () => {
    const expected: SubmitCardActionPayload = {
      gallery_card_id: 'gallery-1',
      is_corrupted: true,
      challenge_leader: true,
    }

    expect(parseSubmitCardPayload(expected)).toEqual(expected)
  })

  test('accepts unified vote payloads for submit_vote', () => {
    const expected: SubmitVoteActionPayload = {
      card_id: 'card-2',
      bet_tokens: 2,
      challenge_leader: true,
    }

    expect(parseSubmitVotePayload(expected)).toEqual(expected)
  })

  test('allows omitting tactical modifiers and defaults them during parsing', () => {
    const cluePayload: SubmitClueActionPayload = {
      clue: 'mist',
      gallery_card_id: 'gallery-2',
    }
    const cardPayload: SubmitCardActionPayload = {
      card_id: 'card-3',
    }
    const votePayload: SubmitVoteActionPayload = {
      card_id: 'card-4',
    }

    expect(parseSubmitCluePayload(cluePayload)).toEqual({
      clue: 'mist',
      gallery_card_id: 'gallery-2',
      risk_clue_profile: 'normal',
      challenge_leader: false,
    })
    expect(parseSubmitCardPayload(cardPayload)).toEqual({
      card_id: 'card-3',
      is_corrupted: false,
      challenge_leader: false,
    })
    expect(parseSubmitVotePayload(votePayload)).toEqual({
      card_id: 'card-4',
      bet_tokens: 0,
      challenge_leader: false,
    })
  })

  test('rejects clue and card payloads with neither or both selectors', () => {
    expect(() => parseSubmitCluePayload({ clue: 'moon' })).toThrow('INVALID_PAYLOAD')
    expect(() =>
      parseSubmitCluePayload({
        clue: 'moon',
        card_id: 'card-1',
        gallery_card_id: 'gallery-1',
      })
    ).toThrow('INVALID_PAYLOAD')

    expect(() => parseSubmitCardPayload({})).toThrow('INVALID_PAYLOAD')
    expect(() =>
      parseSubmitCardPayload({
        card_id: 'card-1',
        gallery_card_id: 'gallery-1',
      })
    ).toThrow('INVALID_PAYLOAD')
  })
})
