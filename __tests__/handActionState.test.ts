import {
  buildHandSlotsFromRoundCards,
  deriveHandActionDockState,
  resolveFocusedSlotIndex,
} from '../src/components/game/handActionState'

describe('handActionState', () => {
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
      selectedCardId: 'card-1',
    })

    expect(
      resolveFocusedSlotIndex({
        slots,
        selectedCardId: 'card-1',
        lastInsertedCardId: null,
      }),
    ).toBe(0)
  })

  test('disables paid generation when the free turn is spent and tokens are zero', () => {
    expect(
      deriveHandActionDockState({
        phase: 'players_turn',
        narratorStep: 1,
        focusedSlot: {
          slotIndex: 1,
          kind: 'empty',
          cardId: null,
          imageUri: null,
          galleryCardId: null,
        },
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
