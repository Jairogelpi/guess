# Prompt Creativity Escalation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Sugerir idea Dixit`, `Mejorar idea`, and `Generar carta` produce denser, stranger, less generic prompts while enforcing the hard `250` character limit everywhere prompt text is generated, returned, or persisted.

**Architecture:** Split the current single refinement path into three explicit builder flows inside `supabase/functions/_shared/dixitPrompts.ts`: suggestion, enhancement, and final generation brief. Add one shared prompt-budget helper for input normalization, output usability checks, and one compression retry when model output exceeds `250` characters, then wire both edge functions through those pure helpers so most behavior stays testable in Jest without standing up Deno runtime tests.

**Tech Stack:** Supabase Edge Functions, TypeScript, Jest, Expo / React Native, OpenRouter, Pollinations

---

## Input-safety contract

Keep the existing "user text is scene data, not instructions" guard when splitting builders:
- enhancement and generation builders must continue wrapping user text in a dedicated safety envelope such as `<user_theme>...</user_theme>`
- system prompts must continue telling the model to treat wrapped user text as raw visual subject matter only
- builder splits must not allow user input to override system behavior, request JSON, or inject explanations

Empty-input behavior must stay explicit and centralized:
- `normalizePromptInput()` returns `undefined` for trimmed-empty values
- `resolvePromptSuggestRequest()` maps `undefined` to suggestion mode
- `resolveGenerationBriefRequest()` maps `undefined` to the existing `INVALID_PAYLOAD` path

---

## Baseline note

Current `master` already has unrelated failures outside this scope:
- `__tests__/ai/pollinations.test.ts` expects older model ids and fails before this feature work
- `npm run typecheck` fails on existing Deno import handling and unrelated UI/test typing errors

Do not use those two checks as gating verification for this plan. Keep verification focused on the AI prompt files touched here.

---

## File map

- Modify: `supabase/functions/_shared/dixitPrompts.ts`
- Create: `supabase/functions/_shared/promptBudget.ts`
- Create: `supabase/functions/_shared/promptFlow.ts`
- Modify: `supabase/functions/prompt-suggest/index.ts`
- Modify: `supabase/functions/image-generate/index.ts`
- Modify: `__tests__/ai/dixitPrompts.test.ts`
- Create: `__tests__/ai/promptBudget.test.ts`
- Create: `__tests__/ai/promptFlow.test.ts`
- Verify only unless drift is found: `src/components/game/CardGenerator.tsx`
- Verify only unless drift is found: `src/components/game/PromptArea.tsx`
- Verify only unless drift is found: `src/hooks/useCardSelection.ts`
- Verify only unless drift is found: `src/hooks/useGameActions.ts`
- Verify only unless drift is found: `src/hooks/useGallery.ts`

## Task 1: Split prompt builders by creative role

**Files:**
- Modify: `supabase/functions/_shared/dixitPrompts.ts`
- Test: `__tests__/ai/dixitPrompts.test.ts`

- [ ] **Step 1: Write failing builder-contract tests**

Expand `__tests__/ai/dixitPrompts.test.ts` to cover:
- `buildSuggestionMessages()` requires scene density, setting, secondary details, surreal anomaly, and `<= 250` character output intent
- `buildEnhancementMessages(prompt)` preserves the user scene core while expanding only the world around it
- `buildGenerationBriefMessages(prompt)` demands foreground / midground / background layering and non-empty backgrounds
- `buildGenerationBriefMessages(prompt)` explicitly preserves the user's subject, action, and core motif while making the same scene more image-ready
- enhancement and generation builders explicitly discourage generic filler and mention the `<= 250` budget in their system copy
- `buildPromptSuggestMessages(undefined)` routes to suggestion mode
- `buildPromptSuggestMessages('   ')` routes to suggestion mode
- `buildPromptSuggestMessages('una niña en una biblioteca inundada')` routes to enhancement mode

Suggested test shape:

