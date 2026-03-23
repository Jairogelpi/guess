import { create } from 'zustand'
import type { Round, MaskedCard } from '@/types/game'

export type { MaskedCard }  // re-export so existing importers don't break

interface GameState {
  round: Round | null
  cards: MaskedCard[]
  myPlayedCardId: string | null
  myVotedCardId: string | null
  // Server time offset for countdown: resultsServerNow - resultsLocalNow (ms)
  resultsServerOffset: number
  // Narrator's current step (1 = choose card, 2 = write clue) — used by game.tsx ContextStrip
  narratorStep: 1 | 2
  setRound: (r: Round) => void
  setCards: (cards: MaskedCard[]) => void
  setMyPlayedCardId: (id: string | null) => void
  setMyVotedCardId: (id: string | null) => void
  setResultsServerOffset: (offset: number) => void
  setNarratorStep: (step: 1 | 2) => void
  reset: () => void
}

export const useGameStore = create<GameState>((set) => ({
  round: null,
  cards: [],
  myPlayedCardId: null,
  myVotedCardId: null,
  resultsServerOffset: 0,
  narratorStep: 1,
  setRound: (round) => set({ round }),
  setCards: (cards) => set({ cards }),
  setMyPlayedCardId: (myPlayedCardId) => set({ myPlayedCardId }),
  setMyVotedCardId: (myVotedCardId) => set({ myVotedCardId }),
  setResultsServerOffset: (resultsServerOffset) => set({ resultsServerOffset }),
  setNarratorStep: (narratorStep) => set({ narratorStep }),
  reset: () => set({
    round: null,
    cards: [],
    myPlayedCardId: null,
    myVotedCardId: null,
    resultsServerOffset: 0,
    narratorStep: 1,
  }),
}))
