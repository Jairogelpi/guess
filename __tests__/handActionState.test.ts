import {
  buildHandSlotsFromRoundCards,
  deriveHandActionDockState,
  resolveFocusedSlotIndex,
  type BuildHandSlotsInput,
  type DeriveHandActionDockStateInput,
} from '../src/components/game/handActionState'

const emptyFocusedSlot = {
  slotIndex: 1,
  kind: 'empty' as const,
  cardId: null,
  imageUri: null,
  galleryCardId: null,
}

// @ts-expect-error selectedCardId is not part of the public build contract yet
const _buildInputShouldRejectSelectedCardId: BuildHandSlotsInput = { maxSlots: 3, cards: [], selectedCardId: 'card-1' }

// @ts-expect-error narratorStep is not part of the public dock-state contract yet
const _dockStateShouldRejectNarratorStep: DeriveHandActionDockStateInput = { phase: 'players_turn', focusedSlot: emptyFocusedSlot, hasFreeGeneration: false, generationTokens: 0, generating: false, narratorStep: 1 }

describe('handActionState', () => {
  test('hydrates slots with a deterministic tie-breaker when created_at matches', () => {
    expect(
      buildHandSlotsFromRoundCards({
        maxSlots: 3,
        cards: [
          {
            id: 'card-b',
            image_url: 'https://img/b',
            created_at: '2026-03-25T10:00:00Z',
          },
          {
            id: 'card-a',
            image_url: 'https://img/a',
            created_at: '2026-03-25T10:00:00Z',
          },
        ],
      }).map((slot) => slot.cardId),
    ).toEqual(['card-a', 'card-b', null])
  })

  test('falls back to the selected filled card before any empty slot', () => {
    const slots = buildHandSlotsFromRoundCards({
      maxSlots: 3,
      cards: [
        {
          id: 'card-1',
          image_url: 'https://img/1',
          prompt: 'moon',
          created_at: '2026-03-25T10:00:00Z',
        },
      ],
    })

    expect(
      resolveFocusedSlotIndex({
        slots,
        selectedCardId: 'card-1',
        lastInsertedCardId: null,
      }),
    ).toBe(0)
  })

  test('returns null when there is no selected card, inserted card, or empty slot to focus', () => {
    const slots = buildHandSlotsFromRoundCards({
      maxSlots: 2,
      cards: [
        {
          id: 'card-1',
          image_url: 'https://img/1',
          created_at: '2026-03-25T10:00:00Z',
        },
        {
          id: 'card-2',
          image_url: 'https://img/2',
          created_at: '2026-03-25T10:01:00Z',
        },
      ],
    })

    expect(
      resolveFocusedSlotIndex({
        slots,
        selectedCardId: 'missing-card',
        lastInsertedCardId: 'missing-card',
      }),
    ).toBeNull()
  })

  test('disables paid generation when the free turn is spent and tokens are zero', () => {
    expect(
      deriveHandActionDockState({
        phase: 'players_turn',
        focusedSlot: emptyFocusedSlot,
        hasFreeGeneration: false,
        generationTokens: 0,
        generating: false,
      }),
    ).toMatchObject({
      ctaLabel: 'Generar carta (-1)',
      disabled: true,
      mode: 'generate',
    })
  })
})
