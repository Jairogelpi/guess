# Dixit AI Mobile - Prompt Creativity Escalation Design
**Date:** 2026-04-01
**Project:** `dixit_ai_mobile`
**Status:** Draft

---

## Overview

This spec redesigns the creative text pipeline behind the three prompt-related actions in `dixit_ai_mobile`:

- `Sugerir idea Dixit`
- `Mejorar idea`
- `Generar carta`

The current pipeline already enforces a recognizable Dixit-inspired style, but it is too rigid and too generic. Results often sound polished without being visually dense, surprising, or distinct. The target outcome for this phase is:

- much richer scene construction
- more surreal and memorable cards
- stronger variation between generations
- strict preservation of the user's core idea when enhancing or generating
- a hard `250` character ceiling anywhere the app generates or returns card prompt text

This is a prompt-quality phase only. It does not redesign the gameplay loop, storage model, or client UI structure.

---

## Problem Statement

The current prompt pipeline has three creative weaknesses:

1. `Sugerir idea Dixit` often produces attractive but shallow prompts that feel interchangeable.
2. `Mejorar idea` uses the same general refinement path as final generation, so it does not behave like a true "amplifier" of the player's idea.
3. `Generar carta` still tends to collapse toward safe, sparse, repeated compositions because the final brief emphasizes style consistency more than scene richness.

This leads to cards that are:

- too generic
- too empty in the background
- too similar to one another
- not "paranoid" or dense enough to feel like vivid Dixit cards

At the same time, the system must not solve this by drifting away from the user's concept. The project goal is not randomness. The goal is controlled escalation.

---

## Design Goal

The creative hierarchy for this phase is:

`respect the idea > enrich the idea > make the card unique`

This means:

- user subject, action, and core motif remain protected
- the system adds worldbuilding, symbolism, visual tension, and memorable details
- the final scene becomes much denser and stranger without becoming unrelated

The desired tone is:

- surreal but readable
- crowded but still legible
- symbolically charged
- visually concrete
- narratively suggestive

---

## Scope

### In scope

- redesign prompt-building behavior for all three creative actions
- split suggestion, enhancement, and generation into distinct prompt strategies
- add stronger anti-generic guardrails
- increase scene density, secondary detail, and surreal variety
- enforce a hard `250` character budget on generated prompt text used by the app
- keep outputs as plain text rather than structured JSON
- add tests that verify prompt-builder intent and routing behavior

### Out of scope

- UI redesign or button relabeling
- provider changes away from OpenRouter + Pollinations
- storage or temp-asset changes
- game loop, scoring, round flow, or gallery refactors
- introducing moderation, analytics, background jobs, or multi-step orchestration

---

## Product Behavior

### 1. `Sugerir idea Dixit`

This action should return a card-ready scene, not a vague concept. Each suggestion must feel immediately paintable.

Required creative shape:

- one clear main subject
- one recognizable setting
- two or three memorable secondary elements
- one surreal or symbolic anomaly tied to the scene
- a readable emotional or narrative tension

The output should stop sounding like:

- a poetic title
- a mood fragment
- generic "dreamlike" concept art

Instead it should sound like a full card idea someone could imagine at a glance.

Length rule:

- output must be `<= 250` characters
- density must come from precise nouns and scene choices, not from longer text

### 2. `Mejorar idea`

This action must preserve the player's original scene while making it much richer.

Protected inputs:

- main subject
- main action
- central motif

Expandable inputs:

- environment
- scale
- lighting
- architecture
- props and symbolic objects
- background activity
- atmospheric tension
- one coherent surreal twist

The intended behavior is:

- same idea
- more world
- more contrast
- more narrative layers
- more visual specificity

Length rule:

- output must be `<= 250` characters
- the builder must compress rather than spill over into a long paragraph

### 3. `Generar carta`

This action must convert the current idea into a dense, highly visual image brief for the image model.

It should not invent a different concept. Its job is to increase image readiness:

- clearer composition
- stronger spatial layering
- more material and texture cues
- more specific lighting
- richer background storytelling
- more microdetails that prevent flat cards

This stage should be the most visually precise and the least semantically loose of the three.

Length rule:

- the refined brief returned by `image-generate` must be `<= 250` characters
- if extra provider style wrapping is needed in `pollinations.ts`, that wrapper lives outside the creative text budget

---

## Character Budget

The `250` character limit is a product constraint, not a soft prompt preference.

It must apply anywhere the app generates prompt text that is returned, displayed, edited, or persisted as the card prompt:

- `prompt-suggest` suggestion output
- `prompt-suggest` enhancement output
- `image-generate` refined `brief`
- any prompt text later written into `cards.prompt` or gallery-equivalent prompt fields

Implementation consequences:

- the server should validate user prompt input at `250` characters, not `500`
- prompt builders must explicitly optimize for compact density
- tests must fail if builder instructions allow over-budget outputs

This budget should not reduce richness by making text vague. It should force the model to choose stronger details instead of longer prose.

---

## Target Architecture

The creative pipeline should stop treating suggestion, enhancement, and final image generation as the same language task.

### Shared builders in `supabase/functions/_shared/dixitPrompts.ts`

Introduce or refactor toward three separate builders:

- `buildSuggestionMessages()`
- `buildEnhancementMessages(userPrompt: string)`
- `buildGenerationBriefMessages(prompt: string)`

### Routing

- `prompt-suggest` with no `basePrompt` uses `buildSuggestionMessages()`
- `prompt-suggest` with `basePrompt` uses `buildEnhancementMessages(basePrompt)`
- `image-generate` uses `buildGenerationBriefMessages(prompt)`

