/**
 * Encapsulates the shared card-slot logic used by NarratorPhase and PlayersPhase:
 * - Three-slot hand state
 * - Image generation + card insertion (with full-flow race-condition guard)
 * - Slot selection
 * - Prompt suggestion
 * - Gallery Wildcard usage
 */
import { useState } from 'react'
import { useGameActions } from '@/hooks/useGameActions'
import { useImageGen } from '@/hooks/useImageGen'
import { usePromptSuggest } from '@/hooks/usePromptSuggest'
import { INITIAL_HAND_SLOTS } from '@/constants/game'
import type { HandSlot } from '@/components/game/HandGrid'
import type { Round, GalleryCard } from '@/types/game'

export interface HandSlotWithGallery extends HandSlot {
  galleryCardId?: string
}

interface Params {
  roomCode: string
  round: Round | null
  userId: string | null
}

export function useCardSelection({ roomCode, round, userId }: Params) {
  const { insertCard } = useGameActions()
  const { generate } = useImageGen()
  const { suggest } = usePromptSuggest()

  const [slots, setSlots] = useState<HandSlotWithGallery[]>(INITIAL_HAND_SLOTS)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(0)
  
  // Tracks which slot index is in-flight (generate API call + insertCard).
  const [generatingSlot, setGeneratingSlot] = useState<number | null>(null)

  // Only a slot that has both imageUri AND isSelected counts as the selection.
  const selectedSlot = slots.find((s) => s.isSelected && s.imageUri) ?? null
  const hasSelection = selectedSlot !== null

  async function handleGenerate(index: number, prompt: string) {
    if (!round || !userId || generatingSlot !== null) return
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return
    setGeneratingSlot(index)
    try {
      const result = await generate({ prompt: trimmedPrompt, scope: 'round', roomCode, roundId: round.id })
      if (!result?.imageUrl) return
      const cardId = await insertCard(roomCode, result.imageUrl, result.brief ?? trimmedPrompt)
      if (!cardId) return
      setSlots((prev) =>
        prev.map((s, i) => i === index ? { ...s, id: cardId, imageUri: result.imageUrl } : s),
      )
      // Auto-select this slot if nothing is selected yet
      if (!slots.some((s) => s.isSelected)) {
        setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
      }
      setActiveSlotIndex(null)
    } finally {
      setGeneratingSlot(null)
    }
  }

  async function handleSuggest(_index: number): Promise<string> {
    return (await suggest()) ?? ''
  }

  function handleSelect(index: number) {
    const slot = slots[index]
    if (!slot?.imageUri) return  // can't select an empty slot
    setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
  }

  async function handleUseWildcard(index: number, card: GalleryCard) {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index
          ? { ...s, id: 'wildcard-' + card.id, imageUri: card.image_url, galleryCardId: card.id }
          : s,
      ),
    )
    // Auto-select this slot if nothing is selected yet
    if (!slots.some((s) => s.isSelected)) {
      setSlots((prev) => prev.map((s, i) => ({ ...s, isSelected: i === index })))
    }
    setActiveSlotIndex(null)
  }

  return {
    slots,
    activeSlotIndex,
    setActiveSlotIndex,
    selectedSlot,
    hasSelection,
    /** True while any slot is being generated or its card is being inserted. */
    isGenerating: generatingSlot !== null,
    handleGenerate,
    handleSuggest,
    handleUseWildcard,
    handleSelect,
  }
}
