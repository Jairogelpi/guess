import React from 'react'

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: (initial: unknown) => [initial, jest.fn()],
  useRef: (initial: unknown) => ({ current: initial }),
  useEffect: jest.fn(),
}))

jest.mock('react-native', () => ({
  ScrollView: 'ScrollView',
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Pressable: 'Pressable',
  Modal: 'Modal',
  StyleSheet: { create: <T,>(styles: T) => styles },
  Animated: {
    Value: class { constructor(_v: number) {} },
    Text: 'Animated.Text',
    View: 'Animated.View',
    timing: () => ({ start: jest.fn() }),
    loop: () => ({ start: jest.fn() }),
    sequence: (arr: unknown[]) => arr,
  },
}))

jest.mock('@/components/ui/Avatar', () => ({
  Avatar: ({ name }: { name: string }) => React.createElement('Avatar', { name }),
}), { virtual: true })

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}), { virtual: true })

jest.mock('@/components/game/ScoreBoard', () => ({
  ScoreBoard: () => React.createElement('ScoreBoard', null),
}), { virtual: true })

const { LiveStandingsStrip } = require('../src/components/game/LiveStandingsStrip') as typeof import('../src/components/game/LiveStandingsStrip')

function collectText(node: unknown): string[] {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(collectText)
  if (!node || typeof node !== 'object') return []
  const props = (node as { props?: { children?: unknown } }).props
  const children = props?.children
  return Array.isArray(children)
    ? children.flatMap(collectText)
    : collectText(children)
}

function findByTestId(node: unknown, testID: string): { props?: Record<string, unknown> } | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findByTestId(child, testID)
      if (match) return match
    }
    return null
  }

  if (!node || typeof node !== 'object') return null

  const element = node as { props?: Record<string, unknown> }
  if (element.props?.testID === testID) {
    return element
  }

  return findByTestId(element.props?.children, testID)
}

test('renders score and visible position for each player', () => {
  const tree = LiveStandingsStrip({
    players: [
      { player_id: 'p1', display_name: 'Ana', score: 18, profiles: null } as any,
      { player_id: 'p2', display_name: 'Bea', score: 14, profiles: null } as any,
    ],
    currentUserId: 'p2',
  })

  const text = collectText(tree)

  expect(text).toEqual(expect.arrayContaining(['#1', '18', '#2', '14']))
})

test('marks the current user pill as selected for UI highlighting', () => {
  const tree = LiveStandingsStrip({
    players: [
      { player_id: 'p1', display_name: 'Ana', score: 18, profiles: null } as any,
      { player_id: 'p2', display_name: 'Bea', score: 14, profiles: null } as any,
    ],
    currentUserId: 'p2',
  })

  const currentUserPill = findByTestId(tree, 'standings-pill-p2')

  expect(currentUserPill?.props?.accessibilityState).toEqual({ selected: true })
})
