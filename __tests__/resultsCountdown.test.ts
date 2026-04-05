import { COUNTDOWN_SECONDS } from '../src/constants/game'

test('results countdown lasts 20 seconds before auto-advance', () => {
  expect(COUNTDOWN_SECONDS).toBe(20)
})
