# Dixit AI Mobile AI Pipeline Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the AI generation path to use OpenRouter for text, Pollinations for images, Supabase Storage for 1-hour round assets, and typed client contracts without changing the game loop.

**Architecture:** Keep the client thin and move AI orchestration into Supabase Edge Functions. Pure prompt/model logic lives in shared modules with unit tests; provider calls, temporary asset uploads, and cleanup scheduling live in Edge Functions plus Supabase infrastructure. Use Supabase MCP for remote schema changes, function deployment, cron setup, and advisor checks.

**Tech Stack:** Expo SDK 55, TypeScript, Jest + ts-jest, Supabase Postgres/Storage/Edge Functions, pg_cron, pg_net, Vault, OpenRouter (`openai/gpt-5-mini`), Pollinations (`gptimage-large` + fallback), i18next

**Spec:** `docs/superpowers/specs/2026-03-18-dixit-ai-mobile-ai-pipeline-design.md`

---

## File Map

```text
dixit_ai_mobile/
├── __tests__/
│   └── ai/
│       ├── dixitPrompts.test.ts          # Prompt builder and contract tests
│       ├── pollinations.test.ts          # Model selection and URL builder tests
│       └── tempAssets.test.ts            # Temp object path + expiry helper tests
├── app/
│   └── (tabs)/
│       └── gallery.tsx                   # Gallery preview flow consumes new imageUrl contract
├── docs/
│   └── superpowers/
│       └── plans/
│           └── 2026-03-18-dixit-ai-mobile-ai-pipeline.md
├── src/
│   ├── components/
│   │   └── game/
│   │       └── CardGenerator.tsx         # Shared round/gallery generator UI
│   ├── hooks/
│   │   ├── useImageGen.ts                # Typed image generation state
│   │   ├── usePromptSuggest.ts           # Typed prompt suggestion state
│   │   └── useGameActions.ts             # Unchanged API surface for card insert; verify compatibility
│   ├── i18n/
│   │   └── locales/
│   │       ├── en.json                   # New AI error strings
│   │       └── es.json                   # New AI error strings
│   ├── lib/
│   │   └── api.ts                        # Updated Edge Function contracts
│   └── types/
│       └── game.ts                       # Regenerated DB types including temp asset table if exposed
└── supabase/
    ├── migrations/
    │   └── 20260318143000_ai_pipeline_phase_1.sql
    └── functions/
        ├── cleanup-temp-images/
        │   └── index.ts                  # Scheduled cleanup endpoint
        ├── image-generate/
        │   └── index.ts                  # OpenRouter + Pollinations + temp storage
        ├── prompt-suggest/
        │   └── index.ts                  # OpenRouter-backed suggestion endpoint
        └── _shared/
            ├── dixitPrompts.ts           # Suggestion/refinement prompt builders
            ├── errors.ts                 # Typed AI error registry
            ├── openrouter.ts             # OpenRouter transport helpers
            ├── pollinations.ts           # Pollinations URL builder + fallback model selection
            ├── supabaseAdmin.ts          # Shared service-role client creation
            ├── tempAssets.ts             # Download/upload/signed URL helpers
            └── types.ts                  # Shared JSON response helpers (extend if needed)
```

---

## Phase 1 - Pure AI Helpers
*Testable milestone: prompt/model/path helpers exist, are covered by Jest, and can be reused by both Edge Functions.*

### Task 1: Build Prompt, Model, and Temp-Path Helpers with Unit Tests

**Files:**
- Create: `__tests__/ai/dixitPrompts.test.ts`
- Create: `__tests__/ai/pollinations.test.ts`
- Create: `__tests__/ai/tempAssets.test.ts`
- Create: `supabase/functions/_shared/dixitPrompts.ts`
- Create: `supabase/functions/_shared/pollinations.ts`
- Create: `supabase/functions/_shared/errors.ts`
- Create: `supabase/functions/_shared/tempAssets.ts`

- [ ] **Step 1: Write failing tests for prompt builders**

```typescript
import { buildSuggestionMessages, buildRefinementMessages } from '../../supabase/functions/_shared/dixitPrompts'

test('buildSuggestionMessages returns system + user prompt pair', () => {
  const messages = buildSuggestionMessages()
  expect(messages).toHaveLength(2)
  expect(messages[0].role).toBe('system')
  expect(messages[1].content).toContain('Generate one')
})

test('buildRefinementMessages keeps user idea while adding Dixit constraints', () => {
  const messages = buildRefinementMessages('a fox carrying a lighthouse')
  const userMessage = messages.find((message) => message.role === 'user')
  expect(userMessage?.content).toContain('a fox carrying a lighthouse')
  expect(userMessage?.content).toContain('Dixit')
})
```

