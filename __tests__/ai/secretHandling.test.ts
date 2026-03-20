import { AI_ERROR_CODES } from '../../supabase/functions/_shared/errors'
import { callOpenRouter } from '../../supabase/functions/_shared/openrouter'
import { getPollinationsApiKey } from '../../supabase/functions/_shared/pollinations'

describe('AI secret handling', () => {
  const originalDeno = (globalThis as { Deno?: unknown }).Deno
  const originalFetch = global.fetch

  afterEach(() => {
    ;(globalThis as { Deno?: unknown }).Deno = originalDeno
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  test('callOpenRouter fails with AI_CONFIG_ERROR when OPENROUTER_API_KEY is missing', async () => {
    ;(globalThis as { Deno?: unknown }).Deno = {
      env: {
        get: () => undefined,
      },
    }
    global.fetch = jest.fn()

    await expect(
      callOpenRouter({
        messages: [{ role: 'user', content: 'test prompt' }],
        temperature: 0.3,
      }),
    ).rejects.toMatchObject({
      code: AI_ERROR_CODES.AI_CONFIG_ERROR,
      message: 'Missing OpenRouter API key',
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  test('getPollinationsApiKey returns undefined when POLLINATIONS_API_KEY is missing', () => {
    ;(globalThis as { Deno?: unknown }).Deno = {
      env: {
        get: () => undefined,
      },
    }

    expect(getPollinationsApiKey()).toBeUndefined()
  })
})