```ts
const messages = buildGenerationBriefMessages('una nina con una llave de coral')
expect(messages[0]?.content).toContain('foreground / midground / background')
expect(messages[0]?.content).toContain('<= 250')
```

Run:

```powershell
npx jest --runInBand __tests__/ai/dixitPrompts.test.ts
```

Expected: FAIL because the new builders / routing helper do not exist yet and the current prompts do not encode the new requirements.

- [ ] **Step 2: Implement the three dedicated builder paths**

In `supabase/functions/_shared/dixitPrompts.ts`:
- keep `ChatMessage`
- replace the old two-path shape with four exported helpers:
  - `buildSuggestionMessages()`
  - `buildEnhancementMessages(prompt: string)`
  - `buildGenerationBriefMessages(prompt: string)`
  - `buildPromptSuggestMessages(basePrompt?: string)`
- keep the Dixit style anchor, but reduce repeated wording that forces every scene into the same composition
- encode the hard `250` character budget directly in all three system prompts
- preserve the current prompt-injection safety wrapper so user text is always embedded as scene data, not executable instructions
- make suggestion prompts push for dense scenes and coherent surreal twists
- make enhancement prompts protect the user core and expand only the world / symbolism / atmosphere
- make generation prompts explicitly preserve the same subject / action / core motif while optimizing for image-ready composition and dense drawable detail rather than generic adjectives

Keep the builder layer pure. Do not add fetch or endpoint logic here.

- [ ] **Step 3: Run builder tests**

Run:

```powershell
npx jest --runInBand __tests__/ai/dixitPrompts.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit the builder split**

```powershell
git add __tests__/ai/dixitPrompts.test.ts supabase/functions/_shared/dixitPrompts.ts
git commit -m "test: split Dixit prompt builders by creative role"
```

## Task 2: Add shared prompt-budget and output-safety helpers

**Files:**
- Create: `supabase/functions/_shared/promptBudget.ts`
- Test: `__tests__/ai/promptBudget.test.ts`

- [ ] **Step 1: Write failing tests for input normalization and output acceptance**

Create `__tests__/ai/promptBudget.test.ts` covering:
- `normalizePromptInput('  hola  ', 250)` returns `'hola'`
- `normalizePromptInput(' '.repeat(4), 250)` returns `undefined`
- `normalizePromptInput('x'.repeat(251), 250)` throws a validation-specific error that endpoints can map to `INVALID_PAYLOAD`
- `isUsablePromptOutput('{\"prompt\":\"hola\"}')` is `false`
- `isUsablePromptOutput('explicacion: una nina...')` is `false`
- `isUsablePromptOutput('una nina abre una biblioteca sumergida con peces en los estantes')` is `true`
- `buildCompressionMessages(text)` tells the model to preserve the exact same scene while compressing to `<= 250`
- `resolvePromptOutputWithinBudget(firstResponse, compress)` accepts the first response when already valid
- `resolvePromptOutputWithinBudget(firstResponse, compress)` retries exactly once when the first response is over budget
- `resolvePromptOutputWithinBudget(firstResponse, compress)` fails immediately without calling `compress` when the first response is under budget but unusable
- `resolvePromptOutputWithinBudget(firstResponse, compress)` throws when the second response is still over budget or unusable

Suggested helper surface:

```ts
normalizePromptInput(raw: unknown, maxChars = 250): string | undefined
isUsablePromptOutput(text: string): boolean
buildCompressionMessages(text: string): ChatMessage[]
resolvePromptOutputWithinBudget(
  firstResponse: string,
  compress: (text: string) => Promise<string>,
): Promise<string>
```

Run:

```powershell
npx jest --runInBand __tests__/ai/promptBudget.test.ts
```

Expected: FAIL because the helper file does not exist.

- [ ] **Step 2: Implement minimal prompt-budget helper**

Create `supabase/functions/_shared/promptBudget.ts` with:
- one shared validation error type / class for trimmed-empty or over-budget prompt input that both endpoints can catch and map consistently
- `normalizePromptInput(raw, maxChars)`:
  - accept only strings
  - strip control characters
  - trim surrounding whitespace
  - return `undefined` for empty-after-trim values
  - throw a validation-specific error only when non-empty text exceeds `250`
- `isUsablePromptOutput(text)`:
  - reject empty strings
  - reject obvious JSON
  - reject explanatory prefixes or multi-sentence prose that is not card-prompt shaped
- `buildCompressionMessages(text)`:
  - ask for the same exact scene
  - require `<= 250` characters
  - forbid truncation, JSON, or explanations
- `resolvePromptOutputWithinBudget(firstResponse, compress)`:
  - trim surrounding whitespace only
  - accept immediately when the first response is usable and `<= 250`
  - fail immediately without calling `compress` when the first response is unusable but already within budget
  - call `compress` exactly once only when the first response is over budget
  - reject the retry if it is still over budget or unusable
  - never truncate characters to force a pass

Keep this helper pure so both edge functions can share it.

- [ ] **Step 3: Run prompt-budget tests**

Run:

```powershell
npx jest --runInBand __tests__/ai/promptBudget.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit the shared prompt-budget helper**

