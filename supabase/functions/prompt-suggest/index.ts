import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { AI_ERROR_CODES, ensureAiError } from '../_shared/errors.ts'
import { callOpenRouter, extractTextContent } from '../_shared/openrouter.ts'
import { PromptBudgetValidationError } from '../_shared/promptBudget.ts'
import {
  EMPTY_SUGGESTION_RESPONSE_ERROR,
  resolvePromptSuggestPrompt,
} from '../_shared/promptFlow.ts'

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

    const reqBody = await req.json().catch(() => ({}))
    const prompt = await resolvePromptSuggestPrompt(reqBody.basePrompt, async (request) => {
      const payload = await callOpenRouter({
        messages: request.messages,
        temperature: request.temperature,
        failureCode: 'PROMPT_SUGGEST_FAILED',
      })

      return extractTextContent(payload)
    })

    return okResponse({ prompt })
  } catch (error) {
    if (error instanceof PromptBudgetValidationError) {
      return errorResponse('INVALID_PAYLOAD', error.message, 400)
    }

    if (error instanceof Error && error.message === EMPTY_SUGGESTION_RESPONSE_ERROR) {
      return errorResponse(AI_ERROR_CODES.PROMPT_SUGGEST_FAILED, 'Empty suggestion response', 500)
    }

    const aiError = ensureAiError(
      error,
      AI_ERROR_CODES.PROMPT_SUGGEST_FAILED,
      'Prompt suggestion failed',
    )
    return errorResponse(aiError.code, aiError.message, aiError.status)
  }
})
