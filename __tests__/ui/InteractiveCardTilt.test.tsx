import fs from 'node:fs'
import path from 'node:path'
import React, { act } from 'react'
const ReactDOMClient = require('react-dom/client') as {
  createRoot: (container: unknown) => {
    render: (element: React.ReactElement) => void
    unmount: () => void
  }
}

function createHostComponent(tagName: string, displayName: string) {
  const HostComponent = ({ children, testID, ...props }: Record<string, unknown>) => {
    const mappedProps: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(props)) {
      if (key === 'numberOfLines') {
        mappedProps.numberoflines = value
        continue
      }

      if (key === 'onLayout' || key === 'onLongPress' || key === 'onPress' || key === 'gesture') {
        continue
      }

      if (key === 'style') {
        mappedProps.style = flattenStyle(value)
        continue
      }

      mappedProps[key] = value
    }

    if (testID) {
      mappedProps.testid = testID
    }

    return React.createElement(tagName, mappedProps, children as React.ReactNode)
  }

  HostComponent.displayName = displayName
  return HostComponent
}

const MockPressable = createHostComponent('pressable', 'Pressable')
const MockTouchableOpacity = createHostComponent('touchableopacity', 'TouchableOpacity')
const MockView = createHostComponent('view', 'View')
const MockText = createHostComponent('text', 'Text')
const MockImage = createHostComponent('image', 'Image')
const MockActivityIndicator = createHostComponent('activityindicator', 'ActivityIndicator')
const MockAnimatedView = createHostComponent('animatedview', 'AnimatedView')
const MockGestureDetector = createHostComponent('gesturedetector', 'GestureDetector')
const gestureConfigCalls = {
  minDistance: [] as number[],
  runOnJS: [] as boolean[],
}

function flattenStyle(style: unknown): Record<string, unknown> | undefined {
  if (!style || typeof style === 'boolean' || typeof style === 'number') {
    return undefined
  }

  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((merged, entry) => {
      const flattenedEntry = flattenStyle(entry)

      return flattenedEntry ? { ...merged, ...flattenedEntry } : merged
    }, {})
  }

  if (typeof style === 'object') {
    return { ...(style as Record<string, unknown>) }
  }

  return undefined
}

jest.mock('react-native', () => ({
  Pressable: MockPressable,
  TouchableOpacity: MockTouchableOpacity,
  View: MockView,
  Text: MockText,
  Image: MockImage,
  ActivityIndicator: MockActivityIndicator,
  Platform: { OS: 'web' },
  StyleSheet: {
    create: <T,>(styles: T) => styles,
    absoluteFillObject: {},
    flatten: (style: unknown) => flattenStyle(style),
  },
}))

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: MockGestureDetector,
  Gesture: {
    Pan: () => {
      const chain = {
        minDistance: (value: number) => {
          gestureConfigCalls.minDistance.push(value)
          return chain
        },
        runOnJS: (value: boolean) => {
          gestureConfigCalls.runOnJS.push(value)
          return chain
        },
        onBegin: () => chain,
        onUpdate: () => chain,
        onFinalize: () => chain,
      }

      return chain
    },
  },
}))

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: MockAnimatedView,
  },
  makeMutable: (initial: unknown) => ({ value: initial }),
  useSharedValue: (initial: number) => ({ value: initial }),
  useAnimatedStyle: (factory: () => unknown) => factory(),
  withSpring: (value: number) => value,
}))

jest.mock('@/constants/theme', () => ({
  colors: {
    gold: '#f0c000',
    cardBorder: '#654321',
    surfaceDeep: '#111111',
    surfaceMid: '#222222',
    goldLight: '#ffe08a',
    textSecondary: '#dddddd',
  },
  radii: {
    md: 12,
  },
  shadows: {
    card: {},
  },
}), { virtual: true })

const { StyleSheet } = require('react-native') as typeof import('react-native')
const cardTiltMath = require('../../src/components/ui/cardTiltMath') as typeof import('../../src/components/ui/cardTiltMath')
const {
  __resetInteractiveCardTiltRegistry,
  __setInteractiveCardTiltControllerObserver,
  InteractiveCardTilt,
  createInteractiveCardTiltController,
} = require('../../src/components/ui/InteractiveCardTilt') as typeof import('../../src/components/ui/InteractiveCardTilt')
const { DixitCard } = require('../../src/components/ui/DixitCard') as typeof import('../../src/components/ui/DixitCard')
const interactiveCardTiltSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'src', 'components', 'ui', 'InteractiveCardTilt.tsx'),
  'utf8',
)

