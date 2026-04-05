import { Pressable, StyleSheet, Text, View } from 'react-native'
import { fonts, radii } from '@/constants/theme'

const PLAYER_COUNTS = [3, 4, 5, 6] as const

type Props = {
  onChange: (value: number) => void
  value: number
}

export function PlayerCountPreferencePicker({ onChange, value }: Props) {
  return (
    <View style={styles.wrap}>
      {PLAYER_COUNTS.map((count) => (
        <Pressable
          key={count}
          onPress={() => onChange(count)}
          style={[styles.option, value === count && styles.optionActive]}
          testID={`quick-match-player-count-${count}`}
        >
          <Text style={[styles.optionText, value === count && styles.optionTextActive]}>{count}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  option: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(205, 167, 125, 0.35)',
    backgroundColor: 'rgba(22, 10, 4, 0.72)',
  },
  optionActive: {
    borderColor: 'rgba(233, 191, 137, 0.82)',
    backgroundColor: 'rgba(79, 45, 20, 0.86)',
  },
  optionText: {
    color: '#efd8b8',
    fontFamily: fonts.titleHeavy,
    fontSize: 18,
    letterSpacing: 1,
  },
  optionTextActive: {
    color: '#fff5e6',
  },
})
