import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { calculateScores } from './scoring.ts'
import { buildRoundResolutionSummary } from './roundSummary.ts'
import {
  applyChallengeLeaderBonuses,
  applyIntuitionChanges,
  getSoloLeaderId,
} from './competitiveResolution.ts'
import {
  TacticalPayloadError,
  assertChallengeLeaderAvailable,
  assertSufficientIntuitionTokens,
  parseSubmitCardPayload,
  parseSubmitCluePayload,
  parseSubmitVotePayload,
} from './tacticalPayloads.ts'

const schema = z.object({
  roomCode: z.string().length(6),
  action: z.string(),
  payload: z.unknown().optional(),
})

const POINTS_TO_WIN = 30
const BASE_INCOME = 1
const MAX_INTUITION_TOKENS = 10
const SNIPER_TOKEN_COST = 1
const NARROW_TOKEN_COST = 1
const AMBUSH_TOKEN_COST = 2
const CORRUPTED_CARD_TOKEN_COST = 1
const CHALLENGE_LEADER_TOKEN_COST = 1

function getInterest(bank: number) {
  if (bank >= 8) return 2
  if (bank >= 5) return 1
  return 0
}

function getPositionBonuses(scoresAfter: Record<string, number>, playerIds: string[]) {
  const sortedPlayerIds = [...playerIds].sort((left, right) => {
    const scoreDelta = (scoresAfter[right] ?? 0) - (scoresAfter[left] ?? 0)
    if (scoreDelta !== 0) return scoreDelta
    return left.localeCompare(right)
  })

  const maxRankIndex = Math.max(sortedPlayerIds.length - 1, 1)
  const bonuses: Record<string, number> = {}

  for (let index = 0; index < sortedPlayerIds.length; ) {
    const groupScore = scoresAfter[sortedPlayerIds[index]!] ?? 0
    let groupEnd = index + 1
    while (
      groupEnd < sortedPlayerIds.length &&
      (scoresAfter[sortedPlayerIds[groupEnd]!] ?? 0) === groupScore
    ) {
      groupEnd += 1
    }

    const percentile = sortedPlayerIds.length === 1 ? 0 : index / maxRankIndex
    const bonus = percentile <= 0.25 ? 1 : 0

    for (let cursor = index; cursor < groupEnd; cursor += 1) {
      bonuses[sortedPlayerIds[cursor]!] = bonus
    }

    index = groupEnd
  }

  return bonuses
}

function buildTokenSnapshots({
  playersBefore,
  scoresAfter,
  spentByPlayer,
}: {
  playersBefore: Array<{ player_id: string; intuition_tokens: number }>
  scoresAfter: Record<string, number>
  spentByPlayer: Record<string, number>
}) {
  const positionBonuses = getPositionBonuses(
    scoresAfter,
    playersBefore.map((player) => player.player_id),
  )

  const tokenSnapshots = Object.fromEntries(
    playersBefore.map((player) => {
      const interest = getInterest(player.intuition_tokens)
      const position = positionBonuses[player.player_id] ?? 1
      const totalIncome = BASE_INCOME + position + interest
      const spent = spentByPlayer[player.player_id] ?? 0
      return [
        player.player_id,
        {
          spent,
          base: BASE_INCOME,
          position,
          interest,
          total: totalIncome - spent,
        },
      ]
    }),
  )

  const nextTokensByPlayer = Object.fromEntries(
    playersBefore.map((player) => {
      const snapshot = tokenSnapshots[player.player_id]!
      return [
        player.player_id,
        Math.max(
          0,
          Math.min(
            MAX_INTUITION_TOKENS,
            player.intuition_tokens + snapshot.base + snapshot.position + snapshot.interest,
          ),
        ),
      ]
    }),
  )

  return { tokenSnapshots, nextTokensByPlayer }
}