This keeps the current client interaction model intact while giving each action a dedicated creative role.

---

## Creative Strategy Per Stage

### Suggestion strategy

The suggestion system prompt should ask for a playable Dixit card idea with internal density requirements.

It should explicitly require:

- a scene, not an abstract concept
- strong objects and setting cues
- multiple visual anchors inside the same frame
- a surprising but coherent anomaly
- enough specificity to be edited by hand

It should explicitly reject:

- isolated "mysterious figure" scenes
- empty dream landscapes
- generic floating lights, birds, clouds, or magical particles unless they are essential to the scene
- phrases that describe mood without describing drawable elements

Suggested model behavior:

- relatively high temperature
- creative freedom within the playable-card frame

### Enhancement strategy

The enhancement prompt should frame the user's text in two zones:

- locked scene core
- expandable visual world

The locked scene core preserves:

- who or what the scene is about
- what is happening
- what the central visual premise is

The expandable world can intensify:

- surroundings
- symbolic props
- environmental storytelling
- texture and atmosphere
- scale contrasts
- subtle surreal tension

This prompt should explicitly forbid replacing the user's core concept with a different one.

Suggested model behavior:

- medium temperature
- controlled expansion rather than reinvention

### Generation brief strategy

The final brief prompt should translate the current text into an image-ready painting description for Pollinations.

It should require the final brief to include:

- central composition
- foreground / midground / background layering
- concrete objects and surfaces
- lighting direction and mood
- painterly material cues
- dense but coherent background narrative
- one or more memorable secondary details that keep the card from feeling empty

This stage should be stricter than enhancement about visual concreteness and should avoid vague adjectives that add no drawable information.

Suggested model behavior:

- lower temperature
- higher precision

---

## Anti-Generic Guardrails

The new prompt builders should explicitly push against low-information outputs.

### Required qualities

- visual density
- specific drawable objects
- recognizable setting
- strong contrast or tension
- symbolic detail connected to the theme
- varied scene grammar across outputs

### Forbidden patterns

- "a mysterious figure in a dreamlike landscape"
- "floating lights" with no concrete narrative purpose
- empty or blurred backgrounds
- repetitive stock-surreal imagery unrelated to the user's idea
- adjective-heavy sentences that do not add new objects, actions, or spatial information

### Guardrail principle

If a sentence sounds beautiful but does not help an illustrator or image model add distinct elements to the frame, it is not useful enough.

---

## Style System Adjustment

The project should keep the Dixit / Marie Cardouat-inspired anchor, but the style block should stop dominating scene design so aggressively that every output converges toward the same picture.

### Keep

- painterly 2D illustration
- gouache / watercolor feel
- vintage palette
- elongated stylization
- poetic surrealism
- no photorealism
- no modern-device leakage unless requested

### Change

- reduce repeated phrasing that hardcodes one recurring composition style
- shift emphasis from "official style compliance at all costs" toward "style-consistent but scene-rich"
- preserve the user's concept first, then apply the style treatment

The style system remains important, but it should behave as a visual lens rather than a content replacement engine.

---

## Endpoint Behavior

### `prompt-suggest`

Contract stays:

```json
{
  "prompt": "..."
}
```

Behavior changes:

- empty payload returns a richer original card idea
- `{ basePrompt }` returns an enriched version of the same idea, not the same generic refinement used by image generation

### `image-generate`

Contract can remain unchanged for the client:

```json
{
  "imageUrl": "https://...",
  "brief": "...",
  "provider": "pollinations",
  "model": "string",
  "expiresAt": "2026-04-01T12:34:56.000Z"
}
```

Behavior changes:

- `brief` becomes denser, more visual, and less template-like
- final prompts should contain materially richer scene instructions before Pollinations style wrapping is applied
- returned `brief` must remain within `250` characters

---

## Testing Strategy

Add prompt-focused unit coverage around the shared builder layer and endpoint routing.

### Required tests

- suggestion builder requires scene + setting + secondary details + surreal twist
- enhancement builder preserves the user's scene core while expanding the environment
- generation brief builder emphasizes concrete visual layering and non-empty backgrounds
- suggestion output is explicitly constrained to `<= 250` characters
- enhancement output is explicitly constrained to `<= 250` characters
- generation brief output is explicitly constrained to `<= 250` characters
- prompt-suggest routes empty requests to suggestion mode
- prompt-suggest routes `basePrompt` requests to enhancement mode
- generic filler phrases are blocked or explicitly discouraged in the builder output

### Verification intent

These tests should not try to validate model creativity directly. They should validate that the prompts sent to the model encode the intended behavior and constraints.

---

## Success Criteria

This phase is successful when:

- suggestions feel like fully formed card scenes instead of vague concepts
- enhancements preserve user intent while noticeably increasing density and strangeness
- generated briefs produce cards with fuller backgrounds and more memorable elements
- outputs vary more from one another while still reading as part of the same art direction
- the system no longer collapses so often into sparse, generic surreal imagery
- generated prompt text respects the `250` character ceiling everywhere the app uses it

---

## Implementation Boundaries For Planning

The implementation plan for this spec should stay limited to:

1. refactor `dixitPrompts.ts` into distinct builder paths
2. update `prompt-suggest` to route suggestion vs enhancement explicitly
3. update `image-generate` to use a dedicated generation-brief builder
4. enforce the `250` character budget in request validation and generated outputs
5. add or update tests around prompt builders and endpoint behavior
6. verify the returned `brief` and suggested prompts are denser, less generic, and within budget

Planning should not expand into UI redesign, provider replacement, or unrelated gameplay work.
