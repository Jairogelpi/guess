import { Image, View, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants/theme'

interface AvatarProps {
  uri?: string | null
  name?: string
  size?: number
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = name?.slice(0, 2).toUpperCase() ?? '?'
  const radius = size / 2

  return uri ? (
    <Image
      source={{ uri }}
      style={[styles.image, { width: size, height: size, borderRadius: radius }]}
    />
  ) : (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
  },
  fallback: {
    backgroundColor: colors.surfaceMid,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.gold,
    fontWeight: '800',
  },
})
