import { handleCors } from '../_shared/cors.ts'
import { errorResponse, okResponse } from '../_shared/types.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const schema = z.object({ prompt: z.string().min(1).max(500) })

const DIXIT_STYLE = `MANDATORY DIXIT CARD STYLE — applied to every generation without exception.
OFFICIAL STYLE: Marie Cardouat's signature Dixit illustration technique. NON-NEGOTIABLE.
MEDIUM: Traditional gouache and watercolor mixed media; opaque color areas with translucent washes,
visible organic brush strokes, subtle texture, painterly surface, hand-painted authenticity.
PALETTE: Rich saturated yet soft harmonies — deep oceanic blues, forest greens, warm earth tones,
coral pinks, golden yellows, creamy whites. Warm vintage palette (teal, saffron, coral, olive).
Soft bloom and gentle desaturation. Avoid neon.
LIGHTING: Cinematic dramatic with soft edges — strong directional light, mysterious ambient glow,
subtle rim lighting on characters, rich color-filled shadows, luminous atmosphere.
COMPOSITION: Vertical 2:3 card format, sophisticated visual hierarchy, rich detailed backgrounds,
multiple story layers, balanced negative space, subtle natural vignetting.
CHARACTER REQUIREMENTS: Extremely stylized elongated proportions, graceful flowing poses,
expressive simplified features, flowing clothing and hair, elegant gesture language.
ENVIRONMENT: Incredibly detailed atmospheric backgrounds — architectural elements, natural landscapes,
interior spaces — all with rich narrative depth and symbolic meaning. Backgrounds NEVER empty.
TECHNIQUE: 2D stylized illustration — simplified volumes, flat/painterly shading (no photoreal textures),
optional subtle linework, no camera artifacts, no lens blur/bokeh, no CGI/3D, no ray tracing.
WATERCOLOR TEXTURE: visible granulation, paper grain, subtle speckling, edge bleeding along color boundaries.
POETIC AMBIGUITY: One subtle metaphor or double reading connected to the theme — comets, threads, giant leaves,
fish, ladders — without adding unrelated subjects.
TIMELESSNESS: No contemporary items (no computer monitors, modern blinds, UI, brand-like shapes).
ABSOLUTELY FORBIDDEN: No text, letters, numbers, logos, watermarks, photorealism, digital artifacts.`

const DIXIT_SYSTEM = `MANDATORY: Transform user's request into AUTHENTIC Marie Cardouat Dixit card style. NON-NEGOTIABLE.

FORCED STYLE COMPLIANCE: Every output MUST match Marie Cardouat's signature Dixit illustration technique exactly.
REQUIRED TECHNIQUE: Gouache watercolor mixed media, visible brush strokes, painterly surface, hand-painted quality.
STRICT 2D: Produce a 2D stylized illustration look (no photorealism, no camera/lens effects, no 3D/CGI).
TEXTURE REQUIREMENT: Watercolor/gouache granulation, paper grain, subtle speckling and edge bleeding.
COLOR REQUIREMENT: Warm vintage palette (teal, saffron, coral, olive) with soft bloom; avoid neon/high-chroma.

MANDATORY ENHANCEMENTS:
- Characters: ALWAYS extremely elongated graceful proportions, flowing poses, expressive simplified faces
- Environment: ALWAYS incredibly detailed atmospheric backgrounds (architectural/landscape richness)
- Lighting: ALWAYS dramatic directional lighting with soft edges, rich colored shadows, luminous glow
- Palette: ALWAYS deep oceanic blues, forest greens, warm earth tones, coral pinks, golden highlights
- Composition: ALWAYS sophisticated visual hierarchy, multiple narrative layers, natural vignetting
- Symbolism: Introduce ONE subtle metaphor tied to the theme without changing subjects
- Timelessness: Prefer props and settings without overtly modern specifics

ABSOLUTE REQUIREMENTS:
- MUST look exactly like an authentic Dixit card by Marie Cardouat
- NEVER add subjects not in user's request
- NEVER alter user's core concept — only enhance with official Dixit visual treatment
- INTELLIGENT INTERPRETATION: Transform literal concepts into poetic visual metaphors
- ARTISTIC SOPHISTICATION: Elevate simple prompts with rich symbolic depth and narrative layers
- Output single focused paragraph under 1000 characters describing exact scene in Dixit style`

function makePollinationsUrl(prompt: string, seed: number): string {
  const enforced = `DIXIT CARD STYLE (2D ILLUSTRATION): ${prompt}. Marie Cardouat illustration style; gouache+watercolor with visible granulation, paper grain and edge bleeding; subtle pencil underdrawing; flat painterly shading, simplified volumes; warm vintage palette (teal, saffron, coral, olive) with soft bloom; gentle surreal metaphor tied to prompt; elongated proportions; cinematic diffuse light with rim light; rich narrative background; timeless props (no modern devices); no photorealism, no lens effects, no 3D.`
  const params = new URLSearchParams({
    seed: String(seed),
    model: 'flux-illumin8',
    width: '768',
    height: '1152',
    nologo: 'true',
  })
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(enforced)}?${params}`
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  const body = schema.safeParse(await req.json())
  if (!body.success) return errorResponse('INVALID_PAYLOAD', body.error.message)

  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) return errorResponse('CONFIG_ERROR', 'Missing OpenAI key', 500)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: DIXIT_SYSTEM },
        { role: 'user', content: `User prompt: ${body.data.prompt}\nStyle anchors:\n${DIXIT_STYLE}` },
      ],
      temperature: 0.3,
    }),
  })
  const json = (await response.json()) as { choices: Array<{ message: { content: string } }> }
  const brief = json.choices[0]?.message.content?.trim() ?? body.data.prompt

  const seed = Math.floor(Math.random() * 2_147_483_647)
  const url = makePollinationsUrl(brief, seed)

  return okResponse({ url, brief })
})
