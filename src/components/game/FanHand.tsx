import { useEffect } from 'react'
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { getFanCardPose, getFanCardZIndex } from '@/components/game/fanHandLayout'
import { colors, fonts } from '@/constants/theme'

export interface HandSlot {
  id: string
  imageUri?: string
  isSelected: boolean
}

interface Props {
  slots: HandSlot[]
  activeSlotIndex: number | null
  onSlotPress: (index: number) => void
  onSelect: (index: number) => void
  generating: boolean
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Card dimensions — 2:3 portrait ratio, slightly larger than before
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.24, 108)
const CARD_HEIGHT = CARD_WIDTH * 1.5
const HAND_HEIGHT = CARD_HEIGHT + 48  // extra room for selection lift & shadow

// Fan geometry — consistent for ALL slot types (empty, filled, active)
const CARD_STEP = CARD_WIDTH * 0.60   // distance between card centers (40% overlap)
const SPREAD_ANGLE = 9                 // degrees rotation per position from center
const ARC_DIP = 5                      // px² dip per offset² → quadratic arc (edges sink)

const SPRING = { damping: 18, stiffness: 200 }

/**
 * Unified transform for every card slot regardless of state.
 * Previously, empty slots only got translateX. Now all slots share this calculation.
 */
function computeTransform(
  index: number,
  total: number,
  selected: boolean,
  active: boolean,
) {
  const mid = (total - 1) / 2
  const offset = index - mid

  const translateX = offset * CARD_STEP
  const angleDeg = offset * SPREAD_ANGLE
  const arcY = offset * offset * ARC_DIP  // edges dip slightly: quadratic curve

  let translateY = arcY
  let scale = 1.0

  if (selected) {
    translateY = arcY - 30
    scale = 1.12
  } else if (active) {
    translateY = arcY - 16
    scale = 1.07
  }

  return { translateX, translateY, angleDeg, scale }
}

function HandCard({
  slot,
  index,
  total,
  isActive,
  generating,
  onPress,
}: {
  slot: HandSlot
  index: number
  total: number
  isActive: boolean
  generating: boolean
  onPress: () => void
}) {
  const focusedIndex = isActive ? index : null
  const selectedIndex = slot.isSelected ? index : null
  const { translateX, translateY, angleDeg, scale } = getFanCardPose({
    index, total, focusedIndex, selectedIndex,
  })

  const aX = useSharedValue(translateX)
  const aY = useSharedValue(translateY)
  const aR = useSharedValue(angleDeg)
  const aS = useSharedValue(scale)
  const pulse = useSharedValue(1)

  // Animate to target position on every render (same pattern as original)
  aX.value = withSpring(translateX, SPRING)
  aY.value = withSpring(translateY, SPRING)
  aR.value = withSpring(angleDeg, SPRING)
  aS.value = withSpring(scale, SPRING)

  // Subtle breathing pulse only for the active-but-empty slot
  useEffect(() => {
    const isEmptyActive = isActive && !slot.imageUri && !generating
    if (isEmptyActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 680 }),
          withTiming(1.0,  { duration: 680 }),
        ),
        -1,
        true,
      )
    } else {
      cancelAnimation(pulse)
      pulse.value = withTiming(1, { duration: 180 })
    }
  }, [isActive, slot.imageUri, generating, pulse])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: aX.value },
      { translateY: aY.value },
      { rotate: `${aR.value}deg` },
      { scale: aS.value * pulse.value },
    ],
  }))

  const zIndex = getFanCardZIndex({ index, focusedIndex, selectedIndex })
  const hasImage = !!slot.imageUri
  const isGeneratingThis = generating && isActive

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        { width: CARD_WIDTH, height: CARD_HEIGHT, zIndex },
        animatedStyle,
      ]}
    >
      <InteractiveCardTilt
        profileName="hero"
        regionKey="fan-hand"
        onPress={onPress}
        style={styles.tiltWrap}
      >
        <View
          style={[
            styles.cardFrame,
            hasImage     && styles.cardFrameFilled,
            isActive && !hasImage && styles.cardFrameActive,
            slot.isSelected && styles.cardFrameSelected,
          ]}
        >
          {isGeneratingThis ? (
            <View style={styles.generatingContent}>
              <MaterialCommunityIcons name="auto-fix" size={28} color={colors.gold} />
            </View>
          ) : hasImage ? (
            <Image
              source={{ uri: slot.imageUri }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            // Empty slot — numbered placeholder; active state glows
            <View style={styles.emptyContent}>
              <Text style={[styles.slotNumber, isActive && styles.slotNumberActive]}>
                {index + 1}
              </Text>
              <MaterialCommunityIcons
                name={isActive ? 'plus-circle' : 'plus-circle-outline'}
                size={isActive ? 24 : 18}
                color={isActive ? colors.gold : 'rgba(230,184,0,0.22)'}
              />
            </View>
          )}

          {/* Gold checkmark when this card is selected to play */}
          {slot.isSelected && (
            <View style={styles.selectedBadge} pointerEvents="none">
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>
      </InteractiveCardTilt>
    </Animated.View>
  )
}

export function FanHand({ slots, activeSlotIndex, onSlotPress, onSelect, generating }: Props) {
  return (
    <View style={[styles.container, { height: HAND_HEIGHT }]}>
      <View style={styles.fanArea}>
        {slots.map((slot, i) => (
          <HandCard
            key={slot.id}
            slot={slot}
            index={i}
            total={slots.length}
            isActive={activeSlotIndex === i}
            generating={generating}
            onPress={() => (slot.imageUri ? onSelect(i) : onSlotPress(i))}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'visible',
  },
  fanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 8,
  },
  tiltWrap: {
    flex: 1,
  },

  // ── Base frame: empty slot ──
  cardFrame: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(230, 184, 0, 0.12)',
    backgroundColor: 'rgba(18, 10, 6, 0.60)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 10,
  },

  // ── Filled card: image covers the frame ──
  cardFrameFilled: {
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.85,
    shadowRadius: 20,
    elevation: 20,
  },

  // ── Active empty slot: gold border + glow ──
  cardFrameActive: {
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: colors.gold,
    backgroundColor: 'rgba(18, 10, 6, 0.80)',
    shadowColor: colors.gold,
    shadowOpacity: 0.40,
    shadowRadius: 18,
    elevation: 18,
  },

  // ── Selected card: lifted gold glow, no border ──
  cardFrameSelected: {
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.70,
    shadowRadius: 22,
    elevation: 22,
  },

  cardImage: {
    width: '100%',
    height: '100%',
  },

  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  slotNumber: {
    color: 'rgba(230, 184, 0, 0.20)',
    fontSize: 10,
    fontFamily: fonts.titleHeavy,
    letterSpacing: 2,
  },
  slotNumberActive: {
    color: 'rgba(230, 184, 0, 0.55)',
  },

  generatingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 10, 6, 0.92)',
  },

  // ── Gold checkmark badge ──
  selectedBadge: {
    position: 'absolute',
    top: -7,
    right: -7,
    backgroundColor: colors.gold,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.90,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 40,
    borderWidth: 2,
    borderColor: 'rgba(10, 6, 2, 0.60)',
  },
  selectedText: {
    color: '#0a0602',
    fontSize: 12,
    fontWeight: '900',
  },
})
