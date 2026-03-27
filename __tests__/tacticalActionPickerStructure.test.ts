import React from 'react'

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return {
    ...actual,
    useMemo: <T,>(factory: () => T) => factory(),
    useState: <T,>(initial: T) => [initial, jest.fn()],
  }
})

jest.mock('react-native', () => ({
  Pressable: 'Pressable',
  Text: 'Text',
  View: 'View',
  StyleSheet: { create: <T,>(styles: T) => styles },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; name?: string }) => {
      if (key === 'game.tactics.intuitionTokens') {
        return `Tokens ${options?.count ?? 0}`
      }

      if (key === 'game.tactics.selectedAction') {
        return `Selected action: ${options?.name ?? ''}`
      }

      const translations: Record<string, string> = {
        'game.tactics.eyebrow': 'Tactics',
        'game.tactics.title': 'Tactical Actions',
        'game.tactics.notes.selectionRequired': 'Selection required',
        'game.tactics.challengeLeader.name': 'Challenge the Leader',
        'game.tactics.actions.risk_normal.name': 'Balanced risk',
        'game.tactics.actions.risk_sniper.name': 'Sniper risk',
        'game.tactics.actions.risk_narrow.name': 'Narrow risk',
        'game.tactics.actions.risk_ambush.name': 'Ambush risk',
        'game.tactics.actions.bet_1.name': 'Bet 1',
        'game.tactics.actions.bet_2.name': 'Bet 2',
        'game.tactics.clearSelection': 'Clear',
      }

      return translations[key] ?? key
    },
  }),
}))

jest.mock(
  '@expo/vector-icons',
  () => ({
    MaterialCommunityIcons: ({ name }: { name: string }) => React.createElement('Icon', { name }),
  }),
  { virtual: true },
)

jest.mock(
  '@/components/ui/Button',
  () => ({
    Button: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('Button', props, children),
  }),
  { virtual: true },
)

jest.mock(
  '@/components/game/TacticalActionSheet',
  () => ({
    TacticalActionSheet: (props: Record<string, unknown>) =>
      React.createElement('TacticalActionSheet', props),
  }),
  { virtual: true },
)

jest.mock(
  '@/lib/tacticalActions',
  () => jest.requireActual('../src/lib/tacticalActions'),
  { virtual: true },
)

jest.mock(
  '@/constants/theme',
  () => jest.requireActual('../src/constants/theme'),
  { virtual: true },
)

const { TacticalActionPicker } =
  require('../src/components/game/TacticalActionPicker') as typeof import('../src/components/game/TacticalActionPicker')

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

function findAllByTestId(node: unknown, testID: string): Array<{ props?: Record<string, unknown> }> {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findAllByTestId(child, testID))
  }

  if (!node || typeof node !== 'object') return []

  const element = node as { props?: Record<string, unknown> }
  const matches = element.props?.testID === testID ? [element] : []
  return matches.concat(findAllByTestId(element.props?.children, testID))
}

function findByTestId(node: unknown, testID: string) {
  return findAllByTestId(node, testID)[0] ?? null
}

function renderPicker(props: Partial<React.ComponentProps<typeof TacticalActionPicker>> = {}) {
  return TacticalActionPicker({
    phase: 'voting',
    selectionActive: true,
    intuitionTokens: 2,
    isPhaseOwner: true,
    playerId: 'p2',
    players: [
      { player_id: 'p1', score: 12 },
      { player_id: 'p2', score: 9 },
    ],
    challengeLeaderUsed: false,
    corruptedCardsRemaining: 2,
    selectedAction: null,
    selectedChallengeLeader: false,
    onSelectAction: jest.fn(),
    onSelectChallengeLeader: jest.fn(),
    ...props,
  })
}

test('renders exactly one helper line for a blocked state', () => {
  const tree = renderPicker({
    phase: 'narrator_turn',
    selectionActive: false,
    intuitionTokens: 0,
    isPhaseOwner: false,
  })

  const helperRows = findAllByTestId(tree, 'tactical-helper-row')

  expect(helperRows).toHaveLength(1)
  expect(collectText(helperRows[0])).toContain('Selection required')
})

test('keeps the selected action summary visible when an action is chosen', () => {
  const tree = renderPicker({
    selectedAction: 'bet_1',
  })

  const summary = findByTestId(tree, 'tactical-selection-summary')

  expect(summary).not.toBeNull()
  expect(collectText(summary)).toContain('Selected action: Bet 1')
})