- [ ] **Step 2: Write failing tests for Pollinations helpers**

```typescript
import { buildPollinationsImageUrl, getPollinationsModels } from '../../supabase/functions/_shared/pollinations'

test('getPollinationsModels exposes primary and fallback model ids', () => {
  expect(getPollinationsModels()).toEqual({
    primary: 'gptimage-large',
    fallback: 'nanobanana-2',
  })
})

test('buildPollinationsImageUrl encodes prompt, model, and size', () => {
  const url = buildPollinationsImageUrl({ prompt: 'painted moon horse', model: 'gptimage-large', seed: 7 })
  expect(url).toContain('gptimage-large')
  expect(url).toContain('seed=7')
  expect(url).toContain('width=768')
  expect(url).toContain('height=1152')
})
```

- [ ] **Step 3: Write failing tests for temp asset helpers**

```typescript
import { buildTempAssetPath, buildExpiryIso } from '../../supabase/functions/_shared/tempAssets'

test('buildTempAssetPath uses round folder structure', () => {
  const path = buildTempAssetPath({
    scope: 'round',
    roomCode: 'ABCD12',
    roundId: 'round-1',
    userId: 'user-1',
    timestampMs: 1700000000000,
  })
  expect(path).toBe('rooms/ABCD12/rounds/round-1/user-1/1700000000000.jpg')
})

test('buildTempAssetPath uses gallery preview structure', () => {
  const path = buildTempAssetPath({
    scope: 'gallery',
    userId: 'user-1',
    timestampMs: 1700000000000,
  })
  expect(path).toBe('gallery-previews/user-1/1700000000000.jpg')
})

test('buildExpiryIso adds one hour', () => {
  expect(buildExpiryIso('2026-03-18T12:00:00.000Z')).toBe('2026-03-18T13:00:00.000Z')
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test -- --runInBand __tests__/ai/dixitPrompts.test.ts __tests__/ai/pollinations.test.ts __tests__/ai/tempAssets.test.ts`

Expected: FAIL with "Cannot find module" errors for the new shared files.

- [ ] **Step 5: Implement the pure helper modules**

```typescript
// supabase/functions/_shared/pollinations.ts
export function getPollinationsModels() {
  return {
    primary: 'gptimage-large',
    fallback: 'nanobanana-2',
  } as const
}

export function buildPollinationsImageUrl({
  prompt,
  model,
  seed,
}: {
  prompt: string
  model: string
  seed: number
}) {
  const params = new URLSearchParams({
    model,
    seed: String(seed),
    width: '768',
    height: '1152',
    nologo: 'true',
  })

  return `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params}`
}
```

- [ ] **Step 6: Run the helper test suite**

Run: `npm test -- --runInBand __tests__/ai/dixitPrompts.test.ts __tests__/ai/pollinations.test.ts __tests__/ai/tempAssets.test.ts`

Expected: PASS, all helper tests green.

- [ ] **Step 7: Commit**

```bash
git add __tests__/ai supabase/functions/_shared/dixitPrompts.ts supabase/functions/_shared/pollinations.ts supabase/functions/_shared/errors.ts supabase/functions/_shared/tempAssets.ts
git commit -m "test: add AI helper coverage and shared prompt/model builders"
```

---

## Phase 2 - Schema and Storage Support
*Testable milestone: remote project has the temp asset table, private bucket, and local types updated to match.*

### Task 2: Add Migration for Temporary Assets and Sync Types

**Files:**
- Create: `supabase/migrations/20260318143000_ai_pipeline_phase_1.sql`
- Modify: `src/types/game.ts`

- [ ] **Step 1: Write the migration file**

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'round-temp',
  'round-temp',
  false,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.temporary_generation_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  object_path text not null unique,
  scope text not null check (scope in ('round', 'gallery')),
  room_code text,
  round_id uuid,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  model text not null,
  refined_brief text not null,
  mime_type text not null default 'image/jpeg',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index temporary_generation_assets_cleanup_idx
  on public.temporary_generation_assets (expires_at)
  where deleted_at is null;

