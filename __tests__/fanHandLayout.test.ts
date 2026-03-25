import { getFanCardPose, getFanCardZIndex } from '../src/components/game/fanHandLayout'

describe('fanHandLayout', () => {
  test('focused empty slots get the highest z-order and a wider spread pose', () => {
    expect(
      getFanCardPose({
        index: 0,
        total: 3,
        focusedIndex: 2,
        selectedIndex: 1,
      }).translateX,
    ).toBeLessThan(-40)

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
