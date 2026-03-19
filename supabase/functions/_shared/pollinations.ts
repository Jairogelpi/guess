export interface BuildPollinationsImageUrlParams {
  prompt: string
  model: string
  seed: number
}

const FALLBACK_POLLINATIONS_API_KEY = 'sk_F4DOb1aDpVMBV1gp3qw7TJYJjqBH3vA8'

export function getPollinationsModels() {
  return {
    primary: 'flux',
    fallback: 'dirtberry',
  } as const
}

export function getPollinationsApiKey() {
  const runtime = globalThis as {
    Deno?: {
      env?: {
        get: (name: string) => string | undefined
      }
    }
  }

  return runtime.Deno?.env?.get('POLLINATIONS_API_KEY') ?? FALLBACK_POLLINATIONS_API_KEY
}

export function buildPollinationsAuthHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
  }
}

const DIXIT_PROMPT_PREFIX =
  'DIXIT CARD STYLE (2D ILLUSTRATION): '

const DIXIT_PROMPT_SUFFIX =
  '. Marie Cardouat illustration style; gouache+watercolor with visible granulation, paper grain and edge bleeding; subtle pencil underdrawing; flat painterly shading, simplified volumes; warm vintage palette (teal, saffron, coral, olive) with soft bloom; gentle surreal metaphor tied to prompt; elongated proportions; cinematic diffuse light with rim light; rich narrative background; timeless props (no modern devices); no photorealism, no lens effects, no 3D.'

export function buildPollinationsImageUrl({
  prompt,
  model,
  seed,
}: BuildPollinationsImageUrlParams) {
  const dixitPrompt = `${DIXIT_PROMPT_PREFIX}${prompt}${DIXIT_PROMPT_SUFFIX}`
  const params = new URLSearchParams({
    model,
    seed: String(seed),
    width: '768',
    height: '1152',
    nologo: 'true',
  })

  return `https://gen.pollinations.ai/image/${encodeURIComponent(dixitPrompt)}?${params}`
}
