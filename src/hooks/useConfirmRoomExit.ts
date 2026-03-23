import { useEffect } from 'react'
import { Alert, Platform } from 'react-native'
import { useNavigation } from 'expo-router'
import { buildLeaveRoomConfirmCopy } from '@/lib/leaveRoomConfirm'

interface UseConfirmRoomExitOptions {
  enabled: boolean
  t: (key: string) => string
  onConfirmExit: () => void | Promise<void>
}

export function useConfirmRoomExit({
  enabled,
  t,
  onConfirmExit,
}: UseConfirmRoomExitOptions) {
  const navigation = useNavigation()

  useEffect(() => {
    if (!enabled) return

    const showConfirm = () => {
      const copy = buildLeaveRoomConfirmCopy(t)

      Alert.alert(copy.title, copy.message, [
        { text: copy.cancelLabel, style: 'cancel' },
        {
          text: copy.confirmLabel,
          style: 'destructive',
          onPress: () => {
            void Promise.resolve(onConfirmExit())
          },
        },
      ])
    }

    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (event) => {
      event.preventDefault()
      showConfirm()
    })

    const unsubscribeWeb = (() => {
      if (Platform.OS !== 'web') return () => {}

      const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault()
        event.returnValue = ''
      }

      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    })()

    return () => {
      unsubscribeBeforeRemove()
      unsubscribeWeb()
    }
  }, [enabled, navigation, onConfirmExit, t])
}
