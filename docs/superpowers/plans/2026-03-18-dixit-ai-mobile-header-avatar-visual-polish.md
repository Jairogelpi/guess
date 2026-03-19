# Dixit AI Mobile Header Avatar Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the mobile chrome and onboarding visuals, make language switching work, surface the user's real avatar in the header, and let gallery cards become the profile avatar.

**Architecture:** Keep the current mobile structure, but centralize chrome/background/hero tuning in small constants and focused helpers so the styling changes are consistent across `welcome`, `create room`, `gallery`, and `profile`. Reuse the existing `profiles.avatar_url` column as the source of truth for the avatar and update it from gallery actions instead of introducing a separate upload flow.

**Tech Stack:** Expo Router, React Native, Supabase JS, Jest, i18next, React Native Safe Area Context

---

### Task 1: Lock Visual Tokens For Chrome And Hero

**Files:**
- Create: `__tests__/appChrome.test.ts`
- Create: `__tests__/welcomeHero.test.ts`
- Modify: `src/constants/appChrome.ts`
- Modify: `src/constants/welcomeHero.ts`
- Modify: `src/components/layout/Background.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
import { APP_TAB_BAR_THEME } from '../src/constants/appChrome'
import { WELCOME_HERO_IMAGE_SCALE } from '../src/constants/welcomeHero'

test('uses a dark solid tab bar theme', () => {
  expect(APP_TAB_BAR_THEME.backgroundColor).toBe('#120a06')
})

test('overscales the welcome hero image', () => {
  expect(WELCOME_HERO_IMAGE_SCALE).toBeGreaterThan(1)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest --runInBand __tests__/appChrome.test.ts __tests__/welcomeHero.test.ts`
Expected: FAIL because the new visual tokens or expectations are missing/outdated.

- [ ] **Step 3: Write minimal implementation**

```ts
export const APP_TAB_BAR_THEME = {
  backgroundColor: '#120a06',
  borderColor: 'rgba(244, 192, 119, 0.22)',
} as const

export const WELCOME_HERO_IMAGE_SCALE = 1.08
```

Reduce the background overlay in `Background.tsx` so `create room`, `gallery`, and `profile` show a livelier `fondo.png`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest --runInBand __tests__/appChrome.test.ts __tests__/welcomeHero.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add __tests__/appChrome.test.ts __tests__/welcomeHero.test.ts src/constants/appChrome.ts src/constants/welcomeHero.ts src/components/layout/Background.tsx
git commit -m "test: lock visual chrome and hero tokens"
```

### Task 2: Refine Welcome And Create Room Visual Hierarchy

**Files:**
- Modify: `app/(auth)/welcome.tsx`
- Modify: `app/(tabs)/index.tsx`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`
- Test: `__tests__/welcomeHero.test.ts`

- [ ] **Step 1: Write the failing test**

Add/extend assertions so the welcome hero keeps the smaller CTA text size and the create-room code field uses tighter tracking/smaller size through exported constants or helper values.

```ts
expect(WELCOME_HERO_IMAGE_SCALE).toBeGreaterThan(1)
expect(CREATE_ROOM_CODE_FONT_SIZE).toBe(18)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand __tests__/welcomeHero.test.ts`
Expected: FAIL because the create-room sizing constant does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
const guestBtnText = { fontSize: 17 }
const codeInput = { letterSpacing: 4, fontSize: 18 }
```

Apply these changes:
- improve hero typography
- shrink `Entrar como invitado`
- remove the remaining black gap by keeping the hero image overscaled
- reduce `Código de sala` size and tracking

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand __tests__/welcomeHero.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/(auth)/welcome.tsx app/(tabs)/index.tsx src/components/ui/Button.tsx src/components/ui/Input.tsx __tests__/welcomeHero.test.ts
git commit -m "feat: refine welcome and create room visual hierarchy"
```

### Task 3: Rebuild Header And Footer Chrome With Functional Language Toggle

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(auth)/welcome.tsx`
- Modify: `src/constants/appChrome.ts`
- Modify: `src/hooks/useAuth.ts`
- Test: `__tests__/appChrome.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that locks the header/tab chrome contract, including the icon order and the dark bordered footer theme.

```ts
expect(APP_TAB_ITEMS[0].icon).toBe('creation')
expect(APP_TAB_BAR_THEME.borderColor).toBe('rgba(244, 192, 119, 0.22)')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand __tests__/appChrome.test.ts`
Expected: FAIL if the theme/icon contract changed.

- [ ] **Step 3: Write minimal implementation**

Implement:
- a light bordered top header capsule
- a footer-like tab bar with complete border, no flat black slab
- functional `i18n.changeLanguage(...)` in the welcome header
- profile button in the header that uses real avatar data when available

If needed, extend `useAuth.ts` so it also exposes enough profile identity to render the header consistently.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand __tests__/appChrome.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/_layout.tsx app/(auth)/welcome.tsx src/constants/appChrome.ts src/hooks/useAuth.ts __tests__/appChrome.test.ts
git commit -m "feat: rebuild mobile header and footer chrome"
```

### Task 4: Surface Avatar In Profile And Let Gallery Set It

**Files:**
- Modify: `app/(tabs)/profile.tsx`
- Modify: `app/(tabs)/gallery.tsx`
- Create: `src/hooks/useProfile.ts`
- Create: `__tests__/profileAvatar.test.ts`
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Write the failing test**

```ts
import { resolveProfileAvatarFallback } from '../src/hooks/useProfile'

test('falls back to user initial when no avatar url exists', () => {
  expect(resolveProfileAvatarFallback('', 'Jairo')).toBe('J')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --runInBand __tests__/profileAvatar.test.ts`
Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `useProfile.ts` to:
- load `display_name` and `avatar_url` from `profiles`
- expose a refresh function
- provide a small avatar fallback helper

Then update:
- `profile.tsx` to show avatar preview and CTA to gallery
- `gallery.tsx` to add a `Foto de perfil` action that updates `profiles.avatar_url`
- translations for the new avatar/profile-photo copy

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --runInBand __tests__/profileAvatar.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/profile.tsx app/(tabs)/gallery.tsx src/hooks/useProfile.ts __tests__/profileAvatar.test.ts src/i18n/locales/es.json src/i18n/locales/en.json
git commit -m "feat: wire profile avatar through gallery"
```

### Task 5: Final Verification

**Files:**
- Verify only; no new files required unless fixes emerge

- [ ] **Step 1: Run focused Jest verification**

Run: `npx jest --runInBand __tests__/appChrome.test.ts __tests__/welcomeHero.test.ts __tests__/profileAvatar.test.ts`
Expected: PASS

- [ ] **Step 2: Run Android bundle verification**

Run: `npx expo export --platform android --output-dir .expo-export-check`
Expected: Bundles successfully without new Metro/runtime errors.

- [ ] **Step 3: Run a quick TypeScript smoke check on touched files**

Run: `npx tsc --noEmit`
Expected: No new errors from the touched client files. If baseline unrelated errors remain, document them explicitly instead of masking them.

- [ ] **Step 4: Manual behavior checklist**

Check:
- welcome language toggle changes visible copy immediately
- header shows avatar/inicial instead of a generic profile button when possible
- `Entrar como invitado` is visually smaller
- `Código de sala` is less dominant
- footer/tab bar no longer looks like a black slab
- gallery can set the avatar and profile reflects it

- [ ] **Step 5: Commit verification-safe fixes**

```bash
git add .
git commit -m "chore: finalize header avatar visual polish"
```