class FakeNode {
  nodeType: number
  nodeName: string
  tagName: string
  ownerDocument: FakeDocument
  namespaceURI = 'http://www.w3.org/1999/xhtml'
  childNodes: FakeNode[] = []
  parentNode: FakeNode | null = null
  style: Record<string, string> = {}
  attributes: Record<string, string> = {}
  textContent = ''

  constructor(nodeType: number, nodeName: string, ownerDocument: FakeDocument) {
    this.nodeType = nodeType
    this.nodeName = nodeName
    this.tagName = nodeName.toUpperCase()
    this.ownerDocument = ownerDocument
  }

  appendChild(child: FakeNode) {
    this.childNodes.push(child)
    child.parentNode = this
    return child
  }

  removeChild(child: FakeNode) {
    this.childNodes = this.childNodes.filter((candidate) => candidate !== child)
    child.parentNode = null
    return child
  }

  insertBefore(child: FakeNode, before: FakeNode | null) {
    if (!before) {
      return this.appendChild(child)
    }

    const index = this.childNodes.indexOf(before)
    if (index === -1) {
      return this.appendChild(child)
    }

    this.childNodes.splice(index, 0, child)
    child.parentNode = this
    return child
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = String(value)
  }

  removeAttribute(name: string) {
    delete this.attributes[name]
  }

  addEventListener() {}
  removeEventListener() {}

  focus() {
    this.ownerDocument.activeElement = this
  }
}

class FakeElement extends FakeNode {}

class FakeTextNode extends FakeNode {
  nodeValue: string

  constructor(text: string, ownerDocument: FakeDocument) {
    super(3, '#text', ownerDocument)
    this.nodeValue = text
    this.textContent = text
  }
}

class FakeCommentNode extends FakeNode {
  nodeValue: string

  constructor(text: string, ownerDocument: FakeDocument) {
    super(8, '#comment', ownerDocument)
    this.nodeValue = text
    this.textContent = text
  }
}

class FakeDocument extends FakeNode {
  documentElement: FakeElement
  body: FakeElement
  activeElement: FakeNode
  defaultView: typeof globalThis

  constructor() {
    super(9, '#document', undefined as unknown as FakeDocument)
    this.ownerDocument = this
    this.documentElement = new FakeElement(1, 'html', this)
    this.body = new FakeElement(1, 'body', this)
    this.activeElement = this.body
    this.defaultView = globalThis
    this.appendChild(this.documentElement)
    this.documentElement.appendChild(this.body)
  }

  createElement(name: string) {
    return new FakeElement(1, name, this)
  }

  createElementNS(namespaceURI: string, name: string) {
    const node = new FakeElement(1, name, this)
    node.namespaceURI = namespaceURI
    return node
  }

  createTextNode(text: string) {
    return new FakeTextNode(text, this)
  }

  createComment(text: string) {
    return new FakeCommentNode(text, this)
  }
}

function installFakeDom() {
  const document = new FakeDocument()
  const fakeWindow = {
    document,
    navigator: { userAgent: 'node' },
    HTMLElement: FakeElement,
    HTMLIFrameElement: FakeElement,
    Element: FakeElement,
    Node: FakeNode,
  } as unknown as typeof globalThis

  document.defaultView = fakeWindow
  ;(globalThis as Record<string, unknown>).document = document
  ;(globalThis as Record<string, unknown>).window = fakeWindow
  ;(globalThis as Record<string, unknown>).navigator = fakeWindow.navigator
  ;(globalThis as Record<string, unknown>).HTMLElement = FakeElement
  ;(globalThis as Record<string, unknown>).HTMLIFrameElement = FakeElement
  ;(globalThis as Record<string, unknown>).Element = FakeElement
  ;(globalThis as Record<string, unknown>).Node = FakeNode
  ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

  return document
}

function queryByAttribute(root: FakeNode, attributeName: string, value: string): FakeNode | null {
  if (root.attributes?.[attributeName] === value) {
    return root
  }

  for (const child of root.childNodes) {
    const match = queryByAttribute(child, attributeName, value)
    if (match) {
      return match
    }
  }

  return null
}

function queryByNodeName(root: FakeNode, nodeName: string): FakeNode | null {
  if (root.nodeName === nodeName) {
    return root
  }

  for (const child of root.childNodes) {
    const match = queryByNodeName(child, nodeName)
    if (match) {
      return match
    }
  }

  return null
}

