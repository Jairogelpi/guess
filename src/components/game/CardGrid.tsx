import { FlatList, View, Text, Image, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { MaskedCard } from '@/stores/useGameStore'
import { colors, radii, shadows, fonts } from '@/constants/theme'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'

interface CardGridProps {
  cards: MaskedCard[]
  selectedId?: string | null
  onSelect?: (card: MaskedCard) => void
  playerNames?: Record<string, string>
  narratorPlayerId?: string
  readonly?: boolean
}

export function CardGrid({
  cards,
  selectedId,
  onSelect,
  playerNames,
  narratorPlayerId,
  readonly = false,
}: CardGridProps) {
  const { t } = useTranslation()
  return (
    <FlatList
      data={cards}
      keyExtractor={(c) => c.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedId
        const isNarrator = !!narratorPlayerId && item.player_id === narratorPlayerId
        return (
          <InteractiveCardTilt
            profileName="lite"
            regionKey="card-grid"
            onPress={readonly ? undefined : () => onSelect?.(item)}
            style={[styles.cardTilt, (isSelected || isNarrator) && styles.cardTiltRaised]}
          >
            <View
              style={[
                styles.cardWrap,
                isSelected && styles.cardWrapSelected,
                isNarrator && styles.cardWrapNarrator,
              ]}
            >
              <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
              {isNarrator && (
                <View style={styles.narratorBadge}>
                  <Text style={styles.narratorBadgeText}>{t('game.narratorBadge')}</Text>
                </View>
              )}
              {playerNames && item.player_id && !isNarrator && (
                <View style={styles.nameBadge}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {playerNames[item.player_id] ?? '?'}
                  </Text>
                </View>
              )}
              {isSelected && <View style={styles.selectedRing} />}
            </View>
          </InteractiveCardTilt>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  row: { gap: 12 },
  content: { gap: 12, padding: 16 },
  cardTilt: {
    flex: 1,
  },
  cardTiltRaised: {
    zIndex: 3,
  },
  cardWrap: {
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
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  cardWrapNarrator: {
    borderColor: colors.gold,
    borderWidth: 3,
    shadowColor: colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  narratorBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(230, 184, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 2,
  },
  narratorBadgeText: {
    color: '#0a0602',
    fontSize: 10,
    fontFamily: fonts.title,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1.5,
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
    zIndex: 2,
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
    zIndex: 3,
  },
})
