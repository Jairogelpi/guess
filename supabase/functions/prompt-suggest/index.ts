import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { buildSuggestionMessages } from '../_shared/dixitPrompts.ts'
import { AI_ERROR_CODES, ensureAiError } from '../_shared/errors.ts'
import { callOpenRouter, extractTextContent } from '../_shared/openrouter.ts'

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

    const payload = await callOpenRouter({
      messages: buildSuggestionMessages(),
      temperature: 1,
      failureCode: 'PROMPT_SUGGEST_FAILED',
    })

    const prompt = extractTextContent(payload)
    if (!prompt) {
      return errorResponse(AI_ERROR_CODES.PROMPT_SUGGEST_FAILED, 'Empty suggestion response', 500)
    }

    return okResponse({ prompt })
  } catch (error) {
    const aiError = ensureAiError(
      error,
      AI_ERROR_CODES.PROMPT_SUGGEST_FAILED,
      'Prompt suggestion failed',
    )
    return errorResponse(aiError.code, aiError.message, aiError.status)
  }
})
