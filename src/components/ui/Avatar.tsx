import { Image, View, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants/theme'

interface AvatarProps {
  uri?: string | null
  name?: string
  size?: number
  borderColor?: string
  textColor?: string
}

export function Avatar({ uri, name, size = 40, borderColor = colors.goldBorder, textColor = colors.gold }: AvatarProps) {
  const initials = name?.slice(0, 2).toUpperCase() ?? '?'
  const radius = size / 2

  let offsetY = 0.5
  if (uri) {
    try {
      const urlObj = new URL(uri)
      const offsetParam = urlObj.searchParams.get('offsetY')
      if (offsetParam && !isNaN(parseFloat(offsetParam))) {
        offsetY = parseFloat(offsetParam)
      }
    } catch {
      // Ignore
    }
  }

  const imageWidth = size
  const imageHeight = size * 1.5
  const maxTranslateY = size - imageHeight
  const translateY = maxTranslateY * offsetY

  return uri ? (
    <View style={[styles.imageContainer, { width: size, height: size, borderRadius: radius, borderColor }]}>
      <Image
        source={{ uri }}
        style={{ width: imageWidth, height: imageHeight, transform: [{ translateY }] }}
        resizeMode="cover"
      />
    </View>
  ) : (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, borderColor },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35, color: textColor }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  imageContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '800',
  },
})
