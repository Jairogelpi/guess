import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const cronSecret = Deno.env.get('CLEANUP_TEMP_IMAGES_CRON_SECRET')
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return errorResponse('UNAUTHORIZED', 'Invalid cron secret', 401)
  }

  const supabase = createSupabaseAdmin()

  const { data: expiredAssets, error } = await supabase
    .from('temporary_generation_assets')
    .select('id, bucket_id, object_path')
    .is('deleted_at', null)
    .lte('expires_at', new Date().toISOString())

  if (error) {
    return errorResponse('TEMP_CLEANUP_FAILED', error.message, 500)
  }

  let deletedCount = 0
  let failedCount = 0

  for (const asset of expiredAssets ?? []) {
    const { error: removeError } = await supabase.storage
      .from(asset.bucket_id)
      .remove([asset.object_path])

    if (removeError) {
      failedCount += 1
      continue
    }

    const { error: updateError } = await supabase
      .from('temporary_generation_assets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', asset.id)

    if (updateError) {
      failedCount += 1
      continue
    }

    deletedCount += 1
  }

  return okResponse({
    deletedCount,
    failedCount,
    scannedCount: expiredAssets?.length ?? 0,
  })
})
