import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const schema = z.object({ displayName: z.string().min(1).max(30) })

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateCode(): string {
  return Array.from(
    { length: 6 },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
  ).join('')
}

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

  // Generate unique room code
  let code = generateCode()
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from('rooms').select('id').eq('code', code).maybeSingle()
    if (!data) break
    code = generateCode()
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({ code, host_id: user.id, status: 'lobby' })
    .select('id')
    .single()
  if (roomError || !room) return errorResponse('DB_ERROR', roomError?.message ?? 'insert failed', 500)

  const { error: playerError } = await supabase.from('room_players').insert({
    room_id: room.id,
    player_id: user.id,
    display_name: body.data.displayName,
    is_host: true,
  })
  if (playerError) return errorResponse('DB_ERROR', playerError.message, 500)

  return okResponse({ code })
})
