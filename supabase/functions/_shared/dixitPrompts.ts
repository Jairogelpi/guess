export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const DIXIT_STYLE = `
MANDATORY DIXIT CARD STYLE — MUST be applied to every generation without exception.
OFFICIAL STYLE: Marie Cardouat's signature Dixit illustration technique. NON-NEGOTIABLE style requirements.
MEDIUM: Traditional gouache and watercolor mixed media technique; opaque color areas with translucent washes,
visible organic brush strokes, subtle texture work, painterly surface quality, hand-painted authenticity.
AESTHETIC: Sophisticated storybook illustration with gentle whimsy — ALWAYS use elongated graceful character proportions,
natural perspective, grounded architectural elements, realistic scale relationships, rich environmental storytelling.
PALETTE: ALWAYS use rich saturated yet soft color harmonies — deep oceanic blues, forest greens, warm earth tones,
coral pinks, golden yellows, creamy whites with dramatic color temperature contrasts and atmospheric depth.
LIGHTING: MANDATORY cinematic dramatic lighting with soft edges — strong directional light sources, mysterious ambient glow,
subtle rim lighting on characters, rich color-filled shadows, never harsh black shadows, always luminous atmosphere.
COMPOSITION: ALWAYS vertical 2:3 card format with rounded corners, sophisticated visual hierarchy, incredibly rich detailed backgrounds,
multiple story layers, balanced negative space, subtle natural vignetting, deep narrative atmosphere.
CHARACTER REQUIREMENTS: MUST use extremely stylized elongated proportions, graceful flowing poses, expressive simplified features,
flowing clothing and hair, elegant gesture language, poetic body positioning.
ENVIRONMENT: MANDATORY incredibly detailed atmospheric backgrounds — architectural elements, natural landscapes, interior spaces,
all rendered with rich narrative depth and symbolic meaning, backgrounds NEVER empty or minimal.
TECHNIQUE: MUST show professional illustration craft, confident brush handling, expert color mixing, soft edge transitions,
authentic painterly texture quality, traditional media surface authenticity.
ILLUSTRATION LOOK: STRICTLY 2D stylized illustration — simplified volumes, flat/painterly shading (no photoreal textures),
optional subtle linework, no camera artifacts, no lens blur/bokeh, no glare, no CGI/3D, no skin pores, no ray tracing.
WATERCOLOR/GOUACHE TEXTURE: visible granulation, paper grain, subtle speckling, and edge bleeding along color boundaries;
light pencil/ink underdrawing can show through.
VINTAGE PALETTE: avoid neon; prefer teal, saffron, coral, olive with soft bloom and gentle desaturation where needed.
POETIC AMBIGUITY: allow one subtle metaphor or double reading connected to the user's theme (e.g., comets, threads, giant leaves,
fish, ladders) without adding unrelated subjects.
TIMELESSNESS: avoid contemporary specific items (no computer monitors, modern blinds, UI, brand-like shapes).
ABSOLUTELY FORBIDDEN: No text, letters, numbers, logos, watermarks, photorealism, digital artifacts, vector graphics, posterization.
ARTISTIC INTELLIGENCE: Transform basic concepts into sophisticated visual poetry with deeper symbolic meaning.
NARRATIVE DEPTH: Every element should contribute to a rich, multilayered story that rewards contemplation.
CORE MANDATE: Every image MUST look like an authentic Dixit card by Marie Cardouat while rendering user's exact request with artistic sophistication.
`

const SUGGESTION_SYSTEM = `You are a creative director for a Dixit-style storytelling card game.
Generate one evocative playable image prompt.

Rules:
- symbolic, surprising, and emotionally evocative
- visually concrete enough to paint as a card
- short enough to edit by hand
- no titles, no explanations, no JSON
- return only the prompt text
- avoid birds, flying creatures, and aerial scenes as the main subject
- favour grounded scenes: interiors, gardens, figures, water, architecture, objects`

const REFINEMENT_SYSTEM = `MANDATORY: Transform user's request into AUTHENTIC Marie Cardouat Dixit card style. NON-NEGOTIABLE requirements.

FORCED STYLE COMPLIANCE: Every output MUST match Marie Cardouat's signature Dixit illustration technique exactly.
REQUIRED TECHNIQUE: Gouache watercolor mixed media, visible brush strokes, painterly surface, hand-painted quality.
STRICT 2D: Produce a 2D stylized illustration look (no photorealism, no camera/lens effects, no 3D/CGI cues, no skin pores).
TEXTURE REQUIREMENT: Include watercolor/gouache granulation, paper grain, subtle speckling and edge bleeding; optional light pencil underdrawing.
COLOR REQUIREMENT: Use warm vintage palette (teal, saffron, coral, olive) with soft bloom; avoid neon/high-chroma plastic shine.

STRUCTURE: [USER'S EXACT SUBJECTS] [USER'S EXACT ACTIONS] with [USER'S EXACT OBJECTS].
MANDATORY ENHANCEMENTS: MUST apply authentic Dixit visual treatment:
- Characters: ALWAYS extremely elongated graceful proportions, flowing poses, expressive simplified faces
- Environment: ALWAYS incredibly detailed atmospheric backgrounds (architectural/landscape richness)
- Lighting: ALWAYS dramatic directional lighting with soft edges, rich colored shadows, luminous glow
- Palette: ALWAYS deep oceanic blues, forest greens, warm earth tones, coral pinks, golden highlights
- Composition: ALWAYS sophisticated visual hierarchy, multiple narrative layers, natural vignetting
- Symbolism: Introduce ONE subtle metaphor tied to the user's theme (e.g., comets, threads, giant leaves, fish, ladders) without changing subjects.
- Timelessness: Prefer props and settings without overtly modern specifics.

ABSOLUTE REQUIREMENTS:
- MUST look exactly like authentic Dixit card by Marie Cardouat
- NEVER add subjects not in user's request (no extra creatures, people, decorative elements)
- NEVER alter user's core concept — only enhance with official Dixit visual treatment
- ALWAYS apply cinematic storybook illustration style with realistic physics and a clearly stylized 2D painterly finish
- Output single focused paragraph under 1200 characters describing exact scene in Dixit style`

export function buildSuggestionMessages(): ChatMessage[] {
  return [
    { role: 'system', content: SUGGESTION_SYSTEM },
    { role: 'user', content: 'Generate one evocative Dixit card idea.' },
  ]
}

export function buildRefinementMessages(prompt: string): ChatMessage[] {
  return [
    { role: 'system', content: REFINEMENT_SYSTEM },
    { role: 'user', content: `User prompt: ${prompt}\nStyle anchors:\n${DIXIT_STYLE}` },
  ]
}