```powershell
git add __tests__/ai/promptBudget.test.ts supabase/functions/_shared/promptBudget.ts
git commit -m "test: add prompt budget helper coverage"
```

## Task 3: Rewire `prompt-suggest` for suggestion vs enhancement mode

**Files:**
- Create: `supabase/functions/_shared/promptFlow.ts`
- Test: `__tests__/ai/promptFlow.test.ts`
- Modify: `supabase/functions/prompt-suggest/index.ts`
- Modify: `supabase/functions/_shared/dixitPrompts.ts`
- Modify: `supabase/functions/_shared/promptBudget.ts`
- Test: `__tests__/ai/dixitPrompts.test.ts`
- Test: `__tests__/ai/promptBudget.test.ts`

- [ ] **Step 1: Extend tests for prompt-suggest routing expectations**

Create `__tests__/ai/promptFlow.test.ts` and add failing tests for a new pure helper:

```ts
resolvePromptSuggestRequest(rawBasePrompt: unknown): {
  mode: 'suggest' | 'enhance'
  basePrompt?: string
  temperature: number
  messages: ChatMessage[]
}
```

Cover:
- `undefined` routes to `suggest`
- whitespace-only input routes to `suggest`
- valid text routes to `enhance`
- over-`250` input throws the validation-specific error used for `INVALID_PAYLOAD`
- returned suggestion temperature is higher than enhancement temperature

If temperatures are left inline, test only routing and keep temperature verification as code review guidance, not a brittle unit test.

Run:

```powershell
npx jest --runInBand __tests__/ai/promptFlow.test.ts __tests__/ai/promptBudget.test.ts
```

Expected: FAIL because `promptFlow.ts` does not exist yet and the request-routing helper has not been extracted.

- [ ] **Step 2: Implement endpoint normalization and one compression retry**

Create `supabase/functions/_shared/promptFlow.ts` and implement `resolvePromptSuggestRequest(rawBasePrompt)` using:
- `normalizePromptInput`
- `buildPromptSuggestMessages`
- explicit per-mode temperatures

Behavior contract:
- `undefined` from `normalizePromptInput` means suggestion mode here, not validation failure

In `supabase/functions/prompt-suggest/index.ts`:
- replace the manual `slice(0, 500)` normalization with `resolvePromptSuggestRequest`
- catch the helper's over-budget validation error and return the existing validation contract:
  - `errorResponse('INVALID_PAYLOAD', ...)`
  - status `400`
- use the helper's returned `messages` and `temperature`
- pass the first model response through `resolvePromptOutputWithinBudget`
- implement the injected `compress` callback by calling OpenRouter exactly one more time with `buildCompressionMessages(firstResponse)`
- if the retry is still over budget or unusable, fail with `PROMPT_SUGGEST_FAILED`
- do not hard-truncate returned prompt text

