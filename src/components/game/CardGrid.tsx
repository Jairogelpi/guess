import { useCallback } from 'react'
import { FlatList, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import type { MaskedCard } from '@/stores/useGameStore'
import { colors, radii, shadows } from '@/constants/theme'

interface CardGridProps {
  cards: MaskedCard[]
  selectedId?: string | null
  onSelect?: (card: MaskedCard) => void
  playerNames?: Record<string, string>
  readonly?: boolean
}

export function CardGrid({
  cards,
  selectedId,
  onSelect,
  playerNames,
  readonly = false,
}: CardGridProps) {
  return (
    <FlatList
      data={cards}
      keyExtractor={(c) => c.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedId
        return (
          <TouchableOpacity
            style={[styles.cardWrap, isSelected && styles.cardWrapSelected]}
            onPress={() => !readonly && onSelect?.(item)}
            disabled={readonly}
            activeOpacity={0.85}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
            {playerNames && item.player_id && (
              <View style={styles.nameBadge}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {playerNames[item.player_id] ?? '?'}
                </Text>
              </View>
            )}
            {isSelected && <View style={styles.selectedRing} />}
          </TouchableOpacity>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  row: { gap: 12 },
  content: { gap: 12, padding: 16 },
  cardWrap: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    aspectRatio: 2 / 3,
    backgroundColor: colors.surfaceDeep,
    ...shadows.card,
  },
  cardWrapSelected: {
    borderColor: colors.goldLight,
    borderWidth: 3,
    transform: [{ scale: 1.03 }],
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  nameBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,6,2,0.82)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.goldBorder,
  },
  nameText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md - 2,
    borderWidth: 2,
    borderColor: 'rgba(251,176,36,0.35)',
  },
})
