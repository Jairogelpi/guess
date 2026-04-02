import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { AI_ERROR_CODES, AiError, ensureAiError } from '../_shared/errors.ts'
import { callOpenRouter, extractTextContent } from '../_shared/openrouter.ts'
import {
  PromptBudgetValidationError,
  buildCompressionMessages,
  resolvePromptOutputWithinBudget,
} from '../_shared/promptBudget.ts'
import { resolveGenerationBriefRequest } from '../_shared/promptFlow.ts'
import {
  buildPollinationsAuthHeaders,
  buildPollinationsImageUrl,
  getPollinationsApiKey,
  getPollinationsModels,
} from '../_shared/pollinations.ts'
import {
  buildExpiryIso,
  buildTempAssetPath,
  createSignedTempUrl,
  downloadRemoteImage,
  insertTempAssetRow,
  uploadTempImage,
} from '../_shared/tempAssets.ts'

const schema = z.object({
  prompt: z.string(),
  scope: z.enum(['round', 'gallery']),
  roomCode: z.string().min(1).optional(),
  roundId: z.string().uuid().optional(),
})

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const supabase = createSupabaseAdmin()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('UNAUTHORIZED', 'Missing auth', 401)

    const token = authHeader.replace('Bearer ', '').trim()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

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

    if (body.data.scope === 'round' && (!body.data.roomCode || !body.data.roundId)) {
      return errorResponse(
        AI_ERROR_CODES.MISSING_ROOM_CONTEXT,
        'Round generation requires room context',
        400,
      )
    }

    const generationRequest = resolveGenerationBriefRequest(body.data.prompt)
    const refinementPayload = await callOpenRouter({
      messages: generationRequest.messages,
      temperature: 0.4,
      failureCode: 'PROMPT_REFINEMENT_FAILED',
    })

    const firstBrief = extractTextContent(refinementPayload)
    let brief: string

    try {
      brief = await resolvePromptOutputWithinBudget(firstBrief, async (text) => {
        const compressionPayload = await callOpenRouter({
          messages: buildCompressionMessages(text),
          temperature: 0.2,
          failureCode: 'PROMPT_REFINEMENT_FAILED',
        })

        return extractTextContent(compressionPayload)
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_PROMPT_OUTPUT') {
        throw new AiError(AI_ERROR_CODES.PROMPT_REFINEMENT_FAILED, 'Prompt refinement failed')
      }

      throw error
    }

    const { primary, fallback } = getPollinationsModels()
    const pollinationsKey = getPollinationsApiKey()
    if (!pollinationsKey) {
      throw new AiError(AI_ERROR_CODES.AI_CONFIG_ERROR, 'Missing Pollinations API key')
    }
    const seed = Math.floor(Math.random() * 2_147_483_647)

    let selectedModel: string = primary
    let imageBytes: ArrayBuffer | null = null
    let contentType = 'image/jpeg'

    for (const model of [primary, fallback]) {
      const candidateUrl = buildPollinationsImageUrl({ prompt: brief, model, seed })

      try {
        const download = await downloadRemoteImage(
          candidateUrl,
          buildPollinationsAuthHeaders(pollinationsKey),
        )
        selectedModel = model
        imageBytes = download.bytes
        contentType = download.contentType
        break
      } catch (error) {
        if (model === fallback) {
          throw new AiError(
            AI_ERROR_CODES.IMAGE_PROVIDER_FAILED,
            error instanceof Error ? error.message : 'Pollinations image generation failed',
          )
        }
      }
    }

    if (!imageBytes) {
      throw new AiError(AI_ERROR_CODES.IMAGE_PROVIDER_FAILED, 'No image bytes returned')
    }

    const nowIso = new Date().toISOString()
    const expiresAt = buildExpiryIso(nowIso)
    const bucketId = 'round-temp'
    const objectPath = buildTempAssetPath({
      scope: body.data.scope,
      roomCode: body.data.roomCode,
      roundId: body.data.roundId,
      userId: user.id,
      timestampMs: Date.now(),
    })

    await uploadTempImage({
      supabase,
      bucketId,
      objectPath,
      bytes: imageBytes,
      contentType,
    })

    const imageUrl = await createSignedTempUrl({
      supabase,
      bucketId,
      objectPath,
      expiresInSeconds: 60 * 60,
    })

    await insertTempAssetRow({
      supabase,
      row: {
        bucket_id: bucketId,
        object_path: objectPath,
        scope: body.data.scope,
        room_code: body.data.roomCode ?? null,
        round_id: body.data.roundId ?? null,
        owner_id: user.id,
        provider: 'pollinations',
        model: selectedModel,
        refined_brief: brief,
        mime_type: contentType,
        expires_at: expiresAt,
      },
    })

    return okResponse({
      imageUrl,
      brief,
      provider: 'pollinations',
      model: selectedModel,
      expiresAt,
    })
  } catch (error) {
    if (error instanceof PromptBudgetValidationError) {
      return errorResponse('INVALID_PAYLOAD', error.message, 400)
    }

    const aiError = ensureAiError(
      error,
      AI_ERROR_CODES.IMAGE_PROVIDER_FAILED,
      'Image generation failed',
    )
    return errorResponse(aiError.code, aiError.message, aiError.status)
  }
})
