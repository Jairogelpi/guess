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

  test('normalizePromptInput returns undefined for non-string input', () => {
    expect(normalizePromptInput(123 as unknown, 250)).toBeUndefined()
  })

  test('normalizePromptInput strips control characters before trimming', () => {
    expect(normalizePromptInput('\u0000  hola\u0007  ', 250)).toBe('hola')
  })

  test('normalizePromptInput preserves word boundaries for multiline and tabbed input', () => {
    expect(normalizePromptInput('  moon\ncat\taltar  ', 250)).toBe('moon cat altar')
  })

  test('normalizePromptInput collapses multiline and tab-expanded whitespace runs', () => {
    expect(normalizePromptInput('moon\n  cat\taltar', 250)).toBe('moon cat altar')
  })

  test('normalizePromptInput throws a validation-specific error when text exceeds the budget', () => {
    expect(() => normalizePromptInput('x'.repeat(251), 250)).toThrow(PromptBudgetValidationError)
  })

  test('isUsablePromptOutput rejects obvious JSON', () => {
    expect(isUsablePromptOutput('{"prompt":"hola"}')).toBe(false)
  })

  test.each([
    '{"prompt":"hola"',
    '{"prompt":"hola"} trailing',
    '{prompt:"hola"}',
    "{'prompt':'hola'}",
    '["a girl opens an underwater library"',
    '[123',
    '[-1',
    '[true',
    '[false',
    '[null',
  ])('isUsablePromptOutput rejects malformed JSON-shaped output: %s', (text) => {
    expect(isUsablePromptOutput(text)).toBe(false)
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

  test.each([
    'Sure-footed mountain goats climb a cathedral made of salt.',
    'scene-setting harbor under a red moon',
    'scene-stealing fox beneath a flooded chandelier',
    '[underwater library with fish on the shelves]',
    '[1980s arcade overgrown with moss]',
    '[true blue cathedral under the sea]',
    'a masked diver studies an altar as it reflects moonlight.',
    'a fox carries a lighthouse\nthrough a flooded hallway',
  ])('isUsablePromptOutput keeps literal scene language usable: %s', (text) => {
    expect(isUsablePromptOutput(text)).toBe(true)
  })

  test('isUsablePromptOutput rejects explanatory under-budget prose', () => {
    expect(
      isUsablePromptOutput(
        'This scene depicts a girl opening an underwater library. It symbolizes memory and wonder.',
      ),
    ).toBe(false)
  })

  test.each([
    'a girl opens an underwater library\nIt symbolizes memory and wonder.',
    'a girl opens an underwater library\nsymbolizing memory and wonder.',
    'una ni\u00f1a abre una biblioteca submarina\nSimboliza memoria y asombro.',
    'una ni\u00f1a abre una biblioteca submarina\nreflejando memoria y asombro.',
  ])('isUsablePromptOutput rejects multiline meta prose: %s', (text) => {
    expect(isUsablePromptOutput(text)).toBe(false)
  })

  test.each([
    'Explicaci\u00f3n: una nina abre una biblioteca sumergida',
    'This depicts a girl opening an underwater library.',
    'Scene: a girl opens an underwater library.',
    'scene-a girl opens an underwater library.',
    'Scene-girl opens an underwater library.',
    'Scene-a girl opens an underwater library.',
    'Scene- a girl opens an underwater library.',
    'Scene - a girl opens an underwater library.',
    'Scene \u2014 a girl opens an underwater library.',
    'Image: a girl opens an underwater library.',
    'Scene prompt: a girl opens an underwater library.',
    'Image prompt: a girl opens an underwater library.',
    'Answer: a girl opens an underwater library.',
    'prompt-a girl opens an underwater library.',
    'This scene is about memory and wonder.',
    'This prompt is about a girl opening an underwater library.',
    'In this scene, a girl opens an underwater library.',
    'In this image, a girl opens an underwater library.',
    'Here\u2019s a girl opening an underwater library.',
    'Sure! a girl opens an underwater library.',
    'Sure. a girl opens an underwater library.',
    'Sure, a girl opens an underwater library with fish in the shelves.',
    'This scene suggests memory and wonder.',
    'This image evokes nostalgia.',
    'This image reflects nostalgia.',
    'The scene symbolizes memory and wonder.',
    'The scene reflects grief and hope.',
    'A girl opens an underwater library. The atmosphere feels mysterious and symbolic.',
    'a girl opens an underwater library. It suggests memory and wonder.',
    'a girl opens an underwater library. It implies a forgotten childhood.',
    'a girl opens an underwater library. It reflects grief and hope.',
    'a girl opens an underwater library; it symbolizes memory and wonder.',
    'a girl opens an underwater library, evoking nostalgia.',
    'a girl opens an underwater library, symbolizing memory and wonder.',
    'a girl opens an underwater library, reflecting memory and wonder.',
    'a fox carries a lighthouse, a metaphor for loneliness and duty.',
    'a fox carries a lighthouse, suggesting loneliness and duty.',
    'a child walks through a paper storm, implying fear of change.',
    'a paper city folds inward, reflecting themes of memory and loss.',
  ])('isUsablePromptOutput rejects additional explanatory invalid forms: %s', (text) => {
    expect(isUsablePromptOutput(text)).toBe(false)
  })

  test.each([
    'Descripci\u00f3n: una ni\u00f1a abre una biblioteca submarina.',
    'Escena: una ni\u00f1a abre una biblioteca submarina.',
    'escena-una ni\u00f1a abre una biblioteca submarina.',
    'Escena-nina abre una biblioteca submarina.',
    'Escena-una ni\u00f1a abre una biblioteca submarina.',
    'Escena- una ni\u00f1a abre una biblioteca submarina.',
    'Escena - una ni\u00f1a abre una biblioteca submarina.',
    'Imagen: una ni\u00f1a abre una biblioteca submarina.',
    '\u00a1Claro! una ni\u00f1a abre una biblioteca submarina.',
    'Claro que s\u00ed, una ni\u00f1a abre una biblioteca submarina.',
    'En esta escena, una ni\u00f1a abre una biblioteca submarina.',
    'En esta imagen, una ni\u00f1a abre una biblioteca submarina.',
    'La imagen muestra una ni\u00f1a abre una biblioteca submarina.',
    'Claro! una ni\u00f1a abre una biblioteca submarina.',
    'Claro. una ni\u00f1a abre una biblioteca submarina.',
    'Claro, una ni\u00f1a abre una biblioteca submarina.',
    'Esta escena sugiere memoria y asombro.',
    'Esta imagen evoca nostalgia.',
    'Esta imagen refleja nostalgia.',
    'La escena transmite memoria y asombro.',
    'La escena simboliza memoria y asombro.',
    'La escena refleja memoria y asombro.',
    'Una ni\u00f1a abre una biblioteca submarina. El tono es de memoria y asombro.',
    'una ni\u00f1a abre una biblioteca submarina. Simboliza memoria y asombro.',
    'una ni\u00f1a abre una biblioteca submarina. Esto simboliza memoria y asombro.',
    'una ni\u00f1a abre una biblioteca submarina. Refleja memoria y asombro.',
    'una ni\u00f1a abre una biblioteca submarina; simboliza memoria y asombro.',
    'una ni\u00f1a abre una biblioteca submarina, evocando nostalgia.',
    'una ni\u00f1a abre una biblioteca submarina, s\u00edmbolo de memoria y asombro.',
    'una ni\u00f1a abre una biblioteca submarina, simbolizando memoria y asombro.',
    'una ni\u00f1a abre una biblioteca submarina, reflejando memoria y asombro.',
  ])('isUsablePromptOutput rejects representative Spanish explanatory forms: %s', (text) => {
    expect(isUsablePromptOutput(text)).toBe(false)
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

  test('resolvePromptOutputWithinBudget retries exactly once even when the over-budget first response is unusable', async () => {
    const overBudgetUnusable = `{"prompt":"${'x'.repeat(240)}"}`
    const compressed = 'una nina abre una biblioteca sumergida con peces en los estantes'
    const compress = jest.fn<Promise<string>, [string]>().mockResolvedValue(compressed)

    await expect(resolvePromptOutputWithinBudget(overBudgetUnusable, compress)).resolves.toBe(
      compressed,
    )
    expect(compress).toHaveBeenCalledTimes(1)
    expect(compress).toHaveBeenCalledWith(overBudgetUnusable)
  })

  test('normalizePromptInput accepts exact 250-character input', () => {
    expect(normalizePromptInput('x'.repeat(250), 250)).toBe('x'.repeat(250))
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
    const source = readFileSync('supabase/functions/_shared/promptBudget.ts', 'utf8')

    expect(source).toContain("from './dixitPrompts.ts'")
  })
})