function getSubmitSpendCost(input: {
  risk_clue_profile?: 'normal' | 'sniper' | 'narrow' | 'ambush'
  is_corrupted?: boolean
  bet_tokens?: 0 | 1 | 2
  challenge_leader?: boolean
}) {
  const riskCost = input.risk_clue_profile === 'sniper'
    ? SNIPER_TOKEN_COST
    : input.risk_clue_profile === 'narrow'
    ? NARROW_TOKEN_COST
    : input.risk_clue_profile === 'ambush'
    ? AMBUSH_TOKEN_COST
    : 0

  return riskCost +
    (input.is_corrupted ? CORRUPTED_CARD_TOKEN_COST : 0) +
    (input.bet_tokens ?? 0) +
    (input.challenge_leader ? CHALLENGE_LEADER_TOKEN_COST : 0)
}

async function createCardFromGallery(
  sb: SupabaseClient,
  roomId: string,
  roundId: string,
  userId: string,
  galleryCardId: string,
  options: {
    risk_clue_profile?: 'normal' | 'sniper' | 'narrow' | 'ambush'
    is_corrupted?: boolean
    challenge_leader: boolean
  },
) {
  const { data: roomPlayer } = await sb
    .from('room_players')
    .select('wildcards_remaining, generation_tokens')
    .eq('room_id', roomId)
    .eq('player_id', userId)
    .single()

  if (!roomPlayer) {
    return { error: errorResponse('PLAYER_NOT_FOUND', 'Player not found') }
  }

  if (roomPlayer.wildcards_remaining <= 0) {
    return { error: errorResponse('NO_WILDCARDS_LEFT', 'No wildcards remaining') }
  }

  if (roomPlayer.generation_tokens < 2) {
    return { error: errorResponse('NO_TOKENS_LEFT', 'Not enough generation tokens (Wildcard costs 2)') }
  }

  const { data: galleryCard } = await sb
    .from('gallery_cards')
    .select('id, image_url, prompt')
    .eq('id', galleryCardId)
    .eq('player_id', userId)
    .single()

  if (!galleryCard) {
    return { error: errorResponse('INVALID_GALLERY_CARD', 'Gallery card not found') }
  }

  const { data: insertedCard, error: insertError } = await sb
    .from('cards')
    .insert({
      round_id: roundId,
      player_id: userId,
      image_url: galleryCard.image_url,
      prompt: galleryCard.prompt,
      is_played: true,
      risk_clue_profile: options.risk_clue_profile ?? 'normal',
      is_corrupted: options.is_corrupted === true,
      challenge_leader: options.challenge_leader,
    })
    .select('id')
    .single()

  if (insertError || !insertedCard) {
    return { error: errorResponse('INVALID_CARD', 'Could not create round card') }
  }

  const { error: updateError } = await sb
    .from('room_players')
    .update({ 
      wildcards_remaining: roomPlayer.wildcards_remaining - 1,
      generation_tokens: roomPlayer.generation_tokens - 2
    })
    .eq('room_id', roomId)
    .eq('player_id', userId)

  if (updateError) {
    await sb.from('cards').delete().eq('id', insertedCard.id)
    return { error: errorResponse('DB_ERROR', 'Could not spend wildcard tokens') }
  }

  return { cardId: insertedCard.id }
}

function toActionError(error: unknown) {
  if (error instanceof TacticalPayloadError) {
    switch (error.code) {
      case 'INVALID_TACTICAL_ACTION':
        return errorResponse(error.code, 'Tactical action is not available here')
      case 'NOT_ENOUGH_INTUITION_TOKENS':
        return errorResponse(error.code, 'Not enough intuition tokens')
      case 'CHALLENGE_LEADER_UNAVAILABLE':
        return errorResponse(error.code, 'Challenge the leader is not available')
      case 'INTUITION_TOKEN_REQUIRED':
        return errorResponse(error.code, 'Firm Read requires spending one intuition token')
      case 'INTUITION_TOKEN_INVALID':
        return errorResponse(error.code, 'Cannot spend intuition without Firm Read')
      default:
        return errorResponse(error.code, 'Invalid tactical payload')
    }
  }

  if (error instanceof Error) {
    return errorResponse('INVALID_PAYLOAD', error.message)
  }

  return errorResponse('INVALID_PAYLOAD', 'Invalid payload')
}

