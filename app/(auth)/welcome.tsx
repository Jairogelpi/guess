import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/layout/AppHeader'
import { Background } from '@/components/layout/Background'
import { InteractiveCardTilt } from '@/components/ui/InteractiveCardTilt'
import { useUIStore } from '@/stores/useUIStore'
import {
  WELCOME_HERO_CARD_BACKGROUND,
  WELCOME_HERO_CARD_MAX_WIDTH,
  WELCOME_HERO_CARD_RATIO,
  WELCOME_HERO_CARD_SHADOW_OPACITY,
  WELCOME_HERO_CARD_SHADOW_RADIUS,
  WELCOME_HERO_CARD_WIDTH_FACTOR,
  WELCOME_HERO_CTA_HEIGHT,
  WELCOME_HERO_CTA_WIDTH_FACTOR,
  WELCOME_HERO_CTA_SHADOW_OPACITY,
  WELCOME_HERO_FOOTER_GAP,
  WELCOME_GUEST_CTA_FONT_SIZE,
  WELCOME_HERO_IMAGE_BLUR_RADIUS,
  WELCOME_HERO_IMAGE_SCALE,
  WELCOME_HERO_OVERLAY_COLORS,
  WELCOME_HERO_OVERLAY_JUSTIFY_CONTENT,
  WELCOME_HERO_PROMPT_GLOW_COLOR,
  WELCOME_HERO_PROMPT_GLOW_RADIUS,
  WELCOME_HERO_SECONDARY_ACTION_GAP,
  WELCOME_HERO_SECONDARY_CTA_HEIGHT,
  WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP,
  WELCOME_HERO_SHOW_LOGO,
  WELCOME_HERO_STACK_GAP,
} from '@/constants/welcomeHero'

export default function Welcome() {
  const { t } = useTranslation()
  const router = useRouter()
  const showToast = useUIStore((s) => s.showToast)
  const [loading, setLoading] = useState(false)
  const { width: screenWidth } = useWindowDimensions()

  const cardWidth = Math.min(screenWidth * WELCOME_HERO_CARD_WIDTH_FACTOR, WELCOME_HERO_CARD_MAX_WIDTH)
  const cardHeight = cardWidth * WELCOME_HERO_CARD_RATIO
  const compactHero = screenWidth < 390
  const titleSize = compactHero ? 42 : 50
  const highlightSize = compactHero ? 62 : 74
  const subtitleSize = compactHero ? 14 : 16
  const guestFontSize = compactHero ? 15 : 18
  const guestButtonHeight = compactHero ? 40 : WELCOME_HERO_CTA_HEIGHT
  const secondaryButtonHeight = compactHero ? 34 : WELCOME_HERO_SECONDARY_CTA_HEIGHT
  const secondaryFontSize = compactHero ? 10 : 11
  const secondaryGap = compactHero ? 8 : WELCOME_HERO_SECONDARY_ACTION_GAP
  const secondaryHintMarginTop = compactHero ? 4 : WELCOME_HERO_SECONDARY_HINT_MARGIN_TOP
  const footerYear = new Date().getFullYear()

  const breatheAnim = useRef(new Animated.Value(1)).current
  const riseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.015, duration: 3200, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1, duration: 3200, useNativeDriver: true }),
      ]),
    )
    const riseIn = Animated.spring(riseAnim, {
      toValue: 1,
      tension: 12,
      friction: 9,
      useNativeDriver: true,
    })

    breatheLoop.start()
    riseIn.start()

    return () => {
      breatheLoop.stop()
      riseIn.stop()
    }
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
          <InteractiveCardTilt profileName="hero" regionKey="welcome-hero" testID="welcome-hero-tilt">
            <Animated.View style={[styles.mainCard, animatedStyle, { width: cardWidth, height: cardHeight }]}>
              <Image
                source={require('../../assets/carta.png')}
                style={styles.cardImage}
                resizeMode="cover"
                blurRadius={WELCOME_HERO_IMAGE_BLUR_RADIUS}
              />

              <LinearGradient colors={WELCOME_HERO_OVERLAY_COLORS} style={styles.cardOverlay}>
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
                      <Text style={[styles.brandTitle, { fontSize: titleSize }]} adjustsFontSizeToFit numberOfLines={1}>
                        GUESS THE
                      </Text>
                      <Text
                        style={[styles.brandTitle, styles.brandTitleHighlight, styles.promptTitleFill, { fontSize: highlightSize }]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        PROMPT
                      </Text>
                    </View>

                    <View style={styles.divider} />
                    <Text
                      style={[styles.subtitle, { fontSize: subtitleSize, lineHeight: subtitleSize + 7 }]}
                      adjustsFontSizeToFit
                      numberOfLines={2}
                    >
                      {t('welcome.subtitle')}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={enterAsGuest}
                      disabled={loading}
                      style={[
                        styles.guestBtn,
                        {
                          height: guestButtonHeight,
                          width: `${WELCOME_HERO_CTA_WIDTH_FACTOR * 100}%`,
                        },
                        loading && styles.disabledBtn,
                      ]}
                    >
                      <View style={styles.guestBtnGradient}>
                        {loading ? (
                          <ActivityIndicator size="small" color="#fff7ea" />
                        ) : (
                          <Text style={[styles.guestBtnText, { fontSize: guestFontSize, lineHeight: guestFontSize + 2 }]}>
                            {t('welcome.enterAsGuest').toUpperCase()}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                    <Text style={styles.hintText}>{t('welcome.guestHint')}</Text>

                    <View style={[styles.secondaryActions, { gap: secondaryGap }]}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push({ pathname: '/(auth)/login', params: { mode: 'signin' } })}
                        style={[styles.smallActionBtn, { height: secondaryButtonHeight }]}
                      >
                        <Text style={[styles.secondaryBtnText, { fontSize: secondaryFontSize, lineHeight: secondaryFontSize + 2 }]}>
                          {t('welcome.signIn')}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push({ pathname: '/(auth)/login', params: { mode: 'register' } })}
                        style={[styles.smallActionBtn, styles.registerBtn, { height: secondaryButtonHeight }]}
                      >
                        <Text style={[styles.registerBtnText, { fontSize: secondaryFontSize, lineHeight: secondaryFontSize + 2 }]}>
                          {t('profile.upgradeAccount')}
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={[styles.accountHintText, { marginTop: secondaryHintMarginTop }]}>{t('welcome.accountHint')}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </InteractiveCardTilt>
        </View>

        <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
          <Text style={styles.footerText}>{`GUESS THE PROMPT ${footerYear}`}</Text>
        </SafeAreaView>
      </View>
    </Background>
  )
}

