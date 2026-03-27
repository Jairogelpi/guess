import { View, Image, Text, StyleSheet, Dimensions } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { colors, radii, shadows, fonts } from '@/constants/theme'
import type { MaskedCard } from '@/stores/useGameStore'

interface Props {
  cards: MaskedCard[]
  selectedId?: string | null
  onSelect?: (card: MaskedCard) => void
}

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_WIDTH = SCREEN_WIDTH * 0.22
const CARD_HEIGHT = CARD_WIDTH * 1.5
const ARC_RADIUS = 800
const SPREAD_ANGLE_DEG = 7

const SPRING_CONFIG = { damping: 18, stiffness: 180 }

function VoteCard({
  card,
  index,
  total,
  isSelected,
  onPress,
}: {
  card: MaskedCard
  index: number
  total: number
  isSelected: boolean
  onPress: () => void
}) {
  const mid = (total - 1) / 2
  const offset = index - mid
  const angleDeg = offset * SPREAD_ANGLE_DEG
  const angleRad = (angleDeg * Math.PI) / 180

  const targetX = Math.sin(angleRad) * ARC_RADIUS
  const targetY = ARC_RADIUS - Math.cos(angleRad) * ARC_RADIUS + (isSelected ? -20 : 0)
  const targetScale = isSelected ? 1.12 : 1

  const animX = useSharedValue(targetX)
  const animY = useSharedValue(targetY)
  const animR = useSharedValue(angleDeg)
  const animS = useSharedValue(targetScale)

  animX.value = withSpring(targetX, SPRING_CONFIG)
  animY.value = withSpring(targetY, SPRING_CONFIG)
  animR.value = withSpring(angleDeg, SPRING_CONFIG)
  animS.value = withSpring(targetScale, SPRING_CONFIG)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: animX.value },
      { translateY: animY.value },
      { rotate: `${animR.value}deg` },
      { scale: animS.value },
    ],
  }))

  const zIndex = isSelected ? 20 : 10 - Math.abs(index - Math.floor(total / 2))

  return (
    <Animated.View
      style={[
        styles.voteCardContainer,
        { width: CARD_WIDTH, height: CARD_HEIGHT, zIndex },
        animatedStyle,
      ]}
    >
      <InteractiveCardTilt
        profileName="hero"
        regionKey="vote-field"
        onPress={onPress}
        style={styles.tiltWrap}
      >
        <View
          style={[
            styles.cardWrap,
            isSelected && styles.cardWrapSelected,
          ]}
        >
          <Image
            source={{ uri: card.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
          {isSelected && <View style={styles.selectedGlow} />}
        </View>
      </InteractiveCardTilt>
    </Animated.View>
  )
}

export function VoteCardField({ cards, selectedId, onSelect }: Props) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldArea}>
        {cards.map((card, i) => (
          <VoteCard
            key={card.id}
            card={card}
            index={i}
            total={cards.length}
            isSelected={card.id === selectedId}
            onPress={() => onSelect?.(card)}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fieldContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  fieldArea: {
    width: '100%',
    height: CARD_HEIGHT + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteCardContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  tiltWrap: {
    flex: 1,
  },
  cardWrap: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceDeep,
    ...shadows.card,
  },
  cardWrapSelected: {
    borderColor: colors.goldLight,
    borderWidth: 3,
    shadowColor: colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md - 2,
    borderWidth: 2,
    borderColor: 'rgba(251, 176, 36, 0.45)',
    backgroundColor: 'rgba(251, 176, 36, 0.06)',
  },
})