async function handleStartGame(sb: SupabaseClient, userId: string, roomCode: string) {
  const { data: room } = await sb
    .from('rooms').select('id, status, host_id').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)
  if (room.host_id !== userId) return errorResponse('NOT_HOST', 'Only the host can start')
  if (room.status !== 'lobby') return errorResponse('INVALID_STATE', 'Game already started')

  const { data: activePlayers } = await sb
    .from('room_players').select('player_id, joined_at, is_host, is_ready')
    .eq('room_id', room.id).eq('is_active', true)
    .order('joined_at', { ascending: true })
  if (!activePlayers || activePlayers.length < 3) {
    return errorResponse('MIN_PLAYERS_REQUIRED', 'Need at least 3 players')
  }

  const waitingGuests = activePlayers.filter((player) => !player.is_host && !player.is_ready)
  if (waitingGuests.length > 0) {
    return errorResponse('PLAYERS_NOT_READY', 'All non-host players must be ready')
  }

  const narratorOrder = activePlayers.map((p) => p.player_id)

  await sb.from('rooms').update({
    status: 'playing',
    narrator_order: narratorOrder,
  }).eq('id', room.id)

  await sb.from('rounds').insert({
    room_id: room.id,
    round_number: 1,
    narrator_id: narratorOrder[0],
    status: 'narrator_turn',
    phase_started_at: new Date().toISOString(),
  })

  return okResponse({ ok: true })
}

async function handleSetReady(
  sb: SupabaseClient,
  userId: string,
  roomCode: string,
  payload: unknown,
) {
  const p = payload as { ready?: boolean }
  if (typeof p?.ready !== 'boolean') {
    return errorResponse('INVALID_PAYLOAD', 'Missing ready boolean')
  }

  const { data: room } = await sb
    .from('rooms')
    .select('id, status, host_id')
    .eq('code', roomCode)
    .single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)
  if (room.status !== 'lobby') return errorResponse('INVALID_STATE', 'Room is not in lobby')
  if (room.host_id === userId) {
    return errorResponse('INVALID_STATE', 'Host readiness is implicit')
  }

  const { data: player } = await sb
    .from('room_players')
    .select('id')
    .eq('room_id', room.id)
    .eq('player_id', userId)
    .eq('is_active', true)
    .maybeSingle()

  if (!player) return errorResponse('ROOM_NOT_FOUND', 'Active room player not found', 404)

  const { error } = await sb
    .from('room_players')
    .update({ is_ready: p.ready })
    .eq('id', player.id)

  if (error) return errorResponse('DB_ERROR', error.message, 500)

  return okResponse({ ok: true })
}