const styles = StyleSheet.create({
  overlayRoot: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  mainCard: {
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
    paddingTop: 4,
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
    gap: 12,
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
    textShadowColor: 'rgba(24, 10, 4, 0.88)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
    letterSpacing: 1.1,
    width: '100%',
  },
  brandTitleHighlight: {
    fontSize: 52,
    marginTop: -8,
    color: '#fff4e3',
    textShadowColor: WELCOME_HERO_PROMPT_GLOW_COLOR,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: WELCOME_HERO_PROMPT_GLOW_RADIUS,
  },
  promptTitleFill: {
    color: '#f39a33',
  },
  divider: {
    width: 74,
    height: 2,
    backgroundColor: 'rgba(245, 196, 104, 0.88)',
    marginVertical: 6,
  },
  subtitle: {
    fontFamily: 'CinzelDecorative_400Regular',
    color: 'rgba(255, 247, 234, 0.98)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowRadius: 2,
    width: '92%',
  },
  cardFooter: {
    alignItems: 'center',
    width: '100%',
    gap: WELCOME_HERO_FOOTER_GAP,
    marginTop: 10,
  },
  guestBtn: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 244, 226, 0.62)',
    overflow: 'hidden',
    shadowColor: 'rgba(26, 10, 2, 0.92)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  guestBtnGradient: {
    flex: 1,
    backgroundColor: '#e68a2e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  guestBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: '#fffaf1',
    fontSize: WELCOME_GUEST_CTA_FONT_SIZE,
    lineHeight: WELCOME_GUEST_CTA_FONT_SIZE + 2,
    letterSpacing: 1.7,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.58)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  disabledBtn: {
    opacity: 0.55,
  },
  hintText: {
    color: 'rgba(255, 241, 222, 0.96)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  smallActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 244, 220, 0.5)',
    backgroundColor: 'rgba(255, 239, 221, 0.44)',
    shadowColor: 'rgba(26, 10, 2, 0.92)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  registerBtn: {
    borderColor: 'rgba(255, 218, 145, 0.62)',
    backgroundColor: 'rgba(255, 204, 122, 0.5)',
  },
  secondaryBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: '#fffaf1',
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.8,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.64)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  registerBtnText: {
    fontFamily: 'CinzelDecorative_700Bold',
    color: '#fffaf1',
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.8,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.64)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  accountHintText: {
    color: 'rgba(255, 241, 222, 0.9)',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
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
