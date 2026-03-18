# Dixit AI Mobile Landing Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the mobile entry experience around the approved single-card landing design and roll the decorative title system across the app without changing existing game/auth flows.

**Architecture:** Extract the visual language into shared brand tokens and reusable UI shells first, then rebuild the three entry screens on top of those primitives, and finally roll the title system through navigator headers and existing in-screen title surfaces. Keep the work visual-only: navigation, room actions, auth behavior, and game state logic must remain unchanged.

**Tech Stack:** Expo SDK 55, Expo Router, React Native `StyleSheet`, `expo-linear-gradient`, `@expo-google-fonts/cinzel-decorative`, Jest (`ts-jest`) for pure token tests, TypeScript strict mode.

**Spec:** [2026-03-18-dixit-ai-mobile-landing-visual-design.md](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\docs\superpowers\specs\2026-03-18-dixit-ai-mobile-landing-visual-design.md)

---

## File Map

**Create**
- `__tests__/brandTokens.test.ts`
- `src/constants/brand.ts`
- `src/components/branding/DecorativeTitle.tsx`
- `src/components/layout/EntryCardShell.tsx`

**Modify**
- `src/constants/theme.ts`
- `src/components/layout/Background.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Modal.tsx`
- `app/(auth)/welcome.tsx`
- `app/(auth)/login.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/_layout.tsx`
- `app/room/[code]/_layout.tsx`
- `app/(tabs)/gallery.tsx`
- `app/(tabs)/profile.tsx`
- `app/room/[code]/lobby.tsx`
- `app/room/[code]/ended.tsx`
- `src/components/game/RoundStatus.tsx`
- `src/components/game-phases/NarratorPhase.tsx`
- `src/components/game-phases/PlayersPhase.tsx`
- `src/components/game-phases/VotingPhase.tsx`
- `src/components/game-phases/ResultsPhase.tsx`

**Do Not Modify For This Plan**
- `src/hooks/*`
- Supabase functions, DB schema, i18n keys unless a truly missing visual label blocks implementation
- `app/room/[code]/game.tsx` routing behavior beyond existing title/status surfaces

---

## Guardrails

- Do not add a new page title to screens that currently do not expose one.
- Keep `game` with `headerShown: false`.
- Do not change tab labels; only restyle navigator header titles and existing in-screen headings.
- Keep `version` and `locale` pills in the entry compositions.
- Do not introduce a second stacked panel under the card on entry screens.
- Do not add a new UI testing library in this scope. Existing Jest coverage should stay limited to pure token/helper logic; visual verification is typecheck + bundle export + manual review.

---

### Task 1: Extract Shared Brand Tokens

**Files:**
- Create: `__tests__/brandTokens.test.ts`
- Create: `src/constants/brand.ts`
- Modify: `src/constants/theme.ts`

- [ ] **Step 1: Write a failing pure-token test suite**

Create `__tests__/brandTokens.test.ts` covering:
- exported decorative font family names
- hero/screen/section title variant keys
- CTA tone tokens for `primary` and `secondary`
- entry-card shell metrics used by `welcome` and `index`

Suggested assertions:
- `brandTypography.titleHero.fontFamily` references `CinzelDecorative`
- `brandButtons.primary.gradient.length === 2 || 3`
- `entryShell.headerPill.height` and `entryShell.card.radius` are defined numbers

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npm test -- __tests__/brandTokens.test.ts`

Expected: FAIL because `src/constants/brand.ts` does not exist yet.

- [ ] **Step 3: Implement `src/constants/brand.ts`**

Add a pure token module that exports:
- decorative font family constants
- title variant objects: `titleHero`, `titleScreen`, `titleSection`, `eyebrow`, `buttonLabel`
- button palettes for primary/secondary/ghost-auth use
- entry shell metrics for outer card, inner spacing, utility pills, and CTA group spacing

Keep this file pure data plus tiny helper functions only, so Jest can test it in `node` environment.

- [ ] **Step 4: Refactor `src/constants/theme.ts` to consume the brand tokens**

Move shared color ramps and typography aliases into `theme.ts` without duplicating literal values. `theme.ts` should remain the app-wide theme entry point, while `brand.ts` holds the specialized landing/title system.

- [ ] **Step 5: Run token tests and typecheck**

Run:
- `npm test -- __tests__/brandTokens.test.ts`
- `npm run typecheck`

Expected: PASS for the token test and zero TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add __tests__/brandTokens.test.ts src/constants/brand.ts src/constants/theme.ts
git commit -m "feat: add shared landing brand tokens"
```

---

