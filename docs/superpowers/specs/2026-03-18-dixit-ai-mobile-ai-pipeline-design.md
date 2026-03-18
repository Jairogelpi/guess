# Dixit AI Mobile - AI Pipeline Phase 1 Design Spec
**Date:** 2026-03-18
**Project:** `dixit_ai_mobile`
**Status:** Approved

---

## Overview

This spec defines phase 1 of the AI pipeline refactor for `dixit_ai_mobile`.

The goal is to improve image quality, prompt quality, reliability, and code structure without changing the game loop or rebuilding the app architecture. This phase is intentionally scoped to the AI path only:

- prompt suggestion
- prompt refinement for image generation
- Pollinations model selection
- temporary image persistence
- cleanup automation
- client contracts for AI calls

This spec extends the broader product design in `docs/superpowers/specs/2026-03-18-dixit-ai-mobile-design.md`. It does not replace it.

---

## Scope

### In scope

- Replace direct OpenAI usage with OpenRouter for text generation in:
  - `prompt-suggest`
  - `image-generate`
- Keep Pollinations as the image provider
- Upgrade the Pollinations image model from the current hardcoded choice to a better 2026 option
- Persist generated round images in Supabase Storage instead of storing only an external Pollinations URL
- Expire round images automatically after 1 hour
- Refactor AI-specific server code into reusable shared modules
- Tighten client contracts and AI error handling
- Keep the existing player flow intact: generate -> preview -> choose -> insert card row

### Out of scope

- Full game loop refactor
- Refactor of `useRoom`, `useRound`, or `useGameActions` beyond AI contract changes
- Gallery redesign or gallery storage changes beyond keeping permanent storage separate
- UI redesign of auth or tabs
- Switching image generation entirely to OpenRouter
- Adding image-to-image, reference-style uploads, moderation workflows, or analytics dashboards

---

## Why This Phase Exists

The current AI implementation has five material problems:

1. `prompt-suggest` and `image-generate` call OpenAI directly, so provider logic is duplicated and harder to change.
2. Prompt construction is monolithic and overly rigid, which makes the style strong but brittle.
3. `image-generate` returns a Pollinations URL directly, so images can disappear mid-round.
4. Client hooks use coarse error handling with hardcoded messages and limited metadata.
5. AI logic is embedded directly in function handlers instead of being isolated into reusable modules.
6. `CardGenerator` is shared by round play and gallery preview, but the current contract does not distinguish those two storage lifecycles.

These are implementation blockers, not cosmetic issues. They make planning and iteration around model quality harder than necessary.

---

## Verified Provider Choices

As of **2026-03-18**, the target provider choices for this phase are:

- Text provider: `OpenRouter`
- Recommended text model: `openai/gpt-5-mini`
- Image provider: `Pollinations`
- Primary Pollinations image model: `gptimage-large`
- Fallback Pollinations image model: `nanobanana-2`

Reasoning:

- `openai/gpt-5-mini` is a better fit than the current `gpt-4o-mini` level for prompt suggestion and prompt rewriting while staying in the "quality/cost/speed" middle ground.
- `gptimage-large` is the best quality-oriented Pollinations option currently exposed for image generation in a way that still fits the existing URL-based integration model.
- `nanobanana-2` is the fallback because it is cheaper and newer than the current Flux-based choice while still supporting text-to-image well.

This model selection should be encoded in shared config, not hardcoded inline in handler bodies.

---

## Architecture

### Principle

Use the best provider for each job:

- `OpenRouter` for language work
- `Pollinations` for image generation
- `Supabase Storage` for short-lived round asset persistence

### High-level flow

```text
Prompt suggestion:
Client -> prompt-suggest -> OpenRouter -> prompt text -> Client

Image generation:
Client prompt
  -> image-generate
  -> OpenRouter refines Dixit brief
  -> Pollinations generates image
  -> Edge Function downloads image bytes
  -> Edge Function uploads to Supabase Storage temp bucket
  -> Edge Function records expiry metadata
  -> Client receives stable URL + metadata
```

### Non-goal for this phase

The AI pipeline remains request/response based. This phase does not introduce background generation queues, websockets, or multi-step asynchronous orchestration.

---

## Target Server Modules

AI logic should be split into shared modules under `supabase/functions/_shared/`.

### `openrouter.ts`

Responsibilities:

- compose OpenRouter request headers
- call OpenRouter chat completions
- parse output safely
- normalize transport/provider errors
- enforce timeouts

### `dixitPrompts.ts`

Responsibilities:

- prompt suggestion system prompt
- image refinement system prompt
- Dixit visual anchors
- forbidden elements and quality constraints
- prompt assembly helpers

This file should preserve the useful intent from the old `DIXITAI` reference app: separate the user's subject from style constraints and negative constraints. It should not collapse back into one giant unmaintainable string.

