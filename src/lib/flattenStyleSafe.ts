type FlattenLike = {
  flatten?: (style: unknown) => unknown
}

function mergeStyleEntries(style: unknown): Record<string, unknown> | undefined {
  if (!style || typeof style === 'boolean' || typeof style === 'number') {
    return undefined
  }

  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((merged, entry) => {
      const nextEntry = mergeStyleEntries(entry)
      return nextEntry ? { ...merged, ...nextEntry } : merged
    }, {})
  }

  if (typeof style === 'object') {
    return { ...(style as Record<string, unknown>) }
  }

  return undefined
}

export function flattenStyleSafe<T>(
  style: unknown,
  styleSheet?: FlattenLike,
): T | undefined {
  if (styleSheet?.flatten) {
    return (styleSheet.flatten(style) as T | undefined) ?? undefined
  }

  return mergeStyleEntries(style) as T | undefined
}