### Task 2: Build Reusable Visual Primitives

**Files:**
- Create: `src/components/branding/DecorativeTitle.tsx`
- Create: `src/components/layout/EntryCardShell.tsx`
- Modify: `src/components/layout/Background.tsx`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Modal.tsx`
- Test: `__tests__/brandTokens.test.ts`

- [ ] **Step 1: Add test coverage for any new pure helper used by UI primitives**

If Task 2 introduces pure helper functions such as `getTitleTone` or `getButtonTone`, extend `__tests__/brandTokens.test.ts` first.

Do not try to snapshot React Native components in this repo; keep tests on pure exported helpers only.

- [ ] **Step 2: Run the targeted test before implementation**

Run: `npm test -- __tests__/brandTokens.test.ts`

Expected: FAIL only if a new helper contract was added in Step 1.

- [ ] **Step 3: Implement `DecorativeTitle.tsx`**

Create a reusable title component that:
- accepts a `variant` prop: `hero | screen | section | eyebrow`
- accepts optional tone settings for restrained gradient vs strong hero treatment
- supports one-line and two-line usage needed by `welcome` and `index`
- centralizes font family, letter spacing, text shadow, and alignment rules

Keep it presentation-only; no navigation logic.

- [ ] **Step 4: Implement `EntryCardShell.tsx`**

Create a reusable shell for entry screens that provides:
- background-safe card container
- shared outer gold border/glow treatment
- optional utility row slot for version/locale pills
- content slot for hero and action areas
- internal spacing tuned for the approved dense mockup

- [ ] **Step 5: Refactor base UI primitives to match the spec**

Update:
- `Background.tsx` to deepen the vignette and better match the web landing mood
- `Button.tsx` to support unified landing-aligned button tones and typed style props
- `Input.tsx` to use the darker translucent shell, gold borders, and better label treatment
- `Modal.tsx` to use the decorative title system for modal headers without changing modal behavior

Avoid ad-hoc screen-level hacks like custom `textStyle` props unless you first formalize them in the shared component API.

- [ ] **Step 6: Run verification**

Run:
- `npm test -- __tests__/brandTokens.test.ts`
- `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/branding/DecorativeTitle.tsx src/components/layout/EntryCardShell.tsx src/components/layout/Background.tsx src/components/ui/Button.tsx src/components/ui/Input.tsx src/components/ui/Modal.tsx __tests__/brandTokens.test.ts
git commit -m "feat: add reusable landing visual primitives"
```

---

### Task 3: Rebuild `welcome` Around the Approved Card Layout

**Files:**
- Modify: `app/(auth)/welcome.tsx`
- Modify: `src/components/layout/EntryCardShell.tsx`
- Modify: `src/components/branding/DecorativeTitle.tsx`

- [ ] **Step 1: Write down the visual acceptance checklist in the file as implementation comments or task notes**

Checklist for `welcome`:
- one card only
- title no longer collides with the card frame
- subtitle breathes
- primary guest CTA and auth CTAs belong to the same button family
- all actions remain inside the card

Do not add permanent explanatory comments to the shipped UI unless they clarify non-obvious structure.

- [ ] **Step 2: Rebuild `welcome.tsx` using shared primitives**

Implement:
- required version and locale pills in the utility row
- `EntryCardShell` as the only main surface
- `DecorativeTitle` for the hero wordmark
- a cleaner subtitle block
- one primary CTA for guest entry
- one secondary action row for sign-in / account creation

Preserve:
- anonymous sign-in logic
- error handling
- navigation to `/(auth)/login`

- [ ] **Step 3: Remove screen-local styling that duplicates the new primitives**

Delete oversized bespoke style blocks that are replaced by:
- `brand.ts`
- `EntryCardShell`
- `DecorativeTitle`
- shared button/input treatments

- [ ] **Step 4: Run targeted verification**

Run:
- `npm run typecheck`
- `npx expo export --platform android --output-dir .expo-export-check`

Expected: PASS. No `expo-splash-screen` resolution errors and no TypeScript errors from `welcome`.

- [ ] **Step 5: Clean temporary export output**

Run: `if (Test-Path '.expo-export-check') { Remove-Item -Recurse -Force '.expo-export-check' }`

- [ ] **Step 6: Commit**

```bash
git add app/(auth)/welcome.tsx src/components/layout/EntryCardShell.tsx src/components/branding/DecorativeTitle.tsx
git commit -m "feat: redesign welcome landing card"
```

---

### Task 4: Rebuild `index` As the Primary Landing Screen

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `src/components/layout/EntryCardShell.tsx`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`

