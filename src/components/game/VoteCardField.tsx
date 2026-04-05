import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { DixitCard } from '@/components/ui/DixitCard'
import { colors, fonts, radii } from '@/constants/theme'
import type { MaskedCard } from '@/stores/useGameStore'

interface Props {
  cards: MaskedCard[]
  selectedId?: string | null
  committedId?: string | null
  pendingId?: string | null
  onSelect?: (card: MaskedCard) => void
  onPreview?: (card: MaskedCard) => void
}

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 360)
const CARD_ASPECT_RATIO = 2 / 3

function VoteCard({
  card,
  isSelected,
  isCommitted,
  isPending,
  onPress,
  onLongPress,
}: {
  card: MaskedCard
  isSelected: boolean
  isCommitted: boolean
  isPending: boolean
  onPress: () => void
  onLongPress: () => void
}) {
  const badgeLabel = isPending ? 'NUEVA' : isCommitted ? 'ENVIADA' : isSelected ? 'ACTUAL' : null

  return (
    <View style={styles.voteCardContainer}>
      <InteractiveCardTilt
        profileName="hero"
        regionKey="vote-field"
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tiltWrap}
      >
        <View
          style={[
            styles.cardShell,
            isSelected && styles.cardShellSelected,
            isCommitted && styles.cardShellCommitted,
            isPending && styles.cardShellPending,
          ]}
        >
          <View style={styles.cardFrame}>
            {badgeLabel && (
              <View
                style={[
                  styles.stateBadge,
                  isPending ? styles.stateBadgePending : styles.stateBadgeCommitted,
                ]}
              >
                <Text style={styles.stateBadgeText}>{badgeLabel}</Text>
              </View>
            )}
            <View style={styles.previewBadge}>
              <MaterialCommunityIcons name="magnify" size={12} color="rgba(255,241,222,0.78)" />
              <Text style={styles.previewBadgeText}>MANTEN</Text>
            </View>
            <DixitCard
              uri={card.image_url}
              selected={isSelected}
              interactive={false}
              glowing={isSelected}
              aspectRatio={CARD_ASPECT_RATIO}
            />
            <LinearGradient
              colors={['transparent', 'rgba(5,2,0,0.82)', 'rgba(0,0,0,0.96)']}
              locations={[0, 0.42, 1]}
              style={styles.promptOverlay}
            >
              <View style={styles.promptChip}>
                <Text style={styles.promptText} numberOfLines={2}>
                  {card.prompt}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </InteractiveCardTilt>
    </View>
  )
}

export function VoteCardField({ cards, selectedId, committedId, pendingId, onSelect, onPreview }: Props) {
  return (
    <ScrollView
      style={styles.fieldContainer}
      contentContainerStyle={styles.fieldArea}
      showsVerticalScrollIndicator={false}
    >
      {cards.map((card) => (
          <VoteCard
            key={card.id}
            card={card}
            isSelected={card.id === selectedId}
            isCommitted={card.id === committedId}
            isPending={card.id === pendingId}
            onPress={() => onSelect?.(card)}
            onLongPress={() => onPreview?.(card)}
          />
        ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  fieldContainer: {
    flex: 1,
  },
  fieldArea: {
    alignItems: 'center',
    gap: 22,
    paddingTop: 14,
    paddingBottom: 34,
  },
  voteCardContainer: {
    width: CARD_WIDTH,
  },
  tiltWrap: {
    width: '100%',
  },
  cardShell: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.18)',
  },
  cardShellSelected: {
    transform: [{ translateY: -4 }],
    borderColor: 'rgba(230, 184, 0, 0.62)',
  },
  cardShellCommitted: {
    borderColor: 'rgba(245, 201, 96, 0.9)',
    shadowColor: 'rgba(245, 201, 96, 0.8)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cardShellPending: {
    borderColor: '#ffb35c',
    shadowColor: '#ffb35c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.48,
    shadowRadius: 14,
    elevation: 10,
  },
  cardFrame: {
    position: 'relative',
  },
  stateBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  stateBadgeCommitted: {
    backgroundColor: 'rgba(245, 201, 96, 0.92)',
    borderColor: 'rgba(20, 12, 5, 0.8)',
  },
  stateBadgePending: {
    backgroundColor: '#ffb35c',
    borderColor: 'rgba(20, 12, 5, 0.8)',
  },
  stateBadgeText: {
    color: '#201005',
    fontFamily: fonts.titleHeavy,
    fontSize: 10,
    letterSpacing: 1,
  },
  previewBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,241,222,0.28)',
    backgroundColor: 'rgba(8, 4, 1, 0.62)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewBadgeText: {
    color: 'rgba(255,241,222,0.78)',
    fontFamily: fonts.titleHeavy,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  promptOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  promptChip: {
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 0, 0.18)',
    backgroundColor: 'rgba(20, 12, 5, 0.72)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  promptText: {
    color: colors.goldLight,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.title,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
})
