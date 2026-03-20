import { AI_ERROR_CODES, AiError } from './errors.ts'
import type { ChatMessage } from './dixitPrompts.ts'

interface OpenRouterChoice {
  message?: {
    content?: string | Array<{ type?: string; text?: string }>
  }
}

interface OpenRouterPayload {
  choices?: OpenRouterChoice[]
}

export function extractTextContent(payload: OpenRouterPayload) {
  for (const choice of payload.choices ?? []) {
    const content = choice.message?.content
    if (typeof content === 'string' && content.trim()) {
      return content.trim()
    }

    if (Array.isArray(content)) {
      const textPart = content.find((part) => part.type === 'text' && part.text?.trim())
      if (textPart?.text) return textPart.text.trim()
    }
  }

  return ''
}

export async function callOpenRouter({
  messages,
  temperature,
  failureCode = AI_ERROR_CODES.PROMPT_REFINEMENT_FAILED,
}: {
  messages: ChatMessage[]
  temperature: number
  failureCode?: keyof typeof AI_ERROR_CODES
}) {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) {
    throw new AiError(AI_ERROR_CODES.AI_CONFIG_ERROR, 'Missing OpenRouter API key')
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-small-creative',
          messages,
          temperature,
        }),
      })

      if (!response.ok) {
        throw new AiError(
          AI_ERROR_CODES[failureCode],
          `OpenRouter request failed with status ${response.status}`,
        )
      }

      return (await response.json()) as OpenRouterPayload
    } catch (error) {
      if (attempt === 1) {
        if (error instanceof AiError) throw error
        throw new AiError(AI_ERROR_CODES[failureCode], 'OpenRouter request failed')
      }
    }
  }

  throw new AiError(AI_ERROR_CODES[failureCode], 'OpenRouter request failed')
}
