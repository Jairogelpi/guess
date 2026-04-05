/** Number of card slots in a player's hand each round. */
export const MAX_HAND_SLOTS = 3

/**
 * Initial slot state — no images, nothing selected.
 * Typed as { id: string; isSelected: boolean }[] which is structurally
 * assignable to HandSlot[] (imageUri is optional in HandSlot).
 */
export const INITIAL_HAND_SLOTS = [
  { id: 'slot-0', isSelected: false },
  { id: 'slot-1', isSelected: false },
  { id: 'slot-2', isSelected: false },
]

/** Seconds shown in the results countdown before auto-advancing to the next round. */
export const COUNTDOWN_SECONDS = 20