- [ ] **Step 1: Preserve behavior before changing structure**

Confirm the current action mapping:
- create room uses `createRoom(displayName)`
- join room uses `joinRoom(code, displayName)`
- successful actions route to `/room/[code]/lobby`

No flow change is allowed in this task.

- [ ] **Step 2: Rebuild `index.tsx` with the approved dense card composition**

Implement inside the card:
- version/locale utility row
- hero title and subtitle
- display-name field
- primary create-room CTA
- visual separator
- join-code input
- secondary join CTA

Do not add a separate panel beneath the card.

- [ ] **Step 3: Normalize spacing and button hierarchy**

Make sure:
- the card breathes more than the current attempt
- the title does not dominate so much that the form looks crushed
- primary and secondary actions feel like one system
- the join action looks secondary without becoming visually unrelated

- [ ] **Step 4: Run verification**

Run:
- `npm run typecheck`
- `npx expo export --platform android --output-dir .expo-export-check`

Expected: PASS.

- [ ] **Step 5: Run a manual functional smoke test for room entry**

In Expo on device/emulator, verify:
- entering a valid display name still enables `create room`
- successful `create room` still routes to `/room/[code]/lobby`
- entering a valid code plus display name still enables `join room`
- successful `join room` still routes to `/room/[code]/lobby`

If backend connectivity blocks a full end-to-end run, at minimum verify that button disabled states and handler wiring behave correctly with local UI state.

- [ ] **Step 6: Clean temporary export output**

Run: `if (Test-Path '.expo-export-check') { Remove-Item -Recurse -Force '.expo-export-check' }`

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/index.tsx src/components/layout/EntryCardShell.tsx src/components/ui/Button.tsx src/components/ui/Input.tsx
git commit -m "feat: rebuild home as mobile landing card"
```

---

### Task 5: Align `login` With the Same Visual System

**Files:**
- Modify: `app/(auth)/login.tsx`
- Modify: `src/components/layout/EntryCardShell.tsx`
- Modify: `src/components/branding/DecorativeTitle.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Button.tsx`

- [ ] **Step 1: Keep `login` within the same family, not a second full hero**

The screen should use:
- same background
- same card shell
- same title system
- same field/button treatment

But it should remain denser and more form-oriented than `welcome` and `index`.

- [ ] **Step 2: Rebuild `login.tsx`**

Implement:
- decorative screen title using the shared title component
- cleaner form hierarchy inside the card
- CTA and toggle actions using the unified button language

Preserve:
- register vs sign-in toggle
- Supabase auth calls
- toasts and validation behavior

- [ ] **Step 3: Run verification**

Run:
- `npm run typecheck`
- `npx expo export --platform android --output-dir .expo-export-check`

Expected: PASS.

- [ ] **Step 4: Run a manual functional smoke test for auth entry**

In Expo on device/emulator, verify:
- `welcome` guest entry still triggers anonymous sign-in
- `welcome` secondary actions still navigate to `/(auth)/login`
- `login` still toggles correctly between sign-in and register states
- submit buttons still call the same Supabase auth flows as before

If live auth cannot be completed, verify at minimum that the screens still dispatch the original handlers and loading states.

- [ ] **Step 5: Clean temporary export output**

Run: `if (Test-Path '.expo-export-check') { Remove-Item -Recurse -Force '.expo-export-check' }`

- [ ] **Step 6: Commit**

```bash
git add app/(auth)/login.tsx src/components/layout/EntryCardShell.tsx src/components/branding/DecorativeTitle.tsx src/components/ui/Input.tsx src/components/ui/Button.tsx
git commit -m "feat: align login with landing visual system"
```

---

### Task 6: Roll Out Navigator and In-Screen Title Styling

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/room/[code]/_layout.tsx`
- Modify: `app/(tabs)/gallery.tsx`
- Modify: `app/(tabs)/profile.tsx`
- Modify: `app/room/[code]/lobby.tsx`
- Modify: `app/room/[code]/ended.tsx`
- Modify: `src/components/game/RoundStatus.tsx`
- Modify: `src/components/game-phases/NarratorPhase.tsx`
- Modify: `src/components/game-phases/PlayersPhase.tsx`
- Modify: `src/components/game-phases/VotingPhase.tsx`
- Modify: `src/components/game-phases/ResultsPhase.tsx`
- Modify: `src/components/ui/Modal.tsx`

- [ ] **Step 1: Restyle navigator-owned titles**

Update `app/(tabs)/_layout.tsx` and `app/room/[code]/_layout.tsx` so navigator header titles use:
- decorative font family
- refined letter spacing
- app-consistent gold/text treatment

