import React, { useEffect, useMemo, useRef } from 'react'
import { Pressable, View, Platform, StyleSheet, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { radii } from '@/constants/theme'
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
  vx: number
  vy: number
  x: number
  y: number
  layout?: ControllerLayout
}

const activeRegionOwners = new Map<string, symbol>()
const MOTION_BLEND_ALPHA = 0.62
const DEFAULT_OVERLAY_RADIUS = radii.md + 2
const CLIP_RADIUS_KEYS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
] as const
let controllerObserver:
  | ((controller: ReturnType<typeof createInteractiveCardTiltController> | undefined) => void)
  | undefined

type ClipShapeStyle = Pick<
  ViewStyle,
  'borderRadius' | 'borderTopLeftRadius' | 'borderTopRightRadius' | 'borderBottomRightRadius' | 'borderBottomLeftRadius'
>

function extractClipShape(style: ViewStyle | undefined): ClipShapeStyle {
  if (!style) {
    return {}
  }

  return CLIP_RADIUS_KEYS.reduce<ClipShapeStyle>((shape, key) => {
    const value = style[key]
    if (typeof value === 'number') {
      shape[key] = value
    }

    return shape
  }, {})
}

function insetClipShape(shape: ClipShapeStyle, inset: number) {
  return CLIP_RADIUS_KEYS.reduce<ClipShapeStyle>((insetShape, key) => {
    const value = shape[key]
    if (typeof value === 'number') {
      insetShape[key] = Math.max(value - inset, 0)
    }

    return insetShape
  }, {})
}