async function handleSubmitClue(
  sb: SupabaseClient,
  userId: string,
  roomCode: string,
  payload: unknown,
) {
  let p
  try {
    p = parseSubmitCluePayload(payload)
  } catch (error) {
    return toActionError(error)
  }

  const { data: room } = await sb.from('rooms').select('id').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  const { data: round } = await sb
    .from('rounds').select('*').eq('room_id', room.id)
    .order('round_number', { ascending: false }).limit(1).single()
  if (!round) return errorResponse('ROUND_NOT_FOUND', 'No active round', 404)
  if (round.narrator_id !== userId) return errorResponse('NOT_YOUR_TURN', 'Not the narrator')
  if (round.status !== 'narrator_turn') return errorResponse('INVALID_STATE', 'Not narrator phase')

  const { data: roomPlayers } = await sb
    .from('room_players')
    .select('player_id, score, intuition_tokens, challenge_leader_used')
    .eq('room_id', room.id)
    .eq('is_active', true)
  const currentPlayer = roomPlayers?.find((player) => player.player_id === userId)
  if (!currentPlayer) return errorResponse('ROOM_NOT_FOUND', 'Active room player not found', 404)

  try {
    assertSufficientIntuitionTokens(
      currentPlayer.intuition_tokens,
      getSubmitSpendCost({
        risk_clue_profile: p.risk_clue_profile,
        challenge_leader: p.challenge_leader,
      }),
    )
    assertChallengeLeaderAvailable(
      p.challenge_leader,
      getSoloLeaderId((roomPlayers ?? []).map((player) => ({
        player_id: player.player_id,
        score: player.score,
      }))),
      userId,
      currentPlayer.challenge_leader_used,
    )
  } catch (error) {
    return toActionError(error)
  }

  // Verify card belongs to this round and this player
  let cardId = p.card_id ?? null

  if (p.card_id) {
    const { data: card } = await sb
      .from('cards').select('id, player_id').eq('id', p.card_id)
      .eq('round_id', round.id).eq('player_id', userId).single()
    if (!card) return errorResponse('INVALID_CARD', 'Card not found or not yours')

    await sb.from('cards').update({
      is_played: true,
      risk_clue_profile: p.risk_clue_profile,
      challenge_leader: p.challenge_leader,
    }).eq('id', p.card_id)
  } else if (p.gallery_card_id) {
    const result = await createCardFromGallery(
      sb,
      room.id,
      round.id,
      userId,
      p.gallery_card_id,
      {
        risk_clue_profile: p.risk_clue_profile,
        challenge_leader: p.challenge_leader,
      },
    )
    if (result.error) return result.error
    cardId = result.cardId
  }

  const spendCost = getSubmitSpendCost({
    risk_clue_profile: p.risk_clue_profile,
    challenge_leader: p.challenge_leader,
  })

  if (spendCost > 0 || p.challenge_leader) {
    const updateQuery = sb
      .from('room_players')
      .update({
        intuition_tokens: currentPlayer.intuition_tokens - spendCost,
        challenge_leader_used: p.challenge_leader ? true : currentPlayer.challenge_leader_used,
      })
      .eq('room_id', room.id)
      .eq('player_id', userId)
    const { data: updatedRows } = spendCost > 0
      ? await updateQuery.gte('intuition_tokens', spendCost).select('id')
      : await updateQuery.select('id')
    if (spendCost > 0 && (!updatedRows || updatedRows.length === 0)) {
      return errorResponse('NOT_ENOUGH_INTUITION_TOKENS', 'Insufficient tokens', 400)
    }
  }

  await sb.from('rounds').update({
    clue: p.clue,
    status: 'players_turn',
    phase_started_at: new Date().toISOString()
  }).eq('id', round.id)

  return okResponse({ ok: true, cardId })
}

