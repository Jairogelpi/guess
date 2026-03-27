Original prompt: ", ahor aquier que las cartas en galeria y en la aprtida tengan exactamente el mismo drag y tilt que welcome" and later clarified "a todo" except previews.

- Added `__tests__/heroTiltBindings.test.ts` to lock the scoped gameplay/gallery `InteractiveCardTilt` bindings to `hero`.
- Swapped the five scoped gameplay/gallery non-preview bindings from `profileName="lite"` to `profileName="hero"`.
- Focused Jest regression now passes.
- Runtime verification was attempted on Expo web at `http://localhost:8082`.
- `scripts/open-three-player-room.mjs` failed twice for pre-existing lobby sync reasons: once with `Lobby did not become ready for room SL7R2L` and once with `Host could not see START GAME button after multiple reloads` for room `U4VA5D`.
- Textual verification confirms `HandGrid`, `FanHand`, `CardGrid`, `VoteCardField`, and `GalleryWildcardPicker` now all bind `profileName="hero"`.
- Preview-only surfaces still need visual runtime confirmation once the existing room-open flow is stable.