alter table public.temporary_generation_assets enable row level security;
```

- [ ] **Step 2: Apply the migration to Supabase via MCP**

Use MCP `mcp__supabase__apply_migration` with:

- `project_id`: `ctjelsuchvzvdjvqdzub`
- `name`: `ai_pipeline_phase_1`
- `query`: contents of `supabase/migrations/20260318143000_ai_pipeline_phase_1.sql`

Expected: migration succeeds with no SQL errors.

- [ ] **Step 3: Verify the new table and bucket exist**

Use MCP:

- `mcp__supabase__list_tables` for schema `public`
- `mcp__supabase__execute_sql` to verify the bucket

Verification query:

```sql
select id, public
from storage.buckets
where id = 'round-temp';
```

Expected: one row with `id = round-temp` and `public = false`.

- [ ] **Step 4: Regenerate local TypeScript types**

Use MCP `mcp__supabase__generate_typescript_types` for project `ctjelsuchvzvdjvqdzub`, then replace `src/types/game.ts` with the returned output.

Expected: `temporary_generation_assets` appears in the generated `Database` type.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260318143000_ai_pipeline_phase_1.sql src/types/game.ts
git commit -m "feat: add temporary generation asset schema and storage bucket"
```

---

## Phase 3 - Shared Provider and Storage Runtime
*Testable milestone: Edge Functions can create service-role clients, call OpenRouter, and upload temp assets through shared helpers.*

### Task 3: Add Shared Supabase Admin and OpenRouter Runtime Helpers

**Files:**
- Create: `supabase/functions/_shared/supabaseAdmin.ts`
- Create: `supabase/functions/_shared/openrouter.ts`
- Modify: `supabase/functions/_shared/tempAssets.ts`
- Modify: `supabase/functions/_shared/types.ts`

- [ ] **Step 1: Write a failing test for OpenRouter response parsing**

```typescript
import { extractTextContent } from '../../supabase/functions/_shared/openrouter'

test('extractTextContent returns the first non-empty assistant string', () => {
  const content = extractTextContent({
    choices: [{ message: { content: 'refined prompt' } }],
  })
  expect(content).toBe('refined prompt')
})
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npm test -- --runInBand __tests__/ai/dixitPrompts.test.ts`

Expected: FAIL because `extractTextContent` does not exist yet.

- [ ] **Step 3: Implement shared runtime helpers**

```typescript
// supabase/functions/_shared/supabaseAdmin.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function createSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}
```

```typescript
// supabase/functions/_shared/openrouter.ts
export async function callOpenRouter(messages: Array<{ role: string; content: string }>) {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) throw new Error('AI_CONFIG_ERROR')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-mini',
      messages,
      temperature: 0.7,
    }),
  })

  return response.json()
}
```

- [ ] **Step 4: Extend `tempAssets.ts` to cover storage upload primitives**

Add functions for:

- `downloadRemoteImage(url)`
- `uploadTempImage({ bucketId, objectPath, bytes, contentType })`
- `createSignedTempUrl({ bucketId, objectPath, expiresInSeconds })`
- `insertTempAssetRow(...)`

- [ ] **Step 5: Re-run the helper test suite**

Run: `npm test -- --runInBand __tests__/ai/dixitPrompts.test.ts __tests__/ai/pollinations.test.ts __tests__/ai/tempAssets.test.ts`

Expected: PASS, including the new OpenRouter parser coverage.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/supabaseAdmin.ts supabase/functions/_shared/openrouter.ts supabase/functions/_shared/tempAssets.ts supabase/functions/_shared/types.ts __tests__/ai
git commit -m "feat: add shared OpenRouter and temp asset runtime helpers"
```

---

## Phase 4 - Prompt Suggestion Refactor
*Testable milestone: `prompt-suggest` uses OpenRouter through shared modules and still returns `{ prompt }`.*

### Task 4: Refactor `prompt-suggest` to Shared OpenRouter Logic

**Files:**
- Modify: `supabase/functions/prompt-suggest/index.ts`
- Modify: `supabase/functions/_shared/dixitPrompts.ts`
- Modify: `supabase/functions/_shared/openrouter.ts`

- [ ] **Step 1: Replace inline prompt text in `prompt-suggest/index.ts` with shared builders**

```typescript
import { buildSuggestionMessages } from '../_shared/dixitPrompts.ts'
import { callOpenRouter, extractTextContent } from '../_shared/openrouter.ts'