async function handleSubmitCard(
  sb: SupabaseClient,
  userId: string,
  roomCode: string,
  payload: unknown,
) {
  let p
  try {
    p = parseSubmitCardPayload(payload)
  } catch (error) {
    return toActionError(error)
  }

  const { data: room } = await sb.from('rooms').select('id').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  const { data: round } = await sb
    .from('rounds').select('*').eq('room_id', room.id)
    .order('round_number', { ascending: false }).limit(1).single()
  if (!round) return errorResponse('ROUND_NOT_FOUND', 'No active round', 404)
  if (round.status !== 'players_turn') return errorResponse('INVALID_STATE', 'Not players phase')
  if (round.narrator_id === userId) return errorResponse('NOT_YOUR_TURN', 'Narrator cannot play a card here')

  const { data: roomPlayers } = await sb
    .from('room_players')
    .select('player_id, score, intuition_tokens, challenge_leader_used, corrupted_cards_remaining')
    .eq('room_id', room.id)
    .eq('is_active', true)
  const currentPlayer = roomPlayers?.find((player) => player.player_id === userId)
  if (!currentPlayer) return errorResponse('ROOM_NOT_FOUND', 'Active room player not found', 404)

  try {
    if (p.is_corrupted && currentPlayer.corrupted_cards_remaining <= 0) {
      return errorResponse('NO_CORRUPTED_CARDS_LEFT', 'No corrupted cards remaining')
    }
    assertSufficientIntuitionTokens(
      currentPlayer.intuition_tokens,
      getSubmitSpendCost({
        is_corrupted: p.is_corrupted,
        challenge_leader: p.challenge_leader,
      }),
    )
    assertChallengeLeaderAvailable(
      p.challenge_leader,
      getSoloLeaderId((roomPlayers ?? []).map((player) => ({
        player_id: player.player_id,
        score: player.score,
      }))),
      userId,
      currentPlayer.challenge_leader_used,
    )
  } catch (error) {
    return toActionError(error)
  }

  let cardId = p.card_id ?? null

  if (p.card_id) {
    const { data: card } = await sb
      .from('cards').select('id, player_id').eq('id', p.card_id)
      .eq('round_id', round.id).eq('player_id', userId).single()
    if (!card) return errorResponse('INVALID_CARD', 'Card not found or not yours')

    await sb.from('cards').update({
      is_played: true,
      is_corrupted: p.is_corrupted,
      challenge_leader: p.challenge_leader,
    }).eq('id', p.card_id)
  } else if (p.gallery_card_id) {
    const result = await createCardFromGallery(
      sb,
      room.id,
      round.id,
      userId,
      p.gallery_card_id,
      {
        is_corrupted: p.is_corrupted,
        challenge_leader: p.challenge_leader,
      },
    )
    if (result.error) return result.error
    cardId = result.cardId
  }

  const spendCost = getSubmitSpendCost({
    is_corrupted: p.is_corrupted,
    challenge_leader: p.challenge_leader,
  })

  if (spendCost > 0 || p.challenge_leader || p.is_corrupted) {
    let updateQuery = sb
      .from('room_players')
      .update({
        intuition_tokens: currentPlayer.intuition_tokens - spendCost,
        challenge_leader_used: p.challenge_leader ? true : currentPlayer.challenge_leader_used,
        corrupted_cards_remaining: p.is_corrupted
          ? currentPlayer.corrupted_cards_remaining - 1
          : currentPlayer.corrupted_cards_remaining,
      })
      .eq('room_id', room.id)
      .eq('player_id', userId)
    if (spendCost > 0) updateQuery = updateQuery.gte('intuition_tokens', spendCost)
    if (p.is_corrupted) updateQuery = updateQuery.gte('corrupted_cards_remaining', 1)
    const { data: updatedRows } = await updateQuery.select('id')
    if (spendCost > 0 && (!updatedRows || updatedRows.length === 0)) {
      return errorResponse('NOT_ENOUGH_INTUITION_TOKENS', 'Insufficient tokens', 400)
    }
  }

  // Count active non-narrator players vs played non-narrator cards
  const { count: activeNonNarrators } = await sb
    .from('room_players').select('id', { count: 'exact', head: true })
    .eq('room_id', room.id).eq('is_active', true)
    .neq('player_id', round.narrator_id)

  const { count: playedCards } = await sb
    .from('cards').select('id', { count: 'exact', head: true })
    .eq('round_id', round.id).eq('is_played', true)
    .neq('player_id', round.narrator_id)

  if ((playedCards ?? 0) >= (activeNonNarrators ?? 0)) {
    await sb.from('rounds').update({ 
      status: 'voting',
      phase_started_at: new Date().toISOString()
    }).eq('id', round.id)
  }

  return okResponse({ ok: true, cardId })
}

