import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { AI_ERROR_CODES, ensureAiError } from '../_shared/errors.ts'
import { callOpenRouter, extractTextContent } from '../_shared/openrouter.ts'
import {
  buildCompressionMessages,
  PromptBudgetValidationError,
  resolvePromptOutputWithinBudget,
} from '../_shared/promptBudget.ts'
import { resolvePromptSuggestRequest } from '../_shared/promptFlow.ts'

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
      return errorResponse('UNAUTHORIZED', 'Invalid or expired token', 401)
    }

    const reqBody = await req.json().catch(() => ({}))
    const promptSuggestRequest = resolvePromptSuggestRequest(reqBody.basePrompt)

    const payload = await callOpenRouter({
      messages: promptSuggestRequest.messages,
      temperature: promptSuggestRequest.temperature,
      failureCode: 'PROMPT_SUGGEST_FAILED',
    })

    const firstResponse = extractTextContent(payload)
    const prompt = await resolvePromptOutputWithinBudget(firstResponse, async (text) => {
      const compressedPayload = await callOpenRouter({
        messages: buildCompressionMessages(text),
        temperature: 0.2,
        failureCode: 'PROMPT_SUGGEST_FAILED',
      })

      return extractTextContent(compressedPayload)
    })

    return okResponse({ prompt })
  } catch (error) {
    if (error instanceof PromptBudgetValidationError) {
      return errorResponse('INVALID_PAYLOAD', error.message, 400)
    }

    const aiError = ensureAiError(
      error,
      AI_ERROR_CODES.PROMPT_SUGGEST_FAILED,
      'Prompt suggestion failed',
    )
    return errorResponse(aiError.code, aiError.message, aiError.status)
  }
})
