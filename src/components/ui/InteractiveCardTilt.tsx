import React, { useEffect, useMemo, useRef } from 'react'
import { Pressable, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { getCardTiltProfile } from './cardTiltRegistry'
import * as cardTiltMath from './cardTiltMath'
import type { CardTiltProfileName } from './cardTiltProfiles'

interface InteractiveCardTiltProps {
  children: React.ReactNode
  profileName?: CardTiltProfileName
  regionKey?: string
  disabled?: boolean
  reducedMotion?: boolean
  onPress?: () => void
  onLongPress?: () => void
  testID?: string
  style?: StyleProp<ViewStyle>
}

interface ControllerLayout {
  width: number
  height: number
}

interface GestureUpdateInput {
  dx: number
  dy: number
  x: number
  y: number
  layout?: ControllerLayout
}

const activeRegionOwners = new Map<string, symbol>()
let controllerObserver:
  | ((controller: ReturnType<typeof createInteractiveCardTiltController> | undefined) => void)
  | undefined

function acquireRegion(regionKey: string, ownerId: symbol) {
  const currentOwner = activeRegionOwners.get(regionKey)
  if (!currentOwner || currentOwner === ownerId) {
    activeRegionOwners.set(regionKey, ownerId)
    return true
  }

  return false
}

function releaseRegion(regionKey: string, ownerId: symbol) {
  if (activeRegionOwners.get(regionKey) === ownerId) {
    activeRegionOwners.delete(regionKey)
  }
}

export function __resetInteractiveCardTiltRegistry() {
  activeRegionOwners.clear()
}

export function __setInteractiveCardTiltControllerObserver(
  observer:
    | ((controller: ReturnType<typeof createInteractiveCardTiltController> | undefined) => void)
    | undefined,
) {
  controllerObserver = process.env.NODE_ENV === 'test' ? observer : undefined
}

export function createInteractiveCardTiltController({
  profileName = 'standard',
  regionKey = 'default',
  disabled = false,
  reducedMotion = false,
  onPress,
  onLongPress,
}: Omit<InteractiveCardTiltProps, 'children' | 'style' | 'testID'>) {
  const ownerId = Symbol(regionKey)
  const profile = getCardTiltProfile(profileName)
  let engaged = false
  let suppressNextPress = false
  let lastState = cardTiltMath.getNeutralTiltState()

  const isTiltEnabled = () => !disabled && !reducedMotion

  return {
    profile,
    isTiltEnabled,
    press() {
      if (suppressNextPress) {
        suppressNextPress = false
        return
      }

      if (!disabled) {
        onPress?.()
      }
    },
    longPress() {
      if (!disabled) {
        suppressNextPress = true
        onLongPress?.()
      }
    },
    beginGesture() {
      if (!isTiltEnabled()) {
        return false
      }

      engaged = acquireRegion(regionKey, ownerId)
      lastState = cardTiltMath.getNeutralTiltState()
      return engaged
    },
    updateGesture({ dx, dy, x, y, layout }: GestureUpdateInput) {
      if (!engaged || !layout) {
        lastState = cardTiltMath.getNeutralTiltState()
        return cardTiltMath.getNeutralTiltState()
      }

      if (cardTiltMath.shouldReleaseToScroll({ dx, dy })) {
        engaged = false
        releaseRegion(regionKey, ownerId)
        lastState = cardTiltMath.getNeutralTiltState()
        return cardTiltMath.getNeutralTiltState()
      }

      const targetState = cardTiltMath.computeCardTiltStateFromDrag({
        profile,
        layout,
        drag: { dx, dy },
      })

      lastState = cardTiltMath.blendCardTiltState(lastState, targetState, 0.75)
      return lastState
    },
    finalizeGesture() {
      engaged = false
      lastState = cardTiltMath.getNeutralTiltState()
      releaseRegion(regionKey, ownerId)
      return cardTiltMath.getNeutralTiltState()
    },
    dispose() {
      engaged = false
      suppressNextPress = false
      lastState = cardTiltMath.getNeutralTiltState()
      releaseRegion(regionKey, ownerId)
    },
  }
}

export function InteractiveCardTilt({
  children,
  profileName = 'standard',
  regionKey = 'default',
  disabled = false,
  reducedMotion = false,
  onPress,
  onLongPress,
  testID = 'interactive-card-tilt',
  style,
}: InteractiveCardTiltProps) {
  const controller = useMemo(
    () =>
      createInteractiveCardTiltController({
        profileName,
        regionKey,
        disabled,
        reducedMotion,
        onPress,
        onLongPress,
      }),
    [disabled, onLongPress, onPress, profileName, reducedMotion, regionKey],
  )
  const layoutRef = useRef<ControllerLayout | undefined>(undefined)
  const rotateX = useSharedValue(0)
  const rotateY = useSharedValue(0)
  const translateX = useSharedValue(0)
  const translateY = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      controllerObserver?.(controller)
    }

    return () => {
      if (process.env.NODE_ENV === 'test') {
        controllerObserver?.(undefined)
      }
      controller.dispose()
    }
  }, [controller])

  const applyState = (state: cardTiltMath.CardTiltState) => {
    rotateX.value = state.rotateX
    rotateY.value = state.rotateY
    translateX.value = state.translateX
    translateY.value = state.translateY
    scale.value = state.scale
  }

  const springToRest = () => {
    const rest = controller.finalizeGesture()
    const springConfig = {
      damping: controller.profile.damping,
      stiffness: controller.profile.stiffness,
    }

    rotateX.value = withSpring(rest.rotateX, springConfig)
    rotateY.value = withSpring(rest.rotateY, springConfig)
    translateX.value = withSpring(rest.translateX, springConfig)
    translateY.value = withSpring(rest.translateY, springConfig)
    scale.value = withSpring(rest.scale, springConfig)
  }

  const onLayout = (event: LayoutChangeEvent) => {
    layoutRef.current = event.nativeEvent.layout
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }))

  const animatedChild = React.createElement(Animated.View, { style: [animatedStyle, style] }, children)
  const surface =
    onPress || onLongPress
      ? React.createElement(
          Pressable,
          {
            disabled,
            onLayout,
            onLongPress: () => controller.longPress(),
            onPress: () => controller.press(),
            testID,
          },
          animatedChild,
        )
      : React.createElement(
          View,
          {
            onLayout,
            testID,
          },
          animatedChild,
        )

  if (!controller.isTiltEnabled()) {
    return surface
  }

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onBegin((event) => {
      if (!controller.beginGesture()) {
        return
      }

      applyState(
        controller.updateGesture({
          dx: 0,
          dy: 0,
          x: event.x,
          y: event.y,
          layout: layoutRef.current,
        }),
      )
    })
    .onUpdate((event) => {
      applyState(
        controller.updateGesture({
          dx: event.translationX,
          dy: event.translationY,
          x: event.x,
          y: event.y,
          layout: layoutRef.current,
        }),
      )
    })
    .onFinalize(() => {
      springToRest()
    })

  return React.createElement(GestureDetector, { gesture: panGesture }, surface)
}
