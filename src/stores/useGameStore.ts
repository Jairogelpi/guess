import { create } from 'zustand'
import type { Round, Card } from '@/types/game'

export type MaskedCard = Omit<Card, 'player_id'> & { player_id: string | null }

interface GameState {
  round: Round | null
  cards: MaskedCard[]
  myPlayedCardId: string | null
  setRound: (r: Round) => void
  setCards: (cards: MaskedCard[]) => void
  setMyPlayedCardId: (id: string | null) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  round: null,
  cards: [],
  myPlayedCardId: null,
  setRound: (round) => set({ round }),
  setCards: (cards) => set({ cards }),
  setMyPlayedCardId: (myPlayedCardId) => set({ myPlayedCardId }),
  reset: () => set({ round: null, cards: [], myPlayedCardId: null }),
}))
