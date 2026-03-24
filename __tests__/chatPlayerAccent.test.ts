import { getChatPlayerAccent } from '../src/lib/chatPlayerAccent'

describe('getChatPlayerAccent', () => {
  test('returns the same accent for the same player id', () => {
    expect(getChatPlayerAccent('player-1')).toEqual(getChatPlayerAccent('player-1'))
  })

  test('returns accent tokens with subtle border, text, and ring colors', () => {
    expect(getChatPlayerAccent('player-2')).toEqual(
      expect.objectContaining({
        ringColor: expect.any(String),
        nameColor: expect.any(String),
        bubbleBorderColor: expect.any(String),
      }),
    )
  })

  test('can return different accents for different player ids', () => {
    expect(getChatPlayerAccent('player-1')).not.toEqual(getChatPlayerAccent('player-3'))
  })
})
