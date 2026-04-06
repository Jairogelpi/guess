import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors } from '@/constants/theme'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

interface ProfileButtonProps {
  userId: string | undefined | null
  avatarUrl: string | undefined | null
  avatarFallback: string | null
  accessibilityLabel: string
  onPress: () => void
  size?: number
}

export function ProfileButton({
  userId,
  avatarUrl,
  avatarFallback,
  accessibilityLabel,
  onPress,
  size = 32,
}: ProfileButtonProps) {
  const iconSize = Math.max(20, Math.round(size * 0.72))

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.profileButton, { borderRadius: size / 2 }]}
    >
      {userId ? (
        <ProfileAvatar avatarUrl={avatarUrl ?? undefined} fallback={avatarFallback ?? ''} size={size} />
      ) : (
        <View style={[styles.profileIconShell, { width: size, height: size, borderRadius: size / 2 }]}>
          <MaterialCommunityIcons name="cards-playing-outline" size={iconSize} color={colors.goldLight} />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  profileButton: {},
  profileIconShell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 6, 2, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 228, 186, 0.2)',
  },
})
