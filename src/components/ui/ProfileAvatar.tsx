import { Image, StyleSheet, Text, View } from 'react-native'
import { colors, fonts } from '@/constants/theme'
import { getProfileAvatarFrame } from '@/lib/profileAvatar'

interface ProfileAvatarProps {
  avatarUrl?: string | null
  fallback: string
  size: number
}

export function ProfileAvatar({ avatarUrl, fallback, size }: ProfileAvatarProps) {
  const frame = getProfileAvatarFrame(size)

  return (
    <View
      style={[
        styles.shell,
        {
          width: size,
          height: size,
          borderRadius: frame.outerRadius,
          borderWidth: frame.borderWidth,
        },
      ]}
    >
      <View
        style={[
          styles.innerMask,
          {
            width: frame.innerSize,
            height: frame.innerSize,
            borderRadius: frame.innerRadius,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.fallback,
              {
                width: frame.innerSize,
                height: frame.innerSize,
                borderRadius: frame.innerRadius,
              },
            ]}
          >
            <Text style={[styles.fallbackText, { fontSize: Math.max(16, size * 0.36) }]}>{fallback}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderColor: 'rgba(255, 228, 186, 0.45)',
    backgroundColor: 'rgba(18, 10, 6, 0.72)',
  },
  innerMask: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  fallbackText: {
    color: colors.textPrimary,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 0.8,
  },
})
