import { ImageBackground, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'

interface BackgroundProps {
  children: ReactNode
}

export function Background({ children }: BackgroundProps) {
  return (
    <ImageBackground
      source={require('../../../assets/fondo.png')}
      style={styles.image}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(18,10,6,0.72)', 'rgba(10,6,2,0.88)', 'rgba(18,10,6,0.96)']}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        {children}
      </LinearGradient>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  image: { flex: 1 },
  gradient: { flex: 1 },
})
