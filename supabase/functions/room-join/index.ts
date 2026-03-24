import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, corsHeaders } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const schema = z.object({
  code: z.string().length(6),
  displayName: z.string().min(1).max(30),
})

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return errorResponse('UNAUTHORIZED', 'Missing auth', 401)

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', ''),
  )
  if (authError || !user) return errorResponse('UNAUTHORIZED', 'Invalid token', 401)

  const body = schema.safeParse(await req.json())
  if (!body.success) return errorResponse('INVALID_PAYLOAD', body.error.message)

  // Fetch room
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id, status')
    .eq('code', body.data.code)
    .maybeSingle()
  if (roomError || !room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)
  if (room.status !== 'lobby') return errorResponse('INVALID_STATE', 'Room is not in lobby')

  // Check capacity (max 8 players)
  const { count } = await supabase
    .from('room_players')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .eq('is_active', true)
  if ((count ?? 0) >= 8) return errorResponse('ROOM_FULL', 'Room is full')

  // Check not already in room
  const { data: existing } = await supabase
    .from('room_players')
    .select('id, is_active')
    .eq('room_id', room.id)
    .eq('player_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.is_active) return okResponse({ ok: true }) // already in room, idempotent
    // Rejoin
    await supabase
      .from('room_players')
      .update({ is_active: true, display_name: body.data.displayName, is_ready: false })
      .eq('id', existing.id)
    return okResponse({ ok: true })
  }

  const { error: insertError } = await supabase.from('room_players').insert({
    room_id: room.id,
    player_id: user.id,
    display_name: body.data.displayName,
    is_host: false,
    is_ready: false,
  })
  if (insertError) return errorResponse('DB_ERROR', insertError.message, 500)

  return okResponse({ ok: true })
})