Do not change the public response contract.

- [ ] **Step 3: Run targeted tests**

Run:

```powershell
npx jest --runInBand __tests__/ai/promptFlow.test.ts __tests__/ai/promptBudget.test.ts __tests__/ai/dixitPrompts.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit prompt-suggest rewiring**

```powershell
git add supabase/functions/prompt-suggest/index.ts supabase/functions/_shared/dixitPrompts.ts supabase/functions/_shared/promptBudget.ts supabase/functions/_shared/promptFlow.ts __tests__/ai/dixitPrompts.test.ts __tests__/ai/promptBudget.test.ts __tests__/ai/promptFlow.test.ts
git commit -m "feat: split prompt suggest and enhancement flows"
```

## Task 4: Rewire `image-generate` for generation briefs within budget

**Files:**
- Modify: `supabase/functions/_shared/promptFlow.ts`
- Modify: `supabase/functions/image-generate/index.ts`
- Modify: `supabase/functions/_shared/dixitPrompts.ts`
- Modify: `supabase/functions/_shared/promptBudget.ts`
- Test: `__tests__/ai/promptFlow.test.ts`
- Test: `__tests__/ai/dixitPrompts.test.ts`
- Test: `__tests__/ai/promptBudget.test.ts`

- [ ] **Step 1: Add failing coverage for generation-brief constraints**

Extend `__tests__/ai/promptFlow.test.ts` with failing tests for:

```ts
resolveGenerationBriefRequest(rawPrompt: string): {
  prompt: string
  messages: ChatMessage[]
}
```

Cover:
- generation input is trimmed before length validation
- generation input accepts trimmed values at `<= 250` and rejects trimmed values at `251+`
- whitespace-only generation input throws the validation-specific error used for `INVALID_PAYLOAD`
- generation request uses the dedicated image-brief builder rather than enhancement copy
- generation normalization returns trimmed prompt text

Run:

```powershell
npx jest --runInBand __tests__/ai/promptFlow.test.ts __tests__/ai/promptBudget.test.ts
```

Expected: FAIL because `resolveGenerationBriefRequest` does not exist yet and generation flow still routes through the old builder.

- [ ] **Step 2: Implement dedicated generation-brief flow**

In `supabase/functions/_shared/promptFlow.ts`:
- add `resolveGenerationBriefRequest(rawPrompt)`
- normalize the incoming prompt with the shared helper before any max-length validation is enforced
- treat empty-after-trim input as `INVALID_PAYLOAD` here, even though `prompt-suggest` maps trimmed-empty `basePrompt` to suggestion mode
- build messages through `buildGenerationBriefMessages`

In `supabase/functions/image-generate/index.ts`:
- change the Zod input schema so it only asserts `prompt` is present as a string, then let `resolveGenerationBriefRequest` own trim-then-validate behavior
- replace direct prompt prep with `resolveGenerationBriefRequest`
- pass the first model response through `resolvePromptOutputWithinBudget`
- implement the injected `compress` callback by calling OpenRouter exactly one more time with `buildCompressionMessages(firstBrief)`
- if the retry still fails budget/usability checks, throw `PROMPT_REFINEMENT_FAILED`
- keep the returned `brief` and persisted `refined_brief` equal to the accepted within-budget text

Do not touch temp-asset storage flow or Pollinations retry logic.
Keep compression retry assertions owned by `__tests__/ai/promptBudget.test.ts`. `promptFlow.test.ts` should focus on request normalization, routing, and builder selection.

- [ ] **Step 3: Run targeted tests**

Run:

```powershell
npx jest --runInBand __tests__/ai/promptFlow.test.ts __tests__/ai/promptBudget.test.ts __tests__/ai/dixitPrompts.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit image-generate rewiring**

