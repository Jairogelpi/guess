export function resolveProfileAvatarFallback(
  avatarUrl: string | null | undefined,
  displayName: string | null | undefined,
) {
  if (avatarUrl) return ''

  const initial = displayName?.trim().charAt(0).toUpperCase()
  return initial || 'U'
}

export function getProfileAvatarFrame(size: number) {
  const borderWidth = Math.max(2, Math.round(size * 0.055))
  const innerSize = Math.max(0, size - borderWidth * 2)

  return {
    borderWidth,
    innerSize,
    outerRadius: size / 2,
    innerRadius: innerSize / 2,
  }
}
