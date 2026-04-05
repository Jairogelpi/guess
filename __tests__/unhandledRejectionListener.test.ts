import { attachUnhandledStealRejectionListener } from '../src/lib/unhandledRejectionListener'

describe('attachUnhandledStealRejectionListener', () => {
  test('does nothing when the target lacks browser event APIs', () => {
    expect(() =>
      attachUnhandledStealRejectionListener({} as Window),
    ).not.toThrow()
  })

  test('registers and unregisters the listener when browser event APIs exist', () => {
    const addEventListener = jest.fn()
    const removeEventListener = jest.fn()

    const detach = attachUnhandledStealRejectionListener({
      addEventListener,
      removeEventListener,
    } as unknown as Window)

    expect(addEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    )

    detach()

    expect(removeEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    )
  })
})
