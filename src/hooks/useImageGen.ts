import { useState } from 'react'
import { api } from '@/lib/api'

export function useImageGen() {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [brief, setBrief] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate(payload: {
    prompt: string
    scope: 'round' | 'gallery'
    roomCode?: string
    roundId?: string
  }) {
    setLoading(true)
    setError(null)
    try {
      const result = await api.imageGenerate(payload)
      setImageUrl(result.imageUrl)
      setBrief(result.brief)
      setModel(result.model)
      setExpiresAt(result.expiresAt)
      return result
    } catch (e) {
      console.error('Image generation error:', e)
      const code = (e as { error?: { code?: string } })?.error?.code
      setError(code ? `errors.${code}` : 'game.imageGenError')
      return null
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setImageUrl(null)
    setBrief(null)
    setModel(null)
    setExpiresAt(null)
    setError(null)
  }

  return { loading, imageUrl, brief, model, expiresAt, error, generate, reset }
}
