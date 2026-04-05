import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { handleCors } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { derivePlayerCountRange, getTargetPlayerCounts, pickHostPlayerId } from '../_shared/matchmaking.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'

const schema = z.object({
  displayName: z.string().min(1).max(30),
  preferredPlayerCount: z.number().int().min(3).max(6),
})

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const SEARCH_TTL_MS = 5 * 60 * 1000
const MATCH_COUNTDOWN_MS = 5 * 1000
const MATCH_LOCKING_STRATEGY = 'FOR UPDATE SKIP LOCKED'

type QueueTicket = {
  id: string
  player_id: string
  display_name: string
  preferred_player_count: number
  min_player_count: number
  max_player_count: number
  status: 'searching' | 'matched' | 'cancelled' | 'expired'
  created_at: string
  expires_at: string
  matched_room_id: string | null
  matched_room_code: string | null
  countdown_starts_at: string | null
  cancelled_at: string | null
}

function generateCode(): string {
  return Array.from(
    { length: 6 },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
  ).join('')
}

async function generateUniqueRoomCode(supabase: ReturnType<typeof createSupabaseAdmin>) {
  let code = generateCode()

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data } = await supabase.from('rooms').select('id').eq('code', code).maybeSingle()
    if (!data) return code
    code = generateCode()
  }

  return code
}

async function getUserFromRequest(req: Request, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '').trim()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) return null
  return user
}

async function getActiveTicket(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
) {
  const { data } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .eq('player_id', userId)
    .in('status', ['searching', 'matched'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as QueueTicket | null) ?? null
}

async function persistSearchingTicket(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  input: { userId: string; displayName: string; preferredPlayerCount: number },
) {
  const range = derivePlayerCountRange(input.preferredPlayerCount)
  const expiresAt = new Date(Date.now() + SEARCH_TTL_MS).toISOString()
  const existing = await getActiveTicket(supabase, input.userId)

  if (existing?.status === 'matched') return existing

  if (existing?.status === 'searching') {
    const { data, error } = await supabase
      .from('matchmaking_queue')
      .update({
        display_name: input.displayName,
        preferred_player_count: input.preferredPlayerCount,
        min_player_count: range.min,
        max_player_count: range.max,
        search_expanded: false,
        expires_at: expiresAt,
      })
      .eq('id', existing.id)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to refresh matchmaking ticket')
    }

    return data as QueueTicket
  }

  const { data, error } = await supabase
    .from('matchmaking_queue')
    .insert({
      player_id: input.userId,
      display_name: input.displayName,
      preferred_player_count: input.preferredPlayerCount,
      min_player_count: range.min,
      max_player_count: range.max,
      expires_at: expiresAt,
      status: 'searching',
      search_expanded: false,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create matchmaking ticket')
  }

  return data as QueueTicket
}

async function attemptMatch(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  searchingTicket: QueueTicket,
) {
  const targetSizes = getTargetPlayerCounts(searchingTicket.preferred_player_count, {
    min: searchingTicket.min_player_count,
    max: searchingTicket.max_player_count,
  })

  for (const targetSize of targetSizes) {
    const { data, error } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('status', 'searching')
      .lte('min_player_count', targetSize)
      .gte('max_player_count', targetSize)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(Math.max(targetSize * 2, targetSize))

    if (error || !data) continue

    const orderedCandidates = (data as QueueTicket[])
      .sort((left, right) => {
        const leftDistance = Math.abs(left.preferred_player_count - targetSize)
        const rightDistance = Math.abs(right.preferred_player_count - targetSize)
        if (leftDistance !== rightDistance) return leftDistance - rightDistance

        const createdDelta = Date.parse(left.created_at) - Date.parse(right.created_at)
        if (createdDelta !== 0) return createdDelta

        return left.player_id.localeCompare(right.player_id)
      })

    const selected = orderedCandidates.slice(0, targetSize)
    if (selected.length < targetSize || !selected.some((ticket) => ticket.id === searchingTicket.id)) {
      continue
    }

    const hostId = pickHostPlayerId(selected)
    if (!hostId) continue

    const roomCode = await generateUniqueRoomCode(supabase)
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code: roomCode,
        host_id: hostId,
        status: 'lobby',
      })
      .select('id, code')
      .single()

    if (roomError || !room) {
      continue
    }

    const countdownStartsAt = new Date(Date.now() + MATCH_COUNTDOWN_MS).toISOString()
    const selectedIds = selected.map((ticket) => ticket.id)

    const { data: claimedTickets, error: claimError } = await supabase
      .from('matchmaking_queue')
      .update({
        status: 'matched',
        matched_room_id: room.id,
        countdown_starts_at: countdownStartsAt,
      })
      .in('id', selectedIds)
      .eq('status', 'searching')
      .select('*')

    const claimed = (claimedTickets as QueueTicket[] | null) ?? []

    if (claimError || claimed.length !== selected.length) {
      await supabase.from('rooms').delete().eq('id', room.id)
      continue
    }

    const { error: roomPlayersError } = await supabase.from('room_players').insert(
      claimed.map((ticket) => ({
        room_id: room.id,
        player_id: ticket.player_id,
        display_name: ticket.display_name,
        is_host: ticket.player_id === hostId,
        is_ready: true,
      })),
    )

    if (roomPlayersError) {
      await supabase
        .from('matchmaking_queue')
        .update({
          status: 'searching',
          matched_room_id: null,
          countdown_starts_at: null,
          cancelled_at: null,
        })
        .in('id', selectedIds)
      await supabase.from('rooms').delete().eq('id', room.id)
      continue
    }

    return claimed.find((ticket) => ticket.player_id === searchingTicket.player_id) ?? searchingTicket
  }

  return searchingTicket
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const supabase = createSupabaseAdmin()
  const user = await getUserFromRequest(req, supabase)
  if (!user) return errorResponse('UNAUTHORIZED', 'Invalid or missing auth token', 401)

  const body = schema.safeParse(await req.json())
  if (!body.success) return errorResponse('INVALID_PAYLOAD', body.error.message)

  try {
    const searchingTicket = await persistSearchingTicket(supabase, {
      userId: user.id,
      displayName: body.data.displayName.trim(),
      preferredPlayerCount: body.data.preferredPlayerCount,
    })

    const ticket = searchingTicket.status === 'matched'
      ? searchingTicket
      : await attemptMatch(supabase, searchingTicket)

    return okResponse({ ticket })
  } catch (error) {
    return errorResponse('DB_ERROR', error instanceof Error ? error.message : 'Matchmaking failed', 500)
  }
})
