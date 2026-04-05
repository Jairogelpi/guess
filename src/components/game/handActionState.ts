export interface HydratedHandSlot {
  slotIndex: number
  kind: 'empty' | 'filled'
  cardId: string | null
  imageUri: string | null
  galleryCardId: string | null
}

export interface BuildHandSlotsInput {
  maxSlots: number
  cards: readonly RoundCardRecord[]
}

export interface RoundCardRecord {
  id: string
  image_url: string
  prompt?: string
  created_at: string
  origin_kind?: string | null
  source_gallery_card_id?: string | null
}

export interface ResolveFocusedSlotIndexInput {
  slots: readonly HydratedHandSlot[]
  selectedCardId: string | null
  lastInsertedCardId: string | null
}

export interface DeriveHandActionDockStateInput {
  phase: 'narrator_turn' | 'players_turn' | 'voting' | 'results'
  focusedSlot: HydratedHandSlot
  hasFreeGeneration: boolean
  generationTokens: number
  generating: boolean
}

export interface HandActionDockState {
  ctaLabel: string
  disabled: boolean
  mode: 'generate' | 'next' | 'play'
}

export function buildHandSlotsFromRoundCards(input: BuildHandSlotsInput): HydratedHandSlot[] {
  const sortedCards = Array.from(input.cards).sort((left, right) => {
    const createdAtOrder = left.created_at.localeCompare(right.created_at)
    if (createdAtOrder !== 0) {
      return createdAtOrder
    }

    return left.id.localeCompare(right.id)
  })

  return Array.from({ length: input.maxSlots }, (_, slotIndex) => {
    const card = sortedCards[slotIndex] ?? null

    if (!card) {
      return {
        slotIndex,
        kind: 'empty',
        cardId: null,
        imageUri: null,
        galleryCardId: null,
      }
    }

    return {
      slotIndex,
      kind: 'filled',
      cardId: card.id,
      imageUri: card.image_url,
      galleryCardId:
        card.origin_kind === 'gallery' ? card.source_gallery_card_id ?? null : null,
    }
  })
}

export function resolveFocusedSlotIndex(input: ResolveFocusedSlotIndexInput): number | null {
  const selectedIndex = findSlotIndexByCardId(input.slots, input.selectedCardId)
  if (selectedIndex !== null) {
    return selectedIndex
  }

  const insertedIndex = findSlotIndexByCardId(input.slots, input.lastInsertedCardId)
  if (insertedIndex !== null) {
    return insertedIndex
  }

  return input.slots.find((slot) => slot.kind === 'empty')?.slotIndex ?? null
}

export function deriveHandActionDockState(
  input: DeriveHandActionDockStateInput,
): HandActionDockState {
  if (input.focusedSlot.kind === 'filled' && input.phase === 'players_turn') {
    return {
      ctaLabel: 'Jugar esta carta',
      disabled: false,
      mode: 'play',
    }
  }

  if (input.focusedSlot.kind === 'filled') {
    return {
      ctaLabel: 'Enviar pista',
      disabled: false,
      mode: 'next',
    }
  }

  const paidGeneration = input.hasFreeGeneration === false

  return {
    ctaLabel: paidGeneration ? 'Generar carta (-1)' : 'Generar carta gratis',
    disabled: input.generating || (paidGeneration && input.generationTokens < 1),
    mode: 'generate',
  }
}

function findSlotIndexByCardId(
  slots: readonly HydratedHandSlot[],
  cardId: string | null,
): number | null {
  if (!cardId) {
    return null
  }

  return slots.find((slot) => slot.cardId === cardId)?.slotIndex ?? null
}