const payload = await callOpenRouter(buildSuggestionMessages())
const prompt = extractTextContent(payload)
```

- [ ] **Step 2: Preserve the existing public contract**

Keep response shape:

```typescript
return okResponse({ prompt })
```

Do not add metadata to `prompt-suggest` in this phase.

- [ ] **Step 3: Deploy `prompt-suggest` to the target project via MCP**

Use MCP `mcp__supabase__deploy_edge_function`:

- `project_id`: `ctjelsuchvzvdjvqdzub`
- `name`: `prompt-suggest`
- `verify_jwt`: `true`

Upload:

- `supabase/functions/prompt-suggest/index.ts`
- shared helper files it imports

- [ ] **Step 4: Verify the deployed function manually**

Use the app or a direct invoke path after deployment.

Expected:

- valid prompt text
- no regression in the client contract
- no raw provider error leaks

- [ ] **Step 5: Check logs if verification fails**

Use MCP `mcp__supabase__get_logs` for service `edge-function`.

Expected: no unhandled exceptions from `prompt-suggest`.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/prompt-suggest/index.ts supabase/functions/_shared/dixitPrompts.ts supabase/functions/_shared/openrouter.ts
git commit -m "feat: move prompt suggestions to OpenRouter"
```

---

## Phase 5 - Image Generation Refactor
*Testable milestone: `image-generate` returns `{ imageUrl, brief, provider, model, expiresAt }` and uploads temp images to Storage.*

### Task 5: Refactor `image-generate` to OpenRouter + Pollinations + Temp Storage

**Files:**
- Modify: `supabase/functions/image-generate/index.ts`
- Modify: `supabase/functions/_shared/dixitPrompts.ts`
- Modify: `supabase/functions/_shared/pollinations.ts`
- Modify: `supabase/functions/_shared/tempAssets.ts`
- Modify: `supabase/functions/_shared/errors.ts`

- [ ] **Step 1: Update the request schema to support `scope`**

```typescript
const schema = z.object({
  prompt: z.string().min(1).max(500),
  scope: z.enum(['round', 'gallery']),
  roomCode: z.string().min(1).optional(),
  roundId: z.string().uuid().optional(),
})
```

- [ ] **Step 2: Enforce scope validation rules**

```typescript
if (body.data.scope === 'round' && (!body.data.roomCode || !body.data.roundId)) {
  return errorResponse('MISSING_ROOM_CONTEXT', 'Round generation requires room context', 400)
}
```

- [ ] **Step 3: Build the new generation pipeline**

Implementation order:

1. build refinement messages
2. call OpenRouter for `brief`
3. build Pollinations URL with `gptimage-large`
4. download generated bytes
5. upload to `round-temp`
6. create a 1-hour signed URL
7. insert `temporary_generation_assets`
8. return typed payload

Return shape:

```typescript
return okResponse({
  imageUrl,
  brief,
  provider: 'pollinations',
  model: selectedModel,
  expiresAt,
})
```

- [ ] **Step 4: Add fallback from primary to fallback Pollinations model**

Implementation rule:

- first attempt `gptimage-large`
- if provider call fails, retry once with `nanobanana-2`
- return the actual model used in the JSON response

- [ ] **Step 5: Deploy `image-generate` to the target project via MCP**

Use MCP `mcp__supabase__deploy_edge_function`:

- `project_id`: `ctjelsuchvzvdjvqdzub`
- `name`: `image-generate`
- `verify_jwt`: `true`

Upload:

- `supabase/functions/image-generate/index.ts`
- every shared helper it imports

- [ ] **Step 6: Verify the function end-to-end**

Manual verification checklist:

- round scope returns `imageUrl`, `brief`, `provider`, `model`, `expiresAt`
- inserted temp asset row exists in `temporary_generation_assets`
- stored URL loads in the app
- provider fallback logs the fallback model when the primary fails

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/image-generate/index.ts supabase/functions/_shared/dixitPrompts.ts supabase/functions/_shared/pollinations.ts supabase/functions/_shared/tempAssets.ts supabase/functions/_shared/errors.ts
git commit -m "feat: persist generated images through temp storage"
```

---

## Phase 6 - Cleanup Automation
*Testable milestone: expired temp images are deleted automatically every minute.*

### Task 6: Add Cleanup Edge Function and Schedule It with Vault + Cron

**Files:**
- Create: `supabase/functions/cleanup-temp-images/index.ts`
- Modify: `supabase/functions/_shared/supabaseAdmin.ts`

- [ ] **Step 1: Implement the cleanup function**

```typescript
const { data: expiredAssets } = await supabase
  .from('temporary_generation_assets')
  .select('id, bucket_id, object_path')
  .is('deleted_at', null)
  .lte('expires_at', new Date().toISOString())

