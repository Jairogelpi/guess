import {
  buildGenerationBriefMessages,
  buildPromptSuggestMessages,
  type ChatMessage,
} from './dixitPrompts.ts'
import {
  PromptBudgetValidationError,
  buildCompressionMessages,
  normalizePromptInput,
  resolvePromptOutputWithinBudget,
} from './promptBudget.ts'

const SUGGEST_TEMPERATURE = 1
const ENHANCE_TEMPERATURE = 0.7
const COMPRESSION_TEMPERATURE = 0.2
export const EMPTY_SUGGESTION_RESPONSE_ERROR = 'EMPTY_SUGGESTION_RESPONSE'

export interface PromptSuggestModelRequest {
  messages: ChatMessage[]
  temperature: number
}

export function resolveGenerationBriefRequest(rawPrompt: string): {
  prompt: string
  messages: ChatMessage[]
} {
  const prompt = normalizePromptInput(rawPrompt)

  if (!prompt) {
    throw new PromptBudgetValidationError('Prompt input is required')
  }

  return {
    prompt,
    messages: buildGenerationBriefMessages(prompt),
  }
}

export function resolvePromptSuggestRequest(rawBasePrompt: unknown): {
  mode: 'suggest' | 'enhance'
  basePrompt?: string
  temperature: number
  messages: ChatMessage[]
} {
  const basePrompt = normalizePromptInput(rawBasePrompt)

  if (!basePrompt) {
    return {
      mode: 'suggest',
      temperature: SUGGEST_TEMPERATURE,
      messages: buildPromptSuggestMessages(),
    }
  }

  return {
    mode: 'enhance',
    basePrompt,
    temperature: ENHANCE_TEMPERATURE,
    messages: buildPromptSuggestMessages(basePrompt),
  }
}

export async function resolvePromptSuggestPrompt(
  rawBasePrompt: unknown,
  runModel: (request: PromptSuggestModelRequest) => Promise<string>,
): Promise<string> {
  const request = resolvePromptSuggestRequest(rawBasePrompt)
  const firstResponse = await runModel({
    messages: request.messages,
    temperature: request.temperature,
  })

  if (!firstResponse.trim()) {
    throw new Error(EMPTY_SUGGESTION_RESPONSE_ERROR)
  }

  return resolvePromptOutputWithinBudget(firstResponse, async (text) =>
    runModel({
      messages: buildCompressionMessages(text),
      temperature: COMPRESSION_TEMPERATURE,
    }),
  )
}