Do not change:
- tab labels
- routes
- `game` header visibility

- [ ] **Step 2: Restyle existing in-screen title surfaces**

Apply the shared title system to existing visible titles only:
- modal title in `Modal.tsx`
- empty/gallery/title-bearing surfaces in `gallery.tsx`
- anon-banner title and any section titles in `profile.tsx`
- room code/section headers in `lobby.tsx`
- winner and scoreboard header surfaces in `ended.tsx`
- phase/status/badge surfaces in `RoundStatus.tsx`, `NarratorPhase.tsx`, `PlayersPhase.tsx`, `VotingPhase.tsx`, and `ResultsPhase.tsx`

Do not add new top-level page titles to screens that do not currently have them.

- [ ] **Step 3: Keep decorative styling proportional**

Use strongest treatment on:
- navigator titles
- modal titles
- winner/major result titles

Use restrained treatment on:
- section labels
- lobby/game phase labels
- profile tab-related headings

This task is about consistency, not making every label shout.

- [ ] **Step 4: Run verification**

Run:
- `npm run typecheck`
- `npx expo export --platform android --output-dir .expo-export-check`

Expected: PASS.

- [ ] **Step 5: Clean temporary export output**

Run: `if (Test-Path '.expo-export-check') { Remove-Item -Recurse -Force '.expo-export-check' }`

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/_layout.tsx app/room/[code]/_layout.tsx app/(tabs)/gallery.tsx app/(tabs)/profile.tsx app/room/[code]/lobby.tsx app/room/[code]/ended.tsx src/components/game/RoundStatus.tsx src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx src/components/game-phases/VotingPhase.tsx src/components/game-phases/ResultsPhase.tsx src/components/ui/Modal.tsx
git commit -m "feat: roll out decorative title system across app"
```

---

### Task 7: Final Regression Pass

**Files:**
- Review only; no planned file creation

- [ ] **Step 1: Run the full lightweight verification suite**

Run:
- `npm test -- __tests__/brandTokens.test.ts`
- `npm run typecheck`
- `npx expo export --platform android --output-dir .expo-export-check`

Expected: all PASS.

- [ ] **Step 2: Clean temporary export output**

Run: `if (Test-Path '.expo-export-check') { Remove-Item -Recurse -Force '.expo-export-check' }`

- [ ] **Step 3: Manual visual QA checklist**

Verify on device/emulator:
- `welcome` has one card, better breathing, and unified CTA family
- `index` keeps all actions inside one card and still feels like a landing
- `login` belongs to the same family without becoming bloated
- navigator header titles use the decorative family where in scope
- `game` still has no top header
- no button family looks visually out-of-place against the landing system
- entry screens remain usable on a small phone height without the card collapsing into cramped content

- [ ] **Step 4: Manual functional regression checklist**

Verify on device/emulator:
- guest entry still attempts anonymous auth from `welcome`
- sign-in/register navigation still works
- create room still routes into lobby
- join room still routes into lobby
- modal actions in gallery still open and close correctly after the visual restyle

- [ ] **Step 5: Commit any final polish**

```bash
git add __tests__/brandTokens.test.ts src/constants/brand.ts src/constants/theme.ts src/components/branding/DecorativeTitle.tsx src/components/layout/EntryCardShell.tsx src/components/layout/Background.tsx src/components/ui/Button.tsx src/components/ui/Input.tsx src/components/ui/Modal.tsx app/(auth)/welcome.tsx app/(auth)/login.tsx app/(tabs)/index.tsx app/(tabs)/_layout.tsx app/room/[code]/_layout.tsx app/(tabs)/gallery.tsx app/(tabs)/profile.tsx app/room/[code]/lobby.tsx app/room/[code]/ended.tsx src/components/game/RoundStatus.tsx src/components/game-phases/NarratorPhase.tsx src/components/game-phases/PlayersPhase.tsx src/components/game-phases/VotingPhase.tsx src/components/game-phases/ResultsPhase.tsx
git commit -m "chore: finish landing visual redesign verification"
```

---

## Notes For The Implementer

- The current [welcome.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(auth)\welcome.tsx) already contains ad-hoc visual experimentation. Treat it as disposable and rebuild it around shared primitives rather than patching around the existing style block.
- The current `Button` API is too thin for the new system and is already being stretched by screen-specific needs. Normalize the component API instead of pushing one-off props deeper into screens.
- Because this repo does not yet have a React Native rendering test harness, keep test additions limited to pure token/helper logic. Use typecheck + Android export + manual review for the visual pieces.