for (const asset of expiredAssets ?? []) {
  await supabase.storage.from(asset.bucket_id).remove([asset.object_path])
  await supabase
    .from('temporary_generation_assets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', asset.id)
}
```

- [ ] **Step 2: Protect the endpoint with a cron secret**

Implementation rule:

- set `verify_jwt = false`
- require `x-cron-secret`
- compare against `Deno.env.get('CLEANUP_TEMP_IMAGES_CRON_SECRET')`

- [ ] **Step 3: Deploy `cleanup-temp-images` via MCP**

Use MCP `mcp__supabase__deploy_edge_function` with:

- `project_id`: `ctjelsuchvzvdjvqdzub`
- `name`: `cleanup-temp-images`
- `verify_jwt`: `false`

- [ ] **Step 4: Store runtime secrets in Vault**

Use MCP `mcp__supabase__execute_sql`:

```sql
select vault.create_secret('https://ctjelsuchvzvdjvqdzub.supabase.co', 'project_url');
select vault.create_secret('<generated-cron-secret>', 'cleanup_temp_images_cron_secret');
```

Expected: both secrets available in `vault.decrypted_secrets`.

- [ ] **Step 5: Schedule the cleanup job**

Use MCP `mcp__supabase__execute_sql`:

```sql
select cron.schedule(
  'cleanup-temp-images-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/cleanup-temp-images',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cleanup_temp_images_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  ) as request_id;
  $$
);
```

- [ ] **Step 6: Verify the scheduler path**

Use MCP `mcp__supabase__execute_sql` to inspect:

```sql
select jobname, schedule, active
from cron.job
where jobname = 'cleanup-temp-images-every-minute';
```

Expected: one active cron job.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/cleanup-temp-images/index.ts supabase/functions/_shared/supabaseAdmin.ts
git commit -m "feat: add scheduled cleanup for temporary AI assets"
```

---

## Phase 7 - Client Contract Migration
*Testable milestone: the mobile client consumes `imageUrl` and `scope` without breaking round play or gallery preview.*

### Task 7: Update Client API, Hooks, and Shared Generator UI

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/hooks/useImageGen.ts`
- Modify: `src/hooks/usePromptSuggest.ts`
- Modify: `src/components/game/CardGenerator.tsx`
- Modify: `src/components/game-phases/NarratorPhase.tsx`
- Modify: `src/components/game-phases/PlayersPhase.tsx`
- Modify: `app/(tabs)/gallery.tsx`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Update the API contracts in `src/lib/api.ts`**

```typescript
imageGenerate: (payload: {
  prompt: string
  scope: 'round' | 'gallery'
  roomCode?: string
  roundId?: string
}) =>
  callFunction<{
    imageUrl: string
    brief: string
    provider: string
    model: string
    expiresAt: string
  }>('image-generate', payload)
