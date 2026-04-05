import { useEffect, useRef, useState } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, CinzelDecorative_400Regular, CinzelDecorative_700Bold, CinzelDecorative_900Black } from '@expo-google-fonts/cinzel-decorative'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '@/lib/supabase'
import { ToastContainer } from '@/components/ui/Toast'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { attachUnhandledStealRejectionListener } from '@/lib/unhandledRejectionListener'
import '@/i18n'

// Keep splash screen visible while loading fonts/auth
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const segmentsRef = useRef(segments)
  const [isReady, setIsReady] = useState(false)

  const [fontsLoaded] = useFonts({
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold,
    CinzelDecorative_900Black,
  })

  useEffect(() => {
    return attachUnhandledStealRejectionListener()
  }, [])

  // Keep ref in sync so the auth callback always reads current segments
  useEffect(() => {
    segmentsRef.current = segments
  }, [segments])

  useEffect(() => {
    // Initial sesión check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const inAuth = segmentsRef.current[0] === '(auth)'
      if (!session && !inAuth) router.replace('/(auth)/welcome')
      if (session && inAuth) router.replace('/(tabs)')
      
      if (fontsLoaded) setIsReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuth = segmentsRef.current[0] === '(auth)'
      if (!session && !inAuth) router.replace('/(auth)/welcome')
      if (session && inAuth) router.replace('/(tabs)')
      
      if (fontsLoaded) setIsReady(true)
    })
    return () => subscription.unsubscribe()
  }, [fontsLoaded])

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
    }
  }, [isReady])

  if (!isReady) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Slot />
        <ToastContainer />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
