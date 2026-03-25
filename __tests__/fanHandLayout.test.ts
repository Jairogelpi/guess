import { getFanCardPose, getFanCardZIndex } from '../src/components/game/fanHandLayout'

describe('fanHandLayout', () => {
  test('focused empty slots get the highest z-order and a wider spread pose', () => {
    const restingPose = getFanCardPose({
      index: 2,
      total: 3,
      focusedIndex: null,
      selectedIndex: 1,
    })
    const focusedPose = getFanCardPose({
      index: 2,
      total: 3,
      focusedIndex: 2,
      selectedIndex: 1,
    })

    expect(
      Math.abs(focusedPose.translateX),
    ).toBeGreaterThan(Math.abs(restingPose.translateX))
    expect(focusedPose.scale).toBeGreaterThan(restingPose.scale)

    expect(
      getFanCardZIndex({
        index: 2,
        focusedIndex: 2,
        selectedIndex: 1,
      }),
    ).toBeGreaterThan(
      getFanCardZIndex({
        index: 1,
        focusedIndex: 2,
        selectedIndex: 1,
      }),
    )
  })
})
