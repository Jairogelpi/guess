import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors, radii } from '@/constants/theme'
import { ProfileAvatar } from '@/components/ui/ProfileAvatar'

interface ProfileButtonProps {
  userId: string | undefined | null
  avatarUrl: string | undefined | null
  avatarFallback: string | null
  accessibilityLabel: string
  onPress: () => void
}

export function ProfileButton({
  userId,
  avatarUrl,
  avatarFallback,
  accessibilityLabel,
  onPress,
}: ProfileButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.profileButton}
    >
      {userId ? (
        <ProfileAvatar avatarUrl={avatarUrl ?? undefined} fallback={avatarFallback ?? ''} size={32} />
      ) : (
        <View style={styles.profileIconShell}>
          <MaterialCommunityIcons name="cards-playing-outline" size={24} color={colors.goldLight} />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  profileButton: {
    borderRadius: radii.full,
  },
  profileIconShell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 6, 2, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 228, 186, 0.2)',
  },
})
