export const AI_ERROR_CODES = {
  AI_CONFIG_ERROR: 'AI_CONFIG_ERROR',
  PROMPT_SUGGEST_FAILED: 'PROMPT_SUGGEST_FAILED',
  PROMPT_REFINEMENT_FAILED: 'PROMPT_REFINEMENT_FAILED',
  IMAGE_PROVIDER_FAILED: 'IMAGE_PROVIDER_FAILED',
  TEMP_DOWNLOAD_FAILED: 'TEMP_DOWNLOAD_FAILED',
  TEMP_UPLOAD_FAILED: 'TEMP_UPLOAD_FAILED',
  TEMP_URL_SIGN_FAILED: 'TEMP_URL_SIGN_FAILED',
  INVALID_SCOPE: 'INVALID_SCOPE',
  MISSING_ROOM_CONTEXT: 'MISSING_ROOM_CONTEXT',
} as const

export type AiErrorCode = (typeof AI_ERROR_CODES)[keyof typeof AI_ERROR_CODES]

export class AiError extends Error {
  code: AiErrorCode
  status: number

  constructor(code: AiErrorCode, message: string, status = 500) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function ensureAiError(error: unknown, fallbackCode: AiErrorCode, fallbackMessage: string): AiError {
  if (error instanceof AiError) return error
  return new AiError(fallbackCode, fallbackMessage)
}
