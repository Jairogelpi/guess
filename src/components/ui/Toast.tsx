import { useEffect, useRef } from 'react'
import { Animated, Text, View, StyleSheet } from 'react-native'
import { useUIStore } from '@/stores/useUIStore'
import { colors } from '@/constants/theme'

const typeBg: Record<string, string> = {
  info: colors.surfaceMid,
  success: 'rgba(21, 128, 61, 0.9)',
  error: 'rgba(185, 28, 28, 0.9)',
}

function ToastItem({ id, message, type }: { id: string; message: string; type: 'info' | 'error' | 'success' }) {
  const opacity = useRef(new Animated.Value(0)).current
  const dismissToast = useUIStore((s) => s.dismissToast)

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => dismissToast(id))
  }, [])

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity, backgroundColor: typeBg[type] ?? typeBg.info },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  return (
    <View style={styles.container} pointerEvents="none">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 50,
  },
  toast: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  text: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
})
