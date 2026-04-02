import type { ChatMessage } from './dixitPrompts.ts'

const DEFAULT_MAX_PROMPT_CHARS = 250
const WORD_BOUNDARY_CONTROL_PATTERN = /[\u0009-\u000D]+/g
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000E-\u001F\u007F]/g
const COLLAPSIBLE_WHITESPACE_PATTERN = /\s+/g
const JSON_OBJECT_SHAPED_PATTERN = /^\s*\{\s*(?:"[^"]+"|'[^']+'|[A-Za-z_][\w-]*)\s*:/i
const JSON_COMPLEX_ARRAY_SHAPED_PATTERN = /^\s*\[\s*(?:"|'|\{)/i
const JSON_SCALAR_ARRAY_SHAPED_PATTERN =
  /^\s*\[\s*(?:-?(?:\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|true|false|null)(?=\s*(?:,|\]|$))/i
const EXPLANATORY_PREFIX_PATTERN =
  /^(?:explicaci[o\u00f3]n|explicaci[o\u00f3]n breve|explanation|descripci[o\u00f3]n|descripcion|description|respuesta|response|output|resultado|result)\s*[:\-]/i
const LABEL_PREFIX_PATTERN =
  /^(?:(?:scene|image)(?:\s+prompt)?|answer|prompt|escena|imagen)(?:\s*:\s*|\s*[-\u2014]\s+)/i
const ARTICLE_DASH_LABEL_PREFIX_PATTERN =
  /^(?:(?:scene|image)(?:\s+prompt)?|answer|prompt|escena|imagen)-(?=(?:a|an|the|una|un|el|la)\b)/i
const CAPITALIZED_DASH_LABEL_PREFIX_PATTERN =
  /^(?:(?:Scene|Image)(?:\s+prompt)?|Answer|Prompt|Escena|Imagen)-(?=[A-Za-z\u00c0-\u017f0-9])/u
const META_LEAD_IN_PATTERN =
  /^(?:here(?: is|['\u2019]s)|this is|this\s+(?:scene|image|prompt)\s+is|the prompt is|prompt text|respuesta final|final prompt|in this scene|in this image|en esta escena|en esta imagen)\b[\s,:.-]*/i
const ASSISTANT_CONFIRMATION_PATTERN =
  /^[\u00a1\u00bf]?(?:sure|claro(?:\s+que\s+s[i\u00ed])?)(?:\s*[,:.!?]|\s+-)/i
const EXPLANATORY_SCENE_PATTERN =
  /^(?:(?:this(?:\s+(?:scene|image|prompt))?)|(?:the\s+(?:scene|image|prompt)))\s+(?:depicts|shows|portrays|illustrates|is)\b/i
const SPANISH_EXPLANATORY_SCENE_PATTERN =
  /^(?:esta|la)\s+(?:escena|imagen|prompt)\s+(?:muestra|transmite|es)\b/i
const INTERPRETIVE_SENTENCE_PATTERN =
  /(?:^|[.!?;]\s*)(?:it|this|this\s+scene|this\s+image|the\s+scene|the\s+image|the\s+prompt)\s+(?:symbolizes|symbolises|represents|means|evokes|suggests|implies)\b/i
const SPANISH_INTERPRETIVE_SENTENCE_PATTERN =
  /(?:^|[.!?;]\s*)(?:(?:esto|esta\s+escena|esta\s+imagen|la\s+escena|la\s+imagen)\s+)?(?:simboliza|representa|evoca|sugiere|implica)\b/i
const INTERPRETIVE_REFLECTION_PATTERN =
  /(?:^|[.!?;]\s*)(?:it|this|this\s+scene|this\s+image|the\s+scene|the\s+image)\s+reflects\s+(?:themes?\s+of|the\s+theme\s+of|an?\s+idea\s+of|an?\s+sense\s+of|memory\b|wonder\b|grief\b|hope\b|loss\b|loneliness\b|change\b|childhood\b|nostalgia\b|identity\b)/i
const TONE_COMMENTARY_PATTERN =
  /(?:^|[.!?;]\s*)(?:the\s+atmosphere\s+feels|the\s+tone\s+is|el\s+tono\s+es(?:\s+de)?|la\s+atm[o\u00f3]sfera\s+se\s+siente)\b/i
const INTERPRETIVE_CLAUSE_PATTERN =
  /,\s*(?:symbolizing|symbolising|suggesting|implying|evoking|simbolizando|sugiriendo|implicando|evocando)\b/i
const INTERPRETIVE_PARTICIPLE_LINE_PATTERN =
  /^(?:symbolizing|symbolising|suggesting|implying|evoking|simbolizando|sugiriendo|implicando|evocando)\b/i
const INTERPRETIVE_APPOSITIVE_CLAUSE_PATTERN = /,\s*(?:an?\s+metaphor\s+for|s[i\u00ed]mbolo\s+de)\b/i
const INTERPRETIVE_REFLECTING_CLAUSE_PATTERN =
  /,\s*(?:reflecting|reflejando)\s+(?:themes?\s+of|the\s+theme\s+of|an?\s+idea\s+of|an?\s+sense\s+of|memory\b|wonder\b|grief\b|hope\b|loss\b|nostalgia\b|temas?\s+de|la\s+idea\s+de|la\s+sensaci[o\u00f3]n\s+de|memoria\b|asombro\b|dolor\b|esperanza\b|p(?:e|\u00e9)rdida\b)\b/i
const INTERPRETIVE_REFLECTING_PARTICIPLE_LINE_PATTERN =
  /^(?:reflecting|reflejando)\s+(?:themes?\s+of|the\s+theme\s+of|an?\s+idea\s+of|an?\s+sense\s+of|memory\b|wonder\b|grief\b|hope\b|loss\b|nostalgia\b|temas?\s+de|la\s+idea\s+de|la\s+sensaci[o\u00f3]n\s+de|memoria\b|asombro\b|dolor\b|esperanza\b|p(?:e|\u00e9)rdida\b)\b/i
const SPANISH_INTERPRETIVE_REFLECTION_PATTERN =
  /(?:^|[.!?;]\s*)(?:(?:esto|esta\s+escena|esta\s+imagen|la\s+escena|la\s+imagen)\s+)?refleja\s+(?:temas?\s+de|la\s+idea\s+de|la\s+sensaci[o\u00f3]n\s+de|memoria\b|asombro\b|dolor\b|esperanza\b|p(?:e|\u00e9)rdida\b|soledad\b|cambio\b|infancia\b|nostalgia\b|identidad\b)/i

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

function normalizeWhitespace(value: string): string {
  return value.replace(COLLAPSIBLE_WHITESPACE_PATTERN, ' ').trim()
}

function buildPromptOutputCandidates(value: string): string[] {
  const candidates = new Set<string>()
  const collapsed = normalizeWhitespace(value)

  if (collapsed) {
    candidates.add(collapsed)
  }

  for (const line of value.split(/\r?\n+/)) {
    const normalizedLine = normalizeWhitespace(line)

    if (normalizedLine) {
      candidates.add(normalizedLine)
    }
  }

  return [...candidates]
}

function isObviousJson(value: string): boolean {
  if (
    JSON_OBJECT_SHAPED_PATTERN.test(value) ||
    JSON_COMPLEX_ARRAY_SHAPED_PATTERN.test(value) ||
    JSON_SCALAR_ARRAY_SHAPED_PATTERN.test(value)
  ) {
    return true
  }

  if (!/^[\[{]/.test(value)) {
    return false
  }

  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null
  } catch {
    return false
  }
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

  const normalized = normalizeWhitespace(stripControlCharacters(raw))

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

  if (normalized.startsWith('```')) {
    return false
  }

  const candidates = buildPromptOutputCandidates(normalized)
  const collapsed = candidates[0] ?? ''

  if (isObviousJson(collapsed)) {
    return false
  }

  for (const candidate of candidates) {
    if (
      EXPLANATORY_PREFIX_PATTERN.test(candidate) ||
      LABEL_PREFIX_PATTERN.test(candidate) ||
      ARTICLE_DASH_LABEL_PREFIX_PATTERN.test(candidate) ||
      CAPITALIZED_DASH_LABEL_PREFIX_PATTERN.test(candidate) ||
      META_LEAD_IN_PATTERN.test(candidate) ||
      ASSISTANT_CONFIRMATION_PATTERN.test(candidate) ||
      EXPLANATORY_SCENE_PATTERN.test(candidate) ||
      SPANISH_EXPLANATORY_SCENE_PATTERN.test(candidate) ||
      INTERPRETIVE_SENTENCE_PATTERN.test(candidate) ||
      SPANISH_INTERPRETIVE_SENTENCE_PATTERN.test(candidate) ||
      INTERPRETIVE_REFLECTION_PATTERN.test(candidate) ||
      TONE_COMMENTARY_PATTERN.test(candidate) ||
      SPANISH_INTERPRETIVE_REFLECTION_PATTERN.test(candidate) ||
      INTERPRETIVE_CLAUSE_PATTERN.test(candidate) ||
      INTERPRETIVE_PARTICIPLE_LINE_PATTERN.test(candidate) ||
      INTERPRETIVE_APPOSITIVE_CLAUSE_PATTERN.test(candidate) ||
      INTERPRETIVE_REFLECTING_CLAUSE_PATTERN.test(candidate) ||
      INTERPRETIVE_REFLECTING_PARTICIPLE_LINE_PATTERN.test(candidate)
    ) {
      return false
    }
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
