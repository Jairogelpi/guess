import { readFileSync } from 'node:fs'
import {
  buildEnhancementMessages,
  buildSuggestionMessages,
} from '../../supabase/functions/_shared/dixitPrompts'
import {
  PromptBudgetValidationError,
  buildCompressionMessages,
} from '../../supabase/functions/_shared/promptBudget'
import {
  resolvePromptSuggestPrompt,
  resolvePromptSuggestRequest,
} from '../../supabase/functions/_shared/promptFlow'

describe('promptFlow', () => {
  test('undefined routes to suggest mode', () => {
    const request = resolvePromptSuggestRequest(undefined)

    expect(request.mode).toBe('suggest')
    expect(request.basePrompt).toBeUndefined()
    expect(request.messages).toEqual(buildSuggestionMessages())
  })

  test('whitespace-only input routes to suggest mode', () => {
    const request = resolvePromptSuggestRequest('   ')

    expect(request.mode).toBe('suggest')
    expect(request.basePrompt).toBeUndefined()
    expect(request.messages).toEqual(buildSuggestionMessages())
  })

  test('valid text routes to enhance mode', () => {
    const request = resolvePromptSuggestRequest('  una nina en una biblioteca inundada  ')

    expect(request.mode).toBe('enhance')
    expect(request.basePrompt).toBe('una nina en una biblioteca inundada')
    expect(request.messages).toEqual(
      buildEnhancementMessages('una nina en una biblioteca inundada'),
    )
  })

  test('over-250 input throws the validation-specific invalid payload error', () => {
    expect(() => resolvePromptSuggestRequest('x'.repeat(251))).toThrow(
      PromptBudgetValidationError,
    )
  })

  test('suggestion temperature is higher than enhancement temperature', () => {
    const suggestion = resolvePromptSuggestRequest(undefined)
    const enhancement = resolvePromptSuggestRequest('una nina en una biblioteca inundada')

    expect(suggestion.temperature).toBeGreaterThan(enhancement.temperature)
  })

  test('over-250 input throws before any model call', async () => {
    const runModel = jest.fn<Promise<string>, [{ messages: unknown; temperature: number }]>()

    await expect(resolvePromptSuggestPrompt('x'.repeat(251), runModel)).rejects.toThrow(
      PromptBudgetValidationError,
    )
    expect(runModel).not.toHaveBeenCalled()
  })

  test('an over-budget first model response triggers exactly one compression call', async () => {
    const firstResponse = `una nina ${'x'.repeat(243)}`
    const compressedResponse =
      'una nina abre una biblioteca sumergida con peces en los estantes'
    const runModel = jest
      .fn<Promise<string>, [{ messages: unknown; temperature: number }]>()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(compressedResponse)

    await expect(resolvePromptSuggestPrompt(undefined, runModel)).resolves.toBe(compressedResponse)
    expect(runModel).toHaveBeenCalledTimes(2)
    expect(runModel).toHaveBeenNthCalledWith(1, {
      messages: buildSuggestionMessages(),
      temperature: 1,
    })
    expect(runModel).toHaveBeenNthCalledWith(2, {
      messages: buildCompressionMessages(firstResponse),
      temperature: 0.2,
    })
  })

  test('compression failure propagates the invalid output error path', async () => {
    const firstResponse = `una nina ${'x'.repeat(243)}`
    const runModel = jest
      .fn<Promise<string>, [{ messages: unknown; temperature: number }]>()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce('{"prompt":"hola"}')

    await expect(resolvePromptSuggestPrompt(undefined, runModel)).rejects.toThrow(
      'INVALID_PROMPT_OUTPUT',
    )
    expect(runModel).toHaveBeenCalledTimes(2)
  })

  test('empty first model output preserves the explicit empty response error path', async () => {
    const runModel = jest
      .fn<Promise<string>, [{ messages: unknown; temperature: number }]>()
      .mockResolvedValueOnce('')

    await expect(resolvePromptSuggestPrompt(undefined, runModel)).rejects.toThrow(
      'EMPTY_SUGGESTION_RESPONSE',
    )
    expect(runModel).toHaveBeenCalledTimes(1)
  })

  test('success path returns the accepted within-budget prompt', async () => {
    const acceptedPrompt =
      '  una nina abre una biblioteca sumergida con peces en los estantes  '
    const runModel = jest
      .fn<Promise<string>, [{ messages: unknown; temperature: number }]>()
      .mockResolvedValueOnce(acceptedPrompt)

    await expect(
      resolvePromptSuggestPrompt('  una nina en una biblioteca inundada  ', runModel),
    ).resolves.toBe('una nina abre una biblioteca sumergida con peces en los estantes')
    expect(runModel).toHaveBeenCalledTimes(1)
    expect(runModel).toHaveBeenCalledWith({
      messages: buildEnhancementMessages('una nina en una biblioteca inundada'),
      temperature: 0.7,
    })
  })

  test('prompt-suggest preserves the baseline unauthorized response contract', () => {
    const source = readFileSync('supabase/functions/prompt-suggest/index.ts', 'utf8')

    expect(source).toContain("const internalUrl = Deno.env.get('SUPABASE_URL')")
    expect(source).toContain("${authError?.message || 'Invalid token'} (Token start: ${token.substring(0, 10)}... | Func URL: ${internalUrl})")
  })
})
