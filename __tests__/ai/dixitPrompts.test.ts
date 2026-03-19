import { buildRefinementMessages, buildSuggestionMessages } from '../../supabase/functions/_shared/dixitPrompts'

describe('dixitPrompts', () => {
  test('buildSuggestionMessages returns system and user prompt pair', () => {
    const messages = buildSuggestionMessages()

    expect(messages).toHaveLength(2)
    expect(messages[0]!.role).toBe('system')
    expect(messages[1]!.role).toBe('user')
    expect(messages[1]!.content).toContain('Generate one')
  })

  test('buildRefinementMessages keeps user idea while adding Dixit constraints', () => {
    const messages = buildRefinementMessages('a fox carrying a lighthouse')
    const userMessage = messages.find((message) => message.role === 'user')

    expect(userMessage?.content).toContain('a fox carrying a lighthouse')
    expect(userMessage?.content).toContain('Dixit')
  })
})
