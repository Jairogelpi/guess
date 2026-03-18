# Dixit AI Mobile - Landing Visual Redesign Spec
**Date:** 2026-03-18
**Project:** `dixit_ai_mobile`
**Status:** Approved

---

## Overview

`dixit_ai_mobile` needs a visual reset so the mobile app stops feeling like a generic Expo shell and instead inherits the same identity as the original web project in `guess_the_pront`.

The direct reference is [LandingPage.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\guess_the_pront\src\pages\LandingPage.tsx). The approved mobile direction is the denser single-card mockup based on that landing: one large central card, same title treatment, same amber/orange CTA language, and the room-entry actions integrated inside the card instead of living in separate stacked panels.

This redesign is not limited to the home screen. The title typography and visual language become app-wide rules, while the full landing-style card composition is applied to the entry surfaces.

---

## Goals

- Recreate the visual identity of the original web landing inside the mobile app.
- Remove the current layered-card/home-shell look and replace it with a single strong focal card.
- Keep the current room flow intact: users can still create a room or join with a code from the same mobile screen.
- Make title typography consistent across the whole app instead of screen-by-screen styling.
- Centralize visual tokens so future screens do not reintroduce inconsistent title, button, and divider styles.

---

## User-Approved Direction

The approved direction is the compact mockup variant shown in the visual companion:

- one main card only
- no superposed cards
- integrated create/join form inside the card
- same ornamental title family as the original landing
- same warm CTA treatment as the original landing
- same direction applied to all relevant entry screens
- global title typography applied across all pages

This is intentionally a mobile adaptation, not a literal one-to-one desktop clone. The layout preserves the original hierarchy while compressing spacing and reducing motion so it remains stable on phones.

---

## Scope

### In Scope

- Redesign [index.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(tabs)\index.tsx) to match the approved single-card mobile landing direction.
- Redesign [welcome.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(auth)\welcome.tsx) to share the same visual composition and language.
- Align [login.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(auth)\login.tsx) with the same visual system so auth does not visually fork away from the landing.
- Introduce shared theme/type tokens in [theme.ts](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\src\constants\theme.ts) for hero titles, screen titles, section titles, button labels, dividers, and card shells.
- Apply the title typography system across app screens that present major titles:
  - [gallery.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(tabs)\gallery.tsx)
  - [profile.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(tabs)\profile.tsx)
  - [lobby.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\room\[code]\lobby.tsx)
  - [game.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\room\[code]\game.tsx)
  - [ended.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\room\[code]\ended.tsx)
- Apply the title system to both navigation-owned and screen-owned title surfaces where they already exist.
- Keep the current functional navigation and room actions intact.

### Out of Scope

- Rewriting game logic, auth flows, or room actions.
- Replacing all body copy typography with decorative fonts.
- Rebuilding every screen into a full landing-card composition.
- Recreating desktop hover-heavy animation patterns in mobile.

---

## Source Reference

The visual reference comes primarily from:

- [LandingPage.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\guess_the_pront\src\pages\LandingPage.tsx)
- [index.css](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\guess_the_pront\src\index.css)

The most important borrowed patterns are:

- `font-title` / `font-button` based on `Cinzel Decorative` with `IM Fell English SC` fallback
- title treatment using `text-magical`, `text-rainbow-fast`, `no-glow-text`
- CTA treatment using `btn-orange`
- CTA label treatment using `text-icy-static`
- centered hero hierarchy over a single card image

The mobile app will reproduce these through React Native equivalents rather than literal CSS copies.

---

## Visual System

### 1. Background

- Keep the full-screen `fondo.png` backdrop through [Background.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\src\components\layout\Background.tsx).
- Increase its resemblance to the original landing by tuning overlay darkness, vignette, and color falloff.
- Preserve readability by keeping a darkened lower half behind form controls.

### 2. Main Card Shell

- Replace multi-card or detached-panel composition with one dominant central card using `carta.png`.
- Use a rounded gold border, warm glow, and subtle depth to echo the original Dixit-card framing.
- The card remains the only dominant object in the scene.
- The form lives inside the same card, not beneath it in a separate surface.

### 3. Typography

- Titles across the app use `Cinzel Decorative` as the primary decorative family.
- The large landing wordmark recreates the original high-contrast ornamental feel.
- Section titles and screen titles reuse the same family with smaller scale and tighter spacing.
- Body copy, helper text, and dense functional copy remain readable and may stay on a plainer style where necessary.

### 4. Color Language

- Gold/amber remains the framing color for dividers, borders, and title accents.
- Orange/amber gradients remain the primary CTA language.
- Cold white/icy gradients are reserved for CTA labels and high-emphasis button text.
- Neutral panels use dark translucent brown/black instead of flat gray UI surfaces.

### 5. Motion

- Remove desktop-style hover and exaggerated breathing effects.
- Keep only subtle pressed-state and glow behavior that feels native on mobile.
- Prioritize clarity and performance over ornamental animation.

---

## Entry Screen Composition

### Home: [index.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(tabs)\index.tsx)

This becomes the primary mobile landing adaptation.

Structure:

- top utility row with required version and locale pills
- one large central card
- hero title area in the upper half
- concise subtitle under the title
- compact lower form area for:
  - display name
  - create room CTA
  - separator
  - join code input
  - join CTA

