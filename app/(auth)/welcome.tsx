import { useEffect, useRef, useState } from 'react'
import { View, Text, Image, Dimensions, StyleSheet, Pressable, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Background } from '@/components/layout/Background'
import { useUIStore } from '@/stores/useUIStore'
import { Button } from '@/components/ui/Button'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = Math.min(SCREEN_W * 0.96, 430) // Optimized for "perfect fit"
const CARD_H = CARD_W * 1.5 

/** Ultimate Welcome Screen: All buttons inside the card, massive typography, premium animations. */
export default function Welcome() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const [loading, setLoading] = useState(false)

  // Animations
  const breatheAnim = useRef(new Animated.Value(1)).current
  const riseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.015, duration: 3200, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 3200, useNativeDriver: true }),
      ])
    ).start()

    Animated.spring(riseAnim, {
      toValue: 1,
      tension: 12,
      friction: 9,
      useNativeDriver: true,
    }).start()
  }, [])

  const currentLang = i18n.language.split('-')[0]?.toUpperCase() || 'ES'

  async function enterAsGuest() {
    if (loading) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.error('Guest login error:', error)
        if (error.message.includes('Database error')) {
          showToast('Database Error: Check Supabase dashboard SQL editor (Trigger handle_new_user failing).', 'error')
        } else {
          showToast(error.message, 'error')
        }
      }
    } catch (e) {
      console.error('Guest login exception:', e)
      showToast(t('errors.generic'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const animatedStyle = {
    transform: [
      { translateY: riseAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
      { scale: breatheAnim },
    ],
    opacity: riseAnim,
  }

  return (
    <Background>
      <View style={styles.overlayRoot}>
        {/* Header Controls — Pure text version as requested */}
        <SafeAreaView edges={['top']} style={styles.headerControls}>
          <Text style={styles.versionText}>v1.0.0</Text>
          
          <View style={styles.headerRight}>
            <View style={styles.langPill}>
              <Text style={styles.langText}>{currentLang}</Text>
            </View>
          </View>
        </SafeAreaView>

        <View style={styles.container}>
          <Animated.View style={[styles.mainCard, animatedStyle]}>
            <Image
              source={require('../../assets/carta.png')}
              style={styles.cardImage}
              resizeMode="cover"
            />
            
            <LinearGradient
              colors={['transparent', 'rgba(18, 10, 6, 0.1)', 'rgba(18, 10, 6, 0.95)']}
              style={styles.cardOverlay}
            >
              <View style={styles.cardContent}>
                {/* MAGICAL TITLE — Fitted perfectly */}
                <View style={styles.titleGroup}>
                  <Text style={styles.brandTitle} adjustsFontSizeToFit numberOfLines={1}>GUESS THE</Text>
                  <Text style={[styles.brandTitle, styles.brandTitleHighlight]} adjustsFontSizeToFit numberOfLines={1}>PRONT</Text>
                </View>

                <View style={styles.divider} />
                <Text style={styles.subtitle} adjustsFontSizeToFit numberOfLines={2}>
                  {t('welcome.subtitle')}
                </Text>
              </View>

              {/* ALL AUTH BUTTONS CONSOLIDATED INSIDE THE CARD */}
              <View style={styles.cardFooter}>
                <Button 
                  onPress={enterAsGuest} 
                  loading={loading}
                  style={styles.guestBtn}
                  textStyle={styles.guestBtnText}
                >
                  {t('welcome.enterAsGuest').toUpperCase()}
                </Button>

                <View style={styles.secondaryActions}>
                  <Button 
                    variant="ghost"
                    style={styles.smallActionBtn}
                    textStyle={styles.secondaryBtnText}
                    onPress={() => router.push('/(auth)/login')}
                  >
                    {t('welcome.signIn')}
                  </Button>
                  <View style={styles.actionPipe} />
                  <Button 
                    variant="ghost"
                    style={styles.smallActionBtn}
                    textStyle={styles.secondaryBtnText}
                    onPress={() => router.push('/(auth)/login')}
                  >
                    {t('profile.upgradeAccount')}
                  </Button>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
          <Text style={styles.footerText}>GUESS THE PRONT 2026</Text>
        </SafeAreaView>
      </View>
    </Background>
  )
}

const styles = StyleSheet.create({
  overlayRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginTop: 10,
    zIndex: 100,
  },
  versionText: {
    color: '#e6b800',
    fontSize: 12,
    fontFamily: 'CinzelDecorative_700Bold',
    letterSpacing: 2,
    opacity: 0.9,
  },
  headerRight: { flexDirection: 'row', gap: 12 },
  langPill: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: 36,
  },
  langText: { color: '#fff', fontSize: 11, fontFamily: 'CinzelDecorative_700Bold' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#120a06', // FALLBACK ONLY
    borderWidth: 3,
    borderColor: '#e6b800', 
    shadowColor: '#e6b800',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 35,
    elevation: 30,
  },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 30, paddingVertical: 50, justifyContent: 'space-between' },
  cardContent: { alignItems: 'center', width: '100%' },
  titleGroup: { alignItems: 'center', width: '100%', marginTop: 10 },
  brandTitle: {
    fontFamily: 'CinzelDecorative_900Black',
    color: '#fff',
    fontSize: 56,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 10,
    width: '100%',
  },
  brandTitleHighlight: {
    fontSize: 78,
    marginTop: -10,
    textShadowColor: '#e6b800',
    textShadowRadius: 30,
  },
  divider: { width: 90, height: 2.5, backgroundColor: '#e6b800', marginVertical: 30, opacity: 1 },
  subtitle: {
    fontFamily: 'CinzelDecorative_400Regular',
    color: '#fff',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 32,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowRadius: 6,
    width: '100%',
  },
  cardFooter: { alignItems: 'center', width: '100%', gap: 20 },
  guestBtn: {
    width: '100%',
    height: 66,
    backgroundColor: '#ea580c',
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'rgba(255, 230, 180, 0.7)',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  guestBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: '#fff',
    fontSize: 20,
    letterSpacing: 2.5,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  smallActionBtn: {
    paddingHorizontal: 12,
    height: 44,
  },
  secondaryBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: '#fff',
    fontSize: 14,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowRadius: 4,
  },
  actionPipe: {
    width: 2,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  footerContainer: { alignItems: 'center', paddingBottom: 25 },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'CinzelDecorative_400Regular',
    letterSpacing: 3,
  },
})
