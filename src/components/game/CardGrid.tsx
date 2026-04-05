import { FlatList, View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { MaskedCard } from '@/stores/useGameStore'
import { colors, radii, fonts } from '@/constants/theme'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { DixitCard } from '@/components/ui/DixitCard'

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
            profileName="hero"
            regionKey="card-grid"
            onPress={readonly ? undefined : () => onSelect?.(item)}
            style={[styles.cardTilt, (isSelected || isNarrator) && styles.cardTiltRaised]}
            floating={true}
          >
            <View
              style={[
                styles.cardWrap,
                isSelected && styles.cardWrapSelected,
                isNarrator && styles.cardWrapNarrator,
              ]}
            >
              <DixitCard
                uri={item.image_url}
                interactive={false}
                selected={isSelected || isNarrator}
                glowing={isNarrator}
                compact
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
  content: { gap: 12, paddingTop: 4 },
  cardTilt: {
    flex: 1,
  },
  cardTiltRaised: {
    zIndex: 3,
  },
  cardWrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    gap: 0,
    aspectRatio: 2 / 3,
  },
  cardWrapSelected: {
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  cardWrapNarrator: {
    shadowColor: colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  narratorBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(230, 184, 0, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    zIndex: 2,
  },
  narratorBadgeText: {
    color: '#0a0602',
    fontSize: 9,
    fontFamily: fonts.titleHeavy,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  nameBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(8,6,4,0.84)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 2,
  },
  nameText: {
    color: colors.textPrimary,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: fonts.title,
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
