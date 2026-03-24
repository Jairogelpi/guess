import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { calculateScores } from './scoring.ts'

const schema = z.object({
  roomCode: z.string().length(6),
  action: z.string(),
  payload: z.unknown().optional(),
})

const POINTS_TO_WIN = 30

async function createCardFromGallery(
  sb: SupabaseClient,
  roomId: string,
  roundId: string,
  userId: string,
  galleryCardId: string,
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
  const p = payload as { clue: string; card_id?: string; gallery_card_id?: string }
  if (!p?.clue || (!p?.card_id && !p?.gallery_card_id)) {
    return errorResponse('INVALID_PAYLOAD', 'Missing clue and card selection')
  }

  const { data: room } = await sb.from('rooms').select('id').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  const { data: round } = await sb
    .from('rounds').select('*').eq('room_id', room.id)
    .order('round_number', { ascending: false }).limit(1).single()
  if (!round) return errorResponse('ROUND_NOT_FOUND', 'No active round', 404)
  if (round.narrator_id !== userId) return errorResponse('NOT_YOUR_TURN', 'Not the narrator')
  if (round.status !== 'narrator_turn') return errorResponse('INVALID_STATE', 'Not narrator phase')

  // Verify card belongs to this round and this player
  let cardId = p.card_id ?? null

  if (p.card_id) {
    const { data: card } = await sb
      .from('cards').select('id, player_id').eq('id', p.card_id)
      .eq('round_id', round.id).eq('player_id', userId).single()
    if (!card) return errorResponse('INVALID_CARD', 'Card not found or not yours')

    await sb.from('cards').update({ is_played: true }).eq('id', p.card_id)
  } else if (p.gallery_card_id) {
    const result = await createCardFromGallery(sb, room.id, round.id, userId, p.gallery_card_id)
    if (result.error) return result.error
    cardId = result.cardId
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
  const p = payload as { card_id?: string; gallery_card_id?: string }
  if (!p?.card_id && !p?.gallery_card_id) {
    return errorResponse('INVALID_PAYLOAD', 'Missing card selection')
  }

  const { data: room } = await sb.from('rooms').select('id').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  const { data: round } = await sb
    .from('rounds').select('*').eq('room_id', room.id)
    .order('round_number', { ascending: false }).limit(1).single()
  if (!round) return errorResponse('ROUND_NOT_FOUND', 'No active round', 404)
  if (round.status !== 'players_turn') return errorResponse('INVALID_STATE', 'Not players phase')
  if (round.narrator_id === userId) return errorResponse('NOT_YOUR_TURN', 'Narrator cannot play a card here')

  let cardId = p.card_id ?? null

  if (p.card_id) {
    const { data: card } = await sb
      .from('cards').select('id, player_id').eq('id', p.card_id)
      .eq('round_id', round.id).eq('player_id', userId).single()
    if (!card) return errorResponse('INVALID_CARD', 'Card not found or not yours')

    await sb.from('cards').update({ is_played: true }).eq('id', p.card_id)
  } else if (p.gallery_card_id) {
    const result = await createCardFromGallery(sb, room.id, round.id, userId, p.gallery_card_id)
    if (result.error) return result.error
    cardId = result.cardId
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
  const p = payload as { card_id: string }
  if (!p?.card_id) return errorResponse('INVALID_PAYLOAD', 'Missing card_id')

  const { data: room } = await sb.from('rooms').select('id').eq('code', roomCode).single()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  const { data: round } = await sb
    .from('rounds').select('*').eq('room_id', room.id)
    .order('round_number', { ascending: false }).limit(1).single()
  if (!round) return errorResponse('ROUND_NOT_FOUND', 'No active round', 404)
  if (round.status !== 'voting') return errorResponse('INVALID_STATE', 'Not voting phase')
  if (round.narrator_id === userId) return errorResponse('NOT_YOUR_TURN', 'Narrator cannot vote')

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

  await sb.from('votes').insert({ round_id: round.id, voter_id: userId, card_id: p.card_id })

  // Check if all non-narrators voted
  const { count: nonNarratorCount } = await sb
    .from('room_players').select('id', { count: 'exact', head: true })
    .eq('room_id', room.id).eq('is_active', true).neq('player_id', round.narrator_id)

  const { count: voteCount } = await sb
    .from('votes').select('id', { count: 'exact', head: true }).eq('round_id', round.id)

  if ((voteCount ?? 0) >= (nonNarratorCount ?? 0)) {
    // Tally scores
    const { data: allPlayers } = await sb
      .from('room_players').select('player_id').eq('room_id', room.id).eq('is_active', true)
    const { data: allVotes } = await sb
      .from('votes').select('voter_id, card_id').eq('round_id', round.id)
    const { data: playedCards } = await sb
      .from('cards').select('id, player_id').eq('round_id', round.id).eq('is_played', true)

    if (allPlayers && allVotes && playedCards) {
      const scoreEntries = calculateScores({
        narratorId: round.narrator_id,
        players: allPlayers.map((p) => p.player_id),
        votes: allVotes,
        playedCards,
      })

      // Insert round_scores
      await sb.from('round_scores').insert(
        scoreEntries.map((e) => ({ ...e, round_id: round.id })),
      )

      // Update cumulative scores in room_players
      const scoreByPlayer = new Map<string, number>()
      for (const e of scoreEntries) {
        scoreByPlayer.set(e.player_id, (scoreByPlayer.get(e.player_id) ?? 0) + e.points)
      }
      for (const [playerId, delta] of scoreByPlayer.entries()) {
        const { data: rp } = await sb
          .from('room_players').select('score').eq('room_id', room.id)
          .eq('player_id', playerId).single()
        if (rp) {
          await sb.from('room_players')
            .update({ score: rp.score + delta })
            .eq('room_id', room.id).eq('player_id', playerId)
        }
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
    const internalUrl = Deno.env.get('SUPABASE_URL')
    return errorResponse(
      'UNAUTHORIZED', 
      `${authError?.message || 'Invalid token'} (Token start: ${token.substring(0, 10)}... | Func URL: ${internalUrl})`, 
      401
    )
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
    default: return errorResponse('INVALID_ACTION', 'Unknown action')
  }
})
