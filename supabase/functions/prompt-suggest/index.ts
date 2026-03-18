import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'

const SYSTEM = `You are a creative director for Dixit, the surreal storytelling card game.
Generate ONE evocative image prompt for a Dixit card.

Rules:
- Rich with symbolism, metaphors, and double meanings
- Surreal and dreamlike, not literal
- Multiple layers of interpretation possible
- Emotional resonance — wonder, melancholy, joy, mystery
- Include specific visual details: characters, objects, setting, light, color mood
- Inspired by artists like René Magritte, Remedios Varo, Ernst Haeckel, Marc Chagall
- 2-3 sentences max

Output ONLY the prompt. No explanation, no title, no prefix.`

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) return errorResponse('CONFIG_ERROR', 'Missing OpenAI key', 500)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: 'Generate one.' }],
      temperature: 1.1,
      max_tokens: 200,
    }),
  })

  const json = (await response.json()) as { choices: Array<{ message: { content: string } }> }
  const prompt = json.choices[0]?.message.content?.trim() ?? ''

  if (!prompt) return errorResponse('AI_ERROR', 'Empty response', 500)

  return okResponse({ prompt })
})
