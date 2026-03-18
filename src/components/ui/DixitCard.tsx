import { TouchableOpacity, Image, View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, radii, shadows } from '@/constants/theme'

interface DixitCardProps {
  uri?: string | null
  loading?: boolean
  selected?: boolean
  label?: string
  onPress?: () => void
  disabled?: boolean
  aspectRatio?: number
}

export function DixitCard({
  uri,
  loading,
  selected,
  label,
  onPress,
  disabled,
  aspectRatio = 2 / 3,
}: DixitCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled ?? !onPress}
      activeOpacity={0.88}
      style={[styles.wrapper, selected && styles.wrapperSelected]}
    >
      <View style={[styles.card, selected && styles.cardSelected, { aspectRatio }]}>
        {loading ? (
          <View style={styles.placeholder}>
            <ActivityIndicator size="large" color={colors.gold} />
          </View>
        ) : uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>?</Text>
          </View>
        )}

        {/* Gold border overlay (selected highlight) */}
        {selected && <View style={styles.selectedOverlay} />}
      </View>

      {label && (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.md,
  },
  wrapperSelected: {
    transform: [{ scale: 1.03 }],
  },
  card: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceDeep,
    ...shadows.card,
  },
  cardSelected: {
    borderColor: colors.goldLight,
    borderWidth: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMid,
  },
  placeholderText: {
    color: colors.gold,
    fontSize: 36,
    fontWeight: '200',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md - 2,
    borderWidth: 2,
    borderColor: 'rgba(251,176,36,0.4)',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
})