The approved composition is the denser variant rather than the airier hero-first layout. The page should still feel like a landing, but it must fit common mobile heights without looking empty or requiring awkward scroll.

### Welcome: [welcome.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(auth)\welcome.tsx)

`welcome` adopts the same shell and hierarchy:

- same background language
- same main card shell
- same title treatment
- auth CTA integrated inside the card instead of feeling like a different mini-product

This keeps the first-run auth experience aligned with the post-auth home instead of visually switching styles after login.

### Login: [login.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(auth)\login.tsx)

`login` should not become a second landing, but it should still inherit the same system:

- same background
- same decorative title system
- same CTA button language
- same field shell treatment

The result should feel like the same product family as `welcome` and `index`.

---

## Global Title System

The user explicitly requested that all page titles use the same title typography.

To make that maintainable, the app needs a shared title system rather than inline styles scattered across screens.

Required shared variants:

- `titleHero`: large landing wordmark for `welcome` and `index`
- `titleScreen`: page-level titles for major screens like gallery/profile/lobby
- `titleSection`: section headers inside cards, modals, or grouped actions
- `buttonLabel`: decorative CTA label style
- `eyebrow`: small uppercase helper heading

Rules:

- All major screen titles use the decorative family.
- Decorative gradients are strongest on hero titles and more restrained on normal screen titles.
- Section headings may use the same family without full rainbow treatment if readability would suffer.
- Inputs, chat text, labels with dense information, and body paragraphs do not need to use the decorative family by default.

Title surfaces in scope:

- navigator header titles configured in layouts such as [app/(tabs)/_layout.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(tabs)\_layout.tsx) and [app/room/[code]/_layout.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\room\[code]\_layout.tsx)
- in-screen page titles that are already rendered by the screen itself
- modal titles such as the header in [Modal.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\src\components\ui\Modal.tsx)
- major section titles inside entry screens and profile/lobby/end-of-game surfaces

Title surfaces explicitly out of scope:

- tab bar labels
- dense form labels and helper copy
- chat message text
- score rows and small metadata labels
- adding brand-new page titles to screens that currently do not expose one

Current-screen interpretation:

- `gallery`, `profile`, `lobby`, and `ended` should restyle their existing visible title-bearing surfaces.
- `game` should keep `headerShown: false` and should not gain a new top page title in this redesign; only existing in-screen phase/status title surfaces are eligible for the new title styling if they already exist.
- `index`, `welcome`, and `login` are the only screens that should gain the full landing-card composition.
- the home utility row should keep `version` and `locale` pills in the entry compositions; they are required, not optional.

This preserves identity without harming legibility.

---

## Components and Tokens

The redesign should reduce style duplication by moving the visual language into shared primitives.

Expected token areas in [theme.ts](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\src\constants\theme.ts):

- decorative font family names already loaded in [app/_layout.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\_layout.tsx)
- title scales
- eyebrow spacing
- divider styles
- gold/orange/icy color ramps
- card border/glow/shadow presets
- field shell colors
- CTA gradients and pressed states

Expected shared UI abstractions:

- a reusable landing card shell for entry screens
- reusable title style helpers or token exports for screen/section headings
- reusable decorated CTA button treatment

The implementation should favor composition through shared tokens/helpers instead of copying giant `StyleSheet` blocks screen by screen.

---

## Behavior Constraints

- Create room and join room flows remain exactly where users expect them in the home screen.
- Auth behavior remains unchanged.
- Navigation paths remain unchanged.
- The redesign is visual and structural, not behavioral.

If a visual change creates friction with an existing action, behavior wins and the visual layout should adapt.

---

## Responsiveness

- The approved mobile layout must work on common phone heights without requiring a desktop-like scale trick.
- The card may scroll internally on smaller devices if necessary, but that should be a fallback rather than the default experience.
- The card should preserve enough vertical breathing room that the title still feels intentional.
- The form area should compress before the hero loses all prominence.

---

## Accessibility and Readability

- Decorative fonts must not be used for long paragraphs or dense controls.
- Contrast on titles and buttons must remain readable over the image card.
- Inputs and buttons must remain clearly tappable with mobile-friendly height.
- Important labels should not rely on color alone to communicate hierarchy.

---

## Implementation Notes

- Prefer React Native-native equivalents of the web effects instead of trying to copy CSS behavior literally.
- Reuse the already loaded Google font package rather than introducing new font-loading complexity.
- Preserve current app routing and auth guards.
- Avoid tying screen-specific visual logic to game hooks or room hooks.

---

## Verification

The redesign is complete when:

- [index.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(tabs)\index.tsx) visually reads as a mobile adaptation of the original landing instead of a generic form screen.
- [welcome.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(auth)\welcome.tsx) shares the same product identity.
- [login.tsx](c:\Users\jairo\Desktop\PROYECTO GUESSTHEPRONT\dixit_ai_mobile\app\(auth)\login.tsx) fits the same system.
- Major page titles across the app use the same decorative typography family.
- There are no superposed cards in the entry composition.
- The create/join flow still works without added steps.
- Android bundling still succeeds after the visual refactor.

---

## Summary

This spec turns the current mobile app into a visually coherent extension of the original `guess_the_pront` landing. The approved result is a denser, single-card mobile landing system for the entry screens plus a global decorative title system for the whole app. It intentionally preserves functional flows while replacing the current fragmented visual language with one strong, reusable design system.