function findNode(root: FakeNode, predicate: (node: FakeNode) => boolean): FakeNode | null {
  if (predicate(root)) {
    return root
  }

  for (const child of root.childNodes) {
    const match = findNode(child, predicate)
    if (match) {
      return match
    }
  }

  return null
}

function mount(element: React.ReactElement) {
  const document = installFakeDom()
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOMClient.createRoot(container as never)

  act(() => {
    root.render(element)
  })

  return {
    container,
    unmount() {
      act(() => {
        root.unmount()
      })
    },
  }
}

describe('InteractiveCardTilt controller', () => {
  beforeEach(() => {
    __resetInteractiveCardTiltRegistry()
    __setInteractiveCardTiltControllerObserver(undefined)
    jest.restoreAllMocks()
    gestureConfigCalls.minDistance.length = 0
    gestureConfigCalls.runOnJS.length = 0
  })

  test('forwards onPress and onLongPress', () => {
    const onPress = jest.fn()
    const onLongPress = jest.fn()
    const controller = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
      onPress,
      onLongPress,
    })

    controller.press()
    controller.longPress()

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  test('long press suppresses the tap path that would otherwise follow', () => {
    const onPress = jest.fn()
    const onLongPress = jest.fn()
    const controller = createInteractiveCardTiltController({
      profileName: 'lite',
      regionKey: 'gallery',
      onPress,
      onLongPress,
    })

    controller.longPress()
    controller.press()

    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })

  test('disabled mode prevents press and tilt activation', () => {
    const onPress = jest.fn()
    const controller = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
      disabled: true,
      onPress,
    })

    controller.press()
    const began = controller.beginGesture()
    const state = controller.updateGesture({
      dx: 6,
      dy: 6,
      vx: 0,
      vy: 0,
      x: 180,
      y: 40,
      layout: { width: 200, height: 300 },
    })

    expect(onPress).not.toHaveBeenCalled()
    expect(began).toBe(false)
    expect(state).toEqual(cardTiltMath.getNeutralTiltState())
  })

  test('reduced motion keeps stable no-tilt behavior while preserving presses', () => {
    const onPress = jest.fn()
    const controller = createInteractiveCardTiltController({
      profileName: 'standard',
      regionKey: 'gallery',
      reducedMotion: true,
      onPress,
    })

    controller.press()
    const began = controller.beginGesture()
    const state = controller.updateGesture({
      dx: 4,
      dy: 3,
      vx: 0,
      vy: 0,
      x: 160,
      y: 50,
      layout: { width: 200, height: 300 },
    })

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(began).toBe(false)
    expect(state).toEqual(cardTiltMath.getNeutralTiltState())
  })

  test('beginGesture plus zero drag already produces an off-center pressed sink pose', () => {
    const controller = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })

    expect(controller.beginGesture()).toBe(true)

    const state = controller.updateGesture({
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      x: 160,
      y: 60,
      layout: { width: 200, height: 300 },
    })

    expect(state.rotateX).toBeGreaterThan(0)
    expect(state.rotateY).toBeGreaterThan(0)
    expect(state.pressScale).toBeLessThan(1)
    expect(state.lift).toBeLessThan(0)
  })

  test('non-zero gesture velocity contributes directional tilt before finalize', () => {
    const controller = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })

    expect(controller.beginGesture()).toBe(true)

    const zeroVelocityState = controller.updateGesture({
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      x: 100,
      y: 150,
      layout: { width: 200, height: 300 },
    })

    controller.finalizeGesture()

    expect(controller.beginGesture()).toBe(true)

    const flingState = controller.updateGesture({
      dx: 0,
      dy: 0,
      vx: 900,
      vy: -700,
      x: 100,
      y: 150,
      layout: { width: 200, height: 300 },
    })

    expect(zeroVelocityState.rotateX).toBe(0)
    expect(zeroVelocityState.rotateY).toBe(0)
    expect(zeroVelocityState.translateX).toBe(0)
    expect(zeroVelocityState.translateY).toBe(0)
    expect(flingState.rotateX).toBeGreaterThan(0)
    expect(flingState.rotateY).toBeGreaterThan(0)
    expect(flingState.translateX).toBeGreaterThan(0)
    expect(flingState.translateY).toBeLessThan(0)
  })

  test('uses shouldReleaseToScroll to cancel local tilt when vertical scroll takes over', () => {
    const releaseSpy = jest.spyOn(cardTiltMath, 'shouldReleaseToScroll')
    const controller = createInteractiveCardTiltController({
      profileName: 'standard',
      regionKey: 'gallery',
    })

    expect(controller.beginGesture()).toBe(true)

    const state = controller.updateGesture({
      dx: 7,
      dy: 19,
      vx: 0,
      vy: 0,
      x: 140,
      y: 90,
      layout: { width: 200, height: 300 },
    })

    expect(releaseSpy).toHaveBeenCalledWith({ dx: 7, dy: 19 })
    expect(state).toEqual(cardTiltMath.getNeutralTiltState())
    expect(controller.beginGesture()).toBe(true)
  })

  test('tilt follows accumulated drag delta with stronger drag-follow while the finger is down', () => {
    const controller = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })

    expect(controller.beginGesture()).toBe(true)

    const draggedRight = controller.updateGesture({
      dx: 60,
      dy: 0,
      vx: 0,
      vy: 0,
      x: 170,
      y: 150,
      layout: { width: 200, height: 300 },
    })
    const crossedCenter = controller.updateGesture({
      dx: 20,
      dy: 0,
      vx: 0,
      vy: 0,
      x: 90,
      y: 150,
      layout: { width: 200, height: 300 },
    })

    expect(draggedRight.rotateY).toBeGreaterThan(0)
    expect(draggedRight.translateX).toBeGreaterThan(15)
    expect(crossedCenter.rotateY).toBeGreaterThan(0)
    expect(crossedCenter.rotateY).toBeLessThan(draggedRight.rotateY)
    expect(crossedCenter.translateX).toBeGreaterThan(6)
    expect(crossedCenter.translateX).toBeLessThan(draggedRight.translateX)
  })

  test('finalizeGesture restores the full richer neutral pose after active drag', () => {
    const controller = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })

    expect(controller.beginGesture()).toBe(true)

    const activeState = controller.updateGesture({
      dx: 48,
      dy: -36,
      vx: 0,
      vy: 0,
      x: 148,
      y: 114,
      layout: { width: 200, height: 300 },
    })
    const finalizedState = controller.finalizeGesture()

    expect(activeState).not.toEqual(cardTiltMath.getNeutralTiltState())
    expect(activeState.pressScale).toBeLessThan(1)
    expect(activeState.lift).toBeLessThan(0)
    expect(finalizedState).toEqual({
      rotateX: 0,
      rotateY: 0,
      translateX: 0,
      translateY: 0,
      scale: 1,
      pressScale: 1,
      lift: 0,
      shadowShiftX: 0,
      shadowShiftY: 0,
      shadowOpacity: 0,
      highlightOpacity: 0,
    })
  })

  test('mounted long-press suppression survives finalize until the release press event is consumed', () => {
    const onPress = jest.fn()
    const onLongPress = jest.fn()
    let mountedController: ReturnType<typeof createInteractiveCardTiltController> | undefined
    __setInteractiveCardTiltControllerObserver(
      (controller: ReturnType<typeof createInteractiveCardTiltController> | undefined) => {
        mountedController = controller
      },
    )
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          regionKey: 'gallery',
          onPress,
          onLongPress,
          testID: 'long-press-release-surface',
        },
        React.createElement(MockView, null),
      ),
    )

    expect(mountedController).toBeDefined()

    mountedController?.longPress()
    mountedController?.finalizeGesture()
    mountedController?.press()

    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()

    rendered.unmount()
  })

  test('keeps one active card per region until finalize releases ownership', () => {
    const first = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })
    const second = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })

    expect(first.beginGesture()).toBe(true)
    expect(second.beginGesture()).toBe(false)

    first.finalizeGesture()

    expect(second.beginGesture()).toBe(true)
  })

  test('dispose clears active ownership on unmount semantics', () => {
    const first = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })
    const second = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })

    expect(first.beginGesture()).toBe(true)

    first.dispose()

    expect(second.beginGesture()).toBe(true)
  })

  test('DixitCard is non-interactive by default and only uses internal touch when opted in', () => {
    const passive = DixitCard({ label: 'Moon horse', uri: 'https://example.com/card.png' })
    const interactive = DixitCard({
      label: 'Moon horse',
      uri: 'https://example.com/card.png',
      interactive: true,
      onPress: jest.fn(),
    })

    expect((passive.type as { displayName?: string }).displayName).toBe('View')
    expect((interactive.type as { displayName?: string }).displayName).toBe('TouchableOpacity')
  })

  test('renders the interactive surface with the provided testID', () => {
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          testID: 'tilt-surface',
          reducedMotion: true,
        },
        React.createElement(MockView, null),
      ),
    )

    expect(queryByAttribute(rendered.container, 'testid', 'tilt-surface')).not.toBeNull()
    expect(queryByNodeName(rendered.container, 'pressable')).toBeNull()
    expect(queryByNodeName(rendered.container, 'view')).not.toBeNull()

    rendered.unmount()
  })

  test('gesture pipeline keeps immediate activation without forcing frame updates onto JS', () => {
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          testID: 'gesture-surface',
        },
        React.createElement(MockView, null),
      ),
    )

    expect(gestureConfigCalls.minDistance).toContain(0)
    expect(gestureConfigCalls.runOnJS).toEqual([])

    rendered.unmount()
  })

  test('polish clip frame inherits radius from the immediate child surface style', () => {
    const styles = StyleSheet.create({
      wrapper: {
        width: '100%',
        aspectRatio: 2 / 3,
      },
      surfaceBase: {
        backgroundColor: '#111111',
      },
      surfaceRounded: {
        borderRadius: 26,
        overflow: 'hidden',
      },
    })
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          style: styles.wrapper,
          testID: 'clip-surface',
        },
        React.createElement(MockView, {
          style: [styles.surfaceBase, styles.surfaceRounded],
          testID: 'clip-card-surface',
        }),
      ),
    )
    const clipFrame = findNode(
      rendered.container,
      (node) =>
        node.nodeName === 'view' &&
        node.style.position === 'absolute' &&
        node.style.overflow === 'hidden' &&
        parseFloat(node.style.borderRadius ?? '0') === 26,
    )

    expect(queryByAttribute(rendered.container, 'testid', 'clip-card-surface')).not.toBeNull()
    expect(clipFrame).not.toBeNull()

    rendered.unmount()
  })

  test('polish clip frame inherits radius from a nested gallery card surface', () => {
    const styles = StyleSheet.create({
      wrapper: {
        width: '47%',
      },
      stack: {
        width: '100%',
      },
      cardSurface: {
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#111111',
      },
    })
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          style: styles.wrapper,
          testID: 'nested-clip-surface',
        },
        React.createElement(
          MockView,
          { style: styles.stack },
          React.createElement(MockView, {
            style: styles.cardSurface,
            testID: 'nested-card-surface',
          }),
        ),
      ),
    )
    const clipFrame = findNode(
      rendered.container,
      (node) =>
        node.nodeName === 'view' &&
        node.style.position === 'absolute' &&
        node.style.overflow === 'hidden' &&
        parseFloat(node.style.borderRadius ?? '0') === 22,
    )

    expect(queryByAttribute(rendered.container, 'testid', 'nested-card-surface')).not.toBeNull()
    expect(clipFrame).not.toBeNull()

    rendered.unmount()
  })

  test('web wrapper isolates frame sizing from the interactive surface', () => {
    const styles = StyleSheet.create({
      wrapper: {
        width: '47%',
        aspectRatio: 2 / 3,
      },
    })
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          onPress: jest.fn(),
          style: styles.wrapper,
          testID: 'web-layout-surface',
        },
        React.createElement(MockView, null),
      ),
    )

    const surface = queryByAttribute(rendered.container, 'testid', 'web-layout-surface')

    expect(surface).not.toBeNull()
    expect(surface?.style.width).toBe('100%')

    rendered.unmount()
  })

  test('web animated surface keeps the reanimated style separate from static style merging', () => {
    expect(interactiveCardTiltSource).toContain('? [webContentStyle, webSurfaceFrameStyle, animatedStyle]')
    expect(interactiveCardTiltSource).not.toContain('Object.assign({}, webContentStyle, animatedStyle as any)')
  })

  test('animated worklet does not call flattenStyleSafe directly inside useAnimatedStyle', () => {
    expect(interactiveCardTiltSource).not.toContain(
      "zIndex: gestureActive.value ? 999 : (flattenStyleSafe<ViewStyle>(style, StyleSheet)?.zIndex ?? 1)",
    )
  })

  test('gesture worklet does not call the JS controller methods directly', () => {
    expect(interactiveCardTiltSource).not.toContain('controller.beginGesture()')
    expect(interactiveCardTiltSource).not.toContain('controller.updateGesture(')
    expect(interactiveCardTiltSource).not.toContain('controller.finalizeGesture()')
  })

  test('web surface keeps concrete height when frame sizing is fixed', () => {
    const styles = StyleSheet.create({
      wrapper: {
        width: 280,
        height: 420,
      },
    })
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          onPress: jest.fn(),
          style: styles.wrapper,
          testID: 'web-fixed-surface',
        },
        React.createElement(MockView, null),
      ),
    )

    const surface = queryByAttribute(rendered.container, 'testid', 'web-fixed-surface')

    expect(surface).not.toBeNull()
    expect(parseFloat(surface?.style.height ?? '0')).toBe(420)

    rendered.unmount()
  })

  test('web surface keeps aspect ratio when frame sizing relies on ratio-based height', () => {
    const styles = StyleSheet.create({
      wrapper: {
        width: '31%',
        aspectRatio: 2 / 3,
      },
    })
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          onPress: jest.fn(),
          style: styles.wrapper,
          testID: 'web-ratio-surface',
        },
        React.createElement(MockView, null),
      ),
    )

    const surface = queryByAttribute(rendered.container, 'testid', 'web-ratio-surface')

    expect(surface).not.toBeNull()
    expect(surface?.style.width).toBe('100%')
    expect(parseFloat(surface?.style.aspectRatio ?? '0')).toBeCloseTo(2 / 3)

    rendered.unmount()
  })

  test('composite wrapper skips polish overlay projection across sibling labels', () => {
    const styles = StyleSheet.create({
      wrapper: {
        width: '47%',
        gap: 8,
      },
      stack: {
        width: '100%',
      },
      cardSurface: {
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#111111',
      },
      label: {
        color: '#dddddd',
      },
    })
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          style: styles.wrapper,
          testID: 'composite-clip-surface',
        },
        React.createElement(
          MockView,
          { style: styles.stack },
          React.createElement(MockView, {
            style: styles.cardSurface,
            testID: 'composite-card-surface',
          }),
          React.createElement(MockText, { style: styles.label }, 'Gallery card'),
        ),
      ),
    )
    const clipFrame = findNode(
      rendered.container,
      (node) =>
        node.nodeName === 'view' &&
        node.style.position === 'absolute' &&
        node.style.overflow === 'hidden' &&
        parseFloat(node.style.borderRadius ?? '0') === 22,
    )

    expect(queryByAttribute(rendered.container, 'testid', 'composite-card-surface')).not.toBeNull()
    expect(clipFrame).toBeNull()

    rendered.unmount()
  })

  test('real mount and unmount release active region ownership through cleanup', () => {
    let mountedController: ReturnType<typeof createInteractiveCardTiltController> | undefined
    __setInteractiveCardTiltControllerObserver((controller: ReturnType<typeof createInteractiveCardTiltController> | undefined) => {
      mountedController = controller
    })
    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          regionKey: 'gallery',
          testID: 'cleanup-surface',
        },
        React.createElement(MockView, null),
      ),
    )

    expect(mountedController?.beginGesture()).toBe(true)

    rendered.unmount()

    const nextController = createInteractiveCardTiltController({
      profileName: 'hero',
      regionKey: 'gallery',
    })

    expect(nextController.beginGesture()).toBe(true)
  })

  test('test observer path is inert outside test environments', () => {
    const originalNodeEnv = process.env.NODE_ENV
    const observer = jest.fn()
    process.env.NODE_ENV = 'production'
    __setInteractiveCardTiltControllerObserver(observer)

    const rendered = mount(
      React.createElement(
        InteractiveCardTilt as unknown as React.ComponentType<Record<string, unknown>>,
        {
          regionKey: 'gallery',
          testID: 'observer-surface',
          reducedMotion: true,
        },
        React.createElement(MockView, null),
      ),
    )

    rendered.unmount()
    process.env.NODE_ENV = originalNodeEnv

    expect(observer).not.toHaveBeenCalled()
  })

  test('renders DixitCard loading placeholder branch with the theme-backed placeholder surface', () => {
    const rendered = mount(
      React.createElement(DixitCard, {
        loading: true,
        label: 'Loading card',
        testID: 'loading-card',
      }),
    )

    expect(queryByAttribute(rendered.container, 'testid', 'loading-card')).not.toBeNull()
    expect(queryByNodeName(rendered.container, 'activityindicator')).not.toBeNull()

    rendered.unmount()
  })
})
