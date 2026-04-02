import {
  buildPromptSuggestMessages,
  type ChatMessage,
} from './dixitPrompts.ts'
import { normalizePromptInput } from './promptBudget.ts'

const SUGGEST_TEMPERATURE = 1
const ENHANCE_TEMPERATURE = 0.7

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
