import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const schema = z.object({ code: z.string().length(6) })

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

  const { data: room } = await supabase
    .from('rooms')
    .select('id, status, host_id')
    .eq('code', body.data.code)
    .maybeSingle()
  if (!room) return errorResponse('ROOM_NOT_FOUND', 'Room not found', 404)

  // Mark player inactive
  await supabase
    .from('room_players')
    .update({ is_active: false })
    .eq('room_id', room.id)
    .eq('player_id', user.id)

  // Count remaining active players
  const { count: remaining } = await supabase
    .from('room_players')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)
    .eq('is_active', true)

  const remainingCount = remaining ?? 0

  // End game if no one left or if mid-game with fewer than 3
  if (
    remainingCount === 0 ||
    (room.status === 'playing' && remainingCount < 3)
  ) {
    await supabase
      .from('rooms')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', room.id)
    return okResponse({ ok: true })
  }

  // Transfer host if leaving player was host
  if (room.host_id === user.id && remainingCount > 0) {
    const { data: nextHost } = await supabase
      .from('room_players')
      .select('player_id')
      .eq('room_id', room.id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true })
      .limit(1)
      .single()

    if (nextHost) {
      await supabase
        .from('rooms')
        .update({ host_id: nextHost.player_id })
        .eq('id', room.id)
      await supabase
        .from('room_players')
        .update({ is_host: true })
        .eq('room_id', room.id)
        .eq('player_id', nextHost.player_id)
      await supabase
        .from('room_players')
        .update({ is_host: false })
        .eq('room_id', room.id)
        .eq('player_id', user.id)
    }
  }

  return okResponse({ ok: true })
})
