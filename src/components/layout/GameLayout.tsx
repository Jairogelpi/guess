import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { ReactNode } from 'react'
import { Background } from '@/components/layout/Background'

export function GameLayout({ children }: { children: ReactNode }) {
  return (
    <Background>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {children}
      </SafeAreaView>
    </Background>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
})
