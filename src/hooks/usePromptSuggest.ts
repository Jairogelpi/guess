import { useState } from 'react'
import { api } from '@/lib/api'

export function usePromptSuggest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function suggest(): Promise<string | null> {
    setLoading(true)
    setError(null)
    try {
      const result = await api.promptSuggest()
      return result.prompt
    } catch (e) {
      console.error('Prompt suggestion error:', e)
      const code = (e as { error?: { code?: string } })?.error?.code
      setError(code ? `errors.${code}` : 'game.suggestError')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, suggest }
}
