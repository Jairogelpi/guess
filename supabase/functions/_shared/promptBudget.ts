import type { ChatMessage } from './dixitPrompts.ts'

const DEFAULT_MAX_PROMPT_CHARS = 250
const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/g
const OBVIOUS_JSON_PATTERN = /^(?:\{[\s\S]*\}|\[[\s\S]*\])$/
const EXPLANATORY_PREFIX_PATTERN =
  /^(?:explicacion|explicacion breve|explanation|descripcion|description|prompt|respuesta|response|output|resultado|result)\s*[:\-]/i
const META_LEAD_IN_PATTERN =
  /^(?:here(?: is|'s)|this is|the prompt is|prompt text|respuesta final|final prompt)\b/i

export class PromptBudgetValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PromptBudgetValidationError'
  }
}

function stripControlCharacters(value: string): string {
  return value.replace(CONTROL_CHAR_PATTERN, '')
}

function createInvalidPromptOutputError(): Error {
  return new Error('INVALID_PROMPT_OUTPUT')
}

export function normalizePromptInput(
  raw: unknown,
  maxChars = DEFAULT_MAX_PROMPT_CHARS,
): string | undefined {
  if (typeof raw !== 'string') {
    return undefined
  }

  const normalized = stripControlCharacters(raw).trim()

  if (!normalized) {
    return undefined
  }

  if (normalized.length > maxChars) {
    throw new PromptBudgetValidationError(`Prompt input exceeds ${maxChars} characters`)
  }

  return normalized
}

export function isUsablePromptOutput(text: string): boolean {
  const normalized = text.trim()

  if (!normalized) {
    return false
  }

  if (normalized.includes('\n') || normalized.startsWith('```')) {
    return false
  }

  if (OBVIOUS_JSON_PATTERN.test(normalized)) {
    return false
  }

  if (EXPLANATORY_PREFIX_PATTERN.test(normalized) || META_LEAD_IN_PATTERN.test(normalized)) {
    return false
  }

  return true
}

export function buildCompressionMessages(text: string): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `You compress image prompts without changing what they depict.
Keep the same exact scene while rewriting it to <= 250 characters.
Preserve the same subject, action, setting, and surreal detail.
Use no truncation, no JSON, and no explanations.
Return only the compressed prompt text.`,
    },
    {
      role: 'user',
      content: text,
    },
  ]
}

export async function resolvePromptOutputWithinBudget(
  firstResponse: string,
  compress: (text: string) => Promise<string>,
): Promise<string> {
  const normalizedFirstResponse = firstResponse.trim()

  if (
    normalizedFirstResponse.length <= DEFAULT_MAX_PROMPT_CHARS &&
    isUsablePromptOutput(normalizedFirstResponse)
  ) {
    return normalizedFirstResponse
  }

  if (normalizedFirstResponse.length <= DEFAULT_MAX_PROMPT_CHARS) {
    throw createInvalidPromptOutputError()
  }

  const compressedResponse = (await compress(normalizedFirstResponse)).trim()

  if (
    compressedResponse.length > DEFAULT_MAX_PROMPT_CHARS ||
    !isUsablePromptOutput(compressedResponse)
  ) {
    throw createInvalidPromptOutputError()
  }

  return compressedResponse
}
