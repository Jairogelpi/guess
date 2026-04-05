import { flattenStyleSafe } from '../src/lib/flattenStyleSafe'

describe('flattenStyleSafe', () => {
  test('falls back to recursively merging style arrays when StyleSheet.flatten is unavailable', () => {
    const result = flattenStyleSafe(
      [
        { width: 120, borderRadius: 16 },
        false,
        [{ opacity: 0.5 }, null, { width: 160 }],
      ],
      undefined,
    )

    expect(result).toEqual({
      width: 160,
      borderRadius: 16,
      opacity: 0.5,
    })
  })

  test('uses StyleSheet.flatten when available', () => {
    const flatten = jest.fn(() => ({ zIndex: 9 }))

    const result = flattenStyleSafe({ zIndex: 1 }, { flatten } as never)

    expect(flatten).toHaveBeenCalledWith({ zIndex: 1 })
    expect(result).toEqual({ zIndex: 9 })
  })
})
