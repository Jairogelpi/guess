import { readFileSync } from 'node:fs'
import {
  PromptBudgetValidationError,
  buildCompressionMessages,
  isUsablePromptOutput,
  normalizePromptInput,
  resolvePromptOutputWithinBudget,
} from '../../supabase/functions/_shared/promptBudget'

describe('promptBudget', () => {
  test('normalizePromptInput trims surrounding whitespace', () => {
    expect(normalizePromptInput('  hola  ', 250)).toBe('hola')
  })

  test('normalizePromptInput returns undefined for empty-after-trim strings', () => {
    expect(normalizePromptInput(' '.repeat(4), 250)).toBeUndefined()
  })

  test('normalizePromptInput strips control characters before trimming', () => {
    expect(normalizePromptInput('\u0000  hola\u0007  ', 250)).toBe('hola')
  })

  test('normalizePromptInput throws a validation-specific error when text exceeds the budget', () => {
    expect(() => normalizePromptInput('x'.repeat(251), 250)).toThrow(PromptBudgetValidationError)
  })

  test('isUsablePromptOutput rejects obvious JSON', () => {
    expect(isUsablePromptOutput('{"prompt":"hola"}')).toBe(false)
  })

  test('isUsablePromptOutput rejects explanatory prefixes', () => {
    expect(isUsablePromptOutput('explicacion: una nina...')).toBe(false)
  })

  test('isUsablePromptOutput accepts card-prompt shaped scene text', () => {
    expect(
      isUsablePromptOutput('una nina abre una biblioteca sumergida con peces en los estantes'),
    ).toBe(true)
  })

  test('isUsablePromptOutput accepts compact two-sentence scene prompts', () => {
    expect(
      isUsablePromptOutput(
        'una nina abre una biblioteca sumergida. Peces de papel flotan entre los estantes.',
      ),
    ).toBe(true)
  })

  test('isUsablePromptOutput rejects explanatory under-budget prose', () => {
    expect(
      isUsablePromptOutput(
        'This scene depicts a girl opening an underwater library. It symbolizes memory and wonder.',
      ),
    ).toBe(false)
  })

  test('buildCompressionMessages preserves the exact same scene while compressing to 250 characters or less', () => {
    const messages = buildCompressionMessages(
      'una nina abre una biblioteca sumergida con peces en los estantes',
    )
    const systemMessage = messages[0]?.content ?? ''
    const userMessage = messages[1]?.content ?? ''

    expect(messages).toHaveLength(2)
    expect(messages[0]?.role).toBe('system')
    expect(messages[1]?.role).toBe('user')
    expect(systemMessage).toContain('same exact scene')
    expect(systemMessage).toContain('<= 250')
    expect(systemMessage).toContain('no truncation')
    expect(systemMessage).toContain('no JSON')
    expect(systemMessage).toContain('no explanations')
    expect(userMessage).toContain('una nina abre una biblioteca sumergida')
  })

  test('resolvePromptOutputWithinBudget accepts the first response when already valid', async () => {
    const compress = jest.fn<Promise<string>, [string]>()
    const firstResponse = '  una nina abre una biblioteca sumergida con peces en los estantes  '

    await expect(resolvePromptOutputWithinBudget(firstResponse, compress)).resolves.toBe(
      'una nina abre una biblioteca sumergida con peces en los estantes',
    )
    expect(compress).not.toHaveBeenCalled()
  })

  test('resolvePromptOutputWithinBudget retries exactly once when the first response is over budget', async () => {
    const overBudget = `una nina ${'x'.repeat(243)}`
    const compressed = 'una nina abre una biblioteca sumergida con peces en los estantes'
    const compress = jest.fn<Promise<string>, [string]>().mockResolvedValue(compressed)

    await expect(resolvePromptOutputWithinBudget(overBudget, compress)).resolves.toBe(compressed)
    expect(compress).toHaveBeenCalledTimes(1)
    expect(compress).toHaveBeenCalledWith(overBudget)
  })

  test('resolvePromptOutputWithinBudget fails immediately without compressing under-budget unusable output', async () => {
    const compress = jest.fn<Promise<string>, [string]>()

    await expect(
      resolvePromptOutputWithinBudget('{"prompt":"hola"}', compress),
    ).rejects.toThrow('INVALID_PROMPT_OUTPUT')
    expect(compress).not.toHaveBeenCalled()
  })

  test.each([
    ['still over budget', `una nina ${'x'.repeat(243)}`],
    ['still unusable', '{"prompt":"hola"}'],
  ])(
    'resolvePromptOutputWithinBudget throws when the second response is %s',
    async (_label, secondResponse) => {
      const firstResponse = `una nina ${'x'.repeat(243)}`
      const compress = jest.fn<Promise<string>, [string]>().mockResolvedValue(secondResponse)

      await expect(resolvePromptOutputWithinBudget(firstResponse, compress)).rejects.toThrow(
        'INVALID_PROMPT_OUTPUT',
      )
      expect(compress).toHaveBeenCalledTimes(1)
    },
  )

  test('promptBudget uses an explicit .ts suffix for the local dixitPrompts import', () => {
    const source = readFileSync(
      'supabase/functions/_shared/promptBudget.ts',
      'utf8',
    )

    expect(source).toContain("from './dixitPrompts.ts'")
  })
})