async function handleSubmitVote(
  sb: SupabaseClient,
  userId: string,
  roomCode: string,
  payload: unknown,
) {
  let p
  try {
    p = parseSubmitVotePayload(payload)
  } catch (error) {
    return toActionError(error)
  }

  const { data: room } = await sb.from('rooms').select('id').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  const { data: round } = await sb
    .from('rounds').select('*').eq('room_id', room.id)
    .order('round_number', { ascending: false }).limit(1).single()
  if (!round) return errorResponse('ROUND_NOT_FOUND', 'No active round', 404)
  if (round.status !== 'voting') return errorResponse('INVALID_STATE', 'Not voting phase')
  if (round.narrator_id === userId) return errorResponse('NOT_YOUR_TURN', 'Narrator cannot vote')

  const { data: roomPlayers } = await sb
    .from('room_players')
    .select('player_id, score, intuition_tokens, challenge_leader_used')
    .eq('room_id', room.id)
    .eq('is_active', true)
  const currentPlayer = roomPlayers?.find((player) => player.player_id === userId)
  if (!currentPlayer) return errorResponse('ROOM_NOT_FOUND', 'Active room player not found', 404)

  try {
    assertSufficientIntuitionTokens(
      currentPlayer.intuition_tokens,
      getSubmitSpendCost({
        bet_tokens: p.bet_tokens,
        challenge_leader: p.challenge_leader,
      }),
    )
    assertChallengeLeaderAvailable(
      p.challenge_leader,
      getSoloLeaderId((roomPlayers ?? []).map((player) => ({
        player_id: player.player_id,
        score: player.score,
      }))),
      userId,
      currentPlayer.challenge_leader_used,
    )
  } catch (error) {
    return toActionError(error)
  }

  // Prevent duplicate vote
  const { data: existing } = await sb
    .from('votes').select('id').eq('round_id', round.id).eq('voter_id', userId).maybeSingle()
  if (existing) return errorResponse('ALREADY_VOTED', 'Already voted this round')

  // Verify card is a played card in this round (cannot vote own card)
  const { data: card } = await sb
    .from('cards').select('id, player_id').eq('id', p.card_id)
    .eq('round_id', round.id).eq('is_played', true).single()
  if (!card) return errorResponse('INVALID_CARD', 'Card not in this round')
  if (card.player_id === userId) return errorResponse('INVALID_CARD', 'Cannot vote for your own card')

  await sb.from('votes').insert({
    round_id: round.id,
    voter_id: userId,
    card_id: p.card_id,
    bet_tokens: p.bet_tokens,
    challenge_leader: p.challenge_leader,
  })

  const spendCost = getSubmitSpendCost({
    bet_tokens: p.bet_tokens,
    challenge_leader: p.challenge_leader,
  })

  if (spendCost > 0 || p.challenge_leader) {
    const updateQuery = sb
      .from('room_players')
      .update({
        intuition_tokens: currentPlayer.intuition_tokens - spendCost,
        challenge_leader_used: p.challenge_leader ? true : currentPlayer.challenge_leader_used,
      })
      .eq('room_id', room.id)
      .eq('player_id', userId)
    const { data: updatedRows } = spendCost > 0
      ? await updateQuery.gte('intuition_tokens', spendCost).select('id')
      : await updateQuery.select('id')
    if (spendCost > 0 && (!updatedRows || updatedRows.length === 0)) {
      return errorResponse('NOT_ENOUGH_INTUITION_TOKENS', 'Insufficient tokens', 400)
    }
  }

  // Check if all non-narrators voted
  const { count: nonNarratorCount } = await sb
    .from('room_players').select('id', { count: 'exact', head: true })
    .eq('room_id', room.id).eq('is_active', true).neq('player_id', round.narrator_id)

  const { count: voteCount } = await sb
    .from('votes').select('id', { count: 'exact', head: true }).eq('round_id', round.id)

  if ((voteCount ?? 0) >= (nonNarratorCount ?? 0)) {
    // Tally scores
    const { data: allPlayers } = await sb
      .from('room_players')
      .select('player_id, score, intuition_tokens')
      .eq('room_id', room.id)
      .eq('is_active', true)
    const { data: allVotes } = await sb
      .from('votes')
      .select('voter_id, card_id, bet_tokens, challenge_leader')
      .eq('round_id', round.id)
    const { data: playedCards } = await sb
      .from('cards')
      .select('id, player_id, risk_clue_profile, is_corrupted, challenge_leader')
      .eq('round_id', round.id)
      .eq('is_played', true)

    if (allPlayers && allVotes && playedCards) {
      const baseScoreEntries = calculateScores({
        narratorId: round.narrator_id,
        players: allPlayers.map((p) => p.player_id),
        activePlayers: allPlayers.map((p) => p.player_id),
        votes: allVotes,
        playedCards,
      })
      const challengeEntries = applyChallengeLeaderBonuses({
        scoresBefore: allPlayers.map((player) => ({
          player_id: player.player_id,
          score: player.score,
        })),
        scoreEntries: baseScoreEntries,
        playedCards,
        votes: allVotes,
      })
      const scoreEntries = [...baseScoreEntries, ...challengeEntries]

      // Insert round_scores
      await sb.from('round_scores').insert(
        scoreEntries.map((e) => ({ ...e, round_id: round.id })),
      )

      // Update cumulative scores in room_players
      const scoresBefore = Object.fromEntries(
        allPlayers.map((player) => [player.player_id, player.score]),
      )
      const scoreByPlayer = new Map<string, number>()
      for (const e of scoreEntries) {
        scoreByPlayer.set(e.player_id, (scoreByPlayer.get(e.player_id) ?? 0) + e.points)
      }
      for (const [playerId, delta] of scoreByPlayer.entries()) {
        await sb.from('room_players')
          .update({ score: (scoresBefore[playerId] ?? 0) + delta })
          .eq('room_id', room.id).eq('player_id', playerId)
      }

      const narratorCard = playedCards.find((playedCard) => playedCard.player_id === round.narrator_id)
      if (narratorCard) {
        const scoresAfter = Object.fromEntries(
          allPlayers.map((player) => [
            player.player_id,
            (scoresBefore[player.player_id] ?? 0) + (scoreByPlayer.get(player.player_id) ?? 0),
          ]),
        )
        const spentByPlayer = Object.fromEntries(
          allPlayers.map((player) => [player.player_id, 0]),
        )

        for (const playedCard of playedCards) {
          if (playedCard.player_id === round.narrator_id) {
            const narratorRiskSpend = playedCard.risk_clue_profile === 'sniper'
              ? SNIPER_TOKEN_COST
              : playedCard.risk_clue_profile === 'narrow'
              ? NARROW_TOKEN_COST
              : playedCard.risk_clue_profile === 'ambush'
              ? AMBUSH_TOKEN_COST
              : 0
            spentByPlayer[playedCard.player_id] =
              (spentByPlayer[playedCard.player_id] ?? 0) + narratorRiskSpend
          }
          if (playedCard.player_id !== round.narrator_id && playedCard.is_corrupted) {
            spentByPlayer[playedCard.player_id] =
              (spentByPlayer[playedCard.player_id] ?? 0) + CORRUPTED_CARD_TOKEN_COST
          }
          if (playedCard.challenge_leader) {
            spentByPlayer[playedCard.player_id] =
              (spentByPlayer[playedCard.player_id] ?? 0) + CHALLENGE_LEADER_TOKEN_COST
          }
        }

        for (const vote of allVotes) {
          spentByPlayer[vote.voter_id] =
            (spentByPlayer[vote.voter_id] ?? 0) + Number(vote.bet_tokens ?? 0)
          if (vote.challenge_leader) {
            spentByPlayer[vote.voter_id] =
              (spentByPlayer[vote.voter_id] ?? 0) + CHALLENGE_LEADER_TOKEN_COST
          }
        }

        const playersBeforeIncome = allPlayers.map((player) => ({
          player_id: player.player_id,
          intuition_tokens: player.intuition_tokens,
        }))
        const nextTokensByPlayer = applyIntuitionChanges({
          playersBefore: playersBeforeIncome,
          scoresAfter,
        })
        const { tokenSnapshots } = buildTokenSnapshots({
          playersBefore: playersBeforeIncome,
          scoresAfter,
          spentByPlayer,
        })

        for (const [playerId, intuitionTokens] of Object.entries(nextTokensByPlayer)) {
          await sb.from('room_players')
            .update({ intuition_tokens: intuitionTokens })
            .eq('room_id', room.id)
            .eq('player_id', playerId)
        }

        const summary = buildRoundResolutionSummary({
          roundId: round.id,
          narratorId: round.narrator_id,
          narratorCardId: narratorCard.id,
          clue: round.clue,
          votes: allVotes,
          playedCards,
          scoreEntries,
          scoresBefore,
          scoresAfter,
          tokenSnapshots,
        })

        await sb.from('round_resolution_summaries').upsert({
          round_id: round.id,
          summary,
        })
      }

      await sb.from('rounds').update({ status: 'results', results_started_at: new Date().toISOString() }).eq('id', round.id)
    }
  }

  return okResponse({ ok: true })
}

