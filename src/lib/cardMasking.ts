import type { Card, MaskedCard } from '@/types/game'

/**
 * Masks the `player_id` on a card during the voting phase so the UI
 * cannot reveal who played which card before results are shown.
 */
export function maskCard(card: Card, status: string): MaskedCard {
  return {
    ...card,
    player_id: status === 'voting' ? null : card.player_id,
  }
}