### `pollinations.ts`

Responsibilities:

- build Pollinations image request URLs
- define primary and fallback models
- keep image parameters in one place
- normalize provider failures

### `tempAssets.ts`

Responsibilities:

- download image bytes from Pollinations
- upload to Supabase Storage
- create stable delivery URL
- record expiry metadata

### `errors.ts`

Responsibilities:

- central registry of typed AI error codes
- helper mapping from provider failures to client-safe errors

---

## Prompt Strategy

### `prompt-suggest`

`prompt-suggest` remains intentionally simple:

- input: no required payload
- output: `{ prompt: string }`

The system prompt should generate one Dixit-style concept that is:

- symbolic
- visually concrete
- emotionally evocative
- short enough to edit by hand
- useful as a playable card idea rather than generic concept art

The output should stay as plain prompt text, not JSON and not a title.

### `image-generate`

`image-generate` takes a user prompt and converts it into a refined "playable Dixit card brief".

The refinement layer must enforce:

- poetic ambiguity
- surreal but readable composition
- strong central subject
- no text, logos, interface artifacts, or photorealism
- no modern-device leakage unless explicitly requested
- painterly 2D illustration feel

The refinement layer must not:

- inject unrelated subjects
- turn every image into the same scene
- overwrite the user's core idea

The refined brief must be persisted in two places:

- in `temporary_generation_assets.refined_brief` for every generated temp asset
- in the eventual domain row that survives selection:
  - `cards.prompt` for round play
  - `gallery_cards.prompt` for saved gallery cards

This makes generation debuggable even if the image is never selected, while preserving the existing semantic meaning of `prompt` on chosen/saved cards.

---

## Storage Design

### Buckets

Use two distinct storage buckets:

- existing permanent gallery bucket
- new temporary round-image bucket for phase 1

Recommended temporary bucket id:

- `round-temp`

### Access model

Use server-managed uploads from the Edge Function with the service role key.

The client must not upload round images directly in this phase.

The stored delivery URL returned to the app should be stable for the duration of the asset's lifetime. The simplest implementation path is:

- private bucket
- function generates a signed URL with a 1 hour expiry
- that signed URL is returned to the client and stored in `cards.image_url`

This keeps access temporary without requiring new client auth logic around Storage.

Storing a 1-hour signed URL in `cards.image_url` is an accepted limitation for round assets in this phase. Long-lived access to old round images is explicitly out of scope.

### Object path

Recommended structure:

`rooms/<roomCode>/rounds/<roundId>/<userId>/<timestamp>.jpg`

This path makes cleanup and debugging straightforward.

For `scope = 'gallery'`, use:

`gallery-previews/<userId>/<timestamp>.jpg`

---

## Expiry Metadata

Add a new application table:

`public.temporary_generation_assets`

### Columns

- `id uuid primary key default gen_random_uuid()`
- `bucket_id text not null`
- `object_path text not null unique`
- `scope text not null check (scope in ('round', 'gallery'))`
- `room_code text`
- `round_id uuid`
- `owner_id uuid references profiles(id)`
- `provider text not null`
- `model text not null`
- `refined_brief text not null`
- `mime_type text not null default 'image/jpeg'`
- `expires_at timestamptz not null`
- `created_at timestamptz not null default now()`
- `deleted_at timestamptz`

### Purpose

This table is the source of truth for cleanup. The cleanup process should not try to infer expiry from `cards` or `storage.objects`.

It is also the source of truth for the stored refined brief for non-selected temp generations.

### RLS

Clients do not need direct access to this table in phase 1.

- enable RLS
- no client read/write policies
- service role only

---

## Edge Function Contracts

### `prompt-suggest`

Input:

```json
{}
```

Output:

```json
{
  "prompt": "..."
}
```

No contract change is required on the client.

### `image-generate`

Input:

```json
{
  "prompt": "string",
  "scope": "round | gallery",
  "roomCode": "ABC123",
  "roundId": "uuid"
}
```

Scope rules:

- `round` requires `roomCode` and `roundId`
- `gallery` does not require room context

`scope` is added now so the shared generator can support both existing consumers without another breaking contract.

Output:

```json
{
  "imageUrl": "https://...",
  "brief": "...",
  "provider": "pollinations",
  "model": "gptimage-large",
  "expiresAt": "2026-03-18T12:34:56.000Z"
}
```

### Compatibility note

The client currently expects `url`. Phase 1 should update the client and API wrapper to use `imageUrl` consistently rather than carrying a legacy name forward.

Current consumers that must be updated together:

- game round usage through `CardGenerator`
- gallery preview usage through `CardGenerator`
- gallery modal state that currently stores `{ url, prompt }`

---

## Error Handling

Introduce typed AI-specific error codes:

- `AI_CONFIG_ERROR`
- `PROMPT_SUGGEST_FAILED`
- `PROMPT_REFINEMENT_FAILED`
- `IMAGE_PROVIDER_FAILED`
- `TEMP_DOWNLOAD_FAILED`
- `TEMP_UPLOAD_FAILED`
- `TEMP_URL_SIGN_FAILED`
- `INVALID_SCOPE`
- `MISSING_ROOM_CONTEXT`

Rules:

- never expose raw provider payloads to the client
- log provider details server-side
- return semantic status codes
- keep client-facing messages translatable and generic

Retry policy:

- OpenRouter: one short retry on transport-level transient failure
- Pollinations: one fallback attempt from `gptimage-large` to `nanobanana-2`
- Storage upload: no repeated blind retries beyond one immediate retry if the transport breaks

---

## Cleanup Automation

### Cleanup function

Add a new Edge Function:

- `cleanup-temp-images`

Responsibilities:

1. query non-deleted rows from `temporary_generation_assets` where `expires_at <= now()`
2. delete the corresponding Storage objects through the Storage API
3. mark rows with `deleted_at = now()` once deletion succeeds
4. return a summary payload for observability

### Authentication model

This function should not depend on a user JWT.

Recommended design:

- `verify_jwt = false`
- require a shared secret header such as `x-cron-secret`
- compare it against a function secret stored in Supabase secrets

### Scheduling

Use `pg_cron` to trigger cleanup every minute.

Use `pg_net` or the supported HTTP extension path to call the Edge Function endpoint.

This gives "delete after one hour" behavior with minute-level granularity, which is good enough for the requirement.

---

## Client Changes

### `src/lib/api.ts`

Update AI contracts:

- `promptSuggest(): Promise<{ prompt: string }>`
- `imageGenerate(payload): Promise<{ imageUrl: string; brief: string; provider: string; model: string; expiresAt: string }>`

### `src/hooks/usePromptSuggest.ts`

Changes:

- keep the public hook surface minimal
- remove hardcoded Spanish fallback strings from the hook body
- map errors to i18n keys instead of raw local strings

### `src/hooks/useImageGen.ts`

Changes:

- rename local state from `url` to `imageUrl`
- preserve `brief`
- expose `model` and `expiresAt`
- replace the current catch-all failure handling with typed error mapping
- rely on server-side retry and provider fallback only; do not add client-side auto-retry loops in this phase

### `src/components/game/CardGenerator.tsx`

Changes:

- consume `imageUrl` instead of `url`
- use returned metadata without changing the user flow
- no new UI complexity in phase 1 beyond handling clearer error states if desired

### `app/(tabs)/gallery.tsx`

Changes:

- update preview state from `{ url, prompt }` to `{ imageUrl, prompt }`
- call `image-generate` with `scope = 'gallery'`
- continue saving to permanent gallery storage only when the user explicitly confirms

---

## Supabase Project Target

This phase is designed against the Supabase project:

- project ref: `ctjelsuchvzvdjvqdzub`

Confirmed current state:

- core game tables already exist
- one Storage bucket already exists
- deployed functions include `room-create`, `room-join`, `room-leave`, `image-generate`, `game-action`, and `prompt-suggest`

This means phase 1 is an incremental schema and function update, not a greenfield deploy.

---

## Security Notes

- The OpenRouter key must be stored only as a Supabase Edge Function secret.
- Any OpenRouter key previously exposed in chat or local files should be rotated before production use.
- Temporary round images should not share the gallery bucket.
- Cleanup must use the Storage API, not direct SQL deletion from `storage.objects`.

---

## Testing and Verification

### Function verification

- `prompt-suggest` returns a valid prompt through OpenRouter
- `image-generate` returns a stable `imageUrl`, `brief`, `model`, and `expiresAt`
- fallback model path works when primary generation fails
- storage upload succeeds and object metadata row is written

### Cleanup verification

- create an expired temp asset fixture
- run `cleanup-temp-images`
- verify the object is removed from Storage
- verify the metadata row is marked deleted or removed

### Client verification

- `CardGenerator` still supports generate -> preview -> choose
- no broken image regression after replacing direct Pollinations URLs
- typecheck passes

### Post-change Supabase verification

- run advisors after schema and policy changes
- confirm no broken RLS expectations on existing gameplay tables

---

## Implementation Boundaries for Planning

The resulting implementation plan should be limited to these workstreams:

1. add schema and storage support for temporary AI assets
2. refactor shared AI server modules
3. update `prompt-suggest` to OpenRouter
4. update `image-generate` to OpenRouter + Pollinations + Storage temp persistence
5. add cleanup function and cron scheduling
6. update client contracts and hooks
7. verify end-to-end generation and cleanup

If planning starts to include lobby refactors, profile redesigns, or general game-state cleanup, the scope has drifted beyond this spec.
