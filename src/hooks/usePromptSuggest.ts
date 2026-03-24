import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useUIStore } from '@/stores/useUIStore'
import type { EdgeFunctionError } from '@/types/game'

/**
 * Requests an AI-generated Dixit prompt suggestion from the server.
 *
 * On failure, shows a user-visible toast (same pattern as `useImageGen`) and
 * returns `null` so the caller can decide how to handle an empty result.
 */
export function usePromptSuggest() {
  const showToast = useUIStore((s) => s.showToast)
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function suggest(basePrompt?: string): Promise<string | null> {
    setLoading(true)
    setError(null)
    try {
      const result = await api.promptSuggest(basePrompt ? { basePrompt } : undefined)
      return result.prompt
    } catch (e) {
      console.error('Prompt suggestion error:', e)
      const code = (e as { error?: EdgeFunctionError })?.error?.code
      const errorKey = code ? `errors.${code}` : 'game.suggestError'
      setError(errorKey)
      showToast(t(errorKey), 'error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, suggest }
}