```powershell
git add supabase/functions/image-generate/index.ts supabase/functions/_shared/dixitPrompts.ts supabase/functions/_shared/promptBudget.ts supabase/functions/_shared/promptFlow.ts __tests__/ai/dixitPrompts.test.ts __tests__/ai/promptBudget.test.ts __tests__/ai/promptFlow.test.ts
git commit -m "feat: enforce prompt budget in image generation briefs"
```

## Task 5: Audit client-side generation entry points and protect the 250-char path

**Files:**
- Verify only unless drift is found: `src/components/game/CardGenerator.tsx`
- Verify only unless drift is found: `src/components/game/PromptArea.tsx`
- Verify only unless drift is found: `src/hooks/useCardSelection.ts`
- Verify only unless drift is found: `src/hooks/useGameActions.ts`
- Verify only unless drift is found: `src/hooks/useGallery.ts`

- [ ] **Step 1: Verify UI limits already match the server contract**

Confirm:
- `CardGenerator` input still has `maxLength={250}`
- `PromptArea` input still has `maxLength={250}`
- generation callers trim prompt text before sending or rely only on already-trimmed values
- `useGameActions.insertCard()` persists the accepted `brief` / prompt text unchanged
- `useGallery.saveToGallery()` persists the accepted `brief` / prompt text unchanged

If all three paths are already correct, leave client code untouched.

- [ ] **Step 2: Patch only if drift exists**

If any path is missing the limit or sends untrimmed prompt text:
- add the missing `250` guard
- trim outbound prompt values before request dispatch
- do not redesign the UI or add new copy

If no drift exists, skip this step and note that the client already matches the spec.

- [ ] **Step 3: Run client limit audit commands**

Run:

```powershell
rg -n "maxLength=\\{250\\}" src/components/game/CardGenerator.tsx src/components/game/PromptArea.tsx
rg -n "prompt\\.trim\\(\\)" src/components/game/CardGenerator.tsx
```

Expected:
- first command prints both files
- second command prints the round/gallery generator call site

If `useCardSelection.ts` is patched in Step 2, add a third audit command that confirms the new trim call there too.

## Task 6: Final verification and manual sample review

**Files:**
- No code by default

- [ ] **Step 1: Run focused automated coverage**

Run:

```powershell
npx jest --runInBand __tests__/ai/dixitPrompts.test.ts __tests__/ai/promptBudget.test.ts __tests__/ai/promptFlow.test.ts
```

Expected: PASS

- [ ] **Step 2: Manual prompt-quality sample review**

Using a real authenticated app / function environment, verify:
- empty `Sugerir idea Dixit` returns dense card-ready scenes, not vague mood fragments
- `Mejorar idea` keeps the user's subject/action/core motif while adding world, contrast, and surreal detail
- `Generar carta` returns `brief` values that stay within `250` characters but still describe layered, drawable scenes
- no returned prompt or persisted `brief` exceeds `250` characters
- whitespace-only enhancement requests behave like suggestion mode instead of erroring when exercised through a direct function / API call, since the current UI disables enhance on trimmed-empty input

- [ ] **Step 3: Commit final implementation if any files changed after Task 4**

```powershell
git add supabase/functions/_shared/dixitPrompts.ts supabase/functions/_shared/promptBudget.ts supabase/functions/_shared/promptFlow.ts supabase/functions/prompt-suggest/index.ts supabase/functions/image-generate/index.ts __tests__/ai/dixitPrompts.test.ts __tests__/ai/promptBudget.test.ts __tests__/ai/promptFlow.test.ts src/components/game/CardGenerator.tsx src/components/game/PromptArea.tsx src/hooks/useCardSelection.ts src/hooks/useGameActions.ts src/hooks/useGallery.ts
git diff --cached --quiet; if ($LASTEXITCODE -ne 0) { git commit -m "feat: escalate Dixit prompt creativity within budget" } else { Write-Host "No final changes to commit after Task 4" }
```
