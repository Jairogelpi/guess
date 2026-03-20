import { ImageBackground, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { brandColors } from '@/constants/brand'

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
      <View style={styles.topVeil} />
      <LinearGradient
        colors={[brandColors.backdropTop, brandColors.backdropMiddle, brandColors.backdropBottom]}
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
  topVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 9, 4, 0.16)',
  },
})
