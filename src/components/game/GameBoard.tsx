import { View, StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import { colors, radii } from '@/constants/theme'

interface Props {
  /** HUD and economy badges — fixed at top */
  topBar?: ReactNode
  /** Main content zone (clue, cards, results) — grows to fill */
  center: ReactNode
  /** Action buttons / tactical picker — fixed above hand */
  actionBar?: ReactNode
  /** Fan hand or similar bottom zone — fixed height */
  bottomZone?: ReactNode
}

export function GameBoard({ topBar, center, actionBar, bottomZone }: Props) {
  return (
    <View style={styles.board}>
      {/* Top bar zone */}
      {topBar && <View style={styles.topZone}>{topBar}</View>}

      {/* Board center — flex: 1, scrollable content goes inside */}
      <View style={styles.centerZone}>{center}</View>

      {/* Action bar — fixed */}
      {actionBar && <View style={styles.actionZone}>{actionBar}</View>}

      {/* Bottom zone (fan hand) — fixed height */}
      {bottomZone && <View style={styles.bottomZone}>{bottomZone}</View>}

      {/* Board edge decoration */}
      <View style={styles.edgeLine} pointerEvents="none" />
    </View>
  )
}

const styles = StyleSheet.create({
  board: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topZone: {
    paddingTop: 4,
    zIndex: 10,
  },
  centerZone: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionZone: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
  },
  bottomZone: {
    overflow: 'visible',
    zIndex: 5,
  },
  edgeLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(230, 184, 0, 0.08)',
  },
})
