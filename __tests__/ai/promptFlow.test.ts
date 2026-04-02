import {
  buildEnhancementMessages,
  buildSuggestionMessages,
} from '../../supabase/functions/_shared/dixitPrompts'
import { PromptBudgetValidationError } from '../../supabase/functions/_shared/promptBudget'
import { resolvePromptSuggestRequest } from '../../supabase/functions/_shared/promptFlow'

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
})
