import { handleCors } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'

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

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const supabase = createSupabaseAdmin()
  const user = await getUserFromRequest(req, supabase)
  if (!user) return errorResponse('UNAUTHORIZED', 'Invalid or missing auth token', 401)

  const { error } = await supabase
    .from('matchmaking_queue')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      matched_room_id: null,
      countdown_starts_at: null,
    })
    .eq('player_id', user.id)
    .eq('status', 'searching')

  if (error) return errorResponse('DB_ERROR', error.message, 500)

  return okResponse({ ok: true })
})
