import { useEffect, useRef, useState } from 'react'
import { View, Text, Image, Dimensions, StyleSheet, Animated } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/layout/AppHeader'
import { Background } from '@/components/layout/Background'
import { useUIStore } from '@/stores/useUIStore'
import { Button } from '@/components/ui/Button'
import {
  WELCOME_HERO_CARD_BACKGROUND,
  WELCOME_HERO_CARD_MAX_WIDTH,
  WELCOME_HERO_CARD_RATIO,
  WELCOME_HERO_CARD_SHADOW_OPACITY,
  WELCOME_HERO_CARD_SHADOW_RADIUS,
  WELCOME_HERO_CARD_WIDTH_FACTOR,
  WELCOME_HERO_CTA_HEIGHT,
  WELCOME_HERO_CTA_SHADOW_OPACITY,
  WELCOME_HERO_CTA_WIDTH_FACTOR,
  WELCOME_HERO_FOOTER_GAP,
  WELCOME_HERO_FOOTER_MARGIN_TOP,
  WELCOME_GUEST_CTA_FONT_SIZE,
  WELCOME_HERO_IMAGE_BLUR_RADIUS,
  WELCOME_HERO_IMAGE_SCALE,
  WELCOME_HERO_OVERLAY_JUSTIFY_CONTENT,
  WELCOME_HERO_OVERLAY_COLORS,
  WELCOME_HERO_SECONDARY_ACTION_GAP,
  WELCOME_HERO_SECONDARY_CTA_HEIGHT,
  WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP,
  WELCOME_HERO_SHOW_LOGO,
  WELCOME_HERO_STACK_GAP,
} from '@/constants/welcomeHero'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = Math.min(SCREEN_W * WELCOME_HERO_CARD_WIDTH_FACTOR, WELCOME_HERO_CARD_MAX_WIDTH)
const CARD_H = CARD_W * WELCOME_HERO_CARD_RATIO

export default function Welcome() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const [loading, setLoading] = useState(false)

  const breatheAnim = useRef(new Animated.Value(1)).current
  const riseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.015, duration: 3200, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 3200, useNativeDriver: true }),
      ]),
    ).start()

    Animated.spring(riseAnim, {
      toValue: 1,
      tension: 12,
      friction: 9,
      useNativeDriver: true,
    }).start()
  }, [breatheAnim, riseAnim])

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
    } catch (error) {
      console.error('Guest login exception:', error)
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
        <AppHeader />

        <View style={styles.container}>
          <Animated.View style={[styles.mainCard, animatedStyle]}>
            <Image
              source={require('../../assets/carta.png')}
              style={styles.cardImage}
              resizeMode="cover"
              blurRadius={WELCOME_HERO_IMAGE_BLUR_RADIUS}
            />

            <LinearGradient
              colors={WELCOME_HERO_OVERLAY_COLORS}
              style={styles.cardOverlay}
            >
              <View style={styles.cardColumn}>
                <View style={styles.cardContent}>
                  <View style={styles.titleGroup}>
                    {WELCOME_HERO_SHOW_LOGO && (
                      <Image
                        source={require('../../assets/logo.png')}
                        style={styles.heroLogo}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={styles.brandTitle} adjustsFontSizeToFit numberOfLines={1}>
                      GUESS THE
                    </Text>
                    <Text
                      style={[styles.brandTitle, styles.brandTitleHighlight]}
                      adjustsFontSizeToFit
                      numberOfLines={1}
                    >
                      PROMPT
                    </Text>
                  </View>

                  <View style={styles.divider} />
                  <Text style={styles.subtitle} adjustsFontSizeToFit numberOfLines={2}>
                    {t('welcome.subtitle')}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Button
                    onPress={enterAsGuest}
                    loading={loading}
                    style={styles.guestBtn}
                    textStyle={styles.guestBtnText}
                  >
                    {t('welcome.enterAsGuest').toUpperCase()}
                  </Button>
                  <Text style={styles.hintText}>{t('welcome.guestHint')}</Text>

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
                      style={[styles.smallActionBtn, styles.registerBtn]}
                      textStyle={styles.registerBtnText}
                      onPress={() => router.push('/(auth)/login')}
                    >
                      {t('profile.upgradeAccount')}
                    </Button>
                  </View>
                  <Text style={styles.accountHintText}>{t('welcome.accountHint')}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
          <Text style={styles.footerText}>GUESS THE PROMPT 2026</Text>
        </SafeAreaView>
      </View>
    </Background>
  )
}

const styles = StyleSheet.create({
  overlayRoot: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  mainCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: WELCOME_HERO_CARD_BACKGROUND,
    shadowColor: '#e6b800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: WELCOME_HERO_CARD_SHADOW_OPACITY,
    shadowRadius: WELCOME_HERO_CARD_SHADOW_RADIUS,
    elevation: 0,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    transform: [{ scale: WELCOME_HERO_IMAGE_SCALE }],
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: WELCOME_HERO_OVERLAY_JUSTIFY_CONTENT,
  },
  cardColumn: {
    width: '100%',
    alignItems: 'center',
    gap: WELCOME_HERO_STACK_GAP,
  },
  cardContent: {
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  titleGroup: {
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  heroLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 4,
  },
  brandTitle: {
    fontFamily: 'CinzelDecorative_900Black',
    color: '#fff7ea',
    fontSize: 40,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.8,
    width: '100%',
  },
  brandTitleHighlight: {
    fontSize: 52,
    marginTop: -6,
    textShadowColor: 'rgba(230,184,0,0.45)',
    textShadowRadius: 14,
  },
  divider: {
    width: 68,
    height: 2,
    backgroundColor: '#e6b800',
    marginVertical: 6,
    opacity: 0.7,
  },
  subtitle: {
    fontFamily: 'CinzelDecorative_400Regular',
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 4,
    width: '100%',
  },
  cardFooter: {
    alignItems: 'center',
    width: '100%',
    gap: WELCOME_HERO_FOOTER_GAP,
    marginTop: WELCOME_HERO_FOOTER_MARGIN_TOP,
  },
  guestBtn: {
    width: `${WELCOME_HERO_CTA_WIDTH_FACTOR * 100}%`,
    height: WELCOME_HERO_CTA_HEIGHT,
    backgroundColor: 'rgba(196, 120, 12, 0.34)',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 184, 0, 0.7)',
    shadowColor: 'rgba(230, 184, 0, 0.4)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: WELCOME_HERO_CTA_SHADOW_OPACITY,
    shadowRadius: 0,
    elevation: 0,
  },
  guestBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: '#fff7ea',
    fontSize: WELCOME_GUEST_CTA_FONT_SIZE,
    lineHeight: WELCOME_GUEST_CTA_FONT_SIZE + 2,
    letterSpacing: 1.6,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hintText: {
    color: 'rgba(255, 241, 222, 0.75)',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: WELCOME_HERO_SECONDARY_ACTION_GAP,
  },
  smallActionBtn: {
    paddingHorizontal: 12,
    height: WELCOME_HERO_SECONDARY_CTA_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  registerBtn: {
    borderColor: 'rgba(230,184,0,0.55)',
    backgroundColor: 'rgba(230,184,0,0.12)',
  },
  secondaryBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.8,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
  },
  registerBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: '#f5d36a',
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.8,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
  },
  actionPipe: {
    width: 2,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  accountHintText: {
    color: 'rgba(255, 241, 222, 0.68)',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP,
    paddingHorizontal: 18,
  },
  footerContainer: { alignItems: 'center', paddingBottom: 25 },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'CinzelDecorative_400Regular',
    letterSpacing: 3,
  },
})