async function handleNextRound(sb: SupabaseClient, _userId: string, roomCode: string) {
  const { data: room } = await sb
    .from('rooms').select('id, narrator_order, max_rounds, status').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  const { data: round } = await sb
    .from('rounds').select('*').eq('room_id', room.id)
    .order('round_number', { ascending: false }).limit(1).single()
  if (!round) return errorResponse('ROUND_NOT_FOUND', 'No active round', 404)

  // Idempotent — if not in results phase, return OK (already transitioned)
  if (round.status !== 'results') return okResponse({ ok: true })

  // Check game over conditions
  const { data: players } = await sb
    .from('room_players').select('score').eq('room_id', room.id).eq('is_active', true)

  const maxScore = Math.max(...(players?.map((p) => p.score) ?? [0]))
  const gameOver =
    maxScore >= POINTS_TO_WIN || round.round_number >= room.max_rounds

  if (gameOver) {
    await sb.from('rooms')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        ended_reason: 'room_finished',
        ended_by: null,
      })
      .eq('id', room.id)
    return okResponse({ ok: true })
  }

  const nextRoundNumber = round.round_number + 1
  const narratorOrder = room.narrator_order as string[]
  const nextNarrator = narratorOrder[(nextRoundNumber - 1) % narratorOrder.length]

  await sb.from('rounds').insert({
    room_id: room.id,
    round_number: nextRoundNumber,
    narrator_id: nextNarrator,
    status: 'narrator_turn',
    phase_started_at: new Date().toISOString(),
  })

  return okResponse({ ok: true })
}

