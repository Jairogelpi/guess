import { StyleSheet, View } from 'react-native'
import type { ReactNode } from 'react'
import { Background } from '@/components/layout/Background'

export function GameLayout({ children }: { children: ReactNode }) {
  return (
    <Background>
      <View style={styles.safe}>
        {children}
      </View>
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
})