```

- [ ] **Step 2: Update `useImageGen.ts`**

Implementation changes:

- rename `url` -> `imageUrl`
- capture `model` and `expiresAt`
- keep `error` as a translation key
- do not add client-side auto-retry

- [ ] **Step 3: Update `CardGenerator.tsx` to carry scope and metadata**

New props:

```typescript
interface CardGeneratorProps {
  scope: 'round' | 'gallery'
  roomCode?: string
  roundId?: string
  onSelect: (imageUrl: string, prompt: string) => void
}
```

- [ ] **Step 4: Update the game phase consumers**

`NarratorPhase.tsx` and `PlayersPhase.tsx` must pass:

- `scope="round"`
- `roomCode={roomCode}`
- `roundId={round.id}`

Also rename local selection state from `{ url, prompt }` to `{ imageUrl, prompt }`.

- [ ] **Step 5: Update gallery flow**

`gallery.tsx` must:

- pass `scope="gallery"` to `CardGenerator`
- rename `pendingCard.url` -> `pendingCard.imageUrl`
- fetch and upload the selected temp image to the permanent `gallery` bucket only on explicit save

- [ ] **Step 6: Add i18n keys for typed AI errors**

Add keys for:

- `AI_CONFIG_ERROR`
- `PROMPT_SUGGEST_FAILED`
- `PROMPT_REFINEMENT_FAILED`
- `IMAGE_PROVIDER_FAILED`
- `TEMP_DOWNLOAD_FAILED`
- `TEMP_UPLOAD_FAILED`
- `TEMP_URL_SIGN_FAILED`
- `INVALID_SCOPE`
- `MISSING_ROOM_CONTEXT`

- [ ] **Step 7: Run typecheck**

Run: `npm run typecheck`

Expected: zero TypeScript errors after the contract rename.

- [ ] **Step 8: Commit**

```bash
git add src/lib/api.ts src/hooks/useImageGen.ts src/hooks/usePromptSuggest.ts src/components/game/CardGenerator.tsx src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx app/(tabs)/gallery.tsx src/i18n/locales/es.json src/i18n/locales/en.json
git commit -m "feat: migrate mobile client to typed AI image contracts"
```

---

## Phase 8 - Remote Verification and Hardening
*Testable milestone: the target Supabase project is healthy, the AI pipeline works end-to-end, and cleanup removes expired assets.*

### Task 8: Verify End-to-End Flow, Logs, and Advisors

**Files:**
- Modify: none unless fixes are needed from verification

- [ ] **Step 1: Verify function inventory**

Use MCP `mcp__supabase__list_edge_functions` for project `ctjelsuchvzvdjvqdzub`.

Expected: `prompt-suggest`, `image-generate`, and `cleanup-temp-images` are active.

- [ ] **Step 2: Generate a gallery preview and save it**

Manual verification in app:

1. open gallery
2. generate a card
3. confirm preview loads
4. save to gallery
5. confirm permanent gallery card still loads after temp asset expiry

- [ ] **Step 3: Generate a round card**

Manual verification in app:

1. enter a room
2. open narrator or player card generation
3. confirm returned image loads
4. confirm selected card inserts into `cards`

- [ ] **Step 4: Confirm temp metadata rows exist**

Use MCP `mcp__supabase__execute_sql`:

```sql
select scope, bucket_id, model, deleted_at
from public.temporary_generation_assets
order by created_at desc
limit 10;
```

Expected: recent rows with `deleted_at is null`.

- [ ] **Step 5: Force one expired row and verify cleanup**

Use MCP `mcp__supabase__execute_sql` to backdate one row:

```sql
update public.temporary_generation_assets
set expires_at = now() - interval '5 minutes'
where id = (
  select id
  from public.temporary_generation_assets
  where deleted_at is null
  order by created_at desc
  limit 1
);
```

Wait one minute, then query again:

```sql
select id, deleted_at
from public.temporary_generation_assets
order by created_at desc
limit 10;
```

Expected: the backdated row now has `deleted_at` set.

- [ ] **Step 6: Review logs if any verification step fails**

Use MCP `mcp__supabase__get_logs` for service `edge-function`.

Expected: no unhandled exceptions from the three AI-related functions.

- [ ] **Step 7: Run advisors**

Use MCP `mcp__supabase__get_advisors`:

- type `security`
- type `performance`

Expected: no new critical issues; address any RLS or storage findings before claiming completion.

- [ ] **Step 8: Final commit for any verification fixes**

```bash
git add .
git commit -m "chore: verify AI pipeline phase 1 on remote Supabase project"
```

---

## Appendix: Required Secrets

| Secret | Where | Purpose |
|---|---|---|
| `OPENROUTER_API_KEY` | Edge Functions secret | Prompt suggestion and prompt refinement |
| `CLEANUP_TEMP_IMAGES_CRON_SECRET` | Edge Functions secret | Protect scheduled cleanup endpoint |
| `SUPABASE_URL` | Auto-provided in Edge Functions | Admin client setup |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided in Edge Functions | Storage upload, signed URLs, cleanup |

## Appendix: Verification Queries

```sql
select id, public
from storage.buckets
where id = 'round-temp';

select scope, provider, model, expires_at, deleted_at
from public.temporary_generation_assets
order by created_at desc
limit 20;

select jobname, schedule, active
from cron.job
where jobname = 'cleanup-temp-images-every-minute';
```
