import React, { useEffect, useMemo, useRef } from 'react'
import { Pressable, View, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { radii } from '@/constants/theme'
import { flattenStyleSafe } from '@/lib/flattenStyleSafe'
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
  showPolish?: boolean
  floating?: boolean
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

type ClipShapeStyle = Pick<
  ViewStyle,
  'borderRadius' | 'borderTopLeftRadius' | 'borderTopRightRadius' | 'borderBottomRightRadius' | 'borderBottomLeftRadius'
>

function extractClipShape(style: ViewStyle | undefined): ClipShapeStyle {
  if (!style) return {}
  return CLIP_RADIUS_KEYS.reduce<ClipShapeStyle>((shape, key) => {
    const value = style[key]
    if (typeof value === 'number') shape[key] = value
    return shape
  }, {})
}

function insetClipShape(shape: ClipShapeStyle, inset: number) {
  return CLIP_RADIUS_KEYS.reduce<ClipShapeStyle>((insetShape, key) => {
    const value = shape[key]
    if (typeof value === 'number') insetShape[key] = Math.max(value - inset, 0)
    return insetShape
  }, {})
}

function hasClipShape(shape: ClipShapeStyle) {
  return CLIP_RADIUS_KEYS.some((key) => shape[key] !== undefined)
}

const WEB_FRAME_STYLE_KEYS = [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'aspectRatio',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
] as const

function extractStyleKeys(style: ViewStyle | undefined, keys: ReadonlyArray<keyof ViewStyle>) {
  if (!style) return undefined
  const extracted: any = {}
  keys.forEach(key => {
    if (style[key] !== undefined) extracted[key] = style[key]
  })
  return Object.keys(extracted).length > 0 ? extracted : undefined
}

function omitStyleKeys(style: ViewStyle | undefined, keys: ReadonlyArray<keyof ViewStyle>) {
  if (!style) return undefined
  const nextStyle = { ...style }
  keys.forEach(key => delete (nextStyle as any)[key])
  return Object.keys(nextStyle).length > 0 ? nextStyle : undefined
}

function resolveWebSurfaceFrameStyle(style: ViewStyle | undefined) {
  if (!style) return undefined
  const nextStyle: Partial<ViewStyle> = {}
  if (style.width !== undefined || style.flex !== undefined || style.flexGrow !== undefined || style.aspectRatio !== undefined) {
    nextStyle.width = '100%'
  }
  if (style.height !== undefined) {
    nextStyle.height = (typeof style.height === 'string' && style.height.endsWith('%')) ? '100%' : style.height
  } else if (style.aspectRatio !== undefined) {
    nextStyle.aspectRatio = style.aspectRatio
  }
  return Object.keys(nextStyle).length > 0 ? nextStyle : undefined
}

function findFirstBorderRadiusInChildren(children: React.ReactNode): ClipShapeStyle | null {
  const arr = React.Children.toArray(children)
  if (arr.length !== 1) return null
  const child = arr[0]
  if (!React.isValidElement(child)) return null
  const childStyle = flattenStyleSafe<ViewStyle>((child.props as any).style, StyleSheet)
  const shape = extractClipShape(childStyle)
  if (hasClipShape(shape)) return shape
  return findFirstBorderRadiusInChildren((child.props as any).children)
}

function resolveClipShape({ wrapperStyle, children }: { wrapperStyle?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const flattened = flattenStyleSafe<ViewStyle>(wrapperStyle, StyleSheet)
  const wrapperShape = extractClipShape(flattened)
  if (hasClipShape(wrapperShape)) {
    return { clipShape: wrapperShape, shouldRenderPolishLayers: true }
  }
  const childShape = findFirstBorderRadiusInChildren(children)
  return {
    clipShape: childShape ?? { borderRadius: DEFAULT_OVERLAY_RADIUS },
    shouldRenderPolishLayers: true,
  }
}

// ── Standalone controller factory ──────────────────────────────────────────

interface CreateControllerConfig {
  profileName?: CardTiltProfileName
  regionKey?: string
  disabled?: boolean
  reducedMotion?: boolean
  onPress?: () => void
  onLongPress?: () => void
}

export function createInteractiveCardTiltController(config: CreateControllerConfig) {
  const profile = getCardTiltProfile(config.profileName ?? 'standard')
  const ownerId = Symbol(config.regionKey ?? 'default')
  let engaged = false
  let suppressNextPress = false
  let currentLastState = cardTiltMath.getNeutralTiltState()

  const releaseOwnership = () => {
    const rKey = config.regionKey ?? 'default'
    if (activeRegionOwners.get(rKey) === ownerId) {
      activeRegionOwners.delete(rKey)
    }
  }

  const acquireOwnership = () => {
    const rKey = config.regionKey ?? 'default'
    const current = activeRegionOwners.get(rKey)
    if (!current || current === ownerId) {
      activeRegionOwners.set(rKey, ownerId)
      return true
    }
    return false
  }

  return {
    press() {
      if (suppressNextPress) { suppressNextPress = false; return }
      if (!config.disabled) config.onPress?.()
    },
    longPress() {
      if (!config.disabled) { suppressNextPress = true; config.onLongPress?.() }
    },
    beginGesture() {
      if (config.disabled || config.reducedMotion) return false
      engaged = acquireOwnership()
      if (!engaged) currentLastState = cardTiltMath.getNeutralTiltState()
      return engaged
    },
    updateGesture(input: GestureUpdateInput) {
      if (!engaged || !input.layout) return cardTiltMath.getNeutralTiltState()
      if (!profile.preventScrollRelease && cardTiltMath.shouldReleaseToScroll({ dx: input.dx, dy: input.dy })) {
        engaged = false; releaseOwnership(); return cardTiltMath.getNeutralTiltState()
      }
      const target = cardTiltMath.computeCardTiltStateFromDrag({
        profile, layout: input.layout, drag: { dx: input.dx, dy: input.dy },
        pointer: { x: input.x, y: input.y }, velocity: { vx: input.vx, vy: input.vy },
        previousState: currentLastState,
      })
      currentLastState = cardTiltMath.blendCardTiltState(currentLastState, target, MOTION_BLEND_ALPHA)
      return currentLastState
    },
    finalizeGesture() {
      engaged = false; releaseOwnership(); currentLastState = cardTiltMath.getNeutralTiltState()
      return currentLastState
    },
    dispose() { engaged = false; releaseOwnership() },
  }
}

// ── Test helpers ────────────────────────────────────────────────────────────

let _controllerObserver: ((c: ReturnType<typeof createInteractiveCardTiltController> | undefined) => void) | undefined

export function __resetInteractiveCardTiltRegistry() {
  activeRegionOwners.clear()
}

export function __setInteractiveCardTiltControllerObserver(
  observer: ((c: ReturnType<typeof createInteractiveCardTiltController> | undefined) => void) | undefined,
) {
  _controllerObserver = observer
}

// ── Component ───────────────────────────────────────────────────────────────

export function InteractiveCardTilt(props: InteractiveCardTiltProps) {
  const {
    children, profileName = 'standard', regionKey = 'default', disabled = false, reducedMotion = false,
    onPress, onLongPress, testID = 'card-tilt', style, showPolish = true, floating = false
  } = props

  // PERSISTENT IDENTITIES
  const ownerId = useRef(Symbol(regionKey)).current
  const propsRef = useRef(props)
  propsRef.current = props

  const profile = useMemo(() => getCardTiltProfile(profileName), [profileName])

  // SHARED VALUES
  const layout = useSharedValue<ControllerLayout | undefined>(undefined)
  const gestureActive = useSharedValue(false)
  const lastTiltState = useSharedValue(cardTiltMath.getNeutralTiltState())

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

  const breatheAnim = useSharedValue(1)
  const riseAnim = useSharedValue(0)

  // GESTURE CONTROLLER (Internal Worklets)
  const controller = useMemo(() => {
    let engaged = false
    let suppressNextPress = false
    let currentLastState = cardTiltMath.getNeutralTiltState()

    const release = () => {
      if (activeRegionOwners.get(propsRef.current.regionKey || 'default') === ownerId) {
        activeRegionOwners.delete(propsRef.current.regionKey || 'default')
      }
    }

    const acquire = () => {
      const rKey = propsRef.current.regionKey || 'default'
      const current = activeRegionOwners.get(rKey)
      if (!current || current === ownerId) {
        activeRegionOwners.set(rKey, ownerId)
        return true
      }
      return false
    }

    return {
      press: () => {
        if (suppressNextPress) { suppressNextPress = false; return }
        if (!propsRef.current.disabled) propsRef.current.onPress?.()
      },
      longPress: () => {
        if (!propsRef.current.disabled) { suppressNextPress = true; propsRef.current.onLongPress?.() }
      },
      beginGesture: () => {
        if (propsRef.current.disabled || propsRef.current.reducedMotion) return false
        engaged = acquire()
        if (!engaged) currentLastState = cardTiltMath.getNeutralTiltState()
        return engaged
      },
      updateGesture: (input: GestureUpdateInput) => {
        if (!engaged || !input.layout) return cardTiltMath.getNeutralTiltState()
        if (!profile.preventScrollRelease && cardTiltMath.shouldReleaseToScroll({ dx: input.dx, dy: input.dy })) {
          engaged = false; release(); return cardTiltMath.getNeutralTiltState()
        }
        const target = cardTiltMath.computeCardTiltStateFromDrag({
          profile, layout: input.layout, drag: { dx: input.dx, dy: input.dy },
          pointer: { x: input.x, y: input.y }, velocity: { vx: input.vx, vy: input.vy },
          previousState: currentLastState
        })
        currentLastState = cardTiltMath.blendCardTiltState(currentLastState, target, MOTION_BLEND_ALPHA)
        return currentLastState
      },
      finalizeGesture: () => {
        engaged = false; release(); currentLastState = cardTiltMath.getNeutralTiltState()
        return currentLastState
      },
      dispose: () => { engaged = false; release() }
    }
  }, [profile, ownerId])

  useEffect(() => {
    if (floating) {
      breatheAnim.value = withRepeat(
        withSequence(
          withTiming(1.025, { duration: 3200 }),
          withTiming(1, { duration: 3200 })
        ),
        -1,
        true
      )
      riseAnim.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 100 }))
    } else {
      breatheAnim.value = 1
      riseAnim.value = 1
    }
  }, [floating])

  useEffect(() => {
    return () => controller.dispose()
  }, [controller])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      _controllerObserver?.(controller)
      return () => { _controllerObserver?.(undefined) }
    }
  }, [controller])

  // ANIMATION WORKLETS
  const applyTilt = (state: cardTiltMath.CardTiltState) => {
    'worklet'
    rotateX.value = state.rotateX; rotateY.value = state.rotateY; translateX.value = state.translateX
    translateY.value = state.translateY; scale.value = state.scale; pressScale.value = state.pressScale
    lift.value = state.lift; shadowShiftX.value = state.shadowShiftX; shadowShiftY.value = state.shadowShiftY
    shadowOpacity.value = state.shadowOpacity; highlightOpacity.value = state.highlightOpacity; lastTiltState.value = state
  }

  const springTilt = (state: cardTiltMath.CardTiltState) => {
    'worklet'
    const config = { damping: profile.damping, stiffness: profile.stiffness }
    rotateX.value = withSpring(state.rotateX, config); rotateY.value = withSpring(state.rotateY, config)
    translateX.value = withSpring(state.translateX, config); translateY.value = withSpring(state.translateY, config)
    scale.value = withSpring(state.scale, config); pressScale.value = withSpring(state.pressScale, config)
    lift.value = withSpring(state.lift, config); shadowShiftX.value = withSpring(state.shadowShiftX, config)
    shadowShiftY.value = withSpring(state.shadowShiftY, config); shadowOpacity.value = withSpring(state.shadowOpacity, config)
    highlightOpacity.value = withSpring(state.highlightOpacity, config); lastTiltState.value = state
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { translateX: translateX.value },
      { translateY: translateY.value + (floating ? (1 - riseAnim.value) * 30 : 0) },
      { translateY: lift.value },
      { scale: scale.value * (floating ? breatheAnim.value : 1) },
      { scale: pressScale.value },
    ],
    opacity: floating ? riseAnim.value : 1,
    zIndex: gestureActive.value ? 999 : (flattenStyleSafe<ViewStyle>(style, StyleSheet)?.zIndex ?? 1),
  }))

  const shadowBloomStyle = useAnimatedStyle(() => ({
    opacity: shadowOpacity.value,
    transform: [{ translateX: shadowShiftX.value }, { translateY: shadowShiftY.value }, { scaleX: 1.08 }, { scaleY: 1.02 }],
  }))

  const highlightBloomStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
    transform: [
      { translateX: shadowShiftX.value * -0.55 },
      { translateY: shadowShiftY.value * -0.45 },
      { rotate: `${rotateY.value * 0.65}deg` }
    ],
  }))

  const flattenedPropsStyle = useMemo(
    () => flattenStyleSafe<ViewStyle>(style, StyleSheet),
    [style],
  )
  const webFrameStyle = useMemo(() => extractStyleKeys(flattenedPropsStyle, WEB_FRAME_STYLE_KEYS), [flattenedPropsStyle])
  const webContentStyle = useMemo(() => omitStyleKeys(flattenedPropsStyle, WEB_FRAME_STYLE_KEYS), [flattenedPropsStyle])
  const webSurfaceFrameStyle = useMemo(
    () => resolveWebSurfaceFrameStyle(flattenedPropsStyle),
    [flattenedPropsStyle],
  )
  const clipRes = useMemo(() => resolveClipShape({ wrapperStyle: style, children }), [style, children])
  const innerClip = useMemo(() => insetClipShape(clipRes.clipShape, 1), [clipRes.clipShape])

  const panGesture = useMemo(() => Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      if (!layout.value) return
      if (controller.beginGesture()) {
        gestureActive.value = true
        applyTilt(cardTiltMath.blendCardTiltState(lastTiltState.value, cardTiltMath.computeCardTiltStateFromDrag({
          profile, layout: layout.value, drag: { dx: 0, dy: 0 }, velocity: { vx: 0, vy: 0 },
          previousState: lastTiltState.value, pointer: { x: e.x, y: e.y }
        }), MOTION_BLEND_ALPHA))
      }
    })
    .onUpdate((e) => {
      if (!gestureActive.value || !layout.value) return
      applyTilt(controller.updateGesture({
        dx: e.translationX, dy: e.translationY, vx: e.velocityX, vy: e.velocityY, x: e.x, y: e.y, layout: layout.value
      }))
    })
    .onFinalize(() => {
      gestureActive.value = false
      springTilt(controller.finalizeGesture())
    }), [controller, profile])

  const surface = (
    <Animated.View
      testID={testID}
      onLayout={(e) => { layout.value = e.nativeEvent.layout }}
      style={Platform.OS === 'web'
        ? [webContentStyle, webSurfaceFrameStyle, animatedStyle]
        : [style, animatedStyle]}
    >
      {showPolish && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', ...clipRes.clipShape }}>
          <Animated.View style={[styles.shadowLayer, shadowBloomStyle]} />
          <Animated.View style={[styles.highlightLayer, highlightBloomStyle]} />
          <Animated.View style={[styles.highlightEdge, innerClip]} />
        </View>
      )}
      <View style={[styles.contentWrap, clipRes.clipShape]}>{children}</View>
      {(onPress || onLongPress) && (
        <Pressable
          style={styles.gestureSurface}
          disabled={disabled}
          onPress={controller.press}
          onLongPress={controller.longPress}
          testID={`${testID}-press`}
        />
      )}
    </Animated.View>
  )

  if (Platform.OS === 'web') {
    return (
      <View style={[webFrameStyle, { position: 'relative' }]}>
        <GestureDetector gesture={panGesture}>{surface}</GestureDetector>
      </View>
    )
  }

  return <GestureDetector gesture={panGesture}>{surface}</GestureDetector>
}

const styles = StyleSheet.create({
  contentWrap: { flex: 1, overflow: 'hidden' },
  polishRoot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  shadowLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  highlightLayer: {
    position: 'absolute', left: '-10%', top: '-14%', width: '100%', height: '60%',
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  highlightEdge: {
    ...StyleSheet.absoluteFillObject, margin: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  gestureSurface: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
})
