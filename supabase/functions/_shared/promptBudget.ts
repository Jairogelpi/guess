import type { ChatMessage } from './dixitPrompts.ts'

const DEFAULT_MAX_PROMPT_CHARS = 250
const WORD_BOUNDARY_CONTROL_PATTERN = /[\u0009-\u000D]+/g
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000E-\u001F\u007F]/g
const COLLAPSIBLE_WHITESPACE_PATTERN = /\s+/g
const OBVIOUS_JSON_PATTERN = /^(?:\{[\s\S]*\}|\[[\s\S]*\])$/
const EXPLANATORY_PREFIX_PATTERN =
  /^(?:explicaci[o\u00f3]n|explicaci[o\u00f3]n breve|explanation|descripci[o\u00f3]n|descripcion|description|prompt|respuesta|response|output|resultado|result)\s*[:\-]/i
const META_LEAD_IN_PATTERN =
  /^(?:here(?: is|'s)|this is|the prompt is|prompt text|respuesta final|final prompt|in this scene|en esta escena|en esta imagen)\b[\s,:-]*/i
const ASSISTANT_CONFIRMATION_PATTERN = /^(?:sure|claro)(?:\s*[:,]|\s+-)/i
const EXPLANATORY_SCENE_PATTERN =
  /^(?:this|the)\s+(?:scene|image|prompt)\s+(?:depicts|shows|portrays|illustrates)\b/i
const INTERPRETIVE_SENTENCE_PATTERN =
  /(?:^|[.!?]\s+)(?:it|this)\s+(?:symbolizes|symbolises|represents|means|evokes|suggests|implies)\b/i
const SPANISH_INTERPRETIVE_SENTENCE_PATTERN =
  /(?:^|[.!?]\s+)(?:esto\s+)?(?:simboliza|representa|evoca|sugiere|implica)\b/i
const INTERPRETIVE_REFLECTION_PATTERN =
  /(?:^|[.!?]\s+)(?:it|this)\s+reflects\s+(?:themes?\s+of|the\s+theme\s+of|an?\s+idea\s+of|an?\s+sense\s+of|memory\b|wonder\b|grief\b|hope\b|loss\b|loneliness\b|change\b|childhood\b|nostalgia\b|identity\b)/i
const INTERPRETIVE_CLAUSE_PATTERN =
  /,\s*(?:symbolizing|symbolising|suggesting|implying|simbolizando|sugiriendo|implicando)\b/i
const INTERPRETIVE_REFLECTING_CLAUSE_PATTERN =
  /,\s*(?:reflecting|reflejando)\s+(?:themes?\s+of|the\s+theme\s+of|an?\s+idea\s+of|an?\s+sense\s+of|temas?\s+de|la\s+idea\s+de|la\s+sensaci[o\u00f3]n\s+de)\b/i
const SPANISH_INTERPRETIVE_REFLECTION_PATTERN =
  /(?:^|[.!?]\s+)(?:esto\s+)?refleja\s+(?:temas?\s+de|la\s+idea\s+de|la\s+sensaci[o\u00f3]n\s+de|memoria\b|asombro\b|dolor\b|esperanza\b|p[eé]rdida\b|soledad\b|cambio\b|infancia\b|nostalgia\b|identidad\b)/i

export class PromptBudgetValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PromptBudgetValidationError'
  }
}

function stripControlCharacters(value: string): string {
  return value
    .replace(WORD_BOUNDARY_CONTROL_PATTERN, ' ')
    .replace(CONTROL_CHAR_PATTERN, '')
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

  const normalized = stripControlCharacters(raw).replace(COLLAPSIBLE_WHITESPACE_PATTERN, ' ').trim()

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

  if (
    EXPLANATORY_PREFIX_PATTERN.test(normalized) ||
    META_LEAD_IN_PATTERN.test(normalized) ||
    ASSISTANT_CONFIRMATION_PATTERN.test(normalized)
  ) {
    return false
  }

  if (
    EXPLANATORY_SCENE_PATTERN.test(normalized) ||
    INTERPRETIVE_SENTENCE_PATTERN.test(normalized) ||
    SPANISH_INTERPRETIVE_SENTENCE_PATTERN.test(normalized) ||
    INTERPRETIVE_REFLECTION_PATTERN.test(normalized) ||
    SPANISH_INTERPRETIVE_REFLECTION_PATTERN.test(normalized) ||
    INTERPRETIVE_CLAUSE_PATTERN.test(normalized) ||
    INTERPRETIVE_REFLECTING_CLAUSE_PATTERN.test(normalized)
  ) {
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