function resolveClipShape({
  wrapperStyle,
  children,
}: {
  wrapperStyle?: StyleProp<ViewStyle>
  children: React.ReactNode
}) {
  const childStyle = React.isValidElement<{ style?: StyleProp<ViewStyle> }>(children)
    ? children.props.style
    : undefined
  const mergedStyle = {
    ...(StyleSheet.flatten(wrapperStyle) ?? {}),
    ...(StyleSheet.flatten(childStyle) ?? {}),
  }
  const clipShape = extractClipShape(mergedStyle)

  if (CLIP_RADIUS_KEYS.every((key) => clipShape[key] === undefined)) {
    return {
      borderRadius: DEFAULT_OVERLAY_RADIUS,
    }
  }

  return clipShape
}

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
  const resetToNeutral = () => {
    lastState = cardTiltMath.getNeutralTiltState()
    return lastState
  }

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
      resetToNeutral()
      if (!isTiltEnabled()) {
        return false
      }

      engaged = acquireRegion(regionKey, ownerId)
      if (!engaged) {
        resetToNeutral()
      }
      return engaged
    },
    updateGesture({ dx, dy, vx, vy, x, y, layout }: GestureUpdateInput) {
      if (!engaged || !layout) {
        return resetToNeutral()
      }

      if (!profile.preventScrollRelease && cardTiltMath.shouldReleaseToScroll({ dx, dy })) {
        engaged = false
        releaseRegion(regionKey, ownerId)
        return resetToNeutral()
      }

      const targetState = cardTiltMath.computeCardTiltStateFromDrag({
        profile,
        layout,
        drag: { dx, dy },
        pointer: { x, y },
        velocity: { vx, vy },
        previousState: lastState,
      })

      lastState = cardTiltMath.blendCardTiltState(lastState, targetState, MOTION_BLEND_ALPHA)
      return lastState
    },
    finalizeGesture() {
      engaged = false
      releaseRegion(regionKey, ownerId)
      return resetToNeutral()
    },
    dispose() {
      engaged = false
      suppressNextPress = false
      releaseRegion(regionKey, ownerId)
      return resetToNeutral()
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
  const pressScale = useSharedValue(1)
  const lift = useSharedValue(0)
  const shadowShiftX = useSharedValue(0)
  const shadowShiftY = useSharedValue(0)
  const shadowOpacity = useSharedValue(0)
  const highlightOpacity = useSharedValue(0)
  const clipShape = useMemo(() => resolveClipShape({ wrapperStyle: style, children }), [children, style])
  const innerClipShape = useMemo(() => insetClipShape(clipShape, 1), [clipShape])

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
    pressScale.value = state.pressScale
    lift.value = state.lift
    shadowShiftX.value = state.shadowShiftX
    shadowShiftY.value = state.shadowShiftY
    shadowOpacity.value = state.shadowOpacity
    highlightOpacity.value = state.highlightOpacity
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
    pressScale.value = withSpring(rest.pressScale, springConfig)
    lift.value = withSpring(rest.lift, springConfig)
    shadowShiftX.value = withSpring(rest.shadowShiftX, springConfig)
    shadowShiftY.value = withSpring(rest.shadowShiftY, springConfig)
    shadowOpacity.value = withSpring(rest.shadowOpacity, springConfig)
    highlightOpacity.value = withSpring(rest.highlightOpacity, springConfig)
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
      { translateY: lift.value },
      { scale: scale.value },
      { scale: pressScale.value },
    ],
    // CRITICAL: Force non-zero dimensions on web to prevent layout collapse
    ...(Platform.OS === 'web' ? { width: '100%', height: '100%' } : {}),
  }))

  const shadowWashStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value * 0.45,
    transform: [
      { translateX: shadowShiftX.value * 0.35 },
      { translateY: shadowShiftY.value * 0.35 },
    ],
  }))

  const shadowBloomStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value,
    transform: [
      { translateX: shadowShiftX.value },
      { translateY: shadowShiftY.value },
      { scaleX: 1.08 },
      { scaleY: 1.02 },
    ],
  }))

  const highlightBloomStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
    transform: [
      { translateX: shadowShiftX.value * -0.55 },
      { translateY: shadowShiftY.value * -0.45 },
      { rotate: `${rotateY.value * 0.65}deg` },
    ],
  }))

  const highlightEdgeStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value * 0.7,
    transform: [
      { translateX: shadowShiftX.value * -0.18 },
      { translateY: shadowShiftY.value * -0.18 },
    ],
  }))

  const polishLayers = React.createElement(
    View,
    {
      pointerEvents: 'none',
      style: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        ...clipShape,
      },
    },
    React.createElement(Animated.View, {
      style: [
        {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(10, 6, 2, 0.28)',
        },
        shadowWashStyle,
      ],
    }),
    React.createElement(Animated.View, {
      style: [
        {
          position: 'absolute',
          left: '-18%',
          bottom: '-26%',
          width: '140%',
          height: '82%',
          borderRadius: 999,
          backgroundColor: 'rgba(8, 5, 2, 0.82)',
        },
        shadowBloomStyle,
      ],
    }),
    React.createElement(Animated.View, {
      style: [
        {
          position: 'absolute',
          left: '-10%',
          top: '-14%',
          width: '88%',
          height: '54%',
          borderRadius: 999,
          backgroundColor: 'rgba(255, 246, 228, 0.96)',
        },
        highlightBloomStyle,
      ],
    }),
    React.createElement(Animated.View, {
      style: [
        {
          position: 'absolute',
          top: 1,
          right: 1,
          bottom: 1,
          left: 1,
          borderWidth: 1,
          borderColor: 'rgba(255, 248, 234, 0.42)',
          ...innerClipShape,
        },
        highlightEdgeStyle,
      ],
    }),
  )

  const animatedChild = React.createElement(Animated.View, { style: [animatedStyle, style] }, children, polishLayers)
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
            style: Platform.OS === 'web' ? style : undefined, // Force dimensions on web wrapper
          },
          animatedChild,
        )
      : React.createElement(
          View,
          {
            onLayout,
            testID,
            style: Platform.OS === 'web' ? style : undefined, // Force dimensions on web wrapper
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
          vx: 0,
          vy: 0,
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
          vx: event.velocityX,
          vy: event.velocityY,
          x: event.x,
          y: event.y,
          layout: layoutRef.current,
        }),
      )
    })
    .onFinalize(() => {
      springToRest()
    })

  // ON WEB: Wrap in a View with the provided style to ensure visibility 
  // without blocking the internal gestures or clicks.
  if (Platform.OS === 'web') {
    return (
      <View style={[style, { position: 'relative' }]}>
        <GestureDetector gesture={panGesture}>
          {surface}
        </GestureDetector>
      </View>
    )
  }

  return React.createElement(GestureDetector, { gesture: panGesture }, surface)
}