async function handleInsertCard(
  sb: SupabaseClient,
  userId: string,
  roomCode: string,
  payload: unknown,
) {
  const raw = (payload ?? {}) as { imageUrl?: unknown; prompt?: unknown }
  const imageUrl = typeof raw.imageUrl === 'string' ? raw.imageUrl.trim() : ''
  const prompt = typeof raw.prompt === 'string' ? raw.prompt.trim() : ''
  if (!imageUrl || !prompt) return errorResponse('INVALID_PAYLOAD', 'imageUrl and prompt required')

  const { data: room } = await sb.from('rooms').select('id').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  const { data: player } = await sb
    .from('room_players').select('id')
    .eq('room_id', room.id).eq('player_id', userId).eq('is_active', true).single()
  if (!player) return errorResponse('NOT_IN_ROOM', 'Player not in room', 403)

  const { data: round } = await sb
    .from('rounds').select('id, status')
    .eq('room_id', room.id).order('round_number', { ascending: false }).limit(1).single()
  if (!round) return errorResponse('ROUND_NOT_FOUND', 'No active round', 404)
  if (!['narrator_turn', 'players_turn'].includes(round.status)) {
    return errorResponse('INVALID_STATE', 'Round is not accepting cards')
  }

  const { data: card, error } = await sb
    .from('cards')
    .insert({ round_id: round.id, player_id: userId, image_url: imageUrl, prompt })
    .select('id').single()
  if (error) {
    if (error.message.includes('NO_TOKENS_LEFT')) {
      return errorResponse('NO_TOKENS_LEFT', 'Not enough generation tokens', 400)
    }
    return errorResponse('DB_ERROR', error.message, 500)
  }

  return okResponse({ cardId: card.id })
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return errorResponse('UNAUTHORIZED', 'Missing auth', 401)

  const token = authHeader.replace('Bearer ', '').trim()
  const { data: { user }, error: authError } = await sb.auth.getUser(token)
  
  if (authError || !user) {
    return errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401)
  }

  const body = schema.safeParse(await req.json())
  if (!body.success) return errorResponse('INVALID_PAYLOAD', body.error.message)

  const { roomCode, action, payload } = body.data

  switch (action) {
    case 'start_game': return handleStartGame(sb, user.id, roomCode)
    case 'set_ready': return handleSetReady(sb, user.id, roomCode, payload)
    case 'submit_clue': return handleSubmitClue(sb, user.id, roomCode, payload)
    case 'submit_card': return handleSubmitCard(sb, user.id, roomCode, payload)
    case 'submit_vote': return handleSubmitVote(sb, user.id, roomCode, payload)
    case 'next_round': return handleNextRound(sb, user.id, roomCode)
    case 'insert_card': return handleInsertCard(sb, user.id, roomCode, payload)
    default: return errorResponse('INVALID_ACTION', 'Unknown action')
  }
})
