import { useState } from 'react'
import { api } from '@/lib/api'

export function useImageGen() {
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [brief, setBrief] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate(prompt: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await api.imageGenerate({ prompt })
      setUrl(result.url)
      setBrief(result.brief)
      return result
    } catch {
      setError('IMAGE_GEN_ERROR')
      return null
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setUrl(null)
    setBrief(null)
    setError(null)
  }

  return { loading, url, brief, error, generate, reset }
}
